import {mergeStaticMeshes} from '../utils/mergeStaticMeshes.js';
import * as THREE from 'three';
import gsap from 'gsap';
import {box,woodTexture,tube} from '../utils/textures.js';
import {BirthdayBanner} from './elements/BirthdayBanner.js';
import {CelebrationTable} from './elements/CelebrationTable.js';
import {MemoryWall} from './elements/MemoryWall.js';

export class BirthdaySanctuary {
  constructor(scene,config){
    this.group=new THREE.Group();scene.add(this.group);this.lanterns=[];
    const wood=new THREE.MeshStandardMaterial({map:woodTexture(),color:'#93794f',roughness:.92});
    this.banner=new BirthdayBanner(this.group,wood,config);this.table=new CelebrationTable(this.group,wood,config);this.memories=new MemoryWall(this.group,wood,config);
    const metal=new THREE.MeshStandardMaterial({color:'#665b3e',metalness:.4,roughness:.6});const glass=new THREE.MeshStandardMaterial({color:'#f8d99a',emissive:'#ffb23e',emissiveIntensity:.7,transparent:true,opacity:.75});
    for(const [x,z] of [[-2.5,-4.7],[2.8,-5],[-3,-9.5],[3,-10],[-1.8,-11],[2.5,-8]]){
      const lantern=new THREE.Group();lantern.position.set(x,0,z);lantern.add(box(.26,.04,.26,metal,0,.025),box(.2,.32,.2,glass,0,.2),box(.29,.05,.29,metal,0,.39));
      for(const xx of [-.115,.115])for(const zz of [-.115,.115])lantern.add(box(.018,.34,.018,metal,xx,.21,zz));
      const handle=new THREE.Mesh(new THREE.TorusGeometry(.08,.008,6,15,Math.PI),metal);handle.position.y=.43;lantern.add(handle);
      const light=new THREE.PointLight('#ffcf75',1.1,3,2);light.position.y=.25;lantern.add(light);lantern.userData.interaction={type:'lantern',id:'lantern',label:'Send a little wish skyward'};this.group.add(lantern);mergeStaticMeshes(lantern);this.lanterns.push(lantern);
    }
    // Side garlands make the sanctuary feel enclosed without adding walls.
    for(const side of [-1,1]){
      const points=[];
      for(let i=0;i<=20;i++){const z=-4-i*.38;points.push(new THREE.Vector3(side*(3.6+(z+4)*-.05),3.85-Math.sin(i/20*Math.PI)*.8,z));}
      this.group.add(tube(points,.01,'#65583d'));
      points.filter((_,i)=>i%2===0).forEach(p=>{const bulb=new THREE.Mesh(new THREE.SphereGeometry(.04,8,6),new THREE.MeshBasicMaterial({color:'#ffda95'}));bulb.position.copy(p);this.group.add(bulb);});
    }
    const secret=new THREE.Group();secret.position.set(3.4,0,-4.4);secret.userData.interaction={type:'butterflies',id:'blue-flower',label:'This little flower has a secret'};
    for(let i=0;i<9;i++){const head=new THREE.Mesh(new THREE.SphereGeometry(.055,7,6),new THREE.MeshStandardMaterial({color:'#6a9bd4',emissive:'#558dce',emissiveIntensity:.6}));head.position.set(Math.sin(i)*.12,.4+i*.045,Math.cos(i)*.1);secret.add(head);}secret.add(box(.018,.6,.018,new THREE.MeshStandardMaterial({color:'#547344'}),0,.3));this.group.add(secret);this.secretFlower=secret;
  }
  launch(lantern){
    if(lantern.userData.flying)return;lantern.userData.flying=true;
    const p=lantern.position.clone();gsap.to(lantern.position,{y:7,x:p.x+1.8,z:p.z-3,duration:9,ease:'power1.inOut',onComplete:()=>{lantern.position.copy(p);lantern.userData.flying=false;}});gsap.to(lantern.rotation,{y:Math.PI*.7,duration:9,ease:'none'});
  }
  update(time){this.banner.update(time);this.table.update(time);this.memories.update(time);}
}
