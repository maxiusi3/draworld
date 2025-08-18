# 🚀 Vercel部署配置指南

## ❌ **当前问题**

GitHub Actions部署失败，错误信息：
```
Error: Input required and not supplied: vercel-token
```

这是因为GitHub仓库中缺少必要的Vercel secrets配置。

---

## ✅ **解决方案**

### **第一步：获取Vercel Token**

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击右上角头像 → **Settings**
3. 在左侧菜单选择 **Tokens**
4. 点击 **Create Token**
5. 输入Token名称（如：`draworld-github-actions`）
6. 选择Scope为 **Full Account**
7. 点击 **Create** 并复制生成的token

### **第二步：获取Vercel项目信息**

1. 在Vercel Dashboard中找到您的`draworld`项目
2. 点击项目进入项目设置
3. 在 **Settings** → **General** 中找到：
   - **Project ID** (类似：`prj_xxxxxxxxxxxxx`)
   - **Team ID** (如果是团队项目) 或 **User ID**

### **第三步：在GitHub中设置Secrets**

1. 访问您的GitHub仓库：https://github.com/maxiusi3/draworld
2. 点击 **Settings** 标签
3. 在左侧菜单选择 **Secrets and variables** → **Actions**
4. 点击 **New repository secret** 添加以下secrets：

#### **必需的Secrets：**

| Secret名称 | 值 | 说明 |
|-----------|---|------|
| `VERCEL_TOKEN` | `vercel_xxxxx...` | 第一步获取的Vercel Token |
| `VERCEL_PROJECT_ID` | `prj_xxxxx...` | 项目ID |
| `VERCEL_ORG_ID` | `team_xxxxx...` 或 `user_xxxxx...` | 组织/用户ID |

#### **添加步骤：**
1. 点击 **New repository secret**
2. 输入 **Name**：`VERCEL_TOKEN`
3. 输入 **Secret**：粘贴您的Vercel token
4. 点击 **Add secret**
5. 重复以上步骤添加其他两个secrets

---

## 🔧 **验证配置**

设置完成后，您可以：

1. **手动触发部署**：
   - 在GitHub仓库中点击 **Actions** 标签
   - 选择 **Deploy to Vercel Production** workflow
   - 点击 **Run workflow** → **Run workflow**

2. **推送代码触发**：
   - 推送任何代码到`main`分支都会自动触发部署

---

## 📋 **当前工作流配置**

您的`.github/workflows/vercel-deploy.yml`已正确配置：

```yaml
- name: Deploy to Vercel
  uses: amondnet/vercel-action@v25
  with:
    vercel-token: ${{ secrets.VERCEL_TOKEN }}
    vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
    vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
    vercel-args: '--prod'
    working-directory: ./
```

---

## 🎯 **部署目标**

- **生产环境URL**: https://draworld-opal.vercel.app
- **自动部署**: 每次推送到`main`分支
- **手动部署**: 通过GitHub Actions手动触发

---

## ⚠️ **注意事项**

1. **Token安全性**: 
   - 不要在代码中硬编码token
   - 定期更新token以确保安全

2. **权限设置**:
   - 确保token有足够权限访问项目
   - 如果是团队项目，确保您有部署权限

3. **环境变量**:
   - 在Vercel Dashboard中配置生产环境变量
   - 包括数据库连接、API密钥等

---

## 🆘 **故障排除**

### **如果仍然失败：**

1. **检查Token有效性**：
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" https://api.vercel.com/v2/user
   ```

2. **验证项目ID**：
   - 确保项目ID正确
   - 确保项目存在且可访问

3. **检查权限**：
   - 确保GitHub Actions有读写权限
   - 确保Vercel token有部署权限

### **常见错误解决**：

- `Project not found`: 检查VERCEL_PROJECT_ID
- `Unauthorized`: 检查VERCEL_TOKEN
- `Team not found`: 检查VERCEL_ORG_ID

---

## 📞 **需要帮助？**

如果按照以上步骤设置后仍有问题，请提供：
1. 错误日志截图
2. 已设置的secrets列表（不要包含实际值）
3. Vercel项目设置截图

设置完成后，重新运行GitHub Actions即可成功部署！
