import { Component, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { MockDataService } from '../../services/mock-data.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'eco-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {

  private fb = inject(FormBuilder);
  private data = inject(MockDataService);
  private auth = inject(AuthService);
  private http = inject(HttpClient);

  // Existing mock data
  readonly user = this.data.getUser();
  readonly currentEcoScore = this.data.currentEcoScore;

  memberSince = '';
  readonly badges = this.data.getBadges();

  // Authentication
  readonly isLoggedIn = this.auth.isLoggedIn;
  readonly loggedInName = this.auth.userName;

  // Display name
  readonly displayName = computed(() =>
    this.loggedInName() ?? this.user().name
  );

  // Avatar
  readonly avatarInitials = computed(() =>
    this.isLoggedIn()
      ? this.auth.initials(this.loggedInName())
      : this.user().avatarInitials
  );

  // Profile form
  readonly form = this.fb.group({
    name: [this.displayName()],
    email: [this.user().email],
    location: [this.user().location],
  });

  ngOnInit(): void {
    this.loadProfile();
    this.data.loadCommunityData();
  }

  // ==========================================
  // LOAD PROFILE FROM BACKEND
  // ==========================================
  loadProfile(): void {

    const token = localStorage.getItem('token');
    const email = localStorage.getItem('email');

    if (!token || !email) {
      console.log('User is not logged in.');
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    this.http.get<any>(
      `https://team4-powered-carbon-footprint-sustainability-ma-production.up.railway.app/profile/${encodeURIComponent(email)}`,
      { headers }
    ).subscribe({

      next: (profile) => {

        console.log('Profile loaded from backend:', profile);

        const createdAt = profile?.user?.createdAt;

        if (createdAt) {
          this.memberSince = new Date(createdAt)
            .toISOString()
            .split('T')[0];
        }

        const fullName =
          profile?.user?.fullName ||
          this.displayName();

        let location = '';

        if (profile?.city && profile?.country) {
          location = `${profile.city}, ${profile.country}`;
        } else if (profile?.city) {
          location = profile.city;
        } else if (profile?.country) {
          location = profile.country;
        }

        this.form.patchValue({
          name: fullName,
          email: profile?.user?.email || email,
          location: location
        });

      },

      error: (error) => {

        console.error('Failed to load profile:', error);

        if (error.status === 403) {
          console.error(
            '403 Forbidden - JWT token was not accepted by backend.'
          );
        }

      }

    });
  }

  // ==========================================
  // SAVE PROFILE TO BACKEND
  // ==========================================
  save(): void {

    const token = localStorage.getItem('token');
    const email = localStorage.getItem('email');

    if (!token || !email) {
      alert('Please login again.');
      return;
    }

    const fullName = this.form.value.name?.trim() || '';
    const location = this.form.value.location?.trim() || '';

    if (!fullName) {
      alert('Please enter your full name.');
      return;
    }

    if (!location) {
      alert('Please enter your location.');
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    const url =
      `https://team4-powered-carbon-footprint-sustainability-ma-production.up.railway.app/profile/${encodeURIComponent(email)}` +
      `?fullName=${encodeURIComponent(fullName)}` +
      `&location=${encodeURIComponent(location)}`;

    console.log('Updating profile:', {
      email,
      fullName,
      location
    });

    this.http.put<any>(
      url,
      {},
      { headers }
    ).subscribe({

      next: (response) => {

        console.log('Profile updated successfully:', response);

        // Update form using backend response
        const updatedLocation =
          response?.city && response?.country
            ? `${response.city}, ${response.country}`
            : response?.city || location;

        this.form.patchValue({
          name: response?.user?.fullName || fullName,
          email: response?.user?.email || email,
          location: updatedLocation
        });

        alert('Profile changes saved successfully!');

      },

      error: (error) => {

        console.error('Profile update failed:', error);

        if (error.status === 403) {
          alert(
            'Access denied. Please logout and login again.'
          );
        } else if (error.status === 404) {
          alert(
            'User profile not found.'
          );
        } else if (error.status === 400) {
          alert(
            'Invalid profile details.'
          );
        } else {
          alert(
            'Failed to save profile changes.'
          );
        }

      }

    });
  }

  // ==========================================
  // LOGOUT
  // ==========================================
  logout(): void {
    this.auth.logout();
  }
}