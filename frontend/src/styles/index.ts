// 导入全局样式
import './variables.css';
import './global.css';

// 导出样式相关的工具函数和常量
export const breakpoints = {
  xs: 480,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1600,
} as const;

export const zIndex = {
  dropdown: 1050,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  notification: 1080,
} as const;

export const colors = {
  primary: '#1890ff',
  success: '#52c41a',
  warning: '#faad14',
  error: '#ff4d4f',
  info: '#1890ff',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  base: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const borderRadius = {
  sm: 4,
  base: 6,
  lg: 8,
  xl: 12,
} as const;

export const fontSize = {
  xs: 12,
  sm: 13,
  base: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
} as const;

export const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

export const lineHeight = {
  sm: 1.2,
  base: 1.5715,
  lg: 1.8,
} as const;

export const shadows = {
  1: '0 2px 8px rgba(0, 0, 0, 0.06)',
  2: '0 4px 12px rgba(0, 0, 0, 0.1)',
  3: '0 6px 16px rgba(0, 0, 0, 0.12)',
  4: '0 8px 24px rgba(0, 0, 0, 0.14)',
  5: '0 12px 32px rgba(0, 0, 0, 0.16)',
} as const;

export const transitions = {
  fast: '0.1s',
  base: '0.3s',
  slow: '0.5s',
} as const;

export const easings = {
  easeOut: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
  easeIn: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
  easeInOut: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
  easeOutBack: 'cubic-bezier(0.12, 0.4, 0.29, 1.46)',
  easeInBack: 'cubic-bezier(0.71, -0.46, 0.88, 0.6)',
  easeInOutBack: 'cubic-bezier(0.71, -0.46, 0.29, 1.46)',
} as const;

// 响应式工具函数
export const mediaQuery = {
  up: (breakpoint: keyof typeof breakpoints) => `@media (min-width: ${breakpoints[breakpoint]}px)`,
  down: (breakpoint: keyof typeof breakpoints) => `@media (max-width: ${breakpoints[breakpoint] - 1}px)`,
  between: (min: keyof typeof breakpoints, max: keyof typeof breakpoints) =>
    `@media (min-width: ${breakpoints[min]}px) and (max-width: ${breakpoints[max] - 1}px)`,
  only: (breakpoint: keyof typeof breakpoints) => {
    const keys = Object.keys(breakpoints) as Array<keyof typeof breakpoints>;
    const index = keys.indexOf(breakpoint);
    const nextBreakpoint = keys[index + 1];
    
    if (nextBreakpoint) {
      return `@media (min-width: ${breakpoints[breakpoint]}px) and (max-width: ${breakpoints[nextBreakpoint] - 1}px)`;
    }
    return `@media (min-width: ${breakpoints[breakpoint]}px)`;
  },
};

// 主题相关工具函数
export const getThemeColor = (color: keyof typeof colors, theme: 'light' | 'dark' = 'light') => {
  const baseColor = colors[color];
  
  if (theme === 'dark') {
    // 暗色主题下的颜色调整
    switch (color) {
      case 'primary':
        return '#1890ff';
      case 'success':
        return '#52c41a';
      case 'warning':
        return '#faad14';
      case 'error':
        return '#ff4d4f';
      case 'info':
        return '#1890ff';
      default:
        return baseColor;
    }
  }
  
  return baseColor;
};

// CSS-in-JS 样式工具函数
export const createStyles = <T extends Record<string, React.CSSProperties>>(styles: T): T => styles;

// 动画类名工具函数
export const animationClasses = {
  fadeIn: 'fade-in',
  slideInUp: 'slide-in-up',
  slideInDown: 'slide-in-down',
  slideInLeft: 'slide-in-left',
  slideInRight: 'slide-in-right',
} as const;

// 工具类名
export const utilityClasses = {
  textCenter: 'text-center',
  textLeft: 'text-left',
  textRight: 'text-right',
  fullWidth: 'full-width',
  fullHeight: 'full-height',
  flexCenter: 'flex-center',
  flexBetween: 'flex-between',
  flexColumn: 'flex-column',
  noMargin: 'no-margin',
  noPadding: 'no-padding',
} as const;

// 导出所有样式常量
export const styleConstants = {
  breakpoints,
  zIndex,
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  lineHeight,
  shadows,
  transitions,
  easings,
  animationClasses,
  utilityClasses,
} as const;

export type StyleConstants = typeof styleConstants;
export type Breakpoint = keyof typeof breakpoints;
export type Color = keyof typeof colors;
export type Spacing = keyof typeof spacing;
export type BorderRadius = keyof typeof borderRadius;
export type FontSize = keyof typeof fontSize;
export type FontWeight = keyof typeof fontWeight;
export type LineHeight = keyof typeof lineHeight;
export type Shadow = keyof typeof shadows;
export type Transition = keyof typeof transitions;
export type Easing = keyof typeof easings;
export type AnimationClass = keyof typeof animationClasses;
export type UtilityClass = keyof typeof utilityClasses;