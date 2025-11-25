# PermissionHelper - Guia de Uso

## 📚 Visão Geral

O `PermissionHelper` é um helper centralizado para **todas** as verificações de permissões no sistema. Ele garante consistência e simplifica o código.

---

## 🎯 Acesso ao Helper

### No Contexto de Sessão

```typescript
import { useGameSession } from '../context/GameSessionContext';

const MyComponent = () => {
    const { permissionHelper } = useGameSession();
    
    // Agora você tem acesso a TODOS os métodos de permissão!
};
```

---

## 🔧 Métodos Disponíveis

### 1. Verificar se é GM

```typescript
if (permissionHelper.isGameMaster()) {
    // Usuário é o Mestre
}
```

**Antes:**
```typescript
if (isGM) { ... }
```

**Depois:**
```typescript
if (permissionHelper.isGameMaster()) { ... }
```

---

### 2. Verificar Permissão Específica

```typescript
// Verificar uma permissão
if (permissionHelper.can('tokenCreate')) {
    // Pode criar tokens
}

// Verificar múltiplas permissões (AND)
if (permissionHelper.canAll('tokenCreate', 'tokenEdit')) {
    // Tem TODAS as permissões
}

// Verificar múltiplas permissões (OR)
if (permissionHelper.canAny('drawings', 'measure')) {
    // Tem PELO MENOS UMA permissão
}
```

**Antes:**
```typescript
if (checkPermission('tokenCreate')) { ... }
```

**Depois:**
```typescript
if (permissionHelper.can('tokenCreate')) { ... }
```

---

### 3. Verificar Controle de Token

```typescript
const token = { ... };

// Verificar se pode controlar o token
if (permissionHelper.canControlToken(token)) {
    // Pode controlar (GM ou owner/controller)
}

// Verificar se pode editar
if (permissionHelper.canEditToken(token)) {
    // Pode controlar E tem permissão tokenEdit
}

// Verificar se pode deletar
if (permissionHelper.canDeleteToken(token)) {
    // Pode controlar E tem permissão tokenDelete
}

// Verificar se pode mover
if (permissionHelper.canMoveToken(token)) {
    // Pode controlar E tem permissão tokenMovement
}

// Verificar se pode ver
if (permissionHelper.canSeeToken(token)) {
    // GM ou token visível ou é controller
}
```

**Antes (TokenContextMenu):**
```typescript
const isController = token.ownerId === user?.id || token.controlledBy?.includes(user?.id || '');
const canEdit = isGM || (isController && checkPermission('tokenEdit'));
const canCreate = isGM || checkPermission('tokenCreate');
const canDelete = isGM || (isController && checkPermission('tokenDelete'));
```

**Depois:**
```typescript
const canEdit = permissionHelper.canEditToken(token);
const canCreate = permissionHelper.can('tokenCreate');
const canDelete = permissionHelper.canDeleteToken(token);
```

---

### 4. Verificar Permissões de Hover

```typescript
const token = { ... };
const tokenHoverPermissions = campaign?.permissions?.tokenHover;

// Verificar se pode ver campo específico
if (permissionHelper.canSeeTokenHoverField(token, 'showHP', tokenHoverPermissions)) {
    // Pode ver HP
}

if (permissionHelper.canSeeTokenHoverField(token, 'showAttributes', tokenHoverPermissions)) {
    // Pode ver atributos
}
```

**Antes (TokenHoverCard):**
```typescript
const canShow = (field: keyof TokenHoverPermissions): boolean => {
    if (isGM || isController) return true;
    if (!permissions) return true;
    const tokenPerms = permissions[token.type];
    return tokenPerms?.[field] === true;
};

if (canShow('showHP')) { ... }
```

**Depois:**
```typescript
if (permissionHelper.canSeeTokenHoverField(token, 'showHP', tokenHoverPermissions)) {
    // Renderizar HP
}
```

---

### 5. Verificar Permissões de Desenho

```typescript
const drawingUserId = '123';

// Verificar se pode deletar um desenho
if (permissionHelper.canDeleteDrawing(drawingUserId)) {
    // Pode deletar (GM ou owner com 'drawings' ou não-owner com 'drawingDelete')
}
```

