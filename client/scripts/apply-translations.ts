/**
 * Apply Translations Script
 * Replaces hardcoded strings with t() calls using the output from extract-strings.ts
 * 
 * Usage: npx ts-node scripts/apply-translations.ts --input scripts/output/strings-output.json
 */

import * as fs from 'fs';
import * as path from 'path';

interface ExtractedString {
  original: string;
  line: number;
  context: string;
  suggestedKey: string;
  contentType: string;
  confidence: 'high' | 'medium' | 'low';
  start: number;
  end: number;
}

interface ExtractionResult {
  filePath: string;
  strings: ExtractedString[];
}

// Parse command line arguments
const args = process.argv.slice(2);
const inputIndex = args.indexOf('--input');

if (inputIndex === -1 || !args[inputIndex + 1]) {
  console.error('Usage: npx ts-node scripts/apply-translations.ts --input <path>');
  process.exit(1);
}

const inputPath = args[inputIndex + 1];
const absoluteInputPath = path.resolve(process.cwd(), inputPath);

if (!fs.existsSync(absoluteInputPath)) {
  console.error(`Input file not found: ${absoluteInputPath}`);
  process.exit(1);
}

const result: ExtractionResult = JSON.parse(fs.readFileSync(absoluteInputPath, 'utf-8'));
const targetFilePath = path.resolve(process.cwd(), result.filePath); // filePath in json is relative to cwd usually

if (!fs.existsSync(targetFilePath)) {
  // try to resolve relative to root if it was extracted with relative path
  const fallbackPath = path.resolve(process.cwd(), result.filePath);
  if (!fs.existsSync(fallbackPath)) {
    console.error(`Target file not found: ${targetFilePath}`);
    process.exit(1);
  }
}

let fileContent = fs.readFileSync(targetFilePath, 'utf-8');

// CHECK IMPORTS
const hasTranslationImport = fileContent.includes("import { useTranslation } from '../../i18n/TranslationContext';") || fileContent.includes("import { useTranslation } from '../i18n/TranslationContext';") || fileContent.includes('useTranslation'); // Simple heuristic

if (!hasTranslationImport) {
  // Add import
  // Try to add after the last import
  const lastImportMatch = fileContent.lastIndexOf('import ');
  if (lastImportMatch !== -1) {
    const endOfImportLine = fileContent.indexOf('\n', lastImportMatch);
    const insertionPoint = endOfImportLine + 1;

    // Check depth to guess path - Hacky
    // Assuming components/vtt so ../../i18n is correct
    const importStatement = "import { useTranslation } from '../../i18n/TranslationContext';\n";
    fileContent = fileContent.slice(0, insertionPoint) + importStatement + fileContent.slice(insertionPoint);

    // Adjust indices of replacements? 
    // YES. If we modify content, indices shift.
    // We MUST process replacements from bottom to top (reverse index order) BEFORE adding imports if we want to rely on indices.
    // BUT wait, we need to add the hook inside the component too.
  }
}

// STRATEGY: 
// 1. Perform string replacements (using reverse order) on the ORIGINAL content (loaded above).
// 2. Add imports/hooks to the NEW content.

// Reload content to be clean
let processingContent = fs.readFileSync(targetFilePath, 'utf-8');

// Filter strings to only high/medium confidence?
// The EXTRACT script already filters to high/medium before saving to 'strings' property? 
// Let's assume the user of this script vetted the JSON or we just trust 'strings' array.
// 'strings' in extraction output are ALREADY SORTED by reverse start index in my update to extract-strings.ts.
// But let's sort again to be sure.
const replacements = result.strings.sort((a, b) => b.start - a.start);

let diffOffset = 0; // Not used if we replace from back

