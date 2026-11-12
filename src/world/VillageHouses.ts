/**
 * ECHO – THE WORLD REMEMBERS
 * Procedural Village Houses, Cottages & Street Network
 * Realistic rustic dwellings of varying sizes and styles, detailed interiors,
 * walkable open doorways, glowing windows, stone hearths with smoke particles,
 * and cobblestone pathways with carved streetlamps.
 */

import * as THREE from 'three';
import { Terrain } from './Terrain.ts';
import { WorldObstacle } from './Forest.ts';

export type HouseStyle = 'small' | 'medium' | 'large' | 'lakeside' | 'highland';

export interface HouseConfig {
  id: string;
  nameAr: string;
  nameEn: string;
  style: HouseStyle;
  x: number;
  z: number;
  rotationY: number;
  width: number;
  depth: number;
  wallHeight: number;
  roofHeight: number;
  roofColor: number;
  wallColor: number;
  hasPorch?: boolean;
  hasChimney?: boolean;
  chimneySide?: 'left' | 'right' | 'back';
  hasLoreBook?: boolean;
  loreTitleAr?: string;
  loreTitleEn?: string;
  loreTextAr?: string;
}

export interface VillageInteractiveTarget {
  id: string;
  type: 'hearth' | 'well' | 'village_lore';
  titleAr: string;
  titleEn: string;
  actionAr: string;
  actionEn: string;
  pos: THREE.Vector3;
  dist: number;
  color: number;
  data: any;
}

interface BuiltHouseData {
  config: HouseConfig;
  group: THREE.Group;
  baseY: number;
  floorY: number;
  doorWorldPos: THREE.Vector3;
  hearthWorldPos: THREE.Vector3;
  cosR: number;
  sinR: number;
  smokeParticles: THREE.Points | null;
  smokePositions?: Float32Array;
  smokeVelocities?: Float32Array;
  smokeLifetimes?: Float32Array;
}

export class VillageHouses {
  public group: THREE.Group;
  public obstacles: WorldObstacle[] = [];
  public builtHouses: BuiltHouseData[] = [];
  private hearthLights: THREE.PointLight[] = [];
  private streetLights: THREE.PointLight[] = [];
  private wellPosition: THREE.Vector3 = new THREE.Vector3(50, 0, 42);

  // Shared optimized materials
  private stoneWallMat: THREE.MeshStandardMaterial;
  private timberPlankMat: THREE.MeshStandardMaterial;
  private timberBeamMat: THREE.MeshStandardMaterial;
  private floorMat: THREE.MeshStandardMaterial;
  private glassWindowMat: THREE.MeshStandardMaterial;
  private ironMat: THREE.MeshStandardMaterial;
  private hearthFireMat: THREE.MeshStandardMaterial;
  private cobblestoneMat: THREE.MeshStandardMaterial;

  constructor(private terrain: Terrain) {
    this.group = new THREE.Group();

    // 1. Initialize shared materials for high performance and low draw overhead
    this.stoneWallMat = new THREE.MeshStandardMaterial({
      color: 0x82848c,
      roughness: 0.9,
      metalness: 0.08,
      flatShading: true,
    });

    this.timberPlankMat = new THREE.MeshStandardMaterial({
      color: 0x5a3e28,
      roughness: 0.85,
      metalness: 0.04,
    });

    this.timberBeamMat = new THREE.MeshStandardMaterial({
      color: 0x3a2717,
      roughness: 0.92,
      metalness: 0.02,
    });

    this.floorMat = new THREE.MeshStandardMaterial({
      color: 0x483221,
      roughness: 0.78,
      metalness: 0.05,
    });

    this.glassWindowMat = new THREE.MeshStandardMaterial({
      color: 0xffcc66,
      emissive: 0xff9922,
      emissiveIntensity: 0.72,
      roughness: 0.25,
      metalness: 0.1,
      transparent: true,
      opacity: 0.88,
    });

    this.ironMat = new THREE.MeshStandardMaterial({
      color: 0x222226,
      roughness: 0.6,
      metalness: 0.75,
    });

    this.hearthFireMat = new THREE.MeshStandardMaterial({
      color: 0xff5511,
      emissive: 0xff4400,
      emissiveIntensity: 1.2,
      roughness: 0.3,
    });

    this.cobblestoneMat = new THREE.MeshStandardMaterial({
      color: 0x6e7078,
      roughness: 0.92,
      metalness: 0.05,
      flatShading: true,
    });

    // 2. Generate and construct all village and countryside houses
    const houseConfigs = this.getHouseConfigurations();
    for (const conf of houseConfigs) {
      this.buildHouse(conf);
    }

    // 3. Build village square, central stone well, streetlamps, and connecting cobblestone pathways
    this.buildVillagePlazaAndStreets();

    // 4. Hook up terrain floor height provider so player walks smoothly inside all houses
    this.terrain.floorHeightProvider = (x, z) => this.getFloorHeightAt(x, z);
  }

  /**
   * Predefined configurations for the village settlement and scattered wilderness cottages.
   * Carefully spaced with generous streets (7m - 14m) and zero collision overlaps with any island landmarks.
   */
  private getHouseConfigurations(): HouseConfig[] {
    return [
      // -------------------------------------------------------------
      // WHISPERING MEADOW VILLAGE (قرية مرج الأثير)
      // Clustered gracefully in the south-eastern valley meadow
      // -------------------------------------------------------------
      {
        id: 'house_elder_hall',
        nameAr: 'قاعة حكماء القرية القديمة',
        nameEn: 'Village Elder Hall & Archive',
        style: 'large',
        x: 52,
        z: 32,
        rotationY: -0.25,
        width: 9.6,
        depth: 7.6,
        wallHeight: 3.8,
        roofHeight: 3.2,
        roofColor: 0x3a4856, // Deep slate blue
        wallColor: 0x8a8a92, // Ashlar dressed stone
        hasPorch: true,
        hasChimney: true,
        chimneySide: 'left',
        hasLoreBook: true,
        loreTitleAr: 'سجل حكماء القرية المنسية',
        loreTitleEn: 'Annals of the Whispering Sages',
        loreTextAr: '«في قديم الزمان، كان أبناء هذه الجزيرة يصغون لنبض البلورات السبع، فتبوح لهم الأرض بأسرارها وتشفي قلوبهم بمواقد السلام...»',
      },
      {
        id: 'house_alchemist',
        nameAr: 'مختبر الخيميائي العشبي',
        nameEn: 'Herbalist & Alchemist Haven',
        style: 'medium',
        x: 35,
        z: 28,
        rotationY: 0.65,
        width: 7.2,
        depth: 5.6,
        wallHeight: 3.2,
        roofHeight: 2.5,
        roofColor: 0x4a6b4a, // Mossy spruce green
        wallColor: 0xd8cca8, // Warm stucco with timbers
        hasPorch: true,
        hasChimney: true,
        chimneySide: 'back',
        hasLoreBook: true,
        loreTitleAr: 'ملاحظات الخيميائي عن زهور الأثير',
        loreTitleEn: 'Alchemist Field Notes on Aether Bloom',
        loreTextAr: '«تتوهج الفطريات بالقرب من الصخور القديمة كلما هبت نسمات المساء، وقطرة واحدة من رحيقها تعيد الصفاء للروح المتعبة.»',
      },
      {
        id: 'house_artisan',
        nameAr: 'محترف الحرفي والنحات',
        nameEn: 'Artisan Stone & Timber Workshop',
        style: 'medium',
        x: 69,
        z: 26,
        rotationY: -0.85,
        width: 6.8,
        depth: 5.4,
        wallHeight: 3.1,
        roofHeight: 2.4,
        roofColor: 0x6e3b2e, // Terracotta red clay
        wallColor: 0x7c7e84, // Chiseled mountain stone
        hasPorch: false,
        hasChimney: true,
        chimneySide: 'right',
      },
      {
        id: 'house_meadow_cabin',
        nameAr: 'كوخ المرج الهادئ',
        nameEn: 'Peaceful Meadow Cottage',
        style: 'small',
        x: 36,
        z: 48,
        rotationY: 0.35,
        width: 5.0,
        depth: 4.4,
        wallHeight: 2.8,
        roofHeight: 2.0,
        roofColor: 0x544030, // Cedar timber shingles
        wallColor: 0xd4c6a8, // Sand stucco & timber
        hasPorch: true,
        hasChimney: true,
        chimneySide: 'left',
      },
      {
        id: 'house_wayfarer_inn',
        nameAr: 'نُزل عابري السبيل الدافئ',
        nameEn: 'Wayfarer Rest & Hearth',
        style: 'medium',
        x: 65,
        z: 46,
        rotationY: -0.4,
        width: 7.0,
        depth: 5.8,
        wallHeight: 3.2,
        roofHeight: 2.5,
        roofColor: 0x3d4b58, // Slate tile
        wallColor: 0xdac9b0, // Cream plaster & oak
        hasPorch: true,
        hasChimney: true,
        chimneySide: 'back',
      },
      {
        id: 'house_weaver_cabin',
        nameAr: 'كوخ النسّاج القديم',
        nameEn: 'Weaver Cottage',
        style: 'small',
        x: 52,
        z: 60,
        rotationY: 3.05,
        width: 4.8,
        depth: 4.2,
        wallHeight: 2.7,
        roofHeight: 1.9,
        roofColor: 0x5c4230, // Hand-hewn timber
        wallColor: 0x808288, // Fieldstone
        hasPorch: false,
        hasChimney: true,
        chimneySide: 'right',
      },

      // -------------------------------------------------------------
      // SCATTERED WILDERNESS COTTAGES (منازل متفرقة في ربوع الجزيرة)
      // Isolated retreats nestled naturally in picturesque landscapes
      // -------------------------------------------------------------
      {
        id: 'house_lakeside_fisher',
        nameAr: 'كوخ صياد بحيرة الضياء',
        nameEn: 'Bioluminescent Lake Fisher Cabin',
        style: 'lakeside',
        x: -20,
        z: -56,
        rotationY: 0.15,
        width: 5.6,
        depth: 4.8,
        wallHeight: 2.8,
        roofHeight: 2.1,
        roofColor: 0x2e504c, // Marine moss teal
        wallColor: 0x483626, // Weathered cedar stilts & logs
        hasPorch: true,
        hasChimney: true,
        chimneySide: 'left',
      },
      {
        id: 'house_forest_hermit',
        nameAr: 'صومعة ناسك الغابة الخضراء',
        nameEn: 'Verdant Forest Hermitage',
        style: 'small',
        x: -72,
        z: -32,
        rotationY: 1.2,
        width: 5.0,
        depth: 4.6,
        wallHeight: 2.8,
        roofHeight: 2.0,
        roofColor: 0x385438, // Living moss thatch
        wallColor: 0x5a6058, // Ancient mossy stone
        hasPorch: true,
        hasChimney: true,
        chimneySide: 'back',
      },
      {
        id: 'house_highland_stargazer',
        nameAr: 'صومعة الراصد الجبلي العتيق',
        nameEn: 'Highland Stargazer Lodge',
        style: 'highland',
        x: 62,
        z: -68,
        rotationY: -0.6,
        width: 6.2,
        depth: 5.2,
        wallHeight: 3.1,
        roofHeight: 2.4,
        roofColor: 0x36404d, // Mountain slate
        wallColor: 0x767880, // Heavy granite blocks
        hasPorch: false,
        hasChimney: true,
        chimneySide: 'right',
      },
      {
        id: 'house_valley_retreat',
        nameAr: 'كوخ الوادي الهادئ المستكن',
        nameEn: 'Secluded Valley Retreat',
        style: 'small',
        x: -32,
        z: 60,
        rotationY: -1.8,
        width: 4.8,
        depth: 4.4,
        wallHeight: 2.7,
        roofHeight: 1.9,
        roofColor: 0x584232, // Dark timber
        wallColor: 0xd8caa6, // Pale clay plaster
        hasPorch: true,
        hasChimney: true,
        chimneySide: 'left',
      },
    ];
  }

