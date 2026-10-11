(() => {
  'use strict';

  const DEFAULTS = [
    ['00:00','repeats'],['01:11','repeats'],['02:22','repeats'],['03:33','repeats'],['04:44','repeats'],['05:55','repeats'],
    ['10:10','repeats'],['11:11','repeats'],['12:12','repeats'],['13:13','repeats'],['14:14','repeats'],['15:15','repeats'],
    ['16:16','repeats'],['17:17','repeats'],['18:18','repeats'],['19:19','repeats'],['20:20','repeats'],['21:21','repeats'],
    ['22:22','repeats'],['23:23','repeats'],
    ['01:23','ascending'],['02:34','ascending'],['03:45','ascending'],['04:56','ascending'],['12:34','ascending'],['23:45','ascending'],
    ['03:21','descending'],['04:32','descending'],['05:43','descending'],['06:54','descending'],
    ['10:01','mirrors'],['12:21','mirrors'],['13:31','mirrors'],['14:41','mirrors'],['15:51','mirrors'],['20:02','mirrors'],['21:12','mirrors'],['23:32','mirrors']
  ];

  const PACKS = {
    repeats: ['Repeats','00:00 · 11:11 · 22:22'],
    ascending: ['Runs up','01:23 · 12:34 · 23:45'],
    descending: ['Runs down','03:21 · 04:32 · 06:54'],
    mirrors: ['Mirrors','10:01 · 12:21 · 23:32']
  };

  const PRESETS = {
    midnight:{label:'Obsidian',bg:'#090D12',surface:'#121821',text:'#F3F6FA',time:'#FFFFFF',muted:'#8993A1',current:'#4CDB7D',next:'#FFB547',accent:'#7CF2A3'},
    pocket:{label:'Pocket',bg:'#202A22',surface:'#2D392F',text:'#D9E1C8',time:'#E7F0D4',muted:'#829078',current:'#B8D94A',next:'#E5B94B',accent:'#A7C957'},
    neon:{label:'Neon',bg:'#071118',surface:'#0C1A24',text:'#E9FAFF',time:'#FFFFFF',muted:'#7593A2',current:'#39F2C3',next:'#64B8FF',accent:'#A675FF'},
    terminal:{label:'Terminal',bg:'#07120B',surface:'#0D1C12',text:'#E9FFF0',time:'#B8FFC9',muted:'#6F9E7C',current:'#65F28C',next:'#D4F75C',accent:'#65F28C'},
    amber:{label:'Amber',bg:'#120D08',surface:'#1C150D',text:'#FFF4E5',time:'#FFD08A',muted:'#A98E6D',current:'#7CF2A3',next:'#FFB547',accent:'#FFB547'},
    paper:{label:'Paper',bg:'#F3EEE4',surface:'#FFF9F0',text:'#29251F',time:'#332C24',muted:'#7F7569',current:'#287B55',next:'#B86525',accent:'#6759D6'},
    vapor:{label:'Vapor',bg:'#120B20',surface:'#1B1230',text:'#FFF2FF',time:'#F7D7FF',muted:'#A88FB8',current:'#63F5D2',next:'#FFB15C',accent:'#D574FF'},
    ocean:{label:'Ocean',bg:'#07131A',surface:'#0C1E28',text:'#EAF9FF',time:'#C9F1FF',muted:'#779BAA',current:'#5EE6A8',next:'#69B7FF',accent:'#69B7FF'}
  };

  const FONTS = {
    clean:{label:'Clean',display:'-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",sans-serif',body:'-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif',time:'-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",sans-serif',title:'.045em',tracking:'.01em'},
    neo:{label:'Neo',display:'"Avenir Next Condensed","Arial Narrow",-apple-system,sans-serif',body:'"Avenir Next",-apple-system,sans-serif',time:'"Avenir Next Condensed","Arial Narrow",-apple-system,sans-serif',title:'.12em',tracking:'.055em'},
    retro:{label:'Retro',display:'Menlo,Monaco,"Courier New",monospace',body:'Menlo,Monaco,"Courier New",monospace',time:'Menlo,Monaco,"Courier New",monospace',title:'.035em',tracking:'.015em'},
    classic:{label:'Classic',display:'Georgia,"Times New Roman",serif',body:'-apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif',time:'Georgia,"Times New Roman",serif',title:'.02em',tracking:'.01em'}
  };

  const defaultSettings = {
    phrase:'Catch the time!', emoji:true, compact:false, mode:'mixed', font:'clean', themePreset:'midnight',
    repeats:true, ascending:true, descending:true, mirrors:true, custom:[], colors:{}, liveAlerts:false
  };

  let settings = loadSettings();
  let activeTab = 'now';
  let alertMinuteKey = '';
  let tickTimer = null;

  const main = document.getElementById('mainContent');
  const toast = document.getElementById('toast');

  function loadSettings() {
    try { return {...defaultSettings, ...JSON.parse(localStorage.getItem('ctt-web-settings') || '{}')}; }
    catch { return {...defaultSettings}; }
  }
  function saveSettings() { localStorage.setItem('ctt-web-settings', JSON.stringify(settings)); }
  function minuteNow() { const d=new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; }
  function pad(n){return String(n).padStart(2,'0');}
  function mins(s){const [h,m]=s.split(':').map(Number);return h*60+m;}
  function activeTimes(){
    const set=new Set();
    if(settings.mode!=='custom') DEFAULTS.forEach(([t,p])=>{ if(settings[p]!==false) set.add(t); });
    if(settings.mode!=='defaults') (settings.custom||[]).forEach(t=>/^([01]\d|2[0-3]):[0-5]\d$/.test(t)&&set.add(t));
    return [...set].sort((a,b)=>mins(a)-mins(b));
  }
  function isCustom(t){return (settings.custom||[]).includes(t);}
  function currentCatch(){ const n=minuteNow(); return activeTimes().includes(n) ? n : null; }
  function nextCatch(){
    const list=activeTimes(); if(!list.length) return null;
    const now=new Date(), n=now.getHours()*60+now.getMinutes();
    const future=list.find(t=>mins(t)>n);
    return {time:future||list[0], tomorrow:!future};
  }
  function remainingToday(){ const n=mins(minuteNow()); return activeTimes().filter(t=>mins(t)>=n).length; }
  function emojiFor(hour){
    const pools = hour<6?['🌙','✨','🦉']:hour<11?['☀️','🌤️','✨']:hour<17?['☀️','⏰','✨']:hour<21?['🌆','✨','🕰️']:['🌙','✨','🕰️'];
    return pools[(hour + new Date().getDate()) % pools.length];
  }
  function shareText(t){ const hour=Number(t.slice(0,2)); return `${settings.phrase || 'Catch the time!'} ${t}${settings.emoji ? ` ${emojiFor(hour)}` : ''}`; }
  function countdownTo(t,tomorrow=false){
    const now=new Date(); const [h,m]=t.split(':').map(Number); const target=new Date(now); target.setHours(h,m,0,0); if(tomorrow||target<=now) target.setDate(target.getDate()+1);
    const ms=target-now, total=Math.max(0,Math.ceil(ms/60000)); const hh=Math.floor(total/60), mm=total%60;
    return hh ? `${hh}h ${mm}m away` : `${mm}m away`;
  }
  function showToast(msg){ toast.textContent=msg;toast.classList.add('show');clearTimeout(showToast.t);showToast.t=setTimeout(()=>toast.classList.remove('show'),1500); }
  async function copyText(text){ try{await navigator.clipboard.writeText(text);showToast('Copied ✓');}catch{showToast('Copy unavailable');} }
  async function shareTextNative(text){
    if(navigator.share){ try{await navigator.share({text});}catch(e){ if(e.name!=='AbortError') copyText(text); } }
    else copyText(text);
  }

  function applyTheme(){
    let p=settings.themePreset==='custom' ? {...PRESETS.midnight,...settings.colors} : (PRESETS[settings.themePreset]||PRESETS.midnight);
    const r=document.documentElement.style;
    for(const k of ['bg','surface','text','time','muted','current','next','accent']) r.setProperty(`--${k}`,p[k]);
    const f=FONTS[settings.font]||FONTS.clean;
    r.setProperty('--font-display',f.display);r.setProperty('--font-body',f.body);r.setProperty('--font-time',f.time);r.setProperty('--tracking-title',f.title);r.setProperty('--tracking-time',f.tracking);
    document.querySelector('meta[name="theme-color"]').setAttribute('content',p.bg);
    const dark = parseInt(p.bg.slice(1,3),16)*.2126 + parseInt(p.bg.slice(3,5),16)*.7152 + parseInt(p.bg.slice(5,7),16)*.0722 < 145;
    document.documentElement.style.colorScheme=dark?'dark':'light';
  }

  function render(tab=activeTab){
    activeTab=tab; document.querySelectorAll('.nav-button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
    const tpl=document.getElementById(`${tab}Template`); main.replaceChildren(tpl.content.cloneNode(true));
    if(tab==='now') renderNow(); if(tab==='times') renderTimes(); if(tab==='style') renderStyle(); if(tab==='setup') renderSetup();
    window.scrollTo({top:0,behavior:'auto'});
  }

  function renderNow(){
    const cur=currentCatch(), nxt=nextCatch(), list=activeTimes();
    const label=document.getElementById('heroLabel'), time=document.getElementById('heroTime'), phrase=document.getElementById('heroPhrase'), meta=document.getElementById('heroMeta');
    phrase.textContent=settings.phrase;
    if(cur){ label.textContent='CATCH IT NOW'; label.style.color='var(--current)'; time.textContent=cur; meta.textContent='This minute is live'; }
    else if(nxt){ label.textContent=nxt.tomorrow?'NEXT · TOMORROW':'NEXT CATCH'; time.textContent=nxt.time; meta.textContent=countdownTo(nxt.time,nxt.tomorrow); }
    else { label.textContent='NO ACTIVE TIMES'; time.textContent='--:--'; meta.textContent='Add a time in Times'; }
    const target=cur || nxt?.time;
    document.getElementById('copyCatch').disabled=!target; document.getElementById('shareCatch').disabled=!target;
    document.getElementById('copyCatch').onclick=()=>target&&copyText(shareText(target));
    document.getElementById('shareCatch').onclick=()=>target&&shareTextNative(shareText(target));
    document.getElementById('remainingCount').textContent=remainingToday(); document.getElementById('activeCount').textContent=list.length;
    const upcoming=document.getElementById('upcomingList'); upcoming.innerHTML='';
    const n=mins(minuteNow()); let rows=list.filter(t=>mins(t)>=n); if(!rows.length) rows=list.slice(0,5).map(t=>t);
    rows.slice(0,8).forEach(t=>upcoming.appendChild(timeRow(t,cur,nxt)));
    if(settings.compact) document.getElementById('upcomingCard').hidden=true;
    const toggle=document.getElementById('liveAlertsToggle'); toggle.checked=!!settings.liveAlerts;
    document.getElementById('alertStatus').textContent=settings.liveAlerts?'On · while this web app stays open':'Off · only works while this web app is open';
    toggle.onchange=async()=>{
      if(toggle.checked){
        if(!('Notification'in window)){toggle.checked=false;showToast('Notifications unavailable');return;}
        let perm; try { perm=await Notification.requestPermission(); } catch { toggle.checked=false;showToast('Add to Home Screen first for iPhone alerts');return; }
        if(perm!=='granted'){toggle.checked=false;showToast('Notification permission not granted');return;}
      }
      settings.liveAlerts=toggle.checked;saveSettings();renderNow();
    };
    document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>render(b.dataset.go));
  }

  function timeRow(t,cur,nxt){
    const row=document.createElement('div');row.className='time-row';
    const n=mins(minuteNow()); let state='TODAY';
    if(cur===t){row.classList.add('current');state='NOW';}
    else if(nxt?.time===t){row.classList.add('next');state=nxt.tomorrow?'NEXT · TOMORROW':'NEXT';}
    else if(mins(t)<n){row.classList.add('passed');state='PASSED';}
    row.innerHTML=`<span class="time-value">${t}</span><span class="time-state">${state}</span><span class="time-origin">${isCustom(t)?'CUSTOM':''}</span>`;
    return row;
  }

  function renderTimes(){
    const modes=[['defaults','Defaults'],['mixed','Mixed'],['custom','Custom']]; const mc=document.getElementById('modeChoices');
    modes.forEach(([id,label])=>{const b=document.createElement('button');b.className='choice-button'+(settings.mode===id?' selected':'');b.textContent=label;b.onclick=()=>{settings.mode=id;saveSettings();renderTimes();};mc.appendChild(b);});
    const pc=document.getElementById('packToggles');
    Object.entries(PACKS).forEach(([id,[name,sub]])=>{const row=document.createElement('div');row.className='setting-row';row.innerHTML=`<div><div class="setting-title">${name}</div><div class="setting-subtitle">${sub}</div></div><label class="switch"><input type="checkbox" ${settings[id]!==false?'checked':''}><span class="slider"></span></label>`;const cb=row.querySelector('input');cb.onchange=()=>{settings[id]=cb.checked;saveSettings();renderTimes();};pc.appendChild(row);});
    const inp=document.getElementById('customTimeInput');document.getElementById('addCustomTime').onclick=()=>{
      const t=inp.value;if(!t)return;settings.custom=[...new Set([...(settings.custom||[]),t])].sort((a,b)=>mins(a)-mins(b));saveSettings();renderTimes();showToast(`${t} added`);
    };
    const chips=document.getElementById('customTimesList');
    if(!(settings.custom||[]).length){const p=document.createElement('p');p.className='body-copy';p.textContent='No custom times yet.';chips.appendChild(p);}
    (settings.custom||[]).sort((a,b)=>mins(a)-mins(b)).forEach(t=>{const c=document.createElement('span');c.className='chip';c.innerHTML=`${t}<button aria-label="Remove ${t}">×</button>`;c.querySelector('button').onclick=()=>{settings.custom=settings.custom.filter(x=>x!==t);saveSettings();renderTimes();};chips.appendChild(c);});
    const list=activeTimes(), tl=document.getElementById('timelineList'), cur=currentCatch(), nxt=nextCatch(); document.getElementById('timelineCount').textContent=`${list.length} active`;
    list.forEach(t=>tl.appendChild(timeRow(t,cur,nxt)));
    if(!list.length){const p=document.createElement('p');p.className='body-copy';p.textContent='No active times.';tl.appendChild(p);}
  }

  function renderStyle(){
    document.getElementById('previewPhrase').textContent=settings.phrase;
    const fg=document.getElementById('fontChoices');
    Object.entries(FONTS).forEach(([id,f])=>{const b=document.createElement('button');b.className='font-option'+(settings.font===id?' selected':'');b.innerHTML=`<span class="font-sample" style="font-family:${f.time}">12:34</span><span class="option-label">${f.label}</span>`;b.onclick=()=>{settings.font=id;saveSettings();applyTheme();renderStyle();};fg.appendChild(b);});
    const pg=document.getElementById('paletteChoices');
    Object.entries(PRESETS).forEach(([id,p])=>{const b=document.createElement('button');b.className='palette-option'+(settings.themePreset===id?' selected':'');b.innerHTML=`<span class="palette-swatches"><i class="swatch" style="background:${p.bg}"></i><i class="swatch" style="background:${p.surface}"></i><i class="swatch" style="background:${p.current}"></i><i class="swatch" style="background:${p.next}"></i></span><span class="option-label">${p.label}</span>`;b.onclick=()=>{settings.themePreset=id;saveSettings();applyTheme();renderStyle();};pg.appendChild(b);});
    const base=settings.themePreset==='custom'?{...PRESETS.midnight,...settings.colors}:(PRESETS[settings.themePreset]||PRESETS.midnight);
    const labels={bg:'Background',surface:'Cards',text:'Primary text',time:'Time',muted:'Muted text',current:'Current',next:'Next',accent:'Accent'};
    const cg=document.getElementById('customColourFields'); const controls={};
    Object.keys(labels).forEach(k=>{const r=document.createElement('label');r.className='colour-row';r.innerHTML=`<span>${labels[k]}</span><input type="color" value="${base[k]}">`;controls[k]=r.querySelector('input');cg.appendChild(r);});
    document.getElementById('saveCustomPalette').onclick=()=>{settings.colors={};Object.entries(controls).forEach(([k,i])=>settings.colors[k]=i.value.toUpperCase());settings.themePreset='custom';saveSettings();applyTheme();renderStyle();showToast('Custom palette applied');};
  }

  function renderSetup(){
    const standalone=window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone===true;
    document.getElementById('installStatus').textContent=standalone?'Installed · standalone mode':'Browser mode';
    if(standalone) document.getElementById('installInstructions').textContent='Already running from the Home Screen. Nice.';
    const phrase=document.getElementById('phraseInput');phrase.value=settings.phrase;phrase.onchange=()=>{settings.phrase=phrase.value.trim()||'Catch the time!';saveSettings();showToast('Phrase saved');};
    const e=document.getElementById('emojiToggle');e.checked=settings.emoji;e.onchange=()=>{settings.emoji=e.checked;saveSettings();};
    const c=document.getElementById('compactToggle');c.checked=settings.compact;c.onchange=()=>{settings.compact=c.checked;saveSettings();};
    const area=document.getElementById('setupCode');
    document.getElementById('exportSetup').onclick=async()=>{const code=exportCode();area.value=code;await copyText(code);};
    document.getElementById('importSetup').onclick=()=>{try{importCode(area.value);saveSettings();applyTheme();renderSetup();showToast('Setup imported ✓');}catch(err){showToast('That setup code did not parse');}};
  }

  function exportCode(){
    const p=settings.themePreset==='custom'?settings.colors:{};
    const payload={v:3,phrase:settings.phrase,emoji:settings.emoji,compact:settings.compact,mode:settings.mode,style:'normal',font:settings.font,repeats:settings.repeats,ascending:settings.ascending,descending:settings.descending,mirrors:settings.mirrors,themePreset:settings.themePreset,colors:{},custom:settings.custom||[]};
    const map={bg:'theme_bg',surface:'theme_surface',text:'theme_text',time:'theme_time',muted:'theme_muted',current:'theme_current',next:'theme_next',accent:'theme_accent'};Object.entries(p).forEach(([k,v])=>payload.colors[map[k]]=v);
    return 'CTT3:'+btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  }
  function importCode(raw){
    raw=(raw||'').trim().replace(/^CTT[23]:/,''); if(!raw) throw new Error('empty');
    const j=JSON.parse(decodeURIComponent(escape(atob(raw))));
    settings.phrase=j.phrase||'Catch the time!';settings.emoji=j.emoji!==false;settings.compact=!!j.compact;settings.mode=['defaults','mixed','custom'].includes(j.mode)?j.mode:'mixed';settings.font=FONTS[j.font]?j.font:'clean';
    settings.repeats=j.repeats!==false;settings.ascending=j.ascending!==false;settings.descending=j.descending!==false;settings.mirrors=j.mirrors!==false;settings.custom=Array.isArray(j.custom)?j.custom.filter(t=>/^([01]\d|2[0-3]):[0-5]\d$/.test(t)):[];
    const incomingPreset=j.themePreset==='cream'?'paper':j.themePreset;settings.themePreset=(PRESETS[incomingPreset]||incomingPreset==='custom')?incomingPreset:'midnight';
    if(j.colors){const map={theme_bg:'bg',theme_surface:'surface',theme_text:'text',theme_time:'time',theme_muted:'muted',theme_current:'current',theme_next:'next',theme_accent:'accent'};settings.colors={};Object.entries(j.colors).forEach(([k,v])=>{if(map[k])settings.colors[map[k]]=v;});}
  }

  async function maybeFireLiveAlert(){
    if(!settings.liveAlerts || Notification.permission!=='granted' || !currentCatch()) return;
    const d=new Date(), key=`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${minuteNow()}`; if(alertMinuteKey===key) return; alertMinuteKey=key;
    try { const reg=await navigator.serviceWorker.ready; await reg.showNotification(settings.phrase,{body:shareText(currentCatch()).replace(`${settings.phrase} `,''),icon:'icons/icon-192.png',badge:'icons/badge-96.png',tag:'catch-'+key}); } catch {}
  }
  function tick(){ if(activeTab==='now'||activeTab==='times') render(activeTab); maybeFireLiveAlert(); }

  document.querySelectorAll('.nav-button').forEach(b=>b.addEventListener('click',()=>render(b.dataset.tab)));
  document.getElementById('shareAppButton').onclick=()=>shareTextNative(location.href);
  applyTheme(); render('now');
  tickTimer=setInterval(tick,30000);

  if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
})();
