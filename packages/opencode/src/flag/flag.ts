import { Config } from "effect"

function truthy(key: string) {
  const value = process.env[key]?.toLowerCase()
  return value === "true" || value === "1"
}

function falsy(key: string) {
  const value = process.env[key]?.toLowerCase()
  return value === "false" || value === "0"
}

export namespace Flag {
  export const ORBI_AUTO_SHARE = truthy("ORBI_AUTO_SHARE")
  export const ORBI_GIT_BASH_PATH = process.env["ORBI_GIT_BASH_PATH"]
  export const ORBI_CONFIG = process.env["ORBI_CONFIG"]
  export declare const ORBI_TUI_CONFIG: string | undefined
  export declare const ORBI_CONFIG_DIR: string | undefined
  export const ORBI_CONFIG_CONTENT = process.env["ORBI_CONFIG_CONTENT"]
  export const ORBI_DISABLE_AUTOUPDATE = truthy("ORBI_DISABLE_AUTOUPDATE")
  export const ORBI_DISABLE_PRUNE = truthy("ORBI_DISABLE_PRUNE")
  export const ORBI_DISABLE_TERMINAL_TITLE = truthy("ORBI_DISABLE_TERMINAL_TITLE")
  export const ORBI_PERMISSION = process.env["ORBI_PERMISSION"]
  export const ORBI_DISABLE_DEFAULT_PLUGINS = truthy("ORBI_DISABLE_DEFAULT_PLUGINS")
  export const ORBI_DISABLE_LSP_DOWNLOAD = truthy("ORBI_DISABLE_LSP_DOWNLOAD")
  export const ORBI_ENABLE_EXPERIMENTAL_MODELS = truthy("ORBI_ENABLE_EXPERIMENTAL_MODELS")
  export const ORBI_DISABLE_AUTOCOMPACT = truthy("ORBI_DISABLE_AUTOCOMPACT")
  export const ORBI_DISABLE_MODELS_FETCH = truthy("ORBI_DISABLE_MODELS_FETCH")
  export const ORBI_DISABLE_CLAUDE_CODE = truthy("ORBI_DISABLE_CLAUDE_CODE")
  export const ORBI_DISABLE_CLAUDE_CODE_PROMPT =
    ORBI_DISABLE_CLAUDE_CODE || truthy("ORBI_DISABLE_CLAUDE_CODE_PROMPT")
  export const ORBI_DISABLE_CLAUDE_CODE_SKILLS =
    ORBI_DISABLE_CLAUDE_CODE || truthy("ORBI_DISABLE_CLAUDE_CODE_SKILLS")
  export const ORBI_DISABLE_EXTERNAL_SKILLS =
    ORBI_DISABLE_CLAUDE_CODE_SKILLS || truthy("ORBI_DISABLE_EXTERNAL_SKILLS")
  export declare const ORBI_DISABLE_PROJECT_CONFIG: boolean
  export const ORBI_FAKE_VCS = process.env["ORBI_FAKE_VCS"]
  export declare const ORBI_CLIENT: string
  export const ORBI_SERVER_PASSWORD = process.env["ORBI_SERVER_PASSWORD"]
  export const ORBI_SERVER_USERNAME = process.env["ORBI_SERVER_USERNAME"]
  export const ORBI_ENABLE_QUESTION_TOOL = truthy("ORBI_ENABLE_QUESTION_TOOL")

  // Experimental
  export const ORBI_EXPERIMENTAL = truthy("ORBI_EXPERIMENTAL")
  export const ORBI_EXPERIMENTAL_FILEWATCHER = Config.boolean("ORBI_EXPERIMENTAL_FILEWATCHER").pipe(
    Config.withDefault(false),
  )
  export const ORBI_EXPERIMENTAL_DISABLE_FILEWATCHER = Config.boolean(
    "ORBI_EXPERIMENTAL_DISABLE_FILEWATCHER",
  ).pipe(Config.withDefault(false))
  export const ORBI_EXPERIMENTAL_ICON_DISCOVERY =
    ORBI_EXPERIMENTAL || truthy("ORBI_EXPERIMENTAL_ICON_DISCOVERY")

