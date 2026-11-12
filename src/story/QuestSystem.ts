/**
 * ECHO – THE WORLD REMEMBERS
 * Dynamic Quest & Story Narrative System (نظام المهام والقصة التفاعلية)
 *
 * Story Premise:
 * يستيقظ اللاعب في جزيرة مجهولة ولا يتذكر كيف وصل إليها.
 * يكتشف أن العالم يحتفظ بذكريات كل من دخله، وتتردد أصداء أرواحهم في الحجر والماء والبلورات.
 *
 * Quest 1: THE FIRST MEMORY (الذاكرة الأولى)
 * 1. استكشف الجزيرة (Explore the Island)
 * 2. اجمع ثلاث شظايا ذاكرة (Collect 3 Memory Shards)
 * 3. اكتشف المعبد القديم (Discover the Ancient Temple)
 * 4. اقرأ النقش الموجود داخله (Read the Inscription Inside)
 * 5. افتح البوابة الحجرية (Open the Stone Portal/Gate)
 *
 * Each objective automatically unlocks the next, accompanied by narrative story banners,
 * sound effects, and visual markers.
 */

import * as THREE from 'three';
import { Terrain } from '../world/Terrain.ts';

export interface QuestObjective {
  id: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  hintAr: string;
  hintEn: string;
  currentCount: number;
  targetCount: number;
  isCompleted: boolean;
  isUnlocked: boolean;
  targetPos?: THREE.Vector3;
  targetRadius?: number;
  completionStoryTitleAr?: string;
  completionStoryTitleEn?: string;
  completionStoryAr?: string;
  completionStoryEn?: string;
}

export interface StoryQuest {
  id: string;
  chapter: number;
  titleAr: string;
  titleEn: string;
  loreIntroAr: string;
  loreIntroEn: string;
  objectives: QuestObjective[];
  isCompleted: boolean;
}

export interface NarrativeStoryEvent {
  id: string;
  badgeAr: string;
  badgeEn: string;
  titleAr: string;
  titleEn: string;
  contentAr: string;
  contentEn: string;
  quoteAr?: string;
  quoteEn?: string;
  icon?: string;
}

export class QuestSystem {
  public quests: StoryQuest[] = [];
  public currentQuestIndex: number = 0;
  public currentObjectiveIndex: number = 0;

  // Tracking
  private startPosition: THREE.Vector3 = new THREE.Vector3(Terrain.SPAWN_POS.x, 5, Terrain.SPAWN_POS.z);
  private distanceTraveled: number = 0;
  private lastPosition: THREE.Vector3 = new THREE.Vector3(Terrain.SPAWN_POS.x, 5, Terrain.SPAWN_POS.z);
  private hasShownPrologue: boolean = false;
  private exploredAreas: Set<string> = new Set();

  // Callbacks
  public onObjectiveUpdated?: (quest: StoryQuest, objective: QuestObjective) => void;
  public onObjectiveCompleted?: (quest: StoryQuest, objective: QuestObjective, nextObjective: QuestObjective | null) => void;
  public onQuestCompleted?: (quest: StoryQuest, nextQuest: StoryQuest | null) => void;
  public onStoryNarrativeTriggered?: (event: NarrativeStoryEvent) => void;

  constructor() {
    this.initQuests();
  }

