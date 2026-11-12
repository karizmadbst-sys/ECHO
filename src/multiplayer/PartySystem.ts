/**
 * ECHO – THE WORLD REMEMBERS
 * Party & Co-Op Adventure System (نظام الفرق والمجموعات التعاونية)
 *
 * Supports:
 * 1. 4-player co-op party formation.
 * 2. Shared party objectives and waypoint pings.
 * 3. Party health & class readiness synchronization.
 * 4. Passcode-based invitations.
 */

import { PartyGroup, PartyMember, WaypointPing, PlayerAccountProfile, PlayerId } from './types.ts';

export class PartySystem {
  private activeParty: PartyGroup | null = null;
  private activePings: WaypointPing[] = [];

  // Listeners
  public onPartyChanged?: (party: PartyGroup | null) => void;
  public onPingAdded?: (ping: WaypointPing) => void;

  constructor(private localPlayerProfile: PlayerAccountProfile) {
    // Default to an initial self-party for seamless offline transition
    this.createLocalSoloParty();
  }

  /**
   * Initializes local player as a solo leader ready to invite companions
   */
  public createLocalSoloParty(): PartyGroup {
    const code = this.generatePasscode();
    const leaderMember: PartyMember = {
      playerId: this.localPlayerProfile.id,
      username: this.localPlayerProfile.username,
      characterClass: this.localPlayerProfile.characterClass,
      isLeader: true,
      hp: 100,
      maxHp: 100,
      isReady: true,
      pingMs: 0,
    };

    this.activeParty = {
      partyId: `party_${Date.now()}_${code}`,
      leaderId: this.localPlayerProfile.id,
      passCode: code,
      members: [leaderMember],
      maxMembers: 4,
      sharedObjectiveAr: 'استكشاف أسرار المعبد العتيق والبلورات السبع',
      sharedObjectiveEn: 'Explore Sanctuary Secrets & Attune the 7 Crystals',
      createdAt: Date.now(),
    };

    if (this.onPartyChanged) {
      this.onPartyChanged(this.activeParty);
    }

    return this.activeParty;
  }

  public getParty(): PartyGroup | null {
    return this.activeParty;
  }

  public isLeader(): boolean {
    if (!this.activeParty) return false;
    return this.activeParty.leaderId === this.localPlayerProfile.id;
  }

  /**
   * Adds or updates a remote member (from network sync)
   */
  public syncMember(member: PartyMember): void {
    if (!this.activeParty) return;

    const existingIdx = this.activeParty.members.findIndex((m) => m.playerId === member.playerId);
    if (existingIdx >= 0) {
      this.activeParty.members[existingIdx] = { ...this.activeParty.members[existingIdx], ...member };
    } else if (this.activeParty.members.length < this.activeParty.maxMembers) {
      this.activeParty.members.push(member);
    }

    if (this.onPartyChanged) {
      this.onPartyChanged(this.activeParty);
    }
  }

  /**
   * Removes a member from the party
   */
  public removeMember(playerId: PlayerId): void {
    if (!this.activeParty) return;

    this.activeParty.members = this.activeParty.members.filter((m) => m.playerId !== playerId);

    // If leader left, promote next member
    if (this.activeParty.leaderId === playerId && this.activeParty.members.length > 0) {
      this.activeParty.leaderId = this.activeParty.members[0].playerId;
      this.activeParty.members[0].isLeader = true;
    }

    if (this.onPartyChanged) {
      this.onPartyChanged(this.activeParty);
    }
  }

  /**
   * Creates a tactical waypoint ping in the 3D world for teammates
   */
  public addPing(x: number, y: number, z: number, type: WaypointPing['type'] = 'EXPLORE'): WaypointPing {
    const ping: WaypointPing = {
      id: `ping_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      senderId: this.localPlayerProfile.id,
      senderName: this.localPlayerProfile.username,
      x,
      y,
      z,
      type,
      timestamp: Date.now(),
      durationMs: 8000, // Visible for 8 seconds
    };

    this.activePings.push(ping);
    if (this.onPingAdded) {
      this.onPingAdded(ping);
    }
    return ping;
  }

  /**
   * Cleans up expired pings
   */
  public update(nowMs: number = Date.now()): void {
    this.activePings = this.activePings.filter((p) => nowMs - p.timestamp < p.durationMs);
  }

  public getActivePings(): WaypointPing[] {
    return this.activePings;
  }

  /**
   * Updates local player health/energy to broadcast to party
   */
  public updateLocalStats(hp: number, maxHp: number): void {
    if (!this.activeParty) return;
    const localMember = this.activeParty.members.find((m) => m.playerId === this.localPlayerProfile.id);
    if (localMember) {
      localMember.hp = hp;
      localMember.maxHp = maxHp;
    }
  }

  private generatePasscode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'ECHO-';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}
