-- =============================================
-- AI小说创作平台 - 数据库设计
-- =============================================

-- 用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    avatar_url TEXT,
    role VARCHAR(20) DEFAULT 'author', -- author, admin
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 小说表
CREATE TABLE novels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    cover_url TEXT,
    synopsis TEXT, -- 简介
    genre VARCHAR(50), -- 类型: 玄幻, 都市, 穿越等
    status VARCHAR(20) DEFAULT 'draft', -- draft, writing, completed
    word_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 章节表
CREATE TABLE chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    novel_id UUID REFERENCES novels(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES chapters(id), -- 父章节(卷)
    title VARCHAR(200) NOT NULL,
    content TEXT,
    order_index INTEGER DEFAULT 0,
    word_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft', -- draft, published
    is_vip BOOLEAN DEFAULT false,
    price INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 大纲表
CREATE TABLE outlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    novel_id UUID REFERENCES novels(id) ON DELETE CASCADE,
    content JSONB NOT NULL, -- 树状结构的大纲
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Wiki条目表
CREATE TABLE wiki_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    novel_id UUID REFERENCES novels(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL, -- character, location, item, setting, faction
    description TEXT,
    content JSONB, -- 详细内容
    cover_url TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Wiki关系表
CREATE TABLE wiki_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES wiki_entries(id) ON DELETE CASCADE,
    target_id UUID REFERENCES wiki_entries(id) ON DELETE CASCADE,
    relation_type VARCHAR(50), -- 恋人, 敌对, 持有等
    UNIQUE(source_id, target_id)
);

-- 向量索引表 (用于RAG检索)
CREATE TABLE wiki_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wiki_entry_id UUID REFERENCES wiki_entries(id) ON DELETE CASCADE,
    chunk_text TEXT NOT NULL,
    embedding VECTOR(1536), -- OpenAI embedding维度
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI生成历史
CREATE TABLE ai_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    chapter_id UUID REFERENCES chapters(id),
    action_type VARCHAR(50), -- stream_write, style_transfer, outline_generate
    prompt TEXT,
    result TEXT,
    tokens_used INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 收藏/素材表
CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    url TEXT,
    title VARCHAR(200),
    excerpt TEXT,
    tags TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 会话表（存储刷新令牌）
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(255) NOT NULL,
    user_agent TEXT,
    ip_address VARCHAR(45),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

 CREATE INDEX idx_sessions_user ON sessions(user_id);
 CREATE INDEX idx_sessions_token ON sessions(refresh_token_hash);

-- =============================================
-- 索引
-- =============================================

CREATE INDEX idx_novels_user ON novels(user_id);
CREATE INDEX idx_chapters_novel ON chapters(novel_id);
CREATE INDEX idx_wiki_novel ON wiki_entries(novel_id);
CREATE INDEX idx_wiki_type ON wiki_entries(type);
CREATE INDEX idx_ai_logs_user ON ai_logs(user_id);
CREATE INDEX idx_ai_logs_created ON ai_logs(created_at);

-- 向量相似度搜索 (使用pg_vector)
-- CREATE INDEX idx_wiki_embedding ON wiki_embeddings USING ivfflat (embedding vector_cosine_ops);

-- =============================================
-- 协作写作系统
-- =============================================

-- 协作房间表
CREATE TABLE collaboration_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    novel_id UUID REFERENCES novels(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) DEFAULT 'chapter',  -- chapter, outline, setting, ai
    created_by UUID REFERENCES users(id),
    max_members INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 房间成员表
CREATE TABLE room_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES collaboration_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,  -- owner, co_writer, editor, setting_manager, reviewer
    permissions TEXT[] NOT NULL DEFAULT '{}',
    credit_limit INTEGER DEFAULT 0,
    credit_used INTEGER DEFAULT 0,
    last_active_at TIMESTAMP,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(room_id, user_id)
);

-- 协作邀请表
CREATE TABLE collaboration_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES collaboration_rooms(id) ON DELETE CASCADE,
    novel_id UUID REFERENCES novels(id) ON DELETE CASCADE,
    inviter_id UUID REFERENCES users(id),
    invitee_email VARCHAR(100),
    invitee_user_id UUID REFERENCES users(id),
    role VARCHAR(20) NOT NULL,
    permissions TEXT[] NOT NULL DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'pending',  -- pending, accepted, rejected, expired
    token VARCHAR(64) UNIQUE NOT NULL,
    message TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 操作日志表（用于版本恢复和审计）
