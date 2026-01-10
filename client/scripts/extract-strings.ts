/**
 * Extract Strings Script v2.0
 * Extracts hardcoded user-facing strings from React/TypeScript components.
 * 
 * Features:
 * - Smart Tailwind CSS class filtering
 * - 7-level hierarchy key generation following the pattern:
 *   {app}.{module}.{view}.{component}.{element}.{contentType}.{variant}
 * - Context-aware content type detection (label, title, tooltip, etc.)
 * 
 * Usage: npx ts-node scripts/extract-strings.ts --file src/components/vtt/Component.tsx
 */

import * as fs from 'fs';
import * as path from 'path';
import * as parser from '@babel/parser';
import _traverse from '@babel/traverse';

// Handle both ESM and CJS exports
const traverse = (_traverse as any).default || _traverse;

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
  timestamp: string;
  componentName: string;
  totalFound: number;
  userFacingCount: number;
  strings: ExtractedString[];
}

// ====================
// TAILWIND CSS DETECTION
// ====================

// Common Tailwind prefixes and patterns
const tailwindPatterns = [
  // Layout & positioning
  /^(flex|grid|block|inline|hidden|absolute|relative|fixed|sticky)/,
  /^(items|justify|content|place|self)-(start|end|center|between|around|evenly|stretch|baseline)/,
  /^(top|right|bottom|left|inset)-/,
  /^(z|order)-/,

  // Sizing
  /^(w|h|min-w|max-w|min-h|max-h)-/,
  /^(aspect)-/,

  // Spacing
  /^(p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|space|gap)-/,

  // Typography
  /^(text|font|leading|tracking|whitespace|break|truncate)/,
  /^(uppercase|lowercase|capitalize|normal-case)/,
  /^(underline|overline|line-through|no-underline)/,

  // Colors & backgrounds
  /^(bg|text|border|ring|outline|shadow|from|via|to)-/,
  /^(opacity|backdrop)-/,

  // Borders & effects
  /^(rounded|border|divide|ring|outline)-?/,
  /^(blur|brightness|contrast|drop-shadow|grayscale|hue-rotate|invert|saturate|sepia)-?/,

  // Transforms & transitions
  /^(scale|rotate|translate|skew|origin)-/,
  /^(transition|duration|ease|delay|animate)-?/,
  /^(transform|hover:|focus:|active:|disabled:|group-hover:|dark:)/,

  // Flexbox & Grid specifics
  /^(flex-|grow|shrink|basis|col-|row-|auto-)/,
  /^(grid-cols|grid-rows|gap)-/,

  // Misc utilities
  /^(cursor|pointer-events|select|resize|scroll|snap|touch|will-change)-/,
  /^(overflow|object|float|clear)-/,
  /^(visible|invisible|collapse)/,
  /^(sr-only|not-sr-only)/,

  // Arbitrary values
  /^\[.+\]$/,
  /^-?\d+(\.\d+)?(px|em|rem|%|vh|vw|deg|s|ms)?$/,
];

// SVG path patterns
const svgPathPattern = /^M[\d\s.,A-Za-z]+$/;

// Check if a string looks like Tailwind CSS classes
function isTailwindClass(value: string): boolean {
  // Multiple classes separated by spaces
  const classes = value.trim().split(/\s+/);

  // If most classes match Tailwind patterns, it's probably a className
  const tailwindMatches = classes.filter(cls =>
    tailwindPatterns.some(pattern => pattern.test(cls)) ||
    /^[a-z]+-[a-z0-9/-]+$/.test(cls) // generic utility pattern
  );

  // Consider it Tailwind if >50% of classes match patterns
  return tailwindMatches.length / classes.length > 0.5;
}

// ====================
// CONTENT TYPE DETECTION
// ====================

interface AttributeContext {
  name: string | null;
  isJSXAttribute: boolean;
  parentTag: string | null;
}

