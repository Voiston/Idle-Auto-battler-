// ── ISO (isometric coordinate system, camera centred on Golem) ───────
const ISO = {
  tileW: 44, tileH: 22,
  get camCol(){ return state?.golem?.col || 8; },
  get camRow(){ return state?.golem?.row || 8; },
  toScreen(c, r){
    if(!canvas) return {x:0, y:0};
    const cx = canvas.width / 2, cy = canvas.height * .42;
    return {
      x: cx + (c - this.camCol - (r - this.camRow)) * this.tileW / 2,
      y: cy + (c - this.camCol + (r - this.camRow)) * this.tileH / 2,
    };
  },
  tilesVisible(){
    if(!canvas) return {hw:10, hh:10};
    const hw = Math.ceil(canvas.width  / this.tileW) + 4;
    const hh = Math.ceil(canvas.height / this.tileH) + 4;
    return {hw, hh};
  },
};

// ── Color palette ─────────────────────────────────────────────────────
const C = {
  golem:  {body:'#4a7aff', core:'#00e5ff', joint:'#1a3a8f'},
  grunt:  {body:'#c0392b', eye:'#ff6b35'},
  brute:  {body:'#7d3c98', eye:'#e74c3c'},
  slime:  {body:'#27ae60', eye:'#a9dfbf'},
  archer: {body:'#e67e22', eye:'#f39c12'},
  wraith: {body:'#2c3e50', eye:'#9b59b6'},
  tile:   {a:'#0a1a30', b:'#0d1f38', c:'#0b1c35', line:'#152535'},
};

// ── Canvas resize ─────────────────────────────────────────────────────
function resizeCanvas(){
  if(!canvas || !cZone) return;
  canvas.width  = cZone.clientWidth;
  canvas.height = cZone.clientHeight;
}
window.addEventListener('resize', resizeCanvas);

