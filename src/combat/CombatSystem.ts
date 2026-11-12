/**
 * ECHO – THE WORLD REMEMBERS
 * Dynamic Third-Person Combat System (نظام القتال الشامل والأعداء)
 *
 * Implements:
 * 1. Player Health & Energy System (شريط صحة اللاعب وطاقة الصدى)
 * 2. Basic Attack with Staff Combos (هجوم أساسي متسلسل)
 * 3. Directional Dodge Roll with i-Frames (تفادي الهجمات ومناورة سريعة)
 * 4. Magical ECHO PULSE Ability with Shockwave VFX (قدرة نبضة الصدى السحرية)
 * 5. Corrupted Wood Wraith Enemies (أطياف الخشب الفاسد المستوحاة من الصورة)
 * 6. Responsive Enemy AI State Machine (دوريات، مطاردة، هجوم قفز وسحق، تراجع، وموت)
 * 7. Death & Respawn Lifecycle (نظام الموت واستعادة الصدى عند المذابح)
 */

import * as THREE from 'three';
import { Terrain } from '../world/Terrain.ts';
import { Character } from '../player/Character.ts';
import { SoundSynth } from '../audio/SoundSynth.ts';

export interface CombatStats {
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  isInvulnerable: boolean;
  enemiesDefeated: number;
}

export type EnemyState = 'PATROL' | 'ALERT' | 'CHASE' | 'ATTACK_SLASH' | 'ATTACK_LEAP' | 'HURT' | 'DEAD';

// ========================================================
// 1. CORRUPTED WOOD WRAITH (طيف الخشب الفاسد)
// ========================================================
export class CorruptedWoodWraith {
  public group: THREE.Group;
  public id: string;
  public nameAr: string = 'طيف الخشب الفاسد';
  public nameEn: string = 'Corrupted Wood Wraith';

  public hp: number = 120;
  public maxHp: number = 120;
  public isDead: boolean = false;
  public state: EnemyState = 'PATROL';

  private anchorPos: THREE.Vector3;
  private patrolRadius: number = 16;
  private targetPatrolPos: THREE.Vector3;
  private stateTimer: number = 0;
  private attackCooldown: number = 0;

  // Visual sub-meshes matching reference image
  private bodyMesh: THREE.Mesh;
  private crownWood: THREE.Mesh;
  private eyeLeft: THREE.Mesh;
  private eyeRight: THREE.Mesh;
  private chestCore: THREE.Mesh;
  private leftArmGroup: THREE.Group;
  private rightArmGroup: THREE.Group;
  private leftClaw: THREE.Mesh;
  private rightClaw: THREE.Mesh;
  private leftLeg: THREE.Group;
  private rightLeg: THREE.Group;
  private coreLight: THREE.PointLight;
  private particles: THREE.Mesh[] = [];

  // Floating Health Bar
  private hpBarGroup: THREE.Group;
  private hpFillMesh: THREE.Mesh;

  // Hurt flash
  private hurtTimer: number = 0;
  private defaultBarkMat: THREE.MeshStandardMaterial;
  private flashMat: THREE.MeshBasicMaterial;

