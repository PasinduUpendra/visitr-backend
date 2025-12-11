import { app } from "./app";
import { env } from "./config/env";
import { logger } from "./utils/logger";

const port = env.PORT;

app.listen(port, () => {
  logger.info(`Visa App backend listening on http://localhost:${port}`);
});
