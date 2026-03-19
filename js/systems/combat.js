// ══ DOT SYSTEM ════════════════════════════════════════════════════════
// dot: {type:'poison'|'burn'|'bleed', dmg, dur, tickRate, elapsed}
// Applied to enemies (and potentially golem) via spells or mob attacks
const DOT_COLORS={poison:'#76ff03',burn:'#ff6d00',bleed:'#f44336'};

function applyDot(target,type,dmg,dur,tickRate=1){
  if(!target.dots)target.dots=[];
  // Refresh if same type already active
  const existing=target.dots.find(d=>d.type===type);
  if(existing){existing.dur=Math.max(existing.dur,dur);existing.dmg=Math.max(existing.dmg,dmg);return;}
  target.dots.push({type,dmg,dur,tickRate,elapsed:0});
}

function updateDots(target,dt,isGolem=false){
  if(isGolem&&state.golem._wraithFormActive)return; // intangible — no DoT
  if(isGolem&&state.golem._archonActive){target.dots=[];return;} // archon clears DoT
  if(!target.dots||target.dots.length===0)return;
  for(let i=target.dots.length-1;i>=0;i--){
    const dot=target.dots[i];
    dot.elapsed+=dt;dot.dur-=dt;
    if(dot.elapsed>=dot.tickRate){
      dot.elapsed=0;
      let dmg=dot.dmg;
      if(dot.type==='poison')dmg=Math.floor(dmg*(1+Math.random()*.3));
      if(dot.type==='burn') {dmg=Math.floor(dmg*(1+Math.random()*.5));if(isGolem)dmg=Math.floor(dmg*(1-(target.resFire||0)/100));}
      if(dot.type==='bleed') dmg=Math.floor(dmg*(1+Math.random()*.2));
      if(dot.type==='void')  {dmg=Math.floor(dmg*(1+Math.random()*.4));if(isGolem)dmg=Math.floor(dmg*(1-(target.resVoid||0)/100));}
      target.hp-=dmg;
      const pos=isGolem?ISO.toScreen(target.col,target.row):ISO.toScreen(target.col,target.row);
      const col=DOT_COLORS[dot.type]||'#fff';
      spawnFloat(pos.x+rnd(-8,8),pos.y-15,`${dot.type==='poison'?'☠':dot.type==='burn'?'🔥':'🩸'}${dmg}`,col);
      if(target.hp<=0&&!isGolem){killEnemy(target);}
      else if(target.hp<=0&&isGolem){target.hp=0;handleDeath();}
    }
    if(dot.dur<=0)target.dots.splice(i,1);
  }
}



// ══ ELITE SYSTEM ══════════════════════════════════════════════════════
const ELITE_AFFIXES=[
  {id:'berserker', name:'Berserker',  color:'#ff1744', auraColor:'rgba(255,23,68,.25)',
   apply:(e)=>{e.dmg=Math.floor(e.dmg*1.5);e.spd*=1.25;},
   desc:'Frénétique: +50% DMG, +25% vitesse'},
  {id:'armored',   name:'Blindé',     color:'#78909c', auraColor:'rgba(120,144,156,.25)',
   apply:(e)=>{e.hp=e.maxHp=Math.floor(e.hp*3);e.dmg=Math.floor(e.dmg*.7);},
   desc:'Armure renforcée: ×3 HP, -30% DMG'},
  {id:'vampiric',  name:'Vampirique', color:'#ad1457', auraColor:'rgba(173,20,87,.25)',
   apply:(e)=>{e.lifeSteal=.3;e.dmg=Math.floor(e.dmg*1.2);},
   desc:'Siphon: 30% lifesteal, +20% DMG'},
  {id:'spectral',  name:'Spectral',   color:'#7c4dff', auraColor:'rgba(124,77,255,.25)',
   apply:(e)=>{e.spd*=1.5;e.evasion=.2;},
   desc:'Fantôme: +50% vitesse, 20% esquive'},
  {id:'venomous',  name:'Venimeux',   color:'#64dd17', auraColor:'rgba(100,221,23,.25)',
   apply:(e)=>{e.poisonOnHit={type:'poison',dmg:8,dur:6};},
   desc:'Poison: applique poison sur chaque coup'},
  {id:'fiery',     name:'Embrasé',    color:'#ff6d00', auraColor:'rgba(255,109,0,.25)',
   apply:(e)=>{e.dotOnHit={type:'burn',dmg:10,dur:5};e.dmg=Math.floor(e.dmg*1.3);},
   desc:'Brasier: +30% DMG, brûlure sur coup'},
  {id:'frozen',    name:'Glacial',    color:'#00b0ff', auraColor:'rgba(0,176,255,.25)',
   apply:(e)=>{e.slowOnHit=.5;e.hp=e.maxHp=Math.floor(e.hp*1.5);},
   desc:'Glacé: ralentit le Golem -50%, +50% HP'},
  {id:'warlord',   name:'Seigneur',   color:'#ffd600', auraColor:'rgba(255,214,0,.25)',
   apply:(e)=>{e.hp=e.maxHp=Math.floor(e.hp*2);e.dmg=Math.floor(e.dmg*1.4);e.xp=Math.floor(e.xp*2);e.gold=Math.floor(e.gold*2);},
   desc:'Commandant: ×2 HP, ×2 XP/Gold, +40% DMG'},
];

