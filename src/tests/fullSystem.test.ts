import request from 'supertest';
import app from '../app.js';
import { redis } from '../redis/client.js';

describe('PulseBoard Full System End-to-End Integration', () => {
    beforeEach(async () => {
        await redis.flushdb();
    });

    afterAll(async () => {
        await redis.quit();
    });

    it('should support complete collaborative workflow', async () => {
        // 1. User Authentication
        const loginRes = await request(app)
            .post('/auth/login')
            .send({ email: 'lead@pulseboard.io', userId: 'user_lead' });
        expect(loginRes.status).toBe(200);
        const token = loginRes.body.session_token;

        // 2. Set User Profile
        const profileRes = await request(app)
            .post('/users')
            .set('Authorization', `Bearer ${token}`)
            .send({ userId: 'user_lead', name: 'Lead Engineer', role: 'DevOps' });
        expect(profileRes.status).toBe(200);

        // 3. Mark Presence Online
        const presenceRes = await request(app)
            .post('/presence/online')
            .set('Authorization', `Bearer ${token}`)
            .send({ userId: 'user_lead' });
        expect(presenceRes.status).toBe(200);

        // 4. Accept Workspace Invitation (Atomic MULTI/EXEC)
        const inviteRes = await request(app)
            .post('/workspaces/workspace_incidents/invite')
            .set('Authorization', `Bearer ${token}`)
            .send({ userId: 'user_lead', inviterId: 'system' });
        expect(inviteRes.status).toBe(200);

        // 5. Send Real-Time Channel Message & Increment Trending Score
        const msgRes = await request(app)
            .post('/channels/incidents_main/messages')
            .set('Authorization', `Bearer ${token}`)
            .send({ senderId: 'user_lead', text: 'Server CPU spike at 99%' });
        expect(msgRes.status).toBe(200);

        // 6. Check Trending Channels Endpoint (Requirement 18)
        const trendingRes = await request(app).get('/analytics/trending');
        expect(trendingRes.status).toBe(200);
        expect(trendingRes.body[0].id).toBe('incidents_main');

        // 7. Check Workspace Members Endpoint (Requirement 17)
        const membersRes = await request(app).get('/workspaces/workspace_incidents/members');
        expect(membersRes.status).toBe(200);
        expect(membersRes.body).toContain('user_lead');

        // 8. Enqueue Async Job
        const jobRes = await request(app)
            .post('/jobs/enqueue')
            .send({ jobType: 'INCIDENT_ALERT', payload: { channel: 'incidents_main' } });
        expect(jobRes.status).toBe(202);
    });
});
