# 快速开始

## 5 分钟上手 Cursor Skills Manager

### 步骤 1：安装依赖

```bash
npm install
```

### 步骤 2：编译项目

```bash
npm run compile
```

### 步骤 3：运行扩展

1. 按 `F5` 启动扩展开发宿主
2. 在新打开的 Cursor 窗口中，你会看到侧边栏的 "Cursor Skills" 视图

### 步骤 4：使用扩展

1. **查看技能**：在 "Cursor Skills" 视图中查看所有可用技能
2. **启用技能**：点击技能前的复选框图标来启用/禁用技能
3. **添加到工作区**：点击视图标题栏的文件夹图标，将技能文件夹添加到工作区
4. **查看详情**：右键点击技能，选择 "查看技能详情" 查看技能内容

### 步骤 5：打包发布（可选）

```bash
# 安装打包工具
npm install -g vsce

# 打包
vsce package

# 安装生成的 .vsix 文件
# 在 Cursor 中：Ctrl+Shift+P -> Extensions: Install from VSIX...
```

## 功能演示

### 技能列表视图

扩展会在资源管理器中显示一个树形视图，按类别组织技能：

```
Cursor Skills
├── 个人技能 (3)
│   ├── ✓ my-custom-skill
│   ├── ○ another-skill
│   └── ✓ pdf-processor
├── 项目技能 (1)
│   └── ○ project-specific-skill
└── 内置技能 (5)
    ├── ✓ create-skill
    ├── ✓ doc-coauthoring
    └── ...
```

- ✓ 表示已启用的技能
- ○ 表示未启用的技能

### 右键菜单

右键点击技能项可以：
- **切换技能启用状态**：启用/禁用技能
- **打开技能文件夹**：在文件管理器中打开
- **查看技能详情**：在编辑器中打开 SKILL.md

### 视图工具栏

视图标题栏提供两个按钮：
- **刷新**：重新扫描技能文件夹
- **添加到工作区**：将所有技能文件夹添加到当前工作区

## 下一步

- 查看 [USAGE.md](USAGE.md) 了解详细使用说明
- 查看 [README.md](README.md) 了解项目信息
- 开始管理你的 Cursor 技能！
