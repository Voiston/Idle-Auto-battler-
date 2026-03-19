// ══ UPGRADE TREE DEFINITIONS ══════════════════════════════════════════
// Each node: id, name, icon, desc, branch, maxLvl, costBase (×tier), effect(G,lvl)
const UPG_DEFS=[
  // ── COMBAT ───────────────────────────────────────────────────────
  {id:'str_up',   name:'Force Brute',      icon:'💪',branch:'combat',   maxLvl:100,costBase:25, desc:'+3 STR/niv',          effect:(G)=>{G.baseStats.str+=3;}},
  {id:'atk_up',   name:'Lame Acérée',      icon:'⚔️',branch:'combat',   maxLvl:100,costBase:35, desc:'+5 ATK/niv',          effect:(G)=>{G.baseStats.atkDmg+=5;}},
  {id:'aspd_up',  name:'Furie Rapide',     icon:'⚡',branch:'combat',   maxLvl:80, costBase:50, desc:'+0.1 ATK Vitesse/niv', effect:(G)=>{G.baseStats.atkSpd+=.1;}},
  {id:'crit_up',  name:'Oeil de Faucon',   icon:'🎯',branch:'combat',   maxLvl:100,costBase:45, desc:'+5% crit/niv',        effect:(G)=>{G.baseStats.critChance+=5;}},
  {id:'range_up', name:'Allonge',           icon:'🗡️',branch:'combat',   maxLvl:50, costBase:60, desc:'+0.1 portée attaque', effect:(G)=>{G.atkRange=(G.atkRange||1.6)+.1;}},
  {id:'vampire',  name:'Vampirisme',        icon:'🩸',branch:'combat',   maxLvl:50, costBase:80, desc:'+2% lifesteal base',  effect:(G)=>{G.baseLifesteal=(G.baseLifesteal||0)+.02;}},
  // ── MAGIC ────────────────────────────────────────────────────────
  {id:'int_up',   name:'Maitrise Magique',  icon:'🔮',branch:'magic',    maxLvl:100,costBase:30, desc:'+4 INT/niv',          effect:(G)=>{G.baseStats.int+=4;}},
  {id:'mp_up',    name:'Reservoir MP',      icon:'💎',branch:'magic',    maxLvl:100,costBase:25, desc:'+10 MP MAX/niv',      effect:(G)=>{G.baseStats.maxMp+=10;}},
  {id:'cd_up',    name:'Flux Arcanique',    icon:'🌀',branch:'magic',    maxLvl:80, costBase:65, desc:'-6% CD sorts/niv',    effect:(G)=>{G.cdReduction=(G.cdReduction||0)+.06;}},
  {id:'mpreg_up', name:'Flux Mana',         icon:'✨',branch:'magic',    maxLvl:80, costBase:35, desc:'+0.5 MP regen/s/niv', effect:(G)=>{G.mpRegen=(G.mpRegen||2)+.5;}},
  {id:'spelldmg', name:'Puissance Arcane',  icon:'⚗️',branch:'magic',    maxLvl:80, costBase:75, desc:'+5% DMG sorts/niv',   effect:(G)=>{G.spellDmgBonus=(G.spellDmgBonus||1)+.05;}},
  {id:'multicast',name:'Doublon Magique',   icon:'🔁',branch:'magic',    maxLvl:50, costBase:120,desc:'+5% chance double sort',effect:(G)=>{G.multicastChance=(G.multicastChance||0)+.05;}},
  // ── SURVIE ───────────────────────────────────────────────────────
  {id:'hp_up',    name:'Coeur de Pierre',   icon:'❤️',branch:'survival', maxLvl:120,costBase:20, desc:'+20 HP MAX/niv',      effect:(G)=>{G.baseStats.maxHp+=20;}},
  {id:'def_up',   name:"Peau d'Acier",      icon:'🛡️',branch:'survival', maxLvl:100,costBase:30, desc:'+3 DEF/niv',          effect:(G)=>{G.baseStats.def+=3;}},
  {id:'regen_up', name:'Regeneration',      icon:'🌿',branch:'survival', maxLvl:80, costBase:40, desc:'+0.5 HP regen/s/niv', effect:(G)=>{G.hpRegen=(G.hpRegen||1)+.5;}},
  {id:'spd_up',   name:'Legerete',          icon:'💨',branch:'survival', maxLvl:80, costBase:45, desc:'+0.5 SPD/niv',        effect:(G)=>{G.baseStats.spd+=.5;}},
  {id:'tenacity', name:'Tenacite',          icon:'🦾',branch:'survival', maxLvl:50, costBase:90, desc:'+2% reduction degats', effect:(G)=>{G.dmgReduction=(G.dmgReduction||0)+.02;}},
  {id:'comeback', name:'Deuxieme Souffle',  icon:'💫',branch:'survival', maxLvl:50, costBase:150,desc:'+15% HP resurrection', effect:(G)=>{G.reviveBonus=(G.reviveBonus||.5)+.15;}},
];