  private initQuests(): void {
    // ==========================================
    // QUEST 1: THE FIRST MEMORY (الذاكرة الأولى)
    // ==========================================
    const firstMemoryObjectives: QuestObjective[] = [
      {
        id: 'explore_island',
        titleAr: 'استكشف الجزيرة',
        titleEn: 'Explore the Island',
        descAr: 'انهض من رمال الشاطئ وتحرك لاكتشاف معالم الجزيرة المنسية وأراضيها الغامضة.',
        descEn: 'Rise from the shoreline sands and explore the surroundings of the Forgotten Island.',
        hintAr: 'امشِ مسافة قصيرة واكتشف نتوء الشاطئ أو مشارف الغابة (تحرك للأمام بالضغط على W أو عصا التحكم)',
        hintEn: 'Walk forward to explore the southern shoreline and forest borders.',
        currentCount: 0,
        targetCount: 35, // 35 meters traveled or reaching landmark
        isCompleted: false,
        isUnlocked: true, // First objective starts unlocked
        completionStoryTitleAr: 'همس الشاطئ المنسي',
        completionStoryTitleEn: 'Whispers of the Lost Shore',
        completionStoryAr: 'مع أولى خطواتك، تشعر برنين غريب يسري تحت أقدامك. رمال هذا الشاطئ ليست صامتة؛ إنها تحفظ خطوات كل من وصل هنا قبلك. لقد استيقظت أصداء الجزيرة!',
        completionStoryEn: 'With your first steps, a resonant pulse hums beneath your feet. The sands are not silent; they remember all who walked before you. The island stirs!',
      },
      {
        id: 'collect_3_shards',
        titleAr: 'اجمع ثلاث شظايا ذاكرة',
        titleEn: 'Collect 3 Memory Shards',
        descAr: 'ابحث عن شظايا الذاكرة الفيروزية العائمة واجمع ثلاثاً منها لسماع أصداء الماضي.',
        descEn: 'Seek out the glowing astral Memory Shards scattered across the island and gather three of them.',
        hintAr: 'تتبع النور الفيروزي والأصفر على البوصلة والمصغرة، واقترب من الشظية ثم اضغط [E] أو زر التفاعل',
        hintEn: 'Follow the glowing markers on the minimap, approach the floating shards, and interact [E].',
        currentCount: 0,
        targetCount: 3,
        isCompleted: false,
        isUnlocked: false,
        completionStoryTitleAr: 'تلاحم الشظايا الأثيرية',
        completionStoryTitleEn: 'The Resonance of Memory',
        completionStoryAr: 'عندما التقت الشظايا الثلاث في راحة يدك، تدفق وميضٌ دافئ في عروقك وصوتٌ أثيري قديم يهمس: «شمال غرب الجزيرة... بين أعمدة معبد الأسرار يرقد اللوح الذي كتبه الأوائل!»',
        completionStoryEn: 'As three memory shards unite, warm ethereal light surges through you: "To the northwest... within the pillars of the Ancient Temple rests the stele carved by the first keepers!"',
      },
      {
        id: 'discover_temple',
        titleAr: 'اكتشف المعبد القديم',
        titleEn: 'Discover the Ancient Temple',
        descAr: 'اتجه نحو الشمال الغربي عبر هضاب الصخور واعثر على صرح المعبد القديم الشاهق.',
        descEn: 'Journey northwest across the rugged heights to discover the towering Ancient Temple sanctuary.',
        hintAr: 'اتجه للشمال الغربي (راجع الخريطة أو البوصلة باتجاه الأعمدة الحجرية الدائرية الكبرى)',
        hintEn: 'Head northwest toward the colossal circular stone colonnade on the high plateau.',
        currentCount: 0,
        targetCount: 1,
        isCompleted: false,
        isUnlocked: false,
        targetPos: new THREE.Vector3(Terrain.TEMPLE_POS.x, Terrain.TEMPLE_POS.y, Terrain.TEMPLE_POS.z),
        targetRadius: 26.0,
        completionStoryTitleAr: 'عتبة معبد الأسرار',
        completionStoryTitleEn: 'Threshold of the Sanctuary',
        completionStoryAr: 'تقف أخيراً أمام الأعمدة الحجرية الهائلة لمعبد الأسرار. الزمن هنا متوقف، ومسلة حجرية عتيقة في فناء المعبد تنبض بنقوش فيروزية مضيئة تنتظر من يقرأها.',
        completionStoryEn: 'You stand before the colossal pillars of the ancient sanctuary. Time stands still here; a monolithic stele pulses with luminous turquoise runes in the forecourt, awaiting your touch.',
      },
      {
        id: 'read_temple_inscription',
        titleAr: 'اقرأ النقش الموجود في المعبد',
        titleEn: 'Read the Temple Inscription',
        descAr: 'اقترب من مسلة لوح معبد الأسرار المنقوشة وتفاعل معها لقراءة كلماتها القديمة.',
        descEn: 'Approach the carved Stele of the Sanctuary Veil near the temple entrance and read its ancient text.',
        hintAr: 'اقترب من المسلة الحجرية ذات الرموز المشعة أمام مدخل المعبد واضغط [E]',
        hintEn: 'Step close to the glowing stone stele in front of the temple archway and press [E].',
        currentCount: 0,
        targetCount: 1,
        isCompleted: false,
        isUnlocked: false,
        completionStoryTitleAr: 'سر الختم الحجري',
        completionStoryTitleEn: 'Secret of the Stone Seal',
        completionStoryAr: 'تترجم روحك النقش القديم: «الأبواب المغلقة هنا لا تطلب مفاتيح حديدية، بل نية طاهرة ولمسة من أثير الروح. اقترب والمس الختم لفتح الملاذ.» الآن يمكنك فك الختم وفتح البوابة الحجرية!',
        completionStoryEn: 'The ancient runes translate in your mind: "The sealed portals yield to no iron keys, but to pure intent and the touch of aether." The seal responds to your awakened spirit—the stone gate can now be unsealed!',
      },
      {
        id: 'open_stone_gate',
        titleAr: 'افتح البوابة الحجرية',
        titleEn: 'Open the Stone Gate',
        descAr: 'اقترب من بوابة المعبد الحجرية الضخمة واضغط على الختم المضيء لفتحها ودخول قدس الأقداس.',
        descEn: 'Approach the massive sliding stone gate of the temple and activate its glowing seal to open the sanctuary.',
        hintAr: 'قف أمام البوابة الحجرية ذات الختم الفيروزي الكبير واضغط [E] لفتحها',
        hintEn: 'Stand before the temple stone gate bearing the turquoise seal and press [E] to open it.',
        currentCount: 0,
        targetCount: 1,
        isCompleted: false,
        isUnlocked: false,
        completionStoryTitleAr: 'انفتاح الأفق · اكتمال الذاكرة الأولى',
        completionStoryTitleEn: 'The First Memory Awakening',
        completionStoryAr: 'بصوت زئير الحجر الرخيم، تنزاح البوابة الصخرية الضخمة إلى الأعلى متحررة من قيود القرون! شعاع من الضوء الأزرق يملأ الأرجاء، وذاكرتك الأولى تكتمل: أنت لست غريباً عن هذه الجزيرة، بل مستكشف مقدر له إيقاظ بلورات الصدى السبع وفتح بوابة العبور الكبرى!',
        completionStoryEn: 'With a deep resonant grinding of ancient stone, the colossal slab ascends, unsealed after centuries! Radiant celestial light fills the sanctuary. Your first memory is restored: you are destined to awaken the 7 Echo Crystals and unlock the Great Transcendent Portal!',
      },
    ];

    const quest1: StoryQuest = {
      id: 'quest_first_memory',
      chapter: 1,
      titleAr: 'الذاكرة الأولى',
      titleEn: 'THE FIRST MEMORY',
      loreIntroAr: 'يستيقظ المغامر على رمال الشاطئ بعد أن قذفته أمواج النسيان، ليكتشف أن جزيرة الصدى تحتفظ بذكريات كل من عبرها.',
      loreIntroEn: 'A wanderer awakens upon forgotten shores with no memory of their arrival, learning that the island preserves the memories of all who crossed it.',
      objectives: firstMemoryObjectives,
      isCompleted: false,
    };

    // ==========================================
    // QUEST 2: THE AWAKENING OF THE ECHOES (استيقاظ الأصداء)
    // ==========================================
    const quest2Objectives: QuestObjective[] = [
      {
        id: 'collect_all_crystals',
        titleAr: 'اجمع بلورات الصدى السبع',
        titleEn: 'Awaken the 7 Echo Crystals',
        descAr: 'ابحث عن بلورات الصدى السبع العملاقة الموزعة عبر بيئات الجزيرة المنسية.',
        descEn: 'Locate and commune with all 7 colossal Echo Crystals scattered across the island biomes.',
        hintAr: 'استكشف البحيرة المضيئة، الغابة، الكهوف، وقمة الجبل لجمع البلورات',
        hintEn: 'Explore the bioluminescent lake, whispering forest, cave grotto, and mountain peak.',
        currentCount: 0,
        targetCount: 7,
        isCompleted: false,
        isUnlocked: true,
      },
      {
        id: 'activate_great_portal',
        titleAr: 'فعّل البوابة الحجرية العظيمة',
        titleEn: 'Activate the Great Celestial Portal',
        descAr: 'اتجه إلى منصة البوابة الحجرية العظمى في الشرق وأشعل الرموز السبعة للعبور إلى النور الأبدي.',
        descEn: 'Travel to the eastern megalithic portal platform and ignite all seven runes to transcend.',
        hintAr: 'اقترب من البوابة الكبرى واضغط [E] لفتح أفق العبور الكوني',
        hintEn: 'Approach the Great Portal and press [E] to trigger cosmic ascension.',
        currentCount: 0,
        targetCount: 1,
        isCompleted: false,
        isUnlocked: false,
        targetPos: new THREE.Vector3(Terrain.PORTAL_POS.x, Terrain.PORTAL_POS.y, Terrain.PORTAL_POS.z),
        targetRadius: 12.0,
      },
    ];

    const quest2: StoryQuest = {
      id: 'quest_echoes_awakening',
      chapter: 2,
      titleAr: 'استيقاظ الأصداء الكونية',
      titleEn: 'THE AWAKENING OF THE ECHOES',
      loreIntroAr: 'أصبحت الرؤية واضحة الآن: تجميع البلورات السبعة سيوقظ البوابة السماوية ليعبر المغامر إلى عوالمه الأصلية.',
      loreIntroEn: 'The path is now clear: gathering all seven primal crystals will ignite the cosmic portal for your ascension.',
      objectives: quest2Objectives,
      isCompleted: false,
    };

    this.quests = [quest1, quest2];
  }

