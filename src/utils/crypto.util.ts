import crypto from 'crypto';


export function generateRandomBytesHex(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
}
