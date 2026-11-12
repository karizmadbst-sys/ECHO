/**
 * ECHO – THE WORLD REMEMBERS
 * Comprehensive Environmental Interaction System (نظام التفاعل مع البيئة)
 * Manages:
 * 1. Memory Shards (شظايا الذاكرة) - floating collectible astral gems with lore
 * 2. Ancient Inscriptions & Stelae (النقوش الحجرية القديمة) - readable monolithic tablets
 * 3. Interactive Temple Sanctuary Gate (البوابة الحجرية للمعبد) - animated unsealing door
 * 4. Portal Celestial Dais (منصة البوابة العظيمة)
 * 5. Dynamic collection visual particle bursts and expanding shockwave rings
 */

import * as THREE from 'three';
import { Terrain } from './Terrain.ts';
import { WorldObstacle } from './Forest.ts';

export type InteractionType = 'crystal' | 'shard' | 'inscription' | 'door' | 'portal';

export interface InteractiveTarget {
  id: number | string;
  type: InteractionType;
  titleAr: string;
  titleEn: string;
  actionAr: string;
  actionEn: string;
  pos: THREE.Vector3;
  dist: number;
  color?: number;
  data?: unknown;
}

export interface MemoryShard {
  id: number;
  nameAr: string;
  nameEn: string;
  quoteAr: string;
  quoteEn: string;
  locationAr: string;
  locationEn: string;
  pos: THREE.Vector3;
  color: number;
  collected: boolean;
}

export interface AncientInscription {
  id: number;
  titleAr: string;
  titleEn: string;
  glyph: string;
  locationAr: string;
  locationEn: string;
  contentAr: string;
  contentEn: string;
  pos: THREE.Vector3;
  rotationY: number;
  read: boolean;
}

interface ActiveVFXBurst {
  particles: THREE.Points;
  positions: Float32Array;
  velocities: Float32Array;
  ring: THREE.Mesh;
  light: THREE.PointLight;
  age: number;
  maxAge: number;
}

export class WorldInteractions {
  public group: THREE.Group;
  public obstacles: WorldObstacle[] = [];

  // 1. Memory Shards
  public shards: MemoryShard[] = [];
  private shardMeshes: THREE.Group[] = [];
  private shardLights: THREE.PointLight[] = [];

  // 2. Ancient Inscriptions
  public inscriptions: AncientInscription[] = [];
  private inscriptionMeshes: THREE.Group[] = [];

  // 3. Temple Sanctuary Gate
  public templeDoorGroup!: THREE.Group;
  private templeDoorSlab!: THREE.Mesh;
  private templeDoorRune!: THREE.Mesh;
  private doorObstacleIndex: number = -1;
  public isTempleDoorOpen: boolean = false;
  private doorCurrentY: number = 0;
  private doorTargetY: number = 0;

  // 4. VFX Emitters
  private activeBursts: ActiveVFXBurst[] = [];
  private burstParticleTexture: THREE.CanvasTexture;

  constructor(private terrain: Terrain) {
    this.group = new THREE.Group();
    this.burstParticleTexture = this.createParticleTexture();

    this.initMemoryShards();
    this.initAncientInscriptions();
    this.initTempleDoor();
  }

