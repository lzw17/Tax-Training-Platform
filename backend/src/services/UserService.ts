import { executeQuery } from '../config/database';
import { User, RegisterRequest, PaginationParams, PaginatedResponse, UserRole } from '../types';

export class UserService {
  // 根据用户名查找用户
  async findByUsername(username: string): Promise<User | null> {
    const sql = 'SELECT * FROM users WHERE username = ?';
    const users = await executeQuery<User>(sql, [username]);
    return users.length > 0 ? users[0] ?? null : null;
  }

  // 根据邮箱查找用户
  async findByEmail(email: string): Promise<User | null> {
    const sql = 'SELECT * FROM users WHERE email = ?';
    const users = await executeQuery<User>(sql, [email]);
    return users.length > 0 ? users[0] ?? null : null;
  }

  // 根据ID查找用户
  async findById(id: number): Promise<User | null> {
    const sql = 'SELECT * FROM users WHERE id = ?';
    const users = await executeQuery<User>(sql, [id]);
    return users.length > 0 ? users[0] ?? null : null;
  }

  // 创建用户
  async create(userData: RegisterRequest & { password: string }): Promise<User> {
    const sql = `
      INSERT INTO users (username, email, password, real_name, role, phone, status)
      VALUES (?, ?, ?, ?, ?, ?, 'active')
    `;
    
    const result = await executeQuery(sql, [
      userData.username,
      userData.email,
      userData.password,
      userData.real_name,
      userData.role,
      userData.phone || null
    ]);

    const insertId = (result as any).insertId;
    const newUser = await this.findById(insertId);
    
    if (!newUser) {
      throw new Error('创建用户失败');
    }

    return newUser;
  }

  // 更新用户信息
  async update(id: number, userData: Partial<User>): Promise<User> {
    const fields = [];
    const values = [];

    if (userData.real_name !== undefined) {
      fields.push('real_name = ?');
      values.push(userData.real_name);
    }
    if (userData.email !== undefined) {
      fields.push('email = ?');
      values.push(userData.email);
    }
    if (userData.phone !== undefined) {
      fields.push('phone = ?');
      values.push(userData.phone);
    }
    if (userData.avatar !== undefined) {
      fields.push('avatar = ?');
      values.push(userData.avatar);
    }
    if (userData.status !== undefined) {
      fields.push('status = ?');
      values.push(userData.status);
    }

    if (fields.length === 0) {
      throw new Error('没有要更新的字段');
    }

    fields.push('updated_at = NOW()');
    values.push(id);

    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    await executeQuery(sql, values);

    const updatedUser = await this.findById(id);
    if (!updatedUser) {
      throw new Error('更新用户失败');
    }

    return updatedUser;
  }

  // 更新密码
  async updatePassword(id: number, hashedPassword: string): Promise<void> {
    const sql = 'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?';
    await executeQuery(sql, [hashedPassword, id]);
  }

  // 删除用户
  async delete(id: number): Promise<void> {
    const sql = 'DELETE FROM users WHERE id = ?';
    await executeQuery(sql, [id]);
  }

  // 获取用户列表（分页）
  async findAll(params: PaginationParams & { 
    role?: UserRole; 
    status?: string; 
    search?: string; 
  }): Promise<PaginatedResponse<User>> {
    const { page = 1, limit = 10, role, status, search, sort = 'created_at', order = 'desc' } = params;
    const offset = (page - 1) * limit;

    // 构建WHERE条件
    const conditions = [];
    const queryParams = [];

    if (role) {
      conditions.push('role = ?');
      queryParams.push(role);
    }

    if (status) {
      conditions.push('status = ?');
      queryParams.push(status);
    }

    if (search) {
      conditions.push('(username LIKE ? OR real_name LIKE ? OR email LIKE ?)');
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 获取总数
    const countSql = `SELECT COUNT(*) as total FROM users ${whereClause}`;
    const countResult = await executeQuery<{ total: number }>(countSql, queryParams);
    const total = countResult[0]?.total ?? 0;

    // 获取数据
    const dataSql = `
      SELECT id, username, email, real_name, role, status, avatar, phone, created_at, updated_at
      FROM users 
      ${whereClause}
      ORDER BY ${sort} ${order.toUpperCase()}
      LIMIT ? OFFSET ?
    `;
    
    const items = await executeQuery<User>(dataSql, [...queryParams, limit, offset]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // 获取教师列表
  async findTeachers(params: PaginationParams): Promise<PaginatedResponse<User>> {
    return this.findAll({ ...params, role: UserRole.TEACHER });
  }

  // 获取学生列表
  async findStudents(params: PaginationParams & { class_id?: number }): Promise<PaginatedResponse<User>> {
    const { page = 1, limit = 10, class_id, sort = 'created_at', order = 'desc' } = params;
    const offset = (page - 1) * limit;

    let whereClause = "WHERE u.role = 'student'";
    const queryParams = [];

    if (class_id) {
      whereClause += ' AND s.class_id = ?';
      queryParams.push(class_id);
    }

    // 获取总数
    const countSql = `
      SELECT COUNT(*) as total 
      FROM users u 
      LEFT JOIN students s ON u.id = s.user_id 
      ${whereClause}
    `;
    const countResult = await executeQuery<{ total: number }>(countSql, queryParams);
    const total = countResult[0]?.total ?? 0;

    // 获取数据
    const dataSql = `
      SELECT u.id, u.username, u.email, u.real_name, u.role, u.status, u.avatar, u.phone, 
             u.created_at, u.updated_at, s.student_id, s.class_id, s.grade, s.major
      FROM users u 
      LEFT JOIN students s ON u.id = s.user_id 
      ${whereClause}
      ORDER BY u.${sort} ${order.toUpperCase()}
      LIMIT ? OFFSET ?
    `;
    
    const items = await executeQuery<User>(dataSql, [...queryParams, limit, offset]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // 检查用户是否存在
  async exists(id: number): Promise<boolean> {
    const sql = 'SELECT 1 FROM users WHERE id = ?';
    const result = await executeQuery(sql, [id]);
    return result.length > 0;
  }

  // 获取用户统计信息
  async getStats(): Promise<{
    total_users: number;
    total_teachers: number;
    total_students: number;
    active_users: number;
  }> {
    const sql = `
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN role = 'teacher' THEN 1 ELSE 0 END) as total_teachers,
        SUM(CASE WHEN role = 'student' THEN 1 ELSE 0 END) as total_students,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_users
      FROM users
    `;
    
    const result = await executeQuery<{
      total_users: number;
      total_teachers: number;
      total_students: number;
      active_users: number;
    }>(sql);

    return (
      result[0] ?? {
        total_users: 0,
        total_teachers: 0,
        total_students: 0,
        active_users: 0
      }
    );
  }
}
