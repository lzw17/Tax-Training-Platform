import { executeQuery } from '../config/database';
import { Course, PaginationParams, PaginatedResponse } from '../types';

export class CourseService {
  // 根据ID查找课程
  async findById(id: number): Promise<Course | null> {
    const sql = `
      SELECT c.*, u.real_name as teacher_name,
             (SELECT COUNT(*) FROM course_students cs WHERE cs.course_id = c.id) as student_count
      FROM courses c 
      LEFT JOIN users u ON c.teacher_id = u.id 
      WHERE c.id = ?
    `;
    const courses = await executeQuery<Course & { teacher_name: string; student_count: number }>(sql, [id]);
    // courses[0] 在数组非空时一定存在，这里通过类型断言避免 TS 将其视为可能为 undefined
    return courses.length > 0 ? (courses[0] as Course) : null;
  }

  // 创建课程
  async create(courseData: {
    name: string;
    description: string;
    teacher_id: number;
    cover_image?: string;
    credit_hours: number;
  }): Promise<Course> {
    const sql = `
      INSERT INTO courses (name, description, teacher_id, cover_image, credit_hours, status)
      VALUES (?, ?, ?, ?, ?, 'active')
    `;
    
    const result = await executeQuery(sql, [
      courseData.name,
      courseData.description,
      courseData.teacher_id,
      courseData.cover_image || null,
      courseData.credit_hours
    ]);

    const insertId = (result as any).insertId;
    const newCourse = await this.findById(insertId);
    
    if (!newCourse) {
      throw new Error('创建课程失败');
    }

    return newCourse;
  }

  // 更新课程
  async update(id: number, courseData: Partial<Course>): Promise<Course> {
    const fields = [];
    const values = [];

    if (courseData.name !== undefined) {
      fields.push('name = ?');
      values.push(courseData.name);
    }
    if (courseData.description !== undefined) {
      fields.push('description = ?');
      values.push(courseData.description);
    }
    if (courseData.cover_image !== undefined) {
      fields.push('cover_image = ?');
      values.push(courseData.cover_image);
    }
    if (courseData.credit_hours !== undefined) {
      fields.push('credit_hours = ?');
      values.push(courseData.credit_hours);
    }
    if (courseData.status !== undefined) {
      fields.push('status = ?');
      values.push(courseData.status);
    }

    if (fields.length === 0) {
      throw new Error('没有要更新的字段');
    }

    fields.push('updated_at = NOW()');
    values.push(id);

    const sql = `UPDATE courses SET ${fields.join(', ')} WHERE id = ?`;
    await executeQuery(sql, values);

    const updatedCourse = await this.findById(id);
    if (!updatedCourse) {
      throw new Error('更新课程失败');
    }

    return updatedCourse;
  }

  // 删除课程
  async delete(id: number): Promise<void> {
    const sql = 'DELETE FROM courses WHERE id = ?';
    await executeQuery(sql, [id]);
  }

  // 获取课程列表（分页）
  async findAll(params: PaginationParams & { 
    teacher_id?: number; 
    status?: string; 
    search?: string; 
  }): Promise<PaginatedResponse<Course>> {
    const { page = 1, limit = 10, teacher_id, status, search, sort = 'created_at', order = 'desc' } = params;
    const offset = (page - 1) * limit;

    // 构建WHERE条件
    const conditions = [];
    const queryParams = [];

    if (teacher_id) {
      conditions.push('c.teacher_id = ?');
      queryParams.push(teacher_id);
    }

    if (status) {
      conditions.push('c.status = ?');
      queryParams.push(status);
    }

    if (search) {
      conditions.push('(c.name LIKE ? OR c.description LIKE ?)');
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 获取总数
    const countSql = `SELECT COUNT(*) as total FROM courses c ${whereClause}`;
    const countResult = await executeQuery<{ total: number }>(countSql, queryParams);
    const total = countResult[0]?.total || 0;

    // 获取数据
    const dataSql = `
      SELECT c.*, u.real_name as teacher_name,
             (SELECT COUNT(*) FROM course_students cs WHERE cs.course_id = c.id) as student_count
      FROM courses c 
      LEFT JOIN users u ON c.teacher_id = u.id 
      ${whereClause}
      ORDER BY c.${sort} ${order.toUpperCase()}
      LIMIT ? OFFSET ?
    `;
    
    const items = await executeQuery<Course & { teacher_name: string; student_count: number }>(dataSql, [...queryParams, limit, offset]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // 获取教师的课程
  async findByTeacher(teacherId: number, params: PaginationParams): Promise<PaginatedResponse<Course>> {
    return this.findAll({ ...params, teacher_id: teacherId });
  }

  // 添加学生到课程
  async addStudent(courseId: number, studentId: number): Promise<void> {
    const sql = 'INSERT INTO course_students (course_id, student_id) VALUES (?, ?)';
    await executeQuery(sql, [courseId, studentId]);
  }

  // 从课程移除学生
  async removeStudent(courseId: number, studentId: number): Promise<void> {
    const sql = 'DELETE FROM course_students WHERE course_id = ? AND student_id = ?';
    await executeQuery(sql, [courseId, studentId]);
  }

  // 获取课程学生列表
  async getCourseStudents(courseId: number, params: PaginationParams): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10, sort = 'enrolled_at', order = 'desc' } = params;
    const offset = (page - 1) * limit;

    // 获取总数
    const countSql = `
      SELECT COUNT(*) as total 
      FROM course_students cs 
      WHERE cs.course_id = ?
    `;
    const countResult = await executeQuery<{ total: number }>(countSql, [courseId]);
    const total = countResult[0]?.total || 0;

    // 获取数据
    const dataSql = `
      SELECT u.id, u.username, u.real_name, u.email, cs.enrolled_at,
             s.student_id, s.grade, s.major, c.name as class_name
      FROM course_students cs
      JOIN users u ON cs.student_id = u.id
      LEFT JOIN students s ON u.id = s.user_id
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE cs.course_id = ?
      ORDER BY cs.${sort} ${order.toUpperCase()}
      LIMIT ? OFFSET ?
    `;
    
    const items = await executeQuery(dataSql, [courseId, limit, offset]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // 检查学生是否已选课
  async isStudentEnrolled(courseId: number, studentId: number): Promise<boolean> {
    const sql = 'SELECT 1 FROM course_students WHERE course_id = ? AND student_id = ?';
    const result = await executeQuery(sql, [courseId, studentId]);
    return result.length > 0;
  }

  // 检查课程是否存在
  async exists(id: number): Promise<boolean> {
    const sql = 'SELECT 1 FROM courses WHERE id = ?';
    const result = await executeQuery(sql, [id]);
    return result.length > 0;
  }

  // 检查教师是否拥有课程
  async isTeacherOwner(courseId: number, teacherId: number): Promise<boolean> {
    const sql = 'SELECT 1 FROM courses WHERE id = ? AND teacher_id = ?';
    const result = await executeQuery(sql, [courseId, teacherId]);
    return result.length > 0;
  }

  // 获取课程统计信息
  async getStats(): Promise<{
    total_courses: number;
    active_courses: number;
    total_enrollments: number;
  }> {
    const sql = `
      SELECT 
        COUNT(*) as total_courses,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_courses,
        (SELECT COUNT(*) FROM course_students) as total_enrollments
      FROM courses
    `;
    
    const result = await executeQuery<{
      total_courses: number;
      active_courses: number;
      total_enrollments: number;
    }>(sql);

    return result[0] || { total_courses: 0, active_courses: 0, total_enrollments: 0 };
  }
}
