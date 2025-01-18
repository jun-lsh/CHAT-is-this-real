import crypto from "crypto";


// export async function getChallenge() {
//   const challenge = crypto.randomBytes(32).toString('hex');
//   return challenge;
// }





export async function verifySignature( challenge: NodeJS.ArrayBufferView,publicKey: string, signature: NodeJS.ArrayBufferView) {
  return crypto.verify('RSA-SHA256', challenge,  publicKey,signature);
}


