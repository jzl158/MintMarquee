/**
 * Modern Three.js imports and utilities
 * Updated from legacy THREE global to ES6 modules
 */

// Core Three.js
import * as THREE from 'three';

// Post-processing - use three/examples/jsm instead of three-stdlib
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';

// Shaders
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader.js';
import { FilmShader } from 'three/examples/jsm/shaders/FilmShader.js';
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader.js';
import { VignetteShader } from 'three/examples/jsm/shaders/VignetteShader.js';
import { LuminosityHighPassShader } from 'three/examples/jsm/shaders/LuminosityHighPassShader.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

// Controls
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// DeviceOrientationControls deprecated/removed from Three.js
// import { DeviceOrientationControls } from 'three/examples/jsm/controls/DeviceOrientationControls.js';

// Loaders for 3D printing formats
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// Note: 3MFLoader support - not available in three.js examples, may need custom implementation

// Note: Modern Three.js freezes the namespace, so we can't attach properties
// All classes are exported directly instead

// Customize FilmShader fragment shader
FilmShader.fragmentShader = [
  "#include <common>",
  "uniform float time;",
  "uniform bool grayscale;",
  "uniform float nIntensity;",
  "uniform float sIntensity;",
  "uniform float sCount;",
  "uniform sampler2D tDiffuse;",
  "varying vec2 vUv;",
  "void main() {",
  "vec4 cTextureScreen = texture2D( tDiffuse, vUv );",
  "float dx = rand( vUv + time );",
  "vec3 cResult = cTextureScreen.rgb + cTextureScreen.rgb * clamp( 0.1 + dx, 0.0, 1.0 );",
  "vec2 sc = vec2( sin( vUv.y * sCount ), cos( vUv.y * sCount ) );",
  "cResult += cTextureScreen.rgb * vec3( sc.x, sc.x, sc.x ) * sIntensity;",
  "cResult = cTextureScreen.rgb + clamp( nIntensity, 0.0,1.0 ) * ( cResult - cTextureScreen.rgb );",
  "if( grayscale ) {",
  "cResult = vec3( cResult.r * 0.3 + cResult.g * 0.59 + cResult.b * 0.11 );",
  "}",
  "gl_FragColor =  vec4( cResult, cTextureScreen.a );",
  "}"
].join("\n");

// Custom StereoEffect class (needed for VR mode)
export class StereoEffect {
  private _stereo: THREE.StereoCamera;
  private renderer: THREE.WebGLRenderer;
  private composer: any;
  private renderPass: any;

  constructor(renderer: THREE.WebGLRenderer, composer: any, renderPass: any) {
    this.renderer = renderer;
    this.composer = composer;
    this.renderPass = renderPass;
    this._stereo = new THREE.StereoCamera();
    this._stereo.aspect = 0.5;
  }

  setEyeSeparation(eyeSep: number) {
    this._stereo.eyeSep = eyeSep;
  }

  setSize(width: number, height: number) {
    this.renderer.setSize(width, height);
  }

  render(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    scene.updateMatrixWorld();
    if (camera.parent === null) camera.updateMatrixWorld();
    this._stereo.update(camera);

    const size = this.renderer.getSize(new THREE.Vector2());
    if (this.renderer.autoClear) this.renderer.clear();
    this.renderer.setScissorTest(true);

    // Left eye
    this.renderer.setScissor(0, 0, size.width / 2, size.height);
    this.renderer.setViewport(0, 0, size.width / 2, size.height);
    this.renderPass.camera = this._stereo.cameraL;
    this.composer.render(0.01);

    // Right eye
    this.renderer.setScissor(size.width / 2, 0, size.width / 2, size.height);
    this.renderer.setViewport(size.width / 2, 0, size.width / 2, size.height);
    this.renderPass.camera = this._stereo.cameraR;
    this.composer.render(0.01);

    this.renderer.setScissorTest(false);
  }
}

export {
  THREE,
  // Export loaders for direct import
  STLLoader,
  OBJLoader,
  GLTFLoader,
  // Export controls
  OrbitControls,
  // DeviceOrientationControls removed from Three.js
  // Export post-processing
  EffectComposer,
  RenderPass,
  ShaderPass,
  UnrealBloomPass,
  FilmPass,
  OutlinePass,
  // Export shaders
  CopyShader,
  FilmShader,
  RGBShiftShader,
  VignetteShader,
  LuminosityHighPassShader,
  FXAAShader,
  // StereoEffect exported as class above
};