  /**
   * Constructs an individual building with architectural precision,
   * walkable open doorway, timber frame, furnished interior, glowing windows,
   * stone hearth, and collision barriers.
   */
  private buildHouse(conf: HouseConfig): void {
    const houseGroup = new THREE.Group();
    const baseY = this.terrain.getHeightAt(conf.x, conf.z);
    houseGroup.position.set(conf.x, baseY, conf.z);
    houseGroup.rotation.y = conf.rotationY;

    const cosR = Math.cos(conf.rotationY);
    const sinR = Math.sin(conf.rotationY);

    const floorOffset = 0.22;
    const floorY = baseY + floorOffset;

    const halfW = conf.width / 2;
    const halfD = conf.depth / 2;

    // Doorway dimensions: comfortably wide and tall for player & camera
    const doorW = conf.style === 'large' ? 2.2 : conf.style === 'medium' ? 1.7 : 1.45;
    const doorH = conf.style === 'large' ? 2.8 : conf.style === 'medium' ? 2.4 : 2.25;

    // Specific roof and wall materials with custom colors
    const roofMat = new THREE.MeshStandardMaterial({
      color: conf.roofColor,
      roughness: 0.86,
      metalness: 0.06,
      flatShading: true,
    });

    const wallMat = new THREE.MeshStandardMaterial({
      color: conf.wallColor,
      roughness: 0.9,
      metalness: 0.05,
    });

    // 1. Solid Stone Foundation Plinth (extends into ground to absorb uneven terrain)
    const plinthDepth = 1.1;
    const plinthGeo = new THREE.BoxGeometry(conf.width + 0.35, plinthDepth, conf.depth + 0.35);
    const plinthMesh = new THREE.Mesh(plinthGeo, this.stoneWallMat);
    plinthMesh.position.y = floorOffset - plinthDepth / 2;
    plinthMesh.receiveShadow = true;
    houseGroup.add(plinthMesh);

    // 2. Interior Wooden Plank Floor
    const floorGeo = new THREE.BoxGeometry(conf.width - 0.1, 0.08, conf.depth - 0.1);
    const floorMesh = new THREE.Mesh(floorGeo, this.floorMat);
    floorMesh.position.y = floorOffset;
    floorMesh.receiveShadow = true;
    houseGroup.add(floorMesh);

    // 3. Walls with Walkable Open Doorway
    const wallThick = 0.28;

    // (a) Back Wall (Solid)
    const backGeo = new THREE.BoxGeometry(conf.width, conf.wallHeight, wallThick);
    const backWall = new THREE.Mesh(backGeo, wallMat);
    backWall.position.set(0, floorOffset + conf.wallHeight / 2, -halfD + wallThick / 2);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    houseGroup.add(backWall);

    // (b) Front Wall with Open Doorway
    // Left front wing
    const leftWingW = halfW - doorW / 2;
    const leftFrontGeo = new THREE.BoxGeometry(leftWingW, conf.wallHeight, wallThick);
    const leftFrontWall = new THREE.Mesh(leftFrontGeo, wallMat);
    leftFrontWall.position.set(-halfW + leftWingW / 2, floorOffset + conf.wallHeight / 2, halfD - wallThick / 2);
    leftFrontWall.castShadow = true;
    leftFrontWall.receiveShadow = true;
    houseGroup.add(leftFrontWall);

    // Right front wing
    const rightWingW = halfW - doorW / 2;
    const rightFrontGeo = new THREE.BoxGeometry(rightWingW, conf.wallHeight, wallThick);
    const rightFrontWall = new THREE.Mesh(rightFrontGeo, wallMat);
    rightFrontWall.position.set(halfW - rightWingW / 2, floorOffset + conf.wallHeight / 2, halfD - wallThick / 2);
    rightFrontWall.castShadow = true;
    rightFrontWall.receiveShadow = true;
    houseGroup.add(rightFrontWall);

    // Doorway Lintel (overhead arch piece above the open door)
    const lintelH = conf.wallHeight - doorH;
    if (lintelH > 0.05) {
      const lintelGeo = new THREE.BoxGeometry(doorW + 0.1, lintelH, wallThick + 0.04);
      const lintelMesh = new THREE.Mesh(lintelGeo, this.timberBeamMat);
      lintelMesh.position.set(0, floorOffset + doorH + lintelH / 2, halfD - wallThick / 2);
      lintelMesh.castShadow = true;
      houseGroup.add(lintelMesh);
    }

    // Doorway Timber Frame Posts
    const postGeo = new THREE.BoxGeometry(0.18, doorH, 0.32);
    const leftDoorPost = new THREE.Mesh(postGeo, this.timberBeamMat);
    leftDoorPost.position.set(-doorW / 2, floorOffset + doorH / 2, halfD - wallThick / 2);
    const rightDoorPost = new THREE.Mesh(postGeo, this.timberBeamMat);
    rightDoorPost.position.set(doorW / 2, floorOffset + doorH / 2, halfD - wallThick / 2);
    houseGroup.add(leftDoorPost, rightDoorPost);

    // (c) Left & Right Walls with Modeled Glowing Windows
    this.buildSideWallWithWindows(houseGroup, -halfW + wallThick / 2, conf, wallMat, floorOffset);
    this.buildSideWallWithWindows(houseGroup, halfW - wallThick / 2, conf, wallMat, floorOffset);

    // 4. Timber Corner Posts (Rustic fantasy architecture accent)
    const cornerGeo = new THREE.BoxGeometry(0.32, conf.wallHeight + 0.1, 0.32);
    const corners = [
      [-halfW + 0.16, -halfD + 0.16],
      [halfW - 0.16, -halfD + 0.16],
      [-halfW + 0.16, halfD - 0.16],
      [halfW - 0.16, halfD - 0.16],
    ];
    for (const [cx, cz] of corners) {
      const post = new THREE.Mesh(cornerGeo, this.timberBeamMat);
      post.position.set(cx, floorOffset + conf.wallHeight / 2, cz);
      post.castShadow = true;
      houseGroup.add(post);
    }

    // 5. High Pitched Roof with Timber Rafters & Triangular Gables
    this.buildPitchedRoof(houseGroup, conf, roofMat, wallMat, floorOffset);

    // 6. Front Entrance Porch & Stone Threshold Steps
    const stepDepth = 0.85;
    const stepW = doorW + 0.7;
    const stepGeo = new THREE.BoxGeometry(stepW, 0.18, stepDepth);
    const stepMesh = new THREE.Mesh(stepGeo, this.stoneWallMat);
    stepMesh.position.set(0, floorOffset - 0.08, halfD + stepDepth / 2 - 0.05);
    stepMesh.receiveShadow = true;
    houseGroup.add(stepMesh);

    // Low secondary stone ramp step
    const lowerStepGeo = new THREE.BoxGeometry(stepW + 0.4, 0.12, stepDepth);
    const lowerStep = new THREE.Mesh(lowerStepGeo, this.stoneWallMat);
    lowerStep.position.set(0, floorOffset - 0.22, halfD + stepDepth + 0.15);
    lowerStep.receiveShadow = true;
    houseGroup.add(lowerStep);

    // Porch canopy if configured
    if (conf.hasPorch) {
      this.buildPorchCanopy(houseGroup, conf, roofMat, floorOffset, doorW);
    }

    // 7. Stone Chimney & Interior Hearth
    let hearthLocalPos = new THREE.Vector3(0, floorOffset, 0);
    let chimneySmokeGroup: THREE.Points | null = null;
    let smokePositions: Float32Array | undefined;
    let smokeVelocities: Float32Array | undefined;
    let smokeLifetimes: Float32Array | undefined;

    if (conf.hasChimney !== false) {
      const chimneyResult = this.buildChimneyAndHearth(houseGroup, conf, floorOffset);
      hearthLocalPos = chimneyResult.hearthPos;
      chimneySmokeGroup = chimneyResult.smokePoints;
      smokePositions = chimneyResult.smokePositions;
      smokeVelocities = chimneyResult.smokeVelocities;
      smokeLifetimes = chimneyResult.smokeLifetimes;
    }

    // 8. Rich, Walkable Interior Furniture (Table, Stools, Bookshelf, Bed, Potion, Candles)
    this.buildInteriorFurniture(houseGroup, conf, floorOffset, doorW, hearthLocalPos);

    // 9. Exterior Street Decor (Hanging lanterns, flower planters, barrels)
    this.buildExteriorDecor(houseGroup, conf, floorOffset, doorW);

    this.group.add(houseGroup);

    // Compute exact world positions for doorway and hearth
    const doorLocalZ = halfD + 0.2;
    const doorWorldX = conf.x + (0 * cosR + doorLocalZ * sinR);
    const doorWorldZ = conf.z + (-0 * sinR + doorLocalZ * cosR);
    const doorWorldPos = new THREE.Vector3(doorWorldX, floorY, doorWorldZ);

    const hearthWorldX = conf.x + (hearthLocalPos.x * cosR + hearthLocalPos.z * sinR);
    const hearthWorldZ = conf.z + (-hearthLocalPos.x * sinR + hearthLocalPos.z * cosR);
    const hearthWorldPos = new THREE.Vector3(hearthWorldX, floorY, hearthWorldZ);

    // 10. Register Multi-Point Wall Obstacles (leaving doorway completely open!)
    this.generateWallObstacles(conf, floorY, doorW);

    this.builtHouses.push({
      config: conf,
      group: houseGroup,
      baseY,
      floorY,
      doorWorldPos,
      hearthWorldPos,
      cosR,
      sinR,
      smokeParticles: chimneySmokeGroup,
      smokePositions,
      smokeVelocities,
      smokeLifetimes,
    });
  }

