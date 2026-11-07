/**
 * WLOC 虚拟定位 Worker（修复wrangler语法报错版本）
 */
const HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>WLOC 虚拟定位</title>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>*{box-sizing:border-box}body{margin:0;font-family:system-ui}#map{height:60vh;width:100%}.panel{padding:16px}.btn{padding:10px 16px;border:none;border-radius:8px;margin:4px;cursor:pointer}.blue{background:#007bff;color:#fff}.gray{background:#aaa;color:#fff}.input{width:100%;padding:10px;border:1px solid #ccc;border-radius:8px;margin:8px 0}</style>
</head>
<body>
<div id="map"></div>
<div class="panel">
<div>选择目标位置</div>
<input class="input" id="coord" placeholder="点击地图或使用下方工具选择位置" readonly>
<div>
<button class="btn blue" id="saveBtn">储存到设备</button>
<button class="btn gray" id="collectBtn">收藏位置</button>
<button class="btn gray" id="getlocBtn">当前位置</button>
</div>
<div style="margin-top:12px"><b>收藏的位置</b></div>
<div id="list" style="margin:8px 0;font-size:14px;color:#666">暂无收藏，选好位置后点击「收藏位置」</div>
</div>
<script>
const host = location.origin;
let marker, lat=22.544577, lng=113.94114;
const map = L.map('map').setView([lat,lng],13);
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{attribution:'Tiles &copy; Esri'}).addTo(map);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{opacity:0.4}).addTo(map);

function setMarker(la,ln){
    lat=la;lng=ln;
    if(marker) marker.remove();
    marker = L.marker([la,ln]).addTo(map);
    document.getElementById('coord').value = la+','+ln;
    map.setView([la,ln],15);
}

map.on('click',e=>setMarker(e.latlng.lat,e.latlng.lng));

document.getElementById('saveBtn').onclick = async function(){
    await fetch(host+'/set',{method:'POST',body:JSON.stringify({lat,lng,acc:25})});
    alert('✅ 已保存定位，模块启用后生效！');
};
document.getElementById('collectBtn').onclick = async function(){
    let arr = JSON.parse(localStorage.getItem('wloc_saved')||'[]');
    arr.push({lat,lng});
    localStorage.setItem('wloc_saved',JSON.stringify(arr));
    renderList();
};
document.getElementById('getlocBtn').onclick = async function(){
    navigator.geolocation.getCurrentPosition(p=>setMarker(p.coords.latitude,p.coords.longitude));
};

function renderList(){
    let arr = JSON.parse(localStorage.getItem('wloc_saved')||'[]');
    let html = '';
    for(let i=0;i<arr.length;i++){
        const item = arr[i];
        html += '<div data-lat="'+item.lat+'" data-lng="'+item.lng+'">'+item.lat+','+item.lng+' <button data-idx="'+i+'">删除</button></div>';
    }
    document.getElementById('list').innerHTML = html || '暂无收藏';
    document.querySelectorAll('#list div').forEach(d=>{
        d.onclick = ()=>setMarker(Number(d.dataset.lat),Number(d.dataset.lng));
    });
    document.querySelectorAll('#list button').forEach(btn=>{
        btn.onclick = (ev)=>{
            ev.stopPropagation();
            let arr = JSON.parse(localStorage.getItem('wloc_saved')||'[]');
            arr.splice(Number(btn.dataset.idx),1);
            localStorage.setItem('wloc_saved',JSON.stringify(arr));
            renderList();
        }
    })
}

renderList();
setMarker(lat,lng);
</script>
</body>
</html>`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/') {
      return new Response(HTML, { headers: { "content-type": "text/html;charset=utf-8" } });
    }
    if (url.pathname === '/set') {
      const data = await request.json();
      await env.WLOC.put("loc", JSON.stringify(data));
      return Response.json({ ok: true });
    }
    if (url.pathname === '/get') {
      const raw = await env.WLOC.get("loc");
      return Response.json(raw ? JSON.parse(raw) : { lat:22.544577,lng:113.94114,acc:25 });
    }
    if (url.hostname === "gs-loc.apple.com") {
      const locCfg = JSON.parse(await env.WLOC.get("loc") || '{"lat":22.544577,"lng":113.94114,"acc":25}');
      const body = await request.text();
      const reply = `{"wifi":[{"lat":${locCfg.lat},"lon":${locCfg.lng},"unc":${locCfg.acc}}]}`;
      return new Response(reply, { status:200, headers:{"Content-Type":"application/json"} });
    }
    return fetch(request);
  }
}
