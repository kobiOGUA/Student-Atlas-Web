const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
};

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/log') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      console.log('BROWSER LOG:', body);
      res.writeHead(200); res.end('ok');
    });
    return;
  }
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.url === '/api/catbox' && req.method === 'POST') {
        console.log('Received upload request - Streaming to Catbox...');

        const options = {
            hostname: 'catbox.moe',
            path: '/user/api.php',
            method: 'POST',
            timeout: 60000,
            headers: {
                'Content-Type': req.headers['content-type'],
                'Content-Length': req.headers['content-length'],
                'User-Agent': req.headers['user-agent']
            }
        };

        const proxyReq = https.request(options, (proxyRes) => {
            console.log(`Catbox responded with status: ${proxyRes.statusCode}`);

            let data = '';
            proxyRes.on('data', (chunk) => data += chunk);
            proxyRes.on('end', () => {
                if (proxyRes.statusCode === 200) {
                    const url = data.trim();
                    console.log('Upload success:', url);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, url, fileName: 'uploaded_file', size: 0 }));
                } else {
                    console.error('Catbox error:', data);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Catbox upload failed: ' + data }));
                }
            });
        });

        proxyReq.on('timeout', () => {
            console.error('Catbox request timed out');
            proxyReq.destroy();
            res.writeHead(504, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Upload to Catbox timed out' }));
        });

        proxyReq.on('error', (e) => {
            console.error('Proxy Request error:', e);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
        });

        req.pipe(proxyReq);

    } else {
        // Serve static files
        let urlPath = req.url.split('?')[0]; // strip query params
        if (urlPath === '/') urlPath = '/index.html';

        const filePath = path.join(__dirname, urlPath);
        const ext = path.extname(filePath).toLowerCase();
        const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

        console.log(`Serving static: ${urlPath}`);

        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not Found');
            } else {
                res.writeHead(200, { 'Content-Type': mimeType, 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate', 'Pragma': 'no-cache', 'Expires': '0' });
                res.end(data);
            }
        });
    }
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
