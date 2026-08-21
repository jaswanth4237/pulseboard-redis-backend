import { Request, Response } from 'express';
import { AttendanceService } from '../services/attendanceService.js';

function str(val: string | string[] | undefined): string {
    if (Array.isArray(val)) return val[0];
    return val || '';
}

export class AttendanceController {
    static async recordAttendance(req: Request, res: Response) {
        try {
            const { userId, day, yearMonth } = req.body;
            const targetUserId = userId || req.userId;

            if (!targetUserId || day === undefined) {
                return res.status(400).json({ error: 'userId and day (1-31) are required' });
            }

            await AttendanceService.markActive(targetUserId, parseInt(day, 10), yearMonth);
            return res.status(200).json({ message: 'Attendance recorded', userId: targetUserId, day, yearMonth });
        } catch (err: any) {
            return res.status(500).json({ error: err.message });
        }
    }

    static async checkAttendance(req: Request, res: Response) {
        try {
            const userId = str(req.params.user_id);
            const yearMonth = str(req.params.year_month);
            const day = str(req.params.day);
            const wasActive = await AttendanceService.wasActive(userId, parseInt(day, 10), yearMonth);
            return res.status(200).json({ user_id: userId, year_month: yearMonth, day: parseInt(day, 10), active: wasActive });
        } catch (err: any) {
            return res.status(500).json({ error: err.message });
        }
    }

    static async getMonthlyCount(req: Request, res: Response) {
        try {
            const userId = str(req.params.user_id);
            const yearMonth = str(req.params.year_month);
            const count = await AttendanceService.getActiveDaysCount(userId, yearMonth);
            return res.status(200).json({ user_id: userId, year_month: yearMonth, active_days_count: count });
        } catch (err: any) {
            return res.status(500).json({ error: err.message });
        }
    }
}
