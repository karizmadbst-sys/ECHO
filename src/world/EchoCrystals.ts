/**
 * ECHO – THE WORLD REMEMBERS
 * The 7 Echo Crystals (بلورات صدى الذاكرة)
 * Floating multi-faceted magical gems, orbital rings, interaction prompts, and ancient lore memories.
 */

import * as THREE from 'three';
import { Terrain } from './Terrain.ts';

export interface CrystalData {
  id: number;
  nameAr: string;
  nameEn: string;
  locationAr: string;
  locationEn: string;
  memoryAr: string;
  memoryEn: string;
  pos: THREE.Vector3;
  color: number;
  collected: boolean;
}

export class EchoCrystals {
  public group: THREE.Group;
  public crystals: CrystalData[] = [];
  private crystalMeshes: THREE.Group[] = [];
  private ringMeshes: THREE.Mesh[] = [];
  private crystalLights: THREE.PointLight[] = [];

  constructor(terrain: Terrain) {
    this.group = new THREE.Group();

    // The 7 Sacred Lore Echoes of the Forgotten Island
    const definitions: Omit<CrystalData, 'pos' | 'collected'>[] = [
      {
        id: 0,
        nameAr: 'بلورة الفجر',
        nameEn: 'Crystal of Dawn',
        locationAr: 'غابة الصنوبر الهامسة',
        locationEn: 'Whispering Pine Forest',
        memoryAr: '«كان الضوء أول لغة نطقت بها هذه الأرض، قبل أن تحجب سحب النسيان وهج الحقيقة القديمة.»',
        memoryEn: '"Light was the first tongue spoken across these lands, before the mist of oblivion veiled the ancient truth."',
        color: 0x00f5d4,
      },
      {
        id: 1,
        nameAr: 'بلورة الأعماق',
        nameEn: 'Crystal of the Depths',
        locationAr: 'قلب البحيرة المضيئة',
        locationEn: 'Heart of the Bioluminescent Lake',
        memoryAr: '«في قاع المياه الفيروزية، لا تزال أصداء تراتيل الغارقين في التأمل تنبض كقلب حي.»',
        memoryEn: '"Deep within the turquoise waters, the hymns of ancient dreamers still pulse like a living heartbeat."',
        color: 0x00bbf9,
      },
      {
        id: 2,
        nameAr: 'بلورة الملاذ',
        nameEn: 'Crystal of Sanctuary',
        locationAr: 'مذبح المعبد العتيق',
        locationEn: 'Altar of the Ancient Temple',
        memoryAr: '«لم تكن هذه الأعمدة مجرد حجارة صامتة، بل أوتاداً ربطت سماء الحكمة بأرض الفناء.»',
        memoryEn: '"These stone pillars were never merely rocks; they were anchors weaving celestial wisdom into the mortal soil."',
        color: 0x9b5de5,
      },
      {
        id: 3,
        nameAr: 'بلورة الرياح',
        nameEn: 'Crystal of Winds',
        locationAr: 'قمة الجبل الشاهق',
        locationEn: 'Summit of the High Peak',
        memoryAr: '«من يقف على ذرى الجبال يسمع أنين الزمن، ويدرك أن العوالم تولد وتموت في رفة عين.»',
        memoryEn: '"Whoever stands upon the jagged heights hears the yearning of time, knowing worlds are born and fade in a single breath."',
        color: 0xf15bb5,
      },
      {
        id: 4,
        nameAr: 'بلورة الهامسين',
        nameEn: 'Crystal of Whispers',
        locationAr: 'كهف الشاطئ المنعزل',
        locationEn: 'Secluded Shoreline Grotto',
        memoryAr: '«حين يصمت العالم، تبدأ الحصى بسرد حكايات أولئك الذين عبروا البحر ولم يعودوا قط.»',
        memoryEn: '"When silence descends, the ocean pebbles recount the tales of those who sailed beyond the horizon and never returned."',
        color: 0xfee440,
      },
      {
        id: 5,
        nameAr: 'بلورة الجذور',
        nameEn: 'Crystal of Roots',
        locationAr: 'تحت الشجرة العتيقة الكبرى',
        locationEn: 'Under the Colossal Elder Tree',
        memoryAr: '«جذورنا تشرب من ذكريات الأمس، لتزهر أوراقنا بأمل الغد المجهول.»',
        memoryEn: '"Our roots drink from yesterday\'s remembered dreams, that our canopy may bloom with tomorrow\'s unseen hope."',
        color: 0x52b788,
      },
      {
        id: 6,
        nameAr: 'بلورة العتبة',
        nameEn: 'Crystal of the Threshold',
        locationAr: 'عتبة البوابة الحجرية العظيمة',
        locationEn: 'Threshold of the Great Portal',
        memoryAr: '«اكتملت الأصداء السبعة. العالم تذكر ماضيه، والبوابة العتيقة تفتح ذراعيها للمستيقظين.»',
        memoryEn: '"The seven echoes are reunited. The world remembers, and the Great Gateway opens its heart to the awakened."',
        color: 0xff70a6,
      },
    ];

    // Landmark positions
    const rawPositions = [
      new THREE.Vector2(-42, 45),   // Forest
      new THREE.Vector2(0, -15),     // Lake
      new THREE.Vector2(-85, 25),    // Temple
      new THREE.Vector2(16, -98),    // Summit
      new THREE.Vector2(55, 65),     // Shore Grotto
      new THREE.Vector2(-45, -65),   // Elder Tree
      new THREE.Vector2(88, -28),    // Portal
    ];

    definitions.forEach((def, index) => {
      const xz = rawPositions[index];
      let y = terrain.getHeightAt(xz.x, xz.y);
      // Lake crystal floats slightly above water
      if (index === 1) y = Terrain.LAKE_WATER_Y + 1.2;
      else y += 1.8;

      const pos = new THREE.Vector3(xz.x, y, xz.y);

      const crystalData: CrystalData = {
        ...def,
        pos,
        collected: false,
      };

      this.crystals.push(crystalData);
      this.createCrystalMesh(crystalData);
    });
  }

