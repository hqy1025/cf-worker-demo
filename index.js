export default {
  async fetch(request, env) {
    try {
      const reqUrl = new URL(request.url);
      // 去掉开头 /
      const rawPath = reqUrl.pathname.slice(1);
      if (!rawPath) {
        return new Response(`Worker反向代理
使用示例：
https://${reqUrl.host}/github.com
https://${reqUrl.host}/github.com/xxx?a=1
`, { headers: { "content-type": "text/plain;charset=utf-8" } });
      }

      const target = new URL(`https://${rawPath}${reqUrl.search}`);
      const newHeaders = new Headers(request.headers);
      newHeaders.set("Host", target.host);
      newHeaders.delete("Referer");

      const targetReq = new Request(target, {
        method: request.method,
        headers: newHeaders,
        body: request.body,
        redirect: "follow"
      });

      const resp = await fetch(targetReq);
      const outHeaders = new Headers(resp.headers);
      // 移除 CF 相关限制头
      outHeaders.delete("content-security-policy");
      outHeaders.delete("x-frame-options");

      return new Response(resp.body, {
        status: resp.status,
        headers: outHeaders
      });
    } catch (e) {
      return new Response(`错误：${e.message}`, { status: 500 });
    }
  }
}
