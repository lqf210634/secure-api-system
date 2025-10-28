import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Typography,
  Steps,
  Row,
  Col,
  Alert,
  Progress,
  Space,
  Checkbox,
  Image
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  LockOutlined,
  SafetyOutlined,
  CheckCircleOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  ReloadOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useAuth, useMessage } from '@/hooks';
import { AuthService } from '@/services';
import { RegisterRequest } from '@/types';
import { getDeviceInfo } from '@/utils/storage';
import SecureInput from '@/components/SecureInput';
import PasswordStrength from '@/components/PasswordStrength';

const { Title, Text } = Typography;
const { Step } = Steps;

interface RegisterFormProps {
  onSuccess?: () => void;
  loading?: boolean;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, loading: externalLoading }) => {
  const [form] = Form.useForm();
  const { register, loading: authLoading, error } = useAuth();
  const { message } = useMessage();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [captchaData, setCaptchaData] = useState<{ image: string; token: string } | null>(null);
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [phoneCodeSent, setPhoneCodeSent] = useState(false);
  const [emailCountdown, setEmailCountdown] = useState(0);
  const [phoneCountdown, setPhoneCountdown] = useState(0);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [availabilityCheck, setAvailabilityCheck] = useState({
    username: { checking: false, available: null as boolean | null },
    email: { checking: false, available: null as boolean | null },
    phone: { checking: false, available: null as boolean | null }
  });

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
    getCaptcha();
  }, []);

  // 倒计时效果
  useEffect(() => {
    let emailTimer: NodeJS.Timeout;
    if (emailCountdown > 0) {
      emailTimer = setInterval(() => {
        setEmailCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (emailTimer) clearInterval(emailTimer);
    };
  }, [emailCountdown]);

  useEffect(() => {
    let phoneTimer: NodeJS.Timeout;
    if (phoneCountdown > 0) {
      phoneTimer = setInterval(() => {
        setPhoneCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (phoneTimer) clearInterval(phoneTimer);
    };
  }, [phoneCountdown]);

  // 密码强度检测
  const checkPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^A-Za-z0-9]/.test(password)) strength += 10;
    
    setPasswordStrength(Math.min(strength, 100));
  };

  // 获取密码强度颜色
  const getPasswordStrengthColor = () => {
    if (passwordStrength < 30) return '#ff4d4f';
    if (passwordStrength < 60) return '#faad14';
    if (passwordStrength < 80) return '#1890ff';
    return '#52c41a';
  };

  // 获取密码强度文本
  const getPasswordStrengthText = () => {
    if (passwordStrength < 30) return '弱';
    if (passwordStrength < 60) return '中';
    if (passwordStrength < 80) return '强';
    return '很强';
  };

  // 检查用户名可用性
  const checkUsernameAvailability = async (username: string) => {
    if (!username || username.length < 3) return;
    
    setAvailabilityCheck(prev => ({
      ...prev,
      username: { checking: true, available: null }
    }));

    try {
      const response = await AuthService.checkUsername(username);
      setAvailabilityCheck(prev => ({
        ...prev,
        username: { checking: false, available: response.data }
      }));
    } catch (error) {
      setAvailabilityCheck(prev => ({
        ...prev,
        username: { checking: false, available: null }
      }));
    }
  };

  // 检查邮箱可用性
  const checkEmailAvailability = async (email: string) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    
    setAvailabilityCheck(prev => ({
      ...prev,
      email: { checking: true, available: null }
    }));

    try {
      const response = await AuthService.checkEmailAvailability(email);
      setAvailabilityCheck(prev => ({
        ...prev,
        email: { checking: false, available: response.data }
      }));
    } catch (error) {
      setAvailabilityCheck(prev => ({
        ...prev,
        email: { checking: false, available: null }
      }));
    }
  };

  // 检查手机号可用性
  const checkPhoneAvailability = async (phone: string) => {
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) return;
    
    setAvailabilityCheck(prev => ({
      ...prev,
      phone: { checking: true, available: null }
    }));

    try {
      const response = await AuthService.checkPhoneAvailability(phone);
      setAvailabilityCheck(prev => ({
        ...prev,
        phone: { checking: false, available: response.data }
      }));
    } catch (error) {
      setAvailabilityCheck(prev => ({
        ...prev,
        phone: { checking: false, available: null }
      }));
    }
  };

  // 发送邮箱验证码
  const sendEmailCode = async () => {
    const email = form.getFieldValue('email');
    if (!email) {
      message.error('请先输入邮箱地址');
      return;
    }

    try {
      const response = await AuthService.sendEmailVerificationCode(email, 'REGISTER');
      if (response.success) {
        message.success('验证码已发送到您的邮箱');
        setEmailCodeSent(true);
        setEmailCountdown(60);
      }
    } catch (error: any) {
      message.error(error.message || '发送验证码失败');
    }
  };

  // 发送手机验证码
  const sendPhoneCode = async () => {
    const phone = form.getFieldValue('phone');
    if (!phone) {
      message.error('请先输入手机号码');
      return;
    }

    try {
      const response = await AuthService.sendPhoneVerificationCode(phone, 'REGISTER');
      if (response.success) {
        message.success('验证码已发送到您的手机');
        setPhoneCodeSent(true);
        setPhoneCountdown(60);
      }
    } catch (error: any) {
      message.error(error.message || '发送验证码失败');
    }
  };

  // 下一步
  const nextStep = async () => {
    try {
      if (currentStep === 0) {
        // 验证基本信息
        await form.validateFields(['username', 'email', 'phone', 'captcha']);
        
        // 验证码校验
        if (captchaData) {
          const captcha = form.getFieldValue('captcha');
          const verifyResult = await AuthService.verifyCaptcha(captchaData.token, captcha);
          if (!verifyResult.success || !verifyResult.data) {
            message.error('验证码错误');
            getCaptcha();
            return;
          }
        }

        // 检查可用性
        const { username, email, phone } = availabilityCheck;
        if (username.available === false) {
          message.error('用户名已被使用');
          return;
        }
        if (email.available === false) {
          message.error('邮箱已被使用');
          return;
        }
        if (phone.available === false) {
          message.error('手机号已被使用');
          return;
        }

        setCurrentStep(1);
      } else if (currentStep === 1) {
        // 验证密码
        await form.validateFields(['password', 'confirmPassword']);
        if (passwordStrength < 60) {
          message.error('密码强度不足，请设置更强的密码');
          return;
        }
        setCurrentStep(2);
      }
    } catch (error) {
      // 表单验证失败
    }
  };

  // 上一步
  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  // 处理注册
  const handleRegister = async (values: any) => {
    try {
      const registerData: RegisterRequest = {
        username: values.username,
        email: values.email,
        phone: values.phone,
        password: values.password,
        emailCode: values.emailCode,
        phoneCode: values.phoneCode,
        deviceInfo: getDeviceInfo(),
        clientType: 'WEB',
        captcha: values.captcha,
        captchaToken: captchaData?.token,
        agreeTerms: values.agreeTerms
      };

      await register(registerData);
      
      message.success('注册成功，请登录');
      onSuccess?.();
      
    } catch (error: any) {
      message.error(error.message || '注册失败');
    }
  };

  const steps = [
    {
      title: '基本信息',
      description: '填写账户基本信息'
    },
    {
      title: '设置密码',
      description: '设置安全密码'
    },
    {
      title: '验证身份',
      description: '验证邮箱和手机'
    }
  ];

  return (
    <div className="register-form-container">
      <div className="register-form-header">
        <Title level={2} style={{ textAlign: 'center', marginBottom: 8 }}>
          创建账户
        </Title>
        <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 32 }}>
          加入安全API系统管理平台
        </Text>
      </div>

      {/* 步骤指示器 */}
      <Steps current={currentStep} style={{ marginBottom: 32 }}>
        {steps.map((step, index) => (
          <Step key={index} title={step.title} description={step.description} />
        ))}
      </Steps>

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

      <Form
        form={form}
        name="register"
        onFinish={handleRegister}
        autoComplete="off"
        size="large"
        layout="vertical"
      >
        {/* 第一步：基本信息 */}
        {currentStep === 0 && (
          <>
            {/* 用户名 */}
            <Form.Item
              name="username"
              label="用户名"
              rules={[
                { required: true, message: '请输入用户名' }
              ]}
              hasFeedback
              validateStatus={
                availabilityCheck.username.checking ? 'validating' :
                availabilityCheck.username.available === false ? 'error' :
                availabilityCheck.username.available === true ? 'success' : ''
              }
              help={
                availabilityCheck.username.available === false ? '用户名已被使用' :
                availabilityCheck.username.available === true ? '用户名可用' : ''
              }
            >
              <SecureInput
                inputType="username"
                prefix={<UserOutlined />}
                placeholder="请输入用户名"
                enableXSSProtection={true}
                showSecurityIcon={true}
                onChange={(value, isValid) => {
                  if (value.length >= 3 && isValid) {
                    const timer = setTimeout(() => checkUsernameAvailability(value), 500);
                    return () => clearTimeout(timer);
                  }
                }}
              />
            </Form.Item>

            {/* 邮箱 */}
            <Form.Item
              name="email"
              label="邮箱地址"
              rules={[
                { required: true, message: '请输入邮箱地址' }
              ]}
              hasFeedback
              validateStatus={
                availabilityCheck.email.checking ? 'validating' :
                availabilityCheck.email.available === false ? 'error' :
                availabilityCheck.email.available === true ? 'success' : ''
              }
              help={
                availabilityCheck.email.available === false ? '邮箱已被使用' :
                availabilityCheck.email.available === true ? '邮箱可用' : ''
              }
            >
              <SecureInput
                inputType="email"
                prefix={<MailOutlined />}
                placeholder="请输入邮箱地址"
                enableXSSProtection={true}
                showSecurityIcon={true}
                onChange={(value, isValid) => {
                  if (isValid) {
                    const timer = setTimeout(() => checkEmailAvailability(value), 500);
                    return () => clearTimeout(timer);
                  }
                }}
              />
            </Form.Item>

            {/* 手机号 */}
            <Form.Item
              name="phone"
              label="手机号码"
              rules={[
                { required: true, message: '请输入手机号码' }
              ]}
              hasFeedback
              validateStatus={
                availabilityCheck.phone.checking ? 'validating' :
                availabilityCheck.phone.available === false ? 'error' :
                availabilityCheck.phone.available === true ? 'success' : ''
              }
              help={
                availabilityCheck.phone.available === false ? '手机号已被使用' :
                availabilityCheck.phone.available === true ? '手机号可用' : ''
              }
            >
              <SecureInput
                inputType="phone"
                prefix={<PhoneOutlined />}
                placeholder="请输入手机号码"
                enableXSSProtection={true}
                showSecurityIcon={true}
                onChange={(value, isValid) => {
                  if (isValid) {
                    const timer = setTimeout(() => checkPhoneAvailability(value), 500);
                    return () => clearTimeout(timer);
                  }
                }}
              />
            </Form.Item>

            {/* 验证码 */}
            {captchaData && (
              <Form.Item
                name="captcha"
                label="验证码"
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
                        cursor: 'pointer'
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
          </>
        )}

        {/* 第二步：设置密码 */}
        {currentStep === 1 && (
          <>
            {/* 密码 */}
            <Form.Item
              name="password"
              label="密码"
              rules={[
                { required: true, message: '请输入密码' }
              ]}
            >
              <SecureInput
                inputType="password"
                prefix={<LockOutlined />}
                placeholder="请输入密码"
                enableXSSProtection={true}
                showSecurityIcon={true}
                showPasswordStrength={true}
              />
            </Form.Item>

            {/* 确认密码 */}
            <Form.Item
              name="confirmPassword"
              label="确认密码"
              dependencies={['password']}
              rules={[
                { required: true, message: '请确认密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'));
                  },
                }),
              ]}
            >
              <SecureInput
                inputType="password"
                prefix={<LockOutlined />}
                placeholder="请再次输入密码"
                enableXSSProtection={true}
                showSecurityIcon={true}
              />
            </Form.Item>
          </>
        )}

        {/* 第三步：验证身份 */}
        {currentStep === 2 && (
          <>
            {/* 邮箱验证码 */}
            <Form.Item
              name="emailCode"
              label="邮箱验证码"
              rules={[
                { required: true, message: '请输入邮箱验证码' },
                { len: 6, message: '验证码为6位' }
              ]}
            >
              <Row gutter={8}>
                <Col span={14}>
                  <Input
                    prefix={<MailOutlined />}
                    placeholder="邮箱验证码"
                    maxLength={6}
                  />
                </Col>
                <Col span={10}>
                  <Button
                    block
                    disabled={emailCountdown > 0}
                    onClick={sendEmailCode}
                  >
                    {emailCountdown > 0 ? `${emailCountdown}s` : '发送验证码'}
                  </Button>
                </Col>
              </Row>
            </Form.Item>

            {/* 手机验证码 */}
            <Form.Item
              name="phoneCode"
              label="手机验证码"
              rules={[
                { required: true, message: '请输入手机验证码' },
                { len: 6, message: '验证码为6位' }
              ]}
            >
              <Row gutter={8}>
                <Col span={14}>
                  <Input
                    prefix={<PhoneOutlined />}
                    placeholder="手机验证码"
                    maxLength={6}
                  />
                </Col>
                <Col span={10}>
                  <Button
                    block
                    disabled={phoneCountdown > 0}
                    onClick={sendPhoneCode}
                  >
                    {phoneCountdown > 0 ? `${phoneCountdown}s` : '发送验证码'}
                  </Button>
                </Col>
              </Row>
            </Form.Item>

            {/* 同意条款 */}
            <Form.Item
              name="agreeTerms"
              valuePropName="checked"
              rules={[
                { required: true, message: '请同意用户协议和隐私政策' }
              ]}
            >
              <Checkbox>
                我已阅读并同意
                <Link to="/terms" target="_blank" style={{ marginLeft: 4, marginRight: 4 }}>
                  《用户协议》
                </Link>
                和
                <Link to="/privacy" target="_blank" style={{ marginLeft: 4 }}>
                  《隐私政策》
                </Link>
              </Checkbox>
            </Form.Item>
          </>
        )}

        {/* 操作按钮 */}
        <Form.Item style={{ marginTop: 32 }}>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            {currentStep > 0 && (
              <Button onClick={prevStep}>
                上一步
              </Button>
            )}
            
            {currentStep < 2 ? (
              <Button type="primary" onClick={nextStep} style={{ marginLeft: 'auto' }}>
                下一步
              </Button>
            ) : (
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<CheckCircleOutlined />}
                style={{ marginLeft: 'auto' }}
              >
                完成注册
              </Button>
            )}
          </Space>
        </Form.Item>

        {/* 登录链接 */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Text type="secondary">
            已有账户？
            <Link to="/login" style={{ marginLeft: 8 }}>
              立即登录
            </Link>
          </Text>
        </div>
      </Form>

      <style jsx>{`
        .register-form-container {
          width: 100%;
          max-width: 500px;
          margin: 0 auto;
        }

        .register-form-header {
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

        .ant-btn {
          height: 40px;
          border-radius: 6px;
        }

        .ant-btn-primary {
          background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
          border: none;
          box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
        }

        .ant-btn-primary:hover {
          background: linear-gradient(135deg, #40a9ff 0%, #1890ff 100%);
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(24, 144, 255, 0.4);
        }

        .ant-steps {
          margin-bottom: 32px;
        }

        .ant-progress-line {
          margin-bottom: 0;
        }

        @media (max-width: 480px) {
          .register-form-container {
            padding: 0 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default RegisterForm;