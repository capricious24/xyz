const { generateWithOpenAI } = require('./aiClient');

const SKILL_PATTERNS = {
  JavaScript: /\b(js|javascript|node|es6|typescript)\b/gi,
  Python: /\bpython|pandas|numpy|fastapi|django|flask\b/gi,
  React: /\breact|next\.js|redux|hooks\b/gi,
  SQL: /\bsql|postgres|mysql|sqlite|query optimization\b/gi,
  DevOps: /\bdocker|kubernetes|ci\/cd|terraform|aws|azure|gcp\b/gi,
  Testing: /\bjest|cypress|playwright|unit test|integration test|tdd\b/gi,
  SystemDesign: /\bsystem design|microservices|scalability|distributed systems\b/gi,
  DataScience: /\bmachine learning|deep learning|nlp|classification|regression\b/gi
};

const PROFICIENCY_PATTERNS = {
  senior: /\b(lead|senior|architect|managed|mentored|owned)\b/i,
  mid: /\b(built|implemented|designed|optimized|deployed)\b/i,
  junior: /\b(learned|assisted|intern|course|academic)\b/i
};

function extractKeywords(text) {
  return [...new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9+#.\s]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 3)
  )].slice(0, 40);
}

function detectSkills(resumeText, desiredSkills = []) {
  const found = new Set();
  Object.entries(SKILL_PATTERNS).forEach(([skill, pattern]) => {
    if (pattern.test(resumeText)) {
      found.add(skill);
    }
    pattern.lastIndex = 0;
  });

  desiredSkills
    .map((skill) => skill.trim())
    .filter(Boolean)
    .forEach((skill) => found.add(skill));

  return [...found];
}

function estimateLevel(resumeText) {
  if (PROFICIENCY_PATTERNS.senior.test(resumeText)) return 'senior';
  if (PROFICIENCY_PATTERNS.mid.test(resumeText)) return 'mid';
  return 'junior';
}

function skillQuestionTemplates(level) {
  const bank = {
    junior: {
      opening: 'Explain the fundamentals of {{skill}} and where you used it in your projects.',
      scenario: 'You are assigned a bug in a {{skill}} feature. How would you debug it step by step?',
      depth: 'What common mistakes do beginners make in {{skill}}, and how do you avoid them?'
    },
    mid: {
      opening: 'Describe a production feature you built with {{skill}} and key trade-offs you made.',
      scenario: 'If a {{skill}} module starts slowing down under load, what is your optimization plan?',
      depth: 'How do you decide architecture boundaries when building with {{skill}}?'
    },
    senior: {
      opening: 'Walk through a high-impact system you led using {{skill}}, including measurable outcomes.',
      scenario: 'How would you redesign a critical {{skill}} workflow to scale 10x while reducing risk?',
      depth: 'What engineering standards and review practices do you enforce for {{skill}} initiatives?'
    }
  };

  return bank[level] || bank.mid;
}

function keywordQuestions(keywords) {
  return keywords.slice(0, 5).map((keyword, index) => ({
    type: 'keyword',
    difficulty: index < 2 ? 'medium' : 'easy',
    question: `Your resume mentions "${keyword}". Share a concrete project story where this keyword materially affected your decision-making.`
  }));
}

