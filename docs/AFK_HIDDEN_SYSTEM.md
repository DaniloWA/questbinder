# Estudo do Sistema de AFK e Hidden (Ponteiros)

Este documento detalha o funcionamento técnico dos sistemas de inatividade (AFK) e ocultação (Hidden/Tabbed Out) dos cursores no QuestBinder, cobrindo a implementação no Cliente (Frontend) e Servidor (Backend).

## 1. Visão Geral

O sistema gerencia dois estados principais de ausência do usuário:
1.  **AFK (Away From Keyboard)**: Inatividade prolongada sem movimento do mouse. Gerenciado principalmente pelo servidor.
2.  **Hidden (Oculto/Tabbed Out)**: Usuário trocou de aba (Alt+Tab) ou o navegador perdeu o foco. Detectado pelo cliente.

O objetivo é fornecer feedback visual aos outros jogadores ("Zzz" ou ícone de proibido) e economizar recursos/garantir segurança (Kick por inatividade).

---

## 2. Arquitetura de Dados

### Estrutura de Estado (Servidor)
Localizado em `server/socket/state/cursorState.js`, o servidor mantém o estado de cada cursor em um `Map`:

```javascript
{
  x: number,
  y: number,
  lastUpdate: number,     // Timestamp da última interação
  serverTimestamp: number,
  isAfk: boolean,         // true se inativo > 30s
  isHidden: boolean,      // true se aba em segundo plano (Atualmente forçado a false em movimentos)
  warningSent: boolean,   // Controle de notificação de kick
  history: [],            // Buffer para lag compensation
  // ...outros campos de visualização (cor, nome, etc)
}
```

### Payload de Comunicação (Socket)
Evento `cursor:move` enviado pelo cliente:
```typescript
{
  userId: string,
  x: number, y: number,
  velocityX: number, velocityY: number,
  isAfk: boolean,         // Estado local do cliente
  isHidden: boolean,      // Estado de visibilidade da página
  isClicking: boolean,    // Estado de clique
  // ...
}
```

---

## 3. Fluxo Detalhado: AFK (Inatividade)

O sistema de AFK opera em duas camadas: uma verificação local rápida e uma autoritativa no servidor.

### A. Lado do Servidor (Autoritativo)
O servidor executa um loop de `checkPresence` (Heartbeat Watchdog) periodicamente.

1.  **Monitoramento**: Calcula `timeSinceLastUpdate = Date.now() - state.lastUpdate`.
2.  **Estágio 1 - Marcação AFK (30s)**:
    *   Se inatividade > 30s.
    *   Define `state.isAfk = true`.
    *   Emite `cursor:move` com `isAfk: true` para todos os clientes.
3.  **Estágio 2 - Aviso de Kick (2 min)**:
    *   Se inatividade > 2 min.
    *   Emite notificação de sistema (`system:notification`): "Jogador será desconectado...".
4.  **Estágio 3 - Kick (5 min)**:
    *   Se inatividade > 5 min.
    *   Desconecta o socket do usuário e o remove da sala.

### B. Lado do Cliente (Visual/Preventivo)
Localizado em `useTokenActions.ts`.
1.  **Timer Local**: Timer de 60s reiniciado a cada movimento (`resetAfkTimer`).
2.  **Gatilho**: Se nenhum movimento ocorre por 60s, o cliente define `isAfkRef = true` localmente e força um envio de estado (`forceEmitState`).
3.  **Nota**: O servidor (30s) geralmente atua antes do cliente (60s), tornando a detecção do servidor a primária.

---

## 4. Fluxo Detalhado: Hidden (Tabbed Out)

Este sistema detecta quando o usuário não está olhando para a partida.

### A. Detecção no Cliente
O hook `useTokenActions.ts` utiliza múltiplos listeners para robustez:
1.  **Eventos Monitorados**:
    *   `visibilitychange` (API Principal): A aba ficou oculta/visível.
    *   `blur/focus`: A janela perdeu/ganhou foco (Alt+Tab).
    *   `mouseleave`: O mouse saiu da área da janela.

2.  **Fluxo de Saída (Ficar Hidden)**:
    *   Detecta evento (ex: `blur`).
    *   Define `isHiddenRef.current = true`.
    *   Executa `forceEmitState()`: Envia `cursor:move` imediato com flag `isHidden: true`.
    *   **Importante**: Para o envio de `cursor:keep_alive` (Heartbeat).

3.  **Fluxo de Retorno**:
    *   Detecta evento (ex: `focus` ou `mousemove`).
    *   Define `isHiddenRef.current = false`.
    *   Executa `forceEmitState()`: Envia `cursor:move` com `isHidden: false`.
    *   Retoma o envio de `cursor:keep_alive`.

### B. Processamento no Servidor
Atualmente, existe um comportamento específico em `cursorState.js`:

1.  Recebe `cursor:move` com o payload do cliente.
2.  Executa `updateState`.
3.  **Observação de Comportamento**: O código atual do servidor (`cursorState.js`) possui linhas que resetam `isHidden` para `false` em qualquer atualização de movimento:
    ```javascript
    isAfk: false,       // Force reset AFK on movement
    isHidden: false     // Force reset Hidden on movement
    ```
    Isso significa que, mesmo que o cliente envie `isHidden: true` (ao sair da aba), o servidor pode interpretar esse pacote como um movimento ativo e resetar a flag imediatamente. Isso efetivamente faz com que o estado "Hidden" dependa da ausência de pacotes (que leva ao AFK) ou requer um ajuste no servidor para aceitar a flag do cliente se ela vier marcada como `true`.

---

## 5. Renderização Visual (Frontend)

Localizado em `renderCursorOverlays.ts`. O cliente renderiza os cursores remotos baseado nos dados recebidos:

1.  **Ícone Hidden (⛔)**:
    *   Prioridade visual máxima.
    *   Renderiza um ícone de proibido vermelho grande sobre a posição do cursor.
    *   Indica aos outros jogadores que aquele usuário não está visualizando a mesa.

2.  **Animação AFK (Zzz)**:
    *   Ativada se `isAfk` for `true`.
    *   Renderiza partículas de texto "Z" flutuando (animação clássica de sono).
    *   Desaparece assim que o usuário retorna à atividade.

## 6. Resumo do Ciclo de Vida

1.  **Ativo**: Usuário interage -> Cliente envia `cursor:move` -> Servidor atualiza estado.
2.  **Alt+Tab (Hidden)**:
    *   Cliente detecta `blur` -> Envia pacote "Hidden" -> Para de enviar Heartbeats.
    *   (Devido à lógica do servidor, pode não aparecer imediatamente como Hidden, mas sim parar de atualizar).
3.  **Inatividade (AFK)**:
    *   Servidor conta 30s sem updates.
    *   Marca `isAfk = true`.
    *   Todos veem "Zzz".
4.  **Retorno**:
    *   Usuário volta -> Cliente envia novo movimento.
    *   Servidor reseta todas as flags de inatividade.
    *   Cursor volta ao normal.
