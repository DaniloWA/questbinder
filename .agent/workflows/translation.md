---
description: Mandatory i18n workflow - every UI text must have translation keys in both PT-BR and EN-US
---

# Translation Workflow (MANDATORY)

> **THIS RULE IS NON-NEGOTIABLE.** Every UI text must be translated.

## When Creating ANY UI Text

Whenever you create, modify, or add any user-facing text in the codebase, you MUST:

### Step 1: Create the Translation Key

Follow the 7-level hierarchy:
```
{app}.{module}.{view}.{component}.{element}.{contentType}.{variant}
```

Example for a save button in token edit modal:
```
vtt.tokens.editModal.saveButton.label
```

### Step 2: Add to BOTH Locale Files

**ALWAYS update both files simultaneously:**

1. `client/src/i18n/locales/pt-BR.ts`
2. `client/src/i18n/locales/en-US.ts`

### Step 3: Use the Translation in Code

```tsx
import { useTranslation } from '@/i18n/TranslationContext';

const { t } = useTranslation();

// ❌ NEVER do this:
<button>Salvar</button>

// ✅ ALWAYS do this:
<button>{t('vtt.tokens.editModal.saveButton.label')}</button>
```

---

## Key Naming Rules

| Level | Example |
|-------|---------|
| App | `vtt`, `dashboard`, `auth` |
| Module | `tokens`, `combat`, `maps` |
| View | `editModal`, `sidebar`, `toolbar` |
| Component | `saveButton`, `nameField`, `header` |
| Element | (same as component for simple cases) |
| ContentType | `label`, `tooltip`, `placeholder`, `errorMessage` |
| Variant | `loading`, `success`, `error` (optional) |

---

## Content Types Reference

| Type | Use For |
|------|---------|
| `label` | Button text, static labels |
| `tooltip` | Hover tooltips |
| `placeholder` | Input placeholders |
| `title` | Modal/section titles |
| `description` | Explanatory text |
| `errorMessage` | Validation/error messages |
| `successMessage` | Success confirmations |
| `confirmPrompt` | Confirmation dialogs |

---

## Example: Adding a New Button

**Scenario:** Adding a "Delete Token" button with confirmation.

### 1. Define the keys:
```
vtt.tokens.editModal.deleteButton.label
vtt.tokens.editModal.deleteButton.tooltip
vtt.tokens.editModal.deleteButton.confirmPrompt
```

### 2. Add to pt-BR.ts:
```typescript
vtt: {
  tokens: {
    editModal: {
      deleteButton: {
        label: 'Excluir',
        tooltip: 'Excluir este token permanentemente',
        confirmPrompt: 'Tem certeza que deseja excluir este token?',
      },
    },
  },
},
```

### 3. Add to en-US.ts:
```typescript
vtt: {
  tokens: {
    editModal: {
      deleteButton: {
        label: 'Delete',
        tooltip: 'Delete this token permanently',
        confirmPrompt: 'Are you sure you want to delete this token?',
      },
    },
  },
},
```

### 4. Use in component:
```tsx
<button title={t('vtt.tokens.editModal.deleteButton.tooltip')}>
  {t('vtt.tokens.editModal.deleteButton.label')}
</button>

// Confirmation:
if (confirm(t('vtt.tokens.editModal.deleteButton.confirmPrompt'))) {
  // delete...
}
```

---

## Checklist Before Committing

- [ ] All new UI text uses `t('key')` function
- [ ] Keys follow 7-level hierarchy
- [ ] PT-BR translation added
- [ ] EN-US translation added
- [ ] No hardcoded strings in JSX/TSX
