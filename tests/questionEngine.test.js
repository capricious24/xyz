const test = require('node:test');
const assert = require('node:assert/strict');
const { detectSkills, estimateLevel, generateInterviewPack } = require('../src/questionEngine');

test('detectSkills identifies known skills and merges desired skills', () => {
  const resume = 'Built React dashboards with JavaScript and optimized SQL queries.';
  const skills = detectSkills(resume, ['GraphQL']);
  assert.equal(skills.includes('React'), true);
  assert.equal(skills.includes('JavaScript'), true);
  assert.equal(skills.includes('SQL'), true);
  assert.equal(skills.includes('GraphQL'), true);
});

test('estimateLevel categorizes senior language', () => {
  const level = estimateLevel('Led architecture reviews and mentored 8 engineers.');
  assert.equal(level, 'senior');
});

test('generateInterviewPack returns dynamic questions', () => {
  const result = generateInterviewPack({
    resumeText: 'Implemented Docker CI/CD with Python APIs and system design for microservices.',
    desiredSkills: ['Communication'],
    role: 'Platform Engineer'
  });

  assert.equal(result.role, 'Platform Engineer');
  assert.equal(result.skills.includes('DevOps'), true);
  assert.equal(result.skills.includes('Communication'), true);
  assert.equal(result.questions.length >= 6, true);
});
