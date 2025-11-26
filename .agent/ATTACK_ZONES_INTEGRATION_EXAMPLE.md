# Exemplo de Integração - Zonas de Ataque no MapCanvas

## Passo 1: Importações

Adicione as seguintes importações no topo do `MapCanvas.tsx`:

```typescript
import { useAttackZones } from '../../context/gameSession/hooks/useAttackZones';
import { renderAttackZones, renderPreviewZone } from '../../utils/attackZoneRenderer';
import { AttackZonePanel } from './AttackZonePanel';
import { AttackZoneConfigModal } from './AttackZoneConfigModal';
```

## Passo 2: Estado do Componente

Adicione os seguintes estados ao componente MapCanvas:

```typescript
const [showAttackZonePanel, setShowAttackZonePanel] = useState(false);
const [showAttackZoneConfig, setShowAttackZoneConfig] = useState(false);
const [attackZoneMode, setAttackZoneMode] = useState<'select' | 'place' | null>(null);
```

## Passo 3: Inicializar Hook

Dentro do componente MapCanvas, após os outros hooks:

```typescript
const attackZones = useAttackZones(
  tokens,
  scene?.obstacles || [],
  scene?.grid || { size: 60, color: '#ffffff', alpha: 0.3, cols: 50, rows: 50, unitsPerSquare: 5 }
);
```

## Passo 4: Adicionar ao Render Loop

No método `render()`, após renderizar tokens mas antes de renderizar fog of war:

```typescript
// Renderizar zonas de ataque ativas
if (attackZones.activeZoneResults.length > 0) {
  renderAttackZones(ctx, attackZones.activeZoneResults, {
    showAffectedTokens: true,
    showBlockedTokens: isGM,
    showStats: isGM,
  });
}

// Renderizar zona de preview
if (attackZones.previewZoneResult && attackZoneMode === 'place') {
  renderPreviewZone(ctx, attackZones.previewZoneResult, {
    showAffectedTokens: true,
    showBlockedTokens: true,
    showStats: true,
  });
}
```

## Passo 5: Handler de Clique para Posicionar

Adicione ao `handleMouseDown`:

```typescript
// No início do handleMouseDown
if (attackZoneMode === 'place' && attackZones.previewZone) {
  const { x: worldX, y: worldY } = screenToWorld(screenX, screenY);
  
  // Atualizar origem da zona de preview
  attackZones.updatePreview({ origin: { x: worldX, y: worldY } });
  
  // Confirmar zona no clique
  if (e.button === 0) { // Left click
    attackZones.confirmPreview();
    setAttackZoneMode(null);
    return;
  }
  
  // Cancelar no clique direito
  if (e.button === 2) { // Right click
    attackZones.cancelPreview();
    setAttackZoneMode(null);
    return;
  }
}
```

## Passo 6: Handler de Movimento para Preview

Adicione ao `handleMouseMove`:

```typescript
// Atualizar preview de zona ao mover mouse
if (attackZoneMode === 'place' && attackZones.previewZone) {
  const { x: worldX, y: worldY } = screenToWorld(screenX, screenY);
  attackZones.updatePreview({ origin: { x: worldX, y: worldY } });
}
```

## Passo 7: Rotação de Zonas (Cones/Linhas)

Adicione handler de teclas para rotação:

```typescript
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (attackZoneMode === 'place' && attackZones.previewZone) {
      const zone = attackZones.previewZone;
      
      // Rotacionar com Q/E
      if (e.key === 'q' || e.key === 'Q') {
        const newDirection = (zone.direction || 0) - Math.PI / 12; // -15 graus
        attackZones.updatePreview({ direction: newDirection });
      }
      
      if (e.key === 'e' || e.key === 'E') {
        const newDirection = (zone.direction || 0) + Math.PI / 12; // +15 graus
        attackZones.updatePreview({ direction: newDirection });
      }
      
      // Cancelar com ESC
      if (e.key === 'Escape') {
        attackZones.cancelPreview();
        setAttackZoneMode(null);
      }
      
      // Confirmar com ENTER
      if (e.key === 'Enter') {
        attackZones.confirmPreview();
        setAttackZoneMode(null);
      }
    }
  };

  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, [attackZoneMode, attackZones]);
```

## Passo 8: Renderizar Painéis

No JSX do componente, antes do fechamento:

