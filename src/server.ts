import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { ProcessConfig } from './types/config.type';
import createHealthController from './controllers/health.controller';
import createNotFoundController from './controllers/notFound.controller';
import { createLogger } from './utils/logger.util';
import { ipBlockerCleanup, stopIpBlockerCleanup } from './utils/ratelimit-timeout.util';
import { Server } from 'http';
import cookieParser from 'cookie-parser'

const logger = createLogger('server')
export const BASE_API = '/api/v1'

export class AppServer {
    private config: ProcessConfig
    private app: express.Application
    private server: Server
    constructor(config: ProcessConfig) {
        this.config = config
        this.app = express()
    }
    getApp() {
        return this.app
    }
    configure() {
        try {
            this.app.use(cors());
            this.app.use(helmet());
            this.app.use(cookieParser())
            this.app.disable('x-powered-by');

            return true
        } catch (error) {
            logger.error(`Error initializing server: ${error}`)
            return false
        }
    }
    mountControllers() {
        try {
            createHealthController(this.app, BASE_API)
            createNotFoundController(this.app)
            return true
        } catch (error) {
            logger.error(`Error mounting server controllers`)
            return false
        }
    }

    async initializeServices() {
        try {
            return true
        } catch (error) {
            return false
        }
    }
    async start(port: number, name: string = 'App') {
        try {
            ipBlockerCleanup()
            this.server = this.app.listen(port, () => {
                logger.info(`${name} serving on port ${port || this.config.SERVER_PORT}`)
            })
        } catch (error) {
            logger.fatal(error)
            process.exit(1)
        }
    }
    async stop(cb?: () => void) {
        try {
            stopIpBlockerCleanup()
            return this.server.close(cb)
        } catch (error) {
            logger.error(`Error stopping server: ${error}`)
            return null
        }
    }
}


export default function createServer(config: ProcessConfig): AppServer {
    return new AppServer(config)
}
