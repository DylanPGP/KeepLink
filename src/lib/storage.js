import AsyncStorage from '@react-native-async-storage/async-storage';
import {sanitizeData} from './data';

const DATA_KEY = 'keeplink:data:v1';
const SETTINGS_KEY = 'keeplink:settings:v1';

export const DEFAULT_SETTINGS = {
  lang: 'auto',
  theme: 'system',
  donationSeen: false,
  previews: true,
  pinRecord: null,
  biometric: false,
  pinFails: 0,
  lockUntil: 0,
};
export const EMPTY_DATA = {links: [], collections: []};

export async function loadData() {
  let raw = null;
  try {
    raw = await AsyncStorage.getItem(DATA_KEY);
    if (!raw) return EMPTY_DATA;
    return sanitizeData(JSON.parse(raw));
  } catch (e) {
    if (raw) await AsyncStorage.setItem(DATA_KEY + ':corrupt', raw).catch(() => {});
    return EMPTY_DATA;
  }
}

export const saveData = data => AsyncStorage.setItem(DATA_KEY, JSON.stringify(data));

export const backupData = data =>
  AsyncStorage.setItem(DATA_KEY + ':backup', JSON.stringify(data)).catch(() => {});

export async function loadSettings() {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    return {...DEFAULT_SETTINGS, ...(raw ? JSON.parse(raw) : {})};
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

export const saveSettings = s => AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(s));

export const clearAllData = () =>
  AsyncStorage.multiRemove([DATA_KEY, DATA_KEY + ':backup', DATA_KEY + ':corrupt']).catch(() => {});
