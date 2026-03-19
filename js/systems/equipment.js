// ══ EQUIPMENT ENGINE ══════════════════════════════════════════════════
function recalcStats(){
  const G=state.golem;const B=G.baseStats;
  G.str=B.str;G.int=B.int;G.spd=B.spd;G.def=B.def;G.atkDmg=B.atkDmg;
  G.critChance=B.critChance;G.maxHp=B.maxHp;G.maxMp=B.maxMp;G.atkSpd=B.atkSpd;
  G.resFire=B.resFire||0;G.resIce=B.resIce||0;G.resVoid=B.resVoid||0;
  for(const it of Object.values(G.equipped)){
    if(!it)continue;
    for(const[k,v]of Object.entries(it.stats)){const p=STAT_MAP[k];if(p)G[p]+=v;}
  }
  G.hp=Math.min(G.hp,G.maxHp);G.mp=Math.min(G.mp,G.maxMp);
  G.critChance=Math.max(1,Math.min(80,G.critChance));G.spd=Math.max(1,G.spd);G.def=Math.max(0,G.def);
  G.resFire=Math.min(75,G.resFire||0);G.resIce=Math.min(75,G.resIce||0);G.resVoid=Math.min(75,G.resVoid||0);
}
function equipItem(item){
  const G=state.golem;if(!item.slot)return;
  if(G.equipped[item.slot]) state.inventory.push(G.equipped[item.slot]);
  G.equipped[item.slot]=item;
  const idx=state.inventory.findIndex(i=>i.uid===item.uid);if(idx!==-1)state.inventory.splice(idx,1);
  recalcStats();addLog(`⚔️ ${item.icon} ${item.name} équipé!`,'log-spell');
  if(typeof SFX!=='undefined')SFX.equip();
  showToastMsg(item.icon+' '+item.name+' équipé!','#00e5ff');
  renderInventory();renderEquip();updateUI();
}
function unequipSlot(slot){
  const G=state.golem;const item=G.equipped[slot];if(!item)return;
  if(state.inventory.length>=24){showToastMsg('Inventaire plein!','#ef4444');return;}
  G.equipped[slot]=null;state.inventory.push(item);recalcStats();
  addLog(`↩️ ${item.name} déséquipé`,'log-warn');renderInventory();renderEquip();updateUI();
}
function getEquipComparison(item){
  const G=state.golem;const cur=G.equipped[item.slot];
  const allK=new Set([...Object.keys(item.stats||{}),...(cur?Object.keys(cur.stats||{}):[] )]);
  return [...allK].map(k=>({key:k,newVal:item.stats?.[k]||0,curVal:cur?.stats?.[k]||0,diff:(item.stats?.[k]||0)-(cur?.stats?.[k]||0)}));
}

// ══ SET SYSTEM ════════════════════════════════════════════════════════
// Sets: each item has an optional setId. When 2+ pieces of the same set
// are equipped, bonuses activate. Bonuses can buff stats OR unlock spells.

