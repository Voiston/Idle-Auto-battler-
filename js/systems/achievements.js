// ══ ACHIEVEMENT SYSTEM ═══════════════════════════════════════════════
// Each entry = one tier of a multi-tier achievement
// tier field links tiers together (same base id)
const ACH_DEFS=[
  // ── KILLS (4 tiers) ──────────────────────────────────────────────
  {id:'kill_t1', tier:1,icon:'🩸',name:'Premier Sang',       desc:'Tuer 1 ennemi',         cat:'combat', target:1,    stat:'totalKills',      reward:'+3 ATK',              bonusFn:(G)=>{G.baseStats.atkDmg+=3;}},
  {id:'kill_t2', tier:2,icon:'💀',name:'Cent Lames',          desc:'100 ennemis tués',       cat:'combat', target:100,  stat:'totalKills',      reward:'+5 STR',              bonusFn:(G)=>{G.baseStats.str+=5;}},
  {id:'kill_t3', tier:3,icon:'⚔️',name:'Boucher',             desc:'500 ennemis tués',       cat:'combat', target:500,  stat:'totalKills',      reward:'+10 ATK',             bonusFn:(G)=>{G.baseStats.atkDmg+=10;}},
  {id:'kill_t4', tier:4,icon:'🔱',name:'Exterminateur',       desc:'2000 ennemis tués',      cat:'combat', target:2000, stat:'totalKills',      reward:'+20% crit chance',    bonusFn:(G)=>{G.baseStats.critChance+=20;}},
  // ── CRITIQUES (3 tiers) ──────────────────────────────────────────
  {id:'crit_t1', tier:1,icon:'🎯',name:"Tireur d'Elite I",   desc:'50 critiques',           cat:'combat', target:50,   stat:'totalCrits',      reward:'+0.15 ATK Speed',     bonusFn:(G)=>{G.baseStats.atkSpd+=.15;}},
  {id:'crit_t2', tier:2,icon:'⚡',name:"Tireur d'Elite II",  desc:'500 critiques',          cat:'combat', target:500,  stat:'totalCrits',      reward:'+10% DMG crit',       bonusFn:(G)=>{G.critDmgBonus=(G.critDmgBonus||0)+.10;}},
  {id:'crit_t3', tier:3,icon:'💫',name:"Tireur d'Elite III", desc:'2000 critiques',         cat:'combat', target:2000, stat:'totalCrits',      reward:'+5% crit chance',     bonusFn:(G)=>{G.baseStats.critChance+=5;}},
  // ── INVULNERABILITE (3 tiers) ─────────────────────────────────────
  {id:'nohit_t1',tier:1,icon:'🛡️',name:'Intouchable I',       desc:'10 kills sans dégâts',   cat:'combat', target:10,   stat:'noHitKills',      reward:'+5 DEF',              bonusFn:(G)=>{G.baseStats.def+=5;}},
  {id:'nohit_t2',tier:2,icon:'🔰',name:'Intouchable II',       desc:'50 kills sans dégâts',   cat:'combat', target:50,   stat:'noHitKills',      reward:'+10 DEF + 3% reduc',  bonusFn:(G)=>{G.baseStats.def+=10;G.dmgReduction=(G.dmgReduction||0)+.03;}},
  {id:'nohit_t3',tier:3,icon:'⚜️',name:'Intouchable III',      desc:'200 kills sans dégâts',  cat:'combat', target:200,  stat:'noHitKills',      reward:'+15 DEF + 5% reduc',  bonusFn:(G)=>{G.baseStats.def+=15;G.dmgReduction=(G.dmgReduction||0)+.05;}},
  // ── VAGUES (4 tiers) ─────────────────────────────────────────────
  {id:'wave_t1', tier:1,icon:'🌊',name:'Survivant',            desc:'Vague 5',                cat:'waves',  target:5,    stat:'maxWave',         reward:'+20 HP MAX',          bonusFn:(G)=>{G.baseStats.maxHp+=20;}},
  {id:'wave_t2', tier:2,icon:'🌋',name:'Guerrier',             desc:'Vague 15',               cat:'waves',  target:15,   stat:'maxWave',         reward:'+8 DEF',              bonusFn:(G)=>{G.baseStats.def+=8;}},
  {id:'wave_t3', tier:3,icon:'👑',name:'Conquérant',           desc:'Vague 30',               cat:'waves',  target:30,   stat:'maxWave',         reward:'+15 INT',             bonusFn:(G)=>{G.baseStats.int+=15;}},
  {id:'wave_t4', tier:4,icon:'🌌',name:'Légendaire',           desc:'Vague 50',               cat:'waves',  target:50,   stat:'maxWave',         reward:'+1 Slot sort',        bonusFn:(G)=>{if((G.spellSlotsMax||4)<6){G.spellSlotsMax=(G.spellSlotsMax||4)+1;G.equippedSpells.push(null);addSpellSlotHTML();}}},
  // ── BOSS (3 tiers) ───────────────────────────────────────────────
  {id:'boss_t1', tier:1,icon:'💥',name:'Chasseur de Boss I',   desc:'1 boss tué',             cat:'waves',  target:1,    stat:'bossKills',       reward:'+10% or drops',       bonusFn:(G)=>{G.goldBonus=(G.goldBonus||1)+.10;}},
  {id:'boss_t2', tier:2,icon:'🏅',name:'Chasseur de Boss II',  desc:'5 boss tués',            cat:'waves',  target:5,    stat:'bossKills',       reward:'+10% HP MAX',         bonusFn:(G)=>{G.baseStats.maxHp=Math.floor(G.baseStats.maxHp*1.10);}},
  {id:'boss_t3', tier:3,icon:'🏆',name:'Dompteur de Titans',   desc:'10 boss tués',           cat:'waves',  target:10,   stat:'bossKills',       reward:'+1 Slot sort',        bonusFn:(G)=>{if((G.spellSlotsMax||4)<6){G.spellSlotsMax=(G.spellSlotsMax||4)+1;G.equippedSpells.push(null);addSpellSlotHTML();}}},
  // ── OR (3 tiers) ─────────────────────────────────────────────────
  {id:'gold_t1', tier:1,icon:'💰',name:'Commerçant',           desc:'1 000 gold accumulés',   cat:'economy',target:1000,  stat:'totalGoldEarned', reward:'+0.5 MP regen/s',     bonusFn:(G)=>{G.mpRegen=(G.mpRegen||2)+.5;}},
  {id:'gold_t2', tier:2,icon:'💎',name:'Trésorier',            desc:'10 000 gold accumulés',  cat:'economy',target:10000, stat:'totalGoldEarned', reward:'+30 HP MAX',          bonusFn:(G)=>{G.baseStats.maxHp+=30;}},
  {id:'gold_t3', tier:3,icon:'🏦',name:'Magnat',               desc:'50 000 gold accumulés',  cat:'economy',target:50000, stat:'totalGoldEarned', reward:'+10% gold drops',     bonusFn:(G)=>{G.goldBonus=(G.goldBonus||1)+.10;}},
  // ── MAGIE (4 tiers) ──────────────────────────────────────────────
  {id:'magic_t1',tier:1,icon:'📖',name:'Apprenti Mage',        desc:'Apprendre 1 sort',       cat:'magic',  target:1,    stat:'totalSpellsLearned',reward:'+5 INT',            bonusFn:(G)=>{G.baseStats.int+=5;}},
  {id:'magic_t2',tier:2,icon:'🌟',name:'Grimoire Complet',     desc:'Apprendre 15 sorts',     cat:'magic',  target:15,   stat:'totalSpellsLearned',reward:'+15% DMG sorts',    bonusFn:(G)=>{G.spellDmgBonus=(G.spellDmgBonus||1)+.15;}},
  {id:'mastery_t1',tier:1,icon:'⭐',name:'Maître Sort I',      desc:'1 sort maîtrise MAX',    cat:'magic',  target:1,    stat:'totalMaxMastery', reward:'+10 MP MAX',          bonusFn:(G)=>{G.baseStats.maxMp+=10;}},
  {id:'mastery_t2',tier:2,icon:'🌠',name:'Maître Sort II',     desc:'5 sorts maîtrise MAX',   cat:'magic',  target:5,    stat:'totalMaxMastery', reward:'+20 MP + 5% DMG',     bonusFn:(G)=>{G.baseStats.maxMp+=20;G.spellDmgBonus=(G.spellDmgBonus||1)+.05;}},
  {id:'tier_t1', tier:1,icon:'💡',name:'Élu Arcanique I',      desc:'Sort Tier 1',            cat:'magic',  target:1,    stat:'totalSpellTiers', reward:'+8% DMG sorts',       bonusFn:(G)=>{G.spellDmgBonus=(G.spellDmgBonus||1)+.08;}},
  {id:'tier_t2', tier:2,icon:'🔥',name:'Élu Arcanique II',     desc:'Tier total ≥ 5',         cat:'magic',  target:5,    stat:'totalSpellTiers', reward:'+12% DMG sorts',      bonusFn:(G)=>{G.spellDmgBonus=(G.spellDmgBonus||1)+.12;}},
  {id:'tier_t3', tier:3,icon:'🌟',name:'Archmage',             desc:'Sort Tier 5',            cat:'magic',  target:5,    stat:'maxSpellTier',    reward:'+10 INT + 25 MP',     bonusFn:(G)=>{G.baseStats.int+=10;G.baseStats.maxMp+=25;}},
];