  constructor(private terrain: Terrain, spawnX: number, spawnZ: number, index: number) {
    this.id = `wraith_${index}`;
    this.anchorPos = new THREE.Vector3(spawnX, 0, spawnZ);
    this.targetPatrolPos = this.anchorPos.clone();

    this.group = new THREE.Group();
    this.group.name = `CorruptedWraith_${index}`;

    // Materials
    this.defaultBarkMat = new THREE.MeshStandardMaterial({
      color: 0x221a15, // Dark gnarled twisted ancient wood
      roughness: 0.95,
      metalness: 0.1,
    });
    const corruptedVineMat = new THREE.MeshStandardMaterial({
      color: 0x3d1c33,
      roughness: 0.85,
    });
    const corruptedGlowMat = new THREE.MeshStandardMaterial({
      color: 0xa855f7, // Deep luminous corruption violet
      emissive: 0x9333ea,
      emissiveIntensity: 2.2,
      roughness: 0.2,
    });
    this.flashMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Torso (Gnarled root trunk with hollow ribcage)
    const torsoGeom = new THREE.CylinderGeometry(0.35, 0.52, 1.6, 8);
    this.bodyMesh = new THREE.Mesh(torsoGeom, this.defaultBarkMat);
    this.bodyMesh.position.y = 1.35;
    this.bodyMesh.castShadow = true;
    this.group.add(this.bodyMesh);

    // Twisted Wood Crown / Hollow Hood
    const crownGeom = new THREE.ConeGeometry(0.48, 0.9, 8);
    crownGeom.rotateX(0.2);
    this.crownWood = new THREE.Mesh(crownGeom, this.defaultBarkMat);
    this.crownWood.position.set(0, 2.35, 0.1);
    this.crownWood.castShadow = true;
    this.group.add(this.crownWood);

    // Corrupted Glowing Amber/Purple Eyes
    const eyeGeom = new THREE.SphereGeometry(0.045, 8, 8);
    this.eyeLeft = new THREE.Mesh(eyeGeom, corruptedGlowMat);
    this.eyeLeft.position.set(-0.12, 2.2, 0.32);
    this.eyeRight = new THREE.Mesh(eyeGeom, corruptedGlowMat);
    this.eyeRight.position.set(0.12, 2.2, 0.32);
    this.group.add(this.eyeLeft, this.eyeRight);

    // Corrupted Chest Heart Core
    const coreGeom = new THREE.OctahedronGeometry(0.16, 0);
    this.chestCore = new THREE.Mesh(coreGeom, corruptedGlowMat);
    this.chestCore.position.set(0, 1.45, 0.32);
    this.group.add(this.chestCore);

    this.coreLight = new THREE.PointLight(0xa855f7, 2.0, 6.0);
    this.coreLight.position.set(0, 1.45, 0.4);
    this.group.add(this.coreLight);

    // Arms with Massive Gnarled Wood Claws
    const armGeom = new THREE.CylinderGeometry(0.08, 0.14, 1.4, 6);
    const clawGeom = new THREE.ConeGeometry(0.07, 0.65, 5);
    clawGeom.rotateX(Math.PI / 2);

    // Left Arm
    this.leftArmGroup = new THREE.Group();
    this.leftArmGroup.position.set(-0.55, 1.85, 0);
    const leftArmMesh = new THREE.Mesh(armGeom, this.defaultBarkMat);
    leftArmMesh.position.y = -0.65;
    leftArmMesh.castShadow = true;
    this.leftArmGroup.add(leftArmMesh);

    this.leftClaw = new THREE.Mesh(clawGeom, corruptedVineMat);
    this.leftClaw.position.set(0, -1.35, 0.25);
    this.leftArmGroup.add(this.leftClaw);
    this.group.add(this.leftArmGroup);

    // Right Arm (Primary striking claw)
    this.rightArmGroup = new THREE.Group();
    this.rightArmGroup.position.set(0.55, 1.85, 0);
    const rightArmMesh = new THREE.Mesh(armGeom, this.defaultBarkMat);
    rightArmMesh.position.y = -0.65;
    rightArmMesh.castShadow = true;
    this.rightArmGroup.add(rightArmMesh);

    this.rightClaw = new THREE.Mesh(clawGeom, corruptedVineMat);
    this.rightClaw.position.set(0, -1.35, 0.25);
    this.rightArmGroup.add(this.rightClaw);
    this.group.add(this.rightArmGroup);

    // Roots / Legs
    const legGeom = new THREE.CylinderGeometry(0.12, 0.09, 1.1, 6);
    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.25, 0.6, 0);
    const lLegMesh = new THREE.Mesh(legGeom, this.defaultBarkMat);
    lLegMesh.position.y = -0.55;
    lLegMesh.castShadow = true;
    this.leftLeg.add(lLegMesh);
    this.group.add(this.leftLeg);

    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.25, 0.6, 0);
    const rLegMesh = new THREE.Mesh(legGeom, this.defaultBarkMat);
    rLegMesh.position.y = -0.55;
    rLegMesh.castShadow = true;
    this.rightLeg.add(rLegMesh);
    this.group.add(this.rightLeg);

    // Corrupted floating embers / particles
    const partGeom = new THREE.DodecahedronGeometry(0.035, 0);
    for (let i = 0; i < 4; i++) {
      const p = new THREE.Mesh(partGeom, corruptedGlowMat);
      this.particles.push(p);
      this.group.add(p);
    }

    // Floating 3D Health Bar
    this.hpBarGroup = new THREE.Group();
    this.hpBarGroup.position.set(0, 2.9, 0);

    const bgGeom = new THREE.PlaneGeometry(1.2, 0.12);
    const bgMat = new THREE.MeshBasicMaterial({ color: 0x09090b, side: THREE.DoubleSide });
    const hpBg = new THREE.Mesh(bgGeom, bgMat);
    this.hpBarGroup.add(hpBg);

    const fillGeom = new THREE.PlaneGeometry(1.16, 0.08);
    fillGeom.translate(0.58, 0, 0); // Origin at left edge for scaling
    const fillMat = new THREE.MeshBasicMaterial({ color: 0xe11d48, side: THREE.DoubleSide });
    this.hpFillMesh = new THREE.Mesh(fillGeom, fillMat);
    this.hpFillMesh.position.set(-0.58, 0, 0.005);
    this.hpBarGroup.add(this.hpFillMesh);

    this.group.add(this.hpBarGroup);

    // Ground position
    const groundY = this.terrain.getHeightAt(spawnX, spawnZ);
    this.group.position.set(spawnX, groundY, spawnZ);
    this.pickPatrolTarget();
  }

  private pickPatrolTarget(): void {
    const angle = Math.random() * Math.PI * 2;
    const dist = 3.0 + Math.random() * (this.patrolRadius - 3.0);
    this.targetPatrolPos.set(
      this.anchorPos.x + Math.cos(angle) * dist,
      0,
      this.anchorPos.z + Math.sin(angle) * dist
    );
  }

  public update(dt: number, timeSec: number, playerPos: THREE.Vector3, cameraPos: THREE.Vector3): { attackDamage: number; hitPlayer: boolean } {
    let attackDamage = 0;
    let hitPlayer = false;

    if (this.isDead) {
      // Dissolving death animation
      this.group.position.y -= dt * 0.4;
      this.group.scale.multiplyScalar(Math.max(0, 1 - dt * 1.5));
      return { attackDamage: 0, hitPlayer: false };
    }

    // Always face health bar towards camera
    this.hpBarGroup.lookAt(cameraPos);

    // Hurt flash timer
    if (this.hurtTimer > 0) {
      this.hurtTimer -= dt;
      if (this.hurtTimer <= 0) {
        this.bodyMesh.material = this.defaultBarkMat;
      }
    }

    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
    }

    const distToPlayer = this.group.position.distanceTo(playerPos);

    // ==========================================
    // AI STATE MACHINE
    // ==========================================
    if (this.state === 'PATROL') {
      if (distToPlayer < 15.0) {
        this.state = 'ALERT';
        this.stateTimer = 0.6;
      } else {
        const cur2D = new THREE.Vector3(this.group.position.x, 0, this.group.position.z);
        const toTarget = this.targetPatrolPos.clone().sub(cur2D);
        const dist = toTarget.length();

        if (dist < 0.6) {
          this.pickPatrolTarget();
        } else {
          toTarget.normalize();
          this.group.position.x += toTarget.x * 1.8 * dt;
          this.group.position.z += toTarget.z * 1.8 * dt;

          const targetAngle = Math.atan2(toTarget.x, toTarget.z);
          this.smoothRotateY(targetAngle, 3.0 * dt);

          // Prowling walk cycle
          this.leftLeg.rotation.x = Math.sin(timeSec * 4.5) * 0.45;
          this.rightLeg.rotation.x = -Math.sin(timeSec * 4.5) * 0.45;
          this.leftArmGroup.rotation.x = -Math.sin(timeSec * 4.5) * 0.35;
          this.rightArmGroup.rotation.x = Math.sin(timeSec * 4.5) * 0.35;
        }
      }
    } else if (this.state === 'ALERT') {
      this.stateTimer -= dt;
      // Roar / Menacing posture facing player
      const toPlayer = playerPos.clone().sub(this.group.position);
      toPlayer.y = 0;
      this.smoothRotateY(Math.atan2(toPlayer.x, toPlayer.z), 6.0 * dt);

      this.leftArmGroup.rotation.x = THREE.MathUtils.lerp(this.leftArmGroup.rotation.x, -1.8, dt * 10);
      this.rightArmGroup.rotation.x = THREE.MathUtils.lerp(this.rightArmGroup.rotation.x, -1.8, dt * 10);
      this.crownWood.rotation.x = 0.4;

      if (this.stateTimer <= 0) {
        this.state = 'CHASE';
      }
    } else if (this.state === 'CHASE') {
      const toPlayer = playerPos.clone().sub(this.group.position);
      toPlayer.y = 0;
      const dist = toPlayer.length();

      if (dist > 28.0) {
        // Lost sight of player
        this.state = 'PATROL';
        this.pickPatrolTarget();
      } else if (dist <= 2.8 && this.attackCooldown <= 0) {
        // Melee slash
        this.state = 'ATTACK_SLASH';
        this.stateTimer = 0.55;
      } else if (dist >= 5.0 && dist <= 11.0 && this.attackCooldown <= 0 && Math.random() < 0.02) {
        // Leap strike matching reference image!
        this.state = 'ATTACK_LEAP';
        this.stateTimer = 0.85;
      } else {
        toPlayer.normalize();
        const speed = 5.4;
        this.group.position.x += toPlayer.x * speed * dt;
        this.group.position.z += toPlayer.z * speed * dt;

        this.smoothRotateY(Math.atan2(toPlayer.x, toPlayer.z), 7.0 * dt);

        // Aggressive stalking run
        const runFreq = 9.0;
        this.leftLeg.rotation.x = Math.sin(timeSec * runFreq) * 0.65;
        this.rightLeg.rotation.x = -Math.sin(timeSec * runFreq) * 0.65;
        this.leftArmGroup.rotation.x = -0.5 + Math.sin(timeSec * runFreq) * 0.45;
        this.rightArmGroup.rotation.x = -0.5 - Math.sin(timeSec * runFreq) * 0.45;
      }
    } else if (this.state === 'ATTACK_SLASH') {
      this.stateTimer -= dt;
      const progress = 1 - Math.max(0, this.stateTimer / 0.55);

      // Swing claw across
      this.rightArmGroup.rotation.x = -2.2 + progress * 3.6;
      this.rightArmGroup.rotation.z = -0.4 + Math.sin(progress * Math.PI) * 1.2;

      // Strike moment at 50% through animation
      if (progress > 0.45 && progress < 0.65 && distToPlayer <= 3.2) {
        attackDamage = 18;
        hitPlayer = true;
      }

      if (this.stateTimer <= 0) {
        this.state = 'CHASE';
        this.attackCooldown = 1.2;
      }
    } else if (this.state === 'ATTACK_LEAP') {
      this.stateTimer -= dt;
      const progress = 1 - Math.max(0, this.stateTimer / 0.85);

      // Leap upward and forward
      const leapY = Math.sin(progress * Math.PI) * 2.8;
      const baseGround = this.terrain.getHeightAt(this.group.position.x, this.group.position.z);
      this.group.position.y = baseGround + leapY;

      // Forward travel
      const toPlayer = playerPos.clone().sub(this.group.position);
      toPlayer.y = 0;
      if (toPlayer.lengthSq() > 0.1) {
        toPlayer.normalize();
        this.group.position.x += toPlayer.x * 6.5 * dt;
        this.group.position.z += toPlayer.z * 6.5 * dt;
        this.smoothRotateY(Math.atan2(toPlayer.x, toPlayer.z), 9.0 * dt);
      }

      // Reaching down with both claws spread
      this.leftArmGroup.rotation.x = -1.2 + Math.sin(progress * Math.PI) * 1.8;
      this.rightArmGroup.rotation.x = -1.2 + Math.sin(progress * Math.PI) * 1.8;

      // Slam impact on landing
      if (progress > 0.8 && progress < 0.95 && distToPlayer <= 3.6) {
        attackDamage = 28;
        hitPlayer = true;
      }

      if (this.stateTimer <= 0) {
        this.state = 'CHASE';
        this.attackCooldown = 1.8;
      }
    } else if (this.state === 'HURT') {
      this.stateTimer -= dt;
      // Stagger backward
      this.bodyMesh.rotation.x = THREE.MathUtils.lerp(this.bodyMesh.rotation.x, -0.45, dt * 14);
      if (this.stateTimer <= 0) {
        this.bodyMesh.rotation.x = 0;
        this.state = 'CHASE';
      }
    }

    // Keep grounded if not in leap
    if (this.state !== 'ATTACK_LEAP') {
      const groundY = this.terrain.getHeightAt(this.group.position.x, this.group.position.z);
      this.group.position.y = groundY;
    }

    // Chest core and eyes pulse
    this.chestCore.rotation.y = timeSec * 2.0;
    this.coreLight.intensity = 1.8 + Math.sin(timeSec * 5.0) * 0.6;

    // Orbiting corrupted embers
    this.particles.forEach((p, i) => {
      const angle = timeSec * 2.5 + (i * Math.PI) / 2;
      p.position.set(Math.cos(angle) * 0.65, 1.4 + Math.sin(timeSec * 3.5 + i) * 0.35, Math.sin(angle) * 0.65);
    });

    return { attackDamage, hitPlayer };
  }

  public takeDamage(dmg: number, knockbackDir?: THREE.Vector3): boolean {
    if (this.isDead) return false;

    this.hp = Math.max(0, this.hp - dmg);
    this.hurtTimer = 0.14;
    this.bodyMesh.material = this.flashMat;
    this.state = 'HURT';
    this.stateTimer = 0.35;

    // Update health bar fill scale
    const pct = Math.max(0, this.hp / this.maxHp);
    this.hpFillMesh.scale.x = pct;

    if (knockbackDir) {
      this.group.position.x += knockbackDir.x * 2.5;
      this.group.position.z += knockbackDir.z * 2.5;
    }

    if (this.hp <= 0) {
      this.isDead = true;
      this.state = 'DEAD';
      this.hpBarGroup.visible = false;
      return true; // Just died
    }
    return false;
  }

  public reset(): void {
    this.hp = this.maxHp;
    this.isDead = false;
    this.state = 'PATROL';
    this.stateTimer = 0;
    this.attackCooldown = 0;
    this.hurtTimer = 0;
    this.bodyMesh.material = this.defaultBarkMat;
    this.bodyMesh.rotation.set(0, 0, 0);
    this.leftArmGroup.rotation.set(0, 0, 0);
    this.rightArmGroup.rotation.set(0, 0, 0);
    this.group.position.copy(this.anchorPos);
    const groundY = this.terrain.getHeightAt(this.anchorPos.x, this.anchorPos.z);
    this.group.position.y = groundY;
    this.hpFillMesh.scale.x = 1;
    this.hpBarGroup.visible = false;
    this.group.scale.set(1, 1, 1);
  }

  private smoothRotateY(targetAngle: number, rate: number): void {
    let diff = targetAngle - this.group.rotation.y;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    this.group.rotation.y += diff * Math.min(1.0, rate);
  }
}

