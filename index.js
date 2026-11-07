export default {
  async fetch(request, env, ctx) {
    return new Response("✅ Hello Cloudflare Worker！", {
      headers: {
        "content-type": "text/plain;charset=utf-8"
      }
    });
  }
}
