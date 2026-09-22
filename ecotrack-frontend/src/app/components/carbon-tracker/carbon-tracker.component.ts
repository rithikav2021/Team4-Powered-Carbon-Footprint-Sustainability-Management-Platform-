import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { MockDataService } from '../../services/mock-data.service';
import { CarbonService } from '../../services/carbon.service';
import { CarbonEngineService } from '../../services/carbon-engine.service';
import { NotificationService } from '../../services/notification.service';
import { CarbonEntry } from '../../models/data.model';

import {
  FilterGroup,
  SearchFilterBarComponent
} from '../shared/search-filter-bar/search-filter-bar.component';

const CATEGORIES: CarbonEntry['category'][] = [
  'Transportation',
  'Electricity Usage',
  'Fuel Consumption',
  'Food Consumption',
  'Waste Generation',
  'Water Usage',
  'Online Shopping',
  'Travel Activities',
];

const EMISSION_FACTORS: Record<string, number> = {
  Transportation: 0.21,
  'Electricity Usage': 0.45,
  'Fuel Consumption': 2.3,
  'Food Consumption': 1.4,
  'Waste Generation': 0.5,
  'Water Usage': 0.0017,
  'Online Shopping': 0.7,
  'Travel Activities': 5.1,
};

@Component({
  selector: 'eco-carbon-tracker',
  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    SearchFilterBarComponent
  ],

  templateUrl: './carbon-tracker.component.html',
  styleUrl: './carbon-tracker.component.css',
})
export class CarbonTrackerComponent implements OnInit {

  private fb = inject(FormBuilder);
  private data = inject(MockDataService);
  private carbonService = inject(CarbonService);
  private carbonEngineService = inject(CarbonEngineService);

  // =========================================================
  // NOTIFICATION SERVICE
  // =========================================================

  private notificationService =
    inject(NotificationService);

  // =========================================================
  // DATABASE ACTIVITIES
  // =========================================================

  activityList = signal<any[]>([]);

  carbonEngineEstimate: number | null = null;

  // =========================================================
  // SEARCH + FILTER
  // =========================================================

  readonly searchValue = signal('');

  readonly activeFilters = signal<Record<string, string>>({
    category: 'All'
  });

  readonly filterGroups: FilterGroup[] = [
    {
      key: 'category',
      label: 'Category',
      options: [
        { label: 'All', value: 'All' },
        ...CATEGORIES.map(category => ({
          label: category,
          value: category
        }))
      ]
    }
  ];

  // =========================================================
  // FILTER DATABASE ACTIVITIES
  // =========================================================

  readonly filteredActivityList = computed(() => {

    const activities = this.activityList();

    const search = this.searchValue()
      .trim()
      .toLowerCase();

    const category =
      this.activeFilters()['category'] || 'All';

    return activities.filter(activity => {

      const matchesCategory =
        category === 'All' ||
        activity.category === category;

      const matchesSearch =
        !search ||
        String(activity.category || '')
          .toLowerCase()
          .includes(search) ||

        String(activity.description || '')
          .toLowerCase()
          .includes(search) ||

        String(activity.activityDate || '')
          .toLowerCase()
          .includes(search);

      return matchesCategory && matchesSearch;
    });
  });

  // =========================================================
  // MOCK DATA
  // =========================================================

  readonly categories = CATEGORIES;

  readonly entries = this.data.getCarbonEntries();

  readonly filter = signal('All');

  readonly filteredEntries = computed(() => {

    const f = this.filter();

    const list = this.entries();

    return f === 'All'
      ? list
      : list.filter((e) => e.category === f);
  });

  readonly totalKg = computed(() =>
    this.entries().reduce(
      (sum, e) => sum + e.kgCo2e,
      0
    )
  );

  // =========================================================
  // CALCULATE CARBON
  // =========================================================

