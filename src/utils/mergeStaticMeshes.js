import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Batch unmoving details while retaining interactive objects and animated flames.
export function mergeStaticMeshes(root){
  root.updateWorldMatrix(true,true);const inverse=root.matrixWorld.clone().invert();const batches=new Map();const originals=[];
  root.traverse(mesh=>{
    if(!mesh.isMesh||Array.isArray(mesh.material)||mesh.material.isShaderMaterial||mesh.userData.interaction)return;
    let parent=mesh.parent;while(parent&&parent!==root){if(parent.userData.interaction)return;parent=parent.parent;}
    const key=mesh.material.uuid;if(!batches.has(key))batches.set(key,{material:mesh.material,geometries:[],castShadow:false,receiveShadow:false});
    const batch=batches.get(key);batch.geometries.push(mesh.geometry.clone().applyMatrix4(inverse.clone().multiply(mesh.matrixWorld)));batch.castShadow||=mesh.castShadow;batch.receiveShadow||=mesh.receiveShadow;originals.push(mesh);
  });
  originals.forEach(mesh=>mesh.removeFromParent());
  for(const batch of batches.values()){
    const geometry=mergeGeometries(batch.geometries,false);batch.geometries.forEach(g=>g.dispose());
    if(geometry){const mesh=new THREE.Mesh(geometry,batch.material);mesh.castShadow=batch.castShadow;mesh.receiveShadow=batch.receiveShadow;root.add(mesh);}
  }
}

