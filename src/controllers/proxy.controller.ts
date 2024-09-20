import { Router } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import getProxyServicesOptions from "../factory/proxy-options.factory";
import { ProcessConfig } from "../types/config.type";
import { createLogger } from "../utils/logger.util";
import { AuthorityService } from "../services/auth.service";
import { validateJwtMiddleware } from "../middlewares/jwt.middleware";

const logger = createLogger('proxy-controller')

export class ProxyController {
    constructor(app: Router, config: ProcessConfig) {
        const proxyRouter = Router();
        const proxyServices = getProxyServicesOptions(config.PROXY_SERVICE_TARGETS, true)

        for (const service of proxyServices) {
            proxyRouter.use(service.route, validateJwtMiddleware, createProxyMiddleware(service.options))
        }

        app.use('/', proxyRouter);
        logger.info("Mounted Proxy Controller @ /");
    }
}



export default function createProxyController(app: Router, config: ProcessConfig) {
    return new ProxyController(app, config)
}
