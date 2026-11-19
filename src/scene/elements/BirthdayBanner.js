import * as THREE from 'three';
import {box,labelTexture,tube} from '../../utils/textures.js';

export class BirthdayBanner {
  constructor(parent,wood,config){
    this.group=new THREE.Group();this.group.position.set(0,0,-1.45);parent.add(this.group);this.flags=[];this.bulbs=[];
    this.group.add(box(.12,4.1,.12,wood,-3.6,2.05,0),box(.12,4.1,.12,wood,3.6,2.05,0));
    const points=[];
    for(let i=0;i<=36;i++){const x=-3.6+i*.2;points.push(new THREE.Vector3(x,3.1+.65*(x/3.6)**2,0));}
    this.group.add(tube(points,.012,'#6c5b42'));
    const text='HAPPY BIRTHDAY';
    for(let i=0;i<text.length;i++){
      const x=(i-(text.length-1)/2)*.45,y=3.1+.65*(x/3.6)**2;
      if(text[i]===' ')continue;
      const shape=new THREE.Shape();shape.moveTo(-.19,0);shape.lineTo(.19,0);shape.lineTo(.19,-.45);shape.lineTo(0,-.58);shape.lineTo(-.19,-.45);shape.closePath();
      const geometry=new THREE.ShapeGeometry(shape);const uv=geometry.attributes.uv;
      for(let j=0;j<uv.count;j++)uv.setXY(j,(uv.getX(j)+.19)/.38,(uv.getY(j)+.58)/.58);
      const flag=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({map:labelTexture(text[i],{background:i%2?'#eee0c0':'#cbaa80',color:'#685340',width:128,height:192,font:'100px Cormorant Garamond'}),side:THREE.DoubleSide,roughness:.9}));
      flag.position.set(x,y,-.01);flag.userData.interaction={type:'banner',id:'banner',label:'A song in the wind',index:i};this.group.add(flag);this.flags.push(flag);
    }
    const lightPoints=[];
    for(let i=0;i<=42;i++){const x=-3.6+i*7.2/42;lightPoints.push(new THREE.Vector3(x,3.8+.28*Math.cos(x*.87),.2));}
    this.group.add(tube(lightPoints,.009,'#61563b'));
    const bulbGeo=new THREE.SphereGeometry(.035,8,6),bulbMat=new THREE.MeshBasicMaterial({color:'#ffdb90'});
    lightPoints.filter((_,i)=>i%2===0).forEach((p,i)=>{const bulb=new THREE.Mesh(bulbGeo,bulbMat);bulb.position.copy(p);this.group.add(bulb);this.bulbs.push(bulb);if(i%6===0){const light=new THREE.PointLight('#ffcd85',.5,3);light.position.copy(p);this.group.add(light);}});
    const name=new THREE.Mesh(new THREE.PlaneGeometry(1.5,.24),new THREE.MeshBasicMaterial({map:labelTexture(`FOR ${config.recipientName.toUpperCase()}`,{color:'#f4dfad',background:'#6b7560',height:128,font:'34px Cormorant Garamond'}),side:THREE.DoubleSide}));name.position.set(0,4.12,-.02);this.group.add(name);
  }
  update(time){this.flags.forEach((f,i)=>{f.rotation.x=Math.sin(time*1.25+i*.4)*.08;f.rotation.z=Math.sin(time*.8+i*.3)*.025;});}
}