// ══ DRAW ══════════════════════════════════════════════════════════════
function drawShadow(x,y,r=14){ctx.save();ctx.globalAlpha=.28;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(x,y+3,r,r*.4,0,0,Math.PI*2);ctx.fill();ctx.restore();}
function drawHpBar(x,y,hp,max,w=28,eliteColor=null){
  const h=3,f=Math.max(0,hp/max);
  const col=eliteColor?eliteColor:(f>.5?'#22c55e':f>.25?'#f59e0b':'#ef4444');
  ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(x-w/2,y-h-1,w,h);
  ctx.fillStyle=col;ctx.fillRect(x-w/2,y-h-1,w*f,h);
  if(eliteColor){ctx.shadowColor=eliteColor;ctx.shadowBlur=4;}
  ctx.strokeStyle='rgba(255,255,255,.12)';ctx.lineWidth=.5;ctx.strokeRect(x-w/2,y-h-1,w,h);
  ctx.shadowBlur=0;
}
function drawGolem(x,y){
  const G2sf=state.golem;
  // Set bonus flash aura
  if(G2sf._setFlashTimer>0){G2sf._setFlashTimer-=0.016;
    G._setFlashTimer-=0.016; // approx dt (drawn each frame)
    const alpha=Math.min(1,G._setFlashTimer)*0.55;
    ctx.save();
    const sfAlpha=Math.min(1,G2sf._setFlashTimer)*0.55;
    ctx.globalAlpha=sfAlpha;
    ctx.shadowColor=G2sf._setFlashColor||'#fff';
    ctx.shadowBlur=30+Math.sin(G2sf._setFlashTimer*8)*10;
    ctx.beginPath();ctx.arc(x,y-16,22,0,Math.PI*2);
    ctx.fillStyle=G2sf._setFlashColor||'#fff';
    ctx.fill();
    ctx.restore();
  }

  const G=state.golem;const bob=Math.sin(G.animFrame*Math.PI*.5)*1.2;const fl=G.hitFlash>0;
  ctx.save();ctx.translate(x,y+bob);
  const sc={patrol:'#4a7aff',chase:'#ffd700',flee:'#ef4444',attack:'#ff6b35'};
  ctx.beginPath();ctx.arc(0,-22,16,0,Math.PI*2);ctx.strokeStyle=(sc[G.gstate]||'#fff')+'44';ctx.lineWidth=1.5;ctx.stroke();
  if(fl){ctx.globalAlpha=.5+G.hitFlash*.5;ctx.globalCompositeOperation='lighter';}
  drawShadow(0,6);
  ctx.fillStyle=C.golem.body;ctx.fillRect(-8,-16,16,17);ctx.fillStyle='rgba(255,255,255,.07)';ctx.fillRect(-6,-14,6,8);
  ctx.fillStyle=C.golem.core;ctx.fillRect(-4,-11,8,8);ctx.globalAlpha=fl?.5:.55+Math.sin(Date.now()*.003)*.2;ctx.fillStyle='rgba(0,229,255,.45)';ctx.fillRect(-3,-10,6,6);ctx.globalAlpha=fl?.5:1;
  ctx.fillStyle=C.golem.body;ctx.fillRect(-6,-25,12,10);ctx.fillStyle='rgba(255,255,255,.07)';ctx.fillRect(-5,-24,5,4);
  ctx.fillStyle=C.golem.core;ctx.globalAlpha=fl?1:.7+Math.sin(Date.now()*.004)*.3;ctx.fillRect(-4,-20,3,3);ctx.fillRect(1,-20,3,3);ctx.globalAlpha=1;
  const sw=Math.sin(G.animFrame*Math.PI*.5)*1.5;ctx.fillStyle=C.golem.joint;ctx.fillRect(-12,-14+sw,5,11);ctx.fillRect(7,-14-sw,5,11);ctx.fillRect(-6,-1,3,5);ctx.fillRect(3,-1,3,5);ctx.fillStyle='#2a5acc';ctx.fillRect(-7,3+(G.animFrame%2?1:0),5,3);ctx.fillRect(2,3+(G.animFrame%2?0:1),5,3);
  ctx.restore();drawHpBar(x,y-32,G.hp,G.maxHp,36);
}
function drawGrunt(cx,x,y,e){const b=Math.sin(e.animFrame*Math.PI*.5)*1.2;cx.save();cx.translate(x,y+b);if(e.hitFlash>0){cx.globalAlpha=.5+e.hitFlash*.5;cx.globalCompositeOperation='lighter';}drawShadow(0,5);cx.fillStyle=C.grunt.body;cx.fillRect(-7,-17,14,17);cx.fillStyle='#8b1a10';cx.fillRect(-5,-15,5,7);cx.fillStyle=C.grunt.eye;cx.globalAlpha=.8+Math.sin(Date.now()*.006)*.2;cx.fillRect(-4,-13,2.5,2.5);cx.fillRect(1,-13,2.5,2.5);cx.globalAlpha=1;cx.fillStyle='#7a1208';cx.fillRect(-6,-1+(e.animFrame%2?0:1),4,4);cx.fillRect(2,-1+(e.animFrame%2?1:0),4,4);cx.restore();drawHpBar(x,y-25,e.hp,e.maxHp,28,e.eliteColor||null);}
function drawBrute(cx,x,y,e){const b=Math.sin(e.animFrame*Math.PI*.5)*.8;cx.save();cx.translate(x,y+b);if(e.hitFlash>0){cx.globalAlpha=.5+e.hitFlash*.5;cx.globalCompositeOperation='lighter';}drawShadow(0,6,20);cx.fillStyle=C.brute.body;cx.fillRect(-11,-22,22,21);cx.fillStyle='#5a2880';cx.fillRect(-9,-20,9,10);cx.fillStyle=C.brute.eye;cx.globalAlpha=.9;cx.fillRect(-7,-16,4,4);cx.fillRect(3,-16,4,4);cx.globalAlpha=1;cx.fillStyle='#4a1a70';cx.fillRect(-13,-16,4,14);cx.fillRect(9,-16,4,14);cx.fillRect(-8,-1+(e.animFrame%2?2:0),5,6);cx.fillRect(3,-1+(e.animFrame%2?0:2),5,6);cx.restore();drawHpBar(x,y-32,e.hp,e.maxHp,36,e.eliteColor||null);}
function drawSlime(cx,x,y,e){const sq=.85+Math.sin(e.animFrame*Math.PI*.5)*.15;cx.save();cx.translate(x,y);if(e.hitFlash>0){cx.globalAlpha=.5+e.hitFlash*.5;cx.globalCompositeOperation='lighter';}cx.scale(1,sq);cx.fillStyle=C.slime.body;cx.beginPath();cx.ellipse(0,-6,10,8,0,0,Math.PI*2);cx.fill();cx.fillStyle='rgba(255,255,255,.15)';cx.beginPath();cx.ellipse(-2,-9,4,2.5,-.3,0,Math.PI*2);cx.fill();cx.fillStyle=C.slime.eye;cx.fillRect(-4,-8,2.5,2.5);cx.fillRect(1,-8,2.5,2.5);cx.restore();drawHpBar(x,y-20,e.hp,e.maxHp,24,e.eliteColor||null);}
function drawArcher(cx,x,y,e){const b=Math.sin(e.animFrame*Math.PI*.5)*1;cx.save();cx.translate(x,y+b);if(e.hitFlash>0){cx.globalAlpha=.5+e.hitFlash*.5;cx.globalCompositeOperation='lighter';}drawShadow(0,4,12);cx.fillStyle=C.archer.body;cx.fillRect(-5,-19,10,18);cx.fillStyle='#c0611a';cx.fillRect(-3,-17,4,6);cx.fillStyle=C.archer.eye;cx.globalAlpha=.9;cx.fillRect(-3,-14,2,2);cx.fillRect(1,-14,2,2);cx.globalAlpha=1;cx.strokeStyle='#8B4513';cx.lineWidth=1.5;cx.beginPath();cx.arc(8,-12,7,-1.2,1.2);cx.stroke();cx.strokeStyle='#ddd';cx.lineWidth=.8;cx.beginPath();cx.moveTo(8,-19);cx.lineTo(8,-5);cx.stroke();cx.fillStyle='#c0611a';cx.fillRect(-4,0+(e.animFrame%2?1:0),3,5);cx.fillRect(1,0+(e.animFrame%2?0:1),3,5);cx.restore();drawHpBar(x,y-28,e.hp,e.maxHp,28,e.eliteColor||null);}
function drawWraith(cx,x,y,e){const fl2=Math.sin(Date.now()*.002+e.id*.01)*3;cx.save();cx.translate(x,y+fl2);if(e.hitFlash>0){cx.globalAlpha=.5+e.hitFlash*.5;cx.globalCompositeOperation='lighter';}cx.globalAlpha=(cx.globalAlpha||1)*.75;cx.fillStyle=C.wraith.body;cx.beginPath();cx.ellipse(0,-8,9,14,0,0,Math.PI*2);cx.fill();cx.fillStyle='rgba(100,50,150,.4)';cx.beginPath();cx.ellipse(0,-8,7,12,0,0,Math.PI*2);cx.fill();cx.fillStyle=C.wraith.eye;cx.globalAlpha=.8+Math.sin(Date.now()*.007)*.2;cx.beginPath();cx.arc(-3,-10,2,0,Math.PI*2);cx.fill();cx.beginPath();cx.arc(3,-10,2,0,Math.PI*2);cx.fill();cx.globalAlpha=1;cx.restore();drawHpBar(x,y-28,e.hp,e.maxHp,28,e.eliteColor||null);}