  /**
   * Returns prologue narrative when game starts
   */
  public getPrologueEvent(): NarrativeStoryEvent {
    return {
      id: 'story_prologue',
      badgeAr: 'بداية الرحلة · THE AWAKENING',
      badgeEn: 'Prologue · The Awakening',
      titleAr: 'الاستيقاظ على شاطئ النسيان',
      titleEn: 'Awakening on Forgotten Sands',
      contentAr: 'تفتح عينيك لتجد نفسك مستلقياً على رمال شاطئ فيروزي دافئ... لا تتذكر اسمك، ولا كيف عبرت هذا المحيط الشاسع. نسيم عليل يحمل رائحة صنوبر قديم وأمواج تتهادى بنعومة.\n\nفي عمق وجدانك، يهمس صدى رقيق: «أهلاً بك في جزيرة الأصداء. هذا العالم لا ينسى أحداً... كل من وطأت قدماه هذه الأرض ترك روحه منقوشة في حجرها ومائها وبلوراتها. استيقظ، واستعد ذاكرتك الأولى!»',
      contentEn: 'You open your eyes upon warm turquoise sands, unable to recall your name or how you reached this boundless ocean. An ethereal whisper echoes in your mind: "Welcome to the Island of Echoes. This world remembers everyone who entered it... Awaken, and reclaim your first memory!"',
      quoteAr: '«العالم يتذكر كل من مر به... وأصداء الماضي تنتظر من يناديها.»',
      quoteEn: '"The world remembers all who walked it... and echoes of the past await your call."',
      icon: 'sparkles',
    };
  }

