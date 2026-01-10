
import fs from 'fs';
import path from 'path';

const raw = fs.readFileSync('scripts/output/strings-output.json', 'utf-8');
const data = JSON.parse(raw);

const excludeKeywords = new Set([
  'combat', 'chat', 'party', 'spells', 'inventory', 'features', 'bio', 'history', 'gmnotes',
  'd20', 'dmg', 'long', 'short', 'string', 'numeric', '2-digit', 'active', 'passive',
  'message', 'roll', 'system', 'all', 'sidebar', 'floating', 'fullscreen', 'token', 'position',
  'movement', 'damage', 'heal', 'attack', 'spell', 'item', 'feature', 'compendium'
]);

const filteredStrings = data.strings.filter((s: any) => {
  // Exclude SVG paths
  if (s.confidence === 'medium' && /^[MmLlHhVvCcSsQqTtAaZz][0-9]/.test(s.original)) return false;

  // Exclude known keywords (likely IDs/Values)
  if (excludeKeywords.has(s.original)) return false;

  const ctx = s.context;
  const val = s.original;
  const qVal = `'${val}'`;
  const qqVal = `"${val}"`;

  // Checks for code usage patterns
  if (ctx.includes(`=== ${qVal}`) || ctx.includes(`=== ${qqVal}`)) return false;
  if (ctx.includes(`!== ${qVal}`) || ctx.includes(`!== ${qqVal}`)) return false;
  if (ctx.includes(`case ${qVal}`)) return false;
  if (ctx.includes(`useState`) && (ctx.includes(`${qVal})`) || ctx.includes(`${qqVal})`))) return false;
  if (ctx.includes(`setActiveTab(${qVal}`) || ctx.includes(`setActiveTab(${qqVal}`)) return false;
  if (ctx.includes(`id: ${qVal}`) || ctx.includes(`id: ${qqVal}`)) return false;
  if (ctx.includes(`type: ${qVal}`) || ctx.includes(`type: ${qqVal}`)) return false;
  if (ctx.includes(`updateField(${qVal}`)) return false;
  if (ctx.includes(`handleRest(${qVal}`)) return false;
  if (ctx.includes(`onShare(${qVal}`)) return false;

  // Specific checks for CharacterSheetViewer
  if (ctx.includes(`updateField`) && ctx.includes(qVal)) return false;

  return true;
});

// Deduplicate keys for translations
const seenKeys = new Set();
const uniqueTranslations = [];

for (const s of filteredStrings) {
  if (!seenKeys.has(s.suggestedKey)) {
    seenKeys.add(s.suggestedKey);
    uniqueTranslations.push({
      key: s.suggestedKey,
      en: s.original,
      pt: s.original
    });
  }
}

const replacements = {
  filePath: data.filePath,
  strings: filteredStrings
};

const translations = {
  translations: uniqueTranslations
};

fs.writeFileSync('scripts/input/batch-replacements.json', JSON.stringify(replacements, null, 2));
fs.writeFileSync('scripts/input/batch-translations-raw.json', JSON.stringify(translations, null, 2));

console.log(`Filtered ${data.strings.length} strings down to ${filteredStrings.length} valid user-facing strings.`);
