import { Router } from 'express';
import { QuestionController } from '../controllers/QuestionController';
import { authenticate, requireTeacher } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const questionController = new QuestionController();

// 获取题目列表
router.get('/', authenticate, requireTeacher, asyncHandler(questionController.getQuestions));

// 创建题目（教师）
router.post('/', authenticate, requireTeacher, asyncHandler(questionController.createQuestion));

// 获取题目详情
router.get('/:id', authenticate, requireTeacher, asyncHandler(questionController.getQuestionById));

// 更新题目（教师）
router.put('/:id', authenticate, requireTeacher, asyncHandler(questionController.updateQuestion));

// 删除题目（教师）
router.delete('/:id', authenticate, requireTeacher, asyncHandler(questionController.deleteQuestion));

// 批量导入题目（教师）
router.post('/import', authenticate, requireTeacher, asyncHandler(questionController.importQuestions));

// 导出题目（教师）
router.get('/export', authenticate, requireTeacher, asyncHandler(questionController.exportQuestions));

// 获取题目分类
router.get('/categories', authenticate, requireTeacher, asyncHandler(questionController.getCategories));

export default router;
