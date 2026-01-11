/**
 * Verify Translations Script
 * Scans the codebase for t('key') calls and verifies if they exist in the locale files.
 *
 * Usage: npx ts-node scripts/verify-translations.ts (from client directory)
 *    OR: npx ts-node client/scripts/verify-translations.ts (from root directory)
 */

import * as fs from 'fs';
import * as path from 'path';

// --- Configuration ---
// Try to find src directory relative to CWD
let SRC_DIR = path.join(process.cwd(), 'src');

if (!fs.existsSync(SRC_DIR)) {
  // Try checking if we are in root and src is in client/src
  SRC_DIR = path.join(process.cwd(), 'client', 'src');
}

if (!fs.existsSync(SRC_DIR)) {
  console.error('❌ Could not find src directory.');
  console.error(`Checked: ${path.join(process.cwd(), 'src')}`);
  console.error(`Checked: ${path.join(process.cwd(), 'client', 'src')}`);
  console.error('Please run from project root or client directory.');
  process.exit(1);
}

const LOCALES_DIR = path.join(SRC_DIR, 'i18n', 'locales');
const EN_PATH = path.join(LOCALES_DIR, 'en-US.ts');
const PT_PATH = path.join(LOCALES_DIR, 'pt-BR.ts');

const EXCLUDE_DIRS = ['node_modules', '.git', 'dist', 'build', 'coverage'];
const FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

// --- Helper Functions ---

// Flatten nested object keys to dot notation
function flattenKeys(obj: any, prefix = ''): Set<string> {
  const keys = new Set<string>();

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Recursively flatten
        const subKeys = flattenKeys(value, fullKey);
        subKeys.forEach(k => keys.add(k));
      } else {
        // It's a leaf (string or array)
        keys.add(fullKey);
      }
    }
  }
  return keys;
}

// Parse TypeScript object literal from file (reused logic)
function parseLocaleFile(filePath: string): any {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Locale file not found: ${filePath}`);
  }
  const content = fs.readFileSync(filePath, 'utf-8');

  // Find the object start and end (assuming export default { ... } as const)
  const exportMatch = content.match(/export\s+default\s+/);
  const asConstMatch = content.match(/\}\s*as\s+const\s*;?\s*$/) || content.match(/\}\s*;?\s*$/);

  if (!exportMatch) {
    throw new Error(`Cannot parse locale file structure: ${filePath}`);
  }

  const objectStart = exportMatch.index! + exportMatch[0].length;

  let objectStr = '';
  if (asConstMatch) {
    objectStr = content.slice(objectStart, content.length - asConstMatch[0].length + 1);
  } else {
    objectStr = content.slice(objectStart);
  }

  // Clean up potential trailing semicolon
  objectStr = objectStr.trim().replace(/;$/, '');

  // Use Function constructor to evaluate the object
  try {
    const obj = new Function(`return ${objectStr}`)();
    return obj;
  } catch (e) {
    throw new Error(`Cannot evaluate object in ${filePath}: ${e}`);
  }
}

interface KeyLocation {
  file: string;
  line: number;
  key: string;
}

// Scan file for usage of t('...')
function scanFile(filePath: string): KeyLocation[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const locations: KeyLocation[] = [];
  const lines = content.split('\n');

  // Regex matches: t('key'), t("key"), t(`key`)
  // Captures the key content
  const regex = /\bt\(\s*(['"`])(.*?)\1/g;

  lines.forEach((lineContent, lineIndex) => {
    let match;
    while ((match = regex.exec(lineContent)) !== null) {
      const key = match[2];
      // Filter out clearly dynamic keys
      if (key.includes('${') || key.includes(' + ')) {
        continue;
      }
      // Filter out empty or very short keys
      if (!key || key.length < 2) continue;

      locations.push({
        file: filePath,
        line: lineIndex + 1,
        key: key
      });
    }
  });

  return locations;
}

