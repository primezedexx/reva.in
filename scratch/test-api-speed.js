const http = require('http');

async function testApi() {
  const start = Date.now();
  http.get('http://localhost:3000/api/dashboard', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const elapsed = Date.now() - start;
      console.log(`[API Latency] /api/dashboard returned ${res.statusCode} in ${elapsed}ms`);
      try {
        const parsed = JSON.parse(data);
        console.log('Success:', parsed.success);
        console.log('Business:', parsed.metrics?.business?.name);
        console.log('Total Members:', parsed.metrics?.totalMembers);
      } catch (e) {
        console.error('Parse error:', e);
      }
    });
  }).on('error', (err) => {
    console.error('HTTP Error:', err.message);
  });
}

testApi();