// ========================================================
// 2. COMBAT SYSTEM (MAIN MANAGER)
// ========================================================
export class CombatSystem {
  public group: THREE.Group;
  public enemies: CorruptedWoodWraith[] = [];

  // Player combat stats
  public playerHp: number = 100;
  public readonly playerMaxHp: number = 100;
  public playerEnergy: number = 100;
  public readonly playerMaxEnergy: number = 100;
  public isInvulnerable: boolean = false;
  public invulnerabilityTimer: number = 0;
  public enemiesDefeatedCount: number = 0;

  // Echo Pulse Shockwave Visual FX
  private pulseShockwaveMesh: THREE.Mesh;
  private pulseSphereMesh: THREE.Mesh;
  private pulseLight: THREE.PointLight;
  private isPulseActive: boolean = false;
  private pulseEffectTimer: number = 0;

  // Hit impact particle bursts
  private hitSparks: THREE.Points;
  private hitSparkPositions: Float32Array;
  private hitSparkVelocities: Float32Array;
  private hitSparkLife: Float32Array;
  private readonly maxSparks = 60;

  // Callbacks
  public onPlayerDamaged?: (hp: number, maxHp: number) => void;
  public onPlayerDied?: () => void;
  public onStatsChanged?: (stats: CombatStats) => void;

