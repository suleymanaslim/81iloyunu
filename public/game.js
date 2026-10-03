'use strict';
const $ = id => document.getElementById(id);
const STORAGE_KEY = '81il_ogrenmeoyunu.hatalar.v1';
const REGION_CODES = {
 'Marmara':[10,11,16,17,22,34,39,41,54,59,77],
 'Ege':[3,9,20,35,43,45,48,64],
 'Akdeniz':[1,7,15,31,32,33,46,80],
 'İç Anadolu':[6,18,26,38,40,42,50,51,58,66,68,70,71],
 'Karadeniz':[5,8,14,19,28,29,37,52,53,55,57,60,61,67,69,74,78,81],
 'Doğu Anadolu':[4,12,13,23,24,25,30,36,44,49,62,65,75,76],
 'Güneydoğu Anadolu':[2,21,27,47,56,63,72,73,79]
};
const regions = Object.fromEntries(Object.entries(REGION_CODES).flatMap(([r,cs])=>cs.map(c=>[String(c).padStart(2,'0'),r])));
let cities = [], groups = [], mistakes = {}, storageOK = true;
let mode = 'quiz', queue = [], index = 0, active = false, solved = false, errors = 0, hintStep = 0, correctFirst = 0, answered = 0;
let soundOn = true, audioContext, scale = 1, panX = 0, panY = 0;
const landscapeOnly=window.matchMedia('(orientation:landscape) and (max-height:600px) and (pointer:coarse), (orientation:landscape) and (max-height:500px) and (max-width:1100px)');
const pointers = new Map(); let gesture = null;
const rejected = new Set(); const known = new Set(); let advanceTimer = null;
function cancelAdvance(){clearTimeout(advanceTimer);advanceTimer=null;}
function scheduleAdvance(delay=700){cancelAdvance();advanceTimer=setTimeout(()=>{advanceTimer=null;nextQuestion();},delay);}
function loadMistakes(){
 try {
  const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('bad storage');
  for (const [code,v] of Object.entries(raw)) {
   if (regions[code] && v && Number.isSafeInteger(v.count) && v.count>0) mistakes[code]={count:v.count,pending:v.pending!==false,reviewed:Number.isSafeInteger(v.reviewed)&&v.reviewed>=0?v.reviewed:0};
  }
 } catch { storageOK = false; }
}
function saveMistakes(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(mistakes));storageOK=true;}catch{storageOK=false;}renderMistakes();}
function pendingCodes(){return Object.keys(mistakes).filter(c=>mistakes[c].pending);}
function current(){return cities.find(c=>c.code===queue[index]);}
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function sound(kind){
 if(!soundOn)return;
 try{
  const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;
  audioContext ||= new Ctx(); if(audioContext.state==='suspended') void audioContext.resume().catch(()=>{});
  const notes=kind==='correct'?[523.25,659.25,783.99]:kind==='wrong'?[220,174.61]:[620];
  notes.forEach((freq,i)=>{
   const t=audioContext.currentTime+i*.095,osc=audioContext.createOscillator(),gain=audioContext.createGain();
   osc.type='sine';osc.frequency.setValueAtTime(freq,t);gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(.1,t+.012);gain.gain.exponentialRampToValueAtTime(.0001,t+.22);osc.connect(gain);gain.connect(audioContext.destination);osc.start(t);osc.stop(t+.24);
  });
 }catch{}
}
function feedback(text,kind=''){ $('feedback').textContent=text;$('feedback').className='feedback'+(kind?' '+kind:''); }
function clearMap(){rejected.clear();groups.forEach(g=>{g.classList.remove('correct','wrong','dim','revealed');if(mode!=='learn'&&known.has(g.dataset.plakakodu))g.classList.add('correct');g.setAttribute('aria-disabled','false');g.setAttribute('tabindex','0');});}
function paint(code,kind){groups.filter(g=>g.dataset.plakakodu===code).forEach(g=>{g.classList.add(kind);if(kind==='wrong'){g.setAttribute('aria-disabled','true');g.setAttribute('tabindex','-1');}});}
function recordError(){const c=current();if(!c)return;const v=mistakes[c.code]||{count:0,pending:true,reviewed:0};v.count++;v.pending=true;mistakes[c.code]=v;saveMistakes();}
function renderMistakes(){
 const pending=pendingCodes();$('pending-count').textContent=pending.length;$('review-badge').textContent=pending.length;$('review-all').disabled=!pending.length;
 const list=$('mistake-list');list.replaceChildren();
 const codes=Object.keys(mistakes).sort((a,b)=>Number(mistakes[b].pending)-Number(mistakes[a].pending)||mistakes[b].count-mistakes[a].count);
 if(!codes.length){const p=document.createElement('p');p.className='empty';p.textContent='Henüz karıştırdığın bir il yok. Yanlış cevapların otomatik olarak burada görünecek.';list.append(p);}
 for(const code of codes){const c=cities.find(c=>c.code===code);if(!c)continue;const v=mistakes[code];const b=document.createElement('button');b.className='mistake-row';b.setAttribute('aria-label',`${c.name}, ${code} plaka, ${v.count} hata. Bu ili tekrar et.`);
  const plate=document.createElement('span');plate.className='mistake-plate';plate.textContent=code;
  const copy=document.createElement('span'),name=document.createElement('strong'),count=document.createElement('small');name.textContent=c.name;count.textContent=`${v.count} hata · ${v.pending?'Tekrar bekliyor':'Tekrarda doğru bulundu'}`;copy.append(name,count);b.append(plate,copy);
  if(!v.pending){const s=document.createElement('span');s.className='status';s.textContent='✓';b.append(s);}b.addEventListener('click',()=>{startSession('review',[code]);$('target').scrollIntoView({behavior:'smooth',block:'center'});});list.append(b);
 }
 $('storage-note').textContent=storageOK?'Bu liste bu cihazın tarayıcısında saklanır. Tarayıcı verileri silinirse liste de silinir.':'Tarayıcı kaydına erişilemiyor. Hatalar şu an yalnızca bu açık sayfada tutuluyor.';
}
function setMode(newMode){
 cancelAdvance();known.clear();mode=newMode;active=false;solved=false;clearMap();resetZoom();
 document.querySelectorAll('[data-mode]').forEach(b=>{const on=b.dataset.mode===mode;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
 $('start').hidden=false;$('hint').disabled=true;
 if(mode==='learn'){
  $('prompt').textContent='SERBEST KEŞİF';$('target').textContent='Bir ile dokun';$('instruction').textContent='Adını, plakasını ve bölgesini öğren.';$('progress').textContent='81 il';$('accuracy').textContent='Türkiye haritası';$('start').hidden=true;$('hint-text').textContent='Küçük iller için + düğmesiyle yakınlaştır.';$('hint').textContent='İpucu al';feedback('Haritadan istediğin ili seç.');$('session-label').textContent='İstediğin sırayla keşfet.';return;
 }
 queue=shuffle(mode==='review'?pendingCodes():cities.map(c=>c.code));index=0;answered=0;correctFirst=0;
 if(!queue.length){$('prompt').textContent='TEKRAR LİSTESİ';$('target').textContent='Hepsi yolunda!';$('instruction').textContent='Tekrar bekleyen bir il yok.';$('progress').textContent='0 il';$('accuracy').textContent='';$('start').disabled=true;feedback('İli bul bölümünden yeni bir tur oynayabilirsin.');return;}
 $('start').disabled=false;$('start').textContent=mode==='review'?'Tekrara başla':'Oyuna başla';showQuestion();feedback('Hazır olduğunda başla.');
}
function startSession(newMode=mode,codes){
 if(!cities.length)return;setMode(newMode);if(codes){queue=shuffle(codes);index=0;}
 if(!queue.length)return;window.syncAppScreen?.();active=true;$('start').hidden=true;sound('tap');showQuestion();feedback('Haritada doğru ile dokun.');
}
function showQuestion(){
 document.querySelector('.hint-bar').classList.remove('show-landscape-hint');
 cancelAdvance();const c=current();if(!c)return;errors=0;hintStep=0;solved=false;clearMap();resetZoom();
 $('prompt').textContent=mode==='review'?'BİR DAHA BULALIM':'HARİTADA NEREDE?';$('target').textContent=c.name;$('instruction').textContent='İlin bulunduğu yere dokun.';
 $('progress').textContent=`${index+1} / ${queue.length}`;$('accuracy').textContent=`İlk denemede: ${correctFirst} doğru`;
 $('hint-text').textContent='Önce bölgesini öğren, sonra haritada daralt.';$('hint').textContent='İpucu al';$('hint').disabled=!active;
 $('session-label').textContent=mode==='review'?'İpucusuz ve hatasız bulduğunda tekrar tamamlanır.':'Acele etme. İlleri yerleriyle öğren.';
}
function selectProvince(code){
 const chosen=cities.find(c=>c.code===code);if(!chosen)return;
 if(mode==='learn'){clearMap();paint(code,'correct');$('target').textContent=chosen.name;$('instruction').textContent=`${code} plaka · ${chosen.region} Bölgesi`;feedback('Başka bir ile dokunarak devam edebilirsin.');sound('tap');return;}
 if(!active||solved||rejected.has(code))return;const target=current();
 if(code!==target.code){rejected.add(code);errors++;recordError();paint(code,'wrong');feedback(`Burası ${chosen.name} (${code}). ${target.name} için başka bir il seç.`,'error');sound('wrong');return;}
 solved=true;answered++;if(!errors&&!hintStep)correctFirst++;known.add(code);paint(code,'correct');$('hint').disabled=true;
 let tail='';if(mode==='review'&&!errors&&!hintStep&&mistakes[code]){mistakes[code].pending=false;mistakes[code].reviewed++;saveMistakes();tail=' Tekrar tamamlandı.';}else if(mode==='review'){tail=' İpucusuz, hatasız bulmak için tekrar listesinde kalıyor.';}
 feedback(`Doğru! ${target.name} · ${code} plaka.${tail}`,'success');$('accuracy').textContent=`İlk denemede: ${correctFirst} doğru`;sound('correct');scheduleAdvance();
}
function showHint(){
 if(!active||solved)return;const c=current();hintStep++;sound('tap');
 if(hintStep===1){$('hint-text').textContent=`${c.region} Bölgesi’nde. Bu bölgeyi düşün.`;$('hint').textContent='Bölgeyi göster';}
 else if(hintStep===2){groups.forEach(g=>g.classList.toggle('dim',regions[g.dataset.plakakodu]!==c.region&&!known.has(g.dataset.plakakodu)));$('hint-text').textContent='Bölgedeki iller belirgin kaldı. Şimdi aramayı daralt.';$('hint').textContent='Cevabı göster';}
 else{recordError();errors++;groups.forEach(g=>g.classList.remove('dim'));paint(c.code,'revealed');solved=true;answered++;$('hint').disabled=true;$('hint-text').textContent=`${c.name}, sarı renkle gösterilen il. Plakası ${c.code}.`;feedback('Bu il tekrar listene eklendi. Yerini incele; birazdan sonraki soru gelecek.');scheduleAdvance(2400);}
}
function nextQuestion(){
 if(!active||!solved)return;cancelAdvance();index++;
 if(index<queue.length){showQuestion();feedback('Haritada doğru ile dokun.');return;}
 active=false;clearMap();$('prompt').textContent='TUR TAMAMLANDI';$('target').textContent='Eline sağlık!';$('instruction').textContent=`${answered} il çalıştın. ${correctFirst} ilde ilk denemede, ipucusuz doğru cevap verdin.`;$('progress').textContent=`${queue.length} / ${queue.length}`;$('hint').disabled=true;$('start').hidden=false;$('start').disabled=false;$('start').textContent='Yeni tur';feedback(pendingCodes().length?`${pendingCodes().length} il tekrar bekliyor. Hatalarımı tekrar et bölümünden devam edebilirsin.`:'Tekrar bekleyen il kalmadı. Yeni bir tur oynayabilirsin.','success');$('session-label').textContent='';
}
function updateZoom(){
 scale=Math.max(1,Math.min(5,scale));const rect=$('map-viewport').getBoundingClientRect();const mx=rect.width*(scale-1)/2,my=rect.height*(scale-1)/2;panX=Math.max(-mx,Math.min(mx,panX));panY=Math.max(-my,Math.min(my,panY));$('map-mount').style.transform=`translate(${panX}px,${panY}px) scale(${scale})`;$('map-viewport').style.touchAction=scale>1?'none':'pan-y';$('zoom-out').disabled=scale===1;$('zoom-in').disabled=scale===5;
}
function resetZoom(){scale=1;panX=0;panY=0;updateZoom();}
function createPlates(svg){
 const seen=new Set();for(const g of groups){const code=g.dataset.plakakodu;if(seen.has(code))continue;seen.add(code);
 const paths=groups.filter(x=>x.dataset.plakakodu===code).flatMap(x=>[...x.querySelectorAll('path')]);
 const path=paths.sort((a,b)=>{const A=a.getBBox(),B=b.getBBox();return B.width*B.height-A.width*A.height;})[0];const b=path.getBBox();let x=b.x+b.width/2,y=b.y+b.height/2;
 if(typeof path.isPointInFill==='function'){
  const pt=svg.createSVGPoint();let best=Infinity;
  for(let ix=1;ix<15;ix++)for(let iy=1;iy<15;iy++){pt.x=b.x+b.width*ix/15;pt.y=b.y+b.height*iy/15;const d=(pt.x-(b.x+b.width/2))**2+(pt.y-(b.y+b.height/2))**2;if(d<best&&path.isPointInFill(pt)){best=d;x=pt.x;y=pt.y;}}
 }
 const t=document.createElementNS('http://www.w3.org/2000/svg','text');t.setAttribute('x',x);t.setAttribute('y',y);t.setAttribute('text-anchor','middle');t.setAttribute('dominant-baseline','central');t.classList.add('plate');t.textContent=code;svg.append(t);
 }
}
function registerTools(){
 if(!document.modelContext?.registerTool)return;
 const read=()=>({mode,active,question:current()?.name||null,progress:{answered,total:queue.length},mistakes:Object.entries(mistakes).map(([code,v])=>({code,name:cities.find(c=>c.code===code)?.name,...v}))});
 const tools=[{name:'read_learning_state',description:'Read the current question and device-local mistake list.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>read()},
 {name:'start_mistake_review',description:'Start a new review session of provinces pending review on this device.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:false},execute:()=>{if(!pendingCodes().length)throw new Error('No provinces pending review');startSession('review');return read();}},
 {name:'answer_province',description:'Answer the current active question using a province plate code. Wrong selections are disabled for this question; correct answers advance automatically.',inputSchema:{type:'object',properties:{code:{type:'string',pattern:'^(0[1-9]|[1-7][0-9]|8[01])$'}},required:['code'],additionalProperties:false},annotations:{readOnlyHint:false},execute:input=>{if(!input||!cities.some(c=>c.code===input.code))throw new Error('Invalid province code');if(!active||solved||mode==='learn')throw new Error('No active unanswered question');if(rejected.has(input.code))throw new Error('Province disabled for this question');selectProvince(input.code);return {...read(),feedback:$('feedback').textContent};}}];
 for(const tool of tools)try{void Promise.resolve(document.modelContext.registerTool(tool)).catch(()=>{});}catch{}
}
async function init(){
 loadMistakes();
 try{
  const response=await fetch('map.svg');if(!response.ok)throw new Error('map load');const parsed=new DOMParser().parseFromString(await response.text(),'image/svg+xml');if(parsed.querySelector('parsererror'))throw new Error('map XML');const svg=document.importNode(parsed.documentElement,true);
  svg.querySelector('#kibris')?.remove();
  svg.setAttribute('viewBox','0 0 1007.478 430');svg.removeAttribute('id');svg.setAttribute('aria-label','Türkiye illeri ve plaka numaraları');$('map-mount').append(svg);groups=[...svg.querySelectorAll('g[data-plakakodu]')];
  const unique=new Map();groups.forEach(g=>unique.set(g.dataset.plakakodu,{code:g.dataset.plakakodu,name:g.dataset.iladi,region:regions[g.dataset.plakakodu]}));cities=[...unique.values()].sort((a,b)=>a.code.localeCompare(b.code));if(cities.length!==81||cities.some(c=>!c.region))throw new Error('Incomplete map');
  groups.forEach(g=>{g.setAttribute('role','button');g.setAttribute('tabindex','0');g.setAttribute('aria-label',`${g.dataset.iladi}, plaka ${g.dataset.plakakodu}`);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectProvince(g.dataset.plakakodu);}});});createPlates(svg);
  document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{sound('tap');setMode(b.dataset.mode);}));$('start').addEventListener('click',()=>startSession());$('hint').addEventListener('click',()=>{showHint();if(landscapeOnly.matches){$('hint-text').textContent=`${current()?.name||''} · ${$('hint-text').textContent}`;document.querySelector('.hint-bar').classList.add('show-landscape-hint');}});$('review-all').addEventListener('click',()=>{startSession('review');$('target').scrollIntoView({behavior:'smooth',block:'center'});});
  $('sound').addEventListener('click',()=>{soundOn=!soundOn;$('sound').textContent=soundOn?'Ses açık':'Ses kapalı';$('sound').setAttribute('aria-pressed',String(soundOn));if(soundOn)sound('tap');});
  $('zoom-in').addEventListener('click',()=>{scale+=.75;updateZoom();});$('zoom-out').addEventListener('click',()=>{scale-=.75;updateZoom();});$('zoom-reset').addEventListener('click',resetZoom);
  // Refit after rotation or browser chrome changes without restarting the round.
  if(typeof ResizeObserver==='function')new ResizeObserver(()=>{pointers.clear();gesture=null;resetZoom();}).observe($('map-viewport'));
  const view=$('map-viewport');view.addEventListener('pointerdown',e=>{pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===1){gesture={x:e.clientX,y:e.clientY,px:panX,py:panY,code:e.target.closest?.('[data-plakakodu]')?.dataset.plakakodu,moved:false};if(scale>1)view.setPointerCapture(e.pointerId);}else if(pointers.size===2){const p=[...pointers.values()];gesture.moved=true;gesture.distance=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);gesture.scale=scale;}});
  view.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId)||!gesture)return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2&&gesture.distance){const p=[...pointers.values()];scale=gesture.scale*Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)/gesture.distance;updateZoom();return;}const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;if(Math.hypot(dx,dy)>9)gesture.moved=true;if(scale>1){panX=gesture.px+dx;panY=gesture.py+dy;updateZoom();}});
  const finish=e=>{pointers.delete(e.pointerId);if(!pointers.size){if(e.type==='pointerup'&&gesture&&!gesture.moved&&gesture.code)selectProvince(gesture.code);gesture=null;}else if(gesture)gesture.moved=true;};view.addEventListener('pointerup',finish);view.addEventListener('pointercancel',finish);
  setMode('quiz');renderMistakes();registerTools();
  const enterLandscape=()=>{if(landscapeOnly.matches&&!active&&!solved&&mode==='quiz'&&queue.length&&answered===0)startSession();};
  landscapeOnly.addEventListener('change',()=>{if(!document.body.classList.contains('app-ui'))enterLandscape();});
  if(!document.body.classList.contains('app-ui'))enterLandscape();
 }catch{feedback('Harita yüklenemedi. Bağlantını kontrol edip sayfayı yenile.','error');$('target').textContent='Harita açılamadı';$('instruction').textContent='Sayfayı yenileyerek tekrar dene.';renderMistakes();}
}
void init();
