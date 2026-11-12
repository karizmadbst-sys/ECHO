/**
 * ECHO – THE WORLD REMEMBERS
 * Third-Person Character: "The Spirit Guide Explorer"
 * Inspired by the reference design: dark topknot bun, royal blue capelet,
 * cream adventurer tunic, cross-body leather satchel, fur-trimmed hiking boots,
 * and carved mystic staff with orbiting spirit wisp.
 */

import * as THREE from 'three';
import { Terrain } from '../world/Terrain.ts';
import { WorldObstacle } from '../world/Forest.ts';

export class Character {
  public group: THREE.Group;
  public position: THREE.Vector3;
  public velocity: THREE.Vector3;
  public isGrounded: boolean = true;
  public isMoving: boolean = false;
  public isSprinting: boolean = false;
  public isRunningInPlace: boolean = false;
  public isFirstPerson: boolean = false;

  // Collision radius
  public readonly radius = 0.55;

  // Visual sub-meshes for animation & secondary motion
  private characterPivot: THREE.Group;
  private headGroup: THREE.Group;
  private hairBun: THREE.Mesh;
  private capeletGroup: THREE.Group;
  private capeletTails: THREE.Mesh;
  private torsoGroup: THREE.Group;
  private leftLeg: THREE.Group;
  private rightLeg: THREE.Group;
  private leftArm: THREE.Group;
  private rightArm: THREE.Group;
  private staffGroup: THREE.Group;
  private staffCrystal: THREE.Mesh;
  private staffLight: THREE.PointLight;
  private spiritCompanion: THREE.Group;
  private shadowDisc: THREE.Mesh;
  private slashArcMesh!: THREE.Mesh;

  // Combat States & Timers
  public isAttacking: boolean = false;
  public attackTimer: number = 0;
  public attackComboStep: number = 0;
  public isDodging: boolean = false;
  public dodgeTimer: number = 0;
  public isCastingPulse: boolean = false;
  public pulseTimer: number = 0;
  public isDead: boolean = false;

  // Movement physics variables
  private walkSpeed = 6.8;
  private sprintSpeed = 12.8;
  private jumpForce = 10.8;
  private gravity = 26.0;
  private verticalVelocity = 0;
  public currentFacingAngle = 0;
  private targetFacingAngle = 0;
  private animTime = 0;

  // Coyote time & jump buffering
  private coyoteTimer = 0;
  private readonly maxCoyoteTime = 0.12;

