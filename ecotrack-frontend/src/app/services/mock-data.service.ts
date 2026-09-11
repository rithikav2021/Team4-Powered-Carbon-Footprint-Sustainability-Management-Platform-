import { Injectable, computed, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  Badge,
  CarbonEntry,
  Challenge,
  LeaderboardEntry,
  Recommendation,
  Report,
  SustainabilityGoal,
  UserProfile,
} from '../models/data.model';

/**
 * Gamification: 4-level XP progression ladder.
 * Levels reuse the same tier names already used across the app's badges/leaderboard copy
 * (Green Beginner -> Eco Warrior -> Climate Hero -> Planet Protector)
 * so the new XP system reads as an extension of the existing product,
 * not a parallel one.
 */
export interface XpLevel {
  level: number;
  name: string;
  minXp: number;
}

interface GamificationApiResponse {
  totalXp: number;
  badges: Badge[];
}

export const XP_LEVELS: XpLevel[] = [
  { level: 1, name: 'Green Beginner', minXp: 0 },
  { level: 2, name: 'Eco Warrior', minXp: 250 },
  { level: 3, name: 'Climate Hero', minXp: 600 },
  { level: 4, name: 'Planet Protector', minXp: 1000 },
];

/**
 * Stands in for calls the Angular API Gateway layer would make to the
 * Spring Boot microservices.
 */
@Injectable({ providedIn: 'root' })
export class MockDataService {

  private readonly apiUrl =
    'https://team4-powered-carbon-footprint-sustainability-ma-production.up.railway.app/api';

  constructor(private http: HttpClient) {}

  readonly currentEcoScore = signal<number>(742);

  private readonly user = signal<UserProfile>({
    id: 'u-1024',
    name: 'Asha Mehta',
    email: 'asha.mehta@ecotrack.io',
    role: 'User',
    location: 'Pune, India',
    ecoScore: 742,
    level: 'Eco Warrior',
    joinedOn: '2025-02-11',
    interests: [
      'Renewable Energy',
      'Green Transportation',
      'Waste Reduction',
      'Water Conservation'
    ],
    avatarInitials: 'AM',
  });

  private readonly carbonEntries = signal<CarbonEntry[]>([
    {
      id: 'c1',
      date: '2026-07-26',
      category: 'Transportation',
      activity: 'Car commute — 18 km',
      kgCo2e: 3.8
    },
    {
      id: 'c2',
      date: '2026-07-26',
      category: 'Electricity Usage',
      activity: 'Home usage — 6.2 kWh',
      kgCo2e: 2.9
    },
    {
      id: 'c3',
      date: '2026-07-27',
      category: 'Food Consumption',
      activity: 'Mixed diet — 3 meals',
      kgCo2e: 4.1
    },
    {
      id: 'c4',
      date: '2026-07-28',
      category: 'Waste Generation',
      activity: 'Household waste — 1.2 kg',
      kgCo2e: 0.6
    },
    {
      id: 'c5',
      date: '2026-07-29',
      category: 'Travel Activities',
      activity: 'Domestic flight (short haul)',
      kgCo2e: 92.0
    },
    {
      id: 'c6',
      date: '2026-07-30',
      category: 'Water Usage',
      activity: 'Household — 180 L',
      kgCo2e: 0.3
    },
    {
      id: 'c7',
      date: '2026-07-31',
      category: 'Online Shopping',
      activity: '2 parcels delivered',
      kgCo2e: 1.4
    },
    {
      id: 'c8',
      date: '2026-08-01',
      category: 'Transportation',
      activity: 'Bus commute — 12 km',
      kgCo2e: 0.9
    },
  ]);

