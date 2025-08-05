// 工具函数测试
describe('工具函数测试', () => {
  describe('字符串处理', () => {
    test('应该正确截断长文本', () => {
      const truncateText = (text: string, maxLength: number) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
      };

      expect(truncateText('这是一个很长的文本', 5)).toBe('这是一个很...');
      expect(truncateText('短文本', 10)).toBe('短文本');
    });

    test('应该正确验证邮箱格式', () => {
      const isValidEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      };

      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
    });
  });

  describe('数组处理', () => {
    test('应该正确去重数组', () => {
      const uniqueArray = (arr: any[]) => [...new Set(arr)];

      expect(uniqueArray([1, 2, 2, 3, 3, 4])).toEqual([1, 2, 3, 4]);
      expect(uniqueArray(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
    });

    test('应该正确分页数组', () => {
      const paginateArray = (arr: any[], page: number, size: number) => {
        const start = (page - 1) * size;
        return arr.slice(start, start + size);
      };

      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      expect(paginateArray(data, 1, 3)).toEqual([1, 2, 3]);
      expect(paginateArray(data, 2, 3)).toEqual([4, 5, 6]);
      expect(paginateArray(data, 4, 3)).toEqual([10]);
    });
  });

  describe('日期处理', () => {
    test('应该正确格式化日期', () => {
      const formatDate = (date: Date) => {
        return date.toLocaleDateString('zh-CN');
      };

      const testDate = new Date('2025-08-05');
      expect(formatDate(testDate)).toMatch(/2025/);
    });

    test('应该正确计算时间差', () => {
      const getTimeDiff = (date1: Date, date2: Date) => {
        return Math.abs(date1.getTime() - date2.getTime());
      };

      const date1 = new Date('2025-08-05 10:00:00');
      const date2 = new Date('2025-08-05 11:00:00');
      expect(getTimeDiff(date1, date2)).toBe(3600000); // 1小时 = 3600000毫秒
    });
  });
});
