# PulseBoard - Redis-Powered Collaborative Backend

PulseBoard is an enterprise-grade collaborative backend platform designed for remote engineering and operations teams to coordinate live incidents, deployments, and operational events in real time. 

Built with **Node.js**, **Express**, **TypeScript**, and **Redis**, PulseBoard demonstrates how to leverage multi-faceted Redis data structures and architectural patterns to solve real-world backend scaling challenges—such as API response latency, notification lag, rate limiting, analytics aggregation, distributed lock synchronization, and background job processing.

---

## 📐 System Architecture

PulseBoard decouples responsibilities across specialized, independently scalable components communicating via Redis as the operational data store:

```
                  +-----------------------------------+
                  |            CLIENTS                |
                  |     (Web App / Mobile / API)      |
                  +-----------------------------------+
                                    |
                                    | HTTP / REST / WebSockets
                                    v
+-------------------------------------------------------------------------------+
|                             API SERVER (Express)                              |
|  - Auth & Sessions (Strings + TTL)         - Activity Feed (Lists + LTRIM)     |
|  - Rate Limiting (Atomic INCR + TTL)       - Presence Tracking (Sets)          |
|  - Workspace Membership (Sets + SINTER)    - User Profiles (Hashes)            |
|  - Real-Time Messaging (Pub/Sub)           - Event Streaming (Streams)         |
|  - Trending & Rankings (Sorted Sets)       - Distributed Locks (SET NX EX)     |
|  - DAU Analytics (HyperLogLog)             - Daily Attendance (Bitmaps)        |
|  - Geospatial Tracking (GEO Index)         - Atomic Invites (MULTI/EXEC)       |
+-------------------------------------------------------------------------------+
             |                                                  |
             | Enqueues Jobs & Events                           | Dequeues & Processes
             v                                                  v
+--------------------------+                         +--------------------------+
|    SCHEDULER SERVICE     |                         |      WORKER SERVICE      |
| Distributed lock-based   |                         | Background queue worker  |
| task trigger             |                         | & stream consumer group  |
+--------------------------+                         +--------------------------+
             |                                                  |
             +------------------------+-------------------------+
                                      |
                                      v
+-------------------------------------------------------------------------------+
|                                 REDIS SERVER                                  |
|            In-Memory Sessions, Caches, Queues, Pub/Sub, Streams,              |
|                     Sorted Sets, Bitmaps, HLL, & Geo                      |
+-------------------------------------------------------------------------------+
```

### Component Responsibilities

1. **API Server (`src/index.ts`)**: Main entry point for client HTTP requests. Manages authentication, rate limiting, presence, user profiles, real-time message publishing, and endpoint routing.
2. **Worker Service (`src/worker.ts`)**: Runs in the background as an independent consumer process. Reads and executes asynchronous jobs from Redis Lists (`queue:jobs`) and consumes event streams (`stream:events`) via consumer groups (`pulseboard-workers`).
3. **Scheduler Service (`src/scheduler.ts`)**: Manages delayed and recurring maintenance tasks (e.g., nightly cleanups, daily digest triggers). Uses Redis distributed locking to prevent duplicate execution across multiple scheduler instances.
4. **Redis Layer (`src/redis/client.ts`)**: Operational data layer handling sessions, real-time channels, Streams, Bitmaps, HyperLogLogs, Geo indices, and atomic multi-key transactions.

---

## 🔑 Redis Key Naming Strategy & Pattern Mapping

