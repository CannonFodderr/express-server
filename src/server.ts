import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { ProcessConfig } from './types/config.type';
import createHealthController from './controllers/health.controller';
import createNotFoundController from './controllers/notFound.controller';
import { createLogger, logTracingMiddleware } from './utils/logger.util';
import { ipBlockerCleanup, stopIpBlockerCleanup } from './utils/ratelimit-timeout.util';
import { Server } from 'http';
import cookieParser from 'cookie-parser'
import createAuthorityService, { AuthorityService } from './services/auth.service';
import { Services } from './types/services.type';
import errorHandler from './middlewares/error.middleware';

const logger = createLogger('server')
export const BASE_API = '/api/v1'

export class AppServer {
    private config: ProcessConfig
    private app: express.Application
    private server: Server
    private services: Services
    constructor(config: ProcessConfig) {
        this.config = config
        this.app = express()
        this.services = {
            authService: createAuthorityService()
        }
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
            this.app.use(logTracingMiddleware)
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
            logger.debug(`Server controllers mounted`)
            // Mount error handler middleware catch controller errors and pass to next(err) function
            this.app.use(errorHandler)
            return true
        } catch (error) {
            logger.error(`Error mounting server controllers`)
            return false
        }
    }
    async initializeServices() {
        try {
            const configured = await this.services.authService.rotateConfiguration()
            if (!configured) {
                throw new Error('Error initializing authority service')
            }
            return true
        } catch (error) {
            logger.error(`Error initializing services: ${error}`)
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
