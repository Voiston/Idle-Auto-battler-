// ══ SPELL ENGINE ══════════════════════════════════════════════════════
function initSpells(){
  state.activeSpells=SPELL_DEFS.map(s=>({
    ...s,timer:0,unlocked:s.lvl<=1,
    spellLvl:1,spellXp:0,spellXpNext:30, // spell mastery (cap 100, ×3 slower)
  }));
  state.golem.equippedSpells=[null,null,null,null];
  const slam=getSpellState('slam');if(slam)slam.unlocked=true;
  state.golem.equippedSpells[0]='slam';
  renderSpellSlots();renderSpells();renderSpellPips();
}

// ── Spell mastery XP ─────────────────────────────────────────────────
// Each spell has spellLvl (max 10). Each cast grants XP. On levelup:
// active spells: −10% CD, +10% dmg multiplier, −1 MP cost
// passive spells: +10% effectiveness
const SPELL_MAX_LVL=100;

// ── Spell tier upgrade (bought with gold once mastery is max) ────────
const SPELL_TIER_COSTS=[0,200,500,1000,2000,4000,8000,15000,30000,60000]; // tier 0→9
function spellTierUpgradeCost(s){return SPELL_TIER_COSTS[Math.min(s.spellTier||0, SPELL_TIER_COSTS.length-1)];}
function buySpellTier(spellId){
  const G=state.golem;
  const s=getSpellState(spellId);if(!s||!s.unlocked)return;
  if((s.spellLvl||1)<SPELL_MAX_LVL){showToastMsg(`Maîtrise LVL 100 requise! (${s.spellLvl||1}/100)`,'#ef4444');return;}
  const tier=s.spellTier||0;
  if(tier>=9){showToastMsg('Tier maximum atteint!','#ffc107');return;}
  const cost=SPELL_TIER_COSTS[tier];
  if(G.gold<cost){showToastMsg(`${cost} G requis!`,'#ef4444');return;}
  G.gold-=cost;
  s.spellTier=(s.spellTier||0)+1;
  // Each tier: +15% DMG, -10% CD, -2 MP, +5% effectiveness passifs
  if(!s.passive){
    s.dmgMastery=(s.dmgMastery||1)*1.15;
    s.cdMastery=Math.min(.6,(s.cdMastery||0)+.10);
    s.mpMastery=(s.mpMastery||0)+2;
  } else {
    s.passiveMastery=(s.passiveMastery||1)*1.15;
  }
  const def=getSpellDef(spellId);
  addLog(`🌟 ${def?.name} → TIER ${s.spellTier}!`,'log-spell');
  showToastMsg(`🌟 ${def?.icon} ${def?.name} Tier ${s.spellTier}!`,'#ffc107');
  const gp=ISO.toScreen(G.col,G.row);
  spawnPart(gp.x,gp.y,20,'#ffc107',4,1.2);
  spawnFloat(gp.x,gp.y-35,`TIER ${s.spellTier}!`,'#ffc107');
  renderSpells();renderSpellPips();updateUI();
}

