import { redis } from '../redis/client.js';

export interface GeoLocation {
    userId: string;
    longitude: number;
    latitude: number;
}

export interface NearbyUser {
    userId: string;
    distanceKm?: number;
}

export class GeoService {
    private static readonly GEO_KEY = 'geo:active_users';

    static async updateLocation(userId: string, longitude: number, latitude: number): Promise<boolean> {
        await redis.geoadd(this.GEO_KEY, longitude, latitude, userId);
        return true;
    }

    static async findNearbyUsers(
        longitude: number,
        latitude: number,
        radiusKm: number = 10
    ): Promise<NearbyUser[]> {
        try {
            // ioredis supports geosearch: redis.geosearch(key, 'FROMLONLAT', lon, lat, 'BYRADIUS', radius, 'KM', 'WITHDIST', 'ASC')
            const results = (await redis.call(
                'GEOSEARCH',
                this.GEO_KEY,
                'FROMLONLAT',
                longitude,
                latitude,
                'BYRADIUS',
                radiusKm,
                'km',
                'WITHDIST',
                'ASC'
            )) as Array<[string, string]>;

            if (!results || !Array.isArray(results)) return [];

            return results.map(([userId, distStr]) => ({
                userId,
                distanceKm: parseFloat(distStr),
            }));
        } catch (err) {
            // Fallback to GEORADIUS if GEOSEARCH fails on older redis
            const raw = (await redis.georadius(
                this.GEO_KEY,
                longitude,
                latitude,
                radiusKm,
                'km',
                'WITHDIST',
                'ASC'
            )) as any[];

            if (!raw || !Array.isArray(raw)) return [];

            return raw.map((item) => {
                if (Array.isArray(item)) {
                    return { userId: item[0], distanceKm: parseFloat(item[1]) };
                }
                return { userId: item as string };
            });
        }
    }
}
