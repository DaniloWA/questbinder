# 🎨 Guia de Uso: Componentes de UI para Ficha Robusta

## 📦 Componentes Criados

### 1. SaveIndicator
**Arquivo**: `components/ui/SaveIndicator.tsx`

Indicador visual do estado de salvamento com auto-hide.

#### Uso Básico
```tsx
import { SaveIndicator, useSaveIndicator } from '../ui/SaveIndicator';

const MyComponent = () => {
  const { status, setSaving, setSaved, setError } = useSaveIndicator();

  const handleSave = async () => {
    setSaving();
    try {
      await saveData();
      setSaved(); // Auto-hide após 2 segundos
    } catch (err) {
      setError(); // Permanece visível até retry
    }
  };

  return (
    <div>
      <SaveIndicator status={status} onRetry={handleSave} />
    </div>
  );
};
```

#### Estados
- `idle` - Nada sendo salvo (invisível)
- `saving` - Salvando... (spinner azul)
- `saved` - Salvo ✓ (check verde, auto-hide)
- `error` - Erro (X vermelho, botão retry)

---

### 2. PrivacyToggle
**Arquivo**: `components/ui/PrivacyToggle.tsx`

Controle de privacidade de campos com indicador visual.

#### Uso Básico
```tsx
import { PrivacyToggle, PrivateFieldWrapper } from '../ui/PrivacyToggle';

const InventoryField = () => {
  const isPrivate = character.privateFields?.includes('inventory');

  return (
    <PrivateFieldWrapper
      label="Inventário"
      isPrivate={isPrivate}
      onTogglePrivacy={() => toggleFieldPrivacy(character.id, 'inventory')}
    >
      <textarea value={character.inventory} />
    </PrivateFieldWrapper>
  );
};
```

#### Variantes
```tsx
// Apenas o botão
<PrivacyToggle
  isPrivate={isPrivate}
  onToggle={handleToggle}
  size="sm" // sm | md | lg
  showLabel={true} // Mostra "Privado" / "Público"
/>

// Wrapper completo (recomendado)
<PrivateFieldWrapper
  label="Campo"
  isPrivate={isPrivate}
  onTogglePrivacy={handleToggle}
  canToggle={true} // Pode desabilitar o toggle
>
  {/* Seu campo aqui */}
</PrivateFieldWrapper>
```

#### Estilos Visuais
- **Campo Privado**: Borda amarela, fundo amber/5, badge "PRIVADO"
- **Campo Público**: Estilo normal
- **Ícones**: 🔒 Lock (privado) / 👁️ Eye (público)

---

### 3. EditableField
**Arquivo**: `components/ui/EditableField.tsx`

Campo editável com validação em tempo real.

#### Uso Básico
```tsx
import { EditableField, validators } from '../ui/EditableField';

const HPField = () => {
  return (
    <EditableField
      type="number"
      value={character.hpCurrent}
      onChange={(value) => updateCharacter(character.id, { hpCurrent: value })}
      validator={validators.minMax(0, character.hpMax, 'HP inválido')}
      min={0}
      max={character.hpMax}
      selectOnFocus={true} // Seleciona tudo ao focar
    />
  );
};
```

#### Validadores Disponíveis
```tsx
// Obrigatório
validator={validators.required('Campo obrigatório')}

// Min/Max
validator={validators.minMax(1, 20, 'Nível deve estar entre 1 e 20')}

// Positivo
validator={validators.positive('Valor não pode ser negativo')}

// Tamanho máximo
validator={validators.maxLength(100, 'Máximo 100 caracteres')}

// Customizado
validator={validators.custom((value) => {
  if (value > character.hpMax) return 'HP não pode exceder o máximo';
  return null;
})}
```

#### Recursos
- ✅ Validação em tempo real
- ✅ Indicador visual de erro (ícone vermelho)
- ✅ Indicador de sucesso (check verde)
- ✅ Mensagem de erro abaixo do campo
- ✅ Reverte ao valor original se inválido ao perder foco
- ✅ Suporta `text`, `number`, `textarea`

---

## 🎯 Integração na CharacterSheetViewer

