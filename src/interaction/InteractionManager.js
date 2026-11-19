import * as THREE from 'three';
import gsap from 'gsap';

export class InteractionManager {
  constructor({camera,scene,canvas,onSelect}){
    this.camera=camera;this.scene=scene;this.canvas=canvas;this.onSelect=onSelect;this.raycaster=new THREE.Raycaster();this.pointer=new THREE.Vector2(3,3);this.enabled=false;this.hovered=null;this.frame=0;
    this.tooltip=document.querySelector('#tooltip');this.roots=[];scene.traverse(o=>{if(o.userData.interaction)this.roots.push(o);});
    this.move=e=>{const rect=canvas.getBoundingClientRect();this.pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);this.tooltip.style.left=`${Math.min(e.clientX+15,innerWidth-230)}px`;this.tooltip.style.top=`${e.clientY-38}px`;};
    this.down=e=>{this.start={x:e.clientX,y:e.clientY};};
    this.click=e=>{if(!this.enabled||!this.start||Math.hypot(e.clientX-this.start.x,e.clientY-this.start.y)>8)return;this.move(e);const target=this.pick();if(target){this.setHover(null);onSelect(target.userData.interaction,target);}};
    this.leave=()=>{this.pointer.set(3,3);this.setHover(null);};
    canvas.addEventListener('pointermove',this.move);canvas.addEventListener('pointerdown',this.down);canvas.addEventListener('pointerup',this.click);canvas.addEventListener('pointerleave',this.leave);
  }
  pick(){
    this.raycaster.setFromCamera(this.pointer,this.camera);
    if(this.portalOnly){const p=this.raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,0,1),-.015),new THREE.Vector3());if(!p||p.x< -1.03||p.x>.99||p.y<.18||p.y>4.09)return null;}
    const hits=this.raycaster.intersectObjects(this.roots,true);
    for(const hit of hits){let node=hit.object;while(node&&!node.userData.interaction)node=node.parent;if(node){let visible=true,p=node;while(p){if(!p.visible)visible=false;p=p.parent;}if(visible)return node;}}
    return null;
  }
  setHover(object){
    if(object===this.hovered)return;
    if(this.hovered){const prev=this.hovered;prev.traverse(child=>{if(child.material&&!Array.isArray(child.material)&&child.material.emissive&&child.userData.baseEmissive!==undefined){gsap.to(child.material,{emissiveIntensity:child.userData.baseEmissive,duration:.25});child.material.emissive.copy(child.userData.originalEmissive);}});}
    this.hovered=object;this.canvas.style.cursor=object?'pointer':'default';this.tooltip.classList.toggle('visible',!!object);
    if(object){this.tooltip.textContent=`✧  ${object.userData.interaction.label}`;object.traverse(child=>{if(child.material&&!Array.isArray(child.material)&&child.material.emissive){if(child.userData.baseEmissive===undefined){child.userData.baseEmissive=child.material.emissiveIntensity;child.userData.originalEmissive=child.material.emissive.clone();}child.material.emissive.set('#c59245');gsap.to(child.material,{emissiveIntensity:.2,duration:.3});}});}
  }
  update(){if(this.enabled&&++this.frame%4===0)this.setHover(this.pick());if(!this.enabled)this.setHover(null);}
  dispose(){for(const [event,handler]of [['pointermove',this.move],['pointerdown',this.down],['pointerup',this.click],['pointerleave',this.leave]])this.canvas.removeEventListener(event,handler);}
}
