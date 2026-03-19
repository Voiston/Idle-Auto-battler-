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
