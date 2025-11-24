/**
 * Created by shu on 10/5/2017.
 */
import TWEEN from "tween.js";
import { Component } from "react";
import Router from "next/router";
import dynamic from "next/dynamic"
import throttle from "lodash/throttle";

import {
  THREE,
  STLLoader,
  OBJLoader,
  GLTFLoader,
  OrbitControls,
  EffectComposer,
  RenderPass,
  ShaderPass,
  UnrealBloomPass,
  FilmPass,
  OutlinePass,
  CopyShader,
  FilmShader,
  RGBShiftShader,
  VignetteShader,
  LuminosityHighPassShader,
  FXAAShader,
  StereoEffect
} from "../utils/three";
import { useCartContext } from "../context/CartContext";
import { ModelFormat, Product } from "../types/product";
const EditorSidebar = dynamic(() => import("./EditorSidebar"));

// utils
const traverse = (object, callback) => {
  if (object && typeof object.children !== "undefined") {
    for (let i = 0; i < object.children.length; ++i) {
      traverse(object.children[i], callback);
    }
  }
  if (object) {
    callback(object);
  }
};

const objectFocus = object => {
  let materials =
    object.material instanceof Array ? object.material : [object.material];
  materials.forEach(material => {
    material.wireframe = true;
    // material.opacity = 0.8
    // material.transparent = true
    // material.colorBk = material.color
    // material.color = {r: 1.4, g: 1.4, b: 1.4}
  });
};

const objectBlur = object => {
  let materials =
    object.material instanceof Array ? object.material : [object.material];
  materials.forEach(material => {
    material.wireframe = false;
    // material.opacity = 1
    // material.transparent = false
    // material.color = material.colorBk
  });
};

// end utils

// FilmShader and StereoEffect customizations moved to utils/three.ts


