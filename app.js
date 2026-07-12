
const STORAGE_KEY="aseerAppDataV3",META_KEY="aseerAppMetaV3";
let appData=JSON.parse(localStorage.getItem(STORAGE_KEY)||JSON.stringify(ORIGINAL_DATA));
let appMeta=JSON.parse(localStorage.getItem(META_KEY)||JSON.stringify(DEFAULT_META));
let snapshot=null,editMode=false,currentEdit=null;

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
function numberOf(v){const s=String(v??"").replace(/,/g,"").replace(/%/g,"").trim();if(s.includes(":")){const p=s.split(":").map(Number);return(p[0]||0)*60+(p[1]||0)}return parseFloat(s)}
function changeOf(a,b){const x=numberOf(a),y=numberOf(b);return Number.isFinite(x)&&Number.isFinite(y)&&x!==0?((y-x)/Math.abs(x)*100).toFixed(1)+"%":"—"}
function rangeLabel(r){return {green:"أخضر",yellow:"أصفر",red:"أحمر"}[r]||""}
function statusClass(r){return["green","yellow","red"].includes(r)?r:""}
function accent(r){return {green:"#1aa361",yellow:"#f3b400",red:"#df3f48"}[r]||"#0793b2"}
function displayValue(x,key){const v=x[key];return `${v}${x.unit&&x.unit!=="%"&&!String(v).includes(x.unit)?" "+x.unit:""}`}
function toast(t){const el=$("#toast");el.textContent=t;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),1600)}
function applyMeta(){
  $$("[data-global-edit]").forEach(el=>{const key=el.dataset.globalEdit;el.textContent=appMeta[key]??el.textContent});
  $$("[data-chart-title]").forEach(el=>el.textContent=appMeta.chartTitles[el.dataset.chartTitle]||el.textContent)
}
function topKpis(){return [appData.hospital[0],appData.hospital[1],appData.hospital[3],appData.hospital[4],appData.hospital[5],appData.hospital[6],appData.hospital[7],appData.primary[4]].filter(Boolean)}
function renderKpis(){
  $("#kpiGrid").innerHTML=topKpis().map((x)=>{
    const type=appData.hospital.includes(x)?"hospital":"primary",idx=appData[type].indexOf(x),neutral=x.range==="neutral";
    return `<article class="kpi-card" style="--accent:${accent(x.range)}">
      <div class="kpi-top"><div class="kpi-icon">${x.name.includes("Lab")?"⚗":x.name.includes("Rad")?"▣":x.name.includes("إشغال")?"▰":x.name.includes("طوارئ")?"✚":"◷"}</div><button class="kpi-edit" data-edit="${type}:${idx}">✎</button></div>
      <div class="kpi-title">${x.name}</div>
      <div class="kpi-values"><div><small>الأسبوع الأول</small><strong>${displayValue(x,"w1")}</strong></div><div><small>الأسبوع الثاني</small><strong>${displayValue(x,"w2")}</strong></div></div>
      <div class="kpi-bottom"><span class="change">${changeOf(x.w1,x.w2)}</span>${neutral?"":`<span class="status-pill ${statusClass(x.range)}">${rangeLabel(x.range)}</span>`}</div>
    </article>`}).join("")
}
function renderTable(type,id){
  $(id).innerHTML=appData[type].map((x,i)=>`<tr><td>${x.name}</td><td>${displayValue(x,"w1")}</td><td>${displayValue(x,"w2")}</td><td>${changeOf(x.w1,x.w2)}</td><td>${x.range==="neutral"?"":`<span class="status-pill ${statusClass(x.range)}">${rangeLabel(x.range)}</span>`}</td><td><button class="row-edit" data-edit="${type}:${i}">✎</button></td></tr>`).join("")
}
function renderHospitals(){
  const ranked=[...appData.hospitals].sort((a,b)=>b[1]-a[1]);
  $("#hospitalCards").innerHTML=ranked.map((x,i)=>`<article class="hospital-card"><div class="rank">${i+1}</div><div style="flex:1"><h3>${x[0]}</h3><small>${x[1]>=0?"زيادة":"انخفاض"} عن الأسبوع الأول</small></div><strong class="${x[1]>=0?"positive-text":"negative-text"}">${x[1]>0?"+":""}${x[1]}</strong><button class="row-edit" data-hospital-edit="${appData.hospitals.findIndex(h=>h[0]===x[0]&&h[1]===x[1])}">✎</button></article>`).join("")
}
function renderInsights(){
  $("#insightGrid").innerHTML=appMeta.notes.map((n,i)=>`<article class="insight-card"><div style="display:flex;justify-content:space-between"><h3>${n.title}</h3><button class="row-edit" data-note-edit="${i}">✎</button></div><p>${n.text}</p></article>`).join("")
}
function renderAll(){applyMeta();renderKpis();renderTable("hospital","#hospitalTable");renderTable("primary","#primaryTable");renderHospitals();renderInsights();bindEditButtons();requestAnimationFrame(renderCharts)}
function fieldsHtml(fields){return fields.map(f=>`<div class="field ${f.full?"full":""}"><label>${f.label}</label>${f.type==="select"?`<select name="${f.name}">${f.options.map(o=>`<option value="${o.value}" ${o.value===f.value?"selected":""}>${o.label}</option>`).join("")}</select>`:f.type==="textarea"?`<textarea name="${f.name}" rows="4">${f.value??""}</textarea>`:`<input name="${f.name}" value="${String(f.value??"").replace(/"/g,"&quot;")}"></div>`).join("")}
function openModal(title,fields,onSubmit){$("#modalTitle").textContent=title;$("#formFields").innerHTML=fieldsHtml(fields);currentEdit=onSubmit;$("#editModal").classList.add("open");$("#editModal").setAttribute("aria-hidden","false")}
function closeModal(){$("#editModal").classList.remove("open");$("#editModal").setAttribute("aria-hidden","true");currentEdit=null}
function editIndicator(type,idx){
  const x=appData[type][idx];
  openModal("تعديل المؤشر",[
    {name:"name",label:"اسم المؤشر",value:x.name,full:true},{name:"w1",label:"الأسبوع الأول",value:x.w1},{name:"w2",label:"الأسبوع الثاني",value:x.w2},
    {name:"unit",label:"الوحدة",value:x.unit||""},{name:"range",label:"النطاق",type:"select",value:x.range,options:[{value:"neutral",label:"بدون نطاق"},{value:"green",label:"أخضر"},{value:"yellow",label:"أصفر"},{value:"red",label:"أحمر"}]}
  ],v=>Object.assign(x,v))
}
function bindEditButtons(){
  $$("[data-edit]").forEach(b=>b.onclick=()=>{const[t,i]=b.dataset.edit.split(":");editIndicator(t,+i)});
  $$("[data-hospital-edit]").forEach(b=>b.onclick=()=>{const i=+b.dataset.hospitalEdit,x=appData.hospitals[i];openModal("تعديل المستشفى",[{name:"name",label:"اسم المستشفى",value:x[0],full:true},{name:"value",label:"الفرق",value:x[1]}],v=>appData.hospitals[i]=[v.name,Number(v.value)||0])});
  $$("[data-note-edit]").forEach(b=>b.onclick=()=>{const i=+b.dataset.noteEdit,n=appMeta.notes[i];openModal("تعديل الملاحظة",[{name:"title",label:"العنوان",value:n.title,full:true},{name:"text",label:"النص",value:n.text,type:"textarea",full:true}],v=>Object.assign(n,v))});
}
function setEditMode(v){editMode=v;document.body.classList.toggle("editing",v);$("#editModeBtn").textContent=v?"● وضع التعديل مفعل":"✎ وضع التعديل";if(v)snapshot={data:structuredClone(appData),meta:structuredClone(appMeta)}}
$$(".nav-item").forEach(b=>b.onclick=()=>{$$(".nav-item").forEach(x=>x.classList.remove("active"));b.classList.add("active");$$(".page").forEach(x=>x.classList.remove("active"));$("#"+b.dataset.page).classList.add("active");$("#sidebar").classList.remove("open");setTimeout(renderCharts,50)});
$("#mobileMenu").onclick=()=>$("#sidebar").classList.toggle("open");
$("#themeBtn").onclick=()=>{document.body.classList.toggle("dark");setTimeout(renderCharts,80)};
$("#printBtn").onclick=()=>window.print();
$("#editModeBtn").onclick=()=>setEditMode(!editMode);
$("#saveBtn").onclick=()=>{localStorage.setItem(STORAGE_KEY,JSON.stringify(appData));localStorage.setItem(META_KEY,JSON.stringify(appMeta));setEditMode(false);$("#saveState").textContent="● محفوظ";toast("تم حفظ التعديلات على هذا الجهاز")};
$("#cancelBtn").onclick=()=>{if(snapshot){appData=snapshot.data;appMeta=snapshot.meta}setEditMode(false);renderAll();toast("تم إلغاء التعديلات")};
$("#closeModal").onclick=$("#modalCancel").onclick=closeModal;
$("#editForm").onsubmit=e=>{e.preventDefault();if(!currentEdit)return;const v=Object.fromEntries(new FormData(e.target).entries());currentEdit(v);closeModal();renderAll();$("#saveState").textContent="● توجد تعديلات غير محفوظة"};
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal();if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="s"){e.preventDefault();$("#saveBtn").click()}});
$$("[data-global-edit]").forEach(el=>el.ondblclick=()=>{if(!editMode)return;const key=el.dataset.globalEdit;openModal("تعديل النص",[{name:"value",label:"النص",value:appMeta[key],full:true}],v=>appMeta[key]=v.value)});
$$("[data-edit-title]").forEach(el=>el.onclick=()=>{if(!editMode)return;const key=el.dataset.editTitle;openModal("تعديل عنوان الرسم",[{name:"value",label:"العنوان",value:appMeta.chartTitles[key],full:true}],v=>appMeta.chartTitles[key]=v.value)});
$("[data-add-row='hospital']").onclick=()=>openModal("إضافة مؤشر مستشفى",[{name:"name",label:"اسم المؤشر",full:true},{name:"w1",label:"الأسبوع الأول"},{name:"w2",label:"الأسبوع الثاني"},{name:"unit",label:"الوحدة"},{name:"range",label:"النطاق",type:"select",value:"neutral",options:[{value:"neutral",label:"بدون نطاق"},{value:"green",label:"أخضر"},{value:"yellow",label:"أصفر"},{value:"red",label:"أحمر"}]}],v=>appData.hospital.push(v));
$("[data-add-row='primary']").onclick=()=>openModal("إضافة مؤشر رعاية أولية",[{name:"name",label:"اسم المؤشر",full:true},{name:"w1",label:"الأسبوع الأول"},{name:"w2",label:"الأسبوع الثاني"},{name:"unit",label:"الوحدة"},{name:"range",label:"النطاق",type:"select",value:"neutral",options:[{value:"neutral",label:"بدون نطاق"},{value:"green",label:"أخضر"},{value:"yellow",label:"أصفر"},{value:"red",label:"أحمر"}]}],v=>appData.primary.push(v));
$("[data-add-hospital]").onclick=()=>openModal("إضافة مستشفى",[{name:"name",label:"اسم المستشفى",full:true},{name:"value",label:"الفرق"}],v=>appData.hospitals.push([v.name,Number(v.value)||0]));
$("[data-add-note]").onclick=()=>openModal("إضافة ملاحظة",[{name:"title",label:"العنوان",full:true},{name:"text",label:"النص",type:"textarea",full:true}],v=>appMeta.notes.push(v));
$("#addWeekBtn").onclick=()=>toast("تم تجهيز الهيكل لإضافة الأسابيع؛ يمكن ربطه بقاعدة بيانات في المرحلة التالية.");
$("#exportJsonBtn").onclick=()=>{const blob=new Blob([JSON.stringify({data:appData,meta:appMeta},null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="aseer-dashboard-backup.json";a.click();URL.revokeObjectURL(a.href)};
$("#importJsonBtn").onclick=()=>{$("#filePicker").accept=".json";$("#filePicker").click()};
$("#importExcelBtn").onclick=()=>{$("#filePicker").accept=".xlsx,.xls";$("#filePicker").click()};
$("#filePicker").onchange=async e=>{const f=e.target.files[0];if(!f)return;try{
 if(f.name.toLowerCase().endsWith(".json")){const o=JSON.parse(await f.text());appData=o.data||o;appMeta=o.meta||appMeta;renderAll();toast("تم استيراد النسخة الاحتياطية")}
 else if(typeof XLSX!=="undefined"){const wb=XLSX.read(await f.arrayBuffer(),{type:"array"}),s1=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,defval:""}),s2=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[1]],{header:1,defval:""});const rows=s1.slice(1).filter(r=>r[0]);const p=[],h=[];rows.forEach((r,i)=>{const x={name:String(r[0]).trim(),w1:String(r[1]),w2:String(r[2]),range:"neutral",unit:""};if(x.name.includes("الوصول للطبيب")||x.name.includes("تجربة المستفيد")||x.name.includes("زمن الاستجابة"))x.range="yellow";if(x.name.includes("جاهزية أسطول"))x.range="red";if(x.name.includes("إشغال")||x.name.includes("Lab TAT")||x.name.includes("Rad TAT")||x.name.includes("المواعيد"))x.range="green";if(x.name.includes("دقيقة")||x.name.includes("Rad TAT"))x.unit="دقيقة";if(x.name.includes("Lab TAT"))x.unit="%";(i<10?p:h).push(x)});appData.primary=p;appData.hospital=h;appData.hospitals=s2.slice(1).filter(r=>r[0]).map(r=>[String(r[0]),Number(String(r[1]).replace("+",""))||0]);renderAll();toast("تم تحديث البيانات من Excel")}
}catch(err){toast("تعذر استيراد الملف: "+err.message)}finally{e.target.value=""}};
$("#resetBtn").onclick=()=>{if(confirm("هل تريد استعادة النسخة الأصلية ومسح كل التعديلات؟")){localStorage.removeItem(STORAGE_KEY);localStorage.removeItem(META_KEY);appData=structuredClone(ORIGINAL_DATA);appMeta=structuredClone(DEFAULT_META);renderAll();toast("تمت استعادة النسخة الأصلية")}};
window.addEventListener("load",renderAll);