  // ==========================================
  // 1. MEMORY SHARDS (شظايا الذاكرة)
  // ==========================================
  private initMemoryShards(): void {
    const shardDefs: Omit<MemoryShard, 'pos' | 'collected'>[] = [
      {
        id: 0,
        nameAr: 'شظية الشاطئ الفيروزي',
        nameEn: 'Shoreline Turquoise Shard',
        quoteAr: '«في حبات الرمل تنام خطوات من وصلوا أولاً إلى هذه الجزيرة.»',
        quoteEn: '"Within grains of sand sleep the footsteps of the first voyagers."',
        locationAr: 'رصيف الرمل الجنوبي',
        locationEn: 'Southern Shoreline Pier',
        color: 0x00f5d4,
      },
      {
        id: 1,
        nameAr: 'شظية شمس الغابة',
        nameEn: 'Forest Sunlight Shard',
        quoteAr: '«خيوط الشمس المتسللة بين الصنوبر ليست سوى أوتار تعزف أنشودة الوجود.»',
        quoteEn: '"The sunbeams piercing the pines are strings playing creation\'s hymn."',
        locationAr: 'ممر الغابة المظلل',
        locationEn: 'Shaded Forest Path',
        color: 0xfee440,
      },
      {
        id: 2,
        nameAr: 'شظية همس الأمواج',
        nameEn: 'Wave Whisper Shard',
        quoteAr: '«حين ينكسر الموج على الصخور، يُردد صدى أسماء من طواهم النسيان.»',
        quoteEn: '"As waves shatter against stone, they whisper names lost to time."',
        locationAr: 'جرف الأمواج الغربي',
        locationEn: 'Western Wave Cliff',
        color: 0x00bbf9,
      },
      {
        id: 3,
        nameAr: 'شظية وهج البحيرة',
        nameEn: 'Bioluminescent Shard',
        quoteAr: '«الماء الأزرق لا يعكس السماء فقط، بل يحفظ أحلام النجوم الساقطة.»',
        quoteEn: '"The sapphire water reflects not only skies, but the dreams of fallen stars."',
        locationAr: 'ضفة البحيرة المضيئة',
        locationEn: 'Luminous Lake Bank',
        color: 0x48cae4,
      },
      {
        id: 4,
        nameAr: 'شظية أعمدة الحكمة',
        nameEn: 'Sanctuary Pillar Shard',
        quoteAr: '«كل حجر في هذا الصرح كان شاهداً على عهد قديم بين الأرض والنور.»',
        quoteEn: '"Every pillar in this hall witnessed an ancient covenant of earth and light."',
        locationAr: 'فناء المعبد الخارجي',
        locationEn: 'Temple Outer Peristyle',
        color: 0x9b5de5,
      },
      {
        id: 5,
        nameAr: 'شظية رياح القمة',
        nameEn: 'High Summit Shard',
        quoteAr: '«الريح في الأعالي لا تهدأ، لأنها تحمل رسائل العوالم البعيدة.»',
        quoteEn: '"The winds upon the peak never rest, carrying messages of distant worlds."',
        locationAr: 'نتوء الجبل الشمالي',
        locationEn: 'Northern Mountain Ridge',
        color: 0xf72585,
      },
      {
        id: 6,
        nameAr: 'شظية الشجرة الكبرى',
        nameEn: 'Elder Branch Shard',
        quoteAr: '«حلقات الشجرة ليست أرقاماً، بل سجل لأفراح وأحزان الفصول الغابرة.»',
        quoteEn: '"Tree rings are not mere years, but chronicles of departed seasons."',
        locationAr: 'جذور الشجرة المعمرة',
        locationEn: 'Elder Tree Roots',
        color: 0x52b788,
      },
      {
        id: 7,
        nameAr: 'شظية الكهف الصامت',
        nameEn: 'Silent Grotto Shard',
        quoteAr: '«في عمق الظلام يضيء الوعي كشعلة لا تنطفئ.»',
        quoteEn: '"In the deepest dark, awareness glows like an inextinguishable flame."',
        locationAr: 'مدخل الغار الصخري',
        locationEn: 'Rock Grotto Entrance',
        color: 0x7209b7,
      },
      {
        id: 8,
        nameAr: 'شظية عتبة الأفق',
        nameEn: 'Horizon Verge Shard',
        quoteAr: '«كل بداية هي نهاية لشيء آخر، والكون يعيد نسج نفسه إلى الأبد.»',
        quoteEn: '"Every threshold begins anew, as the cosmos reweaves its tapestry."',
        locationAr: 'مطل البوابة الشرقية',
        locationEn: 'Eastern Portal Overlook',
        color: 0x3a0ca3,
      },
      {
        id: 9,
        nameAr: 'شظية شعلة الأثير',
        nameEn: 'Aether Flame Shard',
        quoteAr: '«حين تجمع الشظايا كلها، تكتمل مرآة الروح وتستيقظ الجزيرة.»',
        quoteEn: '"When all shards unite, the spirit mirror clears and the island awakens."',
        locationAr: 'المدرج الدائري القديم',
        locationEn: 'Ancient Circular Dais',
        color: 0x4cc9f0,
      },
    ];

    // Strategic world coordinates distributed across the island
    const shardCoords: [number, number][] = [
      [-15, 82],   // Shoreline beach
      [-32, 45],   // Whispering woods
      [-78, 65],   // Western wave cliff
      [22, -10],   // Lake shore
      [-65, 32],   // Near temple steps
      [15, -78],   // Northern mountain ridge
      [48, 38],    // Elder tree glade
      [-95, -12],  // Cave entrance
      [82, -42],   // Portal cliff side
      [6, 12],     // Central circular dais
    ];

    shardDefs.forEach((def, index) => {
      const [sx, sz] = shardCoords[index];
      const sy = this.terrain.getHeightAt(sx, sz) + 1.35;
      const pos = new THREE.Vector3(sx, sy, sz);

      const shard: MemoryShard = {
        ...def,
        pos,
        collected: false,
      };
      this.shards.push(shard);

      // Create 3D floating shard geometry (faceted double-pyramid octahedron)
      const shardGroup = new THREE.Group();
      shardGroup.position.copy(pos);

      // Core octahedron crystal
      const coreGeo = new THREE.OctahedronGeometry(0.38, 0);
      const coreMat = new THREE.MeshStandardMaterial({
        color: shard.color,
        emissive: shard.color,
        emissiveIntensity: 1.6,
        roughness: 0.15,
        metalness: 0.85,
        transparent: true,
        opacity: 0.92,
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      coreMesh.scale.set(0.65, 1.4, 0.65);
      coreMesh.castShadow = true;
      shardGroup.add(coreMesh);

      // Orbiting micro-sparks ring
      const ringGeo = new THREE.TorusGeometry(0.65, 0.022, 8, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: shard.color,
        transparent: true,
        opacity: 0.85,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 3;
      shardGroup.add(ringMesh);

      // Soft point light
      const light = new THREE.PointLight(shard.color, 1.4, 8);
      light.position.set(0, 0, 0);
      shardGroup.add(light);
      this.shardLights.push(light);

      this.group.add(shardGroup);
      this.shardMeshes.push(shardGroup);
    });
  }

  // ==========================================
  // 2. ANCIENT INSCRIPTIONS (النقوش القديمة)
  // ==========================================
  private initAncientInscriptions(): void {
    const inscriptionDefs: Omit<AncientInscription, 'pos' | 'read' | 'rotationY'>[] = [
      {
        id: 0,
        titleAr: 'مسلة العبور الأولى',
        titleEn: 'Stele of the First Crossing',
        glyph: 'ᚱ · ᛟ',
        locationAr: 'شاطئ الوصول الجنوبي',
        locationEn: 'Southern Arrival Beach',
        contentAr: '«إلى كل تائه قذفته أمواج النسيان: هذه الجزيرة لا تموت، بل تنام. حرّك الصدى في بلوراتها وشظاياها، ليُفتح لك باب العودة إلى النور.»',
        contentEn: '"To every wanderer cast upon oblivion\'s shore: this island never dies; it only dreams. Awaken the echoes within its crystals and shards to unseal your path back to the light."',
      },
      {
        id: 1,
        titleAr: 'نقش تراتيل الماء الحي',
        titleEn: 'Inscription of the Living Waters',
        glyph: 'ᚦ · ᛗ',
        locationAr: 'ضفة البحيرة الزرقاء المضيئة',
        locationEn: 'Bioluminescent Lake Bank',
        contentAr: '«كان أسلافنا يستحمون في هذه المياه ليغسلوا تعب الدهور. نيرانها الفيروزية لا تحرق، بل تبث الحياة في الذاكرة الخافتة.»',
        contentEn: '"Our elders bathed in these waters to wash away the weight of eons. Its turquoise flame does not burn, but breathes life into fading memory."',
      },
      {
        id: 2,
        titleAr: 'لوح معبد الأسرار',
        titleEn: 'Tablet of the Sanctuary Veil',
        glyph: 'ᛋ · ᚷ',
        locationAr: 'أمام مدخل المعبد القديم',
        locationEn: 'Ancient Temple Forecourt',
        contentAr: '«الأبواب المغلقة هنا لا تطلب مفاتيح حديدية، بل نية طاهرة ولمسة من أثير الروح. اقترب واضغط على الختم لفتح الملاذ.»',
        contentEn: '"The sealed portals here yield to no iron keys, but to pure intent and the touch of aether. Approach and touch the seal to open the sanctuary."',
      },
      {
        id: 3,
        titleAr: 'نبوءة البوابة العظمى',
        titleEn: 'Prophecy of the Great Portal',
        glyph: 'ᚨ · ᛉ',
        locationAr: 'عتبة البوابة الحجرية الشرقية',
        locationEn: 'Great Stone Portal Threshold',
        contentAr: '«سبع بلورات مقدسة وُزعت في أرجاء الجزيرة. حين تضيء المقابس السبعة جميعها، سينفتح الأفق الكوني وتعود الأرواح إلى موطنها الأبدي.»',
        contentEn: '"Seven sacred crystals were scattered across these lands. When all seven rune sockets ignite, the cosmic rift will awaken and souls shall return home."',
      },
      {
        id: 4,
        titleAr: 'نقش شجرة الخلود',
        titleEn: 'Stele of the Colossal Tree',
        glyph: 'ᛖ · ᚹ',
        locationAr: 'فناء الشجرة العتيقة الكبرى',
        locationEn: 'Elder Tree Clearing',
        contentAr: '«تحت هذه الظلال، جلس حكماء الجزيرة يدوّنون أسرار الرياح وتاريخ النجوم. من يصمت هنا يسمع نبض العصور الغابرة.»',
        contentEn: '"Beneath these boughs, ancient sages recorded the secrets of wind and stars. Whosoever listens in silence will hear the heartbeat of the ages."',
      },
    ];

    const stelePositions: [number, number, number][] = [
      [-8, 76, 0.2],         // Near beach spawn
      [14, -22, -0.4],       // Shore of the glowing lake
      [-72, 28, 1.2],        // Forecourt of temple
      [86, -34, -2.1],       // In front of portal platform
      [42, 42, 0.8],         // Colossal tree glade
    ];

    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x5a5e68,
      roughness: 0.85,
      metalness: 0.15,
    });

    const runeMat = new THREE.MeshStandardMaterial({
      color: 0x00f5d4,
      emissive: 0x00d2b4,
      emissiveIntensity: 1.2,
      roughness: 0.2,
    });

    inscriptionDefs.forEach((def, index) => {
      const [ix, iz, rotY] = stelePositions[index];
      const iy = this.terrain.getHeightAt(ix, iz);
      const pos = new THREE.Vector3(ix, iy, iz);

      const inscription: AncientInscription = {
        ...def,
        pos,
        rotationY: rotY,
        read: false,
      };
      this.inscriptions.push(inscription);

      // Create 3D weathered monolithic stele
      const steleGroup = new THREE.Group();
      steleGroup.position.set(ix, iy, iz);
      steleGroup.rotation.y = rotY;

      // Base stepped pediment
      const baseGeo = new THREE.BoxGeometry(1.6, 0.45, 1.2);
      const baseMesh = new THREE.Mesh(baseGeo, stoneMat);
      baseMesh.position.y = 0.22;
      baseMesh.castShadow = true;
      steleGroup.add(baseMesh);

      // Monolithic upright stone tablet
      const tabletGeo = new THREE.BoxGeometry(1.1, 2.3, 0.45);
      const tabletMesh = new THREE.Mesh(tabletGeo, stoneMat);
      tabletMesh.position.y = 1.45;
      tabletMesh.castShadow = true;
      tabletMesh.receiveShadow = true;
      steleGroup.add(tabletMesh);

      // Carved glowing rune face
      const runeFaceGeo = new THREE.PlaneGeometry(0.75, 1.4);
      const runeFace = new THREE.Mesh(runeFaceGeo, runeMat);
      runeFace.position.set(0, 1.45, 0.235);
      steleGroup.add(runeFace);

      // Subtle rune glow light
      const runeLight = new THREE.PointLight(0x00f5d4, 1.2, 7);
      runeLight.position.set(0, 1.5, 0.6);
      steleGroup.add(runeLight);

      this.group.add(steleGroup);
      this.inscriptionMeshes.push(steleGroup);

      // Obstacle collision registration
      this.obstacles.push({
        x: ix,
        z: iz,
        radius: 1.2,
      });
    });
  }

  // ==========================================
  // 3. TEMPLE SANCTUARY GATE (بوابة المعبد)
  // ==========================================
  private initTempleDoor(): void {
    const center = Terrain.TEMPLE_POS;
    const baseY = this.terrain.getHeightAt(center.x, center.z);

    this.templeDoorGroup = new THREE.Group();
    // Position door at the eastern grand entrance of the temple
    const doorX = center.x + 14.8;
    const doorZ = center.z;
    const floorY = baseY + 1.8;
    this.templeDoorGroup.position.set(doorX, floorY, doorZ);
    this.templeDoorGroup.rotation.y = Math.PI / 2;

    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x4e525a,
      roughness: 0.85,
      metalness: 0.15,
    });

