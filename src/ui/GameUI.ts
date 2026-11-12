/**
 * ECHO – THE WORLD REMEMBERS
 * Professional Cinematic Main Menu, Pause Menu, Settings, Minimap, Lore Modal & Mobile Touch Controls
 * Inspired by the reference design with luminous typography and glowing ancient portal backdrop.
 */

import { CrystalData } from '../world/EchoCrystals.ts';
import { InteractiveTarget, AncientInscription, MemoryShard } from '../world/WorldInteractions.ts';
import { PlayerMemoryProfile, BIOMES, BiomeType } from '../world/EchoMemorySystem.ts';
import { QuestSystem, StoryQuest, QuestObjective, NarrativeStoryEvent } from '../story/QuestSystem.ts';
import { DialogueNode, DialogueOption } from '../npc/NPCManager.ts';
import { CombatStats } from '../combat/CombatSystem.ts';

export type CustomizableControlId = 'joystick' | 'sprint' | 'jump' | 'attack' | 'dodge' | 'pulse' | 'interact';

export interface ControlPlacement {
  xPercent: number; // 0..1 horizontal ratio from left edge
  yPercent: number; // 0..1 vertical ratio from top edge
  scale: number;    // 0.70 .. 1.60
}

export type LayoutConfiguration = Record<CustomizableControlId, ControlPlacement>;

export interface UIEventCallbacks {
  onNewGame: () => void;
  onContinueGame: () => void;
  onOpenSettings: () => void;
  onExitGame: () => void;
  onToggleSound: () => void;
  onPauseToggle: () => void;
  onSaveGame: () => boolean;
  onResetPosition: () => void;
  onInteract: () => void;
  onJump: () => void;
  onTouchMove: (x: number, y: number, isSprint: boolean) => void;
  onTouchSprintToggle: () => boolean;
  onTouchSprintState?: (isPressed: boolean) => void;
  onUpdateVolume: (master: number, music: number) => void;
  onUpdateCameraSens: (sens: number) => void;
  getMemoryProfile: () => PlayerMemoryProfile;
  getQuestSystem?: () => QuestSystem;
  onCombatAttack?: () => void;
  onCombatDodge?: () => void;
  onCombatPulse?: () => void;
  onRespawnRequested?: () => void;
  getMultiplayerCoordinator?: () => any;
  onJoystickTouchState?: (touchId: number | null) => void;
}

export class GameUI {
  private root: HTMLElement;
  private titleScreen!: HTMLElement;
  private inGameHUD!: HTMLElement;
  private loreModal!: HTMLElement;
  private victoryModal!: HTMLElement;
  private pauseModal!: HTMLElement;
  private settingsModal!: HTMLElement;
  private multiplayerModal!: HTMLElement;
  private inscriptionModal!: HTMLElement;
  private worldMemoryModal!: HTMLElement;
  private toastNotification!: HTMLElement;
  private interactPrompt!: HTMLElement;
  private crystalSlotsContainer!: HTMLElement;
  private minimapCanvas!: HTMLCanvasElement;
  private soundBtn!: HTMLElement;
  private sprintTouchBtn!: HTMLElement;
  private touchInteractBtn!: HTMLElement;
  private joystickBase!: HTMLElement;
  private joystickKnob!: HTMLElement;
  private continueBtn!: HTMLElement;
  private continueStatus!: HTMLElement;

  private shardCountText!: HTMLElement;
  private shardProgressFill!: HTMLElement;

  // Quest Tracker & Story System UI elements
  private questCluster!: HTMLElement;
  private questChapterBadge!: HTMLElement;
  private questTitleText!: HTMLElement;
  private questObjectiveBadge!: HTMLElement;
  private questObjectiveTitleAr!: HTMLElement;
  private questObjectiveTitleEn!: HTMLElement;
  private questObjectiveHint!: HTMLElement;
  private questProgressBar!: HTMLElement;
  private questProgressText!: HTMLElement;
  private objectiveCompleteBanner!: HTMLElement;
  private objectiveCompleteTitle!: HTMLElement;
  private objectiveCompleteNext!: HTMLElement;
  private storyNarrativeModal!: HTMLElement;
  private storyNarrativeBadge!: HTMLElement;
  private storyNarrativeTitleAr!: HTMLElement;
  private storyNarrativeTitleEn!: HTMLElement;
  private storyNarrativeContentAr!: HTMLElement;
  private storyNarrativeContentEn!: HTMLElement;
  private storyNarrativeQuoteAr!: HTMLElement;
  private storyNarrativeQuoteEn!: HTMLElement;
  private questLogModal!: HTMLElement;
  private questLogList!: HTMLElement;

  private loreTitleAr!: HTMLElement;
  private loreTitleEn!: HTMLElement;
  private loreTextAr!: HTMLElement;
  private loreTextEn!: HTMLElement;
  private loreLocation!: HTMLElement;

  private inscriptionTitleAr!: HTMLElement;
  private inscriptionTitleEn!: HTMLElement;
  private inscriptionGlyph!: HTMLElement;
  private inscriptionLocation!: HTMLElement;
  private inscriptionTextAr!: HTMLElement;
  private inscriptionTextEn!: HTMLElement;

  private isPaused: boolean = false;
  private isModalOpen: boolean = false;
  private isTouchSprinting: boolean = false;
  public isAutoRunning: boolean = false;

  // Control Layout Customization properties
  public isCustomizingControls: boolean = false;
  private selectedControlId: CustomizableControlId = 'joystick';
  private currentDraftLayout: LayoutConfiguration | null = null;
  private controlsLayer!: HTMLElement;
  private layoutEditorOverlay!: HTMLElement;
  private editorScaleSlider!: HTMLInputElement;
  private editorScaleValueText!: HTMLElement;
  private editorSelectedNameText!: HTMLElement;
  private editorOrientationBadge!: HTMLElement;
  private isDraggingControl: boolean = false;
  private dragStartPointer = { x: 0, y: 0 };
  private dragStartPos = { x: 0, y: 0 };
  private activeDragElement: HTMLElement | null = null;
  private openedFromTitleScreen: boolean = false;

  // NPC Dialogue System UI elements
  private npcDialogueModal!: HTMLElement;
  private npcPortraitImg!: HTMLImageElement;
  private npcTitleBadge!: HTMLElement;
  private npcNameAr!: HTMLElement;
  private npcNameEn!: HTMLElement;
  private npcDialogueMessageAr!: HTMLElement;
  private npcDialogueMessageEn!: HTMLElement;
  private npcDialogueOptionsContainer!: HTMLElement;
  private onDialogueOptionSelectedCallback: ((option: DialogueOption) => void) | null = null;

  // Combat System UI elements
  private playerHpBarFill!: HTMLElement;
  private playerHpText!: HTMLElement;
  private playerEnergyBarFill!: HTMLElement;
  private playerEnergyText!: HTMLElement;
  private playerPulseBadge!: HTMLElement;
  private hurtVignetteOverlay!: HTMLElement;
  private deathModal!: HTMLElement;
  private deathReviveBtn!: HTMLElement;
  private touchAttackBtn!: HTMLElement;
  private touchDodgeBtn!: HTMLElement;
  private touchPulseBtn!: HTMLElement;
  private onDeathReviveCallback: (() => void) | null = null;

  // Joystick touch state
  private joystickTouchId: number | null = null;
  private joystickCenter = { x: 0, y: 0 };
  private readonly joystickRadius = 55;

  constructor(private callbacks: UIEventCallbacks) {
    this.root = document.getElementById('root') || document.body;
    this.buildDOM();
    this.setupVirtualJoystick();
  }