function gainSpellXp(spellId,xpAmt=1){
  const s=getSpellState(spellId);if(!s||!s.unlocked)return;
  if(s.spellLvl>=SPELL_MAX_LVL)return;
  s.spellXp+=xpAmt;
  while(s.spellXp>=s.spellXpNext&&s.spellLvl<SPELL_MAX_LVL){
    s.spellXp-=s.spellXpNext;
    s.spellLvl++;
    s.spellXpNext=Math.floor(s.spellXpNext*1.6);
    // Apply mastery bonuses — cap 100 niveaux, bonus ÷3
    const def=getSpellDef(spellId);
    if(def){
      if(!def.passive){
        s.cdMastery=(s.cdMastery||0)+0.0167;      // ~0.05/3 par niveau
        s.dmgMastery=(s.dmgMastery||1)*1.032;     // ~1.10^(1/3) par niveau
        if(s.spellLvl%3===0)s.mpMastery=(s.mpMastery||0)+1; // -1 MP / 3 niveaux
      } else {
        s.passiveMastery=(s.passiveMastery||1)*1.048; // ~1.15^(1/3) par niveau
      }
    }
    addLog(`✨ ${s.name} → Maîtrise LVL ${s.spellLvl}!`,'log-spell');
    const gp=ISO.toScreen(state.golem.col,state.golem.row);
    spawnFloat(gp.x,gp.y-40,`${s.icon} LVL${s.spellLvl}!`,'#ffd700');
    spawnPart(gp.x,gp.y,12,'#ffd700',3,.7);
  }
}
function getSpellDef(id){return SPELL_DEFS.find(s=>s.id===id);}
function getSpellState(id){return state.activeSpells.find(s=>s.id===id);}
function isSpellEquipped(id){return state.golem.equippedSpells.includes(id);}
function equipSpell(id,slot){
  const G=state.golem;if(slot>=(G.spellSlotsMax||4))return;
  const prev=G.equippedSpells.indexOf(id);if(prev!==-1)G.equippedSpells[prev]=null;
  G.equippedSpells[slot]=id;
  addLog(`✨ ${getSpellDef(id)?.name} slot ${slot+1}`,'log-spell');
  renderSpellSlots();renderSpells();renderSpellPips();
}
function unequipSpell(slot){
  state.golem.equippedSpells[slot]=null;renderSpellSlots();renderSpells();renderSpellPips();
}
function learnSpell(id){
  const s=getSpellState(id);if(!s)return false;
  if(s.unlocked){return false;}
  const def=getSpellDef(id);
  if(state.golem.level<(def?.lvl||1)){addLog(`⚠️ LVL ${def?.lvl} requis`,'log-warn');return false;}
  s.unlocked=true;addLog(`✨ ${s.name} appris!`,'log-spell');renderSpells();return true;
}

function updateSpells(dt){
  if(typeof updateSetAutoCasts==="function")updateSetAutoCasts(dt);
  const G=state.golem;
  const cdMult=1-(G.cdReduction||0);
  for(const s of state.activeSpells){
    if(s.unlocked&&!s.passive&&s.cd>0&&s.timer>0)s.timer=Math.max(0,s.timer-dt);
  }
  if(state.enemies.length===0)return;
  for(const spellId of G.equippedSpells){
    if(!spellId)continue;
    const s=getSpellState(spellId);const def=getSpellDef(spellId);
    if(!s||!def||!s.unlocked||def.passive||s.timer>0||G.mp<def.mp)continue;
    castSpell(def,s,G,cdMult);
  }
  // Thorns passif — toujours actif si débloqué (pas de timer)
  const thorns=getSpellState('thorns');// handled in updateEnemies hit section
  // Bloodpact passive: -5% HP/s, +15% DMG
  const bp=getSpellState('bloodpact');
  if(bp?.unlocked){
    const G2=state.golem;
    G2.hp=Math.max(1,G2.hp-G2.maxHp*.05*dt);
    G2.atkDmg=Math.floor(G2.atkDmg*1.0015); // tiny boost per tick (cumulative), capped in recalc
  }
  const regen=getSpellState('regen');
  if(regen?.unlocked&&regen.timer<=0){
    const healAmt=G.maxHp*regen.healPct*(regen.passiveMastery||1);
    const mpAmt=Math.floor(G.maxMp*.08*(regen.passiveMastery||1));
    G.hp=Math.min(G.maxHp,G.hp+healAmt);G.mp=Math.min(G.maxMp,G.mp+mpAmt);regen.timer=8*cdMult;
    const p=ISO.toScreen(G.col,G.row);fxHeal(p.x,p.y);
    addLog(`🌿 Niv.${regen.spellLvl}: +${Math.floor(healAmt)} HP`,'log-heal');
    gainSpellXp('regen',1);
  } else if(regen?.unlocked)regen.timer=Math.max(0,regen.timer-dt);
}