  private readonly goals = signal<SustainabilityGoal[]>([
    {
      id: 'g1',
      title: 'Cut household electricity 15%',
      type: 'Reduce Electricity Consumption',
      target: 15,
      current: 9,
      unit: '%',
      deadline: '2026-09-30',
      status: 'On Track'
    },
    {
      id: 'g2',
      title: 'Commute by public transport 4x/week',
      type: 'Use Public Transport',
      target: 4,
      current: 2,
      unit: 'trips/wk',
      deadline: '2026-08-31',
      status: 'At Risk'
    },
    {
      id: 'g3',
      title: 'Zero single-use plastic',
      type: 'Reduce Plastic Usage',
      target: 30,
      current: 30,
      unit: 'days',
      deadline: '2026-07-31',
      status: 'Achieved'
    },
    {
      id: 'g4',
      title: 'Plant 10 trees this year',
      type: 'Plant Trees',
      target: 10,
      current: 3,
      unit: 'trees',
      deadline: '2026-12-31',
      status: 'On Track'
    },
    {
      id: 'g5',
      title: 'Recycle 80% of household waste',
      type: 'Increase Recycling',
      target: 80,
      current: 41,
      unit: '%',
      deadline: '2026-10-15',
      status: 'At Risk'
    },
  ]);

  private readonly challenges = signal<Challenge[]>([]);
  readonly leaderboard = signal<LeaderboardEntry[]>([]);

  // ==========================================================
  // GAMIFICATION: XP, levels, task completion, badge unlocks
  // ==========================================================

  readonly totalXp = signal<number>(0);

  private readonly completedChallengeIds =
    signal<Set<string>>(new Set());

  private readonly awardedGoalIds =
    signal<Set<string>>(new Set());

  readonly xpLevels = XP_LEVELS;

  readonly currentLevel = computed(() =>
    this.xpLevelFor(this.totalXp())
  );

  readonly nextLevel = computed(() => {
    const idx = XP_LEVELS.findIndex(
      (l) => l.name === this.currentLevel().name
    );

    return idx >= 0 && idx < XP_LEVELS.length - 1
      ? XP_LEVELS[idx + 1]
      : null;
  });

  readonly levelProgressPct = computed(() => {
    const current = this.currentLevel();
    const next = this.nextLevel();

    if (!next) return 100;

    const span = next.minXp - current.minXp;
    const progressed = this.totalXp() - current.minXp;

    return Math.min(
      100,
      Math.max(
        0,
        Math.round((progressed / span) * 100)
      )
    );
  });

  private xpLevelFor(xp: number): XpLevel {
    return (
      [...XP_LEVELS]
        .reverse()
        .find((l) => xp >= l.minXp) ??
      XP_LEVELS[0]
    );
  }

  private unlockBadge(id: string) {
    this.badges.update((list) =>
      list.map((b) =>
        b.id === id
          ? { ...b, earned: true }
          : b
      )
    );
  }

  /**
   * Re-checks the XP-threshold badges.
   */
  private syncLevelBadges() {
    const xp = this.totalXp();

    if (xp >= 250) this.unlockBadge('b2');
    if (xp >= 600) this.unlockBadge('b4');
    if (xp >= 1000) this.unlockBadge('b5');
  }

  isChallengeCompleted(id: string): boolean {
    return this.challenges().some(
      challenge =>
        challenge.id === id &&
        challenge.progress >= 100
    );
  }

  /**
   * Marks a challenge/task complete,
   * awards its XP, and unlocks any tied badge.
   */
  completeChallenge(id: string) {
    const headers = this.authHeaders();

    if (!headers) return;

    const challenge = this.challenges().find(
      c => c.id === id
    );

    if (!challenge) return;

    const currentProgress =
      Number(challenge.progress) || 0;

    if (currentProgress >= 100) {
      return;
    }

    const newProgress =
      Math.min(currentProgress + 25, 100);

    this.http.put(
      `${this.apiUrl}/challenges/${id}/progress`,
      null,
      {
        headers,
        params: {
          progress: newProgress
        }
      }
    ).subscribe({
      next: () => this.loadCommunityData(),
      error: (err) => {
        console.error(
          'Failed to update challenge progress:',
          err
        );
      }
    });
  }

