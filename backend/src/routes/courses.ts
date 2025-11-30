import { Router } from 'express';
import { CourseController } from '../controllers/CourseController';
import { authenticate, requireTeacher } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const courseController = new CourseController();

// 获取课程列表
router.get('/', authenticate, asyncHandler(courseController.getCourses));

// 获取我的课程（教师）
router.get('/my', authenticate, requireTeacher, asyncHandler(courseController.getMyCourses));

// 创建课程（教师）
router.post('/', authenticate, requireTeacher, asyncHandler(courseController.createCourse));

// 获取课程详情
router.get('/:id', authenticate, asyncHandler(courseController.getCourseById));

// 更新课程（教师）
router.put('/:id', authenticate, requireTeacher, asyncHandler(courseController.updateCourse));

// 删除课程（教师）
router.delete('/:id', authenticate, requireTeacher, asyncHandler(courseController.deleteCourse));

// 获取课程学生列表
router.get('/:id/students', authenticate, requireTeacher, asyncHandler(courseController.getCourseStudents));

// 添加学生到课程
router.post('/:id/students', authenticate, requireTeacher, asyncHandler(courseController.addStudentToCourse));

// 从课程移除学生
router.delete('/:id/students/:studentId', authenticate, requireTeacher, asyncHandler(courseController.removeStudentFromCourse));

export default router;
