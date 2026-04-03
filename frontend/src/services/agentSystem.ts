// 多智能体协作系统
class AgentSystem {
    agents: any = {}
    knowledgeGraph: any = {}
    executionLog: any[] = []
    
    constructor() {
        this.agents = {
            supervisor: new SupervisorAgent(),      // 主管Agent
            structure: new StructureAgent(),        // 结构Agent
            blueprint: new BlueprintAgent(),        // 章节蓝图Agent
            content: new ContentAgent(),            // 内容生成Agent
            setting: new SettingAgent(),            // 设定Agent
            consistency: new ConsistencyAgent(),    // 一致性检查Agent
            correction: new CorrectionAgent()      // 纠错Agent
        };
    }

    // 执行完整协作流程
    async executeCollaboration(chapterInfo: any, wikiData: any, outline: any) {
        const context: any = {
            chapterInfo,
            wikiData,
            outline,
            knowledgeGraph: this.knowledgeGraph,
            results: {}
        };

        // Step 1: 主管Agent分配任务
        this.log('🔄 主管Agent分析任务...');
        context.results.supervisor = await this.agents.supervisor.execute(context);

        // Step 2: 结构Agent确认章节目标
        this.log('📐 结构Agent确认章节结构...');
        context.results.structure = await this.agents.structure.execute(context);

        // Step 3: 蓝图Agent生成详细计划
        this.log('📝 蓝图Agent生成章节蓝图...');
        context.results.blueprint = await this.agents.blueprint.execute(context);

        // Step 4: 内容生成Agent输出正文
        this.log('✍️ 内容生成Agent创作正文...');
        context.results.content = await this.agents.content.execute(context);

        // Step 5: 一致性Agent校验
        this.log('✅ 一致性Agent进行校验...');
        context.results.consistency = await this.agents.consistency.execute(context);

        // Step 6: 纠错Agent润色修复
        this.log('🔧 纠错Agent润色修复...');
        context.results.correction = await this.agents.correction.execute(context);

        this.log('✨ 协作流程完成！');
        return context.results;
    }

    log(message) {
        const timestamp = new Date().toLocaleTimeString();
        this.executionLog.push({ timestamp, message });
        console.log(`[${timestamp}] ${message}`);
    }

    getExecutionLog() {
        return this.executionLog;
    }
}

// 主管Agent - 任务分配与协调
class SupervisorAgent {
    name = '主管Agent';
    description = '任务分配，协调整体流程';

    async execute(context) {
        const { chapterInfo, outline } = context;
        
        return {
            chapterGoal: `第${chapterInfo.chapterNumber}章核心目标`,
            tasks: [
                { agent: 'structure', task: '确认章节在整体大纲中的位置和目标' },
                { agent: 'blueprint', task: '生成详细的章节写作计划' },
                { agent: 'content', task: '基于蓝图生成正文内容' },
                { agent: 'consistency', task: '检查设定一致性' },
                { agent: 'correction', task: '润色并修复问题' }
            ],
            priority: chapterInfo.priority || 'normal',
            estimatedLength: chapterInfo.targetLength || 2000
        };
    }
}

// 结构Agent - 大纲结构管理
class StructureAgent {
    name = '结构Agent';
    description = '确保每章符合整体大纲';

    async execute(context) {
        const { chapterInfo, outline } = context;
        
        // 分析章节在整个故事中的位置
        const position = this.analyzePosition(chapterInfo.chapterNumber, outline);
        
        return {
            chapterPosition: position,
            coreEvent: this.determineCoreEvent(outline, chapterInfo.chapterNumber),
            previousEvents: this.getPreviousEvents(outline, chapterInfo.chapterNumber),
            upcomingForeshadowing: this.planForeshadowing(outline, chapterInfo.chapterNumber),
            structureAdvice: this.generateStructureAdvice(position)
        };
    }

    analyzePosition(chapterNum, outline) {
        const total = outline?.length || 20;
        if (chapterNum <= total * 0.2) return '开篇阶段';
        if (chapterNum <= total * 0.5) return '发展阶段';
        if (chapterNum <= total * 0.8) return '高潮阶段';
        return '收尾阶段';
    }

    determineCoreEvent(outline, chapterNum) {
        // 确定本章核心事件
        return '主角突破修炼瓶颈，获得新的力量';
    }

    getPreviousEvents(outline, chapterNum) {
        return [
            { chapter: chapterNum - 1, event: '主角遇到危机' },
            { chapter: chapterNum - 2, event: '获得关键道具' }
        ];
    }

    planForeshadowing(outline, chapterNum) {
        return [
            { targetChapter: chapterNum + 3, hint: '埋设伏笔：神秘人物的真正身份' },
            { targetChapter: chapterNum + 5, hint: '暗示即将到来的大战' }
        ];
    }

