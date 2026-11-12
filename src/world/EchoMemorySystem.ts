/**
 * ECHO – THE WORLD REMEMBERS
 * Echo Memory System (نظام ذاكرة صدى العالم)
 * 
 * Tracks player behavior and actions in real time:
 * - Time spent in each biome/zone
 * - Distance sprinted and movement pace
 * - Exploration discovery of secret areas
 * - Crystals and shards collected
 * - Temple and portal visits
 * 
 * Uses this real behavioral data to physically alter and awaken the 3D world:
 * 1. Awakening of the Colossal Elder Tree Heart (matching reference image with glowing cyan portal eye)
 * 2. Secret Crystalline Pathway (glowing stepping stone bridge across lake)
 * 3. Slumbering Forest Spirit Stag (ethereal glowing celestial guardian)
 * 4. Secret Deep Temple Inscriptions (illuminated floor runes of the First Builders)
 * 5. Shimmering Celestial Sky Aurora and guiding stardust
 */

import * as THREE from 'three';
import { Terrain } from './Terrain.ts';

export type BiomeType =
  | 'SHORELINE'
  | 'FOREST'
  | 'LAKE'
  | 'TEMPLE'
  | 'ELDER_TREE'
  | 'SUMMIT'
  | 'PORTAL'
  | 'GROTTO';

export interface BiomeInfo {
  id: BiomeType;
  nameAr: string;
  nameEn: string;
  color: string;
}

export const BIOMES: Record<BiomeType, BiomeInfo> = {
  SHORELINE: {
    id: 'SHORELINE',
    nameAr: 'الشاطئ الجنوبي',
    nameEn: 'Southern Shoreline',
    color: '#00f5d4',
  },
  FOREST: {
    id: 'FOREST',
    nameAr: 'غابة الصنوبر الهامسة',
    nameEn: 'Whispering Pine Forest',
    color: '#52b788',
  },
  LAKE: {
    id: 'LAKE',
    nameAr: 'البحيرة الزرقاء المضيئة',
    nameEn: 'Bioluminescent Lake',
    color: '#00bbf9',
  },
  TEMPLE: {
    id: 'TEMPLE',
    nameAr: 'المعبد القديم والملاذ',
    nameEn: 'Ancient Temple Sanctuary',
    color: '#9b5de5',
  },
  ELDER_TREE: {
    id: 'ELDER_TREE',
    nameAr: 'شجرة الخلود العتيقة',
    nameEn: 'Colossal Elder Tree Glade',
    color: '#00f0ff',
  },
  SUMMIT: {
    id: 'SUMMIT',
    nameAr: 'قمم الجبال الشاهقة',
    nameEn: 'High Mountain Summit',
    color: '#f15bb5',
  },
  PORTAL: {
    id: 'PORTAL',
    nameAr: 'البوابة الحجرية العظيمة',
    nameEn: 'The Great Stone Portal',
    color: '#4cc9f0',
  },
  GROTTO: {
    id: 'GROTTO',
    nameAr: 'الغار الصخري والكهوف',
    nameEn: 'Coastal Rock Grotto',
    color: '#7209b7',
  },
};

export interface WorldManifestation {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  unlocked: boolean;
  unlockedAt?: number;
}

export interface PlayerMemoryProfile {
  totalPlayTimeSec: number;
  biomeTimeSec: Record<BiomeType, number>;
  sprintDistanceMeters: number;
  sprintCount: number;
  zonesVisited: BiomeType[];
  templeVisits: number;
  portalVisits: number;
  elderTreeVisits: number;
  secretsFound: string[];
  manifestations: Record<string, boolean>;
  worldResonanceLevel: number;
  archetypeAr: string;
  archetypeEn: string;
}

export class EchoMemorySystem {
  public group: THREE.Group;
  public profile: PlayerMemoryProfile;

  // Active 3D Manifestations in the scene
  private elderTreeHeartGroup: THREE.Group | null = null;
  private elderTreeEyeMesh: THREE.Mesh | null = null;
  private elderTreeGlowLight: THREE.PointLight | null = null;
  private elderTreeFlowers: THREE.InstancedMesh | null = null;