for (const item of replacements) {
  const { start, end, original, suggestedKey, contentType } = item;

  // Safety check: is the text at that position still matching?
  // Since we are modifying 'processingContent' in place from back to front, the INDICES of current item (which is 'before' previous edits) 
  // should still be valid relative to the START of the string, which hasn't changed yet.

  const textInFile = processingContent.slice(start, end);

  // Handle quotes in original
  // The node includes quotes if it's a StringLiteral, but JSXText doesn't?
  // extract-strings.ts:
  // StringLiteral: value = node.value (no quotes)
  // TemplateLiteral: value = node.quasis[0].value.raw
  // JSXText: value = node.value.trim() (but node.start/end includes whitespace?)

  // Wait, StringLiteral node.start/include QUOTES. node.value does NOT.
  // If I replace [start, end] I am replacing the quotes too.

  // We need to know if we should wrap in {}
  // If it's JSXText, we need `{t('key')}`.
  // If it's a Prop (StringLiteral inside JSXAttribute), we need `{t('key')}` (and remove quotes).
  // If it's inside code (variable assignment), we need `t('key')`.

  const isJSXText = processingContent[start] !== "'" && processingContent[start] !== '"' && processingContent[start] !== '`';

  let replacement = '';

  if (isJSXText) {
    // It's JSX Text
    // E.g. <span>Hello</span> -> <span>{t('hello')}</span>
    replacement = `{t('${suggestedKey}')}`;

    // CAREFUL: JSXText node start/end might encompass whitespace if not trimmed?
    // extract-strings uses node.value.trim() for the VALUE, but node.start/end likely covers the whole text node including newlines/spaces if multi-line.
    // BUT `extract-strings.ts` logic for JSXText:
    /*
    JSXText(nodePath: any) {
        const { node } = nodePath;
        const value = node.value.trim();
        // ...
         processString(value...)
    }
    */
    // If I replace the whole node (start to end) with the replacement, I might lose formatted whitespace.
    // But usually we want to replace the user facing text.
    // Let's rely on `node.value` check.
    // If textInFile != value, it implies whitespace around.

    // Actually, if it's JSX text, we probably want to preserve whitespace if it was relevant, but typically translation replaces content.
    // Let's just replace.

    replacement = `{t('${suggestedKey}')}`;

  } else {
    // String Literal (quoted)
    // E.g. title="Hello" -> title={t('hello')}
    // OR const x = "Hello" -> const x = t('hello')

    // Check if it's a JSX attribute
    const charBefore = processingContent[start - 1]; // usually =
    const isJSXProp = charBefore === '='; // Rough check. 

    if (isJSXProp) {
      replacement = `{t('${suggestedKey}')}`;
    } else {
      replacement = `t('${suggestedKey}')`;
    }
  }

  console.log(`Replace [${start}-${end}]: "${textInFile}" -> "${replacement}"`);
  processingContent = processingContent.slice(0, start) + replacement + processingContent.slice(end);
}

// Now handle Helper injection
// We need to find the component function body. 
// This is hard with regex. 
// Let's try to match: "export const ComponentName = ... {" or "function ComponentName... {"
const componentName = path.basename(targetFilePath, path.extname(targetFilePath));
const regex = new RegExp(`export\\s+(?:const|function)\\s+${componentName}\\s*(?:=|\\()`);

const match = processingContent.match(regex);
if (match) {
  // Find the first '{' after the match
  const openBraceIndex = processingContent.indexOf('{', match.index! + match[0].length);
  if (openBraceIndex !== -1 && !processingContent.includes('const { t } = useTranslation()')) {
    // Insert hook
    const insertion = "\n    const { t } = useTranslation();";
    processingContent = processingContent.slice(0, openBraceIndex + 1) + insertion + processingContent.slice(openBraceIndex + 1);
  }
}

// Now imports
if (!processingContent.includes("import { useTranslation } from")) {
  const importStmt = "import { useTranslation } from '../../i18n/TranslationContext';\n";
  if (processingContent.startsWith('import')) {
    processingContent = importStmt + processingContent;
  } else {
    // Try to put it at top
    processingContent = importStmt + processingContent;
  }
}

fs.writeFileSync(targetFilePath, processingContent, 'utf-8');
console.log(`Modified ${targetFilePath}`);
