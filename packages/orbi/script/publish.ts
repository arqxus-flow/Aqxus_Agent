#!/usr/bin/env bun
import { $ } from "bun"
import pkg from "../package.json"
import { Script } from "@orbi/script"
import { fileURLToPath } from "url"

const dir = fileURLToPath(new URL("..", import.meta.url))
process.chdir(dir)

const version = Script.version
console.log(`Publishing orbi-ai@${version} (wrapper only — binaries served from GitHub Releases)`)

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
        postinstall: "node ./postinstall.mjs",
      },
      version,
      license: pkg.license,
    },
    null,
    2,
  ),
)

// Publish wrapper only — 1 tiny package, no rate limit
await $`chmod -R 755 .`.cwd(`./dist/${pkg.name}`)
await $`bun pm pack`.cwd(`./dist/${pkg.name}`)
await $`npm publish *.tgz --access public --tag ${Script.channel}`.cwd(`./dist/${pkg.name}`)

console.log(`✅ Published orbi-ai@${version}`)