  const copy = process.env["ORBI_EXPERIMENTAL_DISABLE_COPY_ON_SELECT"]
  export const ORBI_EXPERIMENTAL_DISABLE_COPY_ON_SELECT =
    copy === undefined ? process.platform === "win32" : truthy("ORBI_EXPERIMENTAL_DISABLE_COPY_ON_SELECT")
  export const ORBI_ENABLE_EXA =
    truthy("ORBI_ENABLE_EXA") || ORBI_EXPERIMENTAL || truthy("ORBI_EXPERIMENTAL_EXA")
  export const ORBI_EXPERIMENTAL_BASH_DEFAULT_TIMEOUT_MS = number("ORBI_EXPERIMENTAL_BASH_DEFAULT_TIMEOUT_MS")
  export const ORBI_EXPERIMENTAL_OUTPUT_TOKEN_MAX = number("ORBI_EXPERIMENTAL_OUTPUT_TOKEN_MAX")
  export const ORBI_EXPERIMENTAL_OXFMT = ORBI_EXPERIMENTAL || truthy("ORBI_EXPERIMENTAL_OXFMT")
  export const ORBI_EXPERIMENTAL_LSP_TY = truthy("ORBI_EXPERIMENTAL_LSP_TY")
  export const ORBI_EXPERIMENTAL_LSP_TOOL = ORBI_EXPERIMENTAL || truthy("ORBI_EXPERIMENTAL_LSP_TOOL")
  export const ORBI_DISABLE_FILETIME_CHECK = Config.boolean("ORBI_DISABLE_FILETIME_CHECK").pipe(
    Config.withDefault(false),
  )
  export const ORBI_EXPERIMENTAL_PLAN_MODE = ORBI_EXPERIMENTAL || truthy("ORBI_EXPERIMENTAL_PLAN_MODE")
  export const ORBI_EXPERIMENTAL_WORKSPACES = ORBI_EXPERIMENTAL || truthy("ORBI_EXPERIMENTAL_WORKSPACES")
  export const ORBI_EXPERIMENTAL_MARKDOWN = !falsy("ORBI_EXPERIMENTAL_MARKDOWN")
  export const ORBI_MODELS_URL = process.env["ORBI_MODELS_URL"]
  export const ORBI_MODELS_PATH = process.env["ORBI_MODELS_PATH"]
  export const ORBI_DISABLE_CHANNEL_DB = truthy("ORBI_DISABLE_CHANNEL_DB")
  export const ORBI_SKIP_MIGRATIONS = truthy("ORBI_SKIP_MIGRATIONS")
  export const ORBI_STRICT_CONFIG_DEPS = truthy("ORBI_STRICT_CONFIG_DEPS")

  function number(key: string) {
    const value = process.env[key]
    if (!value) return undefined
    const parsed = Number(value)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
  }
}

// Dynamic getter for ORBI_DISABLE_PROJECT_CONFIG
// This must be evaluated at access time, not module load time,
// because external tooling may set this env var at runtime
Object.defineProperty(Flag, "ORBI_DISABLE_PROJECT_CONFIG", {
  get() {
    return truthy("ORBI_DISABLE_PROJECT_CONFIG")
  },
  enumerable: true,
  configurable: false,
})

// Dynamic getter for ORBI_TUI_CONFIG
// This must be evaluated at access time, not module load time,
// because tests and external tooling may set this env var at runtime
Object.defineProperty(Flag, "ORBI_TUI_CONFIG", {
  get() {
    return process.env["ORBI_TUI_CONFIG"]
  },
  enumerable: true,
  configurable: false,
})

// Dynamic getter for ORBI_CONFIG_DIR
// This must be evaluated at access time, not module load time,
// because external tooling may set this env var at runtime
Object.defineProperty(Flag, "ORBI_CONFIG_DIR", {
  get() {
    return process.env["ORBI_CONFIG_DIR"]
  },
  enumerable: true,
  configurable: false,
})

// Dynamic getter for ORBI_CLIENT
// This must be evaluated at access time, not module load time,
// because some commands override the client at runtime
Object.defineProperty(Flag, "ORBI_CLIENT", {
  get() {
    return process.env["ORBI_CLIENT"] ?? "cli"
  },
  enumerable: true,
  configurable: false,
})
