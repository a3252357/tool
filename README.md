# Cursor Skills Manager

一个用于管理 Cursor IDE 技能的 VS Code 扩展，可以自动添加技能文件夹到工作区，并让你方便地选择和管理技能供 AI 使用。

## 功能特性

- 🔍 **自动扫描技能**：可自定义技能根目录路径，递归扫描该目录下所有包含 SKILL.md 的文件夹作为技能
- 📁 **工作区集成**：自动将配置的技能文件夹添加到工作区，方便管理和编辑
- ✅ **技能管理**：可视化界面管理所有可用技能
- 🎯 **启用/禁用**：轻松切换技能的启用状态
- 📝 **技能详情**：快速查看技能描述和内容
- 🇨🇳 **中文描述**：为每个技能添加中文描述，方便理解和使用
- 🏷️ **自定义分类**：可以手动设置技能的分类（个人/项目/内置）
- @ **技能引用**：在 AI 对话框中输入 @ 时自动显示技能列表，快速引用技能
- 🔄 **实时更新**：自动监听文件系统变化，实时更新技能列表

## 安装

### 从 VS Code Marketplace 安装（推荐）

1. 打开 Cursor 或 VS Code
2. 按 `Ctrl+Shift+X` (Windows/Linux) 或 `Cmd+Shift+X` (macOS) 打开扩展视图
3. 搜索 "Cursor Skills Manager"
4. 点击安装

### 从源码安装

1. 克隆或下载此仓库
2. 在项目目录运行：
   ```bash
   npm install
   npm run compile
   ```
3. 按 `F5` 在扩展开发宿主中运行，或使用 `vsce` 打包：
   ```bash
   npm install -g vsce
   vsce package
   ```
4. 在 Cursor 中安装生成的 `.vsix` 文件：
   - 按 `Ctrl+Shift+P` 打开命令面板
   - 输入 "Extensions: Install from VSIX..."
   - 选择生成的 `.vsix` 文件

## 使用方法

### 查看技能列表

扩展激活后，在资源管理器的侧边栏会显示 "Cursor Skills" 视图：

**如果配置了自定义技能文件夹路径**：
- 直接显示该文件夹下的所有技能

**如果使用默认路径**：
- **个人技能**：`~/.cursor/skills/` 目录下的技能
- **项目技能**：项目 `.cursor/skills/` 目录下的技能
- **内置技能**：`~/.cursor/skills-cursor/` 目录下的 Cursor 内置技能

### 管理技能

- **刷新列表**：点击视图标题栏的刷新按钮
- **启用/禁用技能**：点击技能项前的复选框图标
- **设置中文描述**：右键点击技能，选择 "设置中文描述"，为技能添加中文说明
- **设置分类**：
  - 支持单个或**批量**设置分类
  - 在视图中按 `Ctrl` / `Shift` 多选多个技能，右键任意一个 → 选择 "设置分类"
  - 选择目标分类后，会一次性应用到所有选中的技能