  estimatedKg(): number {

    const category = String(
      this.form.value.category || ''
    );

    const activity = String(
      this.form.value.activity || ''
    )
      .trim()
      .toLowerCase();

    const qty = Number(
      this.form.value.quantity
    ) || 0;

    if (qty <= 0) {
      return 0;
    }

    let factor = 0;

    // =======================================================
    // TRANSPORTATION
    // =======================================================

    if (category === 'Transportation') {

      switch (activity) {

        case 'car':
          factor = 0.21;
          break;

        case 'bike':
        case 'bicycle':
          factor = 0.10;
          break;

        case 'bus':
          factor = 0.089;
          break;

        case 'train':
        case 'metro':
          factor = 0.041;
          break;

        case 'truck':
          factor = 0.30;
          break;

        default:
          factor = 0;
      }
    }

    // =======================================================
    // ELECTRICITY USAGE
    // =======================================================

    else if (category === 'Electricity Usage') {

      switch (activity) {

        case 'tv':
        case 'ac':
        case 'refrigerator':
        case 'washing machine':
        case 'electricity':
          factor = 0.82;
          break;

        default:
          factor = 0.82;
      }
    }

    // =======================================================
    // FUEL CONSUMPTION
    // =======================================================

    else if (category === 'Fuel Consumption') {

      switch (activity) {

        case 'petrol':
          factor = 2.31;
          break;

        case 'diesel':
          factor = 2.68;
          break;

        default:
          factor = 0;
      }
    }

    // =======================================================
    // FOOD CONSUMPTION
    // =======================================================

    else if (category === 'Food Consumption') {

      switch (activity) {

        case 'veg':
        case 'vegetarian':
          factor = 0.50;
          break;

        case 'non veg':
        case 'non-veg':
        case 'non vegetarian':
          factor = 2.50;
          break;

        case 'vegan':
          factor = 0.30;
          break;

        default:
          factor = 1.50;
      }
    }

    // =======================================================
    // WASTE GENERATION
    // =======================================================

    else if (category === 'Waste Generation') {

      switch (activity) {

        case 'plastic':
          factor = 2.50;
          break;

        case 'paper':
          factor = 1.00;
          break;

        case 'organic waste':
          factor = 0.50;
          break;

        case 'general waste':
          factor = 1.20;
          break;

        default:
          factor = 1.00;
      }
    }

    // =======================================================
    // WATER USAGE
    // =======================================================

    else if (category === 'Water Usage') {

      factor = 0.0003;
    }

    // =======================================================
    // ONLINE SHOPPING
    // =======================================================

    else if (category === 'Online Shopping') {

      switch (activity) {

        case 'clothes':
          factor = 20.0;
          break;

        case 'electronics':
          factor = 50.0;
          break;

        case 'groceries':
          factor = 1.5;
          break;

        default:
          factor = 1.5;
      }
    }

    // =======================================================
    // TRAVEL ACTIVITIES
    // =======================================================

    else if (category === 'Travel Activities') {

      switch (activity) {

        case 'flight':
        case 'plane':
          factor = 0.255;
          break;

        case 'taxi':
          factor = 0.21;
          break;

        default:
          factor = 0.21;
      }
    }

    return Math.round(
      qty * factor * 100
    ) / 100;
  }

  // =========================================================
  // FORM
  // =========================================================

  readonly form = this.fb.group({

    category: [
      'Transportation',
      Validators.required
    ],

    activity: [
      '',
      Validators.required
    ],

    quantity: [
      1,
      [
        Validators.required,
        Validators.min(0.1)
      ]
    ],

    unit: [
      'km'
    ],

    date: [
      new Date().toISOString().slice(0, 10),
      Validators.required
    ],

  });

  // =========================================================
  // FILTER
  // =========================================================

  setFilter(cat: string): void {

    this.filter.set(cat);

    this.activeFilters.update(filters => ({
      ...filters,
      category: cat
    }));
  }

  // =========================================================
  // SEARCH FILTER BAR
  // =========================================================

  onSearchChange(value: string): void {

    this.searchValue.set(value);
  }

  onFilterChange(
    event: { key: string; value: string }
  ): void {

    this.activeFilters.update(filters => ({
      ...filters,
      [event.key]: event.value
    }));

    if (event.key === 'category') {

      this.filter.set(event.value);
    }
  }

  clearFilters(): void {

    this.searchValue.set('');

    this.activeFilters.set({
      category: 'All'
    });

    this.filter.set('All');
  }

  // =========================================================
  // CARBON ENGINE ESTIMATE
  // =========================================================

