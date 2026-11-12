/**
 * ECHO – THE WORLD REMEMBERS
 * Player Account & Identity Manager (إدارة حساب وهوية اللاعب المستقلة)
 *
 * Provides:
 * 1. Persistent, independent UUIDv4 for each player.
 * 2. Player identity profile (name, title, class, cosmetic resonance).
 * 3. Separation of identity logic from 3D visual rendering.
 * 4. Ready for authentication tokens and cloud synchronization.
 */

import { PlayerAccountProfile, CharacterClass } from './types.ts';

const STORAGE_KEY_IDENTITY = 'echo_player_account_identity';

export class PlayerAccountManager {
  private profile: PlayerAccountProfile;

  constructor() {
    this.profile = this.loadOrGenerateProfile();
  }

  /**
   * Generates a cryptographically secure or pseudo-random UUID v4
   */
  public static generateUUID(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      try {
        return crypto.randomUUID();
      } catch {
        // Fallback below
      }
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Loads saved profile from localStorage, or creates a new one
   */
  private loadOrGenerateProfile(): PlayerAccountProfile {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_IDENTITY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id && parsed.username) {
          parsed.lastActive = Date.now();
          this.saveProfile(parsed);
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read player identity from storage:', e);
    }

    // Default adventurer profile
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const newProfile: PlayerAccountProfile = {
      id: `echo_usr_${PlayerAccountManager.generateUUID()}`,
      username: `SpiritWanderer_${randomSuffix}`,
      titleAr: 'مستكشف الأثير الأولي',
      titleEn: 'First Spirit Pioneer',
      characterClass: 'SPIRIT_WEAVER',
      robeColor: '#1d4ed8', // Royal Blue
      auraColor: '#00f5d4', // Mystic Turquoise
      level: 1,
      echoMastery: 0,
      createdAt: Date.now(),
      lastActive: Date.now(),
    };

    this.saveProfile(newProfile);
    return newProfile;
  }

  /**
   * Returns current player profile
   */
  public getProfile(): PlayerAccountProfile {
    return { ...this.profile };
  }

  /**
   * Updates player username
   */
  public setUsername(name: string): boolean {
    const clean = name.trim();
    if (clean.length < 2 || clean.length > 24) return false;
    this.profile.username = clean;
    this.profile.lastActive = Date.now();
    this.saveProfile(this.profile);
    return true;
  }

  /**
   * Updates player character class
   */
  public setCharacterClass(charClass: CharacterClass): void {
    this.profile.characterClass = charClass;
    if (charClass === 'SPIRIT_WEAVER') {
      this.profile.titleAr = 'نساج الأرواح الروحاني';
      this.profile.titleEn = 'Spirit Weaver';
      this.profile.auraColor = '#00f5d4';
    } else if (charClass === 'ANCIENT_WARDEN') {
      this.profile.titleAr = 'حارس الأطلال العتيق';
      this.profile.titleEn = 'Ancient Warden';
      this.profile.auraColor = '#a855f7';
    } else if (charClass === 'MIND_SEEKER') {
      this.profile.titleAr = 'باحث ذكريات الجزيرة';
      this.profile.titleEn = 'Mind Seeker';
      this.profile.auraColor = '#38bdf8';
    } else if (charClass === 'ECHO_BLADE') {
      this.profile.titleAr = 'سياف الصدى المقدس';
      this.profile.titleEn = 'Echo Blade';
      this.profile.auraColor = '#f59e0b';
    }
    this.profile.lastActive = Date.now();
    this.saveProfile(this.profile);
  }

  /**
   * Updates cosmetic aura/robe colors
   */
  public setColors(robeColor: string, auraColor: string): void {
    this.profile.robeColor = robeColor;
    this.profile.auraColor = auraColor;
    this.profile.lastActive = Date.now();
    this.saveProfile(this.profile);
  }

  /**
   * Grants Echo mastery (experience)
   */
  public addMastery(amount: number): { levelUp: boolean; newLevel: number } {
    this.profile.echoMastery += amount;
    const requiredForNext = this.profile.level * 100;
    let levelUp = false;

    if (this.profile.echoMastery >= requiredForNext) {
      this.profile.level++;
      this.profile.echoMastery -= requiredForNext;
      levelUp = true;
    }

    this.profile.lastActive = Date.now();
    this.saveProfile(this.profile);
    return { levelUp, newLevel: this.profile.level };
  }

  /**
   * Persists profile to localStorage
   */
  private saveProfile(profile: PlayerAccountProfile): void {
    try {
      localStorage.setItem(STORAGE_KEY_IDENTITY, JSON.stringify(profile));
    } catch (e) {
      console.warn('Could not persist player identity:', e);
    }
  }

  /**
   * Exports account identity packet for server authentication
   */
  public getAuthPayload(): { profile: PlayerAccountProfile; clientTimestamp: number } {
    return {
      profile: this.getProfile(),
      clientTimestamp: Date.now(),
    };
  }
}
