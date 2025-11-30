import { Router } from 'express';
import { GradeController } from '../controllers/GradeController';
import { authenticate, requireTeacher } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const gradeController = new GradeController();

// 获取成绩列表
router.get('/', authenticate, asyncHandler(gradeController.getGrades));

// 获取学生成绩（学生查看自己的成绩）
router.get('/my', authenticate, asyncHandler(gradeController.getMyGrades));

// 获取课程成绩统计（教师）
router.get('/course/:courseId/stats', authenticate, requireTeacher, asyncHandler(gradeController.getCourseGradeStats));

// 获取考试成绩列表（教师）
router.get('/exam/:examId', authenticate, requireTeacher, asyncHandler(gradeController.getExamGrades));

// 更新成绩（教师）
router.put('/:id', authenticate, requireTeacher, asyncHandler(gradeController.updateGrade));

// 导出成绩（教师）
router.get('/export/:examId', authenticate, requireTeacher, asyncHandler(gradeController.exportGrades));

export default router;
