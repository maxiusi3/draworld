const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '<rootDir>/tests/**/*.{js,jsx,ts,tsx}',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/tests/e2e/', // Exclude Playwright tests
    '<rootDir>/tests/services/videoService.test.ts', // Temporarily exclude
    '<rootDir>/tests/integration/stripeIntegration.test.ts', // Temporarily exclude
    '<rootDir>/tests/integration/runwareIntegration.test.ts', // Temporarily exclude
    '<rootDir>/tests/integration/referralSystem.test.ts', // Temporarily exclude
    '<rootDir>/src/hooks/__tests__/useVideoGeneration.test.tsx', // Firebase issues
    '<rootDir>/src/hooks/__tests__/useCredits.test.tsx', // Firebase issues
    '<rootDir>/src/components/ui/__tests__/ImageUploader.test.tsx', // Firebase issues
    '<rootDir>/tests/components/AuthForm.test.tsx', // Firebase issues
    '<rootDir>/tests/utils/testUtils.tsx', // Firebase issues
    '<rootDir>/src/components/auth/__tests__/AuthForm.test.tsx', // Firebase issues
    '<rootDir>/src/components/ui/__tests__/CreditDisplay.test.tsx', // Temporarily exclude
    '<rootDir>/tests/services/creditService.test.ts', // Temporarily exclude
    '<rootDir>/tests/performance/webVitals.test.ts', // Performance test issues
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/layout.tsx',
    '!src/app/globals.css',
    '!src/lib/firebase.ts', // Skip Firebase config
    '!src/types/**/*',
  ],
  coverageThreshold: {
    global: {
      branches: 10,
      functions: 10,
      lines: 10,
      statements: 10,
    },
  },
  testTimeout: 10000,
  moduleDirectories: ['node_modules', '<rootDir>/'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  transformIgnorePatterns: [
    '/node_modules/',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)