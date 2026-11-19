import * as THREE from 'three';

export const referenceView = { aspect: 1672 / 941, fov: 52, x: .14, y: 1.968, z: 12.38 };

// Decode the photograph into scene radiance so the final ACES pass preserves
// its orange highlights and violet shadows instead of tone-mapping it twice.
export const referenceRadianceGLSL = `
  vec3 referenceRadiance(vec3 color) {
    const mat3 undoOutput = mat3(
      .643038,.059268,.005961,
      .311186,.931436,.063930,
      .045775,.009296,.930110
    );
    const mat3 undoInput = mat3(
      1.764740,-.147028,-.036337,
      -.675778,1.160251,-.162436,
      -.088962,-.013223,1.198774
    );
    vec3 v=clamp(undoOutput*color,vec3(.00001),vec3(.99));
    vec3 a=.983729*v-1.;
    vec3 b=.432951*v-.0245786;
    vec3 c=.238081*v+.000090537;
    vec3 linearColor=(-b-sqrt(max(vec3(0.),b*b-4.*a*c)))/(2.*a);
    return max(vec3(0.),undoInput*linearColor*.6);
  }
`;

export function referenceMaterial(map, {side=THREE.FrontSide}={}) {
  return new THREE.ShaderMaterial({
    side,
    uniforms:{uMap:{value:map}},
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`uniform sampler2D uMap;varying vec2 vUv;${referenceRadianceGLSL}
      void main(){vec4 photo=texture2D(uMap,vUv);gl_FragColor=vec4(referenceRadiance(photo.rgb),photo.a);}`,
  });
}

export function referenceCamera() {
  const camera=new THREE.PerspectiveCamera(referenceView.fov,referenceView.aspect,.08,300);
  camera.position.set(referenceView.x,referenceView.y,referenceView.z);
  camera.lookAt(referenceView.x,referenceView.y,0);
  camera.updateMatrixWorld();
  return camera;
}

export function frameCamera(camera,width,height,progress=0) {
  const aspect=width/height;
  const openingFov=2*Math.atan(Math.tan(THREE.MathUtils.degToRad(referenceView.fov/2))*Math.min(1,referenceView.aspect/aspect))*180/Math.PI;
  const blend=THREE.MathUtils.smoothstep(progress,.55,.83);
  camera.aspect=aspect;
  camera.fov=THREE.MathUtils.lerp(openingFov,width<700?74:52,blend);
  if(width<700&&blend<1)camera.setViewOffset(width,height,0,160*(1-blend),width,height);
  else camera.clearViewOffset();
  camera.updateProjectionMatrix();
}