const SET_DEFS = {

  // ── SET 1 : Fureur du Berserker (STR / physique) ──────────────────
  berserker_set: {
    name: "Fureur du Berserker",
    icon: "⚔️",
    color: "#ff6d00",
    pieces: ['sb1','sb2','sb3','sb4'],
    bonuses: {
      2: {
        label: "2 pièces",
        desc: "+25% ATK, +10% crit",
        apply(G){ G.atkDmg = Math.floor(G.atkDmg*1.25); G.critChance = Math.min(80,G.critChance+10); }
      },
      3: {
        label: "3 pièces",
        desc: "Berserker auto-cast toutes les 12s",
        spellUnlock: 'berserker',
        apply(G){ G._setBerserkerAuto = true; }
      },
      4: {
        label: "4 pièces",
        desc: "+80% DMG crit, vitesse attaque ×1.4",
        apply(G){ G.critDmgBonus=(G.critDmgBonus||0)+.80; G.atkSpd*=1.4; }
      }
    }
  },

  // ── SET 2 : Mystères de l'Arcane (INT / sorts) ────────────────────
  arcane_set: {
    name: "Mystères de l'Arcane",
    icon: "🔮",
    color: "#7c4dff",
    pieces: ['sa1','sa2','sa3','sa4'],
    bonuses: {
      2: {
        label: "2 pièces",
        desc: "+35% DMG sorts, +30 MP MAX",
        apply(G){ G.spellDmgBonus=(G.spellDmgBonus||1)*1.35; G.maxMp+=30; G.mp=Math.min(G.mp+30,G.maxMp); }
      },
      3: {
        label: "3 pièces",
        desc: "Tempête Arcane auto-cast toutes les 15s",
        spellUnlock: 'arcstorm',
        apply(G){ G._setArcstormAuto = true; }
      },
      4: {
        label: "4 pièces",
        desc: "Tous les sorts: CD ×0.5, MP ×0.5",
        apply(G){ G._setArcaneMastery = true; }
      }
    }
  },

  // ── SET 3 : Carapace du Titan (DEF / survie) ──────────────────────
  titan_set: {
    name: "Carapace du Titan",
    icon: "🛡️",
    color: "#29b6f6",
    pieces: ['st1','st2','st3','st4'],
    bonuses: {
      2: {
        label: "2 pièces",
        desc: "+40% HP MAX, +15 DEF",
        apply(G){ G.maxHp=Math.floor(G.maxHp*1.4); G.def+=15; G.hp=Math.min(G.hp,G.maxHp); }
      },
      3: {
        label: "3 pièces",
        desc: "Bouclier auto-cast toutes les 20s",
        spellUnlock: 'shield',
        apply(G){ G._setShieldAuto = true; }
      },
      4: {
        label: "4 pièces",
        desc: "20% des dégâts reçus absorbés + régén 3% HP/s",
        apply(G){ G.dmgReduction=(G.dmgReduction||0)+.20; G.hpRegen=(G.hpRegen||1)+3; }
      }
    }
  },


  // ── Set 5: Foudre de Tal Rasha (élémentaire, 5 pièces) ────────────
  talrasha_set: {
    name: "Foudre de Tal Rasha",
    icon: "⚡",
    color: "#29b6f6",
    pieces: ['tr1','tr2','tr3','tr4','tr5'],
    bonuses: {
      2: {
        label: "2 pièces",
        desc: "+30% DMG sorts, résistances élémentaires +20% chacune",
        apply(G){ G.spellDmgBonus=(G.spellDmgBonus||1)*1.30; G.resFire=Math.min(75,(G.resFire||0)+20); G.resIce=Math.min(75,(G.resIce||0)+20); G.resVoid=Math.min(75,(G.resVoid||0)+20); }
      },
      3: {
        label: "3 pièces",
        desc: "Hydre de Feu auto-cast toutes les 10s",
        spellUnlock: 'hydra',
        apply(G){ G._setHydraAuto=true; }
      },
      4: {
        label: "4 pièces",
        desc: "Chaque élément applique +15% DMG sorts pendant 5s (stack jusqu'à 3×)",
        apply(G){ G._setTalrashaElementalBuff=true; }
      },
      5: {
        label: "5 pièces",
        desc: "Pacte Stellaire auto-cast toutes les 25s + CD sorts élémentaires ×0.4",
        spellUnlock: 'starPact',
        apply(G){ G._setStarPactAuto=true; G.spellDmgBonus=(G.spellDmgBonus||1)*1.20; }
      }
    }
  },
  // ── SET 4 : Ombre du Néant (void / abyssal) ───────────────────────
  void_set: {
    name: "Ombre du Néant",
    icon: "🌑",
    color: "#ce93d8",
    pieces: ['sv1','sv2','sv3','sv4'],
    bonuses: {
      2: {
        label: "2 pièces",
        desc: "+50% Rés. Vide, +20 INT, Déchirement auto-cast",
        spellUnlock: 'soulrip',
        apply(G){ G.resVoid=Math.min(75,(G.resVoid||0)+50); G.int+=20; G._setVoidAuto=true; }
      },
      3: {
        label: "3 pièces",
        desc: "Chaque kill: +1% DMG temporaire (30s, max 50%)",
        apply(G){ G._setVoidKillBuff=true; }
      },
      4: {
        label: "4 pièces",
        desc: "Téléportation auto-cast + DMG sorts void ×2",
        spellUnlock: 'blink',
        apply(G){ G._setBlinkAuto=true; G.spellDmgBonus=(G.spellDmgBonus||1)*2; }
      }
    }
  },
};

// Active set bonuses — called from recalcStats AFTER equip stats applied
function applySetBonuses(){
  const G = state.golem;
  // Reset all set flags
  G._setBerserkerAuto=false; G._setArcstormAuto=false;
  G._setShieldAuto=false; G._setArcaneMastery=false;
  G._setVoidAuto=false; G._setVoidKillBuff=false; G._setBlinkAuto=false;
  G._setHydraAuto=false; G._setStarPactAuto=false; G._setTalrashaElementalBuff=false;

  const activeSets = {};
  for(const it of Object.values(G.equipped)){
    if(!it||!it.setId) continue;
    activeSets[it.setId] = (activeSets[it.setId]||0)+1;
  }

  // Compare to previous to detect newly activated thresholds
  const prev = state._prevActiveSets || {};
  state._activeSets = activeSets;

  for(const[setId, count] of Object.entries(activeSets)){
    const def = SET_DEFS[setId]; if(!def) continue;
    const thresholds = Object.keys(def.bonuses).map(Number).sort((a,b)=>a-b);
    for(const thr of thresholds){
      if(count >= thr){
        // New threshold just reached?
        const wasActive = (prev[setId]||0) >= thr;
        const isNew = !wasActive;
        def.bonuses[thr].apply(G);
        if(isNew && typeof SFX!=='undefined')SFX.setBonus();
        if(isNew && typeof triggerSetFlash!=='undefined'){
          triggerSetFlash(def.color, `${def.icon} ${def.name} ×${thr}`);
        }
        // Auto-unlock set spell if needed
        const sid = def.bonuses[thr].spellUnlock;
        if(sid){ const sp=getSpellState(sid); if(sp&&!sp.unlocked){sp.unlocked=true; addLog(`✨ Set: ${def.name} débloque ${sid}!`,'log-spell');} }
      }
    }
  }
}

