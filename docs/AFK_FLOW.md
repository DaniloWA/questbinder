# Documentação Técnica: Sistema de AFK (Inatividade)

Este documento descreve o fluxo completo do sistema de detecção e tratamento de inatividade (AFK) do QuestBinder.

## 1. Visão Geral

O sistema é **Server-Authoritative**, ou seja, o servidor é responsável por decidir quem está AFK. O cliente atua principalmente como visualizador e possui mecanismos de segurança (failsafes).

### Estados Principais
| Estado | Tempo (Inatividade) | Comportamento |
|os|---|---|
| **Ativo** | < 30s | Cursor normal, atualizações em tempo real. |
| **AFK (Ausente)** | > 30s | Flag `isAfk=true`, Cursor fica cinza/transparente, Ícone "Zzz" aparece. |
| **Aviso (Warning)** | > 2 min | Usuário recebe aviso de desconexão iminente com contagem regressiva. |
| **Kick (Desconexão)** | > 5 min | Usuário é removido da sala e redirecionado para o lobby. |

---

## 2. Lado do Servidor (Backend)

A lógica central reside em `server/socket/state/cursorState.js` e `server/socket/handlers/cursorHandlers.js`.

### Máquina de Estados (Heartbeat Watchdog)
O método `checkPresence(io)` roda periodicamente para verificar a última atualização (`lastUpdate`) de cada usuário.

1.  **Filtro de Jitter (Stationary Check)**:
    *   Pequenos movimentos do mouse (micro-tremores) não resetam o timer se o usuário já estiver marcado como AFK.
    *   É necessário um movimento significativo ou clique para sair do estado AFK.

2.  **Transição de Fases**:
    *   **30s (AFK)**:
        *   Define `state.isAfk = true`.
        *   Emite `cursor:move` com `isAfk: true` para todos (atualiza visualmente).
        *   Emite `me:afk_status` ('afk') para o usuário (discreto).
    *   **2 min (Warning)**:
        *   Emite `system:notification` pública ("João será desconectado em 3 minutos").
        *   Passa a emitir `me:afk_status` ('warning') periodicamente com `timeLeft`.
    *   **5 min (Kick)**:
        *   Emite `me:kicked` para o usuário (com motivo e instrução de redirect).
        *   Força desconexão do socket após 1s.
        *   Remove usuário do estado da sala.

### Eventos Recebidos
*   `cursor:move`: Reseta o timer de inatividade (se o movimento for significativo).
*   `cursor:click`: Reseta o timer imediatamente.
*   `cursor:keep_alive`: Reseta o timer (usado se a detecção de "Hidden" estivesse ativa, atualmente em desuso no client).

---

## 3. Lado do Cliente (Frontend)

### Interface de Aviso (`AfkOverlay.tsx`)
*   Ouve o estado `afkStatus` do contexto.
*   **Aviso Visual**: Exibe overlay amarelo (AFK) ou vermelho (Warning).
*   **Failsafe de Desconexão (Client-Side Kick)**:
    *   Se o contador visual chegar a 0 e o servidor não tiver enviado o evento de kick (ex: falha de socket), o cliente força o redirecionamento após 3 segundos.
    *   Salva `kickReason` no `sessionStorage` para exibir a mensagem corretamente no Dashboard após o reload.

### Listeners (`playerListeners.ts`)
*   **`me:afk_status`**: Atualiza o estado local (`active`, `afk`, `warning`) e o timer.
*   **`me:kicked`**: Recebe a ordem final de expulsão. Salva mensagem no storage e redireciona via `window.location.href`.
*   **`cursor:move` (Outros Jogadores)**: Se o payload contiver `isAfk: true`, exibe notificação "Fulano está ausente" (com debounce de 5s).

### Renderização (`useMapRenderer.ts`)
*   **Visualização Remota**:
    *   Se `cursor.isAfk` for verdadeiro:
        *   Aplica filtro de **Blur** no cursor.
        *   Altera cor para cinza (`#9ca3af`).
        *   Renderiza badge de inatividade (geralmente "Zzz" ou ícone similar via `renderCursorOverlays`).

### Discrepância: Sistema "Hidden" (Alt-Tab)
*   A documentação legada menciona um sistema de detecção de troca de aba (`visibilitychange`).
*   **Status Atual**: Este sistema não está ativo no código atual (`useTokenActions.ts`). O cliente não envia ativamente o estado de "Hidden" para o servidor, apenas para de renderizar o canvas localmente para economizar recursos.

---

## 4. Fluxo de Eventos (Resumo)

1.  **Usuário para de mexer o mouse**.
2.  **T+30s (Server)**:
    *   `Server` -> `Todos`: `cursor:move { userId, isAfk: true }`
    *   `Server` -> `User`: `me:afk_status { status: 'afk' }`
    *   `Todos`: Veem cursor do usuário ficar cinza/blur.
    *   `User`: Vê overlay amarelo "Você está ausente".
3.  **T+2m (Server)**:
    *   `Server` -> `Todos`: `system:notification "Usuário será kickado..."`
    *   `Server` -> `User`: `me:afk_status { status: 'warning', timeLeft: 180 }`
    *   `User`: Overlay fica vermelho com barra de progresso.
4.  **T+5m (Server)**:
    *   `Server` -> `User`: `me:kicked { reason: 'afk', redirectTo: '/join/...' }`
    *   `User`: É redirecionado para o lobby.
    *   `Server`: Fecha conexão Socket.
5.  **Failsafe (Caso o Server falhe no passo 4)**:
    *   `User (Client)`: Timer local chega a 0. Espera 3s.
    *   `User (Client)`: Força redirecionamento: `window.location.href = '/join/...'`.
