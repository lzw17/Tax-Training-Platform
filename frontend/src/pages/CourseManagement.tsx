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
  Popconfirm,
  Card,
  Row,
  Col,
  Statistic,
  DatePicker,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  BookOutlined,
  ReloadOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Course, CourseStatus } from '../types';
import { useAuthStore } from '../store/authStore';
import { courseService } from '../services/courseService';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const CourseManagement: React.FC = () => {
  const { user } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<CourseStatus | undefined>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [form] = Form.useForm();
  const [stats, setStats] = useState({
    total_courses: 0,
    active_courses: 0,
    total_students: 0,
  });

  // 获取课程列表
  const fetchCourses = async (params: {
    page: number;
    limit: number;
    search?: string;
    status?: CourseStatus;
  }) => {
    setLoading(true);
    try {
      const response = await courseService.getCourses(params);
      const { data } = response.data;

      if (data) {
        setCourses(data.items);
        setPagination(prev => ({
          ...prev,
          total: data.total,
        }));

        // 计算统计数据
        setStats({
          total_courses: data.total,
          active_courses: data.items.filter(c => c.status === CourseStatus.ACTIVE).length,
          total_students: data.items.reduce((sum, c) => sum + (c.student_count || 0), 0),
        });
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '获取课程列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses({
      page: pagination.current,
      limit: pagination.pageSize,
      search: searchText,
      status: statusFilter,
    });
  }, [pagination.current, pagination.pageSize, searchText, statusFilter]);

  const handleTableChange = (paginationConfig: any) => {
    setPagination(prev => ({
      ...prev,
      current: paginationConfig.current,
      pageSize: paginationConfig.pageSize,
    }));
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchCourses({
      page: 1,
      limit: pagination.pageSize,
      search: searchText,
      status: statusFilter,
    });
  };

  const handleReset = () => {
    setSearchText('');
    setStatusFilter(undefined);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleAdd = () => {
    setEditingCourse(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Course) => {
    setEditingCourse(record);
    form.setFieldsValue({
      ...record,
      start_date: record.start_date ? dayjs(record.start_date) : null,
      end_date: record.end_date ? dayjs(record.end_date) : null,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await courseService.deleteCourse(id);
      message.success('删除课程成功');
      fetchCourses({
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText,
        status: statusFilter,
      });
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除课程失败');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const courseData = {
        ...values,
        start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : null,
        end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : null,
      };
      
      if (editingCourse) {
        await courseService.updateCourse(editingCourse.id, courseData);
        message.success('更新课程成功');
      } else {
        await courseService.createCourse(courseData);
        message.success('创建课程成功');
      }
      
      setModalVisible(false);
      fetchCourses({
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText,
        status: statusFilter,
      });
    } catch (error: any) {
      message.error(error.response?.data?.message || (editingCourse ? '更新课程失败' : '创建课程失败'));
    }
  };

  const getStatusColor = (status: CourseStatus) => {
    switch (status) {
      case CourseStatus.ACTIVE:
        return 'success';
      case CourseStatus.INACTIVE:
        return 'default';
      case CourseStatus.ARCHIVED:
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: CourseStatus) => {
    switch (status) {
      case CourseStatus.ACTIVE:
        return '进行中';
      case CourseStatus.INACTIVE:
        return '未开始';
      case CourseStatus.ARCHIVED:
        return '已结束';
      default:
        return '未知';
    }
  };

  const columns = [
    {
      title: '课程名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '课程代码',
      dataIndex: 'code',
      key: 'code',
      width: 120,
    },
    {
      title: '授课教师',
      dataIndex: 'teacher_name',
      key: 'teacher_name',
      width: 120,
    },
    {
      title: '学生人数',
      dataIndex: 'student_count',
      key: 'student_count',
      width: 100,
      render: (count: number) => (
        <Space>
          <UserOutlined />
          {count || 0}
        </Space>
      ),
    },
    {
      title: '开始日期',
      dataIndex: 'start_date',
      key: 'start_date',
      width: 120,
      render: (date: string) => date ? new Date(date).toLocaleDateString() : '-',
    },
    {
      title: '结束日期',
      dataIndex: 'end_date',
      key: 'end_date',
      width: 120,
      render: (date: string) => date ? new Date(date).toLocaleDateString() : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: CourseStatus) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (text: any, record: Course) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个课程吗？"
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
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="总课程数"
              value={stats.total_courses}
              prefix={<BookOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="进行中课程"
              value={stats.active_courses}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="总学生数"
              value={stats.total_students}
              valueStyle={{ color: '#1890ff' }}
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
                placeholder="搜索课程名称或代码"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onPressEnter={handleSearch}
                style={{ width: 250 }}
                prefix={<SearchOutlined />}
              />
              <Select
                placeholder="选择状态"
                value={statusFilter}
                onChange={setStatusFilter}
                allowClear
                style={{ width: 120 }}
              >
                <Option value={CourseStatus.ACTIVE}>进行中</Option>
                <Option value={CourseStatus.INACTIVE}>未开始</Option>
                <Option value={CourseStatus.ARCHIVED}>已结束</Option>
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
              添加课程
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 课程表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={courses}
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

      {/* 添加/编辑课程模态框 */}
      <Modal
        title={editingCourse ? '编辑课程' : '添加课程'}
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
            status: CourseStatus.INACTIVE,
          }}
        >
          <Form.Item
            name="name"
            label="课程名称"
            rules={[{ required: true, message: '请输入课程名称' }]}
          >
            <Input placeholder="请输入课程名称" />
          </Form.Item>

          <Form.Item
            name="code"
            label="课程代码"
            rules={[{ required: true, message: '请输入课程代码' }]}
          >
            <Input placeholder="请输入课程代码" />
          </Form.Item>

          <Form.Item
            name="description"
            label="课程描述"
          >
            <TextArea rows={4} placeholder="请输入课程描述" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="start_date"
                label="开始日期"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="end_date"
                label="结束日期"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态">
              <Option value={CourseStatus.ACTIVE}>进行中</Option>
              <Option value={CourseStatus.INACTIVE}>未开始</Option>
              <Option value={CourseStatus.ARCHIVED}>已结束</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CourseManagement;
