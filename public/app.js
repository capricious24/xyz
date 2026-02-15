const generateBtn = document.getElementById('generateBtn');
const roleInput = document.getElementById('role');
const skillsInput = document.getElementById('skills');
const resumeInput = document.getElementById('resume');
const resultPanel = document.getElementById('resultPanel');
const meta = document.getElementById('meta');
const questions = document.getElementById('questions');

function renderMeta(label, values) {
  if (!values || values.length === 0) {
    return `<span class="meta-chip">${label}: None detected</span>`;
  }

  return values
    .map((value) => `<span class="meta-chip">${label}: ${value}</span>`)
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
      <span class="meta-chip">Role: ${data.role}</span>
      <span class="meta-chip">Experience level: ${data.level}</span>
      ${renderMeta('Skill', data.skills)}
      ${renderMeta('Keyword', data.keywords.slice(0, 6))}
    `;

    questions.innerHTML = data.questions
      .map((item) => `<li><strong>[${item.difficulty}]</strong> ${item.question}</li>`)
      .join('');

    resultPanel.classList.remove('hidden');
  } catch (error) {
    alert(error.message);
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = 'Generate Dynamic Questions';
  }
});
