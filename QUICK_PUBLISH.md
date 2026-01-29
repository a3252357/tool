# 快速发布指南

## 发布前检查

1. ✅ 更新 `package.json` 中的版本号
2. ✅ 更新 `CHANGELOG.md` 记录变更
3. ✅ 确保代码已编译无错误
4. ✅ 测试功能正常

## 发布步骤

### 方法一：使用发布脚本（推荐）

**Windows:**
```powershell
.\scripts\publish.ps1
```

**macOS/Linux:**
```bash
chmod +x scripts/publish.sh
./scripts/publish.sh
```

### 方法二：手动发布

```bash
# 1. 安装打包工具
npm install -g vsce

# 2. 编译项目
npm run compile

# 3. 打包扩展
vsce package

# 4. 本地测试安装
# 在 Cursor 中：Ctrl+Shift+P -> Extensions: Install from VSIX...

# 5. 发布到 Marketplace（首次需要登录）
vsce login <your-publisher-name>
vsce publish
```

## 更新 package.json

发布前需要更新以下字段：

```json
{
  "version": "0.1.0",           // 更新版本号
  "publisher": "your-name",     // 设置发布者名称
  "repository": {                // 添加仓库地址（可选）
    "type": "git",
    "url": "https://github.com/your-username/cursor-skills-manager.git"
  }
}
```

## 常见问题

**Q: 提示缺少 publisher？**
A: 在 `package.json` 中添加 `"publisher": "your-publisher-name"`

**Q: 版本已存在？**
A: 更新 `package.json` 中的版本号

**Q: 如何撤销发布？**
A: `vsce unpublish <extension-id>@<version>`

更多详情请查看 [PUBLISH.md](PUBLISH.md)
