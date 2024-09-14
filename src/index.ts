import createConfig from './config';
import createServer from './server';
import cluster from 'cluster'
import os from 'os'
import { createLogger } from './utils/logger.util';

const logger = createLogger('index')
const envCpus = Number(process.env.CLUSTER_CPUS)
const numCPUs = envCpus && envCpus < os.cpus().length ? envCpus : os.cpus().length

class AppWorker {
    constructor() {
        this.init()
    }

    async init() {
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
}
if(cluster.isPrimary) {
    logger.info(`Master ${process.pid} is running with ${numCPUs} cpus`);
    for (let i = 0; i < numCPUs; i++) {
        logger.debug(`Forking process ${i + 1}`)
        const worker = cluster.fork();
        worker.on('error', (error) => {
            logger.error(`worker ${worker.process.pid} encountered an error: ${error}`)
        })
        worker.on('exit', (code, signal) => {
            logger.warn(`worker ${worker.process.pid} died with code: ${code} and signal: ${signal}`);
        })
        worker.on('message', (message) => {
            logger.debug(`worker ${worker.process.pid} sent message: ${message}`)
        })
        worker.on('disconnect', () => {
            logger.debug(`worker ${worker.process.pid} disconnected`)
        })
    }

    cluster.on('exit', (worker, code, signal) => {
        logger.warn(`worker ${worker.process.pid} died`);
    });
} else {
    new AppWorker()
    logger.info(`Worker ${process.pid} started`);
}
