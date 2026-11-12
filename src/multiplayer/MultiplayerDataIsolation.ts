/**
 * ECHO – THE WORLD REMEMBERS
 * Multiplayer Data Isolation Layer (فصل بيانات اللاعب عن بيانات العالم)
 *
 * Implements strict architectural separation:
 * 1. Player Data (حساب، طاقة، صحة، مخزون، ذاكرة، مهام، تحولات) -> PlayerIsolatedSaveData
 * 2. World Data (غرفة العالم، الأبواب، المحاريب، حالة الطقس، الأعداء المشتركون) -> WorldInstanceData
 * 3. Backward Compatibility Adapter to seamlessly migrate legacy single-player saves.
 */

import { PlayerIsolatedSaveData, WorldInstanceData, PlayerAccountProfile } from './types.ts';
import type { Game } from '../Game.ts';

const STORAGE_PREFIX_PLAYER = 'echo_player_save_';
const STORAGE_PREFIX_WORLD = 'echo_world_instance_';
const LEGACY_STORAGE_KEY = 'echo_the_world_remembers_save';

export class MultiplayerDataIsolation {
  /**
   * Extracts pure Player data from the active game session
   */
  public static extractPlayerSave(game: Game, account: PlayerAccountProfile): PlayerIsolatedSaveData {
    const stats = game.combatSystem ? game.combatSystem.getStats() : {
      hp: 100,
      maxHp: 100,
      energy: 100,
      maxEnergy: 100,
      isInvulnerable: false,
      enemiesDefeated: 0,
    };

    const collectedShards = game.worldInteractions.shards
      .filter((s) => s.collected)
      .map((s) => s.id);

    const attunedCrystals = game.crystals.crystals
      .filter((c) => c.collected)
      .map((c) => c.id);

    const readInscriptions = game.worldInteractions.inscriptions
      .filter((i) => i.read)
      .map((i) => i.id);

    return {
      version: 2,
      account,
      stats,
      inventory: {
        collectedShards,
        attunedCrystals,
        readInscriptions,
      },
      questProgress: game.questSystem.serialize(),
      memoryProfile: game.memorySystem.serialize(),
      lastTransform: {
        x: game.player.position.x,
        y: game.player.position.y,
        z: game.player.position.z,
        yaw: game.cameraSystem.getYaw(),
      },
      savedAt: Date.now(),
    };
  }

  /**
   * Extracts pure World instance state (sharable across players in a room)
   */
  public static extractWorldData(game: Game, hostId: string, worldId: string = 'forgotten_island_main'): WorldInstanceData {
    const crystalStates: Record<number, boolean> = {};
    game.crystals.crystals.forEach((c) => {
      crystalStates[c.id] = c.collected;
    });

    const shardStates: Record<number, boolean> = {};
    game.worldInteractions.shards.forEach((s) => {
      shardStates[s.id] = s.collected;
    });

    return {
      version: 2,
      worldId,
      hostPlayerId: hostId,
      instanceSeed: 4207,
      isTempleDoorOpen: game.worldInteractions.isTempleDoorOpen,
      shrineActivationStates: {},
      crystalCollectedStates: crystalStates,
      shardCollectedStates: shardStates,
      defeatedBosses: [],
      dayNightCycleTime: 0,
      weatherState: 'CLEAR',
      updatedAt: Date.now(),
    };
  }

  /**
   * Applies pure Player state back into the game
   */
  public static applyPlayerSave(game: Game, data: PlayerIsolatedSaveData): void {
    if (!data) return;

    // 1. Restore quest progress
    if (data.questProgress) {
      game.questSystem.deserialize(data.questProgress);
    }
    game.ui.updateQuestTracker(game.questSystem.getActiveQuest(), game.questSystem.getActiveObjective());

    // 2. Restore Echo Memory Profile
    if (data.memoryProfile) {
      game.memorySystem.deserialize(data.memoryProfile);
    }

    // 3. Restore Player Transform
    if (data.lastTransform && typeof data.lastTransform.x === 'number') {
      const h = game.terrain.getHeightAt(data.lastTransform.x, data.lastTransform.z);
      game.player.position.set(
        data.lastTransform.x,
        Math.max(data.lastTransform.y, h),
        data.lastTransform.z
      );
      game.player.velocity.set(0, 0, 0);
      game.player.isGrounded = true;
      if (typeof data.lastTransform.yaw === 'number') {
        game.cameraSystem.yaw = data.lastTransform.yaw;
      }
    }

    // 4. Restore Combat Stats
    if (game.combatSystem && data.stats) {
      game.combatSystem.playerHp = data.stats.hp ?? 100;
      game.combatSystem.playerEnergy = data.stats.energy ?? 100;
      game.combatSystem.enemiesDefeatedCount = data.stats.enemiesDefeated ?? 0;
      game.ui.updateCombatStats(game.combatSystem.getStats());
    }
  }

