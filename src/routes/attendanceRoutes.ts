import { Router } from 'express';
import { AttendanceController } from '../controllers/attendanceController.js';

const router = Router();

router.post('/record', AttendanceController.recordAttendance);
router.get('/:user_id/:year_month/day/:day', AttendanceController.checkAttendance);
router.get('/:user_id/:year_month/count', AttendanceController.getMonthlyCount);

export default router;
