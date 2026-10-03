'use strict';
(() => {
 const mobile=window.matchMedia('(max-width:900px) and (pointer:coarse), (max-width:600px)');
 const preview=new URLSearchParams(location.search).get('app')==='1';
 const home=document.getElementById('app-home');
 const nav=document.getElementById('app-nav');
 let screen='home';
 const enabled=()=>mobile.matches||preview;
 const render=()=>{
  document.body.classList.toggle('app-ui',enabled());
  document.body.dataset.appScreen=screen;
  home.hidden=!enabled()||screen!=='home';nav.hidden=!enabled()||screen==='home';
  const count=document.getElementById('pending-count').textContent;
  document.getElementById('app-review-count').textContent=count;
  nav.querySelectorAll('[data-app-mode]').forEach(b=>b.setAttribute('aria-pressed',String(screen==='review'?b.dataset.appMode==='review':screen==='game'&&b.dataset.appMode===mode)));
  document.getElementById('app-home-sound').textContent=soundOn?'Ses açık':'Ses kapalı';
 };
 const show=(next,push=true)=>{screen=next;render();if(enabled()&&push)history.pushState({appScreen:next},'');};
 window.syncAppScreen=()=>{if(enabled())show('game',false);};
 const choose=selected=>{
  if(!cities.length)return;
  if(selected==='review'){setMode('review');show('review');}
  else if(selected==='learn'){setMode('learn');show('game');}
  else{startSession('quiz');show('game');}
 };
 document.querySelectorAll('[data-app-mode]').forEach(button=>button.addEventListener('click',()=>choose(button.dataset.appMode)));
 document.querySelectorAll('[data-app-home]').forEach(button=>button.addEventListener('click',()=>{cancelAdvance();active=false;show('home');}));
 document.getElementById('app-home-sound').addEventListener('click',()=>{document.getElementById('sound').click();render();});
 document.getElementById('app-home-install').addEventListener('click',()=>document.getElementById('install').click());
 new MutationObserver(()=>{document.getElementById('app-review-count').textContent=document.getElementById('pending-count').textContent;}).observe(document.getElementById('pending-count'),{childList:true});
 new MutationObserver(()=>{
  const ready=!document.getElementById('start').disabled||cities.length===81;
  document.querySelectorAll('#app-home [data-app-mode]').forEach(b=>{if(b.disabled===ready)b.disabled=!ready;});
  const button=document.getElementById('install');const install=document.getElementById('app-home-install');if(install.hidden!==button.hidden)install.hidden=button.hidden;
 }).observe(document.body,{subtree:true,attributes:true,attributeFilter:['disabled','hidden']});
 mobile.addEventListener('change',render);
 window.addEventListener('popstate',event=>{cancelAdvance();active=false;show(event.state?.appScreen==='review'?'review':'home',false);});
 if(enabled())history.replaceState({appScreen:'home'},'');
 render();
 document.querySelectorAll('#app-home [data-app-mode]').forEach(b=>{b.disabled=cities.length!==81;});
 document.getElementById('app-home-install').hidden=document.getElementById('install').hidden;
})();
