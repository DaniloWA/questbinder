# 🎯 Sistema de Zonas de Ataque Inteligentes - QuestBinder

## 📦 O que foi criado?

Um sistema completo e robusto para criar e gerenciar zonas de ataque (AoE) que respeitam obstáculos como paredes, portas e janelas.

### Arquivos Criados

```
types/
  └── attackZone.ts                    # Tipos e interfaces + 5 templates D&D 5e

utils/
  ├── attackZoneCalculator.ts          # Motor de cálculo de zonas
  ├── attackZoneRenderer.ts            # Renderização visual
  └── __tests__/
      └── attackZoneCalculator.test.ts # Testes unitários

context/gameSession/hooks/
  └── useAttackZones.ts                # Hook React para gerenciamento

components/vtt/
  ├── AttackZonePanel.tsx              # Painel de seleção de templates
  └── AttackZoneConfigModal.tsx        # Modal de configuração detalhada

.agent/
  ├── ATTACK_ZONES_DOCUMENTATION.md    # Documentação completa
  └── ATTACK_ZONES_INTEGRATION_EXAMPLE.md # Exemplo de integração
```

## ⚡ Quick Start

### 1. Usar em um Componente

```typescript
import { useAttackZones } from '@/context/gameSession/hooks/useAttackZones';

const MyComponent = () => {
  const attackZones = useAttackZones(tokens, obstacles, grid);
  
  // Criar zona de bola de fogo
  attackZones.startPreviewFromTemplate('fireball', { x: 300, y: 300 });
  
  // Confirmar
  attackZones.confirmPreview();
  
  // Ver tokens afetados
  const affected = attackZones.getAllAffectedTokens();
};
```

### 2. Renderizar no Canvas

```typescript
import { renderAttackZones, renderPreviewZone } from '@/utils/attackZoneRenderer';

// No render loop
renderAttackZones(ctx, attackZones.activeZoneResults, {
  showAffectedTokens: true,
  showBlockedTokens: true,
  showStats: true,
});

if (attackZones.previewZoneResult) {
  renderPreviewZone(ctx, attackZones.previewZoneResult);
}
```

## 🎨 Features Principais

### ✅ Formas Suportadas
- **Círculo** - Explosões (Bola de Fogo)
- **Cone** - Efeitos direcionais (Cone de Frio)
- **Linha** - Raios (Lightning Bolt)
- **Quadrado** - Áreas quadradas (Thunderwave)
- **Retângulo** - Áreas customizadas
- **Polígono** - Formas completamente livres

### ✅ Tipos de Propagação
- **Bloqueado** - Para em paredes (padrão)
- **Penetrante** - Atravessa obstáculos
- **Espalhamento** - Contorna obstáculos (Bola de Fogo D&D)

### ✅ Targeting Inteligente
- Todos os tokens
- Apenas aliados
- Apenas inimigos
- Apenas objetos
- Inclusão/exclusão manual

### ✅ Cálculos Avançados
- Respeita linha de visão
- Usa ray-casting para visibilidade
- Detecta tokens bloqueados
- Calcula área real vs teórica
- Estatísticas detalhadas

### ✅ Templates Pré-configurados
- Bola de Fogo (Fireball)
- Cone de Frio (Cone of Cold)
- Raio (Lightning Bolt)
- Mãos Flamejantes (Burning Hands)
- Onda Trovejante (Thunderwave)

## 🔧 API Rápida

### Hook useAttackZones

```typescript
const {
  // Estado
  activeZones,              // Zonas ativas
  previewZone,              // Zona em preview
  activeZoneResults,        // Resultados calculados
  previewZoneResult,        // Resultado do preview
  
  // Ações
  addZone,                  // Adicionar zona
  removeZone,               // Remover zona
  updateZone,               // Atualizar zona
  clearZones,               // Limpar todas
  
  // Preview
  startPreviewFromTemplate, // Iniciar preview
  updatePreview,            // Atualizar preview
  confirmPreview,           // Confirmar preview
  cancelPreview,            // Cancelar preview
  
  // Templates
  createFromTemplate,       // Criar de template
  createCustomZone,         // Criar customizada
  
  // Manipulação
  duplicateZone,            // Duplicar zona
  rotateZone,               // Rotacionar (cone/linha)
  moveZone,                 // Mover zona
  
  // Consultas
  getAllAffectedTokens,     // Todos tokens afetados
  isTokenInZone,            // Verificar se token está em zona
  getAggregatedStats,       // Estatísticas agregadas
} = useAttackZones(tokens, obstacles, grid);
```

### Renderização