// Patch recalcStats to call applySetBonuses after equip loop
const _origRecalcStats = recalcStats;
recalcStats = function(){
  _origRecalcStats();
  if(typeof applySetBonuses==='function') applySetBonuses();
};

// Set bonus auto-casts (checked in updateSpells tick)
function updateSetAutoCasts(dt){
  const G=state.golem;
  if(!state._activeSets||Object.keys(state._activeSets).length===0) return;

  // Berserker auto-cast (set 1, 3 pièces)
  if(G._setBerserkerAuto){
    if(!G._berserkerAutoTimer) G._berserkerAutoTimer=12;
    G._berserkerAutoTimer-=dt;
    if(G._berserkerAutoTimer<=0){
      G._berserkerAutoTimer=12;
      const s=getSpellState('berserker');const d=getSpellDef('berserker');
      if(s&&d){castSpell(d,s,G,state.enemies.filter(e=>dist(G,e)<4));}
    }
  }
  // Arcstorm auto-cast (set 2, 3 pièces)
  if(G._setArcstormAuto){
    if(!G._arcstormAutoTimer) G._arcstormAutoTimer=15;
    G._arcstormAutoTimer-=dt;
    if(G._arcstormAutoTimer<=0){
      G._arcstormAutoTimer=15;
      const s=getSpellState('arcstorm');const d=getSpellDef('arcstorm');
      if(s&&d){castSpell(d,s,G,state.enemies.filter(e=>dist(G,e)<8));}
    }
  }
  // Shield auto-cast (set 3, 3 pièces)
  if(G._setShieldAuto){
    if(!G._shieldAutoTimer) G._shieldAutoTimer=20;
    G._shieldAutoTimer-=dt;
    if(G._shieldAutoTimer<=0){
      G._shieldAutoTimer=20;
      const s=getSpellState('shield');const d=getSpellDef('shield');
      if(s&&d&&s.unlocked){castSpell(d,s,G,[]);}
    }
  }
  // Soulrip auto-cast (set 4, 2 pièces)
  if(G._setVoidAuto){
    if(!G._soulripAutoTimer) G._soulripAutoTimer=9;
    G._soulripAutoTimer-=dt;
    if(G._soulripAutoTimer<=0){
      G._soulripAutoTimer=9;
      const near=state.enemies.filter(e=>dist(G,e)<4);
      const s=getSpellState('soulrip');const d=getSpellDef('soulrip');
      if(s&&d&&near[0]){castSpell(d,s,G,near);}
    }
  }
  // Hydra auto-cast (Tal Rasha 3 pièces)
  if(G._setHydraAuto){
    if(!G._hydraAutoTimer)G._hydraAutoTimer=10;
    G._hydraAutoTimer-=dt;
    if(G._hydraAutoTimer<=0){
      G._hydraAutoTimer=10;
      const s=getSpellState('hydra');const d=getSpellDef('hydra');
      if(s&&d){castSpell(d,s,G,state.enemies.filter(e=>dist(G,e)<8));}
    }
  }
  // StarPact auto-cast (Tal Rasha 5 pièces)
  if(G._setStarPactAuto){
    if(!G._starPactAutoTimer)G._starPactAutoTimer=25;
    G._starPactAutoTimer-=dt;
    if(G._starPactAutoTimer<=0){
      G._starPactAutoTimer=25;
      const s=getSpellState('starPact');const d=getSpellDef('starPact');
      if(s&&d){castSpell(d,s,G,state.enemies);}
    }
  }
  // Blink auto-cast (set 4, 4 pièces)
  if(G._setBlinkAuto){
    if(!G._blinkAutoTimer) G._blinkAutoTimer=18;
    G._blinkAutoTimer-=dt;
    if(G._blinkAutoTimer<=0){
      G._blinkAutoTimer=18;
      const near=state.enemies.filter(e=>dist(G,e)<10);
      const s=getSpellState('blink');const d=getSpellDef('blink');
      if(s&&d&&near[0]){castSpell(d,s,G,near);}
    }
  }
  // Set Arcane Mastery: CD/MP reduction applied dynamically in castSpell
  // (checked via G._setArcaneMastery flag)
}

function getSetSummary(){
  const sets = state._activeSets||{};
  const result=[];
  for(const[setId,count] of Object.entries(sets)){
    const def=SET_DEFS[setId];if(!def)continue;
    const thresholds=Object.keys(def.bonuses).map(Number).sort((a,b)=>a-b);
    const active=thresholds.filter(t=>count>=t);
    result.push({setId,def,count,maxPieces:def.pieces.length,active});
  }
  return result;
}