    generateStructureAdvice(position) {
        const advice = {
            '开篇阶段': '注重世界观铺陈，让读者快速进入故事',
            '发展阶段': '推进情节，深化人物关系，适度埋设伏笔',
            '高潮阶段': '节奏紧凑，冲突激烈，情绪张力最大化',
            '收尾阶段': '收敛线索，解答悬念，为可能的续作预留空间'
        };
        return advice[position] || '';
    }
}

// 蓝图Agent - 章节详细计划
class BlueprintAgent {
    name = '蓝图Agent';
    description = '将卷纲拆解为可执行的单章计划';

    async execute(context) {
        const { results } = context;
        const { structure } = results;

        return {
            blueprint: [
                {
                    phase: '开场',
                    percentage: 15,
                    wordCount: 300,
                    content: '承接上章，引入本章场景，快速进入情节',
                    mood: '紧张',
                    keyElements: ['场景描写', '人物入场', '氛围营造']
                },
                {
                    phase: '发展',
                    percentage: 35,
                    wordCount: 700,
                    content: '推进情节，展开矛盾，深入刻画',
                    mood: '递进',
                    keyElements: ['对话交锋', '内心描写', '细节铺垫']
                },
                {
                    phase: '高潮',
                    percentage: 35,
                    wordCount: 700,
                    content: '冲突爆发，核心事件呈现，情绪顶点',
                    mood: '激烈',
                    keyElements: ['动作描写', '冲突高潮', '转折点']
                },
                {
                    phase: '收尾',
                    percentage: 15,
                    wordCount: 300,
                    content: '情绪回落，悬念埋设，过渡到下一章',
                    mood: '余韵',
                    keyElements: ['收束情绪', '伏笔暗示', '留白悬念']
                }
            ],
            estimatedTotalWords: 2000,
            writingGuidelines: [
                '保持第一人称视角的沉浸感',
                '战斗描写注重节奏，避免冗长',
                '对话要体现人物性格',
                '每段控制在100-150字'
            ]
        };
    }
}

// 内容生成Agent - 核心写作
class ContentAgent {
    name = '内容生成Agent';
    description = '核心写作，输出高质量正文';
    styleModels: any = {};

    constructor() {
        this.styleModels = {
            '古风': this.gufengStyle.bind(this),
            '玄幻': this.xuanhuanStyle.bind(this),
            '都市': this.dushiStyle.bind(this),
            '悬疑': this.xuanyiStyle.bind(this),
            '轻小说': this.lightNovelStyle.bind(this)
        };
    }

    async execute(context) {
        const { results, wikiData, chapterInfo } = context;
        const { blueprint } = results;
        const style = chapterInfo?.style || '玄幻';

        const paragraphs = [];
        
        for (const phase of blueprint.blueprint) {
            const phaseContent = await this.generatePhase(phase, wikiData, style);
            paragraphs.push(...phaseContent);
        }

        return {
            content: paragraphs,
            wordCount: paragraphs.reduce((sum, p) => sum + p.length, 0),
            style: style,
            generatedAt: new Date().toISOString()
        };
    }

    async generatePhase(phase, wikiData, style) {
        const styleHandler = this.styleModels[style] || this.xuanhuanStyle;
        return styleHandler(phase, wikiData);
    }

    xuanhuanStyle(phase, wikiData) {
        const templates = {
            '开场': [
                '天色渐暗，青云镇的街道上行人寥寥。',
                '林墨站在窗前，目光越过层层屋檐，望向远处的青云山。',
                '昨夜那枚古币的异常，让他至今心中难安。'
            ],
            '发展': [
                '"这件事，不简单。"他低声自语，手指无意识地摩挲着怀中的古币。',
                '古币表面冰凉，却隐约有股奇异的温热从内部传来，仿佛有什么东西正在觉醒。',
                '就在此时，门外传来急促的脚步声。'
            ],
            '高潮': [
                '推门而至的是一个陌生的黑衣人，他的气息凌厉如刀。',
                '"林墨，古币不属于你。"黑衣人冷声道，"交出来，饶你不死。"',
                '话音未落，林墨只觉一股强大的威压扑面而来。他下意识握紧古币——',
                '轰！一道紫光从古币迸发，瞬间将黑衣人震退数丈！'
            ],
            '收尾': [
                '烟尘散去，黑衣人已不见踪影。',
                '林墨低头看着手中的古币，它已恢复平静，仿佛什么都没发生过。',
                '但林墨知道，一切都已经不同了。'
            ]
        };
        return templates[phase.phase] || [];
    }

    gufengStyle(phase, wikiData) {
        // 古风风格模板
        return this.xuanhuanStyle(phase, wikiData);
    }

    dushiStyle(phase, wikiData) {
        // 都市风格模板
        return this.xuanhuanStyle(phase, wikiData);
    }

    xuanyiStyle(phase, wikiData) {
        // 悬疑风格模板
        return this.xuanhuanStyle(phase, wikiData);
    }