function detectContentType(value: string, context: string, attrContext: AttributeContext): string {
  const lowerContext = context.toLowerCase();
  const attrName = attrContext.name?.toLowerCase() || '';

  // Based on attribute name
  if (attrName.includes('title') || attrName === 'title') return 'title';
  if (attrName.includes('tooltip') || attrName === 'content') return 'tooltip';
  if (attrName.includes('placeholder')) return 'placeholder';
  if (attrName.includes('label') || attrName === 'aria-label') return 'label';
  if (attrName.includes('error') || attrName.includes('message')) return 'message';
  if (attrName.includes('description') || attrName === 'desc') return 'description';
  if (attrName.includes('alt')) return 'alt';

  // Based on parent tag
  if (attrContext.parentTag) {
    const tag = attrContext.parentTag.toLowerCase();
    if (tag === 'button' || tag.includes('button')) return 'label';
    if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4') return 'title';
    if (tag === 'p' || tag === 'span') return 'text';
    if (tag === 'label') return 'label';
    if (tag === 'input' || tag === 'textarea') return 'placeholder';
  }

  // Based on context patterns
  if (lowerContext.includes('error') || lowerContext.includes('invalid')) return 'errorMessage';
  if (lowerContext.includes('success')) return 'successMessage';
  if (lowerContext.includes('confirm') || lowerContext.includes('are you sure')) return 'confirmPrompt';
  if (lowerContext.includes('tooltip')) return 'tooltip';
  if (lowerContext.includes('placeholder')) return 'placeholder';
  if (lowerContext.includes('title') || lowerContext.includes('heading')) return 'title';

  // Default based on string characteristics
  if (value.length < 20 && !value.includes(' ')) return 'label';
  if (value.endsWith('?')) return 'confirmPrompt';
  if (value.endsWith('!')) return 'message';
  if (value.endsWith(':')) return 'label';

  return 'text';
}

// ====================
// KEY GENERATION
// ====================

function generateHierarchicalKey(
  value: string,
  contentType: string,
  componentName: string,
  attrContext: AttributeContext
): string {
  // Extract component parts from file name
  // e.g., "DiceRoller.tsx" -> ["dice", "roller"]
  const componentParts = componentName
    .replace(/\.(tsx?|jsx?)$/, '')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .toLowerCase()
    .split(' ')
    .filter(Boolean);

  // Determine module from component name or path
  const module = componentParts[0] || 'common';
  const view = componentParts.slice(1).join('') || 'main';

  // Generate element name from the value
  const elementName = value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .map((word, i) => i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  // Build the key: vtt.{module}.{view}.{element}.{contentType}
  const parts = ['vtt', module, view];

  if (elementName) {
    parts.push(elementName);
  }

  parts.push(contentType);

  return parts.join('.');
}

// ====================
// STRING VALIDATION
// ====================

// Patterns that indicate non-user-facing strings
const excludePatterns = [
  // Paths and URLs
  /^\.\.?\//,
  /^@\//,
  /^https?:\/\//,
  /^mailto:/,

  // Pure technical values
  /^#[0-9a-fA-F]{3,8}$/,           // Hex colors
  /^rgba?\([^)]+\)$/,              // RGB colors
  /^hsla?\([^)]+\)$/,              // HSL colors
  /^-?\d+(\.\d+)?(px|em|rem|%|vh|vw|deg|s|ms|fr)?$/, // CSS values

  // Code-like patterns (require underscore for constants, exclude single Portuguese words)
  /^[A-Z][A-Z0-9]*_[A-Z0-9_]+$/,    // Constants like "API_KEY" (must have underscore)
  /^[a-z]+[A-Z][a-zA-Z]+$/,         // camelCase identifiers
  /^(true|false|null|undefined)$/i,
  /^(on|off|yes|no)$/i,             // Boolean strings

  // Common non-translatable
  /^[a-z]+:\/\//,                   // Protocol prefixes
  /^\d{4}-\d{2}-\d{2}/,             // Dates
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, // Emails

  // JSX/React internals
  /^(id|key|ref|className|style)$/,
  /^data-/,
  /^aria-/,

  // Component names (PascalCase with multiple capitals, e.g. DiceRoller, not Vantagem)
  /^[A-Z][a-z]+[A-Z][a-zA-Z]*$/,    // PascalCase with at least 2 capitals
  /^use[A-Z]/,                      // React hooks

  // Common enum/prop values (NOT user-facing text)
  /^(normal|primary|secondary|tertiary|default|none|auto|inherit)$/i,
  /^(public|private|protected|gm|dm|player|admin|user|guest)$/i,
  /^(advantage|disadvantage|neutral)$/i,
  /^(small|medium|large|xs|sm|md|lg|xl|xxl|2xl|3xl)$/i,
  /^(top|right|bottom|left|center|start|end)$/i,
  /^(success|error|warning|info|danger|loading)$/i,
  /^(horizontal|vertical|row|column)$/i,
  /^(open|closed|active|inactive|disabled|enabled)$/i,
  /^(round|square|circle|pill|rounded)$/i,
  /^(solid|dashed|dotted|outline|ghost|link)$/i,
  /^(asc|desc|ascending|descending)$/i,
  /^(total|partial|full|empty)$/i,

  // DOM events
  /^(mousedown|mouseup|mousemove|mouseover|mouseout|mouseenter|mouseleave)$/i,
  /^(click|dblclick|contextmenu|wheel|scroll)$/i,
  /^(keydown|keyup|keypress|input|change|blur|focus|submit)$/i,
  /^(drag|dragstart|dragend|dragover|dragleave|dragenter|drop)$/i,
  /^(touchstart|touchend|touchmove|touchcancel)$/i,
  /^(load|unload|resize|beforeunload|error|abort)$/i,

  // Internal message/category types
  /^(message|system|token|compendium|sections|chat|notification)$/i,
  /^(text|image|file|audio|video|document|attachment)$/i,

  // Common technical strings (single lowercase words that are not UI text)
  /^(type|label|value|name|id|key|data|content|item|items|list|array|object)$/i,

  // Console.log/debug messages (prefixed with brackets or contain debug patterns)
  /^\[.+\]/,                        // [DEBUG], [AUDIO], [INFO], etc.

  // Socket/event identifiers (contain colon)
  /^[a-z]+:[a-z]+$/i,               // audio:play, user:connect, etc.

  // Single-word actions/verbs (common in code, not UI)
  /^(start|stop|pause|play|resume|reset|toggle|update|create|delete|remove|add|get|set|fetch|send|emit|save|load|init|destroy)$/i,
  /^(track|sfx|music|audio|sound|loop|volume|mute|unmute)$/i,

  // Button/component variants
  /^(destructive|ghost|outline|link|subtle|alert|confirm)$/i,

  // Tool types
  /^(brush|eraser|hand|select|pointer|pan|zoom|cursor|pen|pencil|marker)$/i,
  /^(smart-wall|smart_wall|smartwall)$/i,

  // CSS units and very short technical terms
  /^(px|pt|em|rem|vw|vh|deg|ms|fr|ch|ex|cm|mm|in)$/i,

  // Very short words (articles, prepositions) that might be JSX fragments
  /^(os|as|de|da|do|em|na|no|ao|um|a|o|e|ou|se|que|por|para)$/i,  // Portuguese
  /^(the|of|to|in|on|at|by|an|or|if|so|be|we|he|it)$/i,  // English
];

