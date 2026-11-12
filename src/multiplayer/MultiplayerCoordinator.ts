/**
 * ECHO – THE WORLD REMEMBERS
 * Central Multiplayer Coordinator (المنسق المركزي للعب الجماعي)
 *
 * Bridges:
 * 1. PlayerAccountManager (هوية وحساب اللاعب)
 * 2. PartySystem (المجموعات وفرق الاستكشاف)
 * 3. RemotePlayerManager (تمثيل الأصدقاء في المشهد والبوصلة)
 * 4. INetworkTransport (الربط بالخادم المركزي مع حلقة Offline loopback آمنة)
 * 5. MultiplayerDataIsolation (فصل بيانات اللاعب عن بيانات العالم)
 */

import * as THREE from 'three';
import { PlayerAccountManager } from './PlayerAccountManager.ts';
import { PartySystem } from './PartySystem.ts';
import { RemotePlayerManager } from './RemotePlayerManager.ts';
import { INetworkTransport, OfflineLoopbackTransport, WebSocketTransportAdapter } from './NetworkProtocol.ts';
import { MultiplayerDataIsolation } from './MultiplayerDataIsolation.ts';
import {
  PlayerTransformSnapshot,
  ClientPacket,
  ServerPacket,
  MultiplayerConfig,
  PlayerLocomotionState,
} from './types.ts';
import type { Game } from '../Game.ts';

export class MultiplayerCoordinator {
  public account: PlayerAccountManager;
  public party: PartySystem;
  public remotePlayers: RemotePlayerManager;
  public transport: INetworkTransport;

  private game!: Game;
  private config: MultiplayerConfig = {
    mode: 'OFFLINE_SINGLEPLAYER',
    serverUrl: 'wss://echo.aistudio.internal/ws',
    reconnectIntervalMs: 3000,
    maxReconnectAttempts: 5,
    sendRateHz: 20,
    interpolationDelayMs: 100,
  };

  private syncTimer: number = 0;
  private readonly syncInterval: number = 1 / 20; // 20Hz sync rate
  private cleanupPacketListener?: () => void;

  constructor() {
    this.account = new PlayerAccountManager();
    this.party = new PartySystem(this.account.getProfile());
    this.remotePlayers = new RemotePlayerManager();
    this.transport = new OfflineLoopbackTransport();
  }

  public init(game: Game): void {
    this.game = game;
    this.game.scene.add(this.remotePlayers.group);

    // Register network packet receiver
    this.cleanupPacketListener = this.transport.onPacket((packet) => {
      this.handleServerPacket(packet);
    });

    // Send initial client authentication packet
    this.transport.send({
      type: 'C_AUTH',
      profile: this.account.getProfile(),
    });
  }

  /**
   * Main frame update
   */
  public update(dt: number, timeSec: number, cameraPos: THREE.Vector3): void {
    // 1. Update remote player entities
    this.remotePlayers.update(dt, cameraPos);

    // 2. Update party pings lifecycle
    this.party.update();

    // 3. Network snapshot broadcast timer (20Hz)
    this.syncTimer += dt;
    if (this.syncTimer >= this.syncInterval) {
      this.syncTimer = 0;
      this.broadcastLocalTransform();
    }
  }

  /**
   * Compiles and transmits pure local player state snapshot
   */
  public broadcastLocalTransform(): void {
    if (!this.game || !this.game.player) return;

    const p = this.game.player;
    let action: PlayerLocomotionState = 'IDLE';

    if (p.isDead) action = 'DEAD';
    else if (p.isAttacking) action = 'ATTACK';
    else if (p.isDodging) action = 'DODGE';
    else if (p.isCastingPulse) action = 'PULSE';
    else if (!p.isGrounded) action = p.velocity.y > 0 ? 'JUMP_ASCENT' : 'JUMP_DESCENT';
    else if (p.isMoving) action = p.isSprinting ? 'RUN' : 'WALK';

    const snapshot: PlayerTransformSnapshot = {
      x: p.position.x,
      y: p.position.y,
      z: p.position.z,
      vx: p.velocity.x,
      vy: p.velocity.y,
      vz: p.velocity.z,
      facingAngle: p.getFacingDirection ? Math.atan2(p.getFacingDirection().x, p.getFacingDirection().z) : 0,
      isGrounded: p.isGrounded,
      isMoving: p.isMoving,
      isSprinting: p.isSprinting,
      actionState: action,
      comboStep: p.attackComboStep || 1,
      timestamp: Date.now(),
    };

    this.transport.send({
      type: 'C_SYNC_TRANSFORM',
      transform: snapshot,
    });
  }

