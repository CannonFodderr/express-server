import { NextFunction, Request, Response } from "express"
import createAuthorityService from "../services/auth.service"
import { createLogger } from "../utils/logger.util"

const authService = createAuthorityService()
const logger = createLogger('jwt-middleware')

export function validateJwtMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
        const token = req.headers.authorization?.split(' ')[1]
        if (!token) {
            throw new Error('No token provided')
        }
        const decoded = authService.verifyToken(token)
        if (!decoded) {
            throw new Error('Invalid token')
        }
        return next()
    } catch (error) {
        logger.error(`Error validating JWT: ${error}`)
        return res.status(401).send('Unauthorized')
    }
}
