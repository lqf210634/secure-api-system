import React, { useEffect, useState } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Typography,
  Space,
  Progress,
  Table,
  Tag,
  Avatar,
  List,
  Timeline,
  Alert,
  Button,
  Tooltip,
  Spin
} from 'antd';
import {
  UserOutlined,
  ApiOutlined,
  SecurityScanOutlined,
  MonitorOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  EyeOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useAuth, useApi } from '@/hooks';
import { UserService, AuthService } from '@/services';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalApis: number;
  activeApis: number;
  securityEvents: number;
  systemHealth: number;
  userGrowth: number;
  apiUsage: number;
}

interface RecentActivity {
  id: string;
  type: 'login' | 'api_call' | 'security' | 'system';
  user: string;
  action: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
}

interface SystemAlert {
  id: string;
  type: 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const { request: fetchStats } = useApi();
  const { request: fetchActivities } = useApi();
  const { request: fetchAlerts } = useApi();

  // 获取仪表板数据
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // 模拟API调用 - 实际项目中应该调用真实的API
      const [statsResponse, activitiesResponse, alertsResponse] = await Promise.all([
        // UserService.getStatistics(),
        // AuthService.getRecentActivities(),
        // SystemService.getAlerts()
        
        // 模拟数据
        Promise.resolve({
          success: true,
          data: {
            totalUsers: 1248,
            activeUsers: 892,
            totalApis: 156,
            activeApis: 134,
            securityEvents: 23,
            systemHealth: 98.5,
            userGrowth: 12.5,
            apiUsage: 85.2
          }
        }),
        Promise.resolve({
          success: true,
          data: [
            {
              id: '1',
              type: 'login',
              user: 'admin',
              action: '用户登录',
              timestamp: new Date().toISOString(),
              status: 'success'
            },
            {
              id: '2',
              type: 'api_call',
              user: 'developer',
              action: 'API调用 /api/users',
              timestamp: new Date(Date.now() - 300000).toISOString(),
              status: 'success'
            },
            {
              id: '3',
              type: 'security',
              user: 'system',
              action: '检测到异常登录尝试',
              timestamp: new Date(Date.now() - 600000).toISOString(),
              status: 'warning'
            },
            {
              id: '4',
              type: 'system',
              user: 'system',
              action: '系统备份完成',
              timestamp: new Date(Date.now() - 900000).toISOString(),
              status: 'success'
            }
          ]
        }),
        Promise.resolve({
          success: true,
          data: [
            {
              id: '1',
              type: 'warning',
              title: '系统负载较高',
              message: 'CPU使用率达到85%，建议检查系统性能',
              timestamp: new Date().toISOString()
            },
            {
              id: '2',
              type: 'info',
              title: '系统更新',
              message: '新版本v2.1.0已发布，包含安全性改进',
              timestamp: new Date(Date.now() - 3600000).toISOString()
            }
          ]
        })
      ]);

      if (statsResponse.success) {
        setStats(statsResponse.data);
      }
      if (activitiesResponse.success) {
        setRecentActivities(activitiesResponse.data);
      }
      if (alertsResponse.success) {
        setSystemAlerts(alertsResponse.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // 获取活动类型图标
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login':
        return <UserOutlined style={{ color: '#1890ff' }} />;
      case 'api_call':
        return <ApiOutlined style={{ color: '#52c41a' }} />;
      case 'security':
        return <SecurityScanOutlined style={{ color: '#fa8c16' }} />;
      case 'system':
        return <MonitorOutlined style={{ color: '#722ed1' }} />;
      default:
        return <ClockCircleOutlined />;
    }
  };

  // 获取状态标签
  const getStatusTag = (status: string) => {
    switch (status) {
      case 'success':
        return <Tag color="success" icon={<CheckCircleOutlined />}>成功</Tag>;
      case 'warning':
        return <Tag color="warning" icon={<WarningOutlined />}>警告</Tag>;
      case 'error':
        return <Tag color="error" icon={<ExclamationCircleOutlined />}>错误</Tag>;
      default:
        return <Tag>未知</Tag>;
    }
  };

