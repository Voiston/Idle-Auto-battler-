// ══ SPELL & ITEM DATA ═════════════════════════════════════════════════
const SPELL_DEFS=[
  {id:'basic',     name:'Frappe Basique',  icon:'🔩',desc:'Auto-attaque physique de base',          type:'passive',cd:0, mp:0, lvl:1,passive:true,tag:'passive'},
  {id:'slam',      name:'Séisme',          icon:'💥',desc:'200% ATK + onde de choc sur 1 cible',    type:'active', cd:4, mp:8, lvl:1,dmgMult:2.0,tag:'active'},
  {id:'shield',    name:'Bouclier',        icon:'🛡️',desc:'+50% DEF 4s + aura orbitale',            type:'active', cd:12,mp:12,lvl:2,buff:true,buffDur:4,tag:'active'},
  {id:'regen',     name:'Régén. Pierre',   icon:'🌿',desc:'Soigne 15% HP max toutes 8s',            type:'passive',cd:8, mp:5, lvl:2,healPct:.15,tag:'passive'},
  {id:'nova',      name:'Nova de Glace',   icon:'❄️',desc:'Zone hex — ralentit tous −40% 3s',       type:'active', cd:10,mp:18,lvl:3,aoe:true,slowPct:.4,slowDur:3,tag:'aoe'},
  {id:'chain',     name:'Éclair Chaîné',  icon:'⚡',desc:'Arc entre 3 ennemis (120% ATK)',          type:'active', cd:7, mp:14,lvl:3,chain:3,dmgMult:1.2,tag:'active'},
  {id:'berserker', name:'Berserker',       icon:'🔥',desc:'+80% ATK / −20% DEF pendant 5s',        type:'active', cd:15,mp:20,lvl:4,tag:'active'},
  {id:'meteor',    name:'Météorite',       icon:'☄️',desc:'5× ATK zone + impact visuel',            type:'active', cd:20,mp:30,lvl:5,aoe:true,dmgMult:5.0,tag:'aoe'},
  {id:'lifesteal', name:'Vol de Vie',      icon:'🩸',desc:'20% des dégâts physiques soignent HP',   type:'passive',cd:0, mp:0, lvl:4,leech:.20,tag:'passive'},
  {id:'critique',  name:'Maîtrise Crit.', icon:'🎯',desc:'+25% chance critique (passif permanent)', type:'passive',cd:0, mp:0, lvl:3,critBonus:25,tag:'passive'},
  // ── 5 NEW AOE SPELLS ──────────────────────────────────────────────
  {id:'toxiccloud', name:'Nuage Toxique',  icon:'🌫️',desc:'Zone poison 3s — 30% ATK/s sur tous',   type:'active', cd:9, mp:16,lvl:3,aoe:true,dmgMult:0.3,dotDur:3,tag:'aoe'},
  {id:'vortex',     name:'Vortex',         icon:'🌀',desc:'Aspire tous les ennemis vers le Golem', type:'active', cd:14,mp:22,lvl:4,aoe:true,tag:'aoe'},
  {id:'blizzard',   name:'Blizzard',       icon:'🌨️',desc:'Tempête 4s — ralentit −60% + dégâts',   type:'active', cd:18,mp:28,lvl:5,aoe:true,dmgMult:0.8,slowPct:.6,dotDur:4,tag:'aoe'},
  {id:'quake',      name:'Tremblement',    icon:'🌋',desc:'Onde sismique 360° — 150% ATK tous',    type:'active', cd:11,mp:20,lvl:4,aoe:true,dmgMult:1.5,tag:'aoe'},
  {id:'arcstorm',   name:'Tempête Arcane', icon:'⚡',desc:'Foudre aléatoire 5× sur ennemis 160%',  type:'active', cd:13,mp:24,lvl:5,aoe:true,dmgMult:1.6,hits:5,tag:'aoe'},
  // ── NEW SPELLS v2 ─────────────────────────────────────────────────
  {id:'counter',   name:'Contre-Attaque',  icon:'🔄',desc:'Réplique 200% ATK après chaque coup reçu (5s)',  type:'active', cd:16,mp:18,lvl:4,dmgMult:2.0,tag:'active'},
  {id:'haste',     name:'Hâte',            icon:'💨',desc:'+50% vitesse attaque + déplacement 6s',          type:'active', cd:14,mp:15,lvl:3,tag:'active'},
  {id:'thorns',    name:"Aura d'Epines",  icon:'🌵',desc:'Passif: 30% des dégâts reçus renvoyés',          type:'passive',cd:0, mp:0, lvl:5,thornPct:.30,tag:'passive'},
  {id:'soulrip',   name:'Déchirement',     icon:'💔',desc:'Réduit DEF cible de 40% pendant 4s (150% ATK)', type:'active', cd:9, mp:12,lvl:3,dmgMult:1.5,tag:'active'},
  {id:'blink',     name:'Téléportation',   icon:'⚡',desc:'Téléporte le Golem vers la cible + 300% ATK',    type:'active', cd:18,mp:22,lvl:5,dmgMult:3.0,tag:'active'},

  // ── NOUVEAUX SORTS DIABLO v3 ─────────────────────────────────────
  {id:'warcry',    name:'Cri de Guerre',  icon:'📣',desc:'+30% ATK/DEF/SPD à tous les sorts actifs 8s',   type:'active', cd:20,mp:18,lvl:5,tag:'active'},
  {id:'bonespear', name:"Lance d'Os",    icon:'🦴',desc:'Projectile perçant: 350% ATK sur ligne ennemis',type:'active', cd:8, mp:20,lvl:4,dmgMult:3.5,tag:'active'},
  {id:'soulharvest',name:"Moisson d'Ames",icon:'💠',desc:'Passif: +2% DMG permanent par ennemi tué (max 100)',type:'passive',cd:0,mp:0,lvl:6,tag:'passive'},
  {id:'sacrifice', name:'Sacrifice',       icon:'🩹',desc:'Consomme 25% HP pour soigner 80% HP max',        type:'active', cd:30,mp:0, lvl:6,tag:'active'},
];
const ITEMS=[
  {id:'h1',name:'Heaume de Fer',      icon:'⛑️',slot:'head', rarity:'common',   stats:{def:2}},
  {id:'b1',name:'Veste de Cuir',      icon:'🥋',slot:'body', rarity:'common',   stats:{def:3}},
  {id:'r1',name:'Bague de Cuivre',    icon:'💍',slot:'belt', rarity:'common',   stats:{str:1}},
  {id:'f1',name:'Sandales Usées',     icon:'🩴',slot:'boots',rarity:'common',   stats:{spd:1}},
  {id:'a1',name:'Brassards Simples',  icon:'🥊',slot:'arm1', rarity:'common',   stats:{str:2}},
  {id:'w1',name:'Dague Rouillée',     icon:'🗡️',slot:'arm2', rarity:'common',   stats:{atk:3}},
  {id:'h2',name:'Casque de Garde',    icon:'⛑️',slot:'head', rarity:'uncommon', stats:{def:4,str:1}},
  {id:'b2',name:'Armure de Plaques',  icon:'🪨',slot:'body', rarity:'uncommon', stats:{def:6,spd:-1}},
  {id:'a2',name:'Gants Tranchants',   icon:'🥊',slot:'arm1', rarity:'uncommon', stats:{str:3,atk:4}},
  {id:'w2',name:'Épée Courte',        icon:'⚔️',slot:'arm2', rarity:'uncommon', stats:{atk:6,str:2}},
  {id:'f2',name:'Bottes du Voyageur', icon:'👟',slot:'boots',rarity:'uncommon', stats:{spd:3,def:1}},
  {id:'r2',name:'Ceinture de Force',  icon:'🎗️',slot:'belt', rarity:'uncommon', stats:{str:3,spd:1}},
  {id:'sc1',name:'Parchemin: Séisme', icon:'📜',slot:null,   rarity:'uncommon', stats:{},spell:'slam'},
  {id:'sc2',name:'Parchemin: Bouclier',icon:'📜',slot:null,  rarity:'uncommon', stats:{},spell:'shield'},
  {id:'h3',name:'Heaume Runique',     icon:'🪖',slot:'head', rarity:'rare',     stats:{def:6,int:4,crit:3}},
  {id:'b3',name:"Cuirasse d'Acier",   icon:'🛡️',slot:'body', rarity:'rare',     stats:{def:10,str:3}},
  {id:'a3',name:'Gantelets de Titan', icon:'🥊',slot:'arm1', rarity:'rare',     stats:{str:6,atk:5,def:2}},
  {id:'w3',name:'Épée Runique',       icon:'⚔️',slot:'arm2', rarity:'rare',     stats:{str:6,atk:9,crit:5}},
  {id:'f3',name:'Bottes Agiles',      icon:'👠',slot:'boots',rarity:'rare',     stats:{spd:5,crit:4}},
  {id:'r3',name:'Ceinture du Mage',   icon:'✨',slot:'belt', rarity:'rare',     stats:{int:6,mp:15}},
  {id:'sc3',name:'Parchemin: Nova',   icon:'📜',slot:null,   rarity:'rare',     stats:{},spell:'nova'},
  {id:'sc4',name:"Parchemin: Éclair", icon:'📜',slot:null,   rarity:'rare',     stats:{},spell:'chain'},
  {id:'sc5',name:'Parchemin: Berserker',icon:'📜',slot:null, rarity:'rare',     stats:{},spell:'berserker'},
  {id:'h4',name:'Casque du Titan',    icon:'👑',slot:'head', rarity:'epic',     stats:{def:10,str:5,int:5,crit:8}},
  {id:'b4',name:'Armure de Dragon',   icon:'🐉',slot:'body', rarity:'epic',     stats:{def:15,str:7,hp:30}},
  {id:'w4',name:'Lame des Anciens',   icon:'🗡️',slot:'arm2', rarity:'epic',     stats:{atk:15,str:8,crit:12}},
  {id:'r4',name:'Orbe du Chaos',      icon:'🔮',slot:'belt', rarity:'epic',     stats:{int:12,mp:25,crit:6}},
  {id:'sc6',name:'Parchemin: Météorite',icon:'📜',slot:null, rarity:'epic',     stats:{},spell:'meteor'},
  {id:'sc7',name:'Parchemin: Vol de Vie',icon:'📜',slot:null,rarity:'epic',     stats:{},spell:'lifesteal'},
  {id:'w5', name:'Excalibur Golem',    icon:'⚜️',slot:'arm2', rarity:'legendary',stats:{atk:25,str:15,crit:20,spd:3}},
  {id:'b5', name:"Manteau de l'Éon",   icon:'🌌',slot:'body', rarity:'legendary',stats:{def:20,hp:50,mp:30,int:10}},
  {id:'sc8',name:'Parchemin: Critique',icon:'📜',slot:null,  rarity:'legendary',stats:{},spell:'critique'},
  {id:'h5', name:'Couronne Éternelle', icon:'☀️',slot:'head', rarity:'legendary',stats:{def:12,int:15,str:10,crit:10,spd:2}},
  // ── NEW UNCOMMON ──────────────────────────────────────────────────
  {id:'a4', name:'Griffes du Loup',    icon:'🐺',slot:'arm1', rarity:'uncommon', stats:{str:4,crit:3,atk:3}},
  {id:'r5', name:'Ceinture de Mana',   icon:'💙',slot:'belt', rarity:'uncommon', stats:{mp:20,int:2}},
  {id:'f4', name:'Souliers du Danseur',icon:'🩰',slot:'boots',rarity:'uncommon', stats:{spd:4,crit:2}},
  {id:'h6', name:'Bandeau du Mage',    icon:'🎓',slot:'head', rarity:'uncommon', stats:{int:4,mp:10}},
  // ── NEW RARE ─────────────────────────────────────────────────────
  {id:'w6', name:'Faucille Ensorcelée',icon:'🌙',slot:'arm2', rarity:'rare',     stats:{atk:10,crit:8,int:4}},
  {id:'a5', name:'Moufles Magmatiques',icon:'🌋',slot:'arm1', rarity:'rare',     stats:{str:7,atk:6,def:3}},
  {id:'b6', name:'Gilet de Mailles',   icon:'🪬',slot:'body', rarity:'rare',     stats:{def:8,str:4,spd:2}},
  {id:'r6', name:'Anneau du Titan',    icon:'💪',slot:'belt', rarity:'rare',     stats:{str:8,hp:20}},
  {id:'f5', name:'Bottes Spectrales',  icon:'👻',slot:'boots',rarity:'rare',     stats:{spd:6,crit:5,def:2}},
  {id:'sc9', name:'Parchemin: Nuage',  icon:'📜',slot:null,   rarity:'rare',     stats:{},spell:'toxiccloud'},
  {id:'sc10',name:'Parchemin: Vortex', icon:'📜',slot:null,   rarity:'rare',     stats:{},spell:'vortex'},
  // ── NEW EPIC ─────────────────────────────────────────────────────
  {id:'w7', name:'Trident des Abysses',icon:'🔱',slot:'arm2', rarity:'epic',     stats:{atk:18,int:10,crit:10}},
  {id:'h7', name:'Masque du Néant',    icon:'🎭',slot:'head', rarity:'epic',     stats:{int:8,def:8,crit:12,mp:20}},
  {id:'f6', name:'Bottines du Vent',   icon:'🌬️',slot:'boots',rarity:'epic',     stats:{spd:8,crit:6,atk:4}},
  {id:'b7', name:'Carapace Cosmique',  icon:'🌠',slot:'body', rarity:'epic',     stats:{def:18,hp:40,str:6}},
  {id:'sc11',name:'Parchemin: Blizzard',icon:'📜',slot:null,  rarity:'epic',     stats:{},spell:'blizzard'},
  {id:'sc12',name:'Parchemin: Tremblement',icon:'📜',slot:null,rarity:'epic',   stats:{},spell:'quake'},
  // ── NEW LEGENDARY ─────────────────────────────────────────────────
  {id:'a6', name:'Brassards du Chaos', icon:'⚡',slot:'arm1', rarity:'legendary',stats:{str:12,atk:10,crit:15,int:8}},
  {id:'r7', name:'Ceinture de l\'Infini',icon:'♾️',slot:'belt',rarity:'legendary',stats:{str:10,int:10,spd:5,crit:8,hp:30}},

  // ── ITEMS DIABLO v3 — avec résistances élémentaires ──────────────
  {id:'dq1',name:'Manteau du Phénix',  icon:'🔥',slot:'body', rarity:'rare',     stats:{def:7,rfire:20,str:4,hp:18}},
  {id:'dq2',name:'Heaume du Blizzard', icon:'🧊',slot:'head', rarity:'rare',     stats:{def:5,rice:20,int:5,mp:12}},
  {id:'dq3',name:'Bottes du Neant',    icon:'🌀',slot:'boots',rarity:'rare',     stats:{spd:4,rvoid:20,crit:4}},
  {id:'dq4',name:'Egide Runique',      icon:'🛡️',slot:'arm1', rarity:'epic',     stats:{def:12,rfire:15,rice:15,str:6}},
  {id:'dq5',name:'Couronne du Vide',   icon:'🌑',slot:'head', rarity:'epic',     stats:{int:12,rvoid:25,crit:10,mp:20}},
  {id:'dq6',name:'Ensemble Primordial',icon:'⚜️',slot:'body', rarity:'legendary',stats:{def:16,hp:45,rfire:25,rice:25,rvoid:25,str:8,int:8}},
  {id:'sc13',name:'Parchemin: Tempête',icon:'📜',slot:null,   rarity:'legendary',stats:{},spell:'arcstorm'},
  // ── NEW ITEMS v2 ──────────────────────────────────────────────────
  // Uncommon — couvre les lacunes stat
  {id:'ni1',name:'Ceinture du Guerrier', icon:'🔰',slot:'belt', rarity:'uncommon', stats:{str:4,def:2}},
  {id:'ni2',name:'Greves de Combat',     icon:'🦵',slot:'boots',rarity:'uncommon', stats:{def:3,str:2,spd:1}},
  // Rare — builds hybrides
  {id:'ni3',name:'Toge du Sorcier',      icon:'👘',slot:'body', rarity:'rare',     stats:{int:8,mp:20,def:4}},
  {id:'ni4',name:'Diadème Arcanique',    icon:'💫',slot:'head', rarity:'rare',     stats:{int:7,crit:4,mp:12}},
  {id:'ni5',name:'Gantelets du Sang',    icon:'🩺',slot:'arm1', rarity:'rare',     stats:{str:5,atk:4,crit:6}},
  {id:'ni6',name:'Lame Venimeuse',       icon:'🐍',slot:'arm2', rarity:'rare',     stats:{atk:11,crit:7,int:3}},
  // Epic — spécialisés
  {id:'ni7',name:"Armure de l'Abysse", icon:'🌑',slot:'body', rarity:'epic',     stats:{def:14,int:8,hp:25,mp:15}},
  {id:'ni8',name:'Griffes du Démon',    icon:'😈',slot:'arm1', rarity:'epic',     stats:{str:10,atk:8,crit:10,spd:2}},
  {id:'ni9',name:'Heaume du Lich',      icon:'💀',slot:'head', rarity:'epic',     stats:{int:12,crit:8,mp:22,def:6}},
  // Legendary
  {id:'ni10',name:'Bottes du Vent Éternel',icon:'🌪️',slot:'boots',rarity:'legendary',stats:{spd:12,crit:10,atk:8,int:6}},
  {id:'sc14',name:'Parchemin: Contre-Att.',icon:'📜',slot:null,  rarity:'rare',     stats:{},spell:'counter'},
  {id:'sc15',name:'Parchemin: Hâte',       icon:'📜',slot:null,  rarity:'rare',     stats:{},spell:'haste'},
  {id:'sc16',name:'Parchemin: Epines',     icon:'📜',slot:null,  rarity:'epic',     stats:{},spell:'thorns'},
  {id:'sc17',name:'Parchemin: Dechirement',icon:'📜',slot:null,  rarity:'rare',     stats:{},spell:'soulrip'},
  {id:'sc18',name:'Parchemin: Teleport',   icon:'📜',slot:null,  rarity:'epic',     stats:{},spell:'blink'},
  {id:'sc19',name:'Parchemin: Sacrifice',  icon:'📜',slot:null,  rarity:'legendary',stats:{},spell:'sacrifice'},
];
// Loot weight table — poids relatifs, scale avec les vagues
function getLootWeights(wave){
  // Plus les vagues avancent, plus les rarités élevées augmentent (lentement)
  const waveBonus=Math.min(wave,50);
  return {
    common:    Math.max(5,  50 - waveBonus*.4),
    uncommon:  Math.max(10, 30 + waveBonus*.1),
    rare:      Math.max(5,  15 + waveBonus*.2),
    epic:      Math.max(1,  4  + waveBonus*.08),
    legendary: Math.max(.2, 1  + waveBonus*.02),
  };
}
const RW={common:45,uncommon:30,rare:17,epic:6,legendary:2}; // kept for reference
const ETYPES={
  grunt: {hp:30,dmg:5, spd:.9, range:1.2,xp:15,gold:3,threat:1,name:'Grunt',     draw:drawGrunt},
  slime: {hp:20,dmg:3, spd:1.1,range:1.0,xp:10,gold:2,threat:1,name:'Slime',     draw:drawSlime},
  archer:{hp:25,dmg:8, spd:.7, range:3.5,xp:20,gold:4,threat:2,name:'Archer',draw:drawArcher},
  brute: {hp:80,dmg:14,spd:.55,range:1.5,xp:40,gold:8,threat:3,name:'Brute', draw:drawBrute},
  wraith:   {hp:45,dmg:10,spd:1.3,range:1.2,xp:35,gold:7, threat:2,name:'Spectre',  draw:drawWraith},
  // ── Biome Abyssal ──
  frostshade:      {hp:55, dmg:12,spd:1.4,range:1.2,xp:50,gold:11,threat:2,name:'Spectre Givré', draw:drawFrostShade,    dotOnHit:{type:'void',dmg:4,dur:3}, slowOnHitVal:.3},
  abyssalbehemoth: {hp:200,dmg:30,spd:.45,range:1.6,xp:100,gold:25,threat:5,name:'Béhémoth Abyssal',draw:drawAbyssalBehemoth,dotOnHit:{type:'void',dmg:10,dur:5}},
  voidarcher:      {hp:40, dmg:20,spd:.7, range:4.5,xp:60,gold:14,threat:3,name:'Archer du Vide',  draw:drawVoidArcher,    dotOnHit:{type:'void',dmg:7,dur:4}},
  glacialgolem:    {hp:150,dmg:22,spd:.5, range:1.5,xp:80,gold:20,threat:4,name:'Golem Glacial',   draw:drawGlacialGolem,  slowOnHitVal:.4},
  // ── Biome Volcanique ──
  lavabrute:{hp:120,dmg:22,spd:.5, range:1.6,xp:65,gold:15,threat:4,name:'Brute de Lave',draw:drawLavaBrute, dotOnHit:{type:'burn',dmg:4,dur:3}},
  ember:    {hp:25, dmg:12,spd:1.5,range:1.0,xp:30,gold:8, threat:2,name:'Tison',        draw:drawEmber,     dotOnHit:{type:'burn',dmg:3,dur:2}},
  ashwraith:{hp:60, dmg:15,spd:1.2,range:1.3,xp:55,gold:12,threat:3,name:'Spectre Cendre',draw:drawAshWraith,dotOnHit:{type:'burn',dmg:5,dur:4}},
  scorcher: {hp:35, dmg:18,spd:.75, range:4.0,xp:45,gold:10,threat:2,name:'Carboniseur',  draw:drawScorcher,  dotOnHit:{type:'burn',dmg:6,dur:3}},
};
const STAT_MAP={str:'str',int:'int',spd:'spd',def:'def',atk:'atkDmg',crit:'critChance',hp:'maxHp',mp:'maxMp',rfire:'resFire',rice:'resIce',rvoid:'resVoid'};
const STAT_LABELS={str:'STR',int:'INT',spd:'SPD',def:'DEF',atk:'ATK',crit:'CRIT',hp:'HP MAX',mp:'MP MAX',rfire:'Rés. Feu',rice:'Rés. Glace',rvoid:'Rés. Vide'};
