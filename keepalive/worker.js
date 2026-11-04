// Pings the Render free-tier API every 10 min so it never hits the 15-min idle sleep.
export default {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(
      fetch(`${env.TARGET_URL}/health`, { headers: { 'User-Agent': 'idea-vault-keepalive' } }).then(
        (r) => console.log(`keepalive ${r.status}`),
        (e) => console.log(`keepalive failed: ${e}`),
      ),
    )
  },
}