CREATE TABLE operation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES collaboration_rooms(id),
    chapter_id UUID REFERENCES chapters(id),
    user_id UUID REFERENCES users(id),
    operation_type VARCHAR(20) NOT NULL,  -- insert, delete, replace
    operation_data JSONB NOT NULL,
    position_start INTEGER,
    position_end INTEGER,
    version INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 文档版本快照表
CREATE TABLE document_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_by UUID REFERENCES users(id),
    description VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(chapter_id, version)
);

-- 文档分支表（支持实验性修改）
CREATE TABLE document_branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    source_version INTEGER NOT NULL,
    content TEXT,
    created_by UUID REFERENCES users(id),
    merged BOOLEAN DEFAULT false,
    merged_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 段落锁定表
CREATE TABLE paragraph_locks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES collaboration_rooms(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES chapters(id),
    paragraph_id VARCHAR(50) NOT NULL,
    locked_by UUID REFERENCES users(id),
    locked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    timeout INTEGER DEFAULT 60000,  -- 毫秒
    UNIQUE(room_id, chapter_id, paragraph_id)
);

-- AI调用记录表
CREATE TABLE ai_call_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES collaboration_rooms(id),
    user_id UUID REFERENCES users(id),
    novel_id UUID REFERENCES novels(id),
    task_type VARCHAR(50) NOT NULL,  -- continue, polish, expand, analyze
    model VARCHAR(50) NOT NULL,
    input_text TEXT,
    output_text TEXT,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    cost INTEGER DEFAULT 0,  -- 消耗积分
    status VARCHAR(20) DEFAULT 'completed',  -- pending, completed, failed
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 协作评论表
CREATE TABLE collaboration_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES collaboration_rooms(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES chapters(id),
    user_id UUID REFERENCES users(id),
    parent_id UUID REFERENCES collaboration_comments(id),
    position_start INTEGER,
    position_end INTEGER,
    content TEXT NOT NULL,
    resolved BOOLEAN DEFAULT false,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 协作索引
CREATE INDEX idx_collab_room_novel ON collaboration_rooms(novel_id);
CREATE INDEX idx_collab_room_active ON collaboration_rooms(is_active);
CREATE INDEX idx_room_member ON room_members(room_id, user_id);
CREATE INDEX idx_room_member_user ON room_members(user_id);
CREATE INDEX idx_invitation_token ON collaboration_invitations(token);
CREATE INDEX idx_invitation_status ON collaboration_invitations(status);
CREATE INDEX idx_invitation_novel ON collaboration_invitations(novel_id);
CREATE INDEX idx_operation_chapter ON operation_logs(chapter_id, version);
CREATE INDEX idx_operation_room ON operation_logs(room_id, created_at);
CREATE INDEX idx_snapshot_chapter ON document_snapshots(chapter_id);
CREATE INDEX idx_lock_room_chapter ON paragraph_locks(room_id, chapter_id);
CREATE INDEX idx_ai_call_user ON ai_call_logs(user_id);
CREATE INDEX idx_ai_call_room ON ai_call_logs(room_id);
CREATE INDEX idx_comment_room ON collaboration_comments(room_id);
CREATE INDEX idx_comment_chapter ON collaboration_comments(chapter_id);

-- =============================================
-- 平台直投系统
-- =============================================

-- 投稿平台配置表
CREATE TABLE publish_platforms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,  -- fanqie, qidian, jinjiang, zhihu
    display_name VARCHAR(100) NOT NULL,
    api_endpoint TEXT,
    is_active BOOLEAN DEFAULT true,
    min_word_count INTEGER DEFAULT 20000,
    max_word_count INTEGER DEFAULT 5000000,
    chapter_min_words INTEGER DEFAULT 1000,
    supported_categories TEXT[],
    icon_url TEXT,
    config JSONB,  -- 平台特定配置
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 投稿记录表
CREATE TABLE publish_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    novel_id UUID REFERENCES novels(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    platform_id UUID REFERENCES publish_platforms(id),
    
    -- 投稿信息
    title VARCHAR(200) NOT NULL,
    author_name VARCHAR(50),
    category VARCHAR(50),
    tags TEXT[],
    synopsis TEXT,
    cover_url TEXT,
    
    -- 内容
    total_words INTEGER DEFAULT 0,
    chapter_count INTEGER DEFAULT 0,
    
    -- 状态
    status VARCHAR(20) DEFAULT 'draft',  -- draft, pending, reviewing, published, rejected
    submitted_at TIMESTAMP,
    reviewed_at TIMESTAMP,
    published_at TIMESTAMP,
    
    -- 平台返回信息
    platform_novel_id VARCHAR(100),  -- 平台小说ID
    platform_url TEXT,  -- 平台链接
    platform_data JSONB,  -- 平台返回的其他数据
    
    -- 审核信息
    reject_reason TEXT,
    review_notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 投稿章节表
CREATE TABLE submission_chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES publish_submissions(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES chapters(id),
    
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    word_count INTEGER DEFAULT 0,
    order_index INTEGER DEFAULT 0,
    
    -- 状态
    status VARCHAR(20) DEFAULT 'pending',  -- pending, published
    platform_chapter_id VARCHAR(100),
    published_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 投稿统计数据表
CREATE TABLE submission_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES publish_submissions(id) ON DELETE CASCADE,
    
    -- 阅读数据
    view_count BIGINT DEFAULT 0,
    unique_view_count BIGINT DEFAULT 0,
    
    -- 互动数据
    like_count BIGINT DEFAULT 0,
    comment_count BIGINT DEFAULT 0,
    favorite_count BIGINT DEFAULT 0,
    share_count BIGINT DEFAULT 0,
    
    -- 收入数据（分）
    income BIGINT DEFAULT 0,
    
    -- 日期
    stat_date DATE NOT NULL,
    
    UNIQUE(submission_id, stat_date),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 敏感词表
CREATE TABLE sensitive_words (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    word VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50),  -- political, pornographic, violence, etc.
    severity VARCHAR(20) DEFAULT 'medium',  -- low, medium, high
    suggestion TEXT,  -- 替换建议
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 敏感词检测结果表
CREATE TABLE sensitive_check_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES publish_submissions(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES chapters(id),
    
    total_words INTEGER DEFAULT 0,
    sensitive_count INTEGER DEFAULT 0,
    risk_level VARCHAR(20) DEFAULT 'safe',  -- safe, low, medium, high
    
    -- 详细结果
    matches JSONB,  -- [{word, position, category, suggestion}]
    
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 投稿索引
CREATE INDEX idx_platform_name ON publish_platforms(name);
CREATE INDEX idx_platform_active ON publish_platforms(is_active);
CREATE INDEX idx_submission_novel ON publish_submissions(novel_id);
CREATE INDEX idx_submission_user ON publish_submissions(user_id);
CREATE INDEX idx_submission_platform ON publish_submissions(platform_id);
CREATE INDEX idx_submission_status ON publish_submissions(status);
CREATE INDEX idx_submission_chapter ON submission_chapters(submission_id);
CREATE INDEX idx_stats_submission ON submission_stats(submission_id, stat_date);
CREATE INDEX idx_sensitive_word ON sensitive_words(word);
CREATE INDEX idx_sensitive_active ON sensitive_words(is_active);
CREATE INDEX idx_check_submission ON sensitive_check_results(submission_id);

-- 初始化平台数据
INSERT INTO publish_platforms (name, display_name, min_word_count, chapter_min_words, supported_categories, config) VALUES
('fanqie', '番茄小说', 20000, 2000, 
 ARRAY['玄幻', '都市', '历史', '科幻', '游戏', '悬疑', '言情', '武侠'],
 '{"api_type": "openapi", "requires_token": true}'::jsonb),
('qidian', '起点中文网', 30000, 2000,
 ARRAY['玄幻', '奇幻', '武侠', '仙侠', '都市', '现实', '军事', '游戏', '科幻', '灵异'],
 '{"api_type": "openapi", "requires_token": true}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- 知识图谱系统
-- =============================================

-- 知识图谱节点表
CREATE TABLE knowledge_graph_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    novel_id UUID REFERENCES novels(id) ON DELETE CASCADE,
    entity_id UUID, -- 关联的wiki_entry id
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL, -- character, location, item, faction, event, concept
    category VARCHAR(50), -- 子分类
    description TEXT,
    properties JSONB DEFAULT '{}', -- {age, gender, status, ...}
    importance VARCHAR(20) DEFAULT 'normal', -- core, important, normal, minor
    first_mention_chapter_id UUID REFERENCES chapters(id),
    first_mention_position INTEGER,
    color VARCHAR(7), -- hex color for visualization
    position_x FLOAT, -- 2D visualization position
    position_y FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 知识图谱边表
CREATE TABLE knowledge_graph_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    novel_id UUID REFERENCES novels(id) ON DELETE CASCADE,
    source_node_id UUID REFERENCES knowledge_graph_nodes(id) ON DELETE CASCADE,
    target_node_id UUID REFERENCES knowledge_graph_nodes(id) ON DELETE CASCADE,
    relation_type VARCHAR(50) NOT NULL, -- 恋人, 父子, 敌对, 所属, 参与, 导致
    relation_label VARCHAR(100),
    properties JSONB DEFAULT '{}', -- {start_time, end_time, ...}
    weight FLOAT DEFAULT 1.0, -- 边的权重，用于可视化
    is_implicit BOOLEAN DEFAULT false, -- 是否为推断出的关系
    confidence FLOAT DEFAULT 1.0, -- 推断置信度
    evidence_chapter_ids UUID[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source_node_id, target_node_id, relation_type)
);

-- 实体提取任务表
CREATE TABLE entity_extraction_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    novel_id UUID REFERENCES novels(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES chapters(id),
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
    entities_found INTEGER DEFAULT 0,
    relations_found INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 一致性检查任务表
CREATE TABLE consistency_check_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    novel_id UUID REFERENCES novels(id) ON DELETE CASCADE,
    check_type VARCHAR(50) NOT NULL, -- timeline, property, relation, custom
    scope VARCHAR(20) DEFAULT 'all', -- all, chapter, range
    scope_chapter_start UUID,
    scope_chapter_end UUID,
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
    issues_found INTEGER DEFAULT 0,
    result JSONB,
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 知识图谱索引
CREATE INDEX idx_kg_node_novel ON knowledge_graph_nodes(novel_id);
CREATE INDEX idx_kg_node_type ON knowledge_graph_nodes(type);
CREATE INDEX idx_kg_node_entity ON knowledge_graph_nodes(entity_id);
CREATE INDEX idx_kg_edge_novel ON knowledge_graph_edges(novel_id);
CREATE INDEX idx_kg_edge_source ON knowledge_graph_edges(source_node_id);
CREATE INDEX idx_kg_edge_target ON knowledge_graph_edges(target_node_id);
CREATE INDEX idx_kg_edge_type ON knowledge_graph_edges(relation_type);
CREATE INDEX idx_extraction_task_status ON entity_extraction_tasks(status);
CREATE INDEX idx_consistency_task_status ON consistency_check_tasks(status);

-- =============================================
-- AI指数检测系统
-- =============================================

-- AI检测结果表
CREATE TABLE ai_detection_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    novel_id UUID REFERENCES novels(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    chapter_id UUID REFERENCES chapters(id),
    detection_type VARCHAR(20) NOT NULL, -- chapter, novel
    
    -- 三维指数 (0-100)
    human_score INTEGER DEFAULT 50,
    suspected_ai_score INTEGER DEFAULT 30,
    ai_score INTEGER DEFAULT 20,
    
    -- 统计特征
    avg_sentence_length FLOAT DEFAULT 0,
    vocab_diversity FLOAT DEFAULT 0,
    perplexity_score FLOAT DEFAULT 0,
    burstiness_score FLOAT DEFAULT 0,
    repetition_rate FLOAT DEFAULT 0,
    
    -- 段落级分析
    paragraph_results JSONB DEFAULT '[]',
    
    -- 模型检测结果
    detected_models TEXT[], -- ['GPT-4', 'Claude']
    model_confidences JSONB DEFAULT '{}',
    
    -- 整体评估
    risk_level VARCHAR(20) DEFAULT 'unknown', -- safe, low, medium, high, very_high
    confidence FLOAT DEFAULT 0.5,
    summary TEXT,
    suggestions TEXT[],
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI检测任务表
CREATE TABLE ai_detection_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    novel_id UUID REFERENCES novels(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
    detection_type VARCHAR(20) NOT NULL, -- chapter, novel
    
    -- 进度
    total_chapters INTEGER DEFAULT 0,
    processed_chapters INTEGER DEFAULT 0,
    current_chapter_id UUID,
    
    -- 结果汇总
    result_id UUID REFERENCES ai_detection_results(id),
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI特征模式库
CREATE TABLE ai_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name VARCHAR(50) NOT NULL, -- GPT-4, Claude, DeepSeek, Gemini, Wenxin, Doubao, Yuanbao
    pattern_type VARCHAR(50) NOT NULL, -- sentence, vocabulary, structure, emotion
    pattern_regex TEXT NOT NULL,
    pattern_description TEXT,
    weight FLOAT DEFAULT 1.0, -- 影响权重
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI检测索引
CREATE INDEX idx_ai_result_novel ON ai_detection_results(novel_id);
CREATE INDEX idx_ai_result_chapter ON ai_detection_results(chapter_id);
CREATE INDEX idx_ai_result_user ON ai_detection_results(user_id);
CREATE INDEX idx_ai_result_risk ON ai_detection_results(risk_level);
CREATE INDEX idx_ai_task_status ON ai_detection_tasks(status);
CREATE INDEX idx_ai_task_novel ON ai_detection_tasks(novel_id);
CREATE INDEX idx_ai_pattern_model ON ai_patterns(model_name);
CREATE INDEX idx_ai_pattern_active ON ai_patterns(is_active);

-- 初始化AI特征模式
INSERT INTO ai_patterns (model_name, pattern_type, pattern_regex, pattern_description, weight) VALUES
-- GPT-4 特征
('GPT-4', 'sentence', '首先，其次，最后，因此，然而，不过', '过度使用连接词', 1.2),
('GPT-4', 'structure', '一方面{0,3}另一方面', '机械化的对比结构', 1.0),
('GPT-4', 'vocabulary', '至关重要|不可或缺|众所周知|毋庸置疑', '过度使用的四字词语', 0.8),

-- Claude 特征
('Claude', 'sentence', '[，。][^，。！？]{80,}', '超长复合句', 1.5),
('Claude', 'structure', '具体而言|总的来说|值得注意的是', '学术化开头语', 1.0),
('Claude', 'emotion', '感受到.*的情感|内心.*的挣扎', '过度描写内心情感', 0.7),

-- DeepSeek 特征
('DeepSeek', 'sentence', '因为.*所以|如果.*那么', '过度使用的逻辑链', 1.3),
('DeepSeek', 'structure', '第一步|第二步|第三步|总结', '机械化的步骤结构', 1.1),
('DeepSeek', 'vocabulary', '核心要点|关键在于|本质上', '过度使用的总结词', 0.9),

-- Gemini 特征
('Gemini', 'structure', '同时|此外|另外|除此之外', '多角度并列结构', 1.0),
('Gemini', 'sentence', '从.*角度来看|从.*视角来看', '过度使用视角切换', 0.8),

-- 文心一言特征
('Wenxin', 'vocabulary', '日新月异|蒸蒸日上|欣欣向荣|五彩缤纷', '过度使用的成语', 1.4),
('Wenxin', 'structure', '不仅.*而且|既.*又', '对仗工整结构', 1.0),
('Wenxin', 'emotion', '激动不已|感慨万千|热泪盈眶', '过度使用的情感词', 0.8),

-- 豆包特征
('Doubao', 'sentence', '真的.*吗|[？?]$', '过度使用反问句', 0.9),
('Doubao', 'vocabulary', '太.*了吧|真的.*诶', '口语化表达', 0.6),

-- 元宝特征
('Yuanbao', 'vocabulary', '牛蛙|绝绝子|emo|YYDS', '网络流行语', 0.7),
('Yuanbao', 'structure', '家人们|就是说|各位', '过度使用的口头禅', 0.8)
ON CONFLICT DO NOTHING;
