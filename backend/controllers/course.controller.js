'use strict';
const prisma = require('../lib/prisma');

const completeCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    if (!courseId) return res.status(400).json({ error: 'courseId zorunludur!' });

    await prisma.course.upsert({
      where: { id: courseId },
      update: {},
      create: { id: courseId, category: 'Genel', name: courseId },
    });

    const completed = await prisma.userCourse.create({
      data: { userId: req.user.id, courseId },
    });
    res.status(201).json({ message: 'Kurs basariyla tamamlandi!', completedCourse: completed });
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ error: 'Bu kursu zaten tamamladiniz!' });
    console.error('completeCourse:', err);
    res.status(500).json({ error: 'Sunucu hatasi!' });
  }
};

const getMyCourses = async (req, res) => {
  try {
    const courses = await prisma.userCourse.findMany({
      where: { userId: req.user.id },
      orderBy: { completedAt: 'desc' },
    });
    res.json(courses);
  } catch (err) {
    console.error('getMyCourses:', err);
    res.status(500).json({ error: 'Sunucu hatasi!' });
  }
};

const uncompleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.userCourse.deleteMany({
      where: { userId: req.user.id, courseId: id }
    });
    res.json({ message: 'Kurs tamamlama geri alindi.' });
  } catch (err) {
    console.error('uncompleteCourse:', err);
    res.status(500).json({ error: 'Sunucu hatasi!' });
  }
};

module.exports = { completeCourse, getMyCourses, uncompleteCourse };
