@webapp-testing# Cursor Skills Manager 扩展发布指南

## 发布前准备

### 1. 检查必要文件

确保以下文件存在且内容完整：

- ✅ `package.json` - 扩展清单
- ✅ `README.md` - 项目说明文档
- ✅ `LICENSE` - 许可证文件（如果没有，需要创建）
- ✅ `CHANGELOG.md` - 更新日志（可选但推荐）

### 2. 更新版本号

在 `package.json` 中更新版本号（遵循语义化版本）：

```json
{
  "version": "0.1.0"  // 格式：主版本号.次版本号.修订号
}
```

版本号规则：
- **主版本号**：不兼容的 API 修改
- **次版本号**：向下兼容的功能性新增
- **修订号**：向下兼容的问题修正

### 3. 安装打包工具

```bash
npm install -g vsce
```

如果安装失败，可能需要管理员权限：
```bash
# Windows (PowerShell as Admin)
npm install -g vsce

# macOS/Linux
sudo npm install -g vsce
```

## 打包扩展

### 方法一：打包为 .vsix 文件（推荐用于本地安装）

```bash
# 1. 编译 TypeScript
npm run compile

# 2. 打包扩展
vsce package
```

成功后会在项目根目录生成 `cursor-skills-manager-0.1.0.vsix` 文件。

### 方法二：打包并排除文件

如果某些文件不需要打包，可以创建 `.vscodeignore` 文件：

```bash
# 创建 .vscodeignore
echo "src/**/*.ts" > .vscodeignore
echo "tsconfig.json" >> .vscodeignore
echo ".vscode/**" >> .vscodeignore
echo "node_modules/**" >> .vscodeignore
echo ".git/**" >> .vscodeignore
```

然后打包：
```bash
vsce package
```

## 本地安装测试

### 在 Cursor 中安装 .vsix 文件

1. 打开 Cursor
2. 按 `Ctrl+Shift+P` (Windows/Linux) 或 `Cmd+Shift+P` (macOS)
3. 输入：`Extensions: Install from VSIX...`
4. 选择生成的 `.vsix` 文件
5. 重启 Cursor

### 验证安装

- 在扩展列表中查看是否显示 "Cursor Skills Manager"
- 在资源管理器中查看是否出现 "Cursor Skills" 视图
- 测试各项功能是否正常

## 发布到 VS Code Marketplace

### 1. 创建发布账号

1. 访问 [Azure DevOps](https://dev.azure.com/)
2. 注册/登录账号
3. 创建 Personal Access Token：
   - 点击右上角用户图标 → Personal Access Tokens
   - 创建新 Token，权限选择：
     - **Marketplace**: Read & Manage
   - 保存 Token（只显示一次）

### 2. 登录 vsce

```bash
vsce login <你的发布者名称>
```

输入刚才创建的 Personal Access Token。

### 3. 发布扩展

```bash
# 发布到 Marketplace
vsce publish
```

或者发布特定版本：
```bash
vsce publish 0.1.0
```

### 4. 更新扩展

更新版本号后再次发布：
```bash
# 1. 更新 package.json 中的版本号
# 2. 编译
npm run compile
# 3. 发布
vsce publish
```

## 发布到 Open VSX Registry（可选）

Open VSX 是 VS Code 扩展的开源替代市场：

```bash
# 安装 ovsx 工具
npm install -g ovsx

# 发布
ovsx publish cursor-skills-manager-0.1.0.vsix
```

## 发布检查清单

发布前请确认：

- [ ] 版本号已更新
- [ ] README.md 内容完整且准确
- [ ] LICENSE 文件已添加
- [ ] 代码已编译无错误 (`npm run compile`)
- [ ] 功能已测试通过
- [ ] package.json 中的信息完整：
  - [ ] `name` - 扩展标识符（小写，用连字符）
  - [ ] `displayName` - 显示名称
  - [ ] `description` - 简短描述
  - [ ] `version` - 版本号
  - [ ] `publisher` - 发布者名称
  - [ ] `repository` - 仓库地址（如果有）
  - [ ] `keywords` - 关键词（可选）
  - [ ] `categories` - 分类
  - [ ] `engines.vscode` - VS Code 版本要求

## package.json 发布配置示例

```json
{
  "name": "cursor-skills-manager",
  "displayName": "Cursor Skills Manager",
  "description": "管理 Cursor IDE 技能：自动添加技能文件夹到工作区，选择技能供 AI 使用",
  "version": "0.1.6",
  "publisher": "huangjianjian",
  "repository": {
  "type": "git",
  "url": "https://github.com/a3252357/tool.git"
  },
  "keywords": [
    "cursor",
    "skills",
    "ai",
    "management"
  ],
  "categories": [
    "Other"
  ],
  "engines": {
    "vscode": "^1.74.0"
  },
  "license": "MIT"
}
```

## 常见问题

### 1. 打包时提示缺少文件

**问题**：`Error: Missing publisher name. Learn more: https://code.visualstudio.com/api/working-with-extensions/publishing-extension`

**解决**：在 `package.json` 中添加 `publisher` 字段。

### 2. 发布时提示版本已存在

**问题**：`Error: Extension with same version already exists`

**解决**：更新 `package.json` 中的版本号。

### 3. 打包文件过大

**问题**：`.vsix` 文件超过限制

**解决**：
- 检查是否包含了 `node_modules`
- 创建 `.vscodeignore` 排除不必要的文件
- 确保 `package.json` 中的 `files` 字段正确配置

### 4. 本地安装后扩展不工作

**解决**：
- 检查 Cursor 版本是否满足 `engines.vscode` 要求
- 查看 Cursor 的输出面板（视图 → 输出 → 选择扩展名称）
- 检查扩展是否正确激活

## 自动化发布脚本

可以创建脚本自动化发布流程：

### publish.sh (macOS/Linux)

```bash
#!/bin/bash

# 检查版本号
VERSION=$(node -p "require('./package.json').version")
echo "发布版本: $VERSION"

# 编译
echo "编译中..."
npm run compile

# 打包
echo "打包中..."
vsce package

# 询问是否发布
read -p "是否发布到 Marketplace? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    vsce publish
fi
```

### publish.ps1 (Windows)

```powershell
# 检查版本号
$version = (Get-Content package.json | ConvertFrom-Json).version
Write-Host "发布版本: $version"

# 编译
Write-Host "编译中..."
npm run compile

# 打包
Write-Host "打包中..."
vsce package

# 询问是否发布
$confirm = Read-Host "是否发布到 Marketplace? (y/n)"
if ($confirm -eq 'y' -or $confirm -eq 'Y') {
    vsce publish
}
```

## 后续维护

### 更新扩展

1. 修改代码
2. 更新版本号
3. 更新 CHANGELOG.md（如果有）
4. 提交代码
5. 打包：`vsce package`
6. 发布：`vsce publish`

### 撤销发布

如果发布有问题，可以撤销：

```bash
vsce unpublish <扩展ID>@<版本号>
```

⚠️ **注意**：撤销发布会影响已安装的用户，请谨慎操作。

## 参考资源

- [VS Code 扩展发布文档](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [vsce 工具文档](https://github.com/microsoft/vscode-vsce)
- [Open VSX Registry](https://open-vsx.org/)
- [语义化版本规范](https://semver.org/lang/zh-CN/)
