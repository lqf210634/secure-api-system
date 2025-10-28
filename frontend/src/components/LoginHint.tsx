import React, { useState } from 'react';
import { Card, Typography, Button, Space, Collapse, Tag, Divider } from 'antd';
import { InfoCircleOutlined, UserOutlined, KeyOutlined, CopyOutlined } from '@ant-design/icons';
import { MockAuthService } from '@/services/mockAuthService';

const { Text, Title } = Typography;
const { Panel } = Collapse;

/**
 * 登录提示组件 - 显示可用的测试账户
 */
const LoginHint: React.FC = () => {
  const [copied, setCopied] = useState<string>('');

  const mockUsers = MockAuthService.getMockUsers();

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(''), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  return (
    <Card
      size="small"
      style={{
        marginBottom: 24,
        border: '1px solid #e6f7ff',
        backgroundColor: '#f6ffed'
      }}
    >
      <Collapse
        ghost
        size="small"
        items={[
          {
            key: '1',
            label: (
              <Space>
                <InfoCircleOutlined style={{ color: '#1890ff' }} />
                <Text strong style={{ color: '#1890ff' }}>
                  演示账户信息 (点击展开)
                </Text>
              </Space>
            ),
            children: (
              <div>
                <Text type="secondary" style={{ fontSize: 12, marginBottom: 16, display: 'block' }}>
                  当前为演示模式，您可以使用以下测试账户登录系统：
                </Text>
                
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  {mockUsers.map((user, index) => (
                    <Card
                      key={index}
                      size="small"
                      style={{
                        backgroundColor: '#fafafa',
                        border: '1px solid #f0f0f0'
                      }}
                    >
                      <div style={{ marginBottom: 8 }}>
                        <Space>
                          <Text strong>{user.nickname}</Text>
                          <Space size={4}>
                            {user.roles.map(role => (
                              <Tag
                                key={role}
                                color={role === 'ADMIN' || role === 'SUPER_ADMIN' ? 'red' : 'blue'}
                                size="small"
                              >
                                {role}
                              </Tag>
                            ))}
                          </Space>
                        </Space>
                      </div>
                      
                      <Space direction="vertical" size={4} style={{ width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Space size={8}>
                            <UserOutlined style={{ color: '#666', fontSize: 12 }} />
                            <Text code style={{ fontSize: 12 }}>{user.username}</Text>
                          </Space>
                          <Button
                            type="text"
                            size="small"
                            icon={<CopyOutlined />}
                            onClick={() => copyToClipboard(user.username, `username-${index}`)}
                            style={{ fontSize: 12, padding: '0 4px' }}
                          >
                            {copied === `username-${index}` ? '已复制' : '复制'}
                          </Button>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Space size={8}>
                            <KeyOutlined style={{ color: '#666', fontSize: 12 }} />
                            <Text code style={{ fontSize: 12 }}>{user.password}</Text>
                          </Space>
                          <Button
                            type="text"
                            size="small"
                            icon={<CopyOutlined />}
                            onClick={() => copyToClipboard(user.password, `password-${index}`)}
                            style={{ fontSize: 12, padding: '0 4px' }}
                          >
                            {copied === `password-${index}` ? '已复制' : '复制'}
                          </Button>
                        </div>
                      </Space>
                    </Card>
                  ))}
                </Space>

                <Divider style={{ margin: '16px 0 8px 0' }} />
                
                <Text type="secondary" style={{ fontSize: 11 }}>
                  💡 提示：推荐使用 <Text code>admin</Text> / <Text code>admin123</Text> 账户体验完整的管理功能
                </Text>
              </div>
            )
          }
        ]}
      />
    </Card>
  );
};

export default LoginHint;