import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Typography, Space, Button } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  BookOutlined,
  FileTextOutlined,
  ExperimentOutlined,
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../types';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const DashboardLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  // 检查用户认证状态
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 根据用户角色生成菜单项
  const getMenuItems = () => {
    const baseItems = [
      {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: '仪表板',
      },
    ];

    if (user?.role === UserRole.ADMIN) {
      return [
        ...baseItems,
        {
          key: '/users',
          icon: <UserOutlined />,
          label: '用户管理',
        },
        {
          key: '/courses',
          icon: <BookOutlined />,
          label: '课程管理',
        },
        {
          key: '/questions',
          icon: <FileTextOutlined />,
          label: '试题管理',
        },
        {
          key: '/exams',
          icon: <ExperimentOutlined />,
          label: '考试管理',
        },
        {
          key: '/grades',
          icon: <BarChartOutlined />,
          label: '成绩管理',
        },
        {
          key: '/settings',
          icon: <SettingOutlined />,
          label: '系统设置',
        },
      ];
    }

    if (user?.role === UserRole.TEACHER) {
      return [
        ...baseItems,
        {
          key: '/courses',
          icon: <BookOutlined />,
          label: '我的课程',
        },
        {
          key: '/questions',
          icon: <FileTextOutlined />,
          label: '试题管理',
        },
        {
          key: '/exams',
          icon: <ExperimentOutlined />,
          label: '考试管理',
        },
        {
          key: '/grades',
          icon: <BarChartOutlined />,
          label: '成绩管理',
        },
      ];
    }

    // 学生菜单
    return [
      ...baseItems,
      {
        key: '/courses',
        icon: <BookOutlined />,
        label: '我的课程',
      },
      {
        key: '/exams',
        icon: <ExperimentOutlined />,
        label: '我的考试',
      },
      {
        key: '/grades',
        icon: <BarChartOutlined />,
        label: '我的成绩',
      },
    ];
  };

  // 用户下拉菜单
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  const getRoleText = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return '系统管理员';
      case UserRole.TEACHER:
        return '教师';
      case UserRole.STUDENT:
        return '学生';
      default:
        return '用户';
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="dark"
        width={256}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: collapsed ? 16 : 18,
            fontWeight: 'bold',
          }}
        >
          {collapsed ? '税务' : '税务综合实训平台'}
        </div>
        
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={getMenuItems()}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 256, transition: 'margin-left 0.2s' }}>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,21,41,.08)',
          }}
        >
          <Space>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 16, width: 40, height: 40 }}
            />
            <Title level={4} style={{ margin: 0 }}>
              {getMenuItems().find(item => item.key === location.pathname)?.label || '仪表板'}
            </Title>
          </Space>

          <Dropdown
            menu={{ items: userMenuItems }}
            placement="bottomRight"
            arrow
          >
            <Space style={{ cursor: 'pointer' }}>
              <Avatar
                size="small"
                icon={<UserOutlined />}
                src={user.avatar}
              />
              <span>{user.real_name}</span>
              <span style={{ color: '#666', fontSize: 12 }}>
                ({getRoleText(user.role)})
              </span>
            </Space>
          </Dropdown>
        </Header>

        <Content
          style={{
            margin: '24px',
            padding: '24px',
            background: '#fff',
            borderRadius: '6px',
            minHeight: 'calc(100vh - 112px)',
            overflow: 'auto',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default DashboardLayout;