// Elite spawn chance per wave (caps at 35%)
function eliteChance(wave){return Math.min(.35, .05 + wave*.015);}

// Convert a normal enemy into an elite
function makeElite(enemy){
  const affix=ELITE_AFFIXES[Math.floor(Math.random()*ELITE_AFFIXES.length)];
  enemy.isElite=true;
  enemy.eliteAffix=affix;
  enemy.eliteColor=affix.color;
  enemy.eliteAura=affix.auraColor;
  // Base elite stat boost (on top of affix)
  enemy.hp=enemy.maxHp=Math.floor(enemy.hp*2.5);
  enemy.xp=Math.floor(enemy.xp*2);
  enemy.gold=Math.floor(enemy.gold*2.5);
  // Apply specific affix
  affix.apply(enemy);
  enemy.name=`[${affix.name}] ${enemy.name}`;
  return enemy;
}

// Draw elite aura (called in drawGrid pass, before sprites)
function drawEliteAura(e){
  if(!e.isElite)return;
  const p=ISO.toScreen(e.col,e.row);
  const t=vfxTime;
  // Pulsing ground aura
  ctx.save();
  ctx.globalAlpha=.35+Math.sin(t*3)*.15;
  ctx.fillStyle=e.eliteAura||'rgba(255,0,0,.2)';
  ctx.beginPath();ctx.ellipse(p.x,p.y,32,14,0,0,Math.PI*2);ctx.fill();
  // Spinning ring
  ctx.globalAlpha=.6+Math.sin(t*4)*.2;
  ctx.strokeStyle=e.eliteColor||'#ff1744';
  ctx.lineWidth=2;
  ctx.beginPath();
  for(let i=0;i<8;i++){
    const a=i/8*Math.PI*2+t*1.5;
    const rx=28,ry=12;
    const x2=p.x+Math.cos(a)*rx;const y2=p.y+Math.sin(a)*ry;
    i===0?ctx.moveTo(x2,y2):ctx.lineTo(x2,y2);
  }
  ctx.closePath();ctx.stroke();
  ctx.restore();
}



// ══ HELPERS ═══════════════════════════════════════════════════════════
function dist(a,b){return Math.sqrt((a.col-b.col)**2+(a.row-b.row)**2);}
function rnd(a,b){return a+Math.random()*(b-a);}
// ── Particle Pool (pre-allocated, no GC pressure) ────────────────────
const PARTICLE_POOL_SIZE = 512;
const _partPool = Array.from({length:PARTICLE_POOL_SIZE},()=>({x:0,y:0,vx:0,vy:0,life:0,maxLife:1,color:'#fff',size:2,active:false}));
let _partHead = 0; // ring-buffer head

function _allocPart(){
  // Find next inactive slot (ring buffer)
  for(let i=0;i<PARTICLE_POOL_SIZE;i++){
    const idx=(_partHead+i)%PARTICLE_POOL_SIZE;
    if(!_partPool[idx].active){_partHead=(idx+1)%PARTICLE_POOL_SIZE;return _partPool[idx];}
  }
  // Pool full — reuse head (oldest particle)
  const p=_partPool[_partHead];_partHead=(_partHead+1)%PARTICLE_POOL_SIZE;return p;
}

