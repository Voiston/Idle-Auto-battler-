// ══ BIOME SYSTEM ══════════════════════════════════════════════════════
const BIOMES={
  forest:{
    name:'Forêt Sombre',icon:'🌲',
    tile:{a:'#071a0a',b:'#091f0c',c:'#0a2010',line:'#112515'},
    fogColor:'rgba(0,40,10,.18)',
    monsters:['grunt','slime','archer','wraith'],
    startWave:1,
  },
  volcanic:{
    name:'Terres Volcaniques',icon:'🌋',
    tile:{a:'#1a0800',b:'#200a00',c:'#1f0e00',line:'#3a1200'},
    fogColor:'rgba(80,20,0,.15)',
    monsters:['lavabrute','ember','ashwraith','scorcher'],
    startWave:8,
  },
  abyssal:{
    name:'Abysses Glaciales',icon:'❄️',
    tile:{a:'#00060f',b:'#000b18',c:'#010d1f',line:'#0a1a2e'},
    fogColor:'rgba(0,20,60,.2)',
    monsters:['frostshade','voidarcher','abyssalbehemoth','glacialgolem'],
    startWave:18,
  },
};
// Current biome determined by wave range
function getBiome(wave){
  if(wave>=18)return BIOMES.abyssal;
  if(wave>=8) return BIOMES.volcanic;
  return BIOMES.forest;
}
