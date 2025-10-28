import React, { useState } from 'react';
import {
  Layout,
  Button,
  Dropdown,
  Avatar,
  Badge,
  Space,
  Typography,
  Tooltip,
  Switch,
  Divider,
  Modal
} from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  LockOutlined,
  EditOutlined,
  SunOutlined,
  MoonOutlined,
  GlobalOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useAuth, useMessage } from '@/hooks';
import { 
  selectSidebarCollapsed, 
  selectTheme, 
  selectLanguage,
  toggleSidebar,
  toggleTheme,
  setLanguageMode
} from '@/store/slices/appSlice';
import type { MenuProps } from 'antd';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

interface HeaderProps {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ className }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, logout, getDisplayName } = useAuth();
  const { message } = useMessage();
  
  const collapsed = useSelector(selectSidebarCollapsed);
  const theme = useSelector(selectTheme);
  const language = useSelector(selectLanguage);
  
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [notificationCount] = useState(3); // 模拟通知数量

  // 切换侧边栏
  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
  };

  // 切换主题
  const handleToggleTheme = () => {
    dispatch(toggleTheme());
  };

  // 切换语言
  const handleLanguageChange = (lang: string) => {
    dispatch(setLanguageMode(lang as 'zh-CN' | 'en-US'));
    message.success(`语言已切换为${lang === 'zh-CN' ? '中文' : 'English'}`);
  };

  // 处理登出
  const handleLogout = async () => {
    try {
      await logout();
      message.success('登出成功');
    } catch (error) {
      message.error('登出失败');
    } finally {
      setLogoutModalVisible(false);
    }
  };

  // 用户菜单项
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
      onClick: () => navigate('/profile')
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '账户设置',
      onClick: () => navigate('/settings')
    },
    {
      key: 'change-password',
      icon: <LockOutlined />,
      label: '修改密码',
      onClick: () => navigate('/change-password')
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => setLogoutModalVisible(true)
    }
  ];

  // 通知菜单项
  const notificationMenuItems: MenuProps['items'] = [
    {
      key: 'notification-1',
      label: (
        <div className="notification-item">
          <div className="notification-title">系统更新通知</div>
          <div className="notification-content">系统将于今晚进行维护更新</div>
          <div className="notification-time">2小时前</div>
        </div>
      )
    },
    {
      key: 'notification-2',
      label: (
        <div className="notification-item">
          <div className="notification-title">安全提醒</div>
          <div className="notification-content">检测到异常登录，请注意账户安全</div>
          <div className="notification-time">1天前</div>
        </div>
      )
    },
    {
      key: 'notification-3',
      label: (
        <div className="notification-item">
          <div className="notification-title">功能更新</div>
          <div className="notification-content">新增用户管理功能</div>
          <div className="notification-time">3天前</div>
        </div>
      )
    },
    {
      type: 'divider'
    },
    {
      key: 'view-all',
      label: (
        <div style={{ textAlign: 'center', color: '#1890ff' }}>
          查看全部通知
        </div>
      ),
      onClick: () => navigate('/notifications')
    }
  ];

  // 语言菜单项
  const languageMenuItems: MenuProps['items'] = [
    {
      key: 'zh',
      label: '中文',
      onClick: () => handleLanguageChange('zh')
    },
    {
      key: 'en',
      label: 'English',
      onClick: () => handleLanguageChange('en')
    }
  ];

  return (
    <AntHeader 
      className={`app-header ${className || ''}`}
      style={{
        padding: '0 16px',
        background: theme === 'dark' ? '#001529' : '#fff',
        borderBottom: `1px solid ${theme === 'dark' ? '#303030' : '#f0f0f0'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 64,
        lineHeight: '64px'
      }}
    >
      {/* 左侧 */}
      <div className="header-left" style={{ display: 'flex', alignItems: 'center' }}>
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={handleToggleSidebar}
          style={{
            fontSize: '16px',
            width: 64,
            height: 64,
            color: theme === 'dark' ? '#fff' : '#000'
          }}
        />
        
        <div className="header-title" style={{ marginLeft: 16 }}>
          <Text 
            strong 
            style={{ 
              fontSize: '18px',
              color: theme === 'dark' ? '#fff' : '#000'
            }}
          >
            安全API系统
          </Text>
        </div>
      </div>

      {/* 右侧 */}
      <div className="header-right">
        <Space size="middle">
          {/* 主题切换 */}
          <Tooltip title={theme === 'dark' ? '切换到亮色主题' : '切换到暗色主题'}>
            <Button
              type="text"
              icon={theme === 'dark' ? <SunOutlined /> : <MoonOutlined />}
              onClick={handleToggleTheme}
              style={{ color: theme === 'dark' ? '#fff' : '#000' }}
            />
          </Tooltip>

          {/* 语言切换 */}
          <Dropdown 
            menu={{ items: languageMenuItems }}
            placement="bottomRight"
            trigger={['click']}
          >
            <Button
              type="text"
              icon={<GlobalOutlined />}
              style={{ color: theme === 'dark' ? '#fff' : '#000' }}
            />
          </Dropdown>

          {/* 帮助 */}
          <Tooltip title="帮助文档">
            <Button
              type="text"
              icon={<QuestionCircleOutlined />}
              onClick={() => window.open('/help', '_blank')}
              style={{ color: theme === 'dark' ? '#fff' : '#000' }}
            />
          </Tooltip>

          {/* 通知 */}
          <Dropdown
            menu={{ items: notificationMenuItems }}
            placement="bottomRight"
            trigger={['click']}
            overlayStyle={{ width: 300 }}
          >
            <Badge count={notificationCount} size="small">
              <Button
                type="text"
                icon={<BellOutlined />}
                style={{ color: theme === 'dark' ? '#fff' : '#000' }}
              />
            </Badge>
          </Dropdown>

          <Divider type="vertical" style={{ height: 32 }} />

          {/* 用户信息 */}
          <Dropdown
            menu={{ items: userMenuItems }}
            placement="bottomRight"
            trigger={['click']}
          >
            <div 
              className="user-info"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                cursor: 'pointer',
                padding: '0 8px',
                borderRadius: '6px',
                transition: 'background-color 0.3s'
              }}
            >
              <Avatar 
                size="small" 
                icon={<UserOutlined />}
                src={user?.avatarUrl}
                style={{ marginRight: 8 }}
              />
              <Text 
                style={{ 
                  color: theme === 'dark' ? '#fff' : '#000',
                  maxWidth: 120,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {getDisplayName()}
              </Text>
            </div>
          </Dropdown>
        </Space>
      </div>

      {/* 登出确认弹窗 */}
      <Modal
        title="确认登出"
        open={logoutModalVisible}
        onOk={handleLogout}
        onCancel={() => setLogoutModalVisible(false)}
        okText="确认"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <p>确定要退出登录吗？</p>
      </Modal>

      <style jsx>{`
        .notification-item {
          padding: 8px 0;
          border-bottom: 1px solid #f0f0f0;
        }
        .notification-item:last-child {
          border-bottom: none;
        }
        .notification-title {
          font-weight: 500;
          margin-bottom: 4px;
        }
        .notification-content {
          color: #666;
          font-size: 12px;
          margin-bottom: 4px;
        }
        .notification-time {
          color: #999;
          font-size: 11px;
        }
        .user-info:hover {
          background-color: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'};
        }
      `}</style>
    </AntHeader>
  );
};

export default Header;