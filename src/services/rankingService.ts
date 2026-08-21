import { redis } from '../redis/client.js';

export interface ScoredItem {
    id: string;
    score: number;
}

export class RankingService {
    private static readonly TRENDING_CHANNELS_KEY = 'trending:channels';
    private static readonly REPUTATION_USERS_KEY = 'reputation:users';

    static async recordChannelActivity(channelId: string, increment: number = 1): Promise<number> {
        const scoreStr = await redis.zincrby(this.TRENDING_CHANNELS_KEY, increment, channelId);
        return parseFloat(scoreStr);
    }

    static async getTrendingChannels(limit: number = 10): Promise<ScoredItem[]> {
        const raw = await redis.zrevrange(this.TRENDING_CHANNELS_KEY, 0, limit - 1, 'WITHSCORES');
        const result: ScoredItem[] = [];
        for (let i = 0; i < raw.length; i += 2) {
            result.push({
                id: raw[i],
                score: parseFloat(raw[i + 1]),
            });
        }
        return result;
    }

    static async incrementUserReputation(userId: string, increment: number = 1): Promise<number> {
        const scoreStr = await redis.zincrby(this.REPUTATION_USERS_KEY, increment, userId);
        return parseFloat(scoreStr);
    }

    static async getTopReputationUsers(limit: number = 10): Promise<ScoredItem[]> {
        const raw = await redis.zrevrange(this.REPUTATION_USERS_KEY, 0, limit - 1, 'WITHSCORES');
        const result: ScoredItem[] = [];
        for (let i = 0; i < raw.length; i += 2) {
            result.push({
                id: raw[i],
                score: parseFloat(raw[i + 1]),
            });
        }
        return result;
    }
}
