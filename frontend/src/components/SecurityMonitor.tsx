import React, { useEffect, useState, useCallback } from 'react';
import { Card, Badge, Typography, Space, Alert, Button, Modal, List, Tag } from 'antd';
import {
  ShieldCheckOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { SecurityEventType, SecurityLevel } from '@/config/security';

const { Title, Text } = Typography;

interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  level: SecurityLevel;
  message: string;
  timestamp: Date;
  details?: Record<string, any>;
  resolved?: boolean;
}

interface SecurityStatus {
  level: SecurityLevel;
  score: number;
  events: SecurityEvent[];
  lastUpdate: Date;
}

interface SecurityMonitorProps {
  /** 是否显示详细信息 */
  showDetails?: boolean;
  /** 是否自动刷新 */
  autoRefresh?: boolean;
  /** 刷新间隔（毫秒） */
  refreshInterval?: number;
  /** 最大显示事件数 */
  maxEvents?: number;
  /** 样式 */
  style?: React.CSSProperties;
}

/**
 * 安全监控组件
 * 实时监控和显示安全状态
 */
const SecurityMonitor: React.FC<SecurityMonitorProps> = ({
  showDetails = false,
  autoRefresh = true,
  refreshInterval = 30000,
  maxEvents = 10,
  style
}) => {
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus>({
    level: SecurityLevel.MEDIUM,
    score: 85,
    events: [],
    lastUpdate: new Date()
  });
  const [loading, setLoading] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);

  // 模拟安全事件数据
  const mockSecurityEvents: SecurityEvent[] = [
    {
      id: '1',
      type: SecurityEventType.LOGIN_SUCCESS,
      level: SecurityLevel.LOW,
      message: '用户登录成功',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      details: { username: 'admin', ip: '192.168.1.100' }
    },
    {
      id: '2',
      type: SecurityEventType.RATE_LIMIT_EXCEEDED,
      level: SecurityLevel.MEDIUM,
      message: '检测到频繁请求',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      details: { ip: '192.168.1.200', requests: 150 }
    },
    {
      id: '3',
      type: SecurityEventType.XSS_ATTEMPT,
      level: SecurityLevel.HIGH,
      message: '检测到XSS攻击尝试',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      details: { payload: '<script>alert("xss")</script>', blocked: true }
    }
  ];

  // 获取安全状态
  const fetchSecurityStatus = useCallback(async () => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const events = mockSecurityEvents.slice(0, maxEvents);
      const highRiskEvents = events.filter(e => e.level === SecurityLevel.HIGH || e.level === SecurityLevel.CRITICAL);
      
      let level = SecurityLevel.LOW;
      let score = 95;
      
      if (highRiskEvents.length > 0) {
        level = SecurityLevel.HIGH;
        score = 60;
      } else if (events.some(e => e.level === SecurityLevel.MEDIUM)) {
        level = SecurityLevel.MEDIUM;
        score = 80;
      }

      setSecurityStatus({
        level,
        score,
        events,
        lastUpdate: new Date()
      });
    } catch (error) {
      console.error('获取安全状态失败:', error);
    } finally {
      setLoading(false);
    }
  }, [maxEvents]);

  // 自动刷新
  useEffect(() => {
    fetchSecurityStatus();
    
    if (autoRefresh) {
      const interval = setInterval(fetchSecurityStatus, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchSecurityStatus, autoRefresh, refreshInterval]);

  // 获取安全级别颜色
  const getSecurityLevelColor = (level: SecurityLevel) => {
    switch (level) {
      case SecurityLevel.LOW:
        return '#52c41a';
      case SecurityLevel.MEDIUM:
        return '#faad14';
      case SecurityLevel.HIGH:
        return '#ff7a45';
      case SecurityLevel.CRITICAL:
        return '#ff4d4f';
      default:
        return '#d9d9d9';
    }
  };

  // 获取安全级别文本
  const getSecurityLevelText = (level: SecurityLevel) => {
    switch (level) {
      case SecurityLevel.LOW:
        return '安全';
      case SecurityLevel.MEDIUM:
        return '注意';
      case SecurityLevel.HIGH:
        return '警告';
      case SecurityLevel.CRITICAL:
        return '严重';
      default:
        return '未知';
    }
  };

  // 获取事件类型文本
  const getEventTypeText = (type: SecurityEventType) => {
    const typeMap = {
      [SecurityEventType.LOGIN_SUCCESS]: '登录成功',
      [SecurityEventType.LOGIN_FAILURE]: '登录失败',
      [SecurityEventType.LOGOUT]: '用户登出',
      [SecurityEventType.PASSWORD_CHANGE]: '密码修改',
      [SecurityEventType.ACCOUNT_LOCKED]: '账户锁定',
      [SecurityEventType.SUSPICIOUS_ACTIVITY]: '可疑活动',
      [SecurityEventType.XSS_ATTEMPT]: 'XSS攻击',
      [SecurityEventType.CSRF_ATTEMPT]: 'CSRF攻击',
      [SecurityEventType.RATE_LIMIT_EXCEEDED]: '频率限制',
      [SecurityEventType.UNAUTHORIZED_ACCESS]: '未授权访问'
    };
    return typeMap[type] || type;
  };

  // 格式化时间
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}小时前`;
    return date.toLocaleDateString();
  };

  return (
    <>
      <Card
        size="small"
        style={{ ...style }}
        title={
          <Space>
            <ShieldCheckOutlined />
            <span>安全监控</span>
            <Badge
              color={getSecurityLevelColor(securityStatus.level)}
              text={getSecurityLevelText(securityStatus.level)}
            />
          </Space>
        }
        extra={
          <Space>
            <Text type="secondary" style={{ fontSize: 12 }}>
              评分: {securityStatus.score}/100
            </Text>
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined />}
              loading={loading}
              onClick={fetchSecurityStatus}
            />
            {showDetails && (
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => setDetailsVisible(true)}
              >
                详情
              </Button>
            )}
          </Space>
        }
      >
        {/* 安全状态概览 */}
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          {securityStatus.level === SecurityLevel.HIGH || securityStatus.level === SecurityLevel.CRITICAL ? (
            <Alert
              message="检测到安全风险"
              description="系统检测到潜在的安全威胁，请及时处理"
              type="warning"
              showIcon
              size="small"
            />
          ) : (
            <Alert
              message="系统安全状态良好"
              type="success"
              showIcon
              size="small"
            />
          )}

          {/* 最近事件 */}
          {securityStatus.events.length > 0 && (
            <div>
              <Text strong style={{ fontSize: 12 }}>最近事件:</Text>
              <List
                size="small"
                dataSource={securityStatus.events.slice(0, 3)}
                renderItem={(event) => (
                  <List.Item style={{ padding: '4px 0' }}>
                    <Space size="small">
                      <Tag
                        color={getSecurityLevelColor(event.level)}
                        style={{ margin: 0, fontSize: 10 }}
                      >
                        {getEventTypeText(event.type)}
                      </Tag>
                      <Text style={{ fontSize: 11 }}>{event.message}</Text>
                      <Text type="secondary" style={{ fontSize: 10 }}>
                        {formatTime(event.timestamp)}
                      </Text>
                    </Space>
                  </List.Item>
                )}
              />
            </div>
          )}

          <Text type="secondary" style={{ fontSize: 10 }}>
            最后更新: {formatTime(securityStatus.lastUpdate)}
          </Text>
        </Space>
      </Card>

      {/* 详情弹窗 */}
      <Modal
        title="安全监控详情"
        open={detailsVisible}
        onCancel={() => setDetailsVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailsVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* 安全评分 */}
          <Card size="small" title="安全评分">
            <Space>
              <Text strong style={{ fontSize: 24, color: getSecurityLevelColor(securityStatus.level) }}>
                {securityStatus.score}
              </Text>
              <Text>/100</Text>
              <Tag color={getSecurityLevelColor(securityStatus.level)}>
                {getSecurityLevelText(securityStatus.level)}
              </Tag>
            </Space>
          </Card>

          {/* 安全事件列表 */}
          <Card size="small" title="安全事件">
            <List
              dataSource={securityStatus.events}
              renderItem={(event) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      event.level === SecurityLevel.HIGH || event.level === SecurityLevel.CRITICAL ? (
                        <WarningOutlined style={{ color: getSecurityLevelColor(event.level) }} />
                      ) : (
                        <ExclamationCircleOutlined style={{ color: getSecurityLevelColor(event.level) }} />
                      )
                    }
                    title={
                      <Space>
                        <Tag color={getSecurityLevelColor(event.level)}>
                          {getEventTypeText(event.type)}
                        </Tag>
                        <Text>{event.message}</Text>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size="small">
                        <Text type="secondary">{formatTime(event.timestamp)}</Text>
                        {event.details && (
                          <Text code style={{ fontSize: 11 }}>
                            {JSON.stringify(event.details, null, 2)}
                          </Text>
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Space>
      </Modal>
    </>
  );
};

export default SecurityMonitor;