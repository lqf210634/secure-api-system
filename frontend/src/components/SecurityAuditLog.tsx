import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Space,
  Tag,
  Button,
  DatePicker,
  Select,
  Input,
  Typography,
  Tooltip,
  Modal,
  Descriptions,
  Alert,
  Row,
  Col,
  Statistic
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  ExportOutlined,
  EyeOutlined,
  WarningOutlined,
  SafetyOutlined,
  UserOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { SecurityEventType, SecurityLevel } from '@/config/security';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Text } = Typography;

interface AuditLogEntry {
  id: string;
  timestamp: Date;
  eventType: SecurityEventType;
  level: SecurityLevel;
  userId?: string;
  username?: string;
  ip: string;
  userAgent: string;
  action: string;
  resource?: string;
  details: Record<string, any>;
  result: 'success' | 'failure' | 'blocked';
  riskScore: number;
}

interface SecurityAuditLogProps {
  /** 是否显示统计信息 */
  showStatistics?: boolean;
  /** 默认显示的日志级别 */
  defaultLevel?: SecurityLevel[];
  /** 最大显示条数 */
  maxRecords?: number;
  /** 是否允许导出 */
  allowExport?: boolean;
}

/**
 * 安全审计日志组件
 */
const SecurityAuditLog: React.FC<SecurityAuditLogProps> = ({
  showStatistics = true,
  defaultLevel = [SecurityLevel.MEDIUM, SecurityLevel.HIGH, SecurityLevel.CRITICAL],
  maxRecords = 1000,
  allowExport = true
}) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: [dayjs().subtract(7, 'day'), dayjs()],
    level: defaultLevel,
    eventType: undefined as SecurityEventType | undefined,
    userId: '',
    ip: '',
    result: undefined as string | undefined
  });

  // 模拟审计日志数据
  const mockLogs: AuditLogEntry[] = [
    {
      id: '1',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      eventType: SecurityEventType.LOGIN_SUCCESS,
      level: SecurityLevel.LOW,
      userId: 'user123',
      username: 'admin',
      ip: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      action: '用户登录',
      resource: '/api/auth/login',
      details: { loginMethod: 'password', deviceType: 'desktop' },
      result: 'success',
      riskScore: 10
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      eventType: SecurityEventType.LOGIN_FAILURE,
      level: SecurityLevel.MEDIUM,
      userId: 'user456',
      username: 'testuser',
      ip: '192.168.1.200',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      action: '登录失败',
      resource: '/api/auth/login',
      details: { reason: 'invalid_password', attempts: 3 },
      result: 'failure',
      riskScore: 60
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      eventType: SecurityEventType.XSS_ATTEMPT,
      level: SecurityLevel.HIGH,
      ip: '192.168.1.300',
      userAgent: 'curl/7.68.0',
      action: 'XSS攻击尝试',
      resource: '/api/users/search',
      details: { 
        payload: '<script>alert("xss")</script>',
        blocked: true,
        detectionRule: 'script_tag_detection'
      },
      result: 'blocked',
      riskScore: 85
    },
    {
      id: '4',
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      eventType: SecurityEventType.RATE_LIMIT_EXCEEDED,
      level: SecurityLevel.MEDIUM,
      ip: '192.168.1.400',
      userAgent: 'Python-requests/2.25.1',
      action: '频率限制触发',
      resource: '/api/data/export',
      details: { 
        requestCount: 150,
        timeWindow: '15min',
        limit: 100
      },
      result: 'blocked',
      riskScore: 70
    }
  ];

  useEffect(() => {
    loadAuditLogs();
  }, [filters]);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 根据过滤条件筛选日志
      let filteredLogs = mockLogs.filter(log => {
        const logDate = dayjs(log.timestamp);
        const [startDate, endDate] = filters.dateRange;
        
        return (
          logDate.isAfter(startDate) &&
          logDate.isBefore(endDate.add(1, 'day')) &&
          filters.level.includes(log.level) &&
          (!filters.eventType || log.eventType === filters.eventType) &&
          (!filters.userId || log.userId?.includes(filters.userId)) &&
          (!filters.ip || log.ip.includes(filters.ip)) &&
          (!filters.result || log.result === filters.result)
        );
      });

      // 限制记录数
      filteredLogs = filteredLogs.slice(0, maxRecords);
      
      setLogs(filteredLogs);
    } catch (error) {
      console.error('加载审计日志失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (log: AuditLogEntry) => {
    setSelectedLog(log);
    setDetailModalVisible(true);
  };

  const handleExport = () => {
    // 模拟导出功能
    const csvContent = logs.map(log => 
      `${log.timestamp.toISOString()},${log.eventType},${log.level},${log.username || ''},${log.ip},${log.action},${log.result}`
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security_audit_log_${dayjs().format('YYYY-MM-DD')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getLevelColor = (level: SecurityLevel) => {
    switch (level) {
      case SecurityLevel.LOW:
        return 'green';
      case SecurityLevel.MEDIUM:
        return 'orange';
      case SecurityLevel.HIGH:
        return 'red';
      case SecurityLevel.CRITICAL:
        return 'purple';
      default:
        return 'default';
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'success':
        return 'green';
      case 'failure':
        return 'orange';
      case 'blocked':
        return 'red';
      default:
        return 'default';
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return '#ff4d4f';
    if (score >= 60) return '#faad14';
    if (score >= 40) return '#1890ff';
    return '#52c41a';
  };

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

  const columns: ColumnsType<AuditLogEntry> = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 160,
      render: (timestamp: Date) => (
        <Tooltip title={timestamp.toLocaleString()}>
          <Text style={{ fontSize: 12 }}>
            {dayjs(timestamp).format('MM-DD HH:mm:ss')}
          </Text>
        </Tooltip>
      ),
      sorter: (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
      defaultSortOrder: 'descend'
    },
    {
      title: '事件类型',
      dataIndex: 'eventType',
      key: 'eventType',
      width: 120,
      render: (type: SecurityEventType) => (
        <Tag color="blue" style={{ fontSize: 11 }}>
          {getEventTypeText(type)}
        </Tag>
      ),
      filters: Object.values(SecurityEventType).map(type => ({
        text: getEventTypeText(type),
        value: type
      })),
      onFilter: (value, record) => record.eventType === value
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level: SecurityLevel) => (
        <Tag color={getLevelColor(level)} style={{ fontSize: 11 }}>
          {level.toUpperCase()}
        </Tag>
      ),
      filters: Object.values(SecurityLevel).map(level => ({
        text: level.toUpperCase(),
        value: level
      })),
      onFilter: (value, record) => record.level === value
    },
    {
      title: '用户',
      dataIndex: 'username',
      key: 'username',
      width: 100,
      render: (username: string) => (
        username ? (
          <Space size="small">
            <UserOutlined style={{ fontSize: 12 }} />
            <Text style={{ fontSize: 12 }}>{username}</Text>
          </Space>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>-</Text>
        )
      )
    },
    {
      title: 'IP地址',
      dataIndex: 'ip',
      key: 'ip',
      width: 120,
      render: (ip: string) => (
        <Text code style={{ fontSize: 11 }}>{ip}</Text>
      )
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 150,
      render: (action: string) => (
        <Text style={{ fontSize: 12 }}>{action}</Text>
      )
    },
    {
      title: '结果',
      dataIndex: 'result',
      key: 'result',
      width: 80,
      render: (result: string) => (
        <Tag color={getResultColor(result)} style={{ fontSize: 11 }}>
          {result.toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: 'SUCCESS', value: 'success' },
        { text: 'FAILURE', value: 'failure' },
        { text: 'BLOCKED', value: 'blocked' }
      ],
      onFilter: (value, record) => record.result === value
    },
    {
      title: '风险评分',
      dataIndex: 'riskScore',
      key: 'riskScore',
      width: 100,
      render: (score: number) => (
        <Text style={{ color: getRiskScoreColor(score), fontWeight: 'bold', fontSize: 12 }}>
          {score}
        </Text>
      ),
      sorter: (a, b) => a.riskScore - b.riskScore
    },
    {
      title: '操作',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetails(record)}
        >
          详情
        </Button>
      )
    }
  ];

  // 统计数据
  const statistics = {
    total: logs.length,
    high: logs.filter(log => log.level === SecurityLevel.HIGH || log.level === SecurityLevel.CRITICAL).length,
    blocked: logs.filter(log => log.result === 'blocked').length,
    avgRiskScore: logs.length > 0 ? Math.round(logs.reduce((sum, log) => sum + log.riskScore, 0) / logs.length) : 0
  };

  return (
    <div>
      {/* 统计信息 */}
      {showStatistics && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="总事件数"
                value={statistics.total}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="高风险事件"
                value={statistics.high}
                prefix={<WarningOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="已阻止攻击"
                value={statistics.blocked}
                prefix={<SafetyOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="平均风险评分"
                value={statistics.avgRiskScore}
                suffix="分"
                valueStyle={{ color: getRiskScoreColor(statistics.avgRiskScore) }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 过滤器 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          <RangePicker
            value={filters.dateRange}
            onChange={(dates) => setFilters({ ...filters, dateRange: dates || [dayjs().subtract(7, 'day'), dayjs()] })}
            format="YYYY-MM-DD"
            size="small"
          />
          
          <Select
            placeholder="事件类型"
            style={{ width: 120 }}
            size="small"
            allowClear
            value={filters.eventType}
            onChange={(value) => setFilters({ ...filters, eventType: value })}
          >
            {Object.values(SecurityEventType).map(type => (
              <Option key={type} value={type}>
                {getEventTypeText(type)}
              </Option>
            ))}
          </Select>

          <Select
            placeholder="结果"
            style={{ width: 100 }}
            size="small"
            allowClear
            value={filters.result}
            onChange={(value) => setFilters({ ...filters, result: value })}
          >
            <Option value="success">成功</Option>
            <Option value="failure">失败</Option>
            <Option value="blocked">阻止</Option>
          </Select>

          <Input
            placeholder="用户ID"
            style={{ width: 120 }}
            size="small"
            prefix={<SearchOutlined />}
            value={filters.userId}
            onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
          />

          <Input
            placeholder="IP地址"
            style={{ width: 120 }}
            size="small"
            prefix={<SearchOutlined />}
            value={filters.ip}
            onChange={(e) => setFilters({ ...filters, ip: e.target.value })}
          />

          <Button
            type="primary"
            size="small"
            icon={<ReloadOutlined />}
            loading={loading}
            onClick={loadAuditLogs}
          >
            刷新
          </Button>

          {allowExport && (
            <Button
              size="small"
              icon={<ExportOutlined />}
              onClick={handleExport}
            >
              导出
            </Button>
          )}
        </Space>
      </Card>

      {/* 日志表格 */}
      <Card size="small">
        <Table
          columns={columns}
          dataSource={logs}
          rowKey="id"
          loading={loading}
          size="small"
          pagination={{
            total: logs.length,
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* 详情弹窗 */}
      <Modal
        title="审计日志详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        {selectedLog && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="事件ID">{selectedLog.id}</Descriptions.Item>
            <Descriptions.Item label="时间">{selectedLog.timestamp.toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="事件类型">
              <Tag color="blue">{getEventTypeText(selectedLog.eventType)}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="安全级别">
              <Tag color={getLevelColor(selectedLog.level)}>{selectedLog.level.toUpperCase()}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="用户ID">{selectedLog.userId || '-'}</Descriptions.Item>
            <Descriptions.Item label="用户名">{selectedLog.username || '-'}</Descriptions.Item>
            <Descriptions.Item label="IP地址">{selectedLog.ip}</Descriptions.Item>
            <Descriptions.Item label="操作">{selectedLog.action}</Descriptions.Item>
            <Descriptions.Item label="资源">{selectedLog.resource || '-'}</Descriptions.Item>
            <Descriptions.Item label="结果">
              <Tag color={getResultColor(selectedLog.result)}>{selectedLog.result.toUpperCase()}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="风险评分">
              <Text style={{ color: getRiskScoreColor(selectedLog.riskScore), fontWeight: 'bold' }}>
                {selectedLog.riskScore}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="User Agent" span={2}>
              <Text code style={{ fontSize: 11, wordBreak: 'break-all' }}>
                {selectedLog.userAgent}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="详细信息" span={2}>
              <pre style={{ fontSize: 11, margin: 0, whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(selectedLog.details, null, 2)}
              </pre>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default SecurityAuditLog;