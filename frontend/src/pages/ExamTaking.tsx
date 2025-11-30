import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Radio,
  Checkbox,
  Input,
  Space,
  Progress,
  Modal,
  message,
  Statistic,
  Row,
  Col,
  Alert,
  Divider,
} from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { examService } from '../services/examService';
import { QuestionType } from '../types';

const { TextArea } = Input;
const { Countdown } = Statistic;

interface Question {
  id: number;
  title: string;
  content: string;
  type: QuestionType;
  options?: any[];
  score: number;
}

interface Answer {
  question_id: number;
  answer: string;
}

const ExamTaking: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [loading, setLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [examStarted, setExamStarted] = useState(false);
  const [recordId, setRecordId] = useState<number | null>(null);

  // 加载考试信息
  useEffect(() => {
    if (examId) {
      loadExamInfo();
    }
  }, [examId]);

  const loadExamInfo = async () => {
    try {
      const response = await examService.getExamById(Number(examId));
      const { data } = response.data;
      if (data) {
        setExam(data);
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '加载考试信息失败');
      navigate('/dashboard/exams');
    }
  };

  // 开始考试
  const handleStartExam = async () => {
    try {
      setLoading(true);
      const response = await examService.startExam(Number(examId));
      const { data } = response.data;

      // 后端返回结构不严格限定类型，这里使用 any 断言以避免 TS 报错
      const payload: any = data;

      if (payload) {
        setRecordId(payload.record_id);
        setQuestions(payload.questions || []);
        setTimeRemaining(exam.duration * 60); // 转换为秒
        setExamStarted(true);
        message.success('考试已开始，请认真作答');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '开始考试失败');
    } finally {
      setLoading(false);
    }
  };

  // 倒计时结束
  const handleTimeUp = () => {
    Modal.warning({
      title: '考试时间已到',
      content: '系统将自动提交您的答案',
      onOk: () => handleSubmit(true),
    });
  };

  // 保存答案
  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value,
    }));
  };

  // 提交考试
  const handleSubmit = async (autoSubmit = false) => {
    if (!recordId) {
      message.error('考试记录不存在');
      return;
    }

    // 检查是否有未答题目
    const unansweredCount = questions.length - Object.keys(answers).length;
    if (unansweredCount > 0 && !autoSubmit) {
      Modal.confirm({
        title: '确认提交',
        content: `您还有 ${unansweredCount} 道题未作答，确定要提交吗？`,
        onOk: () => submitAnswers(),
      });
    } else {
      submitAnswers();
    }
  };

  const submitAnswers = async () => {
    try {
      setLoading(true);
      const answerList: Answer[] = Object.entries(answers).map(([questionId, answer]) => ({
        question_id: Number(questionId),
        answer,
      }));

      // examService.submitExam 第二个参数是任意 payload，这里传入 { answers }
      await examService.submitExam(recordId!, { answers: answerList as any });
      
      Modal.success({
        title: '提交成功',
        content: '您的答案已提交，请等待成绩公布',
        onOk: () => navigate('/dashboard/grades'),
      });
    } catch (error: any) {
      message.error(error.response?.data?.message || '提交失败');
    } finally {
      setLoading(false);
    }
  };

  // 渲染题目选项
  const renderQuestionInput = (question: Question) => {
    const answer = answers[question.id] || '';

    switch (question.type) {
      case QuestionType.SINGLE_CHOICE:
        return (
          <Radio.Group
            value={answer}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {question.options?.map((option, index) => (
                <Radio key={index} value={option.value} style={{ padding: '8px 0' }}>
                  {option.label}
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        );

      case QuestionType.MULTIPLE_CHOICE:
        return (
          <Checkbox.Group
            value={answer ? answer.split(',') : []}
            onChange={(values) => handleAnswerChange(question.id, values.join(','))}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {question.options?.map((option, index) => (
                <Checkbox key={index} value={option.value} style={{ padding: '8px 0' }}>
                  {option.label}
                </Checkbox>
              ))}
            </Space>
          </Checkbox.Group>
        );

      case QuestionType.TRUE_FALSE:
        return (
          <Radio.Group
            value={answer}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
          >
            <Space>
              <Radio value="true">正确</Radio>
              <Radio value="false">错误</Radio>
            </Space>
          </Radio.Group>
        );

      case QuestionType.FILL_BLANK:
      case QuestionType.ESSAY:
        return (
          <TextArea
            rows={question.type === QuestionType.ESSAY ? 6 : 2}
            value={answer}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="请输入您的答案"
          />
        );

      default:
        return null;
    }
  };

  // 未开始考试的界面
  if (!examStarted) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>
        <Card>
          <div style={{ textAlign: 'center' }}>
            <CheckCircleOutlined style={{ fontSize: 64, color: '#1890ff' }} />
            <h1 style={{ marginTop: 24 }}>{exam?.title}</h1>
            <Divider />
            <Row gutter={[16, 16]} style={{ marginTop: 32 }}>
              <Col span={12}>
                <Statistic title="考试时长" value={exam?.duration} suffix="分钟" />
              </Col>
              <Col span={12}>
                <Statistic title="总分" value={exam?.total_score} suffix="分" />
              </Col>
              <Col span={12}>
                <Statistic title="及格分" value={exam?.pass_score} suffix="分" />
              </Col>
              <Col span={12}>
                <Statistic title="题目数量" value={exam?.question_count || 0} suffix="题" />
              </Col>
            </Row>
            <Alert
              message="考试须知"
              description={
                <div style={{ textAlign: 'left' }}>
                  <p>1. 考试开始后不能暂停，请确保有足够的时间完成考试</p>
                  <p>2. 考试时间到后系统将自动提交答案</p>
                  <p>3. 请认真作答，提交后不能修改</p>
                  <p>4. 请保持网络连接稳定</p>
                </div>
              }
              type="info"
              style={{ marginTop: 32, textAlign: 'left' }}
            />
            <Button
              type="primary"
              size="large"
              onClick={handleStartExam}
              loading={loading}
              style={{ marginTop: 32 }}
            >
              开始考试
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // 考试进行中的界面
  const currentQ = questions[currentQuestion];
  const progress = Math.round(((currentQuestion + 1) / questions.length) * 100);
  const answeredCount = Object.keys(answers).length;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Row gutter={16}>
        {/* 左侧答题区 */}
        <Col span={18}>
          <Card>
            {/* 顶部进度条 */}
            <div style={{ marginBottom: 24 }}>
              <Progress percent={progress} status="active" />
              <div style={{ marginTop: 8, color: '#666' }}>
                第 {currentQuestion + 1} / {questions.length} 题
              </div>
            </div>

            {/* 题目内容 */}
            {currentQ && (
              <div>
                <h3 style={{ fontSize: 18, marginBottom: 16 }}>
                  {currentQuestion + 1}. {currentQ.title}
                  <span style={{ marginLeft: 16, fontSize: 14, color: '#999' }}>
                    ({currentQ.score} 分)
                  </span>
                </h3>
                <div style={{ marginBottom: 24, color: '#666' }}>
                  {currentQ.content}
                </div>
                <div style={{ marginBottom: 32 }}>
                  {renderQuestionInput(currentQ)}
                </div>
              </div>
            )}

            {/* 底部导航按钮 */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button
                disabled={currentQuestion === 0}
                onClick={() => setCurrentQuestion(prev => prev - 1)}
              >
                上一题
              </Button>
              <Space>
                {currentQuestion < questions.length - 1 ? (
                  <Button
                    type="primary"
                    onClick={() => setCurrentQuestion(prev => prev + 1)}
                  >
                    下一题
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    danger
                    onClick={() => handleSubmit()}
                    loading={loading}
                  >
                    提交试卷
                  </Button>
                )}
              </Space>
            </div>
          </Card>
        </Col>

        {/* 右侧信息栏 */}
        <Col span={6}>
          <Card style={{ marginBottom: 16 }}>
            <Statistic
              title="剩余时间"
              value={timeRemaining * 1000}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: timeRemaining < 300 ? '#ff4d4f' : '#1890ff' }}
              formatter={(value) => {
                const seconds = Math.floor(Number(value) / 1000);
                const minutes = Math.floor(seconds / 60);
                const secs = seconds % 60;
                return `${minutes}:${secs.toString().padStart(2, '0')}`;
              }}
            />
          </Card>

          <Card title="答题卡">
            <div style={{ marginBottom: 16 }}>
              <Space>
                <WarningOutlined style={{ color: '#faad14' }} />
                <span>已答 {answeredCount} / {questions.length}</span>
              </Space>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
              {questions.map((q, index) => (
                <Button
                  key={q.id}
                  size="small"
                  type={answers[q.id] ? 'primary' : 'default'}
                  onClick={() => setCurrentQuestion(index)}
                  style={{
                    backgroundColor: currentQuestion === index ? '#52c41a' : undefined,
                    borderColor: currentQuestion === index ? '#52c41a' : undefined,
                  }}
                >
                  {index + 1}
                </Button>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ExamTaking;