    const doorMat = new THREE.MeshStandardMaterial({
      color: 0x3d4148,
      roughness: 0.75,
      metalness: 0.25,
    });

    const sealMat = new THREE.MeshStandardMaterial({
      color: 0x00f5d4,
      emissive: 0x00b4d8,
      emissiveIntensity: 1.4,
      roughness: 0.2,
    });

    // Left and Right Arch Jambs
    const jambGeo = new THREE.BoxGeometry(1.1, 5.8, 1.2);
    const leftJamb = new THREE.Mesh(jambGeo, stoneMat);
    leftJamb.position.set(-2.4, 2.9, 0);
    leftJamb.castShadow = true;
    this.templeDoorGroup.add(leftJamb);

    const rightJamb = new THREE.Mesh(jambGeo, stoneMat);
    rightJamb.position.set(2.4, 2.9, 0);
    rightJamb.castShadow = true;
    this.templeDoorGroup.add(rightJamb);

    // Top Arch Lintel
    const lintelGeo = new THREE.BoxGeometry(6.2, 1.1, 1.4);
    const lintel = new THREE.Mesh(lintelGeo, stoneMat);
    lintel.position.set(0, 5.8 + 0.55, 0);
    lintel.castShadow = true;
    this.templeDoorGroup.add(lintel);

