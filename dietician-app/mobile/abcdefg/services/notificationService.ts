import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { logMealCompletion, logWaterCompletion } from './reportService';
import { getDayPlanForDate } from './dietPlanService';
import type { DietPlan } from '../types';

// ─── Constants ────────────────────────────────────────────────────────────────

const USER_ID_KEY = '@notif_user_id';
const CHANNEL_ID  = 'dietplan';

// ─── Foreground handler (show notification even when app is open) ─────────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ─── Android channel ──────────────────────────────────────────────────────────

export async function setupAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Diet Plan',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#1565C0',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    showBadge: false,
  });
}

// ─── Action button categories ─────────────────────────────────────────────────

export async function setupNotificationCategories(): Promise<void> {
  await Notifications.setNotificationCategoryAsync('MEAL_COMPLETE', [
    {
      identifier: 'complete',
      buttonTitle: '✅ Mark Complete',
      options: {
        opensAppToForeground: false,
        isDestructive: false,
        isAuthenticationRequired: false,
      },
    },
  ]);

  await Notifications.setNotificationCategoryAsync('WATER_DONE', [
    {
      identifier: 'done',
      buttonTitle: '💧 I Drank It',
      options: {
        opensAppToForeground: false,
        isDestructive: false,
        isAuthenticationRequired: false,
      },
    },
  ]);
}

// ─── Permissions ──────────────────────────────────────────────────────────────

export async function requestPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ─── Notification response handler ───────────────────────────────────────────
//
// Identifier formats:
//   meal__YYYY-MM-DD__mealId__mealName__HH:MM__planId__dayIndex
//   water__HH-MM__amountMl__planId

export async function handleNotificationResponse(
  response: Notifications.NotificationResponse,
): Promise<void> {
  const { actionIdentifier, notification } = response;

  // Only process explicit action button taps, not body taps
  if (actionIdentifier !== 'complete' && actionIdentifier !== 'done') return;

  const userId = await AsyncStorage.getItem(USER_ID_KEY);
  if (!userId) return;

  const identifier = notification.request.identifier;
  const parts = identifier.split('__');
  const type = parts[0];
  const now = new Date().toISOString();
  const todayStr = new Date().toISOString().split('T')[0];

  try {
    if (type === 'meal') {
      // meal__YYYY-MM-DD__mealId__mealName__HH:MM__planId__dayIndex
      const [, date, mealId, mealName, scheduledTime, planId, dayIndexStr] = parts;
      await logMealCompletion(userId, {
        planId,
        date,
        dayIndex: parseInt(dayIndexStr, 10),
        mealId,
        mealName,
        scheduledTime,
        completed: true,
        completedAt: now,
      });
    } else if (type === 'water') {
      // water__HH-MM__amountMl__planId
      const [, timeSlug, amountMlStr, planId] = parts;
      const scheduledTime = timeSlug.replace('-', ':');
      await logWaterCompletion(userId, {
        planId,
        date: todayStr,
        scheduledTime,
        amountMl: parseInt(amountMlStr, 10),
        completed: true,
        completedAt: now,
      });
    }

    // Dismiss the notification from the panel
    await Notifications.dismissNotificationAsync(notification.request.identifier);
  } catch (e) {
    console.error('[notifications] failed to log response:', e);
  }
}

// ─── Schedule all notifications ───────────────────────────────────────────────

