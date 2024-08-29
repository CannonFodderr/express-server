import { Router } from "express";
import { createLogger } from "../utils/logger.util";
const logger = createLogger('health-controller')
export class HealthController {
    constructor(app: Router, baseGateway: string) {
        const healthRouter = Router();

        this.getHealth(healthRouter);

        app.use(`${baseGateway}/public/health`, healthRouter);
        logger.info(`Mounted Health Controller @ ${baseGateway}/public/health`);
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