  /**
   * Builds side walls with embedded window frames and warm interior illumination
   */
  private buildSideWallWithWindows(
    group: THREE.Group,
    posX: number,
    conf: HouseConfig,
    wallMat: THREE.Material,
    floorOffset: number
  ): void {
    const wallThick = 0.28;
    const halfD = conf.depth / 2;

    // Window dimensions
    const winW = 1.1;
    const winH = 1.15;
    const winY = floorOffset + 1.25;

    // Side wall consists of 3 sections: back segment, window opening segment, front segment
    const segmentDepth = (conf.depth - winW) / 2;

    const seg1Geo = new THREE.BoxGeometry(wallThick, conf.wallHeight, segmentDepth);
    const seg1 = new THREE.Mesh(seg1Geo, wallMat);
    seg1.position.set(posX, floorOffset + conf.wallHeight / 2, -halfD + segmentDepth / 2);
    seg1.castShadow = true;
    seg1.receiveShadow = true;

    const seg2Geo = new THREE.BoxGeometry(wallThick, conf.wallHeight, segmentDepth);
    const seg2 = new THREE.Mesh(seg2Geo, wallMat);
    seg2.position.set(posX, floorOffset + conf.wallHeight / 2, halfD - segmentDepth / 2);
    seg2.castShadow = true;
    seg2.receiveShadow = true;

    // Wall sections under and above the window
    const underH = winY - floorOffset - winH / 2;
    const underGeo = new THREE.BoxGeometry(wallThick, underH, winW);
    const underWall = new THREE.Mesh(underGeo, wallMat);
    underWall.position.set(posX, floorOffset + underH / 2, 0);

    const overH = conf.wallHeight - (winY - floorOffset + winH / 2);
    const overGeo = new THREE.BoxGeometry(wallThick, overH, winW);
    const overWall = new THREE.Mesh(overGeo, wallMat);
    overWall.position.set(posX, floorOffset + conf.wallHeight - overH / 2, 0);

    // Glowing window pane
    const glassGeo = new THREE.BoxGeometry(0.06, winH - 0.08, winW - 0.08);
    const glass = new THREE.Mesh(glassGeo, this.glassWindowMat);
    glass.position.set(posX, winY, 0);

    // Wooden window frame with cross muntins
    const frameGeo = new THREE.BoxGeometry(wallThick + 0.06, winH, 0.08);
    const topFrame = new THREE.Mesh(frameGeo, this.timberBeamMat);
    topFrame.position.set(posX, winY + winH / 2, 0);
    const bottomFrame = new THREE.Mesh(frameGeo, this.timberBeamMat);
    bottomFrame.position.set(posX, winY - winH / 2, 0);

    const vertMuntinGeo = new THREE.BoxGeometry(wallThick + 0.04, winH, 0.06);
    const vertMuntin = new THREE.Mesh(vertMuntinGeo, this.timberBeamMat);
    vertMuntin.position.set(posX, winY, 0);

    // Outer wooden shutters
    const shutterGeo = new THREE.BoxGeometry(0.04, winH, 0.35);
    const leftShutter = new THREE.Mesh(shutterGeo, this.timberPlankMat);
    leftShutter.position.set(posX + (posX > 0 ? 0.16 : -0.16), winY, -winW / 2 - 0.18);
    const rightShutter = new THREE.Mesh(shutterGeo, this.timberPlankMat);
    rightShutter.position.set(posX + (posX > 0 ? 0.16 : -0.16), winY, winW / 2 + 0.18);

    group.add(seg1, seg2, underWall, overWall, glass, topFrame, bottomFrame, vertMuntin, leftShutter, rightShutter);
  }

