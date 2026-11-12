/**
 * ECHO – THE WORLD REMEMBERS
 * Multiplayer & Network Architecture Types & Data Contracts
 * (بنية وبيانات اللعب الجماعي وشبكة الخادم المركزي)
 *
 * Designed to cleanly separate:
 * 1. Player Data from World Data
 * 2. Game Logic/State from Graphics/Rendering
 * 3. Client Transport from Central Server Authoritative Logic
 */

export type PlayerId = string;
export type RoomId = string;
export type PartyId = string;

// ==========================================
// 1. PLAYER IDENTITY & ACCOUNT
// ==========================================

export type CharacterClass = 'SPIRIT_WEAVER' | 'ANCIENT_WARDEN' | 'MIND_SEEKER' | 'ECHO_BLADE';

export interface PlayerAccountProfile {
  id: PlayerId;
  username: string;
  titleAr: string;
  titleEn: string;
  characterClass: CharacterClass;
  robeColor: string; // Hex color for player tunic/capelet
  auraColor: string; // Hex color for staff crystal & spirit wisp
  level: number;
  echoMastery: number; // Experience / resonance
  createdAt: number;
  lastActive: number;
}

// ==========================================
// 2. LOGIC & TRANSFORM STATE (PURE DATA)
// ==========================================

export type PlayerLocomotionState =
  | 'IDLE'
  | 'WALK'
  | 'RUN'
  | 'JUMP_ASCENT'
  | 'JUMP_DESCENT'
  | 'ATTACK'
  | 'DODGE'
  | 'PULSE'
  | 'DEAD';

export interface PlayerTransformSnapshot {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  facingAngle: number;
  isGrounded: boolean;
  isMoving: boolean;
  isSprinting: boolean;
  actionState: PlayerLocomotionState;
  comboStep: number;
  timestamp: number;
}

export interface PlayerCombatSnapshot {
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  isInvulnerable: boolean;
  enemiesDefeated: number;
}

// ==========================================
// 3. ISOLATED PLAYER SAVE DATA
// ==========================================

export interface PlayerIsolatedSaveData {
  version: number;
  account: PlayerAccountProfile;
  stats: PlayerCombatSnapshot;
  inventory: {
    collectedShards: number[];
    attunedCrystals: number[];
    readInscriptions: number[];
  };
  questProgress: any; // Serialized QuestSystem data
  memoryProfile: any; // Serialized EchoMemorySystem data
  lastTransform: {
    x: number;
    y: number;
    z: number;
    yaw: number;
  };
  savedAt: number;
}

// ==========================================
// 4. ISOLATED WORLD INSTANCE DATA
// ==========================================

export interface WorldInstanceData {
  version: number;
  worldId: RoomId;
  hostPlayerId: PlayerId;
  instanceSeed: number;
  isTempleDoorOpen: boolean;
  shrineActivationStates: Record<string, boolean>;
  crystalCollectedStates: Record<number, boolean>;
  shardCollectedStates: Record<number, boolean>;
  defeatedBosses: string[];
  dayNightCycleTime: number;
  weatherState: 'CLEAR' | 'ECHO_MIST' | 'AURORA_STORM';
  updatedAt: number;
}

// ==========================================
// 5. PARTY & CO-OP SYSTEM
// ==========================================

export interface PartyMember {
  playerId: PlayerId;
  username: string;
  characterClass: CharacterClass;
  isLeader: boolean;
  hp: number;
  maxHp: number;
  isReady: boolean;
  pingMs: number;
  lastTransform?: PlayerTransformSnapshot;
}

export interface PartyGroup {
  partyId: PartyId;
  leaderId: PlayerId;
  passCode: string;
  members: PartyMember[];
  maxMembers: number; // Default 4
  sharedObjectiveAr: string;
  sharedObjectiveEn: string;
  createdAt: number;
}

export interface WaypointPing {
  id: string;
  senderId: PlayerId;
  senderName: string;
  x: number;
  y: number;
  z: number;
  type: 'EXPLORE' | 'DANGER' | 'SHRINE' | 'HELP';
  timestamp: number;
  durationMs: number;
}

// ==========================================
// 6. NETWORK PACKETS (SERVER-AUTHORITATIVE)
// ==========================================

export type ClientPacket =
  | { type: 'C_AUTH'; profile: PlayerAccountProfile; token?: string }
  | { type: 'C_JOIN_ROOM'; roomId: RoomId; passCode?: string }
  | { type: 'C_LEAVE_ROOM'; roomId: RoomId }
  | { type: 'C_SYNC_TRANSFORM'; transform: PlayerTransformSnapshot }
  | { type: 'C_COMBAT_ATTACK'; comboStep: number; origin: { x: number; y: number; z: number }; facingAngle: number }
  | { type: 'C_COMBAT_DODGE'; direction: { x: number; z: number } }
  | { type: 'C_COMBAT_PULSE'; origin: { x: number; y: number; z: number } }
  | { type: 'C_INTERACT_OBJECT'; objectId: string; interactionType: string }
  | { type: 'C_PARTY_CREATE' }
  | { type: 'C_PARTY_INVITE'; targetPlayerId: PlayerId }
  | { type: 'C_PARTY_JOIN'; partyId: PartyId; passCode?: string }
  | { type: 'C_PARTY_LEAVE' }
  | { type: 'C_PARTY_PING'; ping: Omit<WaypointPing, 'id' | 'timestamp'> }
  | { type: 'C_CHAT_MESSAGE'; text: string; channel: 'ROOM' | 'PARTY' };

export type ServerPacket =
  | { type: 'S_AUTH_ACK'; success: boolean; sessionPlayerId: PlayerId; error?: string }
  | { type: 'S_ROOM_STATE'; worldData: WorldInstanceData; remotePlayers: { profile: PlayerAccountProfile; transform: PlayerTransformSnapshot }[] }
  | { type: 'S_PLAYER_JOINED'; profile: PlayerAccountProfile; transform: PlayerTransformSnapshot }
  | { type: 'S_PLAYER_LEFT'; playerId: PlayerId; reason?: string }
  | { type: 'S_REMOTE_TRANSFORM'; playerId: PlayerId; transform: PlayerTransformSnapshot }
  | { type: 'S_REMOTE_ATTACK'; playerId: PlayerId; comboStep: number; origin: { x: number; y: number; z: number }; facingAngle: number }
  | { type: 'S_REMOTE_DODGE'; playerId: PlayerId; direction: { x: number; z: number } }
  | { type: 'S_REMOTE_PULSE'; playerId: PlayerId; origin: { x: number; y: number; z: number } }
  | { type: 'S_WORLD_STATE_UPDATE'; delta: Partial<WorldInstanceData> }
  | { type: 'S_PARTY_STATE'; party: PartyGroup | null }
  | { type: 'S_PARTY_PING'; ping: WaypointPing }
  | { type: 'S_CHAT_BROADCAST'; senderId: PlayerId; senderName: string; text: string; channel: 'ROOM' | 'PARTY'; timestamp: number }
  | { type: 'S_ERROR'; code: string; message: string };

// ==========================================
// 7. CLIENT NETWORK CONFIGURATION
// ==========================================

export type NetworkMode = 'OFFLINE_SINGLEPLAYER' | 'LOCAL_P2P' | 'CENTRAL_SERVER';

export interface MultiplayerConfig {
  mode: NetworkMode;
  serverUrl: string;
  reconnectIntervalMs: number;
  maxReconnectAttempts: number;
  sendRateHz: number; // e.g. 20 packets/sec
  interpolationDelayMs: number; // e.g. 100ms lag buffer
}
