import { describe, it, before, after } from "node:test"
import assert from "assert/strict"
import { join } from "path"
import { writeFileSync, unlinkSync } from "fs"
import createServerConfiguration from "../config"

describe("ConfigurationLoader", () => {
    const envBackup = process.env
    const configFilePath = join(process.cwd(), ".env.test")

    before(() => {
        process.env = {
            ENV: "test",
            SERVER_PORT: "6000",
            SERVER_TEST_PORT: "6001",
            LOG_LEVEL: "debug",
            CLUSTER_CPUS: "1",
            PROXY_SERVICE_TARGETS_0: "service1|http://localhost:3001",
            PROXY_SERVICE_TARGETS_1: "service2|http://localhost:3002"
        }
        writeFileSync(configFilePath, JSON.stringify(process.env))
    })

    after(() => {
        process.env = envBackup
        unlinkSync(configFilePath)
    })

    it("should load default configuration", () => {
        const config = createServerConfiguration()
        assert.equal(config.ENV, "test")
        assert.equal(config.SERVER_PORT, 6000)
        assert.equal(config.SERVER_TEST_PORT, 6001)
        assert.equal(config.LOG_LEVEL, "debug")
        assert.equal(config.CLUSTER_CPUS, 1)
        assert.deepEqual(config.PROXY_SERVICE_TARGETS, {
            service1: "http://localhost:3001",
            service2: "http://localhost:3002"
        })
    })

    it("should validate configuration correctly", () => {
        const config = createServerConfiguration()
        assert.ok(config)
    })

    it("should parse environment variables correctly", () => {
        const config = createServerConfiguration()
        assert.equal(config.SERVER_PORT, 6000)
        assert.equal(config.CLUSTER_CPUS, 1)
    })

    it("should parse proxy targets correctly", () => {
        const config = createServerConfiguration()
        assert.deepEqual(config.PROXY_SERVICE_TARGETS, {
            service1: "http://localhost:3001",
            service2: "http://localhost:3002"
        })
    })
})