  private secretBridgeGroup: THREE.Group | null = null;
  private secretBridgeSteppingStones: THREE.Mesh[] = [];

  private forestSpiritGroup: THREE.Group | null = null;
  private spiritAntlers: THREE.Mesh | null = null;
  private spiritLight: THREE.PointLight | null = null;

  private templeRunesGroup: THREE.Group | null = null;
  private templeRuneMeshes: THREE.Mesh[] = [];

  // Internal state tracking
  private currentBiome: BiomeType = 'SHORELINE';
  private previousBiome: BiomeType | null = null;
  private lastPosition: THREE.Vector3 = new THREE.Vector3();
  private timeInCurrentBiome: number = 0;
  private hasInitializedPosition: boolean = false;

  constructor(private terrain: Terrain) {
    this.group = new THREE.Group();
    this.profile = this.createDefaultProfile();

    this.buildElderTreeHeart();
    this.buildSecretCrystallinePathway();
    this.buildSlumberingForestSpirit();
    this.buildDeepTempleRunes();

    this.evaluateManifestations(true);
  }

  private createDefaultProfile(): PlayerMemoryProfile {
    return {
      totalPlayTimeSec: 0,
      biomeTimeSec: {
        SHORELINE: 0,
        FOREST: 0,
        LAKE: 0,
        TEMPLE: 0,
        ELDER_TREE: 0,
        SUMMIT: 0,
        PORTAL: 0,
        GROTTO: 0,
      },
      sprintDistanceMeters: 0,
      sprintCount: 0,
      zonesVisited: ['SHORELINE'],
      templeVisits: 0,
      portalVisits: 0,
      elderTreeVisits: 0,
      secretsFound: [],
      manifestations: {
        elder_tree_heart: false,
        crystalline_bridge: false,
        forest_spirit: false,
        temple_deep_runes: false,
        celestial_aurora: false,
      },
      worldResonanceLevel: 1,
      archetypeAr: 'الرحالة المستكشف',
      archetypeEn: 'The Novice Pilgrim',
    };
  }

  // =========================================================================
  // 1. 3D WORLD MANIFESTATIONS (التغييرات الحقيقية في العالم)
  // =========================================================================

