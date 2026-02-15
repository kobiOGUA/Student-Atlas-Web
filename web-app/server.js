import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.url === '/api/catbox' && req.method === 'POST') {
        console.log('Received upload request request - Streaming to Catbox...');

        const options = {
            hostname: 'catbox.moe',
            path: '/user/api.php',
            method: 'POST',
            timeout: 60000,
            headers: {
                // Forward critical headers from the browser's request
                'Content-Type': req.headers['content-type'],
                'Content-Length': req.headers['content-length'],
                'User-Agent': req.headers['user-agent'] // Sometimes helpful
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
                    res.end(JSON.stringify({
                        success: true,
                        url: url,
                        fileName: 'uploaded_file', // We don't parse filename in streaming mode
                        size: 0
                    }));
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

        // Pipe the incoming request stream directly to the outgoing request
        req.pipe(proxyReq);

    } else {
        // Serve static files
        const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        const pathname = decodeURIComponent(parsedUrl.pathname);
        console.log(`Serving static: ${pathname}`);

        let filePath = path.join(__dirname, pathname);
        if (pathname === '/') {
            filePath = path.join(__dirname, 'index.html');
        }

        const extname = String(path.extname(filePath)).toLowerCase();
        const mimeTypes = {
            '.html': 'text/html',
            '.js': 'text/javascript',
            '.css': 'text/css',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.wav': 'audio/wav',
            '.mp4': 'video/mp4',
            '.woff': 'application/font-woff',
            '.ttf': 'application/font-ttf',
            '.eot': 'application/vnd.ms-fontobject',
            '.otf': 'application/font-otf',
            '.wasm': 'application/wasm'
        };

        const contentType = mimeTypes[extname] || 'application/octet-stream';

        fs.readFile(filePath, (error, content) => {
            if (error) {
                if (error.code == 'ENOENT') {
                    // Try adding .html extension for clean URLs (optional but nice)
                    if (path.extname(filePath) === '') {
                        fs.readFile(filePath + '.html', (err2, content2) => {
                            if (err2) {
                                res.writeHead(404);
                                res.end('File Not Found');
                            } else {
                                res.writeHead(200, { 'Content-Type': 'text/html' });
                                res.end(content2, 'utf-8');
                            }
                        });
                    } else {
                        res.writeHead(404);
                        res.end('File Not Found');
                    }
                } else {
                    res.writeHead(500);
                    res.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
                }
            } else {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content, 'utf-8');
            }
        });
    }
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
