import pino, { LoggerOptions } from 'pino';
import { context } from './async-storage.util'
import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto'

export const X_APP_TRACE_HEADER = 'x-app-trace-id'

const version = require('../../package.json').version
const TRACING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']

const loggerOptions: LoggerOptions = {
    timestamp: () => pino.stdTimeFunctions.isoTime(),
    mixin() {
        return {
            TRACE_HEADER: context.getStore()?.get(X_APP_TRACE_HEADER),
        }
    },
}
if (process.env.ENV === 'development') {
    loggerOptions.transport = {
        target: 'pino-pretty',
        options: {
            colorize: true,
            ignore: `pid,hostname, env, version, ${X_APP_TRACE_HEADER}`,
        }
    }
}

const logger = pino(loggerOptions).child({ 'env': process.env.ENV, 'version': version })
const logLevel = process.env.LOG_LEVEL?.toLowerCase()
if (logLevel === "debug") {
    logger.level = logLevel || 'info'
}

export const createLogger = (name: string): pino.Logger => logger.child({ 'name': name })

export const logTracingMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction,) => {
    const store = new Map();
    store.set(X_APP_TRACE_HEADER, randomUUID({ "disableEntropyCache": true }));
    if (TRACING_METHODS.includes(req.method)) {
        context.enterWith(store);
        next();
    } else {
        return context.run(store, next);
    }
};
