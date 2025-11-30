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
  InputNumber,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ExperimentOutlined,
  ReloadOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { Exam, ExamStatus } from '../types';
import { examService } from '../services/examService';
import { courseService } from '../services/courseService';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const ExamManagement: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<ExamStatus | undefined>();
  const [courseFilter, setCourseFilter] = useState<number | undefined>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [form] = Form.useForm();
  const [stats, setStats] = useState({
    total_exams: 0,
    published_exams: 0,
    ongoing_exams: 0,
    finished_exams: 0,
  });

  // 获取课程列表
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await courseService.getCourses({ page: 1, limit: 100 });
        if (response.data.data) {
          setCourses(response.data.data.items);
        }
      } catch (error) {
        console.error('获取课程列表失败', error);
      }
    };
    fetchCourses();
  }, []);

  // 获取考试列表
  const fetchExams = async (params: {
    page: number;
    limit: number;
    search?: string;
    status?: ExamStatus;
    course_id?: number;
  }) => {
    setLoading(true);
    try {
      const response = await examService.getExams(params);
      const { data } = response.data;

      if (data) {
        setExams(data.items);
        setPagination(prev => ({
          ...prev,
          total: data.total,
        }));

        // 计算统计数据
        setStats({
          total_exams: data.total,
          published_exams: data.items.filter(e => e.status === ExamStatus.PUBLISHED).length,
          ongoing_exams: data.items.filter(e => e.status === ExamStatus.ONGOING).length,
          finished_exams: data.items.filter(e => e.status === ExamStatus.FINISHED).length,
        });
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '获取考试列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams({
      page: pagination.current,
      limit: pagination.pageSize,
      search: searchText,
      status: statusFilter,
      course_id: courseFilter,
    });
  }, [pagination.current, pagination.pageSize, searchText, statusFilter, courseFilter]);

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
    setStatusFilter(undefined);
    setCourseFilter(undefined);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleAdd = () => {
    setEditingExam(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Exam) => {
    setEditingExam(record);
    form.setFieldsValue({
      ...record,
      start_time: record.start_time ? dayjs(record.start_time) : null,
      end_time: record.end_time ? dayjs(record.end_time) : null,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await examService.deleteExam(id);
      message.success('删除考试成功');
      fetchExams({
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText,
        status: statusFilter,
        course_id: courseFilter,
      });
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除考试失败');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const examData = {
        ...values,
        start_time: values.start_time ? values.start_time.format('YYYY-MM-DD HH:mm:ss') : null,
        end_time: values.end_time ? values.end_time.format('YYYY-MM-DD HH:mm:ss') : null,
      };
      
      if (editingExam) {
        await examService.updateExam(editingExam.id, examData);
        message.success('更新考试成功');
      } else {
        await examService.createExam(examData);
        message.success('创建考试成功');
      }
      
      setModalVisible(false);
      fetchExams({
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText,
        status: statusFilter,
        course_id: courseFilter,
      });
    } catch (error: any) {
      message.error(error.response?.data?.message || (editingExam ? '更新考试失败' : '创建考试失败'));
    }
  };

  const getStatusColor = (status: ExamStatus) => {
    const colorMap = {
      [ExamStatus.DRAFT]: 'default',
      [ExamStatus.PUBLISHED]: 'blue',
      [ExamStatus.ONGOING]: 'green',
      [ExamStatus.FINISHED]: 'orange',
      [ExamStatus.CANCELLED]: 'red',
    };
    return colorMap[status] || 'default';
  };

  const getStatusText = (status: ExamStatus) => {
    const textMap = {
      [ExamStatus.DRAFT]: '草稿',
      [ExamStatus.PUBLISHED]: '已发布',
      [ExamStatus.ONGOING]: '进行中',
      [ExamStatus.FINISHED]: '已结束',
      [ExamStatus.CANCELLED]: '已取消',
    };
    return textMap[status] || '未知';
  };

  const columns = [
    {
      title: '考试名称',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true,
    },
    {
      title: '所属课程',
      dataIndex: 'course_name',
      key: 'course_name',
      width: 150,
    },
    {
      title: '开始时间',
      dataIndex: 'start_time',
      key: 'start_time',
      width: 180,
      render: (date: string) => date ? new Date(date).toLocaleString() : '-',
    },
    {
      title: '结束时间',
      dataIndex: 'end_time',
      key: 'end_time',
      width: 180,
      render: (date: string) => date ? new Date(date).toLocaleString() : '-',
    },
    {
      title: '时长(分钟)',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
    },
    {
      title: '总分',
      dataIndex: 'total_score',
      key: 'total_score',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: ExamStatus) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (text: any, record: Exam) => (
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
            title="确定要删除这个考试吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
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
        <Col span={6}>
          <Card>
            <Statistic
              title="总考试数"
              value={stats.total_exams}
              prefix={<ExperimentOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="已发布" value={stats.published_exams} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="进行中" value={stats.ongoing_exams} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="已结束" value={stats.finished_exams} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
      </Row>

      {/* 搜索和操作栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Space size="middle">
              <Input
                placeholder="搜索考试名称"
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
                placeholder="选择状态"
                value={statusFilter}
                onChange={setStatusFilter}
                allowClear
                style={{ width: 120 }}
              >
                <Option value={ExamStatus.DRAFT}>草稿</Option>
                <Option value={ExamStatus.PUBLISHED}>已发布</Option>
                <Option value={ExamStatus.ONGOING}>进行中</Option>
                <Option value={ExamStatus.FINISHED}>已结束</Option>
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
              创建考试
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 考试表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={exams}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1400 }}
        />
      </Card>

      {/* 添加/编辑考试模态框 */}
      <Modal
        title={editingExam ? '编辑考试' : '创建考试'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        width={700}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            status: ExamStatus.DRAFT,
            duration: 120,
            total_score: 100,
            pass_score: 60,
          }}
        >
          <Form.Item name="title" label="考试名称" rules={[{ required: true, message: '请输入考试名称' }]}>
            <Input placeholder="请输入考试名称" />
          </Form.Item>

          <Form.Item name="description" label="考试说明">
            <TextArea rows={3} placeholder="请输入考试说明" />
          </Form.Item>

          <Form.Item name="course_id" label="所属课程" rules={[{ required: true, message: '请选择课程' }]}>
            <Select placeholder="请选择课程">
              {courses.map(course => (
                <Option key={course.id} value={course.id}>{course.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="start_time" label="开始时间" rules={[{ required: true, message: '请选择开始时间' }]}>
                <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm:ss" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="end_time" label="结束时间" rules={[{ required: true, message: '请选择结束时间' }]}>
                <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm:ss" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="duration" label="时长(分钟)" rules={[{ required: true, message: '请输入时长' }]}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="total_score" label="总分" rules={[{ required: true, message: '请输入总分' }]}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="pass_score" label="及格分" rules={[{ required: true, message: '请输入及格分' }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
            <Select placeholder="请选择状态">
              <Option value={ExamStatus.DRAFT}>草稿</Option>
              <Option value={ExamStatus.PUBLISHED}>已发布</Option>
              <Option value={ExamStatus.ONGOING}>进行中</Option>
              <Option value={ExamStatus.FINISHED}>已结束</Option>
              <Option value={ExamStatus.CANCELLED}>已取消</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ExamManagement;
