const test = require('node:test');
const assert = require('node:assert/strict');
const { detectSkills, estimateLevel, generateInterviewPack, buildFallbackPack } = require('../src/questionEngine');

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

test('buildFallbackPack returns deterministic fallback with rubric', () => {
  const result = buildFallbackPack({
    resumeText: 'Implemented Docker CI/CD with Python APIs and system design for microservices.',
    desiredSkills: ['Communication'],
    role: 'Platform Engineer'
  });

  assert.equal(result.mode, 'fallback');
  assert.equal(result.skills.includes('DevOps'), true);
  assert.equal(result.skills.includes('Communication'), true);
  assert.equal(result.rubric.length >= 3, true);
  assert.equal(result.questions.length >= 6, true);
});

test('generateInterviewPack uses AI output when LLM client succeeds', async () => {
  const mockLlmClient = async () => JSON.stringify({
    role: 'Platform Engineer',
    level: 'senior',
    skills: ['Kubernetes', 'Node.js'],
    keywords: ['migration', 'scaling'],
    rubric: [
      { category: 'Technical Depth', weight: 40, whatGoodLooksLike: 'Strong system-level tradeoffs.' },
      { category: 'Execution', weight: 30, whatGoodLooksLike: 'Pragmatic delivery with quality.' },
      { category: 'Communication', weight: 30, whatGoodLooksLike: 'Clear stakeholder updates.' }
    ],
    questions: [
      {
        type: 'technical',
        skill: 'Kubernetes',
        difficulty: 'hard',
        question: 'How did you scale your Kubernetes workloads during traffic spikes?',
        expectedSignals: ['autoscaling', 'cost/perf tradeoff']
      }
    ]
  });

  const result = await generateInterviewPack({
    resumeText: 'Led migration to k8s and improved reliability.',
    desiredSkills: ['System Design'],
    role: 'Platform Engineer',
    llmClient: mockLlmClient
  });

  assert.equal(result.mode, 'ai');
  assert.equal(result.level, 'senior');
  assert.equal(result.questions[0].type, 'technical');
  assert.equal(result.rubric.length, 3);
});

test('generateInterviewPack falls back when LLM client fails', async () => {
  const failingLlmClient = async () => {
    throw new Error('simulated provider failure');
  };

  const result = await generateInterviewPack({
    resumeText: 'Built React and SQL services, led architecture decisions.',
    desiredSkills: ['Communication'],
    role: 'Backend Engineer',
    llmClient: failingLlmClient
  });

  assert.equal(result.mode, 'fallback');
  assert.equal(result.fallbackReason.includes('simulated provider failure'), true);
  assert.equal(result.questions.length >= 6, true);
});
