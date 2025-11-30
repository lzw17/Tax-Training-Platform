import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  message,
  Avatar,
  Upload,
  Tabs,
  Row,
  Col,
  Divider,
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  LockOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import type { UploadProps } from 'antd';

const { TabPane } = Tabs;

const Profile: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();

  // 更新个人信息
  const handleUpdateProfile = async (values: any) => {
    try {
      setLoading(true);
      // TODO: 调用 API 更新用户信息
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 更新本地状态
      if (user) {
        updateUser({
          ...user,
          ...values,
        });
      }
      
      message.success('个人信息更新成功');
    } catch (error: any) {
      message.error(error.response?.data?.message || '更新失败');
    } finally {
      setLoading(false);
    }
  };

  // 修改密码
  const handleChangePassword = async (values: any) => {
    try {
      setPasswordLoading(true);
      // TODO: 调用 API 修改密码
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      message.success('密码修改成功');
      passwordForm.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.message || '修改密码失败');
    } finally {
      setPasswordLoading(false);
    }
  };

  // 头像上传配置
  const uploadProps: UploadProps = {
    name: 'file',
    action: '/api/upload/avatar',
    headers: {
      authorization: 'Bearer ' + localStorage.getItem('token'),
    },
    onChange(info) {
      if (info.file.status === 'done') {
        message.success('头像上传成功');
        // TODO: 更新用户头像
      } else if (info.file.status === 'error') {
        message.error('头像上传失败');
      }
    },
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Row gutter={24}>
        {/* 左侧个人信息卡片 */}
        <Col span={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Avatar
                size={120}
                icon={<UserOutlined />}
                src={user?.avatar}
                style={{ marginBottom: 16 }}
              />
              <h2>{user?.real_name}</h2>
              <p style={{ color: '#999' }}>@{user?.username}</p>
              <Divider />
              <div style={{ textAlign: 'left' }}>
                <p>
                  <MailOutlined style={{ marginRight: 8 }} />
                  {user?.email}
                </p>
                <p>
                  <PhoneOutlined style={{ marginRight: 8 }} />
                  {user?.phone || '未设置'}
                </p>
                <p>
                  <UserOutlined style={{ marginRight: 8 }} />
                  角色：{user?.role === 'admin' ? '管理员' : user?.role === 'teacher' ? '教师' : '学生'}
                </p>
              </div>
              <Divider />
              <Upload {...uploadProps} showUploadList={false}>
                <Button icon={<UploadOutlined />} block>
                  更换头像
                </Button>
              </Upload>
            </div>
          </Card>
        </Col>

        {/* 右侧表单区域 */}
        <Col span={16}>
          <Card>
            <Tabs defaultActiveKey="profile">
              <TabPane tab="基本信息" key="profile">
                <Form
                  form={form}
                  layout="vertical"
                  initialValues={{
                    real_name: user?.real_name,
                    email: user?.email,
                    phone: user?.phone,
                  }}
                  onFinish={handleUpdateProfile}
                >
                  <Form.Item
                    name="real_name"
                    label="真实姓名"
                    rules={[{ required: true, message: '请输入真实姓名' }]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="请输入真实姓名" />
                  </Form.Item>

                  <Form.Item
                    name="email"
                    label="邮箱"
                    rules={[
                      { required: true, message: '请输入邮箱' },
                      { type: 'email', message: '请输入有效的邮箱地址' },
                    ]}
                  >
                    <Input prefix={<MailOutlined />} placeholder="请输入邮箱" />
                  </Form.Item>

                  <Form.Item
                    name="phone"
                    label="手机号"
                    rules={[
                      { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' },
                    ]}
                  >
                    <Input prefix={<PhoneOutlined />} placeholder="请输入手机号" />
                  </Form.Item>

                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading}>
                      保存修改
                    </Button>
                  </Form.Item>
                </Form>
              </TabPane>

              <TabPane tab="修改密码" key="password">
                <Form
                  form={passwordForm}
                  layout="vertical"
                  onFinish={handleChangePassword}
                >
                  <Form.Item
                    name="old_password"
                    label="当前密码"
                    rules={[{ required: true, message: '请输入当前密码' }]}
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="请输入当前密码"
                    />
                  </Form.Item>

                  <Form.Item
                    name="new_password"
                    label="新密码"
                    rules={[
                      { required: true, message: '请输入新密码' },
                      { min: 6, message: '密码长度至少6位' },
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="请输入新密码（至少6位）"
                    />
                  </Form.Item>

                  <Form.Item
                    name="confirm_password"
                    label="确认新密码"
                    dependencies={['new_password']}
                    rules={[
                      { required: true, message: '请确认新密码' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('new_password') === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('两次输入的密码不一致'));
                        },
                      }),
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="请再次输入新密码"
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={passwordLoading}>
                      修改密码
                    </Button>
                  </Form.Item>
                </Form>
              </TabPane>

              <TabPane tab="账号信息" key="account">
                <div style={{ padding: '20px 0' }}>
                  <Row gutter={[16, 24]}>
                    <Col span={12}>
                      <div>
                        <div style={{ color: '#999', marginBottom: 8 }}>用户名</div>
                        <div style={{ fontSize: 16 }}>{user?.username}</div>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div>
                        <div style={{ color: '#999', marginBottom: 8 }}>用户ID</div>
                        <div style={{ fontSize: 16 }}>{user?.id}</div>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div>
                        <div style={{ color: '#999', marginBottom: 8 }}>账号状态</div>
                        <div style={{ fontSize: 16 }}>
                          {user?.status === 'active' ? '正常' : '未激活'}
                        </div>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div>
                        <div style={{ color: '#999', marginBottom: 8 }}>注册时间</div>
                        <div style={{ fontSize: 16 }}>
                          {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                        </div>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div>
                        <div style={{ color: '#999', marginBottom: 8 }}>最后更新</div>
                        <div style={{ fontSize: 16 }}>
                          {user?.updated_at ? new Date(user.updated_at).toLocaleDateString() : '-'}
                        </div>
                      </div>
                    </Col>
                  </Row>
                </div>
              </TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Profile;
