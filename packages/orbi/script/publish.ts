#!/usr/bin/env bun
import { $ } from "bun"
import pkg from "../package.json"
import { Script } from "@orbi/script"
import { fileURLToPath } from "url"

const dir = fileURLToPath(new URL("..", import.meta.url))
process.chdir(dir)

const version = Script.version
const channel = Script.channel

console.log(`Publishing Orbi packages @${version}`)

// ─── 1. Build and publish @orbi/sdk ──────────────────────────────
console.log("\n📦 Building @orbi/sdk...")
await $`bun run build`.cwd("../../packages/sdk/js")
const sdkDistDir = "../../packages/sdk/js"
const sdkPkg = await Bun.file(`${sdkDistDir}/package.json`).json()
// Set version
sdkPkg.version = version
sdkPkg.exports = { ".": "./dist/index.js", "./client": "./dist/client.js", "./server": "./dist/server.js" }
await Bun.file(`${sdkDistDir}/package.json`).write(JSON.stringify(sdkPkg, null, 2))
await $`bun pm pack`.cwd(sdkDistDir)
await $`npm publish *.tgz --access public --tag ${channel}`.cwd(sdkDistDir)
console.log(`✅ Published @orbi/sdk@${version}`)

// ─── 2. Build and publish @orbi/plugin ───────────────────────────
console.log("\n📦 Building @orbi/plugin...")
await $`bun run build`.cwd("../../packages/plugin")
const pluginDistDir = "../../packages/plugin"
const pluginPkg = await Bun.file(`${pluginDistDir}/package.json`).json()
// Set version and resolve workspace dependency
pluginPkg.version = version
pluginPkg.dependencies = { ...pluginPkg.dependencies, "@orbi/sdk": version }
await Bun.file(`${pluginDistDir}/package.json`).write(JSON.stringify(pluginPkg, null, 2))
await $`bun pm pack`.cwd(pluginDistDir)
await $`npm publish *.tgz --access public --tag ${channel}`.cwd(pluginDistDir)
console.log(`✅ Published @orbi/plugin@${version}`)

// ─── 3. Build and publish orbi-ai (CLI wrapper) ──────────────────
console.log("\n📦 Building orbi-ai wrapper...")
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
        postinstall: "node ./postinstall.mjs",
      },
      version,
      license: pkg.license,
    },
    null,
    2,
  ),
)

await $`chmod -R 755 .`.cwd(`./dist/${pkg.name}`)
await $`bun pm pack`.cwd(`./dist/${pkg.name}`)
await $`npm publish *.tgz --access public --tag ${channel}`.cwd(`./dist/${pkg.name}`)
console.log(`✅ Published orbi-ai@${version}`)

console.log(`\n🎉 All packages published successfully!`)
