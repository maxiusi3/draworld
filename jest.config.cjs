/** @type {import('jest').Config} */
module.exports = {
  // 测试环境
  testEnvironment: 'jsdom',

  // 根目录
  roots: ['<rootDir>/src'],

  // 测试文件匹配模式
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.(test|spec).{js,jsx,ts,tsx}'
  ],

  // 文件扩展名
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],

  // 模块名映射
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': 'jest-transform-stub'
  },

  // 转换配置
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json'
    }],
    '^.+\\.(js|jsx)$': 'babel-jest'
  },

  // 忽略转换的模块
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|@testing-library))'
  ],

  // 设置文件
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],

  // 覆盖率配置
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/reportWebVitals.ts',
    '!src/setupTests.ts'
  ],

  // 覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },

  // 覆盖率报告格式
  coverageReporters: ['text', 'lcov', 'html'],

  // 覆盖率输出目录
  coverageDirectory: 'coverage',

  // 清除模拟
  clearMocks: true,

  // 每次测试前重置模块
  resetMocks: true,

  // 测试超时时间
  testTimeout: 10000,

  // 详细输出
  verbose: true
};
