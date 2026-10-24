'use strict';
const prisma = require('../lib/prisma');

const getProfile = async (req, res) => {
  try {
    const profile = await prisma.profile.findUnique({ where: { userId: req.user.id } });
    res.json(profile || {});
  } catch (err) {
    console.error('getProfile:', err);
    res.status(500).json({ error: 'Sunucu hatasi!' });
  }
};

const saveProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fullName, email, phone, birthDate, city, linkedin, careerGoal, skills, experiences, educations, languages, projects, certificates, avatarUrl, bannerUrl } = req.body;

    const profile = await prisma.profile.upsert({
      where: { userId },
      update: {
        fullName, email, phone, birthDate, city, linkedin, careerGoal,
        skills: skills || [],
        experiences: experiences || [],
        educations: educations || [],
        languages: languages || [],
        projects: projects || [],
        certificates: certificates || [],
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(bannerUrl !== undefined && { bannerUrl }),
      },
      create: {
        userId, fullName, email, phone, birthDate, city, linkedin, careerGoal,
        skills: skills || [],
        experiences: experiences || [],
        educations: educations || [],
        languages: languages || [],
        projects: projects || [],
        certificates: certificates || [],
        avatarUrl, bannerUrl,
      },
    });
    res.json({ message: 'Profil basariyla kaydedildi!', profile });
  } catch (err) {
    console.error('saveProfile:', err);
    res.status(500).json({ error: 'Sunucu hatasi!' });
  }
};

const saveCvBuilder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fullName, email, phone, birthDate, city, linkedin, careerGoal, skills, experiences, educations, languages, projects, certificates } = req.body;
    const profileData = {
      fullName, email, phone, birthDate, city, linkedin, careerGoal,
      skills: skills || [],
      experiences: experiences || [],
      educations: educations || [],
      languages: languages || [],
      projects: projects || [],
      certificates: certificates || [],
    };

    const result = await prisma.$transaction(async (tx) => {
      const profile = await tx.profile.upsert({
        where: { userId },
        update: profileData,
        create: { userId, ...profileData },
      });
      const existingDocument = await tx.document.findFirst({
        where: { userId, type: 'CV_FORM' },
        orderBy: { createdAt: 'desc' },
      });
      const document = existingDocument
        ? await tx.document.update({
            where: { id: existingDocument.id },
            data: { fileName: `Form CV - ${fullName || 'İsimsiz'}`, fileUrl: '', status: 'pending', createdAt: new Date() },
          })
        : await tx.document.create({
            data: { userId, type: 'CV_FORM', fileName: `Form CV - ${fullName || 'İsimsiz'}`, fileUrl: '', status: 'pending' },
          });
      return { profile, document };
    });

    res.json({ message: 'CV basariyla olusturuldu!', ...result });
  } catch (err) {
    console.error('saveCvBuilder:', err);
    res.status(500).json({ error: 'Sunucu hatasi!' });
  }
};

const savePotentialScore = async (req, res) => {
  try {
    const userId = req.user.id;
    const { scores } = req.body;
    const profile = await prisma.profile.upsert({
      where: { userId },
      update: { potentialScore: scores },
      create: { userId, potentialScore: scores }
    });
    res.json({ message: 'Potansiyel skorlari kaydedildi!', profile });
  } catch (err) {
    console.error('savePotentialScore:', err);
    res.status(500).json({ error: 'Sunucu hatasi!' });
  }
};

const updateAvatar = async (req, res) => {
  try {
    const userId = req.user.id;
    const { avatarUrl } = req.body;
    const profile = await prisma.profile.upsert({
      where: { userId },
      update: { avatarUrl },
      create: { userId, avatarUrl }
    });
    res.json({ message: 'Profil fotografi guncellendi!', profile });
  } catch (err) {
    console.error('updateAvatar:', err);
    res.status(500).json({ error: 'Sunucu hatasi!' });
  }
};

module.exports = { getProfile, saveProfile, saveCvBuilder, savePotentialScore, updateAvatar };