| Feature | Redis Key Pattern | Redis Data Structure | Redis Commands Used | Purpose & Characteristics |
|---|---|---|---|---|
| **1 & 16. Sessions & Auth** | `session:{token}` | String | `SET` / `SETEX`, `GET`, `EXPIRE`, `TTL`, `DEL` | Ephemeral session tokens storing `user_id` with TTL auto-expiration. |
| **2. API Rate Limiting** | `rate_limit:{user_id}:{minute}` | String (Counter) | `INCR`, `EXPIRE`, `TTL` | Windowed atomic counter returning 429 Too Many Requests when limit exceeded. |
| **3. Activity Feed** | `feed:{user_id}` | List | `LPUSH`, `LRANGE`, `LTRIM` | Reverse-chronological personal event stream capped at latest 100 items. |
| **4. Presence Tracking** | `online_users` | Set | `SADD`, `SREM`, `SMEMBERS`, `SISMEMBER` | Real-time tracking of online/offline status. |
| **5 & 17. Workspaces** | `workspace:{id}:members` | Set | `SADD`, `SREM`, `SMEMBERS`, `SINTER` | Workspace member lists & common membership intersection (`SINTER`). |
| **6. User Profiles** | `user:{id}` | Hash | `HSET`, `HGET`, `HMGET`, `HGETALL`, `HEXISTS` | Field-level user profile storage (`name`, `email`, `role`, etc.). |
| **7. Real-Time Messaging** | `channel:{id}:messages`<br/>`channel:{id}:typing` | Pub/Sub Channels | `PUBLISH`, `SUBSCRIBE` | Real-time channel broadcasts for chat messages and live typing indicators. |
| **8. Event Streaming** | `stream:events` | Stream | `XADD`, `XREADGROUP`, `XACK`, `XGROUP` | Persistent event log consumed asynchronously via consumer groups. |
| **9 & 18. Trending Channels**| `trending:channels` | Sorted Set | `ZINCRBY`, `ZREVRANGE` | Dynamic activity score ranking to retrieve top trending channels. |
| **User Reputation** | `reputation:users` | Sorted Set | `ZINCRBY`, `ZREVRANGE` | User reputation score leaderboards. |
| **10. Distributed Locking** | `lock:{lock_name}` | String (Lock Token) | `SET key val NX EX timeout`, Lua Script / `DEL` | Ensures single-process execution of critical daily tasks with auto-release TTL. |
| **11. DAU Analytics** | `analytics:dau:YYYY-MM-DD` | HyperLogLog | `PFADD`, `PFCOUNT` | Memory-efficient approximate daily active user counting (~0.81% error). |
| **12. Attendance Tracking** | `attendance:{user_id}:YYYY-MM` | Bitmap | `SETBIT`, `GETBIT`, `BITCOUNT` | Compact bit array tracking daily active status per user per month. |
| **13. Geospatial Awareness** | `geo:active_users` | Geo Index | `GEOADD`, `GEOSEARCH` / `GEORADIUS` | User location tracking and radius proximity queries. |
| **14. Atomic Transactions** | `workspace:{id}:members`<br/>`feed:{user_id}` | Transaction | `MULTI`, `EXEC` | Multi-command atomic workspace invite acceptance. |
| **15. Background Job Queue** | `queue:jobs` | List | `LPUSH`, `BRPOP` / `RPOP` | Asynchronous task execution pipeline for background workers. |

---

## 🛠️ Project Structure

```
pulseboard-redis-backend/
├── package.json
├── tsconfig.json
├── jest.config.js
├── README.md
├── .gitignore
└── src/
    ├── config/
    │   └── index.ts                 # Configuration settings
    ├── redis/
    │   └── client.ts                # Redis connection singleton & client factory
    ├── middleware/
    │   ├── auth.ts                  # Session token authentication middleware
    │   └── rateLimiter.ts           # Per-user API rate limiter middleware
    ├── services/
    │   ├── authService.ts           # Sessions & Auth logic
    │   ├── feedService.ts           # User activity feed logic
    │   ├── presenceService.ts       # Presence tracking logic
    │   ├── workspaceService.ts      # Workspace membership logic
    │   ├── profileService.ts        # User profiles hash logic
    │   ├── messageService.ts        # Pub/Sub messaging logic
    │   ├── streamService.ts         # Redis Streams logic
    │   ├── rankingService.ts        # Trending & reputation sorted sets logic
    │   ├── lockService.ts           # Atomic distributed lock logic
    │   ├── dauService.ts            # HyperLogLog DAU analytics logic
    │   ├── attendanceService.ts     # Bitmaps attendance tracking logic
    │   ├── geoService.ts            # Geospatial radius search logic
    │   ├── transactionService.ts    # MULTI/EXEC transaction logic
    │   └── queueService.ts          # Job queue logic
    ├── controllers/                 # Request handlers
    │   ├── authController.ts
    │   ├── feedController.ts
    │   ├── presenceController.ts
    │   ├── workspaceController.ts
    │   ├── profileController.ts
    │   ├── messageController.ts
    │   ├── streamController.ts
    │   ├── analyticsController.ts
    │   ├── lockController.ts
    │   ├── attendanceController.ts
    │   ├── geoController.ts
    │   ├── transactionController.ts
    │   └── queueController.ts
    ├── routes/                      # Modular API sub-routers
    │   ├── index.ts                 # Master router aggregator
    │   ├── authRoutes.ts            # /auth/*
    │   ├── feedRoutes.ts            # /feed/*
    │   ├── presenceRoutes.ts        # /presence/*
    │   ├── workspaceRoutes.ts       # /workspaces/*
    │   ├── profileRoutes.ts         # /users/*
    │   ├── messageRoutes.ts         # /channels/*
    │   ├── streamRoutes.ts          # /events/stream/*
    │   ├── analyticsRoutes.ts       # /analytics/*
    │   ├── lockRoutes.ts            # /locks/* & /tasks/*
    │   ├── attendanceRoutes.ts      # /attendance/*
    │   ├── geoRoutes.ts             # /geo/*
    │   └── queueRoutes.ts           # /jobs/*
    ├── app.ts                       # Express application setup
    ├── index.ts                     # API Server entry point
    ├── worker.ts                    # Background Queue & Stream Worker
    ├── scheduler.ts                 # Distributed Lock Task Scheduler
    └── tests/                       # Complete Jest test suite
        ├── auth.test.ts
        ├── rateLimit.test.ts
        ├── feed.test.ts
        ├── presence.test.ts
        ├── workspace.test.ts
        ├── profile.test.ts
        ├── messaging.test.ts
        ├── stream.test.ts
        ├── ranking.test.ts
        ├── lock.test.ts
        ├── dau.test.ts
        ├── attendance.test.ts
        ├── geo.test.ts
        ├── transaction.test.ts
        ├── queueWorker.test.ts
        └── fullSystem.test.ts
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+) & `npm`
- Docker (for running Redis 7)

### 1. Launch Redis Container
```bash
docker run -d --name pulseboard-redis -p 6379:6379 redis:7-alpine
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run the Services

