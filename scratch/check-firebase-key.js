async function checkApiKey() {
  const apiKey = "AIzaSyDjEJWziOZPjQhcm6Tf53vycPgnIJF1ElE";
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'test@example.com',
      continueUri: 'http://localhost:3000'
    })
  });
  const data = await res.json();
  console.log("Status:", res.status);
  console.log("Response:", JSON.stringify(data, null, 2));
}

checkApiKey();
