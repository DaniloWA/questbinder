---
description: Mandatory i18n workflow - every UI text must have translation keys in both PT-BR and EN-US
---

# Translation Workflow

> **THIS RULE IS NON-NEGOTIABLE.** Every UI text must be translated.

---

## 🚀 Automated Workflow (Preferred)

For migrating existing components or adding multiple strings, use the automation scripts to ensure consistency.

### Step 1: Extraction
Run the script to find hardcoded strings and generate suggested keys.
```bash
npx ts-node scripts/extract-strings.ts --file src/components/vtt/MyComponent.tsx
```
*   **Result:** Creates `scripts/output/strings-output.json`.
*   **What it does:** Filters out technical code (Tailwind, props) and keeps only user-facing text.

### Step 2: Preparation (The Bridge)
The output from Step 1 is just a report. You must prepare the **Input** for the injection script.
1.  Open `scripts/output/strings-output.json`.
2.  Create/Open `scripts/input/translations-input.json`.
3.  Copy the strings you want to translate and add the Portuguese (`pt`) and English (`en`) values.

**Format (`scripts/input/translations-input.json`):**
```json
{
  "translations": [
    {
      "key": "vtt.myModule.myComponent.button.label",
      "pt": "Salvar",
      "en": "Save"
    },
    {
      "key": "vtt.myModule.myComponent.alert.text",
      "pt": "Erro ao salvar!",
      "en": "Error saving!"
    }
  ]
}
```

### Step 3: Injection
Run the script to insert these keys into both locale files safely.
```bash
npx ts-node scripts/inject-translations.ts --input scripts/input/translations-input.json
```
*   **Result:** Updates `src/i18n/locales/pt-BR.ts` and `en-US.ts`.
*   **Safety:** It won't overwrite existing keys unless you pass `--overwrite`.

### Step 4: Code Replacement
Update your component to use the new keys.
```tsx
import { useTranslation } from '@/i18n/TranslationContext'; // or relative path

// Inside component:
const { t } = useTranslation();

// Replace: <button>Salvar</button>
// With:    <button>{t('vtt.myModule.myComponent.button.label')}</button>
```

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
