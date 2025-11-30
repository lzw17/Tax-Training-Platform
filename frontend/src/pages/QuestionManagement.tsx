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
  Radio,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  FileTextOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { Question, QuestionType } from '../types';
import { questionService } from '../services/questionService';

const { Option } = Select;
const { TextArea } = Input;

const QuestionManagement: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<QuestionType | undefined>();
  const [difficultyFilter, setDifficultyFilter] = useState<number | undefined>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [form] = Form.useForm();
  const [stats, setStats] = useState({
    total_questions: 0,
    single_choice: 0,
    multiple_choice: 0,
    true_false: 0,
  });

  // 获取试题列表
  const fetchQuestions = async (params: {
    page: number;
    limit: number;
    search?: string;
    type?: QuestionType;
    difficulty?: number;
  }) => {
    setLoading(true);
    try {
      const response = await questionService.getQuestions(params);
      const { data } = response.data;

      if (data) {
        setQuestions(data.items);
        setPagination(prev => ({
          ...prev,
          total: data.total,
        }));

        // 计算统计数据
        setStats({
          total_questions: data.total,
          single_choice: data.items.filter(q => q.type === QuestionType.SINGLE_CHOICE).length,
          multiple_choice: data.items.filter(q => q.type === QuestionType.MULTIPLE_CHOICE).length,
          true_false: data.items.filter(q => q.type === QuestionType.TRUE_FALSE).length,
        });
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '获取试题列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions({
      page: pagination.current,
      limit: pagination.pageSize,
      search: searchText,
      type: typeFilter,
      difficulty: difficultyFilter,
    });
  }, [pagination.current, pagination.pageSize, searchText, typeFilter, difficultyFilter]);

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
    setTypeFilter(undefined);
    setDifficultyFilter(undefined);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleAdd = () => {
    setEditingQuestion(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Question) => {
    setEditingQuestion(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await questionService.deleteQuestion(id);
      message.success('删除试题成功');
      fetchQuestions({
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText,
        type: typeFilter,
        difficulty: difficultyFilter,
      });
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除试题失败');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingQuestion) {
        await questionService.updateQuestion(editingQuestion.id, values);
        message.success('更新试题成功');
      } else {
        await questionService.createQuestion(values);
        message.success('创建试题成功');
      }
      
      setModalVisible(false);
      fetchQuestions({
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText,
        type: typeFilter,
        difficulty: difficultyFilter,
      });
    } catch (error: any) {
      message.error(error.response?.data?.message || (editingQuestion ? '更新试题失败' : '创建试题失败'));
    }
  };

  const getTypeText = (type: QuestionType) => {
    const typeMap = {
      [QuestionType.SINGLE_CHOICE]: '单选题',
      [QuestionType.MULTIPLE_CHOICE]: '多选题',
      [QuestionType.TRUE_FALSE]: '判断题',
      [QuestionType.FILL_BLANK]: '填空题',
      [QuestionType.ESSAY]: '简答题',
    };
    return typeMap[type] || '未知';
  };

  const getDifficultyText = (difficulty: number) => {
    const diffMap: { [key: number]: string } = { 1: '简单', 2: '中等', 3: '困难' };
    return diffMap[difficulty] || '未知';
  };

  const getDifficultyColor = (difficulty: number) => {
    const colorMap: { [key: number]: string } = { 1: 'success', 2: 'warning', 3: 'error' };
    return colorMap[difficulty] || 'default';
  };

  const columns = [
    {
      title: '题目标题',
      dataIndex: 'title',
      key: 'title',
      width: 250,
      ellipsis: true,
    },
    {
      title: '题型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: QuestionType) => <Tag>{getTypeText(type)}</Tag>,
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      width: 80,
      render: (difficulty: number) => (
        <Tag color={getDifficultyColor(difficulty)}>{getDifficultyText(difficulty)}</Tag>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
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
      render: (text: any, record: Question) => (
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
            title="确定要删除这个试题吗？"
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
              title="总题目数"
              value={stats.total_questions}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="单选题" value={stats.single_choice} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="多选题" value={stats.multiple_choice} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="判断题" value={stats.true_false} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
      </Row>

      {/* 搜索和操作栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Space size="middle">
              <Input
                placeholder="搜索题目标题或内容"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onPressEnter={handleSearch}
                style={{ width: 250 }}
                prefix={<SearchOutlined />}
              />
              <Select
                placeholder="选择题型"
                value={typeFilter}
                onChange={setTypeFilter}
                allowClear
                style={{ width: 120 }}
              >
                <Option value={QuestionType.SINGLE_CHOICE}>单选题</Option>
                <Option value={QuestionType.MULTIPLE_CHOICE}>多选题</Option>
                <Option value={QuestionType.TRUE_FALSE}>判断题</Option>
                <Option value={QuestionType.FILL_BLANK}>填空题</Option>
                <Option value={QuestionType.ESSAY}>简答题</Option>
              </Select>
              <Select
                placeholder="选择难度"
                value={difficultyFilter}
                onChange={setDifficultyFilter}
                allowClear
                style={{ width: 120 }}
              >
                <Option value={1}>简单</Option>
                <Option value={2}>中等</Option>
                <Option value={3}>困难</Option>
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
              添加试题
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 试题表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={questions}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 添加/编辑试题模态框 */}
      <Modal
        title={editingQuestion ? '编辑试题' : '添加试题'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        width={800}
        destroyOnClose
      >
        <Form form={form} layout="vertical" initialValues={{ difficulty: 1, type: QuestionType.SINGLE_CHOICE }}>
          <Form.Item name="title" label="题目标题" rules={[{ required: true, message: '请输入题目标题' }]}>
            <Input placeholder="请输入题目标题" />
          </Form.Item>

          <Form.Item name="content" label="题目内容" rules={[{ required: true, message: '请输入题目内容' }]}>
            <TextArea rows={4} placeholder="请输入题目内容" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="type" label="题型" rules={[{ required: true, message: '请选择题型' }]}>
                <Select placeholder="请选择题型">
                  <Option value={QuestionType.SINGLE_CHOICE}>单选题</Option>
                  <Option value={QuestionType.MULTIPLE_CHOICE}>多选题</Option>
                  <Option value={QuestionType.TRUE_FALSE}>判断题</Option>
                  <Option value={QuestionType.FILL_BLANK}>填空题</Option>
                  <Option value={QuestionType.ESSAY}>简答题</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="difficulty" label="难度" rules={[{ required: true, message: '请选择难度' }]}>
                <Radio.Group>
                  <Radio value={1}>简单</Radio>
                  <Radio value={2}>中等</Radio>
                  <Radio value={3}>困难</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="category" label="分类">
            <Input placeholder="请输入分类" />
          </Form.Item>

          <Form.Item name="correct_answer" label="正确答案" rules={[{ required: true, message: '请输入正确答案' }]}>
            <Input placeholder="请输入正确答案" />
          </Form.Item>

          <Form.Item name="explanation" label="答案解析">
            <TextArea rows={3} placeholder="请输入答案解析" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default QuestionManagement;
