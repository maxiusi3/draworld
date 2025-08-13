"use strict";
// 语言: TypeScript
// 说明: 阿里云函数计算（FC）入口，提供 /api/video/start、/api/video/status、/api/oss/sts
// 文件保持 < 200 行，关键逻辑注释清晰
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
const jose_1 = require("jose");
const sts_sdk_1 = __importDefault(require("@alicloud/sts-sdk"));
const tablestore_1 = __importDefault(require("tablestore"));
// 环境变量（在 s.yaml 中注入）
const { TONGYI_API_KEY, OSS_REGION = 'cn-hangzhou', OSS_BUCKET_UPLOAD = 'draworld2025', OSS_BUCKET_STATIC = 'draworld2', TABESTORE_INSTANCE = 'i01wvvv53p0q', OIDC_ISSUER = 'https://draworld.authing.cn/oidc', OIDC_JWKS = 'https://draworld.authing.cn/oidc/.well-known/jwks.json', OIDC_AUD = '689adde75ecb97cd396860eb', } = process.env;
// 简易响应工具
const json = (code, data) => ({ statusCode: code, headers: corsHeaders(), body: JSON.stringify(data) });
const corsHeaders = () => ({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
});
// 鉴权：验证前端 Bearer Token（Authing OIDC）
const jwksCache = (0, jose_1.createLocalJWKSet)({ keys: [] });
let jwksRemote = null;
async function ensureJwks() {
    if (!jwksRemote) {
        const res = await (0, node_fetch_1.default)(OIDC_JWKS);
        const jwks = await res.json();
        jwksRemote = (0, jose_1.createLocalJWKSet)(jwks);
    }
    return jwksRemote;
}
async function verifyBearer(authorization) {
    if (!authorization || !authorization.startsWith('Bearer '))
        throw new Error('Unauthorized');
    const token = authorization.slice('Bearer '.length);
    const { payload } = await (0, jose_1.jwtVerify)(token, await ensureJwks(), {
        issuer: OIDC_ISSUER,
        audience: OIDC_AUD,
    });
    return payload; // payload.sub 为用户唯一标识
}
// STS：签发前端直传 OSS 的临时凭证（最小权限）
async function issueSTS(uid) {
    // 需由 FC 具备 AssumeRole 权限，角色策略需限制到具体 bucket 与路径前缀
    const sts = new sts_sdk_1.default({
        accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
        accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
        // 可选 securityToken
    });
    const prefix = `user-${uid}/`;
    const policy = {
        Version: '1',
        Statement: [
            {
                Effect: 'Allow',
                Action: ['oss:PutObject'],
                Resource: [
                    `acs:oss:*:*:${OSS_BUCKET_UPLOAD}/${prefix}*`
                ]
            }
        ]
    };
    const res = await sts.assumeRole(process.env.ASSUME_ROLE_ARN, JSON.stringify(policy), 900, 'tonghua-session');
    const creds = res.credentials;
    return {
        accessKeyId: creds.AccessKeyId,
        accessKeySecret: creds.AccessKeySecret,
        securityToken: creds.SecurityToken,
        region: OSS_REGION,
        bucket: OSS_BUCKET_UPLOAD,
        expiration: creds.Expiration,
        prefix
    };
}
// Tablestore 客户端（最小使用）
function createOTS() {
    return new tablestore_1.default.Client({
        accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
        accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
        endpoint: `https://${TABESTORE_INSTANCE}.${OSS_REGION}.ots.aliyuncs.com`,
        instancename: TABESTORE_INSTANCE
    });
}
// OTS helpers: 表 videos 的基本操作（简化）
async function otsPutVideoTask(taskId, attrs) {
    const client = createOTS();
    const params = {
        tableName: 'videos',
        condition: new tablestore_1.default.Condition(tablestore_1.default.RowExistenceExpectation.IGNORE, null),
        primaryKey: [{ 'tenantId': 'tonghua' }, { 'videoId': taskId }],
        // 注意：Tablestore SDK 字段名为 columnName/columnValue
        attributeColumns: Object.entries(attrs).map(([k, v]) => ({ columnName: k, columnValue: v }))
    };
    await client.putRow(params);
}
async function otsGetVideoTask(taskId) {
    const client = createOTS();
    const params = {
        tableName: 'videos',
        primaryKey: [{ 'tenantId': 'tonghua' }, { 'videoId': taskId }],
        maxVersions: 1
    };
    const data = await client.getRow(params);
    const row = data.row;
    if (!row || !row.primaryKey)
        return null;
    const toObj = {};
    for (const c of row.attributeColumns || [])
        toObj[c.columnName] = c.columnValue;
    return { videoId: taskId, ...toObj };
}
// 辅助：写入二级索引表 videos_by_user（按 userId+createdAt）
async function otsIndexVideoByUser(userId, createdAt, videoId) {
    const client = createOTS();
    const params = {
        tableName: 'videos_by_user',
        condition: new tablestore_1.default.Condition(tablestore_1.default.RowExistenceExpectation.IGNORE, null),
        primaryKey: [
            { 'tenantId': 'tonghua' },
            { 'userId': userId },
            { 'createdAt': tablestore_1.default.Long.fromNumber(createdAt) },
            { 'videoId': videoId }
        ],
        attributeColumns: []
    };
    await client.putRow(params);
}
// 通义万相调用（最小可用实现：直接调用 DashScope 并返回 task_id）
async function startVideoTask({ inputImageUrl, params, userId }) {
    const requestBody = {
        model: 'wan2.2-i2v-flash',
        input: {
            prompt: params?.prompt || '',
            img_url: inputImageUrl
        },
        parameters: {
            resolution: '720P',
            prompt_extend: true,
            watermark: false
        }
    };
    const resp = await (0, node_fetch_1.default)('https://dashscope.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${TONGYI_API_KEY}`,
            'X-DashScope-Async': 'enable'
        },
        body: JSON.stringify(requestBody)
    });
    const text = await resp.text();
    if (!resp.ok)
        throw new Error(`DashScope error: ${resp.status} ${text}`);
    const data = JSON.parse(text);
    if (!data.output?.task_id)
        throw new Error('DashScope response missing task_id');
    const taskId = data.output.task_id;
    // 写入 Tablestore 任务记录
    const createdAt = Date.now();
    await otsPutVideoTask(taskId, {
        userId,
        status: 'PENDING',
        inputImageUrl,
        createdAt,
        updatedAt: createdAt,
        params: JSON.stringify(params || {})
    });
    await otsIndexVideoByUser(userId, createdAt, taskId);
    return { taskId };
}
exports.handler = async function (req, res, context) {
    // 兼容 HTTP 触发器请求
    if (req.method === 'OPTIONS')
        return res.setHeader('Access-Control-Allow-Origin', '*'), res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type'), res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS'), res.status(200).send('OK');
    try {
        const url = new URL(req.url, 'http://localhost');
        if (url.pathname === '/api/oss/sts' && req.method === 'GET') {
            const payload = await verifyBearer(req.headers['authorization']);
            const creds = await issueSTS(String(payload.sub));
            return res.status(200).set(corsHeaders()).send(JSON.stringify(creds));
        }
        if (url.pathname === '/api/video/start' && req.method === 'POST') {
            const payload = await verifyBearer(req.headers['authorization']);
            const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
            const result = await startVideoTask({ inputImageUrl: body.inputImageUrl, params: body.params, userId: String(payload.sub) });
            return res.status(200).set(corsHeaders()).send(JSON.stringify(result));
        }
        if (url.pathname === '/api/video/list' && req.method === 'GET') {
            const payload = await verifyBearer(req.headers['authorization']);
            const userId = String(payload.sub);
            const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 50);
            const client = createOTS();
            // 以 userId 倒序 createdAt 拉取最近 N 条
            const inclusiveMax = [
                { 'tenantId': 'tonghua' },
                { 'userId': userId },
                { 'createdAt': tablestore_1.default.INF_MAX },
                { 'videoId': tablestore_1.default.INF_MAX }
            ];
            const inclusiveMin = [
                { 'tenantId': 'tonghua' },
                { 'userId': userId },
                { 'createdAt': tablestore_1.default.INF_MIN },
                { 'videoId': tablestore_1.default.INF_MIN }
            ];
            const rangeReq = {
                tableName: 'videos_by_user',
                direction: tablestore_1.default.Direction.BACKWARD,
                inclusiveStartPrimaryKey: inclusiveMax,
                exclusiveEndPrimaryKey: inclusiveMin,
                limit
            };
            const rangeRes = await client.getRange(rangeReq);
            const tasks = [];
            for (const row of rangeRes.rows || []) {
                const videoId = String(row.primaryKey[3].value);
                const v = await otsGetVideoTask(videoId);
                if (v)
                    tasks.push({
                        taskId: videoId,
                        status: v.status === 'SUCCEEDED' ? 'completed' : (v.status === 'FAILED' ? 'failed' : 'processing'),
                        resultVideoUrl: v.resultVideoUrl,
                        inputImageUrl: v.inputImageUrl,
                        userId: v.userId,
                        createdAt: v.createdAt,
                    });
            }
            return res.status(200).set(corsHeaders()).send(JSON.stringify({ tasks }));
        }
        if (url.pathname === '/api/video/status' && req.method === 'GET') {
            const payload = await verifyBearer(req.headers['authorization']);
            const taskId = url.searchParams.get('taskId') || '';
            // 先查 OTS
            const row = await otsGetVideoTask(taskId);
            if (!row)
                return res.status(404).set(corsHeaders()).send(JSON.stringify({ error: 'Not Found' }));
            // 如果仍为 PENDING/RUNNING，尝试查询 DashScope 任务状态
            let status = row.status || 'PENDING';
            let resultVideoUrl = row.resultVideoUrl;
            if (status !== 'SUCCEEDED' && status !== 'FAILED') {
                try {
                    const r = await (0, node_fetch_1.default)(`https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`, { headers: { 'Authorization': `Bearer ${TONGYI_API_KEY}` } });
                    const txt = await r.text();
                    if (r.ok) {
                        const d = JSON.parse(txt);
                        const st = d.output?.task_status;
                        if (st) {
                            status = st;
                            if (st === 'SUCCEEDED' && d.output?.video_url) {
                                resultVideoUrl = d.output.video_url;
                                await otsPutVideoTask(taskId, { status: 'SUCCEEDED', resultVideoUrl, updatedAt: Date.now() });
                            }
                            else if (st === 'FAILED') {
                                await otsPutVideoTask(taskId, { status: 'FAILED', updatedAt: Date.now() });
                            }
                        }
                    }
                }
                catch { }
            }
            return res.status(200).set(corsHeaders()).send(JSON.stringify({
                taskId,
                status: status === 'SUCCEEDED' ? 'completed' : (status === 'FAILED' ? 'failed' : 'processing'),
                resultVideoUrl,
                inputImageUrl: row.inputImageUrl,
                userId: row.userId
            }));
        }
        return res.status(404).set(corsHeaders()).send(JSON.stringify({ error: 'Not Found' }));
    }
    catch (err) {
        return res.status(401).set(corsHeaders()).send(JSON.stringify({ error: 'Unauthorized', message: err?.message || 'Auth failed' }));
    }
};