  /**
   * Applies pure World state back into the game
   */
  public static applyWorldData(game: Game, data: WorldInstanceData): void {
    if (!data) return;

    // 1. Restore crystals states
    if (data.crystalCollectedStates) {
      const collectedIds = Object.entries(data.crystalCollectedStates)
        .filter(([_, collected]) => collected)
        .map(([id]) => Number(id));
      game.crystals.setCollectedState(collectedIds);
      const count = game.crystals.getCollectedCount();
      game.ui.updateCrystalProgress(count);
      game.portal.updateCrystalProgress(count);
    }

    // 2. Restore shard states and temple door
    if (data.shardCollectedStates) {
      const collectedShardIds = Object.entries(data.shardCollectedStates)
        .filter(([_, collected]) => collected)
        .map(([id]) => Number(id));
      game.worldInteractions.restoreSavedState(
        collectedShardIds,
        [],
        data.isTempleDoorOpen
      );
      game.ui.updateShardProgress(collectedShardIds.length, 10);
    } else if (data.isTempleDoorOpen !== game.worldInteractions.isTempleDoorOpen) {
      game.worldInteractions.toggleTempleDoor();
    }
  }

  /**
   * Persists both player state and world state into independent storage slots
   */
  public static saveIsolated(playerData: PlayerIsolatedSaveData, worldData: WorldInstanceData): boolean {
    try {
      const playerKey = `${STORAGE_PREFIX_PLAYER}${playerData.account.id}`;
      const worldKey = `${STORAGE_PREFIX_WORLD}${worldData.worldId}`;

      localStorage.setItem(playerKey, JSON.stringify(playerData));
      localStorage.setItem(worldKey, JSON.stringify(worldData));

      // Also update the legacy key for backward compatibility
      const legacySave = {
        collectedIds: Object.keys(worldData.crystalCollectedStates)
          .map(Number)
          .filter((k) => worldData.crystalCollectedStates[k]),
        collectedShards: Object.keys(worldData.shardCollectedStates)
          .map(Number)
          .filter((k) => worldData.shardCollectedStates[k]),
        readInscriptions: playerData.inventory.readInscriptions,
        isTempleDoorOpen: worldData.isTempleDoorOpen,
        memoryProfile: playerData.memoryProfile,
        questData: playerData.questProgress,
        playerPos: playerData.lastTransform,
        cameraYaw: playerData.lastTransform.yaw,
        timestamp: Date.now(),
      };
      localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(legacySave));

      return true;
    } catch (e) {
      console.warn('Failed to save isolated multiplayer data:', e);
      return false;
    }
  }

  /**
   * Loads isolated data, checking for legacy save migration if necessary
   */
  public static loadIsolated(
    playerId: string,
    worldId: string = 'forgotten_island_main'
  ): { player: PlayerIsolatedSaveData | null; world: WorldInstanceData | null } {
    try {
      const playerKey = `${STORAGE_PREFIX_PLAYER}${playerId}`;
      const worldKey = `${STORAGE_PREFIX_WORLD}${worldId}`;

      const rawPlayer = localStorage.getItem(playerKey);
      const rawWorld = localStorage.getItem(worldKey);

      let player: PlayerIsolatedSaveData | null = rawPlayer ? JSON.parse(rawPlayer) : null;
      let world: WorldInstanceData | null = rawWorld ? JSON.parse(rawWorld) : null;

      // Backward compatibility fallback: migrate legacy save
      if (!player) {
        const rawLegacy = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (rawLegacy) {
          const legacy = JSON.parse(rawLegacy);
          if (legacy && Array.isArray(legacy.collectedIds)) {
            const crystalStates: Record<number, boolean> = {};
            legacy.collectedIds.forEach((id: string | number) => (crystalStates[Number(id)] = true));

            const shardStates: Record<number, boolean> = {};
            (legacy.collectedShards || []).forEach((id: string | number) => (shardStates[Number(id)] = true));

            world = {
              version: 2,
              worldId,
              hostPlayerId: playerId,
              instanceSeed: 4207,
              isTempleDoorOpen: legacy.isTempleDoorOpen || false,
              shrineActivationStates: {},
              crystalCollectedStates: crystalStates,
              shardCollectedStates: shardStates,
              defeatedBosses: [],
              dayNightCycleTime: 0,
              weatherState: 'CLEAR',
              updatedAt: legacy.timestamp || Date.now(),
            };

            player = {
              version: 2,
              account: {
                id: playerId,
                username: 'Spirit Wanderer',
                titleAr: 'مستكشف الأثير الأولي',
                titleEn: 'First Spirit Pioneer',
                characterClass: 'SPIRIT_WEAVER',
                robeColor: '#1d4ed8',
                auraColor: '#00f5d4',
                level: 1,
                echoMastery: 0,
                createdAt: legacy.timestamp || Date.now(),
                lastActive: Date.now(),
              },
              stats: {
                hp: 100,
                maxHp: 100,
                energy: 100,
                maxEnergy: 100,
                isInvulnerable: false,
                enemiesDefeated: 0,
              },
              inventory: {
                collectedShards: legacy.collectedShards || [],
                attunedCrystals: legacy.collectedIds || [],
                readInscriptions: legacy.readInscriptions || [],
              },
              questProgress: legacy.questData,
              memoryProfile: legacy.memoryProfile,
              lastTransform: legacy.playerPos
                ? { ...legacy.playerPos, yaw: legacy.cameraYaw || 0 }
                : { x: 0, y: 5, z: -100, yaw: Math.PI },
              savedAt: legacy.timestamp || Date.now(),
            };
          }
        }
      }

      return { player, world };
    } catch (e) {
      console.warn('Error loading isolated multiplayer data:', e);
      return { player: null, world: null };
    }
  }
}
