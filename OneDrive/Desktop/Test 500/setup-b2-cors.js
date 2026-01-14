// Script to configure CORS for Backblaze B2
const https = require('https');

const B2_KEY_ID = '0035ae1779d70390000000002';
const B2_APP_KEY = 'K00384jfE2aU+YMUYdjU4U0AUAZK95Q';
const BUCKET_ID = 'e50aaee1c79799ad97b00319';

async function setupCORS() {
    console.log('Step 1: Authorizing with B2...');

    // Step 1: Authorize
    const authData = await new Promise((resolve, reject) => {
        const auth = Buffer.from(`${B2_KEY_ID}:${B2_APP_KEY}`).toString('base64');

        const options = {
            hostname: 'api.backblazeb2.com',
            path: '/b2api/v2/b2_authorize_account',
            method: 'GET',
            headers: {
                'Authorization': `Basic ${auth}`
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(JSON.parse(data));
                } else {
                    reject(new Error(`Auth failed: ${data}`));
                }
            });
        });

        req.on('error', reject);
        req.end();
    });

    console.log('✓ Authorization successful');
    console.log('Step 2: Setting CORS rules...');

    // Step 2: Update bucket with CORS rules
    const corsRules = [
        {
            corsRuleName: 'allowWebUploads',
            allowedOrigins: [
                'http://localhost:8085',
                'https://localhost:8085'
            ],
            allowedHeaders: ['*'],
            allowedOperations: [
                'b2_upload_file',
                'b2_upload_part',
                'b2_download_file_by_name',
                'b2_download_file_by_id'
            ],
            exposeHeaders: ['x-bz-content-sha1'],
            maxAgeSeconds: 3600
        }
    ];

    const updateData = await new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            accountId: authData.accountId,
            bucketId: BUCKET_ID,
            corsRules: corsRules
        });

        const apiUrl = new URL(authData.apiUrl);

        const options = {
            hostname: apiUrl.hostname,
            path: '/b2api/v2/b2_update_bucket',
            method: 'POST',
            headers: {
                'Authorization': authData.authorizationToken,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(JSON.parse(data));
                } else {
                    reject(new Error(`Update failed: ${data}`));
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });

    console.log('✓ CORS rules configured successfully!');
    console.log('\n✅ Your B2 bucket is now configured for browser uploads!');
}

setupCORS().catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
});