  calculateEngineEstimate(): void {

    const activity =
      this.form.value.activity?.trim();

    const quantity =
      Number(this.form.value.quantity);

    const unit =
      this.form.value.unit;

    if (
      !activity ||
      !quantity ||
      quantity <= 0
    ) {

      this.carbonEngineEstimate = null;
      return;
    }

    const activityLower =
      activity.toLowerCase();

    let activityType = '';

    if (
      activityLower.includes('car') ||
      activityLower.includes('auto')
    ) {

      activityType = 'car';
    }

    else if (
      activityLower.includes('bike') ||
      activityLower.includes('bicycle')
    ) {

      activityType = 'bike';
    }

    else if (
      activityLower.includes('bus')
    ) {

      activityType = 'bus';
    }

    else if (
      activityLower.includes('train') ||
      activityLower.includes('metro')
    ) {

      activityType = 'train';
    }

    else if (
      activityLower.includes('electricity') ||
      activityLower.includes('electric')
    ) {

      activityType = 'electricity';
    }

    else if (
      activityLower.includes('flight') ||
      activityLower.includes('plane')
    ) {

      activityType = 'flight';
    }

    if (!activityType) {

      this.carbonEngineEstimate = null;
      return;
    }

    const request = {

      activityType: activityType,

      amount: quantity,

      unit: unit || '',

      email: localStorage.getItem('email')
    };

    this.carbonEngineService
      .calculateCarbon(request)
      .subscribe({

        next: (result: any) => {

          this.carbonEngineEstimate =
            result.carbonKg;

          console.log(
            'Carbon Engine Estimate:',
            result
          );
        },

        error: (error: any) => {

          console.error(
            'Carbon Engine Estimate Failed:',
            error
          );

          this.carbonEngineEstimate = null;
        }

      });
  }

  // =========================================================
  // DELETE ACTIVITY
  // =========================================================

  deleteActivity(id: number): void {

    const email =
      localStorage.getItem('email');

    if (!email) {

      alert(
        'User email not found. Please login again.'
      );

      return;
    }

    const confirmed = confirm(
      'Are you sure you want to delete this activity?'
    );

    if (!confirmed) {
      return;
    }

    console.log(
      'Deleting activity:',
      id,
      'Email:',
      email
    );

    this.carbonService
      .deleteActivity(id, email)
      .subscribe({

        next: () => {

          console.log(
            'Activity deleted successfully'
          );

          this.activityList.update(
            activities =>
              activities.filter(
                activity =>
                  activity.id !== id
              )
          );

          alert(
            'Activity deleted successfully'
          );

          this.loadActivities();
        },

        error: (error: any) => {

          console.error(
            'Delete Activity Failed:',
            error
          );

          console.error(
            'Status:',
            error.status
          );

          console.error(
            'Backend Error:',
            error.error
          );

          alert(
            'Delete failed.\nStatus: ' +
            error.status +
            '\n' +
            (
              error.error ||
              'Unable to delete activity'
            )
          );
        }

      });
  }

  // =========================================================
  // SUBMIT / SAVE ACTIVITY
  // =========================================================

  submit(): void {

    if (this.form.invalid) {

      this.form.markAllAsTouched();

      return;
    }

    const v = this.form.value;

    // =======================================================
    // LOCAL MOCK ENTRY
    // =======================================================

    const entry: CarbonEntry = {

      id:
        'c' +
        Math.random()
          .toString(36)
          .slice(2, 8),

      date: v.date!,

      category:
        v.category as CarbonEntry['category'],

      activity:
        `${v.activity} — ${v.quantity} ${v.unit}`,

      kgCo2e:
        this.estimatedKg(),

    };

    this.data.addCarbonEntry(entry);

    // =======================================================
    // DATABASE ACTIVITY
    // =======================================================

    const activity = {

      category: v.category,

      description: v.activity,

      quantity:
        Number(v.quantity),

      unit: v.unit,

      carbonEmission:
        this.estimatedKg(),

      activityDate: v.date,

      email:
        localStorage.getItem('email')

    };

    this.carbonService
      .saveActivity(activity)
      .subscribe({

        next: (response: any) => {

          console.log(
            'Activity Saved Successfully',
            response
          );

          // =================================================
          // NOTIFICATION
          // =================================================

          this.notificationService.addNotification(
            'Activity Added',
            `${v.activity} was successfully added to your carbon tracker.`,
            '🌱',
            '/carbon-tracker'
          );

          // Reload activities from database
          this.loadActivities();

          this.form.patchValue({

            activity: '',

            quantity: 1

          });

          this.carbonEngineEstimate = null;

          alert(
            'Activity Saved Successfully'
          );
        },

        error: (error: any) => {

          console.error(
            'Database Save Failed',
            error
          );

          alert(
            'Failed to Save Activity'
          );
        }

      });
  }

  // =========================================================
  // LOAD ACTIVITIES FROM DATABASE
  // =========================================================

  loadActivities(): void {

    const email =
      localStorage.getItem('email');

    if (!email) {
      return;
    }

    this.carbonService
      .getActivities(email)
      .subscribe({

        next: (data: any[]) => {

          this.activityList.set(data);

          console.log(
            'Activities from DB:',
            data
          );
        },

        error: (error: any) => {

          console.error(
            'Failed to load activities:',
            error
          );
        }

      });
  }

  // =========================================================
  // ON INIT
  // =========================================================

  ngOnInit(): void {

    this.loadActivities();

  }

}