import { Request, Response } from 'express';
import { AuthenticatedRequest, ApiResponse, ExamRecord, PaginatedResponse } from '../types';
import { executeQuery } from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';

export class GradeController {
  // 获取成绩列表
  getGrades = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { page = 1, limit = 10, course_id, exam_id } = req.query;

    const pageNum = Number(page) || 1;
    const pageSize = Number(limit) || 10;
    const offset = (pageNum - 1) * pageSize;

    const conditions: string[] = [];
    const params: any[] = [];

    if (exam_id) {
      conditions.push('r.exam_id = ?');
      params.push(Number(exam_id));
    }
    if (course_id) {
      conditions.push('e.course_id = ?');
      params.push(Number(course_id));
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*) as total
      FROM exam_records r
      JOIN exams e ON r.exam_id = e.id
      ${whereClause}
    `;
    const countRows = await executeQuery<{ total: number }>(countSql, params);
    const total = countRows[0]?.total ?? 0;

    const limitNum = Number(pageSize) || 10;
    const offsetNum = Number(offset) || 0;
    const dataSql = `
      SELECT r.*, e.title as exam_title, e.course_id, u.username, u.real_name
      FROM exam_records r
      JOIN exams e ON r.exam_id = e.id
      JOIN users u ON r.student_id = u.id
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT ${limitNum} OFFSET ${offsetNum}
    `;

    const items = await executeQuery<any>(dataSql, params);

    const response: ApiResponse<PaginatedResponse<any>> = {
      success: true,
      message: '获取成绩列表成功',
      data: {
        items,
        total,
        page: pageNum,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };

    res.json(response);
  });

  // 获取我的成绩（学生）
  getMyGrades = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('未认证用户', 401);
    }

    const sql = `
      SELECT r.*, e.title as exam_title, e.course_id
      FROM exam_records r
      JOIN exams e ON r.exam_id = e.id
      WHERE r.student_id = ?
      ORDER BY r.created_at DESC
    `;

    const items = await executeQuery<any>(sql, [req.user.id]);

    const response: ApiResponse<any[]> = {
      success: true,
      message: '获取我的成绩成功',
      data: items,
    };

    res.json(response);
  });

  // 获取课程成绩统计
  getCourseGradeStats = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { courseId } = req.params;
    const cid = Number(courseId);
    if (!cid) {
      throw new AppError('无效的课程ID', 400);
    }

    const sql = `
      SELECT 
        COUNT(*) as total_students,
        AVG(r.score) as average_score,
        SUM(CASE WHEN r.score >= e.pass_score THEN 1 ELSE 0 END) / COUNT(*) * 100 as pass_rate
      FROM exam_records r
      JOIN exams e ON r.exam_id = e.id
      WHERE e.course_id = ? AND r.score IS NOT NULL
    `;

    const rows = await executeQuery<any>(sql, [cid]);
    const stats = rows[0] || {
      total_students: 0,
      average_score: 0,
      pass_rate: 0,
    };

    const response: ApiResponse<any> = {
      success: true,
      message: '获取课程成绩统计成功',
      data: stats,
    };

    res.json(response);
  });

  // 获取考试成绩列表
  getExamGrades = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { examId } = req.params;
    const eid = Number(examId);
    if (!eid) {
      throw new AppError('无效的考试ID', 400);
    }

    const sql = `
      SELECT r.*, u.username, u.real_name
      FROM exam_records r
      JOIN users u ON r.student_id = u.id
      WHERE r.exam_id = ?
      ORDER BY r.created_at DESC
    `;

    const items = await executeQuery<any>(sql, [eid]);

    const response: ApiResponse<any[]> = {
      success: true,
      message: '获取考试成绩列表成功',
      data: items,
    };

    res.json(response);
  });

  // 更新成绩
  updateGrade = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('未认证用户', 401);
    }

    const { id } = req.params;
    const rid = Number(id);
    if (!rid) {
      throw new AppError('无效的成绩ID', 400);
    }

    const body = req.body as { score?: number; comment?: string };

    const fields: string[] = [];
    const values: any[] = [];

    if (body.score !== undefined) {
      fields.push('score = ?');
      values.push(body.score);
    }
    if (body.comment !== undefined) {
      fields.push('answers = ?');
      values.push(body.comment);
    }

    if (fields.length === 0) {
      throw new AppError('没有要更新的字段', 400);
    }

    const sql = `UPDATE exam_records SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`;
    values.push(rid);
    await executeQuery(sql, values);

    const rows = await executeQuery<ExamRecord>('SELECT * FROM exam_records WHERE id = ?', [rid]);
    const record = rows[0];

    const response: ApiResponse<ExamRecord> = {
      success: true,
      message: '更新成绩成功',
      data: record,
    };

    res.json(response);
  });

  // 导出成绩（简化：返回 JSON 列表）
  exportGrades = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { examId } = req.params;
    const eid = Number(examId);
    if (!eid) {
      throw new AppError('无效的考试ID', 400);
    }

    const sql = `
      SELECT r.*, u.username, u.real_name
      FROM exam_records r
      JOIN users u ON r.student_id = u.id
      WHERE r.exam_id = ?
      ORDER BY r.created_at DESC
    `;

    const items = await executeQuery<any>(sql, [eid]);

    const response: ApiResponse<any[]> = {
      success: true,
      message: '导出成绩成功',
      data: items,
    };

    res.json(response);
  });
}
