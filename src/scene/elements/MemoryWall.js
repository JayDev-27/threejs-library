import * as THREE from 'three';
import {box,memoryArtwork,noteTexture,tube} from '../../utils/textures.js';

export class MemoryWall {
  constructor(parent,wood,config){
    this.group=new THREE.Group();this.group.position.set(-4.1,0,-7);this.group.rotation.y=.35;parent.add(this.group);this.memories=[];
    this.group.add(box(.14,3.6,.16,wood,-1.6,1.8,0),box(.14,3.6,.16,wood,1.6,1.8,0),box(3.34,.13,.15,wood,0,3.45,0),box(3.34,.1,.12,wood,0,.65,-.1));
    for(const x of [-1.15,-.6,0,.6,1.15])this.group.add(box(.025,2.8,.025,wood,x,2,-.1));
    for(let row=0;row<2;row++){
      const y=2.88-row*1.05;const points=[];
      for(let j=0;j<=24;j++){const x=-1.6+j*3.2/24;points.push(new THREE.Vector3(x,y-.12*(1-(x/1.6)**2),.07));}this.group.add(tube(points,.008));
      for(let col=0;col<4;col++){
        const i=row*4+col,data=config.polaroidMemories[i],x=-1.18+col*.79;
        const polaroid=new THREE.Group();polaroid.position.set(x,y-.38,.09);polaroid.rotation.z=data.rotationOffset;
        const front=memoryArtwork(data,i);data.previewUrl=front.image.toDataURL('image/webp');
        const materials=[new THREE.MeshStandardMaterial({color:'#e4d8c3'}),new THREE.MeshStandardMaterial({color:'#e4d8c3'}),new THREE.MeshStandardMaterial({color:'#e4d8c3'}),new THREE.MeshStandardMaterial({color:'#e4d8c3'}),new THREE.MeshStandardMaterial({map:front,roughness:.6}),new THREE.MeshStandardMaterial({map:noteTexture(data),roughness:.9})];
        polaroid.add(box(.67,.74,.022,materials));polaroid.userData.interaction={type:'memory',id:'memories',label:data.caption,data,index:i};
        this.group.add(polaroid);this.memories.push(polaroid);
        const clip=box(.035,.12,.035,wood,x,y-.03,.14);clip.rotation.z=.08;this.group.add(clip);
        if(data.imageUrl){new THREE.TextureLoader().load(data.imageUrl,texture=>{texture.colorSpace=THREE.SRGBColorSpace;const canvas=document.createElement('canvas');canvas.width=512;canvas.height=560;const ctx=canvas.getContext('2d');ctx.drawImage(front.image,0,0);const img=texture.image;const scale=Math.max(462/img.width,420/img.height);ctx.save();ctx.beginPath();ctx.rect(25,25,462,420);ctx.clip();ctx.drawImage(img,256-img.width*scale/2,235-img.height*scale/2,img.width*scale,img.height*scale);ctx.restore();front.needsUpdate=true;front.image=canvas;try{data.previewUrl=canvas.toDataURL('image/webp');}catch{data.previewUrl=data.imageUrl;}texture.dispose();},undefined,()=>{data.imageFailed=true;});}
      }
    }
    for(let i=0;i<config.handwrittenNotes.length;i++){
      const data=config.handwrittenNotes[i],note=new THREE.Mesh(new THREE.PlaneGeometry(.7,.66,4,4),new THREE.MeshStandardMaterial({map:noteTexture(data),side:THREE.DoubleSide,roughness:1}));note.position.set(-.75+i*1.5,.71,.16);note.rotation.z=i?.08:-.08;note.userData.interaction={type:'note',id:'note',label:data.title,data};this.group.add(note);
    }
    const lightPoints=[];
    for(let i=0;i<=30;i++){const x=-1.65+i*3.3/30;lightPoints.push(new THREE.Vector3(x,3.46-.3*(1-(x/1.65)**2),.2));}this.group.add(tube(lightPoints,.009,'#5e5b38'));
    const bulbMat=new THREE.MeshBasicMaterial({color:'#ffe4a6'}),bulbGeo=new THREE.SphereGeometry(.032,8,6);
    lightPoints.filter((_,i)=>i%2===0).forEach(p=>{const b=new THREE.Mesh(bulbGeo,bulbMat);b.position.copy(p);this.group.add(b);});
    const light=new THREE.PointLight('#ffdb9e',3,7,2);light.position.set(0,2.4,1);this.group.add(light);
  }
  update(time){this.memories.forEach((p,i)=>{if(!p.userData.inspecting)p.rotation.x=Math.sin(time*.75+i)*.018;});}
}