    // Heavy Sliding Stone Slab Door
    const slabGeo = new THREE.BoxGeometry(3.8, 5.5, 0.6);
    this.templeDoorSlab = new THREE.Mesh(slabGeo, doorMat);
    this.templeDoorSlab.position.set(0, 2.75, 0);
    this.templeDoorSlab.castShadow = true;
    this.templeDoorSlab.receiveShadow = true;
    this.templeDoorGroup.add(this.templeDoorSlab);

    // Glowing Ancient Rune Seal on Door Face
    const sealGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.08, 16);
    sealGeo.rotateX(Math.PI / 2);
    this.templeDoorRune = new THREE.Mesh(sealGeo, sealMat);
    this.templeDoorRune.position.set(0, 2.75, 0.32);
    this.templeDoorGroup.add(this.templeDoorRune);

    this.group.add(this.templeDoorGroup);

    // Collision obstacle when closed
    this.obstacles.push({
      x: doorX,
      z: doorZ,
      radius: 2.4,
    });
    this.doorObstacleIndex = this.obstacles.length - 1;
  }

  /**
   * Toggles the temple door between open and closed state
   */
  public toggleTempleDoor(): boolean {
    this.isTempleDoorOpen = !this.isTempleDoorOpen;
    this.doorTargetY = this.isTempleDoorOpen ? 5.2 : 0;

    // Update collision obstacle
    if (this.doorObstacleIndex >= 0 && this.doorObstacleIndex < this.obstacles.length) {
      if (this.isTempleDoorOpen) {
        // Shrink obstacle radius to 0 so player can walk freely through
        this.obstacles[this.doorObstacleIndex].radius = 0;
      } else {
        this.obstacles[this.doorObstacleIndex].radius = 2.4;
      }
    }

    // Change seal glow
    const sealMat = this.templeDoorRune.material as THREE.MeshStandardMaterial;
    if (this.isTempleDoorOpen) {
      sealMat.color.setHex(0x90e0ef);
      sealMat.emissive.setHex(0x00f5d4);
      sealMat.emissiveIntensity = 2.2;
    } else {
      sealMat.color.setHex(0x00f5d4);
      sealMat.emissive.setHex(0x0077b6);
      sealMat.emissiveIntensity = 1.0;
    }

    return this.isTempleDoorOpen;
  }

  // ==========================================
  // 4. COLLECTION & INTERACTION VFX
  // ==========================================
  private createParticleTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.35, 'rgba(0, 245, 212, 0.95)');
    grad.addColorStop(0.7, 'rgba(0, 180, 216, 0.4)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Triggers an explosive stardust particle burst and shockwave ring
   */
  public spawnCollectionBurst(pos: THREE.Vector3, colorHex: number = 0x00f5d4): void {
    const count = 48;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;

      // Spherical explosive burst direction with upward bias
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const speed = 2.2 + Math.random() * 4.5;

      velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
      velocities[i * 3 + 1] = Math.abs(Math.cos(phi)) * speed + 1.5;
      velocities[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * speed;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.45,
      map: this.burstParticleTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: colorHex,
    });

    const particles = new THREE.Points(geo, mat);
    this.group.add(particles);

    // Expanding shockwave ring
    const ringGeo = new THREE.RingGeometry(0.2, 0.5, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.copy(pos);
    ring.position.y += 0.1;
    this.group.add(ring);

    // Flash light
    const light = new THREE.PointLight(colorHex, 4.0, 14);
    light.position.copy(pos);
    this.group.add(light);

    this.activeBursts.push({
      particles,
      positions,
      velocities,
      ring,
      light,
      age: 0,
      maxAge: 1.25,
    });
  }

  // ==========================================
  // 5. PROXIMITY DETECTION & ACTIONS
  // ==========================================

  /**
   * Evaluates all interactive targets near player position and returns the closest one.
   */
  public findClosestInteraction(playerPos: THREE.Vector3): InteractiveTarget | null {
    let closest: InteractiveTarget | null = null;
    let minDist = 3.8; // Max interaction distance

    // 1. Memory Shards (threshold 3.5m)
    for (const shard of this.shards) {
      if (shard.collected) continue;
      const d = playerPos.distanceTo(shard.pos);
      if (d < minDist) {
        minDist = d;
        closest = {
          id: shard.id,
          type: 'shard',
          titleAr: shard.nameAr,
          titleEn: shard.nameEn,
          actionAr: 'اجمع شظية الذاكرة',
          actionEn: 'Collect Memory Shard',
          pos: shard.pos,
          dist: d,
          color: shard.color,
          data: shard,
        };
      }
    }

    // 2. Ancient Inscriptions (threshold 4.0m)
    for (const insc of this.inscriptions) {
      const d = playerPos.distanceTo(insc.pos);
      if (d < Math.min(minDist, 4.0)) {
        minDist = d;
        closest = {
          id: insc.id,
          type: 'inscription',
          titleAr: insc.titleAr,
          titleEn: insc.titleEn,
          actionAr: 'اقرأ النقوش القديمة',
          actionEn: 'Read Ancient Inscription',
          pos: insc.pos,
          dist: d,
          data: insc,
        };
      }
    }

    // 3. Temple Sanctuary Gate (threshold 4.8m)
    const doorPos = this.templeDoorGroup.position;
    const doorDist = playerPos.distanceTo(doorPos);
    if (doorDist < Math.min(minDist, 4.8)) {
      minDist = doorDist;
      closest = {
        id: 99,
        type: 'door',
        titleAr: 'بوابة المعبد الحجرية',
        titleEn: 'Temple Stone Gate',
        actionAr: this.isTempleDoorOpen ? 'أغلِق البوابة الحجرية' : 'افتح البوابة الحجرية',
        actionEn: this.isTempleDoorOpen ? 'Close Stone Gate' : 'Open Temple Gate',
        pos: doorPos,
        dist: doorDist,
      };
    }

    // 4. Great Portal Platform (threshold 6.0m)
    const portalPos = Terrain.PORTAL_POS;
    const portalDist = new THREE.Vector2(playerPos.x - portalPos.x, playerPos.z - portalPos.z).length();
    if (portalDist < Math.min(minDist, 6.0)) {
      minDist = portalDist;
      closest = {
        id: 100,
        type: 'portal',
        titleAr: 'البوابة الحجرية العظيمة',
        titleEn: 'The Great Stone Portal',
        actionAr: 'تواصل مع البوابة السماوية',
        actionEn: 'Commune with Celestial Portal',
        pos: new THREE.Vector3(portalPos.x, playerPos.y, portalPos.z),
        dist: portalDist,
      };
    }

    return closest;
  }

  /**
   * Collect a memory shard by ID (prevents re-collection)
   */
  public collectShard(id: number): MemoryShard | null {
    const shard = this.shards.find((s) => s.id === id);
    if (!shard || shard.collected) return null;

    shard.collected = true;
    const mesh = this.shardMeshes[id];
    if (mesh) {
      mesh.visible = false;
    }

    // Spawn spectacular VFX burst at shard position
    this.spawnCollectionBurst(shard.pos, shard.color);

    return shard;
  }

  public getCollectedShardsCount(): number {
    return this.shards.filter((s) => s.collected).length;
  }

  public resetAll(): void {
    this.shards.forEach((s, idx) => {
      s.collected = false;
      const m = this.shardMeshes[idx];
      if (m) m.visible = true;
    });

    this.inscriptions.forEach((insc) => {
      insc.read = false;
    });

    if (this.isTempleDoorOpen) {
      this.toggleTempleDoor();
    }
  }

  public restoreSavedState(collectedShardIds: number[], readInscriptionIds: number[], doorOpen: boolean): void {
    const shardSet = new Set(collectedShardIds);
    this.shards.forEach((s, idx) => {
      s.collected = shardSet.has(s.id);
      const m = this.shardMeshes[idx];
      if (m) m.visible = !s.collected;
    });

    const inscSet = new Set(readInscriptionIds);
    this.inscriptions.forEach((insc) => {
      insc.read = inscSet.has(insc.id);
    });

    if (doorOpen !== this.isTempleDoorOpen) {
      this.toggleTempleDoor();
    }
  }

  // ==========================================
  // 6. ANIMATION & UPDATE LOOP
  // ==========================================
  public update(dt: number, timeSec: number): void {
    // 1. Shards floating & spinning
    this.shardMeshes.forEach((mesh, i) => {
      if (this.shards[i].collected) return;

      const bob = Math.sin(timeSec * 2.8 + i * 1.3) * 0.18;
      mesh.position.y = this.shards[i].pos.y + bob;

      // Octahedron core spin
      mesh.children[0].rotation.y += 0.024;
      mesh.children[0].rotation.z = Math.sin(timeSec * 1.5 + i) * 0.15;

      // Sparks ring counter-rotation
      mesh.children[1].rotation.z += 0.038;
      mesh.children[1].rotation.x = Math.cos(timeSec * 2.0 + i) * 0.3;

      // Light pulse
      this.shardLights[i].intensity = 1.2 + Math.sin(timeSec * 4.0 + i) * 0.45;
    });

    // 2. Inscription rune pulsing
    this.inscriptionMeshes.forEach((mesh, i) => {
      const runeFace = mesh.children[2] as THREE.Mesh;
      if (runeFace) {
        const mat = runeFace.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = 1.0 + Math.sin(timeSec * 2.2 + i * 1.7) * 0.4;
      }
    });

    // 3. Temple door smooth animation
    if (Math.abs(this.doorCurrentY - this.doorTargetY) > 0.01) {
      this.doorCurrentY += (this.doorTargetY - this.doorCurrentY) * Math.min(dt * 3.5, 1.0);
      this.templeDoorSlab.position.y = 2.75 + this.doorCurrentY;
      this.templeDoorRune.position.y = 2.75 + this.doorCurrentY;
    }

    // 4. Update active VFX bursts
    for (let b = this.activeBursts.length - 1; b >= 0; b--) {
      const burst = this.activeBursts[b];
      burst.age += dt;
      const progress = burst.age / burst.maxAge;

      if (progress >= 1.0) {
        // Clean up
        burst.particles.removeFromParent();
        burst.particles.geometry.dispose();
        (burst.particles.material as THREE.Material).dispose();
        burst.ring.removeFromParent();
        burst.ring.geometry.dispose();
        (burst.ring.material as THREE.Material).dispose();
        burst.light.removeFromParent();

        this.activeBursts.splice(b, 1);
        continue;
      }

      // Move burst particles
      const posAttr = burst.particles.geometry.attributes.position;
      const count = posAttr.count;
      for (let i = 0; i < count; i++) {
        burst.positions[i * 3] += burst.velocities[i * 3] * dt;
        burst.positions[i * 3 + 1] += burst.velocities[i * 3 + 1] * dt;
        burst.positions[i * 3 + 2] += burst.velocities[i * 3 + 2] * dt;
        // Gravity deceleration
        burst.velocities[i * 3 + 1] -= 2.2 * dt;
      }
      posAttr.needsUpdate = true;

      // Expand & fade shockwave ring
      const ringScale = 1.0 + progress * 7.5;
      burst.ring.scale.set(ringScale, ringScale, ringScale);
      (burst.ring.material as THREE.MeshBasicMaterial).opacity = (1.0 - progress) * 0.9;

      // Fade particle material
      (burst.particles.material as THREE.PointsMaterial).opacity = 1.0 - progress;

      // Fade light
      burst.light.intensity = 4.0 * (1.0 - progress);
    }
  }

  public dispose(): void {
    this.burstParticleTexture.dispose();
    this.activeBursts.forEach((b) => {
      b.particles.removeFromParent();
      b.ring.removeFromParent();
      b.light.removeFromParent();
    });
    this.activeBursts = [];
  }
}
