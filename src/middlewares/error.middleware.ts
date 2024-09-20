import { NextFunction, Request, Response } from "express";
import { createLogger } from "../utils/logger.util";
import { ErrorWithStatusCode } from "../types/error.type";
const logger = createLogger('error-middleware')



export default function errorMiddleware(err: ErrorWithStatusCode, req: Request, res: Response, next: NextFunction) {
    logger.error(`${err.message}`)
    const errStatus = err.statusCode || 500;
    const errMsg = err.message || 'Something went wrong';
    res.status(errStatus).json({
        status: errStatus,
        message: errMsg,
        stack: process.env.NODE_ENV === 'development' ? err.stack : {}
    })
}
