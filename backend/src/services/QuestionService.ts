import { executeQuery } from '../config/database';
import { Question, QuestionType } from '../types';
import { AppError } from '../middleware/errorHandler';

export class QuestionService {
  // 创建试题
  async create(questionData: Partial<Question>): Promise<Question> {
    const {
      title,
      content,
      type,
      options,
      correct_answer,
      explanation,
      difficulty = 1,
      category,
      tags,
      creator_id
    } = questionData;

    const sql = `
      INSERT INTO questions (
        title, content, type, options, correct_answer, explanation,
        difficulty, category, tags, creator_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await executeQuery(sql, [
      title,
      content,
      type,
      JSON.stringify(options || []),
      correct_answer,
      explanation,
      difficulty,
      category,
      JSON.stringify(tags || []),
      creator_id
    ]);

    const question = await this.findById((result as any).insertId);
    if (!question) throw new AppError('创建试题失败', 500);
    return question;
  }

  // 根据ID查找试题
  async findById(id: number): Promise<Question | null> {
    const sql = `
      SELECT 
        q.*,
        u.real_name as creator_name
      FROM questions q
      LEFT JOIN users u ON q.creator_id = u.id
      WHERE q.id = ?
    `;

    const questions = await executeQuery<Question>(sql, [id]);
    if (questions.length === 0) return null;

    const question = questions[0];
    if (!question) return null;

    // 解析 JSON 字段
    if (typeof question.options === 'string') {
      question.options = JSON.parse(question.options as string);
    }
    if (typeof question.tags === 'string') {
      question.tags = JSON.parse(question.tags as string);
    }

    return question;
  }

  // 获取试题列表
  async findAll(params: {
    page: number;
    limit: number;
    type?: QuestionType;
    category?: string;
    difficulty?: number;
    creator_id?: number;
    search?: string;
  }) {
    const { page, limit, type, category, difficulty, creator_id, search } = params;
    const offset = (page - 1) * limit;

    let whereClauses: string[] = [];
    let queryParams: any[] = [];

    if (type) {
      whereClauses.push('q.type = ?');
      queryParams.push(type);
    }

    if (category) {
      whereClauses.push('q.category = ?');
      queryParams.push(category);
    }

    if (difficulty) {
      whereClauses.push('q.difficulty = ?');
      queryParams.push(difficulty);
    }

    if (creator_id) {
      whereClauses.push('q.creator_id = ?');
      queryParams.push(creator_id);
    }

    if (search) {
      whereClauses.push('(q.title LIKE ? OR q.content LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const sql = `
      SELECT 
        q.*,
        u.real_name as creator_name
      FROM questions q
      LEFT JOIN users u ON q.creator_id = u.id
      ${whereClause}
      ORDER BY q.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const countSql = `
      SELECT COUNT(*) as total
      FROM questions q
      ${whereClause}
    `;

    const questions = await executeQuery<Question>(sql, [...queryParams, limit, offset]);
    const countResult = await executeQuery<{ total: number }>(countSql, queryParams);
    const total = countResult[0]?.total ?? 0;

    // 解析 JSON 字段
    questions.forEach(question => {
      if (typeof question.options === 'string') {
        question.options = JSON.parse(question.options as string);
      }
      if (typeof question.tags === 'string') {
        question.tags = JSON.parse(question.tags as string);
      }
    });

    return {
      items: questions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // 更新试题
  async update(id: number, questionData: Partial<Question>): Promise<Question> {
    const fields: string[] = [];
    const values: any[] = [];

    const allowedFields = [
      'title', 'content', 'type', 'options', 'correct_answer',
      'explanation', 'difficulty', 'category', 'tags'
    ];

    allowedFields.forEach(field => {
      if (questionData[field as keyof Question] !== undefined) {
        fields.push(`${field} = ?`);
        if (field === 'options' || field === 'tags') {
          values.push(JSON.stringify(questionData[field as keyof Question]));
        } else {
          values.push(questionData[field as keyof Question]);
        }
      }
    });

    if (fields.length === 0) {
      throw new AppError('没有要更新的字段', 400);
    }

    const sql = `UPDATE questions SET ${fields.join(', ')} WHERE id = ?`;
    await executeQuery(sql, [...values, id]);

    const question = await this.findById(id);
    if (!question) throw new AppError('试题不存在', 404);
    return question;
  }

  // 删除试题
  async delete(id: number): Promise<void> {
    // 检查是否被考试使用
    const examQuestions = await executeQuery(
      'SELECT COUNT(*) as count FROM exam_questions WHERE question_id = ?',
      [id]
    );

    if (examQuestions[0]?.count > 0) {
      throw new AppError('该试题已被考试使用，无法删除', 400);
    }

    await executeQuery('DELETE FROM questions WHERE id = ?', [id]);
  }

  // 获取试题分类列表
  async getCategories(): Promise<string[]> {
    const sql = `
      SELECT DISTINCT category
      FROM questions
      WHERE category IS NOT NULL AND category != ''
      ORDER BY category
    `;

    const result = await executeQuery<{ category: string }>(sql, []);
    return result.map(r => r.category);
  }

  // 批量导入试题
  async batchImport(questions: Partial<Question>[]): Promise<number> {
    let successCount = 0;

    for (const questionData of questions) {
      try {
        await this.create(questionData);
        successCount++;
      } catch (error) {
        console.error('导入试题失败:', error);
      }
    }

    return successCount;
  }

  // 获取试题统计
  async getStats(creatorId?: number) {
    let whereClause = '';
    let queryParams: any[] = [];

    if (creatorId) {
      whereClause = 'WHERE creator_id = ?';
      queryParams.push(creatorId);
    }

    const sql = `
      SELECT 
        COUNT(*) as total_questions,
        SUM(CASE WHEN type = 'single_choice' THEN 1 ELSE 0 END) as single_choice_count,
        SUM(CASE WHEN type = 'multiple_choice' THEN 1 ELSE 0 END) as multiple_choice_count,
        SUM(CASE WHEN type = 'true_false' THEN 1 ELSE 0 END) as true_false_count,
        SUM(CASE WHEN type = 'fill_blank' THEN 1 ELSE 0 END) as fill_blank_count,
        SUM(CASE WHEN type = 'essay' THEN 1 ELSE 0 END) as essay_count,
        SUM(CASE WHEN difficulty = 1 THEN 1 ELSE 0 END) as easy_count,
        SUM(CASE WHEN difficulty = 2 THEN 1 ELSE 0 END) as medium_count,
        SUM(CASE WHEN difficulty = 3 THEN 1 ELSE 0 END) as hard_count
      FROM questions
      ${whereClause}
    `;

    const stats = await executeQuery(sql, queryParams);
    return stats[0] || {
      total_questions: 0,
      single_choice_count: 0,
      multiple_choice_count: 0,
      true_false_count: 0,
      fill_blank_count: 0,
      essay_count: 0,
      easy_count: 0,
      medium_count: 0,
      hard_count: 0
    };
  }
}
