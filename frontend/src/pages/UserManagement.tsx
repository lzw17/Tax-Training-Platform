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
import { userService } from '../services/userService';

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

  // 获取用户列表
  const fetchUsers = async (params: {
    page: number;
    limit: number;
    search?: string;
    role?: UserRole;
    status?: UserStatus;
  }) => {
    setLoading(true);
    try {
      const response = await userService.getUsers(params);
      const { data } = response.data;

      if (data) {
        setUsers(data.items);
        setPagination(prev => ({
          ...prev,
          total: data.total,
        }));

        // 计算统计数据
        setStats({
          total_users: data.total,
          total_teachers: data.items.filter(u => u.role === UserRole.TEACHER).length,
          total_students: data.items.filter(u => u.role === UserRole.STUDENT).length,
          active_users: data.items.filter(u => u.status === UserStatus.ACTIVE).length,
        });
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '获取用户列表失败');
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
      await userService.deleteUser(id);
      message.success('删除用户成功');
      fetchUsers({
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText,
        role: roleFilter,
        status: statusFilter,
      });
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除用户失败');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingUser) {
        // 更新用户
        await userService.updateUser(editingUser.id, values);
        message.success('更新用户成功');
      } else {
        // 创建用户
        await userService.createUser(values);
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
    } catch (error: any) {
      message.error(error.response?.data?.message || (editingUser ? '更新用户失败' : '创建用户失败'));
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
