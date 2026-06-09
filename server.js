// AutoReply Pro — Local AI Server
// Run: node server.js
// Then open http://localhost:3000 in your browser

const http = require('http');
const fs = require('fs');
const path = require('path');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const PORT = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {

  // CORS headers — allow the browser to talk to this server
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204); res.end(); return;
  }

  // Serve landing page at /
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    const file = path.join(__dirname, 'index.html');
    if (fs.existsSync(file)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(fs.readFileSync(file));
    } else {
      res.writeHead(404); res.end('index.html not found');
    }
    return;
  }

  // Serve privacy policy
  if (req.method === 'GET' && req.url === '/privacy') {
    const file = require('path').join(__dirname, 'privacy.html');
    if (require('fs').existsSync(file)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(require('fs').readFileSync(file));
    } else { res.writeHead(404); res.end('Not found'); }
    return;
  }

  // Serve terms of service
  if (req.method === 'GET' && req.url === '/terms') {
    const file = require('path').join(__dirname, 'terms.html');
    if (require('fs').existsSync(file)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(require('fs').readFileSync(file));
    } else { res.writeHead(404); res.end('Not found'); }
    return;
  }

  // Serve app at /app
  if (req.method === 'GET' && (req.url === '/app' || req.url === '/app/')) {
    const file = path.join(__dirname, 'AutoReplyPro.html');
    if (fs.existsSync(file)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(fs.readFileSync(file));
    } else {
      res.writeHead(404); res.end('AutoReplyPro.html not found');
    }
    return;
  }

  // ── AI proxy endpoint ───────────────────────────────────────
  if (req.method === 'POST' && req.url === '/api/chat') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);

        // Forward to Anthropic
        const https = require('https');
        const postData = JSON.stringify({
          model: payload.model || 'claude-sonnet-4-5',
          max_tokens: payload.max_tokens || 200,
          system: payload.system || '',
          messages: payload.messages || []
        });

        const options = {
          hostname: 'api.anthropic.com',
          path: '/v1/messages',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'Content-Length': Buffer.byteLength(postData)
          }
        };

        const apiReq = https.request(options, (apiRes) => {
          let data = '';
          apiRes.on('data', chunk => data += chunk);
          apiRes.on('end', () => {
            res.writeHead(apiRes.statusCode, { 'Content-Type': 'application/json' });
            res.end(data);
          });
        });

        apiReq.on('error', (e) => {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: e.message }));
        });

        apiReq.write(postData);
        apiReq.end();

      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Bad request: ' + e.message }));
      }
    });
    return;
  }

  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, () => {
  console.log('');
  console.log('  ✅  AutoReply Pro server running!');
  console.log('');
  console.log('  👉  Open this in your browser:');
  console.log('      http://localhost:' + PORT);
  console.log('');
  if (ANTHROPIC_API_KEY === 'sk-ant-YOUR_KEY_HERE') {
    console.log('  ⚠️   API key not set!');
    console.log('      Open server.js and paste your key on line 8.');
    console.log('      Get a key at: https://console.anthropic.com/settings/keys');
  } else {
    console.log('  🤖  AI agent is active and ready.');
  }
  console.log('');
});
