// Guards against en/zh dictionary drift: every key in one file must exist in
// the other, or t() silently falls back to English (or the raw key) instead
// of showing an error — a mismatch here has caused real bugs in this repo
// where a whole page's worth of translated strings rendered as raw keys.
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const enPath = path.join(__dirname, '../src/app/i18n/en.ts');
const zhPath = path.join(__dirname, '../src/app/i18n/zh.ts');

const keyRe = /^\s*'([^']+)':/gm;

function extractKeys(filePath) {
  const content = readFileSync(filePath, 'utf8');
  return new Set([...content.matchAll(keyRe)].map((m) => m[1]));
}

const enKeys = extractKeys(enPath);
const zhKeys = extractKeys(zhPath);

const missingInZh = [...enKeys].filter((k) => !zhKeys.has(k)).sort();
const missingInEn = [...zhKeys].filter((k) => !enKeys.has(k)).sort();

if (missingInZh.length === 0 && missingInEn.length === 0) {
  console.log(`i18n parity OK — ${enKeys.size} keys in both en.ts and zh.ts.`);
  process.exit(0);
}

console.error('i18n parity check FAILED.\n');

if (missingInZh.length > 0) {
  console.error(`Keys in en.ts missing from zh.ts (${missingInZh.length}):`);
  missingInZh.forEach((k) => console.error(`  - ${k}`));
  console.error('');
}

if (missingInEn.length > 0) {
  console.error(`Keys in zh.ts missing from en.ts (${missingInEn.length}):`);
  missingInEn.forEach((k) => console.error(`  - ${k}`));
  console.error('');
}

process.exit(1);