function buildFallbackPack({ resumeText, desiredSkills = [], role = 'Software Engineer' }) {
  const normalizedText = `${resumeText || ''}`.trim();
  if (!normalizedText) {
    return {
      role,
      level: 'unknown',
      skills: desiredSkills,
      keywords: [],
      mode: 'fallback',
      questions: [],
      rubric: []
    };
  }

  const level = estimateLevel(normalizedText);
  const skills = detectSkills(normalizedText, desiredSkills);
  const keywords = extractKeywords(normalizedText);
  const questions = [];

  skills.forEach((skill) => {
    const templates = skillQuestionTemplates(level);
    Object.entries(templates).forEach(([type, template]) => {
      questions.push({
        type,
        skill,
        difficulty: level,
        question: template.replace('{{skill}}', skill)
      });
    });
  });

  keywordQuestions(keywords).forEach((item) => questions.push(item));

  if (questions.length < 6) {
    questions.push(
      {
        type: 'behavioral',
        difficulty: 'medium',
        question: `Tell me about a time you disagreed with a technical decision for a ${role} role. What did you do?`
      },
      {
        type: 'problem-solving',
        difficulty: 'medium',
        question: 'Given an ambiguous requirement, how do you transform it into a deliverable engineering plan?'
      }
    );
  }

  return {
    role,
    level,
    skills,
    keywords,
    mode: 'fallback',
    rubric: [
      { category: 'Technical Depth', scoringGuide: '1-5 based on correctness and trade-off awareness.' },
      { category: 'Problem Solving', scoringGuide: '1-5 based on decomposition, debugging and prioritization.' },
      { category: 'Communication', scoringGuide: '1-5 based on clarity, structure and stakeholder alignment.' }
    ],
    questions: questions.slice(0, 18)
  };
}

function buildAiPrompt({ resumeText, desiredSkills, role, fallbackContext }) {
  return [
    'You are an expert technical interviewer assistant.',
    'Generate a strict JSON object only. No markdown, no code fences.',
    'Goal: produce personalized interview questions from a resume and skills.',
    'JSON schema:',
    '{',
    '  "role": string,',
    '  "level": "junior"|"mid"|"senior",',
    '  "skills": string[],',
    '  "keywords": string[],',
    '  "rubric": [{"category": string, "weight": number, "whatGoodLooksLike": string}],',
    '  "questions": [',
    '    {"type": "screening"|"technical"|"system"|"behavioral"|"follow-up", "skill": string, "difficulty": "easy"|"medium"|"hard", "question": string, "expectedSignals": string[]}',
    '  ]',
    '}',
    'Rules:',
    '- Return 10-14 questions.',
    '- At least 3 technical, 2 follow-up, 1 behavioral, 1 system-design (if relevant).',
    '- Questions must explicitly reference resume evidence and include scenario-based prompts.',
    '- Add rubric with categories and weights summing to 100.',
    '- Keep concise and interviewer-ready.',
    '',
    `Target role: ${role}`,
    `Desired skills: ${desiredSkills.join(', ') || 'none provided'}`,
    `Resume:\n${resumeText}`,
    `Fallback analysis context: ${JSON.stringify(fallbackContext)}`
  ].join('\n');
}

function safeJsonParse(text) {
  const maybeJson = text.trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  return JSON.parse(maybeJson);
}

function normalizeAiPack(pack, defaults) {
  return {
    role: pack.role || defaults.role,
    level: ['junior', 'mid', 'senior'].includes(pack.level) ? pack.level : defaults.level,
    skills: Array.isArray(pack.skills) ? pack.skills : defaults.skills,
    keywords: Array.isArray(pack.keywords) ? pack.keywords : defaults.keywords,
    rubric: Array.isArray(pack.rubric) ? pack.rubric : defaults.rubric,
    mode: 'ai',
    questions: Array.isArray(pack.questions) ? pack.questions.slice(0, 18) : defaults.questions
  };
}

async function generateInterviewPack({ resumeText, desiredSkills = [], role = 'Software Engineer', llmClient = generateWithOpenAI }) {
  const fallbackPack = buildFallbackPack({ resumeText, desiredSkills, role });

  if (!`${resumeText || ''}`.trim()) {
    return fallbackPack;
  }

  try {
    const prompt = buildAiPrompt({
      resumeText,
      desiredSkills,
      role,
      fallbackContext: {
        level: fallbackPack.level,
        skills: fallbackPack.skills,
        keywords: fallbackPack.keywords.slice(0, 12)
      }
    });
    const raw = await llmClient({ prompt, temperature: 0.2 });
    const parsed = safeJsonParse(raw);
    return normalizeAiPack(parsed, fallbackPack);
  } catch (error) {
    return {
      ...fallbackPack,
      fallbackReason: error.message
    };
  }
}

module.exports = {
  extractKeywords,
  detectSkills,
  estimateLevel,
  buildFallbackPack,
  generateInterviewPack
};
