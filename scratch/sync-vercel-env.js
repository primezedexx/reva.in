const { spawnSync } = require('child_process');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
    const idx = trimmed.indexOf('=');
    const k = trimmed.substring(0, idx).trim();
    const v = trimmed.substring(idx + 1).trim().replace(/^['"]|['"]$/g, '');
    if (k && v && v.length > 0 && k !== 'VERCEL_OIDC_TOKEN') envVars[k] = v;
  }
});

console.log('Syncing environment variables to Vercel (Production)...');

for (const [key, val] of Object.entries(envVars)) {
  console.log(`Setting ${key}...`);
  const res = spawnSync('npx', ['vercel', 'env', 'add', key, 'production', '--force', '--yes'], {
    input: val + '\n',
    encoding: 'utf8',
    shell: true,
  });
  if (res.error) {
    console.error(`Error for ${key}:`, res.error);
  } else {
    console.log(res.stdout ? res.stdout.trim() : `✓ ${key} done`);
    if (res.stderr) console.error(res.stderr.trim());
  }
}

console.log('\n✓ Done syncing all variables to Vercel!');
