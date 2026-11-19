import * as THREE from 'three';
import {referenceCamera,referenceView,referenceRadianceGLSL} from './referenceLook.js';
import {canvasTexture,seededRandom} from '../utils/textures.js';

export class ReferenceLandscape {
  constructor(scene,meadow){
    const loader=new THREE.TextureLoader();
    this.texture=new THREE.Texture();
    this.ready=loader.loadAsync('/images/meadow-landscape.webp').then(texture=>{texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;this.texture.dispose();this.texture=texture;this.uniforms.uMap.value=texture;});
    const camera=referenceCamera();
    const projection=new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);
    const random=seededRandom(191);
    const detail=canvasTexture(512,512,ctx=>{ctx.fillStyle='#243819';ctx.fillRect(0,0,512,512);for(let i=0;i<3200;i++){const x=random()*512,y=random()*512;ctx.strokeStyle=['#40512a','#536137','#192d15','#344a23'][i%4];ctx.lineWidth=.8+random();ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+(random()-.5)*8,y-4,x+(random()-.5)*15,y-12-random()*15);ctx.stroke();}for(let i=0;i<430;i++){const x=random()*512,y=random()*512;ctx.fillStyle=['#4b6130','#375027','#62743c'][i%3];for(let j=0;j<3;j++){const a=j/3*Math.PI*2;ctx.beginPath();ctx.ellipse(x+Math.cos(a)*2,y+Math.sin(a)*2,2,3,a,0,Math.PI*2);ctx.fill();}}});detail.wrapS=detail.wrapT=THREE.RepeatWrapping;
    this.uniforms={uMap:{value:this.texture},uReference:{value:projection},uTime:{value:0},uDetail:{value:detail},uGround:{value:1},uProgress:{value:0},uCamera:{value:new THREE.Vector3()}};
    const material=new THREE.ShaderMaterial({
      uniforms:this.uniforms,side:THREE.DoubleSide,transparent:true,
      vertexShader:`uniform mat4 uReference;varying vec4 vReference;varying vec3 vWorld;void main(){vec4 world=modelMatrix*vec4(position,1.);vWorld=world.xyz;vReference=uReference*world;gl_Position=projectionMatrix*viewMatrix*world;}`,
      fragmentShader:`uniform sampler2D uMap;uniform sampler2D uDetail;uniform float uGround;uniform float uProgress;uniform vec3 uCamera;varying vec4 vReference;varying vec3 vWorld;${referenceRadianceGLSL}
        void main(){vec2 uv=vReference.xy/vReference.w*.5+.5;vec2 sampleUv=1.-abs(mod(uv,2.)-1.);vec3 photo=texture2D(uMap,sampleUv).rgb;
          float inside=smoothstep(-.05,.03,uv.x)*(1.-smoothstep(.97,1.05,uv.x))*smoothstep(-.08,.015,uv.y);
          vec3 fallback=texture2D(uMap,fract(vWorld.xz*.023)*vec2(.95,.15)+vec2(.025,.015)).rgb*.65;
          if(uGround<.5)inside=1.;
          vec3 color=mix(fallback,photo,inside);
          float near=(1.-smoothstep(2.,8.,distance(vWorld.xz,uCamera.xz)))*smoothstep(.15,.4,uProgress)*uGround;
          vec3 detail=texture2D(uDetail,vWorld.xz*.55).rgb;
          color=mix(color,detail*1.3,near*.9);
          float alpha=1.-smoothstep(30.,68.,-vWorld.z)*uGround;
          gl_FragColor=vec4(referenceRadiance(color),alpha);}`,
    });
    this.ground=new THREE.Mesh(meadow.terrain.clone(),material);this.ground.position.y=.003;this.ground.renderOrder=-1;scene.add(this.ground);
    const shadows=new THREE.Mesh(meadow.terrain.clone(),new THREE.ShadowMaterial({color:'#1a1722',opacity:.4,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));shadows.position.y=.012;shadows.receiveShadow=true;scene.add(shadows);
    // The far scenery and near terrain share the same projection. The photo
    // becomes a perspective scene rather than a new picture during scrolling.
    const distance=referenceView.z+110,height=2*distance*Math.tan(THREE.MathUtils.degToRad(referenceView.fov/2));
    const backdropMaterial=material.clone();backdropMaterial.transparent=false;backdropMaterial.uniforms={...this.uniforms,uGround:{value:0}};
    this.backdrop=new THREE.Mesh(new THREE.PlaneGeometry(height*referenceView.aspect*4,height*2),backdropMaterial);
    this.backdrop.position.set(referenceView.x,referenceView.y,-110);scene.add(this.backdrop);
    this.backdrop.renderOrder=-2;
  }
  update(time,progress,camera){this.uniforms.uTime.value=time;this.uniforms.uProgress.value=progress;this.uniforms.uCamera.value.copy(camera.position);}
}
