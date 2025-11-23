# 🎲 QuestBinder

<div align="center">

**A plataforma definitiva para gerenciar suas fichas de RPG, encontrar mesas e mestrar aventuras lendárias.**

[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8.1-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)

</div>

---

## 📖 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Como Executar](#-como-executar)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Funcionalidades Detalhadas](#-funcionalidades-detalhadas)
- [WebSocket e Sincronização em Tempo Real](#-websocket-e-sincronização-em-tempo-real)
- [Contribuindo](#-contribuindo)
- [Licença](#-licença)

---

## 🎯 Sobre o Projeto

**QuestBinder** é uma plataforma completa de **Virtual Tabletop (VTT)** desenvolvida para jogadores e mestres de RPG de mesa. Com uma interface moderna e intuitiva, o QuestBinder oferece todas as ferramentas necessárias para criar personagens, gerenciar campanhas e conduzir sessões de jogo imersivas em tempo real.

### 🌟 Destaques

- ✨ **Interface Premium**: Design moderno com tema dark mode e animações suaves
- 🎭 **Sistema Completo de Personagens**: Criação e gerenciamento de fichas D&D 5e
- 🗺️ **Virtual Tabletop Avançado**: Mapas interativos, tokens, desenhos e medições
- 🔄 **Sincronização em Tempo Real**: WebSocket para multiplayer instantâneo
- 🎵 **Sistema de Áudio Imersivo**: Mixer de áudio com zonas e controles em tempo real
- 💬 **Chat Integrado**: Sistema de chat com rolagem de dados e comandos
- 📚 **Compêndio Completo**: Acesso a monstros, magias e itens
- 🎲 **Rolador de Dados Inteligente**: Suporte a fórmulas complexas e modificadores

---

## ✨ Funcionalidades

### 🎭 Gerenciamento de Personagens

- **Criação de Fichas D&D 5e**: Sistema completo com todas as classes, raças e backgrounds
- **Atributos e Perícias**: Cálculo automático de modificadores e proficiências
- **Inventário Dinâmico**: Gerenciamento de itens, armas, armaduras e equipamentos
- **Sistema de Magias**: Slots de magia, preparação e lançamento de feitiços
- **Características e Traços**: Personalização completa do personagem

### 🏰 Campanhas e Sessões

- **Dashboard de Campanha**: Visão geral com personagens, sessões e progresso
- **Gerenciamento de Jogadores**: Convites, permissões e controle de acesso
- **Sessões de Jogo**: Criação e organização de sessões com histórico
- **Diário de Aventuras**: Registro automático de eventos importantes

### 🗺️ Virtual Tabletop (VTT)

#### Mapas e Cenas
- **Upload de Mapas**: Suporte a imagens personalizadas
- **Grid Configurável**: Ajuste de tamanho, cor e opacidade
- **Múltiplas Cenas**: Troca rápida entre diferentes mapas
- **Fog of War**: Revelação progressiva do mapa (em desenvolvimento)

#### Tokens e Personagens
- **Tokens Interativos**: Arraste, redimensione e rotacione tokens
- **Sincronização Instantânea**: Movimentos refletidos em tempo real para todos
- **Barra de Vida**: Visualização de HP e status
- **Tokens de Monstros**: Invocação direta do compêndio
- **Visibilidade Controlada**: Mostre/oculte tokens para jogadores

#### Ferramentas de Desenho
- **Desenho Livre**: Pincéis com cores e espessuras personalizáveis
- **Formas Geométricas**: Círculos, retângulos e linhas
- **Régua e Medição**: Meça distâncias em pés/metros
- **Apagar e Limpar**: Controle total sobre desenhos

#### Sistema de Áudio
- **Upload de Músicas**: Suporte a MP3, WAV, OGG
- **Mixer em Tempo Real**: Controles de play, pause, stop e volume
- **Zonas de Áudio**: Música ambiente ativada por posição do token
- **Sincronização Multiplayer**: Todos ouvem a mesma música simultaneamente

### 💬 Comunicação

- **Chat em Tempo Real**: Mensagens instantâneas entre jogadores e mestre
- **Rolagem de Dados Integrada**: Comandos como `/roll 1d20+5`
- **Mensagens do Sistema**: Notificações de eventos importantes
- **Histórico Persistente**: Todas as mensagens salvas no banco de dados

### 🎲 Sistema de Dados

- **Rolador Inteligente**: Suporte a fórmulas complexas (ex: `2d6+3`, `1d20+5+1d4`)
- **Vantagem/Desvantagem**: Rolagem automática de 2d20
- **Modificadores Dinâmicos**: Adicione bônus e penalidades
- **Histórico de Rolagens**: Visualize resultados anteriores
- **Integração com Chat**: Compartilhe resultados automaticamente

### 📚 Compêndio

- **Bestiário Completo**: Centenas de monstros com estatísticas completas
- **Grimório de Magias**: Todas as magias D&D 5e organizadas
- **Catálogo de Itens**: Armas, armaduras, itens mágicos e equipamentos
- **Busca e Filtros**: Encontre rapidamente o que precisa
- **Invocação Rápida**: Adicione monstros diretamente ao mapa

### 📄 Handouts e Documentos

- **Criação de Handouts**: Documentos personalizados para jogadores
- **Editor Rico**: Formatação de texto e imagens
- **Compartilhamento Seletivo**: Escolha quem pode ver cada handout
- **Visualização em Tempo Real**: Atualizações instantâneas ao compartilhar

---

## 🛠️ Tecnologias Utilizadas

### Frontend

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| **React** | 19.2.0 | Biblioteca para construção de interfaces |
| **TypeScript** | 5.8.2 | Superset JavaScript com tipagem estática |
| **Vite** | 6.2.0 | Build tool ultrarrápido |
| **Socket.io Client** | 4.8.1 | Cliente WebSocket para tempo real |
| **Lucide React** | 0.554.0 | Biblioteca de ícones moderna |
| **date-fns** | 4.1.0 | Manipulação de datas |

### Backend

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| **Node.js** | - | Runtime JavaScript |
| **Express** | 4.18.2 | Framework web minimalista |
| **Socket.io** | 4.7.4 | Servidor WebSocket |
| **SQLite3** | 5.1.7 | Banco de dados relacional |
| **CORS** | 2.8.5 | Middleware para CORS |
| **Nodemon** | 3.1.11 | Auto-reload em desenvolvimento |

### Integrações

- **Google Gemini API**: IA generativa para recursos avançados

---

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** (versão 16 ou superior)
- **npm** (geralmente vem com Node.js)
- **Git** (para clonar o repositório)
- **Chave API do Google Gemini** (para funcionalidades de IA)

### Verificar Instalações

```bash
node --version  # Deve retornar v16.x.x ou superior
npm --version   # Deve retornar 8.x.x ou superior
git --version   # Deve retornar 2.x.x ou superior
```

---

## 🚀 Instalação

### 1. Clone o Repositório

```bash
git clone https://github.com/seu-usuario/questbinder.git
cd questbinder
```

### 2. Instale as Dependências do Frontend

```bash
npm install
```

### 3. Instale as Dependências do Backend

```bash
cd server
npm install
cd ..
```

---

## ⚙️ Configuração

### 1. Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na **raiz do projeto** (não dentro da pasta `server`):

```bash
# .env.local
GEMINI_API_KEY=sua_chave_api_aqui
```

> **⚠️ IMPORTANTE**: Substitua `sua_chave_api_aqui` pela sua chave real da API do Google Gemini.

#### Como Obter a Chave da API Gemini

1. Acesse [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Faça login com sua conta Google
3. Clique em "Create API Key"
4. Copie a chave gerada
5. Cole no arquivo `.env.local`

### 2. Inicializar o Banco de Dados (Opcional)

O banco de dados SQLite será criado automaticamente na primeira execução. Se desejar popular com dados de exemplo:

```bash
cd server
node seed.js
cd ..
```

---

## 🎮 Como Executar

### Modo Desenvolvimento (Recomendado)

Você precisará de **dois terminais** abertos:

#### Terminal 1: Backend (Servidor)

```bash
cd server
npm run dev
```

O servidor estará rodando em: `http://localhost:3001`

#### Terminal 2: Frontend (Cliente)

```bash
npm run dev
```

O cliente estará rodando em: `http://localhost:5173`

### Acessar a Aplicação

Abra seu navegador e acesse:

```
http://localhost:5173
```

### Modo Produção

#### Build do Frontend

```bash
npm run build
npm run preview
```

#### Executar Backend em Produção

```bash
cd server
npm start
```

---

## 📁 Estrutura do Projeto

```
QuestBinder/
├── 📂 components/          # Componentes React reutilizáveis
│   ├── 📂 ui/             # Componentes de interface base
│   └── 📂 vtt/            # Componentes do Virtual Tabletop
│       ├── AudioPanel.tsx
│       ├── ChatPanel.tsx
│       ├── CompendiumWindow.tsx
│       ├── DiceRoller.tsx
│       ├── MapCanvas.tsx
│       ├── TokenEditModal.tsx
│       └── ...
├── 📂 context/            # Context API do React
│   ├── AuthContext.tsx
│   ├── NavigationContext.tsx
│   └── 📂 gameSession/    # Contextos da sessão de jogo
├── 📂 services/           # Serviços e lógica de negócio
│   ├── apiService.ts      # Comunicação com API REST
│   ├── socketService.ts   # Gerenciamento WebSocket
│   ├── audioService.ts    # Sistema de áudio
│   ├── characterService.ts
│   ├── campaignService.ts
│   └── ...
├── 📂 types/              # Definições TypeScript
│   ├── models.ts          # Modelos de dados
│   └── ...
├── 📂 views/              # Páginas/Views principais
│   ├── LoginView.tsx
│   ├── DashboardView.tsx
│   ├── CharacterCreateView.tsx
│   ├── CampaignDashboardView.tsx
│   └── GameSessionView.tsx
├── 📂 utils/              # Funções utilitárias
├── 📂 data/               # Dados estáticos (raças, classes, etc)
├── 📂 server/             # Backend Node.js
│   ├── index.js           # Servidor Express
│   ├── socket.js          # Configuração Socket.io
│   ├── db.js              # Configuração SQLite
│   ├── 📂 socket/         # Handlers WebSocket
│   │   └── 📂 handlers/
│   │       ├── audioHandlers.js
│   │       ├── chatHandlers.js
│   │       ├── drawingHandlers.js
│   │       ├── handoutHandlers.js
│   │       ├── sceneHandlers.js
│   │       └── tokenHandlers.js
│   └── database.sqlite    # Banco de dados
├── App.tsx                # Componente raiz
├── index.tsx              # Entry point
├── vite.config.ts         # Configuração Vite
├── tsconfig.json          # Configuração TypeScript
└── package.json           # Dependências do projeto
```

---

## 🎯 Funcionalidades Detalhadas

### 🎭 Sistema de Criação de Personagens

O QuestBinder oferece um sistema completo de criação de fichas D&D 5e:

1. **Escolha de Raça**: Humano, Elfo, Anão, Halfling, Draconato, Gnomo, Meio-Elfo, Meio-Orc, Tiefling
2. **Seleção de Classe**: Bárbaro, Bardo, Clérigo, Druida, Guerreiro, Monge, Paladino, Ranger, Ladino, Feiticeiro, Bruxo, Mago
3. **Distribuição de Atributos**: Sistema de pontos ou rolagem de dados
4. **Perícias e Proficiências**: Seleção baseada em classe e background
5. **Equipamento Inicial**: Itens e armas de acordo com a classe
6. **Personalização**: Nome, aparência, história e traços de personalidade

### 🗺️ Virtual Tabletop - Guia Completo

#### Para o Mestre (GM)

**Preparando uma Sessão:**

1. **Upload de Mapa**: Clique em "Configurações do Mapa" → "Upload de Imagem"
2. **Configurar Grid**: Ajuste o tamanho das células (padrão: 5 pés)
3. **Adicionar Tokens**: 
   - Arraste personagens dos jogadores para o mapa
   - Abra o Compêndio → Bestiário → Clique em um monstro → "Adicionar ao Mapa"
4. **Preparar Áudio**: Upload de músicas na aba "Áudio" → Configure zonas se desejar
5. **Criar Handouts**: Prepare documentos para compartilhar com jogadores

**Durante a Sessão:**

- **Mover Tokens**: Arraste tokens pelo mapa (sincronizado em tempo real)
- **Controlar Áudio**: Play/Pause/Stop na aba de áudio
- **Desenhar no Mapa**: Use ferramentas de desenho para marcar áreas
- **Medir Distâncias**: Use a régua para calcular alcances
- **Compartilhar Handouts**: Clique em "Compartilhar" em um handout
- **Gerenciar Combate**: Use o Combat Tracker para iniciativa

#### Para Jogadores

**Entrando na Sessão:**

1. Faça login na plataforma
2. Acesse a campanha que você foi convidado
3. Clique em "Entrar na Sessão"
4. Sua ficha de personagem será carregada automaticamente

**Durante o Jogo:**

- **Visualizar o Mapa**: Veja o mapa e tokens em tempo real
- **Mover seu Token**: Arraste seu token (se tiver permissão)
- **Rolar Dados**: Use o rolador de dados ou comandos no chat
- **Ver Handouts**: Acesse documentos compartilhados pelo mestre
- **Usar Chat**: Comunique-se com o grupo
- **Ouvir Áudio**: Música ambiente sincronizada automaticamente

### 🎲 Sistema de Dados - Comandos

Use o chat ou o rolador de dados com estas sintaxes:

```
/roll 1d20           # Rola 1d20
/roll 2d6+3          # Rola 2d6 e adiciona 3
/roll 1d20+5         # Ataque com modificador +5
/roll 1d20 adv       # Rolagem com vantagem (2d20, maior valor)
/roll 1d20 dis       # Rolagem com desvantagem (2d20, menor valor)
/roll 8d6            # Dano de bola de fogo
/roll 1d20+3+1d4     # Ataque com bênção
```

### 🎵 Sistema de Áudio - Recursos

**Upload de Músicas:**
- Formatos suportados: MP3, WAV, OGG
- Tamanho máximo: 50MB por arquivo
- Organização por playlists

**Controles em Tempo Real:**
- ▶️ Play: Inicia a música para todos
- ⏸️ Pause: Pausa sincronizada
- ⏹️ Stop: Para e reseta
- 🔊 Volume: Controle individual e global

**Zonas de Áudio:**
- Defina áreas no mapa que ativam músicas específicas
- Música muda automaticamente quando tokens entram/saem de zonas
- Perfeito para ambientação de diferentes locais

---

## 🔄 WebSocket e Sincronização em Tempo Real

O QuestBinder usa **Socket.io** para garantir que todas as ações sejam sincronizadas instantaneamente entre todos os jogadores.

### Eventos Sincronizados

| Evento | Descrição |
|--------|-----------|
| `token:add` | Novo token adicionado ao mapa |
| `token:update` | Token movido ou editado |
| `token:delete` | Token removido |
| `drawing:add` | Novo desenho no mapa |
| `drawing:delete` | Desenho apagado |
| `scene:update` | Mudança de cena/mapa |
| `audio:play` | Música iniciada |
| `audio:pause` | Música pausada |
| `audio:stop` | Música parada |
| `audio:volume` | Volume alterado |
| `chat:message` | Nova mensagem no chat |
| `handout:share` | Handout compartilhado |
| `character:update` | Ficha de personagem atualizada |

### Sistema de Reconexão

O QuestBinder possui um sistema robusto de reconexão:

- **Detecção Automática**: Identifica quando a conexão é perdida
- **Banner de Reconexão**: Aviso visual proeminente
- **Fila de Ações**: Ações são enfileiradas durante desconexão
- **Sincronização Automática**: Ao reconectar, todas as ações pendentes são enviadas
- **Estado Consistente**: Garante que nenhuma ação seja perdida

---

## 🧪 Testando a Aplicação

### Teste Multiplayer Local

Para testar a sincronização em tempo real:

1. Abra o navegador em `http://localhost:5173`
2. Faça login como **Mestre** (crie uma conta)
3. Crie uma campanha e inicie uma sessão
4. Abra uma **janela anônima** do navegador
5. Acesse `http://localhost:5173` na janela anônima
6. Faça login como **Jogador** (crie outra conta)
7. Entre na mesma campanha

Agora você pode testar:
- ✅ Movimento de tokens sincronizado
- ✅ Desenhos aparecendo em ambas as janelas
- ✅ Chat em tempo real
- ✅ Áudio sincronizado
- ✅ Handouts compartilhados

---

## 🐛 Solução de Problemas

### Servidor não inicia

**Problema**: `Error: Cannot find module 'express'`

**Solução**:
```bash
cd server
npm install
```

### Frontend não conecta ao backend

**Problema**: Erro de CORS ou conexão recusada

**Solução**:
1. Verifique se o servidor está rodando em `http://localhost:3001`
2. Verifique o arquivo `services/apiService.ts` - a URL base deve ser `http://localhost:3001`

### WebSocket não conecta

**Problema**: Tokens não sincronizam

**Solução**:
1. Abra o Console do navegador (F12)
2. Verifique se há erros de conexão WebSocket
3. Certifique-se de que o servidor está rodando
4. Verifique se a porta 3001 não está bloqueada

### Chave API Gemini não funciona

**Problema**: Recursos de IA não funcionam

**Solução**:
1. Verifique se o arquivo `.env.local` está na **raiz do projeto**
2. Certifique-se de que a chave está correta
3. Reinicie o servidor de desenvolvimento (`npm run dev`)

### Banco de dados corrompido

**Problema**: Erros ao carregar dados

**Solução**:
```bash
cd server
rm database.sqlite  # Remove o banco antigo
node seed.js        # Recria com dados de exemplo
```

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. **Fork** o projeto
2. Crie uma **branch** para sua feature (`git checkout -b feature/MinhaFeature`)
3. **Commit** suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. **Push** para a branch (`git push origin feature/MinhaFeature`)
5. Abra um **Pull Request**

### Diretrizes

- Siga o padrão de código TypeScript
- Adicione comentários em código complexo
- Teste suas mudanças antes de enviar
- Atualize a documentação se necessário

---

## 📝 Roadmap

### Em Desenvolvimento

- [ ] Fog of War dinâmico
- [ ] Sistema de iluminação e visão
- [ ] Efeitos visuais de magias
- [ ] Integração com Discord
- [ ] Modo mobile responsivo

### Planejado

- [ ] Sistema de macros
- [ ] Marketplace de mapas e tokens
- [ ] Gravação de sessões
- [ ] Suporte a outros sistemas de RPG (Pathfinder, Call of Cthulhu)
- [ ] Modo offline

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

## 👥 Autores

- **Desenvolvedor Principal** - *Trabalho Inicial* - [Seu Nome](https://github.com/seu-usuario)

---

## 🙏 Agradecimentos

- Comunidade D&D pela inspiração
- Contribuidores open-source
- Jogadores e mestres que testaram a plataforma

---

## 📞 Suporte

Encontrou um bug ou tem uma sugestão?

- 🐛 [Reporte um Bug](https://github.com/seu-usuario/questbinder/issues)
- 💡 [Sugira uma Feature](https://github.com/seu-usuario/questbinder/issues)
- 📧 Email: seu-email@exemplo.com

---

<div align="center">

**Feito com ❤️ para a comunidade de RPG**

⭐ Se você gostou do projeto, deixe uma estrela!

</div>
