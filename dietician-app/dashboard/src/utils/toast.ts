// src/utils/toast.ts
// Central toast utility — all app-wide notifications go through here.
// Built on react-hot-toast (already mounted via <Toaster> in App.tsx).

import toast from 'react-hot-toast'

export const showToast = {
  // ── Generic ───────────────────────────────────────────────────────────────
  success: (msg: string) => toast.success(msg),
  error:   (msg: string) => toast.error(msg),

  // ── Profile ───────────────────────────────────────────────────────────────
  profileSaved:  () => toast.success('Profile updated'),
  userDeleted:   (name: string) => toast.success(`${name} deleted`),

  // ── Diet Plan ─────────────────────────────────────────────────────────────
  planAssigned:  () => toast.success('Diet plan assigned successfully'),
  planSaved:     () => toast.success('Diet plan saved'),
  planRemoved:   () => toast.success('Diet plan removed'),

  // ── Templates ─────────────────────────────────────────────────────────────
  templateSaved:   (name: string) => toast.success(`Template "${name}" saved`),
  templateDeleted: ()             => toast.success('Template deleted'),

  // ── Settings ──────────────────────────────────────────────────────────────
  settingAdded:   (name: string) => toast.success(`"${name}" added`),
  settingDeleted: ()             => toast.success('Item removed'),

  // ── Meal / Day copy helpers ───────────────────────────────────────────────
  appliedToAll: (dayName: string) => toast.success(`${dayName}'s meals applied to all days`),
  copiedTo:     (dayName: string) => toast.success(`Meals copied to ${dayName}`),
  copiedFrom:   (dayName: string) => toast.success(`Meals copied from ${dayName}`),
}