**Antes (useDrawingActions):**
```typescript
const isOwner = drawing?.userId === user?.id;
const canDelete = state.isGM || (isOwner && checkPermission('drawings')) || (!isOwner && checkPermission('drawingDelete'));
```

**Depois:**
```typescript
const canDelete = permissionHelper.canDeleteDrawing(drawing.userId);
```

---

### 6. Padrão GM ou Permissão

```typescript
// Verificar se é GM OU tem permissão
if (permissionHelper.canAsGMOr('doorControl')) {
    // É GM ou tem permissão doorControl
}
```

**Antes (MapCanvas):**
```typescript
const canInteract = isGM || checkPermission('doorControl');
```

**Depois:**
```typescript
const canInteract = permissionHelper.canAsGMOr('doorControl');
```

---

## 📋 Exemplos Práticos

### Exemplo 1: VTTToolbar

**Antes:**
```typescript
const { checkPermission, isGM } = useGameSession();
const hasPerm = (key) => checkPermission(key) || isGM;

hidden: !hasPerm('measure')
hidden: !hasPerm('drawings')
hidden: !hasPerm('tokenCreate')
```

**Depois:**
```typescript
const { permissionHelper } = useGameSession();

hidden: !permissionHelper.canAsGMOr('measure')
hidden: !permissionHelper.canAsGMOr('drawings')
hidden: !permissionHelper.canAsGMOr('tokenCreate')
```

---

### Exemplo 2: TokenContextMenu

**Antes:**
```typescript
const { isGM, checkPermission } = useGameSession();
const isController = token.ownerId === user?.id || token.controlledBy?.includes(user?.id || '');
const canEdit = isGM || (isController && checkPermission('tokenEdit'));
const canCreate = isGM || checkPermission('tokenCreate');
const canDelete = isGM || (isController && checkPermission('tokenDelete'));
```

**Depois:**
```typescript
const { permissionHelper } = useGameSession();
const canEdit = permissionHelper.canEditToken(token);
const canCreate = permissionHelper.can('tokenCreate');
const canDelete = permissionHelper.canDeleteToken(token);
```

---

### Exemplo 3: MapCanvas - Controle de Portas

**Antes:**
```typescript
const canInteract = isGM || checkPermission('doorControl');
```

**Depois:**
```typescript
const canInteract = permissionHelper.canAsGMOr('doorControl');
```

---

### Exemplo 4: MapCanvas - Movimento de Token

**Antes:**
```typescript
if (isGM || isController) {
    if (!isGM && !checkPermission('tokenMovement')) return;
    // ... código de movimento
}
```

**Depois:**
```typescript
if (permissionHelper.canMoveToken(clickedToken)) {
    // ... código de movimento
}
```

---

### Exemplo 5: TokenHoverCard

**Antes:**
```typescript
const canShow = (field: keyof TokenHoverPermissions): boolean => {
    if (isGM || isController) return true;
    if (!permissions) return true;
    const tokenPerms = permissions[token.type];
    if (!tokenPerms) return true;
    if (field in tokenPerms) {
        return (tokenPerms as any)[field] === true;
    }
    return false;
};

{canShow('showName') && <h4>{token.name}</h4>}
{canShow('showHP') && <HPBar />}
{canShow('showStats') && <Stats />}
```

**Depois:**
```typescript
const { permissionHelper } = useGameSession();

{permissionHelper.canSeeTokenHoverField(token, 'showName', tokenHoverPermissions) && <h4>{token.name}</h4>}
{permissionHelper.canSeeTokenHoverField(token, 'showHP', tokenHoverPermissions) && <HPBar />}
{permissionHelper.canSeeTokenHoverField(token, 'showStats', tokenHoverPermissions) && <Stats />}
```

---

## 🎨 Padrões de Uso

### 1. Ocultar Elementos de UI

```typescript
const { permissionHelper } = useGameSession();

return (
    <>
        {permissionHelper.can('tokenCreate') && (
            <button onClick={addToken}>Criar Token</button>
        )}
        
        {permissionHelper.canAsGMOr('drawings') && (
            <DrawingTools />
        )}
    </>
);
```

---

### 2. Validação de Ações

