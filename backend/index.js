'use strict';
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();
const server = http.createServer(app);

// ─── Socket.io kurulumu ───────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? [process.env.FRONTEND_URL || 'https://your-app.vercel.app']
      : true,
    credentials: true,
  },
});

// userId → socketId eşleşmesini tut (birden fazla sekme için Set kullan)
const userSockets = new Map(); // userId (string) → Set<socketId>

io.on('connection', (socket) => {
  // Client bağlandığında userId'sini gönderir
  socket.on('register', (userId) => {
    const key = String(userId);
    if (!userSockets.has(key)) userSockets.set(key, new Set());
    userSockets.get(key).add(socket.id);
    socket.join(`user:${key}`);
    console.log(`[socket] Kullanıcı ${key} bağlandı (socketId=${socket.id})`);
  });

  socket.on('disconnect', () => {
    // Tüm kullanıcılardan bu socket'i temizle
    for (const [uid, sids] of userSockets.entries()) {
      if (sids.has(socket.id)) {
        sids.delete(socket.id);
        if (sids.size === 0) userSockets.delete(uid);
        console.log(`[socket] Kullanıcı ${uid} bağlantısı kesildi (socketId=${socket.id})`);
        break;
      }
    }
  });
});

/**
 * Belirli bir kullanıcıya gerçek zamanlı bildirim gönderir.
 * Kullanıcı çevrimiçi değilse sessizce geçer (bildirim DB'de zaten var).
 * @param {number|string} userId
 * @param {{ id: number, title: string, message: string, read: boolean, createdAt: string }} notification
 */
function emitNotification(userId, notification) {
  io.to(`user:${String(userId)}`).emit('notification', notification);
}

// io ve emitNotification'ı diğer modüllere açıyoruz
app.set('io', io);
app.set('emitNotification', emitNotification);

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL || 'https://your-app.vercel.app']
    : true,
  credentials: true,
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Rate Limiting ────────────────────────────────────────────────────────────

// Genel API limiti: 15 dakikada 200 istek
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Çok fazla istek gönderildi. Lütfen 15 dakika sonra tekrar deneyin.' },
});

// Auth limiti: 15 dakikada 20 istek (brute force koruması)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Çok fazla giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin.' },
  skipSuccessfulRequests: true, // Başarılı istekleri saymaz
});

// Dosya yükleme limiti: 1 saatte 10 yükleme
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Saatlik dosya yükleme limitine ulaştınız. 1 saat sonra tekrar deneyin.' },
});

app.use('/api/', generalLimiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',          authLimiter, require('./routes/auth.routes'));
app.use('/api/users',         require('./routes/user.routes'));
app.use('/api/profile',       require('./routes/profile.routes'));
app.use('/api/evaluations',   require('./routes/evaluation.routes'));
app.use('/api/courses',       require('./routes/course.routes'));
app.use('/api/upload',        uploadLimiter, require('./routes/document.routes'));
app.use('/api/documents',     require('./routes/document.routes'));
app.use('/api/progress',      require('./routes/progress.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/rewards',       require('./routes/reward.routes'));
app.use('/api/admin',         require('./routes/admin.routes'));
app.use('/api/ai',            require('./routes/ai.routes'));
app.use('/api/python-ai',     require('./routes/python_ai.routes'));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/test', async (req, res) => {
  try {
    const prisma = require('./lib/prisma');
    const count = await prisma.user.count();
    res.json({ message: 'Backend API calisiyor!', databaseUserCount: count });
  } catch (err) {
    res.status(500).json({ message: 'Veritabanina baglanılamadı!', error: err.message });
  }
});

app.get('/', (req, res) => {
  res.json({ message: 'Carriera API', version: '2.0.0' });
});

// ─── Haftalık YZ Özeti Cron Job ───────────────────────────────────────────────
const cron = require('node-cron');
const prisma = require('./lib/prisma');

// Her Pazartesi sabah 09:00'da çalışır
cron.schedule('0 9 * * 1', async () => {
  console.log('[cron] Haftalık YZ özeti bildirimleri gönderiliyor...');
  try {
    const { analyzeUserForCron } = require('./lib/weekly-digest');
    await analyzeUserForCron(prisma, app.get('emitNotification'));
    console.log('[cron] Haftalık özetler gönderildi.');
  } catch (err) {
    console.error('[cron] Haftalık özet hatası:', err.message);
  }
}, { timezone: 'Europe/Istanbul' });

// ─── Sunucu başlat ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Sunucu http://localhost:${PORT} portunda calisiyor.`));
