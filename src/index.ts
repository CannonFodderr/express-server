import createConfig from './config';
import createServer from './server';
import { createLogger } from './utils/logger.util';

const logger = createLogger('index')

async function initServer() {
    try {
        const config = createConfig()
        const server = createServer(config)
        const initialized = server.configure()
        if (!initialized) {
            throw new Error(`Error initializing server`)
        }
        const initializeServices = await server.initializeServices()
        if(!initializeServices) {
            throw new Error(`Failed to initialize services`)
        }
        const controllersMounted = server.mountControllers()
        if(!controllersMounted) {
            throw new Error(`Error mounting server controllers`)
        }
        server.start(config.SERVER_PORT)
    } catch (error) {
        logger.fatal(`Error initializing server: ${error}`)
        process.exit(1)
    }
}




initServer()