function drawLavaBrute(cx,x,y,e){
  const b=Math.sin(e.animFrame*Math.PI*.5)*.9;cx.save();cx.translate(x,y+b);
  if(e.hitFlash>0){cx.globalAlpha=.5+e.hitFlash*.5;cx.globalCompositeOperation='lighter';}
  // Glow aura
  cx.globalAlpha=.2+Math.sin(vfxTime*3)*.1;cx.fillStyle='#ff4500';
  cx.beginPath();cx.ellipse(0,-10,18,18,0,0,Math.PI*2);cx.fill();cx.globalAlpha=1;
  // Body (rocky orange)
  cx.fillStyle='#8b2500';cx.fillRect(-11,-22,22,21);
  cx.fillStyle='#bf360c';cx.fillRect(-9,-20,9,10);
  // Lava cracks
  cx.strokeStyle='#ff6d00';cx.lineWidth=1.5;
  cx.beginPath();cx.moveTo(-6,-18);cx.lineTo(-2,-12);cx.lineTo(-5,-6);cx.stroke();
  cx.beginPath();cx.moveTo(4,-16);cx.lineTo(7,-10);cx.stroke();
  // Eyes (glowing)
  cx.fillStyle='#ff6d00';cx.globalAlpha=.9+Math.sin(vfxTime*5)*.1;
  cx.fillRect(-7,-16,5,5);cx.fillRect(2,-16,5,5);cx.globalAlpha=1;
  // Arms
  cx.fillStyle='#8b2500';
  cx.fillRect(-13,-16+Math.sin(e.animFrame*Math.PI*.5)*3,4,14);
  cx.fillRect(9,-16-Math.sin(e.animFrame*Math.PI*.5)*3,4,14);
  cx.restore();
  drawHpBar(x,y-30,e.hp,e.maxHp,36,e.eliteColor||null);
}
function drawEmber(cx,x,y,e){
  const fl=Math.sin(vfxTime*4+e.id*.1)*3;cx.save();cx.translate(x,y+fl);
  if(e.hitFlash>0){cx.globalAlpha=.5+e.hitFlash*.5;cx.globalCompositeOperation='lighter';}
  // Flame body
  cx.globalAlpha=.85;
  cx.fillStyle='#ff3d00';
  cx.beginPath();cx.ellipse(0,-8,8,12,0,0,Math.PI*2);cx.fill();
  cx.fillStyle='#ffab00';
  cx.beginPath();cx.ellipse(0,-10,5,8,0,0,Math.PI*2);cx.fill();
  cx.fillStyle='#fff176';
  cx.beginPath();cx.ellipse(0,-12,3,5,0,0,Math.PI*2);cx.fill();
  // Eyes (dark)
  cx.fillStyle='#212121';cx.globalAlpha=1;
  cx.beginPath();cx.arc(-2,-10,1.5,0,Math.PI*2);cx.fill();
  cx.beginPath();cx.arc(2,-10,1.5,0,Math.PI*2);cx.fill();
  cx.restore();
  drawHpBar(x,y-22,e.hp,e.maxHp,26,e.eliteColor||null);
}
function drawAshWraith(cx,x,y,e){
  const fl=Math.sin(vfxTime*2.5+e.id*.01)*4;cx.save();cx.translate(x,y+fl);
  if(e.hitFlash>0){cx.globalAlpha=.5+e.hitFlash*.5;cx.globalCompositeOperation='lighter';}
  cx.globalAlpha=.7;
  cx.fillStyle='#37474f';
  cx.beginPath();cx.ellipse(0,-8,10,16,0,0,Math.PI*2);cx.fill();
  cx.fillStyle='#546e7a';
  cx.beginPath();cx.ellipse(0,-10,7,12,0,0,Math.PI*2);cx.fill();
  // Ember eyes
  cx.fillStyle='#ff6d00';cx.globalAlpha=.9+Math.sin(vfxTime*6)*.1;
  cx.beginPath();cx.arc(-3,-11,2.5,0,Math.PI*2);cx.fill();
  cx.beginPath();cx.arc(3,-11,2.5,0,Math.PI*2);cx.fill();
  cx.globalAlpha=1;cx.restore();
  drawHpBar(x,y-28,e.hp,e.maxHp,28,e.eliteColor||null);
}
function drawScorcher(cx,x,y,e){
  const b=Math.sin(e.animFrame*Math.PI*.5)*1;cx.save();cx.translate(x,y+b);
  if(e.hitFlash>0){cx.globalAlpha=.5+e.hitFlash*.5;cx.globalCompositeOperation='lighter';}
  // Rocky archer body with fire
  cx.fillStyle='#6d2600';cx.fillRect(-5,-19,10,18);
  cx.fillStyle='#bf360c';cx.fillRect(-3,-17,4,6);
  // Fire arrow glow
  cx.fillStyle='#ff6d00';cx.globalAlpha=.8+Math.sin(vfxTime*4)*.2;
  cx.fillRect(-2,-14,1.5,1.5);cx.fillRect(1,-14,1.5,1.5);cx.globalAlpha=1;
  // Bow on fire
  cx.strokeStyle='#ff3d00';cx.lineWidth=1.5;
  cx.beginPath();cx.arc(8,-12,7,-1.2,1.2);cx.stroke();
  cx.strokeStyle='#ff6d00';cx.lineWidth=1;
  cx.beginPath();cx.moveTo(8,-19);cx.lineTo(8,-5);cx.stroke();
  cx.fillStyle='#6d2600';
  cx.fillRect(-4,0+(e.animFrame%2?1:0),3,5);cx.fillRect(1,0+(e.animFrame%2?0:1),3,5);
  cx.restore();
  drawHpBar(x,y-27,e.hp,e.maxHp,28,e.eliteColor||null);
}


