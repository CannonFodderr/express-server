import { Router } from "express";
import { createLogger } from "../utils/logger.util";
const logger = createLogger('health-controller')
export class HealthController {
    constructor(app: Router, baseRoute: string = '') {
        const healthRouter = Router();

        this.getHealth(healthRouter);

        app.use(`${baseRoute}/public/health`, healthRouter);
        logger.info(`Mounted Health Controller @ ${baseRoute}/public/health`);
    }

    getHealth(router: Router) {
        router.get("/", async (_req, res) => {
            res.status(200).json({ timestamp: new Date().toISOString() });
        })
    }
}


export default function createHealthController(app: Router, baseGateway: string) {
    return new HealthController(app, baseGateway);
}
