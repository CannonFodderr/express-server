import pino, { LoggerOptions } from 'pino';
import { context } from  './async-storage.util'
import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto'

const version = require('../../package.json').version
export const X_JEEN_TRACE_ID = 'x-jeen-trace-id'

const loggerOptions: LoggerOptions = {
    timestamp: () => pino.stdTimeFunctions.isoTime(),
    mixin() {
      return {
        'x-jeen-trace-id': context.getStore()?.get(X_JEEN_TRACE_ID),
      }
    }
}
if (process.env.ENV === 'development') {
    loggerOptions.transport = {
        target: 'pino-pretty',
        options: {
            colorize: true,
            ignore: 'pid,hostname',
        }
    }
}

const logger = pino(loggerOptions).child({ 'env': process.env.ENV, 'version': version })
  if (process.env.LOG_LEVEL === "debug") {
    logger.level = process.env.LOG_LEVEL || 'info'
  }

export const createLogger = (name: string): pino.Logger => logger.child({ 'name': name })

export const logTracingMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction,) => {
    const store = new Map();
    store.set(X_JEEN_TRACE_ID, randomUUID({"disableEntropyCache": true }));
    if (req.method === "POST") {
      context.enterWith(store);
      next();
    } else {
      return context.run(store, next);
    }
  };
