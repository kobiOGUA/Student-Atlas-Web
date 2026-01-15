// Vercel Serverless Function - Proxy for file uploads to Catbox.moe
// This bypasses CORS by uploading from the backend

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Get file from request
        const formData = await parseMultipartForm(req);

        if (!formData.file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        // Forward to Catbox.moe
        const catboxFormData = new FormData();
        catboxFormData.append('reqtype', 'fileupload');
        catboxFormData.append('fileToUpload', new Blob([formData.file.data], { type: formData.file.type }), formData.file.filename);

        const response = await fetch('https://catbox.moe/user/api.php', {
            method: 'POST',
            body: catboxFormData
        });

        if (!response.ok) {
            throw new Error('Catbox upload failed');
        }

        const fileUrl = await response.text();

        return res.status(200).json({
            success: true,
            url: fileUrl.trim(),
            fileName: formData.file.filename,
            size: formData.file.size
        });

    } catch (error) {
        console.error('Upload error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Upload failed'
        });
    }
}

// Simple multipart form parser
async function parseMultipartForm(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];

        req.on('data', chunk => chunks.push(chunk));
        req.on('end', () => {
            try {
                const buffer = Buffer.concat(chunks);
                const contentType = req.headers['content-type'];
                if (!contentType || !contentType.includes('boundary=')) {
                    resolve({}); // Or reject, but robust handling preferred
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
                            // Ensure valid buffer range
                            if (dataStart > 3 && dataEnd > dataStart) {
                                file.data = Buffer.from(part.substring(dataStart, dataEnd), 'binary');
                                file.size = file.data.length;
                            }
                        }
                    }
                }

                resolve({ file });
            } catch (error) {
                reject(error);
            }
        });

        req.on('error', reject);
    });
}
