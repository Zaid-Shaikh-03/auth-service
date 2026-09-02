import { config } from "dotenv";
import { z } from "zod";
import path from "path";

config({
    path: path.join(__dirname, `../../.env.${process.env.NODE_ENV}`),
});

const envSchema = z.object({
    PORT: z.coerce.number().int().positive(),
    NODE_ENV: z.enum(["development", "production", "test"]),

    DB_HOST: z.string().min(1),
    DB_PORT: z.coerce.number().int().positive(),
    DB_USERNAME: z.string().min(1),
    DB_PASSWORD: z.string().min(1),
    DB_NAME: z.string().min(1),
    REFRESH_TOKEN_SECRET: z
        .string()
        .min(32)
        .regex(/^[a-zA-Z0-9]+$/, "must contain only alphanumeric characters"),
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
    DB_HOST: parsedEnv.data.DB_HOST,
    DB_PORT: parsedEnv.data.DB_PORT,
    DB_USERNAME: parsedEnv.data.DB_USERNAME,
    DB_PASSWORD: parsedEnv.data.DB_PASSWORD,
    DB_NAME: parsedEnv.data.DB_NAME,
    REFRESH_TOKEN_SECRET: parsedEnv.data.REFRESH_TOKEN_SECRET,
});