  public getActiveQuest(): StoryQuest {
    return this.quests[this.currentQuestIndex] || this.quests[0];
  }

  public getActiveObjective(): QuestObjective | null {
    const quest = this.getActiveQuest();
    return quest.objectives.find((obj) => obj.isUnlocked && !obj.isCompleted) || null;
  }

  /**
   * Called every frame to track player movement, location proximity, and exploration
   */
  public updatePlayerMovement(pos: THREE.Vector3): void {
    const distDelta = this.lastPosition.distanceTo(pos);
    if (distDelta > 0.05 && distDelta < 5.0) {
      this.distanceTraveled += distDelta;
      this.lastPosition.copy(pos);

      // Objective 1: Explore Island
      const activeObj = this.getActiveObjective();
      if (activeObj && activeObj.id === 'explore_island') {
        const progress = Math.min(Math.floor(this.distanceTraveled), activeObj.targetCount);
        if (progress !== activeObj.currentCount) {
          activeObj.currentCount = progress;
          this.onObjectiveUpdated?.(this.getActiveQuest(), activeObj);

          if (activeObj.currentCount >= activeObj.targetCount) {
            this.completeObjective(activeObj.id);
          }
        }
      }
    }

    // Proximity check for Temple (Objective 3)
    const active = this.getActiveObjective();
    if (active && active.id === 'discover_temple' && active.targetPos && active.targetRadius) {
      const d = pos.distanceTo(active.targetPos);
      if (d <= active.targetRadius) {
        active.currentCount = 1;
        this.completeObjective('discover_temple');
      }
    }
  }

