import { createRoute } from '@hono/zod-openapi'
import { z } from 'zod'
import { HelloResponseSchema, UserSchema, ReportSchema, ReportVoteSchema, CreateUserSchema, CreateReportSchema, CreateReportVoteSchema, GetReportsWithHashSchema, GetReportVoteRatioSchema } from '../types/zod_schema'

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
  path: '/users/{pkey}',
  request: {
    params: z.object({
      pkey: z.string(),
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
  path: '/reports/{hash}',
  request: {
    params: z.object({
      hash: z.string(),
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
    },
    400: {
      content: {
        'application/json': {
          schema: z.object({ error: z.string() })
        }
      },
      description: 'User already exists'
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
    },
    400: {
      content: {
        'application/json': {
          schema: z.object({ error: z.string() })
        }
      },
      description: 'Verification failed'
    },
    404: {
      content: {
        'application/json': {
          schema: z.object({ error: z.string() })
        }
      },
      description: 'User not found'
    }
  }
})

const deleteUserRoute = createRoute({
  method: 'delete',
  path: '/users/{pkey}',
  request: {
    params: z.object({
      pkey: z.string(),
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
  path: '/reports/{hash}',
  request: {
    params: z.object({
      hash: z.string(),
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



const getReportVotesRoute = createRoute({
  method: 'get',
  path: '/report_votes',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: ReportVoteSchema.array()
        }
      },
      description: 'List of all report votes'
    }
  }
})

const createReportVoteRoute = createRoute({
  method: 'post',
  path: '/report_votes',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateReportVoteSchema
        }
      }
    }
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: CreateReportVoteSchema
        }
      },
      description: 'Report vote created successfully'
    },
    404: {
      description: 'Report or user not found'
    }
  }
})

const getReportVoteRatioRoute = createRoute({
  method: 'get',
  path: '/report_vote_ratio',
  request: {
    query: z.object({
      target_hash: z.string()
    })
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            report_hash: z.string(),
            upvote_ratio: z.number(),
            downvote_ratio: z.number()
          })
        }
      },
      description: 'Report vote ratio'
    },
    400: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.string()
          })
        }
      },
      description: 'Report not found'
    }
  }
})

const getReportsWithHashRoute = createRoute({
  method: 'get',
  path: '/reports_with_hash',
  request: {
    query: z.object({
      hashes: z.string().array()
    })
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: GetReportsWithHashSchema
        }
      },
      description: 'List of all reports with hash'
    }
  }
})


export { getHelloRoute, getUsersRoute, getUserByIdRoute, getReportByIdRoute, getReportsRoute, createUserRoute, createReportRoute, deleteUserRoute, deleteReportRoute, getReportVotesRoute, createReportVoteRoute, getReportVoteRatioRoute, getReportsWithHashRoute }