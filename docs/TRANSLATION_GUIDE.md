# Translation Guide for Developers

> **REGRA OBRIGATÓRIA:** Todo texto de interface DEVE usar o sistema de tradução.

---

## Quick Start

```tsx
import { useTranslation } from '@/i18n/TranslationContext';

function MyComponent() {
  const { t } = useTranslation();
  
  return <button>{t('common.actions.save.label')}</button>;
}
```

---

## Estrutura das Keys (7 Níveis)

```
{app}.{module}.{view}.{component}.{element}.{contentType}.{variant}
```

### Exemplo Completo:

```
vtt.combat.sidebar.initiativeList.emptyState.message.noTokens
│   │      │       │              │          │       └─ Variant
│   │      │       │              │          └─ ContentType
│   │      │       │              └─ Element
│   │      │       └─ Component
│   │      └─ View
│   └─ Module
└─ App
```

---

## Content Types

| Tipo | Uso | Exemplo |
|------|-----|---------|
| `label` | Texto de botões, labels | `saveButton.label` |
| `tooltip` | Tooltips de hover | `deleteButton.tooltip` |
| `placeholder` | Placeholders de inputs | `nameField.placeholder` |
| `title` | Títulos de modais/seções | `editModal.header.title` |
| `description` | Textos explicativos | `feature.description` |
| `errorMessage` | Mensagens de erro | `validation.errorMessage` |
| `successMessage` | Confirmações de sucesso | `save.successMessage` |
| `confirmPrompt` | Diálogos de confirmação | `delete.confirmPrompt` |
| `ariaLabel` | Labels de acessibilidade | `closeButton.ariaLabel` |

---

## Como Adicionar Novas Traduções

### 1. Identifique a Key

Onde está o componente?
- **App:** `vtt` (VTT principal)
- **Module:** `tokens` (funcionalidade de tokens)
- **View:** `editModal` (modal de edição)
- **Component:** `saveButton` (botão de salvar)
- **ContentType:** `label` (texto do botão)

**Key final:** `vtt.tokens.editModal.saveButton.label`

### 2. Adicione em `pt-BR.ts`

```typescript
// client/src/i18n/locales/pt-BR.ts
export default {
  vtt: {
    tokens: {
      editModal: {
        saveButton: {
          label: 'Salvar',
        },
      },
    },
  },
} as const;
```

### 3. Adicione em `en-US.ts`

```typescript
// client/src/i18n/locales/en-US.ts
export default {
  vtt: {
    tokens: {
      editModal: {
        saveButton: {
          label: 'Save',
        },
      },
    },
  },
} as const;
```

### 4. Use no Componente

```tsx
const { t } = useTranslation();

<button>{t('vtt.tokens.editModal.saveButton.label')}</button>
```

---

## Pluralização

Use a sintaxe de choice do Laravel:

```typescript
// pt-BR.ts
items: '{0} Nenhum item|{1} :count item|[2,*] :count itens'

// en-US.ts
items: '{0} No items|{1} :count item|[2,*] :count items'
```

**Uso:**
```tsx
t('common.plurals.items', { count: 5 }) // "5 itens"
```

---

## Interpolação

Use `:placeholder`:

```typescript
// pt-BR.ts
welcome: 'Bem-vindo, :name!'

// en-US.ts
welcome: 'Welcome, :name!'
```

**Uso:**
```tsx
t('common.welcome', { name: 'João' }) // "Bem-vindo, João!"
```

---

## ❌ O Que NÃO Fazer

```tsx
// ❌ ERRADO: Texto hardcoded
<button>Salvar</button>

// ❌ ERRADO: Key sem hierarquia
t('save')

// ❌ ERRADO: Key abreviada
t('btn.save')

// ❌ ERRADO: Só adicionou PT-BR (esqueceu EN-US)
```

## ✅ O Que Fazer

```tsx
// ✅ CORRETO: Usando t()
<button>{t('vtt.tokens.editModal.saveButton.label')}</button>

// ✅ CORRETO: Key com hierarquia completa
t('vtt.tokens.editModal.saveButton.label')

// ✅ CORRETO: Adicionou em AMBOS os arquivos
```

---

## Debug

No console do navegador (dev mode):

```javascript
// Ver todas as keys disponíveis
window.__i18n.getAllKeys()

// Ver keys faltando (que foram usadas mas não existem)
window.__i18n.getMissingKeys()

// Mudar idioma
window.__i18n.setLocale('en-US')
```

---

## Checklist de PR

Antes de abrir um PR, verifique:

- [ ] Nenhum texto hardcoded em JSX/TSX
- [ ] Todas as keys seguem hierarquia de 7 níveis
- [ ] Tradução PT-BR adicionada
- [ ] Tradução EN-US adicionada
- [ ] Keys são descritivas (não abreviadas)
- [ ] ContentType correto (`label`, `tooltip`, etc.)