  constructor(
    private terrain: Terrain,
    private character: Character,
    private sound: SoundSynth
  ) {
    this.group = new THREE.Group();
    this.group.name = 'CombatSystem';

    // 1. Spawn Enemies matching the reference scene
    // Spawn 4 Corrupted Wood Wraiths across the Whispering Pine Forest and Ancient Temple path
    const enemySpawns = [
      { x: -42, z: 46 }, // Deep forest glade
      { x: -24, z: 54 }, // Pine hollow
      { x: -62, z: 32 }, // Temple valley approach
      { x: -50, z: 72 }, // Elder tree foothills
    ];

    enemySpawns.forEach((spawn, idx) => {
      const wraith = new CorruptedWoodWraith(this.terrain, spawn.x, spawn.z, idx + 1);
      this.enemies.push(wraith);
      this.group.add(wraith.group);
    });

    // 2. Create Echo Pulse VFX Mesh (Expanding Torus Ring + Energy Sphere)
    const shockwaveGeom = new THREE.RingGeometry(0.2, 0.75, 48);
    shockwaveGeom.rotateX(-Math.PI / 2);
    const shockwaveMat = new THREE.MeshBasicMaterial({
      color: 0x00f5d4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    this.pulseShockwaveMesh = new THREE.Mesh(shockwaveGeom, shockwaveMat);
    this.group.add(this.pulseShockwaveMesh);

    const sphereGeom = new THREE.SphereGeometry(1, 24, 16);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      wireframe: true,
    });
    this.pulseSphereMesh = new THREE.Mesh(sphereGeom, sphereMat);
    this.group.add(this.pulseSphereMesh);

    this.pulseLight = new THREE.PointLight(0x00f5d4, 0, 18);
    this.group.add(this.pulseLight);

    // 3. Create Hit Impact Spark Particles
    this.hitSparkPositions = new Float32Array(this.maxSparks * 3);
    this.hitSparkVelocities = new Float32Array(this.maxSparks * 3);
    this.hitSparkLife = new Float32Array(this.maxSparks);

    const sparkGeom = new THREE.BufferGeometry();
    sparkGeom.setAttribute('position', new THREE.BufferAttribute(this.hitSparkPositions, 3));

    const sparkMat = new THREE.PointsMaterial({
      color: 0x5eead4,
      size: 0.16,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    this.hitSparks = new THREE.Points(sparkGeom, sparkMat);
    this.group.add(this.hitSparks);
  }

  public update(dt: number, timeSec: number, cameraPos: THREE.Vector3): void {
    // 1. Invulnerability timer (dodge i-frames or post-damage grace)
    if (this.invulnerabilityTimer > 0) {
      this.invulnerabilityTimer -= dt;
      if (this.invulnerabilityTimer <= 0) {
        this.isInvulnerable = false;
      }
    }

    // 2. Natural Echo Energy regeneration
    if (this.playerEnergy < this.playerMaxEnergy) {
      this.playerEnergy = Math.min(this.playerMaxEnergy, this.playerEnergy + dt * 4.0);
    }

    // 3. Update Enemies
    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;

      const { attackDamage, hitPlayer } = enemy.update(dt, timeSec, this.character.position, cameraPos);

      // Check if enemy attack connects with player
      if (hitPlayer && attackDamage > 0) {
        this.applyDamageToPlayer(attackDamage);
      }
    }

    // 4. Update Echo Pulse VFX
    if (this.isPulseActive) {
      this.pulseEffectTimer -= dt;
      const progress = 1 - Math.max(0, this.pulseEffectTimer / 0.65);

      // Expanding rings and sphere
      const maxRadius = 11.5;
      const curRadius = progress * maxRadius;

      this.pulseShockwaveMesh.scale.set(curRadius, curRadius, curRadius);
      (this.pulseShockwaveMesh.material as THREE.MeshBasicMaterial).opacity = Math.sin(progress * Math.PI) * 0.95;

      this.pulseSphereMesh.scale.set(curRadius * 0.75, curRadius * 0.75, curRadius * 0.75);
      (this.pulseSphereMesh.material as THREE.MeshBasicMaterial).opacity = Math.sin(progress * Math.PI) * 0.65;

      this.pulseLight.intensity = Math.sin(progress * Math.PI) * 8.5;

      if (this.pulseEffectTimer <= 0) {
        this.isPulseActive = false;
        (this.pulseShockwaveMesh.material as THREE.MeshBasicMaterial).opacity = 0;
        (this.pulseSphereMesh.material as THREE.MeshBasicMaterial).opacity = 0;
        this.pulseLight.intensity = 0;
      }
    }

    // 5. Update Hit Sparks
    const posAttr = this.hitSparks.geometry.attributes.position as THREE.BufferAttribute;
    let anyAlive = false;
    for (let i = 0; i < this.maxSparks; i++) {
      if (this.hitSparkLife[i] > 0) {
        this.hitSparkLife[i] -= dt * 2.5;
        this.hitSparkPositions[i * 3 + 0] += this.hitSparkVelocities[i * 3 + 0] * dt;
        this.hitSparkPositions[i * 3 + 1] += this.hitSparkVelocities[i * 3 + 1] * dt;
        this.hitSparkPositions[i * 3 + 2] += this.hitSparkVelocities[i * 3 + 2] * dt;
        anyAlive = true;
      } else {
        this.hitSparkPositions[i * 3 + 1] = -999;
      }
    }
    if (anyAlive) {
      posAttr.needsUpdate = true;
    }
  }

  // ==========================================
  // PLAYER ATTACK EXECUTION
  // ==========================================

  /**
   * Executes player basic melee attack with staff arc
   */
  public executePlayerAttack(): boolean {
    if (this.character.isDead || this.character.isDodging) return false;

    const started = this.character.performAttack(this.character.attackComboStep + 1);
    if (!started) return false;

    this.sound.playAttackSwing(this.character.attackComboStep);

    // Hitbox detection: cone in front of player
    const playerPos = this.character.position;
    const playerFacing = this.character.getFacingDirection();
    const attackRange = 3.4;
    const damage = 35 + this.character.attackComboStep * 15;

    let hitAny = false;
    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;

      const toEnemy = enemy.group.position.clone().sub(playerPos);
      const dist = toEnemy.length();

      if (dist <= attackRange) {
        toEnemy.normalize();
        const dot = playerFacing.dot(toEnemy);

        // Within 120-degree cone
        if (dot > 0.35) {
          hitAny = true;
          const died = enemy.takeDamage(damage, toEnemy);
          this.sound.playEnemyHit();
          this.spawnHitSparks(enemy.group.position);

          // Award Echo Energy
          this.playerEnergy = Math.min(this.playerMaxEnergy, this.playerEnergy + 16);

          if (died) {
            this.enemiesDefeatedCount++;
            this.sound.playEnemyDeath();
          }
        }
      }
    }

    this.emitStatsChange();
    return true;
  }