  /**
   * Called when player collects a memory shard
   */
  public recordShardCollected(totalCollected: number): void {
    const activeObj = this.getActiveObjective();
    if (activeObj && activeObj.id === 'collect_3_shards') {
      activeObj.currentCount = Math.min(totalCollected, activeObj.targetCount);
      this.onObjectiveUpdated?.(this.getActiveQuest(), activeObj);

      if (activeObj.currentCount >= activeObj.targetCount) {
        this.completeObjective('collect_3_shards');
      }
    }
  }

  /**
   * Called when player reads an inscription
   */
  public recordInscriptionRead(inscriptionId: number): void {
    const activeObj = this.getActiveObjective();
    if (activeObj && activeObj.id === 'read_temple_inscription') {
      // Specifically reading inscription 2 (Temple Forecourt) or any inscription when inside temple
      if (inscriptionId === 2 || inscriptionId === 0 || inscriptionId === 1 || inscriptionId === 3 || inscriptionId === 4) {
        activeObj.currentCount = 1;
        this.completeObjective('read_temple_inscription');
      }
    }
  }

  /**
   * Called when player opens the temple door or interacts with stone portal
   */
  public recordStoneGateAction(isOpen: boolean): void {
    const activeObj = this.getActiveObjective();
    if (activeObj && activeObj.id === 'open_stone_gate' && isOpen) {
      activeObj.currentCount = 1;
      this.completeObjective('open_stone_gate');
    }
  }

  /**
   * Called when player gathers echo crystals (for chapter 2)
   */
  public recordCrystalCount(crystalCount: number): void {
    const quest2 = this.quests[1];
    if (quest2) {
      const obj = quest2.objectives.find((o) => o.id === 'collect_all_crystals');
      if (obj && obj.isUnlocked) {
        obj.currentCount = Math.min(crystalCount, obj.targetCount);
        this.onObjectiveUpdated?.(quest2, obj);
        if (obj.currentCount >= obj.targetCount && !obj.isCompleted) {
          this.completeObjective('collect_all_crystals');
        }
      }
    }
  }

