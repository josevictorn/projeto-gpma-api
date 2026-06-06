import type { FastifyInstance } from "fastify";
import { verifyJWT } from "@/core/middleware";
import { defineModule } from "@/core/module";
import { AuthenticateController } from "./controllers/authenticate";
import { ProfileController } from "./controllers/profile";
import { RegisterUserController } from "./controllers/register";
import { userPresenter } from "./presenter";
import { UsersRepository } from "./repository";
import {
	createUserSchema,
	editUserSchema,
	userResponseSchema,
	users,
} from "./schema";

const usersCrud = defineModule({
	resource: "users",
	singular: "user",
	table: users,
	schemas: {
		create: createUserSchema,
		edit: editUserSchema,
		response: userResponseSchema,
	},
	repository: new UsersRepository(users, users.id),
	presenter: userPresenter,
	middlewares: [verifyJWT],
	except: ["create", "delete"],
});

export async function usersModule(app: FastifyInstance) {
	await app.register(usersCrud);
	await app.register(RegisterUserController);
	await app.register(AuthenticateController);
	await app.register(ProfileController);
}