  private buildDOM(): void {
    const existing = document.getElementById('echo-ui-wrapper');
    if (existing) existing.remove();

    const wrapper = document.createElement('div');
    wrapper.id = 'echo-ui-wrapper';
    wrapper.innerHTML = `
      <style>
        #echo-ui-wrapper {
          position: absolute;
          inset: 0;
          pointer-events: none;
          user-select: none;
          -webkit-user-select: none;
          font-family: 'Plus Jakarta Sans', 'Google Sans', sans-serif;
          color: #ffffff;
          overflow: hidden;
          z-index: 20;
        }

        .interactive {
          pointer-events: auto;
        }

        /* Cinematic Main Menu */
        #title-screen {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: clamp(2rem, 5vw, 4.5rem);
          background: linear-gradient(
            to right,
            rgba(4, 9, 16, 0.92) 0%,
            rgba(4, 9, 16, 0.72) 38%,
            rgba(4, 9, 16, 0.25) 70%,
            rgba(4, 9, 16, 0.4) 100%
          );
          transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.8s;
          pointer-events: auto;
          box-sizing: border-box;
        }

        #title-screen.hidden {
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
        }

        /* Top-Left / Left Menu Column */
        .title-brand-column {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          max-width: 460px;
        }

        .title-brand-lockup {
          margin-bottom: 2.4rem;
        }

        .title-main-glow {
          font-family: 'Cinzel', serif;
          font-size: clamp(3.2rem, 8vw, 5.8rem);
          font-weight: 900;
          letter-spacing: 0.35rem;
          line-height: 0.95;
          margin: 0;
          background: linear-gradient(135deg, #ffffff 30%, #70e1ff 75%, #00b4d8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 0 28px rgba(0, 245, 212, 0.65));
        }

        .title-tagline {
          font-family: 'Cinzel', serif;
          font-size: clamp(0.75rem, 1.8vw, 1.05rem);
          font-weight: 700;
          letter-spacing: 0.25rem;
          color: #7ce8ff;
          text-transform: uppercase;
          margin-top: 0.5rem;
          opacity: 0.95;
          text-shadow: 0 0 12px rgba(0, 180, 216, 0.6);
        }

        .title-arabic-sub {
          font-family: 'Amiri', serif;
          font-size: clamp(1.2rem, 2.4vw, 1.7rem);
          color: #c4e9e4;
          margin-top: 0.35rem;
          letter-spacing: 0.05rem;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.8);
        }

        /* Menu Options Stack (Inspired by reference screenshot) */
        .menu-options-stack {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 1.15rem;
          margin-top: 0.5rem;
        }

        .menu-nav-btn {
          position: relative;
          background: none;
          border: none;
          padding: 0.5rem 0;
          font-family: 'Cinzel', serif;
          font-size: clamp(1.25rem, 2.6vw, 1.75rem);
          font-weight: 700;
          letter-spacing: 0.16rem;
          color: #a5d8ea;
          cursor: pointer;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 0.9rem;
          transition: all 0.25s ease;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.7);
        }

        .menu-nav-btn::before {
          content: '';
          display: inline-block;
          width: 0;
          height: 3px;
          background: #00f5d4;
          box-shadow: 0 0 12px #00f5d4;
          border-radius: 2px;
          transition: width 0.25s ease;
        }

        .menu-nav-btn:hover {
          color: #ffffff;
          transform: translateX(8px);
          text-shadow: 0 0 18px rgba(0, 245, 212, 0.85);
        }

        .menu-nav-btn:hover::before {
          width: 22px;
        }

        .menu-nav-btn.primary {
          color: #00f5d4;
        }

        .menu-nav-btn .sub-label {
          font-family: 'Amiri', serif;
          font-size: clamp(0.95rem, 1.8vw, 1.2rem);
          color: #72a5b8;
          font-weight: 400;
          letter-spacing: 0;
          text-transform: none;
          margin-left: 0.4rem;
        }

        .menu-nav-btn:hover .sub-label {
          color: #c4f5ea;
        }

        .btn-status-badge {
          font-size: 0.72rem;
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: rgba(0, 245, 212, 0.18);
          border: 1px solid rgba(0, 245, 212, 0.4);
          color: #80ffea;
          padding: 0.15rem 0.6rem;
          border-radius: 9999px;
          letter-spacing: 0.05rem;
        }

        /* Bottom Menu Footer Hints */
        .title-bottom-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          border-top: 1px solid rgba(0, 245, 212, 0.15);
          padding-top: 1.2rem;
          font-size: 0.85rem;
          color: #78a2b5;
        }

        .controls-hint-inline {
          display: flex;
          gap: 1.2rem;
          align-items: center;
          flex-wrap: wrap;
        }

        .controls-hint-inline kbd {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(0, 245, 212, 0.3);
          border-radius: 4px;
          padding: 0.15rem 0.45rem;
          color: #00f5d4;
          font-size: 0.75rem;
        }

        /* In-Game HUD */
        #ingame-hud {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 1.4rem;
          transition: opacity 0.4s ease;
        }

        #ingame-hud.hidden {
          display: none;
        }

        .hud-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          width: 100%;
        }

        .quest-cluster {
          background: rgba(8, 18, 30, 0.88);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(0, 245, 212, 0.35);
          border-radius: 14px;
          padding: 0.65rem 0.85rem;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          max-width: 310px;
          box-shadow: 0 6px 24px rgba(0, 0, 0, 0.5), inset 0 0 12px rgba(0, 245, 212, 0.06);
          transition: all 0.3s ease;
          pointer-events: auto;
        }

        .quest-cluster:hover {
          border-color: rgba(0, 245, 212, 0.65);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.6), 0 0 16px rgba(0, 245, 212, 0.18);
        }

        .quest-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.45rem;
          border-bottom: 1px solid rgba(0, 245, 212, 0.18);
          padding-bottom: 0.3rem;
        }

        .quest-chapter-badge {
          font-family: 'Cinzel', serif;
          font-size: 0.64rem;
          letter-spacing: 0.1rem;
          color: #fee440;
          font-weight: 700;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .quest-title-text {
          font-family: 'Cinzel', serif;
          font-size: 0.82rem;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: 0.05rem;
          text-shadow: 0 0 10px rgba(0, 245, 212, 0.5);
        }

        .quest-journal-shortcut-btn {
          background: rgba(0, 245, 212, 0.1);
          border: 1px solid rgba(0, 245, 212, 0.3);
          border-radius: 6px;
          color: #80ffea;
          font-size: 0.65rem;
          font-weight: 700;
          padding: 0.15rem 0.45rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          transition: all 0.2s ease;
        }

        .quest-journal-shortcut-btn:hover {
          background: rgba(0, 245, 212, 0.22);
          color: #ffffff;
          border-color: #00f5d4;
          transform: scale(1.03);
        }

        .quest-objective-active-card {
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(254, 228, 64, 0.22);
          border-radius: 9px;
          padding: 0.45rem 0.65rem;
          display: flex;
          flex-direction: column;
          gap: 0.22rem;
        }

        .quest-objective-headline {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .quest-step-pill {
          background: linear-gradient(135deg, #00f5d4, #00bbf9);
          color: #041018;
          font-weight: 900;
          font-size: 0.65rem;
          padding: 0.1rem 0.35rem;
          border-radius: 9999px;
          letter-spacing: 0.03rem;
          box-shadow: 0 0 8px rgba(0, 245, 212, 0.45);
        }

        .quest-objective-names {
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .quest-objective-name-ar {
          font-family: 'Amiri', serif;
          font-size: 1rem;
          font-weight: 700;
          color: #ffffff;
          line-height: 1.2;
        }

        .quest-objective-name-en {
          font-size: 0.68rem;
          color: #80ffea;
          opacity: 0.85;
          letter-spacing: 0.03rem;
        }

        .quest-objective-hint-text {
          font-size: 0.7rem;
          color: #c4e9e4;
          line-height: 1.3;
          display: flex;
          align-items: flex-start;
          gap: 0.25rem;
          background: rgba(254, 228, 64, 0.06);
          border-left: 2px solid #fee440;
          padding: 0.25rem 0.4rem;
          border-radius: 4px;
        }

        .quest-progress-track {
          width: 100%;
          height: 5px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 9999px;
          overflow: hidden;
          margin-top: 0.1rem;
        }

        .quest-progress-fill {
          height: 100%;
          width: 0%;
          background: linear-gradient(90deg, #00f5d4, #fee440);
          box-shadow: 0 0 10px #00f5d4;
          border-radius: 9999px;
          transition: width 0.4s ease;
        }

        /* Objective Complete Sliding Top Banner */
        #objective-complete-banner {
          position: absolute;
          top: 1.5rem;
          left: 50%;
          transform: translateX(-50%) translateY(-120%);
          background: linear-gradient(135deg, rgba(8, 22, 36, 0.96) 0%, rgba(14, 38, 54, 0.98) 100%);
          border: 1.5px solid #fee440;
          border-radius: 20px;
          padding: 0.85rem 2.2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.3rem;
          box-shadow: 0 10px 45px rgba(254, 228, 64, 0.45), 0 0 30px rgba(0, 245, 212, 0.3);
          z-index: 60;
          transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s ease;
          opacity: 0;
          pointer-events: none;
          text-align: center;
          min-width: 320px;
        }

        #objective-complete-banner.show {
          transform: translateX(-50%) translateY(0);
          opacity: 1;
        }

        .banner-kicker {
          font-family: 'Cinzel', serif;
          font-size: 0.8rem;
          letter-spacing: 0.2rem;
          color: #fee440;
          font-weight: 800;
          text-transform: uppercase;
          text-shadow: 0 0 10px rgba(254, 228, 64, 0.8);
        }

        .banner-title {
          font-family: 'Amiri', serif;
          font-size: 1.55rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
        }

        .banner-next-unlocked {
          font-size: 0.85rem;
          color: #80ffea;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        /* Story Narrative Dialog Card */
        #story-narrative-modal .modal-card {
          max-width: 650px;
          border: 1.5px solid #00f5d4;
          background: linear-gradient(
            165deg,
            rgba(10, 24, 38, 0.98) 0%,
            rgba(6, 15, 24, 0.99) 50%,
            rgba(4, 9, 16, 0.99) 100%
          );
          box-shadow: 0 10px 60px rgba(0, 245, 212, 0.35), 0 0 30px rgba(0, 180, 216, 0.25);
          position: relative;
          overflow: hidden;
        }

        #story-narrative-modal .modal-card::before {
          content: '';
          position: absolute;
          top: -50px;
          left: 50%;
          transform: translateX(-50%);
          width: 240px;
          height: 120px;
          background: radial-gradient(ellipse at center, rgba(0, 245, 212, 0.45) 0%, transparent 70%);
          pointer-events: none;
        }

        .story-narrative-text-box {
          background: rgba(0, 0, 0, 0.38);
          border: 1px solid rgba(0, 245, 212, 0.25);
          border-radius: 16px;
          padding: 1.3rem 1.6rem;
          text-align: right;
          direction: rtl;
          margin: 0.4rem 0;
        }

        .story-narrative-ar {
          font-family: 'Amiri', serif;
          font-size: 1.35rem;
          line-height: 1.85;
          color: #f0f7f4;
          margin: 0;
          white-space: pre-line;
        }

        .story-narrative-en {
          font-size: 0.92rem;
          line-height: 1.6;
          color: #a5d8ea;
          margin-top: 0.8rem;
          padding-top: 0.8rem;
          border-top: 1px dashed rgba(0, 245, 212, 0.2);
          text-align: left;
          direction: ltr;
        }

        /* Quest Journal Checklist Items */
        .quest-checklist-item {
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 0.85rem 1.1rem;
          display: flex;
          align-items: flex-start;
          gap: 0.9rem;
          transition: all 0.25s ease;
        }

        .quest-checklist-item.completed {
          background: rgba(0, 245, 212, 0.07);
          border-color: rgba(0, 245, 212, 0.35);
        }

        .quest-checklist-item.active {
          background: rgba(254, 228, 64, 0.09);
          border-color: rgba(254, 228, 64, 0.45);
          box-shadow: 0 0 16px rgba(254, 228, 64, 0.2);
        }

        .quest-checklist-item.locked {
          opacity: 0.45;
        }

        .quest-status-icon {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.85rem;
          font-weight: 800;
          flex-shrink: 0;
          margin-top: 0.15rem;
        }

        .quest-status-icon.done {
          background: #00f5d4;
          color: #041018;
          box-shadow: 0 0 10px #00f5d4;
        }

        .quest-status-icon.current {
          background: #fee440;
          color: #041018;
          box-shadow: 0 0 12px #fee440;
          animation: pulseIcon 1.5s infinite;
        }

        .quest-status-icon.lock {
          background: rgba(255, 255, 255, 0.1);
          color: #728994;
        }

        @keyframes pulseIcon {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.12); }
        }

        .crystal-slots {
          display: flex;
          gap: 0.45rem;
          margin-top: 0.2rem;
        }

        .crystal-slot {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 1.5px solid rgba(255, 255, 255, 0.25);
          background: rgba(255, 255, 255, 0.05);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .crystal-slot.active {
          box-shadow: 0 0 10px currentColor;
          transform: scale(1.15);
        }

        .hud-actions {
          display: flex;
          gap: 0.6rem;
        }

        .icon-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(10, 22, 34, 0.82);
          border: 1px solid rgba(0, 245, 212, 0.3);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .icon-btn:hover {
          background: rgba(0, 245, 212, 0.25);
          border-color: #00f5d4;
          transform: scale(1.06);
        }

        /* Minimap / Compass */
        .minimap-box {
          position: relative;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          border: 2px solid rgba(0, 245, 212, 0.45);
          background: rgba(6, 14, 22, 0.88);
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        }

        #minimap-canvas {
          width: 100%;
          height: 100%;
        }

        /* Interaction Prompt */
        #interact-prompt {
          position: absolute;
          bottom: 7.2rem;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(10, 22, 34, 0.92);
          border: 1.5px solid #00f5d4;
          border-radius: 9999px;
          padding: 0.75rem 1.8rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-weight: 600;
          font-size: 0.95rem;
          color: #ffffff;
          box-shadow: 0 0 25px rgba(0, 245, 212, 0.45);
          transition: all 0.3s ease;
          opacity: 0;
          visibility: hidden;
          cursor: pointer;
        }

        #interact-prompt.visible {
          opacity: 1;
          visibility: visible;
        }

        #interact-prompt kbd {
          background: #00f5d4;
          color: #061019;
          font-weight: 800;
          padding: 0.2rem 0.5rem;
          border-radius: 6px;
        }

        /* Touch Controls Layer & Customizable Controls */
        #touch-controls-layer {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
          z-index: 25;
        }

        .customizable-control {
          position: absolute !important;
          pointer-events: auto;
          touch-action: none;
          user-select: none;
          -webkit-user-select: none;
          transform-origin: center center;
          transition: box-shadow 0.2s ease, outline 0.2s ease;
        }

        .control-edit-badge {
          display: none;
          position: absolute;
          top: -24px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(4, 18, 28, 0.95);
          border: 1px solid #00f5d4;
          color: #00f5d4;
          font-size: 0.65rem;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 9999px;
          white-space: nowrap;
          pointer-events: none;
          z-index: 40;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.7);
        }

        .hud-editing .control-edit-badge {
          display: block;
        }

        .hud-editing .customizable-control {
          outline: 2px dashed rgba(0, 245, 212, 0.75);
          outline-offset: 4px;
          cursor: grab;
        }

        .hud-editing .customizable-control:active {
          cursor: grabbing;
        }

        .hud-editing .customizable-control.selected-edit-target {
          outline: 3px solid #ffffff;
          outline-offset: 4px;
          box-shadow: 0 0 25px rgba(0, 245, 212, 0.95), 0 0 40px rgba(0, 180, 216, 0.6);
        }

        /* On-Screen Virtual Analog Joystick */
        #virtual-joystick-container {
          width: 130px;
          height: 130px;
        }

        #joystick-base {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0, 245, 212, 0.12) 0%, rgba(10, 22, 34, 0.65) 100%);
          border: 2px solid rgba(0, 245, 212, 0.38);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        #joystick-knob {
          position: absolute;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: radial-gradient(circle, #00f5d4 0%, #00b4d8 100%);
          box-shadow: 0 0 15px rgba(0, 245, 212, 0.6);
          border: 2px solid #ffffff;
          transform: translate(0px, 0px);
          transition: transform 0.05s ease-out;
        }

        /* Fullscreen HUD Controls Layout Editor (Edit Mode) */
        #hud-layout-editor-overlay {
          position: absolute;
          inset: 0;
          background: rgba(4, 9, 16, 0.72);
          backdrop-filter: blur(4px);
          pointer-events: none;
          z-index: 2000;
          display: none;
          flex-direction: column;
          justify-content: space-between;
          padding: 0.8rem 1.2rem;
          box-sizing: border-box;
        }

        #hud-layout-editor-overlay.active {
          display: flex;
          pointer-events: none;
        }

        .editor-toolbar {
          pointer-events: auto !important;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 0.8rem;
          background: rgba(8, 20, 32, 0.96);
          border: 1.5px solid rgba(0, 245, 212, 0.65);
          border-radius: 18px;
          padding: 0.75rem 1.25rem;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.85);
          z-index: 2200 !important;
        }

        .editor-toolbar button,
        .editor-toolbar input {
          pointer-events: auto !important;
          touch-action: manipulation;
        }

        .editor-footer {
          pointer-events: auto !important;
          align-self: center;
          background: rgba(8, 20, 32, 0.94);
          border: 1px solid rgba(0, 245, 212, 0.55);
          border-radius: 9999px;
          padding: 0.55rem 1.5rem;
          font-size: 0.85rem;
          color: #e2f1f8;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.75);
          text-align: center;
          z-index: 2200 !important;
          user-select: none;
        }

        .hud-editing #touch-controls-layer {
          z-index: 1000 !important;
          pointer-events: none !important;
        }

        .hud-editing .customizable-control {
          z-index: 1500 !important;
          pointer-events: auto !important;
        }

        /* Mobile Touch Action Cluster (Right side) */
        .mobile-controls {
          position: absolute;
          bottom: 2rem;
          right: 2rem;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.9rem;
          pointer-events: auto;
        }

        .action-row {
          display: flex;
          gap: 0.85rem;
        }

        .action-touch-btn {
          width: 62px;
          height: 62px;
          border-radius: 50%;
          background: rgba(10, 22, 34, 0.88);
          border: 2px solid rgba(0, 245, 212, 0.55);
          color: #00f5d4;
          font-weight: 700;
          font-size: 0.85rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.5);
          cursor: pointer;
          touch-action: none;
          transition: all 0.15s ease;
        }

        .action-touch-btn.active,
        .action-touch-btn:active {
          background: #00f5d4;
          color: #05141f;
          transform: scale(0.92);
          box-shadow: 0 0 20px rgba(0, 245, 212, 0.8);
        }

        .action-touch-btn.auto-run-active {
          background: linear-gradient(135deg, rgba(0, 245, 212, 0.95) 0%, rgba(0, 187, 249, 0.95) 100%) !important;
          color: #04121a !important;
          border-color: #ffffff !important;
          box-shadow: 0 0 25px rgba(0, 245, 212, 0.95), 0 0 10px #ffffff !important;
          animation: pulse-auto-run 1.8s infinite ease-in-out !important;
        }

        .action-touch-btn.auto-run-active span {
          color: #04121a !important;
          font-weight: 900 !important;
        }

        @keyframes pulse-auto-run {
          0%, 100% {
            box-shadow: 0 0 18px rgba(0, 245, 212, 0.8), 0 0 4px #ffffff;
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 30px rgba(0, 245, 212, 1), 0 0 10px #ffffff;
            transform: scale(1.05);
          }
        }

        .action-touch-btn span:first-child {
          font-size: 0.9rem;
          font-weight: 800;
        }

        .action-touch-btn span:last-child {
          font-family: 'Amiri', serif;
          font-size: 0.72rem;
          opacity: 0.85;
        }

        /* Modals: Lore, Victory, Pause, Settings */
        .modal-overlay {
          position: absolute;
          inset: 0;
          background: rgba(4, 9, 15, 0.88);
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 2rem;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.4s ease, visibility 0.4s ease;
          pointer-events: auto;
        }

        .modal-overlay.open {
          opacity: 1;
          visibility: visible;
        }

        .modal-card {
          background: linear-gradient(145deg, rgba(14, 28, 43, 0.96) 0%, rgba(8, 16, 26, 0.98) 100%);
          border: 1.5px solid rgba(0, 245, 212, 0.45);
          border-radius: 24px;
          padding: 2.2rem;
          max-width: 560px;
          width: 100%;
          box-shadow: 0 10px 50px rgba(0, 245, 212, 0.28);
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
          transform: translateY(20px);
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .modal-overlay.open .modal-card {
          transform: translateY(0);
        }

        .modal-badge {
          font-family: 'Cinzel', serif;
          font-size: 0.85rem;
          letter-spacing: 0.2rem;
          color: #00f5d4;
          text-transform: uppercase;
        }

        .modal-title-ar {
          font-family: 'Amiri', serif;
          font-size: 2.2rem;
          color: #ffffff;
          margin: 0;
        }

        .modal-title-en {
          font-family: 'Cinzel', serif;
          font-size: 1.25rem;
          color: #80ffea;
          margin: 0;
        }

        .modal-btn {
          align-self: center;
          background: linear-gradient(135deg, #00f5d4 0%, #00bbf9 100%);
          color: #061924;
          border: none;
          padding: 0.85rem 2.2rem;
          font-weight: 700;
          font-size: 1rem;
          letter-spacing: 0.1rem;
          border-radius: 9999px;
          cursor: pointer;
          box-shadow: 0 0 20px rgba(0, 245, 212, 0.4);
          transition: transform 0.2s ease;
        }

        .modal-btn:hover {
          transform: scale(1.04);
        }

        .modal-btn.secondary {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
          box-shadow: none;
          border: 1px solid rgba(0, 245, 212, 0.3);
        }

        .modal-btn.secondary:hover {
          background: rgba(0, 245, 212, 0.2);
          border-color: #00f5d4;
        }

        /* Settings Sliders & Controls */
        .setting-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          font-size: 0.95rem;
        }

        .setting-label {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.2rem;
        }

        .setting-sub {
          font-size: 0.78rem;
          color: #72a5b8;
        }

        input[type="range"] {
          accent-color: #00f5d4;
          cursor: pointer;
          width: 140px;
        }

        /* Toast Notifications */
        #toast-notification {
          position: absolute;
          top: 2rem;
          left: 50%;
          transform: translateX(-50%) translateY(-30px);
          background: rgba(10, 22, 34, 0.95);
          border: 1px solid #00f5d4;
          color: #ffffff;
          padding: 0.65rem 1.6rem;
          border-radius: 9999px;
          font-size: 0.9rem;
          font-weight: 600;
          box-shadow: 0 4px 25px rgba(0, 245, 212, 0.4);
          opacity: 0;
          visibility: hidden;
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 50;
        }

        #toast-notification.show {
          opacity: 1;
          visibility: visible;
          transform: translateX(-50%) translateY(0);
        }

        /* Combat Status & Health HUD - Bottom Center, Transparent, Lines only */
        .combat-cluster {
          position: absolute;
          bottom: 1.5rem;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          width: min(340px, calc(100vw - 40px));
          background: transparent !important;
          background-color: transparent !important;
          border: none !important;
          outline: none !important;
          border-radius: 0 !important;
          padding: 0 !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          box-shadow: none !important;
          pointer-events: none;
          z-index: 25;
        }

        .combat-bar-wrapper {
          display: flex;
          flex-direction: column;
          gap: 0.22rem;
          width: 100%;
          background: transparent !important;
        }

        .combat-bar-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.08rem;
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.95), 0 0 10px rgba(0, 0, 0, 0.85);
          user-select: none;
        }

        .combat-meta-title-hp {
          color: #ff3344;
          font-family: 'Cinzel', serif;
          font-weight: 800;
          letter-spacing: 0.12rem;
          text-shadow: 0 0 10px rgba(255, 51, 68, 0.5), 0 1px 4px rgba(0, 0, 0, 0.95);
        }

        .combat-meta-title-energy {
          color: #10b981;
          font-family: 'Cinzel', serif;
          font-weight: 800;
          letter-spacing: 0.12rem;
          text-shadow: 0 0 10px rgba(16, 185, 129, 0.5), 0 1px 4px rgba(0, 0, 0, 0.95);
        }

        .combat-value-display {
          color: #ffffff;
          font-family: 'Plus Jakarta Sans', monospace;
          font-weight: 700;
          font-size: 0.72rem;
          letter-spacing: 0.04rem;
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.95);
        }

        .combat-bar-track {
          width: 100%;
          height: 6px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 9999px;
          overflow: hidden;
          position: relative;
          box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.5);
        }

        .combat-bar-fill {
          height: 100%;
          transition: width 0.25s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.3s ease;
          border-radius: 9999px;
        }

        /* Pure clean red line for HEALTH with subtle soft glow */
        .combat-bar-hp {
          background: linear-gradient(90deg, #e63946 0%, #ff3355 70%, #ff5c77 100%);
          box-shadow: 0 0 8px rgba(255, 51, 85, 0.55), 0 0 14px rgba(255, 51, 85, 0.25);
        }

        .combat-bar-hp.low {
          background: linear-gradient(90deg, #d90429 0%, #ff1744 100%);
          box-shadow: 0 0 12px rgba(255, 23, 68, 0.85), 0 0 20px rgba(255, 23, 68, 0.45);
          animation: pulseHealth 0.8s infinite alternate;
        }

        @keyframes pulseHealth {
          0% { filter: brightness(1); }
          100% { filter: brightness(1.35); }
        }

        /* Pure clean green line for ECHO ENERGY with subtle soft glow */
        .combat-bar-energy {
          background: linear-gradient(90deg, #059669 0%, #10b981 60%, #34d399 100%);
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.55), 0 0 14px rgba(16, 185, 129, 0.25);
        }

        .combat-bar-energy.pulse-ready {
          background: linear-gradient(90deg, #10b981 0%, #34d399 50%, #6ee7b7 100%);
          box-shadow: 0 0 10px rgba(52, 211, 153, 0.75), 0 0 18px rgba(16, 185, 129, 0.4);
        }

        .combat-keybinds-row {
          display: flex;
          justify-content: center;
          gap: 0.65rem;
          font-size: 0.64rem;
          color: rgba(255, 255, 255, 0.65);
          margin-top: 0.1rem;
          align-items: center;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.95);
        }

        .combat-keybinds-row kbd {
          background: rgba(0, 0, 0, 0.4);
          padding: 0.08rem 0.32rem;
          border-radius: 3px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          color: #ffffff;
          font-weight: 700;
        }

        /* Screen Orientation: Portrait Adaptations */
        @media (orientation: portrait), (max-width: 680px) {
          #title-screen {
            padding: 2rem 1.4rem;
          }
          .title-main-glow {
            font-size: 3.2rem;
          }
          .title-tagline {
            font-size: 0.72rem;
          }
          .title-arabic-sub {
            font-size: 1.15rem;
          }
          .menu-options-stack {
            gap: 0.8rem;
          }
          .menu-nav-btn {
            font-size: 1.2rem;
            gap: 0.6rem;
          }
          .title-bottom-footer {
            flex-direction: column;
            gap: 0.6rem;
            align-items: flex-start;
          }

          /* HUD layout in Portrait */
          #ingame-hud {
            padding: 0.8rem;
          }
          .hud-top {
            flex-direction: row;
            justify-content: space-between;
            align-items: flex-start;
            gap: 0.5rem;
          }
          .quest-cluster {
            max-width: 220px;
            padding: 0.45rem 0.65rem;
            gap: 0.22rem;
            border-radius: 11px;
          }
          .quest-header-row {
            padding-bottom: 0.2rem;
          }
          .quest-title-text {
            font-size: 0.72rem;
          }
          .quest-objective-active-card {
            padding: 0.35rem 0.5rem;
            gap: 0.18rem;
          }
          .quest-objective-name-ar {
            font-size: 0.88rem;
          }
          .quest-objective-name-en {
            font-size: 0.62rem;
          }
          .quest-objective-hint-text {
            font-size: 0.64rem;
            padding: 0.15rem 0.3rem;
          }
          .minimap-box {
            width: 75px;
            height: 75px;
          }
          .hud-actions {
            gap: 0.35rem;
          }
          .icon-btn {
            width: 35px;
            height: 35px;
          }
          .icon-btn svg {
            width: 17px;
            height: 17px;
          }

          /* Virtual controls in Portrait */
          #virtual-joystick-container {
            bottom: 1.4rem;
            left: 1rem;
            width: 115px;
            height: 115px;
          }
          #joystick-knob {
            width: 46px;
            height: 46px;
          }
          .mobile-controls {
            bottom: 1.4rem;
            right: 0.8rem;
            gap: 0.5rem;
          }
          .action-row {
            gap: 0.4rem;
          }
          .combat-touch-btn {
            width: 50px;
            height: 50px;
          }
          .action-touch-btn {
            width: 50px;
            height: 50px;
          }

          /* Health & Energy HUD in Portrait */
          .combat-cluster {
            bottom: 1.15rem;
            width: min(190px, 44vw);
            gap: 0.35rem;
          }
          .combat-bar-meta {
            font-size: 0.64rem;
          }
          .combat-value-display {
            font-size: 0.64rem;
          }
          .combat-bar-track {
            height: 5px;
          }
          .combat-keybinds-row {
            display: none;
          }
          #interact-prompt {
            bottom: 5.8rem;
            padding: 0.5rem 1.2rem;
            font-size: 0.82rem;
          }
        }

        /* Screen Orientation: Landscape Adaptations (Short / Wide Screens) */
        @media (orientation: landscape) and (max-height: 560px) {
          #ingame-hud {
            padding: 0.8rem 1.4rem;
          }
          .quest-cluster {
            max-width: 270px;
            padding: 0.45rem 0.7rem;
            gap: 0.25rem;
          }
          .minimap-box {
            width: 85px;
            height: 85px;
          }
          .icon-btn {
            width: 36px;
            height: 36px;
          }
          #virtual-joystick-container {
            bottom: 1.1rem;
            left: 1.4rem;
            width: 110px;
            height: 110px;
          }
          .mobile-controls {
            bottom: 1.1rem;
            right: 1.4rem;
            gap: 0.4rem;
          }
          .combat-touch-btn {
            width: 48px;
            height: 48px;
          }
          .action-touch-btn {
            width: 50px;
            height: 50px;
          }
          .combat-cluster {
            bottom: 0.95rem;
            width: 250px;
            gap: 0.35rem;
          }
          .combat-keybinds-row {
            display: none;
          }
          #interact-prompt {
            bottom: 4.8rem;
            padding: 0.45rem 1.2rem;
            font-size: 0.82rem;
          }
        }

        /* Upside-down Prevention Blocker Overlay */
        .upside-down-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: radial-gradient(circle at center, #0a1828 0%, #03060a 100%);
          z-index: 99999;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: 2rem;
          pointer-events: auto;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }

        .upside-down-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.1rem;
          max-width: 380px;
          border: 1.5px solid rgba(0, 245, 212, 0.5);
          border-radius: 24px;
          padding: 2.2rem;
          background: linear-gradient(145deg, rgba(14, 28, 43, 0.96) 0%, rgba(8, 16, 26, 0.98) 100%);
          box-shadow: 0 10px 50px rgba(0, 245, 212, 0.3);
        }

        .upside-down-icon {
          font-size: 3.4rem;
          animation: rotateHintAnim 2.2s infinite ease-in-out;
        }

        @keyframes rotateHintAnim {
          0%, 100% { transform: rotate(180deg); }
          50% { transform: rotate(0deg); }
        }

        .upside-down-title-ar {
          font-family: 'Amiri', serif;
          font-size: 1.7rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
        }

        .upside-down-title-en {
          font-family: 'Cinzel', serif;
          font-size: 0.95rem;
          color: #80ffea;
          letter-spacing: 0.06rem;
          margin: 0;
        }

        .upside-down-desc {
          font-size: 0.85rem;
          color: #a5d8ea;
          line-height: 1.4;
          margin: 0;
        }

        /* Hurt Vignette */
        #hurt-vignette {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, transparent 30%, rgba(240, 20, 60, 0.55) 100%);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.15s ease-out;
          z-index: 18;
        }

        #hurt-vignette.active {
          opacity: 1;
        }

        /* Death Screen Modal */
        #death-modal .modal-card {
          border-color: #ff3366;
          box-shadow: 0 10px 60px rgba(255, 51, 102, 0.4), 0 0 30px rgba(160, 10, 40, 0.3);
          background: linear-gradient(165deg, rgba(30, 8, 14, 0.98) 0%, rgba(12, 4, 8, 0.99) 100%);
        }

        .death-rune-symbol {
          font-size: 3rem;
          color: #ff3366;
          text-shadow: 0 0 25px rgba(255, 51, 102, 0.8);
          animation: deathPulse 2s infinite ease-in-out;
        }

        @keyframes deathPulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.1); opacity: 1; text-shadow: 0 0 35px #ff3366; }
        }

        /* Touch Combat Action Buttons */
        .combat-touch-btn {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          border: 1.5px solid rgba(0, 245, 212, 0.5);
          background: rgba(6, 18, 28, 0.85);
          color: #ffffff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
          touch-action: none;
          cursor: pointer;
          transition: transform 0.12s ease, border-color 0.2s ease, background 0.2s ease;
        }

        .combat-touch-btn:active {
          transform: scale(0.92);
          border-color: #00f5d4;
          background: rgba(0, 245, 212, 0.25);
        }

        .combat-touch-btn.attack {
          border-color: rgba(254, 228, 64, 0.6);
        }
        .combat-touch-btn.attack:active {
          background: rgba(254, 228, 64, 0.25);
        }

        .combat-touch-btn.pulse {
          border-color: rgba(160, 90, 255, 0.8);
          box-shadow: 0 0 15px rgba(160, 90, 255, 0.4);
        }
        .combat-touch-btn.pulse:active {
          background: rgba(160, 90, 255, 0.35);
        }
      </style>

      <!-- Hurt Vignette Screen Flash -->
      <div id="hurt-vignette"></div>

      <!-- Toast Notification -->
      <div id="toast-notification">Notification</div>

      <!-- Objective Complete Sliding Banner -->
      <div id="objective-complete-banner">
        <div class="banner-kicker">✦ هدف مكتمل · OBJECTIVE COMPLETED ✦</div>
        <div id="objective-complete-title" class="banner-title">استكشف الجزيرة</div>
        <div id="objective-complete-next" class="banner-next-unlocked">
          <span>الهدف التالي: اجمع ثلاث شظايا ذاكرة</span>
        </div>
      </div>

      <!-- Cinematic Main Menu Screen -->
      <div id="title-screen">
        <div class="title-brand-column">
          <div class="title-brand-lockup">
            <h1 class="title-main-glow">ECHO</h1>
            <div class="title-tagline">THE WORLD REMEMBERS</div>
            <div class="title-arabic-sub">صَدَى – العَالَمُ يَتَذَكَّر</div>
          </div>

          <!-- Menu Stack (Matches Reference Image Layout) -->
          <div class="menu-options-stack">
            <button id="menu-continue-btn" class="menu-nav-btn primary interactive">
              <span>CONTINUE</span>
              <span class="sub-label">متابعة</span>
              <span id="continue-status-badge" class="btn-status-badge">Resume</span>
            </button>

            <button id="menu-new-game-btn" class="menu-nav-btn interactive">
              <span>NEW JOURNEY</span>
              <span class="sub-label">رحلة جديدة</span>
            </button>

            <button id="menu-quest-log-btn" class="menu-nav-btn interactive" style="color: #00f5d4;">
              <span>THE FIRST MEMORY</span>
              <span class="sub-label">القصة والمهام</span>
            </button>

            <button id="menu-memory-btn" class="menu-nav-btn interactive" style="color: #fee440;">
              <span>WORLD MEMORY</span>
              <span class="sub-label">ذاكرة العالم</span>
            </button>

            <button id="menu-multiplayer-btn" class="menu-nav-btn interactive" style="color: #00f5d4; border-color: rgba(0, 245, 212, 0.4);">
              <span>CO-OP & MULTIPLAYER</span>
              <span class="sub-label">اللعب الجماعي والمجموعات</span>
            </button>

            <button id="menu-settings-btn" class="menu-nav-btn interactive">
              <span>SETTINGS</span>
              <span class="sub-label">الإعدادات</span>
            </button>

            <button id="menu-exit-btn" class="menu-nav-btn interactive">
              <span>EXIT GAME</span>
              <span class="sub-label">خروج</span>
            </button>
          </div>
        </div>

        <div class="title-bottom-footer">
          <div class="controls-hint-inline">
            <div><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> Move</div>
            <div><kbd>SHIFT</kbd> Sprint</div>
            <div><kbd>SPACE</kbd> Jump</div>
            <div><kbd>E</kbd> Interact</div>
            <div><kbd>Q</kbd> Quest Log</div>
            <div><kbd>M</kbd> World Memory</div>
            <div><kbd>ESC</kbd> Pause</div>
          </div>
          <div style="opacity: 0.7; font-size: 0.8rem;">
            The Forgotten Island · 3D Adventure
          </div>
        </div>
      </div>

      <!-- In-Game HUD -->
      <div id="ingame-hud" class="hidden">
        <div class="hud-top">
          <div style="display: flex; flex-direction: column; max-width: 320px;">
            <!-- Quest Tracker HUD -->
            <div id="quest-cluster" class="quest-cluster">
              <div class="quest-header-row">
                <div id="quest-chapter-badge" class="quest-chapter-badge">
                  <span>✦ CHAPTER I</span>
                  <span style="opacity: 0.65;">·</span>
                  <span>الفصل الأول</span>
                </div>
                <button id="quest-journal-shortcut-btn" class="quest-journal-shortcut-btn interactive" title="Open Quest Log (Q)">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"></path>
                    <path d="M6 6h10"></path>
                    <path d="M6 10h10"></path>
                  </svg>
                  <span>سجل المهام (Q)</span>
                </button>
              </div>

              <div id="quest-title-text" class="quest-title-text">THE FIRST MEMORY · الذاكرة الأولى</div>

              <!-- Active Objective Card -->
              <div class="quest-objective-active-card">
                <div class="quest-objective-headline">
                  <span id="quest-objective-badge" class="quest-step-pill">١ / ٥</span>
                  <div class="quest-objective-names">
                    <span id="quest-objective-title-ar" class="quest-objective-name-ar">استكشف الجزيرة</span>
                    <span id="quest-objective-title-en" class="quest-objective-name-en">Explore the Island</span>
                  </div>
                  <span id="quest-progress-text" style="font-size: 0.85rem; font-weight: 800; color: #fee440; white-space: nowrap;">0 / 35m</span>
                </div>

                <div class="quest-progress-track">
                  <div id="quest-progress-fill" class="quest-progress-fill" style="width: 0%;"></div>
                </div>

                <div id="quest-objective-hint" class="quest-objective-hint-text">
                  <span>📍</span>
                  <span>انهض من رمال الشاطئ وتحرك لاكتشاف معالم الجزيرة</span>
                </div>
              </div>

              <!-- Compact Subsystem Indicators: Crystals & Shards -->
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.2rem; padding-top: 0.35rem; border-top: 1px dashed rgba(255, 255, 255, 0.1);">
                <div style="display: flex; align-items: center; gap: 0.4rem;">
                  <span style="font-size: 0.72rem; color: #80ffea; font-weight: 700;">ECHOES:</span>
                  <div id="crystal-slots" class="crystal-slots"></div>
                  <span id="crystal-count-text" style="color: #00f5d4; font-weight: 800; font-size: 0.75rem;">0/7</span>
                </div>
                <div style="display: flex; align-items: center; gap: 0.35rem; font-size: 0.75rem;">
                  <span style="color: #fee440;">✦</span>
                  <span style="color: #c4e9e4;">SHARDS:</span>
                  <span id="shard-count-text" style="color: #fee440; font-weight: 800;">0/10</span>
                </div>
              </div>
              <div style="width: 100%; height: 3px; background: rgba(255, 255, 255, 0.08); border-radius: 9999px; overflow: hidden;">
                <div id="shard-progress-fill" style="width: 0%; height: 100%; background: linear-gradient(90deg, #fee440, #00f5d4); transition: width 0.4s ease;"></div>
              </div>
            </div>
          </div>

          <div style="display: flex; gap: 1rem; align-items: flex-start;">
            <div class="minimap-box">
              <canvas id="minimap-canvas" width="120" height="120"></canvas>
            </div>

            <div class="hud-actions">
              <button id="hud-quest-btn" class="icon-btn interactive" title="Quest & Story Log · سجل المهام والقصة (Q)" style="border-color: rgba(0, 245, 212, 0.7); color: #00f5d4; box-shadow: 0 0 14px rgba(0, 245, 212, 0.3);">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"></path>
                  <path d="M6 6h10"></path>
                  <path d="M6 10h10"></path>
                </svg>
              </button>
              <button id="world-memory-btn" class="icon-btn interactive" title="World Memory · ذاكرة العالم (M)" style="border-color: rgba(254, 228, 64, 0.7); color: #fee440; box-shadow: 0 0 12px rgba(254, 228, 64, 0.25);">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
                  <path d="M2 12h20"></path>
                </svg>
              </button>
              <button id="hud-multiplayer-btn" class="icon-btn interactive" title="Party & Multiplayer · المجموعات واللعب الجماعي (P)" style="border-color: rgba(0, 245, 212, 0.7); color: #00f5d4; box-shadow: 0 0 12px rgba(0, 245, 212, 0.25);">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </button>
              <button id="sound-btn" class="icon-btn interactive" title="Toggle Audio">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                </svg>
              </button>
              <button id="hud-settings-btn" class="icon-btn interactive" title="Settings">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
              </button>
              <button id="reset-btn" class="icon-btn interactive" title="Respawn Position">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                  <path d="M3 3v5h5"></path>
                </svg>
              </button>
              <button id="pause-btn" class="icon-btn interactive" title="Pause Menu (ESC)">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="6" y="4" width="4" height="16"></rect>
                  <rect x="14" y="4" width="4" height="16"></rect>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Floating Interaction Prompt -->
        <div id="interact-prompt" class="interactive">
          <kbd>E</kbd>
          <span id="interact-label">Commune with Echo · تواصل مع صدى البلورة</span>
        </div>

        <!-- Player Combat Health & Energy HUD (Bottom Center, Transparent Lines) -->
        <div id="combat-cluster" class="combat-cluster">
          <div class="combat-bar-wrapper">
            <div class="combat-bar-meta">
              <span class="combat-meta-title-hp">HEALTH</span>
              <span id="player-hp-text" class="combat-value-display">100 / 100 HP</span>
            </div>
            <div class="combat-bar-track">
              <div id="player-hp-fill" class="combat-bar-fill combat-bar-hp" style="width: 100%;"></div>
            </div>
          </div>

          <div class="combat-bar-wrapper">
            <div class="combat-bar-meta">
              <span class="combat-meta-title-energy">ECHO ENERGY</span>
              <span id="player-energy-text" class="combat-value-display">100 / 100</span>
            </div>
            <div class="combat-bar-track">
              <div id="player-energy-fill" class="combat-bar-fill combat-bar-energy" style="width: 100%;"></div>
            </div>
          </div>

          <div class="combat-keybinds-row">
            <div><kbd>F</kbd> Staff Slash</div>
            <div><kbd>C</kbd> Dodge Roll</div>
            <div><kbd>R</kbd> Echo Pulse</div>
          </div>
        </div>

        <!-- Customizable Touch Controls Layer -->
        <div id="touch-controls-layer" class="touch-controls-layer">
          <!-- Virtual Analog Joystick -->
          <div id="virtual-joystick-container" class="customizable-control interactive" data-control-id="joystick">
            <div class="control-edit-badge">🕹️ أنالوج Joystick</div>
            <div id="joystick-base">
              <div id="joystick-knob"></div>
            </div>
          </div>

          <!-- Combat: Attack Slash -->
          <button id="touch-attack-btn" class="customizable-control combat-touch-btn attack interactive" data-control-id="attack" title="Attack [F]">
            <div class="control-edit-badge">⚔️ هجوم Slash</div>
            <span style="font-size: 1.15rem;">⚔️</span>
            <span style="font-size: 0.65rem; font-weight: 800;">SLASH</span>
          </button>

          <!-- Combat: Dodge Roll -->
          <button id="touch-dodge-btn" class="customizable-control combat-touch-btn interactive" data-control-id="dodge" title="Dodge Roll [C]">
            <div class="control-edit-badge">💨 تفادي Dodge</div>
            <span style="font-size: 1.15rem;">💨</span>
            <span style="font-size: 0.65rem; font-weight: 800;">DODGE</span>
          </button>

          <!-- Combat: Echo Pulse -->
          <button id="touch-pulse-btn" class="customizable-control combat-touch-btn pulse interactive" data-control-id="pulse" title="Echo Pulse [R]">
            <div class="control-edit-badge">💫 نبض Pulse</div>
            <span style="font-size: 1.15rem;">💫</span>
            <span style="font-size: 0.65rem; font-weight: 800;">PULSE</span>
          </button>

          <!-- Action: Sprint / Run (Fixed Press-to-run + smooth acceleration) -->
          <button id="touch-sprint-btn" class="customizable-control action-touch-btn interactive" data-control-id="sprint" title="Sprint [Shift]">
            <div class="control-edit-badge">🏃 ركض Sprint</div>
            <span>RUN</span>
            <span>ركض</span>
          </button>

          <!-- Action: Interact / Commune -->
          <button id="touch-interact-btn" class="customizable-control action-touch-btn interactive" data-control-id="interact" title="Interact [E]">
            <div class="control-edit-badge">✨ تواصل Echo</div>
            <span>ECHO</span>
            <span>تواصل</span>
          </button>

          <!-- Action: Jump -->
          <button id="touch-jump-btn" class="customizable-control action-touch-btn interactive" data-control-id="jump" style="width: 120px; border-radius: 9999px;" title="Jump [Space]">
            <div class="control-edit-badge">⬆️ قفز Jump</div>
            <span>JUMP</span>
            <span>قفز</span>
          </button>
        </div>
      </div>

      <!-- Fullscreen HUD Controls Layout Editor (Edit Mode) -->
      <div id="hud-layout-editor-overlay">
        <!-- Top Control Bar -->
        <div class="editor-toolbar">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div style="display: flex; flex-direction: column;">
              <span style="font-weight: 800; font-size: 0.95rem; color: #00f5d4; letter-spacing: 0.5px;">🎮 CUSTOMIZE CONTROLS</span>
              <span style="font-size: 0.75rem; color: #a8dadc; font-family: 'Amiri', serif;">تخصيص واجهة التحكم والأزرار</span>
            </div>
            <div id="editor-orientation-badge" style="background: rgba(0, 245, 212, 0.15); border: 1px solid rgba(0, 245, 212, 0.5); padding: 0.2rem 0.6rem; border-radius: 9999px; font-size: 0.75rem; color: #00f5d4; font-weight: 700;">
              📱 Landscape
            </div>
          </div>

          <!-- Target Selection & Scale Controls -->
          <div style="display: flex; align-items: center; gap: 0.9rem; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 0.5rem; background: rgba(0, 0, 0, 0.4); padding: 0.35rem 0.8rem; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1);">
              <span style="font-size: 0.78rem; opacity: 0.8;">العنصر:</span>
              <span id="editor-selected-name" style="font-size: 0.85rem; font-weight: 800; color: #ffffff;">🕹️ أنالوج Joystick</span>
            </div>

            <div style="display: flex; align-items: center; gap: 0.5rem; background: rgba(0, 0, 0, 0.4); padding: 0.35rem 0.8rem; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1);">
              <span style="font-size: 0.78rem; opacity: 0.8;">الحجم:</span>
              <button id="editor-scale-minus-btn" type="button" class="interactive" style="background: rgba(255, 255, 255, 0.12); border: 1px solid rgba(255, 255, 255, 0.25); color: #fff; width: 28px; height: 28px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 1rem;">−</button>
              <input type="range" id="editor-scale-slider" min="70" max="150" value="100" class="interactive" style="width: 90px; accent-color: #00f5d4; cursor: pointer;" />
              <button id="editor-scale-plus-btn" type="button" class="interactive" style="background: rgba(255, 255, 255, 0.12); border: 1px solid rgba(255, 255, 255, 0.25); color: #fff; width: 28px; height: 28px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 1rem;">+</button>
              <span id="editor-scale-value" style="font-size: 0.85rem; font-weight: 800; color: #00f5d4; min-width: 42px;">100%</span>
            </div>
          </div>

          <!-- Actions: Reset, Cancel, Save -->
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <button id="editor-reset-btn" type="button" class="modal-btn secondary interactive" style="padding: 0.45rem 0.9rem; font-size: 0.82rem; border-color: rgba(255, 200, 100, 0.5); color: #ffe8a1;">
              🔄 RESET · استعادة
            </button>
            <button id="editor-cancel-btn" type="button" class="modal-btn secondary interactive" style="padding: 0.45rem 0.9rem; font-size: 0.82rem; border-color: rgba(255, 120, 120, 0.5); color: #ffadad;">
              ✕ CANCEL · إلغاء
            </button>
            <button id="editor-save-btn" type="button" class="modal-btn interactive" style="padding: 0.45rem 1.1rem; font-size: 0.85rem; font-weight: 800; background: #00f5d4; color: #06111a; box-shadow: 0 0 16px rgba(0, 245, 212, 0.5);">
              💾 SAVE · حفظ
            </button>
          </div>
        </div>

        <!-- Bottom Guidance Footer -->
        <div class="editor-footer">
          <span>💡 اسحب أي زر لتغيير مكانه على الشاشة · اضغط على أي زر لتحديده وتعديل حجمه بالشريط أعلاه · Drag to move, tap to select & resize</span>
        </div>
      </div>

      <!-- Settings Modal -->
      <div id="settings-modal" class="modal-overlay">
        <div class="modal-card">
          <div class="modal-badge">Preferences · إعدادات اللعبة</div>
          <h2 class="modal-title-ar">الإعدادات</h2>
          <h3 class="modal-title-en">Game Settings</h3>

          <div style="display: flex; flex-direction: column; gap: 0.4rem; text-align: left; margin: 0.6rem 0;">
            <div class="setting-row">
              <div class="setting-label">
                <span>Master Volume</span>
                <span class="setting-sub">الصوت العام</span>
              </div>
              <input type="range" id="setting-master-vol" min="0" max="100" value="80" class="interactive" />
            </div>

            <div class="setting-row">
              <div class="setting-label">
                <span>Ambient Music</span>
                <span class="setting-sub">الموسيقى الأثيرية</span>
              </div>
              <input type="range" id="setting-music-vol" min="0" max="100" value="65" class="interactive" />
            </div>

            <div class="setting-row">
              <div class="setting-label">
                <span>Camera Orbit Speed</span>
                <span class="setting-sub">حساسية الكاميرا</span>
              </div>
              <input type="range" id="setting-cam-sens" min="50" max="200" value="100" class="interactive" />
            </div>

            <!-- CUSTOMIZE CONTROLS Section in Settings -->
            <div class="setting-row" style="flex-direction: column; align-items: stretch; gap: 0.5rem; margin-top: 0.6rem; padding-top: 0.8rem; border-top: 1px solid rgba(0, 245, 212, 0.2);">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div class="setting-label">
                  <span style="font-weight: 800; color: #00f5d4; font-size: 0.95rem;">CUSTOMIZE CONTROLS</span>
                  <span class="setting-sub" style="color: #94d2bd;">تخصيص أزرار التحكم والأنالوج</span>
                </div>
                <span style="font-size: 1.35rem;">🎮</span>
              </div>
              <button id="open-control-customizer-btn" type="button" class="modal-btn secondary interactive" style="width: 100%; border-color: rgba(0, 245, 212, 0.5); background: rgba(0, 245, 212, 0.12); color: #00f5d4; display: flex; align-items: center; justify-content: center; gap: 0.6rem; padding: 0.75rem; font-weight: 700;">
                <span>⚙️ تعديل واجهة التحكم · Edit HUD Controls</span>
              </button>
            </div>
          </div>

          <button id="close-settings-btn" class="modal-btn interactive">
            Done · تم
          </button>
        </div>
      </div>

      <!-- Pause Menu Modal (ESC Key) -->
      <div id="pause-modal" class="modal-overlay">
        <div class="modal-card" style="max-width: 440px;">
          <div class="modal-badge">Game Paused · متوقف مؤقتاً</div>
          <h2 class="modal-title-ar">الجزيرة المنسية</h2>
          <h3 class="modal-title-en">The Forgotten Island</h3>

          <div style="display: flex; flex-direction: column; gap: 0.75rem; margin: 1rem 0;">
            <button id="resume-btn" class="modal-btn interactive" style="width: 100%;">
              Resume · متابعة اللعب
            </button>
            <button id="save-progress-btn" class="modal-btn secondary interactive" style="width: 100%;">
              Save Progress · حفظ التقدم
            </button>
            <button id="pause-multiplayer-btn" class="modal-btn secondary interactive" style="width: 100%; border-color: rgba(0, 245, 212, 0.4); color: #00f5d4;">
              👥 Party & Co-Op Hub · المجموعات واللعب الجماعي
            </button>
            <button id="pause-settings-btn" class="modal-btn secondary interactive" style="width: 100%;">
              Settings · الإعدادات
            </button>
            <button id="pause-reset-btn" class="modal-btn secondary interactive" style="width: 100%;">
              Respawn at Shore · العودة للشاطئ
            </button>
            <button id="pause-main-menu-btn" class="modal-btn secondary interactive" style="width: 100%; border-color: rgba(255, 100, 100, 0.4); color: #ff9999;">
              Return to Main Menu · القائمة الرئيسية
            </button>
          </div>
        </div>
      </div>

      <!-- Multiplayer & Co-Op Hub Modal -->
      <div id="multiplayer-hub-modal" class="modal-overlay">
        <div class="modal-card" style="max-width: 640px; max-height: 88vh; overflow-y: auto; text-align: left; border-color: rgba(0, 245, 212, 0.45); box-shadow: 0 10px 50px rgba(0, 245, 212, 0.25);">
          <!-- Concept Image Banner from User Attachment -->
          <div style="position: relative; width: 100%; border-radius: 12px; overflow: hidden; margin-bottom: 0.8rem; border: 1px solid rgba(0, 245, 212, 0.35);">
            <img src="/public/assets/aistudio/900598433_1164583123191976_1751464669737070361_n_5b0b91d8.jpg" alt="Co-Op Expedition" style="width: 100%; height: 160px; object-fit: cover; display: block;" />
            <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(180deg, transparent, rgba(6, 10, 18, 0.95)); padding: 0.75rem 1rem;">
              <span style="font-size: 0.75rem; letter-spacing: 0.1em; color: #00f5d4; font-weight: 800; text-transform: uppercase;">Sanctuary Co-Op Expeditions · حملات الاستكشاف الجماعية</span>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 0.5rem;">
            <div class="modal-badge" style="color: #00f5d4; border-color: rgba(0, 245, 212, 0.4); background: rgba(0, 245, 212, 0.12);">
              MULTIPLAYER ARCHITECTURE · بنية اللعب الجماعي
            </div>
            <span id="mp-network-status-badge" style="font-size: 0.75rem; color: #10b981; font-weight: 800; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.35); padding: 0.2rem 0.65rem; border-radius: 9999px;">
              🟢 Architecture Ready (Offline Loopback)
            </span>
          </div>

          <!-- Player Identity & UUID Card -->
          <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 0.85rem; margin-bottom: 0.75rem;">
            <div style="font-size: 0.75rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; margin-bottom: 0.35rem;">
              Player Identity & Independent ID · هوية ومعرف اللاعب المستقل
            </div>
            <div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.6rem;">
              <input type="text" id="mp-player-name-input" class="interactive" style="flex: 1; background: rgba(0, 0, 0, 0.5); border: 1px solid rgba(0, 245, 212, 0.35); border-radius: 8px; padding: 0.45rem 0.75rem; color: #fff; font-size: 0.9rem;" placeholder="Adventurer Name" />
              <button id="mp-save-name-btn" class="modal-btn interactive" style="padding: 0.45rem 1rem; font-size: 0.8rem;">
                Save · حفظ
              </button>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem; background: rgba(0, 0, 0, 0.35); padding: 0.4rem 0.65rem; border-radius: 6px;">
              <span style="color: #64748b;">UUID:</span>
              <span id="mp-player-uuid-text" style="color: #38bdf8; font-family: monospace;">echo_usr_...</span>
              <button id="mp-copy-uuid-btn" class="interactive" style="background: transparent; border: 1px solid rgba(56, 189, 248, 0.3); color: #38bdf8; border-radius: 4px; padding: 0.15rem 0.45rem; font-size: 0.7rem; cursor: pointer;">
                Copy
              </button>
            </div>
          </div>

          <!-- Character Class Selector -->
          <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 0.85rem; margin-bottom: 0.75rem;">
            <div style="font-size: 0.75rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; margin-bottom: 0.5rem;">
              Adventurer Class Role · فئة ودور المغامر
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
              <button class="mp-class-btn interactive active" data-class="SPIRIT_WEAVER" style="background: rgba(0, 245, 212, 0.12); border: 1px solid #00f5d4; color: #fff; padding: 0.5rem; border-radius: 8px; text-align: left; cursor: pointer;">
                <div style="font-weight: 800; color: #00f5d4; font-size: 0.85rem;">Spirit Weaver · نساج الأرواح</div>
                <div style="font-size: 0.7rem; color: #94a3b8;">Cyan Staff • Echo Resonance</div>
              </button>
              <button class="mp-class-btn interactive" data-class="ANCIENT_WARDEN" style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.12); color: #fff; padding: 0.5rem; border-radius: 8px; text-align: left; cursor: pointer;">
                <div style="font-weight: 800; color: #a855f7; font-size: 0.85rem;">Ancient Warden · حارس الأطلال</div>
                <div style="font-size: 0.7rem; color: #94a3b8;">Violet Shield • Temple Bastion</div>
              </button>
              <button class="mp-class-btn interactive" data-class="MIND_SEEKER" style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.12); color: #fff; padding: 0.5rem; border-radius: 8px; text-align: left; cursor: pointer;">
                <div style="font-weight: 800; color: #38bdf8; font-size: 0.85rem;">Mind Seeker · باحث الذاكرة</div>
                <div style="font-size: 0.7rem; color: #94a3b8;">Blue Ray • Memory Extraction</div>
              </button>
              <button class="mp-class-btn interactive" data-class="ECHO_BLADE" style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.12); color: #fff; padding: 0.5rem; border-radius: 8px; text-align: left; cursor: pointer;">
                <div style="font-weight: 800; color: #f59e0b; font-size: 0.85rem;">Echo Blade · سياف الصدى</div>
                <div style="font-size: 0.7rem; color: #94a3b8;">Golden Arc • Kinetic Slashes</div>
              </button>
            </div>
          </div>

          <!-- Co-Op Party Hub -->
          <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 0.85rem; margin-bottom: 0.75rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <span style="font-size: 0.75rem; color: #94a3b8; font-weight: 700; text-transform: uppercase;">Co-Op Party (4 Max) · مجموعة الاستكشاف التعاونية</span>
              <span id="mp-party-code-badge" style="font-size: 0.75rem; color: #fee440; font-family: monospace; font-weight: 800; background: rgba(254, 228, 64, 0.12); padding: 0.15rem 0.5rem; border-radius: 4px; border: 1px solid rgba(254, 228, 64, 0.3);">CODE: ECHO-XXXX</span>
            </div>

            <!-- Party Slots Grid -->
            <div id="mp-party-slots-container" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.4rem; margin-bottom: 0.5rem;">
              <!-- Slot 1 (Local Leader) -->
              <div style="background: rgba(0, 245, 212, 0.08); border: 1px solid rgba(0, 245, 212, 0.4); border-radius: 8px; padding: 0.5rem; text-align: center;">
                <div style="font-size: 1.2rem;">👑</div>
                <div id="mp-slot-1-name" style="font-size: 0.75rem; font-weight: 800; color: #fff; margin-top: 0.2rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">You (Leader)</div>
                <div style="font-size: 0.65rem; color: #10b981;">Ready 100HP</div>
              </div>
              <!-- Slot 2 -->
              <div style="background: rgba(255, 255, 255, 0.02); border: 1px dashed rgba(255, 255, 255, 0.15); border-radius: 8px; padding: 0.5rem; text-align: center; opacity: 0.6;">
                <div style="font-size: 1.2rem; color: #64748b;">+</div>
                <div style="font-size: 0.7rem; color: #94a3b8; margin-top: 0.2rem;">Open Slot</div>
                <div style="font-size: 0.65rem; color: #64748b;">Waiting</div>
              </div>
              <!-- Slot 3 -->
              <div style="background: rgba(255, 255, 255, 0.02); border: 1px dashed rgba(255, 255, 255, 0.15); border-radius: 8px; padding: 0.5rem; text-align: center; opacity: 0.6;">
                <div style="font-size: 1.2rem; color: #64748b;">+</div>
                <div style="font-size: 0.7rem; color: #94a3b8; margin-top: 0.2rem;">Open Slot</div>
                <div style="font-size: 0.65rem; color: #64748b;">Waiting</div>
              </div>
              <!-- Slot 4 -->
              <div style="background: rgba(255, 255, 255, 0.02); border: 1px dashed rgba(255, 255, 255, 0.15); border-radius: 8px; padding: 0.5rem; text-align: center; opacity: 0.6;">
                <div style="font-size: 1.2rem; color: #64748b;">+</div>
                <div style="font-size: 0.7rem; color: #94a3b8; margin-top: 0.2rem;">Open Slot</div>
                <div style="font-size: 0.65rem; color: #64748b;">Waiting</div>
              </div>
            </div>

            <!-- Objective Bar -->
            <div style="font-size: 0.72rem; color: #c4e9e4; background: rgba(0, 0, 0, 0.35); padding: 0.4rem 0.65rem; border-radius: 6px;">
              <span>🎯 الهدف المشترك:</span> <span id="mp-shared-objective-text" style="color: #fee440; font-weight: 700;">استكشاف أسرار المعبد العتيق والبلورات السبع</span>
            </div>
          </div>

          <!-- Architecture & Infrastructure Checklist -->
          <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 0.75rem; font-size: 0.76rem; color: #94a3b8; line-height: 1.5; margin-bottom: 0.85rem;">
            <div style="font-weight: 800; color: #00f5d4; margin-bottom: 0.25rem;">جاهزية البنية التحتية للخادم المركزي (Architectural Readiness):</div>
            <div>✓ فصل كامل بين بيانات اللاعب (PlayerSaveData) وبيانات عالم الجزيرة (WorldInstanceData).</div>
            <div>✓ دعم الخادم المركزي ومزامنة الحركات والمواقع (Transform Dead Reckoning & Interpolation).</div>
            <div>✓ معرفات UUID مستقلة ومستمرة لكل لاعب مع ملف هوية وقدرات قابلة للتخصيص.</div>
            <div>✓ بروتوكول حزم شبكية typed كامل (C_SYNC_TRANSFORM / C_COMBAT_ATTACK / S_ROOM_STATE).</div>
          </div>

          <button id="close-multiplayer-btn" class="modal-btn interactive" style="width: 100%;">
            Done · تم
          </button>
        </div>
      </div>

      <!-- World Memory System Modal (ECHO MEMORY) -->
      <div id="world-memory-modal" class="modal-overlay">
        <div class="modal-card" style="max-width: 620px; max-height: 85vh; overflow-y: auto; text-align: left; border-color: rgba(254, 228, 64, 0.45); box-shadow: 0 10px 50px rgba(254, 228, 64, 0.22);">
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
            <div class="modal-badge" style="color: #fee440; border-color: rgba(254, 228, 64, 0.4); background: rgba(254, 228, 64, 0.12);">
              ECHO MEMORY SYSTEM · نظام ذاكرة العالم
            </div>
            <div id="memory-current-biome" style="font-size: 0.8rem; color: #70e1ff; font-weight: 700; background: rgba(0, 245, 212, 0.12); border: 1px solid rgba(0, 245, 212, 0.3); padding: 0.25rem 0.75rem; border-radius: 9999px;">
              📍 Southern Shoreline
            </div>
          </div>

          <div style="text-align: center; margin: 0.4rem 0;">
            <h2 class="modal-title-ar" style="margin: 0; font-size: 1.8rem; color: #ffffff;">كَيْفَ يَتَذَكَّرُكَ العَالَمُ</h2>
            <h3 class="modal-title-en" style="margin: 0; color: #a5d8ea;">The Island's Memory of You</h3>
          </div>

          <!-- Player Archetype Badge -->
          <div style="background: linear-gradient(135deg, rgba(0, 245, 212, 0.12) 0%, rgba(254, 228, 64, 0.08) 100%); border: 1.5px solid rgba(0, 245, 212, 0.35); border-radius: 16px; padding: 1.1rem; text-align: center;">
            <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.15rem; color: #72a5b8;">Current Soul Resonance · صدى الروح</div>
            <div id="memory-archetype-ar" style="font-family: 'Amiri', serif; font-size: 1.7rem; font-weight: 700; color: #00f5d4; margin: 0.2rem 0;">الرَّحَّالَةُ الصَّبُور</div>
            <div id="memory-archetype-en" style="font-family: 'Cinzel', serif; font-size: 0.95rem; letter-spacing: 0.1rem; color: #fee440;">The Patient Wanderer</div>
            <div style="margin-top: 0.6rem; display: flex; align-items: center; justify-content: center; gap: 0.6rem;">
              <span style="font-size: 0.8rem; color: #a5d8ea;">Resonance Rank:</span>
              <span id="memory-resonance-level" style="font-weight: 800; color: #00f5d4; font-size: 0.95rem;">Rank 1</span>
            </div>
          </div>

          <!-- Behavior Statistics Grid -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(125px, 1fr)); gap: 0.65rem; margin: 0.8rem 0;">
            <div style="background: rgba(0, 0, 0, 0.35); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 0.75rem;">
              <div style="font-size: 0.72rem; color: #78a2b5;">Exploration Time · الوقت</div>
              <div id="stat-play-time" style="font-size: 1.15rem; font-weight: 800; color: #ffffff;">00:00</div>
            </div>
            <div style="background: rgba(0, 0, 0, 0.35); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 0.75rem;">
              <div style="font-size: 0.72rem; color: #78a2b5;">Sprint Distance · الركض</div>
              <div id="stat-sprint-dist" style="font-size: 1.15rem; font-weight: 800; color: #ffffff;">0 m</div>
            </div>
            <div style="background: rgba(0, 0, 0, 0.35); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 0.75rem;">
              <div style="font-size: 0.72rem; color: #78a2b5;">Zones Visited · المناطق</div>
              <div id="stat-zones-count" style="font-size: 1.15rem; font-weight: 800; color: #00f5d4;">1 / 8</div>
            </div>
            <div style="background: rgba(0, 0, 0, 0.35); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 0.75rem;">
              <div style="font-size: 0.72rem; color: #78a2b5;">Secrets Found · الأسرار</div>
              <div id="stat-secrets-count" style="font-size: 1.15rem; font-weight: 800; color: #fee440;">0</div>
            </div>
          </div>

          <!-- Unlocked World Transformations (Real 3D Changes) -->
          <div style="margin: 0.6rem 0;">
            <div style="font-size: 0.85rem; font-weight: 700; color: #fee440; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem;">
              <span>✦</span>
              <span>Active World Transformations · تحولات العالم الحقيقية</span>
            </div>
            <div id="manifestations-list" style="display: flex; flex-direction: column; gap: 0.45rem;">
            </div>
          </div>

          <!-- Time per Biome Breakdown -->
          <div style="margin-top: 0.6rem;">
            <div style="font-size: 0.85rem; font-weight: 700; color: #a5d8ea; margin-bottom: 0.4rem;">
              Time Spent per Biome · التواجد في البيئات
            </div>
            <div id="biome-breakdown-list" style="display: flex; flex-direction: column; gap: 0.35rem;">
            </div>
          </div>

          <button id="close-memory-btn" class="modal-btn interactive" style="margin-top: 1rem; width: 100%; background: linear-gradient(135deg, #fee440 0%, #e09f3e 100%); color: #0d1b2a;">
            Return to World · العودة إلى الجزيرة
          </button>
        </div>
      </div>

      <!-- Lore Echo Memory Modal -->
      <div id="lore-modal" class="modal-overlay">
        <div class="modal-card">
          <div class="modal-badge">Ancient Memory Restored · صدى الذاكرة القديمة</div>
          <h2 id="lore-title-ar" class="modal-title-ar">بلورة الفجر</h2>
          <h3 id="lore-title-en" class="modal-title-en">Crystal of Dawn</h3>
          <div id="lore-location" class="modal-location">Whispering Pine Forest · غابة الصنوبر الهامسة</div>

          <p id="lore-text-ar" class="modal-quote-ar"></p>
          <p id="lore-text-en" class="modal-quote-en"></p>

          <button id="close-lore-btn" class="modal-btn interactive">
            Absorb Echo · استوعب الصدى
          </button>
        </div>
      </div>

      <!-- Ancient Inscription Modal -->
      <div id="inscription-modal" class="modal-overlay">
        <div class="modal-card" style="border-color: rgba(254, 228, 64, 0.45); box-shadow: 0 10px 50px rgba(254, 228, 64, 0.22);">
          <div class="modal-badge" style="color: #fee440; border-color: rgba(254, 228, 64, 0.4); background: rgba(254, 228, 64, 0.12);">
            Ancient Inscription · نقوش حجرية مقدسة
          </div>
          <div id="inscription-glyph" style="font-size: 2.4rem; letter-spacing: 0.6rem; color: #fee440; text-shadow: 0 0 20px rgba(254, 228, 64, 0.8); margin: 0.1rem 0;">ᚱ · ᛟ</div>
          <h2 id="inscription-title-ar" class="modal-title-ar" style="color: #ffffff; margin-top: 0;">مسلة العبور الأولى</h2>
          <h3 id="inscription-title-en" class="modal-title-en" style="color: #ffe875; margin-bottom: 0.4rem;">Stele of the First Crossing</h3>
          <div id="inscription-location" class="modal-location">Southern Arrival Beach · شاطئ الوصول الجنوبي</div>

          <div style="background: rgba(0, 0, 0, 0.35); border: 1px solid rgba(254, 228, 64, 0.2); border-radius: 14px; padding: 1.2rem; margin: 0.4rem 0;">
            <p id="inscription-text-ar" class="modal-quote-ar" style="color: #f0f7f4; margin-bottom: 0.75rem; font-size: 1.25rem;"></p>
            <p id="inscription-text-en" class="modal-quote-en" style="color: #ccd7e0; font-size: 0.95rem;"></p>
          </div>

          <button id="close-inscription-btn" class="modal-btn interactive" style="background: linear-gradient(135deg, #fee440 0%, #e09f3e 100%); color: #0d1b2a;">
            Finish Reading · تم الانتهاء من القراءة
          </button>
        </div>
      </div>

      <!-- Victory / Portal Awakening Modal -->
      <div id="victory-modal" class="modal-overlay">
        <div class="modal-card">
          <div class="modal-badge">The Great Portal Awakens · استيقاظ البوابة العظيمة</div>
          <h2 class="modal-title-ar">العَالَمُ يَتَذَكَّر</h2>
          <h3 class="modal-title-en">The World Remembers</h3>
          <p style="font-size: 1.05rem; line-height: 1.6; color: #d0f0ec;">
            All 7 Echo Crystals have been harmonized! The celestial vortex of the Great Stone Portal has awakened, opening a radiant pathway across worlds.
          </p>
          <p style="font-family: 'Amiri', serif; font-size: 1.4rem; color: #00f5d4;">
            اكتملت أصداء الجزيرة المنسية، وانبثق النور الخالد من قلب البوابة الحجرية العتيقة!
          </p>
          <button id="close-victory-btn" class="modal-btn interactive">
            Continue Journey · استمر في الرحلة
          </button>
        </div>
      </div>

      <!-- Death Screen Modal -->
      <div id="death-modal" class="modal-overlay">
        <div class="modal-card">
          <div class="death-rune-symbol">ᛋ · ᛟ</div>
          <div class="modal-badge" style="color: #ff3366;">ECHO SEVERED · انقطاع الصدى</div>
          <h2 class="modal-title-ar" style="color: #ff3366;">تلاشى صدى روحك</h2>
          <h3 class="modal-title-en" style="color: #fda4af;">Your Echo has Dissolved</h3>
          <p style="font-size: 0.95rem; line-height: 1.6; color: #fecdd3; margin: 0.4rem 0;">
            لقد حاصرتك كائنات الخشب الفاسد وتلاشى جسدك الأثيري مؤقتاً. رمال الشاطئ تتذكرك وستعيد تكوين صدى روحك عند الملاذ.
          </p>
          <button id="death-revive-btn" class="modal-btn interactive" style="background: linear-gradient(135deg, #ff3366 0%, #be123c 100%); color: #ffffff; width: 100%;">
            Revive at Shore · استعادة الصدى عند الشاطئ
          </button>
        </div>
      </div>

      <!-- Story Narrative Modal (رسائل قصصية ومؤثرات عند اكتشاف الأحداث) -->
      <div id="story-narrative-modal" class="modal-overlay">
        <div class="modal-card">
          <div id="story-narrative-badge" class="modal-badge" style="color: #00f5d4; border-color: rgba(0, 245, 212, 0.4); background: rgba(0, 245, 212, 0.12);">
            بداية الرحلة · THE AWAKENING
          </div>
          <div style="font-size: 2.2rem; color: #00f5d4; text-shadow: 0 0 24px rgba(0, 245, 212, 0.8); margin: 0.2rem 0;">ᚱ · ᛟ · ᛋ</div>
          <h2 id="story-narrative-title-ar" class="modal-title-ar" style="color: #ffffff; margin-top: 0;">الاستيقاظ على شاطئ النسيان</h2>
          <h3 id="story-narrative-title-en" class="modal-title-en" style="color: #80ffea; margin-bottom: 0.35rem;">Awakening on Forgotten Sands</h3>

          <div class="story-narrative-text-box">
            <p id="story-narrative-content-ar" class="story-narrative-ar"></p>
            <div id="story-narrative-quote-box" style="margin: 0.8rem 0; padding: 0.6rem 0.85rem; background: rgba(0, 245, 212, 0.08); border-right: 3px solid #00f5d4; border-radius: 6px;">
              <p id="story-narrative-quote-ar" style="font-family: 'Amiri', serif; font-size: 1.15rem; color: #80ffea; font-style: italic; margin: 0;"></p>
            </div>
            <p id="story-narrative-content-en" class="story-narrative-en"></p>
          </div>

          <button id="close-story-narrative-btn" class="modal-btn interactive" style="background: linear-gradient(135deg, #00f5d4 0%, #00bbf9 100%); color: #061924; width: 100%; max-width: 320px;">
            Continue Journey · استمر في الرحلة
          </button>
        </div>
      </div>

      <!-- Quest & Story Chronicle Journal Modal (سجل المهام والقصة) -->
      <div id="quest-log-modal" class="modal-overlay">
        <div class="modal-card" style="max-width: 680px; max-height: 85vh; overflow-y: auto; text-align: left;">
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
            <div class="modal-badge" style="color: #00f5d4; border-color: rgba(0, 245, 212, 0.4); background: rgba(0, 245, 212, 0.12);">
              QUEST & STORY JOURNAL · سجل المهام والقصة
            </div>
            <div style="font-size: 0.8rem; color: #fee440; font-weight: 700; background: rgba(254, 228, 64, 0.12); border: 1px solid rgba(254, 228, 64, 0.3); padding: 0.25rem 0.75rem; border-radius: 9999px;">
              ECHO SYSTEM
            </div>
          </div>

          <h2 class="modal-title-ar" style="text-align: right; margin-top: 0.2rem;">الذاكرة الأولى · The First Memory</h2>
          
          <!-- Story Premise Card -->
          <div style="background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(0, 245, 212, 0.25); border-radius: 14px; padding: 1rem 1.25rem; direction: rtl; text-align: right;">
            <div style="font-size: 0.78rem; font-weight: 800; color: #fee440; letter-spacing: 0.1rem; margin-bottom: 0.35rem;">
              حكاية الجزيرة المنسية · STORY PREMISE
            </div>
            <p style="font-family: 'Amiri', serif; font-size: 1.15rem; line-height: 1.7; color: #e4f7f4; margin: 0;">
              يستيقظ اللاعب في جزيرة مجهولة ولا يتذكر كيف وصل إليها. يكتشف أن العالم يحتفظ بذكريات كل من دخله، وتتردد أصداء أرواحهم في الحجر والماء والبلورات. لإيقاظ الجزيرة واستعادة الهوية، يجب إكمال أهداف الذاكرة الأولى تباعاً.
            </p>
          </div>

          <!-- Quest 1: The 5 Sequential Objectives -->
          <div style="margin-top: 0.4rem;">
            <div style="font-size: 0.85rem; font-weight: 800; color: #80ffea; letter-spacing: 0.08rem; text-transform: uppercase; margin-bottom: 0.6rem; display: flex; justify-content: space-between; align-items: center;">
              <span>أهداف المهمة الأولى · The First Memory</span>
              <span id="quest-log-progress-badge" style="color: #fee440; font-size: 0.8rem;">١ / ٥ مكتمل</span>
            </div>
            <div id="quest-log-list" style="display: flex; flex-direction: column; gap: 0.65rem;">
              <!-- Populated dynamically via renderQuestLog() -->
            </div>
          </div>

          <button id="close-quest-log-btn" class="modal-btn interactive" style="margin-top: 0.8rem; width: 100%;">
            Return to Exploration · العودة للاستكشاف
          </button>
        </div>
      </div>

      <!-- NPC Dialogue Modal (حوارات الشخصيات والمخلوقات التفاعلية) -->
      <div id="npc-dialogue-modal" class="modal-overlay">
        <div class="modal-card" style="max-width: 620px; padding: 1.8rem; border-color: rgba(0, 245, 212, 0.55); box-shadow: 0 15px 60px rgba(0, 245, 212, 0.35);">
          <!-- Header with Portrait and Title -->
          <div style="display: flex; gap: 1.1rem; align-items: center; width: 100%; border-bottom: 1px solid rgba(0, 245, 212, 0.25); padding-bottom: 1rem;">
            <div style="position: relative; width: 78px; height: 78px; border-radius: 50%; border: 2.5px solid #00f5d4; overflow: hidden; box-shadow: 0 0 20px rgba(0, 245, 212, 0.6); flex-shrink: 0; background: #000;">
              <img id="npc-portrait-img" src="/public/assets/aistudio/902496527_1823591332005868_4146964911404786464_n_35a4a4fd.jpg" alt="NPC Portrait" referrerpolicy="no-referrer" style="width: 100%; height: 100%; object-fit: cover;" />
            </div>
            <div style="flex: 1; text-align: right; direction: rtl;">
              <div id="npc-title-badge" class="modal-badge" style="font-size: 0.75rem; color: #fee440; margin-bottom: 0.2rem;">
                حارس أسرار الغابة الهامسة · KEEPER
              </div>
              <h2 id="npc-name-ar" style="font-family: 'Amiri', serif; font-size: 1.8rem; color: #ffffff; margin: 0; line-height: 1.2;">
                عابر الغابة الغامض
              </h2>
              <div id="npc-name-en" style="font-size: 0.82rem; color: #80ffea; letter-spacing: 0.05rem; direction: ltr; text-align: left;">
                The Shrouded Wanderer
              </div>
            </div>
          </div>

          <!-- Dialogue Speech Box -->
          <div style="background: rgba(0, 0, 0, 0.45); border: 1px solid rgba(0, 245, 212, 0.2); border-radius: 14px; padding: 1.25rem 1.4rem; text-align: right; direction: rtl; max-height: 240px; overflow-y: auto;">
            <p id="npc-dialogue-message-ar" style="font-family: 'Amiri', serif; font-size: 1.25rem; line-height: 1.7; color: #f0fdf4; margin: 0 0 0.8rem 0; white-space: pre-line;"></p>
            <p id="npc-dialogue-message-en" style="font-size: 0.88rem; line-height: 1.5; color: #94a7b0; margin: 0; direction: ltr; text-align: left; font-style: italic;"></p>
          </div>

          <!-- Dialogue Choices / Options Container -->
          <div id="npc-dialogue-options" style="display: flex; flex-direction: column; gap: 0.65rem; width: 100%; margin-top: 0.4rem;">
            <!-- Rendered dynamically -->
          </div>
        </div>
      </div>

      <!-- Portrait Orientation Enforcer & Upside-down Blocker Overlay -->
      <div id="upside-down-blocker" class="upside-down-overlay">
        <div class="upside-down-card">
          <div class="upside-down-icon">📱</div>
          <div class="upside-down-title-ar">يرجى تدوير الهاتف للوضع العمودي</div>
          <div class="upside-down-title-en">PORTRAIT ONLY · الرجاء استخدام الوضع الرأسي</div>
          <div class="upside-down-desc">تم تصميم تجربة اللعبة ونظام التحكم لتلائم الوضع الرأسي (Portrait) بالكامل على الهواتف الذكية. يرجى تدوير جهازك للوضع الرأسي للمتابعة.</div>
        </div>
      </div>
    `;

    this.root.appendChild(wrapper);

    // Bind element references
    this.titleScreen = document.getElementById('title-screen')!;
    this.inGameHUD = document.getElementById('ingame-hud')!;
    this.loreModal = document.getElementById('lore-modal')!;
    this.inscriptionModal = document.getElementById('inscription-modal')!;
    this.victoryModal = document.getElementById('victory-modal')!;
    this.pauseModal = document.getElementById('pause-modal')!;
    this.settingsModal = document.getElementById('settings-modal')!;
    this.multiplayerModal = document.getElementById('multiplayer-hub-modal')!;
    this.toastNotification = document.getElementById('toast-notification')!;
    this.interactPrompt = document.getElementById('interact-prompt')!;

    // NPC Dialogue elements
    this.npcDialogueModal = document.getElementById('npc-dialogue-modal')!;
    this.npcPortraitImg = document.getElementById('npc-portrait-img') as HTMLImageElement;
    this.npcTitleBadge = document.getElementById('npc-title-badge')!;
    this.npcNameAr = document.getElementById('npc-name-ar')!;
    this.npcNameEn = document.getElementById('npc-name-en')!;
    this.npcDialogueMessageAr = document.getElementById('npc-dialogue-message-ar')!;
    this.npcDialogueMessageEn = document.getElementById('npc-dialogue-message-en')!;
    this.npcDialogueOptionsContainer = document.getElementById('npc-dialogue-options')!;

    // Quest & Story DOM elements
    this.questCluster = document.getElementById('quest-cluster')!;
    this.questChapterBadge = document.getElementById('quest-chapter-badge')!;
    this.questTitleText = document.getElementById('quest-title-text')!;
    this.questObjectiveBadge = document.getElementById('quest-objective-badge')!;
    this.questObjectiveTitleAr = document.getElementById('quest-objective-title-ar')!;
    this.questObjectiveTitleEn = document.getElementById('quest-objective-title-en')!;
    this.questObjectiveHint = document.getElementById('quest-objective-hint')!;
    this.questProgressBar = document.getElementById('quest-progress-fill')!;
    this.questProgressText = document.getElementById('quest-progress-text')!;

    this.objectiveCompleteBanner = document.getElementById('objective-complete-banner')!;
    this.objectiveCompleteTitle = document.getElementById('objective-complete-title')!;
    this.objectiveCompleteNext = document.getElementById('objective-complete-next')!;

    this.storyNarrativeModal = document.getElementById('story-narrative-modal')!;
    this.storyNarrativeBadge = document.getElementById('story-narrative-badge')!;
    this.storyNarrativeTitleAr = document.getElementById('story-narrative-title-ar')!;
    this.storyNarrativeTitleEn = document.getElementById('story-narrative-title-en')!;
    this.storyNarrativeContentAr = document.getElementById('story-narrative-content-ar')!;
    this.storyNarrativeContentEn = document.getElementById('story-narrative-content-en')!;
    this.storyNarrativeQuoteAr = document.getElementById('story-narrative-quote-ar')!;

    this.questLogModal = document.getElementById('quest-log-modal')!;
    this.questLogList = document.getElementById('quest-log-list')!;
    this.crystalSlotsContainer = document.getElementById('crystal-slots')!;
    this.minimapCanvas = document.getElementById('minimap-canvas') as HTMLCanvasElement;
    this.soundBtn = document.getElementById('sound-btn')!;
    this.sprintTouchBtn = document.getElementById('touch-sprint-btn')!;
    this.touchInteractBtn = document.getElementById('touch-interact-btn')!;
    this.joystickBase = document.getElementById('joystick-base')!;
    this.joystickKnob = document.getElementById('joystick-knob')!;
    this.continueBtn = document.getElementById('menu-continue-btn')!;
    this.continueStatus = document.getElementById('continue-status-badge')!;

    this.shardCountText = document.getElementById('shard-count-text')!;
    this.shardProgressFill = document.getElementById('shard-progress-fill')!;

    this.loreTitleAr = document.getElementById('lore-title-ar')!;
    this.loreTitleEn = document.getElementById('lore-title-en')!;
    this.loreLocation = document.getElementById('lore-location')!;
    this.loreTextAr = document.getElementById('lore-text-ar')!;
    this.loreTextEn = document.getElementById('lore-text-en')!;

    this.inscriptionTitleAr = document.getElementById('inscription-title-ar')!;
    this.inscriptionTitleEn = document.getElementById('inscription-title-en')!;
    this.inscriptionGlyph = document.getElementById('inscription-glyph')!;
    this.inscriptionLocation = document.getElementById('inscription-location')!;
    this.inscriptionTextAr = document.getElementById('inscription-text-ar')!;
    this.inscriptionTextEn = document.getElementById('inscription-text-en')!;

    this.worldMemoryModal = document.getElementById('world-memory-modal')!;

    // Combat HUD & Action elements
    this.playerHpBarFill = document.getElementById('player-hp-fill')!;
    this.playerHpText = document.getElementById('player-hp-text')!;
    this.playerEnergyBarFill = document.getElementById('player-energy-fill')!;
    this.playerEnergyText = document.getElementById('player-energy-text')!;
    this.hurtVignetteOverlay = document.getElementById('hurt-vignette')!;
    this.deathModal = document.getElementById('death-modal')!;
    this.deathReviveBtn = document.getElementById('death-revive-btn')!;
    this.touchAttackBtn = document.getElementById('touch-attack-btn')!;
    this.touchDodgeBtn = document.getElementById('touch-dodge-btn')!;
    this.touchPulseBtn = document.getElementById('touch-pulse-btn')!;

    // Initialize 7 crystal slot indicators
    const colors = ['#00f5d4', '#00bbf9', '#9b5de5', '#f15bb5', '#fee440', '#52b788', '#ff70a6'];
    for (let i = 0; i < 7; i++) {
      const slot = document.createElement('div');
      slot.className = 'crystal-slot';
      slot.dataset.index = i.toString();
      slot.dataset.color = colors[i];
      this.crystalSlotsContainer.appendChild(slot);
    }

    // Initialize Customizable Controls & Layout Editor elements
    this.controlsLayer = document.getElementById('touch-controls-layer')!;
    this.layoutEditorOverlay = document.getElementById('hud-layout-editor-overlay')!;
    this.editorScaleSlider = document.getElementById('editor-scale-slider') as HTMLInputElement;
    this.editorScaleValueText = document.getElementById('editor-scale-value')!;
    this.editorSelectedNameText = document.getElementById('editor-selected-name')!;
    this.editorOrientationBadge = document.getElementById('editor-orientation-badge')!;

    this.initControlsLayout();

    // Attach Event Listeners
    // Main Menu Buttons
    this.continueBtn.addEventListener('click', () => {
      this.callbacks.onContinueGame();
    });

    document.getElementById('menu-new-game-btn')?.addEventListener('click', () => {
      this.callbacks.onNewGame();
    });

    document.getElementById('menu-memory-btn')?.addEventListener('click', () => {
      this.openWorldMemoryModal(this.callbacks.getMemoryProfile());
    });

    document.getElementById('menu-settings-btn')?.addEventListener('click', () => {
      this.openSettingsModal();
    });

    document.getElementById('menu-exit-btn')?.addEventListener('click', () => {
      this.callbacks.onExitGame();
    });

    document.getElementById('menu-quest-log-btn')?.addEventListener('click', () => {
      if (this.callbacks.getQuestSystem) {
        this.openQuestLogModal(this.callbacks.getQuestSystem());
      }
    });

    // Top HUD Actions
    this.soundBtn.addEventListener('click', () => {
      this.callbacks.onToggleSound();
    });

    document.getElementById('hud-quest-btn')?.addEventListener('click', () => {
      if (this.callbacks.getQuestSystem) {
        this.openQuestLogModal(this.callbacks.getQuestSystem());
      }
    });

    document.getElementById('quest-journal-shortcut-btn')?.addEventListener('click', () => {
      if (this.callbacks.getQuestSystem) {
        this.openQuestLogModal(this.callbacks.getQuestSystem());
      }
    });

    document.getElementById('world-memory-btn')?.addEventListener('click', () => {
      this.openWorldMemoryModal(this.callbacks.getMemoryProfile());
    });

    document.getElementById('hud-settings-btn')?.addEventListener('click', () => {
      this.openSettingsModal();
    });

    document.getElementById('reset-btn')?.addEventListener('click', () => {
      this.callbacks.onResetPosition();
    });

    document.getElementById('pause-btn')?.addEventListener('click', () => {
      this.togglePause();
    });

    // Pause Modal Buttons
    document.getElementById('resume-btn')?.addEventListener('click', () => {
      this.togglePause();
    });

    document.getElementById('save-progress-btn')?.addEventListener('click', () => {
      const success = this.callbacks.onSaveGame();
      this.showToast(success ? 'Progress Saved! · تم حفظ التقدم بنجاح' : 'Could not save progress');
    });

    document.getElementById('pause-settings-btn')?.addEventListener('click', () => {
      this.openSettingsModal();
    });

    document.getElementById('pause-reset-btn')?.addEventListener('click', () => {
      this.togglePause();
      this.callbacks.onResetPosition();
    });

    document.getElementById('pause-main-menu-btn')?.addEventListener('click', () => {
      this.pauseModal.classList.remove('open');
      this.isPaused = false;
      this.showTitleScreen();
    });

    // Settings Modal
    document.getElementById('close-settings-btn')?.addEventListener('click', () => {
      this.closeSettingsModal();
    });

    // EDIT HUD CONTROLS Button in Settings
    document.getElementById('open-control-customizer-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.enterControlsEditMode();
    });

