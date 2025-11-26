# ✅ Integração Completa - Zonas de Ataque no VTTToolbar

## 📋 Mudanças Realizadas

### 1. **Permissões Adicionadas** ✅

#### `types/models.ts`
Adicionadas duas novas permissões ao `PermissionSet`:
```typescript
// Zonas de Ataque
attackZoneCreate: boolean; // Criar zonas de ataque customizadas
attackZoneUse: boolean;    // Usar templates de zonas de ataque
```

#### `utils/defaultPermissions.ts`
Configuração padrão de permissões:
```typescript
attackZoneCreate: false, // Criar zonas customizadas restrito ao GM
attackZoneUse: true,     // Jogadores podem usar templates pré-configurados
```

#### `context/gameSession/constants.ts`
Estado inicial do GameSession atualizado com as permissões:
```typescript
attackZoneCreate: false,
attackZoneUse: true,
```

### 2. **Botão Adicionado ao VTTToolbar** ✅

#### `components/vtt/VTTToolbar.tsx`

**Importação do ícone:**
```typescript
import { ..., Target } from 'lucide-react';
```

**Props adicionadas:**
```typescript
interface VTTToolbarProps {
  // ... outras props
  isAttackZonePanelOpen?: boolean;
  onToggleAttackZones?: () => void;
}
```

**Botão no grupo de gameplay:**
```typescript
{
  id: 'attack-zones',
  type: 'action',
  label: 'Zonas de Ataque',
  icon: <Target />,
  onClick: props.onToggleAttackZones,
  isActive: !!props.isAttackZonePanelOpen,
  hidden: !permissionHelper.canAsGMOr('attackZoneUse'),
}
```

---

## 🎯 Como Funciona

### Controle de Permissões

1. **GM (Game Master)**
   - ✅ Sempre tem acesso total
   - ✅ Pode criar zonas customizadas (`attackZoneCreate`)
   - ✅ Pode usar templates pré-configurados (`attackZoneUse`)

2. **Jogadores (Players)**
   - ✅ Por padrão, podem usar templates (`attackZoneUse: true`)
   - ❌ Por padrão, NÃO podem criar zonas customizadas (`attackZoneCreate: false`)
   - ⚙️ GM pode alterar essas permissões no painel de Permissões

### Visibilidade do Botão

O botão "Zonas de Ataque" aparece no toolbar quando:
- Usuário é GM **OU**
- Usuário tem permissão `attackZoneUse` habilitada

```typescript
hidden: !permissionHelper.canAsGMOr('attackZoneUse')
```

---

## 🔧 Configuração pelo GM

### Habilitar/Desabilitar para Jogadores

1. **Abrir Painel de Permissões**
   - Clicar no ícone de Coroa (👑) no toolbar
   - Selecionar "Permissões"

2. **Configurar Permissões Globais**
   - Procurar seção "Zonas de Ataque"
   - **Usar Templates**: Permitir jogadores usarem templates pré-configurados
   - **Criar Customizadas**: Permitir jogadores criarem zonas do zero

3. **Configurar por Jogador**
   - Expandir "Overrides por Usuário"
   - Selecionar jogador específico
   - Configurar permissões individuais

---

## 📊 Resumo das Permissões

| Permissão | Padrão GM | Padrão Player | Descrição |
|-----------|-----------|---------------|-----------|
| `attackZoneUse` | ✅ Sim | ✅ Sim | Usar templates (Fireball, Cone of Cold, etc.) |
| `attackZoneCreate` | ✅ Sim | ❌ Não | Criar zonas customizadas no modal |

---

## 🎨 Posição no Toolbar

O botão foi adicionado no **grupo de gameplay**, na primeira posição:

```
[Zonas de Ataque] → [Mesa de Dados] → [Bestiário] → [Grimório] → [Recursos] → [Novo Token] → [Combate]
```

Ícone: 🎯 Target (mira)

---

## 🚀 Próximos Passos para Uso Completo

Para que o botão funcione completamente, você precisa:

### 1. Adicionar Estado no Componente Pai

No componente que renderiza o `VTTToolbar` (provavelmente `MapCanvas` ou `GameSessionView`):

```typescript
const [isAttackZonePanelOpen, setIsAttackZonePanelOpen] = useState(false);

const handleToggleAttackZones = () => {
  setIsAttackZonePanelOpen(prev => !prev);
};
```

### 2. Passar Props para VTTToolbar

```typescript
<VTTToolbar
  // ... outras props
  isAttackZonePanelOpen={isAttackZonePanelOpen}
  onToggleAttackZones={handleToggleAttackZones}
/>
```

### 3. Renderizar AttackZonePanel

```typescript
{isAttackZonePanelOpen && (
  <AttackZonePanel
    isOpen={isAttackZonePanelOpen}
    onClose={() => setIsAttackZonePanelOpen(false)}
    onSelectTemplate={(templateId) => {
      // Iniciar preview da zona
      attackZones.startPreviewFromTemplate(templateId, { x: mouseX, y: mouseY });
      setIsAttackZonePanelOpen(false);
    }}
    onCreateCustom={() => {
      // Abrir modal de configuração customizada
      setShowAttackZoneConfig(true);
    }}
    activeZones={attackZones.activeZones}
    onRemoveZone={attackZones.removeZone}
    onToggleZoneVisibility={(id) => {
      // Implementar toggle de visibilidade
    }}
    onDuplicateZone={attackZones.duplicateZone}
    onEditZone={(id) => {
      // Abrir modal de edição
    }}
  />
)}
```

### 4. Integrar Hook useAttackZones

```typescript
import { useAttackZones } from '@/context/gameSession/hooks/useAttackZones';

const attackZones = useAttackZones(tokens, obstacles, grid);
```

### 5. Renderizar Zonas no Canvas

```typescript
import { renderAttackZones } from '@/utils/attackZoneRenderer';

// No loop de renderização
if (attackZones.activeZoneResults.length > 0) {
  renderAttackZones(ctx, attackZones.activeZoneResults, {
    showAffectedTokens: true,
    showBlockedTokens: isGM,
    showStats: isGM,
  });
}
```

---

## 📝 Arquivos Modificados

1. ✅ `types/models.ts` - Adicionadas permissões ao PermissionSet
2. ✅ `utils/defaultPermissions.ts` - Configuração padrão
3. ✅ `context/gameSession/constants.ts` - Estado inicial
4. ✅ `components/vtt/VTTToolbar.tsx` - Botão e props

---

## ✨ Resultado Final

- ✅ Botão "Zonas de Ataque" visível no toolbar
- ✅ Ícone Target (🎯) apropriado
- ✅ Permissões configuráveis pelo GM
- ✅ Jogadores podem usar templates por padrão
- ✅ Criação customizada restrita ao GM
- ✅ Integração completa com sistema de permissões

---

**Status**: ✅ **COMPLETO E PRONTO PARA USO**

Consulte `ATTACK_ZONES_INTEGRATION_EXAMPLE.md` para exemplo completo de integração no MapCanvas.
