import * as vscode from 'vscode';
import { SkillsManager, Skill } from './skillsManager';

export class SkillTreeItem extends vscode.TreeItem {
    constructor(
        public readonly skill: Skill,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(skill.name, collapsibleState);
        
        // 标题：中文在前，英文名作为签名放在括号里
        const displayTitle = skill.chineseDescription
            ? `${skill.chineseDescription} (${skill.name})`
            : skill.name;

        // tooltip 优先显示中文 + 英文 + 描述
        const displayDescription = skill.chineseDescription || skill.description || skill.name;
        this.tooltip = `${displayTitle}\n${displayDescription}`;
        
        // 描述行：简短显示中文或英文描述（截断）
        if (skill.chineseDescription) {
            this.description = skill.chineseDescription.length > 50 
                ? skill.chineseDescription.substring(0, 50) + '...' 
                : skill.chineseDescription;
        } else if (skill.description) {
            this.description = skill.description.length > 50 
                ? skill.description.substring(0, 50) + '...' 
                : skill.description;
        } else {
            this.description = '';
        }
        
        // 根据类别设置图标和上下文值
        const categoryIcons = {
            'personal': '$(person)',
            'project': '$(folder)',
            'cursor': '$(star)'
        };
        
        const categoryLabels = {
            'personal': '个人',
            'project': '项目',
            'cursor': '内置'
        };

        this.iconPath = new vscode.ThemeIcon(skill.enabled ? 'check' : 'circle-outline');
        this.contextValue = `skill-${skill.category}${skill.enabled ? '-enabled' : ''}`;
        
        // 添加类别标签：中文在前，英文名签名在括号里
        const categoryLabel = categoryLabels[skill.category];
        const nameDisplay = skill.chineseDescription 
            ? `${skill.chineseDescription} (${skill.name})` 
            : skill.name;
        this.label = `${categoryLabel}: ${nameDisplay}`;
    }
}

export class CategoryTreeItem extends vscode.TreeItem {
    constructor(
        public readonly category: string,
        public readonly skills: Skill[]
    ) {
        super(category, vscode.TreeItemCollapsibleState.Expanded);
        
        this.iconPath = new vscode.ThemeIcon('folder');
        this.contextValue = 'category';
        this.description = `${skills.length} 个技能`;
    }
}

export class SkillsProvider implements vscode.TreeDataProvider<SkillTreeItem | CategoryTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<SkillTreeItem | CategoryTreeItem | undefined | null | void> = new vscode.EventEmitter<SkillTreeItem | CategoryTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<SkillTreeItem | CategoryTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private skillsManager: SkillsManager;
    private skills: Skill[] = [];
    private groupByCategory: boolean = true;

    constructor(skillsManager: SkillsManager) {
        this.skillsManager = skillsManager;
    }

    refresh(): void {
        this.loadSkills();
    }

    private async loadSkills(): Promise<void> {
        try {
            this.skills = await this.skillsManager.scanSkills();
            this._onDidChangeTreeData.fire();
        } catch (error) {
            console.error('加载技能失败:', error);
            vscode.window.showErrorMessage(`加载技能失败: ${error}`);
        }
    }

    getTreeItem(element: SkillTreeItem | CategoryTreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: SkillTreeItem | CategoryTreeItem): Promise<(SkillTreeItem | CategoryTreeItem)[]> {
        if (!element) {
            // 根节点：返回分类或所有技能
            if (this.groupByCategory) {
                const categories = this.groupSkillsByCategory();
                return Object.entries(categories).map(([category, skills]) => 
                    new CategoryTreeItem(category, skills)
                );
            } else {
                return this.skills.map(skill => new SkillTreeItem(skill, vscode.TreeItemCollapsibleState.None));
            }
        }

        if (element instanceof CategoryTreeItem) {
            // 分类节点：返回该分类下的技能
            return element.skills.map(skill => 
                new SkillTreeItem(skill, vscode.TreeItemCollapsibleState.None)
            );
        }

        // 技能节点：没有子节点
        return [];
    }

    private groupSkillsByCategory(): Record<string, Skill[]> {
        const categories: Record<string, Skill[]> = {
            '个人技能': [],
            '项目技能': [],
            '内置技能': []
        };

        this.skills.forEach(skill => {
            switch (skill.category) {
                case 'personal':
                    categories['个人技能'].push(skill);
                    break;
                case 'project':
                    categories['项目技能'].push(skill);
                    break;
                case 'cursor':
                    categories['内置技能'].push(skill);
                    break;
            }
        });

        // 移除空分类
        Object.keys(categories).forEach(key => {
            if (categories[key].length === 0) {
                delete categories[key];
            }
        });

        return categories;
    }
}
