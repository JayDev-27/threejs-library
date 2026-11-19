import * as THREE from 'three';
import {box,woodTexture} from '../utils/textures.js';
import {referenceMaterial} from './referenceLook.js';

export class PortalDoor {
  constructor(scene) {
    this.group=new THREE.Group();scene.add(this.group);
    const wood=new THREE.MeshStandardMaterial({map:woodTexture(),color:'#c3b9a0',roughness:.93});
    const dark=new THREE.MeshStandardMaterial({color:'#514838',roughness:.9});
    this.group.add(box(.2,4.4,.23,wood,-1.2,2.2,0),box(.2,4.4,.23,wood,1.2,2.2,0),box(2.6,.2,.23,wood,0,4.29,0));
    for(const x of [-1.2,1.2]) this.group.add(box(.05,4.15,.05,dark,x+Math.sign(x)*.06,2.13,.13));
    this.doorPivot=new THREE.Group();this.doorPivot.position.set(-1.03,.18,0);this.doorPivot.scale.set(.944,.954,1);this.group.add(this.doorPivot);
    const slab=box(2.14,4.1,.13,wood,1.07,2.05,0);this.doorPivot.add(slab);
    for(const x of [.13,2.01])this.doorPivot.add(box(.16,4.06,.07,wood,x,2.05,.1));
    for(const y of [.14,1.55,3.96])this.doorPivot.add(box(1.95,.17,.06,wood,1.07,y,.1));
    for(const x of [.62,1.53]){
      for(const panel of [{y:.86,h:1.08},{y:2.79,h:2.06}]){
        this.doorPivot.add(box(.72,panel.h,.025,dark,x,panel.y,.079));
        this.doorPivot.add(box(.64,panel.h-.08,.03,wood,x,panel.y,.097));
        for(const side of [-1,1])this.doorPivot.add(box(.045,panel.h,.04,wood,x+side*.36,panel.y,.13));
        for(const side of [-1,1])this.doorPivot.add(box(.74,.045,.04,wood,x,panel.y+side*panel.h/2,.13));
      }
    }
    this.handle=new THREE.Group();this.handle.position.set(1.88,1.92,.18);
    const metal=new THREE.MeshStandardMaterial({color:'#6e563a',metalness:.8,roughness:.42});
    this.handle.add(box(.12,.25,.05,metal));this.handle.add(box(.26,.045,.06,metal,-.09,0,.06));this.doorPivot.add(this.handle);
    for(const y of [.4,2.1,3.7])this.group.add(box(.11,.21,.13,metal,-1.07,y,.09));
    const loader=new THREE.TextureLoader();
    this.ready=Promise.all([
      loader.loadAsync('/images/door-face.webp'),loader.loadAsync('/images/door-frame.webp'),
    ]).then(([faceMap,frameMap])=>{
      faceMap.colorSpace=frameMap.colorSpace=THREE.SRGBColorSpace;faceMap.anisotropy=frameMap.anisotropy=8;
      this.face=new THREE.Mesh(new THREE.PlaneGeometry(2.14,4.1),referenceMaterial(faceMap));this.face.position.set(1.07,2.05,.158);this.doorPivot.add(this.face);
      const shape=new THREE.Shape();shape.moveTo(-1.3,0);shape.lineTo(1.3,0);shape.lineTo(1.3,4.4);shape.lineTo(-1.3,4.4);shape.closePath();
      const hole=new THREE.Path();hole.moveTo(-1.03,.18);hole.lineTo(-1.03,4.09);hole.lineTo(.99,4.09);hole.lineTo(.99,.18);hole.closePath();shape.holes.push(hole);
      const geometry=new THREE.ShapeGeometry(shape);const uv=geometry.attributes.uv;
      for(let i=0;i<uv.count;i++)uv.setXY(i,(uv.getX(i)+1.3)/2.6,uv.getY(i)/4.4);
      this.frameFace=new THREE.Mesh(geometry,referenceMaterial(frameMap));this.frameFace.position.z=.17;this.group.add(this.frameFace);
    });
    this.light=new THREE.PointLight('#ffc474',0,9,2);this.light.position.set(0,2,-.5);scene.add(this.light);
    this.aperture=new THREE.Mesh(new THREE.PlaneGeometry(2.02,3.91),new THREE.MeshBasicMaterial({side:THREE.DoubleSide,colorWrite:false,depthWrite:false,stencilWrite:true,stencilRef:1,stencilFunc:THREE.AlwaysStencilFunc,stencilZPass:THREE.ReplaceStencilOp}));this.aperture.position.set(-.02,2.135,.015);this.aperture.renderOrder=-.5;this.group.add(this.aperture);
    this.shimmer=new THREE.Mesh(new THREE.PlaneGeometry(2.14,4.1),new THREE.ShaderMaterial({
      transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
      uniforms:{uTime:{value:0},uOpen:{value:0}},
      vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:'varying vec2 vUv;uniform float uTime;uniform float uOpen;void main(){float ripple=sin(vUv.y*22.+sin(vUv.x*19.+uTime)*2.+uTime)*.08+.12;float edge=pow(abs(vUv.x-.5)*2.,8.);gl_FragColor=vec4(1.,.67,.25,(ripple+edge*.3)*uOpen);}',
    }));this.shimmer.position.set(0,2.1,-.08);this.group.add(this.shimmer);
    this.rays=[];
    for(let i=0;i<5;i++){
      const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,uniforms:{uOpacity:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv;uniform float uOpacity;void main(){float a=pow(max(0.,1.-abs(vUv.x-.5)*2.),2.)*pow(1.-vUv.y,2.);gl_FragColor=vec4(1.,.73,.3,a*uOpacity);}'});
      const ray=new THREE.Mesh(new THREE.PlaneGeometry(1.2+i*.4,11),material);ray.rotation.x=-Math.PI/2+.14;ray.rotation.z=(i-2)*.1;ray.position.set((i-2)*.18,.35,5);scene.add(ray);this.rays.push(ray);
    }
  }
  update(time,progress){
    const open=THREE.MathUtils.smoothstep(progress,.09,.62);this.doorPivot.rotation.y=open*1.63;
    this.handle.rotation.z=-Math.sin(THREE.MathUtils.smoothstep(progress,.07,.16)*Math.PI)*.48;
    this.handle.visible=progress>.12;
    this.light.intensity=open*12;this.shimmer.material.uniforms.uTime.value=time;this.shimmer.material.uniforms.uOpen.value=open*(1-THREE.MathUtils.smoothstep(progress,.5,.75));
    this.rays.forEach(r=>r.material.uniforms.uOpacity.value=open*.13*(1-THREE.MathUtils.smoothstep(progress,.55,.75)));
  }
}
