import {NativeModules} from 'react-native';

const F = NativeModules.KeepLinkNative;
const S = NativeModules.KeepLinkSecurity;

export const getLocale = async () => {
  try {
    return (await F.getLocale()) || 'en';
  } catch (e) {
    return 'en';
  }
};

export const saveFile = (name, mime, content) => F.saveFile(name, mime, content);
export const pickFile = () => F.pickFile();
export const copyText = text => F.copyText('KeepLink', text);

export const fingerprintStatus = async () => {
  try {
    return await S.fingerprintStatus();
  } catch (e) {
    return 'unavailable';
  }
};
export const authenticateFingerprint = async (title, cancel) => {
  try {
    return await S.authenticate(title, cancel);
  } catch (e) {
    return false;
  }
};
export const makePinRecord = pin => S.makePinRecord(pin);
export const checkPin = async (pin, record) => {
  try {
    return !!record && (await S.checkPin(pin, record));
  } catch (e) {
    return false;
  }
};
