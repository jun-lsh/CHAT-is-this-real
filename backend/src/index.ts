import { Hono } from 'hono'
import { db } from '../db/db';
import { users, reports } from '../db/schema';
import { swaggerUI } from '@hono/swagger-ui'
import { createRoute } from '@hono/zod-openapi'
import { OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import { eq } from 'drizzle-orm'

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

// Define response schemas
const HelloResponseSchema = z.object({
  message: z.string().openapi({
    example: 'Hello note anything!'
  })
})

// Define schemas based on your Drizzle schema
const UserSchema = z.object({
  id: z.number(),
  username: z.string(),
  pkey: z.number(),
  reputation: z.number().nullable(),
})

const ReportSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  report_text: z.string(),
  created_at: z.number(),
})

// Request body schemas
const CreateUserSchema = z.object({
  username: z.string(),
  pkey: z.number(),
  reputation: z.number().optional(),
})

const CreateReportSchema = z.object({
  user_id: z.number(),
  report_text: z.string(),
})

// Create routes with OpenAPI specs
const getHelloRoute = createRoute({
  method: 'get',
  path: '/',
  responses: {
    200: {
      content: {
        'text/plain': {
          schema: z.string()
        }
      },
      description: 'Successful response'
    }
  }
})

const getUsersRoute = createRoute({
  method: 'get',
  path: '/get_users',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: UserSchema.array()
        }
      },
      description: 'List of all users'
    }
  }
})

const getUserRoute = createRoute({
  method: 'get',
  path: '/get_users',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: UserSchema.array()
        }
      },
      description: 'List of all users'
    }
  }
})

// Route definitions
const getUserByIdRoute = createRoute({
  method: 'get',
  path: '/users/:id',
  request: {
    params: z.object({
      id: z.string(),
    })
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: UserSchema
        }
      },
      description: 'User details'
    },
    404: {
      description: 'User not found'
    }
  }
})

const getReportByIdRoute = createRoute({
  method: 'get',
  path: '/reports/:id',
  request: {
    params: z.object({
      id: z.string(),
    })
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: ReportSchema
        }
      },
      description: 'Report details'
    },
    404: {
      description: 'Report not found'
    }
  }
})

const getReportsRoute = createRoute({
  method: 'get',
  path: '/reports',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: ReportSchema.array()
        }
      },
      description: 'List of all reports'
    }
  }
})

const createUserRoute = createRoute({
  method: 'post',
  path: '/users',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateUserSchema
        }
      }
    }
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: UserSchema
        }
      },
      description: 'User created successfully'
    }
  }
})

const createReportRoute = createRoute({
  method: 'post',
  path: '/reports',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateReportSchema
        }
      }
    }
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: ReportSchema
        }
      },
      description: 'Report created successfully'
    }
  }
})

const deleteUserRoute = createRoute({
  method: 'delete',
  path: '/users/:id',
  request: {
    params: z.object({
      id: z.string(),
    })
  },
  responses: {
    200: {
      description: 'User deleted successfully'
    },
    404: {
      description: 'User not found'
    }
  }
})

const deleteReportRoute = createRoute({
  method: 'delete',
  path: '/reports/:id',
  request: {
    params: z.object({
      id: z.string(),
    })
  },
  responses: {
    200: {
      description: 'Report deleted successfully'
    },
    404: {
      description: 'Report not found'
    }
  }
})

// Update route handlers to use the OpenAPI specs
app.openapi(getHelloRoute, (c) => {
  return c.text('Hello note anything!')
})

app.openapi(getUsersRoute, async (c) => {
  const res = await db(c.env.D1).select().from(users)
  console.log("users", res)
  return c.json(res)
})

app.openapi(getUserByIdRoute, async (c) => {
  const id = Number(c.req.param('id'))
  const user = await db(c.env.D1).select().from(users).where(eq(users.id, id)).get()
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
  const newReport = await db(c.env.D1)
    .insert(reports)
    .values({
      user_id: body.user_id,
      report_text: body.report_text,
    })
    .returning()
  
  // Transform the response to match the schema
  const response = {
    id: newReport[0].id,
    user_id: newReport[0].user_id!,
    report_text: newReport[0].report_text,
    created_at: Number(newReport[0].created_at)
  }
  
  return c.json(response, 201)
})

app.openapi(deleteUserRoute, async (c) => {
  const id = Number(c.req.param('id'))
  const user = await db(c.env.D1).select().from(users).where(eq(users.id, id)).get()
  if (!user) return c.json({ error: 'User not found' }, 404)
  await db(c.env.D1).delete(users).where(eq(users.id, id))
  return c.json({ message: 'User deleted successfully' })
})

app.openapi(deleteReportRoute, async (c) => {
  const id = Number(c.req.param('id'))
  const report = await db(c.env.D1).select().from(reports).where(eq(reports.id, id)).get()
  if (!report) return c.json({ error: 'Report not found' }, 404)
  await db(c.env.D1).delete(reports).where(eq(reports.id, id))
  return c.json({ message: 'Report deleted successfully' })
})

export default app
