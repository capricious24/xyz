const https = require('https');

const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

function postJson({ hostname, path, apiKey, payload }) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const req = https.request(
      {
        hostname,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          Authorization: `Bearer ${apiKey}`
        }
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => {
          raw += chunk.toString();
        });
        res.on('end', () => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            reject(new Error(`LLM API error ${res.statusCode}: ${raw.slice(0, 300)}`));
            return;
          }

          try {
            resolve(JSON.parse(raw));
          } catch (error) {
            reject(new Error(`Failed to parse LLM response: ${error.message}`));
          }
        });
      }
    );

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function generateWithOpenAI({ prompt, temperature = 0.3, model = DEFAULT_MODEL }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const response = await postJson({
    hostname: 'api.openai.com',
    path: '/v1/responses',
    apiKey,
    payload: {
      model,
      temperature,
      input: [
        {
          role: 'user',
          content: [{ type: 'text', text: prompt }]
        }
      ]
    }
  });

  const text = response.output_text;
  if (!text) {
    throw new Error('LLM returned empty output_text');
  }

  return text;
}

module.exports = {
  generateWithOpenAI
};
