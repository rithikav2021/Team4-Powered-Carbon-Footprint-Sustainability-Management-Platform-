import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MockDataService } from '../../services/mock-data.service';
import { SustainabilityGoal } from '../../models/data.model';
import { FormsModule } from '@angular/forms';
import { GoalService } from '../../services/goal.service';
import { Goal } from '../../models/goal.model';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'eco-goals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './goals.component.html',
  styleUrl: './goals.component.css',
})
export class GoalsComponent implements OnInit {

  readonly Math = Math;

  private data = inject(MockDataService);
  private goalService = inject(GoalService);
  private notificationService = inject(NotificationService);

  showGoalForm = false;

  goal: Goal = {
    title: '',
    type: '',
    targetKg: 0,
    currentKg: 0,
    unit: '',
    startDate: '',
    endDate: '',
    status: 'Not Started',
    email: ''
  };

  goalList: any[] = [];

  selectedGoalId: number | null = null;

  selectGoal(goal: any) {
    this.selectedGoalId =
      this.selectedGoalId === goal.id
        ? null
        : goal.id;
  }

  goalXpTotal(goal: any): number {
    return this.data.goalXpTotal(goal);
  }

  goalXpEarned(goal: any): number {
    return this.data.goalXpEarned(goal);
  }

  get summary() {
    return {
      total: this.goalList.length,

      achieved: this.goalList.filter(
        g => g.status === 'Achieved'
      ).length,

      onTrack: this.goalList.filter(
        g => g.status === 'On Track'
      ).length,

      atRisk: this.goalList.filter(
        g => g.status === 'At Risk'
      ).length,
    };
  }

  openGoalForm() {
    this.showGoalForm = true;
  }

  closeGoalForm() {
    this.showGoalForm = false;
  }

  progressPct(goal: Goal): number {

    const current =
      Number(goal.currentKg) || 0;

    const target =
      Number(goal.targetKg) || 0;

    if (target <= 0) {
      return 0;
    }

    const percentage =
      (current / target) * 100;

    return Math.min(
      100,
      Math.max(0, Math.round(percentage))
    );
  }

  bump(goal: any) {

    const value = prompt(
      "Enter Current Progress",
      goal.currentKg
    );

    if (value == null) {
      return;
    }

    const newValue = Number(value);

    if (isNaN(newValue)) {
      alert("Please enter a valid number.");
      return;
    }

    if (newValue < 0) {
      alert("Progress cannot be negative.");
      return;
    }

    if (newValue > goal.targetKg) {
      alert("Progress cannot exceed the target.");
      return;
    }

    this.goalService
      .updateProgress(
        goal.id,
        newValue
      )
      .subscribe({

        next: () => {

          // Goal completion notification
          if (
            newValue >= Number(goal.targetKg) &&
            Number(goal.targetKg) > 0 &&
            goal.status !== 'Achieved'
          ) {

   this.notificationService.addNotification(
  'Goal Achieved',
  `${goal.title} has been completed successfully! 🎉`,
  '🏆',
  '/goals',
  goal.id
);
          }

          this.ngOnInit();

          alert(
            "Progress Updated Successfully"
          );
        },

        error: (err) => {

          console.error(err);

          alert("Update Failed");
        }
      });
  }

  statusClass(
    status: SustainabilityGoal['status']
  ): string {

    return {
      'On Track': 'status--ontrack',
      'At Risk': 'status--atrisk',
      Achieved: 'status--achieved',
      'Not Started': 'status--notstarted',
    }[status];
  }

  saveGoal() {

    this.goal.currentKg = 0;

    this.goal.startDate =
      new Date()
        .toISOString()
        .split('T')[0];

    this.goal.status =
      "Not Started";

    this.goal.email =
      localStorage.getItem("email") || "";

    this.goalService
      .saveGoal(this.goal)
      .subscribe({

        next: () => {

          this.notificationService.addNotification(
            'Goal Created',
            `${this.goal.title} has been successfully created.`,
            '🎯',
            '/goals'
          );

          alert(
            "Goal Saved Successfully"
          );

          this.closeGoalForm();

          this.ngOnInit();
        },

        error: (err) => {

          console.error(err);

          alert(
            "Goal Save Failed"
          );
        }
      });
  }

