import { Request, Response } from 'express';
import { ProfileService } from '../services/profileService.js';

function str(val: string | string[] | undefined): string {
    if (Array.isArray(val)) return val[0];
    return val || '';
}

export class ProfileController {
    static async setProfile(req: Request, res: Response) {
        try {
            const { userId, ...data } = req.body;
            const id = userId || req.userId;

            if (!id) {
                return res.status(400).json({ error: 'userId is required' });
            }

            await ProfileService.setProfile(id, data);
            const profile = await ProfileService.getProfile(id);
            return res.status(200).json({ message: 'Profile updated successfully', profile });
        } catch (err: any) {
            return res.status(500).json({ error: err.message });
        }
    }

    static async getProfile(req: Request, res: Response) {
        try {
            const userId = str(req.params.id) || req.userId;
            if (!userId) {
                return res.status(400).json({ error: 'userId is required' });
            }

            const exists = await ProfileService.profileExists(userId);
            if (!exists) {
                return res.status(404).json({ error: 'Profile not found' });
            }

            const profile = await ProfileService.getProfile(userId);
            return res.status(200).json(profile);
        } catch (err: any) {
            return res.status(500).json({ error: err.message });
        }
    }

    static async getField(req: Request, res: Response) {
        try {
            const id = str(req.params.id);
            const field = str(req.params.field);
            const value = await ProfileService.getField(id, field);
            return res.status(200).json({ user_id: id, field, value });
        } catch (err: any) {
            return res.status(500).json({ error: err.message });
        }
    }

    static async getFields(req: Request, res: Response) {
        try {
            const id = str(req.params.id);
            const { fields } = req.body;
            if (!Array.isArray(fields)) {
                return res.status(400).json({ error: 'fields array is required' });
            }
            const values = await ProfileService.getFields(id, fields);
            return res.status(200).json({ user_id: id, profile: values });
        } catch (err: any) {
            return res.status(500).json({ error: err.message });
        }
    }
}
