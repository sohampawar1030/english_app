import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env') })

import app from './app.js'
import pool from './config/database.js'

const PORT = process.env.PORT || 5000

async function start() {
  try {
    const connection = await pool.getConnection()
    console.log('MySQL connected successfully')
    connection.release()
  } catch (err) {
    console.error('MySQL connection failed:', err.message)
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}

start()
