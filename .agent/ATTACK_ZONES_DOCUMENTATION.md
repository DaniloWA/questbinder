# Sistema de Zonas de Ataque Inteligentes

## 📋 Visão Geral

O sistema de **Zonas de Ataque Inteligentes** é uma feature robusta e configurável que permite criar áreas de efeito (AoE) que respeitam obstáculos como paredes, portas e janelas. Ideal para magias como Bola de Fogo, Cone de Frio, Raio, etc.

## 🎯 Características Principais

### 1. **Múltiplas Formas**
- **Círculo/Esfera**: Explosões radiais (ex: Bola de Fogo)
- **Cone**: Efeitos direcionais (ex: Cone de Frio, Mãos Flamejantes)
- **Linha**: Raios e relâmpagos (ex: Lightning Bolt)
- **Quadrado/Cubo**: Áreas quadradas (ex: Thunderwave)
- **Retângulo**: Áreas retangulares customizadas
- **Polígono**: Formas completamente customizadas

### 2. **Tipos de Propagação**
- **Bloqueado**: Para completamente em paredes (padrão)
- **Penetrante**: Atravessa todos os obstáculos
- **Espalhamento**: Se espalha ao redor de obstáculos (como Bola de Fogo em D&D 5e)

### 3. **Sistema de Targeting**
- **Todos**: Afeta todos os tokens na área
- **Aliados**: Apenas tokens amigáveis
- **Inimigos**: Apenas tokens hostis
- **Objetos**: Apenas tokens de tipo objeto
- **Custom**: Seleção manual de inclusão/exclusão

### 4. **Cálculo Inteligente**
- Respeita linha de visão (opcional)
- Usa algoritmo de ray-casting para visibilidade
- Calcula área real vs. área teórica
- Identifica tokens bloqueados por obstáculos
- Estatísticas detalhadas (área, alvos, cobertura)

## 🏗️ Arquitetura

### Estrutura de Arquivos

```
types/
  └── attackZone.ts              # Tipos e interfaces

utils/
  ├── attackZoneCalculator.ts    # Lógica de cálculo
  └── attackZoneRenderer.ts      # Renderização no canvas

context/gameSession/hooks/
  └── useAttackZones.ts          # Hook React para gerenciamento

components/vtt/
  ├── AttackZonePanel.tsx        # Painel de seleção
  └── AttackZoneConfigModal.tsx  # Modal de configuração
```

### Fluxo de Dados

```
1. Usuário seleciona template → AttackZonePanel
2. Clica no mapa para posicionar → MapCanvas
3. Sistema calcula área → attackZoneCalculator
4. Renderiza no canvas → attackZoneRenderer
5. Gerencia estado → useAttackZones hook
```

## 🚀 Como Usar

### 1. Integração Básica

```typescript
import { useAttackZones } from '@/context/gameSession/hooks/useAttackZones';
import { renderAttackZones, renderPreviewZone } from '@/utils/attackZoneRenderer';

// No componente
const {
  activeZones,
  previewZone,
  activeZoneResults,
  previewZoneResult,
  startPreviewFromTemplate,
  confirmPreview,
  cancelPreview,
} = useAttackZones(tokens, obstacles, grid);

// Renderizar no canvas
if (activeZoneResults.length > 0) {
  renderAttackZones(ctx, activeZoneResults, {
    showAffectedTokens: true,
    showBlockedTokens: true,
    showStats: true,
  });
}

if (previewZoneResult) {
  renderPreviewZone(ctx, previewZoneResult, {
    showAffectedTokens: true,
    showStats: true,
  });
}
```

### 2. Criar Zona a Partir de Template

```typescript
// Iniciar preview
startPreviewFromTemplate('fireball', { x: 500, y: 300 });

// Atualizar preview (ex: mudar direção)
updatePreview({ direction: Math.PI / 4 });

// Confirmar
confirmPreview();

// Ou cancelar
cancelPreview();
```

### 3. Criar Zona Customizada

```typescript
const customZone = createCustomZone({
  name: 'Explosão Mágica',
  shape: 'circle',
  radius: 5,
  origin: { x: 400, y: 400 },
  propagation: 'spreading',
  respectsVision: true,
  targeting: 'enemies',
  color: 'rgba(138, 43, 226, 0.4)',
  damageFormula: '10d6',
  damageType: 'force',
  saveType: 'dex',
  saveDC: 18,
});

addZone(customZone);
```

### 4. Manipular Zonas

```typescript
// Mover zona
moveZone(zoneId, { x: 600, y: 400 });

// Rotacionar (para cones/linhas)
rotateZone(zoneId, Math.PI / 2);

// Duplicar
duplicateZone(zoneId, { x: 700, y: 400 });

// Remover
removeZone(zoneId);

// Limpar todas
clearZones();
```

### 5. Consultar Informações

```typescript
// Todos os tokens afetados
const affectedTokens = getAllAffectedTokens();

// Verificar se token está em zona
const isAffected = isTokenInZone(tokenId);

// Estatísticas agregadas
const stats = getAggregatedStats();
// {
//   totalZones: 2,
//   totalTokensAffected: 5,
//   totalArea: 1250,
//   totalBlocked: 1,
//   averageCoverage: 87.5
// }
```

## 📐 Templates Pré-configurados

### Bola de Fogo (Fireball)
```typescript
{
  shape: 'circle',
  radius: 4,              // 20 pés
  propagation: 'spreading',
  damageFormula: '8d6',
  damageType: 'fire',
  saveType: 'dex',
  saveDC: 15
}
```