  /**
   * Builds high pitched gabled roof with eaves, decorative overhangs, and timber gable trusses
   */
  private buildPitchedRoof(
    group: THREE.Group,
    conf: HouseConfig,
    roofMat: THREE.Material,
    wallMat: THREE.Material,
    floorOffset: number
  ): void {
    const halfW = conf.width / 2;
    const halfD = conf.depth / 2;
    const roofBaseY = floorOffset + conf.wallHeight;
    const peakY = roofBaseY + conf.roofHeight;
    const overhang = 0.55;

    // Roof slopes on Left & Right
    const slopeLength = Math.sqrt(Math.pow(halfW + overhang, 2) + Math.pow(conf.roofHeight, 2));
    const slopeAngle = Math.atan2(conf.roofHeight, halfW + overhang);
    const roofThick = 0.14;
    const roofLength = conf.depth + overhang * 2;

    // Left roof slope
    const leftSlopeGeo = new THREE.BoxGeometry(slopeLength, roofThick, roofLength);
    const leftSlope = new THREE.Mesh(leftSlopeGeo, roofMat);
    leftSlope.position.set(-(halfW + overhang) / 2, roofBaseY + conf.roofHeight / 2, 0);
    leftSlope.rotation.z = slopeAngle;
    leftSlope.castShadow = true;
    leftSlope.receiveShadow = true;

    // Right roof slope
    const rightSlopeGeo = new THREE.BoxGeometry(slopeLength, roofThick, roofLength);
    const rightSlope = new THREE.Mesh(rightSlopeGeo, roofMat);
    rightSlope.position.set((halfW + overhang) / 2, roofBaseY + conf.roofHeight / 2, 0);
    rightSlope.rotation.z = -slopeAngle;
    rightSlope.castShadow = true;
    rightSlope.receiveShadow = true;

    // Ridge Beam (running along the top peak)
    const ridgeGeo = new THREE.BoxGeometry(0.24, 0.24, roofLength + 0.2);
    const ridgeMesh = new THREE.Mesh(ridgeGeo, this.timberBeamMat);
    ridgeMesh.position.set(0, peakY + 0.05, 0);
    ridgeMesh.castShadow = true;

    // Front & Back Triangular Gable Wall Infill
    const gableShape = new THREE.Shape();
    gableShape.moveTo(-halfW, 0);
    gableShape.lineTo(0, conf.roofHeight);
    gableShape.lineTo(halfW, 0);
    gableShape.closePath();

    const extrudeSettings = { depth: 0.26, bevelEnabled: false };
    const gableGeo = new THREE.ExtrudeGeometry(gableShape, extrudeSettings);

    const frontGable = new THREE.Mesh(gableGeo, wallMat);
    frontGable.position.set(0, roofBaseY, halfD - 0.26);
    frontGable.castShadow = true;

    const backGable = new THREE.Mesh(gableGeo, wallMat);
    backGable.position.set(0, roofBaseY, -halfD);
    backGable.castShadow = true;

    group.add(leftSlope, rightSlope, ridgeMesh, frontGable, backGable);
  }

  /**
   * Covered porch canopy with wooden posts
   */
  private buildPorchCanopy(
    group: THREE.Group,
    conf: HouseConfig,
    roofMat: THREE.Material,
    floorOffset: number,
    doorW: number
  ): void {
    const halfD = conf.depth / 2;
    const porchD = 1.3;
    const porchW = doorW + 1.2;
    const porchH = 2.4;

    // Slanted canopy roof
    const canopyGeo = new THREE.BoxGeometry(porchW, 0.1, porchD);
    const canopy = new THREE.Mesh(canopyGeo, roofMat);
    canopy.position.set(0, floorOffset + porchH + 0.15, halfD + porchD / 2);
    canopy.rotation.x = -0.18;
    canopy.castShadow = true;

    // Support timber posts
    const postGeo = new THREE.CylinderGeometry(0.08, 0.09, porchH, 7);
    const leftPost = new THREE.Mesh(postGeo, this.timberBeamMat);
    leftPost.position.set(-porchW / 2 + 0.15, floorOffset + porchH / 2, halfD + porchD - 0.15);
    leftPost.castShadow = true;

    const rightPost = new THREE.Mesh(postGeo, this.timberBeamMat);
    rightPost.position.set(porchW / 2 - 0.15, floorOffset + porchH / 2, halfD + porchD - 0.15);
    rightPost.castShadow = true;

    // Hanging brass lantern at the entrance
    const lanternGroup = this.createHangingLantern();
    lanternGroup.position.set(0, floorOffset + porchH - 0.2, halfD + porchD * 0.45);

    group.add(canopy, leftPost, rightPost, lanternGroup);
  }

  /**
   * Builds stone chimney with rising smoke particle system, and interior hearth firebox
   */
  private buildChimneyAndHearth(
    group: THREE.Group,
    conf: HouseConfig,
    floorOffset: number
  ): {
    hearthPos: THREE.Vector3;
    smokePoints: THREE.Points;
    smokePositions: Float32Array;
    smokeVelocities: Float32Array;
    smokeLifetimes: Float32Array;
  } {
    const halfW = conf.width / 2;
    const halfD = conf.depth / 2;
    const chimneyW = 1.3;
    const chimneyD = 1.1;
    const chimneyH = conf.wallHeight + conf.roofHeight + 1.2;

    let posX = 0;
    let posZ = 0;
    let hearthX = 0;
    let hearthZ = 0;

    const side = conf.chimneySide || 'left';
    if (side === 'left') {
      posX = -halfW - chimneyD / 2 + 0.2;
      posZ = -halfD * 0.35;
      hearthX = -halfW + 0.65;
      hearthZ = posZ;
    } else if (side === 'right') {
      posX = halfW + chimneyD / 2 - 0.2;
      posZ = -halfD * 0.35;
      hearthX = halfW - 0.65;
      hearthZ = posZ;
    } else {
      posX = 0;
      posZ = -halfD - chimneyD / 2 + 0.2;
      hearthX = 0;
      hearthZ = -halfD + 0.65;
    }

    // Exterior Stone Chimney Stack
    const chimneyGeo = new THREE.BoxGeometry(chimneyW, chimneyH, chimneyD);
    const chimneyMesh = new THREE.Mesh(chimneyGeo, this.stoneWallMat);
    chimneyMesh.position.set(posX, floorOffset + chimneyH / 2 - 0.4, posZ);
    chimneyMesh.castShadow = true;
    chimneyMesh.receiveShadow = true;

    // Chimney Cap
    const capGeo = new THREE.BoxGeometry(chimneyW + 0.2, 0.16, chimneyD + 0.2);
    const capMesh = new THREE.Mesh(capGeo, this.stoneWallMat);
    capMesh.position.set(posX, floorOffset + chimneyH - 0.3, posZ);
    chimneyMesh.add(capMesh);
    group.add(chimneyMesh);

    // Interior Stone Fireplace Hearth
    const hearthGroup = new THREE.Group();
    hearthGroup.position.set(hearthX, floorOffset, hearthZ);

    const hearthMantelGeo = new THREE.BoxGeometry(1.4, 1.2, 0.7);
    const hearthMantel = new THREE.Mesh(hearthMantelGeo, this.stoneWallMat);
    hearthMantel.position.y = 0.6;
    hearthMantel.castShadow = true;
    hearthGroup.add(hearthMantel);

    // Dark firebox cavity
    const fireboxGeo = new THREE.BoxGeometry(0.85, 0.7, 0.45);
    const fireboxMat = new THREE.MeshBasicMaterial({ color: 0x151210 });
    const firebox = new THREE.Mesh(fireboxGeo, fireboxMat);
    firebox.position.set(0, 0.42, 0.15);
    hearthGroup.add(firebox);

    // Glowing Logs & Embers
    const emberGeo = new THREE.DodecahedronGeometry(0.24, 0);
    const embers = new THREE.Mesh(emberGeo, this.hearthFireMat);
    embers.position.set(0, 0.22, 0.15);
    hearthGroup.add(embers);

    // Cozy Fireplace Point Light
    const fireLight = new THREE.PointLight(0xff7722, 1.6, 7.5, 1.8);
    fireLight.position.set(hearthX, floorOffset + 0.55, hearthZ + 0.2);
    group.add(fireLight);
    this.hearthLights.push(fireLight);

    group.add(hearthGroup);

    // Smoke Particle System at chimney top
    const particleCount = 28;
    const smokeGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const lifetimes = new Float32Array(particleCount);

    const topY = floorOffset + chimneyH - 0.2;
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3 + 0] = posX + (Math.random() - 0.5) * 0.25;
      positions[i * 3 + 1] = topY + Math.random() * 2.5;
      positions[i * 3 + 2] = posZ + (Math.random() - 0.5) * 0.25;

      velocities[i * 3 + 0] = (Math.random() - 0.5) * 0.18 + 0.12; // slight wind drift
      velocities[i * 3 + 1] = 0.45 + Math.random() * 0.35; // rise
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.18;

