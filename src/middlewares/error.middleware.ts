/**
 * Express error middleware.
 *
 * @param err - The error object with a status code.
 * @param req - The Express request object.
 * @param res - The Express response object.
 * @param next - The next middleware function.
 */

// app.use("/", (req, res, next) => {
//   try{
    // code block to be executed
// }catch(err){
//   next(err);
// }
// })
import { NextFunction, Request, Response } from "express";
import { createLogger } from "../utils/logger.util";
import { ErrorWithStatusCode } from "../types/error.type";
const logger = createLogger('error-middleware')



export function errorHandler(err: ErrorWithStatusCode, req: Request, res: Response, next: NextFunction) {
    logger.error(`${err.message}`)
    const errStatus = err.statusCode || 500;
    const errMsg = err.message || 'Something went wrong';
    res.status(errStatus).json({
        status: errStatus,
        message: errMsg,
        stack: process.env.NODE_ENV === 'development' ? err.stack : {}
    })
}

export default errorHandler;
