# Como Testar o WebSocket e Multiplayer

O QuestBinder agora possui um backend real com WebSocket! Siga estes passos para ver a mágica acontecer:

## 1. Prepare o Ambiente
Certifique-se de que os servidores estão rodando:
- Terminal 1: `npm start` (Backend na porta 3000)
- Terminal 2: `npm run dev` (Frontend na porta 5173)

## 2. Abra o Mestre (GM)
1. Abra seu navegador em `http://localhost:5173`.
2. Faça login com:
   - **Email:** `demo@demo.com`
   - **Senha:** `password`
3. Entre na campanha "A Lenda do Dragão de Aço".
4. Verifique se o indicador "LIVE" está verde no topo da tela.

## 3. Abra um Jogador (Player)
1. Abra uma **Janela Anônima** (ou outro navegador).
2. Acesse `http://localhost:5173`.
3. Faça login com um usuário diferente (já criado no banco de dados):
   - **Email:** `alice@exemplo.com`
   - **Senha:** `password`
4. Entre na mesma campanha.

## 4. Teste a Sincronização
Agora, coloque as duas janelas lado a lado:

### Movimentação
- Arraste um token na janela do Mestre.
- **Resultado:** O token deve se mover suavemente na janela da Alice quase instantaneamente.

### Chat
- Envie uma mensagem no chat do Mestre: "Olá Alice!".
- **Resultado:** A mensagem deve aparecer na hora no chat da Alice.

### Dados
- Role um dado na janela da Alice (clique no d20).
- **Resultado:** O Mestre verá o resultado da rolagem em 3D (se habilitado) e no chat.

### Combate
- Inicie o combate na janela do Mestre.
- **Resultado:** A borda da tela deve mudar e o rastreador de iniciativa deve aparecer para ambos.

## Solução de Problemas
- Se ver "OFFLINE" em vermelho, verifique se o terminal do `npm start` está rodando sem erros.
- Se os dados não carregarem, tente recarregar a página (F5).
