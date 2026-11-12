/**
 * ECHO – THE WORLD REMEMBERS
 * The Ancient Temple Sanctuary (المعبد القديم)
 * Multi-part stone colonnade, weathered architraves, ceremonial dais, and glowing braziers.
 */

import * as THREE from 'three';
import { Terrain } from './Terrain.ts';
import { WorldObstacle } from './Forest.ts';

export class AncientTemple {
  public group: THREE.Group;
  public obstacles: WorldObstacle[] = [];
  private brazierLights: THREE.PointLight[] = [];

  constructor(terrain: Terrain) {
    this.group = new THREE.Group();

    const center = Terrain.TEMPLE_POS;
    const baseY = terrain.getHeightAt(center.x, center.z);
    this.group.position.set(center.x, baseY, center.z);

    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x82848c,
      roughness: 0.85,
      metalness: 0.1,
    });

    const mossStoneMat = new THREE.MeshStandardMaterial({
      color: 0x5c695a,
      roughness: 0.9,
      metalness: 0.08,
    });

    const runeMat = new THREE.MeshStandardMaterial({
      color: 0x00f5d4,
      emissive: 0x00c49f,
      emissiveIntensity: 0.7,
      roughness: 0.25,
    });

    // 1. Raised Stepped Foundation (3 concentric tiers)
    for (let t = 0; t < 3; t++) {
      const radius = 22 - t * 2.2;
      const height = 0.6;
      const daisGeo = new THREE.CylinderGeometry(radius, radius + 0.5, height, 16);
      const dais = new THREE.Mesh(daisGeo, stoneMat);
      dais.position.y = t * height + height / 2;
      dais.receiveShadow = true;
      this.group.add(dais);
    }

    const floorY = 1.8;

    // 2. Colonnade of Ancient Stone Pillars (10 pillars in outer circle)
    const pillarCount = 10;
    const ringRadius = 15;
    const pillarHeight = 6.8;

    for (let i = 0; i < pillarCount; i++) {
      const angle = (i / pillarCount) * Math.PI * 2;
      const px = Math.cos(angle) * ringRadius;
      const pz = Math.sin(angle) * ringRadius;

      // Skip one or two pillars for an open grand entrance facing East/Lake
      if (Math.abs(angle) < 0.35) continue;

      const isBroken = i === 3 || i === 7;
      const height = isBroken ? pillarHeight * 0.45 : pillarHeight;

      const colGroup = new THREE.Group();
      colGroup.position.set(px, floorY, pz);

      // Base pedestal
      const baseGeo = new THREE.BoxGeometry(1.6, 0.6, 1.6);
      const base = new THREE.Mesh(baseGeo, stoneMat);
      base.position.y = 0.3;
      base.castShadow = true;
      colGroup.add(base);

      // Fluted shaft
      const shaftGeo = new THREE.CylinderGeometry(0.6, 0.7, height, 10);
      const shaft = new THREE.Mesh(shaftGeo, i % 2 === 0 ? stoneMat : mossStoneMat);
      shaft.position.y = 0.6 + height / 2;
      shaft.castShadow = true;
      shaft.receiveShadow = true;
      colGroup.add(shaft);

      // Capital (if intact)
      if (!isBroken) {
        const capGeo = new THREE.BoxGeometry(1.7, 0.5, 1.7);
        const cap = new THREE.Mesh(capGeo, stoneMat);
        cap.position.y = 0.6 + height + 0.25;
        cap.castShadow = true;
        colGroup.add(cap);
      }

      this.group.add(colGroup);

      // Register collision in world space
      this.obstacles.push({
        x: center.x + px,
        z: center.z + pz,
        radius: 1.1,
      });
    }

    // 3. Central Pedestal Altar (Site of Crystal #3: Crystal of Sanctuary)
    const altarBaseGeo = new THREE.CylinderGeometry(3.2, 3.8, 1.2, 12);
    const altarBase = new THREE.Mesh(altarBaseGeo, stoneMat);
    altarBase.position.y = floorY + 0.6;
    altarBase.castShadow = true;
    altarBase.receiveShadow = true;
    this.group.add(altarBase);

    // Glowing Runic Altar Plate
    const runePlateGeo = new THREE.CylinderGeometry(2.4, 2.4, 0.12, 16);
    const runePlate = new THREE.Mesh(runePlateGeo, runeMat);
    runePlate.position.y = floorY + 1.25;
    this.group.add(runePlate);

    this.obstacles.push({
      x: center.x,
      z: center.z,
      radius: 3.2,
    });

    // 4. Temple Braziers (4 braziers flanking the ceremonial altar)
    const brazierPositions = [
      [-6, -6],
      [6, -6],
      [-6, 6],
      [6, 6],
    ];

    brazierPositions.forEach(([bx, bz]) => {
      const brazier = new THREE.Group();
      brazier.position.set(bx, floorY, bz);

      const standGeo = new THREE.CylinderGeometry(0.35, 0.45, 1.8, 8);
      const stand = new THREE.Mesh(standGeo, stoneMat);
      stand.position.y = 0.9;
      brazier.add(stand);

      const bowlGeo = new THREE.CylinderGeometry(0.85, 0.4, 0.5, 8);
      const bowl = new THREE.Mesh(bowlGeo, stoneMat);
      bowl.position.y = 2.0;
      brazier.add(bowl);

      // Glowing mystical fire orb
      const flameGeo = new THREE.IcosahedronGeometry(0.35, 1);
      const flameMat = new THREE.MeshBasicMaterial({ color: 0x00f5d4 });
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.y = 2.4;
      brazier.add(flame);

      const light = new THREE.PointLight(0x00f5d4, 1.8, 16);
      light.position.y = 2.6;
      brazier.add(light);
      this.brazierLights.push(light);

      this.group.add(brazier);
    });
  }

  public update(time: number): void {
    // Flickering mystical firelight
    this.brazierLights.forEach((light, i) => {
      light.intensity = 1.6 + Math.sin(time * 3.5 + i * 1.5) * 0.4;
    });
  }
}
