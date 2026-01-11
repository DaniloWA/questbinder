/**
 * Inject Translations Script
 * Injects translations from a JSON file into the locale files.
 * 
 * Usage: npx ts-node scripts/inject-translations.ts --input scripts/input/translations-input.json
 */

import * as fs from 'fs';
import * as path from 'path';

interface Translation {
  key: string;
  en: string;
  pt: string;
}

interface TranslationsInput {
  translations: Translation[];
}

// Parse command line arguments
const args = process.argv.slice(2);
const inputIndex = args.indexOf('--input');
const overwrite = args.includes('--overwrite');

if (inputIndex === -1 || !args[inputIndex + 1]) {
  console.error('Usage: npx ts-node scripts/inject-translations.ts --input <path> [--overwrite]');
  process.exit(1);
}

const inputPath = args[inputIndex + 1];
const absoluteInputPath = path.resolve(process.cwd(), inputPath);

if (!fs.existsSync(absoluteInputPath)) {
  console.error(`Input file not found: ${absoluteInputPath}`);
  process.exit(1);
}

// Read translations input
const input: TranslationsInput = JSON.parse(fs.readFileSync(absoluteInputPath, 'utf-8'));

// Paths to locale files
const localesDir = path.join(process.cwd(), 'src', 'i18n', 'locales');
const enUsPath = path.join(localesDir, 'en-US.ts');
const ptBrPath = path.join(localesDir, 'pt-BR.ts');

// Helper to set nested value in object
function setNestedValue(obj: any, keyPath: string[], value: string): boolean {
  let current = obj;

  for (let i = 0; i < keyPath.length - 1; i++) {
    const key = keyPath[i];
    if (!(key in current)) {
      current[key] = {};
    } else if (typeof current[key] !== 'object') {
      console.warn(`⚠️ Cannot create nested key at ${keyPath.slice(0, i + 1).join('.')}: not an object`);
      return false;
    }
    current = current[key];
  }

  const finalKey = keyPath[keyPath.length - 1];
  if (finalKey in current && !overwrite) {
    console.warn(`⚠️ Key already exists: ${keyPath.join('.')} (use --overwrite to replace)`);
    return false;
  }

  current[finalKey] = value;
  return true;
}

// Parse TypeScript object literal from file
function parseLocaleFile(filePath: string): { obj: any; prefix: string; suffix: string; } {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Find the object start and end
  const exportMatch = content.match(/export\s+default\s+/);
  const asConstMatch = content.match(/\}\s*as\s+const\s*;?\s*$/);

  if (!exportMatch || !asConstMatch) {
    throw new Error(`Cannot parse locale file: ${filePath}`);
  }

  const prefix = content.slice(0, exportMatch.index! + exportMatch[0].length);
  const suffix = '\n} as const;\n';

  // Extract the object part
  const objectStart = prefix.length;
  const objectEnd = content.length - asConstMatch[0].length;
  const objectStr = content.slice(objectStart, objectEnd + 1);

  // Use Function constructor to evaluate the object (safe for known files)
  try {
    const obj = new Function(`return ${objectStr}`)();
    return { obj, prefix, suffix };
  } catch (e) {
    throw new Error(`Cannot parse object in ${filePath}: ${e}`);
  }
}

// Serialize object back to TypeScript
function serializeObject(obj: any, indent: number = 0): string {
  const spaces = '  '.repeat(indent);
  const entries = Object.entries(obj);

  if (entries.length === 0) return '{}';

  const lines = entries.map(([key, value]) => {
    // Quote keys that need it
    const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `'${key}'`;

    if (typeof value === 'string') {
      // Escape single quotes, backslashes and newlines
      const escaped = value
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r');
      return `${spaces}  ${safeKey}: '${escaped}',`;
    } else if (Array.isArray(value)) {
      const arrayContent = value.map(v => {
        if (typeof v === 'string') {
          const escaped = v
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r');
          return `'${escaped}'`;
        }
        return JSON.stringify(v);
      }).join(', ');
      return `${spaces}  ${safeKey}: [${arrayContent}],`;
    } else if (typeof value === 'object' && value !== null) {
      return `${spaces}  ${safeKey}: ${serializeObject(value, indent + 1)},`;
    } else {
      return `${spaces}  ${safeKey}: ${JSON.stringify(value)},`;
    }
  });

  return `{\n${lines.join('\n')}\n${spaces}}`;
}

// Process each locale file
function processLocaleFile(filePath: string, translations: Translation[], lang: 'en' | 'pt'): number {
  console.log(`\n📝 Processing: ${path.basename(filePath)}`);

  const { obj, prefix } = parseLocaleFile(filePath);
  let successCount = 0;

  for (const translation of translations) {
    const keyPath = translation.key.split('.');
    const value = lang === 'en' ? translation.en : translation.pt;

    if (setNestedValue(obj, keyPath, value)) {
      console.log(`  ✅ Added: ${translation.key}`);
      successCount++;
    }
  }

  // Write back
  const newContent = `${prefix}${serializeObject(obj)} as const;\n`;
  fs.writeFileSync(filePath, newContent, 'utf-8');

  return successCount;
}

// Main execution
console.log(`🌐 Injecting ${input.translations.length} translations...`);

const enCount = processLocaleFile(enUsPath, input.translations, 'en');
const ptCount = processLocaleFile(ptBrPath, input.translations, 'pt');

console.log(`\n✅ Done!`);
console.log(`   EN-US: ${enCount}/${input.translations.length} translations added`);
console.log(`   PT-BR: ${ptCount}/${input.translations.length} translations added`);