  updateChallengeProgress(id: string) {
    const headers = this.authHeaders();

    if (!headers) return;

    const challenge = this.challenges().find(
      c => c.id === id
    );

    if (!challenge) return;

    const currentProgress =
      Number(challenge.progress) || 0;

    if (currentProgress >= 100) return;

    const newProgress =
      Math.min(currentProgress + 25, 100);

    this.http.put(
      `${this.apiUrl}/challenges/${id}/progress`,
      null,
      {
        headers,
        params: {
          progress: newProgress
        }
      }
    ).subscribe({
      next: () => this.loadCommunityData(),
      error: (err) => {
        console.error(
          'Failed to update progress:',
          err
        );
      }
    });
  }

  /**
   * Total XP required to fully complete a goal/task,
   * derived from its target size.
   */
  goalXpTotal(goal: { targetKg: number }): number {
    const target =
      Number(goal.targetKg) || 0;

    return Math.min(
      500,
      Math.max(
        80,
        Math.round((target * 8) / 10) * 10
      )
    );
  }

  /**
   * XP accumulated so far toward a goal/task,
   * proportional to its progress.
   */
  goalXpEarned(
    goal: {
      targetKg: number;
      currentKg: number
    }
  ): number {

    const target =
      Number(goal.targetKg) || 0;

    const current =
      Number(goal.currentKg) || 0;

    if (target <= 0) return 0;

    const pct =
      Math.min(
        1,
        Math.max(0, current / target)
      );

    return Math.round(
      pct * this.goalXpTotal(goal)
    );
  }

  /**
   * Awards XP + the Goal Getter badge
   * the first time a goal reaches Achieved.
   */
  recordGoalCompletion(
    goal: {
      id?: number | string;
      targetKg: number;
      currentKg: number;
      status: string
    }
  ) {

    if (
      goal.id == null ||
      goal.status !== 'Achieved'
    ) {
      return;
    }

    const key = String(goal.id);

    if (this.awardedGoalIds().has(key)) {
      return;
    }

    this.awardedGoalIds.update(
      (set) => new Set(set).add(key)
    );

    this.totalXp.update(
      (xp) => xp + this.goalXpTotal(goal)
    );

    this.unlockBadge('b6');
    this.syncLevelBadges();
  }

  private readonly reports = signal<Report[]>([
    {
      id: 'r1',
      title: 'July Carbon Footprint Summary',
      type: 'Carbon Footprint',
      period: 'Jul 2026',
      generatedOn: '2026-08-01',
      format: 'PDF'
    },
    {
      id: 'r2',
      title: 'Q2 Goal Achievement Report',
      type: 'Goal Achievement',
      period: 'Apr – Jun 2026',
      generatedOn: '2026-07-02',
      format: 'Excel'
    },
    {
      id: 'r3',
      title: 'Weekly Sustainability Digest',
      type: 'Sustainability',
      period: 'Wk 31, 2026',
      generatedOn: '2026-07-28',
      format: 'PDF'
    },
    {
      id: 'r4',
      title: 'Challenge Participation Log',
      type: 'Challenge Participation',
      period: 'Jan – Jul 2026',
      generatedOn: '2026-07-15',
      format: 'Excel'
    },
  ]);

