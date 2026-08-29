import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
    PORT: z.coerce.number().int().positive(),
    NODE_ENV: z.enum(["development", "production", "test"]),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
    console.error("❌ Invalid environment variables:");

    console.error(
        parsedEnv.error.issues.map((issue) => ({
            variable: issue.path.join("."),
            message: issue.message,
        })),
    );

    process.exit(1);
}

export const Config = Object.freeze({
    PORT: parsedEnv.data.PORT,
    NODE_ENV: parsedEnv.data.NODE_ENV,
});
