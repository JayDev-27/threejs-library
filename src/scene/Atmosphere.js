import * as THREE from 'three';
import {glowTexture,seededRandom} from '../utils/textures.js';

export class Atmosphere {
  constructor(scene,reducedMotion=false){
    this.scene=scene;this.reducedMotion=reducedMotion;this.random=seededRandom(234);this.bursts=[];this.butterflies=[];this.smoke=[];
    const pos=[],seeds=[];for(let i=0;i<180;i++){pos.push((this.random()-.5)*24,this.random()*5,this.random()*32-17);seeds.push(this.random()*6.28);}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('aSeed',new THREE.Float32BufferAttribute(seeds,1));
    this.dust=new THREE.Points(geo,new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uTime:{value:0},uPixelRatio:{value:Math.min(devicePixelRatio,2)}},vertexShader:'uniform float uTime;uniform float uPixelRatio;attribute float aSeed;varying float vAlpha;void main(){vec3 p=position;p.x+=sin(uTime*.15+aSeed)*.4;p.y+=sin(uTime*.3+aSeed)*.25;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(20./-mv.z,1.,7.)*uPixelRatio;vAlpha=.35+sin(uTime+aSeed)*.25;}',fragmentShader:'varying float vAlpha;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(1.,.8,.4,smoothstep(.5,0.,d)*vAlpha);}'}));scene.add(this.dust);
    this.glow=glowTexture();
  }
  burst(origin,color='#f5d196',firework=false){
    const count=firework?160:65,positions=new Float32Array(count*3),colors=new Float32Array(count*3),vel=[];
    for(let i=0;i<count;i++){
      positions.set(origin.toArray(),i*3);const c=new THREE.Color(i%3===0?'#fff0bf':color);colors.set(c.toArray(),i*3);
      const angle=this.random()*Math.PI*2;const speed=(firework?2.4:1)*(this.random()+.4);vel.push(new THREE.Vector3(Math.cos(angle)*speed,this.random()*speed*2+.5,Math.sin(angle)*speed));
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(positions,3));geo.setAttribute('color',new THREE.BufferAttribute(colors,3));
    const mesh=new THREE.Points(geo,new THREE.PointsMaterial({size:firework?.095:.055,map:this.glow,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));this.scene.add(mesh);this.bursts.push({mesh,vel,life:0,duration:firework?4:2.6});
  }
  butterfliesAt(origin){
    for(let i=0;i<14;i++){
      const butterfly=new THREE.Group();const material=new THREE.MeshBasicMaterial({color:['#efb3db','#efdaa0','#94c9df'][i%3],side:THREE.DoubleSide,transparent:true,opacity:.85});
      const wings=[];
      for(const side of [-1,1]){const wing=new THREE.Mesh(new THREE.CircleGeometry(.095,8),material);wing.geometry.translate(side*.075,0,0);butterfly.add(wing);wings.push(wing);}
      butterfly.position.copy(origin);this.scene.add(butterfly);this.butterflies.push({group:butterfly,wings,origin:origin.clone(),seed:this.random()*6.28,life:0});
    }
  }
  smokeAt(origin){
    for(let i=0;i<7;i++){const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:this.glow,color:'#d5c8c0',transparent:true,opacity:.2,depthWrite:false}));sprite.position.copy(origin);sprite.position.x+=(this.random()-.5)*.1;sprite.scale.setScalar(.08);this.scene.add(sprite);this.smoke.push({sprite,life:-i*.09,origin:origin.clone()});}
  }
  update(time,delta){
    this.dust.material.uniforms.uTime.value=this.reducedMotion?0:time;
    for(let i=this.bursts.length-1;i>=0;i--){const b=this.bursts[i];b.life+=delta;const p=b.mesh.geometry.attributes.position;for(let j=0;j<p.count;j++){b.vel[j].y-=delta*.8;p.setXYZ(j,p.getX(j)+b.vel[j].x*delta,p.getY(j)+b.vel[j].y*delta,p.getZ(j)+b.vel[j].z*delta);}p.needsUpdate=true;b.mesh.material.opacity=Math.max(0,1-b.life/b.duration);if(b.life>b.duration){this.scene.remove(b.mesh);b.mesh.geometry.dispose();b.mesh.material.dispose();this.bursts.splice(i,1);}}
    for(let i=this.butterflies.length-1;i>=0;i--){const b=this.butterflies[i];b.life+=delta;const t=b.life,s=b.seed;b.group.position.set(b.origin.x+Math.sin(t*1.2+s)*(t*.25+.3),b.origin.y+t*.25+Math.sin(t*2+s)*.13,b.origin.z+Math.cos(t+s)*(t*.15+.2));b.group.rotation.y=t+s;b.wings.forEach((w,j)=>w.rotation.y=Math.sin(t*19+s)*.9*(j?1:-1));if(t>10){this.scene.remove(b.group);b.group.children.forEach(w=>w.geometry.dispose());b.wings[0].material.dispose();this.butterflies.splice(i,1);}}
    for(let i=this.smoke.length-1;i>=0;i--){const s=this.smoke[i];s.life+=delta;if(s.life<0)continue;s.sprite.position.y+=delta*.15;s.sprite.position.x+=Math.sin(time*3+i)*delta*.035;s.sprite.scale.setScalar(.06+s.life*.1);s.sprite.material.opacity=Math.max(0,.22*(1-s.life/2));if(s.life>2){this.scene.remove(s.sprite);s.sprite.material.dispose();this.smoke.splice(i,1);}}
  }
}
