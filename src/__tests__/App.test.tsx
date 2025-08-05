describe('基础测试套件', () => {
  test('基本的数学运算', () => {
    expect(2 + 2).toBe(4);
  });

  test('字符串匹配', () => {
    expect('童画奇旅').toMatch(/童画/);
  });

  test('数组包含测试', () => {
    const fruits = ['apple', 'banana', 'orange'];
    expect(fruits).toContain('banana');
  });

  test('对象属性测试', () => {
    const user = { name: '测试用户', age: 25 };
    expect(user).toHaveProperty('name');
    expect(user.name).toBe('测试用户');
  });
});
