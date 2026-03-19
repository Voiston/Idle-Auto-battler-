// ══ GAME LOOP ══════════════════════════════════════════════════════════
let lastTime=0,pipT=0;
function gameLoop(ts){
  const dt=Math.min((ts-lastTime)/1000,.05);lastTime=ts;
  if(!state.waveActive||state.enemies.length===0){
    if(state.waveActive&&state.enemies.length===0){state.waveActive=false;state.waveTimer=state.waveDelay;addLog('✅ Vague '+state.wave+' terminée!','log-spell');state.wave++;}
    state.waveTimer-=dt;if(state.waveTimer<=0&&!state.waveActive)spawnWave(state.wave);
  }
  if(state.golem.hp>0){updateGolem(dt);updateEnemies(dt);}
  updateParticles(dt);updateVfx(dt);
  for(let i=state.lootMarkers.length-1;i>=0;i--){state.lootMarkers[i].life-=dt;if(state.lootMarkers[i].life<=0)state.lootMarkers.splice(i,1);}
  drawScene();
  pipT+=dt;if(pipT>.25){pipT=0;renderSpellPips();}
  if(Math.floor(ts/2000)!==Math.floor((ts-dt*1000)/2000)){renderAchievements();}
  if(Math.floor(ts/100)!==Math.floor((ts-dt*1000)/100)){updateUI();renderUpgrades();}
  requestAnimationFrame(gameLoop);
}


// ══ SAVE / LOAD ════════════════════════════════════════════════════════
// ══ VERSIONED SAVE SYSTEM ════════════════════════════════════════════
const SAVE_KEY    = 'golemExe';
const SAVE_VERSION = 9;

// Migration functions: each transforms save data from vN to vN+1
const SAVE_MIGRATIONS = {
  // v4-v8 → v9: ensure new fields exist
  toV9(s){
    if(!s.baseStats) s.baseStats = {};
    // Ensure resistance fields
    ['resFire','resIce','resVoid'].forEach(r=>{ if(!(r in (s.baseStats||{}))) s.baseStats[r]=0; });
    // Ensure new counters
    if(!s.totalCrits) s.totalCrits = 0;
    if(!s.bossKills)  s.bossKills  = 0;
    if(!s.maxWave)    s.maxWave    = s.wave || 1;
    if(!s.totalGoldEarned) s.totalGoldEarned = 0;
    if(!s.noHitKills) s.noHitKills = 0;
    if(!s.achievements) s.achievements = [];
    if(!s.spellMastery) s.spellMastery = [];
    // Ensure golem sub-fields
    if(!s.golem) s.golem = {};
    ['spellSlotsMax','_soulStacks'].forEach(k=>{ if(!(k in s.golem)) s.golem[k]=k==='spellSlotsMax'?4:0; });
    s._version = 9;
    return s;
  },
};

function migrateData(raw){
  let s;
  try { s = JSON.parse(raw); } catch(e) { return null; }
  const v = s._version || 1;
  // Apply all migrations in order
  for(let i = v; i < SAVE_VERSION; i++){
    const fn = SAVE_MIGRATIONS[`toV${i+1}`];
    if(fn) s = fn(s);
  }
  s._version = SAVE_VERSION;
  return s;
}

function saveGame(){
  const s = {
    _version: SAVE_VERSION,
    baseStats: state.golem.baseStats,
    golem: {
      hp:state.golem.hp, mp:state.golem.mp,
      xp:state.golem.xp, xpNext:state.golem.xpNext,
      level:state.golem.level, gold:state.golem.gold,
      atkSpd:state.golem.atkSpd, cdReduction:state.golem.cdReduction,
      mpRegen:state.golem.mpRegen, hpRegen:state.golem.hpRegen,
      spellSlotsMax:state.golem.spellSlotsMax,
      _soulStacks:state.golem._soulStacks||0,
    },
    equipped:       state.golem.equipped,
    equippedSpells: state.golem.equippedSpells,
    upgrades:       state.golem.upgrades,
    wave:           state.wave,
    score:          state.score,
    inventory:      state.inventory,
    totalKills:     state.totalKills,
    totalCrits:     state.totalCrits,
    bossKills:      state.bossKills,
    maxWave:        state.maxWave,
    totalGoldEarned:state.totalGoldEarned,
    noHitKills:     state.noHitKills||0,
    achievements:   [...state_ach.unlocked],
    spellMastery:   state.activeSpells.map(sp=>({
      id:sp.id, unlocked:sp.unlocked,
      spellLvl:sp.spellLvl, spellXp:sp.spellXp, spellXpNext:sp.spellXpNext,
      cdMastery:sp.cdMastery, dmgMastery:sp.dmgMastery,
      mpMastery:sp.mpMastery, passiveMastery:sp.passiveMastery,
      spellTier:sp.spellTier||0,
    })),
  };
  try {
    localStorage.setItem(SAVE_KEY + SAVE_VERSION, JSON.stringify(s));
  } catch(e) {
    console.warn('Save failed:', e);
  }
}

