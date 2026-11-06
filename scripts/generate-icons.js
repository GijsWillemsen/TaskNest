import { execSync } from 'child_process'
import path from 'path'
import process from 'node:process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const scriptPath = path.join(__dirname, 'generate-icons.ps1')

try {
  execSync(`powershell -ExecutionPolicy Bypass -File "${scriptPath}"`, { stdio: 'inherit' })
} catch (err) {
  console.error('Failed to run generate-icons.ps1:', err.message)
  process.exit(1)
}
