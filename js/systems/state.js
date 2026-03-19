// ── Canvas globals (set on DOMContentLoaded) ─────────────────────────
let canvas, ctx, cZone;
function initCanvas(){
  canvas = document.getElementById('gameCanvas');
  ctx    = canvas.getContext('2d');
  cZone  = document.getElementById('canvas-zone');
}

// ══ STATE ══════════════════════════════════════════════════════════════
const BASE_STATS={hp:100,maxHp:100,mp:50,maxMp:50,xp:0,xpNext:100,level:1,
  str:10,int:8,spd:5,def:3,atkDmg:12,atkSpd:1.2,critChance:5,gold:0};
const BASE_RES={resFire:0,resIce:0,resVoid:0};
const state={
  golem:{
    ...JSON.parse(JSON.stringify(BASE_STATS)),
    atkTimer:0,atkRange:1.6,col:8,row:8,gstate:'patrol',fleeTimer:0,target:null,
    patrol:{col:8,row:8},patrolTimer:0,facing:1,animFrame:0,animTimer:0,hitFlash:0,
    equipped:{head:null,body:null,arm1:null,arm2:null,belt:null,boots:null},
    equippedSpells:[null,null,null,null],
    spellSlotsMax:4,
    baseStats:{...JSON.parse(JSON.stringify(BASE_STATS)),...BASE_RES},
    cdReduction:0,mpRegen:2,hpRegen:1,
    upgrades:{}, // id→level
  },
  enemies:[],inventory:[],activeSpells:[],lootMarkers:[],
  wave:1,score:0,waveTimer:3,waveDelay:5,waveActive:false,totalKills:0,
  totalCrits:0,bossKills:0,maxWave:0,totalGoldEarned:0,noHitKills:0,_lastHitWave:0,
};