- **Start API Server (Development)**:
  ```bash
  npm run dev
  ```
- **Start Background Worker**:
  ```bash
  npm run worker
  ```
- **Start Task Scheduler**:
  ```bash
  npm run scheduler
  ```

---

## 📡 API Reference & Examples

### 1. User Login (Requirement 16)
- **POST** `/auth/login`
- **Body**:
  ```json
  {
    "email": "engineer@pulseboard.io",
    "userId": "user_dev1"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "message": "Login successful",
    "session_token": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "user_id": "user_dev1"
  }
  ```

---

### 2. List Workspace Members (Requirement 17)
- **GET** `/workspaces/workspace_incidents/members`
- **Response** (`200 OK`):
  ```json
  [
    "user_dev1",
    "user_ops1"
  ]
  ```

---

### 3. Trending Channels (Requirement 18)
- **GET** `/analytics/trending`
- **Response** (`200 OK`):
  ```json
  [
    { "id": "incidents_critical", "score": 45 },
    { "id": "deployments_prod", "score": 28 },
    { "id": "general_dev", "score": 12 }
  ]
  ```

---

### 4. Real-Time Messaging & Activity Increment
- **POST** `/channels/incidents_critical/messages`
- **Body**:
  ```json
  {
    "senderId": "user_dev1",
    "text": "High CPU utilization reported on API gateway node 4."
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "message": "Message published successfully",
    "channelId": "incidents_critical",
    "receiversCount": 2,
    "payload": {
      "senderId": "user_dev1",
      "content": "High CPU utilization reported on API gateway node 4.",
      "timestamp": "2026-08-21T23:30:00.000Z"
    }
  }
  ```

---

### 5. Atomic Workspace Invite Acceptance (Requirement 14)
- **POST** `/workspaces/workspace_incidents/invite`
- **Body**:
  ```json
  {
    "userId": "user_dev1",
    "inviterId": "user_lead"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "message": "Workspace invitation accepted atomically via MULTI/EXEC",
    "workspaceId": "workspace_incidents",
    "userId": "user_dev1"
  }
  ```

---

## 🧪 Automated Testing

PulseBoard includes a full Jest integration test suite covering all 18 requirements against a live Redis instance.

Execute all test suites:
```bash
npm test
```

### Test Suite Output:
```bash
PASS src/tests/messaging.test.ts
PASS src/tests/workspace.test.ts
PASS src/tests/queueWorker.test.ts
PASS src/tests/fullSystem.test.ts
PASS src/tests/dau.test.ts
PASS src/tests/rateLimit.test.ts
PASS src/tests/feed.test.ts
PASS src/tests/attendance.test.ts
PASS src/tests/auth.test.ts
PASS src/tests/geo.test.ts
PASS src/tests/presence.test.ts
PASS src/tests/profile.test.ts
PASS src/tests/transaction.test.ts
PASS src/tests/ranking.test.ts
PASS src/tests/lock.test.ts
PASS src/tests/stream.test.ts

Test Suites: 16 passed, 16 total
Tests:       17 passed, 17 total
Snapshots:   0 total
Time:        10.651 s
```
