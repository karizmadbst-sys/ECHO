/**
 * ECHO – THE WORLD REMEMBERS
 * Remote Player 3D Entity (تمثيل اللاعبين المتصلين في العالم ثلاثي الأبعاد)
 *
 * Implements:
 * 1. Visual representation of remote co-op adventurers with custom class robes and staves.
 * 2. Position/rotation dead reckoning & smooth interpolation (lerp).
 * 3. 3D Billboard Nameplate & Health Bar facing the local camera.
 * 4. Remote combat visual replication (Combo attacks, Dodge rolls, Echo Pulse).
 * 5. Strict separation of Network Transform Logic from Three.js Render Graph.
 */

import * as THREE from 'three';
import { PlayerAccountProfile, PlayerTransformSnapshot } from './types.ts';

export class RemotePlayerEntity {
  public group: THREE.Group;
  public profile: PlayerAccountProfile;

  // Transform interpolation targets
  private targetPosition: THREE.Vector3;
  private currentPosition: THREE.Vector3;
  private targetFacingAngle: number = 0;
  private currentFacingAngle: number = 0;
  private isMoving: boolean = false;
  private isSprinting: boolean = false;
  private isGrounded: boolean = true;

  // Visual sub-meshes
  private pivotGroup: THREE.Group;
  private headMesh: THREE.Mesh;
  private torsoMesh: THREE.Mesh;
  private capeletMesh: THREE.Mesh;
  private leftArm: THREE.Group;
  private rightArm: THREE.Group;
  private leftLeg: THREE.Group;
  private rightLeg: THREE.Group;
  private staffGroup: THREE.Group;
  private staffCrystal: THREE.Mesh;
  private staffLight: THREE.PointLight;
  private slashArcMesh: THREE.Mesh;
  private pulseShockwaveMesh: THREE.Mesh;

  // Overhead Billboard UI (Nameplate & HP bar)
  private nameplateGroup: THREE.Group;
  private hpFillMesh: THREE.Mesh;
  private animTimer: number = 0;

