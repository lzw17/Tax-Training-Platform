-- 税务综合实训平台数据库初始化脚本
-- 创建数据库
CREATE DATABASE IF NOT EXISTS tax_training_platform DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE tax_training_platform;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    email VARCHAR(100) NOT NULL UNIQUE COMMENT '邮箱',
    password VARCHAR(255) NOT NULL COMMENT '密码哈希',
    real_name VARCHAR(50) NOT NULL COMMENT '真实姓名',
    role ENUM('admin', 'teacher', 'student') NOT NULL DEFAULT 'student' COMMENT '用户角色',
    status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active' COMMENT '用户状态',
    avatar VARCHAR(255) COMMENT '头像URL',
    phone VARCHAR(20) COMMENT '手机号码',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 教师扩展信息表
CREATE TABLE IF NOT EXISTS teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE COMMENT '用户ID',
    employee_id VARCHAR(20) NOT NULL UNIQUE COMMENT '工号',
    department VARCHAR(100) NOT NULL COMMENT '院系',
    title VARCHAR(50) COMMENT '职称',
    bio TEXT COMMENT '个人简介',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_employee_id (employee_id),
    INDEX idx_department (department)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='教师信息表';

-- 班级表
CREATE TABLE IF NOT EXISTS classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '班级名称',
    grade VARCHAR(20) NOT NULL COMMENT '年级',
    major VARCHAR(100) NOT NULL COMMENT '专业',
    teacher_id INT COMMENT '班主任ID',
    student_count INT DEFAULT 0 COMMENT '学生数量',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_grade (grade),
    INDEX idx_major (major)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='班级表';

