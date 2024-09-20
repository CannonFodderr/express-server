import { Options } from 'http-proxy-middleware'
import { createLogger, X_APP_TRACE_HEADER } from '../utils/logger.util'
import { context } from '../utils/async-storage.util'

const logger = createLogger('proxy-options-factory')

export default function getProxyServicesOptions(services: { [key: string]: string }, websocket: boolean = false): { route: string, options: Options }[] {
    const routes = Object.keys(services)
    return routes.map((serviceRoute) => {
        return {
            route: `${serviceRoute}`,
            options: {
                target: services[serviceRoute],
                ws: websocket,
                changeOrigin: true,
                on: {
                    error: function onError(err: any, req: any, res: any) {
                        logger.error(err);
                        res.sendStatus(500);
                    },
                    proxyReq: (proxyReq, req) => {
                        proxyReq.setHeader('X-Forwarded-Host', `${req.headers.host}`);
                        proxyReq.setHeader(X_APP_TRACE_HEADER, `${context.getStore()?.get(X_APP_TRACE_HEADER)}`);
                        logger.debug(`Got ${websocket ? 'WS' : 'HTTP'} request for ${serviceRoute}`);
                        // Log outbound request to remote target
                        logger.debug('REQ -->  ', req.method, req.url, '->',proxyReq.path);
                    },
                    proxyRes: (proxyRes, req, res) => {

                    },
                },
                logLevel: "debug"
            },
        }
    })
}
