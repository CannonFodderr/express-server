import {decodeJwt, decodeProtectedHeader, EncryptJWT, generateKeyPair, jwtDecrypt, JWTPayload, jwtVerify, JWTVerifyOptions, KeyLike, SignJWT } from "jose"
import { createLogger } from "../utils/logger.util"
import { generateRandomBytesHex } from "../utils/crypto.util"
import { JwtConfiguration, JWTEncryptionOptions, SubscriberEntityType } from "../types/jwt.types"

let authServiceInstance: AuthorityService | null = null
const logger = createLogger('auth-service')
const defaultJwtExpiration = '5m'


function getDefaultJwtConfiguration(): JwtConfiguration {
    return {
        issuer: `api:${generateRandomBytesHex(16)}:issuer`,
        kid: generateRandomBytesHex(16),
        alg: 'RS256'
    }
}
export class AuthorityService {
    private privateKey: KeyLike
    private publicKey: KeyLike
    private jwtConfig: JwtConfiguration
    constructor(jwtConfig?: JwtConfiguration) {
        const defaultConfig = getDefaultJwtConfiguration()
        const config = { ...defaultConfig, ...jwtConfig }

        this.privateKey
        this.publicKey
        this.jwtConfig = config
    }
    async createOrRefreshKeys() {
        try {
            const { privateKey, publicKey } = await this.generateKeyPair()
            this.privateKey = privateKey
            this.publicKey = publicKey

            return true
        } catch (error) {
            logger.error(`Error initializing authority service: ${error}`)
            return false
        }
    }
    async rotateConfiguration(jwtConfig?: JwtConfiguration) {
        const defaultConfig = getDefaultJwtConfiguration()
        const config = { ...defaultConfig, ...jwtConfig }
        logger.debug(`Rotating configuration: ${JSON.stringify(config)}`)
        this.jwtConfig = config
        return await this.createOrRefreshKeys()
    }
    async generateKeyPair() {
        return await generateKeyPair('RS256')
    }
    getPublicKey() {
        return this.publicKey
    }
    decodeProtectedHeader(token: string) {
        try {
            return decodeProtectedHeader(token)
        } catch (error) {
            logger.error(`Error decoding protected header: ${error}`)
            return null
        }
    }
    encryptToken(payload: JWTPayload) {
        try {
            return new EncryptJWT(payload)
        } catch (error) {
            logger.error(`Error encrypting token: ${error}`)
            return null
        }
    }
    async decodeJWT(token: string) {
        try {
            const jwtData = await decodeJwt(token)
            return jwtData
        } catch (error) {
            logger.error(`Error decrypting token: ${error}`)
            return null
        }
    }
    async verifyToken(token: string, options?: JWTVerifyOptions) {
        const alg = this.jwtConfig.alg || 'RS256'
        const verifyOptions: JWTVerifyOptions = {
            algorithms: [alg],
            issuer: this.jwtConfig.issuer,
            audience: options?.audience,
            ...options
        }
        try {
            const decodedHeader = this.decodeProtectedHeader(token)
            if (!decodedHeader) {
                return null
            }
            const { kid } = decodedHeader
            if (kid !== this.jwtConfig.kid) {
                logger.error(`Invalid key id: ${kid}`)
                return null
            }
            const verifiedData = await jwtVerify(token, this.publicKey, verifyOptions)
            if(!verifiedData) {
                logger.error(`Invalid token: ${JSON.stringify(verifiedData)}`)
                return null
            }
            const { iat } = verifiedData.payload
            console.log({ iat, now: new Date().getTime() })

            if(iat && iat > new Date().getTime()) {
                logger.error(`Token issued in the future: ${JSON.stringify(verifiedData)}`)
                return null
            }

            logger.debug(`Token verified: ${JSON.stringify(verifiedData)}`)
            return verifiedData
        } catch (error) {
            logger.error(`Error verifying token: ${error}`)
            return null
        }
    }

    async generateJWT(payload: JWTPayload, userOptions?: JWTEncryptionOptions) {
        const defaultOptions = {
            expiresIn: defaultJwtExpiration,
            audience: SubscriberEntityType.CLIENT,
            issuedAt: new Date().getTime()
        }
        const options = { ...defaultOptions, ...userOptions }
        const jwt = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'RS256', kid: this.jwtConfig.kid })
        .setIssuedAt(options.issuedAt)
        .setIssuer(this.jwtConfig.issuer)
        .setAudience(options.audience || 'any')
        .setExpirationTime(options.expiresIn)
        .sign(this.privateKey)

        return jwt
    }
}


export default function createAuthorityService() {
    if (!authServiceInstance) {
        authServiceInstance = new AuthorityService()
    }
    return authServiceInstance
}