export async function scheduleAllNotifications(
  plan: DietPlan,
  userId: string,
): Promise<void> {
  // Persist userId for background handler
  await AsyncStorage.setItem(USER_ID_KEY, userId);

  const granted = await requestPermissions();
  if (!granted) return;

  // Cancel any previously scheduled notifications
  await Notifications.cancelAllScheduledNotificationsAsync();

  // ── 1. Wake-up — daily repeating ──────────────────────────────────────────
  if (plan.wakeUpTime) {
    const [h, m] = plan.wakeUpTime.split(':').map(Number);
    await Notifications.scheduleNotificationAsync({
      identifier: 'wakeup',
      content: {
        title: 'Good morning! 🌅',
        body: 'Time to start your healthy day!',
        sound: true,
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DAILY,
        hour: h,
        minute: m,
      },
    });
  }

  // ── 2. Bedtime — daily repeating ──────────────────────────────────────────
  if (plan.sleepTime) {
    const [h, m] = plan.sleepTime.split(':').map(Number);
    await Notifications.scheduleNotificationAsync({
      identifier: 'sleep',
      content: {
        title: 'Time to rest 🌙',
        body: "Get a good night's sleep!",
        sound: true,
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DAILY,
        hour: h,
        minute: m,
      },
    });
  }

  // ── 3. Water reminders — daily repeating, one per schedule slot ───────────
  if (plan.waterSchedule?.length) {
    for (const slot of plan.waterSchedule) {
      const [h, m] = slot.time.split(':').map(Number);
      const timeSlug = slot.time.replace(':', '-');
      await Notifications.scheduleNotificationAsync({
        identifier: `water__${timeSlug}__${slot.amountMl}__${plan.id}`,
        content: {
          title: '💧 Time to drink water',
          body: `Drink ${slot.amountMl} ml now`,
          sound: true,
          sticky: true,
          autoDismiss: false,
          categoryIdentifier: 'WATER_DONE',
        },
        trigger: {
          type: SchedulableTriggerInputTypes.DAILY,
          hour: h,
          minute: m,
        },
      });
    }
  }

  // ── 4. Meal notifications — next 7 days, 20 minutes before each meal ──────
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const now = new Date();

  const assignedAtDate = new Date(plan.assignedAt);
  assignedAtDate.setHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    const daysElapsed = Math.floor(
      (date.getTime() - assignedAtDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const dayIndex = Math.max(0, daysElapsed) % plan.days.length;

    const dayPlan = getDayPlanForDate(plan, date);
    const dateStr = date.toISOString().split('T')[0]; // "YYYY-MM-DD"

    for (const meal of dayPlan.meals) {
      if (!meal.time) continue;

      const [h, m] = meal.time.split(':').map(Number);
      const mealTotalMins = h * 60 + m;

      // Need at least 20 mins from midnight to give a 20-min warning
      if (mealTotalMins < 20) continue;

      const notifMins = mealTotalMins - 20;
      const notifH = Math.floor(notifMins / 60);
      const notifM = notifMins % 60;

      const triggerDate = new Date(date);
      triggerDate.setHours(notifH, notifM, 0, 0);

      if (triggerDate <= now) continue; // already passed

      const preview = meal.items
        ?.slice(0, 2)
        .map(item => item.name)
        .filter(Boolean)
        .join(', ');

      await Notifications.scheduleNotificationAsync({
        identifier: `meal__${dateStr}__${meal.id}__${meal.name}__${meal.time}__${plan.id}__${dayIndex}`,
        content: {
          title: `🍽️ ${meal.name} in 20 minutes`,
          body: preview || 'Time to prepare your meal!',
          sound: true,
          sticky: true,
          autoDismiss: false,
          categoryIdentifier: 'MEAL_COMPLETE',
        },
        trigger: {
          type: SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        },
      });
    }
  }
}

// ─── Cancel all & clear stored userId ────────────────────────────────────────

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await AsyncStorage.removeItem(USER_ID_KEY);
}

// ─── DEV ONLY: fire every notification type immediately ───────────────────────
//
// Staggers all notifications 3 seconds apart so they don't get batched.
// Remove this export (and the button that calls it) before production release.
//
// userId is required so the response handler can find the correct Firestore path
// even when the app is in the background.

export async function fireTestNotifications(
  plan: DietPlan,
  userId: string,
): Promise<void> {
  const granted = await requestPermissions();
  if (!granted) return;

  // Ensure userId is persisted for the background response handler
  await AsyncStorage.setItem(USER_ID_KEY, userId);

  let offsetSec = 3;
  const todayStr = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"

  const fireWithId = async (
    identifier: string,
    content: Notifications.NotificationContentInput,
  ) => {
    await Notifications.scheduleNotificationAsync({
      identifier,
      content,
      trigger: {
        type: SchedulableTriggerInputTypes.DATE,
        date: new Date(Date.now() + offsetSec * 1000),
      },
    });
    offsetSec += 3;
  };

  // 1. Wake-up — no action button, no log needed
  if (plan.wakeUpTime) {
    await fireWithId('wakeup__test', {
      title: '[TEST] Good morning! 🌅',
      body: `Wake-up reminder (scheduled: ${plan.wakeUpTime})`,
      sound: true,
    });
  }

  // 2. Sleep — no action button, no log needed
  if (plan.sleepTime) {
    await fireWithId('sleep__test', {
      title: '[TEST] Time to rest 🌙',
      body: `Bedtime reminder (scheduled: ${plan.sleepTime})`,
      sound: true,
    });
  }

  // 3. Water — identifier must match: water__HH-MM__amountMl__planId
  if (plan.waterSchedule?.length) {
    for (const slot of plan.waterSchedule.slice(0, 3)) {
      const timeSlug = slot.time.replace(':', '-');
      await fireWithId(
        `water__${timeSlug}__${slot.amountMl}__${plan.id}`,
        {
          title: '[TEST] 💧 Drink water',
          body: `${slot.amountMl} ml · scheduled at ${slot.time}`,
          sound: true,
          sticky: true,
          autoDismiss: false,
          categoryIdentifier: 'WATER_DONE',
        },
      );
    }
  }

  // 4. Meals — identifier must match: meal__YYYY-MM-DD__mealId__mealName__HH:MM__planId__dayIndex
  const todayPlan = getDayPlanForDate(plan, new Date());
  for (const meal of todayPlan.meals.slice(0, 3)) {
    const preview = meal.items
      ?.slice(0, 2)
      .map(i => i.name)
      .filter(Boolean)
      .join(', ');
    await fireWithId(
      `meal__${todayStr}__${meal.id}__${meal.name}__${meal.time}__${plan.id}__0`,
      {
        title: `[TEST] 🍽️ ${meal.name}`,
        body: preview || 'Meal notification',
        sound: true,
        sticky: true,
        autoDismiss: false,
        categoryIdentifier: 'MEAL_COMPLETE',
      },
    );
  }
}
