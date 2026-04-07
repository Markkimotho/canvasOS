import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

/**
 * SculptScene — Three.js scene for 3D sculpting.
 * Manages camera, lights, the sculpt mesh, and renders to a canvas.
 */
export class SculptScene {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private sculptMesh: THREE.Mesh | null = null;
  private animFrameId: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a1a);

    this.camera = new THREE.PerspectiveCamera(60, canvas.width / canvas.height, 0.01, 1000);
    this.camera.position.set(0, 0, 3);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    const key = new THREE.DirectionalLight(0xffffff, 1.2);
    key.position.set(5, 10, 5);
    key.castShadow = true;
    const fill = new THREE.DirectionalLight(0x8899ff, 0.3);
    fill.position.set(-5, 0, -5);
    this.scene.add(ambient, key, fill);

    // Default sphere
    this.loadSphere();
  }

  loadSphere(radius = 1, segments = 128): void {
    this.clearMesh();
    const geo = new THREE.SphereGeometry(radius, segments, segments);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.8,
      metalness: 0.0,
      wireframe: false,
    });
    this.sculptMesh = new THREE.Mesh(geo, mat);
    this.sculptMesh.receiveShadow = true;
    this.sculptMesh.castShadow = true;
    this.scene.add(this.sculptMesh);
  }

  clearMesh(): void {
    if (this.sculptMesh) {
      this.scene.remove(this.sculptMesh);
      this.sculptMesh.geometry.dispose();
      (this.sculptMesh.material as THREE.Material).dispose();
      this.sculptMesh = null;
    }
  }

  /**
   * Sculpt brush — displaces vertices within radius along their normals.
   * intensity > 0 = pull, < 0 = push.
   */
  sculpt(worldPosition: THREE.Vector3, radius: number, intensity: number): void {
    if (!this.sculptMesh) return;
    const geo = this.sculptMesh.geometry as THREE.BufferGeometry;
    const positions = geo.attributes["position"] as THREE.BufferAttribute;
    const normals = geo.attributes["normal"] as THREE.BufferAttribute;

    for (let i = 0; i < positions.count; i++) {
      const vx = positions.getX(i);
      const vy = positions.getY(i);
      const vz = positions.getZ(i);
      const vertex = new THREE.Vector3(vx, vy, vz);
      this.sculptMesh.localToWorld(vertex);

      const dist = vertex.distanceTo(worldPosition);
      if (dist < radius) {
        const falloff = 1 - dist / radius;
        const nx = normals.getX(i);
        const ny = normals.getY(i);
        const nz = normals.getZ(i);
        positions.setXYZ(
          i,
          vx + nx * intensity * falloff,
          vy + ny * intensity * falloff,
          vz + nz * intensity * falloff,
        );
      }
    }

    positions.needsUpdate = true;
    geo.computeVertexNormals();
  }

  start(): void {
    const animate = () => {
      this.animFrameId = requestAnimationFrame(animate);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  stop(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  resize(width: number, height: number): void {
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  captureImageData(): ImageData {
    this.renderer.render(this.scene, this.camera);
    const canvas = this.renderer.domElement;
    const ctx = document.createElement("canvas").getContext("2d")!;
    ctx.canvas.width = canvas.width;
    ctx.canvas.height = canvas.height;
    ctx.drawImage(canvas, 0, 0);
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  destroy(): void {
    this.stop();
    this.clearMesh();
    this.renderer.dispose();
    this.controls.dispose();
  }
}
