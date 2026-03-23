#!/usr/bin/env bun
import { $ } from "bun"
import pkg from "../package.json"
import { Script } from "@orbi/script"
import { fileURLToPath } from "url"

const dir = fileURLToPath(new URL("..", import.meta.url))
process.chdir(dir)

// Discover platform binaries
const binaries: Record<string, string> = {}
for (const filepath of new Bun.Glob("*/package.json").scanSync({ cwd: "./dist" })) {
  const p = await Bun.file(`./dist/${filepath}`).json()
  binaries[p.name] = p.version
}
console.log("binaries", binaries)
const version = Object.values(binaries)[0]

// Build wrapper package
await $`mkdir -p ./dist/${pkg.name}`
await $`cp -r ./bin ./dist/${pkg.name}/bin`
await $`cp ./script/postinstall.mjs ./dist/${pkg.name}/postinstall.mjs`
await Bun.file(`./dist/${pkg.name}/LICENSE`).write(await Bun.file("../../LICENSE").text())

await Bun.file(`./dist/${pkg.name}/package.json`).write(
  JSON.stringify(
    {
      name: pkg.name + "-ai",
      bin: {
        [pkg.name]: `./bin/${pkg.name}`,
      },
      scripts: {
        postinstall: "bun ./postinstall.mjs || node ./postinstall.mjs",
      },
      version: version,
      license: pkg.license,
      optionalDependencies: binaries,
    },
    null,
    2,
  ),
)

// Publish helper with retry
async function publishWithRetry(name: string, cwd: string, maxRetries = 3) {
  if (process.platform !== "win32") {
    await $`chmod -R 755 .`.cwd(cwd)
  }
  await $`bun pm pack`.cwd(cwd)

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📦 Publishing ${name} (attempt ${attempt}/${maxRetries})...`)
      await $`npm publish *.tgz --access public --tag ${Script.channel}`.cwd(cwd)
      console.log(`✅ Published ${name}`)
      return true
    } catch (e: any) {
      const isRateLimit = e?.stderr?.includes("E429") || e?.stderr?.includes("429")
      if (isRateLimit && attempt < maxRetries) {
        const delay = 60 * attempt // 60s, 120s, 180s
        console.log(`⚠️ Rate limited, waiting ${delay}s before retry...`)
        await Bun.sleep(delay * 1000)
      } else if (attempt === maxRetries) {
        console.error(`❌ Failed to publish ${name} after ${maxRetries} attempts`)
        return false
      } else {
        throw e // non-rate-limit error, fail fast
      }
    }
  }
  return false
}

// Publish platform packages sequentially (avoids burst rate limit)
// Sort smallest first so they publish before rate limit kicks in
const sorted = Object.entries(binaries).sort((a, b) => {
  // Windows last (always biggest)
  if (a[0].includes("windows")) return 1
  if (b[0].includes("windows")) return -1
  return 0
})

let allSucceeded = true
for (const [name] of sorted) {
  const ok = await publishWithRetry(name, `./dist/${name}`)
  if (!ok) allSucceeded = false
  // Small delay between publishes to avoid rate limit
  await Bun.sleep(10_000)
}

// ALWAYS publish wrapper — even if a platform failed
// The wrapper is tiny (3.5KB) and platforms are optionalDependencies
console.log("📦 Publishing wrapper package orbi-ai...")
const wrapperOk = await publishWithRetry(pkg.name + "-ai", `./dist/${pkg.name}`)

if (!wrapperOk) {
  console.error("❌ CRITICAL: Failed to publish orbi-ai wrapper")
  process.exit(1)
}

if (!allSucceeded) {
  console.warn("⚠️ Some platform packages failed to publish (see above)")
  // Don't exit(1) — wrapper published, finalize can proceed
}
