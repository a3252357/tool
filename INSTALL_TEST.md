# 安装和测试指南

## 打包文件

扩展已打包为：`cursor-skills-manager-0.1.0.vsix`

## 在 Cursor 中安装测试

### 方法一：通过命令面板安装（推荐）

1. 打开 Cursor
2. 按 `Ctrl+Shift+P` (Windows/Linux) 或 `Cmd+Shift+P` (macOS) 打开命令面板
3. 输入并选择：`Extensions: Install from VSIX...`
4. 浏览并选择文件：`cursor-skills-manager-0.1.0.vsix`
5. 等待安装完成
6. 重启 Cursor（如果需要）

### 方法二：通过扩展视图安装

1. 打开 Cursor
2. 按 `Ctrl+Shift+X` (Windows/Linux) 或 `Cmd+Shift+X` (macOS) 打开扩展视图
3. 点击右上角的 `...` 菜单
4. 选择 `Install from VSIX...`
5. 选择 `cursor-skills-manager-0.1.0.vsix` 文件

## 验证安装

安装成功后，你应该能看到：

1. **扩展列表**：
   - 在扩展视图中搜索 "Cursor Skills Manager"
   - 应该显示为已安装状态

2. **侧边栏视图**：
   - 在资源管理器中应该出现 "Cursor Skills" 视图
   - 如果没有看到，尝试刷新或重启 Cursor

3. **功能测试**：
   - 点击视图标题栏的刷新按钮，应该能看到技能列表
   - 右键点击技能，应该能看到上下文菜单
   - 测试设置技能文件夹路径功能

## 测试清单

- [ ] 扩展已安装并显示在扩展列表中
- [ ] "Cursor Skills" 视图出现在资源管理器中
- [ ] 能够扫描并显示技能列表
- [ ] 能够设置技能文件夹路径
- [ ] 能够启用/禁用技能
- [ ] 能够设置中文描述
- [ ] 能够查看技能详情
- [ ] 能够打开技能文件夹
- [ ] 能够将技能文件夹添加到工作区

## 查看日志

如果遇到问题，可以查看扩展的输出日志：

1. 按 `Ctrl+Shift+P` 打开命令面板
2. 输入：`Output: Show Output Channel`
3. 选择 "Cursor Skills Manager"
4. 查看错误或警告信息

## 卸载

如果需要卸载扩展：

1. 打开扩展视图 (`Ctrl+Shift+X`)
2. 搜索 "Cursor Skills Manager"
3. 点击卸载按钮
4. 或者使用命令面板：`Extensions: Uninstall Extension`

## 重新打包

如果需要修改代码后重新打包：

```bash
# 1. 修改代码
# 2. 编译
npm run compile

# 3. 打包
vsce package
```

## 常见问题

**Q: 安装后看不到 "Cursor Skills" 视图？**
A: 尝试重启 Cursor，或者检查扩展是否正确激活

**Q: 技能列表为空？**
A: 
- 检查是否配置了技能文件夹路径（设置中搜索 "Cursor Skills Manager"）
- 或者使用默认路径 `~/.cursor/skills*`
- 点击刷新按钮重新扫描

**Q: 扩展无法激活？**
A: 查看输出日志，检查是否有错误信息

## 反馈

如果发现问题或有改进建议，请记录：
- 问题描述
- 复现步骤
- 错误信息（如果有）
- Cursor 版本
- 操作系统版本
