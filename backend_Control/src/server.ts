import { app } from './app';
import { env, validateEnv } from './config/env';
import { logger } from './utils/logger';

validateEnv();

app.listen(env.port, () => {
  logger.info('CONTROL backend running', { port: env.port });
});
