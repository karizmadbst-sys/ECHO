/**
 * ECHO – THE WORLD REMEMBERS
 * The Great Stone Portal (البوابة الحجرية الضخمة)
 * Monolithic gateway with 7 ancient rune sockets that ignite as crystals are gathered,
 * and a swirling celestial vortex.
 */

import * as THREE from 'three';
import { Terrain } from './Terrain.ts';
import { WorldObstacle } from './Forest.ts';

export class GreatPortal {
  public group: THREE.Group;
  public obstacles: WorldObstacle[] = [];
  private vortexRings: THREE.Mesh[] = [];
  private runeMeshes: THREE.Mesh[] = [];
  private portalLight: THREE.PointLight;
  private particleVortex: THREE.Points;
  private particleCount = 140;
  private particleAngles: Float32Array;
  private particleRadii: Float32Array;
  private particleSpeeds: Float32Array;
  private isFullyAwakened: boolean = false;

  constructor(terrain: Terrain) {
    this.group = new THREE.Group();

    const center = Terrain.PORTAL_POS;
    const baseY = terrain.getHeightAt(center.x, center.z);
    this.group.position.set(center.x, baseY, center.z);
    // Face towards the center of the island / lake
    this.group.rotation.y = -Math.PI * 0.65;

    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x484b55,
      roughness: 0.85,
      metalness: 0.15,
    });

    const carvedStoneMat = new THREE.MeshStandardMaterial({
      color: 0x3b3d45,
      roughness: 0.9,
      metalness: 0.1,
    });

    // 1. Megalithic Foundation Platform
    const platGeo = new THREE.BoxGeometry(24, 1.8, 14);
    const platform = new THREE.Mesh(platGeo, stoneMat);
    platform.position.y = 0.9;
    platform.receiveShadow = true;
    this.group.add(platform);

    const floorY = 1.8;

    // 2. Colossal Twin Pillars (Left and Right)
    const pillarWidth = 3.2;
    const pillarDepth = 3.6;
    const pillarHeight = 14.0;
    const pillarSpacing = 10.0;

    const leftCol = this.createMegalithPillar(pillarWidth, pillarHeight, pillarDepth, stoneMat, carvedStoneMat);
    leftCol.position.set(-pillarSpacing / 2, floorY, 0);
    this.group.add(leftCol);

    const rightCol = this.createMegalithPillar(pillarWidth, pillarHeight, pillarDepth, stoneMat, carvedStoneMat);
    rightCol.position.set(pillarSpacing / 2, floorY, 0);
    this.group.add(rightCol);

    // Obstacle registration
    this.obstacles.push(
      { x: center.x - 4, z: center.z - 2, radius: 2.2 },
      { x: center.x + 4, z: center.z + 2, radius: 2.2 }
    );

    // 3. Colossal Lintel (Top Arch Stone)
    const lintelGeo = new THREE.BoxGeometry(pillarSpacing + pillarWidth + 4, 3.2, 4.4);
    const lintel = new THREE.Mesh(lintelGeo, stoneMat);
    lintel.position.set(0, floorY + pillarHeight + 1.6, 0);
    lintel.castShadow = true;
    this.group.add(lintel);

    // Top Crown Pediment
    const crownGeo = new THREE.ConeGeometry(pillarSpacing * 0.7, 3.4, 4);
    crownGeo.rotateY(Math.PI / 4);
    const crown = new THREE.Mesh(crownGeo, stoneMat);
    crown.position.set(0, floorY + pillarHeight + 4.9, 0);
    this.group.add(crown);

    // 4. 7 Ancient Rune Sockets (3 on left pillar, 3 on right pillar, 1 on lintel apex)
    this.createRuneSockets(pillarSpacing, floorY, pillarHeight);

    // 5. Swirling Celestial Vortex
    this.createPortalVortex(floorY, pillarHeight);

    // 6. Portal Glow Light
    this.portalLight = new THREE.PointLight(0x00f0ff, 2.5, 35);
    this.portalLight.position.set(0, floorY + pillarHeight * 0.5, 1.2);
    this.group.add(this.portalLight);

    // 7. Swirling Energy Stardust Particles
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(this.particleCount * 3);
    this.particleAngles = new Float32Array(this.particleCount);
    this.particleRadii = new Float32Array(this.particleCount);
    this.particleSpeeds = new Float32Array(this.particleCount);

    for (let i = 0; i < this.particleCount; i++) {
      this.particleAngles[i] = Math.random() * Math.PI * 2;
      this.particleRadii[i] = 1.2 + Math.random() * 4.2;
      this.particleSpeeds[i] = 0.8 + Math.random() * 1.5;

      pPos[i * 3] = Math.cos(this.particleAngles[i]) * this.particleRadii[i];
      pPos[i * 3 + 1] = floorY + pillarHeight * 0.5 + Math.sin(this.particleAngles[i]) * (this.particleRadii[i] * 1.3);
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
    }

    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));

    const pTexture = this.createParticleTexture();
    const pMat = new THREE.PointsMaterial({
      size: 0.45,
      map: pTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: 0x88ffff,
    });

    this.particleVortex = new THREE.Points(pGeo, pMat);
    this.group.add(this.particleVortex);
  }

  private createMegalithPillar(w: number, h: number, d: number, mat1: THREE.Material, mat2: THREE.Material): THREE.Group {
    const col = new THREE.Group();

    // Main column
    const mainGeo = new THREE.BoxGeometry(w, h, d);
    const main = new THREE.Mesh(mainGeo, mat1);
    main.position.y = h / 2;
    main.castShadow = true;
    main.receiveShadow = true;
    col.add(main);

    // Carved runic bands (accent details)
    const bandGeo = new THREE.BoxGeometry(w + 0.3, 0.6, d + 0.3);
    for (let b = 1; b <= 3; b++) {
      const band = new THREE.Mesh(bandGeo, mat2);
      band.position.y = b * (h / 4);
      col.add(band);
    }

    return col;
  }

  private createRuneSockets(spacing: number, floorY: number, height: number): void {
    const socketGeo = new THREE.OctahedronGeometry(0.55);

    // 7 sockets layout:
    // Sockets 0, 1, 2 on left pillar
    // Sockets 3 on lintel apex
    // Sockets 4, 5, 6 on right pillar
    const socketPositions: [number, number, number][] = [
      [-spacing / 2, floorY + height * 0.3, 1.9],
      [-spacing / 2, floorY + height * 0.55, 1.9],
      [-spacing / 2, floorY + height * 0.8, 1.9],
      [0, floorY + height + 2.2, 2.3],
      [spacing / 2, floorY + height * 0.8, 1.9],
      [spacing / 2, floorY + height * 0.55, 1.9],
      [spacing / 2, floorY + height * 0.3, 1.9],
    ];

    socketPositions.forEach(([x, y, z]) => {
      // Inactive dormant rune
      const runeMat = new THREE.MeshStandardMaterial({
        color: 0x223344,
        emissive: 0x112233,
        emissiveIntensity: 0.1,
        roughness: 0.4,
        metalness: 0.8,
      });

      const rune = new THREE.Mesh(socketGeo, runeMat);
      rune.position.set(x, y, z);
      this.group.add(rune);
      this.runeMeshes.push(rune);
    });
  }

  private createPortalVortex(floorY: number, pillarHeight: number): void {
    // 3 concentric energy rings
    const ringRadii = [4.8, 3.6, 2.4];
    const ringColors = [0x00f0ff, 0x4895ef, 0x7209b7];

    ringRadii.forEach((radius, idx) => {
      const ringGeo = new THREE.TorusGeometry(radius, 0.22, 16, 48);
      const ringMat = new THREE.MeshStandardMaterial({
        color: ringColors[idx],
        emissive: ringColors[idx],
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.75,
        roughness: 0.1,
      });

      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(0, floorY + pillarHeight * 0.5, 0);
      ring.scale.set(1.0, 1.35, 1.0); // Oval portal shape
      this.group.add(ring);
      this.vortexRings.push(ring);
    });

    // Central semi-transparent vortex backdrop
    const vortexBackGeo = new THREE.CircleGeometry(4.6, 32);
    const vortexBackMat = new THREE.MeshBasicMaterial({
      color: 0x002244,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
    });
    const vortexBack = new THREE.Mesh(vortexBackGeo, vortexBackMat);
    vortexBack.scale.set(1.0, 1.35, 1.0);
    vortexBack.position.set(0, floorY + pillarHeight * 0.5, 0);
    this.group.add(vortexBack);
  }

  private createParticleTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.4, 'rgba(0, 240, 255, 0.9)');
    grad.addColorStop(0.8, 'rgba(100, 150, 255, 0.2)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Updates illuminated rune sockets as player gathers Echo Crystals (0 to 7)
   */
  public updateCrystalProgress(collectedCount: number): void {
    const activeCount = Math.min(collectedCount, 7);

    for (let i = 0; i < 7; i++) {
      const rune = this.runeMeshes[i];
      const mat = rune.material as THREE.MeshStandardMaterial;

      if (i < activeCount) {
        // Awakened glowing rune
        mat.color.setHex(0x00ffff);
        mat.emissive.setHex(0x00f0ff);
        mat.emissiveIntensity = 2.2;
      } else {
        mat.color.setHex(0x223344);
        mat.emissive.setHex(0x112233);
        mat.emissiveIntensity = 0.1;
      }
    }

    if (activeCount >= 7 && !this.isFullyAwakened) {
      this.isFullyAwakened = true;
      this.portalLight.color.setHex(0x00ffff);
      this.portalLight.intensity = 8.5;
    }
  }

  public update(time: number): void {
    // Rotate vortex rings in opposing directions
    this.vortexRings.forEach((ring, idx) => {
      const dir = idx % 2 === 0 ? 1 : -1;
      ring.rotation.z += 0.012 * dir * (idx + 1);
      const pulse = 1.0 + Math.sin(time * 2.5 + idx) * 0.04;
      ring.scale.set(pulse, pulse * 1.35, pulse);
    });

    // Animate stardust particles spiraling into portal
    const pos = this.particleVortex.geometry.attributes.position;
    const floorY = 1.8;
    const pillarHeight = 14.0;

    for (let i = 0; i < this.particleCount; i++) {
      this.particleAngles[i] += this.particleSpeeds[i] * 0.025;
      // Slowly spiral inwards then reset
      this.particleRadii[i] -= 0.012;
      if (this.particleRadii[i] < 0.6) {
        this.particleRadii[i] = 4.4;
      }

      const px = Math.cos(this.particleAngles[i]) * this.particleRadii[i];
      const py = floorY + pillarHeight * 0.5 + Math.sin(this.particleAngles[i]) * (this.particleRadii[i] * 1.3);
      pos.setX(i, px);
      pos.setY(i, py);
    }
    pos.needsUpdate = true;

    // Portal light pulse
    const baseIntensity = this.isFullyAwakened ? 8.0 : 2.5;
    this.portalLight.intensity = baseIntensity + Math.sin(time * 3.0) * 0.8;
  }
}