```typescript
const handleDeleteToken = (token: Token) => {
    if (!permissionHelper.canDeleteToken(token)) {
        show({ type: 'error', message: 'Sem permissão para deletar este token' });
        return;
    }
    
    removeToken(token.id);
};
```

---

### 3. Renderização Condicional Complexa

```typescript
const renderTokenMenu = (token: Token) => {
    const canEdit = permissionHelper.canEditToken(token);
    const canDelete = permissionHelper.canDeleteToken(token);
    const canMove = permissionHelper.canMoveToken(token);
    
    return (
        <Menu>
            {canEdit && <MenuItem onClick={editToken}>Editar</MenuItem>}
            {canMove && <MenuItem onClick={moveToken}>Mover</MenuItem>}
            {canDelete && <MenuItem onClick={deleteToken}>Deletar</MenuItem>}
        </Menu>
    );
};
```

---

## 🔍 Debugging

```typescript
// Ver todas as permissões do usuário atual
console.log(permissionHelper.getAllPermissions());

// Resultado:
// {
//   tokenCreate: true,
//   tokenEdit: true,
//   tokenDelete: false,
//   drawings: true,
//   ...
// }
```

---

## ✅ Benefícios

1. ✅ **Centralizado** - Um único ponto de verdade para permissões
2. ✅ **Consistente** - Mesma lógica em todo o código
3. ✅ **Type-Safe** - TypeScript garante tipos corretos
4. ✅ **Fácil de Usar** - Métodos intuitivos e bem nomeados
5. ✅ **Testável** - Fácil de mockar e testar
6. ✅ **Performático** - Memoizado no hook usePermissions
7. ✅ **Extensível** - Fácil adicionar novos métodos

---

## 🚀 Migração

### Passo 1: Importar o Helper
```typescript
const { permissionHelper } = useGameSession();
```

### Passo 2: Substituir Verificações Antigas
```typescript
// Antes
if (isGM || checkPermission('tokenCreate')) { ... }

// Depois
if (permissionHelper.canAsGMOr('tokenCreate')) { ... }
```

### Passo 3: Simplificar Lógica Complexa
```typescript
// Antes
const isController = token.ownerId === user?.id || token.controlledBy?.includes(user?.id || '');
const canEdit = isGM || (isController && checkPermission('tokenEdit'));

// Depois
const canEdit = permissionHelper.canEditToken(token);
```

---

## 📖 Referência Completa

| Método | Descrição | Exemplo |
|--------|-----------|---------|
| `isGameMaster()` | Verifica se é GM | `if (permissionHelper.isGameMaster())` |
| `can(perm)` | Verifica permissão específica | `if (permissionHelper.can('tokenCreate'))` |
| `canAll(...perms)` | Verifica múltiplas (AND) | `if (permissionHelper.canAll('tokenCreate', 'tokenEdit'))` |
| `canAny(...perms)` | Verifica múltiplas (OR) | `if (permissionHelper.canAny('drawings', 'measure'))` |
| `canControlToken(token)` | Verifica controle de token | `if (permissionHelper.canControlToken(token))` |
| `canEditToken(token)` | Verifica edição de token | `if (permissionHelper.canEditToken(token))` |
| `canDeleteToken(token)` | Verifica deleção de token | `if (permissionHelper.canDeleteToken(token))` |
| `canMoveToken(token)` | Verifica movimento de token | `if (permissionHelper.canMoveToken(token))` |
| `canSeeToken(token)` | Verifica visibilidade de token | `if (permissionHelper.canSeeToken(token))` |
| `canSeeTokenHoverField(token, field, perms)` | Verifica campo de hover | `if (permissionHelper.canSeeTokenHoverField(token, 'showHP', perms))` |
| `canDeleteDrawing(userId)` | Verifica deleção de desenho | `if (permissionHelper.canDeleteDrawing(drawing.userId))` |
| `canAsGMOr(perm)` | GM ou permissão | `if (permissionHelper.canAsGMOr('doorControl'))` |
| `getAllPermissions()` | Debug - todas as permissões | `console.log(permissionHelper.getAllPermissions())` |

---

**Criado por:** Antigravity AI  
**Data:** 2025-11-25  
**Versão:** 1.0