  /**
   * Manifestation 1: The Heart of the Colossal Elder Tree
   * (Directly matches the user's reference image with radiant cyan circular eye in the trunk)
   */
  private buildElderTreeHeart(): void {
    const elderPos = new THREE.Vector3(-45, 0, -65);
    const y = this.terrain.getHeightAt(elderPos.x, elderPos.z);
    elderPos.y = y;

    this.elderTreeHeartGroup = new THREE.Group();
    this.elderTreeHeartGroup.position.copy(elderPos);
    this.elderTreeHeartGroup.visible = false; // Initially sleeping

    // Glowing cyan ocular vortex inside the trunk
    const eyeGeo = new THREE.CylinderGeometry(1.35, 1.35, 0.22, 32);
    eyeGeo.rotateX(Math.PI / 2);

    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00d2ff,
      emissiveIntensity: 3.5,
      roughness: 0.1,
      metalness: 0.9,
    });
    this.elderTreeEyeMesh = new THREE.Mesh(eyeGeo, eyeMat);
    this.elderTreeEyeMesh.position.set(0, 3.8, 1.48);
    this.elderTreeHeartGroup.add(this.elderTreeEyeMesh);

    // Glowing crystalline iris rings
    for (let r = 0; r < 3; r++) {
      const ringGeo = new THREE.TorusGeometry(0.55 + r * 0.38, 0.045, 8, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x80ffff,
        transparent: true,
        opacity: 0.85,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(0, 3.8, 1.52 + r * 0.02);
      this.elderTreeHeartGroup.add(ring);
    }

    // High intensity cyan light emanating from the tree heart
    this.elderTreeGlowLight = new THREE.PointLight(0x00f0ff, 4.5, 22);
    this.elderTreeGlowLight.position.set(0, 3.8, 2.2);
    this.elderTreeHeartGroup.add(this.elderTreeGlowLight);

    // Blue luminous spirit flowers blooming around the roots
    const flowerCount = 36;
    const flowerGeo = new THREE.ConeGeometry(0.18, 0.32, 5);
    const flowerMat = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x0077b6,
      emissiveIntensity: 1.8,
      roughness: 0.2,
    });
    this.elderTreeFlowers = new THREE.InstancedMesh(flowerGeo, flowerMat, flowerCount);
    const dummy = new THREE.Object3D();

    for (let f = 0; f < flowerCount; f++) {
      const angle = (f / flowerCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const radius = 2.4 + Math.random() * 3.8;
      const fx = Math.cos(angle) * radius;
      const fz = Math.sin(angle) * radius;
      const fy = 0.2 + Math.random() * 0.3;

      dummy.position.set(fx, fy, fz);
      dummy.scale.setScalar(0.7 + Math.random() * 0.6);
      dummy.rotation.set((Math.random() - 0.5) * 0.4, Math.random() * Math.PI, (Math.random() - 0.5) * 0.4);
      dummy.updateMatrix();
      this.elderTreeFlowers.setMatrixAt(f, dummy.matrix);
    }
    this.elderTreeFlowers.instanceMatrix.needsUpdate = true;
    this.elderTreeHeartGroup.add(this.elderTreeFlowers);

    this.group.add(this.elderTreeHeartGroup);
  }

  /**
   * Manifestation 2: Secret Crystalline Stepping-Stone Bridge across the Lake
   */
  private buildSecretCrystallinePathway(): void {
    this.secretBridgeGroup = new THREE.Group();
    this.secretBridgeGroup.visible = false; // Initially sleeping

    const stoneGeo = new THREE.CylinderGeometry(1.2, 1.4, 0.45, 8);
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x00f5d4,
      emissive: 0x00bbf9,
      emissiveIntensity: 1.2,
      roughness: 0.2,
      metalness: 0.8,
      transparent: true,
      opacity: 0.9,
    });

    // Arc of 7 stepping stones across the southern corner of the lake towards the water grotto
    const stoneCount = 7;
    const startPos = new THREE.Vector2(-12, 12);
    const endPos = new THREE.Vector2(20, -8);

    for (let s = 0; s < stoneCount; s++) {
      const t = s / (stoneCount - 1);
      const px = THREE.MathUtils.lerp(startPos.x, endPos.x, t);
      const pz = THREE.MathUtils.lerp(startPos.y, endPos.y, t) + Math.sin(t * Math.PI) * 4.5;
      const py = Terrain.LAKE_WATER_Y + 0.15;

      const stone = new THREE.Mesh(stoneGeo, stoneMat);
      stone.position.set(px, py, pz);
      stone.rotation.y = s * 0.4;
      stone.receiveShadow = true;
      this.secretBridgeGroup.add(stone);
      this.secretBridgeSteppingStones.push(stone);
    }

    this.group.add(this.secretBridgeGroup);
  }

  /**
   * Manifestation 3: Slumbering Forest Spirit Stag
   */
  private buildSlumberingForestSpirit(): void {
    this.forestSpiritGroup = new THREE.Group();
    // Placed in peaceful glade in eastern forest
    const sx = 40;
    const sz = 15;
    const sy = this.terrain.getHeightAt(sx, sz);
    this.forestSpiritGroup.position.set(sx, sy, sz);
    this.forestSpiritGroup.visible = false; // Awakened by sprinting / agitation

    const spiritMat = new THREE.MeshStandardMaterial({
      color: 0xa8dadc,
      emissive: 0x457b9d,
      emissiveIntensity: 1.6,
      transparent: true,
      opacity: 0.85,
      roughness: 0.3,
    });

    // Spirit body (graceful deer torso)
    const bodyGeo = new THREE.CapsuleGeometry(0.55, 1.2, 4, 8);
    bodyGeo.rotateZ(Math.PI / 2);
    const body = new THREE.Mesh(bodyGeo, spiritMat);
    body.position.y = 1.6;
    body.castShadow = true;
    this.forestSpiritGroup.add(body);

    // Graceful long neck & head
    const neckGeo = new THREE.CylinderGeometry(0.18, 0.28, 0.9, 6);
    const neck = new THREE.Mesh(neckGeo, spiritMat);
    neck.position.set(0.65, 2.1, 0);
    neck.rotation.z = -0.45;
    this.forestSpiritGroup.add(neck);

    const headGeo = new THREE.ConeGeometry(0.24, 0.55, 6);
    headGeo.rotateZ(-Math.PI / 2);
    const head = new THREE.Mesh(headGeo, spiritMat);
    head.position.set(1.0, 2.5, 0);
    this.forestSpiritGroup.add(head);

    // Glowing branching antlers
    const antlerGeo = new THREE.TorusGeometry(0.5, 0.04, 6, 12, Math.PI);
    this.spiritAntlers = new THREE.Mesh(antlerGeo, new THREE.MeshBasicMaterial({ color: 0x00f5d4 }));
    this.spiritAntlers.position.set(1.0, 2.9, 0);
    this.spiritAntlers.rotation.y = Math.PI / 2;
    this.forestSpiritGroup.add(this.spiritAntlers);

    // Spirit light
    this.spiritLight = new THREE.PointLight(0xa8dadc, 2.2, 14);
    this.spiritLight.position.set(0, 2.2, 0);
    this.forestSpiritGroup.add(this.spiritLight);

    this.group.add(this.forestSpiritGroup);
  }

  /**
   * Manifestation 4: Deep Temple Floor Runes
   */
  private buildDeepTempleRunes(): void {
    const center = Terrain.TEMPLE_POS;
    const baseY = this.terrain.getHeightAt(center.x, center.z);
    const floorY = baseY + 1.82;

    this.templeRunesGroup = new THREE.Group();
    this.templeRunesGroup.position.set(center.x, floorY, center.z);
    this.templeRunesGroup.visible = false; // Awakened after multiple temple visits

    const runeMat = new THREE.MeshStandardMaterial({
      color: 0xffd166,
      emissive: 0xf77f00,
      emissiveIntensity: 2.4,
      roughness: 0.2,
    });

    // 8 concentric and radial mystical rune glyph strips along temple peristyle floor
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const rx = Math.cos(angle) * 8.5;
      const rz = Math.sin(angle) * 8.5;

      const runeGeo = new THREE.BoxGeometry(1.6, 0.04, 0.45);
      const rune = new THREE.Mesh(runeGeo, runeMat);
      rune.position.set(rx, 0.02, rz);
      rune.rotation.y = -angle;
      this.templeRunesGroup.add(rune);
      this.templeRuneMeshes.push(rune);
    }

    this.group.add(this.templeRunesGroup);
  }

  // =========================================================================
  // 2. BEHAVIOR ANALYSIS & BIOME TRACKING
  // =========================================================================

  /**
   * Identifies which biome or landmark the player is currently occupying
   */
  public determineBiome(x: number, z: number): BiomeType {
    // 1. Elder Tree
    const elderDist = Math.hypot(x - (-45), z - (-65));
    if (elderDist < 26) return 'ELDER_TREE';

    // 2. Temple Sanctuary
    const templeDist = Math.hypot(x - Terrain.TEMPLE_POS.x, z - Terrain.TEMPLE_POS.z);
    if (templeDist < 30) return 'TEMPLE';

    // 3. Great Portal
    const portalDist = Math.hypot(x - Terrain.PORTAL_POS.x, z - Terrain.PORTAL_POS.z);
    if (portalDist < 26) return 'PORTAL';

    // 4. Bioluminescent Lake
    const lakeDist = Math.hypot(x - Terrain.LAKE_CENTER.x, z - Terrain.LAKE_CENTER.y);
    if (lakeDist < Terrain.LAKE_RADIUS + 8) return 'LAKE';

    // 5. Summit
    const summitDist = Math.hypot(x - Terrain.SUMMIT_POS.x, z - Terrain.SUMMIT_POS.z);
    if (summitDist < 35) return 'SUMMIT';

    // 6. Coastal Grotto
    if (x < -70 && z < -40) return 'GROTTO';

    // 7. Southern Shoreline
    if (z > 60) return 'SHORELINE';

    // 8. Forest default
    return 'FOREST';
  }

  /**
   * Called every frame from Game loop to track locomotion, time, and biomes
   */
  public updatePlayerTracking(
    dt: number,
    playerPos: THREE.Vector3,
    isSprinting: boolean,
    crystalsCount: number,
    shardsCount: number,
    inscriptionsCount: number
  ): void {
    this.profile.totalPlayTimeSec += dt;

    if (!this.hasInitializedPosition) {
      this.lastPosition.copy(playerPos);
      this.hasInitializedPosition = true;
    }

    // Distance computation
    const distMoved = this.lastPosition.distanceTo(playerPos);
    this.lastPosition.copy(playerPos);

    if (isSprinting && distMoved > 0.01) {
      this.profile.sprintDistanceMeters += distMoved;
    }

    // Biome occupancy
    const newBiome = this.determineBiome(playerPos.x, playerPos.z);
    this.profile.biomeTimeSec[newBiome] = (this.profile.biomeTimeSec[newBiome] || 0) + dt;

    // Detect biome transition
    if (newBiome !== this.currentBiome) {
      this.previousBiome = this.currentBiome;
      this.currentBiome = newBiome;
      this.timeInCurrentBiome = 0;

      if (!this.profile.zonesVisited.includes(newBiome)) {
        this.profile.zonesVisited.push(newBiome);
      }

      if (newBiome === 'TEMPLE') this.profile.templeVisits++;
      if (newBiome === 'PORTAL') this.profile.portalVisits++;
      if (newBiome === 'ELDER_TREE') this.profile.elderTreeVisits++;

      // Check secret discoveries
      this.checkSecretDiscovery(newBiome, playerPos);
    } else {
      this.timeInCurrentBiome += dt;
    }

    // Periodically evaluate world manifestations
    this.evaluateManifestations(false, crystalsCount, shardsCount, inscriptionsCount);
  }

  public recordSprintTrigger(): void {
    this.profile.sprintCount++;
  }

  private checkSecretDiscovery(biome: BiomeType, pos: THREE.Vector3): void {
    if (biome === 'GROTTO' && !this.profile.secretsFound.includes('Coastal Rock Grotto')) {
      this.profile.secretsFound.push('Coastal Rock Grotto');
    }
    if (biome === 'SUMMIT' && pos.y > 28 && !this.profile.secretsFound.includes('High Mountain Summit')) {
      this.profile.secretsFound.push('High Mountain Summit');
    }
    if (biome === 'ELDER_TREE' && !this.profile.secretsFound.includes('Elder Glade Sanctuary')) {
      this.profile.secretsFound.push('Elder Glade Sanctuary');
    }
  }

  // =========================================================================
  // 3. DYNAMIC WORLD MANIFESTATIONS EVALUATION
  // =========================================================================

  /**
   * Analyzes player behavioral telemetry and unlocks/activates 3D world elements
   */
  public evaluateManifestations(
    force: boolean = false,
    crystalsCount: number = 0,
    shardsCount: number = 0,
    inscriptionsCount: number = 0
  ): { newlyUnlocked: string[] } {
    const newlyUnlocked: string[] = [];

    // 1. Elder Tree Heart Awakening
    // Condition: Player visited >= 3 zones and spent >= 20s in Elder Tree/Forest, OR gathered >= 3 shards
    const canAwakenTree =
      this.profile.zonesVisited.length >= 3 &&
      ((this.profile.biomeTimeSec.ELDER_TREE || 0) >= 15 || shardsCount >= 3 || this.profile.elderTreeVisits >= 2);

    if (canAwakenTree && (!this.profile.manifestations.elder_tree_heart || force)) {
      this.profile.manifestations.elder_tree_heart = true;
      if (this.elderTreeHeartGroup) this.elderTreeHeartGroup.visible = true;
      if (!force) newlyUnlocked.push('elder_tree_heart');
    }

    // 2. Secret Crystalline Lake Pathway
    // Condition: Explored >= 4 distinct zones and spent at least 25s by the lake
    const canAwakenBridge =
      this.profile.zonesVisited.length >= 4 &&
      ((this.profile.biomeTimeSec.LAKE || 0) >= 20 || shardsCount >= 4);

    if (canAwakenBridge && (!this.profile.manifestations.crystalline_bridge || force)) {
      this.profile.manifestations.crystalline_bridge = true;
      if (this.secretBridgeGroup) this.secretBridgeGroup.visible = true;
      if (!force) newlyUnlocked.push('crystalline_bridge');
    }

    // 3. Slumbering Forest Spirit Stag
    // Condition: Sprinted > 45 meters OR sprint count >= 5 OR lingered in whispering woods
    const canAwakenSpirit =
      this.profile.sprintDistanceMeters >= 45 ||
      this.profile.sprintCount >= 5 ||
      (this.profile.biomeTimeSec.FOREST || 0) >= 60;

    if (canAwakenSpirit && (!this.profile.manifestations.forest_spirit || force)) {
      this.profile.manifestations.forest_spirit = true;
      if (this.forestSpiritGroup) this.forestSpiritGroup.visible = true;
      if (!force) newlyUnlocked.push('forest_spirit');
    }

    // 4. Secret Deep Temple Runes
    // Condition: Visited Temple >= 2 times or read >= 2 inscriptions
    const canAwakenTempleRunes =
      this.profile.templeVisits >= 2 || inscriptionsCount >= 2;

    if (canAwakenTempleRunes && (!this.profile.manifestations.temple_deep_runes || force)) {
      this.profile.manifestations.temple_deep_runes = true;
      if (this.templeRunesGroup) this.templeRunesGroup.visible = true;
      if (!force) newlyUnlocked.push('temple_deep_runes');
    }

    // 5. Celestial Aurora
    // Condition: Combined collection >= 5 items
    const canAwakenAurora = crystalsCount + shardsCount >= 5;
    if (canAwakenAurora && (!this.profile.manifestations.celestial_aurora || force)) {
      this.profile.manifestations.celestial_aurora = true;
      if (!force) newlyUnlocked.push('celestial_aurora');
    }

    // Calculate World Resonance Level & Archetype
    this.updateArchetype(crystalsCount, shardsCount, inscriptionsCount);

    return { newlyUnlocked };
  }

  private updateArchetype(crystalsCount: number, shardsCount: number, inscriptionsCount: number): void {
    // Score based on habits
    const totalCollected = crystalsCount + shardsCount;
    const sprintRatio = this.profile.sprintDistanceMeters / Math.max(1, this.profile.totalPlayTimeSec);
    const zonesCount = this.profile.zonesVisited.length;

    let level = 1;
    level += Math.min(4, Math.floor(totalCollected / 2));
    level += Math.min(3, Math.floor(zonesCount / 2));
    if (this.profile.manifestations.elder_tree_heart) level += 1;
    if (this.profile.manifestations.crystalline_bridge) level += 1;
    this.profile.worldResonanceLevel = Math.min(10, Math.max(1, level));

    if (this.profile.manifestations.elder_tree_heart && totalCollected >= 7) {
      this.profile.archetypeAr = 'سَيِّدُ أَصْدَاءِ الخُلُود';
      this.profile.archetypeEn = 'Lord of Eternal Echoes';
    } else if (inscriptionsCount >= 3) {
      this.profile.archetypeAr = 'حَكِيمُ الأَلْوَاحِ القَدِيمَة';
      this.profile.archetypeEn = 'Sage of Ancient Tablets';
    } else if (sprintRatio > 2.5) {
      this.profile.archetypeAr = 'رِيَاحُ الأَثِيرِ العَاتِيَة';
      this.profile.archetypeEn = 'The Tempest Wind';
    } else if (zonesCount >= 6) {
      this.profile.archetypeAr = 'مُسْتَكْشِفُ الآفَاقِ المَجْهُولَة';
      this.profile.archetypeEn = 'Pathfinder of Unknown Horizons';
    } else if (totalCollected >= 4) {
      this.profile.archetypeAr = 'مُنَسِّقُ البَلُّورَاتِ الأَثِيرِيَّة';
      this.profile.archetypeEn = 'Aetherial Harmonizer';
    } else {
      this.profile.archetypeAr = 'الرَّحَّالَةُ الصَّبُور';
      this.profile.archetypeEn = 'The Patient Wanderer';
    }
  }

  // =========================================================================
  // 4. ANIMATION UPDATE LOOP
  // =========================================================================
  public update(timeSec: number): void {
    // 1. Animate Elder Tree Heart pulsation (glowing blue eye)
    if (this.profile.manifestations.elder_tree_heart && this.elderTreeEyeMesh && this.elderTreeGlowLight) {
      const pulse = 1.0 + Math.sin(timeSec * 3.2) * 0.18;
      this.elderTreeEyeMesh.scale.set(pulse, pulse, 1.0);
      const eyeMat = this.elderTreeEyeMesh.material as THREE.MeshStandardMaterial;
      eyeMat.emissiveIntensity = 3.0 + Math.sin(timeSec * 3.2) * 1.5;
      this.elderTreeGlowLight.intensity = 4.0 + Math.sin(timeSec * 3.2) * 1.8;
    }

    // 2. Animate Crystalline Bridge stepping stones bobbing
    if (this.profile.manifestations.crystalline_bridge) {
      this.secretBridgeSteppingStones.forEach((stone, i) => {
        stone.position.y = Terrain.LAKE_WATER_Y + 0.15 + Math.sin(timeSec * 2.2 + i * 0.8) * 0.08;
      });
    }

    // 3. Animate Forest Spirit breathing & glow
    if (this.profile.manifestations.forest_spirit && this.forestSpiritGroup) {
      const sway = Math.sin(timeSec * 1.8) * 0.06;
      this.forestSpiritGroup.position.y =
        this.terrain.getHeightAt(this.forestSpiritGroup.position.x, this.forestSpiritGroup.position.z) + Math.abs(sway);
      if (this.spiritLight) {
        this.spiritLight.intensity = 2.0 + Math.sin(timeSec * 2.5) * 0.8;
      }
    }

    // 4. Animate Temple Deep Runes glow
    if (this.profile.manifestations.temple_deep_runes) {
      this.templeRuneMeshes.forEach((mesh, i) => {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = 2.0 + Math.sin(timeSec * 2.8 + i * 0.7) * 1.0;
      });
    }
  }

  // =========================================================================
  // 5. PERSISTENCE (حفظ واستعادة بيانات الذاكرة)
  // =========================================================================
  public serialize(): PlayerMemoryProfile {
    return JSON.parse(JSON.stringify(this.profile));
  }

  public deserialize(data: Partial<PlayerMemoryProfile> | null): void {
    if (!data) return;
    this.profile = {
      ...this.createDefaultProfile(),
      ...data,
      biomeTimeSec: {
        ...this.createDefaultProfile().biomeTimeSec,
        ...(data.biomeTimeSec || {}),
      },
      manifestations: {
        ...this.createDefaultProfile().manifestations,
        ...(data.manifestations || {}),
      },
    };

    // Re-apply 3D visual manifestations
    if (this.elderTreeHeartGroup) {
      this.elderTreeHeartGroup.visible = Boolean(this.profile.manifestations.elder_tree_heart);
    }
    if (this.secretBridgeGroup) {
      this.secretBridgeGroup.visible = Boolean(this.profile.manifestations.crystalline_bridge);
    }
    if (this.forestSpiritGroup) {
      this.forestSpiritGroup.visible = Boolean(this.profile.manifestations.forest_spirit);
    }
    if (this.templeRunesGroup) {
      this.templeRunesGroup.visible = Boolean(this.profile.manifestations.temple_deep_runes);
    }
  }

  public reset(): void {
    this.profile = this.createDefaultProfile();
    if (this.elderTreeHeartGroup) this.elderTreeHeartGroup.visible = false;
    if (this.secretBridgeGroup) this.secretBridgeGroup.visible = false;
    if (this.forestSpiritGroup) this.forestSpiritGroup.visible = false;
    if (this.templeRunesGroup) this.templeRunesGroup.visible = false;
  }

  public getCurrentBiome(): BiomeInfo {
    return BIOMES[this.currentBiome] || BIOMES.SHORELINE;
  }
}
