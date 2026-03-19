// ══ ITEM AFFIX SYSTEM ═════════════════════════════════════════════════
// Affixes = stats procédurales générées à la création de l'item
// Chaque affix a un nom, une stat modifiée et un range min/max par rareté
const AFFIX_POOL=[
  {name:'de Puissance',  stat:'str',  ranges:{common:[1,3],uncommon:[2,5],rare:[4,9],epic:[8,15],legendary:[12,22]}},
  {name:"d'Intellect",   stat:'int',  ranges:{common:[1,3],uncommon:[2,5],rare:[4,9],epic:[8,15],legendary:[12,22]}},
  {name:'de Précision',  stat:'crit', ranges:{common:[1,2],uncommon:[2,4],rare:[3,7],epic:[6,12],legendary:[10,18]}},
  {name:'de Vigueur',    stat:'hp',   ranges:{common:[5,12],uncommon:[10,25],rare:[20,45],epic:[40,80],legendary:[70,130]}},
  {name:'de Mana',       stat:'mp',   ranges:{common:[3,8],uncommon:[6,16],rare:[12,30],epic:[25,50],legendary:[40,80]}},
  {name:'de Défense',    stat:'def',  ranges:{common:[1,2],uncommon:[2,4],rare:[3,7],epic:[6,12],legendary:[10,18]}},
  {name:'de Vitesse',    stat:'spd',  ranges:{common:[0.5,1],uncommon:[1,2],rare:[1.5,3],epic:[2.5,5],legendary:[4,8]}},
  {name:'de Brutalité',  stat:'atk',  ranges:{common:[1,3],uncommon:[2,6],rare:[5,11],epic:[9,18],legendary:[15,28]}},
];

// Nombre d'affixes par rareté
const AFFIX_COUNT={common:0,uncommon:1,rare:2,epic:3,legendary:4};

function generateAffixes(tmpl){
  const n=AFFIX_COUNT[tmpl.rarity]||0;
  if(n===0)return{affixes:[],stats:{...tmpl.stats}};
  // Pick n random unique affixes
  const pool=[...AFFIX_POOL].sort(()=>Math.random()-.5).slice(0,n);
  const newStats={...tmpl.stats};
  const affixes=[];
  for(const aff of pool){
    const range=aff.ranges[tmpl.rarity]||[1,2];
    let val=Math.round((range[0]+Math.random()*(range[1]-range[0]))*10)/10;
    if(aff.stat!=='spd')val=Math.round(val);
    // Only add if meaningful
    if(val===0)continue;
    newStats[aff.stat]=(newStats[aff.stat]||0)+val;
    affixes.push({name:aff.name,stat:aff.stat,val});
  }
  // Rename item with first affix suffix
  const firstName=affixes[0]?.name||'';
  return{affixes,stats:newStats,name:firstName?`${tmpl.name} ${firstName}`:tmpl.name};
}

function formatAffixStats(item){
  if(!item.affixes||item.affixes.length===0)return'';
  return item.affixes.map(a=>`<span class="mic-stat pos">${STAT_LABELS[a.stat]||a.stat}: +${a.val} <span style="font-size:9px;opacity:.6">(affix)</span></span>`).join('');
}



function dropItem(x,y){
  const weights=getLootWeights(state.wave);
  const total=Object.values(weights).reduce((a,b)=>a+b,0);
  let roll=Math.random()*total,rar='common';
  for(const[r,w]of Object.entries(weights)){roll-=w;if(roll<=0){rar=r;break;}}
  const pool=ITEMS.filter(i=>i.rarity===rar);if(!pool.length)return;
  const tmpl=pool[Math.floor(Math.random()*pool.length)];
  if(state.inventory.length<24){
    const itemWithAffixes={...tmpl,...generateAffixes(tmpl),uid:Date.now()+Math.random()};
    state.inventory.push(itemWithAffixes);
    addLog(`📦 ${tmpl.name} (${rar})`,'log-loot');
    spawnFloat(x,y-20,tmpl.icon,'#ffd700');
    if(rar==='epic'||rar==='legendary'){
      const glowColor=rar==='legendary'?'#ffc107':'#ab47bc';
      state.lootMarkers.push({x,y,color:glowColor,icon:tmpl.icon,life:8,maxLife:8});
    }
  }
  renderInventory();
}