// ── Biome Abyssal — draw functions ───────────────────────────────────
function drawFrostShade(cx,x,y,e){
  const fl=Math.sin(vfxTime*2+e.id*.01)*3;cx.save();cx.translate(x,y+fl);
  if(e.hitFlash>0){cx.globalAlpha=.5+e.hitFlash*.5;cx.globalCompositeOperation='lighter';}
  // Icy translucent body
  cx.globalAlpha=.8;
  cx.fillStyle='#0d47a1';
  cx.beginPath();cx.ellipse(0,-8,10,16,0,0,Math.PI*2);cx.fill();
  cx.fillStyle='#1565c0';
  cx.beginPath();cx.ellipse(0,-10,7,12,0,0,Math.PI*2);cx.fill();
  // Ice crystal fragments
  cx.strokeStyle='#80d8ff';cx.lineWidth=1;cx.globalAlpha=.7+Math.sin(vfxTime*3)*.2;
  for(let i=0;i<4;i++){const a=i/4*Math.PI*2+vfxTime;cx.beginPath();cx.moveTo(Math.cos(a)*4,Math.sin(a)*4-8);cx.lineTo(Math.cos(a)*9,Math.sin(a)*9-8);cx.stroke();}
  // Cold eyes
  cx.fillStyle='#e3f2fd';cx.globalAlpha=.95;
  cx.beginPath();cx.arc(-3,-11,2,0,Math.PI*2);cx.fill();
  cx.beginPath();cx.arc(3,-11,2,0,Math.PI*2);cx.fill();
  cx.globalAlpha=1;cx.restore();
  drawHpBar(x,y-28,e.hp,e.maxHp,28,e.eliteColor||'#42a5f5');
}
function drawAbyssalBehemoth(cx,x,y,e){
  const b=Math.sin(e.animFrame*Math.PI*.4)*.8;cx.save();cx.translate(x,y+b);
  if(e.hitFlash>0){cx.globalAlpha=.5+e.hitFlash*.5;cx.globalCompositeOperation='lighter';}
  // Dark abyss glow
  cx.globalAlpha=.15+Math.sin(vfxTime*2)*.08;cx.fillStyle='#aa00ff';
  cx.beginPath();cx.ellipse(0,-12,22,22,0,0,Math.PI*2);cx.fill();cx.globalAlpha=1;
  // Massive dark body
  cx.fillStyle='#1a0033';cx.fillRect(-13,-26,26,25);
  cx.fillStyle='#4a148c';cx.fillRect(-11,-24,11,12);
  // Void cracks
  cx.strokeStyle='#ea80fc';cx.lineWidth=1.5;
  cx.beginPath();cx.moveTo(-7,-22);cx.lineTo(-3,-14);cx.lineTo(-7,-8);cx.stroke();
  cx.beginPath();cx.moveTo(5,-20);cx.lineTo(8,-12);cx.stroke();
  // Glowing eyes
  cx.fillStyle='#ea80fc';cx.globalAlpha=.9+Math.sin(vfxTime*6)*.1;
  cx.fillRect(-8,-18,5,5);cx.fillRect(3,-18,5,5);cx.globalAlpha=1;
  // Arms
  cx.fillStyle='#1a0033';
  cx.fillRect(-15,-18+Math.sin(e.animFrame*Math.PI*.5)*3,4,16);
  cx.fillRect(11,-18-Math.sin(e.animFrame*Math.PI*.5)*3,4,16);
  cx.restore();
  drawHpBar(x,y-34,e.hp,e.maxHp,38,e.eliteColor||'#ce93d8');
}
function drawVoidArcher(cx,x,y,e){
  const b=Math.sin(e.animFrame*Math.PI*.5)*1;cx.save();cx.translate(x,y+b);
  if(e.hitFlash>0){cx.globalAlpha=.5+e.hitFlash*.5;cx.globalCompositeOperation='lighter';}
  cx.fillStyle='#1a0033';cx.fillRect(-5,-19,10,18);
  cx.fillStyle='#4a148c';cx.fillRect(-3,-17,4,6);
  // Void eyes
  cx.fillStyle='#ea80fc';cx.globalAlpha=.9;cx.fillRect(-3,-14,2,2);cx.fillRect(1,-14,2,2);cx.globalAlpha=1;
  // Dark matter bow
  cx.strokeStyle='#7c4dff';cx.lineWidth=1.5;
  cx.beginPath();cx.arc(8,-12,7,-1.2,1.2);cx.stroke();
  cx.strokeStyle='#ea80fc';cx.lineWidth=.8;
  cx.beginPath();cx.moveTo(8,-19);cx.lineTo(8,-5);cx.stroke();
  cx.fillStyle='#1a0033';cx.fillRect(-4,0+(e.animFrame%2?1:0),3,5);cx.fillRect(1,0+(e.animFrame%2?0:1),3,5);
  cx.restore();
  drawHpBar(x,y-27,e.hp,e.maxHp,28,e.eliteColor||'#b39ddb');
}
function drawGlacialGolem(cx,x,y,e){
  const b=Math.sin(e.animFrame*Math.PI*.3)*.6;cx.save();cx.translate(x,y+b);
  if(e.hitFlash>0){cx.globalAlpha=.5+e.hitFlash*.5;cx.globalCompositeOperation='lighter';}
  drawShadow(0,6,20);
  // Ice blue body
  cx.fillStyle='#0277bd';cx.fillRect(-11,-22,22,21);
  cx.fillStyle='#01579b';cx.fillRect(-9,-20,9,10);
  // Ice shards
  cx.fillStyle='#80d8ff';cx.globalAlpha=.8;
  cx.fillRect(-11,-20,3,8);cx.fillRect(8,-22,3,10);cx.fillRect(-5,-24,4,5);cx.globalAlpha=1;
  // Cold core
  cx.fillStyle='#e3f2fd';cx.globalAlpha=.7+Math.sin(vfxTime*3)*.2;
  cx.fillRect(-4,-14,8,8);cx.globalAlpha=1;
  // Eyes
  cx.fillStyle='#0d47a1';cx.fillRect(-7,-16,4,4);cx.fillRect(3,-16,4,4);
  // Arms
  cx.fillStyle='#0277bd';
  cx.fillRect(-13,-16+Math.sin(e.animFrame*Math.PI*.5)*2,4,14);
  cx.fillRect(9,-16-Math.sin(e.animFrame*Math.PI*.5)*2,4,14);
  cx.restore();
  drawHpBar(x,y-32,e.hp,e.maxHp,36,e.eliteColor||'#29b6f6');
}

