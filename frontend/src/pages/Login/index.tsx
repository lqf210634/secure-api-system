import React, { useEffect } from 'react';
import { Layout, Row, Col, Card, Typography, Space, Divider } from 'antd';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import {
  SafetyOutlined,
  ApiOutlined,
  MonitorOutlined,
  LockOutlined,
  CloudServerOutlined
} from '@ant-design/icons';
import { useAuth } from '@/hooks';
import LoginForm from './LoginForm';
import LoginHint from '@/components/LoginHint';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const LoginPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // 如果已登录，重定向到目标页面或首页
  if (isAuthenticated) {
    const from = (location.state as any)?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  const handleLoginSuccess = () => {
    const from = (location.state as any)?.from?.pathname || '/dashboard';
    navigate(from, { replace: true });
  };

  const features = [
    {
      icon: <SafetyOutlined style={{ fontSize: 24, color: '#1890ff' }} />,
      title: '安全防护',
      description: '多层安全防护机制，保障系统安全'
    },
    {
      icon: <ApiOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
      title: 'API管理',
      description: '完善的API接口管理和监控'
    },
    {
      icon: <MonitorOutlined style={{ fontSize: 24, color: '#722ed1' }} />,
      title: '实时监控',
      description: '系统运行状态实时监控预警'
    },
    {
      icon: <SafetyOutlined style={{ fontSize: 24, color: '#fa8c16' }} />,
      title: '权限控制',
      description: '细粒度的权限控制和管理'
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
                  安全API系统
                </Title>
                <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 18 }}>
                  企业级安全API管理平台
                </Text>
              </div>

              {/* 特性介绍 */}
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

              {/* 系统信息 */}
              <div style={{ marginTop: 48, opacity: 0.8 }}>
                <Paragraph style={{ color: 'rgba(255, 255, 255, 0.6)', margin: 0 }}>
                  <LockOutlined style={{ marginRight: 8 }} />
                  采用最新安全技术，保障您的数据安全
                </Paragraph>
              </div>
            </div>
          </Col>

          {/* 右侧：登录表单 */}
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
              <LoginHint />
              <LoginForm onSuccess={handleLoginSuccess} />
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

        /* 背景动画 */
        body {
          background-attachment: fixed;
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

export default LoginPage;