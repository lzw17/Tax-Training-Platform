import { Request, Response } from 'express';
import { AuthenticatedRequest, ApiResponse, PaginatedResponse, Exam, Question, ExamRecord, ExamStatus } from '../types';
import { executeQuery } from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';

interface CreateExamBody {
  title: string;
  description?: string;
  course_id: number;
  start_time: string;
  end_time: string;
  duration: number;
  total_score: number;
  pass_score: number;
  settings?: any;
  question_ids?: number[];
}

interface SubmitExamBody {
  answers: {
    question_id: number;
    answer: any;
  }[];
}

export class ExamController {
  // 获取考试列表
  getExams = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { page = 1, limit = 10, course_id, status, sort = 'start_time', order = 'desc' } = req.query;

    const pageNum = Number(page) || 1;
    const pageSize = Number(limit) || 10;
    const offset = (pageNum - 1) * pageSize;

    const conditions: string[] = [];
    const params: any[] = [];

    if (course_id) {
      conditions.push('e.course_id = ?');
      params.push(Number(course_id));
    }

    if (status) {
      conditions.push('e.status = ?');
      params.push(String(status));
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) as total FROM exams e ${whereClause}`;
    const countRows = await executeQuery<{ total: number }>(countSql, params);
    const total = countRows[0]?.total ?? 0;

    const limitNum = Number(pageSize) || 10;
    const offsetNum = Number(offset) || 0;
    const dataSql = `
      SELECT e.*
      FROM exams e
      ${whereClause}
      ORDER BY e.${sort as string} ${(String(order) || 'desc').toUpperCase()}
      LIMIT ${limitNum} OFFSET ${offsetNum}
    `;

    const items = await executeQuery<Exam>(dataSql, params);

    const response: ApiResponse<PaginatedResponse<Exam>> = {
      success: true,
      message: '获取考试列表成功',
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

  // 创建考试（教师）
  createExam = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('未认证用户', 401);
    }

    const body = req.body as CreateExamBody;

    if (!body.title || !body.course_id || !body.start_time || !body.end_time || !body.duration || !body.total_score || !body.pass_score) {
      throw new AppError('缺少必填字段', 400);
    }

    const settingsJson = body.settings ? JSON.stringify(body.settings) : null;

    const insertSql = `
      INSERT INTO exams (title, description, course_id, creator_id, start_time, end_time, duration, total_score, pass_score, status, settings)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?)
    `;

    const result = await executeQuery(insertSql, [
      body.title,
      body.description || null,
      body.course_id,
      req.user.id,
      body.start_time,
      body.end_time,
      body.duration,
      body.total_score,
      body.pass_score,
      settingsJson,
    ]);

    const examId = (result as any).insertId as number;

    if (body.question_ids && body.question_ids.length > 0) {
      const perScore = Number((body.total_score / body.question_ids.length).toFixed(2));

      const values: any[] = [];
      const placeholders: string[] = [];
      body.question_ids.forEach((qid, index) => {
        placeholders.push('(?, ?, ?, ?)');
        values.push(examId, qid, perScore, index + 1);
      });

      const examQuestionSql = `
        INSERT INTO exam_questions (exam_id, question_id, score, order_num)
        VALUES ${placeholders.join(', ')}
      `;

      await executeQuery(examQuestionSql, values);
    }

    const exam = await this.getExamByIdInternal(examId);

    const response: ApiResponse<any> = {
      success: true,
      message: '创建考试成功',
      data: exam,
    };

    res.status(201).json(response);
  });

  // 获取考试详情
  getExamById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const examId = Number(id);
    if (!examId) {
      throw new AppError('无效的考试ID', 400);
    }

    const exam = await this.getExamByIdInternal(examId);
    if (!exam) {
      throw new AppError('考试不存在', 404);
    }

    const response: ApiResponse<any> = {
      success: true,
      message: '获取考试详情成功',
      data: exam,
    };

    res.json(response);
  });

  // 更新考试
  updateExam = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('未认证用户', 401);
    }

    const { id } = req.params;
    const examId = Number(id);
    if (!examId) {
      throw new AppError('无效的考试ID', 400);
    }

    const existing = await this.getExamByIdInternal(examId);
    if (!existing) {
      throw new AppError('考试不存在', 404);
    }

    const body = req.body as Partial<CreateExamBody>;

    const fields: string[] = [];
    const values: any[] = [];

    if (body.title !== undefined) {
      fields.push('title = ?');
      values.push(body.title);
    }
    if (body.description !== undefined) {
      fields.push('description = ?');
      values.push(body.description);
    }
    if (body.start_time !== undefined) {
      fields.push('start_time = ?');
      values.push(body.start_time);
    }
    if (body.end_time !== undefined) {
      fields.push('end_time = ?');
      values.push(body.end_time);
    }
    if (body.duration !== undefined) {
      fields.push('duration = ?');
      values.push(body.duration);
    }
    if (body.total_score !== undefined) {
      fields.push('total_score = ?');
      values.push(body.total_score);
    }
    if (body.pass_score !== undefined) {
      fields.push('pass_score = ?');
      values.push(body.pass_score);
    }
    if (body.settings !== undefined) {
      fields.push('settings = ?');
      values.push(body.settings ? JSON.stringify(body.settings) : null);
    }

    if (fields.length > 0) {
      const sql = `UPDATE exams SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`;
      values.push(examId);
      await executeQuery(sql, values);
    }

    if (body.question_ids && body.question_ids.length > 0) {
      await executeQuery('DELETE FROM exam_questions WHERE exam_id = ?', [examId]);

      const perScore = Number(((body.total_score || existing.total_score) / body.question_ids.length).toFixed(2));
      const values2: any[] = [];
      const placeholders: string[] = [];
      body.question_ids.forEach((qid, index) => {
        placeholders.push('(?, ?, ?, ?)');
        values2.push(examId, qid, perScore, index + 1);
      });
      const examQuestionSql = `
        INSERT INTO exam_questions (exam_id, question_id, score, order_num)
        VALUES ${placeholders.join(', ')}
      `;
      await executeQuery(examQuestionSql, values2);
    }

    const exam = await this.getExamByIdInternal(examId);

    const response: ApiResponse<any> = {
      success: true,
      message: '更新考试成功',
      data: exam,
    };

    res.json(response);
  });

  // 删除考试
  deleteExam = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('未认证用户', 401);
    }

    const { id } = req.params;
    const examId = Number(id);
    if (!examId) {
      throw new AppError('无效的考试ID', 400);
    }

    await executeQuery('DELETE FROM exams WHERE id = ?', [examId]);

    const response: ApiResponse = {
      success: true,
      message: '删除考试成功',
    };

    res.json(response);
  });

  // 开始考试（学生）
  startExam = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('未认证用户', 401);
    }

    const { id } = req.params;
    const examId = Number(id);
    if (!examId) {
      throw new AppError('无效的考试ID', 400);
    }

    const exam = await this.getExamByIdInternal(examId);
    if (!exam) {
      throw new AppError('考试不存在', 404);
    }

    const nowRows = await executeQuery<{ now: Date }>('SELECT NOW() as now');
    const now = nowRows[0]?.now;

    if (exam.status === ExamStatus.CANCELLED) {
      throw new AppError('考试已取消', 400);
    }

    // 创建或更新考试记录
    const recordSql = `
      INSERT INTO exam_records (exam_id, student_id, start_time, status)
      VALUES (?, ?, NOW(), 'in_progress')
      ON DUPLICATE KEY UPDATE
        start_time = IF(start_time IS NULL, VALUES(start_time), start_time),
        status = 'in_progress',
        updated_at = NOW()
    `;
    await executeQuery(recordSql, [examId, req.user.id]);

    const recordRows = await executeQuery<ExamRecord>(
      'SELECT * FROM exam_records WHERE exam_id = ? AND student_id = ?',
      [examId, req.user.id],
    );
    const record = recordRows[0];
    if (!record) {
      throw new AppError('考试记录创建失败', 500);
    }

    const questions = await this.getExamQuestions(examId);

    const response: ApiResponse<any> = {
      success: true,
      message: '考试开始',
      data: {
        record_id: record.id,
        questions,
        start_time: exam.start_time,
        end_time: exam.end_time,
        server_time: now,
      },
    };

    res.json(response);
  });

  // 提交考试答案（学生）
  submitExam = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('未认证用户', 401);
    }

    const { id } = req.params;
    const examId = Number(id);
    if (!examId) {
      throw new AppError('无效的考试ID', 400);
    }

    const body = req.body as SubmitExamBody;
    if (!body.answers || !Array.isArray(body.answers) || body.answers.length === 0) {
      throw new AppError('答案不能为空', 400);
    }

    const exam = await this.getExamByIdInternal(examId);
    if (!exam) {
      throw new AppError('考试不存在', 404);
    }

    const questions = await this.getExamQuestions(examId);

    let score = 0;
    const answerMap = new Map<number, any>();
    body.answers.forEach((a) => {
      answerMap.set(a.question_id, a.answer);
    });

    questions.forEach((q) => {
      const userAnswer = answerMap.get(q.id);
      if (userAnswer === undefined || userAnswer === null) {
        return;
      }
      if (q.type === 'single_choice' || q.type === 'true_false') {
        if (String(userAnswer) === String(q.correct_answer)) {
          score += q.score;
        }
      } else if (q.type === 'multiple_choice') {
        try {
          const correct = Array.isArray(q.correct_answer)
            ? q.correct_answer
            : JSON.parse(q.correct_answer as any);
          const userArr = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
          const sortStr = (arr: any[]) => arr.map(String).sort().join(',');
          if (sortStr(correct) === sortStr(userArr)) {
            score += q.score;
          }
        } catch {
          /* ignore parse error */
        }
      }
    });

    const answersJson = JSON.stringify(body.answers);

    const updateSql = `
      UPDATE exam_records
      SET answers = ?, submit_time = NOW(), score = ?, status = 'submitted', updated_at = NOW()
      WHERE exam_id = ? AND student_id = ?
    `;
    await executeQuery(updateSql, [answersJson, score, examId, req.user.id]);

    const response: ApiResponse<any> = {
      success: true,
      message: '提交考试成功',
      data: {
        score,
      },
    };

    res.json(response);
  });

  // 获取考试记录列表（教师）
  getExamRecords = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('未认证用户', 401);
    }

    const { id } = req.params;
    const examId = Number(id);
    if (!examId) {
      throw new AppError('无效的考试ID', 400);
    }

    const exam = await this.getExamByIdInternal(examId);
    if (!exam) {
      throw new AppError('考试不存在', 404);
    }

    const sql = `
      SELECT r.*, u.username, u.real_name
      FROM exam_records r
      JOIN users u ON r.student_id = u.id
      WHERE r.exam_id = ?
      ORDER BY r.created_at DESC
    `;

    const records = await executeQuery<any>(sql, [examId]);

    const response: ApiResponse<any[]> = {
      success: true,
      message: '获取考试记录成功',
      data: records,
    };

    res.json(response);
  });

  // 获取某个学生的考试记录
  getStudentExamRecord = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('未认证用户', 401);
    }

    const { id, studentId } = req.params;
    const examId = Number(id);
    const sid = Number(studentId);

    if (!examId || !sid) {
      throw new AppError('无效的参数', 400);
    }

    if (req.user.role === 'student' && req.user.id !== sid) {
      throw new AppError('无权查看其他学生的考试记录', 403);
    }

    const sql = `
      SELECT r.*, u.username, u.real_name
      FROM exam_records r
      JOIN users u ON r.student_id = u.id
      WHERE r.exam_id = ? AND r.student_id = ?
      LIMIT 1
    `;

    const rows = await executeQuery<any>(sql, [examId, sid]);
    const record = rows[0];
    if (!record) {
      throw new AppError('考试记录不存在', 404);
    }

    const response: ApiResponse<any> = {
      success: true,
      message: '获取考试记录成功',
      data: record,
    };

    res.json(response);
  });

  private async getExamByIdInternal(id: number): Promise<any | null> {
    const examSql = 'SELECT * FROM exams WHERE id = ?';
    const exams = await executeQuery<Exam>(examSql, [id]);
    const exam = exams[0];
    if (!exam) return null;

    const questions = await this.getExamQuestions(id);

    return {
      ...exam,
      questions,
    };
  }

  private async getExamQuestions(examId: number): Promise<(Question & { score: number })[]> {
    const sql = `
      SELECT q.*, eq.score
      FROM exam_questions eq
      JOIN questions q ON eq.question_id = q.id
      WHERE eq.exam_id = ?
      ORDER BY eq.order_num ASC
    `;

    const rows = await executeQuery<any>(sql, [examId]);

    return rows.map((row) => {
      return {
        id: row.id,
        title: row.title,
        content: row.content,
        type: row.type,
        options: row.options,
        correct_answer: row.correct_answer,
        explanation: row.explanation,
        difficulty: row.difficulty,
        category: row.category,
        tags: row.tags,
        creator_id: row.creator_id,
        created_at: row.created_at,
        updated_at: row.updated_at,
        score: Number(row.score),
      } as Question & { score: number };
    });
  }
}
