const https = require('https');

const data = JSON.stringify({
    model: 'deepseek-chat',
    messages: [
        { role: 'user', content: 'hi' }
    ],
    max_tokens: 10
});

const options = {
    hostname: 'api.deepseek.com',
    path: '/chat/completions',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sk-29d4e3aba3f84637b990b4f4f5b62616'
    }
};

console.log('Testing DeepSeek API...');

const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (c) => body += c);
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Body:', body);
    });
});

req.on('error', (e) => {
    console.error('Error:', e.message);
});

req.write(data);
req.end();
