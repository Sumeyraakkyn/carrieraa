'use strict';
const prisma = require('../lib/prisma');

const getProgress = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch user courses
    const courses = await prisma.userCourse.findMany({ where: { userId } });
    
    // Fetch profile
    const profile = await prisma.profile.findUnique({ where: { userId } });

    let completionPercentage = 0;
    
    // Calculate simple completion based on profile fields and courses
    let points = 0;
    let totalPoints = 5; // 1 for basic profile, 1 for exp, 1 for edu, 1 for skills, 1 for taking any course

    if (profile) {
      if (profile.fullName && profile.city) points += 1;
      
      const experiences = typeof profile.experiences === 'string' ? JSON.parse(profile.experiences) : profile.experiences;
      if (Array.isArray(experiences) && experiences.length > 0) points += 1;

      const educations = typeof profile.educations === 'string' ? JSON.parse(profile.educations) : profile.educations;
      if (Array.isArray(educations) && educations.length > 0) points += 1;

      if (Array.isArray(profile.skills) && profile.skills.length > 0) points += 1;
    }

    if (courses.length > 0) points += 1;

    completionPercentage = Math.round((points / totalPoints) * 100);

    res.json({
      completionPercentage,
      completedCoursesCount: courses.length,
      hasPotentialScore: profile && profile.potentialScore ? true : false,
    });
  } catch (err) {
    console.error('getProgress:', err);
    res.status(500).json({ error: 'Sunucu hatasi!' });
  }
};

module.exports = { getProgress };
