// ══ WAVE ══════════════════════════════════════════════════════════════
function showWaveNotif(t){const el=document.getElementById('wave-notif');el.textContent=t;el.style.animation='none';el.offsetHeight;el.style.animation='waveFlash 2s ease forwards';}
function spawnWave(wave){
  // Track max wave reached
  if(wave>(state.maxWave||0))state.maxWave=wave;
  checkAchievements();
  if(isBossWave(wave)){
    spawnBoss(wave);
    return;
  }
  document.getElementById('boss-bar').style.display='none';
  // Density: more enemies in higher biomes
  const bio=getBiome(wave);
  const baseDensity=bio===BIOMES.abyssal?6:bio===BIOMES.volcanic?5:3;
  const count=Math.min(40, baseDensity+wave*2);
  let pool;
  if(bio===BIOMES.abyssal){
    const apools=[['frostshade','voidarcher'],['frostshade','glacialgolem'],['voidarcher','abyssalbehemoth','glacialgolem'],['abyssalbehemoth','glacialgolem'],['abyssalbehemoth','voidarcher','glacialgolem']];
    pool=apools[Math.min(wave-18,apools.length-1)];
  } else if(bio===BIOMES.volcanic){
    const vpools=[['ember','lavabrute'],['ember','scorcher','lavabrute'],['scorcher','ashwraith','lavabrute'],['ashwraith','scorcher'],['lavabrute','ashwraith']];
    pool=vpools[Math.min(wave-8,vpools.length-1)];
  } else {
    const fpools=[['grunt','slime'],['grunt','slime','archer'],['grunt','archer','brute'],['archer','brute','wraith'],['brute','wraith']];
    pool=fpools[Math.min(wave-1,fpools.length-1)];
  }
  for(let i=0;i<count;i++){
    const type=pool[Math.floor(Math.random()*pool.length)];const t=ETYPES[type];
    // Spawn à distance du Golem, hors du champ de vision
    let col,row;
    const spawnRadius=14+Math.floor(wave/5);  // s'agrandit avec les vagues
    const angle=Math.random()*Math.PI*2;
    const dist2=spawnRadius+rnd(-2,2);
    col=state.golem.col+Math.cos(angle)*dist2;
    row=state.golem.row+Math.sin(angle)*dist2*0.5;
    const sc=1+wave*.1;
    const enemy={id:Date.now()+i,type,col,row,hp:Math.floor(t.hp*sc),maxHp:Math.floor(t.hp*sc),dmg:Math.floor(t.dmg*sc),spd:t.spd,range:t.range,xp:t.xp,gold:t.gold,threat:t.threat,name:t.name,atkTimer:rnd(0,2),hitFlash:0,animTimer:0,animFrame:0,draw:t.draw,facing:1,slow:0,slowOnHit:t.slowOnHitVal||0,dotOnHit:t.dotOnHit||null};
    if(Math.random()<eliteChance(wave))makeElite(enemy);
    state.enemies.push(enemy);
  }
  state.waveActive=true;
  const prevBio=wave>1?getBiome(wave-1):null;const curBio=getBiome(wave);
  if(prevBio&&prevBio!==curBio){addLog(`🌋 Biome: ${curBio.icon} ${curBio.name}!`,'log-warn');}
  showWaveNotif(`VAGUE ${wave}`);addLog(`⚡ Vague ${wave} — ${count} ennemis!`,'log-warn');
}