  /**
   * Dispatches incoming network packets from server
   */
  private handleServerPacket(packet: ServerPacket): void {
    switch (packet.type) {
      case 'S_AUTH_ACK':
        console.log('Central Server Auth Ack:', packet.success ? 'Success' : 'Failed');
        break;

      case 'S_PLAYER_JOINED':
        this.remotePlayers.addPlayer(packet.profile, packet.transform);
        this.game.ui.showToast(`✦ انضم المغامر ${packet.profile.username} إلى العالم`);
        break;

      case 'S_PLAYER_LEFT':
        this.remotePlayers.removePlayer(packet.playerId);
        break;

      case 'S_REMOTE_TRANSFORM':
        this.remotePlayers.updateTransform(packet.playerId, packet.transform);
        break;

      case 'S_REMOTE_ATTACK':
        this.remotePlayers.playAction(packet.playerId, 'ATTACK', { comboStep: packet.comboStep });
        break;

      case 'S_REMOTE_DODGE':
        this.remotePlayers.playAction(packet.playerId, 'DODGE');
        break;

      case 'S_REMOTE_PULSE':
        this.remotePlayers.playAction(packet.playerId, 'PULSE');
        break;

      case 'S_WORLD_STATE_UPDATE':
        MultiplayerDataIsolation.applyWorldData(this.game, packet.delta as any);
        break;

      case 'S_PARTY_PING':
        this.party.addPing(packet.ping.x, packet.ping.y, packet.ping.z, packet.ping.type);
        break;
    }
  }

  /**
   * Cleanly saves state with player/world data separation
   */
  public saveGame(): boolean {
    if (!this.game) return false;
    const playerSave = MultiplayerDataIsolation.extractPlayerSave(this.game, this.account.getProfile());
    const worldData = MultiplayerDataIsolation.extractWorldData(this.game, this.account.getProfile().id);
    return MultiplayerDataIsolation.saveIsolated(playerSave, worldData);
  }

  /**
   * Cleanly loads state using isolated storage
   */
  public loadGame(): boolean {
    if (!this.game) return false;
    const { player, world } = MultiplayerDataIsolation.loadIsolated(this.account.getProfile().id);
    if (!player && !world) return false;

    if (world) {
      MultiplayerDataIsolation.applyWorldData(this.game, world);
    }
    if (player) {
      MultiplayerDataIsolation.applyPlayerSave(this.game, player);
    }
    return true;
  }

  /**
   * Switches network mode between Offline Loopback and Central WebSocket
   */
  public async switchNetworkMode(mode: 'OFFLINE_SINGLEPLAYER' | 'CENTRAL_SERVER', wsUrl?: string): Promise<boolean> {
    if (mode === this.transport.mode) return true;

    this.transport.disconnect();
    if (this.cleanupPacketListener) this.cleanupPacketListener();

    if (mode === 'CENTRAL_SERVER') {
      this.transport = new WebSocketTransportAdapter(wsUrl || this.config.serverUrl);
      const ok = await this.transport.connect();
      if (!ok) {
        // Fallback to offline loopback
        this.transport = new OfflineLoopbackTransport();
        await this.transport.connect();
      }
    } else {
      this.transport = new OfflineLoopbackTransport();
      await this.transport.connect();
    }

    this.cleanupPacketListener = this.transport.onPacket((p) => this.handleServerPacket(p));
    return this.transport.isConnected;
  }

  public dispose(): void {
    if (this.cleanupPacketListener) this.cleanupPacketListener();
    this.transport.disconnect();
    this.remotePlayers.clearAll();
  }
}