function castSpell(def,s,G,cdMult=1){
  // Mastery bonuses
  const _arcMastery=state.golem._setArcaneMastery?0.5:1;
  const effCd  = Math.max(1, def.cd * cdMult * (1-(s.cdMastery||0)) * _arcMastery);
  const effMp  = Math.max(0, def.mp - (s.mpMastery||0));
  const effDmg = (def.dmgMult||1) * (s.dmgMastery||1) * (G.spellDmgBonus||1);
  G.mp=Math.max(0,G.mp-effMp); s.timer=effCd;
  // Multicast: chance to cast twice (costs no extra MP, 50% bonus dmg on echo)
  const _doMulticast=Math.random()<(G.multicastChance||0);
  // Multicast flag stored for post-cast echo (handled at end of castSpell)
  const near=state.enemies.slice().sort((a,b)=>dist(G,a)-dist(G,b));
  const p=ISO.toScreen(G.col,G.row);

  if(def.id==='slam'&&near[0]){
    const ep=ISO.toScreen(near[0].col,near[0].row);
    const dmg=Math.floor((G.atkDmg+Math.floor(G.str*.9))*effDmg); near[0].hp-=dmg; near[0].hitFlash=1;
    fxShockwave(ep.x,ep.y);
    spawnFloat(ep.x,ep.y-24,`💥${dmg}`,'#ff6b35');
    addLog(`💥 Séisme Niv.${s.spellLvl}: ${dmg}`,'log-spell');
    if(near[0].hp<=0)killEnemy(near[0]);
    gainSpellXp('slam',2);

  }else if(def.id==='shield'){
    const defBonus=1.5+(s.spellLvl-1)*0.05; // +5% per level
    G.def=Math.floor(G.def*defBonus); fxShield(p.x,p.y,4);
    spawnFloat(p.x,p.y-28,'🛡️ DEF+','#3b82f6');
    addLog(`🛡️ Bouclier Niv.${s.spellLvl} (+${Math.round((defBonus-1)*100)}%)`,'log-spell');
    setTimeout(()=>{G.def=Math.floor(G.def/defBonus);},4000);
    gainSpellXp('shield',1);

  }else if(def.id==='nova'){
    const slowAmt=Math.min(0.8, 0.4+(s.spellLvl-1)*0.04);
    for(const e of state.enemies){e.slow=slowAmt; setTimeout(()=>{if(e)e.slow=0;},3000);}
    fxNova(p.x,p.y);
    spawnFloat(p.x,p.y-32,`❄️ -${Math.round(slowAmt*100)}%`,'#00e5ff');
    addLog(`❄️ Nova Niv.${s.spellLvl}: ${state.enemies.length} ralentis (-${Math.round(slowAmt*100)}%)`,'log-spell');
    gainSpellXp('nova', state.enemies.length);

  }else if(def.id==='chain'&&near.length){
    // +1 chain target every 3 levels
    const chainCount=Math.min(near.length, 3+Math.floor((s.spellLvl-1)/3));
    const tgts=near.slice(0,chainCount);
    const pts=[p,...tgts.map(t=>ISO.toScreen(t.col,t.row))];
    fxChain(pts);
    for(const t of tgts){
      const dmg=Math.floor((G.atkDmg*.6+Math.floor(G.int*1.2))*effDmg); t.hp-=dmg; t.hitFlash=1;
      spawnFloat(ISO.toScreen(t.col,t.row).x,ISO.toScreen(t.col,t.row).y-15,`⚡${dmg}`,'#ffd700');
      if(t.hp<=0)killEnemy(t);
    }
    addLog(`⚡ Éclair Niv.${s.spellLvl}: ${chainCount} cibles`,'log-spell');
    gainSpellXp('chain', chainCount);

  }else if(def.id==='berserker'){
    const atkBonus=1.8+(s.spellLvl-1)*0.08; // +8% per level
    const oAtk=G.atkDmg,oDef=G.def;
    G.atkDmg=Math.floor(G.atkDmg*atkBonus); G.def=Math.floor(G.def*.8);
    fxBerserker(5); spawnFloat(p.x,p.y-30,`🔥 +${Math.round((atkBonus-1)*100)}%`,'#ff6b35');
    addLog(`🔥 Berserker Niv.${s.spellLvl} (+${Math.round((atkBonus-1)*100)}% ATK)`,'log-spell');
    setTimeout(()=>{G.atkDmg=oAtk;G.def=oDef;},5000);
    gainSpellXp('berserker',3);

  }else if(def.id==='meteor'&&near[0]){
    const aoeRadius=2.5+(s.spellLvl-1)*0.15; // radius grows with level
    const ep=ISO.toScreen(near[0].col,near[0].row);
    fxMeteor(ep.x,ep.y);
    addLog(`☄️ Météorite Niv.${s.spellLvl}!`,'log-spell');
    setTimeout(()=>{
      const tCol=near[0].col, tRow=near[0].row;
      const aoe=state.enemies.filter(e=>dist({col:tCol,row:tRow},e)<aoeRadius);
      for(const e of aoe){
        const dmg=Math.floor((G.atkDmg*.5+Math.floor(G.int*1.5))*effDmg); e.hp-=dmg; e.hitFlash=1;
        spawnFloat(ISO.toScreen(e.col,e.row).x,ISO.toScreen(e.col,e.row).y-15,`☄️${dmg}`,'#ff4500');
        if(e.hp<=0)killEnemy(e);
      }
      addLog(`☄️ Impact: ${aoe.length} touchés`,'log-spell');
      gainSpellXp('meteor', aoe.length+2);
    },250);

  }else if(def.id==='toxiccloud'){
    const p2=ISO.toScreen(G.col,G.row);const dotDmg=Math.floor((G.atkDmg*.4+Math.floor(G.int*1.1))*effDmg*.5+1);
    fxToxicCloud(p2.x,p2.y);
    addLog(`🌫️ Nuage Niv.${s.spellLvl}: poison!`,'log-spell');
    const dur=(def.dotDur||3)*(1+(s.spellLvl-1)*.1);let ticks=0;
    const iv=setInterval(()=>{ticks++;for(const e of state.enemies){applyDot(e,'poison',dotDmg,2,1);e.hitFlash=.4;}spawnFloat(p2.x,p2.y-20,`☠${dotDmg}`,'#50c850');if(ticks>=Math.ceil(dur))clearInterval(iv);},1000);
    gainSpellXp('toxiccloud',2);

  }else if(def.id==='vortex'){
    const p3=ISO.toScreen(G.col,G.row);fxVortex(p3.x,p3.y);
    addLog(`🌀 Vortex Niv.${s.spellLvl}: aspiration!`,'log-spell');
    const pull=0.3+s.spellLvl*.04;
    for(const e of state.enemies){
      e.col+=( G.col-e.col)*pull;e.row+=(G.row-e.row)*pull;
      const dmg=Math.floor((G.atkDmg*.4+Math.floor(G.int*.8))*effDmg);e.hp-=dmg;e.hitFlash=1;if(e.hp<=0)killEnemy(e);
    }
    gainSpellXp('vortex',state.enemies.length);

  }else if(def.id==='blizzard'){
    const p4=ISO.toScreen(G.col,G.row);const blizDur=(def.dotDur||4)*(1+(s.spellLvl-1)*.1);
    fxBlizzard(p4.x,p4.y,blizDur);
    const slowAmt=Math.min(.85,.6+(s.spellLvl-1)*.03);
    for(const e of state.enemies){e.slow=slowAmt;setTimeout(()=>{if(e)e.slow=0;},blizDur*1000);}
    addLog(`🌨️ Blizzard Niv.${s.spellLvl}: −${Math.round(slowAmt*100)}%`,'log-spell');
    const bDmg=Math.floor((G.atkDmg*.4+Math.floor(G.int*1.1))*effDmg);let bt=0;
    const biv=setInterval(()=>{bt++;for(const e of state.enemies){e.hp-=bDmg;e.hitFlash=.4;if(e.hp<=0)killEnemy(e);}if(bt>=Math.ceil(blizDur))clearInterval(biv);},1000);
    gainSpellXp('blizzard',state.enemies.length+1);

  }else if(def.id==='quake'){
    const p5=ISO.toScreen(G.col,G.row);fxQuake(p5.x,p5.y);
    addLog(`🌋 Tremblement Niv.${s.spellLvl}: 360°!`,'log-spell');
    for(const e of state.enemies){
      const dmg=Math.floor((G.atkDmg+Math.floor(G.str*.9))*effDmg);e.hp-=dmg;e.hitFlash=1;
      spawnFloat(ISO.toScreen(e.col,e.row).x,ISO.toScreen(e.col,e.row).y-15,`🌋${dmg}`,'#c8640a');
      if(e.hp<=0)killEnemy(e);
    }
    gainSpellXp('quake',state.enemies.length+1);

  }else if(def.id==='arcstorm'){
    const hits=Math.min(state.enemies.length,(def.hits||5)+Math.floor(s.spellLvl/3));
    const tgts=state.enemies.slice().sort(()=>Math.random()-.5).slice(0,hits);
    fxArcStorm(ISO.toScreen(G.col,G.row).x,ISO.toScreen(G.col,G.row).y,tgts);
    addLog(`⚡ Tempête Niv.${s.spellLvl}: ${tgts.length} frappes!`,'log-spell');
    for(let i=0;i<tgts.length;i++){
      setTimeout(()=>{
        const e=tgts[i];if(!e||!state.enemies.includes(e))return;
        const dmg=Math.floor((G.atkDmg*.5+Math.floor(G.int*1.3))*effDmg);e.hp-=dmg;e.hitFlash=1;
        spawnFloat(ISO.toScreen(e.col,e.row).x,ISO.toScreen(e.col,e.row).y-15,`⚡${dmg}`,'#b0d4ff');
        if(e.hp<=0)killEnemy(e);
      },i*110);
    }
    gainSpellXp('arcstorm',tgts.length);

  }else if(def.id==='counter'){
    G._counterActive=true;G._counterDmg=effDmg;
    const p6=ISO.toScreen(G.col,G.row);
    spawnFloat(p6.x,p6.y-28,'🔄 CONTRE!','#ff7043');
    addLog(`🔄 Contre-Attaque Niv.${s.spellLvl} 5s`,'log-spell');
    setTimeout(()=>{G._counterActive=false;},5000*(1+(s.spellLvl-1)*.1));
    gainSpellXp('counter',2);

  }else if(def.id==='haste'){
    const origAtkSpd=G.atkSpd,origSpd=G.spd;
    G.atkSpd=G.atkSpd*(1.5+(s.spellLvl-1)*.05);
    G.spd=G.spd*(1.5+(s.spellLvl-1)*.05);
    const ph=ISO.toScreen(G.col,G.row);
    fxBerserker(6);spawnFloat(ph.x,ph.y-28,'💨 HASTE!','#b3e5fc');
    addLog(`💨 Hâte Niv.${s.spellLvl}`,'log-spell');
    setTimeout(()=>{G.atkSpd=origAtkSpd;G.spd=origSpd;},6000*(1+(s.spellLvl-1)*.08));
    gainSpellXp('haste',2);

  }else if(def.id==='soulrip'&&near[0]){
    const ep=ISO.toScreen(near[0].col,near[0].row);
    const dmg2=Math.floor((G.atkDmg+G.str)*effDmg);near[0].hp-=dmg2;near[0].hitFlash=1;
    near[0]._defShred=.40*(1+(s.spellLvl-1)*.05);near[0]._defShredTimer=4;
    fxShockwave(ep.x,ep.y);
    spawnFloat(ep.x,ep.y-24,`💔-${Math.round((near[0]._defShred)*100)}%DEF`,'#ef5350');
    addLog(`💔 Déchirement Niv.${s.spellLvl}: DEF -${Math.round((near[0]._defShred)*100)}%`,'log-spell');
    if(near[0].hp<=0)killEnemy(near[0]);
    gainSpellXp('soulrip',2);

  }else if(def.id==='blink'&&near[0]){
    const tgt=near[0];
    const ep=ISO.toScreen(tgt.col,tgt.row);
    G.col=tgt.col+(Math.random()>.5?.9:-.9);
    G.row=tgt.row+(Math.random()>.5?.9:-.9);
    const dmg3=Math.floor((G.atkDmg+G.str)*effDmg);tgt.hp-=dmg3;tgt.hitFlash=1;
    fxShockwave(ep.x,ep.y);spawnPart(ep.x,ep.y,15,'#b3e5fc',5,.8);
    spawnFloat(ep.x,ep.y-28,`⚡${dmg3}`,'#b3e5fc');
    addLog(`⚡ Téléport Niv.${s.spellLvl}: ${dmg3} DMG`,'log-spell');
    if(tgt.hp<=0)killEnemy(tgt);
    gainSpellXp('blink',3);

  }else if(def.id==='sacrifice'){
    const cost=Math.floor(G.maxHp*.25);
    if(G.hp<=cost+1){addLog('🩹 Pas assez de HP!','log-warn');s.timer=0;return;}
    G.hp-=cost;
    const healAmt=Math.floor(G.maxHp*.8*(1+(s.spellLvl-1)*.1));
    G.hp=Math.min(G.maxHp,G.hp+healAmt);
    const ps=ISO.toScreen(G.col,G.row);fxHeal(ps.x,ps.y);spawnPart(ps.x,ps.y,15,'#00e676',4,.8);
    spawnFloat(ps.x,ps.y-30,`🩹+${healAmt}`,'#00e676');
    addLog(`🩹 Sacrifice Niv.${s.spellLvl}: +${healAmt} HP`,'log-heal');
    gainSpellXp('sacrifice',3);
  
  }else if(def.id==='warcry'){
    const boost=1.30*(1+(s.spellLvl-1)*.05);
    const oAtk=G.atkDmg,oDef=G.def,oSpd=G.atkSpd;
    G.atkDmg=Math.floor(G.atkDmg*boost);G.def=Math.floor(G.def*boost);G.atkSpd*=boost;
    const pw=ISO.toScreen(G.col,G.row);
    fxBerserker(8);spawnFloat(pw.x,pw.y-30,'📣 GUERRE!','#ffd700');
    addLog(`📣 Cri Niv.${s.spellLvl}: +${Math.round((boost-1)*100)}% ATK/DEF/SPD`,'log-spell');
    setTimeout(()=>{G.atkDmg=oAtk;G.def=oDef;G.atkSpd=oSpd;},8000*(1+(s.spellLvl-1)*.08));
    gainSpellXp('warcry',3);

  }else if(def.id==='bonespear'&&near.length){
    // Hits all enemies in order of proximity (piercing line)
    const gp2=ISO.toScreen(G.col,G.row);
    addLog(`🦴 Lance d'Os Niv.${s.spellLvl}: ${near.length} cibles!`,'log-spell');
    let delay=0;
    for(const e of near){
      const ep=ISO.toScreen(e.col,e.row);
      setTimeout(()=>{
        if(!state.enemies.includes(e))return;
        const dmg=Math.floor((G.atkDmg+G.str)*effDmg);e.hp-=dmg;e.hitFlash=1;
        spawnFloat(ep.x,ep.y-18,`🦴${dmg}`,'#e0e0e0');
        spawnPart(ep.x,ep.y,6,'#bdbdbd',3,.5);
        if(e.hp<=0)killEnemy(e);
      },delay);delay+=80;
    }
    gainSpellXp('bonespear',near.length+1);
  
  }else if(def.id==='shockwave'){
    // Repousse tous les ennemis proches + dégâts
    const allNear=state.enemies.filter(e=>dist(G,e)<6);
    const spGp=ISO.toScreen(G.col,G.row);fxShockwave(spGp.x,spGp.y);
    for(const e of allNear){
      const dmg=Math.floor((G.atkDmg+G.str)*effDmg);e.hp-=dmg;e.hitFlash=1;
      // Knockback
      const angle=Math.atan2(e.row-G.row,e.col-G.col);
      e.col+=Math.cos(angle)*3;e.row+=Math.sin(angle)*3;
      spawnFloat(ISO.toScreen(e.col,e.row).x,ISO.toScreen(e.col,e.row).y-15,`💥${dmg}`,'#ff6b35');
      if(e.hp<=0)killEnemy(e);
    }
    addLog(`💥 Onde de Choc Niv.${s.spellLvl}: ${allNear.length} repoussés`,'log-spell');
    gainSpellXp('shockwave',allNear.length+1);

  }else if(def.id==='frostbolt'&&near[0]){
    const tgt=near[0];const ep2=ISO.toScreen(tgt.col,tgt.row);
    const dmg=Math.floor((G.atkDmg*.5+Math.floor(G.int*1.8))*effDmg);
    tgt.hp-=dmg;tgt.hitFlash=1;
    // Freeze: reduce speed drastically
    const origSpd=tgt._origSpd||tgt.spd;tgt._origSpd=origSpd;
    tgt.spd=origSpd*.2;tgt.slow=.8;
    setTimeout(()=>{tgt.spd=origSpd;tgt.slow=0;},2000*(1+(s.spellLvl-1)*.1));
    spawnFloat(ep2.x,ep2.y-20,`🧊${dmg}`,'#80d8ff');
    spawnPart(ep2.x,ep2.y,8,'#80d8ff',2,.4);
    addLog(`🧊 Givre Niv.${s.spellLvl}: ${dmg} + gelé!`,'log-spell');
    if(tgt.hp<=0)killEnemy(tgt);
    gainSpellXp('frostbolt',2);

  }else if(def.id==='voidpulse'){
    const voidNear=state.enemies.filter(e=>dist(G,e)<5);
    const dotDmg=Math.floor((G.int*2.5)*effDmg/(5));
    for(const e of voidNear){applyDot(e,'void',dotDmg,5,1);}
    const vp=ISO.toScreen(G.col,G.row);
    spawnPart(vp.x,vp.y,20,'#ce93d8',4,1);
    spawnFloat(vp.x,vp.y-30,`🌀×${voidNear.length}`,'#ce93d8');
    addLog(`🌀 Pulsion du Vide Niv.${s.spellLvl}: DOT void ×${voidNear.length}`,'log-spell');
    gainSpellXp('voidpulse',voidNear.length+1);

  }else if(def.id==='earthquake'){
    const allE=state.enemies.filter(e=>dist(G,e)<12);
    const eqGp=ISO.toScreen(G.col,G.row);fxQuake(eqGp.x,eqGp.y);
    for(const e of allE){
      const dmg=Math.floor((G.atkDmg+Math.floor(G.str*1.5))*effDmg);e.hp-=dmg;e.hitFlash=1;
      spawnFloat(ISO.toScreen(e.col,e.row).x,ISO.toScreen(e.col,e.row).y-15,`🌍${dmg}`,'#a1887f');
      if(e.hp<=0)killEnemy(e);
    }
    addLog(`🌍 Séisme Massif Niv.${s.spellLvl}: ${allE.length} ennemis!`,'log-spell');
    gainSpellXp('earthquake',allE.length+2);

  }else if(def.id==='soulstorm'){
    const targets=state.enemies.slice().sort(()=>Math.random()-.5).slice(0,5);
    addLog(`👻 Tempête des Âmes Niv.${s.spellLvl}: ${targets.length} âmes!`,'log-spell');
    const ssGp=ISO.toScreen(G.col,G.row);
    for(let si=0;si<targets.length;si++){
      setTimeout(()=>{
        const e=targets[si];if(!e||!state.enemies.includes(e))return;
        const dmg=Math.floor((G.int*1.8)*effDmg);e.hp-=dmg;e.hitFlash=1;
        const ep3=ISO.toScreen(e.col,e.row);
        spawnFloat(ep3.x,ep3.y-18,`👻${dmg}`,'#e1bee7');
        spawnPart(ep3.x,ep3.y,6,'#e1bee7',2,.4);
        if(e.hp<=0)killEnemy(e);
      },si*200);
    }
    gainSpellXp('soulstorm',targets.length+1);
  }
  // bloodpact is passive — handled in updateGolem

  // soulharvest is passive — handled in killEnemy
}
  // ── Multicast echo (50% bonus DMG, no MP cost, slight delay) ─────────
  if(_doMulticast&&state.enemies.length>0){
    setTimeout(()=>{
      if(state.enemies.length===0)return;
      const echoDef={...def,dmgMult:(def.dmgMult||1)*.5,dotDur:(def.dotDur||3)*.5};
      const echoS={...s,timer:0,mpMastery:999}; // no MP on echo
      addLog(`🔁 ECHO: ${def.name}!`,'log-spell');
      castSpell(echoDef,echoS,G,1);
    },400);
  }
}

