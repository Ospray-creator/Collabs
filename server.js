const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

const projects = [
  { id: 'demo-1', name: 'Kickoff planning', status: 'Open', updatedAt: new Date().toISOString() },
  { id: 'demo-2', name: 'Marketing sprint', status: 'In review', updatedAt: new Date().toISOString() }
];

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload, null, 2));
}

function serveStaticFile(res, requestedPath) {
  const safePath = requestedPath === '/' ? '/index.html' : requestedPath;
  const filePath = path.join(PUBLIC_DIR, safePath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not Found');
        return;
      }

      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Internal Server Error');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const type = mimeTypes[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': type });
    res.end(content);
  });
}

const server = http.createServer((req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET' && reqUrl.pathname === '/api/health') {
    sendJson(res, 200, { status: 'ok', message: 'Collabs is running', timestamp: new Date().toISOString() });
    return;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/projects') {
    sendJson(res, 200, { projects });
    return;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/projects') {
    let body = '';

    req.on('data', chunk => {
      body += chunk;
    });

    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const name = String(payload.name || '').trim();

        if (!name) {
          sendJson(res, 400, { error: 'Project name is required.' });
          return;
        }

        const project = {
          id: `project-${Date.now()}`,
          name,
          status: 'Open',
          updatedAt: new Date().toISOString()
        };

        projects.unshift(project);
        sendJson(res, 201, { project });
      } catch (error) {
        sendJson(res, 400, { error: 'Invalid request body.' });
      }
    });

    return;
  }

  serveStaticFile(res, reqUrl.pathname);
});

server.listen(PORT, () => {
  console.log(`Collabs server is listening on http://localhost:${PORT}`);
});
