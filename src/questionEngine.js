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

function generateInterviewPack({ resumeText, desiredSkills = [], role = 'Software Engineer' }) {
  const normalizedText = `${resumeText || ''}`.trim();
  if (!normalizedText) {
    return {
      role,
      level: 'unknown',
      skills: desiredSkills,
      keywords: [],
      questions: []
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
        question: `Given an ambiguous requirement, how do you transform it into a deliverable engineering plan?`
      }
    );
  }

  return {
    role,
    level,
    skills,
    keywords,
    questions: questions.slice(0, 18)
  };
}

module.exports = {
  extractKeywords,
  detectSkills,
  estimateLevel,
  generateInterviewPack
};
