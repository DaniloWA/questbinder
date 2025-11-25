# Correção: Botão "Novo Token" Exclusivo do GM

## Problema Identificado
O botão "Novo Token" estava aparecendo para jogadores porque usava a verificação `permissionHelper.canAsGMOr('tokenCreate')`, que permitia que aparecesse se o jogador tivesse a permissão `tokenCreate`.

## Solução Implementada
Alterado o botão "Novo Token" para ser **exclusivo do GM**, independente de permissões configuráveis.

### Mudança no Código

**Arquivo:** `components/vtt/VTTToolbar.tsx`

```typescript
// ANTES
{
    id: 'add-token',
    type: 'action',
    label: 'Novo Token',
    icon: <UserPlus />,
    onClick: props.onAddToken,
    hidden: !permissionHelper.canAsGMOr('tokenCreate') // ❌ Permitia aparecer com permissão
}

// DEPOIS
{
    id: 'add-token',
    type: 'action',
    label: 'Novo Token',
    icon: <UserPlus />,
    onClick: props.onAddToken,
    hidden: !permissionHelper.isGameMaster() // ✅ Exclusivo do GM
}
```

## Comportamento Atual

### Para Jogadores (não-GM)
- ❌ **Não veem** o botão "Novo Token"
- ❌ **Não podem** criar tokens, independente de permissões

### Para o Mestre (GM)
- ✅ **Sempre vê** o botão "Novo Token"
- ✅ **Sempre pode** criar tokens

## Nota sobre Permissões

As permissões `tokenCreate`, `tokenEdit` e `tokenDelete` ainda existem no sistema e podem ser usadas para:
- Controlar outras funcionalidades relacionadas a tokens no futuro
- Logs e auditoria
- Validações no backend

Mas o botão "Novo Token" na toolbar é **sempre exclusivo do GM**, não importa as configurações de permissão.

## Ferramentas Exclusivas do GM (Atualizado)

1. **Bestiário** - Biblioteca de tokens
2. **Novo Token** - Adicionar novos tokens ao mapa ⭐ **CORRIGIDO**
3. **Arquitetura** - Paredes, portas, janelas
4. **Iluminação & Neblina** - Zonas de luz e neblina de guerra
5. **Áudio** - Painel de áudio e zonas de áudio
6. **Gatilhos** - Zonas de gatilho
7. **Recursos** - Handouts
8. **Combate** - Iniciar/encerrar combate
9. **Ferramentas do Mestre** - Visão de jogador, permissões, etc.
