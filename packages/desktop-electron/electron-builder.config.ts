import type { Configuration } from "electron-builder"

const channel = (() => {
  const raw = process.env.ORBI_CHANNEL
  if (raw === "dev" || raw === "beta" || raw === "prod") return raw
  return "dev"
})()

const getBase = (): Configuration => ({
  artifactName: "orbi-electron-${os}-${arch}.${ext}",
  directories: {
    output: "dist",
    buildResources: "resources",
  },
  files: ["out/**/*", "resources/**/*"],
  extraResources: [
    {
      from: "resources/",
      to: "",
      filter: ["orbi-cli*"],
    },
    {
      from: "native/",
      to: "native/",
      filter: ["index.js", "index.d.ts", "build/Release/mac_window.node", "swift-build/**"],
    },
  ],
  mac: {
    category: "public.app-category.developer-tools",
    icon: `resources/icons/icon.icns`,
    hardenedRuntime: true,
    gatekeeperAssess: false,
    entitlements: "resources/entitlements.plist",
    entitlementsInherit: "resources/entitlements.plist",
    notarize: true,
    target: ["dmg", "zip"],
  },
  dmg: {
    sign: true,
  },
  protocols: {
    name: "Orbi",
    schemes: ["orbi"],
  },
  win: {
    icon: `resources/icons/icon.ico`,
    target: ["nsis"],
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    installerIcon: `resources/icons/icon.ico`,
    installerHeaderIcon: `resources/icons/icon.ico`,
  },
  linux: {
    icon: `resources/icons`,
    category: "Development",
    target: ["AppImage", "deb", "rpm"],
  },
})

function getConfig() {
  const base = getBase()

  switch (channel) {
    case "dev": {
      return {
        ...base,
        appId: "com.orbi.desktop.dev",
        productName: "Orbi Dev",
        rpm: { packageName: "orbi-dev" },
      }
    }
    case "beta": {
      return {
        ...base,
        appId: "com.orbi.desktop.beta",
        productName: "Orbi Beta",
        protocols: { name: "Orbi Beta", schemes: ["orbi"] },
        publish: { provider: "github", owner: "anomalyco", repo: "orbi-beta", channel: "latest" },
        rpm: { packageName: "orbi-beta" },
      }
    }
    case "prod": {
      return {
        ...base,
        appId: "com.orbi.desktop",
        productName: "Orbi",
        protocols: { name: "Orbi", schemes: ["orbi"] },
        publish: { provider: "github", owner: "anomalyco", repo: "orbi", channel: "latest" },
        rpm: { packageName: "orbi" },
      }
    }
  }
}

export default getConfig()
