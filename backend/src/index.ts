import { Hono } from 'hono'
import { drizzle } from 'drizzle-orm/d1';

type Env = {
  D1: D1Database
  ENV_TYPE : 'dev' | 'prod'
}


const app = new Hono<{ Bindings: Env }>()


app.get('/', (c) => {

  return c.text('Hello note anything!')
})


app.get('/get_user', (c) => {
  const user = c.req.param('user')
  return c.text(`Hello ${user}`)


  
})

export default app
