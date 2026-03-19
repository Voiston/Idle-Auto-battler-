// ══ UPGRADE ENGINE ════════════════════════════════════════════════════
function upgCost(def,currentLvl){return Math.floor(def.costBase*Math.pow(1.6,currentLvl));}

function buyUpgrade(id){
  const G=state.golem;
  const def=UPG_DEFS.find(u=>u.id===id);if(!def)return;
  const cur=G.upgrades[id]||0;
  if(cur>=def.maxLvl){showToastMsg('Amélioration maximale!','#22c55e');return;}
  const cost=upgCost(def,cur);
  if(G.gold<cost){showToastMsg(`Pas assez de gold (${cost} G requis)!`,'#ef4444');return;}
  G.gold-=cost;
  G.upgrades[id]=(cur||0)+1;
  def.effect(G,G.upgrades[id]);
  recalcStats();
  addLog(`⬆️ ${def.name} niv ${G.upgrades[id]}!`,'log-spell');
  showToastMsg(`${def.icon} ${def.name} → LVL ${G.upgrades[id]}`,'#ffd700');
  renderUpgrades();updateUI();
}

function renderUpgrades(){
  const G=state.golem;
  const tree=document.getElementById('upg-tree');
  document.getElementById('upg-gold-val').textContent=G.gold+' G';
  const branches={combat:'⚔️ COMBAT',magic:'🔮 MAGIE',survival:'🛡️ SURVIE'};
  let html='';
  for(const[branch,label] of Object.entries(branches)){
    const nodes=UPG_DEFS.filter(u=>u.branch===branch);
    html+=`<div class="upg-branch ${branch}"><div class="upg-branch-title">${label}</div><div class="upg-row">`;
    for(const def of nodes){
      const cur=G.upgrades[def.id]||0;
      const maxed=cur>=def.maxLvl;
      const cost=maxed?0:upgCost(def,cur);
      const canBuy=!maxed&&G.gold>=cost;
      const pct=cur/def.maxLvl*100;
      const cls=maxed?'maxed':canBuy?'can-buy':'';
      const pips=Array.from({length:def.maxLvl},(_,i)=>`<div class="upg-pip${i<cur?' filled':''}"></div>`).join('');
      html+=`<div class="upg-node ${cls}" onclick="${maxed?'':canBuy?`buyUpgrade('${def.id}')`:''}" >
        <div class="upg-icon">${def.icon}</div>
        <div class="upg-info">
          <div class="upg-name">${def.name}</div>
          <div class="upg-desc">${def.desc}</div>
          <div class="upg-progress">${pips}</div>
        </div>
        <div class="upg-cost">
          <div class="upg-cost-val">${maxed?'MAX':cost+' G'}</div>
          <div class="upg-cost-lbl">${maxed?'':cur+'/'+def.maxLvl}</div>
        </div>
        <div class="upg-bar" style="width:${pct}%"></div>
      </div>`;
    }
    html+='</div></div>';
  }
  tree.innerHTML=html;
}
