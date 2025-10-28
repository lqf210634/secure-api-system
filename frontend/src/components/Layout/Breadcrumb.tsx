import React from 'react';
import { Breadcrumb as AntBreadcrumb, Typography } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { useLocation, Link } from 'react-router-dom';
import { selectBreadcrumbs, selectTheme } from '@/store/slices/appSlice';

const { Text } = Typography;

interface BreadcrumbProps {
  className?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ className }) => {
  const location = useLocation();
  const theme = useSelector(selectTheme);
  const breadcrumbs = useSelector(selectBreadcrumbs);

  // 路径映射配置
  const pathMap: Record<string, string> = {
    '/dashboard': '仪表板',
    '/users': '用户列表',
    '/users/create': '新增用户',
    '/users/roles': '角色管理',
    '/users/permissions': '权限管理',
    '/security/sessions': '会话管理',
    '/security/login-logs': '登录日志',
    '/security/audit-logs': '审计日志',
    '/security/blacklist': '黑名单管理',
    '/api/endpoints': 'API端点',
    '/api/rate-limits': '限流配置',
    '/api/documentation': 'API文档',
    '/analytics/users': '用户统计',
    '/analytics/security': '安全统计',
    '/analytics/api': 'API统计',
    '/analytics/reports': '报表中心',
    '/notifications': '通知中心',
    '/settings/general': '基础设置',
    '/settings/security': '安全设置',
    '/settings/email': '邮件设置',
    '/settings/backup': '备份设置',
    '/profile': '个人资料',
    '/change-password': '修改密码'
  };

  // 生成面包屑项
  const generateBreadcrumbItems = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const items = [
      {
        title: (
          <Link to="/dashboard" style={{ color: theme === 'dark' ? '#fff' : '#000' }}>
            <HomeOutlined style={{ marginRight: 4 }} />
            首页
          </Link>
        )
      }
    ];

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;
      const title = pathMap[currentPath] || segment;

      if (isLast) {
        // 最后一项不可点击
        items.push({
          title: (
            <Text style={{ color: theme === 'dark' ? '#8c8c8c' : '#666' }}>
              {title}
            </Text>
          )
        });
      } else {
        // 中间项可点击
        items.push({
          title: (
            <Link to={currentPath} style={{ color: theme === 'dark' ? '#fff' : '#000' }}>
              {title}
            </Link>
          )
        });
      }
    });

    return items;
  };

  // 如果有自定义面包屑，使用自定义的
  const breadcrumbItems = breadcrumbs.length > 0 
    ? breadcrumbs.map((item, index) => ({
        title: index === breadcrumbs.length - 1 ? (
          <Text style={{ color: theme === 'dark' ? '#8c8c8c' : '#666' }}>
            {item.title}
          </Text>
        ) : item.path ? (
          <Link to={item.path} style={{ color: theme === 'dark' ? '#fff' : '#000' }}>
            {item.title}
          </Link>
        ) : (
          <Text style={{ color: theme === 'dark' ? '#fff' : '#000' }}>
            {item.title}
          </Text>
        )
      }))
    : generateBreadcrumbItems();

  return (
    <div 
      className={`breadcrumb-container ${className || ''}`}
      style={{
        padding: '16px 16px 0',
        background: theme === 'dark' ? '#141414' : '#f5f5f5',
        borderBottom: `1px solid ${theme === 'dark' ? '#303030' : '#f0f0f0'}`
      }}
    >
      <AntBreadcrumb
        items={breadcrumbItems}
        separator="/"
        style={{
          fontSize: '14px',
          color: theme === 'dark' ? '#fff' : '#000'
        }}
      />

      <style jsx>{`
        .breadcrumb-container .ant-breadcrumb {
          margin-bottom: 16px;
        }
        
        .breadcrumb-container .ant-breadcrumb-separator {
          color: ${theme === 'dark' ? '#8c8c8c' : '#999'};
        }
        
        .breadcrumb-container .ant-breadcrumb a {
          text-decoration: none;
          transition: color 0.2s ease-in-out;
        }
        
        .breadcrumb-container .ant-breadcrumb a:hover {
          color: #1890ff !important;
        }
        
        .breadcrumb-container .ant-breadcrumb-link {
          display: flex;
          align-items: center;
        }
      `}</style>
    </div>
  );
};

export default Breadcrumb;