  private readonly recommendations =
    signal<Recommendation[]>([
      {
        id: 'rec1',
        title: 'Switch two weekly car trips to bus',
        detail:
          'Based on your transportation pattern, swapping two commutes per week could meaningfully cut emissions.',
        impactKg: 7.2,
        factor: 'Transportation Patterns'
      },
      {
        id: 'rec2',
        title: 'Shift laundry to off-peak hours',
        detail:
          'Your electricity usage spikes align with peak grid carbon intensity; shifting load can lower embedded emissions.',
        impactKg: 2.1,
        factor: 'Energy Usage'
      },
      {
        id: 'rec3',
        title: 'Add one plant-based day per week',
        detail:
          'Your food log shows a mixed diet most days; one plant-based day would meaningfully reduce weekly output.',
        impactKg: 4.6,
        factor: 'Lifestyle Habits'
      },
      {
        id: 'rec4',
        title: 'Bundle online orders',
        detail:
          'You have 2 separate deliveries this week — combining orders would reduce packaging and transport emissions.',
        impactKg: 0.8,
        factor: 'Waste Management'
      },
    ]);

  private readonly badges = signal<Badge[]>([
    {
      id: 'b1',
      name: 'Green Beginner',
      earned: false,
      description:
        'Complete your first community challenge.'
    },
    {
      id: 'b2',
      name: 'Eco Warrior',
      earned: false,
      description: 'Reach 250 XP.'
    },
    {
      id: 'b3',
      name: 'Sustainability Champion',
      earned: false,
      description:
        'Complete 5 community challenges.'
    },
    {
      id: 'b4',
      name: 'Climate Hero',
      earned: false,
      description: 'Reach 600 XP.'
    },
    {
      id: 'b5',
      name: 'Planet Protector',
      earned: false,
      description: 'Reach 1000 XP.'
    },
    {
      id: 'b6',
      name: 'Goal Getter',
      earned: false,
      description:
        'Achieve your first sustainability goal.'
    },
  ]);

  loadCommunityData() {

    const headers = this.authHeaders();

    if (!headers) return;

    this.http.get<Challenge[]>(
      `${this.apiUrl}/challenges`,
      { headers }
    ).subscribe(
      challenges => {
        this.challenges.set(
          challenges.map(challenge => ({
            ...challenge,
            id: String(challenge.id)
          }))
        );
      }
    );

    this.http.get<GamificationApiResponse>(
      `${this.apiUrl}/gamification/me`,
      { headers }
    ).subscribe(
      progress => {
        this.totalXp.set(progress.totalXp);
        this.badges.set(progress.badges);
      }
    );

    this.http.get<LeaderboardEntry[]>(
      `${this.apiUrl}/gamification/leaderboard`,
      { headers }
    ).subscribe(
      rows => this.leaderboard.set(rows)
    );
  }

  getUser() {
    return this.user.asReadonly();
  }

  getCarbonEntries() {
    return this.carbonEntries.asReadonly();
  }

  getGoals() {
    return this.goals.asReadonly();
  }

  getChallenges() {
    return this.challenges.asReadonly();
  }

  getLeaderboard() {
    return this.leaderboard;
  }

  getReports() {
    return this.reports.asReadonly();
  }

  getRecommendations() {
    return this.recommendations.asReadonly();
  }

  getBadges() {
    return this.badges.asReadonly();
  }

  private authHeaders(): HttpHeaders | null {

    const token =
      localStorage.getItem('token');

    return token
      ? new HttpHeaders({
          Authorization: `Bearer ${token}`
        })
      : null;
  }

  addCarbonEntry(entry: CarbonEntry) {
    this.carbonEntries.update(
      (list) => [entry, ...list]
    );
  }

  toggleChallenge(id: string) {

    const headers = this.authHeaders();

    const challenge =
      this.challenges().find(
        item => item.id === id
      );

    if (!headers || !challenge) return;

    const request = challenge.joined
      ? this.http.delete(
          `${this.apiUrl}/challenges/${id}/leave`,
          { headers }
        )
      : this.http.post(
          `${this.apiUrl}/challenges/${id}/join`,
          {},
          { headers }
        );

    request.subscribe(
      () => this.loadCommunityData()
    );
  }

  updateGoalProgress(
    id: string,
    current: number
  ) {
    this.goals.update(
      (list) =>
        list.map((g) =>
          g.id === id
            ? { ...g, current }
            : g
        )
    );
  }
}