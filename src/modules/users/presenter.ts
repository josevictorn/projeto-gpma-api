import type { z } from "zod";
import { type PresenterFn, pickPresenter } from "@/core/presenter";
import type { User, userResponseSchema } from "./schema";

export const userPresenter = pickPresenter<User>([
	"id",
	"name",
	"email",
	"role",
	"createdAt",
]) as PresenterFn<User, z.infer<typeof userResponseSchema>>;
