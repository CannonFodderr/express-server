import { describe, it, before, after } from "node:test"
import assert from "assert/strict"
import createAuthorityService, { AuthorityService } from "../../services/auth.service"
import { generateRandomBytesHex } from "../../utils/crypto.util"
import { SubscriberEntityType } from "../../types/jwt.types"

const jwtPayload = {
    clientId: generateRandomBytesHex(24)
}
describe('Auth service test suite', () => {
    let authService: AuthorityService
    before(() => {
        authService = createAuthorityService()
    })
    it('Should initialize the authority service', async () => {
        const initialized = await authService.rotateConfiguration()
        assert.ok(initialized)
    })
    it('Should  create generate a key pair', async () => {
        const { privateKey, publicKey } = await authService.generateKeyPair()
        assert.ok(privateKey)
        assert.ok(publicKey)
    })
    it('Should encrypt and decrypt a token', async () => {
        const token = await authService.generateJWT(jwtPayload)
        console.log({ token })
        assert.ok(token)
        const decoded = await authService.decodeJWT(token)
        console.log({ decoded })
        assert.ok(decoded)
        assert.strictEqual(decoded?.clientId, jwtPayload.clientId)
    })
    it('Should decode a protected header', async () => {
        const token = await authService.generateJWT(jwtPayload, { expiresIn: '1m', audience: SubscriberEntityType.TEST })
        console.log({ token })
        assert.ok(token)
        const protectedHeader = authService.decodeProtectedHeader(token)
        console.log({ protectedHeader })
        assert.ok(protectedHeader)
    })
    it(`Should fail to validate jwt since keys where refresed`, async () => {
        const token = await authService.generateJWT(jwtPayload, { expiresIn: '1m', audience: SubscriberEntityType.TEST })
        console.log({ token })
        assert.ok(token)
        const decoded = await authService.decodeJWT(token)
        console.log({ decoded })
        assert.ok(decoded)
        assert.strictEqual(decoded?.clientId, jwtPayload.clientId)
        const refreshed = await authService.rotateConfiguration()
        assert.ok(refreshed)
        const decoded2 = await authService.verifyToken(token, { audience: SubscriberEntityType.TEST})
        console.log({ decoded2 })
        assert.strictEqual(decoded2, null)
    })
    it('Should fail to verify a token - wrong audience', async () => {
        const token = await authService.generateJWT(jwtPayload, { expiresIn: '1m', audience: SubscriberEntityType.TEST })
        console.log({ token })
        assert.ok(token)
        const verified = await authService.verifyToken(token, { audience: SubscriberEntityType.CLI})
        console.log({ verified })
        assert.strictEqual(verified, null)
    })
    it('Should verify a token', async () => {
        const token = await authService.generateJWT(jwtPayload, { expiresIn: '1m', audience: SubscriberEntityType.TEST })
        console.log({ token })
        assert.ok(token)
        const verified = await authService.verifyToken(token, { audience: SubscriberEntityType.TEST})
        console.log({ verified })
        assert.ok(verified)
    })
    it('Should fail to verify a token - wrong issuer', async () => {
        const token = await authService.generateJWT(jwtPayload, { expiresIn: '1m', audience: SubscriberEntityType.TEST })
        console.log({ token })
        assert.ok(token)
        const verified = await authService.verifyToken(token, { audience: SubscriberEntityType.TEST, issuer: 'wrong-issuer'})
        console.log({ verified })
        assert.strictEqual(verified, null)
    })
    it('Should fail to verify a token - wrong key id', async () => {
        const token = await authService.generateJWT(jwtPayload, { expiresIn: '1m', audience: SubscriberEntityType.TEST })
        console.log({ token })
        assert.ok(token)
        const verified = await authService.verifyToken(token, { audience: SubscriberEntityType.TEST})
        console.log({ verified })
        assert.ok(verified)
    })
    it('Should fail to verify a token - expired token', async () => {
        const token = await authService.generateJWT(jwtPayload, { expiresIn: '1s', audience: SubscriberEntityType.TEST })
        console.log({ token })
        assert.ok(token)
        setTimeout(async () => {
            const verified = await authService.verifyToken(token, { audience: SubscriberEntityType.TEST})
            console.log({ verified })
            assert.strictEqual(verified, null)
        }, 2000)
    })
    it('Should fail to verify a token - issued in the future', async () => {
        const token = await authService.generateJWT(jwtPayload, { expiresIn: '1m', audience: SubscriberEntityType.TEST, issuedAt: new Date().getTime() + 10000 })
        console.log({ token })
        assert.ok(token)
        const verified = await authService.verifyToken(token, { audience: SubscriberEntityType.TEST})
        console.log({ verified })
        assert.strictEqual(verified, null)
    })
})
