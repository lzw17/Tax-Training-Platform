import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  Select,
  Modal,
  Form,
  message,
  Tag,
  Avatar,
  Popconfirm,
  Card,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UserOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { User, UserRole, UserStatus, PaginatedResponse } from '../types';
import { useAuthStore } from '../store/authStore';

const { Option } = Select;

interface UserFormData {
  username: string;
  email: string;
  password?: string;
  real_name: string;
  role: UserRole;
  phone?: string;
  status: UserStatus;
}

const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | undefined>();
  const [statusFilter, setStatusFilter] = useState<UserStatus | undefined>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();
  const [stats, setStats] = useState({
    total_users: 0,
    total_teachers: 0,
    total_students: 0,
    active_users: 0,
  });

  // 模拟API调用
  const fetchUsers = async (params: {
    page: number;
    limit: number;
    search?: string;
    role?: UserRole;
    status?: UserStatus;
  }) => {
    setLoading(true);
    try {
      // 这里应该调用实际的API
      // const response = await userService.getUsers(params);
      
      // 模拟数据
      const mockUsers: User[] = [
        {
          id: 1,
          username: 'admin',
          email: 'admin@example.com',
          real_name: '系统管理员',
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
          phone: '13800138000',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 2,
          username: 'teacher01',
          email: 'teacher01@example.com',
          real_name: '张老师',
          role: UserRole.TEACHER,
          status: UserStatus.ACTIVE,
          phone: '13800138001',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
        {
          id: 3,
          username: 'student01',
          email: 'student01@example.com',
          real_name: '李同学',
          role: UserRole.STUDENT,
          status: UserStatus.ACTIVE,
          phone: '13800138002',
          created_at: '2024-01-03T00:00:00Z',
          updated_at: '2024-01-03T00:00:00Z',
        },
      ];

      const filteredUsers = mockUsers.filter(user => {
        const matchesSearch = !params.search || 
          user.username.includes(params.search) ||
          user.real_name.includes(params.search) ||
          user.email.includes(params.search);
        const matchesRole = !params.role || user.role === params.role;
        const matchesStatus = !params.status || user.status === params.status;
        return matchesSearch && matchesRole && matchesStatus;
      });

      const start = (params.page - 1) * params.limit;
      const end = start + params.limit;
      const paginatedUsers = filteredUsers.slice(start, end);

      setUsers(paginatedUsers);
      setPagination(prev => ({
        ...prev,
        total: filteredUsers.length,
      }));

      // 模拟统计数据
      setStats({
        total_users: mockUsers.length,
        total_teachers: mockUsers.filter(u => u.role === UserRole.TEACHER).length,
        total_students: mockUsers.filter(u => u.role === UserRole.STUDENT).length,
        active_users: mockUsers.filter(u => u.status === UserStatus.ACTIVE).length,
      });
    } catch (error) {
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers({
      page: pagination.current,
      limit: pagination.pageSize,
      search: searchText,
      role: roleFilter,
      status: statusFilter,
    });
  }, [pagination.current, pagination.pageSize, searchText, roleFilter, statusFilter]);

  const handleTableChange = (paginationConfig: any) => {
    setPagination(prev => ({
      ...prev,
      current: paginationConfig.current,
      pageSize: paginationConfig.pageSize,
    }));
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchUsers({
      page: 1,
      limit: pagination.pageSize,
      search: searchText,
      role: roleFilter,
      status: statusFilter,
    });
  };

  const handleReset = () => {
    setSearchText('');
    setRoleFilter(undefined);
    setStatusFilter(undefined);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: User) => {
    setEditingUser(record);
    form.setFieldsValue({
      ...record,
      password: undefined, // 不显示密码
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      // 这里应该调用实际的API
      // await userService.deleteUser(id);
      message.success('删除用户成功');
      fetchUsers({
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText,
        role: roleFilter,
        status: statusFilter,
      });
    } catch (error) {
      message.error('删除用户失败');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingUser) {
        // 更新用户
        // await userService.updateUser(editingUser.id, values);
        message.success('更新用户成功');
      } else {
        // 创建用户
        // await userService.createUser(values);
        message.success('创建用户成功');
      }
      
      setModalVisible(false);
      fetchUsers({
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText,
        role: roleFilter,
        status: statusFilter,
      });
    } catch (error) {
      message.error(editingUser ? '更新用户失败' : '创建用户失败');
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'red';
      case UserRole.TEACHER:
        return 'blue';
      case UserRole.STUDENT:
        return 'green';
      default:
        return 'default';
    }
  };

  const getRoleText = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return '管理员';
      case UserRole.TEACHER:
        return '教师';
      case UserRole.STUDENT:
        return '学生';
      default:
        return '未知';
    }
  };

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case UserStatus.ACTIVE:
        return 'success';
      case UserStatus.INACTIVE:
        return 'warning';
      case UserStatus.SUSPENDED:
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: UserStatus) => {
    switch (status) {
      case UserStatus.ACTIVE:
        return '正常';
      case UserStatus.INACTIVE:
        return '未激活';
      case UserStatus.SUSPENDED:
        return '已停用';
      default:
        return '未知';
    }
  };

  const columns = [
    {
      title: '头像',
      dataIndex: 'avatar',
      key: 'avatar',
      width: 80,
      render: (avatar: string, record: User) => (
        <Avatar
          size={40}
          src={avatar}
          icon={<UserOutlined />}
          style={{ backgroundColor: getRoleColor(record.role) }}
        >
          {!avatar && record.real_name?.charAt(0)}
        </Avatar>
      ),
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
    },
    {
      title: '真实姓名',
      dataIndex: 'real_name',
      key: 'real_name',
      width: 120,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 200,
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role: UserRole) => (
        <Tag color={getRoleColor(role)}>{getRoleText(role)}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: UserStatus) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (text: any, record: User) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          {record.role !== UserRole.ADMIN && (
            <Popconfirm
              title="确定要删除这个用户吗？"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
              >
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总用户数"
              value={stats.total_users}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="教师数量"
              value={stats.total_teachers}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="学生数量"
              value={stats.total_students}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="活跃用户"
              value={stats.active_users}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索和操作栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Space size="middle">
              <Input
                placeholder="搜索用户名、姓名或邮箱"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onPressEnter={handleSearch}
                style={{ width: 250 }}
                prefix={<SearchOutlined />}
              />
              <Select
                placeholder="选择角色"
                value={roleFilter}
                onChange={setRoleFilter}
                allowClear
                style={{ width: 120 }}
              >
                <Option value={UserRole.ADMIN}>管理员</Option>
                <Option value={UserRole.TEACHER}>教师</Option>
                <Option value={UserRole.STUDENT}>学生</Option>
              </Select>
              <Select
                placeholder="选择状态"
                value={statusFilter}
                onChange={setStatusFilter}
                allowClear
                style={{ width: 120 }}
              >
                <Option value={UserStatus.ACTIVE}>正常</Option>
                <Option value={UserStatus.INACTIVE}>未激活</Option>
                <Option value={UserStatus.SUSPENDED}>已停用</Option>
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
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              添加用户
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 用户表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 添加/编辑用户模态框 */}
      <Modal
        title={editingUser ? '编辑用户' : '添加用户'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            role: UserRole.STUDENT,
            status: UserStatus.ACTIVE,
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="username"
                label="用户名"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { min: 3, message: '用户名至少3个字符' },
                ]}
              >
                <Input placeholder="请输入用户名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="real_name"
                label="真实姓名"
                rules={[{ required: true, message: '请输入真实姓名' }]}
              >
                <Input placeholder="请输入真实姓名" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="email"
                label="邮箱"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' },
                ]}
              >
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="手机号"
                rules={[
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' },
                ]}
              >
                <Input placeholder="请输入手机号" />
              </Form.Item>
            </Col>
          </Row>

          {!editingUser && (
            <Form.Item
              name="password"
              label="密码"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6个字符' },
              ]}
            >
              <Input.Password placeholder="请输入密码" />
            </Form.Item>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="role"
                label="角色"
                rules={[{ required: true, message: '请选择角色' }]}
              >
                <Select placeholder="请选择角色">
                  <Option value={UserRole.ADMIN}>管理员</Option>
                  <Option value={UserRole.TEACHER}>教师</Option>
                  <Option value={UserRole.STUDENT}>学生</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="状态"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select placeholder="请选择状态">
                  <Option value={UserStatus.ACTIVE}>正常</Option>
                  <Option value={UserStatus.INACTIVE}>未激活</Option>
                  <Option value={UserStatus.SUSPENDED}>已停用</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;
