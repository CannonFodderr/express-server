import {decodeProtectedHeader, EncryptJWT, generateKeyPair, jwtDecrypt, JWTPayload, jwtVerify, JWTVerifyOptions, KeyLike, SignJWT } from "jose"
import { createLogger } from "../utils/logger.util"
import { generateRandomBytesHex } from "../utils/crypto.util"
import { JWTEncryptionOptions } from "../types/jwt.types"

let authServiceInstance: AuthorityService | null = null
const logger = createLogger('auth-service')
const defaultJwtExpiration = '5m'

class AuthorityService {
    private privateKey: KeyLike
    private publicKey: KeyLike
    private issuer: string
    private kid: string
    constructor(issuer: string = generateRandomBytesHex(32), kid: string = generateRandomBytesHex(24)) {
        this.privateKey
        this.publicKey
        this.issuer = issuer
        this.initialize()
    }
    private async initialize() {
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
    decryptToken(token: string) {
        try {
            return jwtDecrypt(token, this.privateKey)
        } catch (error) {
            logger.error(`Error decrypting token: ${error}`)
            return null
        }
    }
    async verifyToken(token: string, options?: JWTVerifyOptions) {
        const verifyOptions: JWTVerifyOptions = {
            algorithms: ['RS256'],
            issuer: this.issuer,
            audience: options?.audience,
            ...options
        }
        try {
            const decodedHeader = this.decodeProtectedHeader(token)
            if (!decodedHeader) {
                return null
            }
            const { kid } = decodedHeader
            if (kid !== this.kid) {
                logger.error(`Invalid key id: ${kid}`)
                return null
            }
            const verifiedData = await jwtVerify(token, this.publicKey, verifyOptions)
            logger.debug(`Token verified: ${JSON.stringify(verifiedData)}`)
            return verifiedData
        } catch (error) {
            logger.error(`Error verifying token: ${error}`)
            return null
        }
    }
    async generateUnsignedJWT(payload: JWTPayload, options: JWTEncryptionOptions = { expiresIn: defaultJwtExpiration, audience: 'any' }) {
        const jwt = await new EncryptJWT(payload)
        .setProtectedHeader({ alg: 'dir', enc: 'A256GCM', cty: 'JWT', kid: this.kid })
        .setIssuedAt()
        .setIssuer(this.issuer)
        .setAudience(options.audience || 'any')
        .setExpirationTime(options.expiresIn)
        .encrypt(this.privateKey)

        return jwt
    }
    async generateJWT(payload: JWTPayload, options: JWTEncryptionOptions = { expiresIn: defaultJwtExpiration, audience: 'any' }) {
        const jwt = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'RS256', kid: this.kid })
        .setIssuedAt()
        .setIssuer(this.issuer)
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