// Recursively walk directory
function walkDir(dir: string): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat && stat.isDirectory()) {
      if (!EXCLUDE_DIRS.includes(file)) {
        results = results.concat(walkDir(fullPath));
      }
    } else {
      if (FILE_EXTENSIONS.includes(path.extname(file))) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

// --- Main Execution ---

console.log('🔍 Starting Translation Verification...');
console.log(`📂 Source: ${SRC_DIR}`);

// 1. Load Locales
console.log('📖 Loading locales...');
let definedEnKeys: Set<string> = new Set();
let definedPtKeys: Set<string> = new Set();

try {
  const enObj = parseLocaleFile(EN_PATH);
  const ptObj = parseLocaleFile(PT_PATH);

  definedEnKeys = flattenKeys(enObj);
  definedPtKeys = flattenKeys(ptObj);

  console.log(`   EN-US: ${definedEnKeys.size} keys`);
  console.log(`   PT-BR: ${definedPtKeys.size} keys`);
} catch (e: any) {
  console.error('❌ Error loading locales:', e.message);
  process.exit(1);
}

// 2. Scan Codebase
console.log('🕵️  Scanning codebase for key usage...');
const files = walkDir(SRC_DIR);
const usedKeys: KeyLocation[] = [];

files.forEach(file => {
  // skip locale files themselves
  if (file.includes('i18n') && file.includes('locales')) return;

  const keysInFile = scanFile(file);
  usedKeys.push(...keysInFile);
});

console.log(`   Found ${usedKeys.length} usages of t() function.`);

// 3. Verify
console.log('⚖️  Verifying keys...');

const totalUniqueKeys = new Set(usedKeys.map(k => k.key));
console.log(`   Unique keys used: ${totalUniqueKeys.size}`);

const issues: { location: KeyLocation, missingEn: boolean, missingPt: boolean; }[] = [];

for (const usage of usedKeys) {
  const { key } = usage;
  // Skip empty keys or extremely short ones
  if (!key || key.length < 2) continue;

  const missingEn = !definedEnKeys.has(key);
  const missingPt = !definedPtKeys.has(key);

  if (missingEn || missingPt) {
    issues.push({
      location: usage,
      missingEn,
      missingPt
    });
  }
}

// 4. Report
let reportOutput = '';
function log(msg: string) {
  console.log(msg);
  reportOutput += msg + '\n';
}

if (issues.length === 0) {
  log('\n✅ SUPER! No missing translations found!');
} else {
  // Group by file for cleaner output
  const byFile: Record<string, typeof issues> = {};
  issues.forEach(i => {
    if (!byFile[i.location.file]) byFile[i.location.file] = [];
    byFile[i.location.file].push(i);
  });

  log(`\n❌ Found ${issues.length} potential missing translations in ${Object.keys(byFile).length} files:\n`);

  for (const [file, fileIssues] of Object.entries(byFile)) {
    const relativePath = path.relative(process.cwd(), file);
    log(`📄 ${relativePath}`);
    fileIssues.forEach(issue => {
      const missing = [];
      if (issue.missingEn) missing.push('EN');
      if (issue.missingPt) missing.push('PT');
      log(`   L${issue.location.line}: "${issue.location.key}" 🔴 Missing in: ${missing.join(', ')}`);
    });
    log('');
  }

  log('Note: Some errors might be false positives if keys are constructed dynamically (e.g. `rules.${type}.name`).');
}

// Write to file
const outputDir = path.join(path.dirname(SRC_DIR), 'scripts', 'output');
if (!fs.existsSync(outputDir)) {
  // Try to create it, if fails, might depend on where we are
  try {
    fs.mkdirSync(outputDir, { recursive: true });
  } catch (e) {
    console.error('Could not create output dir, assuming it exists or falling back to CWD');
  }
}
const reportFile = path.join(outputDir, 'verification_report.txt');

try {
  fs.writeFileSync(reportFile, reportOutput, 'utf-8');
  console.log(`\n📄 Report saved to: ${reportFile}`);
} catch (e) {
  console.error(`Failed to write report to ${reportFile}`);
}

process.exit(0);
