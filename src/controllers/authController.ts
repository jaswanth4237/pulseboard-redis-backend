import { Request, Response } from 'express';
import { AuthService } from '../services/authService.js';
import { DAUService } from '../services/dauService.js';

export class AuthController {
    static async login(req: Request, res: Response) {
        try {
            const { email, userId } = req.body;
            const id = userId || email || `user_${Date.now()}`;

            if (!id) {
                return res.status(400).json({ error: 'User identifier required' });
            }

            const sessionToken = await AuthService.createSession(id);

            // Also record user activity for DAU analytics upon login
            await DAUService.recordUserActivity(id);

            return res.status(200).json({
                message: 'Login successful',
                session_token: sessionToken,
                user_id: id,
            });
        } catch (err: any) {
            return res.status(500).json({ error: err.message });
        }
    }

    static async logout(req: Request, res: Response) {
        try {
            const token = req.sessionToken || req.body.session_token;
            if (!token) {
                return res.status(400).json({ error: 'Session token required' });
            }
            const success = await AuthService.revokeSession(token);
            return res.status(200).json({ success, message: 'Logged out successfully' });
        } catch (err: any) {
            return res.status(500).json({ error: err.message });
        }
    }

    static async getSession(req: Request, res: Response) {
        try {
            const token = req.sessionToken || (req.query.token as string);
            if (!token) {
                return res.status(400).json({ error: 'Session token required' });
            }
            const userId = await AuthService.getUserIdFromSession(token);
            if (!userId) {
                return res.status(404).json({ error: 'Session not found or expired' });
            }
            const ttl = await AuthService.getSessionTTL(token);
            return res.status(200).json({ user_id: userId, ttl });
        } catch (err: any) {
            return res.status(500).json({ error: err.message });
        }
    }
}