      lifetimes[i] = Math.random();
    }
    smokeGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const smokeMat = new THREE.PointsMaterial({
      color: 0xc8c8d0,
      size: 0.42,
      transparent: true,
      opacity: 0.38,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });

    const smokePoints = new THREE.Points(smokeGeo, smokeMat);
    group.add(smokePoints);

    return {
      hearthPos: new THREE.Vector3(hearthX, floorOffset, hearthZ),
      smokePoints,
      smokePositions: positions,
      smokeVelocities: velocities,
      smokeLifetimes: lifetimes,
    };
  }

  /**
   * Detailed rustic interior furniture:
   * Carved wooden bed, dining/study table with chairs, tall bookcase with colorful tomes,
   * glowing potions, open parchment, and bedside chest.
   */
  private buildInteriorFurniture(
    group: THREE.Group,
    conf: HouseConfig,
    floorOffset: number,
    doorW: number,
    hearthPos: THREE.Vector3
  ): void {
    const halfW = conf.width / 2;
    const halfD = conf.depth / 2;

    // 1. Cozy Bed (placed in corner away from door & fireplace)
    const bedX = halfW - 1.15;
    const bedZ = -halfD + 1.25;

    const bedGroup = new THREE.Group();
    bedGroup.position.set(bedX, floorOffset, bedZ);

    // Bed frame
    const bedFrameGeo = new THREE.BoxGeometry(1.3, 0.4, 2.1);
    const bedFrame = new THREE.Mesh(bedFrameGeo, this.timberPlankMat);
    bedFrame.position.y = 0.2;
    bedFrame.castShadow = true;
    bedGroup.add(bedFrame);

    // Mattress & Wool Blanket
    const blanketColor = conf.style === 'large' ? 0x8a2be2 : conf.style === 'lakeside' ? 0x1b4965 : 0xa63a24;
    const blanketMat = new THREE.MeshStandardMaterial({ color: blanketColor, roughness: 0.85 });
    const mattressGeo = new THREE.BoxGeometry(1.15, 0.22, 1.95);
    const mattress = new THREE.Mesh(mattressGeo, blanketMat);
    mattress.position.y = 0.45;
    bedGroup.add(mattress);

    // White Pillow
    const pillowMat = new THREE.MeshStandardMaterial({ color: 0xedebe4, roughness: 0.9 });
    const pillowGeo = new THREE.BoxGeometry(0.9, 0.16, 0.48);
    const pillow = new THREE.Mesh(pillowGeo, pillowMat);
    pillow.position.set(0, 0.58, -0.65);
    bedGroup.add(pillow);

    // Wooden Headboard
    const headboardGeo = new THREE.BoxGeometry(1.3, 0.95, 0.12);
    const headboard = new THREE.Mesh(headboardGeo, this.timberBeamMat);
    headboard.position.set(0, 0.55, -1.0);
    bedGroup.add(headboard);

    group.add(bedGroup);

    // 2. Oak Dining/Study Table with Stools
    const tableX = conf.style === 'large' ? -1.2 : -halfW + 1.6;
    const tableZ = 0.2;

    const tableGroup = new THREE.Group();
    tableGroup.position.set(tableX, floorOffset, tableZ);

    const tableTopW = conf.style === 'large' ? 2.4 : 1.5;
    const tableTopD = conf.style === 'large' ? 1.2 : 0.9;
    const tableTopGeo = new THREE.BoxGeometry(tableTopW, 0.1, tableTopD);
    const tableTop = new THREE.Mesh(tableTopGeo, this.timberPlankMat);
    tableTop.position.y = 0.82;
    tableTop.castShadow = true;
    tableGroup.add(tableTop);

    // Table legs
    const legGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.8, 6);
    const legOffsets = [
      [-tableTopW / 2 + 0.12, -tableTopD / 2 + 0.12],
      [tableTopW / 2 - 0.12, -tableTopD / 2 + 0.12],
      [-tableTopW / 2 + 0.12, tableTopD / 2 - 0.12],
      [tableTopW / 2 - 0.12, tableTopD / 2 - 0.12],
    ];
    for (const [lx, lz] of legOffsets) {
      const leg = new THREE.Mesh(legGeo, this.timberBeamMat);
      leg.position.set(lx, 0.4, lz);
      leg.castShadow = true;
      tableGroup.add(leg);
    }

    // Wooden Stools / Benches
    const stoolGeo = new THREE.CylinderGeometry(0.24, 0.26, 0.48, 8);
    const stool1 = new THREE.Mesh(stoolGeo, this.timberBeamMat);
    stool1.position.set(0, 0.24, tableTopD / 2 + 0.35);
    const stool2 = new THREE.Mesh(stoolGeo, this.timberBeamMat);
    stool2.position.set(0, 0.24, -tableTopD / 2 - 0.35);
    tableGroup.add(stool1, stool2);

    // Tabletop Details: Glowing Alchemy Flask & Ancient Scroll
    const flaskGeo = new THREE.ConeGeometry(0.12, 0.24, 8);
    const flaskMat = new THREE.MeshStandardMaterial({
      color: 0x00f5d4,
      emissive: 0x00f5d4,
      emissiveIntensity: 0.8,
      roughness: 0.2,
    });
    const flask = new THREE.Mesh(flaskGeo, flaskMat);
    flask.position.set(-0.35, 0.96, 0.1);
    tableGroup.add(flask);

    // Parchment scroll
    const scrollGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.32, 8);
    const scrollMat = new THREE.MeshStandardMaterial({ color: 0xe6dcbf, roughness: 0.9 });
    const scroll = new THREE.Mesh(scrollGeo, scrollMat);
    scroll.rotation.z = Math.PI / 2;
    scroll.position.set(0.25, 0.9, -0.1);
    tableGroup.add(scroll);

    // Lore Book if configured
    if (conf.hasLoreBook) {
      const bookGeo = new THREE.BoxGeometry(0.32, 0.08, 0.42);
      const bookMat = new THREE.MeshStandardMaterial({ color: 0x9b5de5, emissive: 0x5e2b97, emissiveIntensity: 0.4 });
      const book = new THREE.Mesh(bookGeo, bookMat);
      book.position.set(0.15, 0.91, 0.15);
      tableGroup.add(book);
    }

    group.add(tableGroup);

    // 3. Tall Wooden Bookshelf with Multi-Colored Ancient Tomes
    const shelfX = conf.style === 'large' ? -halfW + 0.4 : halfW - 0.4;
    const shelfZ = conf.style === 'large' ? -1.0 : halfD - 1.4;

    const shelfGroup = new THREE.Group();
    shelfGroup.position.set(shelfX, floorOffset, shelfZ);
    if (conf.style === 'large') shelfGroup.rotation.y = Math.PI / 2;

    const shelfW = 1.6;
    const shelfH = 2.2;
    const shelfD = 0.42;

    const frameBackGeo = new THREE.BoxGeometry(shelfW, shelfH, 0.08);
    const frameBack = new THREE.Mesh(frameBackGeo, this.timberBeamMat);
    frameBack.position.y = shelfH / 2;
    shelfGroup.add(frameBack);

    // Horizontal Shelves
    const shelfPlankGeo = new THREE.BoxGeometry(shelfW, 0.06, shelfD);
    for (let s = 0; s < 4; s++) {
      const plank = new THREE.Mesh(shelfPlankGeo, this.timberPlankMat);
      plank.position.set(0, 0.3 + s * 0.55, shelfD / 2 - 0.04);
      shelfGroup.add(plank);

      // Add colorful book rows on each shelf
      const bookColors = [0xb23b3b, 0x2e6b4f, 0x3b5998, 0xd4af37];
      for (let b = 0; b < 6; b++) {
        const bGeo = new THREE.BoxGeometry(0.08, 0.35 + (b % 3) * 0.05, 0.24);
        const bMat = new THREE.MeshStandardMaterial({ color: bookColors[(s + b) % bookColors.length] });
        const bookMesh = new THREE.Mesh(bGeo, bMat);
        bookMesh.position.set(-shelfW / 2 + 0.25 + b * 0.16, 0.3 + s * 0.55 + 0.2, shelfD / 2 - 0.04);
        shelfGroup.add(bookMesh);
      }
    }
    group.add(shelfGroup);

    // 4. Banded Wooden Storage Chest
    const chestGroup = new THREE.Group();
    chestGroup.position.set(bedX, floorOffset, bedZ + 1.4);

    const chestBodyGeo = new THREE.BoxGeometry(0.85, 0.45, 0.52);
    const chestBody = new THREE.Mesh(chestBodyGeo, this.timberPlankMat);
    chestBody.position.y = 0.23;
    chestBody.castShadow = true;

    const chestLidGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.85, 12, 1, false, 0, Math.PI);
    const chestLid = new THREE.Mesh(chestLidGeo, this.timberBeamMat);
    chestLid.rotation.z = Math.PI / 2;
    chestLid.position.y = 0.46;

    chestGroup.add(chestBody, chestLid);
    group.add(chestGroup);
  }

  /**
   * Exterior decorative details:
   * Hanging brass lanterns, flower planters, rustic firewood stacks, wooden storage barrels.
   */
  private buildExteriorDecor(
    group: THREE.Group,
    conf: HouseConfig,
    floorOffset: number,
    doorW: number
  ): void {
    const halfW = conf.width / 2;
    const halfD = conf.depth / 2;

    // 1. Entrance Wall Lantern
    const lantern = this.createHangingLantern();
    lantern.position.set(doorW / 2 + 0.45, floorOffset + 2.1, halfD + 0.18);
    group.add(lantern);

    // 2. Window Flower Planter Box
    const boxW = 1.3;
    const boxGeo = new THREE.BoxGeometry(boxW, 0.22, 0.32);
    const planterBox = new THREE.Mesh(boxGeo, this.timberPlankMat);
    planterBox.position.set(-halfW + boxW / 2 + 0.2, floorOffset + 1.1, halfD + 0.15);
    planterBox.castShadow = true;

    // Colorful blossoms in the planter
    const flowerColors = [0xff6b6b, 0xfee440, 0x00f5d4, 0x9b5de5];
    for (let f = 0; f < 5; f++) {
      const bloomGeo = new THREE.DodecahedronGeometry(0.1, 0);
      const bloomMat = new THREE.MeshStandardMaterial({ color: flowerColors[f % flowerColors.length] });
      const bloom = new THREE.Mesh(bloomGeo, bloomMat);
      bloom.position.set(-boxW / 2 + 0.2 + f * 0.22, 0.18, (Math.random() - 0.5) * 0.1);
      planterBox.add(bloom);
    }
    group.add(planterBox);

    // 3. Wooden Barrels & Firewood Stack outside
    const barrelGeo = new THREE.CylinderGeometry(0.32, 0.36, 0.78, 10);
    const barrel = new THREE.Mesh(barrelGeo, this.timberPlankMat);
    barrel.position.set(halfW - 0.5, floorOffset + 0.39, halfD + 0.65);
    barrel.castShadow = true;
    group.add(barrel);

    // Stacked firewood logs
    const logGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.9, 6);
    logGeo.rotateZ(Math.PI / 2);
    for (let l = 0; l < 4; l++) {
      const log = new THREE.Mesh(logGeo, this.timberBeamMat);
      log.position.set(-halfW - 0.35, floorOffset + 0.1 + l * 0.14, -halfD + 1.2 + (l % 2) * 0.1);
      log.castShadow = true;
      group.add(log);
    }
  }

  /**
   * Creates a detailed hanging brass lantern with warm emissive core
   */
  private createHangingLantern(): THREE.Group {
    const lanternGroup = new THREE.Group();

    // Brass Hood & Base
    const hoodGeo = new THREE.ConeGeometry(0.18, 0.12, 6);
    const hood = new THREE.Mesh(hoodGeo, this.ironMat);
    hood.position.y = 0.18;

    const baseGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.06, 6);
    const base = new THREE.Mesh(baseGeo, this.ironMat);
    base.position.y = -0.16;

    // Glowing core
    const coreGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.26, 6);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xffb347,
      emissive: 0xffaa22,
      emissiveIntensity: 1.1,
      transparent: true,
      opacity: 0.92,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.y = 0.01;

    lanternGroup.add(hood, base, core);
    return lanternGroup;
  }

  /**
   * Generates discrete wall collision obstacles along the house perimeter,
   * while intentionally omitting the doorway opening so the player can walk inside!
   */
  private generateWallObstacles(conf: HouseConfig, floorY: number, doorW: number): void {
    const halfW = conf.width / 2;
    const halfD = conf.depth / 2;
    const cosR = Math.cos(conf.rotationY);
    const sinR = Math.sin(conf.rotationY);

    const toWorld = (lx: number, lz: number): { x: number; z: number } => ({
      x: conf.x + (lx * cosR + lz * sinR),
      z: conf.z + (-lx * sinR + lz * cosR),
    });

    const obsRadius = 0.55;

    // 1. Back Wall obstacles (solid across entire width)
    const backSteps = Math.ceil(conf.width / 1.0);
    for (let i = 0; i <= backSteps; i++) {
      const lx = -halfW + (conf.width / backSteps) * i;
      const lz = -halfD;
      const w = toWorld(lx, lz);
      this.obstacles.push({ x: w.x, z: w.z, radius: obsRadius });
    }

    // 2. Left Wall obstacles
    const depthSteps = Math.ceil(conf.depth / 1.0);
    for (let i = 0; i <= depthSteps; i++) {
      const lx = -halfW;
      const lz = -halfD + (conf.depth / depthSteps) * i;
      const w = toWorld(lx, lz);
      this.obstacles.push({ x: w.x, z: w.z, radius: obsRadius });
    }

    // 3. Right Wall obstacles
    for (let i = 0; i <= depthSteps; i++) {
      const lx = halfW;
      const lz = -halfD + (conf.depth / depthSteps) * i;
      const w = toWorld(lx, lz);
      this.obstacles.push({ x: w.x, z: w.z, radius: obsRadius });
    }

    // 4. Front Wall obstacles (Split into Left Wing & Right Wing, LEAVING DOORWAY OPEN!)
    // Left wing
    const leftDoorEdge = -doorW / 2 - 0.15;
    const leftWingLength = halfW + leftDoorEdge;
    if (leftWingLength > 0.4) {
      const steps = Math.max(1, Math.ceil(leftWingLength / 0.9));
      for (let i = 0; i <= steps; i++) {
        const lx = -halfW + (leftWingLength / steps) * i;
        const lz = halfD;
        const w = toWorld(lx, lz);
        this.obstacles.push({ x: w.x, z: w.z, radius: obsRadius });
      }
    }

    // Right wing
    const rightDoorEdge = doorW / 2 + 0.15;
    const rightWingLength = halfW - rightDoorEdge;
    if (rightWingLength > 0.4) {
      const steps = Math.max(1, Math.ceil(rightWingLength / 0.9));
      for (let i = 0; i <= steps; i++) {
        const lx = rightDoorEdge + (rightWingLength / steps) * i;
        const lz = halfD;
        const w = toWorld(lx, lz);
        this.obstacles.push({ x: w.x, z: w.z, radius: obsRadius });
      }
    }

    // 5. Fireplace obstacle against the chimney wall so player does not walk into fire
    if (conf.hasChimney !== false) {
      const side = conf.chimneySide || 'left';
      let hearthLocalX = 0;
      let hearthLocalZ = 0;
      if (side === 'left') {
        hearthLocalX = -halfW + 0.65;
        hearthLocalZ = -halfD * 0.35;
      } else if (side === 'right') {
        hearthLocalX = halfW - 0.65;
        hearthLocalZ = -halfD * 0.35;
      } else {
        hearthLocalX = 0;
        hearthLocalZ = -halfD + 0.65;
      }
      const hw = toWorld(hearthLocalX, hearthLocalZ);
      this.obstacles.push({ x: hw.x, z: hw.z, radius: 0.65 });
    }
  }

  /**
   * Constructs the Village Central Plaza, Cobblestone Street Network, and Carved Lampposts
   */
  private buildVillagePlazaAndStreets(): void {
    const plazaCenter = new THREE.Vector3(50, 0, 42);
    plazaCenter.y = this.terrain.getHeightAt(plazaCenter.x, plazaCenter.z);
    this.wellPosition.copy(plazaCenter);

    // 1. Central Plaza Cobblestone Ring
    const plazaRadius = 6.5;
    const plazaSegments = 24;
    const plazaGeo = new THREE.CircleGeometry(plazaRadius, plazaSegments);
    plazaGeo.rotateX(-Math.PI / 2);

    const plazaMesh = new THREE.Mesh(plazaGeo, this.cobblestoneMat);
    plazaMesh.position.set(plazaCenter.x, plazaCenter.y + 0.05, plazaCenter.z);
    plazaMesh.receiveShadow = true;
    this.group.add(plazaMesh);

    // 2. Ancient Stone Well in the plaza center
    const wellGroup = new THREE.Group();
    wellGroup.position.copy(plazaCenter);

    // Stone Well Curb / Rim
    const rimGeo = new THREE.CylinderGeometry(1.25, 1.35, 0.85, 14, 1, true);
    const rimMesh = new THREE.Mesh(rimGeo, this.stoneWallMat);
    rimMesh.position.y = 0.42;
    rimMesh.castShadow = true;
    rimMesh.receiveShadow = true;

    // Glowing pure water inside the well
    const waterGeo = new THREE.CircleGeometry(1.2, 12);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x00f5d4,
      emissive: 0x00bbf9,
      emissiveIntensity: 0.5,
      roughness: 0.1,
    });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.y = 0.32;

    // Well Timber Roof & Winch Support Posts
    const postGeo = new THREE.BoxGeometry(0.16, 2.2, 0.16);
    const postL = new THREE.Mesh(postGeo, this.timberBeamMat);
    postL.position.set(-1.0, 1.1, 0);
    const postR = new THREE.Mesh(postGeo, this.timberBeamMat);
    postR.position.set(1.0, 1.1, 0);

    const crossbeamGeo = new THREE.BoxGeometry(2.3, 0.18, 0.18);
    const crossbeam = new THREE.Mesh(crossbeamGeo, this.timberBeamMat);
    crossbeam.position.set(0, 2.1, 0);

    const wellRoofGeo = new THREE.ConeGeometry(1.65, 0.95, 6);
    const wellRoofMat = new THREE.MeshStandardMaterial({ color: 0x4a3220, roughness: 0.88 });
    const wellRoof = new THREE.Mesh(wellRoofGeo, wellRoofMat);
    wellRoof.position.set(0, 2.55, 0);

    // Wooden Bucket & Rope
    const ropeGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.2, 5);
    const ropeMat = new THREE.MeshBasicMaterial({ color: 0xbe9b7b });
    const rope = new THREE.Mesh(ropeGeo, ropeMat);
    rope.position.set(0, 1.45, 0);

    const bucketGeo = new THREE.CylinderGeometry(0.2, 0.16, 0.32, 8);
    const bucket = new THREE.Mesh(bucketGeo, this.timberPlankMat);
    bucket.position.set(0, 0.75, 0);

    wellGroup.add(rimMesh, waterMesh, postL, postR, crossbeam, wellRoof, rope, bucket);
    this.group.add(wellGroup);

    // Register well collision
    this.obstacles.push({
      x: plazaCenter.x,
      z: plazaCenter.z,
      radius: 1.45,
    });

    // 3. Resting Benches in the Plaza
    const benchPositions = [
      new THREE.Vector3(plazaCenter.x - 3.8, 0, plazaCenter.z - 2.5),
      new THREE.Vector3(plazaCenter.x + 3.8, 0, plazaCenter.z + 2.5),
    ];
    for (const bp of benchPositions) {
      bp.y = this.terrain.getHeightAt(bp.x, bp.z);
      const bench = this.createStoneBench();
      bench.position.copy(bp);
      bench.lookAt(plazaCenter.x, bp.y, plazaCenter.z);
      this.group.add(bench);
    }

    // 4. Directional Wooden Signpost
    const signpost = this.createDirectionalSignpost();
    signpost.position.set(plazaCenter.x + 2.8, this.terrain.getHeightAt(plazaCenter.x + 2.8, plazaCenter.z - 3.5), plazaCenter.z - 3.5);
    this.group.add(signpost);

    // 5. Cobblestone Street Network Connecting Houses & Entrances
    this.buildCobblestoneStreets(plazaCenter);

    // 6. Carved Wooden Streetlamps along the roads
    const lampCoords = [
      new THREE.Vector2(44, 36),
      new THREE.Vector2(58, 38),
      new THREE.Vector2(48, 52),
      new THREE.Vector2(38, 40),
      new THREE.Vector2(62, 54),
      new THREE.Vector2(50, 22),
    ];

    for (const lc of lampCoords) {
      const ly = this.terrain.getHeightAt(lc.x, lc.y);
      const lamp = this.createCarvedStreetlamp();
      lamp.position.set(lc.x, ly, lc.y);
      this.group.add(lamp);

      // Soft amber streetlamp point light
      const lampLight = new THREE.PointLight(0xffb044, 1.25, 9.5, 1.6);
      lampLight.position.set(lc.x, ly + 2.8, lc.y);
      this.group.add(lampLight);
      this.streetLights.push(lampLight);
    }
  }

  /**
   * Cobblestone streets linking all houses and opening paths to the wider island
   */
  private buildCobblestoneStreets(plazaCenter: THREE.Vector3): void {
    // Array of key pathway segments: [startX, startZ, endX, endZ, width]
    const roads: [number, number, number, number, number][] = [
      // Street north towards Elder Hall & Alchemist
      [plazaCenter.x, plazaCenter.z, 52, 34, 2.8],
      [52, 34, 38, 30, 2.4],
      [52, 34, 66, 28, 2.4],

      // Street south towards Meadow Cabin & Weaver
      [plazaCenter.x, plazaCenter.z, 50, 56, 2.8],
      [50, 56, 38, 50, 2.4],
      [50, 56, 62, 48, 2.4],
      [50, 56, 52, 62, 2.4],

      // Main thoroughfare connecting village south to the shoreline trail
      [50, 62, 42, 74, 3.2],
      [42, 74, 18, 80, 3.2], // leads toward player initial spawn!

      // Pathway heading north-west towards the lake and temple
      [38, 30, 22, 18, 2.8],
      [22, 18, 5, 2, 2.8],
    ];

    for (const [x1, z1, x2, z2, width] of roads) {
      const dx = x2 - x1;
      const dz = z2 - z1;
      const len = Math.sqrt(dx * dx + dz * dz);
      const angle = Math.atan2(dx, dz);

      const roadGeo = new THREE.PlaneGeometry(width, len, 2, Math.max(2, Math.floor(len / 3)));
      roadGeo.rotateX(-Math.PI / 2);

      // Adjust vertex elevations to adhere cleanly to the terrain
      const posAttr = roadGeo.attributes.position;
      const midX = (x1 + x2) / 2;
      const midZ = (z1 + z2) / 2;

      for (let i = 0; i < posAttr.count; i++) {
        const lx = posAttr.getX(i);
        const lz = posAttr.getZ(i);

        // Transform local plane to world
        const wx = midX + (lx * Math.cos(angle) + lz * Math.sin(angle));
        const wz = midZ + (-lx * Math.sin(angle) + lz * Math.cos(angle));

        const y = this.terrain.getHeightAt(wx, wz) + 0.04;
        posAttr.setY(i, y - this.terrain.getHeightAt(midX, midZ));
      }
      roadGeo.computeVertexNormals();

      const roadMesh = new THREE.Mesh(roadGeo, this.cobblestoneMat);
      roadMesh.position.set(midX, this.terrain.getHeightAt(midX, midZ), midZ);
      roadMesh.rotation.y = angle;
      roadMesh.receiveShadow = true;
      this.group.add(roadMesh);
    }
  }

  /**
   * Creates a stone village resting bench
   */
  private createStoneBench(): THREE.Group {
    const bench = new THREE.Group();
    const slabGeo = new THREE.BoxGeometry(1.6, 0.16, 0.55);
    const slab = new THREE.Mesh(slabGeo, this.stoneWallMat);
    slab.position.y = 0.45;
    slab.castShadow = true;

    const legGeo = new THREE.BoxGeometry(0.3, 0.4, 0.48);
    const leg1 = new THREE.Mesh(legGeo, this.stoneWallMat);
    leg1.position.set(-0.6, 0.2, 0);
    const leg2 = new THREE.Mesh(legGeo, this.stoneWallMat);
    leg2.position.set(0.6, 0.2, 0);

    bench.add(slab, leg1, leg2);
    return bench;
  }

  /**
   * Creates a directional signpost with carved wooden planks
   */
  private createDirectionalSignpost(): THREE.Group {
    const signpost = new THREE.Group();

    const postGeo = new THREE.CylinderGeometry(0.1, 0.12, 2.6, 8);
    const post = new THREE.Mesh(postGeo, this.timberBeamMat);
    post.position.y = 1.3;
    post.castShadow = true;

    // Planks pointing in different directions
    const plankGeo = new THREE.BoxGeometry(1.1, 0.22, 0.06);

    const sign1 = new THREE.Mesh(plankGeo, this.timberPlankMat);
    sign1.position.set(0.45, 2.2, 0);
    sign1.rotation.y = 0.2;

    const sign2 = new THREE.Mesh(plankGeo, this.timberPlankMat);
    sign2.position.set(-0.45, 1.85, 0);
    sign2.rotation.y = 2.4;

    const sign3 = new THREE.Mesh(plankGeo, this.timberPlankMat);
    sign3.position.set(0.4, 1.5, 0);
    sign3.rotation.y = -1.2;

    signpost.add(post, sign1, sign2, sign3);
    return signpost;
  }

  /**
   * Creates a carved timber streetlamp with brass hood and glowing crystal lantern
   */
  private createCarvedStreetlamp(): THREE.Group {
    const lamp = new THREE.Group();

    // Wooden vertical column
    const poleGeo = new THREE.CylinderGeometry(0.12, 0.16, 3.2, 8);
    const pole = new THREE.Mesh(poleGeo, this.timberBeamMat);
    pole.position.y = 1.6;
    pole.castShadow = true;

    // Curved iron bracket
    const bracketGeo = new THREE.BoxGeometry(0.55, 0.08, 0.08);
    const bracket = new THREE.Mesh(bracketGeo, this.ironMat);
    bracket.position.set(0.24, 3.0, 0);

    // Hanging lantern
    const lantern = this.createHangingLantern();
    lantern.position.set(0.48, 2.8, 0);

    lamp.add(pole, bracket, lantern);
    return lamp;
  }

  /**
   * Returns exact floor elevation when inside a house, or smooth ramp at the threshold.
   * Enables seamless character locomotion, flat interiors, jumping, and camera adherence.
   */
  public getFloorHeightAt(worldX: number, worldZ: number): number | null {
    for (let i = 0; i < this.builtHouses.length; i++) {
      const house = this.builtHouses[i];
      const conf = house.config;

      // Transform world (X, Z) into house local space (lx, lz)
      const dx = worldX - conf.x;
      const dz = worldZ - conf.z;

      const lx = dx * house.cosR - dz * house.sinR;
      const lz = dx * house.sinR + dz * house.cosR;

      const halfW = conf.width / 2;
      const halfD = conf.depth / 2;

      // 1. Inside interior room bounds (flat level wooden floor)
      if (Math.abs(lx) <= halfW - 0.1 && Math.abs(lz) <= halfD - 0.1) {
        return house.floorY;
      }

      // 2. Doorway threshold and front step ramp
      const doorW = conf.style === 'large' ? 2.2 : conf.style === 'medium' ? 1.7 : 1.45;
      if (Math.abs(lx) <= doorW / 2 + 0.35 && lz >= halfD - 0.15 && lz <= halfD + 1.6) {
        const t = (halfD + 1.6 - lz) / 1.75; // 0 at outside edge, 1 at door entrance
        const outsideY = this.terrain.calculateHeight(worldX, worldZ);
        return THREE.MathUtils.lerp(outsideY, house.floorY, Math.max(0, Math.min(1, t)));
      }
    }
    return null;
  }

  /**
   * Checks if a point is near any house footprint (used to keep trees/boulders clear)
   */
  public static isNearAnyHouse(x: number, z: number, clearanceRadius: number = 7.0): boolean {
    const villageHouseCenters = [
      { x: 52, z: 32, r: 7.5 },
      { x: 35, z: 28, r: 6.5 },
      { x: 69, z: 26, r: 6.5 },
      { x: 36, z: 48, r: 5.5 },
      { x: 65, z: 46, r: 6.5 },
      { x: 52, z: 60, r: 5.5 },
      { x: 50, z: 42, r: 7.0 }, // village plaza
      { x: -20, z: -56, r: 6.0 }, // lakeside
      { x: -72, z: -32, r: 5.5 }, // forest hermit
      { x: 62, z: -68, r: 6.5 }, // highland
      { x: -32, z: 60, r: 5.5 }, // valley
    ];

    for (const h of villageHouseCenters) {
      const dist = Math.sqrt((x - h.x) ** 2 + (z - h.z) ** 2);
      if (dist < h.r + clearanceRadius) {
        return true;
      }
    }
    return false;
  }

  /**
   * Finds closest interactive object in the village (hearths, well, lorebooks)
   */
  public findClosestInteraction(playerPos: THREE.Vector3, maxDist: number = 3.8): VillageInteractiveTarget | null {
    let closestTarget: VillageInteractiveTarget | null = null;
    let closestDist = maxDist;

    // 1. Check all house fireplaces (Rest & Heal)
    for (const house of this.builtHouses) {
      const dist = playerPos.distanceTo(house.hearthWorldPos);
      if (dist < closestDist) {
        closestDist = dist;
        closestTarget = {
          id: `hearth_${house.config.id}`,
          type: 'hearth',
          titleAr: `موقد ${house.config.nameAr}`,
          titleEn: `Hearth of ${house.config.nameEn}`,
          actionAr: 'استرح بجانب الموقد واستعد طاقتك',
          actionEn: 'Rest by Warm Hearth & Heal',
          pos: house.hearthWorldPos,
          dist,
          color: 0xff7722,
          data: house,
        };
      }

      // Check ancient lorebook on table if present
      if (house.config.hasLoreBook) {
        // Table position in world space
        const tableLocalX = house.config.style === 'large' ? -1.2 : -house.config.width / 2 + 1.6;
        const tableWorldX = house.config.x + (tableLocalX * house.cosR + 0.2 * house.sinR);
        const tableWorldZ = house.config.z + (-tableLocalX * house.sinR + 0.2 * house.cosR);
        const tablePos = new THREE.Vector3(tableWorldX, house.floorY + 0.8, tableWorldZ);

        const bookDist = playerPos.distanceTo(tablePos);
        if (bookDist < closestDist) {
          closestDist = bookDist;
          closestTarget = {
            id: `book_${house.config.id}`,
            type: 'village_lore',
            titleAr: house.config.loreTitleAr || 'سجل المخطوطات القديمة',
            titleEn: house.config.loreTitleEn || 'Ancient Village Manuscript',
            actionAr: 'اقرأ مذكرات سكان الجزيرة',
            actionEn: 'Read Island Dwellers Lore',
            pos: tablePos,
            dist: bookDist,
            color: 0x9b5de5,
            data: house.config,
          };
        }
      }
    }

    // 2. Check ancient stone well in the village square
    const wellDist = playerPos.distanceTo(this.wellPosition);
    if (wellDist < closestDist) {
      closestDist = wellDist;
      closestTarget = {
        id: 'village_well',
        type: 'well',
        titleAr: 'بئر مياه الأثير العتيق',
        titleEn: 'Ancient Aether Village Well',
        actionAr: 'اشرب من مياه الأثير العذبة',
        actionEn: 'Drink Pure Spring Water',
        pos: this.wellPosition.clone().add(new THREE.Vector3(0, 0.8, 0)),
        dist: wellDist,
        color: 0x00f5d4,
        data: null,
      };
    }

    return closestTarget;
  }

  /**
   * Minimap blip data for all houses
   */
  public getMinimapHouseBlips(): { x: number; z: number; style: string; nameAr: string }[] {
    return this.builtHouses.map((h) => ({
      x: h.config.x,
      z: h.config.z,
      style: h.config.style,
      nameAr: h.config.nameAr,
    }));
  }

  /**
   * Frame animation loop:
   * Animates gentle rising chimney smoke particles and hearth flame flicker
   */
  public update(dt: number, timeSec: number): void {
    // 1. Animate subtle hearth flame flicker
    for (let i = 0; i < this.hearthLights.length; i++) {
      const light = this.hearthLights[i];
      const flicker = Math.sin(timeSec * 7.5 + i * 1.7) * 0.2 + Math.cos(timeSec * 11.2 + i * 2.3) * 0.12;
      light.intensity = 1.6 + flicker;
    }

    // 2. Animate rising chimney smoke particles
    for (const house of this.builtHouses) {
      if (!house.smokeParticles || !house.smokePositions || !house.smokeVelocities || !house.smokeLifetimes) {
        continue;
      }

      const count = house.smokeLifetimes.length;
      const pos = house.smokePositions;
      const vel = house.smokeVelocities;
      const life = house.smokeLifetimes;

      const chimneyH = house.config.wallHeight + house.config.roofHeight + 1.2;
      const spawnY = house.floorY + chimneyH - 0.2;

      for (let p = 0; p < count; p++) {
        life[p] += dt * 0.45;

        pos[p * 3 + 0] += vel[p * 3 + 0] * dt;
        pos[p * 3 + 1] += vel[p * 3 + 1] * dt;
        pos[p * 3 + 2] += vel[p * 3 + 2] * dt;

        // Reset particle when lifetime expires
        if (life[p] >= 1.0) {
          life[p] = 0;
          pos[p * 3 + 0] = (Math.random() - 0.5) * 0.25;
          pos[p * 3 + 1] = spawnY - house.baseY;
          pos[p * 3 + 2] = (Math.random() - 0.5) * 0.25;
        }
      }

      house.smokeParticles.geometry.attributes.position.needsUpdate = true;
    }
  }

  public dispose(): void {
    this.stoneWallMat.dispose();
    this.timberPlankMat.dispose();
    this.timberBeamMat.dispose();
    this.floorMat.dispose();
    this.glassWindowMat.dispose();
    this.ironMat.dispose();
    this.hearthFireMat.dispose();
    this.cobblestoneMat.dispose();
  }
}
