import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import tasksHandler from './api/tasks.js'

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''

    req.on('data', (chunk) => {
      data += chunk
    })

    req.on('end', () => {
      if (!data) {
        resolve({})
        return
      }

      try {
        resolve(JSON.parse(data))
      } catch (error) {
        reject(error)
      }
    })

    req.on('error', (error) => reject(error))
  })
}

function devApiPlugin(env) {
  return {
    name: 'dev-api-tasks',
    configureServer(server) {
      process.env.MONGODB_URI = env.MONGODB_URI || process.env.MONGODB_URI

      server.middlewares.use(async (req, res, next) => {
        if (!req.url) {
          next()
          return
        }

        const url = new URL(req.url, 'http://localhost')

        if (url.pathname !== '/api/tasks') {
          next()
          return
        }

        req.query = Object.fromEntries(url.searchParams.entries())

        if (['POST', 'PUT'].includes(req.method || '')) {
          try {
            req.body = await parseJsonBody(req)
          } catch {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Invalid JSON body' }))
            return
          }
        } else {
          req.body = {}
        }

        res.status = (code) => {
          res.statusCode = code
          return res
        }

        res.json = (payload) => {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(payload))
          return res
        }

        try {
          await tasksHandler(req, res)
        } catch (error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: error.message || 'Internal server error' }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), devApiPlugin(env)],
  }
})
