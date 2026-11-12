/**
 * ECHO – THE WORLD REMEMBERS
 * Third-Person Orbital Camera & Live Cinematic Title Cam
 * Smooth damping, pitch/yaw rotation, zoom control, and terrain collision avoidance.
 */

import * as THREE from 'three';
import { Terrain } from '../world/Terrain.ts';

export class ThirdPersonCamera {
  public camera: THREE.PerspectiveCamera;
  public target: THREE.Vector3;
  public currentPosition: THREE.Vector3;

  // Spherical angles
  public yaw: number = Math.PI; // Face towards island center
  public pitch: number = 0.28;  // Vertical tilt (radians)
  public distance: number = 6.8; // Distance behind player
  public sensitivity: number = 1.0; // Orbit speed multiplier

  // Perspective Mode (Third-Person vs First-Person)
  public isFirstPerson: boolean = false;

  // Manual camera rotation tracking (The camera NEVER auto-rotates with analog or movement)
  public manualRotateTimer: number = 999;

  // Constraints
  private minPitch = -0.22;
  private maxPitch = 1.32;
  private minPitchFPP = -1.25;
  private maxPitchFPP = 1.25;
  private minDistance = 2.8;
  private maxDistance = 14.0;

  // Smoothing
  private smoothTarget: THREE.Vector3;

  // Cinematic mode for Title Screen
  public isCinematic: boolean = true;
  private cinematicTime: number = 0;

