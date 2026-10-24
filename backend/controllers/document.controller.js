'use strict';
const path = require('path');
const prisma = require('../lib/prisma');
const { analyzeCv } = require('../lib/cv-analyzer');

const uploadDocument = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Lutfen bir dosya secin!' });

    const doc = await prisma.document.create({
      data: {
        userId: req.user.id,
        type: req.body.type || 'CERTIFICATE',
        fileName: req.file.originalname,
        fileUrl: `/uploads/${req.file.filename}`,
      },
    });

    // CV yüklemesinde analizi asenkron tetikle — kullanıcı yanıtı beklemez
    if (doc.type === 'CV') {
      const fullFilePath = path.join(__dirname, '..', 'uploads', req.file.filename);
      analyzeCv(doc.id, fullFilePath, req.user.id)
        .catch(err => console.error('[document.controller] CV analiz tetikleme hatasi:', err));
    }

    res.status(201).json({ message: 'Dosya basariyla yuklendi!', document: doc });
  } catch (err) {
    console.error('uploadDocument:', err);
    res.status(500).json({ error: err.message || 'Sunucu hatasi!' });
  }
};

const getMyDocuments = async (req, res) => {
  try {
    const docs = await prisma.document.findMany({
      where: { userId: req.user.id, type: { notIn: ['AVATAR', 'BANNER'] } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(docs);
  } catch (err) {
    console.error('getMyDocuments:', err);
    res.status(500).json({ error: 'Sunucu hatasi!' });
  }
};

// Yeni analiz kuralları yayımlandığında kullanıcının mevcut CV'sini tekrar işler.
const reanalyzeCv = async (req, res) => {
  try {
    const documentId = Number(req.params.documentId);
    const doc = await prisma.document.findFirst({ where: { id: documentId, userId: req.user.id, type: 'CV' } });
    if (!doc) return res.status(404).json({ error: 'CV bulunamadı.' });

    const fileName = path.basename(doc.fileUrl);
    const fullFilePath = path.join(__dirname, '..', 'uploads', fileName);
    const analysis = await analyzeCv(doc.id, fullFilePath, req.user.id);
    if (!analysis) return res.status(422).json({ error: 'CV metni okunamadı. Metin seçilebilir PDF veya DOCX yüklemeyi deneyin.' });

    res.json({ message: 'CV yeniden analiz edildi.', analysis });
  } catch (err) {
    console.error('reanalyzeCv:', err);
    res.status(500).json({ error: 'CV yeniden analiz edilirken hata oluştu.' });
  }
};

module.exports = { uploadDocument, getMyDocuments, reanalyzeCv };