    // World Memory Modal
    document.getElementById('close-memory-btn')?.addEventListener('click', () => {
      this.closeWorldMemoryModal();
    });

    // Multiplayer Hub Modal Triggers
    document.getElementById('menu-multiplayer-btn')?.addEventListener('click', () => {
      this.openMultiplayerModal();
    });
    document.getElementById('hud-multiplayer-btn')?.addEventListener('click', () => {
      this.openMultiplayerModal();
    });
    document.getElementById('pause-multiplayer-btn')?.addEventListener('click', () => {
      this.openMultiplayerModal();
    });
    document.getElementById('close-multiplayer-btn')?.addEventListener('click', () => {
      this.closeMultiplayerModal();
    });

    // Save Name Button
    document.getElementById('mp-save-name-btn')?.addEventListener('click', () => {
      const input = document.getElementById('mp-player-name-input') as HTMLInputElement;
      if (input && input.value.trim()) {
        const coord = this.callbacks.getMultiplayerCoordinator?.();
        if (coord) {
          const ok = coord.account.setUsername(input.value.trim());
          if (ok) {
            this.showToast(`✦ تم تحديث اسم المغامر: ${input.value.trim()}`);
            this.updateMultiplayerModalContent();
          }
        }
      }
    });

    // Copy UUID Button
    document.getElementById('mp-copy-uuid-btn')?.addEventListener('click', () => {
      const coord = this.callbacks.getMultiplayerCoordinator?.();
      if (coord) {
        const uuid = coord.account.getProfile().id;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(uuid);
        }
        this.showToast('📋 تم نسخ معرف اللاعب الفريد (Player UUID)');
      }
    });

    // Class selection buttons
    document.querySelectorAll('.mp-class-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const cls = target.getAttribute('data-class');
        if (cls) {
          const coord = this.callbacks.getMultiplayerCoordinator?.();
          if (coord) {
            coord.account.setCharacterClass(cls as any);
            this.showToast(`✦ تم اختيار فئة المغامر: ${cls}`);
            this.updateMultiplayerModalContent();
          }
        }
      });
    });

    // Story Narrative Modal Close
    document.getElementById('close-story-narrative-btn')?.addEventListener('click', () => {
      this.closeStoryNarrativeModal();
    });

    // Quest Log Modal Close
    document.getElementById('close-quest-log-btn')?.addEventListener('click', () => {
      this.closeQuestLogModal();
    });

    // Listen for 'M' key for World Memory and 'Q' key for Quest Journal and 'P' key for Multiplayer
    window.addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLInputElement) return;

      if ((e.code === 'KeyM' || e.key === 'm' || e.key === 'M' || e.key === 'ة') && !this.isModalOpen && !this.isPaused) {
        this.openWorldMemoryModal(this.callbacks.getMemoryProfile());
      } else if ((e.code === 'KeyM' || e.key === 'm' || e.key === 'M' || e.key === 'ة') && this.worldMemoryModal.classList.contains('open')) {
        this.closeWorldMemoryModal();
      }

      if ((e.code === 'KeyQ' || e.key === 'q' || e.key === 'Q' || e.key === 'ض') && !this.isModalOpen && !this.isPaused) {
        if (this.callbacks.getQuestSystem) {
          this.openQuestLogModal(this.callbacks.getQuestSystem());
        }
      } else if ((e.code === 'KeyQ' || e.key === 'q' || e.key === 'Q' || e.key === 'ض') && this.questLogModal.classList.contains('open')) {
        this.closeQuestLogModal();
      }

      if ((e.code === 'KeyP' || e.key === 'p' || e.key === 'P' || e.key === 'ح') && !this.isModalOpen && !this.isPaused) {
        this.openMultiplayerModal();
      } else if ((e.code === 'KeyP' || e.key === 'p' || e.key === 'P' || e.key === 'ح') && this.multiplayerModal?.classList.contains('open')) {
        this.closeMultiplayerModal();
      }
    });

    const masterVolSlider = document.getElementById('setting-master-vol') as HTMLInputElement;
    const musicVolSlider = document.getElementById('setting-music-vol') as HTMLInputElement;
    const onVolChange = () => {
      const master = parseFloat(masterVolSlider.value) / 100;
      const music = parseFloat(musicVolSlider.value) / 100;
      this.callbacks.onUpdateVolume(master, music);
    };
    masterVolSlider?.addEventListener('input', onVolChange);
    musicVolSlider?.addEventListener('input', onVolChange);

    const sensSlider = document.getElementById('setting-cam-sens') as HTMLInputElement;
    sensSlider?.addEventListener('input', () => {
      const sens = parseFloat(sensSlider.value) / 100;
      this.callbacks.onUpdateCameraSens(sens);
    });

    // Lore Modal
    document.getElementById('close-lore-btn')?.addEventListener('click', () => {
      this.closeLoreModal();
    });

    // Inscription Modal
    document.getElementById('close-inscription-btn')?.addEventListener('click', () => {
      this.closeInscriptionModal();
    });

    // Victory Modal
    document.getElementById('close-victory-btn')?.addEventListener('click', () => {
      this.victoryModal.classList.remove('open');
      this.isModalOpen = false;
    });

    // Interaction Prompts
    this.interactPrompt.addEventListener('click', () => {
      this.callbacks.onInteract();
    });

    const jumpBtn = document.getElementById('touch-jump-btn');
    const handleJump = (e: Event) => {
      if (this.isCustomizingControls) return;
      e.preventDefault();
      e.stopPropagation();
      this.callbacks.onJump();
    };
    jumpBtn?.addEventListener('pointerdown', handleJump);
    jumpBtn?.addEventListener('click', handleJump);

    const interactBtn = document.getElementById('touch-interact-btn');
    const handleInteractTouch = (e: Event) => {
      if (this.isCustomizingControls) return;
      e.preventDefault();
      e.stopPropagation();
      this.callbacks.onInteract();
    };
    interactBtn?.addEventListener('pointerdown', handleInteractTouch);
    interactBtn?.addEventListener('click', handleInteractTouch);

    // 1. Sprint Button (Hold to run / release to stop, runs in place if not moving joystick, no notification toast)
    let isSprintHeld = false;

    const startSprint = (e: Event) => {
      if (this.isCustomizingControls) return;
      e.preventDefault();
      e.stopPropagation();
      if (isSprintHeld) return;
      isSprintHeld = true;
      this.isAutoRunning = true;
      this.updateAutoRunUI(true);
      this.callbacks.onTouchSprintState?.(true);
    };

    const stopSprint = (e?: Event) => {
      if (!isSprintHeld) return;
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      isSprintHeld = false;
      this.isAutoRunning = false;
      this.updateAutoRunUI(false);
      this.callbacks.onTouchSprintState?.(false);
    };

    this.sprintTouchBtn.addEventListener('pointerdown', startSprint);
    this.sprintTouchBtn.addEventListener('pointerup', stopSprint);
    this.sprintTouchBtn.addEventListener('pointercancel', stopSprint);
    this.sprintTouchBtn.addEventListener('pointerleave', (e: PointerEvent) => {
      if (isSprintHeld) stopSprint(e);
    });

    // Touch events for mobile devices
    this.sprintTouchBtn.addEventListener('touchstart', startSprint, { passive: false });
    this.sprintTouchBtn.addEventListener('touchend', stopSprint, { passive: false });
    this.sprintTouchBtn.addEventListener('touchcancel', stopSprint, { passive: false });

    // Safety window release listeners
    window.addEventListener('pointerup', () => {
      if (isSprintHeld) stopSprint();
    });
    window.addEventListener('touchend', () => {
      if (isSprintHeld) stopSprint();
    });
    window.addEventListener('blur', () => {
      if (isSprintHeld) stopSprint();
    });

    // Combat Touch Actions (Instant pointer response)
    const handleAttack = (e: Event) => {
      if (this.isCustomizingControls) return;
      e.preventDefault();
      e.stopPropagation();
      this.callbacks.onCombatAttack?.();
    };
    this.touchAttackBtn?.addEventListener('pointerdown', handleAttack);
    this.touchAttackBtn?.addEventListener('click', handleAttack);

    const handleDodge = (e: Event) => {
      if (this.isCustomizingControls) return;
      e.preventDefault();
      e.stopPropagation();
      this.callbacks.onCombatDodge?.();
    };
    this.touchDodgeBtn?.addEventListener('pointerdown', handleDodge);
    this.touchDodgeBtn?.addEventListener('click', handleDodge);

    const handlePulse = (e: Event) => {
      if (this.isCustomizingControls) return;
      e.preventDefault();
      e.stopPropagation();
      this.callbacks.onCombatPulse?.();
    };
    this.touchPulseBtn?.addEventListener('pointerdown', handlePulse);
    this.touchPulseBtn?.addEventListener('click', handlePulse);

    // Death Modal Revive Action
    this.deathReviveBtn?.addEventListener('click', () => {
      if (this.onDeathReviveCallback) {
        this.onDeathReviveCallback();
      } else {
        this.callbacks.onRespawnRequested?.();
      }
    });
  }

  /**
   * Toggles Auto Run state (الركض التلقائي)
   */
  public toggleAutoRun(forceState?: boolean): boolean {
    if (this.isCustomizingControls) return this.isAutoRunning;
    this.isAutoRunning = forceState !== undefined ? forceState : !this.isAutoRunning;
    this.updateAutoRunUI(this.isAutoRunning);
    this.callbacks.onTouchSprintState?.(this.isAutoRunning);
    return this.isAutoRunning;
  }

  public updateAutoRunUI(active: boolean): void {
    if (!this.sprintTouchBtn) return;
    if (active) {
      this.sprintTouchBtn.classList.add('auto-run-active');
      const spans = this.sprintTouchBtn.querySelectorAll('span');
      if (spans.length >= 2) {
        spans[0].textContent = 'SPRINT';
        spans[1].textContent = 'ركض نشط';
      }
    } else {
      this.sprintTouchBtn.classList.remove('auto-run-active');
      const spans = this.sprintTouchBtn.querySelectorAll('span');
      if (spans.length >= 2) {
        spans[0].textContent = 'RUN';
        spans[1].textContent = 'ركض';
      }
    }
  }

  // ==========================================
  // CUSTOMIZABLE CONTROLS & HUD LAYOUT SYSTEM
  // ==========================================

  private readonly CONTROL_LABELS: Record<CustomizableControlId, { ar: string; en: string }> = {
    joystick: { ar: 'أنالوج الحركة', en: 'Movement Joystick' },
    sprint:   { ar: 'زر الركض', en: 'Sprint Button' },
    jump:     { ar: 'زر القفز', en: 'Jump Button' },
    attack:   { ar: 'زر الهجوم بالسيف', en: 'Attack / Slash' },
    dodge:    { ar: 'زر التدحرج والتفادي', en: 'Dodge Roll' },
    pulse:    { ar: 'زر نبض الأثير', en: 'Echo Pulse' },
    interact: { ar: 'زر التواصل والصدى', en: 'Commune / Interact' },
  };

  private readonly DEFAULT_LANDSCAPE_LAYOUT: LayoutConfiguration = {
    joystick: { xPercent: 0.05, yPercent: 0.65, scale: 1.0 },
    sprint:   { xPercent: 0.76, yPercent: 0.81, scale: 1.0 },
    jump:     { xPercent: 0.86, yPercent: 0.81, scale: 1.0 },
    interact: { xPercent: 0.67, yPercent: 0.81, scale: 1.0 },
    attack:   { xPercent: 0.88, yPercent: 0.61, scale: 1.1 },
    dodge:    { xPercent: 0.79, yPercent: 0.62, scale: 1.0 },
    pulse:    { xPercent: 0.70, yPercent: 0.62, scale: 1.0 },
  };

  private readonly DEFAULT_PORTRAIT_LAYOUT: LayoutConfiguration = {
    joystick: { xPercent: 0.06, yPercent: 0.76, scale: 0.95 },
    sprint:   { xPercent: 0.44, yPercent: 0.88, scale: 0.95 },
    jump:     { xPercent: 0.70, yPercent: 0.88, scale: 0.95 },
    interact: { xPercent: 0.76, yPercent: 0.76, scale: 0.95 },
    attack:   { xPercent: 0.76, yPercent: 0.64, scale: 1.0 },
    dodge:    { xPercent: 0.54, yPercent: 0.66, scale: 0.95 },
    pulse:    { xPercent: 0.32, yPercent: 0.66, scale: 0.95 },
  };

  public getCurrentOrientation(): 'landscape' | 'portrait' {
    // Under portrait-first and portrait-enforced mode, controls are positioned for portrait orientation
    return 'portrait';
  }

  public loadControlsLayout(orientation: 'landscape' | 'portrait' = 'portrait'): LayoutConfiguration {
    const key = `echo_controls_layout_portrait_v3`;
    const fallback = this.DEFAULT_PORTRAIT_LAYOUT;
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return { ...fallback, ...parsed };
        }
      }
    } catch (e) {
      console.warn('Failed to load saved controls layout:', e);
    }
    return JSON.parse(JSON.stringify(fallback));
  }

  public saveControlsLayout(orientation: 'landscape' | 'portrait', layout: LayoutConfiguration): void {
    const key = `echo_controls_layout_portrait_v3`;
    try {
      localStorage.setItem(key, JSON.stringify(layout));
    } catch (e) {
      console.warn('Failed to save controls layout:', e);
    }
  }

  public applyControlsLayout(orientation?: 'landscape' | 'portrait'): void {
    const ori = orientation || this.getCurrentOrientation();
    const layout = this.isCustomizingControls && this.currentDraftLayout
      ? this.currentDraftLayout
      : this.loadControlsLayout(ori);

    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    const controlIds: CustomizableControlId[] = ['joystick', 'sprint', 'jump', 'attack', 'dodge', 'pulse', 'interact'];

    controlIds.forEach((id) => {
      const element = this.getControlElement(id);
      if (!element) return;

      const placement = layout[id] || (ori === 'landscape' ? this.DEFAULT_LANDSCAPE_LAYOUT[id] : this.DEFAULT_PORTRAIT_LAYOUT[id]);
      if (!placement) return;

      const scale = placement.scale || 1.0;
      element.style.transform = `scale(${scale})`;

      const elWidth = (element.offsetWidth || 62) * scale;
      const elHeight = (element.offsetHeight || 62) * scale;

      let posX = Math.round(placement.xPercent * screenW);
      let posY = Math.round(placement.yPercent * screenH);

      // Boundaries: Strict screen clamping
      const minX = 8;
      const maxX = Math.max(minX, screenW - elWidth - 8);
      const minY = this.isCustomizingControls ? 70 : 8;
      const maxY = Math.max(minY, screenH - elHeight - 8);

      posX = Math.max(minX, Math.min(maxX, posX));
      posY = Math.max(minY, Math.min(maxY, posY));

      element.style.left = `${posX}px`;
      element.style.top = `${posY}px`;
      element.style.bottom = 'auto';
      element.style.right = 'auto';
    });

    // Dynamically refresh joystick center and proportional radius
    if (this.joystickBase) {
      const rect = this.joystickBase.getBoundingClientRect();
      this.joystickCenter = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      (this as any).joystickRadius = Math.max(35, (rect.width / 2) * 0.85);
    }
  }

  private getControlElement(id: CustomizableControlId): HTMLElement | null {
    switch (id) {
      case 'joystick': return document.getElementById('virtual-joystick-container');
      case 'sprint': return this.sprintTouchBtn;
      case 'jump': return document.getElementById('touch-jump-btn');
      case 'attack': return this.touchAttackBtn;
      case 'dodge': return this.touchDodgeBtn;
      case 'pulse': return this.touchPulseBtn;
      case 'interact': return this.touchInteractBtn;
      default: return null;
    }
  }

  private initControlsLayout(): void {
    const ori = this.getCurrentOrientation();
    this.applyControlsLayout(ori);

    // Bind Edit Mode Actions (supporting click and pointerdown with debounce and drag-state cleanup)
    const bindActionButton = (id: string, action: () => void) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      let lastTrigger = 0;
      const handler = (e: Event) => {
        const now = Date.now();
        if (now - lastTrigger < 180) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        lastTrigger = now;
        e.preventDefault();
        e.stopPropagation();
        this.isDraggingControl = false;
        this.activeDragElement = null;
        action();
      };
      btn.addEventListener('pointerdown', handler);
      btn.addEventListener('click', handler);
    };

    bindActionButton('editor-reset-btn', () => this.resetControlsToDefault());
    bindActionButton('editor-cancel-btn', () => this.exitControlsEditMode(false));
    bindActionButton('editor-save-btn', () => this.exitControlsEditMode(true));

    const handleSliderChange = (e: Event) => {
      e.stopPropagation();
      this.isDraggingControl = false;
      this.activeDragElement = null;
      const val = parseInt((e.target as HTMLInputElement).value, 10);
      if (!isNaN(val)) {
        this.updateSelectedControlScale(val);
      }
    };
    this.editorScaleSlider?.addEventListener('input', handleSliderChange);
    this.editorScaleSlider?.addEventListener('change', handleSliderChange);
    this.editorScaleSlider?.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.isDraggingControl = false;
      this.activeDragElement = null;
    });
    this.editorScaleSlider?.addEventListener('touchstart', (e) => {
      e.stopPropagation();
      this.isDraggingControl = false;
      this.activeDragElement = null;
    }, { passive: true });

    const bindScaleButton = (id: string, delta: number) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      let lastTrigger = 0;
      const handler = (e: Event) => {
        const now = Date.now();
        if (now - lastTrigger < 120) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        lastTrigger = now;
        e.preventDefault();
        e.stopPropagation();
        this.isDraggingControl = false;
        this.activeDragElement = null;
        const current = parseInt(this.editorScaleSlider.value, 10) || 100;
        this.updateSelectedControlScale(current + delta);
      };
      btn.addEventListener('pointerdown', handler);
      btn.addEventListener('click', handler);
    };

    bindScaleButton('editor-scale-minus-btn', -5);
    bindScaleButton('editor-scale-plus-btn', +5);

    this.setupControlDraggables();
  }

  public enterControlsEditMode(): void {
    // Record if opened from title screen so we restore correctly on exit
    this.openedFromTitleScreen = !this.titleScreen.classList.contains('hidden');
    if (this.openedFromTitleScreen) {
      this.titleScreen.classList.add('hidden');
    }

    this.closeSettingsModal();
    this.isCustomizingControls = true;
    this.isDraggingControl = false;
    this.activeDragElement = null;
    const ori = this.getCurrentOrientation();
    this.currentDraftLayout = JSON.parse(JSON.stringify(this.loadControlsLayout(ori)));

    this.root.classList.add('hud-editing');
    this.layoutEditorOverlay.classList.add('active');
    this.inGameHUD.classList.remove('hidden');

    if (this.editorOrientationBadge) {
      this.editorOrientationBadge.textContent = '📱 Portrait (عمودي)';
    }

    this.selectControlForEdit('joystick');
    this.applyControlsLayout(ori);
    this.showToast('🎮 وضع تخصيص أزرار التحكم نشط · اسحب أي زر لتغيير مكانه، أو عدّل حجمه');
  }

  public exitControlsEditMode(save: boolean): void {
    const ori = this.getCurrentOrientation();
    if (save && this.currentDraftLayout) {
      this.saveControlsLayout(ori, this.currentDraftLayout);
      this.showToast('✦ تم حفظ إعدادات التحكم بنجاح · Controls saved successfully');
    } else {
      // Revert unsaved modifications and restore last saved layout
      this.currentDraftLayout = this.loadControlsLayout(ori);
      this.showToast('تم إلغاء التعديلات · Changes discarded');
    }

    this.isCustomizingControls = false;
    this.isDraggingControl = false;
    this.activeDragElement = null;
    this.currentDraftLayout = null;
    this.root.classList.remove('hud-editing');
    this.layoutEditorOverlay.classList.remove('active');

    // Remove selection highlights
    document.querySelectorAll('.customizable-control').forEach((el) => {
      el.classList.remove('selected-edit-target');
    });

    this.applyControlsLayout(ori);

    // If opened from title screen, restore title screen; otherwise keep in-game HUD and return to settings
    if (this.openedFromTitleScreen) {
      this.titleScreen.classList.remove('hidden');
      this.inGameHUD.classList.add('hidden');
      this.openedFromTitleScreen = false;
    }
    this.openSettingsModal();
  }

  public resetControlsToDefault(): void {
    const ori = this.getCurrentOrientation();
    const defaults = ori === 'landscape' ? this.DEFAULT_LANDSCAPE_LAYOUT : this.DEFAULT_PORTRAIT_LAYOUT;
    this.currentDraftLayout = JSON.parse(JSON.stringify(defaults));
    this.applyControlsLayout(ori);
    this.selectControlForEdit(this.selectedControlId);
    this.showToast('✦ تمت استعادة المواقع والأحجام الافتراضية · Controls reset to defaults');
  }

  public selectControlForEdit(id: CustomizableControlId): void {
    this.selectedControlId = id;
    document.querySelectorAll('.customizable-control').forEach((el) => {
      el.classList.remove('selected-edit-target');
    });
    const targetEl = this.getControlElement(id);
    if (targetEl) {
      targetEl.classList.add('selected-edit-target');
    }

    const label = this.CONTROL_LABELS[id];
    if (this.editorSelectedNameText) {
      this.editorSelectedNameText.textContent = `${label.ar} · ${label.en}`;
    }

    const ori = this.getCurrentOrientation();
    const layout = this.currentDraftLayout || this.loadControlsLayout(ori);
    const currentScale = Math.round((layout[id]?.scale || 1.0) * 100);
    if (this.editorScaleSlider && this.editorScaleValueText) {
      this.editorScaleSlider.value = currentScale.toString();
      this.editorScaleValueText.textContent = `${currentScale}%`;
    }
  }

  public updateSelectedControlScale(scalePercent: number): void {
    if (!this.currentDraftLayout) return;
    const clampedPercent = Math.max(70, Math.min(150, scalePercent));
    const scale = clampedPercent / 100;
    if (this.currentDraftLayout[this.selectedControlId]) {
      this.currentDraftLayout[this.selectedControlId].scale = scale;
    }
    if (this.editorScaleSlider && this.editorScaleValueText) {
      this.editorScaleSlider.value = clampedPercent.toString();
      this.editorScaleValueText.textContent = `${clampedPercent}%`;
    }

    const element = this.getControlElement(this.selectedControlId);
    if (element) {
      element.style.transform = `scale(${scale})`;
    }
    this.applyControlsLayout();
  }

  private setupControlDraggables(): void {
    const controlIds: CustomizableControlId[] = ['joystick', 'sprint', 'jump', 'attack', 'dodge', 'pulse', 'interact'];

    controlIds.forEach((id) => {
      const el = this.getControlElement(id);
      if (!el) return;

      const onStart = (clientX: number, clientY: number, e: Event) => {
        if (!this.isCustomizingControls) return;
        e.preventDefault();
        e.stopPropagation();

        this.selectControlForEdit(id);
        this.isDraggingControl = true;
        this.activeDragElement = el;
        this.dragStartPointer = { x: clientX, y: clientY };

        const rect = el.getBoundingClientRect();
        this.dragStartPos = { x: rect.left, y: rect.top };
      };

      el.addEventListener('pointerdown', (e) => onStart(e.clientX, e.clientY, e));
    });

    const onMove = (clientX: number, clientY: number, e: Event) => {
      if (!this.isCustomizingControls || !this.isDraggingControl || !this.activeDragElement || !this.currentDraftLayout) return;
      e.preventDefault();

      const deltaX = clientX - this.dragStartPointer.x;
      const deltaY = clientY - this.dragStartPointer.y;

      const scale = this.currentDraftLayout[this.selectedControlId]?.scale || 1.0;
      const width = (this.activeDragElement.offsetWidth || 62) * scale;
      const height = (this.activeDragElement.offsetHeight || 62) * scale;

      let newX = this.dragStartPos.x + deltaX;
      let newY = this.dragStartPos.y + deltaY;

      // Boundaries: Strict screen clamping below the editor toolbar
      const minX = 8;
      const maxX = Math.max(minX, window.innerWidth - width - 8);
      const minY = 75; // Below editor toolbar
      const maxY = Math.max(minY, window.innerHeight - height - 8);

      newX = Math.max(minX, Math.min(maxX, newX));
      newY = Math.max(minY, Math.min(maxY, newY));

      this.activeDragElement.style.left = `${newX}px`;
      this.activeDragElement.style.top = `${newY}px`;
      this.activeDragElement.style.bottom = 'auto';
      this.activeDragElement.style.right = 'auto';

      // Update in draft layout
      this.currentDraftLayout[this.selectedControlId].xPercent = newX / window.innerWidth;
      this.currentDraftLayout[this.selectedControlId].yPercent = newY / window.innerHeight;
    };

    const onEnd = () => {
      if (this.isDraggingControl) {
        this.isDraggingControl = false;
        this.activeDragElement = null;
        this.applyControlsLayout();
      }
    };

    window.addEventListener('pointermove', (e) => onMove(e.clientX, e.clientY, e));
    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        onMove(e.touches[0].clientX, e.touches[0].clientY, e);
      }
    }, { passive: false });

    window.addEventListener('pointerup', onEnd);
    window.addEventListener('touchend', onEnd);
    window.addEventListener('pointercancel', onEnd);
    window.addEventListener('touchcancel', onEnd);
  }

  private setupVirtualJoystick(): void {
    const container = document.getElementById('virtual-joystick-container');
    if (!container) return;

    const onTouchStart = (e: TouchEvent) => {
      if (this.isCustomizingControls) return;
      e.preventDefault();
      e.stopPropagation();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (this.joystickTouchId === null) {
          this.joystickTouchId = touch.identifier;
          this.callbacks.onJoystickTouchState?.(touch.identifier);
          const rect = this.joystickBase.getBoundingClientRect();
          this.joystickCenter = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
          };
          (this as any).joystickRadius = Math.max(35, (rect.width / 2) * 0.85);
          this.updateJoystickPosition(touch.clientX, touch.clientY);
          break;
        }
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (this.isCustomizingControls) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === this.joystickTouchId) {
          e.preventDefault();
          e.stopPropagation();
          this.updateJoystickPosition(touch.clientX, touch.clientY);
          break;
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === this.joystickTouchId) {
          e.preventDefault();
          e.stopPropagation();
          this.joystickTouchId = null;
          this.callbacks.onJoystickTouchState?.(null);
          this.resetJoystick();
          break;
        }
      }
    };

    container.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: false });
    window.addEventListener('touchcancel', onTouchEnd, { passive: false });

    // Mouse dragging joystick on desktop
    let isMouseDown = false;
    container.addEventListener('mousedown', (e) => {
      if (this.isCustomizingControls) return;
      e.stopPropagation();
      isMouseDown = true;
      const rect = this.joystickBase.getBoundingClientRect();
      this.joystickCenter = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      (this as any).joystickRadius = Math.max(35, (rect.width / 2) * 0.85);
      this.updateJoystickPosition(e.clientX, e.clientY);
    });

    window.addEventListener('mousemove', (e) => {
      if (isMouseDown && !this.isCustomizingControls) {
        this.updateJoystickPosition(e.clientX, e.clientY);
      }
    });

    window.addEventListener('mouseup', () => {
      if (isMouseDown) {
        isMouseDown = false;
        this.resetJoystick();
      }
    });
  }

  public handleOrientationOrResize(): void {
    // Attempt standard Screen Orientation API lock if supported on mobile
    try {
      if (window.screen?.orientation && 'lock' in window.screen.orientation) {
        (window.screen.orientation as any).lock('portrait').catch(() => {
          // Ignore lock failures when user hasn't interacted or unsupported
        });
      }
    } catch {
      // Ignore unsupported browser errors
    }

    // Check for upside-down or mobile landscape orientation
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);

    const isLandscapeOnMobile = isMobileDevice && (window.innerWidth > window.innerHeight);
    const isUpsideDown =
      (window.orientation === 180) ||
      (window.screen?.orientation && window.screen.orientation.type === 'portrait-secondary');

    const blocker = document.getElementById('upside-down-blocker');
    if (blocker) {
      blocker.style.display = (isLandscapeOnMobile || isUpsideDown) ? 'flex' : 'none';
    }

    if (this.editorOrientationBadge) {
      this.editorOrientationBadge.textContent = '📱 Portrait (عمودي)';
    }

    // Apply layout for portrait orientation with boundary clamps
    this.applyControlsLayout('portrait');
  }

  private updateJoystickPosition(clientX: number, clientY: number): void {
    const dx = clientX - this.joystickCenter.x;
    const dy = clientY - this.joystickCenter.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const radius = (this as any).joystickRadius || 55;
    const clampedDist = Math.min(dist, radius);
    const angle = Math.atan2(dy, dx);

    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;

    this.joystickKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;

    // Deadzone and smooth linear interpolation
    const deadzone = 4;
    let normX = 0;
    let normY = 0;

    if (dist > deadzone) {
      const factor = Math.min(1.0, (dist - deadzone) / (radius - deadzone));
      // Right is +X, Left is -X; Up is +Y, Down is -Y (screen coords have down as +Y, so invert dy)
      normX = Math.cos(angle) * factor;
      normY = -Math.sin(angle) * factor;
    }

    const isSprinting = clampedDist >= radius * 0.92;
    this.callbacks.onTouchMove(normX, normY, isSprinting);
  }

  private resetJoystick(): void {
    this.joystickKnob.style.transform = 'translate(0px, 0px)';
    this.callbacks.onTouchMove(0, 0, false);
    this.callbacks.onJoystickTouchState?.(null);
  }

  public showHUD(): void {
    this.titleScreen.classList.add('hidden');
    this.inGameHUD.classList.remove('hidden');
  }

  public showTitleScreen(): void {
    this.titleScreen.classList.remove('hidden');
    this.inGameHUD.classList.add('hidden');
    this.pauseModal.classList.remove('open');
    this.isPaused = false;
  }

  public setContinueBadge(hasSave: boolean, count?: number): void {
    if (hasSave && count !== undefined) {
      this.continueStatus.textContent = `${count}/7 Echoes`;
      this.continueStatus.style.display = 'inline-block';
    } else {
      this.continueStatus.textContent = 'Start';
      this.continueStatus.style.display = 'inline-block';
    }
  }

  public showToast(message: string): void {
    this.toastNotification.textContent = message;
    this.toastNotification.classList.add('show');
    setTimeout(() => {
      this.toastNotification.classList.remove('show');
    }, 2500);
  }

  public openSettingsModal(): void {
    this.settingsModal.classList.add('open');
    this.isModalOpen = true;
  }

  public closeSettingsModal(): void {
    this.settingsModal.classList.remove('open');
    this.isModalOpen = false;
  }

  public setSoundIcon(isMuted: boolean): void {
    if (isMuted) {
      this.soundBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <line x1="23" y1="9" x2="17" y2="15"></line>
          <line x1="17" y1="9" x2="23" y2="15"></line>
        </svg>
      `;
    } else {
      this.soundBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        </svg>
      `;
    }
  }

  public updateCrystalProgress(collectedCount: number): void {
    const countEl = document.getElementById('crystal-count-text');
    if (countEl) {
      countEl.textContent = `${collectedCount} / 7`;
    }

    const slots = this.crystalSlotsContainer.children;
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i] as HTMLElement;
      if (i < collectedCount) {
        slot.classList.add('active');
        slot.style.backgroundColor = slot.dataset.color || '#00f5d4';
        slot.style.color = slot.dataset.color || '#00f5d4';
        slot.style.borderColor = slot.dataset.color || '#00f5d4';
      } else {
        slot.classList.remove('active');
        slot.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
        slot.style.borderColor = 'rgba(255, 255, 255, 0.25)';
      }
    }
  }

  public updateShardProgress(collectedCount: number, total: number = 10): void {
    if (this.shardCountText) {
      this.shardCountText.textContent = `${collectedCount} / ${total}`;
    }
    if (this.shardProgressFill) {
      const pct = Math.min(100, (collectedCount / total) * 100);
      this.shardProgressFill.style.width = `${pct}%`;
    }
  }

  public showTargetInteractPrompt(target: InteractiveTarget | null): void {
    const label = document.getElementById('interact-label');
    const touchBtn = this.touchInteractBtn;

    if (target) {
      this.interactPrompt.classList.add('visible');
      if (label) {
        label.textContent = `${target.actionEn} · ${target.actionAr} (${target.titleAr})`;
      }

      if (touchBtn) {
        touchBtn.style.borderColor = '#fee440';
        touchBtn.style.boxShadow = '0 0 16px rgba(254, 228, 64, 0.7)';
        const firstSpan = touchBtn.querySelector('span:first-child');
        const lastSpan = touchBtn.querySelector('span:last-child');
        if (target.type === 'shard') {
          if (firstSpan) firstSpan.textContent = 'SHARD';
          if (lastSpan) lastSpan.textContent = 'شظية';
        } else if (target.type === 'inscription') {
          if (firstSpan) firstSpan.textContent = 'READ';
          if (lastSpan) lastSpan.textContent = 'اقرأ';
        } else if (target.type === 'door') {
          if (firstSpan) firstSpan.textContent = 'GATE';
          if (lastSpan) lastSpan.textContent = 'بوابة';
        } else if (target.type === 'portal') {
          if (firstSpan) firstSpan.textContent = 'PORTAL';
          if (lastSpan) lastSpan.textContent = 'عتبة';
        } else {
          if (firstSpan) firstSpan.textContent = 'ECHO';
          if (lastSpan) lastSpan.textContent = 'تواصل';
        }
      }
    } else {
      this.interactPrompt.classList.remove('visible');
      if (touchBtn) {
        touchBtn.style.borderColor = 'rgba(0, 245, 212, 0.55)';
        touchBtn.style.boxShadow = '0 4px 18px rgba(0, 0, 0, 0.5)';
        const firstSpan = touchBtn.querySelector('span:first-child');
        const lastSpan = touchBtn.querySelector('span:last-child');
        if (firstSpan) firstSpan.textContent = 'ECHO';
        if (lastSpan) lastSpan.textContent = 'تواصل';
      }
    }
  }

  public showInteractPrompt(crystal: CrystalData | null): void {
    if (crystal && !crystal.collected) {
      this.showTargetInteractPrompt({
        id: crystal.id,
        type: 'crystal',
        titleAr: crystal.nameAr,
        titleEn: crystal.nameEn,
        actionAr: 'تواصل مع صدى البلورة',
        actionEn: 'Commune with Echo Crystal',
        pos: crystal.pos,
        dist: 0,
      });
    } else {
      this.showTargetInteractPrompt(null);
    }
  }

  public openLoreModal(crystal: CrystalData): void {
    this.loreTitleAr.textContent = crystal.nameAr;
    this.loreTitleEn.textContent = crystal.nameEn;
    this.loreLocation.textContent = `${crystal.locationEn} · ${crystal.locationAr}`;
    this.loreTextAr.textContent = crystal.memoryAr;
    this.loreTextEn.textContent = crystal.memoryEn;

    this.loreModal.classList.add('open');
    this.isModalOpen = true;
  }

  public closeLoreModal(): void {
    this.loreModal.classList.remove('open');
    this.isModalOpen = false;
  }

  public openInscriptionModal(inscription: AncientInscription): void {
    this.inscriptionTitleAr.textContent = inscription.titleAr;
    this.inscriptionTitleEn.textContent = inscription.titleEn;
    this.inscriptionGlyph.textContent = inscription.glyph;
    this.inscriptionLocation.textContent = `${inscription.locationEn} · ${inscription.locationAr}`;
    this.inscriptionTextAr.textContent = inscription.contentAr;
    this.inscriptionTextEn.textContent = inscription.contentEn;

    this.inscriptionModal.classList.add('open');
    this.isModalOpen = true;
  }

  public closeInscriptionModal(): void {
    this.inscriptionModal.classList.remove('open');
    this.isModalOpen = false;
  }

  public openVictoryModal(): void {
    this.victoryModal.classList.add('open');
    this.isModalOpen = true;
  }

  public openWorldMemoryModal(profile: PlayerMemoryProfile): void {
    // 1. Archetype and Resonance
    const archAr = document.getElementById('memory-archetype-ar');
    const archEn = document.getElementById('memory-archetype-en');
    const rankEl = document.getElementById('memory-resonance-level');
    if (archAr) archAr.textContent = profile.archetypeAr;
    if (archEn) archEn.textContent = profile.archetypeEn;
    if (rankEl) rankEl.textContent = `Rank ${profile.worldResonanceLevel} · المرتبة ${profile.worldResonanceLevel}`;

    // 2. Playtime format MM:SS
    const timeEl = document.getElementById('stat-play-time');
    if (timeEl) {
      const minutes = Math.floor(profile.totalPlayTimeSec / 60);
      const seconds = Math.floor(profile.totalPlayTimeSec % 60);
      timeEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // 3. Sprint Distance & Sprints
    const sprintEl = document.getElementById('stat-sprint-dist');
    if (sprintEl) {
      sprintEl.textContent = `${Math.round(profile.sprintDistanceMeters)} m (${profile.sprintCount}x)`;
    }

    // 4. Zones Count
    const zonesEl = document.getElementById('stat-zones-count');
    if (zonesEl) {
      zonesEl.textContent = `${profile.zonesVisited.length} / 8`;
    }

    // 5. Secrets Count
    const secretsEl = document.getElementById('stat-secrets-count');
    if (secretsEl) {
      secretsEl.textContent = `${profile.secretsFound.length}`;
    }

    // 6. Active World Manifestations List
    const manList = document.getElementById('manifestations-list');
    if (manList) {
      const allManifestations = [
        {
          key: 'elder_tree_heart',
          titleAr: 'يقظة قلب شجرة الخلود العتيقة',
          titleEn: 'Heart of the Colossal Elder Tree',
          descAr: 'استيقظت النواة السماوية الزرقاء في جذع الشجرة وتفتحت أزهار الأثير الضوئية.',
          descEn: 'The radiant cyan ocular vortex inside the elder trunk pulses with ancient lifeforce.',
        },
        {
          key: 'crystalline_bridge',
          titleAr: 'المسار البلوري فوق بحيرة الضياء',
          titleEn: 'Secret Crystalline Lake Bridge',
          descAr: 'برزت أحجار سحرية عائمة تمكّن من عبور البحيرة دون الغرق نحو الكهوف السرية.',
          descEn: 'Ethereal floating stones raised from the radiant depths, paving a hidden path.',
        },
        {
          key: 'forest_spirit',
          titleAr: 'طيف وعائل الغابة الروحي',
          titleEn: 'Slumbering Forest Spirit Stag',
          descAr: 'استيقظ حارس الصنوبر الأثيري وقرونه المتوهجة لحراسة خطواتك السريعة.',
          descEn: 'The celestial guardian awakened by your vigorous pace through the woods.',
        },
        {
          key: 'temple_deep_runes',
          titleAr: 'نقوش أرضية المعبد الغائرة',
          titleEn: 'Sanctuary Deep Floor Runes',
          descAr: 'توهجت رموز البنّائين الأوائل الذهبية في أرضية رواق المعبد العتيق.',
          descEn: 'Hidden sacred glyphs illuminated upon repeated reverence to the sanctuary.',
        },
        {
          key: 'celestial_aurora',
          titleAr: 'شفق الجزيرة الكوني المتلألئ',
          titleEn: 'Celestial Island Aurora',
          descAr: 'تموجات أثيرية تضيء سماء الجزيرة المنسية تعبيراً عن تناغم الأصداء.',
          descEn: 'Shimmering celestial ribbons dancing across the mystic atmosphere.',
        },
      ];

      manList.innerHTML = allManifestations
        .map((m) => {
          const isUnlocked = Boolean(profile.manifestations[m.key]);
          return `
            <div style="background: ${isUnlocked ? 'rgba(0, 245, 212, 0.08)' : 'rgba(0, 0, 0, 0.35)'}; border: 1px solid ${isUnlocked ? 'rgba(0, 245, 212, 0.35)' : 'rgba(255, 255, 255, 0.08)'}; border-radius: 12px; padding: 0.65rem 0.85rem; display: flex; justify-content: space-between; align-items: center; gap: 0.8rem;">
              <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.15rem;">
                  <span style="font-weight: 700; color: ${isUnlocked ? '#ffffff' : '#728994'}; font-size: 0.95rem;">${m.titleAr} · ${m.titleEn}</span>
                </div>
                <div style="font-size: 0.78rem; color: ${isUnlocked ? '#95d5d8' : '#576f7a'}; line-height: 1.3;">
                  ${isUnlocked ? m.descAr : 'لا تزال هذه القوة نائمة في العالم... استكشف الجزيرة لتوقظها.'}
                </div>
              </div>
              <div style="font-size: 0.75rem; font-weight: 800; padding: 0.25rem 0.6rem; border-radius: 9999px; white-space: nowrap; ${
                isUnlocked
                  ? 'background: rgba(0, 245, 212, 0.2); color: #00f5d4; border: 1px solid rgba(0, 245, 212, 0.5); box-shadow: 0 0 10px rgba(0, 245, 212, 0.3);'
                  : 'background: rgba(255, 255, 255, 0.05); color: #58717d; border: 1px solid rgba(255, 255, 255, 0.1);'
              }">
                ${isUnlocked ? '✦ AWAKENED · مستيقظ' : '🔒 DORMANT · نائم'}
              </div>
            </div>
          `;
        })
        .join('');
    }

    // 7. Time Spent per Biome Breakdown
    const biomeList = document.getElementById('biome-breakdown-list');
    if (biomeList) {
      const biomes = Object.keys(BIOMES) as BiomeType[];
      const totalSec = Math.max(1, profile.totalPlayTimeSec);

      biomeList.innerHTML = biomes
        .map((bKey) => {
          const info = BIOMES[bKey];
          const timeSec = profile.biomeTimeSec[bKey] || 0;
          const pct = Math.min(100, Math.round((timeSec / totalSec) * 100));
          const mins = Math.floor(timeSec / 60);
          const secs = Math.floor(timeSec % 60);

          return `
            <div style="background: rgba(0, 0, 0, 0.25); border-radius: 8px; padding: 0.4rem 0.65rem; border: 1px solid rgba(255, 255, 255, 0.05);">
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem; margin-bottom: 0.25rem;">
                <span style="color: ${info.color}; font-weight: 700;">${info.nameAr} · ${info.nameEn}</span>
                <span style="color: #ccd7e0; font-family: monospace;">${mins}m ${secs}s (${pct}%)</span>
              </div>
              <div style="height: 5px; width: 100%; background: rgba(255, 255, 255, 0.07); border-radius: 9999px; overflow: hidden;">
                <div style="height: 100%; width: ${pct}%; background: ${info.color}; border-radius: 9999px; transition: width 0.3s ease;"></div>
              </div>
            </div>
          `;
        })
        .join('');
    }

    this.worldMemoryModal.classList.add('open');
    this.isModalOpen = true;
  }

  public closeWorldMemoryModal(): void {
    this.worldMemoryModal.classList.remove('open');
    this.isModalOpen = false;
  }

  public openMultiplayerModal(): void {
    this.updateMultiplayerModalContent();
    this.multiplayerModal.classList.add('open');
    this.isModalOpen = true;
  }

  public closeMultiplayerModal(): void {
    this.multiplayerModal.classList.remove('open');
    this.isModalOpen = false;
  }

  public updateMultiplayerModalContent(): void {
    const coord = this.callbacks.getMultiplayerCoordinator?.();
    if (!coord) return;

    const profile = coord.account.getProfile();
    const party = coord.party.getParty();

    const nameInput = document.getElementById('mp-player-name-input') as HTMLInputElement;
    if (nameInput) nameInput.value = profile.username;

    const uuidText = document.getElementById('mp-player-uuid-text');
    if (uuidText) uuidText.textContent = profile.id;

    const partyCodeBadge = document.getElementById('mp-party-code-badge');
    if (partyCodeBadge && party) partyCodeBadge.textContent = `CODE: ${party.passCode}`;

    const slot1Name = document.getElementById('mp-slot-1-name');
    if (slot1Name) slot1Name.textContent = `${profile.username} (Leader)`;

    const sharedObj = document.getElementById('mp-shared-objective-text');
    if (sharedObj && party) sharedObj.textContent = party.sharedObjectiveAr;

    // Highlight active class button
    document.querySelectorAll('.mp-class-btn').forEach((btn) => {
      const cls = btn.getAttribute('data-class');
      if (cls === profile.characterClass) {
        (btn as HTMLElement).style.borderColor = '#00f5d4';
        (btn as HTMLElement).style.background = 'rgba(0, 245, 212, 0.12)';
      } else {
        (btn as HTMLElement).style.borderColor = 'rgba(255, 255, 255, 0.12)';
        (btn as HTMLElement).style.background = 'rgba(255, 255, 255, 0.04)';
      }
    });
  }

  public togglePause(): void {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.pauseModal.classList.add('open');
    } else {
      this.pauseModal.classList.remove('open');
    }
    this.callbacks.onPauseToggle();
  }

  public getIsModalOrPaused(): boolean {
    return this.isModalOpen || this.isPaused || this.isCustomizingControls;
  }

  /**
   * Draws circular minimap radar
   */
  public renderMinimap(
    playerX: number,
    playerZ: number,
    playerAngle: number,
    crystals: CrystalData[],
    shards?: MemoryShard[],
    npcs?: { pos: { x: number; z: number }; type: string }[],
    enemies?: { pos: { x: number; z: number } }[],
    allies?: { pos: { x: number; z: number }; name?: string; color?: number }[],
    houses?: { x: number; z: number; style: string; nameAr: string }[]
  ): void {
    const ctx = this.minimapCanvas.getContext('2d');
    if (!ctx) return;

    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const radarScale = 0.42;

    ctx.clearRect(0, 0, w, h);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-playerAngle);

    // 1. Island coastline representation
    ctx.strokeStyle = 'rgba(0, 245, 212, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(-playerX * radarScale, -playerZ * radarScale, 210 * radarScale, 0, Math.PI * 2);
    ctx.stroke();

    // 2. Bioluminescent Lake
    ctx.fillStyle = 'rgba(0, 245, 212, 0.35)';
    ctx.beginPath();
    ctx.arc(-playerX * radarScale, (-15 - playerZ) * radarScale, 36 * radarScale, 0, Math.PI * 2);
    ctx.fill();

    // 3. Ancient Temple icon
    ctx.fillStyle = '#82848c';
    ctx.fillRect((-85 - playerX) * radarScale - 3, (25 - playerZ) * radarScale - 3, 6, 6);

    // 4. Great Portal icon
    ctx.fillStyle = '#00ffff';
    ctx.fillRect((95 - playerX) * radarScale - 4, (-30 - playerZ) * radarScale - 4, 8, 8);

    // 4.5. Village Houses & Rustic Cottages (Cozy rooftops with glowing hearth dots)
    if (houses) {
      houses.forEach((h) => {
        const mx = (h.x - playerX) * radarScale;
        const my = (h.z - playerZ) * radarScale;
        const size = h.style === 'large' ? 6 : h.style === 'medium' ? 4.5 : 3.5;

        // Wooden/stone cabin foundation & roof
        ctx.fillStyle = h.style === 'large' ? '#c89666' : '#b07d4f';
        ctx.fillRect(mx - size / 2, my - size / 2, size, size);

        // Roof ridge line
        ctx.strokeStyle = '#5a3818';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(mx - size / 2, my);
        ctx.lineTo(mx + size / 2, my);
        ctx.stroke();

        // Warm glowing hearth marker
        ctx.fillStyle = '#ff7722';
        ctx.beginPath();
        ctx.arc(mx, my, 1.2, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // 5. Memory Shard blips (delicate golden points)
    if (shards) {
      shards.forEach((s) => {
        if (s.collected) return;
        const mx = (s.pos.x - playerX) * radarScale;
        const my = (s.pos.z - playerZ) * radarScale;

        ctx.fillStyle = '#fee440';
        ctx.beginPath();
        ctx.arc(mx, my, 2.2, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // 6. Echo Crystal blips
    crystals.forEach((c) => {
      if (c.collected) return;
      const mx = (c.pos.x - playerX) * radarScale;
      const my = (c.pos.z - playerZ) * radarScale;

      ctx.fillStyle = '#' + c.color.toString(16).padStart(6, '0');
      ctx.beginPath();
      ctx.arc(mx, my, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // 7. NPC & Spirit Creature blips
    if (npcs) {
      npcs.forEach((npc) => {
        const mx = (npc.pos.x - playerX) * radarScale;
        const my = (npc.pos.z - playerZ) * radarScale;
        if (npc.type === 'WANDERER') {
          ctx.fillStyle = '#00f5d4';
          ctx.beginPath();
          ctx.arc(mx, my, 4.0, 0, Math.PI * 2);
          ctx.fill();
        } else if (npc.type === 'GUARDIAN') {
          ctx.fillStyle = '#9b5de5';
          ctx.fillRect(mx - 3.5, my - 3.5, 7, 7);
        } else {
          ctx.fillStyle = '#5eead4';
          ctx.beginPath();
          ctx.arc(mx, my, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    // 8. Enemy blips (Corrupted Wood Wraiths - ominous crimson diamond markers)
    if (enemies) {
      enemies.forEach((enemy) => {
        const mx = (enemy.pos.x - playerX) * radarScale;
        const my = (enemy.pos.z - playerZ) * radarScale;
        ctx.fillStyle = '#ff3366';
        ctx.beginPath();
        ctx.arc(mx, my, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ff758f';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    }

    // 9. Co-Op Party Allies (Luminous Cyan/Gold rings)
    if (allies) {
      allies.forEach((ally) => {
        const mx = (ally.pos.x - playerX) * radarScale;
        const my = (ally.pos.z - playerZ) * radarScale;
        ctx.fillStyle = '#00f5d4';
        ctx.beginPath();
        ctx.arc(mx, my, 4.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
    }

    ctx.restore();

    // Player marker at center of compass (facing UP)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 6);
    ctx.lineTo(cx - 4, cy + 5);
    ctx.closePath();
    ctx.fill();
  }

  // ==========================================
  // COMBAT SYSTEM HUD & STATS METHODS
  // ==========================================

  public updateCombatStats(stats: CombatStats): void {
    if (this.playerHpBarFill && this.playerHpText) {
      const hpPct = Math.max(0, Math.min(100, (stats.hp / stats.maxHp) * 100));
      this.playerHpBarFill.style.width = `${hpPct}%`;
      this.playerHpText.textContent = `${Math.ceil(stats.hp)} / ${stats.maxHp} HP`;
      if (hpPct <= 30) {
        this.playerHpBarFill.classList.add('low');
      } else {
        this.playerHpBarFill.classList.remove('low');
      }
    }

    if (this.playerEnergyBarFill && this.playerEnergyText) {
      const energyPct = Math.max(0, Math.min(100, (stats.energy / stats.maxEnergy) * 100));
      this.playerEnergyBarFill.style.width = `${energyPct}%`;
      this.playerEnergyText.textContent = `${Math.ceil(stats.energy)} / ${stats.maxEnergy}`;
      if (stats.energy >= 40) {
        this.playerEnergyBarFill.classList.add('pulse-ready');
      } else {
        this.playerEnergyBarFill.classList.remove('pulse-ready');
      }
    }
  }

  public showHurtEffect(): void {
    if (this.hurtVignetteOverlay) {
      this.hurtVignetteOverlay.classList.add('active');
      setTimeout(() => {
        this.hurtVignetteOverlay.classList.remove('active');
      }, 220);
    }
  }

  public openDeathModal(onRevive: () => void): void {
    this.onDeathReviveCallback = onRevive;
    if (this.deathModal) {
      this.deathModal.classList.add('open');
    }
    this.isModalOpen = true;
  }

  public closeDeathModal(): void {
    if (this.deathModal) {
      this.deathModal.classList.remove('open');
    }
    this.isModalOpen = false;
    this.onDeathReviveCallback = null;
  }

  // ==========================================
  // NPC DIALOGUE SYSTEM METHODS
  // ==========================================

  /**
   * Opens the interactive NPC Dialogue modal with branching choices
   */
  public openNPCDialogue(node: DialogueNode, onOptionSelected: (option: DialogueOption) => void): void {
    if (!this.npcDialogueModal) return;
    this.onDialogueOptionSelectedCallback = onOptionSelected;

    this.npcPortraitImg.src = node.portraitUrl;
    this.npcTitleBadge.textContent = `${node.titleAr} · ${node.titleEn}`;
    this.npcNameAr.textContent = node.speakerNameAr;
    this.npcNameEn.textContent = node.speakerNameEn;
    this.npcDialogueMessageAr.textContent = node.messageAr;
    this.npcDialogueMessageEn.textContent = node.messageEn;

    // Render dialogue choice buttons
    this.npcDialogueOptionsContainer.innerHTML = '';
    node.options.forEach((opt) => {
      const btn = document.createElement('button');
      btn.className = 'modal-btn interactive';
      btn.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        padding: 0.75rem 1.1rem;
        background: rgba(0, 245, 212, 0.08);
        border: 1.5px solid rgba(0, 245, 212, 0.35);
        border-radius: 10px;
        color: #ffffff;
        cursor: pointer;
        transition: all 0.2s ease;
        text-align: right;
        direction: rtl;
      `;
      btn.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 0.15rem; flex: 1;">
          <span style="font-family: 'Amiri', serif; font-size: 1.15rem; color: #e0fbf6;">${opt.textAr}</span>
          <span style="font-size: 0.78rem; color: #80ffea; direction: ltr; text-align: left;">${opt.textEn}</span>
        </div>
        <span style="font-size: 1.1rem; color: #00f5d4; margin-right: 0.75rem;">❮</span>
      `;

      btn.addEventListener('mouseenter', () => {
        btn.style.background = 'rgba(0, 245, 212, 0.22)';
        btn.style.borderColor = '#00f5d4';
        btn.style.transform = 'translateX(-4px)';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.background = 'rgba(0, 245, 212, 0.08)';
        btn.style.borderColor = 'rgba(0, 245, 212, 0.35)';
        btn.style.transform = 'translateX(0)';
      });

      btn.addEventListener('click', () => {
        if (this.onDialogueOptionSelectedCallback) {
          this.onDialogueOptionSelectedCallback(opt);
        }
      });

      this.npcDialogueOptionsContainer.appendChild(btn);
    });

    this.npcDialogueModal.classList.add('open');
    this.isModalOpen = true;
  }

  public closeNPCDialogue(): void {
    if (this.npcDialogueModal) {
      this.npcDialogueModal.classList.remove('open');
    }
    this.isModalOpen = false;
    this.onDialogueOptionSelectedCallback = null;
  }

  public isNPCDialogueOpen(): boolean {
    return this.npcDialogueModal ? this.npcDialogueModal.classList.contains('open') : false;
  }


  // ==========================================
  // QUEST & STORY NARRATIVE SYSTEM METHODS
  // ==========================================

  /**
   * Updates the in-game HUD Quest Tracker card with current quest and active objective
   */
  public updateQuestTracker(quest: StoryQuest, activeObj: QuestObjective | null): void {
    if (!this.questCluster) return;

    // Update quest chapter and title
    if (this.questChapterBadge) {
      this.questChapterBadge.innerHTML = `<span>✦ CHAPTER ${quest.chapter === 1 ? 'I' : 'II'}</span><span style="opacity: 0.65;">·</span><span>${quest.chapter === 1 ? 'المهمة الأولى' : 'المهمة الثانية'}</span>`;
    }
    if (this.questTitleText) {
      this.questTitleText.textContent = `${quest.titleEn} · ${quest.titleAr}`;
    }

    if (activeObj) {
      const arabicNumerals = ['١', '٢', '٣', '٤', '٥', '٦', '٧'];
      const totalArabic = arabicNumerals[quest.objectives.length - 1] || `${quest.objectives.length}`;
      const objIdx = quest.objectives.findIndex((o) => o.id === activeObj.id);
      const curArabic = arabicNumerals[objIdx] || `${objIdx + 1}`;

      if (this.questObjectiveBadge) {
        this.questObjectiveBadge.textContent = `${curArabic} / ${totalArabic}`;
      }
      if (this.questObjectiveTitleAr) {
        this.questObjectiveTitleAr.textContent = activeObj.titleAr;
      }
      if (this.questObjectiveTitleEn) {
        this.questObjectiveTitleEn.textContent = activeObj.titleEn;
      }
      if (this.questObjectiveHint) {
        this.questObjectiveHint.innerHTML = `<span>📍</span><span>${activeObj.hintAr}</span>`;
      }

      // Progress bar and counter
      if (this.questProgressText && this.questProgressBar) {
        if (activeObj.targetCount > 1) {
          const unit = activeObj.id === 'explore_island' ? 'm' : '';
          this.questProgressText.textContent = `${activeObj.currentCount} / ${activeObj.targetCount}${unit}`;
          const pct = Math.min(100, Math.round((activeObj.currentCount / activeObj.targetCount) * 100));
          this.questProgressBar.style.width = `${pct}%`;
          this.questProgressBar.style.display = 'block';
        } else {
          this.questProgressText.textContent = activeObj.isCompleted ? 'مكتمل ✓' : 'قيد التنفيذ ✦';
          this.questProgressBar.style.width = activeObj.isCompleted ? '100%' : '20%';
        }
      }
    } else {
      // All objectives completed
      if (this.questObjectiveBadge) this.questObjectiveBadge.textContent = '✓';
      if (this.questObjectiveTitleAr) this.questObjectiveTitleAr.textContent = 'اكتملت جميع أهداف المهمة!';
      if (this.questObjectiveTitleEn) this.questObjectiveTitleEn.textContent = 'All Objectives Completed!';
      if (this.questProgressText) this.questProgressText.textContent = '100%';
      if (this.questProgressBar) this.questProgressBar.style.width = '100%';
      if (this.questObjectiveHint) {
        this.questObjectiveHint.innerHTML = `<span>🌟</span><span>الذاكرة مستيقظة بالكامل · The World Remembers</span>`;
      }
    }
  }

  /**
   * Displays the celebratory sliding objective completed banner
   */
  public showObjectiveCompleteBanner(completedObj: QuestObjective, nextObj: QuestObjective | null): void {
    if (!this.objectiveCompleteBanner) return;

    if (this.objectiveCompleteTitle) {
      this.objectiveCompleteTitle.textContent = `${completedObj.titleAr} · ${completedObj.titleEn}`;
    }

    if (this.objectiveCompleteNext) {
      if (nextObj) {
        this.objectiveCompleteNext.innerHTML = `<span>الهدف التالي المفتوح:</span> <strong style="color: #fee440;">${nextObj.titleAr}</strong>`;
      } else {
        this.objectiveCompleteNext.innerHTML = `<span style="color: #00f5d4; font-weight: 800;">🎉 اكتملت مهمة الذاكرة الأولى بالكامل!</span>`;
      }
    }

    this.objectiveCompleteBanner.classList.add('show');
    setTimeout(() => {
      this.objectiveCompleteBanner.classList.remove('show');
    }, 4500);
  }

  /**
   * Opens the cinematic story narrative dialog
   */
  public openStoryNarrativeModal(event: NarrativeStoryEvent): void {
    if (!this.storyNarrativeModal) return;

    if (this.storyNarrativeBadge) {
      this.storyNarrativeBadge.textContent = `${event.badgeAr} · ${event.badgeEn}`;
    }
    if (this.storyNarrativeTitleAr) {
      this.storyNarrativeTitleAr.textContent = event.titleAr;
    }
    if (this.storyNarrativeTitleEn) {
      this.storyNarrativeTitleEn.textContent = event.titleEn;
    }
    if (this.storyNarrativeContentAr) {
      this.storyNarrativeContentAr.textContent = event.contentAr;
    }
    if (this.storyNarrativeContentEn) {
      this.storyNarrativeContentEn.textContent = event.contentEn;
    }
    if (this.storyNarrativeQuoteAr) {
      this.storyNarrativeQuoteAr.textContent = event.quoteAr || '«هذا العالم يحفظ كل خطوة تخطوها.»';
    }

    this.storyNarrativeModal.classList.add('open');
    this.isModalOpen = true;
  }

  public closeStoryNarrativeModal(): void {
    if (this.storyNarrativeModal) {
      this.storyNarrativeModal.classList.remove('open');
    }
    this.isModalOpen = false;
  }

  /**
   * Opens the Quest & Story Journal Modal
   */
  public openQuestLogModal(questSystem: QuestSystem): void {
    if (!this.questLogModal) return;
    this.renderQuestLog(questSystem);
    this.questLogModal.classList.add('open');
    this.isModalOpen = true;
  }

  public closeQuestLogModal(): void {
    if (this.questLogModal) {
      this.questLogModal.classList.remove('open');
    }
    this.isModalOpen = false;
  }

  /**
   * Renders all 5 objectives and chapters inside the Quest Log Journal
   */
  public renderQuestLog(questSystem: QuestSystem): void {
    if (!this.questLogList) return;

    const quest = questSystem.getActiveQuest();
    const completedCount = quest.objectives.filter((o) => o.isCompleted).length;
    const arabicNumerals = ['١', '٢', '٣', '٤', '٥'];

    const progressBadge = document.getElementById('quest-log-progress-badge');
    if (progressBadge) {
      const curAr = arabicNumerals[completedCount] || `${completedCount}`;
      const totalAr = arabicNumerals[quest.objectives.length - 1] || `${quest.objectives.length}`;
      progressBadge.textContent = `${curAr} / ${totalAr} مكتمل`;
    }

    this.questLogList.innerHTML = quest.objectives
      .map((obj, idx) => {
        const stepNumAr = arabicNumerals[idx] || `${idx + 1}`;
        const isCurrent = obj.isUnlocked && !obj.isCompleted;
        const statusClass = obj.isCompleted ? 'completed' : isCurrent ? 'active' : 'locked';

        const iconSymbol = obj.isCompleted ? '✓' : isCurrent ? '✦' : '🔒';
        const iconClass = obj.isCompleted ? 'done' : isCurrent ? 'current' : 'lock';

        let progressLabel = '';
        if (obj.isCompleted) {
          progressLabel = '<span style="color: #00f5d4; font-weight: 800; font-size: 0.78rem;">مكتمل ✓ Completed</span>';
        } else if (isCurrent) {
          if (obj.targetCount > 1) {
            const unit = obj.id === 'explore_island' ? 'm' : '';
            progressLabel = `<span style="color: #fee440; font-weight: 800; font-size: 0.78rem;">قيد الإنجاز (${obj.currentCount}/${obj.targetCount}${unit})</span>`;
          } else {
            progressLabel = '<span style="color: #fee440; font-weight: 800; font-size: 0.78rem;">الهدف النشط الحالي ✦ Active</span>';
          }
        } else {
          progressLabel = '<span style="color: #728994; font-size: 0.75rem;">مقفل · يفتح بعد إكمال السابق 🔒</span>';
        }

        return `
          <div class="quest-checklist-item ${statusClass}">
            <div class="quest-status-icon ${iconClass}">${iconSymbol}</div>
            <div style="flex: 1; text-align: right; direction: rtl;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.2rem;">
                <div style="font-family: 'Amiri', serif; font-size: 1.25rem; font-weight: 700; color: ${obj.isCompleted ? '#00f5d4' : isCurrent ? '#ffffff' : '#728994'};">
                  ${stepNumAr}. ${obj.titleAr}
                </div>
                ${progressLabel}
              </div>
              <div style="font-size: 0.8rem; color: #80ffea; margin-bottom: 0.35rem; direction: ltr; text-align: left;">
                ${obj.titleEn}
              </div>
              <div style="font-size: 0.85rem; color: ${isCurrent ? '#e4f7f4' : '#94a7b0'}; line-height: 1.45;">
                ${obj.descAr}
              </div>
              ${
                isCurrent
                  ? `<div style="font-size: 0.78rem; color: #fee440; background: rgba(254, 228, 64, 0.1); border-right: 2px solid #fee440; padding: 0.3rem 0.6rem; border-radius: 4px; margin-top: 0.4rem;">
                      📍 إرشاد: ${obj.hintAr}
                    </div>`
                  : ''
              }
            </div>
          </div>
        `;
      })
      .join('');
  }
}

