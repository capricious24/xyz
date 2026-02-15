const http = require('http');
const fs = require('fs');
const path = require('path');
const { generateInterviewPack } = require('./src/questionEngine');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function serveStatic(res, filePath) {
  const resolvedPath = path.join(PUBLIC_DIR, filePath === '/' ? 'index.html' : filePath);
  if (!resolvedPath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(resolvedPath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    const extension = path.extname(resolvedPath);
    const contentTypes = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript'
    };

    res.writeHead(200, { 'Content-Type': contentTypes[extension] || 'text/plain' });
    res.end(data);
  });
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
      if (body.length > 2e6) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/api/generate-questions') {
    try {
      const body = await parseBody(req);
      const response = generateInterviewPack({
        resumeText: body.resumeText,
        desiredSkills: Array.isArray(body.desiredSkills) ? body.desiredSkills : [],
        role: body.role || 'Software Engineer'
      });
      sendJson(res, 200, response);
    } catch (error) {
      sendJson(res, 400, { error: error.message || 'Invalid request' });
    }
    return;
  }

  if (req.method === 'GET') {
    serveStatic(res, req.url === '/' ? '/' : req.url.replace(/^\//, ''));
    return;
  }

  res.writeHead(405);
  res.end('Method not allowed');
});

server.listen(PORT, () => {
  console.log(`AI interview platform running at http://localhost:${PORT}`);
});