function shouldExclude(value: string): boolean {
  // Too short (minimum 3 chars for possible UI text)
  if (value.length < 3) return true;

  // Empty or whitespace
  if (!value.trim()) return true;

  // Check SVG paths
  if (svgPathPattern.test(value)) return true;

  // Check Tailwind classes
  if (isTailwindClass(value)) return true;

  // Check exclude patterns
  if (excludePatterns.some(pattern => pattern.test(value))) return true;

  // Check if it's just numbers and punctuation
  if (/^[\d\s.,;:!?-]+$/.test(value)) return true;

  return false;
}

// Determine confidence level
function getConfidence(value: string, contentType: string, context: string): 'high' | 'medium' | 'low' {
  // High confidence: clearly user-facing
  if (contentType === 'title' || contentType === 'label' || contentType === 'tooltip') {
    return 'high';
  }

  // High confidence: contains spaces and letters (likely a phrase)
  if (value.includes(' ') && /[a-zA-ZÀ-ÿ]{3,}/.test(value)) {
    return 'high';
  }

  // Medium confidence: short but looks like UI text
  if (value.length > 5 && /^[A-ZÀ-ÿ]/.test(value)) {
    return 'medium';
  }

  // Low confidence: uncertain
  return 'low';
}

// ====================
// AST TRAVERSAL HELPERS
// ====================

function getAttributeContext(nodePath: any): AttributeContext {
  let attrName: string | null = null;
  let isJSXAttribute = false;
  let parentTag: string | null = null;

  // Check if we're inside a JSX attribute
  let current = nodePath.parentPath;
  while (current) {
    if (current.isJSXAttribute()) {
      isJSXAttribute = true;
      attrName = current.node.name?.name || null;
    }
    if (current.isJSXOpeningElement()) {
      const nameNode = current.node.name;
      parentTag = nameNode.name || nameNode.object?.name || null;
      break;
    }
    current = current.parentPath;
  }

  return { name: attrName, isJSXAttribute, parentTag };
}

function isInsideTranslationCall(nodePath: any): boolean {
  let current = nodePath.parentPath;
  while (current) {
    if (
      current.isCallExpression() &&
      current.node.callee &&
      ((current.node.callee.type === 'Identifier' && current.node.callee.name === 't') ||
        (current.node.callee.type === 'MemberExpression' &&
          current.node.callee.property.type === 'Identifier' &&
          current.node.callee.property.name === 't'))
    ) {
      return true;
    }
    current = current.parentPath;
  }
  return false;
}

