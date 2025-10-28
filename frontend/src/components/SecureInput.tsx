import React, { useState, useCallback, useMemo } from 'react';
import { Input, InputProps, Tooltip, Space } from 'antd';
import { EyeInvisibleOutlined, EyeTwoTone, SafetyOutlined, WarningOutlined } from '@ant-design/icons';
import { escapeHtml, validateEmail, validateUsername, validatePhone } from '@/utils/security';
import PasswordStrength from './PasswordStrength';

interface SecureInputProps extends Omit<InputProps, 'onChange'> {
  /** 输入类型 */
  inputType?: 'text' | 'email' | 'username' | 'phone' | 'password';
  /** 是否启用XSS防护 */
  enableXSSProtection?: boolean;
  /** 是否显示安全状态图标 */
  showSecurityIcon?: boolean;
  /** 是否显示密码强度（仅password类型有效） */
  showPasswordStrength?: boolean;
  /** 自定义验证函数 */
  customValidator?: (value: string) => { valid: boolean; message?: string };
  /** 值变化回调 */
  onChange?: (value: string, isValid: boolean) => void;
  /** 验证状态变化回调 */
  onValidationChange?: (isValid: boolean, message?: string) => void;
}

/**
 * 安全输入组件
 * 提供XSS防护、输入验证、密码强度检查等功能
 */
const SecureInput: React.FC<SecureInputProps> = ({
  inputType = 'text',
  enableXSSProtection = true,
  showSecurityIcon = true,
  showPasswordStrength = false,
  customValidator,
  onChange,
  onValidationChange,
  value,
  ...props
}) => {
  const [internalValue, setInternalValue] = useState<string>('');
  const [validationState, setValidationState] = useState<{
    valid: boolean;
    message?: string;
  }>({ valid: true });

  // 获取当前值
  const currentValue = value !== undefined ? String(value) : internalValue;

  // 验证函数
  const validateInput = useCallback((inputValue: string) => {
    if (!inputValue) {
      return { valid: true };
    }

    // 自定义验证优先
    if (customValidator) {
      return customValidator(inputValue);
    }

    // 内置验证
    switch (inputType) {
      case 'email':
        const emailValid = validateEmail(inputValue);
        return {
          valid: emailValid,
          message: emailValid ? undefined : '请输入有效的邮箱地址'
        };

      case 'username':
        const usernameValid = validateUsername(inputValue);
        return {
          valid: usernameValid,
          message: usernameValid ? undefined : '用户名只能包含字母、数字、下划线，长度3-20位'
        };

      case 'phone':
        const phoneValid = validatePhone(inputValue);
        return {
          valid: phoneValid,
          message: phoneValid ? undefined : '请输入有效的手机号码'
        };

      case 'password':
        // 密码只检查基本长度，强度由PasswordStrength组件处理
        const passwordValid = inputValue.length >= 6;
        return {
          valid: passwordValid,
          message: passwordValid ? undefined : '密码长度至少6位'
        };

      default:
        return { valid: true };
    }
  }, [inputType, customValidator]);

  // 处理输入变化
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;

    // XSS防护
    if (enableXSSProtection) {
      newValue = escapeHtml(newValue);
    }

    // 更新内部状态
    if (value === undefined) {
      setInternalValue(newValue);
    }

    // 验证输入
    const validation = validateInput(newValue);
    setValidationState(validation);

    // 触发回调
    onChange?.(newValue, validation.valid);
    onValidationChange?.(validation.valid, validation.message);
  }, [enableXSSProtection, validateInput, onChange, onValidationChange, value]);

  // 计算输入框状态
  const inputStatus = useMemo(() => {
    if (!currentValue) return undefined;
    return validationState.valid ? undefined : 'error';
  }, [currentValue, validationState.valid]);

  // 安全图标
  const securityIcon = useMemo(() => {
    if (!showSecurityIcon || !currentValue) return undefined;

    return validationState.valid ? (
      <Tooltip title="输入安全">
        <SafetyOutlined style={{ color: '#52c41a' }} />
      </Tooltip>
    ) : (
      <Tooltip title={validationState.message || '输入格式错误'}>
        <WarningOutlined style={{ color: '#ff4d4f' }} />
      </Tooltip>
    );
  }, [showSecurityIcon, currentValue, validationState]);

  // 密码输入特殊处理
  if (inputType === 'password') {
    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        <Input.Password
          {...props}
          value={currentValue}
          onChange={handleChange}
          status={inputStatus}
          suffix={securityIcon}
          iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
        />
        {showPasswordStrength && currentValue && (
          <PasswordStrength password={currentValue} />
        )}
      </Space>
    );
  }

  // 普通输入
  return (
    <Input
      {...props}
      type={inputType === 'email' ? 'email' : inputType === 'phone' ? 'tel' : 'text'}
      value={currentValue}
      onChange={handleChange}
      status={inputStatus}
      suffix={securityIcon}
    />
  );
};

export default SecureInput;