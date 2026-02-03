import * as vscode from 'vscode';
import { SkillsManager, Skill } from './skillsManager';

export class SkillCompletionProvider implements vscode.CompletionItemProvider {
    private skillsManager: SkillsManager;

    constructor(skillsManager: SkillsManager) {
        this.skillsManager = skillsManager;
    }

    async provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext
    ): Promise<vscode.CompletionItem[] | vscode.CompletionList | undefined> {
        const linePrefix = document.lineAt(position).text.substring(0, position.character);
        
        console.log(`[Skill Completion] 触发补全，行前缀: "${linePrefix}"`);
        
        // 检查是否在 @ 符号后（支持 @ 后跟字母、数字、连字符、下划线）
        // 匹配模式：@ 后面可以跟任意字符（包括空格前的所有字符）
        const atMatch = linePrefix.match(/@([^\s]*)$/);
        if (!atMatch) {
            console.log(`[Skill Completion] 未匹配 @ 符号模式，行前缀: "${linePrefix}"`);
            return undefined;
        }
        
        console.log(`[Skill Completion] 匹配成功，搜索文本: "${atMatch[1]}"`);

        const searchText = atMatch[1].toLowerCase();

        try {
            // 获取所有技能
            const skills = await this.skillsManager.scanSkills();
            
            const completionItems: vscode.CompletionItem[] = skills
                .filter(skill => {
                    // 如果用户已经输入了部分文本，进行过滤
                    if (searchText) {
                        const skillName = skill.name.toLowerCase();
                        const chineseDesc = (skill.chineseDescription || '').toLowerCase();
                        return skillName.includes(searchText) || chineseDesc.includes(searchText);
                    }
                    return true;
                })
                .map(skill => {
                    const item = new vscode.CompletionItem(
                        skill.name,
                        vscode.CompletionItemKind.Value
                    );
                    
                    // 显示名称和描述：中文在前，英文名作为签名
                    const displayName = skill.chineseDescription 
                        ? `${skill.chineseDescription} (${skill.name})` 
                        : skill.name;
                    item.label = displayName;
                    
                    item.detail = skill.chineseDescription || skill.description || skill.name;
                    item.documentation = new vscode.MarkdownString(
                        `**${skill.name}**\n\n${skill.description || '无描述'}\n\n` +
                        `分类: ${this.getCategoryLabel(skill.category)}\n` +
                        `状态: ${skill.enabled ? '已启用' : '未启用'}`
                    );
                    
                    // 插入文本：@skill-name
                    item.insertText = `@${skill.name}`;
                    
                    // 添加排序优先级（启用的技能排在前面）
                    item.sortText = skill.enabled ? `0_${skill.name}` : `1_${skill.name}`;
                    
                    return item;
                });

            console.log(`[Skill Completion] 返回 ${completionItems.length} 个补全项`);
            return new vscode.CompletionList(completionItems, false);
        } catch (error) {
            console.error('[Skill Completion] 获取技能补全失败:', error);
            return undefined;
        }
    }

    private getCategoryLabel(category: 'personal' | 'project' | 'cursor'): string {
        const labels = {
            'personal': '个人技能',
            'project': '项目技能',
            'cursor': '内置技能'
        };
        return labels[category];
    }
}
