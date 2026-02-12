const http = require('http');
const https = require('https');

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
        res.writeHead(404);
        res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`Streaming Upload Proxy running at http://localhost:${PORT}`);
});
