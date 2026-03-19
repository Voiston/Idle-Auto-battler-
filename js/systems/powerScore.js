// ══ POWER SCORE ═══════════════════════════════════════════════════════
function calcPowerScore(){
  const G = state.golem;

  // Base character stats
  let ps = Math.floor(
    G.maxHp      * 0.8  +
    G.maxMp      * 0.5  +
    G.atkDmg     * 12   +
    G.str        * 8    +
    G.int        * 8    +
    G.def        * 10   +
    G.spd        * 15   +
    G.critChance * 20   +
    G.atkSpd     * 60   +
    (G.resFire||0)* 5   +
    (G.resIce||0) * 5   +
    (G.resVoid||0)* 5
  );

  // Character level & wave progression
  ps += G.level * 30;
  ps += (state.maxWave||state.wave) * 10;

  // Upgrade tree contribution
  const upgrades = G.upgrades || {};
  for(const [id, lvl] of Object.entries(upgrades)){
    const def = UPG_DEFS.find(u=>u.id===id);
    if(def) ps += lvl * def.costBase * 0.8;
  }

  // Spell mastery & tiers
  ps += state.activeSpells.filter(s=>s.unlocked).length * 25;
  ps += state.activeSpells.reduce((n,s)=>n+(s.spellTier||0)*80, 0);
  ps += state.activeSpells.reduce((n,s)=>n+Math.floor((s.spellLvl||1)*1.5), 0);

  // Equipped items (base stats + ilvl bonus + affixes)
  for(const it of Object.values(G.equipped)){
    if(!it) continue;
    const statSum = Object.values(it.stats||{}).reduce((a,b)=>a+Math.abs(b),0);
    const ilvlBonus = (it.ilvl||1) * 8;
    const affixBonus = (it.affixes||[]).length * 15;
    const rarityBonus = {common:0,uncommon:10,rare:30,epic:60,legendary:120}[it.rarity]||0;
    ps += statSum * 2 + ilvlBonus + affixBonus + rarityBonus;
  }

  // Active set bonuses
  for(const [setId, count] of Object.entries(state._activeSets||{})){
    const def = SET_DEFS[setId]; if(!def) continue;
    const maxThr = Math.max(...Object.keys(def.bonuses).map(Number).filter(t=>count>=t), 0);
    ps += maxThr * 150;
  }

  // Inventory value (10% contribution)
  for(const it of state.inventory){
    const rarVal = {common:1,uncommon:3,rare:8,epic:20,legendary:50}[it.rarity]||1;
    ps += rarVal;
  }

  return Math.floor(ps);
}
