/**
 * ECHO – THE WORLD REMEMBERS
 * Remote Player Manager (إدارة اللاعبين المتصلين في المشهد)
 *
 * Coordinates:
 * 1. Spawning and removing remote player 3D entities.
 * 2. Routing network transform updates to corresponding remote avatars.
 * 3. Minimap radar blips for co-op allies.
 */

import * as THREE from 'three';
import { PlayerAccountProfile, PlayerTransformSnapshot, PlayerId } from './types.ts';
import { RemotePlayerEntity } from './RemotePlayerEntity.ts';

export class RemotePlayerManager {
  public group: THREE.Group;
  private players = new Map<PlayerId, RemotePlayerEntity>();

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'RemotePlayersManager';
  }

  public addPlayer(profile: PlayerAccountProfile, initialTransform: PlayerTransformSnapshot): RemotePlayerEntity {
    // If player already exists, return existing
    if (this.players.has(profile.id)) {
      return this.players.get(profile.id)!;
    }

    const entity = new RemotePlayerEntity(profile, initialTransform);
    this.players.set(profile.id, entity);
    this.group.add(entity.group);
    return entity;
  }

  public removePlayer(playerId: PlayerId): void {
    const entity = this.players.get(playerId);
    if (entity) {
      entity.dispose();
      this.players.delete(playerId);
    }
  }

  public getPlayer(playerId: PlayerId): RemotePlayerEntity | undefined {
    return this.players.get(playerId);
  }

  public playAction(playerId: PlayerId, action: 'ATTACK' | 'DODGE' | 'PULSE', data?: any): void {
    const entity = this.players.get(playerId);
    if (!entity) return;
    if (action === 'ATTACK') {
      entity.playAttackAnimation(data?.comboStep ?? 1);
    } else if (action === 'DODGE') {
      entity.playDodgeAnimation();
    } else if (action === 'PULSE') {
      entity.playPulseAnimation();
    }
  }

  public updateTransform(playerId: PlayerId, snapshot: PlayerTransformSnapshot): void {
    const entity = this.players.get(playerId);
    if (entity) {
      entity.updateNetworkTransform(snapshot);
    }
  }

  public update(dt: number, cameraPos: THREE.Vector3): void {
    for (const entity of this.players.values()) {
      entity.update(dt, cameraPos);
    }
  }

  /**
   * Generates radar blips for the minimap
   */
  public getMinimapBlips(): { pos: { x: number; z: number }; name: string; color: number }[] {
    const blips: { pos: { x: number; z: number }; name: string; color: number }[] = [];
    for (const entity of this.players.values()) {
      const hex = parseInt(entity.profile.auraColor.replace('#', ''), 16) || 0x00f5d4;
      blips.push({
        pos: { x: entity.group.position.x, z: entity.group.position.z },
        name: entity.profile.username,
        color: hex,
      });
    }
    return blips;
  }

  public getPlayerCount(): number {
    return this.players.size;
  }

  public clearAll(): void {
    for (const entity of this.players.values()) {
      entity.dispose();
    }
    this.players.clear();
  }
}