  constructor(profile: PlayerAccountProfile, initialTransform: PlayerTransformSnapshot) {
    this.profile = profile;
    this.targetPosition = new THREE.Vector3(initialTransform.x, initialTransform.y, initialTransform.z);
    this.currentPosition = this.targetPosition.clone();
    this.targetFacingAngle = initialTransform.facingAngle || 0;
    this.currentFacingAngle = this.targetFacingAngle;

    this.group = new THREE.Group();
    this.group.name = `RemotePlayer_${profile.id}`;
    this.group.position.copy(this.currentPosition);

    this.pivotGroup = new THREE.Group();
    this.group.add(this.pivotGroup);

    // Color materials based on player profile
    const robeHex = parseInt(profile.robeColor.replace('#', ''), 16) || 0x1d4ed8;
    const auraHex = parseInt(profile.auraColor.replace('#', ''), 16) || 0x00f5d4;

    const skinMat = new THREE.MeshStandardMaterial({ color: 0xdec6b3, roughness: 0.8 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
    const tunicMat = new THREE.MeshStandardMaterial({ color: 0xeae5d8, roughness: 0.85 });
    const capeletMat = new THREE.MeshStandardMaterial({ color: robeHex, roughness: 0.75 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x3d271d, roughness: 0.9 });
    const crystalMat = new THREE.MeshStandardMaterial({
      color: auraHex,
      emissive: auraHex,
      emissiveIntensity: 2.2,
      roughness: 0.2,
    });

    // 1. Torso
    const torsoGeom = new THREE.CylinderGeometry(0.24, 0.22, 0.72, 8);
    this.torsoMesh = new THREE.Mesh(torsoGeom, tunicMat);
    this.torsoMesh.position.y = 0.88;
    this.torsoMesh.castShadow = true;
    this.pivotGroup.add(this.torsoMesh);

    // Capelet
    const capeGeom = new THREE.ConeGeometry(0.36, 0.45, 8);
    this.capeletMesh = new THREE.Mesh(capeGeom, capeletMat);
    this.capeletMesh.position.set(0, 1.15, -0.04);
    this.capeletMesh.castShadow = true;
    this.pivotGroup.add(this.capeletMesh);

    // 2. Head & Hair bun
    const headGeom = new THREE.SphereGeometry(0.18, 12, 10);
    this.headMesh = new THREE.Mesh(headGeom, skinMat);
    this.headMesh.position.y = 1.42;
    this.headMesh.castShadow = true;
    this.pivotGroup.add(this.headMesh);

    const bunGeom = new THREE.SphereGeometry(0.09, 8, 8);
    const bun = new THREE.Mesh(bunGeom, hairMat);
    bun.position.set(0, 1.58, -0.1);
    this.pivotGroup.add(bun);

    // 3. Limbs
    const limbGeom = new THREE.CylinderGeometry(0.08, 0.07, 0.58, 6);
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.32, 1.18, 0);
    const lArmMesh = new THREE.Mesh(limbGeom, tunicMat);
    lArmMesh.position.y = -0.26;
    this.leftArm.add(lArmMesh);
    this.pivotGroup.add(this.leftArm);

    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.32, 1.18, 0);
    const rArmMesh = new THREE.Mesh(limbGeom, tunicMat);
    rArmMesh.position.y = -0.26;
    this.rightArm.add(rArmMesh);
    this.pivotGroup.add(this.rightArm);

    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.14, 0.52, 0);
    const lLegMesh = new THREE.Mesh(limbGeom, tunicMat);
    lLegMesh.position.y = -0.28;
    this.leftLeg.add(lLegMesh);
    this.pivotGroup.add(this.leftLeg);

    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.14, 0.52, 0);
    const rLegMesh = new THREE.Mesh(limbGeom, tunicMat);
    rLegMesh.position.y = -0.28;
    this.rightLeg.add(rLegMesh);
    this.pivotGroup.add(this.rightLeg);

    // 4. Island Echo 3D Sword
    this.staffGroup = new THREE.Group();
    this.staffGroup.position.set(0.36, 0.58, 0.12);
    this.staffGroup.rotation.set(-Math.PI * 0.42, 0.12, 0.18);

    const swordSteelMat = new THREE.MeshStandardMaterial({
      color: 0xe2ecf4,
      metalness: 0.95,
      roughness: 0.18,
    });
    const swordBrassMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.88,
      roughness: 0.25,
    });

    // Grip
    const gripGeom = new THREE.CylinderGeometry(0.02, 0.022, 0.18, 8);
    const grip = new THREE.Mesh(gripGeom, woodMat);
    this.staffGroup.add(grip);

    // Pommel
    const pommelGeom = new THREE.DodecahedronGeometry(0.035, 0);
    const pommel = new THREE.Mesh(pommelGeom, swordBrassMat);
    pommel.position.y = -0.11;
    this.staffGroup.add(pommel);

    // Crossguard
    const guardGeom = new THREE.BoxGeometry(0.24, 0.034, 0.058);
    const guard = new THREE.Mesh(guardGeom, swordBrassMat);
    guard.position.y = 0.095;
    this.staffGroup.add(guard);

    // Blade
    const bladeGeom = new THREE.BoxGeometry(0.062, 0.78, 0.015);
    const blade = new THREE.Mesh(bladeGeom, swordSteelMat);
    blade.position.y = 0.49;
    blade.castShadow = true;
    this.staffGroup.add(blade);

    // Blade Tip
    const bladeTipGeom = new THREE.ConeGeometry(0.042, 0.14, 4);
    bladeTipGeom.rotateY(Math.PI / 4);
    const bladeTip = new THREE.Mesh(bladeTipGeom, swordSteelMat);
    bladeTip.position.y = 0.95;
    this.staffGroup.add(bladeTip);

    const crystGeom = new THREE.OctahedronGeometry(0.025, 0);
    this.staffCrystal = new THREE.Mesh(crystGeom, crystalMat);
    this.staffCrystal.position.set(0, 0.095, 0.03);
    this.staffGroup.add(this.staffCrystal);

    this.staffLight = new THREE.PointLight(auraHex, 1.4, 5);
    this.staffLight.position.set(0, 0.52, 0.03);
    this.staffGroup.add(this.staffLight);
    this.pivotGroup.add(this.staffGroup);

    // 5. Slash Arc VFX
    const arcGeom = new THREE.RingGeometry(0.5, 1.3, 16, 1, 0, Math.PI * 0.8);
    const arcMat = new THREE.MeshBasicMaterial({
      color: auraHex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    this.slashArcMesh = new THREE.Mesh(arcGeom, arcMat);
    this.slashArcMesh.rotation.x = Math.PI / 2;
    this.slashArcMesh.position.set(0, 0.95, 0.4);
    this.pivotGroup.add(this.slashArcMesh);

    // 6. Pulse VFX
    const pulseGeom = new THREE.RingGeometry(0.2, 0.6, 32);
    pulseGeom.rotateX(-Math.PI / 2);
    this.pulseShockwaveMesh = new THREE.Mesh(pulseGeom, arcMat.clone());
    this.group.add(this.pulseShockwaveMesh);

    // 7. Overhead Nameplate Canvas Billboard
    this.nameplateGroup = new THREE.Group();
    this.nameplateGroup.position.y = 2.15;

    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'rgba(6, 10, 18, 0.82)';
      ctx.roundRect(8, 8, 368, 80, 16);
      ctx.fill();
      ctx.strokeStyle = profile.auraColor;
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(profile.username, 192, 42);

      ctx.fillStyle = profile.auraColor;
      ctx.font = '18px sans-serif';
      ctx.fillText(`${profile.titleEn} (Lv.${profile.level})`, 192, 70);
    }

    const tagTexture = new THREE.CanvasTexture(canvas);
    const tagGeom = new THREE.PlaneGeometry(1.4, 0.35);
    const tagMat = new THREE.MeshBasicMaterial({
      map: tagTexture,
      transparent: true,
      depthTest: false,
    });
    const tagMesh = new THREE.Mesh(tagGeom, tagMat);
    this.nameplateGroup.add(tagMesh);

    // Health bar above nameplate
    const hpBgGeom = new THREE.PlaneGeometry(1.0, 0.08);
    const hpBgMat = new THREE.MeshBasicMaterial({ color: 0x18181b, depthTest: false });
    const hpBg = new THREE.Mesh(hpBgGeom, hpBgMat);
    hpBg.position.y = 0.25;
    this.nameplateGroup.add(hpBg);

    const hpFillGeom = new THREE.PlaneGeometry(0.96, 0.05);
    hpFillGeom.translate(0.48, 0, 0); // Origin at left edge
    const hpFillMat = new THREE.MeshBasicMaterial({ color: 0x10b981, depthTest: false });
    this.hpFillMesh = new THREE.Mesh(hpFillGeom, hpFillMat);
    this.hpFillMesh.position.set(-0.48, 0.25, 0.005);
    this.nameplateGroup.add(this.hpFillMesh);

    this.group.add(this.nameplateGroup);
  }

  /**
   * Ingests network packet transform
   */
  public updateNetworkTransform(snapshot: PlayerTransformSnapshot): void {
    this.targetPosition.set(snapshot.x, snapshot.y, snapshot.z);
    this.targetFacingAngle = snapshot.facingAngle;
    this.isMoving = snapshot.isMoving;
    this.isSprinting = snapshot.isSprinting;
    this.isGrounded = snapshot.isGrounded;

    if (snapshot.actionState === 'ATTACK') {
      this.playAttackAnimation(snapshot.comboStep);
    } else if (snapshot.actionState === 'DODGE') {
      this.playDodgeAnimation();
    } else if (snapshot.actionState === 'PULSE') {
      this.playPulseAnimation();
    }
  }

  public setHealthPercent(pct: number): void {
    this.hpFillMesh.scale.x = Math.max(0, Math.min(1, pct));
  }

  public update(dt: number, cameraPos: THREE.Vector3): void {
    // 1. Smoothly interpolate position toward target (network dead reckoning lerp)
    const lerpRate = Math.min(1.0, dt * 12.0);
    this.currentPosition.lerp(this.targetPosition, lerpRate);
    this.group.position.copy(this.currentPosition);

    // 2. Smoothly rotate facing angle
    let diff = this.targetFacingAngle - this.currentFacingAngle;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    this.currentFacingAngle += diff * Math.min(1.0, dt * 14.0);
    this.pivotGroup.rotation.y = this.currentFacingAngle;

    // 3. Face nameplate toward local camera
    this.nameplateGroup.lookAt(cameraPos);

    // 4. Locomotion animation
    this.animTimer += dt * (this.isSprinting ? 12 : 7);
    if (this.isMoving) {
      const swing = Math.sin(this.animTimer);
      this.leftLeg.rotation.x = swing * 0.6;
      this.rightLeg.rotation.x = -swing * 0.6;
      this.leftArm.rotation.x = -swing * 0.45;
      this.rightArm.rotation.x = swing * 0.45;
    } else {
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
      this.leftArm.rotation.x = 0;
      this.rightArm.rotation.x = 0;
    }

    // Gentle crystal hover
    this.staffCrystal.rotation.y += dt * 2.0;
  }

  public playAttackAnimation(step: number = 1): void {
    const mat = this.slashArcMesh.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.85;
    this.rightArm.rotation.x = -1.2;
    setTimeout(() => {
      mat.opacity = 0;
      this.rightArm.rotation.x = 0;
    }, 220);
  }

  public playDodgeAnimation(): void {
    this.pivotGroup.rotation.x = Math.PI * 0.4;
    setTimeout(() => {
      this.pivotGroup.rotation.x = 0;
    }, 320);
  }

  public playPulseAnimation(): void {
    const mat = this.pulseShockwaveMesh.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.95;
    this.pulseShockwaveMesh.scale.set(1, 1, 1);
    let scale = 1;
    const interval = setInterval(() => {
      scale += 0.8;
      this.pulseShockwaveMesh.scale.set(scale, scale, scale);
      mat.opacity -= 0.12;
      if (mat.opacity <= 0) {
        clearInterval(interval);
        mat.opacity = 0;
      }
    }, 30);
  }

  public dispose(): void {
    this.group.removeFromParent();
  }
}
