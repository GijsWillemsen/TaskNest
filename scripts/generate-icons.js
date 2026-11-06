import fs from 'fs'
import path from 'path'
import process from 'node:process'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const sourceImage = path.join(rootDir, '1792602715432.jpg')
const publicDir = path.join(rootDir, 'public')
const logoPng = path.join(publicDir, 'logo.png')
const faviconIco = path.join(publicDir, 'favicon.ico')

console.log('🔄 Converting logo to PNG and ICO...')

if (!fs.existsSync(sourceImage)) {
  console.error(`❌ Source image not found at: ${sourceImage}`)
  process.exit(1)
}

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true })
}

try {
  // Use Windows .NET System.Drawing for instant native lossless conversion
  const psCommand = `powershell -NoProfile -Command "Add-Type -AssemblyName System.Drawing; $img = [System.Drawing.Image]::FromFile('${sourceImage.replace(/\\/g, '/')}'); $img.Save('${logoPng.replace(/\\/g, '/')}', [System.Drawing.Imaging.ImageFormat]::Png); Copy-Item '${logoPng.replace(/\\/g, '/')}' '${faviconIco.replace(/\\/g, '/')}';"`
  execSync(psCommand, { stdio: 'inherit' })
  console.log('✅ Generated public/logo.png and public/favicon.ico successfully!')
} catch (err) {
  // Fallback: direct copy
  console.warn('Direct image processing failed, copying directly:', err.message)
  fs.copyFileSync(sourceImage, logoPng)
  fs.copyFileSync(sourceImage, faviconIco)
  console.log('⚠️ Saved copies to public/logo.png and public/favicon.ico')
}
