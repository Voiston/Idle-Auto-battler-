// ══ WEB AUDIO ENGINE ══════════════════════════════════════════════════
let _audioCtx = null;

function getAudioCtx(){
  if(!_audioCtx){
    try{ _audioCtx = new (window.AudioContext||window.webkitAudioContext)(); }
    catch(e){ _audioCtx = null; }
  }
  // Resume if suspended (mobile browsers require user gesture)
  if(_audioCtx && _audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
}

// Core: play a simple synth tone
function playTone(freq, type='sine', duration=0.12, vol=0.18, decay=0.08){
  const ac = getAudioCtx(); if(!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain); gain.connect(ac.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ac.currentTime);
  gain.gain.setValueAtTime(vol, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + duration + decay);
}

// Chord: play multiple freqs simultaneously
function playChord(freqs, type='sine', duration=0.18, vol=0.12){
  freqs.forEach(f => playTone(f, type, duration, vol));
}

// Noise burst (for hit/explosion)
function playNoise(duration=0.08, vol=0.15){
  const ac = getAudioCtx(); if(!ac) return;
  const bufSz = Math.floor(ac.sampleRate * duration);
  const buf = ac.createBuffer(1, bufSz, ac.sampleRate);
  const data = buf.getChannelData(0);
  for(let i=0;i<bufSz;i++) data[i] = (Math.random()*2-1);
  const src = ac.createBufferSource();
  const gain = ac.createGain();
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass'; filter.frequency.value = 800;
  src.buffer = buf;
  src.connect(filter); filter.connect(gain); gain.connect(ac.destination);
  gain.gain.setValueAtTime(vol, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
  src.start(); src.stop(ac.currentTime + duration + 0.05);
}

// ── Sound library ─────────────────────────────────────────────────────
const SFX = {
  attack()  { playTone(180, 'sawtooth', 0.06, 0.12); },
  crit()    { playChord([440,660,880], 'square', 0.12, 0.08); },
  kill()    { playNoise(0.06, 0.12); playTone(120, 'sawtooth', 0.08, 0.08); },
  levelUp() { playChord([523,659,784,1047], 'sine', 0.35, 0.10); },
  spell()   { playTone(440, 'sine', 0.10, 0.14); playTone(660, 'triangle', 0.15, 0.08); },
  equip()   { playChord([330,494], 'square', 0.15, 0.10); },
  gold()    { playTone(880, 'sine', 0.06, 0.10); playTone(1100, 'sine', 0.08, 0.08); },
  bossRage(){ playChord([110,147,165], 'sawtooth', 0.4, 0.14); },
  death()   { playTone(55,'sawtooth',0.6,0.20,0.4); playNoise(0.3,0.10); },
  setBonus(){ playChord([392,494,587,740],'sine',0.5,0.12); },
  buy()     { playTone(660,'sine',0.08,0.12); playTone(880,'sine',0.10,0.08); },
  error()   { playTone(220,'sawtooth',0.12,0.15); },
  // Resume audio context on first user touch (mobile requirement)
  init()    { document.addEventListener('touchstart', ()=>getAudioCtx(), {once:true, passive:true});
              document.addEventListener('click',      ()=>getAudioCtx(), {once:true}); }
};
