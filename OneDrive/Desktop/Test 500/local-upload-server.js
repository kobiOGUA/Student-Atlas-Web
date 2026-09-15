// Local development server for Catbox uploads
const http = require('http');
const FormData = require('form-data');
const fetch = require('node-fetch');

const PORT = 3000;

const server = http.createServer(async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.url === '/api/upload' && req.method === 'POST') {
        try {
            const chunks = [];
            req.on('data', chunk => chunks.push(chunk));
            req.on('end', async () => {
                try {
                    const buffer = Buffer.concat(chunks);
                    const boundary = req.headers['content-type'].split('boundary=')[1];
                    const parts = buffer.toString('binary').split(`--${boundary}`);

                    let fileData, filename, contentType;

                    for (const part of parts) {
                        if (part.includes('filename=')) {
                            const filenameMatch = part.match(/filename="([^"]+)"/);
                            const contentTypeMatch = part.match(/Content-Type: ([^\r\n]+)/);

                            if (filenameMatch) {
                                filename = filenameMatch[1];
                                contentType = contentTypeMatch ? contentTypeMatch[1] : 'application/octet-stream';

                                const dataStart = part.indexOf('\r\n\r\n') + 4;
                                const dataEnd = part.lastIndexOf('\r\n');
                                fileData = Buffer.from(part.substring(dataStart, dataEnd), 'binary');
                            }
                        }
                    }

                    if (!fileData) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'No file provided' }));
                        return;
                    }

                    // Upload to Catbox
                    const form = new FormData();
                    form.append('reqtype', 'fileupload');
                    form.append('fileToUpload', fileData, { filename, contentType });

                    const response = await fetch('https://catbox.moe/user/api.php', {
                        method: 'POST',
                        body: form
                    });

                    const fileUrl = await response.text();

                    console.log('Upload successful:', fileUrl.trim());

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: true,
                        url: fileUrl.trim(),
                        fileName: filename,
                        size: fileData.length
                    }));

                } catch (error) {
                    console.error('Processing error:', error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: error.message }));
                }
            });
        } catch (error) {
            console.error('Upload error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
        }
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

server.listen(PORT, () => {
    console.log(`Catbox Upload API running on http://localhost:${PORT}`);
    console.log('Test endpoint: http://localhost:${PORT}/api/upload');
});
