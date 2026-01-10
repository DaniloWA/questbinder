---
description: Mandatory i18n workflow - every UI text must have translation keys in both PT-BR and EN-US
---

# Translation Workflow

> **THIS RULE IS NON-NEGOTIABLE.** Every UI text must be translated.

---

## 🚀 Automated Workflow (Preferred)

For migrating existing components or adding multiple strings, use the automation scripts to ensure consistency and speed.

### Step 1: Extraction
Run the script to find hardcoded strings and generate suggested keys.
```bash
npx ts-node scripts/extract-strings.ts --file src/components/vtt/MyComponent.tsx
```
*   **Result:** Creates `scripts/output/strings-output.json`.
*   **What it does:** Filters out technical code (Tailwind, props) and keeps only user-facing text.

### Step 2: Batch Preparation
Filter the results and prepare the input files automatically.
```bash
npx ts-node scripts/prepare-batch.ts
```
*   **Result:** Creates:
    *   `scripts/input/batch-translations-raw.json`: A list of unique strings found, ready for translation.
    *   `scripts/input/batch-replacements.json`: Detailed locations of strings for the replacement script.
*   **What it does:** Applies advanced filters to remove common internal strings (e.g., specific IDs, code keywords) and deduplicates the list for translation.

### Step 3: Manual Translation
1.  Open `scripts/input/batch-translations-raw.json`.
2.  Rename it to `scripts/input/batch-translations.json` (or just edit a new file with that name).
3.  Fill in the Portuguese (`pt`) and English (`en`) values for each key.
    *   *Tip:* The `key` and `en` fields are pre-filled with suggested values.

**Format (`scripts/input/batch-translations.json`):**
```json
{
  "translations": [
    {
      "key": "vtt.myModule.myComponent.button.label",
      "pt": "Salvar",
      "en": "Save"
    }
  ]
}
```

### Step 4: Injection
Run the script to insert these keys into both locale files safely.
```bash
npx ts-node scripts/inject-translations.ts --input scripts/input/batch-translations.json
```
*   **Result:** Updates `src/i18n/locales/pt-BR.ts` and `en-US.ts`.
*   **Safety:** It won't overwrite existing keys unless you pass `--overwrite`.

### Step 5: Code Replacement
Run the script to automatically replace the strings in your component code.
```bash
npx ts-node scripts/apply-translations.ts --input scripts/input/batch-replacements.json
```
*   **Result:** Modifies `src/components/vtt/MyComponent.tsx` (or whatever file provided in Step 1).
*   **What it does:**
    *   Replaces hardcoded strings with `{t('key')}` or `t('key')` depending on context (JSX vs Props).
    *   Injects `import { useTranslation } from ...` if missing.
    *   Injects `const { t } = useTranslation();` hook if missing.

---

## ✍️ Manual Workflow (Single Strings)

For quick fixes or when creating new UI from scratch.

### Step 1: Create the Translation Key
Follow the 7-level hierarchy: `{app}.{module}.{view}.{component}.{element}.{contentType}.{variant}`
Ex: `vtt.tokens.editModal.saveButton.label`

### Step 2: Add to BOTH Locale Files
**ALWAYS update both files simultaneously:**
1.  `client/src/i18n/locales/pt-BR.ts`
2.  `client/src/i18n/locales/en-US.ts`

### Step 3: Use the Translation in Code
```tsx
const { t } = useTranslation();
<button>{t('vtt.tokens.editModal.saveButton.label')}</button>
```

---

## 📚 Reference

### Key Naming Rules
| Level | Example |
|-------|---------|
| App | `vtt`, `dashboard` |
| Module | `tokens`, `combat` |
| View | `editModal`, `sidebar` |
| Component | `saveButton`, `header` |
| ContentType | `label`, `tooltip` |

### Content Types
| Type | Use For |
|------|---------|
| `label` | Button text |
| `tooltip` | Hover text |
| `placeholder` | Inputs |
| `title` | Headings |
| `errorMessage` | Errors |