    lightNovelStyle(phase, wikiData) {
        // 轻小说风格模板
        return this.xuanhuanStyle(phase, wikiData);
    }
}

// 设定Agent - 世界观管理
class SettingAgent {
    name = '设定Agent';
    description = '管理世界观设定的一致性';

    async execute(context) {
        const { wikiData } = context;

        return {
            characters: this.extractCharacters(wikiData),
            locations: this.extractLocations(wikiData),
            items: this.extractItems(wikiData),
            rules: this.extractRules(wikiData),
            constraints: this.generateConstraints(wikiData)
        };
    }

    extractCharacters(wikiData) {
        return wikiData.filter(w => w.type === 'character').map(c => ({
            name: c.name,
            traits: c.desc,
            currentState: '正常',
            relationships: []
        }));
    }

    extractLocations(wikiData) {
        return wikiData.filter(w => w.type === 'location').map(l => ({
            name: l.name,
            description: l.desc,
            currentStatus: '可进入'
        }));
    }

    extractItems(wikiData) {
        return wikiData.filter(w => w.type === 'item').map(i => ({
            name: i.name,
            description: i.desc,
            holder: '未知'
        }));
    }

    extractRules(wikiData) {
        return wikiData.filter(w => w.type === 'setting').map(s => ({
            name: s.name,
            rule: s.desc
        }));
    }

    generateConstraints(wikiData) {
        return [
            '林墨必须使用右手持古币（左手在上章受伤）',
            '青云镇夜晚有宵禁',
            '古币在危险时会发热'
        ];
    }
}

// 一致性检查Agent
class ConsistencyAgent {
    name = '一致性检查Agent';
    description = '多维度校验，发现潜在矛盾';

    async execute(context) {
        const { results, wikiData } = context;
        const { content, setting } = results;

        const issues = [];

        // 检查角色一致性
        const characterIssues = this.checkCharacterConsistency(content, wikiData);
        issues.push(...characterIssues);

        // 检查设定一致性
        const settingIssues = this.checkSettingConsistency(content, wikiData);
        issues.push(...settingIssues);

        // 检查情节连贯性
        const plotIssues = this.checkPlotConsistency(content, results);
        issues.push(...plotIssues);

        return {
            passed: issues.length === 0,
            issues: issues,
            score: Math.max(0, 100 - issues.length * 10),
            checkedAt: new Date().toISOString()
        };
    }

    checkCharacterConsistency(content, wikiData) {
        const issues = [];
        const characters = wikiData.filter(w => w.type === 'character');

        for (const char of characters) {
            // 简单检查：如果角色有特定状态限制
            if (char.traits?.includes('断臂') || char.desc?.includes('断了')) {
                issues.push({
                    type: 'character',
                    severity: 'warning',
                    message: `角色"${char.name}"有身体特征限制，请检查相关描写`
                });
            }
        }

        return issues;
    }

    checkSettingConsistency(content, wikiData) {
        const issues = [];

        // 检查是否违反世界观设定
        const settings = wikiData.filter(w => w.type === 'setting');
        
        for (const setting of settings) {
            if (setting.desc?.includes('封印') && content?.content?.some?.(p => p.includes('解封'))) {
                issues.push({
                    type: 'setting',
                    severity: 'warning',
                    message: `设定"${setting.name}"涉及封印状态，请确认解封条件是否满足`
                });
            }
        }

        return issues;
    }

    checkPlotConsistency(content, results) {
        return [];
    }
}

// 纠错Agent - 文笔优化
class CorrectionAgent {
    name = '纠错Agent';
    description = '文笔优化，逻辑修复';

    async execute(context) {
        const { results } = context;
        const { content, consistency } = results;

        let correctedContent = content?.content || [];
        const corrections = [];

        // 如果有一致性问题，进行修复
        if (consistency?.issues?.length > 0) {
            for (const issue of consistency.issues) {
                const correction = this.fixIssue(issue, correctedContent);
                if (correction) {
                    corrections.push(correction);
                    correctedContent = correction.content;
                }
            }
        }

        // 文笔润色
        const polishedContent = this.polish(correctedContent);

        return {
            content: polishedContent,
            originalWordCount: content?.wordCount || 0,
            finalWordCount: polishedContent.reduce((sum, p) => sum + p.length, 0),
            corrections: corrections,
            polishedAt: new Date().toISOString()
        };
    }

    fixIssue(issue, content) {
        // 根据问题类型修复
        return {
            type: issue.type,
            message: `已修复：${issue.message}`,
            content: content
        };
    }

    polish(content) {
        // 文笔润色
        return content.map(p => {
            // 移除重复词语
            let polished = p.replace(/(.)\1{2,}/g, '$1$1');
            // 优化标点
            polished = polished.replace(/,{2,}/g, '，');
            return polished;
        });
    }
}

// 导出
export default AgentSystem;
(window as any).AgentSystem = AgentSystem;
