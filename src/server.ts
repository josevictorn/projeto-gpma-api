import { env } from "@/env";
import { app } from "./infra/app";

app.listen({ port: env.PORT, host: "0.0.0.0" }).then(() => {
	console.log(`🪨 Slate server running on <http://localhost>:${env.PORT}`);
	console.log(`📖 Docs available at <http://localhost>:${env.PORT}/docs`);
});
