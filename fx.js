// ══ VISUAL FX SYSTEM ══════════════════════════════════════════════════
// vfx pool — each has a draw(ctx,t) fn + lifetime
const vfxPool=[];
let vfxTime=0;

function spawnVfx(obj){vfxPool.push({...obj,born:vfxTime,age:0});}

function updateVfx(dt){
  vfxTime+=dt;
  for(let i=vfxPool.length-1;i>=0;i--){
    vfxPool[i].age+=dt;
    if(vfxPool[i].age>=vfxPool[i].life) vfxPool.splice(i,1);
  }
}

function drawVfx(){
  for(const fx of vfxPool){
    const t=fx.age/fx.life; // 0→1
    ctx.save();
    fx.draw(ctx,t,fx);
    ctx.restore();
  }
}

// ── FX: Shockwave (séisme) ────────────────────────────────────────────
function fxShockwave(x,y){
  spawnVfx({x,y,life:.5,draw(ctx,t){
    const r=t*60;const alpha=(1-t)*.8;
    ctx.strokeStyle=`rgba(255,107,53,${alpha})`;ctx.lineWidth=3*(1-t)+1;
    ctx.beginPath();ctx.ellipse(x,y,r,r*.35,0,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle=`rgba(255,200,50,${alpha*.6})`;ctx.lineWidth=1;
    ctx.beginPath();ctx.ellipse(x,y,r*.6,r*.35*.6,0,0,Math.PI*2);ctx.stroke();
  }});
  // shards
  for(let i=0;i<8;i++){
    const a=i/8*Math.PI*2;const spd=rnd(30,70);
    spawnVfx({x,y,life:.6,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd*.4,draw(ctx,t,f){
      const px=f.x+f.vx*t;const py=f.y+f.vy*t;
      ctx.fillStyle=`rgba(255,${100+Math.floor(t*100)},50,${1-t})`;
      ctx.fillRect(px-2,py-2,4,4);
    }});
  }
}

// ── FX: Shield aura (orbiting rings) ─────────────────────────────────
function fxShield(x,y,dur){
  spawnVfx({x,y,life:dur,draw(ctx,t,f){
    const G=state.golem;const gp=ISO.toScreen(G.col,G.row);
    const pulse=.5+Math.sin(vfxTime*6)*.5;
    ctx.strokeStyle=`rgba(59,130,246,${.6*pulse})`;ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(gp.x,gp.y-16,22,22,vfxTime*.8,0,Math.PI*2);ctx.stroke();
    // orbiting dot
    const a=vfxTime*3;
    ctx.fillStyle=`rgba(100,180,255,${pulse})`;
    ctx.beginPath();ctx.arc(gp.x+Math.cos(a)*22,gp.y-16+Math.sin(a)*22,3,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(gp.x+Math.cos(a+Math.PI)*22,gp.y-16+Math.sin(a+Math.PI)*22,3,0,Math.PI*2);ctx.fill();
  }});
}

// ── FX: Ice nova (expanding hex ring) ────────────────────────────────
function fxNova(x,y){
  spawnVfx({x,y,life:.8,draw(ctx,t){
    const r=t*80;const alpha=(1-t)*.9;
    // hex ring
    ctx.strokeStyle=`rgba(0,229,255,${alpha})`;ctx.lineWidth=2;
    ctx.beginPath();
    for(let i=0;i<6;i++){const a=i/6*Math.PI*2;ctx.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r*.4);}
    ctx.closePath();ctx.stroke();
    // ice crystals
    for(let i=0;i<6;i++){
      const a=i/6*Math.PI*2;const cx2=x+Math.cos(a)*r;const cy2=y+Math.sin(a)*r*.4;
      ctx.fillStyle=`rgba(150,240,255,${alpha})`;
      ctx.fillRect(cx2-3,cy2-5,3,8);ctx.fillRect(cx2-5,cy2-2,8,3);
    }
    // inner glow
    const g=ctx.createRadialGradient(x,y,0,x,y,r*.5);
    g.addColorStop(0,`rgba(0,229,255,${alpha*.3})`);g.addColorStop(1,'rgba(0,229,255,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(x,y,r*.5,r*.5*.4,0,0,Math.PI*2);ctx.fill();
  }});
}

// ── FX: Chain lightning (line bolts between targets) ──────────────────
function fxChain(points){
  // points: [{x,y}...]
  if(points.length<2)return;
  spawnVfx({points:[...points],life:.4,draw(ctx,t){
    const alpha=(1-t);
    for(let i=0;i<points.length-1;i++){
      const a=points[i];const b=points[i+1];
      // jittered lightning
      ctx.strokeStyle=`rgba(255,220,0,${alpha})`;ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(a.x,a.y);
      const mx=(a.x+b.x)/2+rnd(-8,8)*(1-t);const my=(a.y+b.y)/2+rnd(-8,8)*(1-t);
      ctx.quadraticCurveTo(mx,my,b.x,b.y);ctx.stroke();
      // core white
      ctx.strokeStyle=`rgba(255,255,255,${alpha*.7})`;ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.quadraticCurveTo(mx,my,b.x,b.y);ctx.stroke();
      // arc flash
      ctx.fillStyle=`rgba(255,240,80,${alpha*.8})`;ctx.beginPath();ctx.arc(b.x,b.y,4*(1-t)+2,0,Math.PI*2);ctx.fill();
    }
  }});
}

// ── FX: Berserker aura (fire particles around golem) ─────────────────
function fxBerserker(dur){
  spawnVfx({life:dur,draw(ctx,t){
    const G=state.golem;const p=ISO.toScreen(G.col,G.row);
    const n=6;
    for(let i=0;i<n;i++){
      const a=(i/n)*Math.PI*2+vfxTime*2;const r=16+Math.sin(vfxTime*5+i)*4;
      const fx=p.x+Math.cos(a)*r;const fy=p.y-14+Math.sin(a)*r*.4;
      const flicker=.5+Math.sin(vfxTime*8+i)*.5;
      ctx.fillStyle=`rgba(255,${80+Math.floor(flicker*100)},20,${.7*flicker})`;
      ctx.beginPath();ctx.arc(fx,fy,3+flicker*2,0,Math.PI*2);ctx.fill();
    }
    // orange tint flash
    const pulse=Math.sin(vfxTime*4)*.5+.5;
    ctx.fillStyle=`rgba(255,80,0,${pulse*.15})`;
    ctx.beginPath();ctx.ellipse(p.x,p.y-8,24,24,0,0,Math.PI*2);ctx.fill();
  }});
}

// ── FX: Meteor (falling rock + crater) ───────────────────────────────
function fxMeteor(tx,ty){
  // falling phase
  spawnVfx({tx,ty,life:.5,draw(ctx,t){
    const startX=tx+80;const startY=ty-120;
    const cx=startX+(tx-startX)*t;const cy=startY+(ty-startY)*t;
    // trail
    for(let i=0;i<5;i++){
      const bt=t-i*.04;if(bt<0)continue;
      const bx=startX+(tx-startX)*bt;const by=startY+(ty-startY)*bt;
      const a=(5-i)/5*.6;
      ctx.fillStyle=`rgba(255,${150-i*25},0,${a})`;
      ctx.beginPath();ctx.arc(bx,by,6-i,0,Math.PI*2);ctx.fill();
    }
    // rock
    const sz=10-t*2;
    ctx.fillStyle='#c0392b';ctx.fillRect(cx-sz/2,cy-sz/2,sz,sz);
    ctx.fillStyle='#e74c3c';ctx.fillRect(cx-sz/3,cy-sz/2,sz/3,sz/3);
  }});
  // impact at t=0.5 → spawn crater
  setTimeout(()=>{
    spawnVfx({x:tx,y:ty,life:.7,draw(ctx,t){
      const r=(1-t)*50;const alpha=(1-t)*.9;
      // crater ring
      ctx.strokeStyle=`rgba(255,69,0,${alpha})`;ctx.lineWidth=3;
      ctx.beginPath();ctx.ellipse(tx,ty,r,r*.4,0,0,Math.PI*2);ctx.stroke();
      // debris
      for(let i=0;i<8;i++){
        const a=i/8*Math.PI*2;const dr=rnd(10,r);
        ctx.fillStyle=`rgba(200,80,20,${alpha*.8})`;
        ctx.fillRect(tx+Math.cos(a)*dr-2,ty+Math.sin(a)*dr*.4-2,4,4);
      }
      // glow
      const g=ctx.createRadialGradient(tx,ty,0,tx,ty,r);
      g.addColorStop(0,`rgba(255,100,0,${alpha*.5})`);g.addColorStop(1,'rgba(255,100,0,0)');
      ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(tx,ty,r,r*.4,0,0,Math.PI*2);ctx.fill();
    }});
    spawnPart(tx,ty,20,'#ff4500',5,1);
  },250);
}

// ── FX: Lifesteal drain beam ──────────────────────────────────────────
function fxLifesteal(ex,ey,gx,gy){
  spawnVfx({ex,ey,gx,gy,life:.4,draw(ctx,t){
    const a=(1-t)*.8;
    ctx.strokeStyle=`rgba(180,0,0,${a})`;ctx.lineWidth=2;
    ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(ex,ey);ctx.lineTo(gx,gy);ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle=`rgba(255,50,50,${a})`;ctx.beginPath();ctx.arc(gx,gy-8,4*(1-t),0,Math.PI*2);ctx.fill();
  }});
}

// ── FX: Heal pulse ────────────────────────────────────────────────────
function fxHeal(x,y){
  spawnVfx({x,y,life:.6,draw(ctx,t){
    const r=t*30;const a=(1-t)*.7;
    ctx.strokeStyle=`rgba(34,197,94,${a})`;ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(x,y-8,r,r*.4,0,0,Math.PI*2);ctx.stroke();
    // crosses
    for(let i=0;i<3;i++){
      const a2=i/3*Math.PI*2+vfxTime;const fx=x+Math.cos(a2)*r*.6;const fy=y-8+Math.sin(a2)*r*.4*.6;
      ctx.fillStyle=`rgba(100,255,150,${a})`;
      ctx.fillRect(fx-1,fy-4,2,8);ctx.fillRect(fx-4,fy-1,8,2);
    }
  }});
}

// ── FX: Auto-attack slash ─────────────────────────────────────────────
function fxSlash(x,y,crit){
  const color=crit?'#ffd700':'#ff6b35';
  spawnVfx({x,y,life:.25,color,draw(ctx,t,f){
    const a=(1-t)*.9;const scale=1+t*.5;
    ctx.strokeStyle=`rgba(${crit?'255,215,0':'255,107,53'},${a})`;ctx.lineWidth=2;
    ctx.save();ctx.translate(x,y);ctx.scale(scale,scale*.4);
    ctx.beginPath();ctx.arc(0,0,12,-0.8,0.8);ctx.stroke();
    ctx.beginPath();ctx.arc(0,0,8,-1,1);ctx.stroke();
    ctx.restore();
  }});
}

// ── FX: Toxic cloud (green bubbling zone) ────────────────────────────
function fxToxicCloud(x,y){
  spawnVfx({x,y,life:3,draw(ctx,t){
    const alpha=(t<.2?t/.2:t>.8?(1-t)/.2:1)*.5;
    // pulsing green mist
    for(let i=0;i<3;i++){
      const r=40+i*15+Math.sin(vfxTime*2+i)*8;
      const g=ctx.createRadialGradient(x,y,0,x,y,r);
      g.addColorStop(0,`rgba(50,200,50,${alpha*.4})`);g.addColorStop(1,'rgba(50,200,50,0)');
      ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(x,y,r,r*.4,0,0,Math.PI*2);ctx.fill();
    }
    // rising bubbles
    for(let i=0;i<5;i++){
      const bx=x+Math.sin(vfxTime*1.5+i*1.3)*30;
      const by=y-((vfxTime*20+i*15)%40);
      ctx.fillStyle=`rgba(80,220,80,${alpha*.8})`;
      ctx.beginPath();ctx.arc(bx,by,3,0,Math.PI*2);ctx.fill();
    }
  }});
}

// ── FX: Vortex (spiral pull) ──────────────────────────────────────────
function fxVortex(x,y){
  spawnVfx({x,y,life:.8,draw(ctx,t){
    const alpha=(1-t)*.8;const n=8;
    for(let i=0;i<n;i++){
      const a=i/n*Math.PI*2+vfxTime*5;const r=(1-t)*60;
      const px=x+Math.cos(a)*r;const py=y+Math.sin(a)*r*.4;
      ctx.fillStyle=`rgba(150,80,255,${alpha})`;
      ctx.beginPath();ctx.arc(px,py,3*(1-t)+1,0,Math.PI*2);ctx.fill();
    }
    // core swirl
    ctx.strokeStyle=`rgba(180,100,255,${alpha*.6})`;ctx.lineWidth=2;
    ctx.beginPath();
    for(let i=0;i<30;i++){
      const a=i/30*Math.PI*6;const r=(1-t)*50*(i/30);
      const px=x+Math.cos(a)*r;const py=y+Math.sin(a)*r*.4;
      i===0?ctx.moveTo(px,py):ctx.lineTo(px,py);
    }
    ctx.stroke();
  }});
}

// ── FX: Blizzard (sweeping snow) ─────────────────────────────────────
function fxBlizzard(x,y,dur){
  spawnVfx({x,y,life:dur,draw(ctx,t){
    const alpha=(t<.1?t/.1:t>.9?(1-t)/.1:1)*.7;
    // wind streaks
    for(let i=0;i<8;i++){
      const wx=x+Math.cos(i/8*Math.PI*2)*60*rnd(.5,1);
      const wy=y+Math.sin(i/8*Math.PI*2)*60*rnd(.5,1)*.4;
      const len=rnd(15,35);const a=Math.random()*Math.PI*.3-0.2;
      ctx.strokeStyle=`rgba(200,230,255,${alpha*rnd(.3,.7)})`;ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(wx,wy);ctx.lineTo(wx+Math.cos(a)*len,wy+Math.sin(a)*len*.4);ctx.stroke();
    }
    // snowflakes
    for(let i=0;i<6;i++){
      const fx2=x+Math.sin(vfxTime*2+i*1.1)*50;const fy=y+((vfxTime*15+i*20)%50-25)*.4;
      ctx.fillStyle=`rgba(210,235,255,${alpha*.8})`;
      ctx.font='12px sans-serif';ctx.fillText('❄',fx2-6,fy);
    }
  }});
}

// ── FX: Quake 360 ring burst ─────────────────────────────────────────
function fxQuake(x,y){
  for(let ring=0;ring<3;ring++){
    setTimeout(()=>{
      spawnVfx({x,y,life:.5,draw(ctx,t){
        const r=t*80;const a=(1-t)*.7;
        ctx.strokeStyle=`rgba(180,100,30,${a})`;ctx.lineWidth=3-t*2;
        ctx.beginPath();ctx.ellipse(x,y,r,r*.4,0,0,Math.PI*2);ctx.stroke();
        // cracks
        for(let i=0;i<6;i++){
          const ca=i/6*Math.PI*2;const cr=r*.8;
          ctx.strokeStyle=`rgba(200,130,50,${a*.6})`;ctx.lineWidth=1;
          ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(ca)*cr,y+Math.sin(ca)*cr*.4);ctx.stroke();
        }
      }});
    },ring*120);
  }
  spawnPart(x,y,20,'#c8640a',4,1);
}

// ── FX: Arc storm (random bolt strikes) ─────────────────────────────
function fxArcStorm(gx,gy,targets){
  for(let i=0;i<targets.length;i++){
    setTimeout(()=>{
      const t=targets[i];if(!t)return;
      const tp=ISO.toScreen(t.col,t.row);
      // bolt from sky above target
      const fromX=tp.x+rnd(-30,30);const fromY=tp.y-rnd(80,140);
      spawnVfx({life:.3,draw(ctx,tt){
        const a=(1-tt)*.9;
        ctx.strokeStyle=`rgba(180,220,255,${a})`;ctx.lineWidth=2;
        ctx.beginPath();ctx.moveTo(fromX,fromY);
        // jagged bolt
        const segs=4;
        for(let s=1;s<=segs;s++){
          const px=fromX+(tp.x-fromX)*s/segs+rnd(-10,10);
          const py=fromY+(tp.y-fromY)*s/segs+rnd(-5,5);
          ctx.lineTo(px,py);
        }
        ctx.stroke();
        ctx.fillStyle=`rgba(200,240,255,${a})`;ctx.beginPath();ctx.arc(tp.x,tp.y,5*(1-tt)+2,0,Math.PI*2);ctx.fill();
      }});
      spawnPart(tp.x,tp.y,6,'#b0d4ff',3,.5);
    },i*100);
  }
}
