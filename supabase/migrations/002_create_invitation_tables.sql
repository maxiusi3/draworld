-- 邀请奖励系统数据表
-- 创建时间: 2025-01-15

-- 邀请码表
CREATE TABLE invitation_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    invitation_code TEXT UNIQUE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 邀请关系表
CREATE TABLE invitation_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inviter_user_id TEXT NOT NULL,
    invitee_user_id TEXT NOT NULL UNIQUE, -- 一个用户只能被一个人邀请
    invitation_code TEXT NOT NULL,
    registration_reward_given BOOLEAN NOT NULL DEFAULT false,
    first_video_reward_given BOOLEAN NOT NULL DEFAULT false,
    total_rewards_given INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- 外键约束
    FOREIGN KEY (invitation_code) REFERENCES invitation_codes(invitation_code),
    
    -- 防止自邀请
    CONSTRAINT no_self_invitation CHECK (inviter_user_id != invitee_user_id)
);

-- 创建索引以优化查询性能
CREATE INDEX idx_invitation_codes_user_id ON invitation_codes(user_id);
CREATE INDEX idx_invitation_codes_code ON invitation_codes(invitation_code);
CREATE INDEX idx_invitation_relationships_inviter ON invitation_relationships(inviter_user_id);
CREATE INDEX idx_invitation_relationships_invitee ON invitation_relationships(invitee_user_id);
CREATE INDEX idx_invitation_relationships_code ON invitation_relationships(invitation_code);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_invitation_codes_updated_at 
    BEFORE UPDATE ON invitation_codes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invitation_relationships_updated_at 
    BEFORE UPDATE ON invitation_relationships 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入示例数据（可选，用于测试）
-- INSERT INTO invitation_codes (user_id, invitation_code) 
-- VALUES ('demo-user-123', 'DEMO123ABC');

-- 添加注释
COMMENT ON TABLE invitation_codes IS '用户邀请码表';
COMMENT ON TABLE invitation_relationships IS '邀请关系表';
COMMENT ON COLUMN invitation_codes.user_id IS '邀请者用户ID';
COMMENT ON COLUMN invitation_codes.invitation_code IS '唯一邀请码';
COMMENT ON COLUMN invitation_codes.is_active IS '邀请码是否激活';
COMMENT ON COLUMN invitation_relationships.inviter_user_id IS '邀请者用户ID';
COMMENT ON COLUMN invitation_relationships.invitee_user_id IS '被邀请者用户ID';
COMMENT ON COLUMN invitation_relationships.registration_reward_given IS '注册奖励是否已发放';
COMMENT ON COLUMN invitation_relationships.first_video_reward_given IS '首次视频奖励是否已发放';
COMMENT ON COLUMN invitation_relationships.total_rewards_given IS '已发放的总积分数量';
