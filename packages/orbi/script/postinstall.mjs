#!/usr/bin/env node

import fs from "fs"
import path from "path"
import os from "os"
import https from "https"
import { fileURLToPath } from "url"
import { createRequire } from "module"
import { execSync } from "child_process"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

const REPO = "arqxus-flow/Aqxus_Agent"

function getVersion() {
  const pkgPath = path.join(__dirname, "package.json")
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"))
  return pkg.version
}

function detectPlatform() {
  const platformMap = { darwin: "darwin", linux: "linux", win32: "windows" }
  const archMap = { x64: "x64", arm64: "arm64" }

  const platform = platformMap[os.platform()] || os.platform()
  const arch = archMap[os.arch()] || os.arch()
  const binaryName = platform === "windows" ? "orbi.exe" : "orbi"
  const ext = platform === "linux" ? "tar.gz" : "zip"
  const assetName = `orbi-${platform}-${arch}.${ext}`

  return { platform, arch, binaryName, assetName, ext }
}

function tryFindInNodeModules() {
  const { platform, arch, binaryName } = detectPlatform()
  const packageName = `orbi-${platform}-${arch}`
  try {
    const packageJsonPath = require.resolve(`${packageName}/package.json`)
    const packageDir = path.dirname(packageJsonPath)
    const binaryPath = path.join(packageDir, "bin", binaryName)
    if (fs.existsSync(binaryPath)) return binaryPath
  } catch {
    // Not installed via npm optionalDependencies, will download
  }
  return null
}

function download(url) {
  return new Promise((resolve, reject) => {
    const request = (url) => {
      https.get(url, { headers: { "User-Agent": "orbi-postinstall" } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          request(res.headers.location)
          return
        }
        if (res.statusCode !== 200) {
          reject(new Error(`Download failed: HTTP ${res.statusCode} for ${url}`))
          return
        }
        const chunks = []
        res.on("data", (chunk) => chunks.push(chunk))
        res.on("end", () => resolve(Buffer.concat(chunks)))
        res.on("error", reject)
      }).on("error", reject)
    }
    request(url)
  })
}

async function extractZip(buffer, destDir) {
  const tmpZip = path.join(os.tmpdir(), `orbi-${Date.now()}.zip`)
  fs.writeFileSync(tmpZip, buffer)
  try {
    if (os.platform() === "win32") {
      execSync(`powershell -NoProfile -Command "Expand-Archive -Force '${tmpZip}' '${destDir}'"`, { stdio: "ignore" })
    } else {
      execSync(`unzip -o "${tmpZip}" -d "${destDir}"`, { stdio: "ignore" })
    }
  } finally {
    fs.unlinkSync(tmpZip)
  }
}

async function extractTarGz(buffer, destDir) {
  const tmpTar = path.join(os.tmpdir(), `orbi-${Date.now()}.tar.gz`)
  fs.writeFileSync(tmpTar, buffer)
  try {
    fs.mkdirSync(destDir, { recursive: true })
    execSync(`tar -xzf "${tmpTar}" -C "${destDir}"`, { stdio: "ignore" })
  } finally {
    fs.unlinkSync(tmpTar)
  }
}

async function downloadBinary() {
  const version = getVersion()
  const { assetName, binaryName, ext } = detectPlatform()
  const url = `https://github.com/${REPO}/releases/download/v${version}/${assetName}`

  console.log(`Downloading Orbi CLI v${version} from GitHub Releases...`)
  console.log(`  ${url}`)

  const buffer = await download(url)

  const tmpDir = path.join(os.tmpdir(), `orbi-extract-${Date.now()}`)
  fs.mkdirSync(tmpDir, { recursive: true })

  if (ext === "tar.gz") {
    await extractTarGz(buffer, tmpDir)
  } else {
    await extractZip(buffer, tmpDir)
  }

  // Find the binary in extracted files
  const candidates = [
    path.join(tmpDir, binaryName),
    path.join(tmpDir, "bin", binaryName),
  ]

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      // Clean up tmpDir later, return path
      return { binaryPath: candidate, tmpDir }
    }
  }

  // Search recursively
  const files = fs.readdirSync(tmpDir, { recursive: true })
  for (const file of files) {
    if (path.basename(String(file)) === binaryName) {
      return { binaryPath: path.join(tmpDir, String(file)), tmpDir }
    }
  }

  throw new Error(`Binary ${binaryName} not found in downloaded archive`)
}

async function main() {
  const { binaryName, platform } = detectPlatform()
  const binDir = path.join(__dirname, "bin")
  const targetPath = path.join(binDir, ".orbi")
  const targetExe = path.join(binDir, binaryName)

  // Ensure bin directory exists
  fs.mkdirSync(binDir, { recursive: true })

  // 1. Try node_modules first (backwards compatible)
  const existing = tryFindInNodeModules()
  if (existing) {
    console.log("Found binary in node_modules, linking...")
    if (fs.existsSync(targetPath)) fs.unlinkSync(targetPath)
    try {
      fs.linkSync(existing, targetPath)
    } catch {
      fs.copyFileSync(existing, targetPath)
    }
    fs.chmodSync(targetPath, 0o755)
    return
  }

  // 2. Download from GitHub Releases
  let result
  try {
    result = await downloadBinary()
  } catch (err) {
    console.error(`Failed to download binary: ${err.message}`)
    console.error("You can manually download from: https://github.com/arqxus-flow/Aqxus_Agent/releases")
    process.exit(1)
  }

  const { binaryPath, tmpDir } = result

  // Copy to bin directory
  const dest = platform === "windows" ? targetExe : targetPath
  if (fs.existsSync(dest)) fs.unlinkSync(dest)
  fs.copyFileSync(binaryPath, dest)
  if (platform !== "windows") fs.chmodSync(dest, 0o755)

  // Clean up
  fs.rmSync(tmpDir, { recursive: true, force: true })

  console.log(`Orbi CLI installed successfully!`)
}

try {
  await main()
} catch (error) {
  console.error("Postinstall error:", error.message)
  process.exit(1)
}
