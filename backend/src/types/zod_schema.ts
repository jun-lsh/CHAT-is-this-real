
import { z } from 'zod'

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
  pkey: z.string(),
  reputation: z.number().nullable(),
})

const ReportSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  report_text: z.string(),
  report_hash: z.string(),
  created_at: z.number(),
  platform_name: z.string(),
  report_type: z.string(),
})

// Request body schemas
const CreateUserSchema = z.object({
  username: z.string(),
  pkey: z.string(),
  reputation: z.number().optional(),
})

const CreateReportSchema = z.object({
  pkey: z.string(),
  report_text: z.string(),
  report_type: z.string(),
  report_time: z.string(),
  signature: z.string(),
  report_hash: z.string(),
  platform_name: z.string(),
})

const ReportVoteSchema = z.object({
  id: z.number(),
  report_id: z.number(),
  user_id: z.number(),
  upvote: z.number(),
  downvote: z.number(),
  created_at: z.number(),
})

const CreateReportVoteSchema = z.object({
  pkey: z.string(),
  report_text: z.string(),
  report_hash: z.string(),
  signature: z.string(),
  upvote: z.number(),
  downvote: z.number(),

})


const GetReportVoteRatioSchema = z.object({
    report_hash: z.string(),
    upvote_ratio: z.number(),
    downvote_ratio: z.number(),
})

const GetReportsWithHashSchema = z.object({
    reports: z.array(z.object({
        report_hash: z.string(),
        count: z.number(),
    })),
})

export { HelloResponseSchema, UserSchema, ReportSchema, ReportVoteSchema, CreateUserSchema, CreateReportSchema, CreateReportVoteSchema, GetReportVoteRatioSchema, GetReportsWithHashSchema }