class Editor extends Component<{
  details: Product;
  addToCart: (x: any) => void;
}> {
  three;
  materials;
  objects;
  wireframeObjects;
  shapeObjects;
  wireframe;
  pointOpacity;
  isMob;
  loaded;
  canvas;
  stereoEffect;
  vr;
  initialScale;
  initialPosition;
  mousemoved;
  selectedObject;
  hoveredObjectDta;
  selected;
  selectedObjectData;
  highlightedObject;
  hoveredObjectData;
  modelGroup;
  initialRotation;

  constructor(props) {
    super(props);

    this.three = {};
    this.materials = {};

    this.objects = [];
    this.wireframeObjects = [];
    this.shapeObjects = [];

    this.wireframe = false;
    this.pointOpacity = 0;

    this.addToCart = this.addToCart.bind(this);
    this.renderThree = this.renderThree.bind(this);
    this.rotateToLeftView = this.rotateToLeftView.bind(this);
    this.rotateToFrontView = this.rotateToFrontView.bind(this);
    this.rotateToTopView = this.rotateToTopView.bind(this);
    this.switchToWireframe = this.switchToWireframe.bind(this);
    this.switchToModel = this.switchToModel.bind(this);
    this.switchToVR = this.switchToVR.bind(this);
    this.renderLoop = this.renderLoop.bind(this);
    this.selectObject = this.selectObject.bind(this);
    this.changeObjectColor = this.changeObjectColor.bind(this);
    this.handleResize = throttle(this.handleResize.bind(this), 100, false);
    this.hoverObject = throttle(this.hoverObject.bind(this), 100, false);
  }
  componentDidMount() {
    console.log("MODEL PROPS:", this.props);
    window.addEventListener("resize", this.handleResize);

    this.isMob = window.DeviceOrientationEvent ? true : false;

    this.initThree(window.innerWidth, window.innerHeight);
    this.initScene();
    this.initMaterials();

    this.initEffects();
    this.initModel().then(() => {
      this.renderLoop();
      this.loaded = true;
      this.setState({});
    });
  }
  componentWillUnmount() {
    this.renderLoop = () => { };
  }

  // user event handlers
  handleResize() {
    const { renderer, camera } = this.three;

    let width = window.innerWidth,
      height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);

    if (this.stereoEffect) {
      this.stereoEffect.setSize(width, height);
    }
  }

  addToCart() {
    (window as any).capturescreen().then(url => {
      this.props.addToCart({ ...this.props.details, url });
    });
  }

  // initializations
  initThree(width, height) {
    const renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(1); //window.devicePixelRatio || 1)
    renderer.setSize(width, height);
    // Modern Three.js color management (replaces gammaInput/gammaOutput)
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const camera = new THREE.PerspectiveCamera(50, width / height, 1, 10000);
    camera.lookAt(new THREE.Vector3());

    let controls;

    controls = new OrbitControls(camera, this.canvas);
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.rotateSpeed = 0.12;

    /*
    if (this.isMob) {
      controls = new DeviceOrientationControls(camera);
    } else {

    controls = new OrbitControls(camera, this.canvas);
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.rotateSpeed = 0.12;

    }
    */

    const raycaster = new THREE.Raycaster();

    (window as any).capturescreen = () => {
      return new Promise(resolve => {
        fetch(renderer.domElement.toDataURL("image/jpeg"))
          .then(data => data.blob())
          .then(blob => {
            let blobURL = URL.createObjectURL(blob);
            console.log(blobURL);
            resolve(blobURL);
          });
      });
    };

    this.three.renderer = renderer;
    this.three.camera = camera;
    this.three.controls = controls;
    this.three.raycaster = raycaster;
  }
  initMaterials() {
    const shapeMaterial = new THREE.ShaderMaterial({
      name: "shapeMaterial",
      uniforms: {},
      vertexShader: `
      attribute vec3 center;
      varying vec3 vCenter;
      varying vec3 vNormal;
      void main() {
				vCenter = center;
        vNormal = normalize(normalMatrix * normal);
				gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1);
      }
      `,
      fragmentShader: `
      varying vec3 vCenter;
      varying vec3 vNormal;
      float edgeFactorTri() {
				vec3 d = fwidth(vCenter.xyz);
				vec3 a3 = smoothstep(vec3(0.0), d * 1.3, vCenter.xyz);
				return min(min(a3.x, a3.y), a3.z);
      }
      void main() {
        float intensity = pow(0.7 - dot(vNormal, vec3(0.5, 0.5, 0.5)), 1.1) + 0.6;
				gl_FragColor.rgb = mix(vec3(1.0), vec3(0.2), edgeFactorTri()) * intensity;
				gl_FragColor.a = 1.0;
      }
      `,
      side: THREE.DoubleSide
    });
    // shapeMaterial.extensions.derivatives removed in modern Three.js

    const wireframeMaterial = new THREE.MeshDepthMaterial({
      name: "wireframeMaterial",
      wireframe: true,
      opacity: 0,
      transparent: true,
      blending: THREE.MultiplyBlending
    });

    let textureLoader = new THREE.TextureLoader();
    let sprite = textureLoader.load(`/images/1.png`);
    const pointsMaterial = new THREE.PointsMaterial({
      size: 18, // / (window.devicePixelRatio || 1),
      sizeAttenuation: false,
      map: sprite,
      transparent: true,
      opacity: this.pointOpacity,
      blending: THREE.NormalBlending
    });
    // pointsMaterial.color.setRGB(.5, 1.0, .5)
    pointsMaterial.color.setRGB(1, 1, 1);

    this.materials.shapeMaterial = shapeMaterial;
    this.materials.wireframeMaterial = wireframeMaterial;
    this.materials.pointsMaterial = pointsMaterial;
  }
  initScene() {
    const { renderer } = this.three;
    const scene = new THREE.Scene();

    // Transparent background (alpha channel enabled in renderer)
    scene.background = null;

    scene.add(new THREE.GridHelper(100, 100, 0xcccccc, 0x444444));
    // scene.add(new THREE.AxisHelper(20))

    const light = new THREE.DirectionalLight(0xbbbbbb);
    light.position.set(50, 50, 10);
    light.castShadow = true;
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x555555));

    let hemiLight = new THREE.HemisphereLight(0xcccccc, 0xffffff, 0.5);
    hemiLight.groundColor.setHSL(1, 0, 0.5);
    hemiLight.position.set(0, 500, 100);
    scene.add(hemiLight);

    // TODO: Add Reflector from three-stdlib as replacement for old Mirror
    // const groundMirror = new THREE.Mirror(100, 100, {
    //   clipBias: 0.1,
    //   textureWidth: window.innerWidth,
    //   textureHeight: window.innerHeight,
    //   color: 0x333333
    // });
    // groundMirror.rotateX(-Math.PI / 2);
    // groundMirror.translateZ(-0.1);
    // scene.add(groundMirror);

    scene.fog = new THREE.FogExp2(0x050505, 0.03);
    renderer.setClearColor(scene.fog.color);

    this.three.scene = scene;
  }
  initEffects() {
    const { scene, camera, renderer } = this.three;

    renderer.setScissor(0, 0, window.innerWidth, window.innerHeight);
    const composer = new EffectComposer(renderer);

    let effect;

    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    effect = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.2,
      1,
      0.95
    );
    composer.addPass(effect);

    // Note: HorizontalTiltShiftShader/VerticalTiltShiftShader not in three-stdlib
    // TODO: Implement or find alternative
    // let hblur = new ShaderPass(HorizontalTiltShiftShader);
    // let vblur = new ShaderPass(VerticalTiltShiftShader);
    // let blur = 1;
    // hblur.uniforms["h"].value = blur / window.innerWidth;
    // vblur.uniforms["v"].value = blur / window.innerHeight;
    // hblur.uniforms["r"].value = vblur.uniforms["r"].value = 0.55;
    // composer.addPass(vblur);
    // composer.addPass(hblur);

    // effect = new THREE.ShaderPass(THREE.ColorCorrectionShader)
    // composer.addPass(effect)

    //
    // effect = new THREE.ShaderPass(THREE.SSAOShader)
    // effect.uniforms['tDepth'].value = depthTarget
    // effect.uniforms['size'].value.set(window.innerWidth, window.innerHeight)
    // effect.uniforms['cameraNear'].value = camera.near
    // effect.uniforms['cameraFar'].value = camera.far
    // effect.uniforms['fogEnabled'].value = 0
    // effect.uniforms['aoClamp'].value = 0.5
    // effect.uniforms['lumInfluence'].value = 0.59
    // effect.material.defines = { "FLOAT_DEPTH": true }
    // // renderer.addEffect( effect, "tDepth" )
    // composer.addPass(effect)

    // effect = new THREE.ShaderPass(THREE.VerticalBlurShader)
    // effect.uniforms["v"].value = 1 / 4096
    // effect.renderToScreen = true
    // composer.addPass(effect)

    if (this.wireframe || this.vr) {
      effect = new ShaderPass(RGBShiftShader);
      effect.uniforms.amount.value = 0.0007;
      composer.addPass(effect);
    }

    if (this.wireframe || this.vr) {
      // Modern FilmPass constructor: (intensity?, grayscale?)
      effect = new FilmPass(0.25);
      composer.addPass(effect);
    }

    // const outlineEffect = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera)
    // outlineEffect.renderToScreen = true
    // composer.addPass(outlineEffect)

    effect = new ShaderPass(FXAAShader);
    effect.uniforms["resolution"].value = new THREE.Vector2(
      1 / window.innerWidth,
      1 / window.innerHeight
    );
    composer.addPass(effect);

    effect = new ShaderPass(VignetteShader);
    effect.uniforms["offset"].value = 0.5;
    effect.uniforms["darkness"].value = this.vr ? 6 : 4;
    effect.renderToScreen = true;
    composer.addPass(effect);

    if (this.vr) {
      const stereoEffect = new StereoEffect(
        renderer,
        composer,
        renderPass
      );
      stereoEffect.setSize(window.innerWidth, window.innerHeight);
      this.stereoEffect = stereoEffect;
    }

    // composer.addPass(effect)

    // let outlinePass = new THREE.OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera)
    // outlinePass.edgeStrength = 3.0
    // outlinePass.edgeGlow = 0.5
    // outlinePass.edgeThickness = 1.0
    // // outlinePass.renderToScreen = true
    // composer.addPass(outlinePass)

    // effect = new THREE.GlitchPass(1)
    // effect.renderToScreen = true
    // composer.addPass(effect)

    // effect = new THREE.ShaderPass(THREE.EdgeShader)
    // effect.uniforms.aspect.value = new THREE.Vector2(100000, 100000)
    // effect.renderToScreen = true
    // composer.addPass(effect)

    // effect = new THREE.DotScreenPass(new THREE.Vector2(0, 0), 0.1, 0.1)
    // composer.addPass(effect)

    // effect = new THREE.ShaderPass(THREE.BleachBypassShader)
    // effect.uniforms[ "opacity" ].value = 0.1
    // effect.renderToScreen = true
    // composer.addPass(effect)

    // const bokehPass = new THREE.BokehPass(scene, camera, {
    //   focus: 		0.9,
    //   aperture:	0.01,
    //   maxblur:	40.0,
    //   width: window.innerWidth,
    //   height: window.innerHeight
    // })
    // bokehPass.renderToScreen = true
    // composer.addPass(bokehPass)

    // this.bokehPass = bokehPass
    // this.outlinePass = outlinePass
    // this.outlineEffect = outlineEffect

    this.three.composer = composer;
  }
  /**
   * Determine file format from file extension
   */
  getModelFormat(path: string): ModelFormat {
    const ext = path.split('.').pop()?.toLowerCase();
    if (ext === 'stl') return 'stl';
    if (ext === 'obj') return 'obj';
    if (ext === 'gltf') return 'gltf';
    if (ext === 'glb') return 'glb';
    if (ext === '3mf') return '3mf';
    // Default to old format for backward compatibility
    return 'gltf';
  }

  /**
   * Load 3D model with support for multiple formats (STL, OBJ, GLTF, 3MF)
   */
  initModel(): Promise<void> {
    const id =
      new URL(window.location.href).searchParams.get("id") ||
      Router.query.id ||
      this.props.details.id;

    // Try to get model path from product details
    const modelPath = this.props.details?.model?.path || `/models/${id}/data.js`;
    const format = this.getModelFormat(modelPath);

    return new Promise((resolve, reject) => {
      switch (format) {
        case 'stl':
          this.loadSTL(modelPath, resolve, reject);
          break;
        case 'obj':
          this.loadOBJ(modelPath, resolve, reject);
          break;
        case 'gltf':
        case 'glb':
          this.loadGLTF(modelPath, resolve, reject);
          break;
        default:
          // Fallback to old ObjectLoader for backward compatibility
          this.loadLegacy(modelPath, resolve, reject);
          break;
      }
    });
  }

  /**
   * Load STL file (returns BufferGeometry)
   */
  loadSTL(path: string, resolve: () => void, reject: (err: any) => void) {
    const loader = new STLLoader();
    loader.load(
      path,
      (geometry) => {
        // Center the geometry
        geometry.center();
        geometry.computeVertexNormals();

        // Create mesh with default material
        const material = new THREE.MeshPhongMaterial({
          color: 0xaaaaaa,
          specular: 0x111111,
          shininess: 200,
        });
        const mesh = new THREE.Mesh(geometry, material);

        // Create a group to hold the mesh
        const group = new THREE.Group();
        group.add(mesh);

        this.initModelObject(group);
        resolve();
      },
      undefined,
      (error) => {
        console.error('Error loading STL:', error);
        reject(error);
      }
    );
  }

  /**
   * Load OBJ file (returns Group)
   */
  loadOBJ(path: string, resolve: () => void, reject: (err: any) => void) {
    const loader = new OBJLoader();
    loader.load(
      path,
      (object) => {
        this.initModelObject(object);
        resolve();
      },
      undefined,
      (error) => {
        console.error('Error loading OBJ:', error);
        reject(error);
      }
    );
  }

  /**
   * Load GLTF/GLB file (returns scene)
   */
  loadGLTF(path: string, resolve: () => void, reject: (err: any) => void) {
    const loader = new GLTFLoader();
    loader.load(
      path,
      (gltf) => {
        this.initModelScene(gltf.scene);
        resolve();
      },
      undefined,
      (error) => {
        console.error('Error loading GLTF:', error);
        reject(error);
      }
    );
  }

  /**
   * Legacy loader for old Three.js JSON format
   */
  loadLegacy(path: string, resolve: () => void, reject: (err: any) => void) {
    const loader = new THREE.ObjectLoader();
    loader.load(
      path,
      (result: any) => {
        if (result instanceof THREE.Scene) {
          this.initModelScene(result);
        } else {
          if (result.scene) {
            this.initModelScene(result.scene);
          } else {
            this.initModelObject(result);
          }
        }
        resolve();
      },
      undefined,
      (error) => {
        console.error('Error loading model:', error);
        reject(error);
      }
    );
  }
  initModelControls() {
    // compute the rotation center from camera's target
    let { camera, controls } = this.three;
    let camDirection = camera.getWorldDirection();
    let y =
      camera.position.y - (camera.position.x / camDirection.x) * camDirection.y;

    if (controls.target) {
      controls.target.set(0, y, 0);
    } else {
      controls.alphaOffsetAngle = 3;
    }
    controls.update();
  }
  initModelScene(scene) {
    // set an initial scale for camera/controls
    const { camera } = this.three;
    let bBox = new THREE.Box3().setFromObject(scene);
    let size = bBox.getSize(new THREE.Vector3());
    let { y: height, x: width, z: depth } = size;
    let modelSize = Math.max(height, width, depth);
    let scaleRatio = 10 / modelSize;
    height *= scaleRatio;

    let dist = 4 / Math.tan((camera.fov * Math.PI) / 360);
    let pos = scene.position.clone();
    pos.setY(pos.y - bBox.min.y);

    pos.setY(height / 2);
    camera.position.set(pos.x + dist * 0.1, pos.y + dist * 0.1, -dist * 0.5);
    camera.lookAt(pos);
    camera.zoom = 0.8;
    camera.updateProjectionMatrix();

    // easing animation at the very beginning
    new TWEEN.Tween(camera.position)
      .easing(TWEEN.Easing.Exponential.Out)
      .to(
        {
          x: pos.x + dist * 0.3,
          y: pos.y + dist * 0.3,
          z: -dist * 1.5
        },
        1200
      )
      .start();

    this.initialScale = scaleRatio;
    this.initialPosition = new THREE.Vector3(
      pos.x + dist * 0.3,
      pos.y + dist * 0.3,
      -dist * 1.5
    );
    this.initModelControls();

    // parse the model scene and push all objects to the current scene
    let group = new THREE.Group();
    while (scene.children.length) {
      let object = scene.children.pop();
      if (object) {
        object.position.setY(object.position.y - bBox.min.y);
        object.position.setX(
          object.position.x - (bBox.max.x + bBox.min.x) * 0.5
        );
        object.castShadow = true;
        object.receiveShadow = false;
        group.add(object);

        if (object instanceof THREE.PerspectiveCamera) {
          this.initModelCamera(object, scaleRatio);
        }
      }
    }
    // move y-axis, normalize size
    group.rotation.copy(scene.rotation);
    group.scale.set(scaleRatio, scaleRatio, scaleRatio);
    this.modelGroup = group;
    this.initModelObject(group);
  }
  initModelCamera(object, scaleRatio) {
    const { camera } = this.three;

    camera.fov = object.fov;
    camera.far = object.far;
    camera.focus = object.focus;
    camera.zoom = 0.6;
    object.position.multiplyScalar(scaleRatio);
    camera.position.copy(object.position);
    camera.rotation.copy(object.rotation);
    camera.updateProjectionMatrix();
    this.initialPosition = camera.position.clone();
    this.initialRotation = camera.rotation.clone();

    this.initModelControls();
  }
  initModelObject(object) {
    // push an object from the model file to the current scene

    const { scene } = this.three;

    // TODO: Update wireframe/points visualization for BufferGeometry
    // The old Geometry class with vertices[] no longer exists in modern Three.js
    let verticesCnt = 0;
    let wireframeClone = object.clone();
    traverse(wireframeClone, child => {
      if (child instanceof THREE.Mesh) {
        // Modern Three.js uses BufferGeometry
        const geometry = child.geometry as THREE.BufferGeometry;
        if (geometry.attributes.position) {
          verticesCnt += geometry.attributes.position.count;
        }
        child.material = this.materials.wireframeMaterial;

        // TODO: Recreate points visualization with BufferGeometry
        // let points = new THREE.Points(geometry, this.materials.pointsMaterial);
        // child.add(points);
      }
    });
    this.pointOpacity = Math.min(Math.max(500 / verticesCnt, 0.12), 1);
    this.materials.pointsMaterial.opacity = this.pointOpacity;

    this.wireframeObjects.push(wireframeClone);
    // scene.add(wireframeClone)

    let shapeClone = object.clone();
    shapeClone.traverse(child => {
      if (child instanceof THREE.Mesh) {
        let geometry = child.geometry as THREE.BufferGeometry;

        let vectors = [
          new THREE.Vector3(1, 0, 0),
          new THREE.Vector3(0, 1, 0),
          new THREE.Vector3(0, 0, 1)
        ];
        let position = geometry.attributes.position;
        let centers = new Float32Array(position.count * 3);
        for (let i = 0, l = position.count; i < l; i++) {
          vectors[i % 3].toArray(centers, i * 3);
        }

        geometry.setAttribute("center", new THREE.BufferAttribute(centers, 3));

        child.geometry = geometry;
        child.material = this.materials.shapeMaterial;
      }
    });
    this.shapeObjects.push(shapeClone);
    // scene.add(shapeClone)

    let changeMaterial = material => {
      material.name = "objectMaterial";
      material.polygonOffset = true;
      material.polygonOffsetFactor = -0.1;
      material.vertexColors = true; // Modern Three.js uses boolean instead of THREE.FaceColors
      material.transparent = true;
      material.opacity = 1;
    };
    object.traverse(child => {
      if (child instanceof THREE.Mesh) {
        if (child.material instanceof Array) {
          child.material.forEach(changeMaterial);
        } else {
          changeMaterial(child.material);
        }
      }
    });
    this.objects.push(object);
    scene.add(object);
  }

  // updating
  rotateToLeftView() {
    const { camera } = this.three;
    const initialPosition = this.initialPosition;

    new TWEEN.Tween(camera.position)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .to(
        {
          x: -initialPosition.z,
          y: initialPosition.y,
          z: 0
        },
        800
      )
      .start();
  }
  rotateToFrontView() {
    const { camera } = this.three;
    const initialPosition = this.initialPosition;

    new TWEEN.Tween(camera.position)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .to(
        {
          x: 0,
          y: initialPosition.y,
          z: initialPosition.z
        },
        800
      )
      .start();
  }
  rotateToTopView() {
    const { camera } = this.three;
    const initialPosition = this.initialPosition;

    new TWEEN.Tween(camera.position)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .to(
        {
          x: 0,
          y: initialPosition.y * 2.5,
          z: initialPosition.z * 0.1
        },
        800
      )
      .start();
  }
  switchToWireframe(ev: { forceVR?: boolean;[key: string]: any } = {}) {
    if (!this.wireframe || this.vr || ev.forceVR) {
      this.wireframe = true;
      this.vr = !!ev.forceVR;

      let { scene } = this.three;

      let changeMaterial = material => {
        material.transparent = true;
        material.opacity = 0;
      };
      this.objects.forEach(object => {
        object.traverse(child => {
          if (child instanceof THREE.Mesh) {
            if (child.material instanceof Array) {
              child.material.forEach(changeMaterial);
            } else {
              changeMaterial(child.material);
            }
          }
        });
      });
      this.materials.pointsMaterial.color.setRGB(0.5, 1.0, 0.5);
      this.materials.pointsMaterial.opacity = 1;
      this.wireframeObjects.forEach(object => scene.add(object));
      this.shapeObjects.forEach(object => scene.add(object));

      this.initEffects();
      this.handleResize();
      this.setState({});
    }
  }
  switchToModel(ev: { forceVR?: boolean;[key: string]: any } = {} = {}) {
    if (this.wireframe || this.vr || ev.forceVR) {
      this.wireframe = false;
      this.vr = !!ev.forceVR;

      let { scene } = this.three;

      let changeMaterial = material => {
        material.opacity = 1;
      };
      this.objects.forEach(object => {
        object.traverse(child => {
          if (child instanceof THREE.Mesh) {
            if (child.material instanceof Array) {
              child.material.forEach(changeMaterial);
            } else {
              changeMaterial(child.material);
            }
          }
        });
      });
      // this.materials.pointsMaterial.color.setRGB(1, 1, 1)
      // this.materials.pointsMaterial.opacity = this.pointOpacity
      this.wireframeObjects.forEach(object => scene.remove(object));
      this.shapeObjects.forEach(object => scene.remove(object));

      this.initEffects();
      this.handleResize();
      this.setState({});
    }
  }
  switchToVR() {
    if (!this.vr) {
      // this.switchToWireframe({forceVR: true})
      this.switchToModel({ forceVR: true });
    }
  }
  // autofocus(ev) {
  //   const { camera, raycaster, scene } = this.three
  //   const mouse = { x: (ev.pageX / window.innerWidth) * 2 - 1, y: -(ev.pageY / window.innerHeight) * 2 + 1 }
  //
  //   raycaster.setFromCamera(mouse, camera)
  //
  //   let intersects = raycaster.intersectObjects([scene], true)
  //   let selectedObject = null
  //
  //   for (let i = 0; i < intersects.length; ++i) {
  //     if (!selectedObject) {
  //       selectedObject = intersects[i]
  //     } else {
  //       if (intersects[i].distance < selectedObject.distance) {
  //         selectedObject = intersects[i]
  //       }
  //     }
  //   }
  //
  //   // 0.516859288707892 -> 0.05
  //   // 1.0860931634363653 -> 0.3
  //   // 1.222386828277837 -> 0.9
  //   // inf -> 1.0
  //
  //   if (selectedObject) {
  //     // let f = Math.log(selectedObject.distance + 1) / Math.log()
  //     let f = 1 - Math.exp(-selectedObject.distance)
  //     console.log(f)
  //     this.bokehPass.uniforms.focus.value = f || 1.0 //1.0
  //   } else {
  //     this.bokehPass.uniforms.focus.value = 1
  //   }
  // }
  selectObject(ev) {
    if (this.mousemoved) {
      return;
    }
    if (this.selectedObject) {
      // this.outlineEffect.selectedObjects = []
    }
    if (!this.hoveredObjectData) {
      this.selectedObject = null;
      this.selectedObjectData = null;
      this.selected = false;
      this.setState({});
      return;
    }
    this.selectedObject = this.highlightedObject;
    this.selectedObjectData = this.hoveredObjectData;
    this.selected = true;
    // this.outlineEffect.selectedObjects = [this.selectedObject]
    this.setState({});
  }
  hoverObject(ev) {
    if (this.vr || this.wireframe) {
      if (this.hoveredObjectData) {
        this.hoveredObjectData = null;
        this.setState({});
      }
      return;
    }

    ev.persist();
    const { camera, raycaster, scene } = this.three;
    const mouse = {
      x: (ev.pageX / window.innerWidth) * 2 - 1,
      y: -(ev.pageY / window.innerHeight) * 2 + 1
    };

    raycaster.setFromCamera(mouse, camera);

    let intersects = raycaster.intersectObjects([scene], true);
    let selectedObject = null;

    for (let i = 0; i < intersects.length; ++i) {
      if (
        intersects[i].object instanceof THREE.Points ||
        intersects[i].object instanceof THREE.GridHelper
      ) {
        continue;
      }
      if (intersects[i].object.geometry instanceof THREE.BufferGeometry) {
        continue;
      }
      if (
        intersects[i].object instanceof THREE.Mesh &&
        !(intersects[i].object.material instanceof Array) &&
        intersects[i].object.material.name !== "objectMaterial"
      ) {
        continue;
      }
      if (!selectedObject) {
        selectedObject = intersects[i];
      } else {
        if (intersects[i].distance < selectedObject.distance) {
          selectedObject = intersects[i];
        }
      }
    }

    if (selectedObject) {
      if (selectedObject.object instanceof THREE.Mesh) {
        document.body.style.cursor = "pointer";
        // if (selectedObject.face !== this.highlightedFace) {
        //   if (this.highlightedFace) {
        //     this.highlightedObject.geometry.colorsNeedUpdate = true
        //     this.highlightedFace.color.setRGB(1, 1, 1)
        //   }
        //   this.highlightedFace = selectedObject.face
        //   this.highlightedObject = selectedObject.object
        //   selectedObject.face.color.setRGB(2, 2, 2)
        //   selectedObject.object.geometry.colorsNeedUpdate = true
        // }

        let { material } = selectedObject.object;

        if (selectedObject.object !== this.highlightedObject) {
          if (this.highlightedObject) {
            this.highlightedObject.geometry.colorsNeedUpdate = true;
            objectBlur(this.highlightedObject);
          }
          this.highlightedObject = selectedObject.object;
          objectFocus(this.highlightedObject);
        }

        if (!(material instanceof Array)) {
          material = [material];
        }

        let textures = [],
          colors = [],
          refractionRatios = [],
          shininesses = [],
          name = "";

        material.forEach(mt => {
          if (mt.map instanceof THREE.Texture) {
            textures.push(mt.map.image.src);
          }
          if (mt.color) {
            colors.push(mt.color);
          }
          refractionRatios.push(mt.refractionRatio || 0);
          shininesses.push(mt.shininess || 0);
        });
        if (this.highlightedObject.name) {
          name = this.highlightedObject.name;
        }

        this.hoveredObjectData = {
          textures,
          colors,
          name,
          refractionRatios,
          shininesses,
          uuid: this.highlightedObject.uuid
        };
        this.setState({});
      } else {
        document.body.style.cursor = "";
      }
      // addSelectedObject(selectedObject)
      // if (typeof selectedObject === THREE.Mesh)
    } else {
      document.body.style.cursor = "";
      if (this.highlightedObject) {
        this.highlightedObject.geometry.colorsNeedUpdate = true;
        objectBlur(this.highlightedObject);
        this.highlightedObject = null;
      }
      if (this.hoveredObjectData) {
        this.hoveredObjectData = null;
        this.setState({});
      }
    }
  }
  changeObjectColor(color, index) {
    // TODO
    if (this.selectedObject) {
      this.selectedObject.geometry.colorsNeedUpdate = true;
      let { material } = this.selectedObject;
      if (!(material instanceof Array)) {
        material = [material];
      }
      material[index].color = {
        r: color.rgb.r / 255,
        g: color.rgb.g / 255,
        b: color.rgb.b / 255
      };
    }
  }

  // rendering
  renderThree() {
    const { scene, renderer, camera, composer, controls } = this.three;

    scene.updateMatrixWorld();

    TWEEN.update();

    controls.update();

    if (this.vr) {
      this.stereoEffect.render(scene, camera);
    } else {
      renderer.clear();
      composer.render(0.01);
    }
  }
  renderLoop() {
    requestAnimationFrame(this.renderLoop);
    this.renderThree();
  }

  render() {
    let { selectedObjectData } = this;

    return (
      <div style={{ display: "flex" }}>
        {!this.loaded && (
          <div className="absolute w-100 h-100 flex white items-center justify-center">
            <i className="material-icons mr2">hourglass_full</i>loading model...
          </div>
        )}

        <div className="description-container">
          <h1>{this.props.details.name}</h1>
          <p>{this.props.details.description}</p>
        </div>

        <canvas
          className="view-canvas"
          ref={canvas => (this.canvas = canvas)}
          onClick={this.selectObject}
          onMouseDown={() => (this.mousemoved = false)}
          onMouseMove={ev => {
            ev.persist();
            this.mousemoved = true;
            this.hoverObject(ev);
          }}
        />

        {!this.isMob && selectedObjectData && (
          <div className="absolute setting-panel white pa1">
            <h2 className="f6 ma0 mb2 ttu">Customize component</h2>
            <EditorSidebar
              data={selectedObjectData}
              changeColor={this.changeObjectColor}
            />
          </div>
        )}

        <div
          className="control-bar fixed bottom-0 left-0 white w-100 z-999 mb3 ph4 flex items-end content-end justify-around flex-wrap"
          onTouchMove={ev => ev.preventDefault()}
          style={{ height: 0 }}
        >
          <div className="key-info flex items-end ml4">
            <div className="relative">
              <a
                className="hover-gray absolute pointer left--2"
                onClick={this.rotateToLeftView}
              >
                <i className="material-icons">arrow_forward</i>
              </a>
              <a
                className="hover-gray absolute pointer top--2"
                onClick={this.rotateToTopView}
              >
                <i className="material-icons">arrow_downward</i>
              </a>
              <a
                className="hover-gray pointer"
                onClick={this.rotateToFrontView}
              >
                <i className="material-icons">accessibility</i>
              </a>
            </div>
          </div>

          <div className="flex items-center">
            <a
              className={`hover-gray pointer mr2 flex justify-center items-center flex-column br-100 w3 h3 ba ${this.wireframe || this.vr ? "b--transparent" : ""
                }`}
              onClick={this.switchToModel}
            >
              <i className="material-icons">brightness_1</i>
              <span className="ttu f7 mb1">Body</span>
            </a>
            <a
              className={`hover-gray pointer mr2 flex justify-center items-center flex-column br-100 w3 h3 ba ${this.wireframe && !this.vr ? "" : "b--transparent"
                }`}
              onClick={this.switchToWireframe}
            >
              <i className="material-icons">blur_circular</i>
              <span className="ttu f7 mb1">Frame</span>
            </a>
            <a
              className={`hover-gray pointer mr2 flex justify-center items-center flex-column br-100 w3 h3 ba ${!this.vr ? "b--transparent" : ""
                }`}
              onClick={this.switchToVR}
            >
              <i className="material-icons">vignette</i>
              <span className="ttu f7 mb1">VR</span>
            </a>
          </div>

          <div className="v-mid mb3 mt4 nowrap pointer dib add-to-cart-btn">
            <a className="pa1" onClick={this.addToCart}>
              <i className="material-icons v-mid">add_circle_outline</i>{" "}
              <span className="v-mid">Add to cart</span>
            </a>
          </div>
        </div>
      </div>
    );
  }
}

export default (props) => {
  const cart = useCartContext();

  return (
    <Editor {...props} {...cart} />
  )
}