function drawGrid(){
  const G=state.golem;
  const cam=Math.round(G.col),camR=Math.round(G.row);
  const {hw,hh}=ISO.tilesVisible();
  const tw=ISO.tileW/2,th=ISO.tileH/2;
  const curBiome=(state&&state.wave)?getBiome(state.wave):BIOMES.forest;
  // Draw a larger range of tiles centered on camera
  for(let dc=-hw;dc<=hw;dc++){
    for(let dr=-hh;dr<=hh;dr++){
      const col=cam+dc,row=camR+dr;
      const {x,y}=ISO.toScreen(col,row);
      // Cull tiles completely off-screen
      if(x<-tw*2||x>canvas.width+tw*2||y<-th*2||y>canvas.height+th*2)continue;
      ctx.beginPath();
      ctx.moveTo(x,y-th);ctx.lineTo(x+tw,y);
      ctx.lineTo(x,y+th);ctx.lineTo(x-tw,y);
      ctx.closePath();
      // Motif de sol varié : utilise modulo pour pattern infini
      const mc=((col%4)+4)%4, mr=((row%4)+4)%4;
      if(mc===1&&mr===1)      ctx.fillStyle=curBiome.tile.c;
      else if((col+row)%2===0)ctx.fillStyle=curBiome.tile.a;
      else                    ctx.fillStyle=curBiome.tile.b;
      ctx.fill();
      ctx.strokeStyle=curBiome.tile.line;ctx.lineWidth=.5;ctx.stroke();
    }
  }
}
function drawParticles(){
  for(let i=0;i<PARTICLE_POOL_SIZE;i++){
    const p=_partPool[i];if(!p.active)continue;
    ctx.globalAlpha=Math.max(0,p.life/p.maxLife);
    ctx.fillStyle=p.color;
    ctx.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size);
  }
  ctx.globalAlpha=1;
}
function drawScene(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawGrid();
  // draw VFX below sprites
  drawVfx();
  // Loot ground glows (epic/legendary)
  for(let i=state.lootMarkers.length-1;i>=0;i--){
    const m=state.lootMarkers[i];
    const pulse=.5+Math.sin(vfxTime*4+i)*.5;
    const alpha=(m.life/m.maxLife)*(.5+pulse*.25);
    ctx.save();ctx.globalAlpha=alpha;
    ctx.shadowColor=m.color;ctx.shadowBlur=18;
    ctx.fillStyle=m.color;
    ctx.beginPath();ctx.ellipse(m.x,m.y,20,8,0,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;ctx.globalAlpha=1;ctx.restore();
  }
  const G=state.golem;
  // Draw elite ground auras
  for(const e of state.enemies){if(e.isElite)drawEliteAura(e);}
  const sprites=[];
  const gp=ISO.toScreen(G.col,G.row);sprites.push({d:G.col+G.row,fn:()=>drawGolem(gp.x,gp.y)});
  for(const e of state.enemies){const p=ISO.toScreen(e.col,e.row);sprites.push({d:e.col+e.row,fn:()=>e.draw(ctx,p.x,p.y,e)});}
  sprites.sort((a,b)=>a.d-b.d);for(const s of sprites)s.fn();
  drawParticles();
}

// ── Enemy type definitions (here so drawXxx fns are already defined) ──
const ETYPES={
  grunt: {hp:30,dmg:5, spd:.9, range:1.2,xp:15,gold:3,threat:1,name:'Grunt',     draw:(cx,x,y,e)=>drawGrunt(cx,x,y,e)},
  slime: {hp:20,dmg:3, spd:1.1,range:1.0,xp:10,gold:2,threat:1,name:'Slime',     draw:(cx,x,y,e)=>drawSlime(cx,x,y,e)},
  archer:{hp:25,dmg:8, spd:.7, range:3.5,xp:20,gold:4,threat:2,name:'Archer',draw:(cx,x,y,e)=>drawArcher(cx,x,y,e)},
  brute: {hp:80,dmg:14,spd:.55,range:1.5,xp:40,gold:8,threat:3,name:'Brute', draw:(cx,x,y,e)=>drawBrute(cx,x,y,e)},
  wraith:   {hp:45,dmg:10,spd:1.3,range:1.2,xp:35,gold:7, threat:2,name:'Spectre',  draw:(cx,x,y,e)=>drawWraith(cx,x,y,e)},
  // ── Biome Abyssal ──
  frostshade:      {hp:55, dmg:12,spd:1.4,range:1.2,xp:50,gold:11,threat:2,name:'Spectre Givré', draw:(cx,x,y,e)=>drawFrostShade(cx,x,y,e),    dotOnHit:{type:'void',dmg:4,dur:3}, slowOnHitVal:.3},
  abyssalbehemoth: {hp:200,dmg:30,spd:.45,range:1.6,xp:100,gold:25,threat:5,name:'Béhémoth Abyssal',draw:(cx,x,y,e)=>drawAbyssalBehemoth(cx,x,y,e),dotOnHit:{type:'void',dmg:10,dur:5}},
  voidarcher:      {hp:40, dmg:20,spd:.7, range:4.5,xp:60,gold:14,threat:3,name:'Archer du Vide',  draw:(cx,x,y,e)=>drawVoidArcher(cx,x,y,e),    dotOnHit:{type:'void',dmg:7,dur:4}},
  glacialgolem:    {hp:150,dmg:22,spd:.5, range:1.5,xp:80,gold:20,threat:4,name:'Golem Glacial',   draw:(cx,x,y,e)=>drawGlacialGolem(cx,x,y,e),  slowOnHitVal:.4},
  // ── Biome Volcanique ──
  lavabrute:{hp:120,dmg:22,spd:.5, range:1.6,xp:65,gold:15,threat:4,name:'Brute de Lave',draw:(cx,x,y,e)=>drawLavaBrute(cx,x,y,e), dotOnHit:{type:'burn',dmg:4,dur:3}},
  ember:    {hp:25, dmg:12,spd:1.5,range:1.0,xp:30,gold:8, threat:2,name:'Tison',        draw:(cx,x,y,e)=>drawEmber(cx,x,y,e),     dotOnHit:{type:'burn',dmg:3,dur:2}},
  ashwraith:{hp:60, dmg:15,spd:1.2,range:1.3,xp:55,gold:12,threat:3,name:'Spectre Cendre',draw:(cx,x,y,e)=>drawAshWraith(cx,x,y,e),dotOnHit:{type:'burn',dmg:5,dur:4}},
  scorcher: {hp:35, dmg:18,spd:.75, range:4.0,xp:45,gold:10,threat:2,name:'Carboniseur',  draw:(cx,x,y,e)=>drawScorcher(cx,x,y,e),  dotOnHit:{type:'burn',dmg:6,dur:3}},
};
