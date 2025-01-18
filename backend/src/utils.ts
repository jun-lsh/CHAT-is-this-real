import crypto from "crypto";


// export async function getChallenge() {
//   const challenge = crypto.randomBytes(32).toString('hex');
//   return challenge;
// }

export function hexToArrayBuffer(hexString:string) {
    const pairs = hexString.match(/[\dA-F]{2}/gi);
    if (!pairs) return null;

    const integers = pairs.map(s => parseInt(s, 16));
    return new Uint8Array(integers).buffer;
}


export async function importKeyFromHex(hexString:string, isPublic = true) {
    try {
        const keyData = hexToArrayBuffer(hexString);
        if (!keyData) return null;

        return await crypto.subtle.importKey(
            isPublic ? "raw" : "pkcs8",
            keyData,
            {
                name: "ECDSA",
                namedCurve: "P-256"
            },
            true,
            isPublic ? ["verify"] : ["sign"]
        );
    } catch (error) {
        console.error('Error importing key:', error);
        return null;
    }
}


export async function Verification(body:any) {
 const signature = await hexToArrayBuffer(body.signature)
  const publicKey = await importKeyFromHex(body.pkey)
  let enc = new TextEncoder();
  const challenge = body.pkey+body.report_text+body.report_type+body.report_time+body.report_hash+body.platform_name
  console.log("challenge", challenge)
  const challenge_buffer = enc.encode(
    body.pkey+body.report_text+body.report_type+body.report_time+body.report_hash+body.platform_name
  )
  return await verifySignature(challenge_buffer,publicKey, signature)
}
  



export async function verifySignature( challenge: NodeJS.ArrayBufferView,publicKey:any, signature: any) {
  return crypto.subtle.verify({
            name: "ECDSA",
            hash: { name: "SHA-384" },
        }, publicKey,signature,challenge);
}