  // ==========================================
  // PLAYER DODGE EXECUTION
  // ==========================================

  /**
   * Executes directional dodge roll with invulnerability frames
   */
  public executePlayerDodge(inputDir?: THREE.Vector2, cameraAngle?: number): boolean {
    if (this.character.isDead || this.character.isDodging) return false;

    let worldDir: THREE.Vector3 | undefined = undefined;
    if (inputDir && inputDir.lengthSq() > 0.01 && cameraAngle !== undefined) {
      const camForwardX = -Math.sin(cameraAngle);
      const camForwardZ = -Math.cos(cameraAngle);
      const camRightX = Math.cos(cameraAngle);
      const camRightZ = -Math.sin(cameraAngle);
      const dx = camForwardX * inputDir.y + camRightX * inputDir.x;
      const dz = camForwardZ * inputDir.y + camRightZ * inputDir.x;
      worldDir = new THREE.Vector3(dx, 0, dz).normalize();
    }

    const started = this.character.performDodge(worldDir);
    if (!started) return false;

    this.sound.playDodgeRoll();
    // Grant invulnerability frames for dodge duration (0.38s)
    this.isInvulnerable = true;
    this.invulnerabilityTimer = 0.38;

    this.emitStatsChange();
    return true;
  }

  // ==========================================
  // ECHO PULSE MAGICAL ABILITY
  // ==========================================

