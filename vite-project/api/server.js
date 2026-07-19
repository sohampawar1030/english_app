import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env') })

import app from './app.js'
import pool from './config/database.js'

const PORT = process.env.PORT || 5000

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err)
})

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err)
})

async function start() {
  try {
    const connection = await pool.getConnection()
    console.log('MySQL connected successfully')
    connection.release()
  } catch (err) {
    console.error('MySQL connection failed:', err.message)
  }

  const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is in use. Retrying in 2s...`)
      setTimeout(() => { server.close(); app.listen(PORT) }, 2000)
    } else {
      console.error('Server error:', err)
    }
  })
}

start().catch(err => console.error('Startup error:', err))
