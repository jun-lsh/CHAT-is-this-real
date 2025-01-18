import { db } from '../db/db';
import { users, reports, report_votes } from '../db/schema';
import { swaggerUI } from '@hono/swagger-ui'
import { OpenAPIHono } from '@hono/zod-openapi'
import { eq } from 'drizzle-orm'
import { verifySignature } from './utils';
import { getHelloRoute, getUsersRoute, getUserByIdRoute, getReportByIdRoute, getReportsRoute, createUserRoute, createReportRoute, deleteUserRoute, deleteReportRoute, createReportVoteRoute, getReportVotesRoute } from './routes/openApiRoutes'
type Env = {
  D1: D1Database
  ENV_TYPE : 'dev' | 'prod'
}



const app = new OpenAPIHono<{ Bindings: Env }>()

app.doc('/doc', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'My API',
  },
})

app.get("/ui", swaggerUI({ url: "/doc" }));


app.openapi(getHelloRoute, (c) => {
  return c.text('Hello note anything!')
})

app.openapi(getUsersRoute, async (c) => {
  const res = await db(c.env.D1).select().from(users)
  console.log("users", res)
  return c.json(res)
})

app.openapi(getUserByIdRoute, async (c) => {
  const pkey = c.req.param('pkey')
  if (!pkey) return c.json({ error: 'pkey is required' }, 400)
  const user = await db(c.env.D1).select().from(users).where(eq(users.pkey, pkey)).get()
  if (!user) return c.json({ error: 'User not found' }, 404)
  return c.json(user)
})

app.openapi(getReportByIdRoute, async (c) => {
  const id = Number(c.req.param('id'))
  const report = await db(c.env.D1).select().from(reports).where(eq(reports.id, id)).get()
  if (!report) return c.json({ error: 'Report not found' }, 404)
  return c.json(report)
})

app.openapi(getReportsRoute, async (c) => {
  const allReports = await db(c.env.D1).select().from(reports)
  // Transform each report to match the schema
  const response = allReports.map(report => ({
    id: report.id,
    user_id: report.user_id!,
    report_text: report.report_text,
    created_at: Number(report.created_at)
  }))
  return c.json(response)
})

app.openapi(createUserRoute, async (c) => {
  const body = await c.req.json()
  if (!body.pkey) return c.json({ error: 'pkey is required' }, 400)
  const user = await db(c.env.D1).select().from(users).where(eq(users.pkey, body.pkey)).get()
  if (user) return c.json({ error: 'User already exists' }, 400)
  const newUser = await db(c.env.D1)
    .insert(users)
    .values(body)
    .returning()
  // Transform the response to match the schema
  const response = {
    id: newUser[0].id,
    username: newUser[0].username,
    pkey: newUser[0].pkey,
    reputation: newUser[0].reputation
  }
  return c.json(response, 201)
})

app.openapi(createReportRoute, async (c) => {
  const body = await c.req.json()
  const user = await db(c.env.D1).select().from(users).where(eq(users.pkey, body.pkey)).get()
  if (!user) return c.json({ error: 'User not found' }, 404)
  const challenge = body.report_hash + body.report_text
  const signature = body.signature
  const newReport = await db(c.env.D1)
    .insert(reports)
    .values({
      user_id: user?.id,
      report_text: body.report_text,
      report_hash: body.report_hash,
    })
    .returning()
  
  // Transform the response to match the schema
  const response = {
    id: newReport[0].id,
    user_id: newReport[0].user_id!,
    report_text: newReport[0].report_text,
    created_at: Number(newReport[0].created_at),
    report_hash: newReport[0].report_hash
  }
  
  return c.json(response, 201)
})

app.openapi(deleteUserRoute, async (c) => {
  const pkey = String(c.req.param('pkey'))
  const user = await db(c.env.D1).select().from(users).where(eq(users.pkey, pkey)).get()
  if (!user) return c.json({ error: 'User not found' }, 404)
  await db(c.env.D1).delete(users).where(eq(users.pkey, pkey))
  return c.json({ message: 'User deleted successfully' })
})

app.openapi(deleteReportRoute, async (c) => {
  const hash = String(c.req.param('hash'))
  const report = await db(c.env.D1).select().from(reports).where(eq(reports.report_hash, hash)).get()
  if (!report) return c.json({ error: 'Report not found' }, 404)
  await db(c.env.D1).delete(reports).where(eq(reports.report_hash, hash))
  return c.json({ message: 'Report deleted successfully' })
})


app.openapi(getReportVotesRoute, async (c) => {
  const votes = await db(c.env.D1).select().from(report_votes)
  const response = votes.map(vote => ({
    id: vote.id,
    user_id: vote.user_id!,
    report_id: vote.report_id!,
    created_at: Number(vote.created_at),
    upvote: vote.upvote,
    downvote: vote.downvote
  }))
  return c.json(response)
})



app.openapi(createReportVoteRoute, async (c) => {
  const body = await c.req.json()
  const report = await db(c.env.D1).select().from(reports).where(eq(reports.report_hash, body.report_hash)).get()
  if (!report) return c.json({ error: 'Report not found' }, 404)
  const user = await db(c.env.D1).select().from(users).where(eq(users.pkey, body.pkey)).get()
  if (!user) return c.json({ error: 'User not found' }, 404)
  const newReportVote = await db(c.env.D1)
    .insert(report_votes)
    .values({
      report_id: report.id,
      user_id: user.id,
      upvote: body.upvote,
      downvote: body.downvote,
    })
    .returning()
  return c.json(newReportVote[0], 201)
})

export default app
