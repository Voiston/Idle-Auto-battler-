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
window.addEventListener('beforeunload',()=>{
  localStorage.setItem('golemExe8',JSON.stringify({
    baseStats:state.golem.baseStats,
    golem:{hp:state.golem.hp,mp:state.golem.mp,xp:state.golem.xp,xpNext:state.golem.xpNext,level:state.golem.level,gold:state.golem.gold,atkSpd:state.golem.atkSpd,cdReduction:state.golem.cdReduction,mpRegen:state.golem.mpRegen,hpRegen:state.golem.hpRegen,spellSlotsMax:state.golem.spellSlotsMax,_soulStacks:state.golem._soulStacks||0},
    equipped:state.golem.equipped,equippedSpells:state.golem.equippedSpells,
    upgrades:state.golem.upgrades,
    wave:state.wave,score:state.score,inventory:state.inventory,
    totalKills:state.totalKills,totalCrits:state.totalCrits,bossKills:state.bossKills,maxWave:state.maxWave,totalGoldEarned:state.totalGoldEarned,
    achievements:[...state_ach.unlocked],
    spellMastery:state.activeSpells.map(s=>({id:s.id,unlocked:s.unlocked,spellLvl:s.spellLvl,spellXp:s.spellXp,spellXpNext:s.spellXpNext,cdMastery:s.cdMastery,dmgMastery:s.dmgMastery,mpMastery:s.mpMastery,passiveMastery:s.passiveMastery})),
  }));
});


// ══ INIT ══════════════════════════════════════════════════════════════
function init(){
  initCanvas();
  initModals();
  if(typeof initDrawer!=="undefined")initDrawer();
  if(typeof initEventListeners!=="undefined")initEventListeners();
  resizeCanvas();initSpells();
  const sv=localStorage.getItem('golemExe8')||localStorage.getItem('golemExe7')||localStorage.getItem('golemExe6')||localStorage.getItem('golemExe5')||localStorage.getItem('golemExe4');
  if(sv){try{
    const s=JSON.parse(sv);
    if(s.baseStats)state.golem.baseStats={...s.baseStats};
    Object.assign(state.golem,s.golem);
    if(s.equipped)state.golem.equipped={...s.equipped};
    if(s.equippedSpells)state.golem.equippedSpells=s.equippedSpells;
    if(s.upgrades)state.golem.upgrades={...s.upgrades};
    state.wave=s.wave||1;state.score=s.score||0;state.inventory=s.inventory||[];
    // Restore spell mastery
    if(s.spellMastery){
      for(const m of s.spellMastery){
        const sp=getSpellState(m.id);if(!sp)continue;
        sp.unlocked=m.unlocked||false;
        sp.spellLvl=m.spellLvl||1;sp.spellXp=m.spellXp||0;sp.spellXpNext=m.spellXpNext||10;
        if(m.cdMastery)sp.cdMastery=m.cdMastery;if(m.dmgMastery)sp.dmgMastery=m.dmgMastery;
        if(m.mpMastery)sp.mpMastery=m.mpMastery;if(m.passiveMastery)sp.passiveMastery=m.passiveMastery;
      }
    } else if(s.unlockedSpells){
      for(const id of s.unlockedSpells){const sp=getSpellState(id);if(sp)sp.unlocked=true;}
    }
    if(s.totalKills)state.totalKills=s.totalKills;
    if(s.totalCrits)state.totalCrits=s.totalCrits;
    if(s.bossKills)state.bossKills=s.bossKills;
    if(s.maxWave)state.maxWave=s.maxWave;
    if(s.totalGoldEarned)state.totalGoldEarned=s.totalGoldEarned;
    if(s.achievements)for(const id of s.achievements)state_ach.unlocked.add(id);
    // Restore extra spell slots
    const extraSlots=(state.golem.spellSlotsMax||4)-4;
    for(let i=0;i<extraSlots;i++){
      if(state.golem.equippedSpells.length<(state.golem.spellSlotsMax||4))state.golem.equippedSpells.push(null);
      // Add DOM slot
      const row=document.getElementById('spell-slots-row');
      const idx=4+i;
      if(!document.querySelector(`.spell-slot[data-spell-slot="${idx}"]`)){
        const el=document.createElement('div');el.className='spell-slot';el.dataset.spellSlot=idx;
        el.innerHTML=`<span class="spell-slot-ico">＋</span><div class="spell-slot-lbl">SORT ${idx+1}</div><span class="ss-x">✕</span>`;
        row.appendChild(el);
      }
    }
    recalcStats();addLog('💾 Partie chargée!','log-spell');
  }catch(e){console.warn(e);}}
  renderInventory();renderEquip();renderSpellSlots();renderSpells();renderUpgrades();renderAchievements();updateUI();initCraft();
  addLog('⬡ GOLEM.EXE v3.0 — Forge, Résistances, Diablo!','log-spell');
  requestAnimationFrame(ts=>{lastTime=ts;gameLoop(ts);});
}
init();