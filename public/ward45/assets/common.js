(function(){
  function warn(){
    if(document.getElementById('libwarn'))return;
    const d=document.createElement('div');d.id='libwarn';
    d.style.cssText='position:fixed;left:0;right:0;top:0;z-index:9999;background:#c0392b;color:#fff;padding:10px 16px;font:14px system-ui;';
    d.textContent='The map library did not load. Check that the assets/vendor folder sits next to this page, and that the page is opened from the report folder.';
    document.body.prepend(d);
  }
  window.addEventListener('DOMContentLoaded',()=>{if(!window.L||(document.querySelector('canvas[id^=ch-]')&&!window.Chart))warn();});
})();
if(window.Chart){Chart.defaults.animation=false;}
/* Shared helpers for every page. Data files set window globals; no fetch() so file:// works. */
const PAGES = [
  ['index.html','Overview'],['people.html','People & Ratepayers'],['business.html','Informal Trade'],
  ['council.html','Subcouncil 19'],['fire.html','Fire'],['waste.html','Refuse & Recycling'],
  ['community.html','Community'],['traffic.html','Traffic & Taxis'],['air.html','Air'],
  ['water.html','Water & Land'],['sources.html','Sources']
];
function buildHeader(active){
  const h=document.createElement('header'); h.className='top';
  h.innerHTML='<div class="in"><span class="brand">Ward 45 &middot; Marina Estate</span><nav>'+
    PAGES.map(p=>'<a href="'+p[0]+'"'+(p[0]===active?' class="on"':'')+'>'+p[1]+'</a>').join('')+'</nav></div>';
  document.body.prepend(h);
}
function buildFooter(extra){
  const f=document.createElement('footer');
  f.innerHTML='Data: City of Cape Town Open Data Portal (ArcGIS Hub). Basemap &copy; Esri. Map data &copy; OpenStreetMap contributors. '+
   'Counts are for features that touch the Ward 45 or Subcouncil 19 boundary. '+(extra||'')+
   ' Data pulled '+(window.META?META.pulled:'')+'.';
  document.body.appendChild(f);
}
function newMap(id, opts){
  const map=L.map(id,{zoomControl:true,preferCanvas:true});
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'Basemap &copy; Esri, HERE, Garmin, OpenStreetMap contributors'}).addTo(map);
  const w=L.geoJSON(window.BOUNDS.ward45,{style:{color:'#c0392b',weight:3,fillOpacity:0.04,dashArray:null}}).addTo(map);
  w.bindTooltip('Ward 45',{sticky:true});
  let sc=null;
  if(!opts||opts.sc!==false){
    sc=L.geoJSON(window.BOUNDS.sc19,{style:{color:'#2c5aa0',weight:2,fillOpacity:0,dashArray:'6 5'},interactive:false}).addTo(map);
  }
  const focus=(opts&&opts.focus==='sc')&&sc?sc.getBounds():w.getBounds().pad(0.25);
  map.fitBounds(focus);
  map.__ward=w; map.__sc=sc;
  return map;
}
function addLegend(map, html, pos){
  const c=L.control({position:pos||'bottomright'});
  c.onAdd=function(){const d=L.DomUtil.create('div','legend');d.innerHTML=html;return d;};
  c.addTo(map); return c;
}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));}
function fmt(n){return (n==null||isNaN(n))?'n/a':Number(n).toLocaleString('en-ZA');}
function statCard(n,l,s){return '<div class="card stat"><div class="n">'+esc(n)+'</div><div class="l">'+esc(l)+'</div>'+(s?'<div class="s">'+esc(s)+'</div>':'')+'</div>';}
function circle(latlng,color,r,fillOp){return L.circleMarker(latlng,{radius:r||6,color:'#222',weight:1,fillColor:color,fillOpacity:fillOp==null?0.85:fillOp});}
function popupRows(obj,keys){return '<table style="font-size:12px">'+keys.filter(k=>obj[k]!=null&&obj[k]!=='').map(k=>'<tr><td style="color:#666;padding-right:8px">'+esc(k)+'</td><td>'+esc(obj[k])+'</td></tr>').join('')+'</table>';}
/* inside(): point-in-ring test for the "Ward 45 only" filters done in the browser */
function ringHas(pt,ring){let c=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const xi=ring[i][0],yi=ring[i][1],xj=ring[j][0],yj=ring[j][1];if(((yi>pt[1])!==(yj>pt[1]))&&(pt[0]<(xj-xi)*(pt[1]-yi)/(yj-yi+1e-12)+xi))c=!c;}return c;}
function inPolyGeom(pt,g){const polys=g.type==='MultiPolygon'?g.coordinates:[g.coordinates];for(const rings of polys){if(ringHas(pt,rings[0])&&!rings.slice(1).some(h=>ringHas(pt,h)))return true;}return false;}
function inWard45(lon,lat){return window.BOUNDS.ward45.features.some(f=>inPolyGeom([lon,lat],f.geometry));}
