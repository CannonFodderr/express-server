import { Router } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import getProxyServicesOptions from "../factory/proxy-options.factory";
import { createLogger } from "../utils/logger.util";
import { validateJwtMiddleware } from "../middlewares/jwt.middleware";
import { ProxyServiceTargets } from "../types/proxy.type";

const logger = createLogger('proxy-controller')

export class ProxyController {
    constructor(app: Router, targets: ProxyServiceTargets) {
        const proxyRouter = Router();
        const proxyServices = getProxyServicesOptions(targets, true)

        for (const service of proxyServices) {
            logger.debug(`Mounting Proxy Service @ ${service.route} -> ${service.options.target}`)
            proxyRouter.use(service.route, validateJwtMiddleware, createProxyMiddleware(service.options))
        }

        app.use('/', proxyRouter);
        logger.info("Mounted Proxy Controller @ /");
    }
}



export default function createProxyController(app: Router, targets: ProxyServiceTargets) {
    return new ProxyController(app, targets)
}
