const generateBtn = document.getElementById('generateBtn');
const roleInput = document.getElementById('role');
const skillsInput = document.getElementById('skills');
const resumeInput = document.getElementById('resume');
const resultPanel = document.getElementById('resultPanel');
const meta = document.getElementById('meta');
const rubric = document.getElementById('rubric');
const questions = document.getElementById('questions');

function renderMeta(label, values) {
  if (!values || values.length === 0) {
    return `<span class="meta-chip">${label}: None detected</span>`;
  }

  return values
    .map((value) => `<span class="meta-chip">${label}: ${value}</span>`)
    .join('');
}

function renderRubric(items = []) {
  if (!items.length) {
    return '<li>No rubric generated.</li>';
  }

  return items
    .map((item) => {
      const detail = item.whatGoodLooksLike || item.scoringGuide || 'No guidance provided.';
      const weight = item.weight ? ` (${item.weight}%)` : '';
      return `<li><strong>${item.category || 'General'}${weight}:</strong> ${detail}</li>`;
    })
    .join('');
}

generateBtn.addEventListener('click', async () => {
  const resumeText = resumeInput.value.trim();
  const desiredSkills = skillsInput.value.split(',').map((item) => item.trim()).filter(Boolean);
  const role = roleInput.value.trim() || 'Software Engineer';

  if (!resumeText) {
    alert('Please paste candidate resume text first.');
    return;
  }

  generateBtn.disabled = true;
  generateBtn.textContent = 'Generating...';

  try {
    const response = await fetch('/api/generate-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeText, desiredSkills, role })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Unable to generate interview questions.');
    }

    meta.innerHTML = `
      <span class="meta-chip">Generation mode: ${data.mode || 'unknown'}</span>
      <span class="meta-chip">Role: ${data.role}</span>
      <span class="meta-chip">Experience level: ${data.level}</span>
      ${renderMeta('Skill', data.skills)}
      ${renderMeta('Keyword', (data.keywords || []).slice(0, 6))}
    `;

    rubric.innerHTML = renderRubric(data.rubric || []);

    questions.innerHTML = (data.questions || [])
      .map((item) => {
        const signals = item.expectedSignals && item.expectedSignals.length
          ? `<div class="signals">Signals: ${item.expectedSignals.join(', ')}</div>`
          : '';
        return `<li><strong>[${item.difficulty || 'medium'}]</strong> ${item.question}${signals}</li>`;
      })
      .join('');

    resultPanel.classList.remove('hidden');
  } catch (error) {
    alert(error.message);
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = 'Generate Dynamic Questions';
  }
});
