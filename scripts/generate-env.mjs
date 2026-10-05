import { randomBytes } from 'node:crypto';
const secret = () => randomBytes(24).toString('hex');
console.log(`EVIDENCE_BASIC_USER=reader-${randomBytes(6).toString('hex')}\nEVIDENCE_BASIC_PASSWORD=${secret()}\nREPORT_DB_PASSWORD=${secret()}\nPOSTGRES_PASSWORD=${secret()}`);