  /**
   * Unleashes the massive kinetic 360-degree ECHO PULSE shockwave
   */
  public executeEchoPulse(): boolean {
    if (this.character.isDead || this.character.isDodging) return false;

    const pulseCost = 40;
    if (this.playerEnergy < pulseCost) {
      return false; // Insufficient energy
    }

    this.playerEnergy -= pulseCost;
    this.character.performEchoPulse();
    this.sound.playEchoPulse();

    // Trigger visual VFX
    const staffPos = this.character.getStaffWorldPosition();
    this.pulseShockwaveMesh.position.copy(this.character.position);
    this.pulseShockwaveMesh.position.y += 0.12;
    this.pulseSphereMesh.position.copy(staffPos);
    this.pulseLight.position.copy(staffPos);

    this.isPulseActive = true;
    this.pulseEffectTimer = 0.65;

    // AOE Damage & Knockback to all enemies within 10.5m
    const pulseRadius = 10.5;
    const pulseDamage = 75;

    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;

      const toEnemy = enemy.group.position.clone().sub(this.character.position);
      const dist = toEnemy.length();

      if (dist <= pulseRadius) {
        toEnemy.y = 0;
        toEnemy.normalize();
        const died = enemy.takeDamage(pulseDamage, toEnemy.multiplyScalar(2.2));
        this.spawnHitSparks(enemy.group.position, 20);

        if (died) {
          this.enemiesDefeatedCount++;
          this.sound.playEnemyDeath();
        }
      }
    }

