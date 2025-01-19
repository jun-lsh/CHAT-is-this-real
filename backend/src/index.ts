import { db } from '../db/db';
import { users, reports, report_votes, user_groups, user_group_kv } from '../db/schema';
import { swaggerUI } from '@hono/swagger-ui'
import { OpenAPIHono } from '@hono/zod-openapi'
import { eq, inArray ,count, sql, and} from 'drizzle-orm'
import { hexToArrayBuffer, importKeyFromHex, Verification, verifySignature } from './utils';
import { verify } from './middleware';
import { getHelloRoute, getUsersRoute, getUserByIdRoute, getReportByIdRoute, getReportsRoute, createUserRoute, createReportRoute, deleteUserRoute, deleteReportRoute, createReportVoteRoute, getReportVotesRoute , getReportVoteRatioRoute, getReportsWithHashRoute, createUserGroupRoute, addUserToGroupRoute, getUserGroupsRoute, getReportsByTypeRoute} from './routes/openApiRoutes'
import { arrayBuffer, json } from 'stream/consumers';
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



// app.use("*", verify)

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
  const hash = String(c.req.param('hash'))
  const report = await db(c.env.D1).select(
    {
      id: reports.id,
      report_hash: reports.report_hash,
      report_text: reports.report_text,
      created_at: reports.created_at,
      platform_name: reports.platform_name,
      report_type: reports.report_type,
      upvote: sql<number>`COALESCE(upvote, 0)`,
      downvote: sql<number>`COALESCE(downvote, 0)`
    }

  ).from(reports).leftJoin(report_votes, eq(reports.id, report_votes.report_id)).where(eq(reports.report_hash, hash)).all()
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
    report_hash: report.report_hash,
    platform_name: report.platform_name,
    report_type: report.report_type,
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
  const report = await db(c.env.D1).select().from(reports).where(eq(reports.report_hash, body.report_hash)).get()
  const userExistingReport = await db(c.env.D1).select().from(reports).where(and(eq(reports.report_hash, body.report_hash), eq(reports.user_id, user.id))).get()
  let newReport;
  
 
  // if (!await Verification(body)) {
  //   return c.json({ error: 'verification failed' }, 400)
  // }

  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }
  else if (userExistingReport) {
    newReport = await db(c.env.D1).update(reports).set({
      report_text: body.report_text,
    }).where(and(eq(reports.report_hash, body.report_hash), eq(reports.user_id, user.id))).returning()
  } 
  else {
    newReport = await db(c.env.D1)
      .insert(reports)
      .values({
        user_id: user?.id,
        platform_name: body.platform_name,
        report_type: body.report_type,
        report_text: body.report_text,
        report_hash: body.report_hash,
      })
      .returning()
  }
  // Transform the response to match the schema
  const response = {
    id: newReport[0].id,
    user_id: newReport[0].user_id!,
    report_text: newReport[0].report_text,
    created_at: Number(newReport[0].created_at),
    platform_name: newReport[0].platform_name,
    report_hash: newReport[0].report_hash,
    report_type: newReport[0].report_type
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
  const pkey = String(c.req.param('pkey'))
  const user = await db(c.env.D1).select().from(users).where(eq(users.pkey, pkey)).get()
  if (!user) return c.json({ error: 'User not found' }, 404)
  const report = await db(c.env.D1).select().from(reports).where(and(eq(reports.report_hash, hash), eq(reports.user_id, user.id))).get()
  if (!report) return c.json({ error: 'Report not found' }, 404)
  await db(c.env.D1).delete(reports).where(and(eq(reports.report_hash, hash), eq(reports.user_id, user.id)))
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
  // if (!await Verification(body)) {
  //   return c.json({ error: 'verification failed' }, 400)
  // }

  const user = await db(c.env.D1).select().from(users).where(eq(users.pkey, body.pkey)).get()
  if (!user) return c.json({ error: 'User not found' }, 404)
  
  const report = await db(c.env.D1).select().from(reports).where(eq(reports.report_hash, body.report_hash)).get()
  if (!report) return c.json({ error: 'Report not found' }, 404)

  const newReportVote = await db(c.env.D1)
    .insert(report_votes)
    .values({
      report_id: report.id,
      user_id: user.id,
      report_hash: report.report_hash,
      upvote: body.upvote,
      downvote: body.downvote,
    })
    .onConflictDoUpdate({
      target: [report_votes.report_id, report_votes.user_id],
      set: {
        upvote: body.upvote,
        downvote: body.downvote,
      }
    })
    .returning()

  return c.json(newReportVote[0], 201)
})

