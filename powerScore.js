// ══ POWER SCORE ═══════════════════════════════════════════════════════
function calcPowerScore(){
  const G=state.golem;
  // Weighted sum of all stats
  const ps=Math.floor(
    G.maxHp     * 0.8  +
    G.maxMp     * 0.5  +
    G.atkDmg    * 12   +
    G.str       * 8    +
    G.int       * 8    +
    G.def       * 10   +
    G.spd       * 15   +
    G.critChance* 20   +
    G.atkSpd    * 60   +
    (G.resFire||0)*5   +
    (G.resIce||0)*5    +
    (G.resVoid||0)*5   +
    G.level     * 30   +
    state.wave  * 10   +
    // Spell contributions
    state.activeSpells.filter(s=>s.unlocked).length * 25 +
    state.activeSpells.reduce((n,s)=>n+(s.spellTier||0)*40,0) +
    state.activeSpells.reduce((n,s)=>n+Math.floor((s.spellLvl||1)*2),0)
  );
  return ps;
}