const state_ach={unlocked:new Set(),progress:{}};

function getAchProgress(id){
  const def=ACH_DEFS.find(a=>a.id===id);if(!def)return 0;
  const G=state.golem;
  const stats={
    totalKills:state.totalKills,
    totalCrits:state.totalCrits||0,
    maxWave:state.maxWave||state.wave,
    bossKills:state.bossKills||0,
    totalGoldEarned:state.totalGoldEarned||0,
    totalSpellsLearned:state.activeSpells.filter(s=>s.unlocked).length,
    totalMaxMastery:state.activeSpells.filter(s=>s.spellLvl>=SPELL_MAX_LVL).length,
    totalSpellTiers:state.activeSpells.reduce((n,s)=>n+(s.spellTier||0),0),
    noHitKills:state.noHitKills||0,
    maxSpellTier:state.activeSpells.reduce((m,s)=>Math.max(m,s.spellTier||0),0),
  };
  return stats[def.stat]||0;
}

function checkAchievements(){
  const G=state.golem;
  for(const def of ACH_DEFS){
    if(state_ach.unlocked.has(def.id))continue;
    const prog=getAchProgress(def.id);
    if(prog>=def.target){
      state_ach.unlocked.add(def.id);
      def.bonusFn(G);
      recalcStats();
      addLog(`🏆 DÉFI: ${def.name}! ${def.reward}`,'log-spell');
      showToastMsg(`🏆 ${def.icon} ${def.name}\n${def.reward}`,'#ffc107');
      const gp=ISO.toScreen(G.col,G.row);
      spawnPart(gp.x,gp.y,25,'#ffc107',5,1.5);
      spawnFloat(gp.x,gp.y-40,'🏆 DÉFI!','#ffc107');
      renderAchievements();
    }
  }
}

