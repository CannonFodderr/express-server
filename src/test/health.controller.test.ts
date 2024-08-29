import { describe, it, before, after } from "node:test"
import assert from "assert/strict"
import { AppServer } from "../server";
import { createTestServer } from "../utils/server.util";
import { ProcessConfig } from "../types/config.type";
import createHealthController, { HealthController } from "../controllers/health.controller";
import createRequestClient, { RequestClient } from "../utils/requestClient.util";
import getConfig from "../config"
import { createLogger } from "../utils/logger.util";
import { BASE_API } from "../server";
const logger = createLogger('health-controller-tests')

describe('Health controller test suite', () => {
    let config: ProcessConfig
    let server: AppServer
    let healthController: HealthController
    let requestClient: RequestClient
    before(async () => {
        config =  getConfig()
        const port = config.SERVER_TEST_PORT
        server = createTestServer(config)
        healthController = createHealthController(server.getApp(), BASE_API)


        requestClient = createRequestClient({ baseURL: `http://localhost:${port}${BASE_API}`})
        await server.start(port, 'IAM Controller server')
    })

    after(async () => {
        await server.stop(() => logger.info(`Closing IAM controller test server`))
    })

    it(`Should get health status and timestamp`, async () => {
        const res = await requestClient.get('/public/health')
        console.log({ data: res?.data })
        assert.ok(res)
        assert.strictEqual(res?.status, 200)
        assert.ok(res?.data)
        assert.ok(res?.data.timestamp)
    })
})
