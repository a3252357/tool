import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { SkillsProvider } from './skillsProvider';
import { SkillsManager } from './skillsManager';
import { SkillCompletionProvider } from './skillCompletionProvider';

let skillsProvider: SkillsProvider;
let skillsManager: SkillsManager;

export function activate(context: vscode.ExtensionContext) {
    console.log('Cursor Skills Manager 已激活');

    // 初始化技能管理器
    skillsManager = new SkillsManager(context);
    
    // 创建技能树视图（支持多选）
    skillsProvider = new SkillsProvider(skillsManager);
    const treeView = vscode.window.createTreeView('cursorSkillsView', {
        treeDataProvider: skillsProvider,
        showCollapseAll: true,
        canSelectMany: true
    });

    // 注册技能补全提供器（用于 @ 符号自动补全）
    // 注册到所有语言和文件类型
    const completionProvider = vscode.languages.registerCompletionItemProvider(
        [{ scheme: '*' }], // 所有文件类型
        new SkillCompletionProvider(skillsManager),
        '@' // 触发字符
    );
    
    console.log('[Cursor Skills Manager] 技能补全提供器已注册');

    // 注册命令
    const refreshCommand = vscode.commands.registerCommand('cursorSkills.refresh', () => {
        skillsProvider.refresh();
        vscode.window.showInformationMessage('技能列表已刷新');
    });

    const addToWorkspaceCommand = vscode.commands.registerCommand('cursorSkills.addToWorkspace', async () => {
        await skillsManager.addSkillsFoldersToWorkspace();
    });

    const toggleSkillCommand = vscode.commands.registerCommand('cursorSkills.toggleSkill', async (item: any) => {
        const skill = item?.skill || item;
        if (skill) {
            await skillsManager.toggleSkill(skill);
            skillsProvider.refresh();
        }
    });

    const openSkillFolderCommand = vscode.commands.registerCommand('cursorSkills.openSkillFolder', async (item: any) => {
        const skill = item?.skill || item;
        if (skill) {
            await skillsManager.openSkillFolder(skill);
        }
    });

    const viewSkillDetailsCommand = vscode.commands.registerCommand('cursorSkills.viewSkillDetails', async (item: any) => {
        const skill = item?.skill || item;
        if (skill) {
            await skillsManager.viewSkillDetails(skill);
        }
    });

    const setSkillsPathCommand = vscode.commands.registerCommand('cursorSkills.setSkillsPath', async () => {
        await skillsManager.setSkillsPath();
    });

    const setChineseDescriptionCommand = vscode.commands.registerCommand('cursorSkills.setChineseDescription', async (item: any) => {
        const skill = item?.skill || item;
        if (skill) {
            await skillsManager.setChineseDescription(skill);
            skillsProvider.refresh();
        } else {
            vscode.window.showWarningMessage('请先选择一个技能');
        }
    });

    const setCategoryCommand = vscode.commands.registerCommand('cursorSkills.setCategory', async (item: any) => {
        // 如果用户多选了技能，则优先使用多选
        const selection = (treeView.selection && treeView.selection.length > 0)
            ? treeView.selection
            : (item ? [item] : []);

        const skills = selection
            .map((it: any) => it.skill || it)
            .filter((s: any) => s && s.fullPath) as any[];

        if (!skills || skills.length === 0) {
            vscode.window.showWarningMessage('请先选择一个或多个技能');
            return;
        }

        await skillsManager.setSkillCategory(skills as any);
        skillsProvider.refresh();
    });

    const generateCommandsCommand = vscode.commands.registerCommand('cursorSkills.generateCommands', async (item: any) => {
        const selection = (treeView.selection && treeView.selection.length > 0)
            ? treeView.selection
            : (item ? [item] : []);

        const skills = selection
            .map((it: any) => it.skill || it)
            .filter((s: any) => s && s.fullPath) as any[];

        if (!skills || skills.length === 0) {
            vscode.window.showWarningMessage('请先选择一个或多个技能');
            return;
        }

        await skillsManager.generateCommandsForSkills(skills as any);
    });

    const getCategoryLabel = (category: 'personal' | 'project' | 'cursor'): string => {
        const labels = {
            'personal': '个人技能',
            'project': '项目技能',
            'cursor': '内置技能'
        };
        return labels[category];
    };

    const insertSkillMentionCommand = vscode.commands.registerCommand('cursorSkills.insertSkillMention', async () => {
        const skills = await skillsManager.scanSkills();
        
        if (skills.length === 0) {
            vscode.window.showWarningMessage('没有找到可用技能');
            return;
        }

        // 显示技能选择列表
        const items = skills.map(skill => ({
            label: skill.name,
            description: skill.chineseDescription || skill.description || '',
            detail: `分类: ${getCategoryLabel(skill.category)} | 状态: ${skill.enabled ? '已启用' : '未启用'}`,
            skill: skill
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: '选择要引用的技能',
            matchOnDescription: true,
            matchOnDetail: true
        });

        if (selected && selected.skill) {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                const position = editor.selection.active;
                const text = `@${selected.skill.name}`;
                await editor.edit(editBuilder => {
                    editBuilder.insert(position, text);
                });
            } else {
                // 如果没有活动编辑器，复制到剪贴板
                await vscode.env.clipboard.writeText(`@${selected.skill.name}`);
                vscode.window.showInformationMessage(`已复制到剪贴板: @${selected.skill.name}`);
            }
        }
    });

    const testCompletionCommand = vscode.commands.registerCommand('cursorSkills.testCompletion', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('请先打开一个编辑器');
            return;
        }

        // 手动触发补全
        await vscode.commands.executeCommand('editor.action.triggerSuggest');
        vscode.window.showInformationMessage('已触发补全，请在编辑器中输入 @ 符号测试');
    });

    const debugScanCommand = vscode.commands.registerCommand('cursorSkills.debugScan', async () => {
        const currentPath = skillsManager.getCurrentSkillsPath();
        const outputChannel = vscode.window.createOutputChannel('Cursor Skills Manager Debug');
        outputChannel.show();
        
        outputChannel.appendLine('=== Cursor Skills Manager 调试信息 ===');
        outputChannel.appendLine(`当前配置的技能路径: ${currentPath || '未配置（使用默认路径）'}`);
        
        if (currentPath) {
            if (fs.existsSync(currentPath)) {
                outputChannel.appendLine(`路径存在: 是`);
                outputChannel.appendLine('');
                outputChannel.appendLine('--- 扫描判断过程 ---');
                try {
                    const result = await skillsManager.testScanPathWithLog(currentPath, (msg) => outputChannel.appendLine(msg));
                    outputChannel.appendLine('--- 判断过程结束 ---');
                    outputChannel.appendLine('');
                    outputChannel.appendLine(`扫描完成，找到 ${result.found} 个技能:`);
                    result.skills.forEach((skill: any, index: number) => {
                        outputChannel.appendLine(`  ${index + 1}. ${skill.name} (${skill.path})`);
                    });
                    if (result.found === 0) {
                        outputChannel.appendLine('');
                        outputChannel.appendLine('未找到技能，可能的原因:');
                        outputChannel.appendLine('1. 目录下没有包含 SKILL.md 的文件夹');
                        outputChannel.appendLine('2. SKILL.md 文件格式不正确（需要 YAML frontmatter）');
                        outputChannel.appendLine('3. 文件夹被跳过（如 node_modules, .git 等）');
                    }
                } catch (error: any) {
                    outputChannel.appendLine(`扫描出错: ${error.message}`);
                }
            } else {
                outputChannel.appendLine(`路径存在: 否`);
                outputChannel.appendLine(`请检查路径是否正确: ${currentPath}`);
            }
        } else {
            outputChannel.appendLine('提示: 使用 "Cursor Skills: 设置技能文件夹路径" 命令配置路径');
        }
        
        outputChannel.appendLine('=== 调试信息结束 ===');
    });

    // 监听配置变化
    const configWatcher = vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('cursorSkills')) {
            skillsProvider.refresh();
        }
    });

    // 监听文件系统变化
    const fileWatcher = vscode.workspace.createFileSystemWatcher('**/.cursor/skills*/**');
    fileWatcher.onDidChange(() => skillsProvider.refresh());
    fileWatcher.onDidCreate(() => skillsProvider.refresh());
    fileWatcher.onDidDelete(() => skillsProvider.refresh());

    context.subscriptions.push(
        treeView,
        completionProvider,
        refreshCommand,
        addToWorkspaceCommand,
        toggleSkillCommand,
        openSkillFolderCommand,
        viewSkillDetailsCommand,
        setSkillsPathCommand,
        setChineseDescriptionCommand,
        setCategoryCommand,
        generateCommandsCommand,
        insertSkillMentionCommand,
        testCompletionCommand,
        debugScanCommand,
        configWatcher,
        fileWatcher
    );

    // 初始化时刷新一次
    skillsProvider.refresh();

    // 检查是否需要自动添加技能文件夹到工作区
    skillsManager.checkAutoAddToWorkspace();
}

export function deactivate() {
    console.log('Cursor Skills Manager 已停用');
}
