
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

const PasswordPolicySchema = z.object({
    minLength: z.number().min(8),
    requiredChars: z.array(z.enum(['uppercase', 'lowercase', 'number', 'special'])),
});

const SecuritySettingsSchema = z.object({
    force2FA: z.boolean(),
    passwordPolicy: PasswordPolicySchema,
    ipWhitelist: z.array(z.string()),
});

const DataPrivacySettingsSchema = z.object({
    credentialLogRetention: z.string(), // e.g., '7', '30', '90', 'never'
    activityLogRetention: z.string(),
});

const NotificationsSettingsSchema = z.object({
    webhookUrl: z.string(),
    webhookEvents: z.array(z.string()), // e.g., ['credential_captured', 'admin_login']
    emailOnTaskAssignment: z.boolean(),
});

export const UserSettingsSchema = z.object({
  offensive: OffensiveSettingsSchema,
  mergingStation: MergingStationSettingsSchema,
  lolbins: LolbinsSettingsSchema,
  scanning: ScanningSettingsSchema,
  reporting: ReportingSettingsSchema,
  global: GlobalAppSettingsSchema,
  security: SecuritySettingsSchema,
  dataPrivacy: DataPrivacySettingsSchema,
  notifications: NotificationsSettingsSchema,
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
  security: {
      force2FA: false,
      passwordPolicy: {
          minLength: 8,
          requiredChars: ['lowercase', 'uppercase', 'number'],
      },
      ipWhitelist: [],
  },
  dataPrivacy: {
      credentialLogRetention: '30',
      activityLogRetention: '90',
  },
  notifications: {
      webhookUrl: '',
      webhookEvents: ['credential_captured', 'honeytrap_triggered'],
      emailOnTaskAssignment: true,
  }
};

const mergeDeep = (target: any, source: any) => {
  for (const key in source) {
    if (source[key] instanceof Object && key in target) {
      Object.assign(source[key], mergeDeep(target[key], source[key]))
    }
  }
  Object.assign(target || {}, source)
  return target
}

export async function getUserSettings(): Promise<UserSettings> {
  if (typeof window === 'undefined') {
    return defaultUserSettings;
  }

  try {
    const storedUser = localStorage.getItem('netra-currentUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      // Deep merge stored settings with defaults to ensure all keys and nested objects are present
      return mergeDeep(JSON.parse(JSON.stringify(defaultUserSettings)), user.userSettings || {});
    }
  } catch (error) {
    console.error('Failed to load user settings from localStorage', error);
  }
  return defaultUserSettings;
}
