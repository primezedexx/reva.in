const http = require('http');

http.get('http://localhost:3000/dashboard', (res) => {
  console.log('Status code:', res.statusCode);
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Body length:', data.length);
    console.log('Has Reva title:', data.includes('Reva'));
    console.log('Dashboard rendered successfully!');
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});