app.openapi(getReportVoteRatioRoute, async (c) => {
  const target_hash = c.req.query('target_hash')
  if (!target_hash) return c.json({ error: 'target_hash is required' }, 400)
  const report = await db(c.env.D1).select(
    {
      report_hash: reports.report_hash,
      total_upvotes: sql<number>`SUM(COALESCE(report_votes.upvote, 0))`,
      total_downvotes: sql<number>`SUM(COALESCE(report_votes.downvote, 0))`,
      upvote_ratio: sql<number>`COALESCE(CAST(SUM(COALESCE(report_votes.upvote, 0)) AS FLOAT) / NULLIF(SUM(COALESCE(report_votes.upvote, 0)) + SUM(COALESCE(report_votes.downvote, 0)), 0) * 100, 0)`,
      downvote_ratio: sql<number>`COALESCE(CAST(SUM(COALESCE(report_votes.downvote, 0)) AS FLOAT) / NULLIF(SUM(COALESCE(report_votes.upvote, 0)) + SUM(COALESCE(report_votes.downvote, 0)), 0) * 100, 0)`
    }
  ).from(reports)
   .leftJoin(report_votes, eq(reports.id, report_votes.report_id))
   .where(eq(reports.report_hash, target_hash))
   .groupBy(reports.report_hash)
   .get()

  return c.json(report)
})


app.openapi(getReportsWithHashRoute, async (c) => {
  const hashes = c.req.valid('query').hashes ?? []
  const all_reports = await db(c.env.D1).select({
    report_hash: reports.report_hash,
    count: count()
  }).from(reports).where(inArray(reports.report_hash, hashes)).groupBy(reports.report_hash)
  const response = all_reports.map(report => ({
    report_hash: report.report_hash,
    count: report.count
  }))
  return c.json({reports: response})
})



// app.openapi(getReportsByTypeRoute, async (c) => {
//   const type = c.req.query('type')
//   const reportsList = await db(c.env.D1).select().from(reports).where(eq(reports.report_type, type))
//   return c.json({reports: reportsList})
  
// })



app.openapi(createUserGroupRoute, async (c) => {
  try {
    const body = await c.req.json()
    const newUserGroup = await db(c.env.D1).insert(user_groups).values(body).returning()
    return c.json(newUserGroup[0], 201)
  } catch (error: any) {
    if (error.message?.includes('UNIQUE constraint failed')) {
      return c.json({ error: 'Group already exists' }, 401)
    }
    throw error
  }
})  

app.openapi(addUserToGroupRoute, async (c) => {
  const body = await c.req.json()
  const user = await db(c.env.D1).select().from(users).where(eq(users.pkey, body.pkey)).get()
  if (!user) return c.json({ error: 'User not found' }, 404)
  const group = await db(c.env.D1).select().from(user_groups).where(eq(user_groups.group_name, body.group_name)).get()
  if (!group) return c.json({ error: 'Group not found' }, 404)
  const userInGroup = await db(c.env.D1).select().from(user_group_kv).where(and(eq(user_group_kv.group_id, group.id), eq(user_group_kv.user_id, user.id))).get()
  if (userInGroup) return c.json({ error: 'User already in group' }, 401)
  const newUserGroup = await db(c.env.D1).insert(user_group_kv).values({user_id: user.id, group_id: group.id}).returning()
  return c.json(newUserGroup[0], 201)
})

app.openapi(getUserGroupsRoute, async (c) => {
  const userGroups = await db(c.env.D1).select().from(user_groups)
  return c.json({groups: userGroups})
})

export default app
