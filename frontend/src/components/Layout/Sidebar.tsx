import React, { useState, useEffect } from 'react';
import { Layout, Menu, Typography } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  SettingOutlined,
  SecurityScanOutlined,
  FileTextOutlined,
  BarChartOutlined,
  BellOutlined,
  KeyOutlined,
  SafetyOutlined,
  AuditOutlined,
  DatabaseOutlined,
  ApiOutlined,
  MonitorOutlined
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { selectSidebarCollapsed, selectTheme } from '@/store/slices/appSlice';
import type { MenuProps } from 'antd';

const { Sider } = Layout;
const { Text } = Typography;

interface SidebarProps {
  className?: string;
}

type MenuItem = Required<MenuProps>['items'][number];

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasRole, isAdmin } = useAuth();
  
  const collapsed = useSelector(selectSidebarCollapsed);
  const theme = useSelector(selectTheme);
  
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [openKeys, setOpenKeys] = useState<string[]>([]);

  // 创建菜单项
  const createMenuItem = (
    key: string,
    label: string,
    icon?: React.ReactNode,
    children?: MenuItem[],
    requiredRoles?: string[]
  ): MenuItem => {
    // 检查权限
    if (requiredRoles && requiredRoles.length > 0) {
      if (!hasRole(requiredRoles)) {
        return null;
      }
    }

    return {
      key,
      icon,
      label,
      children,
      onClick: children ? undefined : () => navigate(key)
    } as MenuItem;
  };

  // 菜单配置
  const menuItems: MenuItem[] = [
    createMenuItem('/dashboard', '仪表板', <DashboardOutlined />),
    
    // 用户管理模块
    createMenuItem('user-management', '用户管理', <TeamOutlined />, [
      createMenuItem('/users', '用户列表', <UserOutlined />),
      createMenuItem('/users/create', '新增用户', <UserOutlined />),
      createMenuItem('/users/roles', '角色管理', <KeyOutlined />, undefined, ['ADMIN']),
      createMenuItem('/users/permissions', '权限管理', <SafetyOutlined />, undefined, ['ADMIN'])
    ]),

    // 安全管理模块
    createMenuItem('security-management', '安全管理', <SecurityScanOutlined />, [
      createMenuItem('/security/sessions', '会话管理', <MonitorOutlined />),
      createMenuItem('/security/login-logs', '登录日志', <AuditOutlined />),
      createMenuItem('/security/audit-logs', '审计日志', <FileTextOutlined />, undefined, ['ADMIN']),
      createMenuItem('/security/blacklist', '黑名单管理', <SafetyOutlined />, undefined, ['ADMIN'])
    ], ['ADMIN', 'SECURITY_ADMIN']),

    // API管理模块
    createMenuItem('api-management', 'API管理', <ApiOutlined />, [
      createMenuItem('/api/endpoints', 'API端点', <DatabaseOutlined />, undefined, ['ADMIN']),
      createMenuItem('/api/rate-limits', '限流配置', <MonitorOutlined />, undefined, ['ADMIN']),
      createMenuItem('/api/documentation', 'API文档', <FileTextOutlined />)
    ], ['ADMIN', 'API_ADMIN']),

    // 统计分析模块
    createMenuItem('analytics', '统计分析', <BarChartOutlined />, [
      createMenuItem('/analytics/users', '用户统计', <UserOutlined />),
      createMenuItem('/analytics/security', '安全统计', <SecurityScanOutlined />, undefined, ['ADMIN']),
      createMenuItem('/analytics/api', 'API统计', <ApiOutlined />, undefined, ['ADMIN']),
      createMenuItem('/analytics/reports', '报表中心', <FileTextOutlined />, undefined, ['ADMIN'])
    ]),

    // 通知管理
    createMenuItem('/notifications', '通知中心', <BellOutlined />),

    // 系统设置（仅管理员可见）
    ...(isAdmin() ? [
      createMenuItem('system-settings', '系统设置', <SettingOutlined />, [
        createMenuItem('/settings/general', '基础设置', <SettingOutlined />),
        createMenuItem('/settings/security', '安全设置', <SecurityScanOutlined />),
        createMenuItem('/settings/email', '邮件设置', <BellOutlined />),
        createMenuItem('/settings/backup', '备份设置', <DatabaseOutlined />)
      ])
    ] : [])
  ].filter(Boolean); // 过滤掉null值

  // 根据当前路径设置选中的菜单项
  useEffect(() => {
    const path = location.pathname;
    setSelectedKeys([path]);

    // 设置展开的菜单项
    const pathSegments = path.split('/').filter(Boolean);
    if (pathSegments.length > 1) {
      const parentKey = pathSegments[0];
      const menuMap: Record<string, string> = {
        'users': 'user-management',
        'security': 'security-management',
        'api': 'api-management',
        'analytics': 'analytics',
        'settings': 'system-settings'
      };
      
      const parentMenuKey = menuMap[parentKey];
      if (parentMenuKey && !collapsed) {
        setOpenKeys(prev => [...new Set([...prev, parentMenuKey])]);
      }
    }
  }, [location.pathname, collapsed]);

  // 处理子菜单展开/收起
  const handleOpenChange = (keys: string[]) => {
    setOpenKeys(keys);
  };

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      width={240}
      collapsedWidth={64}
      className={`app-sidebar ${className || ''}`}
      theme={theme}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 64,
        bottom: 0,
        zIndex: 100,
        borderRight: `1px solid ${theme === 'dark' ? '#303030' : '#f0f0f0'}`
      }}
    >
      {/* Logo区域 */}
      {!collapsed && (
        <div 
          className="sidebar-logo"
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: `1px solid ${theme === 'dark' ? '#303030' : '#f0f0f0'}`,
            background: theme === 'dark' ? '#001529' : '#fff'
          }}
        >
          <Text 
            strong 
            style={{ 
              color: theme === 'dark' ? '#fff' : '#000',
              fontSize: '16px'
            }}
          >
            安全API系统
          </Text>
        </div>
      )}

      {/* 菜单 */}
      <Menu
        theme={theme}
        mode="inline"
        selectedKeys={selectedKeys}
        openKeys={openKeys}
        onOpenChange={handleOpenChange}
        items={menuItems}
        style={{
          border: 'none',
          height: collapsed ? 'calc(100vh - 64px)' : 'calc(100vh - 128px)',
          overflow: 'auto'
        }}
      />

      {/* 底部信息 */}
      {!collapsed && (
        <div 
          className="sidebar-footer"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '16px',
            borderTop: `1px solid ${theme === 'dark' ? '#303030' : '#f0f0f0'}`,
            background: theme === 'dark' ? '#001529' : '#fff',
            textAlign: 'center'
          }}
        >
          <Text 
            type="secondary" 
            style={{ 
              fontSize: '12px',
              color: theme === 'dark' ? '#8c8c8c' : '#999'
            }}
          >
            版本 v1.0.0
          </Text>
        </div>
      )}

      <style jsx>{`
        .app-sidebar .ant-menu-item,
        .app-sidebar .ant-menu-submenu-title {
          height: 48px;
          line-height: 48px;
          margin: 0;
          border-radius: 0;
        }
        
        .app-sidebar .ant-menu-item-selected {
          background-color: ${theme === 'dark' ? '#1890ff' : '#e6f7ff'} !important;
        }
        
        .app-sidebar .ant-menu-item:hover,
        .app-sidebar .ant-menu-submenu-title:hover {
          background-color: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'} !important;
        }
        
        .app-sidebar .ant-menu-submenu-selected > .ant-menu-submenu-title {
          color: ${theme === 'dark' ? '#1890ff' : '#1890ff'} !important;
        }
        
        .app-sidebar::-webkit-scrollbar {
          width: 6px;
        }
        
        .app-sidebar::-webkit-scrollbar-track {
          background: ${theme === 'dark' ? '#001529' : '#f1f1f1'};
        }
        
        .app-sidebar::-webkit-scrollbar-thumb {
          background: ${theme === 'dark' ? '#555' : '#c1c1c1'};
          border-radius: 3px;
        }
        
        .app-sidebar::-webkit-scrollbar-thumb:hover {
          background: ${theme === 'dark' ? '#777' : '#a8a8a8'};
        }
      `}</style>
    </Sider>
  );
};

export default Sidebar;