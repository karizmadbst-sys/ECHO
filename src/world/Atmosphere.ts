/**
 * ECHO – THE WORLD REMEMBERS
 * Cinematic Atmosphere, Sky Dome, Lighting Rig & Horizon Fog
 */

import * as THREE from 'three';

export class Atmosphere {
  public group: THREE.Group;
  public dirLight: THREE.DirectionalLight;
  public hemiLight: THREE.HemisphereLight;
  private fireflies: THREE.Points;
  private fireflyPositions: Float32Array;
  private fireflySpeeds: Float32Array;
  private fireflyCount = 220;

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();

    // 1. Cinematic Horizon Fog (Matching twilight sky hue)
    const fogColor = new THREE.Color(0x0e1c2b);
    scene.fog = new THREE.FogExp2(fogColor, 0.0042);
    scene.background = fogColor;

    // 2. Celestial Sky Dome with Stars & Nebula
    const skyGeo = new THREE.SphereGeometry(600, 32, 24);
    const skyMat = new THREE.MeshBasicMaterial({
      map: this.createSkyTexture(),
      side: THREE.BackSide,
      fog: false,
    });
    const skyDome = new THREE.Mesh(skyGeo, skyMat);
    this.group.add(skyDome);

    // 3. Three-point Lighting Rig:
    // Warm key directional light (Sunset/Dusk golden rim)
    this.dirLight = new THREE.DirectionalLight(0xffdfba, 2.2);
    this.dirLight.position.set(-90, 85, -70);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 350;
    const d = 140;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.bias = -0.0005;
    this.dirLight.shadow.normalBias = 0.02;
    this.group.add(this.dirLight);

    // Cool celestial sky / warm ground HemisphereLight fill
    this.hemiLight = new THREE.HemisphereLight(0x2d5a88, 0x1a2e1d, 1.4);
    this.group.add(this.hemiLight);

    // Subtle soft rim backlight
    const rimLight = new THREE.DirectionalLight(0x40916c, 0.6);
    rimLight.position.set(90, 40, 80);
    this.group.add(rimLight);

    // Solid ambient baseline light
    const ambLight = new THREE.AmbientLight(0x4a6d8c, 1.2);
    this.group.add(ambLight);

    // 4. Island-Wide Ambient Fireflies / Stardust Motes
    const fGeo = new THREE.BufferGeometry();
    this.fireflyPositions = new Float32Array(this.fireflyCount * 3);
    this.fireflySpeeds = new Float32Array(this.fireflyCount);

    for (let i = 0; i < this.fireflyCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 10 + Math.random() * 210;
      this.fireflyPositions[i * 3] = Math.cos(angle) * radius;
      this.fireflyPositions[i * 3 + 1] = 4 + Math.random() * 22;
      this.fireflyPositions[i * 3 + 2] = Math.sin(angle) * radius;
      this.fireflySpeeds[i] = 0.5 + Math.random() * 1.0;
    }

    fGeo.setAttribute('position', new THREE.BufferAttribute(this.fireflyPositions, 3));

    const fTexture = this.createFireflyTexture();
    const fMat = new THREE.PointsMaterial({
      size: 0.6,
      map: fTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: 0x99ffe0,
    });

    this.fireflies = new THREE.Points(fGeo, fMat);
    this.group.add(this.fireflies);
  }

  private createSkyTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Gradient from deep space twilight down to dusk horizon
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#060a12');     // Deep void zenith
    grad.addColorStop(0.35, '#0b1624');  // Indigo dusk
    grad.addColorStop(0.7, '#11293e');   // Atmospheric cyan-navy
    grad.addColorStop(0.9, '#1a3b4f');   // Horizon glow
    grad.addColorStop(1, '#0e1c2b');     // Fog line

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 512);

    // Distant soft nebula cloud
    const neb = ctx.createRadialGradient(680, 180, 20, 680, 180, 240);
    neb.addColorStop(0, 'rgba(80, 180, 210, 0.35)');
    neb.addColorStop(0.5, 'rgba(120, 90, 200, 0.15)');
    neb.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = neb;
    ctx.fillRect(0, 0, 1024, 512);

    // Stars
    ctx.fillStyle = '#ffffff';
    for (let s = 0; s < 750; s++) {
      const sx = Math.random() * 1024;
      const sy = Math.random() * 380;
      const radius = Math.random() > 0.95 ? 1.5 : 0.8;
      ctx.beginPath();
      ctx.arc(sx, sy, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    return new THREE.CanvasTexture(canvas);
  }

  private createFireflyTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.35, 'rgba(100, 255, 200, 0.8)');
    grad.addColorStop(0.7, 'rgba(50, 200, 150, 0.25)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    return new THREE.CanvasTexture(canvas);
  }

  public update(time: number): void {
    // Drifting fireflies
    const pos = this.fireflies.geometry.attributes.position;
    for (let i = 0; i < this.fireflyCount; i++) {
      const idx = i * 3;
      let y = pos.getY(i) + Math.sin(time * this.fireflySpeeds[i] + i) * 0.03;
      if (y < 2) y = 14;
      if (y > 35) y = 6;
      pos.setY(i, y);

      const x = pos.getX(i) + Math.cos(time * 0.5 + i) * 0.02;
      const z = pos.getZ(i) + Math.sin(time * 0.5 + i) * 0.02;
      pos.setX(i, x);
      pos.setZ(i, z);
    }
    pos.needsUpdate = true;
  }
}
