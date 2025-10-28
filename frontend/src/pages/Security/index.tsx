import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Switch,
  Form,
  Input,
  Button,
  Space,
  Typography,
  Divider,
  Alert,
  Modal,
  List,
  Tag,
  Statistic,
  Progress,
  Tabs
} from 'antd';
import {
  SafetyOutlined,
  LockOutlined,
  WarningOutlined,
  SettingOutlined,
  KeyOutlined,
  EyeOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import SecurityMonitor from '@/components/SecurityMonitor';
import SecurityAuditLog from '@/components/SecurityAuditLog';
import { SecurityConfig } from '@/config/security';
import { useMessage } from '@/hooks';

const { Title, Text, Paragraph } = Typography;

interface SecuritySettings {
  twoFactorAuth: boolean;
  loginNotifications: boolean;
  sessionTimeout: number;
  passwordExpiry: number;
  ipWhitelist: string[];
  securityQuestions: boolean;
  deviceTracking: boolean;
  suspiciousActivityAlert: boolean;
}

interface LoginSession {
  id: string;
  device: string;
  location: string;
  ip: string;
  loginTime: Date;
  lastActivity: Date;
  current: boolean;
}

/**
 * 安全设置页面
 */
const SecurityPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { message } = useMessage();
  const [settings, setSettings] = useState<SecuritySettings>({
    twoFactorAuth: false,
    loginNotifications: true,
    sessionTimeout: 30,
    passwordExpiry: 90,
    ipWhitelist: [],
    securityQuestions: false,
    deviceTracking: true,
    suspiciousActivityAlert: true
  });
  const [sessions, setSessions] = useState<LoginSession[]>([]);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [sessionsModalVisible, setSessionsModalVisible] = useState(false);

  // 模拟登录会话数据
  const mockSessions: LoginSession[] = [
    {
      id: '1',
      device: 'Chrome on Windows',
      location: '北京, 中国',
      ip: '192.168.1.100',
      loginTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
      lastActivity: new Date(),
      current: true
    },
    {
      id: '2',
      device: 'Safari on iPhone',
      location: '上海, 中国',
      ip: '192.168.1.200',
      loginTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
      lastActivity: new Date(Date.now() - 30 * 60 * 1000),
      current: false
    }
  ];

  useEffect(() => {
    // 加载安全设置
    loadSecuritySettings();
    setSessions(mockSessions);
  }, []);

  const loadSecuritySettings = async () => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      // 设置已在state中初始化
    } catch (error) {
      message.error('加载安全设置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = async (key: keyof SecuritySettings, value: any) => {
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      message.success('设置已更新');
    } catch (error) {
      message.error('更新设置失败');
    }
  };

  const handlePasswordChange = async (values: any) => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('密码修改成功');
      setPasswordModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('密码修改失败');
    } finally {
      setLoading(false);
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      setSessions(sessions.filter(s => s.id !== sessionId));
      message.success('会话已终止');
    } catch (error) {
      message.error('终止会话失败');
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleString('zh-CN');
  };

  const getSecurityScore = () => {
    let score = 0;
    if (settings.twoFactorAuth) score += 25;
    if (settings.loginNotifications) score += 15;
    if (settings.securityQuestions) score += 20;
    if (settings.deviceTracking) score += 15;
    if (settings.suspiciousActivityAlert) score += 15;
    if (settings.sessionTimeout <= 30) score += 10;
    return score;
  };

  const securityScore = getSecurityScore();

  const tabItems = [
    {
      key: 'overview',
      label: '安全概览',
      children: (
        <Row gutter={[24, 24]}>
          {/* 安全监控 */}
          <Col span={24}>
            <SecurityMonitor showDetails autoRefresh style={{ marginBottom: 0 }} />
          </Col>

        {/* 安全评分 */}
        <Col xs={24} lg={8}>
          <Card title="安全评分" size="small">
            <Space direction="vertical" style={{ width: '100%' }} align="center">
              <Progress
                type="circle"
                percent={securityScore}
                format={percent => `${percent}分`}
                strokeColor={securityScore >= 80 ? '#52c41a' : securityScore >= 60 ? '#faad14' : '#ff4d4f'}
              />
              <Text type="secondary">
                {securityScore >= 80 ? '安全等级：优秀' : 
                 securityScore >= 60 ? '安全等级：良好' : '安全等级：需要改进'}
              </Text>
            </Space>
          </Card>
        </Col>

        {/* 快速操作 */}
        <Col xs={24} lg={16}>
          <Card title="快速操作" size="small">
            <Row gutter={16}>
              <Col span={8}>
                <Button
                  type="primary"
                  icon={<KeyOutlined />}
                  block
                  onClick={() => setPasswordModalVisible(true)}
                >
                  修改密码
                </Button>
              </Col>
              <Col span={8}>
                <Button
                  icon={<EyeOutlined />}
                  block
                  onClick={() => setSessionsModalVisible(true)}
                >
                  查看会话
                </Button>
              </Col>
              <Col span={8}>
                <Button
                  icon={<SettingOutlined />}
                  block
                  onClick={() => message.info('功能开发中')}
                >
                  高级设置
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* 安全设置 */}
        <Col span={24}>
          <Card title="安全设置" size="small">
            <Row gutter={[24, 16]}>
              <Col xs={24} lg={12}>
                <Card type="inner" title="身份验证" size="small">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <Text strong>双因素认证</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          增强账户安全性
                        </Text>
                      </div>
                      <Switch
                        checked={settings.twoFactorAuth}
                        onChange={(checked) => handleSettingChange('twoFactorAuth', checked)}
                      />
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <Text strong>安全问题</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          用于账户恢复
                        </Text>
                      </div>
                      <Switch
                        checked={settings.securityQuestions}
                        onChange={(checked) => handleSettingChange('securityQuestions', checked)}
                      />
                    </div>
                  </Space>
                </Card>
              </Col>

              <Col xs={24} lg={12}>
                <Card type="inner" title="通知设置" size="small">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <Text strong>登录通知</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          新设备登录时通知
                        </Text>
                      </div>
                      <Switch
                        checked={settings.loginNotifications}
                        onChange={(checked) => handleSettingChange('loginNotifications', checked)}
                      />
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <Text strong>可疑活动警报</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          检测到异常时通知
                        </Text>
                      </div>
                      <Switch
                        checked={settings.suspiciousActivityAlert}
                        onChange={(checked) => handleSettingChange('suspiciousActivityAlert', checked)}
                      />
                    </div>
                  </Space>
                </Card>
              </Col>

              <Col xs={24} lg={12}>
                <Card type="inner" title="会话管理" size="small">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <Text strong>设备跟踪</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          记录登录设备信息
                        </Text>
                      </div>
                      <Switch
                        checked={settings.deviceTracking}
                        onChange={(checked) => handleSettingChange('deviceTracking', checked)}
                      />
                    </div>
                    
                    <div>
                      <Text strong>会话超时</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        当前设置: {settings.sessionTimeout} 分钟
                      </Text>
                    </div>
                  </Space>
                </Card>
              </Col>

              <Col xs={24} lg={12}>
                <Card type="inner" title="密码策略" size="small">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text strong>密码有效期</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        当前设置: {settings.passwordExpiry} 天
                      </Text>
                    </div>
                    
                    <div>
                      <Text strong>密码强度要求</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        最少8位，包含大小写字母、数字和特殊字符
                      </Text>
                    </div>
                  </Space>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>

          {/* 安全提示 */}
          <Col span={24}>
            <Alert
              message="安全提示"
              description={
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li>定期更换密码，使用强密码</li>
                  <li>启用双因素认证增强安全性</li>
                  <li>不要在公共设备上保存登录状态</li>
                  <li>及时关注登录通知和安全警报</li>
                </ul>
              }
              type="info"
              showIcon
            />
          </Col>
        </Row>
      )
    },
    {
      key: 'audit',
      label: '审计日志',
      children: <SecurityAuditLog showStatistics allowExport />
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <SafetyOutlined /> 安全中心
      </Title>
      <Paragraph type="secondary">
        管理您的账户安全设置，监控安全事件，保护您的数据安全
      </Paragraph>

      <Tabs
        defaultActiveKey="overview"
        items={tabItems}
        size="large"
        style={{ marginTop: 16 }}
      />

      {/* 修改密码弹窗 */}
      <Modal
        title="修改密码"
        open={passwordModalVisible}
        onCancel={() => setPasswordModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handlePasswordChange}
        >
          <Form.Item
            name="currentPassword"
            label="当前密码"
            rules={[{ required: true, message: '请输入当前密码' }]}
          >
            <Input.Password />
          </Form.Item>
          
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 8, message: '密码至少8位' }
            ]}
          >
            <Input.Password />
          </Form.Item>
          
          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                确认修改
              </Button>
              <Button onClick={() => setPasswordModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 登录会话弹窗 */}
      <Modal
        title="登录会话"
        open={sessionsModalVisible}
        onCancel={() => setSessionsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setSessionsModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        <List
          dataSource={sessions}
          renderItem={(session) => (
            <List.Item
              actions={[
                session.current ? (
                  <Tag color="green">当前会话</Tag>
                ) : (
                  <Button
                    type="link"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleTerminateSession(session.id)}
                  >
                    终止
                  </Button>
                )
              ]}
            >
              <List.Item.Meta
                avatar={<LockOutlined style={{ fontSize: 20 }} />}
                title={session.device}
                description={
                  <Space direction="vertical" size="small">
                    <Text type="secondary">位置: {session.location}</Text>
                    <Text type="secondary">IP: {session.ip}</Text>
                    <Text type="secondary">登录时间: {formatTime(session.loginTime)}</Text>
                    <Text type="secondary">最后活动: {formatTime(session.lastActivity)}</Text>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Modal>
    </div>
  );
};

export default SecurityPage;