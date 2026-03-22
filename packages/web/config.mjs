const stage = process.env.SST_STAGE || "dev"

export default {
  url: stage === "production" ? "https://orbicowork.arqxus.com" : `https://${stage}.orbicowork.arqxus.com`,
  console: stage === "production" ? "https://orbicowork.arqxus.com/auth" : `https://${stage}.orbicowork.arqxus.com/auth`,
  email: "contact@anoma.ly",
  socialCard: "https://social-cards.sst.dev",
  github: "https://github.com/anomalyco/orbi",
  discord: "https://orbicowork.arqxus.com/discord",
  headerLinks: [
    { name: "app.header.home", url: "/" },
    { name: "app.header.docs", url: "/docs/" },
  ],
}