function loadGame(){
  // Try current version first, then fall back to older keys
  const keys = [
    SAVE_KEY + SAVE_VERSION,
    'golemExe8','golemExe7','golemExe6','golemExe5','golemExe4'
  ];
  for(const key of keys){
    const raw = localStorage.getItem(key);
    if(!raw) continue;
    const s = migrateData(raw);
    if(!s) continue;
    return s;
  }
  return null;
}


window.addEventListener('beforeunload', saveGame);


// ══ INIT ══════════════════════════════════════════════════════════════
function init(){
  initCanvas();
  initModals();
  if(typeof initDrawer!=="undefined")initDrawer();
  if(typeof initEventListeners!=="undefined")initEventListeners();
  if(typeof initStatTooltips!=="undefined")initStatTooltips();
  if(typeof SFX!=="undefined")SFX.init();
  resizeCanvas();initSpells();
  const s = loadGame();
  if(s){
    try{
      if(s.baseStats) state.golem.baseStats={...state.golem.baseStats,...s.baseStats};
      if(s.golem)     Object.assign(state.golem, s.golem);
      if(s.equipped)  state.golem.equipped={...s.equipped};
      if(s.equippedSpells) state.golem.equippedSpells=s.equippedSpells;
      if(s.upgrades)  state.golem.upgrades={...s.upgrades};
      state.wave  = s.wave  || 1;
      state.score = s.score || 0;
      state.inventory = s.inventory || [];
      // Spell mastery
      if(s.spellMastery){
        for(const m of s.spellMastery){
          const sp=getSpellState(m.id); if(!sp) continue;
          sp.unlocked   = m.unlocked   || false;
          sp.spellLvl   = m.spellLvl   || 1;
          sp.spellXp    = m.spellXp    || 0;
          sp.spellXpNext= m.spellXpNext|| 30;
          sp.spellTier  = m.spellTier  || 0;
          if(m.cdMastery)      sp.cdMastery=m.cdMastery;
          if(m.dmgMastery)     sp.dmgMastery=m.dmgMastery;
          if(m.mpMastery)      sp.mpMastery=m.mpMastery;
          if(m.passiveMastery) sp.passiveMastery=m.passiveMastery;
        }
      }
      // Counters
      state.totalKills      = s.totalKills      || 0;
      state.totalCrits      = s.totalCrits      || 0;
      state.bossKills       = s.bossKills       || 0;
      state.maxWave         = s.maxWave         || 0;
      state.totalGoldEarned = s.totalGoldEarned || 0;
      state.noHitKills      = s.noHitKills      || 0;
      // Achievements
      if(s.achievements) for(const id of s.achievements) state_ach.unlocked.add(id);
      // Extra spell slots
      const extraSlots=(state.golem.spellSlotsMax||4)-4;
      for(let i=0;i<extraSlots;i++){
        if(state.golem.equippedSpells.length<(state.golem.spellSlotsMax||4)) state.golem.equippedSpells.push(null);
        const row=document.getElementById('spell-slots-row');
        const idx=4+i;
        if(!document.querySelector(`.spell-slot[data-spell-slot="${idx}"]`)){
          const el=document.createElement('div');el.className='spell-slot';el.dataset.spellSlot=idx;
          el.innerHTML=`<span class="spell-slot-ico">＋</span><div class="spell-slot-lbl">SORT ${idx+1}</div><span class="ss-x">✕</span>`;
          row.appendChild(el);
        }
      }
      recalcStats();
      addLog(`💾 Partie chargée (v${s._version||'?'})!`,'log-spell');
    } catch(e){ console.warn('Load error:', e); }
  }
  renderInventory();renderEquip();renderSpellSlots();renderSpells();renderUpgrades();renderAchievements();updateUI();initCraft();
  addLog('⬡ GOLEM.EXE v3.0 — Forge, Résistances, Diablo!','log-spell');
  requestAnimationFrame(ts=>{lastTime=ts;gameLoop(ts);});
}
init();