```typescript
// Renderizar zonas ativas
renderAttackZones(ctx, results, options);

// Renderizar preview
renderPreviewZone(ctx, result, options);

// Renderizar grid de alcance
renderRangeGrid(ctx, origin, maxRange, gridSize);

// Renderizar indicadores de ângulo
renderAngleIndicators(ctx, origin, direction, angle, radius);
```

## 📊 Exemplo Completo

```typescript
// 1. Criar zona de bola de fogo
const fireballConfig = {
  name: 'Bola de Fogo',
  shape: 'circle',
  radius: 4,                    // 20 pés
  origin: { x: 300, y: 300 },
  propagation: 'spreading',     // Se espalha ao redor de paredes
  respectsVision: false,
  targeting: 'all',
  color: 'rgba(255, 100, 0, 0.4)',
  damageFormula: '8d6',
  damageType: 'fire',
  saveType: 'dex',
  saveDC: 15,
};

// 2. Adicionar zona
const zone = attackZones.createCustomZone(fireballConfig);
attackZones.addZone(zone);

// 3. Obter resultado
const result = attackZones.calculateZone(zone);

// 4. Aplicar dano
result.validTargets.forEach(token => {
  console.log(`${token.name} deve fazer DEX save DC 15`);
  console.log(`Dano: 8d6 fire`);
});

// 5. Estatísticas
console.log(`Área: ${result.stats.totalArea} px²`);
console.log(`Tokens afetados: ${result.stats.tokenCount}`);
console.log(`Tokens bloqueados: ${result.stats.blockedCount}`);
console.log(`Cobertura: ${result.stats.coveragePercent}%`);
```

## 🎮 Integração com MapCanvas

Ver arquivo `.agent/ATTACK_ZONES_INTEGRATION_EXAMPLE.md` para exemplo completo.

Passos básicos:
1. Importar hook e renderizadores
2. Inicializar `useAttackZones`
3. Adicionar renderização ao loop
4. Adicionar handlers de clique/movimento
5. Adicionar painéis ao JSX

## 🧪 Testes

```bash
# Rodar testes
npm test attackZoneCalculator

# Testes cobrem:
# - Cálculo de diferentes formas
# - Propagação (bloqueado, penetrante, espalhamento)
# - Targeting (todos, aliados, inimigos)
# - Inclusão/exclusão manual
# - Estatísticas
# - Conversão grid/world
```

## 📚 Documentação Completa

Ver `.agent/ATTACK_ZONES_DOCUMENTATION.md` para:
- Arquitetura detalhada
- Todos os tipos e interfaces
- Exemplos avançados
- Customização visual
- Performance e otimizações
- Troubleshooting

## 🚀 Próximos Passos

Para integrar no projeto:

1. **Adicionar ao VTTToolbar**
   ```typescript
   <button onClick={() => setShowAttackZonePanel(true)}>
     <Target className="w-5 h-5" />
   </button>
   ```

2. **Integrar no MapCanvas**
   - Seguir exemplo em `ATTACK_ZONES_INTEGRATION_EXAMPLE.md`
   - Adicionar renderização ao loop
   - Adicionar handlers de eventos

3. **Conectar com Sistema de Combate**
   - Aplicar dano automaticamente
   - Criar ações de combate
   - Logar no chat

4. **Adicionar Persistência** (opcional)
   - Salvar zonas ativas na campanha
   - Sincronizar via WebSocket
   - Templates customizados por campanha

## 🎯 Padrões Utilizados

✅ **TypeScript** - Tipagem completa e segura
✅ **React Hooks** - Gerenciamento de estado moderno
✅ **Memoização** - Performance otimizada
✅ **Algoritmos Geométricos** - Ray-casting, visibilidade
✅ **Testes Unitários** - Cobertura de casos críticos
✅ **Documentação** - Completa e com exemplos

## 📝 Notas Importantes

- Sistema é **totalmente independente** - pode ser usado sem modificar código existente
- **Performance otimizada** - Bounding box checks, memoização, limites de iteração
- **Configurável** - Todos os aspectos podem ser customizados
- **Extensível** - Fácil adicionar novas formas e comportamentos
- **Testado** - Suite de testes unitários incluída

## 🤝 Contribuindo

Para adicionar novos templates:

```typescript
// Em types/attackZone.ts
export const ATTACK_ZONE_PRESETS: AttackZoneTemplate[] = [
  // ... templates existentes
  {
    id: 'nova_magia',
    name: 'Nova Magia',
    description: 'Descrição',
    category: 'spell',
    defaultConfig: {
      shape: 'circle',
      radius: 5,
      // ... configurações
    },
    customizableFields: ['radius', 'saveDC'],
  },
];
```

---

**Criado para QuestBinder** - Sistema VTT completo para RPG de mesa
