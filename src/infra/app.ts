import { fastifyCors } from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import { fastifySwagger } from "@fastify/swagger";
import ScalarApiReference from "@scalar/fastify-api-reference";
import { fastify } from "fastify";
import {
	hasZodFastifySchemaValidationErrors,
	jsonSchemaTransform,
	serializerCompiler,
	validatorCompiler,
	type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { ZodError, z } from "zod";
import { AppError } from "@/core/errors";
import { env } from "@/env";
import { leadsModule } from "@/modules/leads/module";
import { rolesModule } from "@/modules/roles/module";
import { usersModule } from "@/modules/users/module";

const app = fastify().withTypeProvider<ZodTypeProvider>();

app.register(fastifyJwt, {
	secret: env.JWT_SECRET,
	sign: {
		expiresIn: "10m",
	},
});

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(fastifyCors, {
	origin: true,
	methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
	credentials: true,
});

app.register(fastifySwagger, {
	openapi: {
		info: {
			title: "Vero API",
			description: "An API for law firm management.",
			version: "1.0.0",
		},
		components: {
			securitySchemes: {
				bearerAuth: {
					type: "http",
					scheme: "bearer",
					bearerFormat: "JWT",
				},
			},
		},
		security: [
			{
				bearerAuth: [],
			},
		],
	},
	transform: jsonSchemaTransform,
});

app.register(ScalarApiReference, {
	routePrefix: "/docs",
});

app.register(usersModule);
app.register(rolesModule);
app.register(leadsModule);

app.setErrorHandler((error, _, reply) => {
	if (hasZodFastifySchemaValidationErrors(error)) {
		return reply.status(400).send({
			message: "Validation error.",
			issues: error.validation.map((i) => ({ message: i.message })),
		});
	}

	if (error instanceof ZodError) {
		return reply.status(400).send({
			message: "Validation error.",
			issues: z.treeifyError(error),
		});
	}

	if (error instanceof AppError) {
		return reply.status(error.statusCode).send({ message: error.message });
	}

	if (env.NODE_ENV === "production") {
		// TODO: log externo (Sentry, DataDog, etc.)
	} else {
		console.error(error);
	}

	return reply.status(500).send({ message: "Internal server error." });
});

export { app };
