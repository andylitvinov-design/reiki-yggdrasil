const provider = process.env.DEPLOYMENT_PROVIDER || 'vercel';
const expectedCommit = process.env.EXPECTED_COMMIT || '';
const deploymentUrl = process.env.DEPLOYMENT_URL || '';
const liveUrl = process.env.LIVE_URL || 'https://mentalica.vercel.app';

const result = {
  provider,
  expectedCommit: expectedCommit || null,
  deploymentUrl: deploymentUrl || null,
  liveUrl: liveUrl || null,
  checkedAt: new Date().toISOString(),
  ok: false,
  notes: []
};

if (!deploymentUrl && !liveUrl) {
  result.notes.push('No DEPLOYMENT_URL or LIVE_URL provided.');
  console.error(JSON.stringify(result, null, 2));
  process.exit(2);
}

const urlToCheck = deploymentUrl || liveUrl;

try {
  const response = await fetch(urlToCheck, { redirect: 'follow' });
  result.httpStatus = response.status;
  result.ok = response.ok;
  if (!response.ok) {
    result.notes.push(`HTTP check failed: ${response.status}`);
  }
} catch (error) {
  result.notes.push(`Request failed: ${error.message}`);
}

console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
