import React from 'react';
import { Layout, Typography, Space, Divider } from 'antd';
import { 
  GithubOutlined, 
  MailOutlined, 
  PhoneOutlined,
  CopyrightOutlined,
  HeartFilled
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { selectTheme } from '@/store/slices/appSlice';

const { Footer: AntFooter } = Layout;
const { Text, Link } = Typography;

interface FooterProps {
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ className }) => {
  const theme = useSelector(selectTheme);
  const currentYear = new Date().getFullYear();

  return (
    <AntFooter 
      className={`app-footer ${className || ''}`}
      style={{
        textAlign: 'center',
        padding: '24px 16px',
        background: theme === 'dark' ? '#1f1f1f' : '#ffffff',
        borderTop: `1px solid ${theme === 'dark' ? '#303030' : '#f0f0f0'}`,
        color: theme === 'dark' ? '#8c8c8c' : '#666'
      }}
    >
      {/* 主要信息 */}
      <div className="footer-main" style={{ marginBottom: 16 }}>
        <Space split={<Divider type="vertical" />} size="large">
          <Text style={{ color: theme === 'dark' ? '#8c8c8c' : '#666' }}>
            <CopyrightOutlined style={{ marginRight: 4 }} />
            {currentYear} 安全API系统
          </Text>
          
          <Text style={{ color: theme === 'dark' ? '#8c8c8c' : '#666' }}>
            版本 v1.0.0
          </Text>
          
          <Link 
            href="/privacy" 
            style={{ color: theme === 'dark' ? '#8c8c8c' : '#666' }}
          >
            隐私政策
          </Link>
          
          <Link 
            href="/terms" 
            style={{ color: theme === 'dark' ? '#8c8c8c' : '#666' }}
          >
            服务条款
          </Link>
          
          <Link 
            href="/help" 
            style={{ color: theme === 'dark' ? '#8c8c8c' : '#666' }}
          >
            帮助中心
          </Link>
        </Space>
      </div>

      {/* 联系信息 */}
      <div className="footer-contact" style={{ marginBottom: 16 }}>
        <Space size="large">
          <Text style={{ color: theme === 'dark' ? '#8c8c8c' : '#666' }}>
            <MailOutlined style={{ marginRight: 4 }} />
            support@secure-api.com
          </Text>
          
          <Text style={{ color: theme === 'dark' ? '#8c8c8c' : '#666' }}>
            <PhoneOutlined style={{ marginRight: 4 }} />
            400-123-4567
          </Text>
          
          <Link 
            href="https://github.com/secure-api-system" 
            target="_blank"
            style={{ color: theme === 'dark' ? '#8c8c8c' : '#666' }}
          >
            <GithubOutlined style={{ marginRight: 4 }} />
            GitHub
          </Link>
        </Space>
      </div>

      {/* 底部信息 */}
      <div className="footer-bottom">
        <Text 
          style={{ 
            fontSize: '12px',
            color: theme === 'dark' ? '#595959' : '#999'
          }}
        >
          Made with <HeartFilled style={{ color: '#ff4d4f', margin: '0 4px' }} /> by Security Team
        </Text>
      </div>

      {/* 备案信息（如果需要） */}
      <div className="footer-icp" style={{ marginTop: 8 }}>
        <Text 
          style={{ 
            fontSize: '12px',
            color: theme === 'dark' ? '#595959' : '#999'
          }}
        >
          京ICP备12345678号-1 | 京公网安备11010802012345号
        </Text>
      </div>

      <style jsx>{`
        .app-footer {
          transition: all 0.2s ease-in-out;
        }
        
        .app-footer .ant-typography {
          transition: color 0.2s ease-in-out;
        }
        
        .app-footer a:hover {
          color: #1890ff !important;
        }
        
        .footer-main,
        .footer-contact,
        .footer-bottom,
        .footer-icp {
          transition: all 0.2s ease-in-out;
        }
        
        @media (max-width: 768px) {
          .footer-main .ant-space,
          .footer-contact .ant-space {
            flex-direction: column;
            gap: 8px !important;
          }
          
          .footer-main .ant-divider-vertical {
            display: none;
          }
        }
        
        @media (max-width: 480px) {
          .app-footer {
            padding: 16px 8px;
          }
          
          .footer-main,
          .footer-contact {
            margin-bottom: 12px;
          }
          
          .footer-main .ant-space-item,
          .footer-contact .ant-space-item {
            font-size: 12px;
          }
        }
      `}</style>
    </AntFooter>
  );
};

export default Footer;