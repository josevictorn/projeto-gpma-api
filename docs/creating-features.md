# Como Criar uma Nova Feature

Este guia explica como adicionar um novo módulo ou funcionalidade à **Vero API**, seguindo os padrões e convenções do projeto.

---

## Índice

- [Visão Geral do Sistema de Módulos](#visão-geral-do-sistema-de-módulos)
- [Caso 1 — CRUD Puro (sem customização)](#caso-1--crud-puro-sem-customização)
- [Caso 2 — CRUD com Use Case Customizado](#caso-2--crud-com-use-case-customizado)
- [Caso 3 — Rotas Completamente Customizadas (sem CRUD genérico)](#caso-3--rotas-completamente-customizadas-sem-crud-genérico)
- [Registrando o Módulo na Aplicação](#registrando-o-módulo-na-aplicação)
- [Gerar e Rodar as Migrações](#gerar-e-rodar-as-migrações)
- [Referência: Core](#referência-core)

---

## Visão Geral do Sistema de Módulos

Cada feature vive dentro de `src/modules/<nome-do-recurso>/` e é composta por até 4 arquivos:

| Arquivo | Obrigatório | Responsabilidade |
|---|---|---|
| `schema.ts` | ✅ Sempre | Tabela Drizzle + tipos inferidos + Zod schemas HTTP |
| `module.ts` | ✅ Sempre | Registra o módulo no Fastify via `defineModule` |
| `repository.ts` | Apenas se precisar de métodos extras | Estende `DrizzleRepository` com queries customizadas |
| `use-cases/*.ts` | Apenas se a lógica de negócio for customizada | Implementa `IUseCase` com regras específicas |
| `controllers/*.ts` | Apenas para rotas fora do CRUD padrão | Controllers Fastify customizados |

O `defineModule` oferece um CRUD completo (`GET /`, `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id`) com uma única chamada. Você controla quais rotas existem via `only` e `except`.

---

## Caso 1 — CRUD Puro (sem customização)

O caso mais simples. Apenas **2 arquivos** são necessários.

### `src/modules/cases/schema.ts`

```typescript
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { z } from "zod";

export const cases = pgTable("cases", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Tipos inferidos automaticamente do schema Drizzle
export type Case = typeof cases.$inferSelect;
export type NewCase = typeof cases.$inferInsert;

// Schemas Zod para validação HTTP
export const createCaseSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
});

export const editCaseSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
});

export const caseResponseSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  description: z.string(),
  created_at: z.date(),
});
```

### `src/modules/cases/module.ts`

```typescript
import type { FastifyInstance } from "fastify";
import { verifyJWT } from "@/core/middleware";
import { defineModule } from "@/core/module";
import { cases, caseResponseSchema, createCaseSchema, editCaseSchema } from "./schema";

const casesCrud = defineModule({
  resource: "cases",      // Prefixo da rota: /cases
  singular: "case",       // Usado em mensagens de erro: "case not found"
  table: cases,
  schemas: {
    create: createCaseSchema,
    edit: editCaseSchema,
    response: caseResponseSchema,
  },
  middlewares: [verifyJWT], // Todas as rotas protegidas por JWT
  // except: ["delete"],    // Use para desabilitar rotas específicas
  // only: ["get", "fetch"],// Use para habilitar apenas rotas específicas
});

export async function casesModule(app: FastifyInstance) {
  await app.register(casesCrud);
}
```

**Rotas geradas automaticamente:**

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/cases` | Criar |
| `GET` | `/cases?page=1` | Listar (paginado) |
| `GET` | `/cases/:id` | Buscar por ID |
| `PATCH` | `/cases/:id` | Editar |
| `DELETE` | `/cases/:id` | Deletar |

---

## Caso 2 — CRUD com Use Case Customizado

Use quando a lógica de criação (ou outra operação) precisa de validações de negócio adicionais, como checar se uma entidade relacionada existe.

### `src/modules/appointments/schema.ts`

```typescript
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { z } from "zod";
import { users } from "@/modules/users/schema";

export const appointments = pgTable("appointments", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;

export const createAppointmentSchema = z.object({
  clientId: z.uuid(),
  title: z.string().min(3),
  scheduledAt: z.coerce.date(),
});

export const editAppointmentSchema = z.object({
  title: z.string().min(3).optional(),
  scheduledAt: z.coerce.date().optional(),
});

export const appointmentResponseSchema = z.object({
  id: z.uuid(),
  client_id: z.uuid(),
  title: z.string(),
  scheduled_at: z.date(),
  created_at: z.date(),
});
```

### `src/modules/appointments/use-cases/create.ts`

> Implementa `IUseCase<Input, { item: TSelect }>` — o mesmo contrato que o use case genérico.

```typescript
import type { IRepository } from "@/core/base-repository";
import type { IUseCase } from "@/core/base-use-case";
import { type Either, left, right } from "@/core/either";
import type { AppError } from "@/core/errors";
import { NotFoundError } from "@/core/errors";
import type { User } from "@/modules/users/schema";
import type { Appointment, NewAppointment } from "../schema";

interface CreateAppointmentInput {
  clientId: string;
  title: string;
  scheduledAt: Date;
}

export class CreateAppointmentUseCase
  implements IUseCase<CreateAppointmentInput, { item: Appointment }>
{
  constructor(
    private readonly appointmentsRepository: IRepository<Appointment, NewAppointment>,
    private readonly usersRepository: IRepository<User>
  ) {}

  async execute(
    input: CreateAppointmentInput
  ): Promise<Either<AppError, { item: Appointment }>> {
    // Valida se o cliente existe
    const client = await this.usersRepository.findById(input.clientId);
    if (!client) {
      return left(new NotFoundError("User", input.clientId));
    }

    const appointment = await this.appointmentsRepository.create({
      clientId: input.clientId,
      title: input.title,
      scheduledAt: input.scheduledAt,
    });

    return right({ item: appointment });
  }
}
```

### `src/modules/appointments/module.ts`

```typescript
import type { FastifyInstance } from "fastify";
import { verifyJWT } from "@/core/middleware";
import { DrizzleRepository } from "@/core/drizzle-repository";
import { defineModule } from "@/core/module";
import { users } from "@/modules/users/schema";
import { CreateAppointmentUseCase } from "./use-cases/create";
import {
  appointmentResponseSchema,
  appointments,
  createAppointmentSchema,
  editAppointmentSchema,
} from "./schema";

// ⚠️ DrizzleRepository recebe a tabela E a coluna PK como segundo argumento
const appointmentsRepo = new DrizzleRepository(appointments, appointments.id);
const usersRepo = new DrizzleRepository(users, users.id);

const appointmentsCrud = defineModule({
  resource: "appointments",
  singular: "appointment",
  table: appointments,
  schemas: {
    create: createAppointmentSchema,
    edit: editAppointmentSchema,
    response: appointmentResponseSchema,
  },
  repository: appointmentsRepo,
  middlewares: [verifyJWT],
  useCases: {
    // Substitui apenas o create genérico; get/fetch/edit/delete continuam genéricos
    create: new CreateAppointmentUseCase(appointmentsRepo, usersRepo),
  },
});

export async function appointmentsModule(app: FastifyInstance) {
  await app.register(appointmentsCrud);
}
```

> **Atenção:** O `DrizzleRepository` recebe **dois argumentos**: `(table, pkColumn)`. Exemplo: `new DrizzleRepository(appointments, appointments.id)`.

---

## Caso 3 — Rotas Completamente Customizadas (sem CRUD genérico)

Use quando a feature não se encaixa no padrão CRUD (ex: envio de e-mail, geração de relatório, autenticação).

### `src/modules/reports/controllers/generate.ts`

```typescript
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { verifyJWT } from "@/core/middleware";

export const GenerateReportController: FastifyPluginAsyncZod = async (app) => {
  app.post(
    "/reports/generate",
    {
      onRequest: [verifyJWT],
      schema: {
        tags: ["reports"],
        summary: "Generate a report for a given period",
        body: z.object({
          startDate: z.coerce.date(),
          endDate: z.coerce.date(),
        }),
        response: {
          200: z.object({ reportUrl: z.string().url() }),
          400: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const { startDate, endDate } = request.body;

      // lógica do use case aqui...

      return reply.status(200).send({ reportUrl: "https://..." });
    }
  );
};
```

### `src/modules/reports/module.ts`

```typescript
import type { FastifyInstance } from "fastify";
import { GenerateReportController } from "./controllers/generate";

export async function reportsModule(app: FastifyInstance) {
  await app.register(GenerateReportController);
}
```

---

## Registrando o Módulo na Aplicação

Depois de criar o módulo, registre-o em [`src/infra/app.ts`](file:///Users/josevictor/Documents/www/gpma/vero-api/src/infra/app.ts):

```typescript
// 1. Importe o módulo
import { casesModule } from "@/modules/cases/module";

// 2. Registre no Fastify
app.register(casesModule);
```

Se o módulo possui tabelas com schemas Drizzle, exporte-os também em [`src/modules/schemas.ts`](file:///Users/josevictor/Documents/www/gpma/vero-api/src/modules/schemas.ts) (necessário para o Drizzle Kit encontrar todos os schemas durante as migrações):

```typescript
// src/modules/schemas.ts
export * from "@/modules/users/schema";
export * from "@/modules/cases/schema";       // ← adicione aqui
export * from "@/modules/appointments/schema"; // ← adicione aqui
```

---

## Gerar e Rodar as Migrações

Após adicionar a nova tabela no schema, gere e aplique a migração:

```bash
# Gera o arquivo SQL na pasta drizzle/migrations/
pnpm db:generate

# Aplica a migração no banco de dados
pnpm db:migrate
```

---

## Referência: Core

### `DrizzleRepository<TTable>`

Repositório genérico que implementa `IRepository`. Recebe a tabela e a coluna PK:

```typescript
// Assinatura do construtor
new DrizzleRepository(table: TTable, pkColumn: PgColumn)

// Exemplo
new DrizzleRepository(cases, cases.id)
```

**Métodos disponíveis:**

| Método | Descrição |
|---|---|
| `create(data)` | Insere um registro e retorna o resultado |
| `findById(id)` | Busca por UUID. Retorna `null` se não encontrar |
| `findMany({ page })` | Lista paginada (20 por página por padrão) |
| `save(entity)` | Atualiza todos os campos de um registro |
| `delete(id)` | Remove um registro pelo ID |

Para adicionar métodos customizados, estenda a classe:

```typescript
export class CasesRepository extends DrizzleRepository<typeof cases> {
  async findByTitle(title: string): Promise<Case | null> {
    const [row] = await db
      .select()
      .from(cases)
      .where(eq(cases.title, title))
      .limit(1);
    return row ?? null;
  }
}
```

---

### `defineModule` — Opções

```typescript
defineModule({
  resource: string;      // Prefixo da rota (ex: "cases" → /cases)
  singular: string;      // Nome singular para mensagens (ex: "case")
  table: PgTable;        // Tabela Drizzle (deve ter coluna .id)
  schemas: {
    create: ZodObject;   // Validação do body do POST
    edit: ZodObject;     // Validação do body do PATCH
    response: ZodObject; // Serialização da resposta
  };
  repository?: IRepository;     // Opcional. Default: DrizzleRepository
  presenter?: PresenterFn;      // Opcional. Default: snakeCasePresenter
  middlewares?: onRequestHookHandler[]; // Opcional. Ex: [verifyJWT]
  only?: ("create" | "fetch" | "get" | "edit" | "delete")[];  // Habilita apenas essas rotas
  except?: ("create" | "fetch" | "get" | "edit" | "delete")[]; // Desabilita essas rotas
  useCases?: {           // Sobrescreve use cases genéricos individualmente
    create?: CreateUseCase;
    get?: GetUseCase;
    fetch?: FetchUseCase;
    edit?: EditUseCase;
    delete?: DeleteUseCase;
  };
  extraRoutes?: (app: FastifyInstance) => Promise<void>; // Rotas extras no mesmo módulo
});
```

---

### Padrão Either

Todo use case deve retornar `Either<Erro, Resultado>`:

```typescript
import { type Either, left, right } from "@/core/either";
import { NotFoundError } from "@/core/errors";

// Retornar erro
return left(new NotFoundError("Case", input.id));

// Retornar sucesso
return right({ item: createdCase });

// No controller: verificar o resultado
if (result.isLeft()) {
  const error = result.value; // AppError com .statusCode e .message
  return reply.status(error.statusCode).send({ message: error.message });
}
const { item } = result.value;
```

**Erros disponíveis em `@/core/errors`:**

| Classe | Status | Uso |
|---|---|---|
| `NotFoundError(resource, id)` | 404 | Entidade não encontrada |
| `ConflictError(resource, field, value)` | 409 | Dado já existe (ex: e-mail duplicado) |
| `ValidationError(message?)` | 400 | Dados inválidos |
| `UnauthorizedError(message?)` | 401 | Não autenticado |
| `ForbiddenError(message?)` | 403 | Sem permissão |
