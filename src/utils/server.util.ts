import createServer from '../server';
import { ProcessConfig } from '../types/config.type';
import { createLogger } from './logger.util';

const logger = createLogger('test-server')

export function createTestServer(config: ProcessConfig) {
    const server = createServer(config)
    const initialized = server.configure()
    if (!initialized) {
        logger.fatal(`Error initializing server`)
    }
    return server
}
