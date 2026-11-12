/**
 * ECHO – THE WORLD REMEMBERS
 * Central Game Engine & Orchestrator
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

import { SoundSynth } from './audio/SoundSynth.ts';
import { Terrain } from './world/Terrain.ts';
import { BioluminescentLake } from './world/BioluminescentLake.ts';
import { Forest, WorldObstacle } from './world/Forest.ts';
import { AncientTemple } from './world/AncientTemple.ts';
import { GreatPortal } from './world/GreatPortal.ts';
import { EchoCrystals, CrystalData } from './world/EchoCrystals.ts';
import { Atmosphere } from './world/Atmosphere.ts';
import { WorldInteractions, InteractiveTarget, AncientInscription } from './world/WorldInteractions.ts';
import { EchoMemorySystem } from './world/EchoMemorySystem.ts';
import { VillageHouses } from './world/VillageHouses.ts';
import { QuestSystem } from './story/QuestSystem.ts';
import { NPCManager, InteractiveNPCInfo } from './npc/NPCManager.ts';

import { Character } from './player/Character.ts';
import { ThirdPersonCamera } from './player/ThirdPersonCamera.ts';
import { InputController } from './player/InputController.ts';
import { GameUI } from './ui/GameUI.ts';
import { CombatSystem, CombatStats } from './combat/CombatSystem.ts';
import { MultiplayerCoordinator } from './multiplayer/MultiplayerCoordinator.ts';

export enum GameState {
  TITLE,
  PLAYING,
  PAUSED,
}

export class Game {
  public scene: THREE.Scene;
  public renderer: THREE.WebGLRenderer;
  public cameraSystem: ThirdPersonCamera;
  public sound: SoundSynth;
  public input: InputController;
  public ui: GameUI;
  public combatSystem: CombatSystem;
  public multiplayer: MultiplayerCoordinator;

  // World subsystems
  public terrain: Terrain;
  public lake: BioluminescentLake;
  public forest: Forest;
  public temple: AncientTemple;
  public portal: GreatPortal;
  public crystals: EchoCrystals;
  public worldInteractions: WorldInteractions;
  public memorySystem: EchoMemorySystem;
  public villageHouses: VillageHouses;
  public atmosphere: Atmosphere;
  public player: Character;
  public questSystem: QuestSystem;
  public npcManager: NPCManager;

  // Collision obstacles aggregate
  private allObstacles: WorldObstacle[] = [];

  // State
  private state: GameState = GameState.TITLE;
  private lastTime: number = 0;
  private activeInteractiveTarget: InteractiveTarget | null = null;
  private hasTriggeredVictory: boolean = false;
  private lastSprintState: boolean = false;

  constructor(private container: HTMLElement) {
    // 1. Three.js Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.renderer.domElement.id = 'echo-webgl-canvas';
    this.container.appendChild(this.renderer.domElement);

    // 2. Scene & Environment
    this.scene = new THREE.Scene();

    try {
      const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      pmremGenerator.dispose();
    } catch (e) {
      console.warn('RoomEnvironment fallback:', e);
    }

    // 4. Subsystems initialization
    this.sound = new SoundSynth();
    this.cameraSystem = new ThirdPersonCamera(55, window.innerWidth / window.innerHeight);

    // World entities
    this.atmosphere = new Atmosphere(this.scene);
    this.scene.add(this.atmosphere.group);

    this.terrain = new Terrain();
    this.scene.add(this.terrain.group);

    this.lake = new BioluminescentLake();
    this.scene.add(this.lake.group);

    this.forest = new Forest(this.terrain);
    this.scene.add(this.forest.group);

    this.temple = new AncientTemple(this.terrain);
    this.scene.add(this.temple.group);

    this.portal = new GreatPortal(this.terrain);
    this.scene.add(this.portal.group);

    this.crystals = new EchoCrystals(this.terrain);
    this.scene.add(this.crystals.group);

    this.worldInteractions = new WorldInteractions(this.terrain);
    this.scene.add(this.worldInteractions.group);

    this.memorySystem = new EchoMemorySystem(this.terrain);
    this.scene.add(this.memorySystem.group);

    // Procedural Village Houses, Cottages & Street Network
    this.villageHouses = new VillageHouses(this.terrain);
    this.scene.add(this.villageHouses.group);

    // Gather collision obstacles
    this.allObstacles = [
      ...this.forest.obstacles,
      ...this.temple.obstacles,
      ...this.portal.obstacles,
      ...this.worldInteractions.obstacles,
      ...this.villageHouses.obstacles,
    ];

    // Player character spawned at southern shoreline
    const spawnX = Terrain.SPAWN_POS.x;
    const spawnZ = Terrain.SPAWN_POS.z;
    const spawnY = this.terrain.getHeightAt(spawnX, spawnZ);
    this.player = new Character(new THREE.Vector3(spawnX, spawnY, spawnZ));
    this.scene.add(this.player.group);

    // Initialize Quest & Story System
    this.questSystem = new QuestSystem();
    this.questSystem.onObjectiveUpdated = (quest, obj) => {
      this.ui.updateQuestTracker(quest, obj);
    };
    this.questSystem.onObjectiveCompleted = (quest, obj, nextObj) => {
      this.sound.playQuestObjectiveComplete();
      this.ui.showObjectiveCompleteBanner(obj, nextObj);
      this.ui.updateQuestTracker(quest, nextObj);
      this.saveGame();
    };
    this.questSystem.onQuestCompleted = (quest, nextQuest) => {
      this.sound.playQuestCompletedFanfare();
      this.ui.updateQuestTracker(nextQuest || quest, nextQuest ? nextQuest.objectives[0] : null);
      this.ui.showToast('🎉 اكتملت مهمة الذاكرة الأولى بنجاح! · The First Memory Awakened');
      this.saveGame();
    };
    this.questSystem.onStoryNarrativeTriggered = (event) => {
      this.sound.playStoryNarrative();
      this.ui.openStoryNarrativeModal(event);
    };

    // Initialize NPC & Creature World Manager
    this.npcManager = new NPCManager(this.terrain, this.sound, this.questSystem, this.memorySystem);
    this.scene.add(this.npcManager.group);

    // Initialize Dynamic Combat System (Player attacks, dodges, Echo Pulse & Wood Wraith AI)
    this.combatSystem = new CombatSystem(this.terrain, this.player, this.sound);
    this.scene.add(this.combatSystem.group);

    this.combatSystem.onPlayerDamaged = (hp, maxHp) => {
      this.ui.showHurtEffect();
      this.ui.updateCombatStats(this.combatSystem.getStats());
    };

    this.combatSystem.onPlayerDied = () => {
      this.ui.openDeathModal(() => {
        this.resetPlayerPosition();
        this.combatSystem.respawnPlayer(this.player.position);
        this.ui.updateCombatStats(this.combatSystem.getStats());
        this.ui.closeDeathModal();
        this.ui.showToast('✦ استعدت عافيتك من طاقة الجزيرة · Restored by Island Light');
      });
    };

    this.combatSystem.onStatsChanged = (stats: CombatStats) => {
      this.ui.updateCombatStats(stats);
    };

    // Initialize Central Multiplayer & Party Coordinator (Supports isolated player data & remote peers)
    this.multiplayer = new MultiplayerCoordinator();
    this.multiplayer.init(this);

    // Inputs & UI
    this.input = new InputController(this.container);
    this.ui = new GameUI({
      onNewGame: () => this.startNewGame(),
      onContinueGame: () => this.continueGame(),
      onOpenSettings: () => this.ui.openSettingsModal(),
      onExitGame: () => this.exitToTitle(),
      onToggleSound: () => {
        const isMuted = this.sound.toggleMute();
        this.ui.setSoundIcon(isMuted);
      },
      onPauseToggle: () => {
        if (this.state === GameState.PLAYING) {
          this.state = GameState.PAUSED;
        } else if (this.state === GameState.PAUSED) {
          this.state = GameState.PLAYING;
        }
      },
      onSaveGame: () => this.saveGame(),
      onResetPosition: () => this.resetPlayerPosition(),
      onInteract: () => this.handleInteract(),
      onJump: () => {
        if (this.player.jump()) {
          this.sound.playJump();
        }
      },
      onCombatAttack: () => {
        if (this.state === GameState.PLAYING && !this.ui.getIsModalOrPaused()) {
          this.combatSystem.executePlayerAttack();
        }
      },
      onCombatDodge: () => {
        if (this.state === GameState.PLAYING && !this.ui.getIsModalOrPaused()) {
          this.combatSystem.executePlayerDodge(this.input.moveInput, this.cameraSystem.getYaw());
        }
      },
      onCombatPulse: () => {
        if (this.state === GameState.PLAYING && !this.ui.getIsModalOrPaused()) {
          this.combatSystem.executeEchoPulse();
        }
      },
      onRespawnRequested: () => {
        this.resetPlayerPosition();
        this.combatSystem.respawnPlayer(this.player.position);
        this.ui.updateCombatStats(this.combatSystem.getStats());
        this.ui.closeDeathModal();
        this.ui.showToast('✦ استعدت عافيتك من طاقة الجزيرة · Restored by Island Light');
      },
      onTouchMove: (x: number, y: number, isSprint: boolean) => {
        this.input.touchMoveInput.set(x, y);
        this.input.touchJoystickSprinting = isSprint;
      },
      onJoystickTouchState: (touchId: number | null) => {
        this.input.setJoystickTouchId(touchId);
      },
      onTouchSprintState: (isPressed: boolean) => {
        this.input.touchButtonSprinting = isPressed;
      },
      onTouchSprintToggle: () => {
        this.input.touchButtonSprinting = !this.input.touchButtonSprinting;
        return this.input.touchButtonSprinting;
      },
      onUpdateVolume: (master: number, music: number) => {
        this.sound.setMasterVolume(master);
        this.sound.setMusicVolume(music);
      },
      onUpdateCameraSens: (sens: number) => {
        this.cameraSystem.sensitivity = sens;
      },
      getMemoryProfile: () => this.memorySystem.profile,
      getQuestSystem: () => this.questSystem,
      getMultiplayerCoordinator: () => this.multiplayer,
    });

    // Initialize continue button badge, shard counter, and combat stats
    const saveInfo = this.checkSavedProgress();
    this.ui.setContinueBadge(saveInfo.hasSave, saveInfo.count);
    this.ui.updateShardProgress(saveInfo.shardCount, 10);
    this.ui.updateQuestTracker(this.questSystem.getActiveQuest(), this.questSystem.getActiveObjective());
    this.ui.updateCombatStats(this.combatSystem.getStats());

    // Window resize & orientation change handlers
    window.addEventListener('resize', () => this.onWindowResize());
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.onWindowResize(), 100);
    });
    if (window.screen?.orientation) {
      window.screen.orientation.addEventListener('change', () => {
        setTimeout(() => this.onWindowResize(), 100);
      });
    }

    // Initial check for orientation layout
    this.ui.handleOrientationOrResize();

    // Start game loop
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.tick(t));
  }

  public startNewGame(): void {
    this.sound.init();
    this.sound.resume();
    this.sound.playUIClick();

    // Reset game world state
    this.crystals.resetAll();
    this.worldInteractions.resetAll();
    this.memorySystem.reset();
    this.questSystem.resetAll();
    this.combatSystem.resetAll();
    this.hasTriggeredVictory = false;
    this.portal.updateCrystalProgress(0);
    this.ui.updateCrystalProgress(0);
    this.ui.updateShardProgress(0, 10);
    this.ui.updateQuestTracker(this.questSystem.getActiveQuest(), this.questSystem.getActiveObjective());
    this.ui.updateCombatStats(this.combatSystem.getStats());

    // Reset player position to southern shoreline
    const spawnX = Terrain.SPAWN_POS.x;
    const spawnZ = Terrain.SPAWN_POS.z;
    const spawnY = this.terrain.getHeightAt(spawnX, spawnZ);
    this.player.position.set(spawnX, spawnY, spawnZ);
    this.player.velocity.set(0, 0, 0);
    this.player.isGrounded = true;

    this.state = GameState.PLAYING;
    this.cameraSystem.isCinematic = false;
    this.cameraSystem.yaw = Math.PI; // Face north toward island center
    this.ui.showHUD();
    this.ui.showToast('رحلة جديدة بدأت · A new journey has begun');

    // Show Opening Prologue Story Event: Awakening on the Forgotten Shore!
    setTimeout(() => {
      const prologue = this.questSystem.getPrologueEvent();
      this.sound.playStoryNarrative();
      this.ui.openStoryNarrativeModal(prologue);
    }, 400);

    // Auto-save initial state
    this.saveGame();
  }

  public continueGame(): void {
    this.sound.init();
    this.sound.resume();
    this.sound.playUIClick();

    const loaded = this.loadSavedProgress();
    if (!loaded) {
      // If no valid save, fallback to new game
      this.startNewGame();
      return;
    }

    this.combatSystem.respawnPlayer(this.player.position);
    this.ui.updateCombatStats(this.combatSystem.getStats());

    this.state = GameState.PLAYING;
    this.cameraSystem.isCinematic = false;
    this.ui.showHUD();
    this.ui.showToast('تم استعادة التقدم · Progress restored');
  }

  public exitToTitle(): void {
    this.sound.playUIClick();
    this.saveGame();

    this.state = GameState.TITLE;
    this.cameraSystem.isCinematic = true;
    this.ui.showTitleScreen();

    const saveInfo = this.checkSavedProgress();
    this.ui.setContinueBadge(saveInfo.hasSave, saveInfo.count);
  }

  public saveGame(): boolean {
    try {
      const collectedIds = this.crystals.crystals
        .filter((c) => c.collected)
        .map((c) => c.id);

      const collectedShards = this.worldInteractions.shards
        .filter((s) => s.collected)
        .map((s) => s.id);

      const readInscriptions = this.worldInteractions.inscriptions
        .filter((i) => i.read)
        .map((i) => i.id);

      const saveData = {
        collectedIds,
        collectedShards,
        readInscriptions,
        isTempleDoorOpen: this.worldInteractions.isTempleDoorOpen,
        memoryProfile: this.memorySystem.serialize(),
        questData: this.questSystem.serialize(),
        playerPos: {
          x: this.player.position.x,
          y: this.player.position.y,
          z: this.player.position.z,
        },
        cameraYaw: this.cameraSystem.getYaw(),
        timestamp: Date.now(),
      };

      localStorage.setItem('echo_the_world_remembers_save', JSON.stringify(saveData));

      // Also persist isolated multiplayer player & world datasets
      this.multiplayer?.saveGame();

      const saveInfo = this.checkSavedProgress();
      this.ui.setContinueBadge(saveInfo.hasSave, saveInfo.count);
      return true;
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
      return false;
    }
  }

  public loadSavedProgress(): boolean {
    try {
      const raw = localStorage.getItem('echo_the_world_remembers_save');
      if (!raw) return false;

      const data = JSON.parse(raw);
      if (!data || !Array.isArray(data.collectedIds)) return false;

      // Restore crystals
      this.crystals.setCollectedState(data.collectedIds);
      const count = this.crystals.getCollectedCount();
      this.ui.updateCrystalProgress(count);
      this.portal.updateCrystalProgress(count);

      // Restore memory shards, inscriptions, and temple door
      this.worldInteractions.restoreSavedState(
        data.collectedShards || [],
        data.readInscriptions || [],
        data.isTempleDoorOpen || false
      );
      const shardCount = this.worldInteractions.getCollectedShardsCount();
      this.ui.updateShardProgress(shardCount, 10);

      // Restore Echo Memory System (player profile and 3D manifestations)
      if (data.memoryProfile) {
        this.memorySystem.deserialize(data.memoryProfile);
      }

      // Restore Quest & Story System progress
      if (data.questData) {
        this.questSystem.deserialize(data.questData);
      }
      this.ui.updateQuestTracker(this.questSystem.getActiveQuest(), this.questSystem.getActiveObjective());

      // Restore player position
      if (data.playerPos && typeof data.playerPos.x === 'number') {
        const h = this.terrain.getHeightAt(data.playerPos.x, data.playerPos.z);
        this.player.position.set(
          data.playerPos.x,
          Math.max(data.playerPos.y, h),
          data.playerPos.z
        );
        this.player.velocity.set(0, 0, 0);
        this.player.isGrounded = true;
      }

      // Restore camera orientation
      if (typeof data.cameraYaw === 'number') {
        this.cameraSystem.yaw = data.cameraYaw;
      }

      this.hasTriggeredVictory = count >= 7;
      return true;
    } catch (e) {
      console.warn('LocalStorage load failed:', e);
      return false;
    }
  }

  public checkSavedProgress(): { hasSave: boolean; count: number; shardCount: number } {
    try {
      const raw = localStorage.getItem('echo_the_world_remembers_save');
      if (!raw) return { hasSave: false, count: 0, shardCount: 0 };
      const data = JSON.parse(raw);
      if (data && Array.isArray(data.collectedIds)) {
        const shardCount = Array.isArray(data.collectedShards) ? data.collectedShards.length : 0;
        return { hasSave: true, count: data.collectedIds.length, shardCount };
      }
    } catch {
      // ignore
    }
    return { hasSave: false, count: 0, shardCount: 0 };
  }

  public resetPlayerPosition(): void {
    const spawnX = Terrain.SPAWN_POS.x;
    const spawnZ = Terrain.SPAWN_POS.z;
    const spawnY = this.terrain.getHeightAt(spawnX, spawnZ);
    this.player.position.set(spawnX, spawnY, spawnZ);
    this.player.velocity.set(0, 0, 0);
    this.player.isGrounded = true;
    this.cameraSystem.yaw = Math.PI;
    this.sound.playUIClick();
    this.ui.showToast('تم العودة إلى نقطة البداية · Returned to start');
  }

  private handleInteract(): void {
    if (!this.activeInteractiveTarget) return;
    const target = this.activeInteractiveTarget;

    // 0. NPC & Creature Interaction (Dialogue, Lore, & Petting)
    if ((target as any).npcInfo) {
      const npcInfo = (target as any).npcInfo as InteractiveNPCInfo;
      this.startNPCDialogue(npcInfo.id);
      return;
    }

    // 1. Crystal Interaction
    if (target.type === 'crystal') {
      const crystalData = target.data as CrystalData;
      if (crystalData && !crystalData.collected) {
        const collected = this.crystals.collectCrystal(crystalData.id);
        if (collected) {
          this.sound.playCrystalResonance();
          this.worldInteractions.spawnCollectionBurst(crystalData.pos, crystalData.color);
          this.ui.openLoreModal(collected);
          const count = this.crystals.getCollectedCount();
          this.ui.updateCrystalProgress(count);
          this.portal.updateCrystalProgress(count);
          this.questSystem.recordCrystalCount(count);

          this.saveGame();

          if (count >= 7 && !this.hasTriggeredVictory) {
            this.hasTriggeredVictory = true;
            setTimeout(() => {
              this.sound.playPortalActivation();
              this.ui.openVictoryModal();
            }, 1500);
          }
        }
      }
    }

    // 2. Memory Shard Collection (Prevent re-collection)
    else if (target.type === 'shard') {
      const shard = this.worldInteractions.collectShard(target.id as number);
      if (shard) {
        this.sound.playShardCollect();
        const shardCount = this.worldInteractions.getCollectedShardsCount();
        this.ui.updateShardProgress(shardCount, 10);
        this.ui.showToast(`✦ ${shard.nameAr} · ${shard.quoteAr}`);
        this.questSystem.recordShardCollected(shardCount);
        this.saveGame();
      }
    }

    // 3. Ancient Inscription Reading
    else if (target.type === 'inscription') {
      const insc = target.data as AncientInscription;
      if (insc) {
        this.sound.playInscriptionRead();
        insc.read = true;
        this.ui.openInscriptionModal(insc);
        this.questSystem.recordInscriptionRead(insc.id);
        this.saveGame();
      }
    }

    // 4. Temple Sanctuary Gate
    else if (target.type === 'door') {
      const isOpen = this.worldInteractions.toggleTempleDoor();
      this.sound.playStoneDoorSound();
      this.ui.showToast(
        isOpen
          ? 'فُتحت بوابة المعبد الحجرية العتيقة · Temple Gate Unsealed'
          : 'أُغلقت بوابة المعبد الحجرية · Temple Gate Sealed'
      );
      this.questSystem.recordStoneGateAction(isOpen);
      this.saveGame();
    }

    // 5. Great Stone Portal
    else if (target.type === 'portal') {
      const crystalCount = this.crystals.getCollectedCount();
      if (crystalCount >= 7) {
        this.sound.playPortalActivation();
        this.ui.openVictoryModal();
      } else {
        const remaining = 7 - crystalCount;
        this.sound.playUIClick();
        this.ui.showToast(
          `البوابة مقفلة بختم أثيري! اجمع ${remaining} بلورات أخرى لتفعيلها · 7 Echoes Required`
        );
      }
    }

    // 6. Village House Hearth Resting & Vitality Recovery
    else if ((target as any).type === 'hearth') {
      this.combatSystem.restoreFullHealth();
      this.sound.playHearthRest();
      this.ui.updateCombatStats(this.combatSystem.getStats());
      this.ui.showToast('✦ استرحت بجانب الموقد الحجري واستعدت كامل عافيتك وطاقتك · Restored by Warm Hearth');
      this.saveGame();
    }

    // 7. Ancient Village Well Spring Water
    else if ((target as any).type === 'well') {
      this.sound.playWellWater();
      this.ui.showToast('✦ شربت من مياه نبع الأثير العذبة وارتوت روحك · Pure Spring Water Drank');
    }

    // 8. Village House Ancient Lorebook
    else if ((target as any).type === 'village_lore') {
      const conf = (target as any).data;
      this.sound.playInscriptionRead();
      this.ui.showToast(
        conf?.loreTextAr || '«سجلات قديمة تحكي عن سكينة القرية ووئام أهلها مع صدى الجزيرة...»'
      );
    }
  }

  private startNPCDialogue(npcId: string, nodeKey: string = 'root'): void {
    const dialogueNode = this.npcManager.getDialogueFor(npcId, nodeKey);
    this.ui.openNPCDialogue(dialogueNode, (option) => {
      if (option.action === 'CLOSE') {
        this.ui.closeNPCDialogue();
        this.npcManager.closeDialogue();
      } else if (option.action === 'PET_CREATURE') {
        this.sound.playNPCVoice('creature');
        this.ui.showToast('✦ استشعرت روح الضياء نقاء خطواتك · Forest Harmony Gained');
        this.ui.closeNPCDialogue();
        this.npcManager.closeDialogue();
      } else if (option.action === 'QUEST_HINT') {
        this.ui.showToast('📍 تم تحديث إرشادات البوصلة · Quest Guidance Updated');
        if (option.nextDialogueId) {
          this.startNPCDialogue(npcId, option.nextDialogueId);
        } else {
          this.ui.closeNPCDialogue();
          this.npcManager.closeDialogue();
        }
      } else if (option.nextDialogueId) {
        this.startNPCDialogue(npcId, option.nextDialogueId);
      } else {
        this.ui.closeNPCDialogue();
        this.npcManager.closeDialogue();
      }
    });
  }

  private tick(now: number): void {
    const rawDt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    const dt = Math.min(rawDt, 0.05);

    this.update(dt, now / 1000);
    this.renderer.render(this.scene, this.cameraSystem.camera);

    requestAnimationFrame((t) => this.tick(t));
  }

  private update(dt: number, timeSec: number): void {
    // 1. Process Inputs
    this.input.update();

    if (this.input.pauseJustPressed && this.state !== GameState.TITLE) {
      this.ui.togglePause();
    }

    if (this.input.questJustPressed && this.state === GameState.PLAYING) {
      this.ui.openQuestLogModal(this.questSystem);
    }

    const isModalOpen = this.ui.getIsModalOrPaused();

    // Update sprint button visual highlight in sync with active sprint state
    if (this.state === GameState.PLAYING) {
      this.ui.updateAutoRunUI(this.input.isSprinting);
    }

    // 2. Camera Controls
    if (!isModalOpen && this.state === GameState.PLAYING) {
      if (this.input.cameraDeltaX !== 0 || this.input.cameraDeltaY !== 0) {
        this.cameraSystem.rotate(this.input.cameraDeltaX, this.input.cameraDeltaY);
      }
      if (this.input.zoomDelta !== 0) {
        this.cameraSystem.zoom(this.input.zoomDelta);
      }
    }

    // 3. Player Locomotion (Only when active playing and no modal)
    if (!isModalOpen && this.state === GameState.PLAYING) {
      if (this.input.jumpJustPressed) {
        if (this.player.jump()) {
          this.sound.playJump();
        }
      }

      // Combat Actions (Attack Combo, Directional Dodge Roll, Echo Pulse AOE)
      if (this.input.attackJustPressed) {
        this.combatSystem.executePlayerAttack();
      }
      if (this.input.dodgeJustPressed) {
        this.combatSystem.executePlayerDodge(this.input.moveInput, this.cameraSystem.getYaw());
      }
      if (this.input.pulseJustPressed) {
        this.combatSystem.executeEchoPulse();
      }

      this.player.update(
        dt,
        this.input.moveInput,
        this.cameraSystem.getYaw(),
        this.input.isSprinting,
        this.terrain,
        this.allObstacles
      );

      // Track distance traveled & proximity for quest objectives
      this.questSystem.updatePlayerMovement(this.player.position);

      // Footstep sound synthesis
      if ((this.player.isMoving || this.player.isRunningInPlace) && this.player.isGrounded) {
        this.sound.playFootstep(this.player.isSprinting);
      }

      // Unified Proximity Detection for all interactive entities (Crystals, Shards, Inscriptions, Gates, NPCs)
      const crystal = this.crystals.checkNearbyCrystal(this.player.position, 3.8);
      const worldTarget = this.worldInteractions.findClosestInteraction(this.player.position);
      const npcTarget = this.npcManager.findClosestNPC(this.player.position, 3.8);

      let bestTarget: InteractiveTarget | null = null;
      let bestDist = Infinity;

      if (crystal) {
        const crystalDist = this.player.position.distanceTo(crystal.pos);
        bestDist = crystalDist;
        bestTarget = {
          id: crystal.id,
          type: 'crystal',
          titleAr: crystal.nameAr,
          titleEn: crystal.nameEn,
          actionAr: 'تواصل مع صدى البلورة',
          actionEn: 'Commune with Echo Crystal',
          pos: crystal.pos,
          dist: crystalDist,
          color: crystal.color,
          data: crystal,
        };
      }

      if (worldTarget && worldTarget.dist < bestDist) {
        bestDist = worldTarget.dist;
        bestTarget = worldTarget;
      }

      if (npcTarget && npcTarget.distance < bestDist) {
        bestDist = npcTarget.distance;
        bestTarget = {
          id: npcTarget.id,
          type: 'door' as any,
          titleAr: npcTarget.nameAr,
          titleEn: npcTarget.nameEn,
          actionAr: npcTarget.actionPromptAr,
          actionEn: npcTarget.actionPromptEn,
          pos: npcTarget.position,
          dist: npcTarget.distance,
          color: npcTarget.type === 'WANDERER' ? 0x00f5d4 : npcTarget.type === 'GUARDIAN' ? 0x9b5de5 : 0x5eead4,
          data: npcTarget,
        };
        (bestTarget as any).npcInfo = npcTarget;
      }

      // Village houses interactions (hearth healing, well water, lorebook)
      const villageTarget = this.villageHouses.findClosestInteraction(this.player.position, 3.8);
      if (villageTarget && villageTarget.dist < bestDist) {
        bestDist = villageTarget.dist;
        bestTarget = villageTarget as unknown as InteractiveTarget;
      }

      this.activeInteractiveTarget = bestTarget;
      this.ui.showTargetInteractPrompt(this.activeInteractiveTarget);

      if (this.input.interactJustPressed && this.activeInteractiveTarget) {
        this.handleInteract();
      }
    }

    // 4. Update Camera (مع تتبع دوران وحركة الشخصية بسلاسة)
    this.cameraSystem.update(
      dt,
      this.player.position,
      this.terrain,
      this.player.currentFacingAngle,
      this.player.isMoving
    );

    // 5. Update Echo Memory System (Telemetry tracking & real-time world alterations)
    if (this.state === GameState.PLAYING) {
      // Record sprint trigger when sprint begins
      if (this.input.isSprinting && !this.lastSprintState) {
        this.memorySystem.recordSprintTrigger();
      }
      this.lastSprintState = this.input.isSprinting;

      const crystalCount = this.crystals.getCollectedCount();
      const shardCount = this.worldInteractions.getCollectedShardsCount();
      const readInscriptionsCount = this.worldInteractions.inscriptions.filter((i) => i.read).length;

      this.memorySystem.updatePlayerTracking(
        dt,
        this.player.position,
        this.input.isSprinting && this.player.isMoving,
        crystalCount,
        shardCount,
        readInscriptionsCount
      );
    }

    // 6. Update World Visuals, Subsystems, Manifestations, NPCs, Enemies & Interactive VFX
    this.terrain.update(timeSec);
    this.lake.update(timeSec);
    this.temple.update(timeSec);
    this.portal.update(timeSec);
    this.crystals.update(timeSec);
    this.worldInteractions.update(dt, timeSec);
    this.villageHouses.update(dt, timeSec);
    this.npcManager.update(dt, timeSec, this.player.position, this.input.isSprinting);
    this.combatSystem.update(dt, timeSec, this.cameraSystem.camera.position);
    this.multiplayer.update(dt, timeSec, this.cameraSystem.camera.position);
    this.memorySystem.update(timeSec);
    this.atmosphere.update(timeSec);

    // 7. Update Minimap with Crystal, Shard, NPC, Enemy, Remote Ally, and Village House radar blips
    if (this.state === GameState.PLAYING) {
      const enemyBlips = this.combatSystem.enemies
        .filter((e) => !e.isDead)
        .map((e) => ({ pos: { x: e.group.position.x, z: e.group.position.z } }));
      const allyBlips = this.multiplayer.remotePlayers.getMinimapBlips();

      this.ui.renderMinimap(
        this.player.position.x,
        this.player.position.z,
        this.cameraSystem.getYaw(),
        this.crystals.crystals,
        this.worldInteractions.shards,
        this.npcManager.getNPCMinimapBlips(),
        enemyBlips,
        allyBlips,
        this.villageHouses.getMinimapHouseBlips()
      );
    }

    // Clear one-frame input triggers
    this.input.clearFrameDeltas();
  }

  private onWindowResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.cameraSystem.camera.aspect = width / height;
    this.cameraSystem.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.ui?.handleOrientationOrResize();
  }

  public dispose(): void {
    this.villageHouses.dispose();
    this.multiplayer.dispose();
    this.sound.dispose();
    this.renderer.dispose();
  }
}
