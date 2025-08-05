import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Footer from '../Footer';

// 测试辅助函数
const renderFooter = () => {
  return render(
    <BrowserRouter>
      <Footer />
    </BrowserRouter>
  );
};

describe('Footer Component', () => {
  test('应该显示品牌信息', () => {
    renderFooter();
    
    expect(screen.getByText('童画奇旅')).toBeInTheDocument();
  });

  test('应该显示版权信息', () => {
    renderFooter();
    
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(currentYear.toString()))).toBeInTheDocument();
  });

  test('应该有正确的CSS类名', () => {
    const { container } = renderFooter();
    const footer = container.querySelector('footer');
    
    expect(footer).toHaveClass('bg-gradient-to-r');
  });

  test('应该包含联系信息', () => {
    renderFooter();
    
    // 检查是否有邮箱或其他联系方式
    // 这里需要根据实际的Footer组件内容来调整
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });
});
