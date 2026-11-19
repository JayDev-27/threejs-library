export class SoundManager {
  constructor(){this.context=null;this.enabled=false;this.stream=null;this.micFrame=0;this.micVersion=0;this.scheduled=[];}
  async init(){
    if(this.context){await this.context.resume();return;}
    const AudioContext=window.AudioContext||window.webkitAudioContext;
    if(!AudioContext)throw new Error('Audio is not supported in this browser.');
    this.context=new AudioContext();this.master=this.context.createGain();this.master.gain.value=0;this.master.connect(this.context.destination);
    const buffer=this.context.createBuffer(1,this.context.sampleRate*4,this.context.sampleRate),samples=buffer.getChannelData(0);let last=0;
    for(let i=0;i<samples.length;i++){const white=Math.random()*2-1;last=(last+.02*white)/1.02;samples[i]=last*3.5;}
    this.wind=this.context.createBufferSource();this.wind.buffer=buffer;this.wind.loop=true;
    const filter=this.context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=450;
    const windGain=this.context.createGain();windGain.gain.value=.14;this.wind.connect(filter).connect(windGain).connect(this.master);this.wind.start();
    this.ambienceTimer=window.setInterval(()=>{if(this.enabled)this.note([60,64,67,72,76][Math.floor(Math.random()*5)],.035,3);},3600);
  }
  async toggle(){await this.init();this.enabled=!this.enabled;this.master.gain.setTargetAtTime(this.enabled?.65:0,this.context.currentTime,.25);if(this.enabled)this.chime();return this.enabled;}
  note(midi,volume=.13,duration=1.5,offset=0){
    if(!this.context||!this.enabled)return;
    const start=this.context.currentTime+offset,frequency=440*2**((midi-69)/12);
    for(const [harmonic,weight] of [[1,1],[2,.23],[3,.06]]){
      const oscillator=this.context.createOscillator(),gain=this.context.createGain();oscillator.type='sine';oscillator.frequency.value=frequency*harmonic;
      gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(volume*weight,start+.012);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
      oscillator.connect(gain).connect(this.master);oscillator.start(start);oscillator.stop(start+duration+.02);this.scheduled.push(oscillator);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();this.scheduled=this.scheduled.filter(o=>o!==oscillator);};
    }
  }
  chime(){[72,76,79,84].forEach((n,i)=>this.note(n,.08,2,i*.13));}
  birthday(){
    const notes=[[67,.35],[67,.2],[69,.6],[67,.6],[72,.6],[71,1],[67,.35],[67,.2],[69,.6],[67,.6],[74,.6],[72,1],[67,.35],[67,.2],[79,.6],[76,.6],[72,.6],[71,.6],[69,.9],[77,.35],[77,.2],[76,.6],[72,.6],[74,.6],[72,1.2]];
    let t=0;notes.forEach(([n,d])=>{this.note(n,.12,1.6,t);t+=d*.72;});
  }
  async startMicrophone(onBlow){
    this.stopMicrophone();const version=this.micVersion;await this.init();
    if(version!==this.micVersion)return;
    if(!navigator.mediaDevices?.getUserMedia)throw new Error('Microphone access is unavailable. You can use the blow-out button instead.');
    const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}});
    if(version!==this.micVersion){stream.getTracks().forEach(track=>track.stop());return;}
    this.stream=stream;
    this.micSource=this.context.createMediaStreamSource(this.stream);this.analyser=this.context.createAnalyser();this.analyser.fftSize=1024;this.micSource.connect(this.analyser);
    const samples=new Float32Array(1024);let frames=0;const started=performance.now();
    const listen=()=>{this.analyser.getFloatTimeDomainData(samples);let sum=0;for(const v of samples)sum+=v*v;const rms=Math.sqrt(sum/samples.length);frames=rms>.13?frames+1:Math.max(0,frames-1);if(frames>5&&performance.now()-started>600){this.stopMicrophone();onBlow();return;}if(performance.now()-started>15000){this.stopMicrophone();window.dispatchEvent(new CustomEvent('mic-timeout'));return;}this.micFrame=requestAnimationFrame(listen);};listen();
  }
  stopMicrophone(){this.micVersion++;cancelAnimationFrame(this.micFrame);this.stream?.getTracks().forEach(track=>track.stop());this.micSource?.disconnect();this.stream=null;this.micSource=null;}
  dispose(){this.stopMicrophone();clearInterval(this.ambienceTimer);this.scheduled.forEach(o=>{try{o.stop();}catch{}});this.context?.close();}
}
