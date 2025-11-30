import { Request, Response } from 'express';
import { AuthenticatedRequest, Course, ApiResponse, PaginatedResponse } from '../types';
import { CourseService } from '../services/CourseService';
import { UserService } from '../services/UserService';
import { AppError, asyncHandler } from '../middleware/errorHandler';

export class CourseController {
  private courseService = new CourseService();
  private userService = new UserService();

  // 获取课程列表
  getCourses = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { page = 1, limit = 10, teacher_id, status, search, sort, order } = req.query;

    const courses = await this.courseService.findAll({
      page: Number(page),
      limit: Number(limit),
      teacher_id: teacher_id ? Number(teacher_id) : undefined,
      status: status as string,
      search: search as string,
      sort: sort as string,
      order: order as 'asc' | 'desc'
    });

    const response: ApiResponse<PaginatedResponse<Course>> = {
      success: true,
      message: '获取课程列表成功',
      data: courses
    };

    res.json(response);
  });

  // 获取我的课程（教师）
  getMyCourses = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('未认证用户', 401);
    }

    const { page = 1, limit = 10, sort, order } = req.query;

    const courses = await this.courseService.findByTeacher(req.user.id, {
      page: Number(page),
      limit: Number(limit),
      sort: sort as string,
      order: order as 'asc' | 'desc'
    });

    const response: ApiResponse<PaginatedResponse<Course>> = {
      success: true,
      message: '获取我的课程成功',
      data: courses
    };

    res.json(response);
  });

  // 创建课程（教师）
  createCourse = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('未认证用户', 401);
    }

    const { name, description, cover_image, credit_hours } = req.body;

    // 验证输入
    if (!name || !description || !credit_hours) {
      throw new AppError('课程名称、描述和学时不能为空', 400);
    }

    if (credit_hours <= 0) {
      throw new AppError('学时必须大于0', 400);
    }

    // 创建课程
    const newCourse = await this.courseService.create({
      name,
      description,
      teacher_id: req.user.id,
      cover_image,
      credit_hours: Number(credit_hours)
    });

    const response: ApiResponse<Course> = {
      success: true,
      message: '创建课程成功',
      data: newCourse
    };

    res.status(201).json(response);
  });

  // 获取课程详情
  getCourseById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      throw new AppError('无效的课程ID', 400);
    }

    const course = await this.courseService.findById(Number(id));
    if (!course) {
      throw new AppError('课程不存在', 404);
    }

    const response: ApiResponse<Course> = {
      success: true,
      message: '获取课程详情成功',
      data: course
    };

    res.json(response);
  });

  // 更新课程（教师）
  updateCourse = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('未认证用户', 401);
    }

    const { id } = req.params;
    const courseData = req.body;

    if (!id || isNaN(Number(id))) {
      throw new AppError('无效的课程ID', 400);
    }

    const courseId = Number(id);

    // 检查课程是否存在
    const existingCourse = await this.courseService.findById(courseId);
    if (!existingCourse) {
      throw new AppError('课程不存在', 404);
    }

    // 检查权限（只有课程创建者或管理员可以修改）
    if (req.user.role !== 'admin' && existingCourse.teacher_id !== req.user.id) {
      throw new AppError('没有权限修改此课程', 403);
    }

    // 验证学时
    if (courseData.credit_hours !== undefined && courseData.credit_hours <= 0) {
      throw new AppError('学时必须大于0', 400);
    }

    const updatedCourse = await this.courseService.update(courseId, courseData);

    const response: ApiResponse<Course> = {
      success: true,
      message: '更新课程成功',
      data: updatedCourse
    };

    res.json(response);
  });

  // 删除课程（教师）
  deleteCourse = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('未认证用户', 401);
    }

    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      throw new AppError('无效的课程ID', 400);
    }

    const courseId = Number(id);

    // 检查课程是否存在
    const existingCourse = await this.courseService.findById(courseId);
    if (!existingCourse) {
      throw new AppError('课程不存在', 404);
    }

    // 检查权限（只有课程创建者或管理员可以删除）
    if (req.user.role !== 'admin' && existingCourse.teacher_id !== req.user.id) {
      throw new AppError('没有权限删除此课程', 403);
    }

    await this.courseService.delete(courseId);

    const response: ApiResponse = {
      success: true,
      message: '删除课程成功'
    };

    res.json(response);
  });

  // 获取课程学生列表
  getCourseStudents = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('未认证用户', 401);
    }

    const { id } = req.params;
    const { page = 1, limit = 10, sort, order } = req.query;

    if (!id || isNaN(Number(id))) {
      throw new AppError('无效的课程ID', 400);
    }

    const courseId = Number(id);

    // 检查课程是否存在
    const course = await this.courseService.findById(courseId);
    if (!course) {
      throw new AppError('课程不存在', 404);
    }

    // 检查权限（只有课程教师或管理员可以查看）
    if (req.user.role !== 'admin' && course.teacher_id !== req.user.id) {
      throw new AppError('没有权限查看此课程的学生列表', 403);
    }

    const students = await this.courseService.getCourseStudents(courseId, {
      page: Number(page),
      limit: Number(limit),
      sort: sort as string,
      order: order as 'asc' | 'desc'
    });

    const response: ApiResponse<PaginatedResponse<any>> = {
      success: true,
      message: '获取课程学生列表成功',
      data: students
    };

    res.json(response);
  });

  // 添加学生到课程
  addStudentToCourse = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('未认证用户', 401);
    }

    const { id } = req.params;
    const { student_ids } = req.body;

    if (!id || isNaN(Number(id))) {
      throw new AppError('无效的课程ID', 400);
    }

    if (!student_ids || !Array.isArray(student_ids) || student_ids.length === 0) {
      throw new AppError('学生ID列表不能为空', 400);
    }

    const courseId = Number(id);

    // 检查课程是否存在
    const course = await this.courseService.findById(courseId);
    if (!course) {
      throw new AppError('课程不存在', 404);
    }

    // 检查权限（只有课程教师或管理员可以添加学生）
    if (req.user.role !== 'admin' && course.teacher_id !== req.user.id) {
      throw new AppError('没有权限添加学生到此课程', 403);
    }

    // 添加学生到课程
    const results = [];
    for (const studentId of student_ids) {
      try {
        // 检查学生是否存在
        const student = await this.userService.findById(studentId);
        if (!student || student.role !== 'student') {
          results.push({ student_id: studentId, success: false, message: '学生不存在' });
          continue;
        }

        // 检查是否已选课
        const isEnrolled = await this.courseService.isStudentEnrolled(courseId, studentId);
        if (isEnrolled) {
          results.push({ student_id: studentId, success: false, message: '学生已选择此课程' });
          continue;
        }

        await this.courseService.addStudent(courseId, studentId);
        results.push({ student_id: studentId, success: true, message: '添加成功' });
      } catch (error) {
        results.push({ student_id: studentId, success: false, message: '添加失败' });
      }
    }

    const response: ApiResponse<any> = {
      success: true,
      message: '批量添加学生完成',
      data: { results }
    };

    res.json(response);
  });

  // 从课程移除学生
  removeStudentFromCourse = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('未认证用户', 401);
    }

    const { id, studentId } = req.params;

    if (!id || isNaN(Number(id))) {
      throw new AppError('无效的课程ID', 400);
    }

    if (!studentId || isNaN(Number(studentId))) {
      throw new AppError('无效的学生ID', 400);
    }

    const courseId = Number(id);
    const studentIdNum = Number(studentId);

    // 检查课程是否存在
    const course = await this.courseService.findById(courseId);
    if (!course) {
      throw new AppError('课程不存在', 404);
    }

    // 检查权限（只有课程教师或管理员可以移除学生）
    if (req.user.role !== 'admin' && course.teacher_id !== req.user.id) {
      throw new AppError('没有权限从此课程移除学生', 403);
    }

    // 检查学生是否已选课
    const isEnrolled = await this.courseService.isStudentEnrolled(courseId, studentIdNum);
    if (!isEnrolled) {
      throw new AppError('学生未选择此课程', 400);
    }

    await this.courseService.removeStudent(courseId, studentIdNum);

    const response: ApiResponse = {
      success: true,
      message: '移除学生成功'
    };

    res.json(response);
  });
}