- **生成 / 命令**：
  - 在视图中多选一个或多个技能，右键 → 选择 "为技能生成 / 命令"
  - 选择生成位置：
    - 全局：`~/.cursor/commands/skills/`
    - 当前工作区：`./.cursor/commands/skills/`
    - 全局 + 当前工作区
  - 生成的 `.md` 文件可在聊天框中通过 `/命令名` 调用，配合 Cursor 的 [Commands 功能](https://cursor.com/cn/docs/context/commands) 使用
- **插入技能引用**：按 `Ctrl+Shift+P`，输入 "Cursor Skills: 插入技能引用"，选择技能后会在编辑器中插入 `@技能名`
- **@ 自动补全**：在任何输入框中输入 `@` 符号，会自动显示可用技能列表，支持搜索
- **查看详情**：右键点击技能，选择 "查看技能详情"
- **打开文件夹**：右键点击技能，选择 "打开技能文件夹"

### 添加到工作区

点击视图标题栏的 "添加技能文件夹到工作区" 按钮，所有技能文件夹会自动添加到当前工作区。

## 配置选项

在设置中搜索 "Cursor Skills Manager" 可以配置：

- `cursorSkills.autoAddToWorkspace`：是否自动将技能文件夹添加到工作区（默认：false）
- `cursorSkills.skillsPath`：自定义技能根目录路径（配置后会递归扫描该目录下所有包含 SKILL.md 的文件夹作为技能，并添加到工作区。例如：`D:\baodian\AIWork`。留空则使用默认路径 `~/.cursor/skills*`）
- `cursorSkills.workspaceSaveFolder`：当自动添加技能文件夹到工作区后，如果当前不是已保存的 workspace，则在此目录下自动生成一个 `.code-workspace` 文件。留空则不自动保存。可填写绝对路径，例如：`D:\baodian\AIWork\workspaces`

### 使用自定义技能根目录

**方法一：通过命令设置（推荐）**
1. 按 `Ctrl+Shift+P` 打开命令面板
2. 输入 "Cursor Skills: 设置技能文件夹路径"
3. 输入你的技能根目录路径，例如：`D:\baodian\AIWork` 或 `/home/user/myskills`
4. 选择是否立即添加到工作区

**方法二：通过设置配置**
1. 打开设置（Ctrl+,），搜索 "Cursor Skills Manager"
2. 配置 `cursorSkills.skillsPath` 为你的技能根目录路径
3. 启用 `cursorSkills.autoAddToWorkspace` 以自动将文件夹添加到工作区

**技能文件夹结构**
扩展会递归扫描配置的根目录下所有包含 `SKILL.md` 的文件夹作为技能。例如：
```
D:\baodian\AIWork\
├── project1\
│   └── skills\
│       ├── skill-one\
│       │   └── SKILL.md
│       └── skill-two\
│           └── SKILL.md
├── project2\
│   └── my-skill\
│       └── SKILL.md
└── tools\
    └── tool-skill\
        └── SKILL.md
```
所有包含 `SKILL.md` 的文件夹都会被识别为技能，无论它们在根目录下的哪个位置。

## 技能存储位置

技能配置存储在扩展的全局存储目录：
- Windows: `%APPDATA%\Cursor\User\globalStorage\cursor-skills-manager\`
- macOS/Linux: `~/.config/Cursor/User/globalStorage/cursor-skills-manager/`

存储文件：
- `enabled-skills.json`：已启用的技能列表
- `chinese-descriptions.json`：技能的中文描述映射
- `skill-categories.json`：技能的自定义分类映射

### 中文描述功能

你可以为每个技能添加中文描述，方便理解和使用：

1. **设置中文描述**：
   - 右键点击技能 → "设置中文描述"
   - 输入中文描述（最多200个字符）
   - 留空则删除中文描述

2. **显示效果**：
   - 技能列表中会优先显示中文描述
   - 技能名称后会在括号中显示中文描述
   - 鼠标悬停时显示完整描述

3. **数据存储**：
   - 中文描述保存在 `chinese-descriptions.json` 文件中
   - 以技能路径为键，中文描述为值
   - 可以手动编辑该文件批量管理中文描述

## 开发

### 项目结构

```
.
├── src/
│   ├── extension.ts          # 扩展入口
│   ├── skillsManager.ts      # 技能管理核心逻辑
│   └── skillsProvider.ts     # 树视图数据提供者
├── package.json              # 扩展清单
├── tsconfig.json             # TypeScript 配置
└── README.md                 # 说明文档
```

### 构建

```bash
npm install
npm run compile
```

### 调试

1. 按 `F5` 启动扩展开发宿主
2. 在新窗口中测试扩展功能

## 许可证

MIT

## 发布

详细的发布指南请查看 [PUBLISH.md](PUBLISH.md)

### 快速发布

**Windows:**
```powershell
.\scripts\publish.ps1
```

**macOS/Linux:**
```bash
chmod +x scripts/publish.sh
./scripts/publish.sh
```

**手动发布:**
```bash
# 1. 安装 vsce
npm install -g vsce

# 2. 编译
npm run compile

# 3. 打包
vsce package

# 4. 发布（需要先登录）
vsce login huangjianjian
vsce publish
```

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件
