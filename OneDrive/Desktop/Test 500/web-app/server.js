const http = require('http');
const https = require('https');

const PORT = 3000;

const server = http.createServer(async (req, res) => {
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

    if (req.url === '/api/upload' && req.method === 'POST') {
        console.log('Received upload request');
        try {
            // Parse multipart form
            const formData = await parseMultipartForm(req);

            if (!formData.file) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'No file provided' }));
                return;
            }

            console.log(`Uploading ${formData.file.filename} (${formData.file.size} bytes) to Catbox...`);

            // Construct multipart body for Catbox
            const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);

            const postDataStart = [
                `--${boundary}`,
                'Content-Disposition: form-data; name="reqtype"',
                '',
                'fileupload',
                `--${boundary}`,
                `Content-Disposition: form-data; name="fileToUpload"; filename="${formData.file.filename}"`,
                `Content-Type: ${formData.file.type}`,
                '',
                ''
            ].join('\r\n');

            const postDataEnd = `\r\n--${boundary}--`;

            const options = {
                hostname: 'catbox.moe',
                path: '/user/api.php',
                method: 'POST',
                headers: {
                    'Content-Type': `multipart/form-data; boundary=${boundary}`,
                    'Content-Length': Buffer.byteLength(postDataStart) + formData.file.data.length + Buffer.byteLength(postDataEnd)
                }
            };

            const catboxReq = https.request(options, (catboxRes) => {
                let data = '';
                catboxRes.on('data', (chunk) => data += chunk);
                catboxRes.on('end', () => {
                    if (catboxRes.statusCode === 200) {
                        const url = data.trim();
                        console.log('Upload success:', url);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            success: true,
                            url: url,
                            fileName: formData.file.filename,
                            size: formData.file.size
                        }));
                    } else {
                        console.error('Catbox error:', data);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Catbox upload failed' }));
                    }
                });
            });

            catboxReq.on('error', (e) => {
                console.error('Request error:', e);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            });

            // Write Body
            catboxReq.write(postDataStart);
            catboxReq.write(formData.file.data);
            catboxReq.write(postDataEnd);
            catboxReq.end();

        } catch (error) {
            console.error('Server error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
        }
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

function parseMultipartForm(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', () => {
            try {
                const buffer = Buffer.concat(chunks);
                const contentType = req.headers['content-type'];
                if (!contentType || !contentType.includes('boundary=')) {
                    reject(new Error('Invalid Content-Type'));
                    return;
                }
                const boundary = contentType.split('boundary=')[1];
                const parts = buffer.toString('binary').split(`--${boundary}`);

                const file = {};

                for (const part of parts) {
                    if (part.includes('filename=')) {
                        const filenameMatch = part.match(/filename="([^"]+)"/);
                        const contentTypeMatch = part.match(/Content-Type: ([^\r\n]+)/);

                        if (filenameMatch) {
                            file.filename = filenameMatch[1];
                            file.type = contentTypeMatch ? contentTypeMatch[1] : 'application/octet-stream';

                            const dataStart = part.indexOf('\r\n\r\n') + 4;
                            const dataEnd = part.lastIndexOf('\r\n');
                            // Handle cases where lat boundary includes extra dashes
                            file.data = Buffer.from(part.substring(dataStart, dataEnd), 'binary');
                            file.size = file.data.length;
                            resolve({ file });
                            return;
                        }
                    }
                }
                resolve({});
            } catch (error) {
                reject(error);
            }
        });
        req.on('error', reject);
    });
}

server.listen(PORT, () => {
    console.log(`Upload proxy server running at http://localhost:${PORT}`);
});
