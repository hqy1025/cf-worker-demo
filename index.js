export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const targetHost = url.pathname.slice(1);
    if (!targetHost) {
      return new Response("用法：https://xxx.workers.dev/目标地址", { status: 200 });
    }
    const targetUrl = `https://${targetHost}${url.search}`;
    const newReq = new Request(targetUrl, request);
    return await fetch(newReq);
  }
}
