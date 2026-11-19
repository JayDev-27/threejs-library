import * as THREE from 'three';

export class SunsetSky {
  constructor(scene) {
    this.material = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      uniforms: { uTime: { value: 0 }, uSky: { value: new THREE.TextureLoader().load('/images/closed-door-sky.webp',t=>{t.colorSpace=THREE.SRGBColorSpace;}) } },
      vertexShader: `varying vec3 vDirection; void main(){vDirection=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `
        varying vec3 vDirection; uniform float uTime; uniform sampler2D uSky;
        float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1)),f.x),f.y);}
        float fbm(vec2 p){float n=0.,a=.52;for(int i=0;i<5;i++){n+=a*noise(p);p=p*2.05+vec2(13.2,7.8);a*=.49;}return n;}
        void main(){
          vec3 d=normalize(vDirection);float h=max(d.y,0.);
          vec3 gold=vec3(1.2,.28,.025),rose=vec3(.49,.08,.19),violet=vec3(.07,.018,.14);
          vec3 sky=mix(gold,rose,smoothstep(0.,.38,h));sky=mix(sky,violet,smoothstep(.25,1.,h));
          vec3 sunDir=normalize(vec3(.12,.13,-1.));float sd=max(dot(d,sunDir),0.);
          sky+=vec3(1.,.6,.15)*pow(sd,26.)*.6;
          sky+=vec3(1.5,1.2,.6)*pow(sd,1400.);
          vec2 p=d.xz/max(.12,d.y+.13)*1.7;
          float clouds=fbm(p+vec2(uTime*.003,0.));
          float mask=smoothstep(.48,.69,clouds)*smoothstep(.035,.2,d.y);
          vec3 cloud=mix(vec3(1.2,.15,.012),vec3(.09,.025,.07),smoothstep(.5,.67,clouds));
          sky=mix(sky,cloud,mask*.85);
          vec2 skyUv=vec2(fract(atan(d.x,-d.z)/6.2831853+.5),clamp(d.y*1.65,0.,1.));
          vec3 referenceSky=texture2D(uSky,skyUv+vec2(sin(uTime*.012)*.001,0.)).rgb;
          sky=mix(sky,referenceSky,.88*smoothstep(0.,.14,h));
          sky=mix(sky,vec3(.35,.18,.07),1.-smoothstep(-.12,0.,d.y));
          gl_FragColor=vec4(sky,1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(220,40,24), this.material);
    dome.renderOrder=-3;
    scene.add(dome);
  }
  update(time){this.material.uniforms.uTime.value=time;}
}
