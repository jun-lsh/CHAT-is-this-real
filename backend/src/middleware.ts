import { createMiddleware } from 'hono/factory'
import { users } from '../db/schema'
import { verifySignature } from './utils';
import { eq } from 'drizzle-orm'
import { db } from '../db/db'

export const verify = createMiddleware(async (c, next) => {
  if (c.req.method === 'POST' || c.req.method === 'DELETE') {
  const body = await c.req.json()
  const challenge = body.report_hash + body.report_text
  const signature = body.signature
  if (!await verifySignature(challenge, body.pkey, signature)) {
    return c.json({ error: 'verification failed' }, 400)
  }
}
  await next()
})