  constructor(spawnPos: THREE.Vector3) {
    this.group = new THREE.Group();
    this.position = spawnPos.clone();
    this.velocity = new THREE.Vector3();
    this.group.position.copy(this.position);

    // Root pivot for character mesh
    this.characterPivot = new THREE.Group();
    this.group.add(this.characterPivot);

    // Magical Weapon Slash Arc
    const arcGeom = new THREE.RingGeometry(0.65, 1.45, 24, 1, 0, Math.PI * 0.85);
    const arcMat = new THREE.MeshBasicMaterial({
      color: 0x00f5d4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    this.slashArcMesh = new THREE.Mesh(arcGeom, arcMat);
    this.slashArcMesh.rotation.x = Math.PI / 2;
    this.slashArcMesh.position.set(0, 0.95, 0.45);
    this.characterPivot.add(this.slashArcMesh);

    // 1. Materials Palette matching the reference image
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xdeb887, // Natural warm tan skin tone
      roughness: 0.75,
      metalness: 0.05,
    });

    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x181414, // Dark jet hair
      roughness: 0.6,
      metalness: 0.1,
    });

    const hairTieMat = new THREE.MeshStandardMaterial({
      color: 0x2a9d8f, // Turquoise hair tie
      roughness: 0.5,
    });

    const capeletMat = new THREE.MeshStandardMaterial({
      color: 0x1b4965, // Royal navy blue shawl/capelet
      roughness: 0.7,
      metalness: 0.15,
      side: THREE.DoubleSide,
    });

    const tunicMat = new THREE.MeshStandardMaterial({
      color: 0xede0d4, // Cream/beige adventurer tunic
      roughness: 0.8,
      metalness: 0.05,
    });

    const trimMat = new THREE.MeshStandardMaterial({
      color: 0x7f5539, // Leather border trim
      roughness: 0.85,
    });

    const leatherMat = new THREE.MeshStandardMaterial({
      color: 0x3d2616, // Dark leather satchel & belt
      roughness: 0.85,
      metalness: 0.1,
    });

    const pantsMat = new THREE.MeshStandardMaterial({
      color: 0x232020, // Dark espresso fitted trousers
      roughness: 0.85,
    });

    const bootMat = new THREE.MeshStandardMaterial({
      color: 0x4a3220, // Hiking boots
      roughness: 0.85,
    });

    const furCuffMat = new THREE.MeshStandardMaterial({
      color: 0xc8b6a6, // Light fur/fabric boot cuff
      roughness: 0.95,
    });

    const staffWoodMat = new THREE.MeshStandardMaterial({
      color: 0x402b1d, // Carved dark wood
      roughness: 0.85,
    });

    const crystalGlowMat = new THREE.MeshStandardMaterial({
      color: 0x00f5d4,
      emissive: 0x00f5d4,
      emissiveIntensity: 1.6,
      roughness: 0.15,
      metalness: 0.8,
    });

    // 2. Torso & Adventurer Tunic
    this.torsoGroup = new THREE.Group();
    this.torsoGroup.position.y = 0.95;
    this.characterPivot.add(this.torsoGroup);

    // Main Tunic Body
    const tunicGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.72, 10);
    const tunic = new THREE.Mesh(tunicGeo, tunicMat);
    tunic.position.y = 0.36;
    tunic.castShadow = true;
    this.torsoGroup.add(tunic);

    // Tunic Lower Skirt Flare
    const skirtGeo = new THREE.CylinderGeometry(0.28, 0.33, 0.28, 10);
    const skirt = new THREE.Mesh(skirtGeo, tunicMat);
    skirt.position.y = 0.06;
    skirt.castShadow = true;
    this.torsoGroup.add(skirt);

    // Leather Belt & Buckle
    const beltGeo = new THREE.CylinderGeometry(0.27, 0.275, 0.08, 10);
    const belt = new THREE.Mesh(beltGeo, leatherMat);
    belt.position.y = 0.22;
    this.torsoGroup.add(belt);

    const buckleGeo = new THREE.BoxGeometry(0.08, 0.06, 0.04);
    const buckleMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, metalness: 0.8, roughness: 0.3 });
    const buckle = new THREE.Mesh(buckleGeo, buckleMat);
    buckle.position.set(0, 0.22, 0.27);
    this.torsoGroup.add(buckle);

    // 3. Cross-Body Messenger Satchel (from right shoulder across back to left hip)
    const strapGeo = new THREE.TorusGeometry(0.32, 0.025, 6, 24);
    const strap = new THREE.Mesh(strapGeo, leatherMat);
    strap.position.set(0.02, 0.42, 0.04);
    strap.rotation.set(0.35, 0.45, 0.75);
    this.torsoGroup.add(strap);

    // Satchel Pouch resting on back-left hip
    const pouchGeo = new THREE.BoxGeometry(0.18, 0.2, 0.12);
    const pouch = new THREE.Mesh(pouchGeo, leatherMat);
    pouch.position.set(-0.25, 0.14, -0.15);
    pouch.rotation.set(0.1, 0.3, -0.15);
    pouch.castShadow = true;
    this.torsoGroup.add(pouch);

    // 4. Blue Capelet / Shawl over Shoulders
    this.capeletGroup = new THREE.Group();
    this.capeletGroup.position.set(0, 0.65, 0);
    this.torsoGroup.add(this.capeletGroup);

    // Upper shoulder mantle wrap
    const mantleGeo = new THREE.CylinderGeometry(0.28, 0.36, 0.24, 10);
    const mantle = new THREE.Mesh(mantleGeo, capeletMat);
    mantle.position.y = 0.02;
    mantle.castShadow = true;
    this.capeletGroup.add(mantle);

    // Flowing Capelet Tails down the back
    const capeTailGeo = new THREE.PlaneGeometry(0.38, 0.58, 4, 6);
    this.capeletTails = new THREE.Mesh(capeTailGeo, capeletMat);
    this.capeletTails.position.set(0, -0.22, -0.24);
    this.capeletTails.castShadow = true;
    this.capeletGroup.add(this.capeletTails);

    // 5. Head, Neck & Topknot Hairstyle
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.78, 0);
    this.torsoGroup.add(this.headGroup);

    // Neck
    const neckGeo = new THREE.CylinderGeometry(0.09, 0.1, 0.14, 8);
    const neck = new THREE.Mesh(neckGeo, skinMat);
    neck.position.y = 0.04;
    this.headGroup.add(neck);

    // Head
    const headGeo = new THREE.SphereGeometry(0.18, 16, 14);
    headGeo.scale(1, 1.15, 1.05);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 0.22;
    head.castShadow = true;
    this.headGroup.add(head);

    // Hair cap / volume
    const hairCapGeo = new THREE.SphereGeometry(0.19, 14, 12);
    hairCapGeo.scale(1.02, 1.12, 1.08);
    const hairCap = new THREE.Mesh(hairCapGeo, hairMat);
    hairCap.position.set(0, 0.24, -0.02);
    hairCap.castShadow = true;
    this.headGroup.add(hairCap);

    // Topknot Bun on top of head
    const bunGeo = new THREE.DodecahedronGeometry(0.11, 1);
    this.hairBun = new THREE.Mesh(bunGeo, hairMat);
    this.hairBun.position.set(0, 0.44, -0.06);
    this.hairBun.castShadow = true;
    this.headGroup.add(this.hairBun);

    // Hair Tie Band
    const tieGeo = new THREE.TorusGeometry(0.08, 0.025, 8, 16);
    const hairTie = new THREE.Mesh(tieGeo, hairTieMat);
    hairTie.position.set(0, 0.38, -0.06);
    hairTie.rotation.x = Math.PI / 2;
    this.headGroup.add(hairTie);

    // 6. Articulated Legs & Hiking Boots
    this.leftLeg = this.createLeg(pantsMat, bootMat, furCuffMat);
    this.leftLeg.position.set(-0.13, 0.1, 0);
    this.torsoGroup.add(this.leftLeg);

    this.rightLeg = this.createLeg(pantsMat, bootMat, furCuffMat);
    this.rightLeg.position.set(0.13, 0.1, 0);
    this.torsoGroup.add(this.rightLeg);

    // 7. Articulated Arms
    this.leftArm = this.createArm(skinMat, tunicMat);
    this.leftArm.position.set(-0.32, 0.62, 0);
    this.torsoGroup.add(this.leftArm);

    this.rightArm = this.createArm(skinMat, tunicMat);
    this.rightArm.position.set(0.32, 0.62, 0);
    this.torsoGroup.add(this.rightArm);

    // 8. Forged Island Echo 3D Sword securely socketed in the Right Hand
    // Socket positioned precisely at the palm/hand center (y = -0.58)
    // Angled forward-downward (-78° on X, +10° Y, +12° Z) for a heroic combat-ready stance
    this.staffGroup = new THREE.Group();
    this.staffGroup.name = 'RightHandSwordSocket';
    this.staffGroup.position.set(0.0, -0.58, 0.02);
    this.staffGroup.rotation.set(-Math.PI * 0.44, 0.12, 0.18);

    // High quality metallic sword materials
    const bladeSteelMat = new THREE.MeshStandardMaterial({
      color: 0xe2ecf4,
      metalness: 0.96,
      roughness: 0.16,
    });

    const guardBrassMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37, // Rich antique gold / brass
      metalness: 0.90,
      roughness: 0.25,
    });

    const gripLeatherMat = new THREE.MeshStandardMaterial({
      color: 0x1e1510, // Stitched dark leather
      roughness: 0.85,
      metalness: 0.05,
    });

    const fullerMat = new THREE.MeshStandardMaterial({
      color: 0x1a2632, // Darkened tempered steel groove
      metalness: 0.95,
      roughness: 0.3,
    });

    const gemMat = new THREE.MeshStandardMaterial({
      color: 0x00f5d4,
      emissive: 0x00f5d4,
      emissiveIntensity: 2.2,
      roughness: 0.1,
      metalness: 0.9,
    });

    // Sword Pommel (faceted brass counter-weight ball with engraved ring)
    const pommelGeo = new THREE.DodecahedronGeometry(0.038, 0);
    const pommel = new THREE.Mesh(pommelGeo, guardBrassMat);
    pommel.position.y = -0.11;
    pommel.castShadow = true;
    this.staffGroup.add(pommel);

    const pommelRingGeo = new THREE.TorusGeometry(0.032, 0.006, 6, 12);
    const pommelRing = new THREE.Mesh(pommelRingGeo, guardBrassMat);
    pommelRing.position.y = -0.14;
    pommelRing.rotation.x = Math.PI / 2;
    this.staffGroup.add(pommelRing);

    // Sword Handle / Hilt Grip (leather wrapped cylinder held inside hand palm)
    // Centered at y = 0.0 so hand sphere at y = -0.58 directly wraps around the grip
    const gripGeo = new THREE.CylinderGeometry(0.021, 0.023, 0.18, 12);
    const grip = new THREE.Mesh(gripGeo, gripLeatherMat);
    grip.position.y = 0.0;
    grip.castShadow = true;
    this.staffGroup.add(grip);

    // Gold wire winding ribs on the leather grip for authentic tactile look
    const ringGeo = new THREE.TorusGeometry(0.023, 0.0035, 6, 14);
    for (let r = 0; r < 4; r++) {
      const ring = new THREE.Mesh(ringGeo, guardBrassMat);
      ring.position.y = -0.06 + r * 0.04;
      ring.rotation.x = Math.PI / 2;
      this.staffGroup.add(ring);
    }

    // Cross-guard (sculpted curved cross-piece protecting the hand)
    const crossGuardGeo = new THREE.BoxGeometry(0.26, 0.036, 0.062);
    const crossGuard = new THREE.Mesh(crossGuardGeo, guardBrassMat);
    crossGuard.position.y = 0.095;
    crossGuard.castShadow = true;
    this.staffGroup.add(crossGuard);

    // Cross-guard quillon tips (tapered swept outer wingtips)
    const quillonGeo = new THREE.ConeGeometry(0.022, 0.065, 6);
    const quillonLeft = new THREE.Mesh(quillonGeo, guardBrassMat);
    quillonLeft.position.set(-0.13, 0.105, 0);
    quillonLeft.rotation.z = Math.PI / 2 + 0.35;
    const quillonRight = new THREE.Mesh(quillonGeo, guardBrassMat);
    quillonRight.position.set(0.13, 0.105, 0);
    quillonRight.rotation.z = -Math.PI / 2 - 0.35;
    this.staffGroup.add(quillonLeft, quillonRight);

    // Glowing ancient rune gem set in the center of the cross-guard
    const guardGemGeo = new THREE.OctahedronGeometry(0.025, 0);
    this.staffCrystal = new THREE.Mesh(guardGemGeo, gemMat);
    this.staffCrystal.position.set(0, 0.095, 0.034);
    this.staffGroup.add(this.staffCrystal);

    // Sword Blade (dual-edged beveled long steel blade extending forward)
    const bladeGeo = new THREE.BoxGeometry(0.064, 0.82, 0.016);
    const blade = new THREE.Mesh(bladeGeo, bladeSteelMat);
    blade.position.y = 0.51;
    blade.castShadow = true;
    this.staffGroup.add(blade);

    // Central Fuller Groove along blade
    const fullerGeo = new THREE.BoxGeometry(0.016, 0.62, 0.02);
    const fuller = new THREE.Mesh(fullerGeo, fullerMat);
    fuller.position.y = 0.44;
    this.staffGroup.add(fuller);

    // Blade Point / Tip (sharp triangular steel crest)
    const bladeTipGeo = new THREE.ConeGeometry(0.045, 0.15, 4);
    bladeTipGeo.rotateY(Math.PI / 4);
    const bladeTip = new THREE.Mesh(bladeTipGeo, bladeSteelMat);
    bladeTip.position.y = 0.99;
    bladeTip.castShadow = true;
    this.staffGroup.add(bladeTip);

    // Magical blade luminescence point light
    this.staffLight = new THREE.PointLight(0x00f5d4, 1.4, 4.5);
    this.staffLight.position.set(0, 0.55, 0.04);
    this.staffGroup.add(this.staffLight);

    // Attach sword socket directly to the right arm hand bone
    this.rightArm.add(this.staffGroup);

    // 9. Forest Spirit Companion (Small wisp following the player)
    this.spiritCompanion = new THREE.Group();
    const spiritBodyGeo = new THREE.SphereGeometry(0.13, 12, 10);
    const spiritMat = new THREE.MeshStandardMaterial({
      color: 0x1b1c1e, // Dark soot sprite body
      roughness: 0.9,
    });
    const spiritBody = new THREE.Mesh(spiritBodyGeo, spiritMat);
    this.spiritCompanion.add(spiritBody);

    // Spirit glowing big eyes
    const eyeGeo = new THREE.SphereGeometry(0.035, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.045, 0.03, 0.11);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.045, 0.03, 0.11);
    this.spiritCompanion.add(eyeL, eyeR);

    // Little leaf on spirit's head
    const leafGeo = new THREE.ConeGeometry(0.05, 0.1, 4);
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x52b788 });
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.position.y = 0.14;
    leaf.rotation.z = 0.3;
    this.spiritCompanion.add(leaf);

    this.spiritCompanion.position.set(-0.45, 1.1, -0.35);
    this.characterPivot.add(this.spiritCompanion);

    // 10. Contact Shadow Disc beneath feet
    const shadowGeo = new THREE.CircleGeometry(0.65, 18);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.36,
      depthWrite: false,
    });
    this.shadowDisc = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadowDisc.position.y = 0.02;
    this.group.add(this.shadowDisc);
  }

  private createLeg(pantsMat: THREE.Material, bootMat: THREE.Material, cuffMat: THREE.Material): THREE.Group {
    const group = new THREE.Group();

    // Thigh / upper leg
    const thighGeo = new THREE.CylinderGeometry(0.11, 0.095, 0.42, 8);
    const thigh = new THREE.Mesh(thighGeo, pantsMat);
    thigh.position.y = -0.21;
    thigh.castShadow = true;
    group.add(thigh);

    // Lower calf
    const calfGeo = new THREE.CylinderGeometry(0.095, 0.08, 0.38, 8);
    const calf = new THREE.Mesh(calfGeo, pantsMat);
    calf.position.y = -0.56;
    calf.castShadow = true;
    group.add(calf);

    // Fur / fabric boot cuff
    const cuffGeo = new THREE.CylinderGeometry(0.125, 0.11, 0.09, 8);
    const cuff = new THREE.Mesh(cuffGeo, cuffMat);
    cuff.position.y = -0.68;
    cuff.castShadow = true;
    group.add(cuff);

    // Boot
    const bootGeo = new THREE.BoxGeometry(0.14, 0.18, 0.28);
    const boot = new THREE.Mesh(bootGeo, bootMat);
    boot.position.set(0, -0.82, 0.05);
    boot.castShadow = true;
    group.add(boot);

    return group;
  }

  private createArm(skinMat: THREE.Material, sleeveMat: THREE.Material): THREE.Group {
    const group = new THREE.Group();

    // Upper sleeve shoulder
    const sleeveGeo = new THREE.CylinderGeometry(0.1, 0.09, 0.24, 8);
    const sleeve = new THREE.Mesh(sleeveGeo, sleeveMat);
    sleeve.position.y = -0.12;
    sleeve.castShadow = true;
    group.add(sleeve);

    // Forearm & hand
    const armGeo = new THREE.CylinderGeometry(0.075, 0.065, 0.38, 8);
    const arm = new THREE.Mesh(armGeo, skinMat);
    arm.position.y = -0.38;
    arm.castShadow = true;
    group.add(arm);

    const handGeo = new THREE.SphereGeometry(0.065, 8, 8);
    const hand = new THREE.Mesh(handGeo, skinMat);
    hand.position.y = -0.58;
    hand.castShadow = true;
    group.add(hand);

    return group;
  }

  /**
   * Jump action with coyote time
   */
  public jump(): boolean {
    if (this.isGrounded || this.coyoteTimer > 0) {
      this.verticalVelocity = this.jumpForce;
      this.isGrounded = false;
      this.coyoteTimer = 0;
      return true;
    }
    return false;
  }

  /**
   * Main movement update per frame with continuous collision handling
   */
  public update(
    dt: number,
    moveInput: THREE.Vector2, // Normalized x (-1 to 1: Strafe), y (-1 to 1: Forward/Back)
    cameraAngle: number,
    sprint: boolean,
    terrain: Terrain,
    obstacles: WorldObstacle[]
  ): void {
    const clampedDt = Math.min(dt, 0.05);
    const hasInput = moveInput.lengthSq() > 0.001;
    this.isSprinting = sprint;
    this.isRunningInPlace = sprint && !hasInput && !this.isDodging && !this.isDead;

    // 0. Dead state
    if (this.isDead) {
      this.velocity.x *= 0.85;
      this.velocity.z *= 0.85;
      const groundHeight = terrain.getHeightAt(this.position.x, this.position.z);
      this.position.y = THREE.MathUtils.lerp(this.position.y, groundHeight, clampedDt * 10);
      this.group.position.copy(this.position);
      this.animateCharacter(clampedDt, false, false, true);
      return;
    }

    // Update combat timers
    if (this.isDodging) {
      this.dodgeTimer -= clampedDt;
      if (this.dodgeTimer <= 0) {
        this.isDodging = false;
        this.characterPivot.rotation.x = 0;
      }
    }
    if (this.isAttacking) {
      this.attackTimer -= clampedDt;
      if (this.attackTimer <= 0) {
        this.isAttacking = false;
        (this.slashArcMesh.material as THREE.MeshBasicMaterial).opacity = 0;
      }
    }
    if (this.isCastingPulse) {
      this.pulseTimer -= clampedDt;
      if (this.pulseTimer <= 0) {
        this.isCastingPulse = false;
      }
    }

    // 1. Calculate intended movement direction relative to camera facing
    this.isMoving = hasInput && !this.isDodging;

    const currentSpeed = (this.isSprinting ? this.sprintSpeed : this.walkSpeed) * (this.isGrounded ? 1.0 : 0.88);

    if (this.isDodging) {
      // During dodge, momentum carries the player forward at high speed
      this.velocity.x -= this.velocity.x * Math.min(1, 3.5 * clampedDt);
      this.velocity.z -= this.velocity.z * Math.min(1, 3.5 * clampedDt);
    } else if (hasInput) {
      // Camera Forward and Camera Right horizontal vectors (ignoring vertical Y axis)
      const camForwardX = -Math.sin(cameraAngle);
      const camForwardZ = -Math.cos(cameraAngle);

      const camRightX = Math.cos(cameraAngle);
      const camRightZ = -Math.sin(cameraAngle);

      // Map moveInput (y = forward/backward, x = right/left) relative to camera perspective
      const moveX = camForwardX * moveInput.y + camRightX * moveInput.x;
      const moveZ = camForwardZ * moveInput.y + camRightZ * moveInput.x;

      const moveLen = Math.hypot(moveX, moveZ);
      const moveDirX = moveLen > 0.0001 ? moveX / moveLen : 0;
      const moveDirZ = moveLen > 0.0001 ? moveZ / moveLen : 0;

      // Smoothly orient the character towards the target movement direction
      this.targetFacingAngle = Math.atan2(moveDirX, moveDirZ);

      // Acceleration towards desired speed
      const accelRate = this.isGrounded ? 24.0 : 9.0;
      this.velocity.x += (moveDirX * currentSpeed - this.velocity.x) * Math.min(1, accelRate * clampedDt);
      this.velocity.z += (moveDirZ * currentSpeed - this.velocity.z) * Math.min(1, accelRate * clampedDt);

      // Smooth facing angle interpolation (shortest angular path)
      let angleDiff = this.targetFacingAngle - this.currentFacingAngle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      this.currentFacingAngle += angleDiff * Math.min(1, (this.isFirstPerson ? 32.0 : 16.0) * clampedDt);
      this.characterPivot.rotation.y = this.currentFacingAngle;

      // Slight banking lean in the direction of turn
      this.characterPivot.rotation.z = -angleDiff * (this.isSprinting ? 0.25 : 0.12);
    } else {
      // In first-person mode when standing still, turn body with camera view
      if (this.isFirstPerson) {
        this.targetFacingAngle = cameraAngle + Math.PI;
        let angleDiff = this.targetFacingAngle - this.currentFacingAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        this.currentFacingAngle += angleDiff * Math.min(1, 30.0 * clampedDt);
        this.characterPivot.rotation.y = this.currentFacingAngle;
      }
      // Decelerate friction
      const frictionRate = this.isGrounded ? 18.0 : 4.0;
      this.velocity.x -= this.velocity.x * Math.min(1, frictionRate * clampedDt);
      this.velocity.z -= this.velocity.z * Math.min(1, frictionRate * clampedDt);
      this.characterPivot.rotation.z = THREE.MathUtils.lerp(this.characterPivot.rotation.z, 0, clampedDt * 10);
    }

    // 2. Apply horizontal movement with sub-step sliding collision
    let newX = this.position.x + this.velocity.x * clampedDt;
    let newZ = this.position.z + this.velocity.z * clampedDt;

    // 3. Multi-pass Obstacle Collision Resolution (boulders, trees, temple columns, altar)
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < obstacles.length; i++) {
        const obs = obstacles[i];
        const dx = newX - obs.x;
        const dz = newZ - obs.z;
        const minDist = this.radius + obs.radius;
        const distSq = dx * dx + dz * dz;

        if (distSq < minDist * minDist && distSq > 0.00001) {
          const dist = Math.sqrt(distSq);
          const overlap = minDist - dist;
          // Normal push-out
          const nx = dx / dist;
          const nz = dz / dist;
          newX += nx * overlap;
          newZ += nz * overlap;

          // Slide velocity along collision surface
          const dot = this.velocity.x * nx + this.velocity.z * nz;
          if (dot < 0) {
            this.velocity.x -= dot * nx;
            this.velocity.z -= dot * nz;
          }
        }
      }
    }

    // 4. Perimeter Boundary Check (Keep inside island radius)
    const distFromOrigin = Math.sqrt(newX * newX + newZ * newZ);
    const maxIslandRadius = 222;
    if (distFromOrigin > maxIslandRadius) {
      const angle = Math.atan2(newZ, newX);
      newX = Math.cos(angle) * maxIslandRadius;
      newZ = Math.sin(angle) * maxIslandRadius;
      this.velocity.set(0, 0, 0);
    }

    this.position.x = newX;
    this.position.z = newZ;

    // 5. Vertical Physics & Terrain Height Clamping
    const groundHeight = terrain.getHeightAt(this.position.x, this.position.z);

    if (!this.isGrounded) {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - clampedDt);
      this.verticalVelocity -= this.gravity * clampedDt;
      this.position.y += this.verticalVelocity * clampedDt;

      // Landing detection
      if (this.position.y <= groundHeight) {
        this.position.y = groundHeight;
        this.verticalVelocity = 0;
        this.isGrounded = true;
        this.coyoteTimer = 0;
      }
    } else {
      // Check if walking off an edge/cliff
      const heightDiff = groundHeight - this.position.y;
      if (heightDiff < -0.8) {
        // Step-down into free-fall
        this.isGrounded = false;
        this.coyoteTimer = this.maxCoyoteTime;
      } else {
        // Adhere smoothly to slopes (max climbable step)
        this.position.y = THREE.MathUtils.lerp(this.position.y, groundHeight, Math.min(1, 28.0 * clampedDt));
        this.coyoteTimer = this.maxCoyoteTime;
      }
    }

    this.group.position.copy(this.position);

    // 6. Character Procedural Animations
    this.animateCharacter(clampedDt, hasInput, this.isSprinting, this.isGrounded);
  }

  private animateCharacter(dt: number, isMoving: boolean, isSprinting: boolean, isGrounded: boolean): void {
    if (this.isDead) {
      // Defeated collapse posture
      this.characterPivot.rotation.x = THREE.MathUtils.lerp(this.characterPivot.rotation.x, -Math.PI / 2.2, dt * 10);
      this.torsoGroup.position.y = THREE.MathUtils.lerp(this.torsoGroup.position.y, 0.2, dt * 10);
      this.leftArm.rotation.set(0.4, 0, 0.3);
      this.rightArm.rotation.set(-0.2, 0, -0.4);
      this.leftLeg.rotation.set(-0.3, 0, 0.2);
      this.rightLeg.rotation.set(0.2, 0, -0.2);
      if (this.spiritCompanion) {
        this.spiritCompanion.position.y = 0.55 + Math.sin(this.animTime * 4.0) * 0.05;
      }
      return;
    }

    if (this.isDodging) {
      // 360-degree acrobatic tumble roll
      const progress = 1 - Math.max(0, this.dodgeTimer / 0.38);
      this.characterPivot.rotation.x = -progress * Math.PI * 2;
      this.torsoGroup.position.y = 0.55 + Math.sin(progress * Math.PI) * 0.25;
      this.capeletTails.rotation.x = 0.85;
      this.leftArm.rotation.x = -1.2;
      this.rightArm.rotation.x = 1.0;
      this.leftLeg.rotation.x = 0.6;
      this.rightLeg.rotation.x = 0.6;
      return;
    }

    if (this.isAttacking) {
      // Dynamic 3D Sword Combat Slashes
      const progress = 1 - Math.max(0, this.attackTimer / 0.32);
      const swing = Math.sin(progress * Math.PI);

      if (this.attackComboStep === 1) {
        // Attack 2: Powerful overhead vertical cleave
        this.rightArm.rotation.x = -2.3 + progress * 3.5;
        this.rightArm.rotation.y = 0.1;
        this.rightArm.rotation.z = -0.1;
      } else if (this.attackComboStep === 2) {
        // Attack 3: Reverse spin radial sweep
        this.rightArm.rotation.x = -0.6 - swing * 1.3;
        this.rightArm.rotation.y = 0.35;
        this.rightArm.rotation.z = 1.1 - swing * 2.1;
      } else {
        // Attack 1: Standard wide crescent horizontal slash
        this.rightArm.rotation.x = -1.1 + swing * 2.0;
        this.rightArm.rotation.y = -0.6 + swing * 1.3;
        this.rightArm.rotation.z = -0.3 + swing * 0.7;
      }

      this.leftArm.rotation.x = 0.5;
      const arcMat = this.slashArcMesh.material as THREE.MeshBasicMaterial;
      arcMat.opacity = swing * 0.95;
      this.slashArcMesh.rotation.z = progress * Math.PI;
      this.staffLight.intensity = 3.8;
      return;
    }

    if (this.isCastingPulse) {
      // Raise sword aloft pointing to the sky with both hands
      this.leftArm.rotation.x = THREE.MathUtils.lerp(this.leftArm.rotation.x, -2.5, dt * 18);
      this.rightArm.rotation.x = THREE.MathUtils.lerp(this.rightArm.rotation.x, -2.5, dt * 18);
      this.rightArm.rotation.y = THREE.MathUtils.lerp(this.rightArm.rotation.y, 0, dt * 18);
      this.rightArm.rotation.z = THREE.MathUtils.lerp(this.rightArm.rotation.z, -0.1, dt * 18);
      this.staffLight.intensity = 5.5;
      this.torsoGroup.position.y = 1.05;
      return;
    }

    // Default Locomotion & Idle
    this.characterPivot.rotation.x = THREE.MathUtils.lerp(this.characterPivot.rotation.x, 0, dt * 12);
    (this.slashArcMesh.material as THREE.MeshBasicMaterial).opacity = 0;

    if ((isMoving || this.isRunningInPlace) && isGrounded) {
      const freq = isSprinting ? 15.0 : 9.5;
      this.animTime += dt * freq;

      const legSwing = Math.sin(this.animTime) * (isSprinting ? 0.78 : 0.52);
      const armSwing = Math.sin(this.animTime) * (isSprinting ? 0.65 : 0.42);

      this.leftLeg.rotation.x = legSwing;
      this.rightLeg.rotation.x = -legSwing;

      this.leftArm.rotation.x = -armSwing;
      this.leftArm.rotation.y = 0;
      this.leftArm.rotation.z = 0;

      // Right arm swings naturally with heroic sword grip
      this.rightArm.rotation.x = -0.18 + armSwing * 0.32;
      this.rightArm.rotation.y = THREE.MathUtils.lerp(this.rightArm.rotation.y, -0.06, dt * 10);
      this.rightArm.rotation.z = THREE.MathUtils.lerp(this.rightArm.rotation.z, -0.08, dt * 10);

      // Capelet dynamic trailing sway
      const capeSway = Math.sin(this.animTime * 0.9) * 0.15 + (isSprinting ? 0.45 : 0.22);
      this.capeletTails.rotation.x = capeSway;

      // Vertical rhythmic bounce
      this.torsoGroup.position.y = 0.95 + Math.abs(Math.sin(this.animTime * 2)) * (isSprinting ? 0.14 : 0.08);

      // Subtle head bob
      this.headGroup.rotation.x = Math.sin(this.animTime * 2) * 0.04;
    } else if (!isGrounded) {
      // In air jump pose: legs tuck up, arms raise slightly, sword braced forward
      this.leftLeg.rotation.x = THREE.MathUtils.lerp(this.leftLeg.rotation.x, 0.45, dt * 12);
      this.rightLeg.rotation.x = THREE.MathUtils.lerp(this.rightLeg.rotation.x, -0.32, dt * 12);
      this.leftArm.rotation.x = THREE.MathUtils.lerp(this.leftArm.rotation.x, -0.7, dt * 12);
      this.rightArm.rotation.x = THREE.MathUtils.lerp(this.rightArm.rotation.x, -0.32, dt * 12);
      this.rightArm.rotation.y = THREE.MathUtils.lerp(this.rightArm.rotation.y, -0.08, dt * 12);
      this.rightArm.rotation.z = THREE.MathUtils.lerp(this.rightArm.rotation.z, -0.12, dt * 12);
      this.capeletTails.rotation.x = THREE.MathUtils.lerp(this.capeletTails.rotation.x, 0.55, dt * 10);
      this.torsoGroup.position.y = THREE.MathUtils.lerp(this.torsoGroup.position.y, 0.95, dt * 10);
    } else {
      // Idle breathing & heroic adventurer ready stance holding the sword
      this.animTime += dt * 2.2;
      this.leftLeg.rotation.x = THREE.MathUtils.lerp(this.leftLeg.rotation.x, 0, dt * 8);
      this.rightLeg.rotation.x = THREE.MathUtils.lerp(this.rightLeg.rotation.x, 0, dt * 8);
      this.leftArm.rotation.x = THREE.MathUtils.lerp(this.leftArm.rotation.x, 0, dt * 8);
      this.leftArm.rotation.y = THREE.MathUtils.lerp(this.leftArm.rotation.y, 0, dt * 8);
      this.leftArm.rotation.z = THREE.MathUtils.lerp(this.leftArm.rotation.z, 0, dt * 8);

      // Sword held naturally at hip pointing forward-down
      this.rightArm.rotation.x = THREE.MathUtils.lerp(this.rightArm.rotation.x, -0.22, dt * 8);
      this.rightArm.rotation.y = THREE.MathUtils.lerp(this.rightArm.rotation.y, -0.08, dt * 8);
      this.rightArm.rotation.z = THREE.MathUtils.lerp(this.rightArm.rotation.z, -0.08, dt * 8);

      this.torsoGroup.position.y = 0.95 + Math.sin(this.animTime) * 0.03;
      this.capeletTails.rotation.x = THREE.MathUtils.lerp(this.capeletTails.rotation.x, 0.05, dt * 6);
      this.headGroup.rotation.x = Math.sin(this.animTime * 1.2) * 0.03;
    }

    // Sword cross-guard ancient rune gem glow pulsation
    if (this.staffCrystal) {
      this.staffCrystal.rotation.y += dt * 2.0;
      const gemPulse = 1.0 + Math.sin(this.animTime * 2.8) * 0.15;
      this.staffCrystal.scale.setScalar(gemPulse);
      this.staffLight.intensity = 1.0 + Math.sin(this.animTime * 3.0) * 0.4;
    }

    // Spirit Companion gentle bobbing & orbiting near shoulder
    if (this.spiritCompanion) {
      this.spiritCompanion.position.y = 1.1 + Math.sin(this.animTime * 2.5) * 0.08;
      this.spiritCompanion.rotation.y = Math.sin(this.animTime * 1.5) * 0.25;
    }
  }

  // ==========================================
  // COMBAT ACTIONS
  // ==========================================

  public performAttack(comboStep: number = 0): boolean {
    if (this.isDead || this.isDodging) return false;
    this.isAttacking = true;
    this.attackTimer = 0.32;
    this.attackComboStep = comboStep % 3;

    // Forward lunge boost
    const lungeDir = new THREE.Vector3(
      Math.sin(this.currentFacingAngle),
      0,
      Math.cos(this.currentFacingAngle)
    );
    this.velocity.x += lungeDir.x * 4.5;
    this.velocity.z += lungeDir.z * 4.5;
    return true;
  }

  public performDodge(inputDir?: THREE.Vector3): boolean {
    if (this.isDead || this.isDodging) return false;
    this.isDodging = true;
    this.dodgeTimer = 0.38;
    this.isAttacking = false;
    this.attackTimer = 0;
    (this.slashArcMesh.material as THREE.MeshBasicMaterial).opacity = 0;

    let dir = inputDir && inputDir.lengthSq() > 0.01
      ? inputDir.clone().normalize()
      : new THREE.Vector3(Math.sin(this.currentFacingAngle), 0, Math.cos(this.currentFacingAngle));

    // High velocity burst
    this.velocity.copy(dir.multiplyScalar(17.5));
    return true;
  }

  public performEchoPulse(): boolean {
    if (this.isDead || this.isDodging) return false;
    this.isCastingPulse = true;
    this.pulseTimer = 0.55;
    this.isAttacking = false;
    return true;
  }

  public die(): void {
    this.isDead = true;
    this.isAttacking = false;
    this.isDodging = false;
    this.isCastingPulse = false;
    this.velocity.set(0, 0, 0);
  }

  public respawn(spawnPos: THREE.Vector3): void {
    this.isDead = false;
    this.isAttacking = false;
    this.isDodging = false;
    this.isCastingPulse = false;
    this.position.copy(spawnPos);
    this.velocity.set(0, 0, 0);
    this.characterPivot.rotation.set(0, this.currentFacingAngle, 0);
    this.characterPivot.position.set(0, 0, 0);
  }

  public getFacingDirection(): THREE.Vector3 {
    return new THREE.Vector3(
      Math.sin(this.currentFacingAngle),
      0,
      Math.cos(this.currentFacingAngle)
    ).normalize();
  }

  public getStaffWorldPosition(): THREE.Vector3 {
    const pos = new THREE.Vector3();
    this.staffCrystal.getWorldPosition(pos);
    return pos;
  }

  public getSwordWorldPosition(): THREE.Vector3 {
    return this.getStaffWorldPosition();
  }

  public setFirstPersonMode(active: boolean): void {
    this.isFirstPerson = active;
    this.characterPivot.visible = !active;
  }
}
