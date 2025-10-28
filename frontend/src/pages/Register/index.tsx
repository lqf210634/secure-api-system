import React from 'react';
import { Layout, Row, Col, Card, Typography, Space } from 'antd';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import {
  UserAddOutlined,
  SafetyOutlined,
  CheckCircleOutlined,
  CloudServerOutlined,
  UserOutlined,
  LockOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  ExclamationCircleOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import { useAuth } from '@/hooks';
import RegisterForm from './RegisterForm';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const RegisterPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // 如果已登录，重定向到首页
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleRegisterSuccess = () => {
    navigate('/login', { 
      replace: true,
      state: { message: '注册成功，请登录' }
    });
  };

  const features = [
    {
      icon: <UserAddOutlined style={{ fontSize: 24, color: '#1890ff' }} />,
      title: '快速注册',
      description: '简单几步即可完成账户创建'
    },
    {
      icon: <SafetyOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
      title: '安全验证',
      description: '多重验证确保账户安全'
    },
    {
      icon: <SafetyOutlined style={{ fontSize: 24, color: '#722ed1' }} />,
      title: '隐私保护',
      description: '严格保护您的个人信息'
    },
    {
      icon: <CheckCircleOutlined style={{ fontSize: 24, color: '#fa8c16' }} />,
      title: '即时生效',
      description: '注册完成即可使用所有功能'
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Content style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <Row gutter={[48, 32]} style={{ width: '100%', maxWidth: 1200 }} align="middle">
          {/* 左侧：品牌信息和特性介绍 */}
          <Col xs={24} lg={12} style={{ textAlign: 'center' }}>
            <div style={{ color: 'white', marginBottom: 48 }}>
              {/* Logo和标题 */}
              <div style={{ marginBottom: 32 }}>
                <div 
                  style={{ 
                    width: 80, 
                    height: 80, 
                    background: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                  }}
                >
                  <CloudServerOutlined style={{ fontSize: 36, color: 'white' }} />
                </div>
                <Title level={1} style={{ color: 'white', marginBottom: 8, fontSize: 36 }}>
                  加入我们
                </Title>
                <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 18 }}>
                  开启您的安全API管理之旅
                </Text>
              </div>

              {/* 注册优势 */}
              <div style={{ marginBottom: 32 }}>
                <Title level={3} style={{ color: 'white', marginBottom: 24 }}>
                  为什么选择我们？
                </Title>
                <Row gutter={[24, 24]}>
                  {features.map((feature, index) => (
                    <Col xs={12} sm={6} key={index}>
                      <div 
                        style={{ 
                          background: 'rgba(255, 255, 255, 0.1)',
                          borderRadius: 12,
                          padding: '24px 16px',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer'
                        }}
                        className="feature-card"
                      >
                        <div style={{ marginBottom: 12 }}>
                          {feature.icon}
                        </div>
                        <Title level={5} style={{ color: 'white', marginBottom: 8 }}>
                          {feature.title}
                        </Title>
                        <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}>
                          {feature.description}
                        </Text>
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>

              {/* 注册流程 */}
              <div style={{ opacity: 0.8 }}>
                <Title level={4} style={{ color: 'white', marginBottom: 16 }}>
                  注册流程
                </Title>
                <Space direction="vertical" size="small">
                  <Text style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    1. 填写基本信息
                  </Text>
                  <Text style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    2. 设置安全密码
                  </Text>
                  <Text style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    3. 验证邮箱和手机
                  </Text>
                  <Text style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    4. 完成注册，开始使用
                  </Text>
                </Space>
              </div>
            </div>
          </Col>

          {/* 右侧：注册表单 */}
          <Col xs={24} lg={12}>
            <Card
              style={{
                borderRadius: 16,
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                border: 'none',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)'
              }}
              styles={{ body: { padding: '48px 40px' } }}
            >
              <RegisterForm onSuccess={handleRegisterSuccess} />
            </Card>
          </Col>
        </Row>
      </Content>

      <style jsx global>{`
        .feature-card:hover {
          background: rgba(255, 255, 255, 0.15) !important;
          transform: translateY(-2px);
        }

        .ant-card {
          transition: all 0.3s ease;
        }

        .ant-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15) !important;
        }

        /* 响应式设计 */
        @media (max-width: 992px) {
          .ant-card {
            margin-top: 32px;
          }
        }

        @media (max-width: 768px) {
          .ant-card {
            margin: 16px;
            border-radius: 12px;
          }
          
          .ant-card .ant-card-body {
            padding: 32px 24px !important;
          }
        }

        @media (max-width: 480px) {
          .ant-card .ant-card-body {
            padding: 24px 20px !important;
          }
        }

        /* 动画效果 */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .ant-card {
          animation: fadeInUp 0.6s ease-out;
        }

        .feature-card {
          animation: fadeInUp 0.6s ease-out;
        }

        .feature-card:nth-child(1) { animation-delay: 0.1s; }
        .feature-card:nth-child(2) { animation-delay: 0.2s; }
        .feature-card:nth-child(3) { animation-delay: 0.3s; }
        .feature-card:nth-child(4) { animation-delay: 0.4s; }

        /* 步骤指示器样式优化 */
        .ant-steps-item-process .ant-steps-item-icon {
          background: #1890ff;
          border-color: #1890ff;
        }

        .ant-steps-item-finish .ant-steps-item-icon {
          background: #52c41a;
          border-color: #52c41a;
        }

        .ant-steps-item-wait .ant-steps-item-icon {
          background: #f5f5f5;
          border-color: #d9d9d9;
        }

        /* 进度条样式 */
        .ant-progress-bg {
          transition: all 0.3s ease;
        }

        /* 表单验证状态样式 */
        .ant-form-item-has-success .ant-input-affix-wrapper {
          border-color: #52c41a;
        }

        .ant-form-item-has-error .ant-input-affix-wrapper {
          border-color: #ff4d4f;
        }

        .ant-form-item-is-validating .ant-input-affix-wrapper {
          border-color: #1890ff;
        }

        /* 按钮禁用状态 */
        .ant-btn:disabled {
          background: #f5f5f5 !important;
          border-color: #d9d9d9 !important;
          color: #bfbfbf !important;
          cursor: not-allowed;
        }

        /* 验证码图片样式 */
        .ant-image {
          border-radius: 4px;
          overflow: hidden;
        }

        /* 滚动条样式 */
        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </Layout>
  );
};

export default RegisterPage;