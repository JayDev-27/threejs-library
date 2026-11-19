import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {SunsetSky} from './SunsetSky.js';
import {MeadowPathway} from './MeadowPathway.js';
import {PortalDoor} from './PortalDoor.js';
import {BirthdaySanctuary} from './BirthdaySanctuary.js';
import {Atmosphere} from './Atmosphere.js';
import {ReferenceLandscape} from './ReferenceLandscape.js';
import {frameCamera,referenceView} from './referenceLook.js';

export class World {
  constructor(container,config,reducedMotion){
    this.container=container;this.reducedMotion=reducedMotion;this.mobile=innerWidth<700;
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
    this.renderer.info.autoReset=false;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,this.mobile?1.5:2));this.renderer.setSize(innerWidth,innerHeight);
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.0;this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;container.appendChild(this.renderer.domElement);
    this.scene=new THREE.Scene();this.scene.fog=new THREE.FogExp2('#bc9467',.0085);this.camera=new THREE.PerspectiveCamera(this.mobile?74:52,innerWidth/innerHeight,.08,300);this.camera.position.set(0,1.3,14.5);
    this.camera.position.set(referenceView.x,referenceView.y,referenceView.z);this.lookAt=new THREE.Vector3(referenceView.x,referenceView.y,0);this.sky=new SunsetSky(this.scene);this.meadow=new MeadowPathway(this.scene,this.mobile);this.landscape=new ReferenceLandscape(this.scene,this.meadow);this.portal=new PortalDoor(this.scene);this.sanctuary=new BirthdaySanctuary(this.scene,config);this.effects=new Atmosphere(this.scene,reducedMotion);
    this.isReady=false;this.ready=Promise.all([this.landscape.ready,this.portal.ready]);
    this.hemisphere=new THREE.HemisphereLight('#b794ca','#273b16',.85);this.scene.add(this.hemisphere);
    this.sun=new THREE.DirectionalLight('#ffbb58',3.7);this.sun.position.set(.8,5.3,-25);this.sun.castShadow=true;this.sun.shadow.mapSize.set(2048,2048);Object.assign(this.sun.shadow.camera,{left:-16,right:16,top:16,bottom:-16,near:.1,far:70});this.sun.shadow.bias=-.0007;this.sun.shadow.normalBias=.025;this.scene.add(this.sun);
    const fill=new THREE.DirectionalLight('#b8a9d2',.6);fill.position.set(4,6,10);this.scene.add(fill);
    const tableLight=new THREE.PointLight('#ffdfb1',5,12,2);tableLight.position.set(0,3,-6.5);this.scene.add(tableLight);
    this.sanctuary.group.renderOrder=2;this.sanctuaryMaterials=new Set();this.sanctuary.group.traverse(object=>{if(object.material)(Array.isArray(object.material)?object.material:[object.material]).forEach(material=>{material.stencilRef=1;material.stencilFunc=THREE.EqualStencilFunc;this.sanctuaryMaterials.add(material);});});
    const target=new THREE.WebGLRenderTarget(innerWidth,innerHeight,{type:THREE.HalfFloatType,stencilBuffer:true});target.samples=this.mobile?2:4;
    this.composer=new EffectComposer(this.renderer,target);this.composer.addPass(new RenderPass(this.scene,this.camera));
    this.bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.2,.65,1.2);this.composer.addPass(this.bloom);
    this.grade=new ShaderPass({uniforms:{tDiffuse:{value:null},uPortal:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform sampler2D tDiffuse;uniform float uPortal;varying vec2 vUv;void main(){vec3 c=texture2D(tDiffuse,vUv).rgb;float vignette=1.-smoothstep(.25,.84,length((vUv-.5)*vec2(1.,.85)))*.27;float shaft=pow(max(0.,1.-abs(vUv.x-.5)*2.),5.)*uPortal*.09;c+=vec3(1.,.64,.2)*shaft;gl_FragColor=vec4(c*vignette,1.);}'});this.composer.addPass(this.grade);this.composer.addPass(new OutputPass());
    this.onResize=()=>{this.mobile=innerWidth<700;frameCamera(this.camera,innerWidth,innerHeight,this.progress||0);this.renderer.setPixelRatio(Math.min(devicePixelRatio,this.mobile?1.5:2));this.renderer.setSize(innerWidth,innerHeight);this.composer.setSize(innerWidth,innerHeight);};window.addEventListener('resize',this.onResize);
  }
  update(time,delta,progress){
    this.progress=progress;frameCamera(this.camera,innerWidth,innerHeight,progress);
    const t=this.reducedMotion?0:time;this.sky.update(t);this.landscape.update(t,progress,this.camera);this.meadow.update(t,progress);this.portal.update(t,progress);this.sanctuary.update(t);this.effects.update(t,delta);this.grade.uniforms.uPortal.value=Math.sin(THREE.MathUtils.smoothstep(progress,.4,.74)*Math.PI);this.sanctuary.group.visible=progress>.09;
    this.sanctuaryMaterials.forEach(material=>material.stencilWrite=progress<.64);
    this.camera.lookAt(this.lookAt);this.renderer.info.reset();this.composer.render();
  }
  dispose(){window.removeEventListener('resize',this.onResize);this.scene.traverse(o=>{o.geometry?.dispose();if(o.material){const materials=Array.isArray(o.material)?o.material:[o.material];materials.forEach(m=>{Object.values(m).forEach(v=>{if(v?.isTexture)v.dispose();});m.dispose();});}});this.composer.dispose();this.renderer.dispose();}
}
