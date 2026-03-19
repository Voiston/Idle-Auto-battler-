// ══ BOSS SYSTEM ═══════════════════════════════════════════════════════
const BOSS_DEFS=[
  {name:'Gardien Corrompu',  icon:'👹',color:'#c62828',hp:600, dmg:25,spd:.6, xp:200,gold:80, draw:(cx,x,y,e)=>drawBrute(cx,x,y,e)},
  {name:'Archonte des Glaces',icon:'❄️',color:'#1565c0',hp:900, dmg:20,spd:.8, xp:300,gold:120,draw:(cx,x,y,e)=>drawWraith(cx,x,y,e)},
  {name:'Titan Infernal',    icon:'🌋',color:'#bf360c',hp:1500,dmg:35,spd:.5, xp:500,gold:200,draw:(cx,x,y,e)=>drawBrute(cx,x,y,e)},
  {name:'Hydre Venimeuse',   icon:'🐉',color:'#1b5e20',hp:2200,dmg:30,spd:.7, xp:800,gold:350,draw:(cx,x,y,e)=>drawBrute(cx,x,y,e)},
  {name:'Seigneur du Néant', icon:'💀',color:'#4a148c',hp:3500,dmg:50,spd:.55,xp:1500,gold:600,draw:(cx,x,y,e)=>drawWraith(cx,x,y,e)},
];

function isBossWave(wave){return wave>0&&wave%5===0;}

function spawnBoss(wave){
  const bossIdx=Math.floor(wave/5)-1;
  const def=BOSS_DEFS[Math.min(bossIdx,BOSS_DEFS.length-1)];
  const sc=1+wave*.08;
  const boss={
    id:'boss_'+Date.now(),type:'boss',isBoss:true,
    col:state.golem.col+rnd(-2,2),row:state.golem.row-16,
    hp:Math.floor(def.hp*sc),maxHp:Math.floor(def.hp*sc),
    dmg:Math.floor(def.dmg*sc),spd:def.spd,range:1.8,
    xp:Math.floor(def.xp*sc),gold:Math.floor(def.gold*sc),threat:5,
    name:def.name,color:def.color,
    atkTimer:2,hitFlash:0,animTimer:0,animFrame:0,
    draw:(cx,x,y,e)=>drawBoss(cx,x,y,e),facing:1,slow:0,
    inRage:false,rageTriggered:false,
    bossIcon:def.icon,
  };
  state.enemies.push(boss);
  state.waveActive=true;
  showWaveNotif(`⚠ BOSS!`);
  addLog(`💥 ${def.name} est apparu! Vague ${wave}`,'log-warn');
  document.getElementById('boss-bar').style.display='block';
  updateBossBar(boss);
}

function updateBossBar(boss){
  if(!boss||!boss.isBoss){document.getElementById('boss-bar').style.display='none';return;}
  const pct=Math.max(0,boss.hp/boss.maxHp*100);
  document.getElementById('boss-name').textContent=boss.bossIcon+' '+boss.name;
  document.getElementById('boss-hp-fill').style.width=pct+'%';
  document.getElementById('boss-hp-txt').textContent=Math.ceil(boss.hp)+' / '+boss.maxHp+' HP';
  const bar=document.getElementById('boss-bar');
  if(boss.inRage)bar.classList.add('rage');else bar.classList.remove('rage');
}

function drawBoss(cx,x,y,e){
  const bob=Math.sin(e.animFrame*Math.PI*.4)*2;cx.save();cx.translate(x,y+bob);
  if(e.hitFlash>0){cx.globalAlpha=.5+e.hitFlash*.5;cx.globalCompositeOperation='lighter';}
  // Shadow bigger
  cx.save();cx.globalAlpha=.35;cx.fillStyle='#000';cx.beginPath();cx.ellipse(0,8,24,9,0,0,Math.PI*2);cx.fill();cx.restore();
  // RAGE aura
  if(e.inRage){
    cx.globalAlpha=.25+Math.sin(vfxTime*6)*.15;
    cx.fillStyle='#ff6f00';cx.beginPath();cx.ellipse(0,-10,28,28,0,0,Math.PI*2);cx.fill();
    cx.globalAlpha=cx.hitFlash>0?.5:1;
  }
  // Body — big version of brute
  const bc=e.color||'#7d3c98';
  cx.fillStyle=bc;cx.fillRect(-16,-30,32,30);
  cx.fillStyle='rgba(0,0,0,.25)';cx.fillRect(-14,-28,14,14);
  // Eyes — glowing
  cx.fillStyle=e.inRage?'#ffab00':'#ef5350';
  cx.globalAlpha=.9+Math.sin(vfxTime*5)*.1;
  cx.fillRect(-10,-22,6,6);cx.fillRect(4,-22,6,6);cx.globalAlpha=1;
  // Arms
  cx.fillStyle=bc;
  cx.fillRect(-22,-24+Math.sin(e.animFrame*Math.PI*.5)*3,8,20);
  cx.fillRect(14,-24-Math.sin(e.animFrame*Math.PI*.5)*3,8,20);
  // Legs
  const ls=e.animFrame%2===0?2:0;
  cx.fillRect(-12,-1+ls,9,10);cx.fillRect(3,-1+(2-ls),9,10);
  cx.restore();
  // Boss HP bar — bigger
  const h=5,f=Math.max(0,e.hp/e.maxHp),col=e.inRage?'#ffab00':'#f44336';
  cx.fillStyle='rgba(0,0,0,.7)';cx.fillRect(x-22,y-42-h-1,44,h);
  cx.fillStyle=col;cx.fillRect(x-22,y-42-h-1,44*f,h);
  cx.strokeStyle='rgba(255,0,0,.3)';cx.lineWidth=.5;cx.strokeRect(x-22,y-42-h-1,44,h);
  // Name tag
  cx.fillStyle='rgba(0,0,0,.7)';cx.fillRect(x-25,y-56,50,12);
  cx.fillStyle='#ef5350';cx.font='bold 8px Share Tech Mono';cx.textAlign='center';
  cx.fillText(e.name.substring(0,12),x,y-47);
}

