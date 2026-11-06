import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "../entities/User";
import { Config } from ".";
import { RefreshToken } from "../entities/RefreshToken";

export const getDatabaseSsl = (host: string) =>
    host === "localhost" || host === "127.0.0.1"
        ? false
        : { rejectUnauthorized: false };

export const AppDataSource = new DataSource({
    type: "postgres",
    host: Config.DB_HOST,
    port: Config.DB_PORT,
    username: Config.DB_USERNAME,
    password: Config.DB_PASSWORD,
    database: Config.DB_NAME,
    ssl: getDatabaseSsl(Config.DB_HOST),
    extra: {
        family: 4,
    },
    //dont use this in production, always keep false
    synchronize: false,
    logging: false,
    entities: [User, RefreshToken],
    migrations: [],
    subscribers: [],
});
