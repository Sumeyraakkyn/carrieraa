'use strict';

/**
 * CV Analyzer — Özellik Tabanlı Testler (Property-Based Tests)
 * Kütüphane: fast-check
 *
 * Çalıştırmak için:
 *   node backend/tests/cv-analyzer.test.js
 */

const fc = require('fast-check');
const {
  extractSkills,
  calculateAlignmentScore,
  generateSkillGap,
  TECHNICAL_SKILLS,
  LANGUAGE_SKILLS,
  CERTIFICATE_KEYWORDS,
  CAREER_SKILL_MAP,
} = require('../lib/cv-analyzer');

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ ${name}`);
    console.error(`     ${err.message}`);
    failed++;
  }
}

// ─── Özellik 1: Beceri tespiti tutarlılığı ───────────────────────────────────
// extractSkills() yalnızca metinde gerçekten geçen becerileri döndürmeli
console.log('\n📋 Özellik 1: Beceri tespiti tutarlılığı');
runTest('Feature: ai-features, Property 1: Beceri tespiti tutarlılığı', () => {
  fc.assert(
    fc.property(fc.string({ minLength: 0, maxLength: 2000 }), (text) => {
      const skills = extractSkills(text);
      const lowerText = text.toLowerCase();
      const allSkills = [
        ...(skills.technical || []),
        ...(skills.languages || []),
        ...(skills.certificates || []),
      ];
      // Her tespit edilen beceri metinde gerçekten geçmeli
      return allSkills.every(skill => lowerText.includes(skill.toLowerCase()));
    }),
    { numRuns: 100, verbose: false }
  );
});

// ─── Özellik 2: Uyum skoru aralık değişmezi ──────────────────────────────────
// calculateAlignmentScore() her zaman [0, 100] arasında tam sayı döndürmeli
console.log('\n📋 Özellik 2: Uyum skoru aralık değişmezi');
runTest('Feature: ai-features, Property 2: Uyum skoru aralık değişmezi', () => {
  const careerGoals = Object.keys(CAREER_SKILL_MAP);
  fc.assert(
    fc.property(
      fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 0, maxLength: 20 }),
      fc.constantFrom(...careerGoals),
      (skillList, careerGoal) => {
        const detectedSkills = { technical: skillList, languages: [], certificates: [] };
        const score = calculateAlignmentScore(detectedSkills, careerGoal);
        return (
          typeof score === 'number' &&
          Number.isInteger(score) &&
          score >= 0 &&
          score <= 100
        );
      }
    ),
    { numRuns: 100, verbose: false }
  );
});

// Kariyer hedefi tanımlı değilse 0 döndürmeli
runTest('Kariyer hedefi tanımlı değilse skor 0 olmalı', () => {
  fc.assert(
    fc.property(
      fc.array(fc.string(), { minLength: 0, maxLength: 10 }),
      (skillList) => {
        const detectedSkills = { technical: skillList, languages: [], certificates: [] };
        return calculateAlignmentScore(detectedSkills, null) === 0 &&
               calculateAlignmentScore(detectedSkills, undefined) === 0 &&
               calculateAlignmentScore(detectedSkills, 'Bilinmeyen Hedef') === 0;
      }
    ),
    { numRuns: 50, verbose: false }
  );
});

// ─── Özellik 3: Skill_Gap küme farkı doğruluğu ───────────────────────────────
// generateSkillGap() sonucu:
//   (a) kariyer hedefi için gerekli becerilerin alt kümesi olmalı
//   (b) tespit edilen becerilerden hiçbirini içermemeli
console.log('\n📋 Özellik 3: Skill_Gap küme farkı doğruluğu');
runTest('Feature: ai-features, Property 3: Skill_Gap küme farkı doğruluğu', () => {
  const careerGoals = Object.keys(CAREER_SKILL_MAP);
  fc.assert(
    fc.property(
      fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 0, maxLength: 20 }),
      fc.constantFrom(...careerGoals),
      (detectedList, careerGoal) => {
        const detectedSkills = { technical: detectedList, languages: [], certificates: [] };
        const gap = generateSkillGap(detectedSkills, careerGoal);
        const required = CAREER_SKILL_MAP[careerGoal] || [];
        const detectedLower = detectedList.map(s => s.toLowerCase());

        // (a) gap yalnızca gerekli becerilerden oluşmalı
        const isSubset = gap.every(g => required.includes(g));
        // (b) gap tespit edilen becerileri içermemeli
        const noOverlap = gap.every(g => !detectedLower.includes(g.toLowerCase()));

        return isSubset && noOverlap;
      }
    ),
    { numRuns: 100, verbose: false }
  );
});

// Kariyer hedefi tanımlı değilse boş dizi döndürmeli
runTest('Kariyer hedefi tanımlı değilse gap boş dizi olmalı', () => {
  fc.assert(
    fc.property(
      fc.array(fc.string(), { minLength: 0, maxLength: 10 }),
      (skillList) => {
        const detectedSkills = { technical: skillList, languages: [], certificates: [] };
        const gap1 = generateSkillGap(detectedSkills, null);
        const gap2 = generateSkillGap(detectedSkills, undefined);
        const gap3 = generateSkillGap(detectedSkills, 'Bilinmeyen');
        return Array.isArray(gap1) && gap1.length === 0 &&
               Array.isArray(gap2) && gap2.length === 0 &&
               Array.isArray(gap3) && gap3.length === 0;
      }
    ),
    { numRuns: 50, verbose: false }
  );
});

// ─── Özellik 4: Tam eşleşme → maksimum skor ──────────────────────────────────
console.log('\n📋 Özellik 4: Tam eşleşme senaryoları');
runTest('Tüm gerekli beceriler eşleşince skor >= 95 olmalı (sertifika bonusu dahil)', () => {
  const careerGoals = Object.keys(CAREER_SKILL_MAP);
  careerGoals.forEach(goal => {
    const required = CAREER_SKILL_MAP[goal];
    const detectedSkills = { technical: required, languages: [], certificates: [] };
    const score = calculateAlignmentScore(detectedSkills, goal);
    if (score < 95) {
      throw new Error(`${goal} için tam eşleşmede skor ${score} (beklenen >= 95)`);
    }
  });
});

runTest('Hiç eşleşme yoksa skor 0 olmalı', () => {
  const careerGoals = Object.keys(CAREER_SKILL_MAP);
  careerGoals.forEach(goal => {
    const detectedSkills = { technical: [], languages: [], certificates: [] };
    const score = calculateAlignmentScore(detectedSkills, goal);
    if (score !== 0) {
      throw new Error(`${goal} için boş beceri listesinde skor ${score} (beklenen 0)`);
    }
  });
});

// ─── Özellik 5: Yalnızca CV tipi analiz edilir (birim test) ──────────────────
console.log('\n📋 Özellik 5: extractSkills boş metin güvenliği');
runTest('Feature: ai-features, Property 5: Boş metin için boş beceri listesi döner', () => {
  const result = extractSkills('');
  if (!Array.isArray(result.technical) || result.technical.length !== 0) {
    throw new Error('Boş metin için technical boş dizi olmalı');
  }
  if (!Array.isArray(result.languages) || result.languages.length !== 0) {
    throw new Error('Boş metin için languages boş dizi olmalı');
  }
  if (!Array.isArray(result.certificates) || result.certificates.length !== 0) {
    throw new Error('Boş metin için certificates boş dizi olmalı');
  }
});

// ─── Özellik 6: Sertifika bonusu doğruluğu ───────────────────────────────────
console.log('\n📋 Özellik 6: Sertifika bonusu');
runTest('Feature: ai-features, Property 6: Sertifika bonusu skoru 100 ile sınırlandırır', () => {
  fc.assert(
    fc.property(
      fc.constantFrom(...Object.keys(CAREER_SKILL_MAP)),
      (careerGoal) => {
        const required = CAREER_SKILL_MAP[careerGoal];
        // Tüm gerekli beceriler + sertifika → bonus uygulanmalı ama 100'ü geçmemeli
        const detectedSkills = {
          technical: required,
          languages: [],
          certificates: ['aws certified', 'pmp'],
        };
        const score = calculateAlignmentScore(detectedSkills, careerGoal);
        return score >= 0 && score <= 100;
      }
    ),
    { numRuns: 50, verbose: false }
  );
});

// ─── Sonuç ────────────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(50));
console.log(`Toplam: ${passed + failed} test | ✅ ${passed} geçti | ❌ ${failed} başarısız`);
console.log('─'.repeat(50));

if (failed > 0) {
  process.exit(1);
}