```typescript
{/* Painel de Zonas de Ataque */}
{showAttackZonePanel && (
  <AttackZonePanel
    isOpen={showAttackZonePanel}
    onClose={() => setShowAttackZonePanel(false)}
    onSelectTemplate={(templateId) => {
      const { x: worldX, y: worldY } = screenToWorld(lastMouseX, lastMouseY);
      attackZones.startPreviewFromTemplate(templateId, { x: worldX, y: worldY });
      setAttackZoneMode('place');
      setShowAttackZonePanel(false);
    }}
    onCreateCustom={() => {
      setShowAttackZoneConfig(true);
      setShowAttackZonePanel(false);
    }}
    activeZones={attackZones.activeZones}
    onRemoveZone={attackZones.removeZone}
    onToggleZoneVisibility={(zoneId) => {
      // Implementar toggle de visibilidade se necessário
      console.log('Toggle visibility:', zoneId);
    }}
    onDuplicateZone={(zoneId) => {
      const { x: worldX, y: worldY } = screenToWorld(lastMouseX, lastMouseY);
      attackZones.duplicateZone(zoneId, { x: worldX, y: worldY });
    }}
    onEditZone={(zoneId) => {
      // Implementar edição se necessário
      console.log('Edit zone:', zoneId);
    }}
  />
)}

{/* Modal de Configuração */}
{showAttackZoneConfig && (
  <AttackZoneConfigModal
    isOpen={showAttackZoneConfig}
    onClose={() => setShowAttackZoneConfig(false)}
    onSave={(config) => {
      const { x: worldX, y: worldY } = screenToWorld(lastMouseX, lastMouseY);
      const zone = attackZones.createCustomZone({
        ...config,
        origin: { x: worldX, y: worldY },
      });
      attackZones.addZone(zone);
      setShowAttackZoneConfig(false);
    }}
  />
)}

{/* Indicador de Modo */}
{attackZoneMode === 'place' && (
  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg shadow-lg z-50">
    <div className="text-sm font-medium">Posicionando Zona de Ataque</div>
    <div className="text-xs text-zinc-400 mt-1">
      <kbd className="px-1 py-0.5 bg-zinc-700 rounded">Q/E</kbd> Rotacionar • 
      <kbd className="px-1 py-0.5 bg-zinc-700 rounded ml-1">Clique</kbd> Confirmar • 
      <kbd className="px-1 py-0.5 bg-zinc-700 rounded ml-1">ESC</kbd> Cancelar
    </div>
  </div>
)}
```

## Passo 9: Adicionar Botão ao Toolbar

No `VTTToolbar.tsx`, adicione o botão:

```typescript
{isGM && (
  <button
    onClick={() => setShowAttackZonePanel(true)}
    className={`p-2 rounded-lg transition-all ${
      showAttackZonePanel
        ? 'bg-red-500 text-white'
        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
    }`}
    title="Zonas de Ataque"
  >
    <Target className="w-5 h-5" />
  </button>
)}
```

## Passo 10: Passar Props do GameSession

No `GameSessionContext.tsx`, adicione ao provider:

```typescript
// Exportar função para abrir painel
const openAttackZonePanel = () => {
  // Implementar lógica para abrir painel
};

// Adicionar ao value do provider
return (
  <GameSessionContext.Provider
    value={{
      // ... outros valores
      openAttackZonePanel,
    }}
  >
    {children}
  </GameSessionContext.Provider>
);
```

## Exemplo Completo de Uso

```typescript
// 1. Usuário clica no botão "Zonas de Ataque" no toolbar
// 2. AttackZonePanel abre mostrando templates
// 3. Usuário seleciona "Bola de Fogo"
// 4. Preview da zona aparece seguindo o mouse
// 5. Usuário clica no mapa para posicionar
// 6. Zona é confirmada e renderizada
// 7. Tokens afetados são destacados
// 8. Estatísticas aparecem (se GM)

// Para aplicar dano aos tokens afetados:
const applyDamageToZone = (zoneId: string) => {
  const zone = attackZones.activeZones.find(z => z.id === zoneId);
  if (!zone) return;

  const result = attackZones.calculateZone(zone);
  
  result.validTargets.forEach(token => {
    // Aplicar dano ao token
    console.log(`Aplicar ${zone.damageFormula} de dano ${zone.damageType} ao token ${token.name}`);
    
    // Se tem saving throw
    if (zone.saveType && zone.saveDC) {
      console.log(`Token deve fazer saving throw de ${zone.saveType} DC ${zone.saveDC}`);
    }
  });
};
```

## Atalhos de Teclado Sugeridos

- `A` - Abrir painel de zonas de ataque
- `Q` - Rotacionar zona no sentido anti-horário
- `E` - Rotacionar zona no sentido horário
- `Enter` - Confirmar posicionamento
- `ESC` - Cancelar posicionamento
- `Delete` - Remover zona selecionada
- `Ctrl+D` - Duplicar zona selecionada

## Integração com Sistema de Combate

```typescript
// Quando aplicar efeito de zona durante combate
const applyZoneEffectInCombat = (zoneId: string) => {
  const zone = attackZones.activeZones.find(z => z.id === zoneId);
  if (!zone) return;

  const result = attackZones.calculateZone(zone);
  
  // Criar ação de combate
  const combatAction: CombatAction = {
    id: `action_${Date.now()}`,
    timestamp: Date.now(),
    round: combat.round,
    turn: combat.activeTurnIndex,
    combatantId: currentCombatant.id,
    combatantName: currentCombatant.name,
    type: 'damage',
    description: `${zone.name} - ${result.validTargets.length} alvos afetados`,
    value: 0, // Será calculado por token
  };

  // Adicionar ao histórico de combate
  addCombatAction(combatAction);

  // Aplicar a cada token
  result.validTargets.forEach(token => {
    // Rolar dano
    const damageRoll = rollDice(zone.damageFormula || '1d6');
    
    // Aplicar ao token
    updateTokenHP(token.id, -damageRoll.total);
    
    // Log no chat
    sendChatMessage({
      content: `${token.name} recebeu ${damageRoll.total} de dano ${zone.damageType}`,
      type: 'system',
    });
  });

  // Remover zona após aplicar (opcional)
  attackZones.removeZone(zoneId);
};
```
