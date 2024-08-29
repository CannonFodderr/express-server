import { NextFunction } from "connect";
import { Request, Response } from "express";
import { createLogger } from "./logger.util";

const requestCounts: {[key: string ]: any } = {};
const rateLimit = 20; // Max requests per minute
const timeout = 15000; // Timeout in milliseconds (15 seconds)
const logger = createLogger("rate-limiter");
let rateLimiterInterval: NodeJS.Timeout;

export function ipBlockerCleanup(interval: number = 60 * 1000) {
    rateLimiterInterval = setInterval(() => {
        logger.debug("Clearing request counts");
        const currentTime = new Date().getTime();
        for (const ip in requestCounts) {
            const lastRequestTime = requestCounts[ip] || 0;
            if (currentTime - lastRequestTime > 60 * 1000) {
                logger.debug(`Clearing request count for IP: ${ip}`);
                delete requestCounts[ip];
            }
        }
    }, interval);
}
export function stopIpBlockerCleanup() {
    clearInterval(rateLimiterInterval);
}

export function rateLimitAndTimeout (req: Request, res: Response, next: NextFunction) {
    // Skip rate limiting for localhost
    if (req.ip === "::1" || req.ip === "127.0.0.1") {
        return next();
    }
    const ip = req.ip || ""; // Get client IP address
    // Update request count for the current IP
    requestCounts[ip] = new Date().getTime();

    // Check if request count exceeds the rate limit
    const currentTime = new Date().getTime();
    const lastRequestTime = requestCounts[ip] || 0;
    if (currentTime - lastRequestTime < 60 * 1000 && Object.keys(requestCounts).length > rateLimit) {
        logger.debug(`requestCounts[ip]: ${requestCounts[ip]}, url: ${req.url}`);
        // Respond with a 429 Too Many Requests status code
        logger.warn(`Rate limit exceeded for IP: ${ip}`);
        return res.status(429).json({
            code: 429,
            status: "Error",
            message: "Rate limit exceeded.",
            data: null,
        });
    }

    // Set timeout for each request (example: 10 seconds)
    req.setTimeout(timeout, () => {
      // Handle timeout error
      res.status(504).json({
        code: 504,
        status: "Error",
        message: "Gateway timeout.",
        data: null,
      });
    });

    return next(); // Continue to the next middleware
  }