### Cone de Frio (Cone of Cold)
```typescript
{
  shape: 'cone',
  length: 12,             // 60 pés
  width: 12,
  angle: 53,
  propagation: 'blocked',
  respectsVision: true,
  damageFormula: '8d8',
  damageType: 'cold',
  saveType: 'con',
  saveDC: 17
}
```

### Raio (Lightning Bolt)
```typescript
{
  shape: 'line',
  length: 20,             // 100 pés
  width: 1,
  propagation: 'blocked',
  respectsVision: true,
  damageFormula: '8d6',
  damageType: 'lightning',
  saveType: 'dex',
  saveDC: 15
}
```

## 🎨 Customização Visual

### Cores e Opacidade

```typescript
updateZone(zoneId, {
  color: 'rgba(255, 100, 0, 0.4)',
  opacity: 0.4,
  borderColor: 'rgba(255, 50, 0, 0.8)',
  borderWidth: 3,
  showAffectedTokens: true,
  affectedTokenColor: 'rgba(0, 255, 0, 0.6)',
});
```

### Renderização Customizada

```typescript
// Renderizar com opções específicas
renderAttackZone(ctx, zoneResult, {
  showAffectedTokens: true,
  showBlockedTokens: false,
  showStats: true,
  isPreview: false,
});

// Renderizar grid de alcance
renderRangeGrid(ctx, origin, 10, gridSize, 'rgba(255, 255, 255, 0.2)');

// Renderizar indicadores de ângulo (para cones)
renderAngleIndicators(ctx, origin, direction, angle, radius);
```

## 🔧 Configuração Avançada

### Inclusão/Exclusão Manual de Tokens

```typescript
const zone = createCustomZone({
  // ... outras configs
  targeting: 'custom',
  includeTokenIds: ['token-123', 'token-456'], // Forçar inclusão
  excludeTokenIds: ['token-789'],              // Forçar exclusão
});
```

### Validação de Alcance

```typescript
const zone = createCustomZone({
  // ... outras configs
  maxRange: 30, // Máximo 30 quadrados da origem
});
```

### Efeitos e Metadados

```typescript
const zone = createCustomZone({
  // ... outras configs
  damageFormula: '8d6',
  damageType: 'fire',
  saveType: 'dex',
  saveDC: 15,
  effectIds: ['burning', 'frightened'], // IDs de efeitos a aplicar
});
```

## 🎮 Integração com MapCanvas

### Adicionar ao MapCanvas.tsx

```typescript
// No componente MapCanvas
import { useAttackZones } from '@/context/gameSession/hooks/useAttackZones';
import { renderAttackZones, renderPreviewZone } from '@/utils/attackZoneRenderer';

// Dentro do componente
const attackZones = useAttackZones(tokens, scene?.obstacles || [], scene?.grid || defaultGrid);

// No método render(), após renderizar tokens
if (attackZones.activeZoneResults.length > 0) {
  renderAttackZones(ctx, attackZones.activeZoneResults, {
    showAffectedTokens: true,
    showBlockedTokens: true,
    showStats: isGM,
  });
}

if (attackZones.previewZoneResult) {
  renderPreviewZone(ctx, attackZones.previewZoneResult, {
    showAffectedTokens: true,
    showStats: true,
  });
}
```

### Adicionar Ferramenta ao Toolbar

```typescript
// Em VTTToolbar.tsx
<button
  onClick={() => setShowAttackZonePanel(true)}
  className="toolbar-button"
  title="Zonas de Ataque"
>
  <Target className="w-5 h-5" />
</button>

{showAttackZonePanel && (
  <AttackZonePanel
    isOpen={showAttackZonePanel}
    onClose={() => setShowAttackZonePanel(false)}
    onSelectTemplate={(id) => {
      attackZones.startPreviewFromTemplate(id, { x: mouseX, y: mouseY });
      setShowAttackZonePanel(false);
    }}
    onCreateCustom={() => {
      setShowConfigModal(true);
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

## 📊 Performance

### Otimizações Implementadas

1. **Bounding Box Check**: Filtra obstáculos fora do alcance antes de calcular
2. **Memoização**: Resultados são memoizados no hook
3. **Amostragem Adaptativa**: Mais pontos para áreas maiores
4. **Limite de Iterações**: Previne travamento em mapas complexos

### Recomendações

- Limite zonas ativas a 5-10 simultaneamente
- Use `respectsVision: false` quando possível para melhor performance
- Evite polígonos customizados com mais de 50 pontos

## 🐛 Troubleshooting

### Zona não aparece
- Verifique se `affectedArea` tem pelo menos 3 pontos
- Confirme que a origem está dentro dos limites do mapa
- Verifique se a cor tem opacidade > 0

### Tokens não são detectados
- Confirme que `targeting` está correto
- Verifique se tokens têm `disposition` definida
- Confirme que tokens não estão em `excludeTokenIds`

### Performance ruim
- Reduza número de zonas ativas
- Desative `respectsVision` se não necessário
- Simplifique obstáculos complexos

## 🔮 Próximas Melhorias

- [ ] Suporte a animações de expansão
- [ ] Integração com sistema de combate
- [ ] Aplicação automática de dano/efeitos
- [ ] Templates salvos por campanha
- [ ] Importação de magias do compêndio
- [ ] Histórico de zonas usadas
- [ ] Compartilhamento de templates entre GMs

## 📝 Licença

Este sistema segue os padrões e licença do projeto QuestBinder.