function isInsideClassName(nodePath: any): boolean {
  let current = nodePath.parentPath;
  while (current) {
    if (current.isJSXAttribute()) {
      const attrName = current.node.name?.name;
      if (attrName === 'className' || attrName === 'class' || attrName === 'style') {
        return true;
      }
    }
    if (current.isObjectProperty()) {
      const key = current.node.key;
      if (key.name === 'className' || key.name === 'class' || key.name === 'style') {
        return true;
      }
    }
    current = current.parentPath;
  }
  return false;
}

// ====================
// MAIN EXECUTION
// ====================

// Parse command line arguments
const args = process.argv.slice(2);
const fileIndex = args.indexOf('--file');
if (fileIndex === -1 || !args[fileIndex + 1]) {
  console.error('Usage: npx ts-node scripts/extract-strings.ts --file <path>');
  process.exit(1);
}

const filePath = args[fileIndex + 1];
const absolutePath = path.resolve(process.cwd(), filePath);

if (!fs.existsSync(absolutePath)) {
  console.error(`File not found: ${absolutePath}`);
  process.exit(1);
}

// Read and parse the file
const code = fs.readFileSync(absolutePath, 'utf-8');
const lines = code.split('\n');
const componentName = path.basename(filePath);

const ast = parser.parse(code, {
  sourceType: 'module',
  plugins: ['typescript', 'jsx'],
});

const extractedStrings: ExtractedString[] = [];
const seenStrings = new Set<string>();

function getContext(lineNum: number): string {
  const start = Math.max(0, lineNum - 2);
  const end = Math.min(lines.length, lineNum + 1);
  return lines.slice(start, end).join('\n').trim();
}

function processString(value: string, line: number, nodePath: any) {
  // Skip duplicates
  const key = `${value}:${line}`;
  if (seenStrings.has(key)) return;
  seenStrings.add(key);

  // Skip if excluded
  if (shouldExclude(value)) return;

  // Skip if already translated
  if (isInsideTranslationCall(nodePath)) return;

  // Skip if inside className
  if (isInsideClassName(nodePath)) return;

  const context = getContext(line);
  const attrContext = getAttributeContext(nodePath);
  const contentType = detectContentType(value, context, attrContext);
  const confidence = getConfidence(value, contentType, context);

  extractedStrings.push({
    original: value,
    line,
    context,
    suggestedKey: generateHierarchicalKey(value, contentType, componentName, attrContext),
    contentType,
    confidence,
    start: nodePath.node.start!,
    end: nodePath.node.end!,
  });
}

// Traverse the AST
traverse(ast, {
  StringLiteral(nodePath: any) {
    const { node } = nodePath;
    const value = node.value;
    const line = node.loc?.start.line || 0;

    // Skip import/export statements
    if (nodePath.parentPath.isImportDeclaration() ||
      nodePath.parentPath.isExportDeclaration() ||
      nodePath.parentPath.isImportSpecifier()) {
      return;
    }

    processString(value, line, nodePath);
  },

  TemplateLiteral(nodePath: any) {
    const { node } = nodePath;

    // Only extract static template literals
    if (node.quasis.length === 1 && node.expressions.length === 0) {
      const value = node.quasis[0].value.raw;
      const line = node.loc?.start.line || 0;
      processString(value, line, nodePath);
    }
  },

  JSXText(nodePath: any) {
    const { node } = nodePath;
    const value = node.value.trim();
    const line = node.loc?.start.line || 0;

    if (value) {
      processString(value, line, nodePath);
    }
  },
});

// Sort by line number and filter to high/medium confidence
const sortedStrings = extractedStrings
  .sort((a, b) => a.line - b.line)
  .filter(s => s.confidence !== 'low');

// Prepare output
const result: ExtractionResult = {
  filePath,
  timestamp: new Date().toISOString(),
  componentName,
  totalFound: extractedStrings.length,
  userFacingCount: sortedStrings.length,
  // Sort by reverse index to allow safe replacements from bottom to top
  strings: sortedStrings.sort((a, b) => b.start - a.start),
};

// Ensure output directory exists
const outputDir = path.join(process.cwd(), 'scripts', 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Write output
const outputPath = path.join(outputDir, 'strings-output.json');
fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');

console.log(`\n🔍 Extraction Complete for ${componentName}`);
console.log(`   Total strings found: ${extractedStrings.length}`);
console.log(`   User-facing (high/medium confidence): ${sortedStrings.length}`);
console.log(`   Filtered out: ${extractedStrings.length - sortedStrings.length}`);
console.log(`\n📄 Output: ${outputPath}\n`);
