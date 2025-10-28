module.exports = {
  // 测试环境
  testEnvironment: 'jsdom',
  
  // 根目录
  rootDir: '../',
  
  // 测试文件匹配模式
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(ts|tsx|js|jsx)',
    '<rootDir>/src/**/*.(test|spec).(ts|tsx|js|jsx)'
  ],
  
  // 模块文件扩展名
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // 模块名映射（路径别名）
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/pages/(.*)$': '<rootDir>/src/pages/$1',
    '^@/api/(.*)$': '<rootDir>/src/api/$1',
    '^@/store/(.*)$': '<rootDir>/src/store/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@/test/(.*)$': '<rootDir>/src/test/$1'
  },
  
  // 转换配置
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  
  // 设置文件
  setupFilesAfterEnv: [
    '<rootDir>/src/test/setup.ts'
  ],
  
  // 模块路径忽略模式
  modulePathIgnorePatterns: [
    '<rootDir>/dist/',
    '<rootDir>/build/'
  ],
  
  // 忽略转换的模块
  transformIgnorePatterns: [
    'node_modules/(?!(antd|@ant-design|rc-.*|@babel/runtime)/)'
  ],
  
  // 覆盖率配置
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/main.tsx',
    '!src/vite-env.d.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // 全局变量
  globals: {
    'ts-jest': {
      useESM: true,
      tsconfig: {
        jsx: 'react-jsx'
      }
    }
  },
  
  // 清除模拟
  clearMocks: true,
  restoreMocks: true,
  
  // 测试超时
  testTimeout: 10000,
  
  // 静态资源模拟
  moduleNameMapping: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/src/test/mocks/fileMock.js'
  },
  
  // 报告器
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'test-results',
      outputName: 'junit.xml'
    }]
  ],
  
  // 详细输出
  verbose: true,
  
  // 错误时停止
  bail: false,
  
  // 最大工作进程
  maxWorkers: '50%'
}