// ══ UI ════════════════════════════════════════════════════════════════
function updateUI(){
  const G=state.golem;
  document.getElementById('bar-hp').style.width=(G.hp/G.maxHp*100)+'%';document.getElementById('val-hp').textContent=Math.ceil(G.hp)+'/'+G.maxHp;
  document.getElementById('bar-mp').style.width=(G.mp/G.maxMp*100)+'%';document.getElementById('val-mp').textContent=Math.ceil(G.mp)+'/'+G.maxMp;
  document.getElementById('bar-xp').style.width=(G.xp/G.xpNext*100)+'%';document.getElementById('val-xp').textContent='LVL '+G.level;
  document.getElementById('gold-val').textContent=G.gold+' G';
  document.getElementById('wave-num').textContent=state.wave;
  const ssc=document.getElementById('spell-slot-count');if(ssc)ssc.textContent=state.golem.spellSlotsMax||4;
  // Resistances
  const G2=state.golem;
  const rf=document.getElementById('r-fire');if(rf)rf.textContent=(G2.resFire||0)+'%';
  const ri=document.getElementById('r-ice');if(ri)ri.textContent=(G2.resIce||0)+'%';
  const rv=document.getElementById('r-void');if(rv)rv.textContent=(G2.resVoid||0)+'%';
  // Power Score
  const ps=calcPowerScore();
  const psel=document.getElementById('power-score-val');if(psel)psel.textContent=ps;
  const pst=document.getElementById('power-score-tier');
  if(pst){const tier=ps<500?'Normal':ps<1500?'Fort':ps<4000?'Puissant':ps<10000?'Héroïque':'Divin';const cls='ps-'+tier.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');pst.textContent=tier;pst.className='ps-tier '+cls;}document.getElementById('enemy-count').textContent=state.enemies.length;
  document.getElementById('score-val').textContent=state.score.toLocaleString();
  document.getElementById('s-str').textContent=G.str;document.getElementById('s-int').textContent=G.int;
  document.getElementById('s-spd').textContent=G.spd.toFixed(1);document.getElementById('s-def').textContent=G.def;
  document.getElementById('s-atk').textContent=G.atkDmg;document.getElementById('s-crit').textContent=G.critChance+'%';
}

function renderSpellPips(){
  const G=state.golem;
  const container=document.getElementById('spell-pips');
  const pips=G.equippedSpells.filter(id=>id&&!getSpellDef(id)?.passive).map(id=>{
    const s=getSpellState(id);const def=getSpellDef(id);if(!s||!def)return'';
    const pct=def.cd>0?Math.max(0,1-s.timer/def.cd):1;const ready=s.timer<=0;
    return `<div class="spell-pip ${ready?'ready':''}"><span>${def.icon}</span><div class="pip-lbl">${ready?'OK':s.timer.toFixed(1)}</div><div class="pip-cd" style="width:${pct*100}%"></div></div>`;
  });
  container.innerHTML=pips.join('');
}

// ── Ajouter dynamiquement un slot de sort (récompense défi) ──────────
function addSpellSlotHTML(){
  const row=document.getElementById('spell-slots-row');
  const G=state.golem;
  const idx=G.equippedSpells.length-1;
  const el=document.createElement('div');
  el.className='spell-slot';
  el.dataset.spellSlot=idx;
  el.innerHTML=`<span class="spell-slot-ico">＋</span><div class="spell-slot-lbl">SORT ${idx+1}</div><span class="ss-x">✕</span>`;
  row.appendChild(el);
  addLog(`✨ Nouveau slot de sort débloqué! (${idx+1} slots)`,'log-spell');
  renderSpellSlots();renderSpells();
}

function renderSpellSlots(){
  const G=state.golem;
  document.querySelectorAll('.spell-slot').forEach(el=>{
    const idx=+el.dataset.spellSlot;
    el.style.display=idx<(G.spellSlotsMax||4)?'flex':'none';
    const id=G.equippedSpells[idx];const def=id?getSpellDef(id):null;
    const x=el.querySelector('.ss-x');
    if(def){el.classList.add('filled');el.querySelector('.spell-slot-ico').textContent=def.icon;el.querySelector('.spell-slot-lbl').textContent=def.name.substring(0,6);if(x)x.style.display='block';}
    else{el.classList.remove('filled');el.querySelector('.spell-slot-ico').textContent='＋';el.querySelector('.spell-slot-lbl').textContent='SORT '+(idx+1);if(x)x.style.display='none';}
    el.onclick=null;if(x)x.onclick=(e)=>{e.stopPropagation();unequipSpell(idx);};
    if(id)el.addEventListener('click',()=>openSpellModal(id));
  });
}
function renderSpells(){
  const G=state.golem;const list=document.getElementById('spells-list');
  list.innerHTML=state.activeSpells.map(s=>{
    const def=getSpellDef(s.id);if(!def)return'';
    const locked=!s.unlocked;const equipped=isSpellEquipped(s.id);
    const cdPct=def.cd>0?Math.max(0,(1-s.timer/def.cd))*100:100;
    const tagCls=def.tag==='aoe'?'tag-aoe':def.tag==='passive'?'tag-passive':'tag-active';
    const xpPct=s.spellLvl>=SPELL_MAX_LVL?100:Math.floor(s.spellXp/s.spellXpNext*100);
    const tierBadge=(s.spellTier||0)>0?`<span style="font-size:9px;color:#ffd54f;background:rgba(255,193,7,.15);border:1px solid rgba(255,193,7,.3);border-radius:4px;padding:1px 4px;margin-left:3px;">T${s.spellTier}</span>`:'';
    const lvlBadge=s.unlocked?`<span class="spell-lvl-badge">★${s.spellLvl}</span>`:'';
    return `<div class="spell-row${locked?' locked':''}${equipped?' equipped-spell':''}" data-spell-id="${s.id}">
      <div class="spell-ico">${def.icon}</div>
      <div class="spell-info">
        <div class="spell-name">${def.name}${lvlBadge}${tierBadge}${locked?` <span style="font-size:9px;color:var(--muted)">LVL ${def.lvl}</span>`:''}</div>
        <div class="spell-desc">${def.desc}</div>
        <span class="spell-tag ${tagCls}">${(def.tag||'active').toUpperCase()}</span>
        ${s.unlocked&&s.spellLvl<SPELL_MAX_LVL?`<div class="spell-xp-bar"><div class="spell-xp-fill" style="width:${xpPct}%"></div></div>`:''}
        ${s.unlocked&&s.spellLvl>=SPELL_MAX_LVL?`<div style="font-size:9px;color:var(--hp);margin-top:2px;">★ MAÎTRISE MAX</div>`:''}
      </div>
      <div class="spell-meta">${def.passive?'PASSIF':def.cd?def.cd+'s':'-'}<br/><span style="color:var(--accent)">${def.mp?def.mp+' MP':''}</span></div>
      ${equipped?'<div class="spell-eq-badge">✓ EQ</div>':''}
      ${!locked&&!def.passive&&def.cd>0?`<div class="spell-cd-bar" style="width:${cdPct}%"></div>`:''}
    </div>`;
  }).join('');
  list.querySelectorAll('.spell-row:not(.locked)').forEach(el=>{el.addEventListener('click',()=>openSpellModal(el.dataset.spellId));});
}
function renderInventory(){
  const grid=document.getElementById('inv-grid');
  document.getElementById('inv-count').textContent=state.inventory.length;
  let html='';
  for(let i=0;i<24;i++){const item=state.inventory[i];if(item)html+=`<div class="inv-item ${item.rarity}${item.affixes&&item.affixes.length?' has-affixes':''}" data-idx="${i}" title="${item.name}">${item.icon}${item.affixes&&item.affixes.length>0?'<div class="affix-dot"></div>':''}${item.setId&&typeof SET_DEFS!=='undefined'&&SET_DEFS[item.setId]?`<div class="set-dot" style="background:${SET_DEFS[item.setId].color};box-shadow:0 0 4px ${SET_DEFS[item.setId].color}"></div>`:''}<div class="rarity-dot"></div></div>`;else html+='<div class="inv-item"></div>';}
  grid.innerHTML=html;
  grid.querySelectorAll('.inv-item[data-idx]').forEach(el=>{const item=state.inventory[+el.dataset.idx];if(!item)return;el.addEventListener('click',()=>openItemModal(item));});
}
function renderSetDisplay(){
  const G=state.golem;
  const summary=getSetSummary();
  let container=document.getElementById('set-display');
  if(!container){
    container=document.createElement('div');
    container.id='set-display';
    container.style.cssText='margin-top:8px;padding:6px 8px;background:rgba(5,6,12,.6);border-radius:8px;border:1px solid rgba(255,255,255,.06);';
    const eq=document.getElementById('equip-layout');
    if(eq&&eq.parentNode)eq.parentNode.insertBefore(container,eq.nextSibling);
  }
  if(!summary.length){container.innerHTML='<div style="font-size:9px;color:var(--muted);text-align:center">Aucun set actif</div>';return;}
  container.innerHTML=summary.map(({def,count,maxPieces,active})=>{
    const pips=def.pieces.map((_,i)=>`<span style="display:inline-block;width:8px;height:8px;border-radius:50%;margin:0 1px;background:${i<count?def.color:'rgba(255,255,255,.12)'};box-shadow:${i<count?'0 0 4px '+def.color:'none'}"></span>`).join('');
    const bonusLines=Object.entries(def.bonuses).map(([thr,b])=>{
      const on=count>=Number(thr);
      return `<div style="font-size:9px;color:${on?def.color:'var(--muted)'};margin-top:2px">${on?'✓':'○'} ${b.label}: ${b.desc}</div>`;
    }).join('');
    return `<div style="margin-bottom:6px;padding:5px 6px;background:rgba(255,255,255,.03);border-radius:5px;border-left:2px solid ${def.color}">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
        <span>${def.icon}</span>
        <span style="font-family:'Cinzel',serif;font-size:10px;color:${def.color}">${def.name}</span>
        <span style="margin-left:auto;font-size:9px;color:var(--muted)">${count}/${maxPieces}</span>
      </div>
      <div>${pips}</div>
      ${bonusLines}
    </div>`;
  }).join('');
}

function renderEquip(){
  const G=state.golem;
  renderSetDisplay();
  document.querySelectorAll('.eq-slot').forEach(el=>{
    const slot=el.dataset.slot;const item=G.equipped[slot];
    if(item){el.classList.add('filled');el.innerHTML=`<span style="font-size:19px">${item.icon}</span><div class="eq-lbl">${slot.toUpperCase()}</div><div class="eq-unequip-dot" data-slot="${slot}"></div>`;}
    else{el.classList.remove('filled');el.innerHTML=`⬡<div class="eq-lbl">${slot.toUpperCase()}</div><div class="eq-unequip-dot" data-slot="${slot}"></div>`;}
    el.addEventListener('click',()=>{if(G.equipped[slot])openEquipSlotModal(slot);});
    const nd=el.querySelector('.eq-unequip-dot');if(nd)nd.addEventListener('click',e=>{e.stopPropagation();unequipSlot(slot);});
  });
}


// ══ MODALS ════════════════════════════════════════════════════════════
let modalOverlay,modalTitle,modalBody;
function initModals(){
  modalOverlay=document.getElementById('modal-overlay');
  modalTitle=document.getElementById('modal-title');
  modalBody=document.getElementById('modal-body');
}
function openModal(title,html){modalTitle.textContent=title;modalBody.innerHTML=html;modalOverlay.classList.add('open');}
function closeModal(){modalOverlay.classList.remove('open');}

// ══ STAT TOOLTIPS (long-press on mobile) ══════════════════════════════
const STAT_TIPS = {
  STR:  {title:'Force (STR)',     body:'Augmente les dégâts des attaques physiques et sorts de force. Formule: ATK + STR×0.8'},
  INT:  {title:'Intelligence (INT)',body:'Augmente les dégâts des sorts magiques. Les sorts INT-based utilisent INT×1.1 à 1.5.'},
  SPD:  {title:'Vitesse (SPD)',   body:"Augmente la vitesse de déplacement et légèrement la vitesse d'attaque."},
  DEF:  {title:'Défense (DEF)',   body:'Réduit les dégâts reçus: max(1, dmg - DEF×0.6). Plus utile contre les ennemis normaux.'},
  ATK:  {title:'Attaque (ATK)',   body:"Dégâts de base pour toutes les attaques. S'ajoute aux multiplicateurs de sorts."},
  CRIT: {title:'Chance Critique', body:'% de chance de déclencher un coup critique (×1.85 + scaling). Cap à 80%.'},
  'HP MAX': {title:'Points de Vie Max',body:"Détermine votre résistance. Chaque level up octroie +15 HP. Les items peuvent en donner jusqu'à +80."},
  'MP MAX': {title:'Points de Mana Max',body:'Nécessaire pour lancer les sorts. Se régénère automatiquement (2 MP/s de base).'},
  'Rés. Feu': {title:'Résistance au Feu', body:'Réduit les dégâts de brûlure reçus (DoT). Cap à 75%. Sources: items volcaniques, set Tal Rasha.'},
  'Rés. Glace':{title:'Résistance au Froid',body:'Réduit les dégâts de gel reçus. Cap à 75%. Indispensable au biome Abyssal (vague 18+).'},
  'Rés. Vide': {title:'Résistance au Vide', body:'Réduit les dégâts de vide reçus (DoT void). Cap à 75%. Crucial contre les monstres abyssaux.'},
};

let _tipTimer = null;
let _tipEl = null;

function showStatTooltip(key, targetEl){
  const tip = STAT_TIPS[key]; if(!tip) return;
  if(!_tipEl) _tipEl = document.getElementById('stat-tooltip');
  document.getElementById('stt-title').textContent = tip.title;
  document.getElementById('stt-body').innerHTML = tip.body.replace(
    /(\d+[\d%.×]+)/g, '<span class="stt-value">$1</span>'
  );
  // Position near element
  const rect = targetEl.getBoundingClientRect();
  const ttEl = _tipEl;
  ttEl.style.left = Math.min(rect.left, window.innerWidth - 240) + 'px';
  ttEl.style.top  = Math.max(4, rect.top - 130) + 'px';
  ttEl.classList.add('visible');
  // Auto-hide after 3s
  clearTimeout(_tipTimer);
  _tipTimer = setTimeout(hideStatTooltip, 3000);
}

function hideStatTooltip(){
  if(!_tipEl) _tipEl = document.getElementById('stat-tooltip');
  if(_tipEl) _tipEl.classList.remove('visible');
}

function initStatTooltips(){
  // Long-press on .sstat elements (300ms)
  document.querySelectorAll('.sstat').forEach(el => {
    let pressTimer = null;
    const lbl = el.querySelector('.sstat-lbl');
    if(!lbl) return;
    const key = lbl.textContent.trim();

    el.addEventListener('touchstart', e => {
      pressTimer = setTimeout(() => {
        showStatTooltip(key, el);
        if(typeof SFX!=='undefined') SFX.buy();
      }, 300);
    }, {passive:true});

    el.addEventListener('touchend',   () => clearTimeout(pressTimer), {passive:true});
    el.addEventListener('touchmove',  () => clearTimeout(pressTimer), {passive:true});
    // Desktop: click
    el.addEventListener('click', () => showStatTooltip(key, el));
  });

  // Also for res-strip
  document.querySelectorAll('.res-stat').forEach(el => {
    const lbl = el.querySelector('.res-lbl');
    if(!lbl) return;
    const key = lbl.textContent.replace(/[🔥❄️🌀]/g,'').trim();
    const resKeyMap = {'FEU':'Rés. Feu','GLACE':'Rés. Glace','VIDE':'Rés. Vide'};
    const tipKey = resKeyMap[key] || key;
    el.addEventListener('click', () => showStatTooltip(tipKey, el));
  });

  // Tap outside to dismiss
  document.addEventListener('touchstart', e => {
    if(!e.target.closest('.sstat') && !e.target.closest('.res-stat') && !e.target.closest('#stat-tooltip')){
      hideStatTooltip();
    }
  }, {passive:true});
}

function initEventListeners(){
  
  document.getElementById('modal-close').addEventListener('click',closeModal);
  document.querySelectorAll('.htab').forEach(btn=>{btn.addEventListener('click',()=>{document.querySelectorAll('.htab').forEach(b=>b.classList.remove('active'));document.querySelectorAll('.drawer-panel').forEach(p=>p.classList.remove('active'));btn.classList.add('active');document.getElementById('panel-'+btn.dataset.tab).classList.add('active');if(drawerCollapsed)toggleDrawer();});});
  document.getElementById('handle-toggle').addEventListener('click',toggleDrawer);
  let tsy=0;document.getElementById('drawer-handle').addEventListener('touchstart',e=>{tsy=e.touches[0].clientY;},{passive:true});
  document.getElementById('drawer-handle').addEventListener('touchend',e=>{const dy=e.changedTouches[0].clientY-tsy;if(dy>30&&!drawerCollapsed)toggleDrawer();else if(dy<-30&&drawerCollapsed)toggleDrawer();},{passive:true});
  document.getElementById('sell-all-btn').addEventListener('click',()=>{sellByRarity('rare');});
  document.querySelectorAll('.sell-rarity-btn[data-rarity]').forEach(btn=>{btn.addEventListener('click',()=>sellByRarity(btn.dataset.rarity));});
  modalOverlay.addEventListener('click',e=>{if(e.target===modalOverlay)closeModal();});
}

function rarityGoldVal(r){return{common:2,uncommon:5,rare:12,epic:30,legendary:80}[r]||2;}

function openItemModal(item){
  if(item.spell){
    const def=getSpellDef(item.spell);const sp=getSpellState(item.spell);
    const known=sp?.unlocked;const canLearn=state.golem.level>=(def?.lvl||1);
    let html=`<div class="modal-item-card"><div class="mic-header"><div class="mic-icon">${item.icon}</div><div class="mic-title"><div class="mic-name">${item.name}</div><div class="mic-rarity ${item.rarity}">${item.rarity.toUpperCase()}</div></div></div><div style="font-size:10px;color:var(--text)">Débloque: <b style="color:var(--accent)">${def?.name}</b></div></div>`;
    html+=`<div class="spell-detail-desc">${def?.desc||''}</div>`;
    if(known)html+=`<div style="color:var(--hp);text-align:center;font-size:9px;margin:8px 0">✓ Sort déjà connu</div>`;
    else if(!canLearn)html+=`<div style="color:var(--danger);text-align:center;font-size:9px;margin:8px 0">Niveau ${def?.lvl} requis (LVL ${state.golem.level})</div>`;
    else html+=`<button class="modal-btn primary" onclick="learnFromScroll('${item.uid}','${item.spell}')">📖 Apprendre</button>`;
    html+=`<button class="modal-btn danger" onclick="sellFromModal('${item.uid}')">💰 Vendre (${rarityGoldVal(item.rarity)} G)</button>`;
    html+=`<button class="modal-btn muted-btn" onclick="closeModal()">Fermer</button>`;
    openModal('📜 '+item.name,html);return;
  }
  const cmp=item.slot?getEquipComparison(item):[];const cur=item.slot?state.golem.equipped[item.slot]:null;
  // Base stats vs affix stats separation
  const baseItem=ITEMS.find(i=>i.id===item.id)||item;
  const baseStats=baseItem.stats||{};
  const affixStats=item.affixes||[];
  let statsHtml=Object.entries(item.stats||{}).filter(([,v])=>v!==0).map(([k,v])=>{
    const base=baseStats[k]||0;const bonus=v-base;
    return `<span class="mic-stat ${v>0?'pos':'neg'}">${STAT_LABELS[k]||k}: ${v>0?'+':''}${v}${bonus>0?` <span style="font-size:9px;color:var(--gold)">(+${bonus.toFixed(1)} roulé)</span>`:''}  </span>`;
  }).join('');
  let html=`<div class="modal-item-card"><div class="mic-header"><div class="mic-icon">${item.icon}</div><div class="mic-title"><div class="mic-name">${item.name}</div><div class="mic-rarity ${item.rarity}">${item.rarity.toUpperCase()}</div>${item.slot?`<div style="font-size:8px;color:var(--muted)">Slot: ${item.slot.toUpperCase()}</div>`:''}</div></div><div class="mic-stats">${statsHtml||'—'}</div></div>`;
  if(item.slot&&cmp.length){
    html+=`<div class="modal-section"><div class="modal-section-title">VS ${cur?cur.icon+' '+cur.name:'slot vide'}</div>`;
    for(const r of cmp){const cls=r.diff>0?'up':r.diff<0?'dn':'same';html+=`<div class="cmp-row"><span class="ckey">${STAT_LABELS[r.key]||r.key}</span><span style="color:var(--muted)">${r.curVal}</span><span style="color:var(--muted)">→</span><span class="cval ${cls}">${r.newVal} (${r.diff>0?'+':''}${r.diff})</span></div>`;}
    html+='</div>';
  }
  if(item.slot)html+=`<button class="modal-btn primary" onclick="equipFromModal('${item.uid}')">⚔️ Équiper</button>`;
  html+=`<button class="modal-btn danger" onclick="sellFromModal('${item.uid}')">💰 Vendre (${rarityGoldVal(item.rarity)} G)</button>`;
  html+=`<button class="modal-btn muted-btn" onclick="closeModal()">Annuler</button>`;
  openModal(item.icon+' '+item.name,html);
}
function equipFromModal(uid){const item=state.inventory.find(i=>i.uid==uid);if(!item)return closeModal();closeModal();equipItem(item);}
function sellFromModal(uid){const idx=state.inventory.findIndex(i=>i.uid==uid);if(idx===-1){closeModal();return;}const item=state.inventory[idx];state.inventory.splice(idx,1);state.golem.gold+=rarityGoldVal(item.rarity);addLog(`💰 ${item.name} +${rarityGoldVal(item.rarity)} G`,'log-loot');closeModal();renderInventory();updateUI();}
function learnFromScroll(uid,spellId){const idx=state.inventory.findIndex(i=>i.uid==uid);if(idx===-1){closeModal();return;}if(learnSpell(spellId))state.inventory.splice(idx,1);closeModal();renderInventory();}
function openEquipSlotModal(slot){
  const item=state.golem.equipped[slot];if(!item)return;
  let html=`<div class="modal-item-card"><div class="mic-header"><div class="mic-icon">${item.icon}</div><div class="mic-title"><div class="mic-name">${item.name}</div><div class="mic-rarity ${item.rarity}">${item.rarity.toUpperCase()}</div></div></div><div class="mic-stats">${Object.entries(item.stats||{}).filter(([,v])=>v!==0).map(([k,v])=>`<span class="mic-stat ${v>0?'pos':'neg'}">${STAT_LABELS[k]||k}: ${v>0?'+':''}${v}</span>`).join('')}</div></div>`;
  html+=`<button class="modal-btn danger" onclick="unequipFromModal('${slot}')">↩️ Déséquiper</button>`;
  html+=`<button class="modal-btn danger" onclick="sellEquippedFromModal('${slot}')">💰 Vendre (${rarityGoldVal(item.rarity)} G)</button>`;
  html+=`<button class="modal-btn muted-btn" onclick="closeModal()">Annuler</button>`;
  openModal('⚔️ Slot '+slot.toUpperCase(),html);
}
function unequipFromModal(slot){unequipSlot(slot);closeModal();}
function sellEquippedFromModal(slot){const G=state.golem;const item=G.equipped[slot];if(!item)return closeModal();G.equipped[slot]=null;G.gold+=rarityGoldVal(item.rarity);recalcStats();addLog(`💰 ${item.name} vendu`,'log-loot');closeModal();renderEquip();updateUI();}
function openSpellModal(spellId){
  const def=getSpellDef(spellId);const sp=getSpellState(spellId);if(!def||!sp||!sp.unlocked)return;
  const equipped=isSpellEquipped(spellId);const tagCls=def.tag==='aoe'?'tag-aoe':def.tag==='passive'?'tag-passive':'tag-active';
  const xpPct=sp.spellLvl>=SPELL_MAX_LVL?100:Math.floor(sp.spellXp/sp.spellXpNext*100);
  let html=`<div class="spell-detail-header"><div class="spell-detail-ico">${def.icon}</div>
    <div><div class="spell-detail-name">${def.name} <span style="font-size:13px;color:var(--gold)">★${sp.spellLvl}</span></div>
    <div class="spell-detail-sub">${def.passive?'Passif':'Actif'} · Requis LVL ${def.lvl}</div></div></div>`;
  html+=`<div class="spell-detail-desc">${def.desc}</div>`;
  html+=`<div class="spell-tags-row"><span class="spell-tag ${tagCls}">${(def.tag||'active').toUpperCase()}</span>${def.cd?`<span class="spell-stat-chip gold">CD ${def.cd}s</span>`:''}${def.mp?`<span class="spell-stat-chip">${def.mp} MP</span>`:''}</div>`;
  // Mastery info
  html+=`<div style="background:rgba(255,215,0,.06);border:1px solid rgba(255,215,0,.2);border-radius:5px;padding:8px 10px;margin-bottom:8px;">
    <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--gold);margin-bottom:5px;">
      <span>★ MAÎTRISE ${sp.spellLvl}/${SPELL_MAX_LVL}</span>
      <span>${sp.spellLvl<SPELL_MAX_LVL?sp.spellXp+'/'+sp.spellXpNext+' XP':'MAX'}</span>
    </div>
    <div style="height:5px;background:rgba(255,215,0,.15);border-radius:3px;overflow:hidden;">
      <div style="height:100%;width:${xpPct}%;background:var(--gold);border-radius:3px;transition:width .3s;"></div>
    </div>
    ${sp.spellLvl>1?`<div style="font-size:9px;color:var(--text);margin-top:5px;line-height:1.6;">
      ${!def.passive?`CD: −${Math.round((sp.cdMastery||0)*100)}% · DMG: +${Math.round(((sp.dmgMastery||1)-1)*100)}% · MP: −${sp.mpMastery||0}`:'Efficacité: +'+Math.round(((sp.passiveMastery||1)-1)*100)+'%'}
    </div>`:'<div style="font-size:9px;color:var(--muted);margin-top:4px;">Utilise ce sort pour gagner de la maîtrise.</div>'}
  </div>`;
  if(equipped){const slot=state.golem.equippedSpells.indexOf(spellId);html+=`<div style="color:var(--hp);text-align:center;font-size:11px;margin:6px 0">✓ Équipé — Slot ${slot+1}</div>`;html+=`<button class="modal-btn danger" onclick="unequipSpellFromModal('${spellId}')">↩️ Retirer</button>`;}
  else{const _slots=state.golem.equippedSpells.slice(0,state.golem.spellSlotsMax||4);const empty=_slots.indexOf(null);if(empty!==-1)html+=`<button class="modal-btn primary" onclick="equipSpellFromModal('${spellId}')">✨ Équiper slot ${empty+1}</button>`;else html+=`<div style="color:var(--danger);text-align:center;font-size:11px;margin:6px 0">Slots pleins (${state.golem.spellSlotsMax||4}/6)</div>`;}
  html+=`<button class="modal-btn muted-btn" onclick="closeModal()">Fermer</button>`;
  openModal(def.icon+' '+def.name,html);
}
function equipSpellFromModal(id){const G=state.golem;const slots=G.equippedSpells.slice(0,G.spellSlotsMax||4);const slot=slots.indexOf(null);if(slot===-1){closeModal();return;}equipSpell(id,slot);closeModal();}
function unequipSpellFromModal(id){const slot=state.golem.equippedSpells.indexOf(id);if(slot!==-1)unequipSpell(slot);closeModal();}

let toastTimer2=null;
function showToastMsg(msg,color='#00e5ff'){
  const t=document.getElementById('item-toast');document.getElementById('tt-name').textContent=msg;document.getElementById('tt-stats').textContent='';document.getElementById('tt-rarity').textContent='';
  t.style.borderColor=color;t.classList.add('show');clearTimeout(toastTimer2);toastTimer2=setTimeout(()=>t.classList.remove('show'),1800);
}


// ══ TABS / COLLAPSE ═══════════════════════════════════════════════════
let drawerCollapsed=false,drawerWrap=null;
const DRAWER_H=340;
function initDrawer(){drawerWrap=document.getElementById('drawer-wrap');}
function toggleDrawer(){if(!drawerWrap)drawerWrap=document.getElementById('drawer-wrap');drawerCollapsed=!drawerCollapsed;drawerWrap.style.height=drawerCollapsed?'0':DRAWER_H+'px';setTimeout(resizeCanvas,370);}
// ── Auto-vente multi-rareté ───────────────────────────────────────────
const SELL_ORDER=['common','uncommon','rare','epic','legendary'];
function sellByRarity(maxRarity){
  const cutoff=SELL_ORDER.indexOf(maxRarity);
  const rarToSell=SELL_ORDER.slice(0,cutoff+1);
  const sold=state.inventory.filter(i=>rarToSell.includes(i.rarity));
  if(!sold.length){showToastMsg('Rien à vendre!','#4a5a7a');return;}
  let gold=0;for(const i of sold)gold+=rarityGoldVal(i.rarity);
  state.inventory=state.inventory.filter(i=>i.spell||!rarToSell.includes(i.rarity));
  state.golem.gold+=gold;
  addLog(`💰 ${sold.length} items vendus → +${gold} G`,'log-loot');
  renderInventory();updateUI();renderUpgrades();
}
