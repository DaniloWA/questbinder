# Restrição de Ferramentas para Jogadores

## Resumo das Mudanças

Implementado sistema de permissões restritivo para jogadores (não-mestres), garantindo que apenas ferramentas essenciais estejam disponíveis por padrão.

## Ferramentas Disponíveis por Padrão para Jogadores

### ✅ Sempre Disponíveis
1. **Selecionar** (`select`) - Ferramenta básica de seleção (sempre visível)
2. **Régua** (`measure`) - Ferramenta de medição de distância
3. **Desenhar** (`drawings`) - Ferramentas de desenho no mapa
4. **Mesa de Dados** (`diceRolling`) - Rolagem de dados
5. **Grimório** (`compendiumBrowse`) - Acesso ao compêndio de regras/magias/monstros

### ❌ Requerem Permissão Explícita do GM

#### Interação Básica
- **Controle de Portas** (`doorControl`) - Abrir/fechar portas e janelas
- **Ping no Mapa** (`pingMap`) - Sinalizar locais no mapa

#### Gestão de Tokens
- **Criar Tokens** (`tokenCreate`) - Adicionar novos tokens
- **Editar Tokens** (`tokenEdit`) - Modificar propriedades de tokens
- **Deletar Tokens** (`tokenDelete`) - Remover tokens do mapa

#### Ferramentas Avançadas
- **Revelar Neblina** (`fogReveal`) - Manipular neblina de guerra
- **Apagar Desenhos** (`drawingDelete`) - Remover desenhos próprios
- **Limpar Desenhos** (`drawingClear`) - Limpar todos os desenhos

#### Conteúdo e Criação
- **Criar Notas** (`journalCreate`) - Criar handouts/recursos

#### Ferramentas Exclusivas do GM
- **Bestiário** - Biblioteca de tokens (sempre GM only)
- **Novo Token** - Adicionar novos tokens ao mapa (sempre GM only)
- **Arquitetura** - Paredes, portas, janelas
- **Iluminação & Neblina** - Zonas de luz e neblina de guerra
- **Áudio** - Painel de áudio e zonas de áudio
- **Gatilhos** - Zonas de gatilho
- **Recursos** - Handouts
- **Combate** - Iniciar/encerrar combate
- **Ferramentas do Mestre** - Visão de jogador, permissões, etc.

## Arquivos Modificados

### 1. `utils/defaultPermissions.ts`
**Mudanças nas permissões padrão:**
```typescript
// ANTES (mais permissivo)
doorControl: true,
pingMap: true,
compendiumBrowse: false,

// DEPOIS (mais restritivo)
doorControl: false,   // GM deve habilitar explicitamente
pingMap: false,       // GM deve habilitar explicitamente
compendiumBrowse: true, // Grimório disponível por padrão
```

### 2. `components/vtt/VTTToolbar.tsx`
**Adicionadas verificações de permissão:**
```typescript
// Bestiário - agora restrito ao GM
{
    id: 'bestiary',
    hidden: !permissionHelper.isGameMaster(),
}

// Grimório - agora verifica permissão
{
    id: 'compendium',
    hidden: !permissionHelper.canAsGMOr('compendiumBrowse'),
}
```

## Como o GM Pode Conceder Permissões

1. Abrir o menu **Mestre** (ícone de coroa) na toolbar
2. Clicar em **Permissões**
3. Escolher entre:
   - **Global**: Aplicar permissões para todos os jogadores
   - **Jogadores**: Configurar permissões específicas por jogador

### Opções de Permissão por Jogador
- **Herdar Global** (padrão) - Usa a configuração global
- **Permitido** - Concede permissão explicitamente
- **Proibido** - Nega permissão explicitamente

## Comportamento do Sistema

### Para Jogadores (não-GM)
- Veem apenas as ferramentas para as quais têm permissão
- Ferramentas sem permissão ficam completamente ocultas
- Não há indicação visual de ferramentas bloqueadas

### Para o Mestre (GM)
- Vê todas as ferramentas sempre
- Pode alternar entre "Modo Mestre" e "Modo Jogador" para testar a visão dos jogadores
- Pode configurar permissões globais ou por jogador

## Permissões que Permanecem Habilitadas por Padrão

Estas permissões continuam ativas para jogadores por padrão:
- `tokenMovement` - Mover seus próprios tokens
- `sheetEdit` - Editar sua própria ficha
- `initiativeRoll` - Rolar iniciativa
- `shareCursor` - Compartilhar cursor
- `allowSpectate` - Permitir que o GM veja sua tela

## Notas Técnicas

- O sistema usa `permissionHelper.canAsGMOr(permission)` para verificar se o usuário é GM OU tem a permissão específica
- O sistema usa `permissionHelper.isGameMaster()` para verificar se é exclusivo do GM
- As permissões são sincronizadas em tempo real via WebSocket
- Mudanças nas permissões são aplicadas imediatamente sem necessidade de recarregar a página

## Testes Recomendados

1. ✅ Criar uma sessão como GM
2. ✅ Conectar como jogador em outra aba/navegador
3. ✅ Verificar que o jogador vê apenas: Selecionar, Régua, Desenhar, Mesa de Dados, Grimório
4. ✅ Como GM, conceder permissão de "Controle de Portas"
5. ✅ Verificar que a permissão aparece imediatamente para o jogador
6. ✅ Remover a permissão e verificar que desaparece
7. ✅ Testar permissões específicas por jogador
