import app from "./app";
import { AppDataSource } from "./config/data-source";
import { Config } from "./config/index";
import logger from "./config/logger";

const startServer = async () => {
    const PORT = Config.PORT;
    try {
        await AppDataSource.initialize();
        logger.info("Database connected successfully");
        app.listen(PORT, () => logger.info(`Server Listening on port ${PORT}`));
    } catch (err) {
        if (err instanceof Error) {
            logger.error(err.message);
            setTimeout(() => {
                process.exit(1);
            }, 1000);
        }
        // eslint-disable-next-line no-console
        console.error(err);
    }
};

void startServer();
