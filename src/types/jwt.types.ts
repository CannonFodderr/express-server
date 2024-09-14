export enum SubscriberEntityType {
    CLIENT = 'client',
    ADMIN = 'admin',
    TEST = 'test',
    CLI = 'cli'
}
export type JWTEncryptionOptions = {
    expiresIn: string | Date | number
    issuedAt?: string | Date | number
    audience: SubscriberEntityType
}
export type JwtConfiguration = {
    issuer: string
    kid: string
    alg: 'RS256' | 'HS256'
}
