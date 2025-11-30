import { Router } from 'express';
import { ExamController } from '../controllers/ExamController';
import { authenticate, requireTeacher } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const examController = new ExamController();

// 获取考试列表
router.get('/', authenticate, asyncHandler(examController.getExams));

// 创建考试（教师）
router.post('/', authenticate, requireTeacher, asyncHandler(examController.createExam));

// 获取考试详情
router.get('/:id', authenticate, asyncHandler(examController.getExamById));

// 更新考试（教师）
router.put('/:id', authenticate, requireTeacher, asyncHandler(examController.updateExam));

// 删除考试（教师）
router.delete('/:id', authenticate, requireTeacher, asyncHandler(examController.deleteExam));

// 开始考试（学生）
router.post('/:id/start', authenticate, asyncHandler(examController.startExam));

// 提交考试答案（学生）
router.post('/:id/submit', authenticate, asyncHandler(examController.submitExam));

// 获取考试记录
router.get('/:id/records', authenticate, requireTeacher, asyncHandler(examController.getExamRecords));

// 获取学生考试记录
router.get('/:id/records/:studentId', authenticate, asyncHandler(examController.getStudentExamRecord));

export default router;