-- 学生扩展信息表
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE COMMENT '用户ID',
    student_id VARCHAR(20) NOT NULL UNIQUE COMMENT '学号',
    class_id INT NOT NULL COMMENT '班级ID',
    grade VARCHAR(20) NOT NULL COMMENT '年级',
    major VARCHAR(100) NOT NULL COMMENT '专业',
    enrollment_year INT NOT NULL COMMENT '入学年份',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE RESTRICT,
    INDEX idx_student_id (student_id),
    INDEX idx_class_id (class_id),
    INDEX idx_grade (grade),
    INDEX idx_enrollment_year (enrollment_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学生信息表';

-- 课程表
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '课程名称',
    description TEXT COMMENT '课程描述',
    teacher_id INT NOT NULL COMMENT '授课教师ID',
    cover_image VARCHAR(255) COMMENT '课程封面',
    credit_hours INT NOT NULL DEFAULT 0 COMMENT '学时',
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active' COMMENT '课程状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='课程表';

-- 课程学生关联表
CREATE TABLE IF NOT EXISTS course_students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL COMMENT '课程ID',
    student_id INT NOT NULL COMMENT '学生ID',
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '选课时间',
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_course_student (course_id, student_id),
    INDEX idx_course_id (course_id),
    INDEX idx_student_id (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='课程学生关联表';

-- 题目表
CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL COMMENT '题目标题',
    content TEXT NOT NULL COMMENT '题目内容',
    type ENUM('single_choice', 'multiple_choice', 'true_false', 'fill_blank', 'essay') NOT NULL COMMENT '题目类型',
    options JSON COMMENT '选项（JSON格式）',
    correct_answer TEXT NOT NULL COMMENT '正确答案',
    explanation TEXT COMMENT '答案解析',
    difficulty TINYINT NOT NULL DEFAULT 1 COMMENT '难度等级(1-5)',
    category VARCHAR(50) NOT NULL COMMENT '题目分类',
    tags JSON COMMENT '标签（JSON格式）',
    creator_id INT NOT NULL COMMENT '创建者ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_type (type),
    INDEX idx_difficulty (difficulty),
    INDEX idx_category (category),
    INDEX idx_creator_id (creator_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='题目表';

-- 考试表
CREATE TABLE IF NOT EXISTS exams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL COMMENT '考试标题',
    description TEXT COMMENT '考试描述',
    course_id INT NOT NULL COMMENT '课程ID',
    creator_id INT NOT NULL COMMENT '创建者ID',
    start_time DATETIME NOT NULL COMMENT '开始时间',
    end_time DATETIME NOT NULL COMMENT '结束时间',
    duration INT NOT NULL COMMENT '考试时长（分钟）',
    total_score DECIMAL(5,2) NOT NULL DEFAULT 100.00 COMMENT '总分',
    pass_score DECIMAL(5,2) NOT NULL DEFAULT 60.00 COMMENT '及格分',
    status ENUM('draft', 'published', 'ongoing', 'finished', 'cancelled') NOT NULL DEFAULT 'draft' COMMENT '考试状态',
    settings JSON COMMENT '考试设置（JSON格式）',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE RESTRICT,
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_course_id (course_id),
    INDEX idx_creator_id (creator_id),
    INDEX idx_status (status),
    INDEX idx_start_time (start_time),
    INDEX idx_end_time (end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='考试表';

-- 考试题目关联表
CREATE TABLE IF NOT EXISTS exam_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL COMMENT '考试ID',
    question_id INT NOT NULL COMMENT '题目ID',
    score DECIMAL(5,2) NOT NULL COMMENT '题目分值',
    order_num INT NOT NULL COMMENT '题目顺序',
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE RESTRICT,
    UNIQUE KEY uk_exam_question (exam_id, question_id),
    INDEX idx_exam_id (exam_id),
    INDEX idx_question_id (question_id),
    INDEX idx_order_num (order_num)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='考试题目关联表';

-- 考试记录表
CREATE TABLE IF NOT EXISTS exam_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL COMMENT '考试ID',
    student_id INT NOT NULL COMMENT '学生ID',
    start_time DATETIME COMMENT '开始答题时间',
    submit_time DATETIME COMMENT '提交时间',
    score DECIMAL(5,2) COMMENT '得分',
    status ENUM('not_started', 'in_progress', 'submitted', 'graded') NOT NULL DEFAULT 'not_started' COMMENT '答题状态',
    answers JSON COMMENT '答案（JSON格式）',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_exam_student (exam_id, student_id),
    INDEX idx_exam_id (exam_id),
    INDEX idx_student_id (student_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='考试记录表';

-- 系统配置表
CREATE TABLE IF NOT EXISTS system_configs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE COMMENT '配置键',
    config_value TEXT COMMENT '配置值',
    description VARCHAR(255) COMMENT '配置描述',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_config_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- 操作日志表
CREATE TABLE IF NOT EXISTS operation_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT COMMENT '操作用户ID',
    action VARCHAR(100) NOT NULL COMMENT '操作动作',
    resource_type VARCHAR(50) COMMENT '资源类型',
    resource_id INT COMMENT '资源ID',
    details JSON COMMENT '操作详情（JSON格式）',
    ip_address VARCHAR(45) COMMENT 'IP地址',
    user_agent TEXT COMMENT '用户代理',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_resource_type (resource_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志表';

-- 插入默认管理员账户
INSERT INTO users (username, email, password, real_name, role, status) VALUES
('admin', 'admin@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '系统管理员', 'admin', 'active');

-- 插入默认系统配置
INSERT INTO system_configs (config_key, config_value, description) VALUES
('system_name', '税务综合实训平台', '系统名称'),
('system_version', '1.0.0', '系统版本'),
('max_file_size', '10485760', '最大文件上传大小（字节）'),
('session_timeout', '3600', '会话超时时间（秒）'),
('password_min_length', '6', '密码最小长度'),
('exam_auto_submit', 'true', '考试时间到自动提交');

-- 创建触发器：更新班级学生数量
DELIMITER //
CREATE TRIGGER update_class_student_count_insert
AFTER INSERT ON students
FOR EACH ROW
BEGIN
    UPDATE classes SET student_count = (
        SELECT COUNT(*) FROM students WHERE class_id = NEW.class_id
    ) WHERE id = NEW.class_id;
END//

CREATE TRIGGER update_class_student_count_update
AFTER UPDATE ON students
FOR EACH ROW
BEGIN
    IF OLD.class_id != NEW.class_id THEN
        UPDATE classes SET student_count = (
            SELECT COUNT(*) FROM students WHERE class_id = OLD.class_id
        ) WHERE id = OLD.class_id;
        
        UPDATE classes SET student_count = (
            SELECT COUNT(*) FROM students WHERE class_id = NEW.class_id
        ) WHERE id = NEW.class_id;
    END IF;
END//

CREATE TRIGGER update_class_student_count_delete
AFTER DELETE ON students
FOR EACH ROW
BEGIN
    UPDATE classes SET student_count = (
        SELECT COUNT(*) FROM students WHERE class_id = OLD.class_id
    ) WHERE id = OLD.class_id;
END//
DELIMITER ;

-- 创建视图：用户详细信息视图
CREATE VIEW user_details AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.real_name,
    u.role,
    u.status,
    u.avatar,
    u.phone,
    u.created_at,
    u.updated_at,
    CASE 
        WHEN u.role = 'teacher' THEN t.employee_id
        WHEN u.role = 'student' THEN s.student_id
        ELSE NULL
    END as employee_student_id,
    CASE 
        WHEN u.role = 'teacher' THEN t.department
        WHEN u.role = 'student' THEN s.major
        ELSE NULL
    END as department_major,
    CASE 
        WHEN u.role = 'teacher' THEN t.title
        WHEN u.role = 'student' THEN c.name
        ELSE NULL
    END as title_class,
    CASE 
        WHEN u.role = 'student' THEN s.grade
        ELSE NULL
    END as grade
FROM users u
LEFT JOIN teachers t ON u.id = t.user_id AND u.role = 'teacher'
LEFT JOIN students s ON u.id = s.user_id AND u.role = 'student'
LEFT JOIN classes c ON s.class_id = c.id;
