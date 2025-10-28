import React from 'react';
import { Progress, Space, Typography, Tag } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { validatePasswordStrength } from '@/utils/security';

const { Text } = Typography;

interface PasswordStrengthProps {
  password: string;
  showSuggestions?: boolean;
  size?: 'small' | 'default';
}

/**
 * 密码强度检查组件
 */
const PasswordStrength: React.FC<PasswordStrengthProps> = ({
  password,
  showSuggestions = true,
  size = 'default'
}) => {
  const { level, score, suggestions } = validatePasswordStrength(password);

  // 强度等级配置
  const strengthConfig = {
    weak: {
      color: '#ff4d4f',
      text: '弱',
      percent: Math.max((score / 6) * 100, 10)
    },
    medium: {
      color: '#faad14',
      text: '中',
      percent: (score / 6) * 100
    },
    strong: {
      color: '#52c41a',
      text: '强',
      percent: 100
    }
  };

  const config = strengthConfig[level];

  // 密码要求检查
  const requirements = [
    {
      label: '至少8位字符',
      met: password.length >= 8
    },
    {
      label: '包含小写字母',
      met: /[a-z]/.test(password)
    },
    {
      label: '包含大写字母',
      met: /[A-Z]/.test(password)
    },
    {
      label: '包含数字',
      met: /\d/.test(password)
    },
    {
      label: '包含特殊字符',
      met: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }
  ];

  if (!password) {
    return null;
  }

  return (
    <div style={{ marginTop: 8 }}>
      {/* 强度进度条 */}
      <Space direction="vertical" style={{ width: '100%' }} size={4}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Progress
            percent={config.percent}
            strokeColor={config.color}
            showInfo={false}
            size={size === 'small' ? 'small' : 'default'}
            style={{ flex: 1, minWidth: 100 }}
          />
          <Tag
            color={config.color}
            style={{
              margin: 0,
              fontSize: size === 'small' ? 11 : 12,
              padding: size === 'small' ? '0 4px' : '2px 6px'
            }}
          >
            密码强度: {config.text}
          </Tag>
        </div>

        {/* 密码要求检查 */}
        {showSuggestions && (
          <div style={{ marginTop: 8 }}>
            <Space direction="vertical" size={2}>
              {requirements.map((req, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: size === 'small' ? 11 : 12
                  }}
                >
                  {req.met ? (
                    <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 12 }} />
                  ) : (
                    <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 12 }} />
                  )}
                  <Text
                    style={{
                      color: req.met ? '#52c41a' : '#ff4d4f',
                      fontSize: size === 'small' ? 11 : 12
                    }}
                  >
                    {req.label}
                  </Text>
                </div>
              ))}
            </Space>

            {/* 额外建议 */}
            {suggestions.length > 0 && level !== 'strong' && (
              <div style={{ marginTop: 8, padding: 8, backgroundColor: '#fff7e6', borderRadius: 4 }}>
                <Text style={{ fontSize: 11, color: '#d46b08' }}>
                  💡 建议: {suggestions.join('、')}
                </Text>
              </div>
            )}

            {/* 强密码提示 */}
            {level === 'strong' && (
              <div style={{ marginTop: 8, padding: 8, backgroundColor: '#f6ffed', borderRadius: 4 }}>
                <Text style={{ fontSize: 11, color: '#389e0d' }}>
                  ✅ 密码强度很好！
                </Text>
              </div>
            )}
          </div>
        )}
      </Space>
    </div>
  );
};

export default PasswordStrength;