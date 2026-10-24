'use strict';
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../lib/prisma');
const { sendPasswordResetEmail } = require('../lib/mailer');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

const register = async (req, res) => {
  try {
    const { username, password, email, isAdmin, adminSetupKey } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Kullanici adi ve sifre zorunludur!' });

    // Yönetici rolü istemci tarafından tek başına atanamaz. İlk kurulum için
    // sunucuda tanımlı bir anahtar gerekir; mevcut yöneticiler bu akıştan etkilenmez.
    if (isAdmin && (!process.env.ADMIN_SETUP_KEY || adminSetupKey !== process.env.ADMIN_SETUP_KEY)) {
      return res.status(403).json({ error: 'Yönetici hesabı oluşturma yetkiniz yok.' });
    }

    if (await prisma.user.findUnique({ where: { username } }))
      return res.status(400).json({ error: 'Bu kullanici adi zaten alinmis!' });

    const normalizedEmail = email?.trim().toLowerCase();
    if (!isAdmin && !normalizedEmail)
      return res.status(400).json({ error: 'E-posta adresi zorunludur.' });
    if (normalizedEmail && !/^\S+@\S+\.\S+$/.test(normalizedEmail))
      return res.status(400).json({ error: 'Gecerli bir e-posta adresi girin.' });
    if (normalizedEmail && await prisma.profile.findFirst({ where: { email: { equals: normalizedEmail, mode: 'insensitive' } } }))
      return res.status(400).json({ error: 'Bu e-posta adresi zaten kullaniliyor.' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        role: isAdmin ? 'ADMIN' : 'USER',
        ...(normalizedEmail ? { profile: { create: { email: normalizedEmail } } } : {}),
      },
    });
    res.status(201).json({ message: 'Kayit basarili!', user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    console.error('register:', err);
    res.status(500).json({ error: 'Sunucu hatasi!' });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Kullanici adi ve sifre zorunludur!' });

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(400).json({ error: 'Kullanici bulunamadi!' });

    if (!await bcrypt.compare(password, user.passwordHash))
      return res.status(400).json({ error: 'Gecersiz sifre!' });

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ message: 'Giris basarili!', token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    console.error('login:', err);
    res.status(500).json({ error: 'Sunucu hatasi!' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Gecerli bir e-posta adresi girin.' });

    // Hesap varlığını açıklamayız; bu sayede e-posta üzerinden kullanıcı keşfi engellenir.
    const profile = await prisma.profile.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      include: { user: true },
    });
    // Eski hesaplarda kullanıcı adı e-posta olabilir; geçiş döneminde bu da desteklenir.
    const user = profile?.user || await prisma.user.findFirst({ where: { username: { equals: email, mode: 'insensitive' } } });
    const successResponse = { message: 'Hesap mevcutsa doğrulama kodu e-posta adresinize gönderildi.' };
    if (!user) return res.json(successResponse);

    const code = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000);

    await prisma.passwordReset.updateMany({ where: { userId: user.id, used: false }, data: { used: true } });
    await prisma.passwordReset.create({ data: { userId: user.id, code: await bcrypt.hash(code, 10), expiresAt } });

    await sendPasswordResetEmail(email, code);

    res.json(successResponse);
  } catch (err) {
    console.error('forgotPassword:', err);
    res.status(500).json({ error: 'Sunucu hatasi.' });
  }
};

const verifyCode = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const { code } = req.body;
    if (!email || !code) return res.status(400).json({ error: 'E-posta ve kod zorunludur.' });

    const profile = await prisma.profile.findFirst({ where: { email: { equals: email, mode: 'insensitive' } }, include: { user: true } });
    const user = profile?.user || await prisma.user.findFirst({ where: { username: { equals: email, mode: 'insensitive' } } });
    if (!user) return res.status(400).json({ error: 'Gecersiz veya suresi dolmus kod.' });

    const reset = await prisma.passwordReset.findFirst({
      where: { userId: user.id, used: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!reset || !await bcrypt.compare(code, reset.code)) return res.status(400).json({ error: 'Gecersiz veya suresi dolmus kod.' });

    const resetToken = jwt.sign({ userId: user.id, resetId: reset.id }, JWT_SECRET, { expiresIn: '10m' });
    res.json({ message: 'Kod dogrulandi.', resetToken });
  } catch (err) {
    console.error('verifyCode:', err);
    res.status(500).json({ error: 'Sunucu hatasi.' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) return res.status(400).json({ error: 'Token ve yeni sifre zorunludur.' });
    if (newPassword.length < 8) return res.status(400).json({ error: 'Sifre en az 8 karakter olmalidir.' });

    let payload;
    try { payload = jwt.verify(resetToken, JWT_SECRET); }
    catch { return res.status(400).json({ error: 'Gecersiz veya suresi dolmus token.' }); }

    const reset = await prisma.passwordReset.findUnique({ where: { id: payload.resetId } });
    if (!reset || reset.used || reset.userId !== payload.userId || reset.expiresAt <= new Date()) return res.status(400).json({ error: 'Bu token gecersiz veya suresi dolmus.' });

    await prisma.user.update({ where: { id: payload.userId }, data: { passwordHash: await bcrypt.hash(newPassword, 10) } });
    await prisma.passwordReset.update({ where: { id: payload.resetId }, data: { used: true } });

    res.json({ message: 'Sifreniz basariyla guncellendi.' });
  } catch (err) {
    console.error('resetPassword:', err);
    res.status(500).json({ error: 'Sunucu hatasi.' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Mevcut ve yeni sifre zorunludur!' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'Yeni sifre en az 6 karakter olmalidir!' });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!await bcrypt.compare(currentPassword, user.passwordHash))
      return res.status(400).json({ error: 'Mevcut sifreniz yanlis!' });

    await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash: await bcrypt.hash(newPassword, 10) } });
    res.json({ message: 'Sifreniz basariyla guncellendi!' });
  } catch (err) {
    console.error('changePassword:', err);
    res.status(500).json({ error: 'Sunucu hatasi!' });
  }
};

const getMe = async (req, res) => {
  try {
    // authMiddleware zaten token'ı doğruladı ve req.user'ı doldurdu
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, username: true, role: true }
    });
    if (!user) return res.status(404).json({ error: 'Kullanici bulunamadi.' });
    res.json(user);
  } catch (err) {
    console.error('getMe:', err);
    res.status(500).json({ error: 'Sunucu hatasi.' });
  }
};

module.exports = { register, login, forgotPassword, verifyCode, resetPassword, changePassword, getMe };
