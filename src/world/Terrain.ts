/**
 * ECHO – THE WORLD REMEMBERS
 * Procedural Island Terrain & Ocean
 * Generates continuous elevation, slopes, procedural ground texture, and ocean water.
 */

import * as THREE from 'three';

export interface TerrainHeights {
  getHeightAt(x: number, z: number): number;
  getNormalAt(x: number, z: number): THREE.Vector3;
}

export class Terrain {
  public mesh: THREE.Mesh;
  public oceanMesh: THREE.Mesh;
  public group: THREE.Group;
  private size: number = 520;
  private segments: number = 160;
  private heightData: Float32Array;

  // Island landmarks
  public static readonly LAKE_CENTER = new THREE.Vector2(0, -15);
  public static readonly LAKE_RADIUS = 38;
  public static readonly LAKE_WATER_Y = 3.8;

  public static readonly TEMPLE_POS = new THREE.Vector3(-85, 14, 25);
  public static readonly PORTAL_POS = new THREE.Vector3(95, 16, -30);
  public static readonly SUMMIT_POS = new THREE.Vector3(15, 32, -100);
  public static readonly SPAWN_POS = new THREE.Vector3(0, 5, 80);

  constructor() {
    this.group = new THREE.Group();
    this.heightData = new Float32Array((this.segments + 1) * (this.segments + 1));

    // Create procedural ground texture
    const groundTexture = this.createGroundTexture();
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(16, 16);
    groundTexture.colorSpace = THREE.SRGBColorSpace;

    // Normal map for rock/grass bumps
    const groundNormal = this.createGroundNormalMap();
    groundNormal.wrapS = THREE.RepeatWrapping;
    groundNormal.wrapT = THREE.RepeatWrapping;
    groundNormal.repeat.set(24, 24);

    const terrainGeo = new THREE.PlaneGeometry(this.size, this.size, this.segments, this.segments);
    terrainGeo.rotateX(-Math.PI / 2);

    const posAttr = terrainGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      const y = this.calculateHeight(x, z);
      posAttr.setY(i, y);
      this.heightData[i] = y;
    }

    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      map: groundTexture,
      normalMap: groundNormal,
      normalScale: new THREE.Vector2(0.65, 0.65),
      roughness: 0.82,
      metalness: 0.08,
      flatShading: false,
    });

    this.mesh = new THREE.Mesh(terrainGeo, terrainMat);
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = false;
    this.group.add(this.mesh);

    // Ocean plane
    const oceanGeo = new THREE.PlaneGeometry(1200, 1200, 48, 48);
    oceanGeo.rotateX(-Math.PI / 2);

    const oceanTexture = this.createOceanTexture();
    oceanTexture.wrapS = THREE.RepeatWrapping;
    oceanTexture.wrapT = THREE.RepeatWrapping;
    oceanTexture.repeat.set(24, 24);
    oceanTexture.colorSpace = THREE.SRGBColorSpace;

    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x073552,
      roughness: 0.12,
      metalness: 0.6,
      transparent: true,
      opacity: 0.88,
      map: oceanTexture,
    });

    this.oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
    this.oceanMesh.position.y = 1.6;
    this.oceanMesh.receiveShadow = true;
    this.group.add(this.oceanMesh);
  }

  /**
   * Continuous procedural height function.
   * Gives organic hills, mountain ridges, crater lake depression, and soft shores.
   */
  public calculateHeight(x: number, z: number): number {
    const distFromCenter = Math.sqrt(x * x + z * z);
    const islandRadius = 230;

    // Smooth falloff towards ocean border
    let islandMask = 1.0;
    if (distFromCenter > 120) {
      const t = (distFromCenter - 120) / (islandRadius - 120);
      islandMask = Math.max(0, 1.0 - Math.min(1, t));
      islandMask = islandMask * islandMask * (3 - 2 * islandMask); // Smoothstep
    }
    if (distFromCenter >= islandRadius) return 0.2;

    // Multi-octave Perlin-like mathematical terrain
    const h1 = Math.sin(x * 0.015) * Math.cos(z * 0.015) * 8.0;
    const h2 = Math.sin(x * 0.035 + 1.2) * Math.sin(z * 0.038 - 0.8) * 4.5;
    const h3 = Math.cos(x * 0.08) * Math.sin(z * 0.08) * 1.8;
    const h4 = (Math.sin(x * 0.15) + Math.cos(z * 0.15)) * 0.6;

    let baseElevation = (h1 + h2 + h3 + h4) * islandMask + 5.0 * islandMask;

    // Northern High Mountain Crag
    const northDist = Math.sqrt((x - 20) * (x - 20) + (z + 105) * (z + 105));
    if (northDist < 95) {
      const mountainFalloff = Math.max(0, 1 - northDist / 95);
      const mPeak = Math.pow(mountainFalloff, 2.2) * 26.0;
      const ridgeNoise = Math.sin(x * 0.06) * 4.0 * mountainFalloff;
      baseElevation += mPeak + ridgeNoise;
    }

    // Eastern Portal Cliff
    const portalDist = Math.sqrt((x - Terrain.PORTAL_POS.x) * (x - Terrain.PORTAL_POS.x) + (z - Terrain.PORTAL_POS.z) * (z - Terrain.PORTAL_POS.z));
    if (portalDist < 55) {
      const cliffFactor = Math.max(0, 1 - portalDist / 55);
      baseElevation += Math.pow(cliffFactor, 1.8) * 11.0;
    }

    // Western Temple Plateau
    const templeDist = Math.sqrt((x - Terrain.TEMPLE_POS.x) * (x - Terrain.TEMPLE_POS.x) + (z - Terrain.TEMPLE_POS.z) * (z - Terrain.TEMPLE_POS.z));
    if (templeDist < 50) {
      const templeFactor = Math.max(0, 1 - templeDist / 50);
      baseElevation += Math.pow(templeFactor, 1.5) * 8.5;
    }

    // Central Crater for the Bioluminescent Lake
    const lakeDist = Math.sqrt((x - Terrain.LAKE_CENTER.x) * (x - Terrain.LAKE_CENTER.x) + (z - Terrain.LAKE_CENTER.y) * (z - Terrain.LAKE_CENTER.y));
    if (lakeDist < Terrain.LAKE_RADIUS + 25) {
      const factor = Math.max(0, 1 - lakeDist / (Terrain.LAKE_RADIUS + 25));
      // Depression down below water level
      const depth = Math.pow(factor, 1.4) * 6.5;
      baseElevation -= depth;
    }

    // Clamp shoreline to prevent negative spikes
    return Math.max(0.5, baseElevation);
  }

  public floorHeightProvider: ((x: number, z: number) => number | null) | null = null;

  /**
   * Returns exact elevation at any world (x, z)
   */
  public getHeightAt(x: number, z: number): number {
    if (this.floorHeightProvider) {
      const floorH = this.floorHeightProvider(x, z);
      if (floorH !== null) return floorH;
    }
    return this.calculateHeight(x, z);
  }

  /**
   * Computes the slope normal at (x, z)
   */
  public getNormalAt(x: number, z: number): THREE.Vector3 {
    if (this.floorHeightProvider && this.floorHeightProvider(x, z) !== null) {
      return new THREE.Vector3(0, 1, 0);
    }
    const eps = 0.5;
    const hL = this.calculateHeight(x - eps, z);
    const hR = this.calculateHeight(x + eps, z);
    const hD = this.calculateHeight(x, z - eps);
    const hU = this.calculateHeight(x, z + eps);

    const normal = new THREE.Vector3(hL - hR, 2 * eps, hD - hU);
    normal.normalize();
    return normal;
  }

  /**
   * Animate ocean waves
   */
  public update(time: number): void {
    const pos = this.oceanMesh.geometry.attributes.position;
    for (let i = 0; i < pos.count; i += 2) {
      const u = pos.getX(i);
      const v = pos.getZ(i);
      const wave = Math.sin(u * 0.02 + time * 1.2) * Math.cos(v * 0.02 + time * 0.9) * 0.35 +
                   Math.sin(u * 0.06 - time * 1.5) * 0.15;
      pos.setY(i, wave);
    }
    pos.needsUpdate = true;
  }

  /**
   * Procedural texture with grass, moss, rock strata, and golden sand
   */
  private createGroundTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Base deep emerald-moss green
    ctx.fillStyle = '#263b27';
    ctx.fillRect(0, 0, 1024, 1024);

    // Speckle grass blades and soil patches
    for (let i = 0; i < 24000; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const r = Math.random();

      if (r < 0.4) {
        ctx.fillStyle = '#3a5732'; // Fresh green
      } else if (r < 0.7) {
        ctx.fillStyle = '#1e2e1e'; // Dark damp loam
      } else if (r < 0.9) {
        ctx.fillStyle = '#4c6b41'; // Vibrant moss
      } else {
        ctx.fillStyle = '#7a7b5a'; // Slate stone pebble
      }

      const w = 1 + Math.random() * 3;
      const h = 1 + Math.random() * 4;
      ctx.fillRect(x, y, w, h);
    }

    // Mystical faint ancient glyph trails
    ctx.strokeStyle = 'rgba(78, 175, 145, 0.12)';
    ctx.lineWidth = 3;
    for (let j = 0; j < 12; j++) {
      ctx.beginPath();
      const sx = Math.random() * 1024;
      const sy = Math.random() * 1024;
      ctx.arc(sx, sy, 40 + Math.random() * 80, 0, Math.PI * 1.5);
      ctx.stroke();
    }

    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Procedural bump/normal map
   */
  private createGroundNormalMap(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    const imgData = ctx.createImageData(512, 512);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const nx = 128 + Math.floor((Math.random() - 0.5) * 45);
      const ny = 128 + Math.floor((Math.random() - 0.5) * 45);
      data[i] = nx;
      data[i + 1] = ny;
      data[i + 2] = 255;
      data[i + 3] = 255;
    }

    ctx.putImageData(imgData, 0, 0);
    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Procedural ocean texture with subtle caustics
   */
  private createOceanTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#0a4261';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = 'rgba(110, 210, 240, 0.22)';
    ctx.lineWidth = 1.5;

    for (let i = 0; i < 400; i++) {
      ctx.beginPath();
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const r = 6 + Math.random() * 16;
      ctx.ellipse(x, y, r, r * 0.45, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.stroke();
    }

    return new THREE.CanvasTexture(canvas);
  }
}
