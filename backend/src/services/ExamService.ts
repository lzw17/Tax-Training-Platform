import { executeQuery } from '../config/database';
import { Exam, ExamQuestion, ExamRecord } from '../types';
import { AppError } from '../middleware/errorHandler';

export class ExamService {
  // 创建考试
  async create(examData: Partial<Exam>): Promise<Exam> {
    const {
      title,
      description,
      course_id,
      creator_id,
      start_time,
      end_time,
      duration,
      total_score,
      pass_score,
      status = 'draft',
      settings = {}
    } = examData;

    const sql = `
      INSERT INTO exams (
        title, description, course_id, creator_id, start_time, end_time,
        duration, total_score, pass_score, status, settings
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await executeQuery(sql, [
      title,
      description,
      course_id,
      creator_id,
      start_time,
      end_time,
      duration,
      total_score,
      pass_score,
      status,
      JSON.stringify(settings)
    ]);

    const exam = await this.findById((result as any).insertId);
    if (!exam) throw new AppError('创建考试失败', 500);
    return exam;
  }

  // 根据ID查找考试
  async findById(id: number): Promise<Exam | null> {
    const sql = `
      SELECT 
        e.*,
        c.name as course_name,
        u.real_name as creator_name,
        (SELECT COUNT(*) FROM exam_questions WHERE exam_id = e.id) as question_count,
        (SELECT COUNT(DISTINCT student_id) FROM exam_records WHERE exam_id = e.id) as participant_count
      FROM exams e
      LEFT JOIN courses c ON e.course_id = c.id
      LEFT JOIN users u ON e.creator_id = u.id
      WHERE e.id = ?
    `;

    const exams = await executeQuery<Exam>(sql, [id]);
    if (exams.length === 0) return null;

    const exam = exams[0] as Exam;
    if (typeof exam.settings === 'string') {
      exam.settings = JSON.parse(exam.settings as string);
    }
    return exam;
  }

  // 获取考试列表
  async findAll(params: {
    page: number;
    limit: number;
    course_id?: number;
    creator_id?: number;
    status?: string;
    search?: string;
  }) {
    const { page, limit, course_id, creator_id, status, search } = params;
    const offset = (page - 1) * limit;

    let whereClauses: string[] = [];
    let queryParams: any[] = [];

    if (course_id) {
      whereClauses.push('e.course_id = ?');
      queryParams.push(course_id);
    }

    if (creator_id) {
      whereClauses.push('e.creator_id = ?');
      queryParams.push(creator_id);
    }

    if (status) {
      whereClauses.push('e.status = ?');
      queryParams.push(status);
    }

    if (search) {
      whereClauses.push('(e.title LIKE ? OR e.description LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const sql = `
      SELECT 
        e.*,
        c.name as course_name,
        u.real_name as creator_name,
        (SELECT COUNT(*) FROM exam_questions WHERE exam_id = e.id) as question_count,
        (SELECT COUNT(DISTINCT student_id) FROM exam_records WHERE exam_id = e.id) as participant_count
      FROM exams e
      LEFT JOIN courses c ON e.course_id = c.id
      LEFT JOIN users u ON e.creator_id = u.id
      ${whereClause}
      ORDER BY e.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const countSql = `
      SELECT COUNT(*) as total
      FROM exams e
      ${whereClause}
    `;

    const exams = await executeQuery<Exam>(sql, [...queryParams, limit, offset]);
    const countResult = await executeQuery<{ total: number }>(countSql, queryParams);
    const total = countResult[0]?.total ?? 0;

    // 解析 settings JSON
    exams.forEach(exam => {
      if (typeof exam.settings === 'string') {
        exam.settings = JSON.parse(exam.settings as string);
      }
    });

    return {
      items: exams,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // 更新考试
  async update(id: number, examData: Partial<Exam>): Promise<Exam> {
    const fields: string[] = [];
    const values: any[] = [];

    const allowedFields = [
      'title', 'description', 'course_id', 'start_time', 'end_time',
      'duration', 'total_score', 'pass_score', 'status', 'settings'
    ];

    allowedFields.forEach(field => {
      if (examData[field as keyof Exam] !== undefined) {
        fields.push(`${field} = ?`);
        if (field === 'settings') {
          values.push(JSON.stringify(examData[field as keyof Exam]));
        } else {
          values.push(examData[field as keyof Exam]);
        }
      }
    });

    if (fields.length === 0) {
      throw new AppError('没有要更新的字段', 400);
    }

    const sql = `UPDATE exams SET ${fields.join(', ')} WHERE id = ?`;
    await executeQuery(sql, [...values, id]);

    const exam = await this.findById(id);
    if (!exam) throw new AppError('考试不存在', 404);
    return exam;
  }

  // 删除考试
  async delete(id: number): Promise<void> {
    // 先删除关联的考试题目
    await executeQuery('DELETE FROM exam_questions WHERE exam_id = ?', [id]);
    // 删除考试记录
    await executeQuery('DELETE FROM exam_records WHERE exam_id = ?', [id]);
    // 删除考试
    await executeQuery('DELETE FROM exams WHERE id = ?', [id]);
  }

  // 添加题目到考试
  async addQuestion(examId: number, questionId: number, score: number, order: number): Promise<void> {
    const sql = `
      INSERT INTO exam_questions (exam_id, question_id, score, \`order\`)
      VALUES (?, ?, ?, ?)
    `;
    await executeQuery(sql, [examId, questionId, score, order]);
  }

  // 移除考试题目
  async removeQuestion(examId: number, questionId: number): Promise<void> {
    await executeQuery('DELETE FROM exam_questions WHERE exam_id = ? AND question_id = ?', [examId, questionId]);
  }

  // 获取考试题目列表
  async getQuestions(examId: number) {
    const sql = `
      SELECT 
        eq.*,
        q.title,
        q.content,
        q.type,
        q.options,
        q.correct_answer,
        q.explanation,
        q.difficulty,
        q.category
      FROM exam_questions eq
      JOIN questions q ON eq.question_id = q.id
      WHERE eq.exam_id = ?
      ORDER BY eq.\`order\` ASC
    `;

    const questions = await executeQuery(sql, [examId]);
    
    // 解析 options JSON
    questions.forEach((q: any) => {
      if (typeof q.options === 'string') {
        q.options = JSON.parse(q.options);
      }
    });

    return questions;
  }

  // 获取学生的考试记录
  async getStudentRecord(examId: number, studentId: number): Promise<ExamRecord | null> {
    const sql = `
      SELECT * FROM exam_records
      WHERE exam_id = ? AND student_id = ?
    `;

    const records = await executeQuery<ExamRecord>(sql, [examId, studentId]);
    if (records.length === 0) return null;

    const record = records[0];
    if (!record) return null;
    if (typeof record.answers === 'string') {
      record.answers = JSON.parse(record.answers as string);
    }
    return record;
  }

  // 创建考试记录
  async createRecord(examId: number, studentId: number): Promise<ExamRecord> {
    const sql = `
      INSERT INTO exam_records (exam_id, student_id, status, answers)
      VALUES (?, ?, 'in_progress', '[]')
    `;

    const result = await executeQuery(sql, [examId, studentId]);
    const recordId = (result as any).insertId;

    const records = await executeQuery<ExamRecord>(
      'SELECT * FROM exam_records WHERE id = ?',
      [recordId]
    );

    const record = records[0];
    if (!record) throw new AppError('考试记录创建失败', 500);
    return record;
  }

  // 提交考试答案
  async submitAnswers(recordId: number, answers: any[]): Promise<void> {
    const sql = `
      UPDATE exam_records
      SET answers = ?, submit_time = NOW(), status = 'submitted'
      WHERE id = ?
    `;

    await executeQuery(sql, [JSON.stringify(answers), recordId]);
  }

  // 批改考试
  async gradeExam(recordId: number, score: number): Promise<void> {
    const sql = `
      UPDATE exam_records
      SET score = ?, status = 'graded'
      WHERE id = ?
    `;

    await executeQuery(sql, [score, recordId]);
  }

  // 获取考试统计
  async getStats(examId: number) {
    const sql = `
      SELECT 
        COUNT(*) as total_participants,
        AVG(score) as average_score,
        MAX(score) as highest_score,
        MIN(score) as lowest_score,
        SUM(CASE WHEN score >= (SELECT pass_score FROM exams WHERE id = ?) THEN 1 ELSE 0 END) as passed_count
      FROM exam_records
      WHERE exam_id = ? AND status = 'graded'
    `;

    const stats = await executeQuery(sql, [examId, examId]);
    return stats[0] || {
      total_participants: 0,
      average_score: 0,
      highest_score: 0,
      lowest_score: 0,
      passed_count: 0
    };
  }
}