### Exemplo Completo: Campo de HP com Tudo

```tsx
import { SaveIndicator, useSaveIndicator } from '../ui/SaveIndicator';
import { PrivateFieldWrapper } from '../ui/PrivacyToggle';
import { EditableField, validators } from '../ui/EditableField';

const HPSection = ({ character, onUpdate, toggleFieldPrivacy }) => {
  const { status, setSaving, setSaved, setError } = useSaveIndicator();
  const isPrivate = character.privateFields?.includes('hpCurrent');

  const handleHPChange = async (value: number) => {
    setSaving();
    try {
      await onUpdate({ hpCurrent: value }, true); // immediate: true
      setSaved();
    } catch (err) {
      setError();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">Pontos de Vida</h3>
        <SaveIndicator status={status} onRetry={() => handleHPChange(character.hpCurrent)} />
      </div>

      <PrivateFieldWrapper
        label="HP Atual"
        isPrivate={isPrivate}
        onTogglePrivacy={() => toggleFieldPrivacy(character.id, 'hpCurrent')}
      >
        <EditableField
          type="number"
          value={character.hpCurrent}
          onChange={handleHPChange}
          validator={validators.minMax(0, character.hpMax, 'HP inválido')}
          min={0}
          max={character.hpMax}
          selectOnFocus={true}
        />
      </PrivateFieldWrapper>
    </div>
  );
};
```

---

## 📋 Campos Recomendados para Privacidade

### Sempre Privados (GM Only)
- `gmNotes` - Notas do Mestre

### Opcionalmente Privados (Jogador Decide)
- ✅ `inventory` - Inventário
- ✅ `currency` - Dinheiro
- ✅ `treasure` - Tesouros
- ✅ `notes` - Notas pessoais
- ✅ `bio` - Biografia
- ✅ `alliesAndOrgs` - Aliados e Organizações
- ✅ `personality` - Personalidade
- ✅ `appearance` - Aparência

### Sempre Públicos (Combate)
- ❌ `hpCurrent` - HP Atual (visível no token)
- ❌ `armorClass` - CA (visível no token)
- ❌ `conditions` - Condições (visível no token)

---

## 🎨 Padrão de Design

### Cores
- **Salvando**: Azul (`text-blue-500`)
- **Salvo**: Verde (`text-green-500`)
- **Erro**: Vermelho (`text-red-500`)
- **Privado**: Amarelo/Amber (`text-amber-500`)
- **Público**: Cinza (`text-zinc-500`)

### Animações
- **Spinner**: `animate-spin` (salvando)
- **Auto-hide**: Fade out após 2 segundos (salvo)
- **Transitions**: `transition-all` em todos os botões

### Acessibilidade
- ✅ Tooltips em todos os botões
- ✅ Títulos descritivos
- ✅ Feedback visual e textual
- ✅ Estados disabled visíveis
- ✅ Cores contrastantes

---

## 🚀 Próximos Passos

1. **Integrar SaveIndicator** em todos os campos editáveis
2. **Adicionar PrivacyToggle** nos campos sensíveis
3. **Substituir inputs** por EditableField com validação
4. **Adicionar atalhos** de teclado (Ctrl+S para salvar)
5. **Implementar histórico** de mudanças expandido
6. **Adicionar confirmação** para mudanças críticas

---

## 💡 Dicas de Performance

### Debounce Automático
Os componentes já usam o sistema de debounce inteligente do `useCharacterActions`:
- Campos críticos (HP, Mana) → Imediato
- Campos normais (Nome, Bio) → 800ms de debounce

### Otimização de Re-renders
```tsx
// Use React.memo para campos que não mudam frequentemente
const MemoizedField = React.memo(EditableField);

// Use useCallback para handlers
const handleChange = useCallback((value) => {
  updateCharacter(id, { field: value });
}, [id]);
```

### Validação Client-Side
Valide ANTES de enviar ao servidor para economizar requisições:
```tsx
validator={validators.custom((value) => {
  if (value < 0) return 'Valor inválido';
  if (value > 999) return 'Valor muito alto';
  return null; // Válido
})}
```