  constructor(fov: number = 55, aspect: number = 16 / 9) {
    this.camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 800);
    this.target = new THREE.Vector3(0, 5, 80);
    this.smoothTarget = this.target.clone();
    this.currentPosition = new THREE.Vector3(0, 10, 95);
    this.camera.position.copy(this.currentPosition);
  }

  public update(
    dt: number,
    playerPos: THREE.Vector3,
    terrain: Terrain,
    playerFacingAngle?: number,
    isMoving: boolean = false
  ): void {
    const clampedDt = Math.min(dt, 0.05);
    this.manualRotateTimer += clampedDt;

    if (this.isCinematic) {
      // Cinematic live-world camera framing the glowing Great Portal with subtle mystical float
      this.cinematicTime += clampedDt * 0.25;
      const portalPos = Terrain.PORTAL_POS;
      const portalY = terrain.getHeightAt(portalPos.x, portalPos.z);

      const swayX = Math.sin(this.cinematicTime * 0.7) * 0.8;
      const swayY = Math.sin(this.cinematicTime * 1.1) * 0.35;
      const swayZ = Math.cos(this.cinematicTime * 0.6) * 0.8;

      // Position camera in front of the portal, angled so the portal sits on the right
      this.camera.position.set(
        portalPos.x - 17.5 + swayX,
        portalY + 4.2 + swayY,
        portalPos.z - 7.5 + swayZ
      );

      // Look slightly to the left of portal center so portal is framed on the right half
      const lookTarget = new THREE.Vector3(
        portalPos.x - 3.0,
        portalY + 6.5,
        portalPos.z + 1.0
      );
      this.camera.lookAt(lookTarget);
      return;
    }

    // ==========================================
    // 1. FIRST-PERSON PERSPECTIVE (منظور الشخص الأول)
    // ==========================================
    if (this.isFirstPerson) {
      // Eye-level viewpoint at adventurer head height (approx 1.62m)
      const eyePosition = playerPos.clone().add(new THREE.Vector3(0, 1.62, 0));
      
      // Look direction vector calculated from spherical yaw & pitch
      const cosPitch = Math.cos(this.pitch);
      const sinPitch = Math.sin(this.pitch);
      const sinYaw = Math.sin(this.yaw);
      const cosYaw = Math.cos(this.yaw);

      const forwardX = -sinYaw * cosPitch;
      const forwardY = sinPitch;
      const forwardZ = -cosYaw * cosPitch;

      // Slight forward offset to clear any internal neck/head geometry
      const camPos = eyePosition.clone().add(new THREE.Vector3(-sinYaw * 0.12, 0, -cosYaw * 0.12));
      
      this.currentPosition.lerp(camPos, Math.min(1, 28.0 * clampedDt));
      this.camera.position.copy(this.currentPosition);

      const lookTarget = this.camera.position.clone().add(new THREE.Vector3(forwardX, forwardY, forwardZ));
      this.camera.lookAt(lookTarget);
      return;
    }

    // ==========================================
    // 2. THIRD-PERSON PERSPECTIVE (منظور الشخص الثالث)
    // ==========================================

    // The camera maintains a completely fixed angle during character locomotion.
    // It only orbits when the player manually drags/swipes on the touch camera area.
    // Movement does NOT alter camera yaw/pitch, completely separating locomotion from camera rotation.

    // Follow player chest/head smoothly
    const targetWithHeight = playerPos.clone().add(new THREE.Vector3(0, 1.55, 0));
    this.smoothTarget.lerp(targetWithHeight, Math.min(1, 14.0 * clampedDt));

    // Calculate ideal camera position from spherical coordinates
    const cosPitch = Math.cos(this.pitch);
    const sinPitch = Math.sin(this.pitch);
    const sinYaw = Math.sin(this.yaw);
    const cosYaw = Math.cos(this.yaw);

    let effectiveDistance = this.distance;

    // Line-of-sight terrain collision test (push-in if hill blocks view)
    const dir = new THREE.Vector3(
      cosPitch * sinYaw,
      sinPitch,
      cosPitch * cosYaw
    ).normalize();

    // Check 6 intermediate samples along ray
    for (let s = 1; s <= 6; s++) {
      const distSample = (this.distance / 6) * s;
      const testPoint = this.smoothTarget.clone().addScaledVector(dir, distSample);
      const groundAtPoint = terrain.getHeightAt(testPoint.x, testPoint.z);
      if (testPoint.y < groundAtPoint + 0.6) {
        effectiveDistance = Math.max(this.minDistance, (this.distance / 6) * (s - 0.5));
        break;
      }
    }

    const offsetX = effectiveDistance * cosPitch * sinYaw;
    const offsetY = effectiveDistance * sinPitch;
    const offsetZ = effectiveDistance * cosPitch * cosYaw;

    const desiredCamPos = this.smoothTarget.clone().add(new THREE.Vector3(offsetX, offsetY, offsetZ));

    // Ground collision avoidance: don't let camera go below terrain + 0.85m
    const terrainHeight = terrain.getHeightAt(desiredCamPos.x, desiredCamPos.z);
    if (desiredCamPos.y < terrainHeight + 0.85) {
      desiredCamPos.y = terrainHeight + 0.85;
    }

    // Smooth camera damping
    this.currentPosition.lerp(desiredCamPos, Math.min(1, 16.0 * clampedDt));
    this.camera.position.copy(this.currentPosition);

    this.camera.lookAt(this.smoothTarget);
  }

  public rotate(deltaYaw: number, deltaPitch: number): void {
    if (this.isCinematic) return;
    this.manualRotateTimer = 0; // Reset timer on manual camera interaction
    this.yaw -= deltaYaw * 0.0035 * this.sensitivity;
    this.pitch += deltaPitch * 0.0035 * this.sensitivity;

    // Clamp vertical pitch appropriately depending on perspective mode
    const minP = this.isFirstPerson ? this.minPitchFPP : this.minPitch;
    const maxP = this.isFirstPerson ? this.maxPitchFPP : this.maxPitch;
    this.pitch = Math.max(minP, Math.min(maxP, this.pitch));
  }

  public zoom(delta: number): void {
    if (this.isCinematic) return;
    if (this.isFirstPerson) {
      // Zooming out in first-person smoothly switches back to third-person
      if (delta > 0) {
        this.setPerspectiveMode(false);
        this.distance = this.minDistance;
      }
      return;
    }

    this.distance += delta * 0.005;
    if (this.distance < this.minDistance - 0.5) {
      // Zooming in very close switches to first-person
      this.setPerspectiveMode(true);
      return;
    }
    this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance));
  }

  public togglePerspective(): boolean {
    return this.setPerspectiveMode(!this.isFirstPerson);
  }

  public setPerspectiveMode(firstPerson: boolean): boolean {
    this.isFirstPerson = firstPerson;
    this.manualRotateTimer = 0;
    if (this.isFirstPerson) {
      this.pitch = Math.max(-0.25, Math.min(0.25, this.pitch)); // Level view
    } else {
      this.pitch = 0.28;
      this.distance = Math.max(this.minDistance, 6.2);
    }
    return this.isFirstPerson;
  }

  public getYaw(): number {
    return this.yaw;
  }
}
