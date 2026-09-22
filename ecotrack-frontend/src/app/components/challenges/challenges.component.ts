import {
  Component,
  computed,
  inject,
  signal,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { MockDataService } from '../../services/mock-data.service';

import { NotificationService } from '../../services/notification.service';


@Component({

  selector: 'eco-challenges',

  standalone: true,

  imports: [CommonModule],

  templateUrl: './challenges.component.html',

  styleUrl: './challenges.component.css',

})


export class ChallengesComponent implements OnInit {

  private data =
    inject(MockDataService);

  private notificationService =
    inject(NotificationService);


  readonly challenges =
    this.data.getChallenges();

  readonly leaderboard =
    this.data.getLeaderboard();

  readonly badges =
    this.data.getBadges();


  readonly search =
    signal('');


  // =========================================================
  // GAMIFICATION
  // =========================================================

  readonly totalXp =
    this.data.totalXp;

  readonly currentLevel =
    this.data.currentLevel;

  readonly nextLevel =
    this.data.nextLevel;

  readonly levelProgressPct =
    this.data.levelProgressPct;

  readonly xpLevels =
    this.data.xpLevels;


  // =========================================================
  // LOAD DATA
  // =========================================================

  ngOnInit() {

    this.data.loadCommunityData();

  }


  // =========================================================
  // SEARCH
  // =========================================================

  readonly filtered =
    computed(() => {

      const q =
        this.search()
          .toLowerCase()
          .trim();

      if (!q) {

        return this.challenges();

      }

      return this.challenges()
        .filter(
          (c) =>
            c.name
              .toLowerCase()
              .includes(q) ||

            c.category
              .toLowerCase()
              .includes(q)
        );

    });


  onSearch(value: string) {

    this.search.set(value);

  }


  // =========================================================
  // JOIN / LEAVE CHALLENGE
  // =========================================================

  toggle(id: string) {

    const challenge =
      this.challenges()
        .find(
          c => c.id === id
        );


    if (!challenge) {

      return;

    }


    const wasJoined =
      challenge.joined;


    // Existing backend join/leave logic
    this.data.toggleChallenge(id);


    // -------------------------------------------------------
    // Notify ONLY when joining
    // -------------------------------------------------------

    if (!wasJoined) {

      this.notificationService.addNotification(

        'Challenge Joined',

        `You joined the ${challenge.name} challenge. Good luck! 🌱`,

        '🤝',

        '/challenges'

      );

    }

  }


  // =========================================================
  // CHECK COMPLETION
  // =========================================================

  isCompleted(id: string): boolean {

    return this.data
      .isChallengeCompleted(id);

  }


  // =========================================================
  // BADGE
  // =========================================================

  badgeFor(
    badgeId: string | undefined
  ) {

    if (!badgeId) {

      return undefined;

    }

    return this.badges()
      .find(
        b => b.id === badgeId
      );

  }


  // =========================================================
  // COMPLETE CHALLENGE
  // =========================================================

  complete(id: string) {

    const challenge =
      this.challenges()
        .find(
          c => c.id === id
        );


    if (!challenge) {

      return;

    }


    const currentProgress =
      Number(
        challenge.progress
      ) || 0;


    /*
     * completeChallenge() in MockDataService
     * adds the final 25%.
     */

    const newProgress =
      Math.min(
        currentProgress + 25,
        100
      );


    // Existing backend/API logic
    this.data.completeChallenge(id);


    // -------------------------------------------------------
    // Challenge Completed Notification
    // -------------------------------------------------------

    if (newProgress >= 100) {

      const notificationKey =
        `challenge_completed_notification_${id}`;


      const alreadyNotified =
        localStorage.getItem(
          notificationKey
        );


      if (!alreadyNotified) {

        this.notificationService.addNotification(

          'Challenge Completed',

          `${challenge.name} has been completed successfully! 🎉`,

          '🏆',

          '/challenges'

        );


        // Prevent duplicate completion notification
        localStorage.setItem(
          notificationKey,
          'true'
        );

      }

    }

  }


  // =========================================================
  // UPDATE PROGRESS
  // =========================================================

  updateProgress(id: string) {

    this.data
      .updateChallengeProgress(id);

  }


  // =========================================================
  // USER INITIALS
  // =========================================================

  initials(name: string): string {

    return name

      .split(' ')

      .map(
        n => n[0]
      )

      .join('')

      .slice(0, 2)

      .toUpperCase();

  }


  // =========================================================
  // LEVEL ICON
  // =========================================================

  levelIcon(
    levelName: string
  ): string {

    switch (levelName) {

      case 'Green Beginner':
        return '🌱';

      case 'Eco Warrior':
        return '🌍';

      case 'Climate Hero':
        return '🔥';

      case 'Planet Protector':
        return '🏆';

      default:
        return '⭐';

    }

  }

}