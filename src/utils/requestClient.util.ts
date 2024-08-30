import axios, { Axios, AxiosRequestConfig, CreateAxiosDefaults } from 'axios';
import { createLogger, X_APP_TRACE_HEADER } from './logger.util';
import { join } from 'node:path';
const logger = createLogger('request-service')
export class RequestClient {
    private client: Axios;
    constructor(defaults: CreateAxiosDefaults = {}) {
        this.client = axios.create(defaults);
    }
    async get(url: string, options?: AxiosRequestConfig) {
        try {
            return await this.client.get(url, options);
        } catch (error) {
            logger.error(error)
            logger.error(`Error getting url: ${join(this.client.defaults.baseURL || "", url)}, error: ${error.message}`);
            return error
        }
    }
    async post(url: string, data?: any, options?: AxiosRequestConfig) {
        try {
            return await this.client.post(url, data, options);
        } catch (error) {
            logger.error(error)
            logger.error(`Error posting to url: ${join(this.client.defaults.baseURL || "", url)}, error: ${error.message}`);
            return error
        }
    }
    async put(url: string, data: any,options?: AxiosRequestConfig) {
        try {
            return await this.client.put(url, data, options);
        } catch (error) {
            logger.error(`Error putting to url: ${url}, error: ${error.message}`);
            return error
        }
    }
    async delete(url: string, options?: AxiosRequestConfig) {
        try {
            return await this.client.delete(url, options);
        } catch (error) {
            logger.error(`Error deleting url: ${url}, error: ${error.message}`);
            return error
        }
    }
}

export function createSystemRequestClient(host: string, secret: string) {
    logger.debug(`Creating system request client: ${host}`)
    const tracingHeader = process.env.X_APP_TRACE_HEADER || X_APP_TRACE_HEADER
    return new RequestClient({ baseURL: `${host}/iam/system/auth`, headers: { tracingHeader: secret }})
}

export default function createRequestClient(defaults: CreateAxiosDefaults = {}) {
    return new RequestClient(defaults)
}
