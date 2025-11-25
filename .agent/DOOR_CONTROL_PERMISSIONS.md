# Controle de Portas e Janelas - Agora Configurável

## ✅ Implementação Concluída

A funcionalidade de abrir/fechar portas e janelas **já está implementada e configurável** através do sistema de permissões do QuestBinder.

## 📋 Como Funciona

### Permissão: `doorControl`

- **Localização**: Painel de Permissões (acessível pelo GM)
- **Ícone**: 🚪 (DoorOpen)
- **Descrição**: "Usar Portas - Abrir/fechar portas e janelas"
- **Valor Padrão**: `true` (habilitado para todos os jogadores)

### Comportamento

1. **Jogadores com permissão** (`doorControl: true`):
   - Podem clicar em portas e janelas no mapa para abri-las/fechá-las
   - A ação é sincronizada em tempo real via WebSocket para todos os clientes
   - Portas abertas não bloqueiam movimento nem visão
   - Janelas abertas não bloqueiam movimento (mas nunca bloqueiam visão)

2. **Jogadores sem permissão** (`doorControl: false`):
   - Não podem interagir com portas e janelas
   - Receberão um aviso no console: `[MapCanvas] Door control denied - no permission`

3. **GM**:
   - Sempre tem permissão para controlar portas e janelas
   - Pode habilitar/desabilitar a permissão para jogadores específicos ou globalmente

## 🎮 Como Usar (GM)

### Habilitar/Desabilitar para Todos os Jogadores

1. Abrir o menu **Mestre** (ícone de coroa) na toolbar
2. Clicar em **Permissões**
3. Localizar a permissão **"Usar Portas"**
4. Alternar o switch para habilitar/desabilitar

### Configurar para Jogadores Específicos

1. No painel de Permissões, expandir **"Overrides por Usuário"**
2. Selecionar o jogador desejado
3. Alternar a permissão **"Usar Portas"** para aquele jogador específico

## 🔧 Implementação Técnica

### Código Relevante

**MapCanvas.tsx** (linhas 1158-1172):
```typescript
if (clickedObstacle && activeTool === 'select' && ['door', 'window'].includes(clickedObstacle.type)) {
    // REGRA MILENAR: Use PermissionHelper
    if (permissionHelper.canAsGMOr('doorControl')) {
        const isOpen = !clickedObstacle.blocksMovement;
        const newOpen = !isOpen;

        updateObstacle(clickedObstacle.id, {
            blocksMovement: !newOpen,
            blocksVision: clickedObstacle.type === 'door' ? !newOpen : false
        });
        return;
    } else {
        console.warn('[MapCanvas] Door control denied - no permission');
    }
}
```

### Arquivos Modificados

1. **`utils/defaultPermissions.ts`**
   - Alterado `doorControl: false` → `doorControl: true`
   - Agora jogadores têm permissão por padrão (mas GM pode desabilitar)

2. **`server/socket/utils.js`**
   - Já estava com `doorControl: true` (consistente)

3. **`context/gameSession/constants.ts`**
   - Já estava com `doorControl: true` (consistente)

## 🎯 Resultado Final

✅ **Antes**: Apenas o GM podia abrir/fechar portas e janelas  
✅ **Agora**: Jogadores podem abrir/fechar portas e janelas por padrão  
✅ **Configurável**: GM pode desabilitar esta permissão a qualquer momento  
✅ **Granular**: GM pode configurar permissões diferentes para cada jogador  

## 📝 Notas Adicionais

- A funcionalidade usa o **PermissionHelper** seguindo a "REGRA MILENAR" do projeto
- Todas as ações são sincronizadas em tempo real via WebSocket
- O sistema é retrocompatível com campanhas existentes
- Não há necessidade de migração de dados
