import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Checkbox,
  Typography,
  Space,
  Divider,
  Alert,
  Image,
  Row,
  Col,
  message
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  SafetyOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { AuthService } from '@/services';
import { LoginRequest } from '@/types';
import { getDeviceInfo } from '@/utils/storage';
import SecureInput from '@/components/SecureInput';

const { Title, Text } = Typography;

interface LoginFormProps {
  onSuccess?: () => void;
  loading?: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, loading: externalLoading }) => {
  const [form] = Form.useForm();
  const { login, loading: authLoading, error } = useAuth();
  
  const [captchaData, setCaptchaData] = useState<{ image: string; token: string } | null>(null);
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimeRemaining, setLockTimeRemaining] = useState(0);

  const loading = authLoading || externalLoading;

  // 获取验证码
  const getCaptcha = async () => {
    try {
      setCaptchaLoading(true);
      const response = await AuthService.getCaptcha();
      if (response.success) {
        setCaptchaData(response.data);
        form.setFieldValue('captcha', '');
      }
    } catch (error) {
      message.error('获取验证码失败');
    } finally {
      setCaptchaLoading(false);
    }
  };

  // 初始化验证码
  useEffect(() => {
    if (loginAttempts >= 3) {
      getCaptcha();
    }
  }, [loginAttempts]);

  // 账户锁定倒计时
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLocked && lockTimeRemaining > 0) {
      timer = setInterval(() => {
        setLockTimeRemaining(prev => {
          if (prev <= 1) {
            setIsLocked(false);
            setLoginAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isLocked, lockTimeRemaining]);

  // 处理登录
  const handleLogin = async (values: any) => {
    try {
      // 验证码校验
      if (captchaData && values.captcha) {
        const verifyResult = await AuthService.verifyCaptcha(captchaData.token, values.captcha);
        if (!verifyResult.success || !verifyResult.data) {
          message.error('验证码错误');
          getCaptcha(); // 刷新验证码
          return;
        }
      }

      const loginData: LoginRequest = {
        username: values.username,
        password: values.password,
        rememberMe: values.rememberMe || false,
        deviceInfo: getDeviceInfo(),
        clientType: 'WEB',
        captcha: values.captcha,
        captchaToken: captchaData?.token
      };

      await login(loginData);
      
      message.success('登录成功');
      setLoginAttempts(0);
      setIsLocked(false);
      onSuccess?.();
      
    } catch (error: any) {
      const attempts = loginAttempts + 1;
      setLoginAttempts(attempts);
      
      // 检查是否需要锁定账户
      if (attempts >= 5) {
        setIsLocked(true);
        setLockTimeRemaining(300); // 5分钟锁定
        message.error('登录失败次数过多，账户已被锁定5分钟');
      } else if (attempts >= 3) {
        getCaptcha(); // 3次失败后显示验证码
        message.error(`登录失败，还有${5 - attempts}次尝试机会`);
      } else {
        message.error(error.message || '登录失败');
      }
    }
  };

  // 格式化锁定时间
  const formatLockTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="login-form-container">
      <div className="login-form-header">
        <Title level={2} style={{ textAlign: 'center', marginBottom: 8 }}>
          欢迎登录
        </Title>
        <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 32 }}>
          安全API系统管理平台
        </Text>
      </div>

      {/* 错误提示 */}
      {error && (
        <Alert
          message={error.message}
          type="error"
          showIcon
          closable
          style={{ marginBottom: 24 }}
        />
      )}

      {/* 账户锁定提示 */}
      {isLocked && (
        <Alert
          message={`账户已被锁定，请在 ${formatLockTime(lockTimeRemaining)} 后重试`}
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {/* 登录尝试提示 */}
      {loginAttempts >= 3 && !isLocked && (
        <Alert
          message={`登录失败 ${loginAttempts} 次，还有 ${5 - loginAttempts} 次尝试机会`}
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      <Form
        form={form}
        name="login"
        onFinish={handleLogin}
        autoComplete="off"
        size="large"
        disabled={isLocked}
      >
        {/* 用户名 */}
        <Form.Item
          name="username"
          rules={[
            { required: true, message: '请输入用户名' }
          ]}
        >
          <SecureInput
            inputType="text"
            prefix={<UserOutlined />}
            placeholder="用户名/邮箱/手机号"
            autoComplete="username"
            enableXSSProtection={true}
            showSecurityIcon={true}
          />
        </Form.Item>

        {/* 密码 */}
        <Form.Item
          name="password"
          rules={[
            { required: true, message: '请输入密码' }
          ]}
        >
          <SecureInput
            inputType="password"
            prefix={<LockOutlined />}
            placeholder="密码"
            autoComplete="current-password"
            enableXSSProtection={true}
            showSecurityIcon={true}
          />
        </Form.Item>

        {/* 验证码 */}
        {loginAttempts >= 3 && captchaData && (
          <Form.Item
            name="captcha"
            rules={[
              { required: true, message: '请输入验证码' },
              { len: 4, message: '验证码为4位' }
            ]}
          >
            <Row gutter={8}>
              <Col span={14}>
                <Input
                  prefix={<SafetyOutlined />}
                  placeholder="验证码"
                  maxLength={4}
                  autoComplete="off"
                />
              </Col>
              <Col span={10}>
                <div 
                  style={{ 
                    height: 40, 
                    border: '1px solid #d9d9d9',
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  onClick={getCaptcha}
                >
                  {captchaLoading ? (
                    <ReloadOutlined spin />
                  ) : (
                    <Image
                      src={`data:image/png;base64,${captchaData.image}`}
                      alt="验证码"
                      preview={false}
                      style={{ height: 38, width: '100%', objectFit: 'contain' }}
                    />
                  )}
                </div>
              </Col>
            </Row>
          </Form.Item>
        )}

        {/* 记住我和忘记密码 */}
        <Form.Item style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Form.Item name="rememberMe" valuePropName="checked" noStyle>
              <Checkbox>记住我</Checkbox>
            </Form.Item>
            <Link to="/forgot-password">
              <Text type="secondary">忘记密码？</Text>
            </Link>
          </div>
        </Form.Item>

        {/* 登录按钮 */}
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            disabled={isLocked}
            block
            style={{ height: 48, fontSize: 16 }}
          >
            {isLocked ? `账户已锁定 (${formatLockTime(lockTimeRemaining)})` : '登录'}
          </Button>
        </Form.Item>

        {/* 分割线 */}
        <Divider>
          <Text type="secondary">其他登录方式</Text>
        </Divider>

        {/* 其他登录方式 */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Space size="large">
            <Button 
              type="text" 
              disabled
              style={{ color: '#8c8c8c' }}
            >
              微信登录
            </Button>
            <Button 
              type="text" 
              disabled
              style={{ color: '#8c8c8c' }}
            >
              钉钉登录
            </Button>
            <Button 
              type="text" 
              disabled
              style={{ color: '#8c8c8c' }}
            >
              LDAP登录
            </Button>
          </Space>
        </div>

        {/* 注册链接 */}
        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">
            还没有账户？
            <Link to="/register" style={{ marginLeft: 8 }}>
              立即注册
            </Link>
          </Text>
        </div>
      </Form>

      <style jsx>{`
        .login-form-container {
          width: 100%;
          max-width: 400px;
          margin: 0 auto;
        }

        .login-form-header {
          margin-bottom: 32px;
        }

        .ant-form-item {
          margin-bottom: 20px;
        }

        .ant-input-affix-wrapper,
        .ant-input-password {
          height: 48px;
          border-radius: 6px;
        }

        .ant-input-affix-wrapper .ant-input {
          font-size: 16px;
        }

        .ant-btn-primary {
          background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
          border: none;
          box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
          transition: all 0.3s ease;
        }

        .ant-btn-primary:hover {
          background: linear-gradient(135deg, #40a9ff 0%, #1890ff 100%);
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(24, 144, 255, 0.4);
        }

        .ant-btn-primary:disabled {
          background: #f5f5f5;
          color: #bfbfbf;
          transform: none;
          box-shadow: none;
        }

        .ant-checkbox-wrapper {
          font-size: 14px;
        }

        .ant-divider-horizontal.ant-divider-with-text {
          margin: 24px 0;
        }

        .ant-alert {
          border-radius: 6px;
        }

        @media (max-width: 480px) {
          .login-form-container {
            padding: 0 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default LoginForm;