function renderAchievements(){
  const list=document.getElementById('ach-list');if(!list)return;
  const cats={combat:'⚔️ Combat',waves:'🌊 Vagues',economy:'💰 Économie',magic:'✨ Magie'};
  let html='';
  for(const[cat,label] of Object.entries(cats)){
    const defs=ACH_DEFS.filter(a=>a.cat===cat);
    html+=`<div class="ach-section-title">${label}</div>`;
    for(const def of defs){
      const unlocked=state_ach.unlocked.has(def.id);
      const prog=Math.min(def.target,getAchProgress(def.id));
      const pct=Math.floor(prog/def.target*100);
      const tierBadge=def.tier?`<span style="font-size:8px;background:rgba(255,193,7,.15);color:var(--gold);border:1px solid rgba(255,193,7,.3);border-radius:3px;padding:1px 5px;margin-left:4px;">T${def.tier}</span>`:'';
      html+=`<div class="ach-item${unlocked?' unlocked':''}">
        <div class="ach-icon">${def.icon}</div>
        <div class="ach-info">
          <div class="ach-name">${def.name}${tierBadge}</div>
          <div class="ach-desc">${def.desc}</div>
          <div class="ach-reward">${unlocked?'✓ ':''}${def.reward}</div>
          ${!unlocked?`<div class="ach-progress-bar"><div class="ach-progress-fill" style="width:${pct}%"></div></div>
          <div style="font-size:8px;color:var(--muted);margin-top:1px">${prog}/${def.target}</div>`:''}
        </div>
        <div class="ach-badge">${unlocked?'✅':''}</div>
      </div>`;
    }
  }
  list.innerHTML=html;
}

