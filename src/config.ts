import { readFileSync } from "fs"
import { ConfigSupportedType, ProcessConfig } from "./types/config.type"
import { createLogger } from "./utils/logger.util"
import { resolve, join } from "path"

let loader: ConfigurationLoader
const REQUIRED_CONFIGURATIONS = {
    ENV: 'string',
    SERVER_PORT: 'number',
    SERVER_TEST_PORT: 'number',
    LOG_LEVEL: 'string',
}

const logger = createLogger('config-loader')

class ConfigurationLoader {
    #config: ProcessConfig
    constructor () {
        this.#config = {}
        this.load()
    }
    private load (): ProcessConfig {
        const localEnv = process.env
        const validated = this.validateLoadedConfig(localEnv)
        if(!validated) {
            logger.fatal(`Error while loading env configuration: env validation failed`)
            return process.exit(0)
        }
        logger.debug(`Loaded validated configuration`)
        return localEnv
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
    private parseKeyValue (key: string, value: any, type: ConfigSupportedType ): ConfigSupportedType | undefined {
        try {
            if(type === "number") {
                return isNaN(Number(value)) ? undefined : Number(value)
            }
            if(type === "object") {
                if(typeof value === "object") return value
                try {
                    return JSON.parse(value)
                } catch (error) {
                    console.error(`Error parsing ${type} for key ${key} and value ${value}: ${error}`)
                }
            }
            if (type === "boolean") {
                if (typeof value === "boolean") return value
                if (typeof value === "string" && ["true", "false"].includes(value.toLowerCase())) {
                    return value.toLowerCase() === "true"
                }
            }
            if (type === "string" && typeof value === "string" && value.length) {
                return value
            }
            return undefined
        } catch (error) {
            logger.error(`Error parsing value for key ${key}: ${error}`);
            return undefined
        }
    }
    private validateLoadedConfig (config: {[key: string]: any }): boolean {
        let isValid = true
        for (const key in REQUIRED_CONFIGURATIONS) {
            const value = config[key]
            if(!value && !isNaN(value)) {
                isValid = false
                logger.error(`Missing required env variable`)
            }
            const keyType = REQUIRED_CONFIGURATIONS[key as keyof typeof REQUIRED_CONFIGURATIONS]
            const parsedValue = this.parseKeyValue(key, value, keyType)

            if(parsedValue === undefined) {
                logger.error(`Error parsing key: ${key} value: ${value}`)
                isValid = false
            } else {
                this.#config[key] = parsedValue
            }

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
