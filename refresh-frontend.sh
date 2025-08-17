#!/bin/bash

# 前端积分修复后的刷新脚本
# 确保修复生效的完整流程

echo "🔄 前端积分修复 - 刷新脚本"
echo "================================"

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本"
    exit 1
fi

echo "📁 当前目录: $(pwd)"
echo ""

# 步骤1: 停止现有的开发服务器
echo "🛑 步骤1: 停止现有的开发服务器..."
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "yarn dev" 2>/dev/null || true
pkill -f "pnpm dev" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
sleep 2
echo "   ✅ 开发服务器已停止"

# 步骤2: 清理构建缓存
echo ""
echo "🧹 步骤2: 清理构建缓存..."
if [ -d ".next" ]; then
    rm -rf .next
    echo "   ✅ 清理 .next 目录"
fi

if [ -d "node_modules/.cache" ]; then
    rm -rf node_modules/.cache
    echo "   ✅ 清理 node_modules/.cache"
fi

if [ -d ".cache" ]; then
    rm -rf .cache
    echo "   ✅ 清理 .cache 目录"
fi

# 步骤3: 验证修复文件
echo ""
echo "🔍 步骤3: 验证修复文件..."
if [ -f "src/config/demo.ts" ]; then
    echo "   ✅ 演示配置文件存在: src/config/demo.ts"
else
    echo "   ❌ 演示配置文件缺失: src/config/demo.ts"
fi

# 检查关键修复
echo "   📋 检查关键修复..."
if grep -q "getVideoGenerationCost" src/pages/CreatePage.tsx; then
    echo "   ✅ CreatePage 使用动态积分要求"
else
    echo "   ❌ CreatePage 可能仍使用硬编码积分"
fi

if grep -q "getVideoGenerationCost" src/hooks/useCredits.ts; then
    echo "   ✅ useCredits hook 使用动态积分要求"
else
    echo "   ❌ useCredits hook 可能仍使用硬编码积分"
fi

# 步骤4: 重新安装依赖（可选）
echo ""
echo "📦 步骤4: 检查依赖..."
if [ "$1" = "--reinstall" ]; then
    echo "   🔄 重新安装依赖..."
    if command -v pnpm &> /dev/null; then
        pnpm install
    elif command -v yarn &> /dev/null; then
        yarn install
    else
        npm install
    fi
    echo "   ✅ 依赖重新安装完成"
else
    echo "   ⏭️  跳过依赖重新安装 (使用 --reinstall 强制重新安装)"
fi

# 步骤5: 启动开发服务器
echo ""
echo "🚀 步骤5: 启动开发服务器..."
echo "   📋 启动命令: npm run dev"
echo "   📋 访问地址: http://localhost:3000"
echo ""

# 检测包管理器并启动
if command -v pnpm &> /dev/null && [ -f "pnpm-lock.yaml" ]; then
    echo "   🎯 使用 pnpm 启动..."
    pnpm dev &
elif command -v yarn &> /dev/null && [ -f "yarn.lock" ]; then
    echo "   🎯 使用 yarn 启动..."
    yarn dev &
else
    echo "   🎯 使用 npm 启动..."
    npm run dev &
fi

# 等待服务器启动
echo "   ⏳ 等待服务器启动..."
sleep 5

# 检查服务器是否启动成功
if curl -s http://localhost:3000 > /dev/null; then
    echo "   ✅ 开发服务器启动成功"
else
    echo "   ⚠️  开发服务器可能仍在启动中..."
fi

# 步骤6: 浏览器缓存清理指南
echo ""
echo "🌐 步骤6: 浏览器缓存清理指南"
echo "================================"
echo ""
echo "📋 请在浏览器中执行以下操作："
echo ""
echo "   Chrome/Edge:"
echo "   • 按 Ctrl+Shift+R (Windows) 或 Cmd+Shift+R (Mac) 硬刷新"
echo "   • 或者按 F12 打开开发者工具，右键刷新按钮选择'清空缓存并硬性重新加载'"
echo ""
echo "   Firefox:"
echo "   • 按 Ctrl+F5 (Windows) 或 Cmd+Shift+R (Mac) 硬刷新"
echo "   • 或者按 Ctrl+Shift+Delete 打开清除数据对话框"
echo ""
echo "   Safari:"
echo "   • 按 Cmd+Option+R 硬刷新"
echo "   • 或者在开发菜单中选择'清空缓存'"
echo ""

# 步骤7: 验证修复
echo "🔍 步骤7: 验证修复效果"
echo "====================="
echo ""
echo "📋 请在浏览器中验证以下内容："
echo ""
echo "   1. 访问 http://localhost:3000"
echo "   2. 登录并进入创建页面"
echo "   3. 查看积分要求显示："
echo "      ✅ 应该显示 '生成视频需要 1 积分'"
echo "      ✅ 应该显示 '演示环境优惠' 绿色标签"
echo "   4. 检查按钮状态："
echo "      ✅ 有1积分以上的用户应该可以点击生成按钮"
echo "   5. 尝试生成视频："
echo "      ✅ 应该只消费1积分"
echo "      ✅ 生成成功后积分余额正确减少"
echo ""

# 步骤8: 故障排除
echo "🔧 步骤8: 故障排除"
echo "=================="
echo ""
echo "如果仍然显示60积分，请检查："
echo ""
echo "   1. 浏览器控制台错误："
echo "      • 按 F12 打开开发者工具"
echo "      • 查看 Console 标签页是否有红色错误"
echo ""
echo "   2. 网络请求："
echo "      • 在 Network 标签页中查看API请求"
echo "      • 确认请求返回正确的积分要求"
echo ""
echo "   3. 本地存储："
echo "      • 在 Application 标签页中清除 Local Storage"
echo "      • 清除 Session Storage"
echo ""
echo "   4. 服务器日志："
echo "      • 查看终端中的服务器日志"
echo "      • 确认没有编译错误"
echo ""

echo "🎉 前端积分修复刷新完成！"
echo ""
echo "💡 提示: 如果问题仍然存在，请运行以下命令进行深度清理："
echo "   ./refresh-frontend.sh --reinstall"
echo ""
echo "📞 需要帮助？请检查："
echo "   • 浏览器控制台错误信息"
echo "   • 服务器终端日志"
echo "   • 确认访问的是 http://localhost:3000"
