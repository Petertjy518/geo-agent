/**
 * GEO Agent Server - Professional SaaS
 * API Keys configured server-side via environment variables
 * Users never see or configure API keys
 */

const express = require('express');
const cors = require('cors');
const { runDiagnosis } = require('./diagnosis');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// 1. Middleware
// ============================================
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('dist'));

// ============================================
// 2. Server-side API Key Configuration
// ============================================
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

if (!DEEPSEEK_API_KEY) {
  console.warn('⚠️  WARNING: DEEPSEEK_API_KEY not set in environment variables.');
  console.warn('   Set it in Render Dashboard → Environment → Add Environment Variable');
  console.warn('   Key: DEEPSEEK_API_KEY, Value: your-deepseek-api-key');
}

// ============================================
// 3. In-memory usage tracking (per IP, daily reset)
// ============================================
const usageTracker = new Map(); // ip -> { count, date }
const FREE_DAILY_LIMIT = 3;

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() 
    || req.headers['x-real-ip'] 
    || req.socket.remoteAddress 
    || 'unknown';
}

function getUsage(ip) {
  const today = new Date().toDateString();
  const record = usageTracker.get(ip);
  if (!record || record.date !== today) {
    usageTracker.set(ip, { count: 0, date: today });
    return { count: 0, date: today, remaining: FREE_DAILY_LIMIT };
  }
  return { ...record, remaining: Math.max(0, FREE_DAILY_LIMIT - record.count) };
}

function incrementUsage(ip) {
  const today = new Date().toDateString();
  const record = usageTracker.get(ip);
  if (!record || record.date !== today) {
    usageTracker.set(ip, { count: 1, date: today });
  } else {
    record.count += 1;
  }
}

// ============================================
// 4. API Routes
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    version: '2.0.0',
    apiConfigured: !!DEEPSEEK_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// Get user's remaining free quota
app.get('/api/quota', (req, res) => {
  const ip = getClientIp(req);
  const usage = getUsage(ip);
  res.json({
    dailyLimit: FREE_DAILY_LIMIT,
    used: usage.count,
    remaining: usage.remaining,
    resetAt: '次日零点',
  });
});

// Run diagnosis (server handles API key, user just provides brand info)
app.post('/api/diagnose', async (req, res) => {
  const ip = getClientIp(req);
  
  // Check if API key is configured
  if (!DEEPSEEK_API_KEY) {
    return res.status(503).json({
      error: '服务配置中',
      message: '诊断服务正在配置中，请稍后再试。',
    });
  }

  // Check quota
  const usage = getUsage(ip);
  if (usage.remaining <= 0) {
    return res.status(429).json({
      error: '额度已用完',
      message: `您今日的免费诊断额度（${FREE_DAILY_LIMIT}次）已用完。如需更多额度，请联系管理员。`,
      dailyLimit: FREE_DAILY_LIMIT,
      used: usage.count,
    });
  }

  const { brandInfo } = req.body;
  if (!brandInfo || !brandInfo.brandName || !brandInfo.industry) {
    return res.status(400).json({ error: '请提供品牌名称和行业信息' });
  }

  const taskId = `GEO-${Date.now()}-${uuidv4().slice(0, 8)}`;
  
  // Set SSE headers for real-time progress
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  let completed = false;

  const onProgress = (update) => {
    if (completed) return;
    res.write(`data: ${JSON.stringify(update)}\n\n`);
    if (update.status === 'completed' || update.status === 'error') {
      completed = true;
      incrementUsage(ip);
      res.end();
    }
  };

  try {
    await runDiagnosis(taskId, brandInfo, { deepseek: DEEPSEEK_API_KEY }, onProgress);
  } catch (error) {
    console.error('Diagnosis error:', error);
    if (!completed) {
      onProgress({
        status: 'error',
        progress: 0,
        message: `诊断出错: ${error.message}`,
      });
    }
  }
});

// Admin: get usage stats (simple password protection)
app.get('/api/admin/stats', (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const stats = Array.from(usageTracker.entries()).map(([ip, data]) => ({
    ip: ip.slice(0, 7) + '...', // Mask IP for privacy
    count: data.count,
    date: data.date,
  }));
  
  res.json({
    totalRequests: stats.reduce((s, r) => s + r.count, 0),
    uniqueUsers: stats.length,
    dailyLimit: FREE_DAILY_LIMIT,
    records: stats,
  });
});

// ============================================
// 5. Serve SPA (React Router fallback)
// ============================================
app.get('*', (req, res) => {
  res.sendFile('dist/index.html', { root: '.' });
});

// ============================================
// 6. Start Server
// ============================================
app.listen(PORT, () => {
  console.log(`\n🚀 GEO Agent Server v2.0.0 running on port ${PORT}`);
  console.log(`   API Key configured: ${DEEPSEEK_API_KEY ? '✅ Yes' : '❌ No (set DEEPSEEK_API_KEY env var)'}`);
  console.log(`   Free daily limit: ${FREE_DAILY_LIMIT} diagnoses per IP`);
  console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
});
