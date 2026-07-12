
let charts={};
function chartNum(v){
  const s=String(v??"").replace(/,/g,"").replace(/%/g,"").trim();
  if(s.includes(":")){const p=s.split(":").map(Number);return (p[0]||0)*60+(p[1]||0)}
  return Number.parseFloat(s)||0;
}
function destroyCharts(){Object.values(charts).forEach(c=>c?.destroy());charts={}}
function chartTextColor(){return getComputedStyle(document.body).getPropertyValue("--muted").trim()||"#728198"}
function renderCharts(){
  if(typeof Chart==="undefined")return;
  destroyCharts();
  Chart.defaults.font.family='"Segoe UI",Tahoma,Arial,sans-serif';
  Chart.defaults.color=chartTextColor();
  const h=appData.hospital,p=appData.primary;
  const byName=(arr,part)=>arr.find(x=>x.name.includes(part));
  const visits=[byName(p,"زيارات المراكز"),byName(h,"مراجعين طوارئ"),byName(p,"الرعاية العاجلة"),byName(p,"العربات")].filter(Boolean);
  charts.visits=new Chart(document.getElementById("visitsChart"),{type:"bar",data:{labels:visits.map(x=>x.name),datasets:[
    {label:"الأسبوع الأول",data:visits.map(x=>chartNum(x.w1)),backgroundColor:"#74c9e5",borderRadius:8},
    {label:"الأسبوع الثاني",data:visits.map(x=>chartNum(x.w2)),backgroundColor:"#0793b2",borderRadius:8}
  ]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"bottom"}},scales:{x:{grid:{display:false}},y:{beginAtZero:true}}}});
  const occ=[byName(h,"العناية المركزة"),byName(h,"الأسرة العامة")].filter(Boolean);
  charts.occupancy=new Chart(document.getElementById("occupancyChart"),{type:"doughnut",data:{labels:occ.map(x=>x.name),datasets:[{data:occ.map(x=>chartNum(x.w2)),backgroundColor:["#6755d9","#1aa361"],borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,cutout:"68%",plugins:{legend:{position:"bottom"}}}});
  const lab=byName(h,"Lab TAT"),rad=byName(h,"Rad TAT");
  charts.tat=new Chart(document.getElementById("tatChart"),{type:"line",data:{labels:["الأسبوع الأول","الأسبوع الثاني"],datasets:[
    {label:"Lab TAT (%)",data:[chartNum(lab?.w1),chartNum(lab?.w2)],borderColor:"#1aa361",backgroundColor:"rgba(26,163,97,.14)",fill:true,tension:.35},
    {label:"Rad TAT (دقيقة)",data:[chartNum(rad?.w1),chartNum(rad?.w2)],borderColor:"#0793b2",backgroundColor:"rgba(7,147,178,.12)",fill:true,tension:.35}
  ]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"bottom"}},scales:{y:{beginAtZero:false}}}});
  const ranked=[...appData.hospitals].sort((a,b)=>b[1]-a[1]).slice(0,12);
  charts.ranking=new Chart(document.getElementById("rankingChart"),{type:"bar",data:{labels:ranked.map(x=>x[0]),datasets:[{label:"الفرق",data:ranked.map(x=>x[1]),backgroundColor:ranked.map(x=>x[1]>=0?"#0793b2":"#df3f48"),borderRadius:7}]},options:{indexAxis:"y",responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{color:"rgba(120,140,160,.12)"}}}}});
}
