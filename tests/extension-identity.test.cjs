const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHash, createPublicKey } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const root = process.env.BROWSER_GLASS_ROOT || path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));

test('the manifest pins the same extension ID across checkout paths and Macs', () => {
  assert.equal(typeof manifest.key, 'string');
  const key = Buffer.from(manifest.key, 'base64');
  assert.equal(createPublicKey({ key, type: 'spki', format: 'der' }).asymmetricKeyType, 'rsa');
  const id = [...createHash('sha256').update(key).digest('hex').slice(0, 32)]
    .map(nibble => String.fromCharCode(97 + parseInt(nibble, 16))).join('');
  assert.equal(id, 'pmbjpoejlcgagpcelbcchgnffmcggofd');
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  assert.ok(readme.includes(`chrome-extension://${id}/index.html`));
});