  // 格式化时间
  const formatTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now.getTime() - time.getTime();
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    return time.toLocaleDateString();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* 欢迎信息 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ marginBottom: 8 }}>
          欢迎回来，{user?.displayName || user?.username}！
        </Title>
        <Text type="secondary">
          今天是 {new Date().toLocaleDateString('zh-CN', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            weekday: 'long'
          })}
        </Text>
      </div>

      {/* 系统告警 */}
      {systemAlerts.length > 0 && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={24}>
            {systemAlerts.map(alert => (
              <Alert
                key={alert.id}
                type={alert.type}
                message={alert.title}
                description={alert.message}
                showIcon
                closable
                style={{ marginBottom: 8 }}
                action={
                  <Button size="small" type="text">
                    查看详情
                  </Button>
                }
              />
            ))}
          </Col>
        </Row>
      )}

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总用户数"
              value={stats?.totalUsers}
              prefix={<UserOutlined />}
              suffix={
                <Tooltip title="较上月增长">
                  <span style={{ fontSize: 14, color: '#52c41a' }}>
                    <ArrowUpOutlined /> {stats?.userGrowth}%
                  </span>
                </Tooltip>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="活跃用户"
              value={stats?.activeUsers}
              prefix={<UserOutlined style={{ color: '#52c41a' }} />}
              suffix={
                <Text type="secondary" style={{ fontSize: 12 }}>
                  / {stats?.totalUsers}
                </Text>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="API接口"
              value={stats?.activeApis}
              prefix={<ApiOutlined style={{ color: '#1890ff' }} />}
              suffix={
                <Text type="secondary" style={{ fontSize: 12 }}>
                  / {stats?.totalApis}
                </Text>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="安全事件"
              value={stats?.securityEvents}
              prefix={<SecurityScanOutlined style={{ color: '#fa8c16' }} />}
              suffix={
                <Text type="secondary" style={{ fontSize: 12 }}>
                  本月
                </Text>
              }
            />
          </Card>
        </Col>
      </Row>

      {/* 系统状态和使用情况 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card 
            title="系统健康状态" 
            extra={
              <Button 
                type="text" 
                icon={<ReloadOutlined />} 
                onClick={loadDashboardData}
              >
                刷新
              </Button>
            }
          >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text>系统健康度</Text>
                  <Text strong>{stats?.systemHealth}%</Text>
                </div>
                <Progress 
                  percent={stats?.systemHealth} 
                  strokeColor={stats?.systemHealth && stats.systemHealth > 90 ? '#52c41a' : '#fa8c16'}
                  showInfo={false}
                />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text>API使用率</Text>
                  <Text strong>{stats?.apiUsage}%</Text>
                </div>
                <Progress 
                  percent={stats?.apiUsage} 
                  strokeColor="#1890ff"
                  showInfo={false}
                />
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="快速操作">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Button 
                  type="primary" 
                  block 
                  icon={<UserOutlined />}
                  onClick={() => window.location.href = '/users'}
                >
                  用户管理
                </Button>
              </Col>
              <Col span={12}>
                <Button 
                  block 
                  icon={<ApiOutlined />}
                  onClick={() => window.location.href = '/apis'}
                >
                  API管理
                </Button>
              </Col>
              <Col span={12}>
                <Button 
                  block 
                  icon={<SecurityScanOutlined />}
                  onClick={() => window.location.href = '/security'}
                >
                  安全中心
                </Button>
              </Col>
              <Col span={12}>
                <Button 
                  block 
                  icon={<MonitorOutlined />}
                  onClick={() => window.location.href = '/monitoring'}
                >
                  系统监控
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 最近活动和时间线 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card 
            title="最近活动" 
            extra={
              <Button type="text" icon={<EyeOutlined />}>
                查看全部
              </Button>
            }
          >
            <List
              dataSource={recentActivities}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={getActivityIcon(item.type)} />}
                    title={
                      <Space>
                        <Text strong>{item.user}</Text>
                        <Text>{item.action}</Text>
                        {getStatusTag(item.status)}
                      </Space>
                    }
                    description={formatTime(item.timestamp)}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="系统时间线">
            <Timeline
              items={recentActivities.map(activity => ({
                color: activity.status === 'success' ? 'green' : 
                       activity.status === 'warning' ? 'orange' : 'red',
                children: (
                  <div>
                    <Text strong>{activity.action}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {formatTime(activity.timestamp)} - {activity.user}
                    </Text>
                  </div>
                )
              }))}
            />
          </Card>
        </Col>
      </Row>

      <style jsx>{`
        .ant-card {
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .ant-card-head-title {
          font-weight: 600;
        }

        .ant-statistic-title {
          color: #8c8c8c;
          font-size: 14px;
        }

        .ant-statistic-content {
          color: #262626;
        }

        .ant-progress-line {
          margin-bottom: 0;
        }

        .ant-btn-block {
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ant-list-item {
          padding: 12px 0;
          border-bottom: 1px solid #f0f0f0;
        }

        .ant-list-item:last-child {
          border-bottom: none;
        }

        .ant-timeline-item-content {
          margin-left: 8px;
        }

        @media (max-width: 768px) {
          .ant-col {
            margin-bottom: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;