    this.emitStatsChange();
    return true;
  }

  // ==========================================
  // PLAYER DAMAGE & DEATH
  // ==========================================

  public applyDamageToPlayer(amount: number): void {
    if (this.character.isDead || this.isInvulnerable) return;

    this.playerHp = Math.max(0, this.playerHp - amount);
    this.sound.playPlayerHurt();

    // Brief grace period
    this.isInvulnerable = true;
    this.invulnerabilityTimer = 0.65;

    if (this.onPlayerDamaged) {
      this.onPlayerDamaged(this.playerHp, this.playerMaxHp);
    }
    this.emitStatsChange();

    if (this.playerHp <= 0) {
      this.handlePlayerDeath();
    }
  }

  private handlePlayerDeath(): void {
    this.character.die();
    this.sound.playPlayerDeath();

    if (this.onPlayerDied) {
      this.onPlayerDied();
    }
  }

  public respawnPlayer(respawnPos: THREE.Vector3): void {
    this.playerHp = this.playerMaxHp;
    this.playerEnergy = this.playerMaxEnergy;
    this.isInvulnerable = true;
    this.invulnerabilityTimer = 2.0;

    this.character.respawn(respawnPos);
    this.sound.playPlayerRespawn();

    this.emitStatsChange();
  }

  public resetAll(): void {
    this.playerHp = this.playerMaxHp;
    this.playerEnergy = this.playerMaxEnergy;
    this.isInvulnerable = false;
    this.invulnerabilityTimer = 0;
    this.enemiesDefeatedCount = 0;
    this.isPulseActive = false;
    this.pulseEffectTimer = 0;
    this.enemies.forEach((enemy) => enemy.reset());
    this.emitStatsChange();
  }

  public restoreFullHealth(): void {
    this.playerHp = this.playerMaxHp;
    this.playerEnergy = this.playerMaxEnergy;
    this.emitStatsChange();
  }

  // ==========================================
  // VISUAL EFFECTS
  // ==========================================

  private spawnHitSparks(pos: THREE.Vector3, count: number = 10): void {
    let spawned = 0;
    for (let i = 0; i < this.maxSparks && spawned < count; i++) {
      if (this.hitSparkLife[i] <= 0) {
        this.hitSparkLife[i] = 1.0;
        this.hitSparkPositions[i * 3 + 0] = pos.x;
        this.hitSparkPositions[i * 3 + 1] = pos.y + 1.2;
        this.hitSparkPositions[i * 3 + 2] = pos.z;

        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const speed = 2.5 + Math.random() * 4.0;
        this.hitSparkVelocities[i * 3 + 0] = Math.sin(phi) * Math.cos(theta) * speed;
        this.hitSparkVelocities[i * 3 + 1] = Math.cos(phi) * speed + 1.5;
        this.hitSparkVelocities[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * speed;

        spawned++;
      }
    }
  }

  public getStats(): CombatStats {
    return {
      hp: this.playerHp,
      maxHp: this.playerMaxHp,
      energy: this.playerEnergy,
      maxEnergy: this.playerMaxEnergy,
      isInvulnerable: this.isInvulnerable,
      enemiesDefeated: this.enemiesDefeatedCount,
    };
  }

  private emitStatsChange(): void {
    if (this.onStatsChanged) {
      this.onStatsChanged(this.getStats());
    }
  }
}