function spawnPart(x,y,n,color,spd=2,life=.6){
  for(let i=0;i<n;i++){
    const p=_allocPart();
    const a=Math.random()*Math.PI*2,s=rnd(.5,spd);
    p.x=x;p.y=y;p.vx=Math.cos(a)*s;p.vy=Math.sin(a)*s;
    p.life=life;p.maxLife=life;p.color=color;p.size=rnd(1,4);p.active=true;
  }
}


// ── DPS Meter ─────────────────────────────────────────────────────────
function trackDmg(dmg, source){
  if(!dmg||dmg<=0) return;
  const now = performance.now()/1000;
  const d = state.dps;
  d._samples.push({t:now, dmg, source});
  // Keep only last 5s
  d._samples = d._samples.filter(s=>now-s.t<=d._window);
  // Recalc totals
  d.total = 0;
  d._bySource = {};
  for(const s of d._samples){
    d.total += s.dmg;
    d._bySource[s.source] = (d._bySource[s.source]||0) + s.dmg;
  }
  // Convert to DPS (damage per second)
  d.totalDps  = Math.floor(d.total  / d._window);
  for(const k of Object.keys(d._bySource)){
    d._bySource[k] = Math.floor(d._bySource[k] / d._window);
  }
}

function updateParticles(dt){
  for(let i=0;i<PARTICLE_POOL_SIZE;i++){
    const p=_partPool[i];if(!p.active)continue;
    p.x+=p.vx;p.y+=p.vy;p.vy+=.05;p.life-=dt;
    if(p.life<=0)p.active=false;
  }
}
function spawnFloat(x,y,text,color){const el=document.createElement('div');el.className='float-number';el.style.cssText=`left:${x}px;top:${y}px;color:${color};`;el.textContent=text;cZone.appendChild(el);setTimeout(()=>el.remove(),1150);}
let logEl=null,logLines=[];
function getLogEl(){if(!logEl)logEl=document.getElementById('combat-log');return logEl;}
function addLog(msg,cls=''){logLines.push({msg,cls});if(logLines.length>5)logLines.shift();const el=getLogEl();if(el)el.innerHTML=logLines.map(l=>`<div class="log-line ${l.cls}">${l.msg}</div>`).join('');}


