import React, { useEffect } from 'react';
import { Layout, ConfigProvider, theme as antdTheme } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { 
  selectTheme, 
  selectSidebarCollapsed,
  setOnlineStatus 
} from '@/store/slices/appSlice';
import Header from './Header';
import Sidebar from './Sidebar';
import Breadcrumb from './Breadcrumb';
import Footer from './Footer';

const { Content } = Layout;

interface MainLayoutProps {
  children?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const dispatch = useDispatch();
  const { checkAuthStatus } = useAuth();
  
  const currentTheme = useSelector(selectTheme);
  const sidebarCollapsed = useSelector(selectSidebarCollapsed);

  // 监听网络状态
  useEffect(() => {
    const handleOnline = () => dispatch(setOnlineStatus(true));
    const handleOffline = () => dispatch(setOnlineStatus(false));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 初始化网络状态
    dispatch(setOnlineStatus(navigator.onLine));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [dispatch]);

  // 检查认证状态
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // 主题配置
  const themeConfig = {
    algorithm: currentTheme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: '#1890ff',
      borderRadius: 6,
      wireframe: false,
    },
    components: {
      Layout: {
        headerBg: currentTheme === 'dark' ? '#001529' : '#ffffff',
        siderBg: currentTheme === 'dark' ? '#001529' : '#ffffff',
        bodyBg: currentTheme === 'dark' ? '#141414' : '#f5f5f5',
      },
      Menu: {
        itemBg: 'transparent',
        itemSelectedBg: currentTheme === 'dark' ? '#1890ff' : '#e6f7ff',
        itemHoverBg: currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
      },
      Button: {
        borderRadius: 6,
      },
      Card: {
        borderRadius: 8,
      },
      Table: {
        borderRadius: 8,
      },
      Input: {
        borderRadius: 6,
      },
      Select: {
        borderRadius: 6,
      }
    }
  };

  return (
    <ConfigProvider theme={themeConfig}>
      <Layout 
        className="main-layout"
        style={{ 
          minHeight: '100vh',
          background: currentTheme === 'dark' ? '#141414' : '#f5f5f5'
        }}
      >
        {/* 头部 */}
        <Header />
        
        <Layout style={{ marginTop: 64 }}>
          {/* 侧边栏 */}
          <Sidebar />
          
          {/* 主内容区 */}
          <Layout 
            style={{ 
              marginLeft: sidebarCollapsed ? 64 : 240,
              transition: 'margin-left 0.2s ease-in-out',
              minHeight: 'calc(100vh - 64px)'
            }}
          >
            {/* 面包屑导航 */}
            <Breadcrumb />
            
            {/* 内容区域 */}
            <Content
              style={{
                margin: '0 16px 16px',
                padding: '24px',
                background: currentTheme === 'dark' ? '#1f1f1f' : '#ffffff',
                borderRadius: 8,
                boxShadow: currentTheme === 'dark' 
                  ? '0 2px 8px rgba(0, 0, 0, 0.3)' 
                  : '0 2px 8px rgba(0, 0, 0, 0.1)',
                minHeight: 'calc(100vh - 200px)',
                overflow: 'auto'
              }}
            >
              {children || <Outlet />}
            </Content>
            
            {/* 底部 */}
            <Footer />
          </Layout>
        </Layout>
      </Layout>

      <style jsx global>{`
        /* 全局样式 */
        .main-layout {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }

        /* 滚动条样式 */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: ${currentTheme === 'dark' ? '#1f1f1f' : '#f1f1f1'};
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb {
          background: ${currentTheme === 'dark' ? '#555' : '#c1c1c1'};
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: ${currentTheme === 'dark' ? '#777' : '#a8a8a8'};
        }

        /* 响应式设计 */
        @media (max-width: 768px) {
          .main-layout .ant-layout-sider {
            position: fixed !important;
            z-index: 1000;
            height: 100vh;
          }
          
          .main-layout .ant-layout-content {
            margin-left: 0 !important;
          }
        }

        /* 动画效果 */
        .ant-layout-sider {
          transition: all 0.2s ease-in-out;
        }

        .ant-menu {
          transition: all 0.2s ease-in-out;
        }

        /* 卡片样式优化 */
        .ant-card {
          border: ${currentTheme === 'dark' ? '1px solid #303030' : '1px solid #f0f0f0'};
          box-shadow: ${currentTheme === 'dark' 
            ? '0 2px 8px rgba(0, 0, 0, 0.3)' 
            : '0 2px 8px rgba(0, 0, 0, 0.1)'};
        }

        /* 表格样式优化 */
        .ant-table {
          border-radius: 8px;
          overflow: hidden;
        }

        .ant-table-thead > tr > th {
          background: ${currentTheme === 'dark' ? '#262626' : '#fafafa'};
          border-bottom: ${currentTheme === 'dark' ? '1px solid #303030' : '1px solid #f0f0f0'};
        }

        /* 按钮样式优化 */
        .ant-btn {
          transition: all 0.2s ease-in-out;
        }

        .ant-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
        }

        /* 输入框样式优化 */
        .ant-input,
        .ant-select-selector {
          transition: all 0.2s ease-in-out;
        }

        .ant-input:focus,
        .ant-select-focused .ant-select-selector {
          box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
        }

        /* 加载状态样式 */
        .ant-spin-container {
          transition: opacity 0.3s ease-in-out;
        }

        /* 消息提示样式 */
        .ant-message {
          z-index: 9999;
        }

        .ant-notification {
          z-index: 9999;
        }

        /* 模态框样式 */
        .ant-modal {
          border-radius: 8px;
          overflow: hidden;
        }

        .ant-modal-header {
          border-bottom: ${currentTheme === 'dark' ? '1px solid #303030' : '1px solid #f0f0f0'};
        }

        .ant-modal-footer {
          border-top: ${currentTheme === 'dark' ? '1px solid #303030' : '1px solid #f0f0f0'};
        }

        /* 抽屉样式 */
        .ant-drawer-header {
          border-bottom: ${currentTheme === 'dark' ? '1px solid #303030' : '1px solid #f0f0f0'};
        }

        /* 标签页样式 */
        .ant-tabs-tab {
          transition: all 0.2s ease-in-out;
        }

        .ant-tabs-tab:hover {
          color: #1890ff;
        }

        /* 进度条样式 */
        .ant-progress-bg {
          transition: all 0.3s ease-in-out;
        }

        /* 统计卡片样式 */
        .stat-card {
          background: ${currentTheme === 'dark' ? '#1f1f1f' : '#ffffff'};
          border: ${currentTheme === 'dark' ? '1px solid #303030' : '1px solid #f0f0f0'};
          border-radius: 8px;
          padding: 24px;
          box-shadow: ${currentTheme === 'dark' 
            ? '0 2px 8px rgba(0, 0, 0, 0.3)' 
            : '0 2px 8px rgba(0, 0, 0, 0.1)'};
          transition: all 0.2s ease-in-out;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: ${currentTheme === 'dark' 
            ? '0 4px 16px rgba(0, 0, 0, 0.4)' 
            : '0 4px 16px rgba(0, 0, 0, 0.15)'};
        }
      `}</style>
    </ConfigProvider>
  );
};

export default MainLayout;