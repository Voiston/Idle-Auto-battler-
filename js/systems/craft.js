// ══ CRAFT SYSTEM ══════════════════════════════════════════════════════
const CRAFT_RARITY_UP={common:'uncommon',uncommon:'rare',rare:'epic',epic:'legendary'};
let craftSlots=[null,null,null]; // 3 item uids

function getCraftItem(uid){return state.inventory.find(i=>i.uid===uid);}

function craftSlotsValid(){
  const items=craftSlots.map(uid=>uid?getCraftItem(uid):null);
  if(items.some(i=>!i))return false;
  const rar=items[0].rarity;
  if(!CRAFT_RARITY_UP[rar])return false; // legendary can't upgrade
  return items.every(i=>i.rarity===rar);
}

function updateCraftUI(){
  const valid=craftSlotsValid();
  for(let i=0;i<3;i++){
    const el=document.getElementById('cslot-'+i);if(!el)continue;
    const uid=craftSlots[i];
    if(uid){
      const item=getCraftItem(uid);
      el.textContent=item?item.icon:'?';
      el.classList.add('filled');
    } else {
      el.textContent='＋';el.classList.remove('filled');
    }
  }
  const preview=document.getElementById('craft-result-preview');
  const goBtn=document.getElementById('craft-go-btn');
  if(valid){
    const rar=getCraftItem(craftSlots[0]).rarity;
    const nextRar=CRAFT_RARITY_UP[rar];
    const rarColors={uncommon:'var(--c-uncommon)',rare:'var(--c-rare)',epic:'var(--c-epic)',legendary:'var(--c-legendary)'};
    preview.innerHTML=`<span style="font-size:13px">✨</span><span style="color:${rarColors[nextRar]||'#fff'};font-size:11px;">${nextRar.toUpperCase()}</span>`;
    preview.classList.add('ready');
    goBtn.disabled=false;
  } else {
    preview.innerHTML='<span style="color:var(--muted);font-size:10px;">3 items requis</span>';
    preview.classList.remove('ready');
    goBtn.disabled=true;
  }
  // Highlight selected in inventory
  document.querySelectorAll('.inv-item').forEach(el=>{
    const idx=+el.dataset.idx;
    const item=state.inventory[idx];
    if(item&&craftSlots.includes(item.uid))el.classList.add('craft-selected');
    else el.classList.remove('craft-selected');
  });
}

function toggleCraftItem(uid){
  const idx=craftSlots.indexOf(uid);
  if(idx!==-1){craftSlots[idx]=null;}
  else{
    const emptySlot=craftSlots.indexOf(null);
    if(emptySlot===-1){showToastMsg('3 slots déjà remplis!','#ef4444');return;}
    craftSlots[emptySlot]=uid;
  }
  updateCraftUI();
}

function toggleCraftSlotClick(slotIdx){
  if(craftSlots[slotIdx]){craftSlots[slotIdx]=null;updateCraftUI();}
}

function autoCraftSelect(){
  craftSlots=[null,null,null];
  // Find 3 items of the same rarity, prefer lowest rarity first (common→legendary)
  const rarOrder=['common','uncommon','rare','epic'];
  for(const rar of rarOrder){
    if(!CRAFT_RARITY_UP[rar])continue;
    // Get non-equipped, non-scroll items of this rarity
    const candidates=state.inventory.filter(i=>i.rarity===rar&&!i.spell&&i.slot);
    if(candidates.length>=3){
      // Pick the 3 weakest (lowest total stat sum) — sacrifice junk
      const sorted=candidates.slice().sort((a,b)=>{
        const sumA=Object.values(a.stats||{}).reduce((s,v)=>s+v,0);
        const sumB=Object.values(b.stats||{}).reduce((s,v)=>s+v,0);
        return sumA-sumB;
      });
      craftSlots=[sorted[0].uid,sorted[1].uid,sorted[2].uid];
      updateCraftUI();
      showToastMsg(`⚡ 3 items ${rar} sélectionnés!`,'#4fc3f7');
      return;
    }
  }
  showToastMsg("Pas assez d'items de même rareté!",'#ef4444');
}

function doCraft(){
  if(!craftSlotsValid())return;
  const items=craftSlots.map(uid=>getCraftItem(uid));
  const inputRar=items[0].rarity;
  const outputRar=CRAFT_RARITY_UP[inputRar];
  // Remove 3 items from inventory
  craftSlots.forEach(uid=>{
    const idx=state.inventory.findIndex(i=>i.uid===uid);
    if(idx!==-1)state.inventory.splice(idx,1);
  });
  craftSlots=[null,null,null];
  // Generate new item of next rarity
  const pool=ITEMS.filter(i=>i.rarity===outputRar&&i.slot);
  if(!pool.length){showToastMsg('Aucun item de cette rareté!','#ef4444');return;}
  const tmpl=pool[Math.floor(Math.random()*pool.length)];
  const newItem={...tmpl,...generateAffixes(tmpl),uid:Date.now()+Math.random()};
  // Craft bonus: one extra stat roll
  if(newItem.affixes&&newItem.affixes.length>0){
    const bonusAff=AFFIX_POOL[Math.floor(Math.random()*AFFIX_POOL.length)];
    const range=bonusAff.ranges[outputRar]||[1,2];
    let val=Math.round((range[0]+Math.random()*(range[1]-range[0]))*10)/10;
    if(bonusAff.stat!=='spd')val=Math.round(val);
    newItem.stats[bonusAff.stat]=(newItem.stats[bonusAff.stat]||0)+val;
    newItem.affixes.push({name:bonusAff.name+' (forge)',stat:bonusAff.stat,val,crafted:true});
    newItem.name+=' [Forgé]';
  }
  if(state.inventory.length<24)state.inventory.push(newItem);
  addLog(`⚒️ Forgé: ${newItem.name} (${outputRar})!`,'log-spell');
  showToastMsg(`⚒️ ${newItem.icon} ${newItem.name}\n${outputRar.toUpperCase()} forgé!`,'#ffc107');
  const G=state.golem;const gp=ISO.toScreen(G.col,G.row);
  spawnPart(gp.x,gp.y,20,'#ffc107',5,1.2);
  spawnFloat(gp.x,gp.y-35,'⚒️ FORGÉ!','#ffc107');
  if(outputRar==='epic'||outputRar==='legendary'){
    state.lootMarkers.push({x:gp.x,y:gp.y,color:outputRar==='legendary'?'#ffc107':'#ab47bc',icon:newItem.icon,life:10,maxLife:10});
  }
  renderInventory();updateUI();updateCraftUI();
}

// Wire craft buttons after DOM ready (called in init)
function initCraft(){
  const autoBtn=document.getElementById('craft-auto-btn');
  if(autoBtn)autoBtn.addEventListener('click',autoCraftSelect);
  updateCraftUI();
}