// ══ GOLEM AI ══════════════════════════════════════════════════════════
function updateGolem(dt){
  const G=state.golem;
  G.animTimer+=dt;if(G.animTimer>.25){G.animTimer=0;G.animFrame=(G.animFrame+1)%4;}
  if(G.hitFlash>0)G.hitFlash-=dt*3;
  G.mp=Math.min(G.maxMp,G.mp+dt*(G.mpRegen||2));
  G.hp=Math.min(G.maxHp,G.hp+dt*(G.hpRegen||1)*.1); // passive regen

  const near=state.enemies.filter(e=>dist(G,e)<4);
  const threat=near.reduce((s,e)=>s+e.threat,0);
  const closest=near.slice().sort((a,b)=>dist(G,a)-dist(G,b))[0];
  if(G.hp<G.maxHp*.3&&threat>=3){G.gstate='flee';G.fleeTimer=3;}
  if(G.gstate==='flee'){G.fleeTimer-=dt;if(G.fleeTimer<=0||threat===0)G.gstate='patrol';if(closest)fleeFrom(G,closest,dt);G.hp=Math.min(G.maxHp,G.hp+dt*1.5);}
  else if(threat===0){G.gstate='patrol';patrolBehavior(G,dt);}
  else if(closest&&dist(G,closest)<=G.atkRange){G.gstate='attack';G.target=closest;attackBehavior(G,closest,dt);}
  else if(closest){if(threat<=4){G.gstate='chase';chaseTo(G,closest,dt);}else{G.gstate='flee';G.fleeTimer=2;fleeFrom(G,closest,dt);}}
  G.atkTimer=Math.max(0,G.atkTimer-dt);
  updateDots(G,dt,true);
  // Monde infini — pas de mur, légère attraction vers le centre
  G.col=Math.max(-50,Math.min(50,G.col));G.row=Math.max(-50,Math.min(50,G.row));
  updateSpells(dt);
  const badge=document.getElementById('state-badge');
  const sc2={patrol:'#4a7aff',chase:'#ffd700',flee:'#ef4444',attack:'#ff6b35'};
  const labels={patrol:'PATROL',chase:'CHASSE',flee:'FUITE',attack:'ATTAQUE'};
  badge.textContent=labels[G.gstate];badge.style.color=sc2[G.gstate];badge.style.borderColor=sc2[G.gstate];badge.style.background=sc2[G.gstate]+'18';
}
function chaseTo(G,t,dt){const d=dist(G,t);if(d<.1)return;const slowPenalty=1-(G.slow||0);const s=(0.8+G.spd*.08)*dt*slowPenalty,f=Math.min(s/d,1);const dc=(t.col-G.col)*f,dr=(t.row-G.row)*f;G.col+=dc;G.row+=dr;if(dc!==0)G.facing=dc>0?1:-1;}
function fleeFrom(G,t,dt){const d=dist(G,t);if(d<.1)return;const s=(1+G.spd*.1)*dt,f=s/d;G.col-=(t.col-G.col)*f;G.row-=(t.row-G.row)*f;G.col+=(8-G.col)*.02;G.row+=(8-G.row)*.02;}
function patrolBehavior(G,dt){G.patrolTimer-=dt;if(G.patrolTimer<=0){G.patrol.col=G.col+rnd(-4,4);G.patrol.row=G.row+rnd(-4,4);G.patrolTimer=3+rnd(0,4);}const d=dist(G,G.patrol);if(d>.3){const s=.4*dt,f=Math.min(s/d,1);const dc=(G.patrol.col-G.col)*f,dr=(G.patrol.row-G.row)*f;G.col+=dc;G.row+=dr;if(dc!==0)G.facing=dc>0?1:-1;}}
function attackBehavior(G,enemy,dt){
  if(G.atkTimer<=0){
    G.facing=enemy.col>G.col?1:-1;
    const physBase=G.atkDmg+Math.floor(G.str*.8)+Math.floor(G.int*.15);let dmg=physBase;const crit=Math.random()*100<G.critChance;const critMult=(1.85+Math.max(0,(G.critChance-5))*0.005)*(1+(G.critDmgBonus||0));if(crit)dmg=Math.floor(dmg*critMult);
    // Apply defShred: enemy with shred debuff takes extra dmg
    if(enemy._defShred&&enemy._defShredTimer>0)dmg=Math.floor(dmg*(1+enemy._defShred));
    enemy.hp-=dmg;enemy.hitFlash=1;
    const ep=ISO.toScreen(enemy.col,enemy.row);
    fxSlash(ep.x,ep.y,crit);
    const ls=getSpellState('lifesteal');
    if(ls?.unlocked){const leechRate=Math.min(.55,(.20+(G.baseLifesteal||0))+G.int*.003);const heal=Math.floor(dmg*leechRate*(ls.passiveMastery||1));G.hp=Math.min(G.maxHp,G.hp+heal);const gp=ISO.toScreen(G.col,G.row);fxLifesteal(ep.x,ep.y,gp.x,gp.y);}
    spawnFloat(ep.x,ep.y-20,crit?`⚡${dmg}!`:`-${dmg}`,crit?'#ffd700':'#ff6b35');
    spawnPart(ep.x,ep.y,crit?10:5,'#ff6b35',3);
    trackDmg(dmg,'auto');
    if(crit){addLog(`⚡ CRIT ${enemy.name} −${dmg}`,'log-dmg');state.totalCrits=(state.totalCrits||0)+1;}
    if(typeof SFX!=='undefined'){if(crit)SFX.crit();else SFX.attack();}
    G.atkTimer=1/G.atkSpd;if(enemy.hp<=0)killEnemy(enemy);
  }
}
function killEnemy(enemy){
  if(!state.enemies.includes(enemy))return;
  if(enemy.isBoss){
    state.bossKills=(state.bossKills||0)+1;
    document.getElementById('boss-bar').style.display='none';
    addLog(`💥 BOSS ${enemy.name} vaincu!`,'log-loot');
    checkAchievements();
    // Guaranteed epic+ drop
    const bossRar=Math.random()<.3?'legendary':'epic';
    const pool=ITEMS.filter(i=>i.rarity===bossRar);
    if(pool.length&&state.inventory.length<24){
      const tmpl=pool[Math.floor(Math.random()*pool.length)];
      const ep2=ISO.toScreen(enemy.col,enemy.row);
      const bItem={...tmpl,...generateAffixes(tmpl,state.wave),uid:Date.now()+Math.random(),ilvl:state.wave};
      state.inventory.push(bItem);
      addLog(`💎 DROP BOSS: ${bItem.name} (${bossRar})!`,'log-loot');
      spawnFloat(ep2.x,ep2.y-30,tmpl.icon+'✨','#ffc107');
    }
  }
  const p=ISO.toScreen(enemy.col,enemy.row);
  spawnPart(p.x,p.y,15,'#ff6b35',4,.8);spawnPart(p.x,p.y,8,'#ffd700',3,.6);
  const goldDrop=Math.floor(enemy.gold*(state.golem.goldBonus||1));
  // no-hit kill tracking
  if(!state._tookDmgSinceKill){state.noHitKills=(state.noHitKills||0)+1;}
  state._tookDmgSinceKill=false;
  // Soulharvest passive
  const sh=getSpellState('soulharvest');
  if(sh?.unlocked){
    const maxStacks=100*(1+(sh.spellLvl-1)*.02);
    if(!G._soulStacks)G._soulStacks=0;
    if(G._soulStacks<maxStacks){G._soulStacks++;G.atkDmg+=0.02;}
  }
  // Void Set 3p: kill buff +1% DMG 30s (max 50%)
  if(state.golem._setVoidKillBuff){
    const G=state.golem;
    if(!G._voidKillBonusPct)G._voidKillBonusPct=0;
    if(G._voidKillBonusPct<0.50){
      G._voidKillBonusPct=Math.min(0.50,(G._voidKillBonusPct||0)+0.01);
      G.atkDmg=Math.floor(G.atkDmg*1.01);
      clearTimeout(G._voidKillTimer);
      G._voidKillTimer=setTimeout(()=>{G._voidKillBonusPct=0;recalcStats();},30000);
    }
  }
  // StarPact: count kill
  if(state.golem._starPactActive){state.golem._starPactKills=(state.golem._starPactKills||0)+1;}
  if(typeof SFX!=='undefined')SFX.kill();
  state.golem.xp+=enemy.xp;state.golem.gold+=goldDrop;state.totalGoldEarned=(state.totalGoldEarned||0)+goldDrop;
  state.score+=enemy.xp*2;state.totalKills++;
  addLog(`💀 ${enemy.name} +${enemy.xp}XP +${enemy.gold}G`,'log-loot');
  if(enemy.isElite){
    // Elite guaranteed rare+ drop
    const elRar=Math.random()<.15?'epic':Math.random()<.4?'rare':'uncommon';
    const elPool=ITEMS.filter(i=>i.rarity===elRar);
    if(elPool.length&&state.inventory.length<24){
      const tmpl=elPool[Math.floor(Math.random()*elPool.length)];
      state.inventory.push({...tmpl,...generateAffixes(tmpl),uid:Date.now()+Math.random()});
      addLog(`✨ ÉLITE drop: ${tmpl.name} (${elRar})!`,'log-loot');
      spawnFloat(p.x,p.y-25,tmpl.icon,enemy.eliteColor||'#ffd700');
    }
    // Mark loot
    if(elRar==='epic'||elRar==='legendary'){state.lootMarkers.push({x:p.x,y:p.y,color:enemy.eliteColor||'#ab47bc',icon:'✨',life:8,maxLife:8});}
  }
  if(Math.random()<.011)dropItem(p.x,p.y,state.wave);
  state.enemies=state.enemies.filter(e=>e!==enemy);
  checkLevelUp();checkAchievements();updateUI();renderUpgrades();
}
function checkLevelUp(){
  const G=state.golem;
  while(G.xp>=G.xpNext){
    G.level++;G.xp-=G.xpNext;G.xpNext=Math.floor(G.xpNext*1.5);
    G.baseStats.maxHp+=15;G.baseStats.str+=2;G.baseStats.int+=1;G.baseStats.def+=1;G.baseStats.spd+=.3;G.baseStats.atkDmg+=3;G.baseStats.atkSpd+=.05;G.baseStats.critChance+=1;
    recalcStats();G.hp=G.maxHp;G.mp=G.maxMp;
    addLog(`✨ NIVEAU ${G.level}!`,'log-spell');
    if(typeof SFX!=='undefined')SFX.levelUp();
    const p=ISO.toScreen(G.col,G.row);spawnPart(p.x,p.y,20,'#00e5ff',4,1);spawnFloat(p.x,p.y-30,`LVL ${G.level}!`,'#00e5ff');
    for(const s of state.activeSpells){if(!s.unlocked&&s.passive&&s.lvl<=G.level){s.unlocked=true;addLog(`✨ ${s.name} (passif) débloqué!`,'log-spell');}}
    renderSpells();
  }
}
function updateEnemies(dt){
  const G=state.golem;
  for(const e of state.enemies){
    e.animTimer+=dt;e.atkTimer-=dt;if(e.animTimer>.3){e.animTimer=0;e.animFrame=(e.animFrame+1)%4;}if(e.hitFlash>0)e.hitFlash-=dt*4;
    // Boss rage phase at 50% HP
    if(e.isBoss&&!e.rageTriggered&&e.hp<=e.maxHp*.5){
      e.rageTriggered=true;e.inRage=true;e.spd*=1.4;e.dmg=Math.floor(e.dmg*1.3);
      addLog(`⚠ ${e.name} entre en RAGE!`,'log-warn');
    if(typeof SFX!=='undefined')SFX.bossRage();
      spawnPart(ISO.toScreen(e.col,e.row).x,ISO.toScreen(e.col,e.row).y,20,'#ff6f00',5,1.2);
    }
    if(e.isBoss){updateBossBar(e);}
    updateDots(e,dt,false);
    const sM=e.slow>0?(1-e.slow):1;const d=dist(e,G);
    // Golem slow debuff
    // Pas de clamp pour les ennemis — monde infini
    if(d>e.range){const s=e.spd*sM*dt,f=Math.min(s/d,1);const dc=(G.col-e.col)*f,dr=(G.row-e.row)*f;e.col+=dc;e.row+=dr;e.facing=dc>0?1:-1;}
    else{e.facing=G.col>e.col?1:-1;if(e.atkTimer<=0){// DefShred on enemy reduces their effective def (not used for player, but applied on enemies hitting)
    if(e._defShredTimer>0){e._defShredTimer-=0.016;} // approx dt
    if(G._wraithFormActive)return; // intangible — no damage
        const physRed=Math.floor(G.def*.6);let dmg=Math.max(1,e.dmg-physRed);dmg=Math.floor(dmg*(1-(G.dmgReduction||0)));G.hp-=dmg;G.hitFlash=1;state._tookDmgSinceKill=true;e.atkTimer=1.2/e.spd;
        if(e.dotOnHit){applyDot(G,e.dotOnHit.type,e.dotOnHit.dmg,e.dotOnHit.dur);}
        if(e.poisonOnHit){applyDot(G,e.poisonOnHit.type,e.poisonOnHit.dmg,e.poisonOnHit.dur);}
        const soh=e.slowOnHit||0;if(soh>0){G.slow=(G.slow||0)+soh;setTimeout(()=>{G.slow=Math.max(0,(G.slow||0)-soh);},3000);}
        if(e.lifeSteal){const h=Math.floor(dmg*e.lifeSteal);e.hp=Math.min(e.maxHp,e.hp+h);}const p=ISO.toScreen(G.col,G.row);spawnFloat(p.x,p.y-15,`-${dmg}`,'#ef4444');spawnPart(p.x,p.y,4,'#ef4444',2);if(G.hp<=0){G.hp=0;handleDeath();}}}
  }
}
function handleDeath(){
  if(typeof SFX!=='undefined')SFX.death();
  addLog('💀 DÉFAITE — Retour à la Vague 1…','log-warn');
  showWaveNotif('DÉFAITE');
  // Brief pause then full reset
  setTimeout(()=>{
    const G=state.golem;
    // Reset wave
    state.wave=1;
    state.waveActive=false;
    state.waveTimer=4;
    state.enemies=[];
    // Revive golem at half HP/MP
    G.hp=G.maxHp*(G.reviveBonus||.5);
    G.mp=G.maxMp*.5;
    G.col=8;G.row=8;
    G.gstate='patrol';G.hitFlash=0;
    // Reset spell timers
    for(const s of state.activeSpells){s.timer=0;}
    // Update UI
    updateUI();
    addLog('⚡ Ressuscité — Vague 1','log-spell');
    showWaveNotif('VAGUE 1');
  },2500);
}

// updateParticles now in spawnPart pool above
