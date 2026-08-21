import { Request, Response, NextFunction } from 'express';
import { RateLimiterService } from '../services/rateLimiterService.js';
import { config } from '../config/index.js';

export function rateLimiterMiddleware(maxRequests: number = config.rateLimit.maxRequests, windowSeconds: number = config.rateLimit.windowSeconds) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Rate limit by authenticated user_id, or IP address if unauthenticated
            const identifier = req.userId || req.ip || 'anonymous';
            const { allowed, current, ttl } = await RateLimiterService.checkRateLimit(
                identifier,
                maxRequests,
                windowSeconds
            );

            res.setHeader('X-RateLimit-Limit', maxRequests);
            res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - current));
            res.setHeader('X-RateLimit-Reset', ttl);

            if (!allowed) {
                res.setHeader('Retry-After', ttl);
                return res.status(429).json({
                    error: 'Too Many Requests',
                    message: `API rate limit exceeded. Retry after ${ttl} seconds.`,
                });
            }

            next();
        } catch (err) {
            console.error('[RateLimiterMiddleware] Error:', err);
            // In case of rate limiter error, allow request through to prevent blocking users
            next();
        }
    };
}
