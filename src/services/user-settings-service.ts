
'use client';

import { z } from 'zod';

const OffensiveSettingsSchema = z.object({
  defaultLhost: z.string(),
  defaultLport: z.string(),
});

const MergingStationSettingsSchema = z.object({
  defaultEvasion: z.array(z.string()),
});

const LolbinsSettingsSchema = z.object({
  default: z.string(),
});

const ScanningSettingsSchema = z.object({
  defaultPortScan: z.string(),
  defaultIdorRange: z.string(),
  globalTimeout: z.number(),
  userAgent: z.string(),
});

const ReportingSettingsSchema = z.object({
  defaultAuthor: z.string(),
  includeTimestamp: z.boolean(),
  pdfHeader: z.string(),
  pdfFooter: z.string(),
});

const GlobalAppSettingsSchema = z.object({
  disableLogging: z.boolean(),
  logVerbosity: z.enum(['standard', 'detailed']),
  sessionTimeout: z.number(),
});

export const UserSettingsSchema = z.object({
  offensive: OffensiveSettingsSchema,
  mergingStation: MergingStationSettingsSchema,
  lolbins: LolbinsSettingsSchema,
  scanning: ScanningSettingsSchema,
  reporting: ReportingSettingsSchema,
  global: GlobalAppSettingsSchema,
});

export type UserSettings = z.infer<typeof UserSettingsSchema>;

export const defaultUserSettings: UserSettings = {
  offensive: {
    defaultLhost: '10.10.10.1',
    defaultLport: '4444',
  },
  mergingStation: {
    defaultEvasion: ['enableSandboxDetection'],
  },
  lolbins: {
    default: 'certutil',
  },
  scanning: {
    defaultPortScan: '21,22,80,443,3389,8080',
    defaultIdorRange: '1-100',
    globalTimeout: 10000,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  },
  reporting: {
    defaultAuthor: 'NETRA-X Operator',
    includeTimestamp: true,
    pdfHeader: '',
    pdfFooter: 'CONFIDENTIAL',
  },
  global: {
    disableLogging: false,
    logVerbosity: 'standard',
    sessionTimeout: 30, // in minutes
  },
};

export async function getUserSettings(): Promise<UserSettings> {
  if (typeof window === 'undefined') {
    return defaultUserSettings;
  }

  try {
    const storedUser = localStorage.getItem('netra-currentUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      // Merge stored settings with defaults to ensure all keys are present
      return {
        ...defaultUserSettings,
        ...(user.userSettings || {}),
        offensive: { ...defaultUserSettings.offensive, ...(user.userSettings?.offensive || {}) },
        mergingStation: { ...defaultUserSettings.mergingStation, ...(user.userSettings?.mergingStation || {}) },
        lolbins: { ...defaultUserSettings.lolbins, ...(user.userSettings?.lolbins || {}) },
        scanning: { ...defaultUserSettings.scanning, ...(user.userSettings?.scanning || {}) },
        reporting: { ...defaultUserSettings.reporting, ...(user.userSettings?.reporting || {}) },
        global: { ...defaultUserSettings.global, ...(user.userSettings?.global || {}) },
      };
    }
  } catch (error) {
    console.error('Failed to load user settings from localStorage', error);
  }
  return defaultUserSettings;
}
