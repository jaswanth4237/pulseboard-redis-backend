import { Request, Response } from 'express';
import { GeoService } from '../services/geoService.js';

export class GeoController {
    static async updateLocation(req: Request, res: Response) {
        try {
            const { userId, longitude, latitude } = req.body;
            const targetUserId = userId || req.userId;

            if (!targetUserId || longitude === undefined || latitude === undefined) {
                return res.status(400).json({ error: 'userId, longitude, and latitude are required' });
            }

            await GeoService.updateLocation(
                targetUserId,
                parseFloat(longitude),
                parseFloat(latitude)
            );

            return res.status(200).json({
                message: 'User location updated successfully',
                userId: targetUserId,
                longitude,
                latitude,
            });
        } catch (err: any) {
            return res.status(500).json({ error: err.message });
        }
    }

    static async findNearby(req: Request, res: Response) {
        try {
            const longitude = parseFloat(req.query.longitude as string);
            const latitude = parseFloat(req.query.latitude as string);
            const radiusKm = req.query.radius ? parseFloat(req.query.radius as string) : 10;

            if (isNaN(longitude) || isNaN(latitude)) {
                return res.status(400).json({ error: 'Valid longitude and latitude query parameters are required' });
            }

            const nearbyUsers = await GeoService.findNearbyUsers(longitude, latitude, radiusKm);
            return res.status(200).json({
                center: { longitude, latitude },
                radiusKm,
                count: nearbyUsers.length,
                users: nearbyUsers,
            });
        } catch (err: any) {
            return res.status(500).json({ error: err.message });
        }
    }
}