  ngOnInit(): void {

    const email =
      localStorage.getItem("email");

    if (email) {

      this.goalService
        .getGoals(email)
        .subscribe({

          next: (data) => {

            this.goalList = data;

            console.log(
              "Goals from DB:",
              data
            );

            this.goalList.forEach(
              (g) =>
                this.data.recordGoalCompletion(g)
            );

            // Check deadline reminders
            this.checkGoalDeadlines();
          },

          error: (err) => {

            console.error(err);
          }
        });
    }
  }

  /*
   * Check goal deadline reminders
   */
  private checkGoalDeadlines() {

    const today =
      new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );

    this.goalList.forEach(
      (goal) => {

        // Do not remind completed goals
        if (
          goal.status === 'Achieved'
        ) {
          return;
        }

        if (!goal.endDate) {
          return;
        }

        const endDate =
          new Date(goal.endDate);

        endDate.setHours(
          0,
          0,
          0,
          0
        );

        const difference =
          endDate.getTime() -
          today.getTime();

        const daysRemaining =
          Math.ceil(
            difference /
            (1000 * 60 * 60 * 24)
          );

        /*
         * Reminder thresholds
         */
        let reminderType = '';

        if (daysRemaining === 7) {

          reminderType = '7-days';

        } else if (daysRemaining === 3) {

          reminderType = '3-days';

        } else if (daysRemaining === 1) {

          reminderType = '1-day';

        } else if (daysRemaining === 0) {

          reminderType = 'today';

        } else if (daysRemaining < 0) {

          reminderType = 'overdue';
        }

        if (!reminderType) {
          return;
        }

        /*
         * Unique key prevents duplicate notifications
         */
        const reminderKey =
          `goal_deadline_${goal.id}_${reminderType}`;

        const alreadyNotified =
          localStorage.getItem(
            reminderKey
          );

        if (alreadyNotified) {
          return;
        }

        let title = '';
        let message = '';
        let icon = '⏰';

        if (
          reminderType === '7-days'
        ) {

          title =
            'Goal Deadline in 7 Days';

          message =
            `${goal.title} is due in 7 days. Keep going! 🌱`;

          icon = '📅';

        } else if (
          reminderType === '3-days'
        ) {

          title =
            'Goal Deadline in 3 Days';

          message =
            `${goal.title} is due in 3 days. You're almost there! 💪`;

          icon = '⏳';

        } else if (
          reminderType === '1-day'
        ) {

          title =
            'Goal Deadline Tomorrow';

          message =
            `${goal.title} is due tomorrow. Complete it before the deadline! ⚠️`;

          icon = '⚠️';

        } else if (
          reminderType === 'today'
        ) {

          title =
            'Goal Due Today';

          message =
            `${goal.title} is due today. Try to complete your goal! 🚨`;

          icon = '🚨';

        } else if (
          reminderType === 'overdue'
        ) {

          title =
            'Goal Deadline Passed';

          message =
            `${goal.title} has passed its deadline.`;

          icon = '🔴';
        }

      this.notificationService.addNotification(
  title,
  message,
  icon,
  '/goals',
  goal.id
);

        /*
         * Remember that this reminder
         * was already shown
         */
        localStorage.setItem(
          reminderKey,
          'true'
        );
      }
    );
  }

  deleteGoal(id: number) {

    if (
      confirm(
        "Are you sure you want to delete this goal?"
      )
    ) {

      this.goalService
        .deleteGoal(id)
        .subscribe({

       next: () => {

  // Find the goal before refreshing the list
  const deletedGoal =
    this.goalList.find(
      g => g.id === id
    );

  // Remove all notifications related to this goal
  this.notificationService
    .deleteGoalNotifications(
      id,
      deletedGoal?.title
    );

  alert(
    "Goal Deleted Successfully"
  );

  this.ngOnInit();
},

          error: (err) => {

            console.log(
              "Status:",
              err.status
            );

            console.log(
              "Error:",
              err.error
            );

            console.log(
              "Full Error:",
              err
            );

            alert(
              "Delete Failed"
            );
          }
        });
    }
  }
}