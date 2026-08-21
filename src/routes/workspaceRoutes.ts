import { Router } from 'express';
import { WorkspaceController } from '../controllers/workspaceController.js';
import { TransactionController } from '../controllers/transactionController.js';

const router = Router();

router.get('/common', WorkspaceController.getCommonMembers);
router.get('/:id/members', WorkspaceController.getMembers);
router.post('/:id/members', WorkspaceController.addMember);
router.delete('/:id/members/:user_id', WorkspaceController.removeMember);
router.post('/:id/invite', TransactionController.acceptInvitation);

export default router;
