import React from 'react';
import { Row, Col, Card, Statistic, Typography, Space, Avatar } from 'antd';
import {
  UserOutlined,
  BookOutlined,
  FileTextOutlined,
  ExperimentOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import { UserRole } from '../types';

const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
  const { user } = useAuthStore();

  // 模拟统计数据
  const getStatsData = () => {
    if (user?.role === UserRole.ADMIN) {
      return [
        {
          title: '总用户数',
          value: 1234,
          icon: <UserOutlined style={{ color: '#1890ff' }} />,
          color: '#1890ff',
        },
        {
          title: '课程数量',
          value: 56,
          icon: <BookOutlined style={{ color: '#52c41a' }} />,
          color: '#52c41a',
        },
        {
          title: '试题数量',
          value: 2890,
          icon: <FileTextOutlined style={{ color: '#faad14' }} />,
          color: '#faad14',
        },
        {
          title: '考试数量',
          value: 128,
          icon: <ExperimentOutlined style={{ color: '#f5222d' }} />,
          color: '#f5222d',
        },
      ];
    }

    if (user?.role === UserRole.TEACHER) {
      return [
        {
          title: '我的课程',
          value: 8,
          icon: <BookOutlined style={{ color: '#52c41a' }} />,
          color: '#52c41a',
        },
        {
          title: '我的试题',
          value: 156,
          icon: <FileTextOutlined style={{ color: '#faad14' }} />,
          color: '#faad14',
        },
        {
          title: '我的考试',
          value: 12,
          icon: <ExperimentOutlined style={{ color: '#f5222d' }} />,
          color: '#f5222d',
        },
        {
          title: '学生总数',
          value: 320,
          icon: <UserOutlined style={{ color: '#1890ff' }} />,
          color: '#1890ff',
        },
      ];
    }

    // 学生统计
    return [
      {
        title: '已选课程',
        value: 6,
        icon: <BookOutlined style={{ color: '#52c41a' }} />,
        color: '#52c41a',
      },
      {
        title: '已完成考试',
        value: 15,
        icon: <ExperimentOutlined style={{ color: '#f5222d' }} />,
        color: '#f5222d',
      },
      {
        title: '平均成绩',
        value: 85.6,
        suffix: '分',
        icon: <TrophyOutlined style={{ color: '#faad14' }} />,
        color: '#faad14',
      },
      {
        title: '学习时长',
        value: 128,
        suffix: '小时',
        icon: <ClockCircleOutlined style={{ color: '#722ed1' }} />,
        color: '#722ed1',
      },
    ];
  };

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    let timeGreeting = '早上好';
    
    if (hour >= 12 && hour < 18) {
      timeGreeting = '下午好';
    } else if (hour >= 18) {
      timeGreeting = '晚上好';
    }

    const roleText = {
      [UserRole.ADMIN]: '管理员',
      [UserRole.TEACHER]: '老师',
      [UserRole.STUDENT]: '同学',
    }[user?.role || UserRole.STUDENT];

    return `${timeGreeting}，${user?.real_name}${roleText}！`;
  };

  const getRecentActivities = () => {
    if (user?.role === UserRole.ADMIN) {
      return [
        { time: '10分钟前', content: '新用户 张三 注册成功' },
        { time: '30分钟前', content: '李老师 创建了新课程《税法实务》' },
        { time: '1小时前', content: '王老师 发布了期末考试' },
        { time: '2小时前', content: '系统完成了数据备份' },
      ];
    }

    if (user?.role === UserRole.TEACHER) {
      return [
        { time: '5分钟前', content: '学生 张三 提交了《税法基础》考试' },
        { time: '20分钟前', content: '学生 李四 完成了课程学习' },
        { time: '1小时前', content: '您创建了新的试题' },
        { time: '3小时前', content: '您发布了新的考试安排' },
      ];
    }

    return [
      { time: '10分钟前', content: '您完成了《税法实务》第三章学习' },
      { time: '1小时前', content: '您提交了《财务会计》作业' },
      { time: '昨天', content: '您参加了《税法基础》考试' },
      { time: '2天前', content: '您加入了新课程《国际税收》' },
    ];
  };

  return (
    <div>
      {/* 欢迎信息 */}
      <Card style={{ marginBottom: 24 }}>
        <Space size="large" align="center">
          <Avatar size={64} icon={<UserOutlined />} src={user?.avatar} />
          <div>
            <Title level={3} style={{ margin: 0 }}>
              {getWelcomeMessage()}
            </Title>
            <Text type="secondary">
              欢迎使用税务综合实训平台，祝您学习愉快！
            </Text>
          </div>
        </Space>
      </Card>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {getStatsData().map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card>
              <Statistic
                title={stat.title}
                value={stat.value}
                suffix={stat.suffix}
                prefix={stat.icon}
                valueStyle={{ color: stat.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* 最近活动 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="最近活动" size="small">
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {getRecentActivities().map((activity, index) => (
                <div
                  key={index}
                  style={{
                    padding: '12px 0',
                    borderBottom: index < getRecentActivities().length - 1 ? '1px solid #f0f0f0' : 'none',
                  }}
                >
                  <div style={{ marginBottom: 4 }}>{activity.content}</div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {activity.time}
                  </Text>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="快速操作" size="small">
            <Row gutter={[8, 8]}>
              {user?.role === UserRole.ADMIN && (
                <>
                  <Col span={12}>
                    <Card
                      hoverable
                      size="small"
                      style={{ textAlign: 'center', cursor: 'pointer' }}
                      onClick={() => window.location.href = '/users'}
                    >
                      <UserOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                      <div style={{ marginTop: 8 }}>用户管理</div>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card
                      hoverable
                      size="small"
                      style={{ textAlign: 'center', cursor: 'pointer' }}
                      onClick={() => window.location.href = '/courses'}
                    >
                      <BookOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                      <div style={{ marginTop: 8 }}>课程管理</div>
                    </Card>
                  </Col>
                </>
              )}

              {user?.role === UserRole.TEACHER && (
                <>
                  <Col span={12}>
                    <Card
                      hoverable
                      size="small"
                      style={{ textAlign: 'center', cursor: 'pointer' }}
                      onClick={() => window.location.href = '/questions'}
                    >
                      <FileTextOutlined style={{ fontSize: 24, color: '#faad14' }} />
                      <div style={{ marginTop: 8 }}>创建试题</div>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card
                      hoverable
                      size="small"
                      style={{ textAlign: 'center', cursor: 'pointer' }}
                      onClick={() => window.location.href = '/exams'}
                    >
                      <ExperimentOutlined style={{ fontSize: 24, color: '#f5222d' }} />
                      <div style={{ marginTop: 8 }}>创建考试</div>
                    </Card>
                  </Col>
                </>
              )}

              {user?.role === UserRole.STUDENT && (
                <>
                  <Col span={12}>
                    <Card
                      hoverable
                      size="small"
                      style={{ textAlign: 'center', cursor: 'pointer' }}
                      onClick={() => window.location.href = '/courses'}
                    >
                      <BookOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                      <div style={{ marginTop: 8 }}>我的课程</div>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card
                      hoverable
                      size="small"
                      style={{ textAlign: 'center', cursor: 'pointer' }}
                      onClick={() => window.location.href = '/exams'}
                    >
                      <ExperimentOutlined style={{ fontSize: 24, color: '#f5222d' }} />
                      <div style={{ marginTop: 8 }}>我的考试</div>
                    </Card>
                  </Col>
                </>
              )}
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
