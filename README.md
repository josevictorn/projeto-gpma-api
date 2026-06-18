# Vero API

> API REST para gerenciamento de escritório de advocacia (GPMA), construída com Fastify, Drizzle ORM e TypeScript.

---

## Índice

- [Visão Geral](#visão-geral)
- [Arquitetura e Estrutura de Pastas](#arquitetura-e-estrutura-de-pastas)
- [Stack Tecnológico](#stack-tecnológico)
- [Scripts Disponíveis](#scripts-disponíveis)
- [Instalação e Configuração](#instalação-e-configuração)
- [Documentação da API](#documentação-da-api)
- [📖 Guia: Como Criar uma Nova Feature](./docs/creating-features.md)
- [Autores](#autores)

---

## Visão Geral

A **Vero API** é o backend de um sistema de gestão de escritório de advocacia. Ela expõe endpoints RESTful para autenticação, gestão de usuários e redefinição de senha, com suporte a roles (`ADMIN`, `LAWYER`, `CLIENT`).

A arquitetura segue os princípios de **Clean Architecture** com separação em camadas bem definidas:

- **Controllers** — recebem e validam requisições HTTP (Fastify + Zod)
- **Use Cases** — encapsulam a lógica de negócio
- **Repositories** — abstraem o acesso ao banco de dados (Drizzle ORM)
- **Core** — utilitários genéricos reutilizáveis (Either, CRUD genérico, presenters, paginação)

O tratamento de erros segue o padrão funcional **Either (Left/Right)**, evitando exceções não controladas nos use cases.

---

## Arquitetura e Estrutura de Pastas

```
vero-api/
├── drizzle/
│   └── migrations/          # Migrações SQL geradas pelo Drizzle Kit
├── src/
│   ├── @types/              # Declarações de tipos globais (ex: extensões Fastify)
│   ├── core/                # Utilitários e abstrações genéricas
│   │   ├── base-repository.ts      # Interface IRepository<TSelect, TInsert>
│   │   ├── base-use-case.ts        # Interface IUseCase<Input, Output>
│   │   ├── crud-controller.ts      # Factory de controllers CRUD genéricos
│   │   ├── crud-use-case.ts        # Use cases CRUD genéricos (Create, Get, Fetch, Edit, Delete)
│   │   ├── drizzle-repository.ts   # Implementação genérica do repositório com Drizzle ORM
│   │   ├── either.ts               # Monad Either (Left/Right) para tratamento funcional de erros
│   │   ├── errors.ts               # Hierarquia de erros de domínio (AppError e subclasses)
│   │   ├── middleware.ts           # Middleware de verificação JWT (verifyJWT)
│   │   ├── module.ts               # Factory defineModule — cria módulos CRUD completos
│   │   ├── pagination.ts           # Tipos e utilitários de paginação
│   │   └── presenter.ts            # Transformação de entidades para resposta (camelCase → snake_case)
│   ├── env/
│   │   └── index.ts         # Validação e exportação das variáveis de ambiente via Zod
│   ├── infra/
│   │   └── app.ts           # Instância Fastify configurada (plugins, middlewares, error handler)
│   ├── lib/
│   │   ├── db.ts            # Conexão com o banco de dados PostgreSQL via Drizzle ORM
│   │   └── mail.ts          # Interface MailProvider e implementação NodemailerMailProvider
│   ├── modules/
│   │   ├── schemas.ts       # Re-exportação de todos os schemas Drizzle dos módulos
│   │   └── users/
│   │       ├── controllers/
│   │       │   ├── authenticate.ts      # POST /users/authenticate
│   │       │   ├── forgot-password.ts   # POST /users/forgot-password
│   │       │   ├── profile.ts           # GET /users/profile
│   │       │   ├── register.ts          # POST /users (registro público)
│   │       │   └── reset-password.ts    # POST /users/reset-password
│   │       ├── use-cases/
│   │       │   ├── authenticate.ts
│   │       │   ├── profile.ts
│   │       │   ├── register.ts
│   │       │   ├── request-password-reset.ts
│   │       │   └── reset-password.ts
│   │       ├── module.ts        # Registro do módulo no Fastify
│   │       ├── presenter.ts     # Serialização da entidade User para resposta
│   │       ├── repository.ts    # UsersRepository + PasswordResetTokensRepository
│   │       └── schema.ts        # Schema Drizzle das tabelas users e password_reset_tokens
│   └── server.ts            # Ponto de entrada — inicializa e sobe o servidor
├── .env                     # Variáveis de ambiente locais (não versionado)
├── .env.example             # Exemplo de variáveis de ambiente
├── biome.json               # Configuração do linter/formatter Biome
├── docker-compose.yml       # PostgreSQL + Mailpit (para desenvolvimento)
├── drizzle.config.ts        # Configuração do Drizzle Kit
├── package.json
└── tsconfig.json
```

### Padrão Either

Todos os use cases retornam `Either<Error, Result>`:

```typescript
// Erro → Left
return left(new NotFoundError("User", email));

// Sucesso → Right
return right({ user });

// Verificação no controller
if (result.isLeft()) {
  return reply.status(error.statusCode).send({ message: error.message });
}
```

### CRUD Genérico

O `defineModule` cria um módulo CRUD completo a partir de um schema Drizzle:

```typescript
defineModule({
  resource: "users",
  singular: "user",
  table: users,
  schemas: { create, edit, response },
  middlewares: [verifyJWT],
  except: ["create", "delete"], // rotas desabilitadas
});
```

Isso gera automaticamente as rotas `GET /users`, `GET /users/:id`, `PATCH /users/:id`, respeitando as opções `only` e `except`.

---

## Stack Tecnológico

| Categoria | Tecnologia | Versão |
|---|---|---|
| Runtime | Node.js | — |
| Linguagem | TypeScript | ^6.0.3 |
| Framework HTTP | Fastify | ^5.8.5 |
| ORM | Drizzle ORM | ^0.45.2 |
| Banco de Dados | PostgreSQL | — |
| Validação | Zod | ^4.4.3 |
| Autenticação | JWT (`@fastify/jwt`) | ^10.1.0 |
| Hashing de Senha | Argon2 | ^0.44.0 |
| Envio de E-mail | Nodemailer | ^8.0.10 |
| Documentação API | Swagger (`@fastify/swagger`) + Scalar | ^9.7.0 |
| Linter/Formatter | Biome (via Ultracite) | — |
| Migrations | Drizzle Kit | ^0.31.10 |
| Dev Server | tsx (watch mode) | ^4.22.4 |
| Package Manager | pnpm | 10.27.0 |

---

## Scripts Disponíveis

```bash
# Iniciar servidor em modo desenvolvimento (com watch)
pnpm dev

# Iniciar servidor em produção
pnpm start

# Gerar migrações SQL a partir das mudanças no schema
pnpm db:generate

# Rodar migrações no banco de dados
pnpm db:migrate

# Abrir Drizzle Studio (visualizador do banco)
pnpm db:studio

# Verificar código com Biome (lint + format)
pnpm check

# Corrigir problemas automaticamente com Biome
pnpm fix
```

---

## Instalação e Configuração

### Pré-requisitos

- Node.js >= 20
- pnpm >= 10
- Docker e Docker Compose (para banco de dados e e-mail local)

### 1. Clone o repositório

```bash
git clone <url-do-repositório>
cd vero-api
```

### 2. Instale as dependências

```bash
pnpm install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo de exemplo e preencha os valores:

```bash
cp .env.example .env
```

Edite o arquivo `.env`:

```env
# Geral
NODE_ENV=dev
PORT=3333

# Autenticação
JWT_SECRET=sua_chave_secreta_aqui

# Banco de Dados (PostgreSQL)
DATABASE_URL=postgresql://docker:docker@localhost:5432/vero_api
DATABASE_SCHEMA=public

# SMTP (E-mail)
SMTP_HOST=localhost           # Use "localhost" com Mailpit no desenvolvimento
SMTP_PORT=1025                # Porta SMTP do Mailpit
SMTP_USER=qualquer            # Qualquer valor (Mailpit aceita)
SMTP_PASS=qualquer
SMTP_FROM="Vero <no-reply@vero.com>"

# URL do Frontend (para links de redefinição de senha)
WEB_URL=http://localhost:5173
```

### 4. Suba os serviços com Docker

```bash
docker compose up -d
```

Isso sobe:
- **PostgreSQL** na porta `5432`
- **Mailpit** (capturador de e-mails para desenvolvimento) na porta `8025` (UI) e `1025` (SMTP)

> Acesse a interface do Mailpit em: [http://localhost:8025](http://localhost:8025)

### 5. Rode as migrações

```bash
pnpm db:migrate
```

> ⚠️ **Passo obrigatório.** O `pnpm install` **não** aplica migrações — ele apenas
> instala dependências. As migrações em `drizzle/migrations/` só existem no banco
> depois que `pnpm db:migrate` é executado.
>
> Rode `pnpm db:migrate` sempre que:
> - subir o ambiente pela primeira vez;
> - fizer `git pull` e surgirem novos arquivos em `drizzle/migrations/`;
> - recriar o container do PostgreSQL (`docker compose down -v`).
>
> Sintoma de migração pendente: requisições retornam **500** e o log mostra
> `relation "<tabela>" does not exist`.

### 6. Inicie o servidor

```bash
pnpm dev
```

O servidor estará disponível em: `http://localhost:3333`

---

## Documentação da API

A documentação interativa é gerada automaticamente via **Swagger + Scalar** e fica disponível em:

**`http://localhost:3333/docs`**

### Autenticação

A API utiliza **JWT Bearer Token**. Para acessar rotas protegidas, inclua o header:

```
Authorization: Bearer <access_token>
```

O token é obtido na rota de autenticação e expira em **10 minutos**.

---

## Autores

| Nome | Gitlab |
|---|---|
| José Victor | @jose.victor.nascimento.017 |
| Gabriel Soares | @Gsdvl |
| Hiranilson Andrade | @hiranilson.ufrn |
| Walter Araújo | @itswalterf |
