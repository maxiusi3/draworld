-- 积分系统数据库表结构
-- 创建时间: 2025-01-15
-- 说明: 用户积分系统的核心表结构

-- 1. 用户积分账户表
CREATE TABLE IF NOT EXISTS user_credits (
    user_id TEXT PRIMARY KEY,
    balance INTEGER NOT NULL DEFAULT 0,
    total_earned INTEGER NOT NULL DEFAULT 0,
    total_spent INTEGER NOT NULL DEFAULT 0,
    daily_like_given INTEGER NOT NULL DEFAULT 0,
    last_daily_reset DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- 约束
    CONSTRAINT balance_non_negative CHECK (balance >= 0),
    CONSTRAINT total_earned_non_negative CHECK (total_earned >= 0),
    CONSTRAINT total_spent_non_negative CHECK (total_spent >= 0),
    CONSTRAINT daily_like_given_non_negative CHECK (daily_like_given >= 0)
);

-- 2. 积分交易记录表
CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('EARN', 'SPEND')),
    amount INTEGER NOT NULL CHECK (amount > 0),
    balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
    reason TEXT NOT NULL,
    reference_id TEXT,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- 外键约束
    FOREIGN KEY (user_id) REFERENCES user_credits(user_id) ON DELETE CASCADE
);

-- 3. 创建索引以优化查询性能
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_reason ON credit_transactions(reason);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_reference_id ON credit_transactions(reference_id);

-- 4. 创建更新时间自动更新的触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_credits_updated_at 
    BEFORE UPDATE ON user_credits 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 5. 创建 RLS (Row Level Security) 策略
-- 注意：由于我们使用 Authing 而不是 Supabase Auth，这里暂时禁用 RLS
-- 在生产环境中，应该根据实际的认证方案配置适当的 RLS 策略
ALTER TABLE user_credits DISABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions DISABLE ROW LEVEL SECURITY;

-- 6. 插入一些示例数据（可选，用于测试）
-- INSERT INTO user_credits (user_id, balance, total_earned) 
-- VALUES ('demo-user-1', 150, 150)
-- ON CONFLICT (user_id) DO NOTHING;

-- 7. 创建一些有用的视图
CREATE OR REPLACE VIEW user_credits_summary AS
SELECT 
    uc.user_id,
    uc.balance,
    uc.total_earned,
    uc.total_spent,
    uc.daily_like_given,
    uc.last_daily_reset,
    uc.created_at as account_created_at,
    uc.updated_at as last_updated_at,
    COUNT(ct.id) as total_transactions,
    MAX(ct.created_at) as last_transaction_at
FROM user_credits uc
LEFT JOIN credit_transactions ct ON uc.user_id = ct.user_id
GROUP BY uc.user_id, uc.balance, uc.total_earned, uc.total_spent, 
         uc.daily_like_given, uc.last_daily_reset, uc.created_at, uc.updated_at;

-- 8. 创建积分统计函数
CREATE OR REPLACE FUNCTION get_user_credit_stats(p_user_id TEXT)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'user_id', uc.user_id,
        'balance', uc.balance,
        'total_earned', uc.total_earned,
        'total_spent', uc.total_spent,
        'daily_like_given', uc.daily_like_given,
        'last_daily_reset', uc.last_daily_reset,
        'account_age_days', EXTRACT(DAY FROM NOW() - uc.created_at),
        'transactions_count', COUNT(ct.id),
        'last_transaction_date', MAX(ct.created_at),
        'avg_daily_earning', CASE 
            WHEN EXTRACT(DAY FROM NOW() - uc.created_at) > 0 
            THEN uc.total_earned / EXTRACT(DAY FROM NOW() - uc.created_at)
            ELSE 0 
        END
    ) INTO result
    FROM user_credits uc
    LEFT JOIN credit_transactions ct ON uc.user_id = ct.user_id
    WHERE uc.user_id = p_user_id
    GROUP BY uc.user_id, uc.balance, uc.total_earned, uc.total_spent, 
             uc.daily_like_given, uc.last_daily_reset, uc.created_at;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 9. 创建每日重置函数（用于重置每日限制）
CREATE OR REPLACE FUNCTION reset_daily_limits()
RETURNS INTEGER AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    UPDATE user_credits 
    SET 
        daily_like_given = 0,
        last_daily_reset = CURRENT_DATE,
        updated_at = NOW()
    WHERE last_daily_reset < CURRENT_DATE;
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;

-- 10. 注释说明
COMMENT ON TABLE user_credits IS '用户积分账户表，存储每个用户的积分余额和统计信息';
COMMENT ON TABLE credit_transactions IS '积分交易记录表，记录所有积分的收入和支出';
COMMENT ON COLUMN user_credits.balance IS '当前积分余额';
COMMENT ON COLUMN user_credits.total_earned IS '累计获得的积分';
COMMENT ON COLUMN user_credits.total_spent IS '累计消费的积分';
COMMENT ON COLUMN user_credits.daily_like_given IS '今日已给出的点赞数（用于限制每日社交奖励）';
COMMENT ON COLUMN user_credits.last_daily_reset IS '上次每日重置的日期';
COMMENT ON COLUMN credit_transactions.transaction_type IS '交易类型：EARN（获得）或 SPEND（消费）';
COMMENT ON COLUMN credit_transactions.amount IS '交易金额（积分数量）';
COMMENT ON COLUMN credit_transactions.balance_after IS '交易后的余额快照';
COMMENT ON COLUMN credit_transactions.reason IS '交易原因（如：DAILY_SIGNIN、VIDEO_GENERATION等）';
COMMENT ON COLUMN credit_transactions.reference_id IS '关联的业务ID（如视频ID、邀请ID等）';
COMMENT ON COLUMN credit_transactions.description IS '交易描述（可选的人类可读描述）';
