-- 创意广场（轻社区）数据表
-- 创建时间: 2025-01-15

-- 作品表
CREATE TABLE artworks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    is_public BOOLEAN NOT NULL DEFAULT true,
    like_count INTEGER NOT NULL DEFAULT 0,
    comment_count INTEGER NOT NULL DEFAULT 0,
    view_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 点赞表
CREATE TABLE artwork_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artwork_id UUID NOT NULL,
    user_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- 外键约束
    FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE,
    
    -- 防止重复点赞
    UNIQUE(artwork_id, user_id)
);

-- 评论表
CREATE TABLE artwork_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artwork_id UUID NOT NULL,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    is_approved BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- 外键约束
    FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE
);

-- 举报表
CREATE TABLE content_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_type TEXT NOT NULL CHECK (target_type IN ('artwork', 'comment')),
    target_id UUID NOT NULL,
    reporter_user_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引以优化查询性能
CREATE INDEX idx_artworks_user_id ON artworks(user_id);
CREATE INDEX idx_artworks_is_public ON artworks(is_public);
CREATE INDEX idx_artworks_created_at ON artworks(created_at DESC);
CREATE INDEX idx_artworks_like_count ON artworks(like_count DESC);
CREATE INDEX idx_artworks_view_count ON artworks(view_count DESC);

CREATE INDEX idx_artwork_likes_artwork_id ON artwork_likes(artwork_id);
CREATE INDEX idx_artwork_likes_user_id ON artwork_likes(user_id);

CREATE INDEX idx_artwork_comments_artwork_id ON artwork_comments(artwork_id);
CREATE INDEX idx_artwork_comments_user_id ON artwork_comments(user_id);
CREATE INDEX idx_artwork_comments_is_approved ON artwork_comments(is_approved);

CREATE INDEX idx_content_reports_target_type_id ON content_reports(target_type, target_id);
CREATE INDEX idx_content_reports_status ON content_reports(status);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_artworks_updated_at 
    BEFORE UPDATE ON artworks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_artwork_comments_updated_at 
    BEFORE UPDATE ON artwork_comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_reports_updated_at 
    BEFORE UPDATE ON content_reports 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建点赞数量更新触发器
CREATE OR REPLACE FUNCTION update_artwork_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE artworks SET like_count = like_count + 1 WHERE id = NEW.artwork_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE artworks SET like_count = like_count - 1 WHERE id = OLD.artwork_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_artwork_like_count_trigger
    AFTER INSERT OR DELETE ON artwork_likes
    FOR EACH ROW EXECUTE FUNCTION update_artwork_like_count();

-- 创建评论数量更新触发器
CREATE OR REPLACE FUNCTION update_artwork_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE artworks SET comment_count = comment_count + 1 WHERE id = NEW.artwork_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE artworks SET comment_count = comment_count - 1 WHERE id = OLD.artwork_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_artwork_comment_count_trigger
    AFTER INSERT OR DELETE ON artwork_comments
    FOR EACH ROW EXECUTE FUNCTION update_artwork_comment_count();

-- 插入示例数据（可选，用于测试）
-- INSERT INTO artworks (user_id, title, description, video_url, thumbnail_url) 
-- VALUES ('demo-user-123', '示例作品', '这是一个示例作品描述', 'https://example.com/video.mp4', 'https://example.com/thumb.jpg');

-- 添加注释
COMMENT ON TABLE artworks IS '用户作品表';
COMMENT ON TABLE artwork_likes IS '作品点赞表';
COMMENT ON TABLE artwork_comments IS '作品评论表';
COMMENT ON TABLE content_reports IS '内容举报表';

COMMENT ON COLUMN artworks.user_id IS '创作者用户ID';
COMMENT ON COLUMN artworks.title IS '作品标题';
COMMENT ON COLUMN artworks.description IS '作品描述';
COMMENT ON COLUMN artworks.video_url IS '视频文件URL';
COMMENT ON COLUMN artworks.thumbnail_url IS '缩略图URL';
COMMENT ON COLUMN artworks.is_public IS '是否公开显示';
COMMENT ON COLUMN artworks.like_count IS '点赞数量';
COMMENT ON COLUMN artworks.comment_count IS '评论数量';
COMMENT ON COLUMN artworks.view_count IS '浏览次数';

COMMENT ON COLUMN artwork_likes.artwork_id IS '被点赞的作品ID';
COMMENT ON COLUMN artwork_likes.user_id IS '点赞用户ID';

COMMENT ON COLUMN artwork_comments.artwork_id IS '评论的作品ID';
COMMENT ON COLUMN artwork_comments.user_id IS '评论用户ID';
COMMENT ON COLUMN artwork_comments.content IS '评论内容';
COMMENT ON COLUMN artwork_comments.is_approved IS '是否通过审核';

COMMENT ON COLUMN content_reports.target_type IS '举报目标类型（artwork/comment）';
COMMENT ON COLUMN content_reports.target_id IS '举报目标ID';
COMMENT ON COLUMN content_reports.reporter_user_id IS '举报用户ID';
COMMENT ON COLUMN content_reports.reason IS '举报原因';
COMMENT ON COLUMN content_reports.description IS '举报详细描述';
COMMENT ON COLUMN content_reports.status IS '处理状态（pending/resolved/rejected）';