  /**
   * Completes an objective and automatically unlocks the next objective!
   */
  public completeObjective(objectiveId: string): void {
    const quest = this.getActiveQuest();
    const objIndex = quest.objectives.findIndex((o) => o.id === objectiveId);
    if (objIndex < 0) return;

    const obj = quest.objectives[objIndex];
    if (obj.isCompleted) return;

    obj.isCompleted = true;
    obj.currentCount = obj.targetCount;

    // Trigger story narrative event if present
    if (obj.completionStoryAr && obj.completionStoryTitleAr) {
      this.onStoryNarrativeTriggered?.({
        id: `story_${obj.id}`,
        badgeAr: `فصل من القصة · ${quest.titleAr}`,
        badgeEn: `Story Chapter · ${quest.titleEn}`,
        titleAr: obj.completionStoryTitleAr,
        titleEn: obj.completionStoryTitleEn || '',
        contentAr: obj.completionStoryAr,
        contentEn: obj.completionStoryEn || '',
        icon: 'parchment',
      });
    }

    // Automatically unlock the next objective!
    const nextObj = quest.objectives[objIndex + 1] || null;
    if (nextObj) {
      nextObj.isUnlocked = true;
    } else {
      // All objectives in current quest are completed!
      quest.isCompleted = true;
      const nextQuest = this.quests[this.currentQuestIndex + 1] || null;
      if (nextQuest) {
        this.currentQuestIndex++;
        nextQuest.objectives[0].isUnlocked = true;
      }
      this.onQuestCompleted?.(quest, nextQuest);
    }

    this.onObjectiveCompleted?.(quest, obj, nextObj);
  }

  public resetAll(): void {
    this.distanceTraveled = 0;
    this.currentQuestIndex = 0;
    this.currentObjectiveIndex = 0;
    this.hasShownPrologue = false;
    this.exploredAreas.clear();

    this.quests.forEach((q, qIdx) => {
      q.isCompleted = false;
      q.objectives.forEach((obj, objIdx) => {
        obj.isCompleted = false;
        obj.currentCount = 0;
        obj.isUnlocked = qIdx === 0 && objIdx === 0;
      });
    });
  }

  public serialize(): unknown {
    return {
      currentQuestIndex: this.currentQuestIndex,
      distanceTraveled: this.distanceTraveled,
      quests: this.quests.map((q) => ({
        id: q.id,
        isCompleted: q.isCompleted,
        objectives: q.objectives.map((o) => ({
          id: o.id,
          currentCount: o.currentCount,
          isCompleted: o.isCompleted,
          isUnlocked: o.isUnlocked,
        })),
      })),
    };
  }

  public deserialize(data: unknown): void {
    if (!data || typeof data !== 'object') return;
    const save = data as {
      currentQuestIndex?: number;
      distanceTraveled?: number;
      quests?: Array<{
        id: string;
        isCompleted: boolean;
        objectives: Array<{
          id: string;
          currentCount: number;
          isCompleted: boolean;
          isUnlocked: boolean;
        }>;
      }>;
    };

    if (typeof save.currentQuestIndex === 'number') {
      this.currentQuestIndex = Math.min(save.currentQuestIndex, this.quests.length - 1);
    }
    if (typeof save.distanceTraveled === 'number') {
      this.distanceTraveled = save.distanceTraveled;
    }

    if (Array.isArray(save.quests)) {
      save.quests.forEach((savedQ) => {
        const q = this.quests.find((quest) => quest.id === savedQ.id);
        if (!q) return;
        q.isCompleted = savedQ.isCompleted;
        if (Array.isArray(savedQ.objectives)) {
          savedQ.objectives.forEach((savedObj) => {
            const obj = q.objectives.find((o) => o.id === savedObj.id);
            if (!obj) return;
            obj.currentCount = savedObj.currentCount;
            obj.isCompleted = savedObj.isCompleted;
            obj.isUnlocked = savedObj.isUnlocked;
          });
        }
      });
    }
  }
}
