# 🔧 Configuração de Variáveis de Ambiente

Este projeto utiliza variáveis de ambiente para centralizar todas as configurações e evitar valores hardcoded que podem causar erros.

## 📁 Estrutura de Arquivos

```
QuestBinder/
├── .env.example          # Template de variáveis do cliente
├── .env                  # Suas variáveis do cliente (não versionado)
└── server/
    ├── .env.example      # Template de variáveis do servidor
    └── .env              # Suas variáveis do servidor (não versionado)
```

## 🚀 Configuração Inicial

### 1. Cliente (Frontend)

Copie o arquivo `.env.example` para `.env` na raiz do projeto:

```bash
cp .env.example .env
```

O arquivo `.env` do cliente já vem com valores padrão que funcionam para desenvolvimento local.

### 2. Servidor (Backend)

Copie o arquivo `server/.env.example` para `server/.env`:

```bash
cp server/.env.example server/.env
```

O arquivo `.env` do servidor já vem com valores padrão que funcionam para desenvolvimento local.

## 📝 Variáveis Disponíveis

### Cliente (.env)

| Variável | Descrição | Valor Padrão |
|----------|-----------|--------------|
| `VITE_API_URL` | URL da API REST | `http://localhost:3001` |
| `VITE_API_BASE_PATH` | Caminho base da API | `/api` |
| `VITE_WS_URL` | URL do WebSocket | `http://localhost:3001` |
| `VITE_WS_RECONNECTION_ATTEMPTS` | Tentativas de reconexão | `Infinity` |
| `VITE_WS_RECONNECTION_DELAY` | Delay entre reconexões (ms) | `1000` |
| `VITE_WS_RECONNECTION_DELAY_MAX` | Delay máximo (ms) | `5000` |
| `VITE_APP_NAME` | Nome da aplicação | `QuestBinder` |
| `VITE_APP_VERSION` | Versão da aplicação | `1.0.0` |
| `VITE_DEV_PORT` | Porta do servidor de desenvolvimento | `5173` |

### Servidor (server/.env)

| Variável | Descrição | Valor Padrão |
|----------|-----------|--------------|
| `PORT` | Porta do servidor | `3001` |
| `HOST` | Host do servidor | `0.0.0.0` |
| `CORS_ORIGIN_1` | Primeira origem CORS permitida | `http://localhost:5173` |
| `CORS_ORIGIN_2` | Segunda origem CORS permitida | `http://127.0.0.1:5173` |
| `WS_PING_TIMEOUT` | Timeout do ping WebSocket (ms) | `20000` |
| `WS_PING_INTERVAL` | Intervalo do ping WebSocket (ms) | `25000` |
| `WS_MAX_HTTP_BUFFER_SIZE` | Tamanho máximo do buffer (bytes) | `20971520` (20MB) |
| `DB_PATH` | Caminho do banco de dados | `./data` |
| `NODE_ENV` | Ambiente de execução | `development` |

## ⚠️ Importante

### Sincronização de Portas

**CRÍTICO:** As portas do cliente e servidor devem estar sincronizadas:

- `VITE_API_URL` e `VITE_WS_URL` (cliente) devem apontar para a mesma porta do `PORT` (servidor)
- Exemplo: Se `PORT=3001` no servidor, então `VITE_WS_URL=http://localhost:3001` no cliente

### Segurança

- **NUNCA** commite arquivos `.env` no Git
- Os arquivos `.env` já estão no `.gitignore`
- Use `.env.example` como template para outros desenvolvedores
- Em produção, use variáveis de ambiente do sistema ou serviço de hospedagem

## 🔄 Alterando Configurações

### Para Desenvolvimento Local

Os valores padrão já funcionam. Não é necessário alterar nada.

### Para Produção

1. Crie arquivos `.env` em ambos os diretórios
2. Altere as URLs para seus domínios de produção
3. Configure `NODE_ENV=production`
4. Use HTTPS para URLs em produção

Exemplo de produção:

**Cliente (.env)**:
```env
VITE_API_URL=https://api.questbinder.com
VITE_WS_URL=https://api.questbinder.com
```

**Servidor (.env)**:
```env
PORT=443
NODE_ENV=production
CORS_ORIGIN_1=https://questbinder.com
CORS_ORIGIN_2=https://www.questbinder.com
```

## 🐛 Troubleshooting

### Erro: "Socket not connected"

Verifique se `VITE_WS_URL` está apontando para a porta correta do servidor (`PORT`).

### Erro: CORS

Certifique-se de que a URL do cliente está listada em `CORS_ORIGIN_1` ou `CORS_ORIGIN_2` no servidor.

### Mudanças não aplicadas

Após alterar variáveis de ambiente:
1. **Cliente**: Reinicie o servidor de desenvolvimento (`npm run dev`)
2. **Servidor**: Reinicie o servidor Node.js

## 📚 Mais Informações

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [dotenv Documentation](https://github.com/motdotla/dotenv)
