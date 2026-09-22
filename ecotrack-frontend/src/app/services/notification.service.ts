import { Injectable, signal } from '@angular/core';

export interface EcoNotification {
  id: number;
  title: string;
  message: string;
  icon: string;
  read: boolean;
  time: string;
  route?: string;
  goalId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  readonly notifications =
    signal<EcoNotification[]>([]);

  readonly unreadCount =
    signal(0);

  constructor() {
    this.loadNotifications();
  }

  // =========================================================
  // STORAGE KEY
  // =========================================================

  private getStorageKey(): string {

    const email =
      localStorage.getItem('email');

    return `ecotrack_notifications_${email || 'guest'}`;
  }

  // =========================================================
  // LOAD NOTIFICATIONS
  // =========================================================

  private loadNotifications() {

    const storageKey =
      this.getStorageKey();

    const saved =
      localStorage.getItem(storageKey);

    if (saved) {

      try {

        const parsed: EcoNotification[] =
          JSON.parse(saved);

        this.notifications.set(parsed);

        this.updateUnreadCount();

        return;

      } catch {

        console.log(
          'Could not load notifications.'
        );
      }
    }

    // No default notifications
    this.notifications.set([]);

    this.saveNotifications();

    this.updateUnreadCount();
  }

  // =========================================================
  // SAVE NOTIFICATIONS
  // =========================================================

  private saveNotifications() {

    localStorage.setItem(
      this.getStorageKey(),
      JSON.stringify(
        this.notifications()
      )
    );
  }

  // =========================================================
  // UPDATE UNREAD COUNT
  // =========================================================

  private updateUnreadCount() {

    const count =
      this.notifications()
        .filter(
          notification =>
            !notification.read
        )
        .length;

    this.unreadCount.set(count);
  }

  // =========================================================
  // ADD NEW NOTIFICATION
  // =========================================================

  addNotification(
    title: string,
    message: string,
    icon: string = '🔔',
    route?: string,
    goalId?: number
  ) {

    const newNotification:
      EcoNotification = {

        id: Date.now(),

        title,

        message,

        icon,

        read: false,

        time: 'Just now',

        route,

        goalId
      };

    this.notifications.update(
      current => [
        newNotification,
        ...current
      ]
    );

    this.saveNotifications();

    this.updateUnreadCount();

    this.playNotificationSound();
  }

  // =========================================================
  // DELETE ALL NOTIFICATIONS FOR A GOAL
  // =========================================================

 deleteGoalNotifications(
  goalId: number,
  goalTitle?: string
) {

  this.notifications.update(items =>
    items.filter(notification => {

      // New notifications with goalId
      if (notification.goalId === goalId) {
        return false;
      }

      // Old notifications created before goalId
      // was added to the notification system
      if (
        !notification.goalId &&
        notification.route === '/goals' &&
        goalTitle &&
        notification.message
          .toLowerCase()
          .includes(goalTitle.toLowerCase())
      ) {
        return false;
      }

      return true;
    })
  );

  this.saveNotifications();

  this.updateUnreadCount();

  // Remove deadline reminder tracking
  [
    '7-days',
    '3-days',
    '1-day',
    'today',
    'overdue'
  ].forEach(type => {

    localStorage.removeItem(
      `goal_deadline_${goalId}_${type}`
    );

  });
}
  // =========================================================
  // MARK ONE NOTIFICATION AS READ
  // =========================================================

  markAsRead(id: number) {

    this.notifications.update(
      items =>
        items.map(item =>
          item.id === id
            ? {
                ...item,
                read: true
              }
            : item
        )
    );

    this.saveNotifications();

    this.updateUnreadCount();
  }

  // =========================================================
  // MARK ALL AS READ
  // =========================================================

  markAllAsRead() {

    this.notifications.update(
      items =>
        items.map(
          notification => ({
            ...notification,
            read: true
          })
        )
    );

    this.saveNotifications();

    this.updateUnreadCount();
  }

  // =========================================================
  // NOTIFICATION SOUND
  // =========================================================

  private playNotificationSound() {

    try {

      const AudioContextClass =
        window.AudioContext ||
        (window as any).webkitAudioContext;

      if (!AudioContextClass) {
        return;
      }

      const audioContext =
        new AudioContextClass();

      const oscillator =
        audioContext.createOscillator();

      const gain =
        audioContext.createGain();

      oscillator.type = 'sine';

      oscillator.frequency.setValueAtTime(
        880,
        audioContext.currentTime
      );

      oscillator.frequency.exponentialRampToValueAtTime(
        660,
        audioContext.currentTime + 0.15
      );

      gain.gain.setValueAtTime(
        0.0001,
        audioContext.currentTime
      );

      gain.gain.exponentialRampToValueAtTime(
        0.12,
        audioContext.currentTime + 0.01
      );

      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        audioContext.currentTime + 0.18
      );

      oscillator.connect(gain);

      gain.connect(
        audioContext.destination
      );

      oscillator.start();

      oscillator.stop(
        audioContext.currentTime + 0.2
      );

      oscillator.onended = () => {
        audioContext.close();
      };

    } catch (error) {

      console.log(
        'Notification sound unavailable.',
        error
      );
    }
  }
}