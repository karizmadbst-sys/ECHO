/**
 * ECHO – THE WORLD REMEMBERS
 * 3D Procedural Forest, Flora & Ancient Rocks
 * Multi-part composite trees, glowing forest mushrooms, ancient mossy boulders, and collision proxies.
 */

import * as THREE from 'three';
import { Terrain } from './Terrain.ts';
import { VillageHouses } from './VillageHouses.ts';

export interface WorldObstacle {
  x: number;
  z: number;
  radius: number;
}

export class Forest {
  public group: THREE.Group;
  public obstacles: WorldObstacle[] = [];

  constructor(terrain: Terrain) {
    this.group = new THREE.Group();

    this.spawnForestTrees(terrain);
    this.spawnBoulders(terrain);
    this.spawnGlowingMushrooms(terrain);
    this.spawnColossalElderTree(terrain);
  }

  /**
   * Spawns multi-part composite trees with varied trunks, tiered leafy crowns, and root spreads
   */
  private spawnForestTrees(terrain: Terrain): void {
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x4a3220,
      roughness: 0.9,
      metalness: 0.05,
    });

    const leafPalette = [
      new THREE.MeshStandardMaterial({ color: 0x225533, roughness: 0.8 }), // Pine emerald
      new THREE.MeshStandardMaterial({ color: 0x1b4430, roughness: 0.8 }), // Deep spruce
      new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.75 }), // Mystic teal green
      new THREE.MeshStandardMaterial({ color: 0x40916c, roughness: 0.7 }), // Bright moss green
    ];

    // Tree coordinates clustered in forest biomes (Northwest, Southwest, Valley margins)
    const treeCount = 140;

    for (let i = 0; i < treeCount; i++) {
      // Pick random positions across island
      const angle = Math.random() * Math.PI * 2;
      const dist = 35 + Math.random() * 165;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      // Don't spawn inside lake or too close to temple/portal
      const lakeDist = Math.sqrt((x - Terrain.LAKE_CENTER.x) ** 2 + (z - Terrain.LAKE_CENTER.y) ** 2);
      if (lakeDist < Terrain.LAKE_RADIUS + 6) continue;

      const templeDist = Math.sqrt((x - Terrain.TEMPLE_POS.x) ** 2 + (z - Terrain.TEMPLE_POS.z) ** 2);
      if (templeDist < 25) continue;

      const portalDist = Math.sqrt((x - Terrain.PORTAL_POS.x) ** 2 + (z - Terrain.PORTAL_POS.z) ** 2);
      if (portalDist < 22) continue;

      // Don't spawn trees inside houses, courtyards, or village streets
      if (VillageHouses.isNearAnyHouse(x, z, 3.5)) continue;

      const y = terrain.getHeightAt(x, z);
      // Skip steep high mountain peaks or underwater
      if (y < 2.5 || y > 24.0) continue;

      const tree = this.createCompositeTree(trunkMat, leafPalette);
      const scale = 0.8 + Math.random() * 0.55;
      tree.scale.set(scale, scale * (0.9 + Math.random() * 0.3), scale);
      tree.position.set(x, y, z);
      tree.rotation.y = Math.random() * Math.PI * 2;
      this.group.add(tree);

      // Register collision for tree trunk
      this.obstacles.push({
        x,
        z,
        radius: 0.8 * scale,
      });
    }
  }

  /**
   * Constructs a 4-7 part composite tree
   */
  private createCompositeTree(trunkMat: THREE.Material, leafPalette: THREE.Material[]): THREE.Group {
    const tree = new THREE.Group();

    // 1. Primary Trunk (tapered cylinder)
    const trunkHeight = 3.6;
    const trunkGeo = new THREE.CylinderGeometry(0.35, 0.65, trunkHeight, 7);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = trunkHeight / 2;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    tree.add(trunk);

    // 2. Root flares
    const rootGeo = new THREE.CylinderGeometry(0.65, 0.95, 0.6, 6);
    const roots = new THREE.Mesh(rootGeo, trunkMat);
    roots.position.y = 0.25;
    tree.add(roots);

    // 3. Multi-tiered canopy (3 distinct conical/dodecahedral layers)
    const leafMat = leafPalette[Math.floor(Math.random() * leafPalette.length)];
    const tiers = 3;
    for (let t = 0; t < tiers; t++) {
      const tierRadius = 2.4 - t * 0.55;
      const tierHeight = 2.2 - t * 0.3;
      const foliageGeo = new THREE.ConeGeometry(tierRadius, tierHeight, 7);
      const foliage = new THREE.Mesh(foliageGeo, leafMat);
      foliage.position.y = trunkHeight + t * 1.35;
      foliage.castShadow = true;
      foliage.receiveShadow = true;
      // Slight irregular tilt
      foliage.rotation.y = (t * Math.PI) / 3;
      foliage.rotation.x = (Math.random() - 0.5) * 0.08;
      tree.add(foliage);
    }

    return tree;
  }

  /**
   * Spawns The Colossal Elder Tree (landmark for Crystal #6)
   */
  private spawnColossalElderTree(terrain: Terrain): void {
    const elderPos = new THREE.Vector3(-45, 0, -65);
    const y = terrain.getHeightAt(elderPos.x, elderPos.z);
    elderPos.y = y;

    const elderGroup = new THREE.Group();
    elderGroup.position.copy(elderPos);

    // Colossal twisted trunk
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x3d2716,
      roughness: 0.95,
      metalness: 0.05,
    });

    const trunkGeo = new THREE.CylinderGeometry(1.6, 2.8, 8.0, 9);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 4.0;
    trunk.castShadow = true;
    elderGroup.add(trunk);

    // Giant wide roots
    for (let r = 0; r < 5; r++) {
      const rootAngle = (r / 5) * Math.PI * 2;
      const rootGeo = new THREE.BoxGeometry(1.2, 1.4, 4.5);
      const root = new THREE.Mesh(rootGeo, trunkMat);
      root.position.set(Math.cos(rootAngle) * 2.8, 0.6, Math.sin(rootAngle) * 2.8);
      root.rotation.y = rootAngle;
      root.rotation.x = -0.15;
      elderGroup.add(root);
    }

    // Luminescent ancient canopy (Bioluminescent leaves)
    const elderLeafMat = new THREE.MeshStandardMaterial({
      color: 0x1dd1a1,
      emissive: 0x0fa882,
      emissiveIntensity: 0.45,
      roughness: 0.6,
    });

    for (let c = 0; c < 5; c++) {
      const crownGeo = new THREE.DodecahedronGeometry(3.6 + Math.random() * 1.2);
      const crown = new THREE.Mesh(crownGeo, elderLeafMat);
      crown.position.set((Math.random() - 0.5) * 4.0, 8.5 + c * 1.5, (Math.random() - 0.5) * 4.0);
      crown.castShadow = true;
      elderGroup.add(crown);
    }

    this.group.add(elderGroup);
    this.obstacles.push({
      x: elderPos.x,
      z: elderPos.z,
      radius: 3.2,
    });
  }

  /**
   * Spawns ancient boulders and cliff rocks across the ridges and perimeter
   */
  private spawnBoulders(terrain: Terrain): void {
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x585860,
      roughness: 0.88,
      metalness: 0.15,
      flatShading: true,
    });

    const rockGeo = new THREE.DodecahedronGeometry(1.0, 1);

    // Scatter 70 boulders across mountain base and rocky outcrops
    for (let i = 0; i < 70; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 40 + Math.random() * 170;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      const y = terrain.getHeightAt(x, z);
      if (y < 2.0) continue;

      // Don't spawn boulders inside houses or village streets
      if (VillageHouses.isNearAnyHouse(x, z, 3.0)) continue;

      const scaleX = 1.2 + Math.random() * 2.6;
      const scaleY = 1.0 + Math.random() * 2.2;
      const scaleZ = 1.2 + Math.random() * 2.6;

      const boulder = new THREE.Mesh(rockGeo, rockMat);
      boulder.position.set(x, y + scaleY * 0.4, z);
      boulder.scale.set(scaleX, scaleY, scaleZ);
      boulder.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      boulder.castShadow = true;
      boulder.receiveShadow = true;
      this.group.add(boulder);

      if (scaleX > 2.0) {
        this.obstacles.push({
          x,
          z,
          radius: Math.max(scaleX, scaleZ) * 0.8,
        });
      }
    }
  }

  /**
   * Spawns clusters of tiny bioluminescent mushrooms across the forest floor
   */
  private spawnGlowingMushrooms(terrain: Terrain): void {
    const mushGeo = new THREE.ConeGeometry(0.18, 0.22, 6);
    const stemGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.3, 5);

    const mushMat = new THREE.MeshStandardMaterial({
      color: 0x00f5d4,
      emissive: 0x00bbf9,
      emissiveIntensity: 0.85,
      roughness: 0.3,
    });
    const stemMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.9 });

    for (let c = 0; c < 24; c++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 45 + Math.random() * 110;
      const cx = Math.cos(angle) * dist;
      const cz = Math.sin(angle) * dist;
      const cy = terrain.getHeightAt(cx, cz);
      if (cy < 3.0 || cy > 18.0) continue;

      const cluster = new THREE.Group();
      cluster.position.set(cx, cy, cz);

      for (let m = 0; m < 5; m++) {
        const single = new THREE.Group();
        single.position.set((Math.random() - 0.5) * 1.2, 0, (Math.random() - 0.5) * 1.2);
        const scale = 0.6 + Math.random() * 0.8;
        single.scale.setScalar(scale);

        const stem = new THREE.Mesh(stemGeo, stemMat);
        stem.position.y = 0.15;
        const cap = new THREE.Mesh(mushGeo, mushMat);
        cap.position.y = 0.35;
        single.add(stem, cap);
        cluster.add(single);
      }
      this.group.add(cluster);
    }
  }
}
