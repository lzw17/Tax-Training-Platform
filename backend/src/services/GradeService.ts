import { executeQuery } from '../config/database';
import { ExamRecord } from '../types';

export class GradeService {
  // 获取学生成绩列表
  async getStudentGrades(params: {
    studentId: number;
    page: number;
    limit: number;
    courseId?: number;
  }) {
    const { studentId, page, limit, courseId } = params;
    const offset = (page - 1) * limit;

    let whereClauses = ['er.student_id = ?'];
    let queryParams: any[] = [studentId];

    if (courseId) {
      whereClauses.push('e.course_id = ?');
      queryParams.push(courseId);
    }

    const whereClause = whereClauses.join(' AND ');

    const sql = `
      SELECT 
        er.*,
        e.title as exam_title,
        e.total_score as exam_total_score,
        e.pass_score as exam_pass_score,
        c.name as course_name,
        u.real_name as student_name
      FROM exam_records er
      JOIN exams e ON er.exam_id = e.id
      JOIN courses c ON e.course_id = c.id
      JOIN users u ON er.student_id = u.id
      WHERE ${whereClause}
      ORDER BY er.submit_time DESC
      LIMIT ? OFFSET ?
    `;

    const countSql = `
      SELECT COUNT(*) as total
      FROM exam_records er
      JOIN exams e ON er.exam_id = e.id
      WHERE ${whereClause}
    `;

    const grades = await executeQuery(sql, [...queryParams, limit, offset]);
    const countResult = await executeQuery<{ total: number }>(countSql, queryParams);
    const total = countResult[0]?.total ?? 0;

    return {
      items: grades,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // 获取考试成绩列表
  async getExamGrades(params: {
    examId: number;
    page: number;
    limit: number;
  }) {
    const { examId, page, limit } = params;
    const offset = (page - 1) * limit;

    const sql = `
      SELECT 
        er.*,
        u.real_name as student_name,
        u.username as student_username,
        s.student_id,
        s.class_id,
        cl.name as class_name
      FROM exam_records er
      JOIN users u ON er.student_id = u.id
      LEFT JOIN students s ON u.id = s.user_id
      LEFT JOIN classes cl ON s.class_id = cl.id
      WHERE er.exam_id = ?
      ORDER BY er.score DESC, er.submit_time ASC
      LIMIT ? OFFSET ?
    `;

    const countSql = `
      SELECT COUNT(*) as total
      FROM exam_records
      WHERE exam_id = ?
    `;

    const grades = await executeQuery(sql, [examId, limit, offset]);
    const countResult = await executeQuery<{ total: number }>(countSql, [examId]);
    const total = countResult[0]?.total ?? 0;

    return {
      items: grades,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // 获取课程成绩统计
  async getCourseStats(courseId: number) {
    const sql = `
      SELECT 
        e.id as exam_id,
        e.title as exam_title,
        COUNT(er.id) as total_participants,
        AVG(er.score) as average_score,
        MAX(er.score) as highest_score,
        MIN(er.score) as lowest_score,
        SUM(CASE WHEN er.score >= e.pass_score THEN 1 ELSE 0 END) as passed_count,
        SUM(CASE WHEN er.status = 'graded' THEN 1 ELSE 0 END) as graded_count
      FROM exams e
      LEFT JOIN exam_records er ON e.id = er.exam_id
      WHERE e.course_id = ?
      GROUP BY e.id
      ORDER BY e.created_at DESC
    `;

    const stats = await executeQuery(sql, [courseId]);
    return stats;
  }

  // 获取学生成绩统计
  async getStudentStats(studentId: number) {
    const sql = `
      SELECT 
        COUNT(er.id) as total_exams,
        AVG(er.score) as average_score,
        MAX(er.score) as highest_score,
        MIN(er.score) as lowest_score,
        SUM(CASE WHEN er.score >= e.pass_score THEN 1 ELSE 0 END) as passed_count,
        SUM(CASE WHEN er.status = 'graded' THEN 1 ELSE 0 END) as completed_count
      FROM exam_records er
      JOIN exams e ON er.exam_id = e.id
      WHERE er.student_id = ? AND er.status = 'graded'
    `;

    const stats = await executeQuery(sql, [studentId]);
    return stats[0] || {
      total_exams: 0,
      average_score: 0,
      highest_score: 0,
      lowest_score: 0,
      passed_count: 0,
      completed_count: 0
    };
  }

  // 获取考试成绩分布
  async getScoreDistribution(examId: number) {
    const sql = `
      SELECT 
        CASE 
          WHEN score >= 90 THEN '90-100'
          WHEN score >= 80 THEN '80-89'
          WHEN score >= 70 THEN '70-79'
          WHEN score >= 60 THEN '60-69'
          ELSE '0-59'
        END as score_range,
        COUNT(*) as count
      FROM exam_records
      WHERE exam_id = ? AND status = 'graded'
      GROUP BY score_range
      ORDER BY score_range DESC
    `;

    const distribution = await executeQuery(sql, [examId]);
    return distribution;
  }

  // 更新成绩
  async updateGrade(recordId: number, score: number): Promise<void> {
    const sql = `
      UPDATE exam_records
      SET score = ?, status = 'graded'
      WHERE id = ?
    `;

    await executeQuery(sql, [score, recordId]);
  }

  // 批量更新成绩
  async batchUpdateGrades(grades: Array<{ recordId: number; score: number }>): Promise<void> {
    for (const grade of grades) {
      await this.updateGrade(grade.recordId, grade.score);
    }
  }

  // 获取班级成绩排名
  async getClassRanking(classId: number, examId?: number) {
    let whereClause = 's.class_id = ?';
    let queryParams: any[] = [classId];

    if (examId) {
      whereClause += ' AND er.exam_id = ?';
      queryParams.push(examId);
    }

    const sql = `
      SELECT 
        u.id as student_id,
        u.real_name as student_name,
        s.student_id as student_number,
        AVG(er.score) as average_score,
        COUNT(er.id) as exam_count,
        SUM(CASE WHEN er.score >= e.pass_score THEN 1 ELSE 0 END) as passed_count
      FROM users u
      JOIN students s ON u.id = s.user_id
      LEFT JOIN exam_records er ON u.id = er.student_id AND er.status = 'graded'
      LEFT JOIN exams e ON er.exam_id = e.id
      WHERE ${whereClause}
      GROUP BY u.id
      ORDER BY average_score DESC
    `;

    const ranking = await executeQuery(sql, queryParams);
    return ranking;
  }

  // 导出成绩
  async exportGrades(examId: number) {
    const sql = `
      SELECT 
        u.real_name as student_name,
        s.student_id as student_number,
        cl.name as class_name,
        er.score,
        er.submit_time,
        e.title as exam_title,
        e.total_score as exam_total_score,
        CASE WHEN er.score >= e.pass_score THEN '及格' ELSE '不及格' END as pass_status
      FROM exam_records er
      JOIN users u ON er.student_id = u.id
      JOIN exams e ON er.exam_id = e.id
      LEFT JOIN students s ON u.id = s.user_id
      LEFT JOIN classes cl ON s.class_id = cl.id
      WHERE er.exam_id = ? AND er.status = 'graded'
      ORDER BY er.score DESC
    `;

    const grades = await executeQuery(sql, [examId]);
    return grades;
  }
}
