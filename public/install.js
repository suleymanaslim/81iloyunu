'use strict';
(() => {
 const button=document.getElementById('install');
 const dialog=document.getElementById('install-dialog');
 const display=window.matchMedia('(display-mode: standalone)');
 const isiOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 const isAndroid=/Android/i.test(navigator.userAgent);
 let deferredPrompt=null;
 const standalone=()=>display.matches||navigator.standalone===true;
 const updateButton=()=>{button.hidden=standalone()||(!isiOS&&!isAndroid&&!deferredPrompt);};
 function showGuide(message){
  const intro=document.getElementById('install-intro');
  const list=document.getElementById('install-steps');list.replaceChildren();
  intro.textContent=message||(isiOS?'iPhone veya iPad’de Safari üzerinden ekleyebilirsin.':'Tarayıcının menüsünden ana ekranına ekleyebilirsin.');
  const steps=isiOS?['Oyunu Safari’de aç.','Paylaş düğmesine dokun. Bazı Safari düzenlerinde önce sayfa menüsünü açman gerekebilir.','Ana Ekrana Ekle’yi seç. Görünmüyorsa paylaş listesindeki Eylemleri Düzenle bölümüne bak.','Varsa Web Uygulaması Olarak Aç seçeneğini aç ve Ekle’ye dokun.']:isAndroid?['Oyunu Chrome gibi destekleyen bir tarayıcıda aç.','Tarayıcının ⋮ menüsüne dokun.','Ana ekrana ekle veya Uygulamayı yükle seçeneğini seçip onayla.']:['Tarayıcı menüsünde Uygulamayı yükle seçeneğini kontrol et.','Seçenek yoksa bu tarayıcı yüklemeyi desteklemiyor olabilir. Oyunu bağlantıdan kullanmaya devam edebilirsin.'];
  for(const text of steps){const li=document.createElement('li');li.textContent=text;list.append(li);}
  if(typeof dialog.showModal==='function')dialog.showModal();else{dialog.setAttribute('open','');document.getElementById('install-close').focus();}
 }
 window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredPrompt=event;updateButton();});
 window.addEventListener('appinstalled',()=>{deferredPrompt=null;button.hidden=true;if(dialog.open&&dialog.close)dialog.close();});
 if(display.addEventListener)display.addEventListener('change',updateButton);
 button.addEventListener('click',async()=>{
  if(standalone()){updateButton();return;}
  if(!deferredPrompt){showGuide();return;}
  const prompt=deferredPrompt;deferredPrompt=null;
  try{
   // Call within the user's click; browsers require this user gesture.
   const result=await prompt.prompt();
   const choice=result||await prompt.userChoice;
   if(choice?.outcome==='accepted')button.hidden=true;else updateButton();
  }catch{updateButton();showGuide('Yükleme penceresi açılamadı. Tarayıcı menüsünden eklemeyi deneyebilirsin.');}
 });
 document.getElementById('install-close').addEventListener('click',event=>{if(typeof dialog.close!=='function'){event.preventDefault();dialog.removeAttribute('open');button.focus();}});
 updateButton();
 if('serviceWorker' in navigator&&window.isSecureContext){
  window.addEventListener('load',()=>{void navigator.serviceWorker.register('sw.js',{scope:'./',updateViaCache:'none'}).catch(()=>{});});
 }
})();