  private createCrystalMesh(data: CrystalData): void {
    const group = new THREE.Group();
    group.position.copy(data.pos);

    // 1. Faceted Gemstone (Octahedron / Icosahedron)
    const gemGeo = new THREE.OctahedronGeometry(0.75, 0);
    const gemMat = new THREE.MeshStandardMaterial({
      color: data.color,
      emissive: data.color,
      emissiveIntensity: 0.95,
      roughness: 0.15,
      metalness: 0.85,
      transparent: true,
      opacity: 0.92,
    });

    const gem = new THREE.Mesh(gemGeo, gemMat);
    gem.castShadow = true;
    group.add(gem);

    // 2. Orbital Rune Ring
    const ringGeo = new THREE.TorusGeometry(1.25, 0.04, 8, 24);
    const ringMat = new THREE.MeshStandardMaterial({
      color: data.color,
      emissive: data.color,
      emissiveIntensity: 0.6,
      roughness: 0.3,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 3;
    group.add(ring);
    this.ringMeshes.push(ring);

    // 3. Ambient Glow Light
    const light = new THREE.PointLight(data.color, 2.2, 12);
    light.position.y = 0.2;
    group.add(light);
    this.crystalLights.push(light);

    // 4. Ground stone pedestal
    const pedGeo = new THREE.CylinderGeometry(0.5, 0.7, 0.4, 6);
    const pedMat = new THREE.MeshStandardMaterial({ color: 0x3d3f44, roughness: 0.9 });
    const ped = new THREE.Mesh(pedGeo, pedMat);
    ped.position.y = -1.5;
    group.add(ped);

    this.group.add(group);
    this.crystalMeshes.push(group);
  }

  /**
   * Check if player is near any uncollected crystal
   */
  public checkNearbyCrystal(playerPos: THREE.Vector3, threshold: number = 3.6): CrystalData | null {
    for (const c of this.crystals) {
      if (c.collected) continue;
      const dist = playerPos.distanceTo(c.pos);
      if (dist <= threshold) {
        return c;
      }
    }
    return null;
  }

  /**
   * Collect a crystal by ID
   */
  public collectCrystal(id: number): CrystalData | null {
    const c = this.crystals.find((item) => item.id === id);
    if (!c || c.collected) return null;

    c.collected = true;
    const meshGroup = this.crystalMeshes[id];
    if (meshGroup) {
      // Fade/shrink animation or hide
      meshGroup.visible = false;
    }

    return c;
  }

  public resetAll(): void {
    this.crystals.forEach((c, idx) => {
      c.collected = false;
      const mesh = this.crystalMeshes[idx];
      if (mesh) mesh.visible = true;
    });
  }

  public setCollectedState(collectedIds: number[]): void {
    const idSet = new Set(collectedIds);
    this.crystals.forEach((c, idx) => {
      c.collected = idSet.has(c.id);
      const mesh = this.crystalMeshes[idx];
      if (mesh) mesh.visible = !c.collected;
    });
  }

  public getCollectedCount(): number {
    return this.crystals.filter((c) => c.collected).length;
  }

  public update(time: number): void {
    this.crystalMeshes.forEach((mesh, i) => {
      if (this.crystals[i].collected) return;

      // Bobbing floating motion
      const bob = Math.sin(time * 2.2 + i * 1.1) * 0.22;
      mesh.position.y = this.crystals[i].pos.y + bob;

      // Spin crystal and counter-spin ring
      mesh.children[0].rotation.y += 0.018;
      mesh.children[0].rotation.x = Math.sin(time + i) * 0.15;

      const ring = this.ringMeshes[i];
      if (ring) {
        ring.rotation.z += 0.024;
        ring.rotation.y = Math.cos(time * 1.5 + i) * 0.25;
      }

      // Light pulsation
      this.crystalLights[i].intensity = 1.8 + Math.sin(time * 3.0 + i) * 0.6;
    });
  }
}
