/**
 * ECHO – THE WORLD REMEMBERS
 * The Bioluminescent Lake (البحيرة الزرقاء المضيئة)
 * Shimmering azure-cyan water, glowing underwater crystals, lotus pads, and rising motes.
 */

import * as THREE from 'three';
import { Terrain } from './Terrain.ts';

export class BioluminescentLake {
  public group: THREE.Group;
  private waterMesh: THREE.Mesh;
  private spores: THREE.Points;
  private sporePositions: Float32Array;
  private sporeSpeeds: Float32Array;
  private sporeCount = 180;
  private lakeLight: THREE.PointLight;

  constructor() {
    this.group = new THREE.Group();

    // 1. Lake Water Surface
    const lakeGeo = new THREE.CircleGeometry(Terrain.LAKE_RADIUS, 64);
    lakeGeo.rotateX(-Math.PI / 2);

    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0fe7d7,
      emissive: 0x056b6c,
      emissiveIntensity: 0.55,
      roughness: 0.1,
      metalness: 0.4,
      transparent: true,
      opacity: 0.78,
      side: THREE.DoubleSide,
    });

    this.waterMesh = new THREE.Mesh(lakeGeo, waterMat);
    this.waterMesh.position.set(Terrain.LAKE_CENTER.x, Terrain.LAKE_WATER_Y, Terrain.LAKE_CENTER.y);
    this.waterMesh.receiveShadow = true;
    this.group.add(this.waterMesh);

    // Lakebed glow light
    this.lakeLight = new THREE.PointLight(0x00f0e2, 4.2, 70);
    this.lakeLight.position.set(Terrain.LAKE_CENTER.x, Terrain.LAKE_WATER_Y + 1.2, Terrain.LAKE_CENTER.y);
    this.group.add(this.lakeLight);

    // 2. Bioluminescent Crystal Clusters around and inside the lake
    this.createLakeCrystals();

    // 3. Glowing Water Lily Pads
    this.createLotusPads();

    // 4. Floating Bioluminescent Spores / Light Motes
    const sporeGeo = new THREE.BufferGeometry();
    this.sporePositions = new Float32Array(this.sporeCount * 3);
    this.sporeSpeeds = new Float32Array(this.sporeCount);

    for (let i = 0; i < this.sporeCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * (Terrain.LAKE_RADIUS - 2);
      this.sporePositions[i * 3] = Terrain.LAKE_CENTER.x + Math.cos(angle) * radius;
      this.sporePositions[i * 3 + 1] = Terrain.LAKE_WATER_Y + Math.random() * 8.0;
      this.sporePositions[i * 3 + 2] = Terrain.LAKE_CENTER.y + Math.sin(angle) * radius;
      this.sporeSpeeds[i] = 0.3 + Math.random() * 0.7;
    }

    sporeGeo.setAttribute('position', new THREE.BufferAttribute(this.sporePositions, 3));

    // Particle sprite texture
    const sporeTexture = this.createSporeTexture();
    const sporeMat = new THREE.PointsMaterial({
      size: 0.55,
      map: sporeTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: 0x64ffff,
    });

    this.spores = new THREE.Points(sporeGeo, sporeMat);
    this.group.add(this.spores);
  }

  private createLakeCrystals(): void {
    const crystalGeo = new THREE.ConeGeometry(0.5, 2.8, 5);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x0099cc,
      emissiveIntensity: 0.9,
      roughness: 0.2,
      metalness: 0.8,
      transparent: true,
      opacity: 0.92,
    });

    const numClusters = 9;
    for (let c = 0; c < numClusters; c++) {
      const angle = (c / numClusters) * Math.PI * 2 + 0.3;
      const dist = (Terrain.LAKE_RADIUS - 6) * (0.4 + Math.random() * 0.55);
      const cx = Terrain.LAKE_CENTER.x + Math.cos(angle) * dist;
      const cz = Terrain.LAKE_CENTER.y + Math.sin(angle) * dist;

      const cluster = new THREE.Group();
      cluster.position.set(cx, Terrain.LAKE_WATER_Y - 0.4, cz);

      // 3 to 5 shards per cluster
      for (let s = 0; s < 4; s++) {
        const shard = new THREE.Mesh(crystalGeo, crystalMat);
        const scale = 0.6 + Math.random() * 0.8;
        shard.scale.set(scale, scale * (1 + Math.random() * 0.5), scale);
        shard.rotation.x = (Math.random() - 0.5) * 0.5;
        shard.rotation.z = (Math.random() - 0.5) * 0.5;
        shard.rotation.y = Math.random() * Math.PI * 2;
        shard.position.set((Math.random() - 0.5) * 1.5, (scale * 2.8) / 2, (Math.random() - 0.5) * 1.5);
        cluster.add(shard);
      }

      this.group.add(cluster);
    }
  }

  private createLotusPads(): void {
    const padGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.04, 16);
    const padMat = new THREE.MeshStandardMaterial({
      color: 0x0b4b3b,
      roughness: 0.6,
      metalness: 0.1,
    });

    const flowerGeo = new THREE.ConeGeometry(0.3, 0.6, 6);
    const flowerMat = new THREE.MeshStandardMaterial({
      color: 0x00ffee,
      emissive: 0x00b4d8,
      emissiveIntensity: 0.85,
    });

    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 6 + Math.random() * (Terrain.LAKE_RADIUS - 10);
      const px = Terrain.LAKE_CENTER.x + Math.cos(angle) * dist;
      const pz = Terrain.LAKE_CENTER.y + Math.sin(angle) * dist;

      const lotus = new THREE.Group();
      lotus.position.set(px, Terrain.LAKE_WATER_Y + 0.02, pz);

      const pad = new THREE.Mesh(padGeo, padMat);
      pad.scale.setScalar(0.7 + Math.random() * 0.5);
      lotus.add(pad);

      // Center glowing flower
      const flower = new THREE.Mesh(flowerGeo, flowerMat);
      flower.position.y = 0.3;
      lotus.add(flower);

      this.group.add(lotus);
    }
  }

  private createSporeTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.35, 'rgba(0, 240, 255, 0.8)');
    grad.addColorStop(0.7, 'rgba(0, 150, 255, 0.3)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    return new THREE.CanvasTexture(canvas);
  }

  public update(time: number): void {
    // Shimmer water emissive pulse
    const mat = this.waterMesh.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.45 + Math.sin(time * 1.5) * 0.15;
    this.lakeLight.intensity = 3.8 + Math.sin(time * 2.0) * 0.8;

    // Animate floating spores
    const pos = this.spores.geometry.attributes.position;
    for (let i = 0; i < this.sporeCount; i++) {
      let y = pos.getY(i) + this.sporeSpeeds[i] * 0.035;
      if (y > Terrain.LAKE_WATER_Y + 9.0) {
        y = Terrain.LAKE_WATER_Y + 0.2;
      }
      pos.setY(i, y);

      // Gentle wobble
      const ox = pos.getX(i) + Math.sin(time + i) * 0.015;
      const oz = pos.getZ(i) + Math.cos(time + i * 0.5) * 0.015;
      pos.setX(i, ox);
      pos.setZ(i, oz);
    }
    pos.needsUpdate = true;
  }
}
