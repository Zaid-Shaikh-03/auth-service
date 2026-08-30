import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "../entities/User";
import { Config } from ".";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: Config.DB_HOST,
    port: Config.DB_PORT,
    username: Config.DB_USERNAME,
    password: Config.DB_PASSWORD,
    database: Config.DB_NAME,
    //dont use this in production
    synchronize:
        Config.NODE_ENV === "test" || Config.NODE_ENV === "development",
    logging: false,
    entities: [User],
    migrations: [],
    subscribers: [],
});
