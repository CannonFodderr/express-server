import { readFileSync } from "fs"
import { ConfigSupportedType, ProcessConfig } from "./types/config.type"
import { createLogger } from "./utils/logger.util"
import { resolve, join } from "path"
import { env as localEnv } from "process"

let loader: ConfigurationLoader
// These will optionally load from a .env file
const SUPPORTED_CONFIGURATIONS = {
    ENV: 'string',
    SERVER_PORT: 'number',
    SERVER_TEST_PORT: 'number',
    LOG_LEVEL: 'string',
    CLUSTER_CPUS: 'number',
    PROXY_SERVICE_TARGETS: 'object',
}

const logger = createLogger('config-loader')

class ConfigurationLoader {
    #config: ProcessConfig
    constructor () {
        this.#config = {
            ENV: "development",
            SERVER_PORT: 5000,
            SERVER_TEST_PORT: 5001,
            LOG_LEVEL: "info",
            CLUSTER_CPUS: 1,
            PROXY_SERVICE_TARGETS: {}
        }
        this.load()
    }
    private load (): ProcessConfig {
        const validated = this.validateLoadedConfig(localEnv)
        if(!validated) {
            logger.fatal(`Error while loading env configuration: env validation failed`)
            return process.exit(0)
        }
        logger.debug(`Loaded validated configuration`)
        return this.#config
    }
    private loadJSONFile (path: string) {
        const fullPath = resolve(join(process.cwd(), path))
        const content = readFileSync(fullPath, {"encoding": "utf-8" })
        const parsed = JSON.parse(content)
        if(!parsed) {
            throw new Error(`Failed to parse providers data @ ${fullPath}`)
        }
        return parsed
    }
    private envObjectParser(config: { [key: string]: any }, prefix: string, seperator: string = '|'): { [key: string]: string } | undefined {
        try {
            logger.debug(`Parsing object with prefix: ${prefix}, seperator: ${seperator}`)
            const arr = this.envArrParser(config, prefix)
            const object: { [key: string]: string } = {}
            arr.forEach((v: string) => {
                const [key, value] = v.split(seperator)
                object[key] = value
            })
            return object
        } catch (error) {
            logger.error(error)
            return undefined
        }
    }
    private envArrParser(config: { [key: string]: any }, prefix: string): string[] {
        try {
            logger.debug(`Parsing array with prefix: ${prefix}`)
            const valuesArr = Object.keys(config).filter(k => k.startsWith(prefix)).map(k => config[k])
            logger.debug(`Parsed array: ${JSON.stringify(valuesArr)}`)
            if (!Array.isArray(valuesArr)) {
                throw new Error(`Invalid array for prefix: ${prefix}, value: ${valuesArr}, type: ${typeof valuesArr}`)
            }
            return valuesArr
        } catch (error) {
            logger.error(error)
            return []
        }
    }
    private parseKeyValue (key: string, value: any, type: ConfigSupportedType, config: {[key: string]: any } ): ConfigSupportedType | undefined {
        try {
            if(type === "number") {
                const parsed = Number(value)
                return isNaN(parsed) ? undefined : parsed
            }
            if(type === "object") {
                const createdObj = this.envObjectParser(config, key, '|')
                logger.debug(`Parsed env object: ${JSON.stringify(createdObj)}`)
                if (!createdObj) {
                    throw new Error(`Error parsing key: ${key} value: ${value} type: ${type}`)
                }
                return createdObj
            }
            if (type === "boolean") {
                if (typeof value === "boolean") return value
                if (typeof value === "string" && ["true", "false"].includes(value.toLowerCase())) {
                    return value.toLowerCase() === "true"
                }
            }
            if(type === "array") {
                const createdArr = this.envArrParser(config, key)
                logger.debug(`Parsed env array: ${JSON.stringify(createdArr)}`)
                return createdArr
            }
            if(type === "string" && (typeof value !== "string" || value.length === 0)) {
                throw new Error(`Invalid value for key: ${key} value: ${value} type: ${typeof value}`)
            }
            return value
        } catch (error) {
            logger.error(`Error parsing value for key ${key}: ${error}`);
            return undefined
        }
    }
    private validateLoadedConfig (config: {[key: string]: any }): boolean {
        let isValid = true
        for (const key in SUPPORTED_CONFIGURATIONS) {
            const value = config[key]
            const keyType = SUPPORTED_CONFIGURATIONS[key as keyof typeof SUPPORTED_CONFIGURATIONS]

            if((!['object', 'array'].includes(keyType) && !value && !isNaN(value))) {
                logger.error(`Missing required env variable: ${key}`)
            }
            logger.debug(`Parsing key: ${key} value: ${value} type: ${keyType}`)
            const parsedValue = this.parseKeyValue(key, value, keyType, config)
            if(parsedValue === undefined) {
                logger.error(`Error parsing key: ${key} value: ${value}`)
                return false
            }

            this.#config[key] = parsedValue

        }
        return isValid
    }
    getConfig () {
        return this.#config
    }
}


export default function createServerConfiguration () {
    if(!loader || loader.getConfig()) {
        loader = new ConfigurationLoader()
    }
    return loader.getConfig()
}
