// Jest-dom 添加自定义的 jest 匹配器来测试 DOM 节点
import '@testing-library/jest-dom';

// 移除 Firebase 相关 mock；如需 mock 认证或 API，请针对 adapters 进行 mock
jest.mock('./lib/adapters/authAdapter', () => ({
  authAdapter: {
    getIdToken: async () => 'test-token',
    buildAuthorizeUrl: async () => 'http://localhost/callback?code=TEST',
    exchangeCode: async () => ({ access_token: 'x', id_token: 'y', token_type: 'Bearer' }),
    getSession: () => ({ tokens: { access_token: 'x', id_token: 'y', token_type: 'Bearer' } }),
    setSession: () => {},
  }
}));


// 模拟 React Router
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({
    pathname: '/',
    search: '',
    hash: '',
    state: null,
  }),
}));

// 模拟 window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// 模拟 IntersectionObserver
(global as any).IntersectionObserver = class IntersectionObserver {
  root = null;
  rootMargin = '';
  thresholds = [];

  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
  takeRecords() {
    return [];
  }
};

// 模拟 ResizeObserver
(global as any).ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// 设置全局测试超时
jest.setTimeout(10000);
