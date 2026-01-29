# Cursor Skills Manager 使用指南

## 快速开始

### 1. 安装扩展

#### 方法一：从源码安装（开发模式）

```bash
# 克隆或下载项目
cd cursor-skills-manager

# 安装依赖
npm install

# 编译项目
npm run compile

# 按 F5 启动扩展开发宿主进行测试
```

#### 方法二：打包安装

```bash
# 安装打包工具
npm install -g vsce

# 打包扩展
vsce package

# 在 Cursor 中安装生成的 .vsix 文件
# 命令面板 (Ctrl+Shift+P) -> Extensions: Install from VSIX...
```

### 2. 使用扩展

安装后，扩展会自动激活。你会看到：

1. **侧边栏视图**：在资源管理器中会出现 "Cursor Skills" 视图
2. **技能列表**：按类别显示所有可用技能
   - 个人技能：`~/.cursor/skills/` 目录
   - 项目技能：`.cursor/skills/` 目录（项目内）
   - 内置技能：`~/.cursor/skills-cursor/` 目录

### 3. 基本操作

#### 刷新技能列表
- 点击视图标题栏的刷新图标 🔄
- 或使用命令面板：`Cursor Skills: 刷新技能列表`

#### 启用/禁用技能
- 点击技能项前的复选框图标
- 已启用的技能会显示 ✓ 图标
- 技能状态会保存到配置文件中

#### 查看技能详情
- 右键点击技能 → "查看技能详情"
- 会在编辑器中打开 `SKILL.md` 文件

#### 打开技能文件夹
- 右键点击技能 → "打开技能文件夹"
- 会在文件管理器中打开技能目录

#### 添加技能文件夹到工作区
- 点击视图标题栏的文件夹图标 📁
- 所有技能文件夹会自动添加到当前工作区
- 这样可以直接在编辑器中访问和编辑技能文件

## 高级功能

### 配置选项

打开设置（Ctrl+,），搜索 "Cursor Skills Manager"：

- **自动添加到工作区** (`cursorSkills.autoAddToWorkspace`)
  - 启用后，扩展启动时自动将技能文件夹添加到工作区
  - 默认：关闭

- **自定义技能路径** (`cursorSkills.skillsPath`)
  - 如果技能文件夹不在默认位置，可以指定自定义路径
  - 留空则使用默认路径：`~/.cursor/skills*`

### 技能配置文件

已启用的技能列表保存在：
- Windows: `%APPDATA%\Cursor\User\globalStorage\cursor-skills-manager\enabled-skills.json`
- macOS/Linux: `~/.config/Cursor/User/globalStorage/cursor-skills-manager/enabled-skills.json`

文件格式：
```json
[
  "C:\\Users\\YourName\\.cursor\\skills\\my-skill",
  "C:\\Users\\YourName\\.cursor\\skills\\another-skill"
]
```

### 与 Cursor AI 集成

**注意**：当前版本的扩展主要用于管理和查看技能。要让 Cursor AI 实际使用选中的技能，需要：

1. **确保技能文件夹在工作区中**：使用 "添加技能文件夹到工作区" 功能
2. **Cursor 会自动发现工作区中的技能**：Cursor 会扫描工作区中的 `.cursor/skills/` 目录
3. **技能选择**：Cursor AI 会根据对话内容自动选择合适的技能使用

## 故障排除

### 技能列表为空

1. 检查技能文件夹是否存在：
   - Windows: `C:\Users\YourName\.cursor\skills*`
   - macOS/Linux: `~/.cursor/skills*`

2. 确保技能文件夹结构正确：
   ```
   skills/
   └── skill-name/
       └── SKILL.md
   ```

3. 检查 `SKILL.md` 文件格式：
   ```markdown
   ---
   name: skill-name
   description: Skill description
   ---
   ```

### 技能状态未保存

- 检查扩展的全局存储目录是否有写入权限
- 查看 Cursor 的输出面板（视图 → 输出 → 选择 "Cursor Skills Manager"）

### 文件系统变化未检测到

- 手动点击刷新按钮
- 重启 Cursor

## 开发与贡献

### 项目结构

```
cursor-skills-manager/
├── src/
│   ├── extension.ts          # 扩展入口，注册命令和视图
│   ├── skillsManager.ts      # 核心逻辑：扫描、解析、管理技能
│   └── skillsProvider.ts     # 树视图数据提供者
├── package.json               # 扩展清单和依赖
├── tsconfig.json             # TypeScript 配置
├── README.md                 # 项目说明
└── USAGE.md                  # 使用指南（本文件）
```

### 调试

1. 按 `F5` 启动扩展开发宿主
2. 在新窗口中测试功能
3. 查看调试控制台输出

### 扩展功能

如果需要添加新功能，可以：

1. 在 `package.json` 的 `contributes.commands` 中添加新命令
2. 在 `extension.ts` 中注册命令处理器
3. 在 `skillsManager.ts` 中实现核心逻辑

## 常见问题

**Q: 技能启用后，Cursor AI 会立即使用吗？**
A: 当前版本主要用于管理技能。Cursor AI 会自动发现工作区中的技能，并根据对话内容选择合适的技能。

**Q: 可以同时启用多个技能吗？**
A: 可以。扩展支持启用多个技能，所有启用的技能都会被记录。

**Q: 项目技能和个人技能有什么区别？**
A: 个人技能存储在用户目录下，所有项目都可以使用。项目技能存储在项目目录下，只对当前项目有效。

**Q: 如何创建新技能？**
A: 在技能目录下创建新文件夹，添加 `SKILL.md` 文件。参考 Cursor 官方文档了解技能格式。

## 反馈与支持

如有问题或建议，请提交 Issue 或 Pull Request。
