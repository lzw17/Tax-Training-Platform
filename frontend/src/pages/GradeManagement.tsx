import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  Select,
  Card,
  Row,
  Col,
  Statistic,
  Tag,
  Tabs,
  Progress,
} from 'antd';
import {
  SearchOutlined,
  TrophyOutlined,
  ReloadOutlined,
  DownloadOutlined,
  LineChartOutlined,
} from '@ant-design/icons';
import { gradeService } from '../services/gradeService';
import { courseService } from '../services/courseService';
import { examService } from '../services/examService';
import { useAuthStore } from '../store/authStore';

const { Option } = Select;
const { TabPane } = Tabs;

interface GradeRecord {
  id: number;
  student_id: number;
  student_name: string;
  exam_id: number;
  exam_title: string;
  course_name: string;
  score: number;
  total_score: number;
  pass_score: number;
  status: string;
  submitted_at: string;
}

const GradeManagement: React.FC = () => {
  const { user } = useAuthStore();
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchText, setSearchText] = useState('');
  const [courseFilter, setCourseFilter] = useState<number | undefined>();
  const [examFilter, setExamFilter] = useState<number | undefined>();
  const [stats, setStats] = useState({
    total_students: 0,
    average_score: 0,
    pass_rate: 0,
    excellent_rate: 0,
  });

  // 获取课程和考试列表
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesRes, examsRes] = await Promise.all([
          courseService.getCourses({ page: 1, limit: 100 }),
          examService.getExams({ page: 1, limit: 100 }),
        ]);
        
        if (coursesRes.data.data) {
          setCourses(coursesRes.data.data.items);
        }
        if (examsRes.data.data) {
          setExams(examsRes.data.data.items);
        }
      } catch (error) {
        console.error('获取数据失败', error);
      }
    };
    fetchData();
  }, []);

  // 获取成绩列表
  const fetchGrades = async () => {
    setLoading(true);
    try {
      // 根据用户角色调用不同的 API
      let response;
      if (user?.role === 'student') {
        // 学生查看自己的成绩
        response = await gradeService.getStudentGrades(user.id);
      } else {
        // 教师/管理员查看所有成绩
        response = await gradeService.getGrades({
          page: pagination.current,
          limit: pagination.pageSize,
          search: searchText,
          course_id: courseFilter,
          exam_id: examFilter,
        });
      }

      const { data } = response.data;
      if (data) {
        const gradesList = Array.isArray(data) ? data : data.items || [];
        setGrades(gradesList);
        
        if (!Array.isArray(data) && data.total) {
          setPagination(prev => ({
            ...prev,
            total: data.total,
          }));
        }

        // 计算统计数据
        if (gradesList.length > 0) {
          const totalScore = gradesList.reduce((sum, g) => sum + g.score, 0);
          const avgScore = totalScore / gradesList.length;
          const passCount = gradesList.filter(g => g.score >= g.pass_score).length;
          const excellentCount = gradesList.filter(g => g.score >= 90).length;

          setStats({
            total_students: gradesList.length,
            average_score: Math.round(avgScore * 10) / 10,
            pass_rate: Math.round((passCount / gradesList.length) * 100),
            excellent_rate: Math.round((excellentCount / gradesList.length) * 100),
          });
        }
      }
    } catch (error: any) {
      console.error('获取成绩列表失败', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrades();
  }, [pagination.current, pagination.pageSize, searchText, courseFilter, examFilter, user]);

  const handleTableChange = (paginationConfig: any) => {
    setPagination(prev => ({
      ...prev,
      current: paginationConfig.current,
      pageSize: paginationConfig.pageSize,
    }));
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleReset = () => {
    setSearchText('');
    setCourseFilter(undefined);
    setExamFilter(undefined);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleExport = async () => {
    try {
      // TODO: 实现导出功能
      console.log('导出成绩');
    } catch (error) {
      console.error('导出失败', error);
    }
  };

  const getScoreColor = (score: number, totalScore: number) => {
    const percentage = (score / totalScore) * 100;
    if (percentage >= 90) return '#52c41a';
    if (percentage >= 60) return '#1890ff';
    return '#ff4d4f';
  };

  const getStatusTag = (score: number, passScore: number) => {
    if (score >= 90) {
      return <Tag color="success">优秀</Tag>;
    } else if (score >= passScore) {
      return <Tag color="processing">及格</Tag>;
    } else {
      return <Tag color="error">不及格</Tag>;
    }
  };

  const columns = [
    {
      title: '学生姓名',
      dataIndex: 'student_name',
      key: 'student_name',
      width: 120,
    },
    {
      title: '考试名称',
      dataIndex: 'exam_title',
      key: 'exam_title',
      width: 200,
      ellipsis: true,
    },
    {
      title: '课程名称',
      dataIndex: 'course_name',
      key: 'course_name',
      width: 150,
    },
    {
      title: '得分',
      dataIndex: 'score',
      key: 'score',
      width: 100,
      render: (score: number, record: GradeRecord) => (
        <span style={{ color: getScoreColor(score, record.total_score), fontWeight: 'bold' }}>
          {score} / {record.total_score}
        </span>
      ),
      sorter: (a: GradeRecord, b: GradeRecord) => a.score - b.score,
    },
    {
      title: '得分率',
      key: 'percentage',
      width: 150,
      render: (text: any, record: GradeRecord) => {
        const percentage = Math.round((record.score / record.total_score) * 100);
        return (
          <Progress
            percent={percentage}
            size="small"
            strokeColor={getScoreColor(record.score, record.total_score)}
          />
        );
      },
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (text: any, record: GradeRecord) => getStatusTag(record.score, record.pass_score),
    },
    {
      title: '提交时间',
      dataIndex: 'submitted_at',
      key: 'submitted_at',
      width: 180,
      render: (date: string) => date ? new Date(date).toLocaleString() : '-',
    },
  ];

  return (
    <div>
      <Tabs defaultActiveKey="list">
        <TabPane tab="成绩列表" key="list">
          {/* 统计卡片 */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="学生总数"
                  value={stats.total_students}
                  prefix={<TrophyOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="平均分"
                  value={stats.average_score}
                  precision={1}
                  valueStyle={{ color: '#1890ff' }}
                  suffix="分"
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="及格率"
                  value={stats.pass_rate}
                  valueStyle={{ color: '#52c41a' }}
                  suffix="%"
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="优秀率"
                  value={stats.excellent_rate}
                  valueStyle={{ color: '#faad14' }}
                  suffix="%"
                />
              </Card>
            </Col>
          </Row>

          {/* 搜索和操作栏 */}
          {user?.role !== 'student' && (
            <Card style={{ marginBottom: 16 }}>
              <Row gutter={16} align="middle">
                <Col flex="auto">
                  <Space size="middle">
                    <Input
                      placeholder="搜索学生姓名"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      onPressEnter={handleSearch}
                      style={{ width: 200 }}
                      prefix={<SearchOutlined />}
                    />
                    <Select
                      placeholder="选择课程"
                      value={courseFilter}
                      onChange={setCourseFilter}
                      allowClear
                      style={{ width: 150 }}
                    >
                      {courses.map(course => (
                        <Option key={course.id} value={course.id}>{course.name}</Option>
                      ))}
                    </Select>
                    <Select
                      placeholder="选择考试"
                      value={examFilter}
                      onChange={setExamFilter}
                      allowClear
                      style={{ width: 200 }}
                    >
                      {exams.map(exam => (
                        <Option key={exam.id} value={exam.id}>{exam.title}</Option>
                      ))}
                    </Select>
                    <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                      搜索
                    </Button>
                    <Button icon={<ReloadOutlined />} onClick={handleReset}>
                      重置
                    </Button>
                  </Space>
                </Col>
                <Col>
                  <Button icon={<DownloadOutlined />} onClick={handleExport}>
                    导出成绩
                  </Button>
                </Col>
              </Row>
            </Card>
          )}

          {/* 成绩表格 */}
          <Card>
            <Table
              columns={columns}
              dataSource={grades}
              rowKey="id"
              loading={loading}
              pagination={
                user?.role === 'student'
                  ? false
                  : {
                      ...pagination,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                    }
              }
              onChange={handleTableChange}
              scroll={{ x: 1200 }}
            />
          </Card>
        </TabPane>

        <TabPane tab="成绩分析" key="analysis">
          <Card>
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <LineChartOutlined style={{ fontSize: 64, color: '#1890ff' }} />
              <h3 style={{ marginTop: 24 }}>成绩分析图表</h3>
              <p style={{ color: '#999' }}>此功能将在后续版本中实现</p>
            </div>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default GradeManagement;
