import {
  Component,
  OnInit,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';

import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { CarbonService } from '../../services/carbon.service';
import { GoalService } from '../../services/goal.service';
import { CarbonChartComponent } from '../carbon-chart/carbon-chart.component';
import { EmissionPieChartComponent } from '../emission-pie-chart/emission-pie-chart.component';
import { MockDataService } from '../../services/mock-data.service';
import { RecommendationService } from '../../services/recommendation.service';
import { EcoBotComponent } from '../eco-bot/eco-bot.component';

@Component({
  selector: 'eco-dashboard',
  standalone: true,
  imports: [
  DecimalPipe,
  RouterLink,
  CarbonChartComponent,
  EmissionPieChartComponent,
  EcoBotComponent
],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {

  private carbonService = inject(CarbonService);
  private goalService = inject(GoalService);
  private data = inject(MockDataService);
  private recommendationService = inject(RecommendationService);

  readonly Math = Math;

  username = "";

  // Recommendation
  recommendation = "";

  readonly activityList = signal<any[]>([]);
  readonly goalList = signal<any[]>([]);

  // Total carbon emission
  readonly totalCarbon = computed(() =>
    this.activityList().reduce(
      (sum: number, a: any) => sum + Number(a.carbonEmission),
      0
    )
  );

  // Active goals
  readonly activeGoals = computed(() =>
    this.goalList().filter(
      (g: any) => g.status !== "Achieved"
    ).length
  );

  // Achieved goals
  readonly achievedGoals = computed(() =>
    this.goalList().filter(
      (g: any) => g.status === "Achieved"
    ).length
  );

  // Eco Score
  readonly ecoScore = computed(() => {

    const goals = this.goalList();
    const activities = this.activityList();

    if (goals.length === 0 && activities.length === 0) {
      return 0;
    }

    // Goal completion contribution: maximum 600 points
    const goalScore =
      goals.length > 0
        ? (this.achievedGoals() / goals.length) * 600
        : 0;

    // Activity contribution: maximum 200 points
    const activityScore = Math.min(
      activities.length * 20,
      200
    );

    // Carbon activity contribution: maximum 200 points
    const carbonScore =
      activities.length > 0
        ? Math.max(
            0,
            200 - this.totalCarbon() * 2
          )
        : 0;

    return Math.min(
      Math.round(
        goalScore +
        activityScore +
        carbonScore
      ),
      1000
    );
  });

  // Sync Eco Score
 private syncEcoScore = effect(
  () => {
    this.data.currentEcoScore.set(this.ecoScore());
  },
  { allowSignalWrites: true }
);

  // Sustainability Insight
  readonly sustainabilityInsight = computed(() => {

    const carbon = this.totalCarbon();
    const activities = this.activityList().length;

    if (activities === 0) {
      return {
        icon: '🌱',
        title: 'Start your green journey',
        message:
          'Log your first activity to start tracking your carbon footprint.'
      };
    }

    if (carbon <= 20) {
      return {
        icon: '🌿',
        title: 'Great work!',
        message:
          'Your carbon footprint is looking good. Keep making sustainable choices.'
      };
    }

    if (carbon <= 50) {
      return {
        icon: '🌱',
        title: 'You are on the right track',
        message:
          'Your footprint is moderate. Try reducing high-carbon activities.'
      };
    }

    return {
      icon: '💚',
      title: "Let's reduce your footprint",
      message:
        'Consider choosing greener transportation, saving electricity, and reducing waste.'
    };
  });
  readonly personalizedRecommendation = computed(() => {
  const activities = this.activityList();

  if (activities.length === 0) {
    return {
      icon: '🌱',
      category: 'GET STARTED',
      title: 'Start Your Green Journey',
      message: 'Log your first activity to receive personalized sustainability recommendations.',
      action: 'Log your first activity'
    };
  }

  // Calculate carbon emission category-wise
  const categoryTotals: { [key: string]: number } = {};

  activities.forEach((activity: any) => {
    const category = activity.category || 'Other';
    const emission = Number(activity.carbonEmission) || 0;

    categoryTotals[category] =
      (categoryTotals[category] || 0) + emission;
  });

  // Find highest contributing category
  const highestCategory = Object.keys(categoryTotals).reduce(
    (a, b) =>
      categoryTotals[a] > categoryTotals[b] ? a : b
  );

  const category = highestCategory.toLowerCase();

  // Food recommendation
  if (category.includes('food')) {
    return {
      icon: '🥗',
      category: 'FOOD CONSUMPTION',
      title: 'Make Your Meals More Sustainable',
      message:
        'Your food consumption contributes significantly to your carbon footprint. Try choosing more plant-based and locally sourced foods.',
      action: 'Choose sustainable food'
    };
  }

  // Transport recommendation
  if (
    category.includes('transport') ||
    category.includes('travel')
  ) {
    return {
      icon: '🚲',
      category: 'TRANSPORTATION',
      title: 'Choose Greener Transportation',
      message:
        'Transportation is a major contributor to your footprint. Consider walking, cycling, public transport or carpooling.',
      action: 'Choose greener travel'
    };
  }

  // Energy recommendation
  if (
    category.includes('energy') ||
    category.includes('electricity')
  ) {
    return {
      icon: '⚡',
      category: 'ENERGY',
      title: 'Reduce Your Energy Usage',
      message:
        'Try switching off unused appliances, using energy-efficient devices and reducing unnecessary electricity consumption.',
      action: 'Save energy'
    };
  }

  // Waste recommendation
  if (category.includes('waste')) {
    return {
      icon: '♻️',
      category: 'WASTE MANAGEMENT',
      title: 'Reduce and Reuse More',
      message:
        'Reduce single-use products, reuse materials and separate recyclable waste to lower your environmental impact.',
      action: 'Reduce waste'
    };
  }

  // Default
  return {
    icon: '🌿',
    category: highestCategory.toUpperCase(),
    title: 'Make a More Sustainable Choice',
    message:
      'This activity is contributing to your carbon footprint. Try choosing a lower-carbon alternative whenever possible.',
    action: 'Make a greener choice'
  };
});
readonly recommendationPercentage = computed(() => {
  const activities = this.activityList();

  if (activities.length === 0) {
    return 0;
  }

  const total = activities.reduce(
    (sum: number, activity: any) =>
      sum + Number(activity.carbonEmission || 0),
    0
  );

  if (total === 0) {
    return 0;
  }

  const category =
    this.personalizedRecommendation().category?.toLowerCase();

  const categoryCarbon = activities
    .filter((activity: any) =>
      activity.category?.toLowerCase() === category
    )
    .reduce(
      (sum: number, activity: any) =>
        sum + Number(activity.carbonEmission || 0),
      0
    );

  return Math.round((categoryCarbon / total) * 100);
});
  // ==============================
// CARBON TREE + CHALLENGE WHEEL
// ==============================

readonly treeProgress = computed(() => {

  const activities = this.activityList().length;
  const achieved = this.achievedGoals();

  if (activities === 0 && achieved === 0) {
    return 0;
  }

  const activityGrowth = Math.min(activities * 8, 60);
  const goalGrowth = Math.min(achieved * 10, 40);

  return Math.min(
    activityGrowth + goalGrowth,
    100
  );
});
readonly treeIcon = computed(() => {

  const progress = this.treeProgress();

  if (progress === 0) {
    return '🌱';
  }

  if (progress < 25) {
    return '🌿';
  }

  if (progress < 50) {
    return '🌳';
  }

  if (progress < 75) {
    return '🌳🌿';
  }

  return '🌳🌳';
});

  isWheelSpinning = false;
  wheelRotation = 0;

  selectedChallenge: {
    icon: string;
    title: string;
    description: string;
  } | null = null;

  ecoChallenges = [
    {
      icon: '🚲',
      title: 'Green Commuter',
      description:
        'Try walking, cycling or public transport for your next trip.'
    },
    {
      icon: '💡',
      title: 'Energy Saver',
      description:
        'Switch off lights and appliances that are not being used.'
    },
    {
      icon: '♻️',
      title: 'Zero Waste Move',
      description:
        'Avoid one single-use item today.'
    },
    {
      icon: '🥗',
      title: 'Green Meal',
      description:
        'Choose a more plant-based meal today.'
    },
    {
      icon: '🚿',
      title: 'Water Saver',
      description:
        'Take a shorter shower and save water today.'
    },
    {
      icon: '🌱',
      title: 'Nature Boost',
      description:
        'Spend a few minutes caring for a plant or green space.'
    }
  ];

spinChallenge(): void {

  if (this.isWheelSpinning) {
    return;
  }

  this.isWheelSpinning = true;
  this.selectedChallenge = null;

  // Pick one challenge
  const randomIndex = Math.floor(
    Math.random() * this.ecoChallenges.length
  );

  /*
   * Each wheel section = 60 degrees.
   *
   * We calculate exactly how much the wheel
   * must rotate so the selected challenge
   * comes to the pointer at the top.
   */
  const currentRotation = this.wheelRotation % 360;

  const targetAngle = randomIndex * 60;

  let rotationNeeded =
    360 - ((currentRotation + targetAngle) % 360);

  // Add multiple full rotations for spinning effect
  rotationNeeded += 1440;

  this.wheelRotation += rotationNeeded;

  setTimeout(() => {

    // Message matches the icon selected on the wheel
    this.selectedChallenge =
      this.ecoChallenges[randomIndex];

    this.isWheelSpinning = false;

  }, 1800);
}
  ngOnInit(): void {

    const email = localStorage.getItem("email");

    if (!email) {
      return;
    }

    this.username = email.split("@")[0];

    // ==============================
// GET AI PERSONALIZED RECOMMENDATION
// ==============================

this.recommendationService.generateRecommendation(email).subscribe({

  next: (data: any) => {

    this.recommendation =
      data.recommendationText || 
      'Keep making sustainable choices to reduce your carbon footprint.';

    console.log(
      'AI Recommendation:',
      data
    );

  },

  error: (err) => {

    console.error(
      'AI Recommendation error:',
      err
    );

    this.recommendation =
      'Keep making sustainable choices to reduce your carbon footprint.';
  }

});

    // ==============================
    // GET USER ACTIVITIES
    // ==============================

    this.carbonService.getActivities(email).subscribe({

      next: (data: any[]) => {

        this.activityList.set(data);

      },

      error: (err) => {

        console.error(
          'Activity loading error:',
          err
        );

      }

    });

    // ==============================
    // GET USER GOALS
    // ==============================

    this.goalService.getGoals(email).subscribe({

      next: (data: any[]) => {

        this.goalList.set(data);

      },

      error: (err) => {

        console.error(
          'Goal loading error:',
          err
        );

      }

    });

  }
  // ================= CARBON FOOTPRINT SCANNER =================

isScanning = signal(false);
scanComplete = signal(false);
scanProgress = signal(0);

scannerEmission = '3.10';

// ================= ECO IDENTITY SCORE =================

readonly ecoIdentityScore = computed(() => {

  const activities = this.activityList();
  const goals = this.goalList();

  // No data
  if (activities.length === 0 && goals.length === 0) {
    return 0;
  }

  // -----------------------------
  // 1. Activity Score - 40 points
  // -----------------------------
  const activityScore = Math.min(
    activities.length * 8,
    40
  );

  // -----------------------------
  // 2. Carbon Score - 40 points
  // Lower carbon = higher score
  // -----------------------------
  const carbon = this.totalCarbon();

  let carbonScore = 40;

  if (carbon > 0) {
    carbonScore = Math.max(
      0,
      40 - (carbon * 0.8)
    );
  }

  // -----------------------------
  // 3. Goal Score - 20 points
  // -----------------------------
  const goalScore =
    goals.length > 0
      ? (this.achievedGoals() / goals.length) * 20
      : 0;

  // -----------------------------
  // Final score
  // -----------------------------
  return Math.min(
    100,
    Math.max(
      0,
      Math.round(
        activityScore +
        carbonScore +
        goalScore
      )
    )
  );

});

readonly ecoIdentityTitle = computed(() => {

  const score = this.ecoIdentityScore();

  if (score >= 85) {
    return 'GREEN CHAMPION';
  }

  if (score >= 70) {
    return 'CONSCIOUS EXPLORER';
  }

  if (score >= 50) {
    return 'ECO LEARNER';
  }

  return 'GREEN BEGINNER';

});

readonly ecoIdentityMessage = computed(() => {

  const score = this.ecoIdentityScore();

  if (score >= 85) {
    return 'Amazing! Your recent choices show strong sustainable habits.';
  }

  if (score >= 70) {
    return 'Your recent choices are leaving a lighter footprint.';
  }

  if (score >= 50) {
    return 'You are building sustainable habits. Keep going!';
  }

  return 'Every small change counts. Start building greener habits today.';

});


// Start scanner
startFootprintScan() {

  this.isScanning.set(true);
  this.scanComplete.set(false);
  this.scanProgress.set(0);

  let progress = 0;

  const scanner = setInterval(() => {

    progress += 1;

    this.scanProgress.set(progress);

    if (progress >= 100) {

      clearInterval(scanner);

      setTimeout(() => {

        this.isScanning.set(false);
        this.scanComplete.set(true);

      }, 800);

    }

  }, 70);

}


// Reset scanner
resetFootprintScan() {

  this.scanComplete.set(false);
  this.isScanning.set(false);
  this.scanProgress.set(0);

}

}