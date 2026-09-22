import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { MockDataService } from '../../services/mock-data.service';
import { AuthService } from '../../services/auth.service';
import {
  NotificationService,
  EcoNotification
} from '../../services/notification.service';

interface NavLink {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'eco-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.css',
})
export class NavComponent {

  private data = inject(MockDataService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  readonly links: NavLink[] = [
    { path: '/dashboard', label: 'Dashboard', icon: 'grid' },
    { path: '/carbon-tracker', label: 'Carbon Tracker', icon: 'leaf' },
    { path: '/goals', label: 'Goals', icon: 'target' },
    { path: '/challenges', label: 'Challenges', icon: 'trophy' },
    { path: '/reports', label: 'Reports', icon: 'doc' },
    { path: '/profile', label: 'Profile', icon: 'user' },
  ];

  // =========================================================
  // MENU STATE
  // =========================================================

  readonly menuOpen = signal(false);


  // =========================================================
  // NOTIFICATION STATE
  // =========================================================

  readonly notificationOpen = signal(false);

  readonly notifications =
    this.notificationService.notifications;

  readonly unreadCount =
    this.notificationService.unreadCount;


  // =========================================================
  // USER / ECO SCORE
  // =========================================================

  readonly user = this.data.getUser();

  readonly currentEcoScore =
    this.data.currentEcoScore;

  readonly isLoggedIn =
    this.auth.isLoggedIn;

  readonly loggedInName =
    this.auth.userName;


  // =========================================================
  // MENU METHODS
  // =========================================================

  toggleMenu() {

    this.menuOpen.update((v) => !v);

  }


  closeMenu() {

    this.menuOpen.set(false);

  }


  // =========================================================
  // NOTIFICATION METHODS
  // =========================================================

  toggleNotifications() {

    this.notificationOpen.update((v) => !v);

  }


  closeNotifications() {

    this.notificationOpen.set(false);

  }


  markAsRead(notification: EcoNotification) {

    this.notificationService.markAsRead(
      notification.id
    );

    this.closeNotifications();

    if (notification.route) {

      this.router.navigate([
        notification.route
      ]);

    }

  }


  markAllAsRead() {

    this.notificationService.markAllAsRead();

  }


  // =========================================================
  // USER METHODS
  // =========================================================

  initials(name: string | null): string {

    return this.auth.initials(name);

  }


  logout() {

    this.auth.logout();

    this.closeMenu();

    this.closeNotifications();

  }

}