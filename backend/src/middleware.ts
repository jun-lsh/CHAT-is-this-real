import { createMiddleware } from 'hono/factory'
import { users } from '../db/schema'
import { verifySignature } from './utils';
import { eq } from 'drizzle-orm'
import { db } from '../db/db'

export const verify = createMiddleware(async (c, next) => {
  const body = await c.req.json()
  const user = await db(c.env.D1).select().from(users).where(eq(users.pkey, body.pkey)).get()
  if (!user) return c.json({ error: 'User not found' }, 404)
  const challenge = body.report_hash + body.report_text
  const signature = body.signature
  if (!await verifySignature(challenge, body.pkey, signature)) {
    return c.json({ error: 'verification failed' }, 400)
  }
  await next()
})