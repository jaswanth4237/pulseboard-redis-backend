import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService.js';

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    const tokenHeader = req.headers['x-session-token'];

    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
    } else if (typeof tokenHeader === 'string') {
        token = tokenHeader;
    }

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: Session token missing' });
    }

    const userId = await AuthService.getUserIdFromSession(token);
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or expired session token' });
    }

    req.userId = userId;
    req.sessionToken = token;
    next();
}
