import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

export interface Skill {
    name: string;
    path: string;
    fullPath: string;
    description: string;
    chineseDescription?: string; // 中文描述
    enabled: boolean;
    category: 'personal' | 'project' | 'cursor';
}

export class SkillsManager {
    private context: vscode.ExtensionContext;
    private skillsConfigPath: string;
    private chineseDescriptionsPath: string;
    private skillCategoriesPath: string;
    private enabledSkills: Set<string> = new Set();
    private chineseDescriptions: Map<string, string> = new Map(); // 技能路径 -> 中文描述
    private skillCategories: Map<string, 'personal' | 'project' | 'cursor'> = new Map(); // 技能路径 -> 分类

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.skillsConfigPath = path.join(context.globalStoragePath, 'enabled-skills.json');
        this.chineseDescriptionsPath = path.join(context.globalStoragePath, 'chinese-descriptions.json');
        this.skillCategoriesPath = path.join(context.globalStoragePath, 'skill-categories.json');
        this.loadEnabledSkills();
        this.loadChineseDescriptions();
        this.loadSkillCategories();
    }

    /**
     * 获取技能文件夹路径
     */
    private getSkillsBasePath(): string | null {
        const config = vscode.workspace.getConfiguration('cursorSkills');
        const customPath = config.get<string>('skillsPath', '');
        
        if (customPath && customPath.trim()) {
            return customPath.trim();
        }

        return null;
    }

    /**
     * 递归扫描目录下所有包含 SKILL.md 的文件夹
     */
    private scanSkillsRecursively(rootPath: string, category: 'personal' | 'project' | 'cursor', maxDepth: number = 10, currentDepth: number = 0): Skill[] {
        const skills: Skill[] = [];

        if (currentDepth >= maxDepth || !fs.existsSync(rootPath)) {
            return skills;
        }

        try {
            const entries = fs.readdirSync(rootPath, { withFileTypes: true });
            
            for (const entry of entries) {
                const entryPath = path.join(rootPath, entry.name);
                
                // 跳过常见的不需要扫描的文件夹（但允许 .claude 和 .cursor）
                if (entry.name === 'node_modules' || 
                    entry.name === '.git' ||
                    entry.name === 'out' ||
                    entry.name === 'dist' ||
                    entry.name === '.vscode' ||
                    (entry.name.startsWith('.') && entry.name !== '.claude' && entry.name !== '.cursor')) {
                    continue;
                }

                if (entry.isDirectory()) {
                    const skillMdPath = path.join(entryPath, 'SKILL.md');
                    
                    // 如果找到 SKILL.md，这是一个技能文件夹
                    if (fs.existsSync(skillMdPath)) {
                        console.log(`[Cursor Skills Manager] 找到技能: ${entryPath}`);
                        const skill = this.parseSkill(entryPath, skillMdPath, category);
                        if (skill) {
                            console.log(`[Cursor Skills Manager] 成功解析技能: ${skill.name}`);
                            skills.push(skill);
                        } else {
                            console.warn(`[Cursor Skills Manager] 解析技能失败: ${entryPath}`);
                        }
                    } else {
                        // 继续递归扫描子目录
                        const subSkills = this.scanSkillsRecursively(entryPath, category, maxDepth, currentDepth + 1);
                        skills.push(...subSkills);
                    }
                }
            }
        } catch (error) {
            console.error(`扫描目录失败: ${rootPath}`, error);
        }

        return skills;
    }

    /**
     * 递归扫描并输出判断过程（用于调试）
     */
    private scanSkillsRecursivelyWithLog(
        rootPath: string,
        category: 'personal' | 'project' | 'cursor',
        log: (msg: string) => void,
        maxDepth: number = 10,
        currentDepth: number = 0,
        indent: string = ''
    ): Skill[] {
        const skills: Skill[] = [];
        if (currentDepth >= maxDepth || !fs.existsSync(rootPath)) {
            return skills;
        }
        try {
            const entries = fs.readdirSync(rootPath, { withFileTypes: true });
            for (const entry of entries) {
                const entryPath = path.join(rootPath, entry.name);
                if (entry.name === 'node_modules' || entry.name === '.git' ||
                    entry.name === 'out' || entry.name === 'dist' || entry.name === '.vscode' ||
                    (entry.name.startsWith('.') && entry.name !== '.claude' && entry.name !== '.cursor')) {
                    log(`${indent}跳过: ${entry.name} (过滤规则)`);
                    continue;
                }
                if (entry.isDirectory()) {
                    const skillMdPath = path.join(entryPath, 'SKILL.md');
                    const hasSkillMd = fs.existsSync(skillMdPath);
                    log(`${indent}目录: ${entry.name} | SKILL.md 存在: ${hasSkillMd}`);
                    if (hasSkillMd) {
                        const skill = this.parseSkillWithLog(entryPath, skillMdPath, category, log, indent + '  ');
                        if (skill) {
                            log(`${indent}  -> 视为技能: name="${skill.name}"`);
                            skills.push(skill);
                        } else {
                            log(`${indent}  -> 未通过解析，未计入`);
                        }
                    } else {
                        const subSkills = this.scanSkillsRecursivelyWithLog(entryPath, category, log, maxDepth, currentDepth + 1, indent + '  ');
                        skills.push(...subSkills);
                    }
                }
            }
        } catch (error: any) {
            log(`${indent}扫描异常: ${error.message}`);
        }
        return skills;
    }

    private parseSkillWithLog(
        skillPath: string,
        skillMdPath: string,
        category: 'personal' | 'project' | 'cursor',
        log: (msg: string) => void,
        indent: string
    ): Skill | null {
        try {
            let content = fs.readFileSync(skillMdPath, 'utf-8');
            content = content.replace(/^\uFEFF/, ''); // 去除 BOM
            const frontmatterMatch = content.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
            if (!frontmatterMatch) {
                log(`${indent}解析: frontmatter 未匹配 (需以 --- 开头和结尾的 YAML 块)`);
                return null;
            }
            const frontmatter = frontmatterMatch[1];
            const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
            const descMatch = frontmatter.match(/^description:\s*(.+)$/m);
            const name = nameMatch ? nameMatch[1].trim() : path.basename(skillPath);
            const description = descMatch ? descMatch[1].trim() : '';
            log(`${indent}解析: frontmatter 有效, name="${name}"`);
            return { name, path: skillPath, fullPath: skillPath, description, enabled: false, category };
        } catch (error: any) {
            log(`${indent}解析异常: ${error.message}`);
            return null;
        }
    }

    /**
     * 扫描所有技能文件夹
     */
    async scanSkills(): Promise<Skill[]> {
        const skills: Skill[] = [];
        const basePath = this.getSkillsBasePath();

        console.log(`[Cursor Skills Manager] 开始扫描技能，配置路径: ${basePath || '未配置（使用默认路径）'}`);

        if (basePath) {
            // 如果配置了自定义路径，递归扫描该文件夹下的所有技能
            if (!fs.existsSync(basePath)) {
                const errorMsg = `技能文件夹不存在: ${basePath}`;
                console.warn(`[Cursor Skills Manager] ${errorMsg}`);
                vscode.window.showWarningMessage(errorMsg);
                return skills;
            }

            console.log(`[Cursor Skills Manager] 开始递归扫描: ${basePath}`);
            // 递归扫描配置的文件夹下的所有技能
            const skillDirs = this.scanSkillsRecursively(basePath, 'personal');
            console.log(`[Cursor Skills Manager] 扫描完成，找到 ${skillDirs.length} 个技能`);
            skills.push(...skillDirs);
        } else {
            // 如果没有配置自定义路径，使用默认行为：扫描 ~/.cursor/skills* 目录
            const homeDir = os.homedir();
            const defaultBasePath = path.join(homeDir, '.cursor');

            if (fs.existsSync(defaultBasePath)) {
                // 扫描所有 skills* 目录
                const entries = fs.readdirSync(defaultBasePath, { withFileTypes: true });
                
                for (const entry of entries) {
                    if (entry.isDirectory() && entry.name.startsWith('skills')) {
                        const skillsDir = path.join(defaultBasePath, entry.name);
                        const category = this.getCategoryFromPath(entry.name);
                        
                        // 扫描该目录下的所有技能
                        const skillDirs = this.scanSkillDirectory(skillsDir, category);
                        skills.push(...skillDirs);
                    }
                }
            }

            // 也检查项目级别的技能文件夹
            if (vscode.workspace.workspaceFolders) {
                for (const folder of vscode.workspace.workspaceFolders) {
                    const projectSkillsPath = path.join(folder.uri.fsPath, '.cursor', 'skills');
                    if (fs.existsSync(projectSkillsPath)) {
                        const projectSkills = this.scanSkillDirectory(projectSkillsPath, 'project');
                        skills.push(...projectSkills);
                    }
                }
            }
        }

        // 标记已启用的技能并加载中文描述和分类
        skills.forEach(skill => {
            skill.enabled = this.enabledSkills.has(skill.fullPath);
            skill.chineseDescription = this.chineseDescriptions.get(skill.fullPath);
            // 如果用户设置了分类，使用用户设置的分类
            const userCategory = this.skillCategories.get(skill.fullPath);
            if (userCategory) {
                skill.category = userCategory;
            }
        });

        // 如配置启用，自动为已启用技能生成 /commands 命令（仅生成不存在的文件，不覆盖）
        const config = vscode.workspace.getConfiguration('cursorSkills');
        const autoGen = config.get<boolean>('autoGenerateCommandsForEnabledSkills', false);
        if (autoGen) {
            this.autoGenerateCommandsForEnabledSkills(skills);
        }

        return skills.sort((a, b) => {
            // 先按类别排序，再按名称排序
            const categoryOrder = { 'personal': 0, 'project': 1, 'cursor': 2 };
            const categoryDiff = categoryOrder[a.category] - categoryOrder[b.category];
            if (categoryDiff !== 0) return categoryDiff;
            return a.name.localeCompare(b.name);
        });
    }

    /**
     * 扫描单个技能目录
     */
    private scanSkillDirectory(dirPath: string, category: 'personal' | 'project' | 'cursor'): Skill[] {
        const skills: Skill[] = [];

        if (!fs.existsSync(dirPath)) {
            return skills;
        }

        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
            if (entry.isDirectory()) {
                const skillPath = path.join(dirPath, entry.name);
                const skillMdPath = path.join(skillPath, 'SKILL.md');

                if (fs.existsSync(skillMdPath)) {
                    const skill = this.parseSkill(skillPath, skillMdPath, category);
                    if (skill) {
                        skills.push(skill);
                    }
                }
            }
        }

        return skills;
    }

    /**
     * 解析技能信息
     */
    private parseSkill(skillPath: string, skillMdPath: string, category: 'personal' | 'project' | 'cursor'): Skill | null {
        try {
            let content = fs.readFileSync(skillMdPath, 'utf-8');
            content = content.replace(/^\uFEFF/, ''); // 去除 BOM
            const frontmatterMatch = content.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);

            if (!frontmatterMatch) {
                return null;
            }

            const frontmatter = frontmatterMatch[1];
            const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
            const descMatch = frontmatter.match(/^description:\s*(.+)$/m);

            const name = nameMatch ? nameMatch[1].trim() : path.basename(skillPath);
            const description = descMatch ? descMatch[1].trim() : '';

            return {
                name,
                path: skillPath,
                fullPath: skillPath,
                description,
                enabled: false,
                category
            };
        } catch (error) {
            console.error(`解析技能失败: ${skillPath}`, error);
            return null;
        }
    }

    /**
     * 从路径判断类别
     */
    private getCategoryFromPath(dirName: string): 'personal' | 'project' | 'cursor' {
        if (dirName === 'skills-cursor') {
            return 'cursor';
        }
        return 'personal';
    }

    /**
     * 加载已启用的技能列表
     */
    private loadEnabledSkills(): void {
        try {
            if (fs.existsSync(this.skillsConfigPath)) {
                const data = fs.readFileSync(this.skillsConfigPath, 'utf-8');
                const enabled = JSON.parse(data) as string[];
                this.enabledSkills = new Set(enabled);
            }
        } catch (error) {
            console.error('加载已启用技能失败:', error);
        }
    }

    /**
     * 保存已启用的技能列表
     */
    private saveEnabledSkills(): void {
        try {
            const dir = path.dirname(this.skillsConfigPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(
                this.skillsConfigPath,
                JSON.stringify(Array.from(this.enabledSkills), null, 2),
                'utf-8'
            );
        } catch (error) {
            console.error('保存已启用技能失败:', error);
            vscode.window.showErrorMessage(`保存技能配置失败: ${error}`);
        }
    }

    /**
     * 切换技能启用状态
     */
    async toggleSkill(skill: Skill): Promise<void> {
        if (this.enabledSkills.has(skill.fullPath)) {
            this.enabledSkills.delete(skill.fullPath);
            skill.enabled = false;
            vscode.window.showInformationMessage(`已禁用技能: ${skill.name}`);
        } else {
            this.enabledSkills.add(skill.fullPath);
            skill.enabled = true;
            vscode.window.showInformationMessage(`已启用技能: ${skill.name}`);
        }
        this.saveEnabledSkills();
    }

    /**
     * 添加技能文件夹到工作区
     */
    async addSkillsFoldersToWorkspace(): Promise<void> {
        const basePath = this.getSkillsBasePath();
        const folders: vscode.WorkspaceFolder[] = [];

        if (basePath) {
            // 如果配置了自定义路径，直接添加该根文件夹到工作区
            if (!fs.existsSync(basePath)) {
                vscode.window.showWarningMessage(`技能文件夹不存在: ${basePath}`);
                return;
            }

            const folderName = path.basename(basePath) || 'Skills';
            folders.push({
                uri: vscode.Uri.file(basePath),
                name: folderName,
                index: 0
            });
        } else {
            // 如果没有配置自定义路径，使用默认行为：添加所有 skills* 文件夹
            const homeDir = os.homedir();
            const defaultBasePath = path.join(homeDir, '.cursor');

            if (!fs.existsSync(defaultBasePath)) {
                vscode.window.showWarningMessage(`技能文件夹不存在: ${defaultBasePath}`);
                return;
            }

            const entries = fs.readdirSync(defaultBasePath, { withFileTypes: true });
            
            for (const entry of entries) {
                if (entry.isDirectory() && entry.name.startsWith('skills')) {
                    const folderPath = path.join(defaultBasePath, entry.name);
                    folders.push({
                        uri: vscode.Uri.file(folderPath),
                        name: entry.name,
                        index: folders.length
                    });
                }
            }
        }

        if (folders.length === 0) {
            vscode.window.showInformationMessage('未找到技能文件夹');
            return;
        }

        // 获取当前工作区文件夹
        const currentFolders = vscode.workspace.workspaceFolders || [];
        
        // 检查哪些文件夹还未添加
        const newFolders = folders.filter(folder => {
            return !currentFolders.some(cf => cf.uri.fsPath === folder.uri.fsPath);
        });

        if (newFolders.length === 0) {
            vscode.window.showInformationMessage('所有技能文件夹已添加到工作区');
            return;
        }

        // 添加新文件夹
        const updatedFolders = [...currentFolders, ...newFolders];
        vscode.workspace.updateWorkspaceFolders(0, currentFolders.length, ...updatedFolders);
        
        vscode.window.showInformationMessage(`已添加 ${newFolders.length} 个技能文件夹到工作区`);

        // 自动保存 workspace（如果配置了保存目录且当前 workspace 还未保存）
        await this.maybeSaveWorkspace();
    }

    /**
     * 检查并自动添加技能文件夹到工作区（如果配置了自动添加）
     */
    async checkAutoAddToWorkspace(): Promise<void> {
        const config = vscode.workspace.getConfiguration('cursorSkills');
        const autoAdd = config.get<boolean>('autoAddToWorkspace', false);

        if (autoAdd) {
            await this.addSkillsFoldersToWorkspace();
        }
    }

    /**
     * 如有需要，自动生成 workspace 文件
     * 规则：
     * - 未配置保存目录：不生成
     * - 当前已是保存的 workspace（workspaceFile 存在）：不生成
     * - 没有 workspaceFolders：不生成
     * - 目标文件已存在：不覆盖
     */
    private async maybeSaveWorkspace(): Promise<void> {
        const config = vscode.workspace.getConfiguration('cursorSkills');
        const saveDir = (config.get<string>('workspaceSaveFolder', '') || '').trim();

        // 未配置保存目录则不工作
        if (!saveDir) {
            return;
        }

        // 如果当前已经是保存过的 workspace，就不再生成
        if (vscode.workspace.workspaceFile) {
            return;
        }

        const folders = vscode.workspace.workspaceFolders;
        if (!folders || folders.length === 0) {
            return;
        }

        try {
            let targetDir = saveDir;
            if (!path.isAbsolute(targetDir)) {
                // 相对路径：按用户主目录解析，避免写到奇怪位置
                targetDir = path.join(os.homedir(), targetDir);
            }

            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }

            const first = folders[0];
            const baseName = path.basename(first.uri.fsPath) || 'cursor-skills';
            let fileName = `${baseName}.code-workspace`;
            let fullPath = path.join(targetDir, fileName);

            // 如果已存在同名文件，则不覆盖，直接返回
            if (fs.existsSync(fullPath)) {
                return;
            }

            const workspaceData = {
                folders: folders.map(f => ({
                    path: f.uri.fsPath
                })),
                settings: {}
            };

            fs.writeFileSync(fullPath, JSON.stringify(workspaceData, null, 2), 'utf-8');

            // 生成后提示并可一键打开，使标题不再是“无标题工作区”
            const choice = await vscode.window.showInformationMessage(
                `已生成 workspace 文件: ${fullPath}`,
                '在当前窗口打开',
                '在新窗口打开'
            );

            if (choice === '在当前窗口打开') {
                // 使用 vscode.openWorkspace 在当前窗口加载 .code-workspace
                await vscode.commands.executeCommand(
                    'vscode.openWorkspace',
                    vscode.Uri.file(fullPath)
                );
            } else if (choice === '在新窗口打开') {
                // 同样使用 vscode.openWorkspace，但强制在新窗口打开
                await vscode.commands.executeCommand(
                    'vscode.openWorkspace',
                    vscode.Uri.file(fullPath),
                    true
                );
            }
        } catch (error) {
            console.error('自动保存 workspace 失败:', error);
            vscode.window.showWarningMessage(`自动保存 workspace 失败：${error}`);
        }
    }

    /**
     * 打开技能文件夹
     */
    async openSkillFolder(skill: Skill): Promise<void> {
        const uri = vscode.Uri.file(skill.path);
        await vscode.commands.executeCommand('revealFileInOS', uri);
    }

    /**
     * 查看技能详情
     */
    async viewSkillDetails(skill: Skill): Promise<void> {
        const skillMdPath = path.join(skill.path, 'SKILL.md');
        
        if (!fs.existsSync(skillMdPath)) {
            vscode.window.showWarningMessage(`技能文件不存在: ${skillMdPath}`);
            return;
        }

        const doc = await vscode.workspace.openTextDocument(skillMdPath);
        await vscode.window.showTextDocument(doc);
    }

    /**
     * 加载中文描述
     */
    private loadChineseDescriptions(): void {
        try {
            if (fs.existsSync(this.chineseDescriptionsPath)) {
                const data = fs.readFileSync(this.chineseDescriptionsPath, 'utf-8');
                const descriptions = JSON.parse(data) as Record<string, string>;
                this.chineseDescriptions = new Map(Object.entries(descriptions));
            }
        } catch (error) {
            console.error('加载中文描述失败:', error);
        }
    }

    /**
     * 保存中文描述
     */
    private saveChineseDescriptions(): void {
        try {
            const dir = path.dirname(this.chineseDescriptionsPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            const descriptions = Object.fromEntries(this.chineseDescriptions);
            fs.writeFileSync(
                this.chineseDescriptionsPath,
                JSON.stringify(descriptions, null, 2),
                'utf-8'
            );
        } catch (error) {
            console.error('保存中文描述失败:', error);
            vscode.window.showErrorMessage(`保存中文描述失败: ${error}`);
        }
    }

    /**
     * 加载技能分类
     */
    private loadSkillCategories(): void {
        try {
            if (fs.existsSync(this.skillCategoriesPath)) {
                const data = fs.readFileSync(this.skillCategoriesPath, 'utf-8');
                const categories = JSON.parse(data) as Record<string, 'personal' | 'project' | 'cursor'>;
                this.skillCategories = new Map(Object.entries(categories));
            }
        } catch (error) {
            console.error('加载技能分类失败:', error);
        }
    }

    /**
     * 保存技能分类
     */
    private saveSkillCategories(): void {
        try {
            const dir = path.dirname(this.skillCategoriesPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            const categories = Object.fromEntries(this.skillCategories);
            fs.writeFileSync(
                this.skillCategoriesPath,
                JSON.stringify(categories, null, 2),
                'utf-8'
            );
        } catch (error) {
            console.error('保存技能分类失败:', error);
            vscode.window.showErrorMessage(`保存技能分类失败: ${error}`);
        }
    }

    /**
     * 设置技能的中文描述
     */
    async setChineseDescription(skill: Skill): Promise<void> {
        const currentDescription = this.chineseDescriptions.get(skill.fullPath) || '';

        const input = await vscode.window.showInputBox({
            prompt: `为技能 "${skill.name}" 设置中文描述`,
            value: currentDescription,
            placeHolder: '请输入中文描述（留空则删除）',
            validateInput: (value) => {
                if (value && value.length > 200) {
                    return '中文描述不能超过200个字符';
                }
                return null;
            }
        });

        if (input !== undefined) {
            const trimmed = input.trim();
            if (trimmed) {
                this.chineseDescriptions.set(skill.fullPath, trimmed);
                skill.chineseDescription = trimmed;
                vscode.window.showInformationMessage(`已为技能 "${skill.name}" 设置中文描述`);
            } else {
                this.chineseDescriptions.delete(skill.fullPath);
                skill.chineseDescription = undefined;
                vscode.window.showInformationMessage(`已删除技能 "${skill.name}" 的中文描述`);
            }
            this.saveChineseDescriptions();
        }
    }

    /**
     * 获取技能的中文描述
     */
    getChineseDescription(skillPath: string): string | undefined {
        return this.chineseDescriptions.get(skillPath);
    }

    /**
     * 批量设置技能的分类
     */
    async setSkillCategory(skills: Skill[]): Promise<void> {
        if (!skills || skills.length === 0) {
            return;
        }

        // 以第一个技能的分类作为当前分类展示
        const first = skills[0];
        const currentCategory = this.skillCategories.get(first.fullPath) || first.category;
        
        const categoryOptions = [
            { label: '个人技能', value: 'personal' as const },
            { label: '项目技能', value: 'project' as const },
            { label: '内置技能', value: 'cursor' as const },
            { label: '使用默认分类', value: null }
        ];

        const selected = await vscode.window.showQuickPick(categoryOptions, {
            placeHolder: `为 ${skills.length} 个技能选择分类（当前: ${this.getCategoryLabel(currentCategory)}）`,
            canPickMany: false
        });

        if (selected === undefined) {
            return;
        }

        // 批量应用分类
        if (selected.value === null) {
            // 删除自定义分类，使用默认分类
            for (const skill of skills) {
                this.skillCategories.delete(skill.fullPath);
                const basePath = this.getSkillsBasePath();
                if (basePath && skill.path.startsWith(basePath)) {
                    skill.category = 'personal';
                } else {
                    skill.category = this.getCategoryFromPath(path.basename(path.dirname(skill.path)));
                }
            }
            vscode.window.showInformationMessage(`已恢复 ${skills.length} 个技能的默认分类`);
        } else {
            for (const skill of skills) {
                this.skillCategories.set(skill.fullPath, selected.value);
                skill.category = selected.value;
            }
            vscode.window.showInformationMessage(`已将 ${skills.length} 个技能设置为 ${selected.label}`);
        }

        this.saveSkillCategories();
    }

    /**
     * 获取分类标签
     */
    private getCategoryLabel(category: 'personal' | 'project' | 'cursor'): string {
        const labels = {
            'personal': '个人技能',
            'project': '项目技能',
            'cursor': '内置技能'
        };
        return labels[category];
    }

    /**
     * 为技能生成 Cursor /commands 命令（手动触发，默认全局，无需选择）
     */
    async generateCommandsForSkills(skills: Skill[]): Promise<void> {
        if (!skills || skills.length === 0) {
            return;
        }

        // 默认：直接生成到全局命令目录 ~/.cursor/commands/skills
        const globalDir = path.join(os.homedir(), '.cursor', 'commands', 'skills');

        let successCount = 0;
        const errors: string[] = [];

        for (const skill of skills) {
            const { fileName, content } = this.buildCommandFileInfo(skill);

            try {
                this.writeCommandFile(globalDir, fileName, content, true);
                successCount++;
            } catch (error: any) {
                console.error('生成命令失败:', error);
                errors.push(`${skill.name}: ${error.message || error}`);
            }
        }

        if (successCount > 0) {
            vscode.window.showInformationMessage(`已为 ${successCount} 个技能生成全局 /commands 命令（~/.cursor/commands/skills）`);
        }

        if (errors.length > 0) {
            vscode.window.showWarningMessage(`部分技能生成命令失败，详情请查看输出面板`);
            const output = vscode.window.createOutputChannel('Cursor Skills Manager Commands');
            output.show();
            output.appendLine('=== 生成命令时的错误 ===');
            errors.forEach(err => output.appendLine(err));
        }
    }

    /**
     * 自动为已启用的技能生成 /commands 命令（无交互，仅补齐不存在的）
     */
    private autoGenerateCommandsForEnabledSkills(allSkills: Skill[]): void {
        const enabledSkills = allSkills.filter(s => s.enabled);
        if (enabledSkills.length === 0) {
            return;
        }

        const targetDir = path.join(os.homedir(), '.cursor', 'commands', 'skills-auto');

        for (const skill of enabledSkills) {
            try {
                const { fileName, content } = this.buildCommandFileInfo(skill);
                this.writeCommandFile(targetDir, fileName, content, false);
            } catch (error) {
                console.error('自动生成命令失败:', error);
            }
        }
    }

    /**
     * 构建命令文件信息（文件名 + 内容）
     */
    private buildCommandFileInfo(skill: Skill): { fileName: string; content: string } {
        const safeName = skill.name
            .toLowerCase()
            .replace(/[^a-z0-9\-]+/g, '-')
            .replace(/^-+|-+$/g, '') || 'skill';

        const fileName = `${safeName}.md`;

        const categoryLabel = this.getCategoryLabel(skill.category);
        const desc = skill.chineseDescription || skill.description || '（该技能暂无描述）';
        const title = skill.chineseDescription || skill.name;

        const content = [
            `# ${title}`,
            '',
            // 英文名作为“签名”放在前面一行
            skill.chineseDescription ? `> ${skill.name}` : '',
            skill.chineseDescription ? '' : '',
            `**分类**：${categoryLabel}`,
            '',
            `**说明**：${desc}`,
            '',
            '---',
            '',
            '使用说明：',
            '',
            `当你在对话中使用此命令（例如 \`/` + skill.name + ` ...\` ）时：`,
            '',
            '1. 你是一个会优先参考我本地 Cursor Skill 的助手。',
            `2. 该技能的路径为：\`${skill.path}\`（如果需要，你可以让我粘贴其中的关键内容）。`,
            '3. 请根据该技能的约定方式来理解和处理我接下来输入的内容。',
            ''
        ].join('\n');

        return { fileName, content };
    }

    /**
     * 写入命令文件（确保目录存在；可控制是否覆盖已有文件）
     */
    private writeCommandFile(dir: string, fileName: string, content: string, overwrite: boolean): void {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        const fullPath = path.join(dir, fileName);
        if (!overwrite && fs.existsSync(fullPath)) {
            return;
        }
        fs.writeFileSync(fullPath, content, 'utf-8');
    }

    /**
     * 获取已启用的技能路径列表
     */
    getEnabledSkillsPaths(): string[] {
        return Array.from(this.enabledSkills);
    }

    /**
     * 获取当前配置的技能路径（用于调试）
     */
    getCurrentSkillsPath(): string | null {
        return this.getSkillsBasePath();
    }

    /**
     * 测试扫描指定路径（用于调试）
     */
    async testScanPath(testPath: string): Promise<{ found: number; skills: Skill[] }> {
        if (!fs.existsSync(testPath)) {
            throw new Error(`路径不存在: ${testPath}`);
        }

        const skills = this.scanSkillsRecursively(testPath, 'personal');
        return {
            found: skills.length,
            skills: skills
        };
    }

    /**
     * 测试扫描指定路径并输出判断过程（用于调试按钮）
     */
    async testScanPathWithLog(testPath: string, log: (msg: string) => void): Promise<{ found: number; skills: Skill[] }> {
        if (!fs.existsSync(testPath)) {
            throw new Error(`路径不存在: ${testPath}`);
        }
        log(`根路径: ${testPath}`);
        log('');
        const skills = this.scanSkillsRecursivelyWithLog(testPath, 'personal', log);
        return { found: skills.length, skills };
    }

    /**
     * 设置技能文件夹路径
     */
    async setSkillsPath(): Promise<void> {
        const config = vscode.workspace.getConfiguration('cursorSkills');
        const currentPath = config.get<string>('skillsPath', '');

        const input = await vscode.window.showInputBox({
            prompt: '请输入技能根目录路径（将递归扫描该目录下所有包含 SKILL.md 的文件夹）',
            value: currentPath,
            placeHolder: '例如: D:\\baodian\\AIWork 或 /home/user/myskills',
            validateInput: (value) => {
                if (!value || value.trim() === '') {
                    return null; // 允许留空使用默认路径
                }
                const trimmed = value.trim();
                if (!fs.existsSync(trimmed)) {
                    return '文件夹不存在，请检查路径是否正确';
                }
                const stat = fs.statSync(trimmed);
                if (!stat.isDirectory()) {
                    return '路径必须是一个文件夹';
                }
                return null;
            }
        });

        if (input !== undefined) {
            await config.update('skillsPath', input.trim() || '', vscode.ConfigurationTarget.Global);
            
            if (input.trim()) {
                vscode.window.showInformationMessage(`已设置技能文件夹路径: ${input.trim()}`);
                
                // 询问是否立即添加到工作区
                const addToWorkspace = await vscode.window.showQuickPick(
                    ['是', '否'],
                    { placeHolder: '是否立即将该文件夹添加到工作区？' }
                );
                
                if (addToWorkspace === '是') {
                    await this.addSkillsFoldersToWorkspace();
                }
            } else {
                vscode.window.showInformationMessage('已恢复使用默认路径');
            }
        }
    }
}
