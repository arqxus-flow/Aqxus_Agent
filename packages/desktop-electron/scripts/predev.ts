import { $ } from "bun"

import { copyBinaryToSidecarFolder, getCurrentSidecar, windowsify } from "./utils"

await $`bun ./scripts/copy-icons.ts ${process.env.ORBI_CHANNEL ?? "dev"}`

const RUST_TARGET = Bun.env.RUST_TARGET

const sidecarConfig = getCurrentSidecar(RUST_TARGET)

const binaryPath = windowsify(`../orbi/dist/${sidecarConfig.ocBinary}/bin/orbi`)

await (sidecarConfig.ocBinary.includes("-baseline")
  ? $`cd ../orbi && bun run build --single --baseline`
  : $`cd ../orbi && bun run build --single`)

await copyBinaryToSidecarFolder(binaryPath, RUST_TARGET)
