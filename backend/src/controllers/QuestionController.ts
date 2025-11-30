import { Request, Response } from 'express';
import { AuthenticatedRequest, ApiResponse, PaginatedResponse, Question, QuestionType } from '../types';
import { executeQuery } from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';

export class QuestionController {
  // 获取题目列表
  getQuestions = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { page = 1, limit = 10, type, category, difficulty, search } = req.query;

    const pageNum = Number(page) || 1;
    const pageSize = Number(limit) || 10;
    const offset = (pageNum - 1) * pageSize;

    const conditions: string[] = [];
    const params: any[] = [];

    if (type) {
      conditions.push('q.type = ?');
      params.push(String(type));
    }
    if (category) {
      conditions.push('q.category = ?');
      params.push(String(category));
    }
    if (difficulty) {
      conditions.push('q.difficulty = ?');
      params.push(Number(difficulty));
    }
    if (search) {
      conditions.push('(q.title LIKE ? OR q.content LIKE ?)');
      const kw = `%${search}%`;
      params.push(kw, kw);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) as total FROM questions q ${whereClause}`;
    const countRows = await executeQuery<{ total: number }>(countSql, params);
    const total = countRows[0]?.total ?? 0;

    const limitNum = Number(pageSize) || 10;
    const offsetNum = Number(offset) || 0;
    const dataSql = `
      SELECT q.*
      FROM questions q
      ${whereClause}
      ORDER BY q.created_at DESC
      LIMIT ${limitNum} OFFSET ${offsetNum}
    `;

    const items = await executeQuery<Question>(dataSql, params);

    const response: ApiResponse<PaginatedResponse<Question>> = {
      success: true,
      message: '获取试题列表成功',
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

  // 创建题目
  createQuestion = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('未认证用户', 401);
    }

    const body = req.body as any;

    if (!body.title || !body.content || !body.type || !body.correct_answer || !body.category) {
      throw new AppError('缺少必填字段', 400);
    }

    const optionsJson = body.options ? JSON.stringify(body.options) : null;
    const tagsJson = body.tags ? JSON.stringify(body.tags) : null;

    const insertSql = `
      INSERT INTO questions (title, content, type, options, correct_answer, explanation, difficulty, category, tags, creator_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const difficulty = body.difficulty || 1;

    const result = await executeQuery(insertSql, [
      body.title,
      body.content,
      body.type as QuestionType,
      optionsJson,
      body.correct_answer,
      body.explanation || null,
      difficulty,
      body.category,
      tagsJson,
      req.user.id,
    ]);

    const id = (result as any).insertId as number;
    const rows = await executeQuery<Question>('SELECT * FROM questions WHERE id = ?', [id]);
    const question = rows[0];

    const response: ApiResponse<Question> = {
      success: true,
      message: '创建试题成功',
      data: question,
    };

    res.status(201).json(response);
  });

  // 获取题目详情
  getQuestionById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const qid = Number(id);
    if (!qid) {
      throw new AppError('无效的题目ID', 400);
    }

    const rows = await executeQuery<Question>('SELECT * FROM questions WHERE id = ?', [qid]);
    const question = rows[0];
    if (!question) {
      throw new AppError('题目不存在', 404);
    }

    const response: ApiResponse<Question> = {
      success: true,
      message: '获取试题详情成功',
      data: question,
    };

    res.json(response);
  });

  // 更新题目
  updateQuestion = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('未认证用户', 401);
    }

    const { id } = req.params;
    const qid = Number(id);
    if (!qid) {
      throw new AppError('无效的题目ID', 400);
    }

    const body = req.body as any;

    const fields: string[] = [];
    const values: any[] = [];

    if (body.title !== undefined) {
      fields.push('title = ?');
      values.push(body.title);
    }
    if (body.content !== undefined) {
      fields.push('content = ?');
      values.push(body.content);
    }
    if (body.type !== undefined) {
      fields.push('type = ?');
      values.push(body.type as QuestionType);
    }
    if (body.options !== undefined) {
      fields.push('options = ?');
      values.push(body.options ? JSON.stringify(body.options) : null);
    }
    if (body.correct_answer !== undefined) {
      fields.push('correct_answer = ?');
      values.push(body.correct_answer);
    }
    if (body.explanation !== undefined) {
      fields.push('explanation = ?');
      values.push(body.explanation);
    }
    if (body.difficulty !== undefined) {
      fields.push('difficulty = ?');
      values.push(body.difficulty);
    }
    if (body.category !== undefined) {
      fields.push('category = ?');
      values.push(body.category);
    }
    if (body.tags !== undefined) {
      fields.push('tags = ?');
      values.push(body.tags ? JSON.stringify(body.tags) : null);
    }

    if (fields.length > 0) {
      const sql = `UPDATE questions SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`;
      values.push(qid);
      await executeQuery(sql, values);
    }

    const rows = await executeQuery<Question>('SELECT * FROM questions WHERE id = ?', [qid]);
    const question = rows[0];

    const response: ApiResponse<Question> = {
      success: true,
      message: '更新试题成功',
      data: question,
    };

    res.json(response);
  });

  // 删除题目
  deleteQuestion = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('未认证用户', 401);
    }

    const { id } = req.params;
    const qid = Number(id);
    if (!qid) {
      throw new AppError('无效的题目ID', 400);
    }

    await executeQuery('DELETE FROM questions WHERE id = ?', [qid]);

    const response: ApiResponse = {
      success: true,
      message: '删除试题成功',
    };

    res.json(response);
  });

  // 批量导入题目（简化实现：仅支持 JSON 数组）
  importQuestions = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('未认证用户', 401);
    }

    const body = req.body as { questions: any[] };
    if (!body.questions || !Array.isArray(body.questions) || body.questions.length === 0) {
      throw new AppError('题目列表不能为空', 400);
    }

    let imported = 0;

    for (const q of body.questions) {
      if (!q.title || !q.content || !q.type || !q.correct_answer || !q.category) {
        continue;
      }
      const optionsJson = q.options ? JSON.stringify(q.options) : null;
      const tagsJson = q.tags ? JSON.stringify(q.tags) : null;
      const difficulty = q.difficulty || 1;

      const sql = `
        INSERT INTO questions (title, content, type, options, correct_answer, explanation, difficulty, category, tags, creator_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      await executeQuery(sql, [
        q.title,
        q.content,
        q.type as QuestionType,
        optionsJson,
        q.correct_answer,
        q.explanation || null,
        difficulty,
        q.category,
        tagsJson,
        req.user.id,
      ]);
      imported += 1;
    }

    const response: ApiResponse<{ imported: number }> = {
      success: true,
      message: '批量导入试题完成',
      data: { imported },
    };

    res.json(response);
  });

  // 导出题目（返回 JSON 列表）
  exportQuestions = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { type, category } = req.query;

    const conditions: string[] = [];
    const params: any[] = [];

    if (type) {
      conditions.push('type = ?');
      params.push(String(type));
    }
    if (category) {
      conditions.push('category = ?');
      params.push(String(category));
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `SELECT * FROM questions ${whereClause} ORDER BY created_at DESC`;
    const items = await executeQuery<Question>(sql, params);

    const response: ApiResponse<Question[]> = {
      success: true,
      message: '导出试题成功',
      data: items,
    };

    res.json(response);
  });

  // 获取题目分类
  getCategories = asyncHandler(async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    const sql = 'SELECT DISTINCT category FROM questions ORDER BY category ASC';
    const rows = await executeQuery<{ category: string }>(sql);
    const categories = rows.map((r) => r.category);

    const response: ApiResponse<string[]> = {
      success: true,
      message: '获取题目分类成功',
      data: categories,
    };

    res.json(response);
  });
}
