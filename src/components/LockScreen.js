import React, {useEffect, useState} from 'react';
import {Image, Pressable, Text, View} from 'react-native';
import PinPad from './PinPad';
import {useApp} from '../store';
import {authenticateFingerprint} from '../lib/native';
import {fmt} from '../lib/i18n';

export default function LockScreen({onUnlock}) {
  const {t, c, settings, tryPin} = useApp();
  const [error, setError] = useState('');
  const [wait, setWait] = useState(0);

  useEffect(() => {
    const tick = () => setWait(Math.max(0, Math.ceil((settings.lockUntil - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [settings.lockUntil]);

  const finger = async () => {
    if (await authenticateFingerprint(t.unlockTitle, t.cancel)) onUnlock();
  };

  useEffect(() => {
    if (settings.biometric) finger();
  }, []);

  const submit = async pin => {
    const r = await tryPin(pin);
    if (r.ok) onUnlock();
    else setError(t.wrongPin);
  };

  return (
    <View style={{flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center'}}>
      <Image source={{uri: 'ic_launcher_foreground'}} style={{width: 72, height: 72, borderRadius: 16, marginBottom: 20}} />
      <Text style={{fontSize: 22, fontWeight: '700', color: c.text, marginBottom: 24}}>{t.unlockTitle}</Text>
      <PinPad
        title={t.pinSecurity}
        disabled={wait > 0}
        error={wait > 0 ? fmt(t.tooManyTries, {s: wait}) : error}
        onComplete={submit}
      />
      {settings.biometric && (
        <Pressable onPress={finger} accessibilityRole="button" style={{marginTop: 16, height: 44, paddingHorizontal: 20, justifyContent: 'center'}}>
          <Text style={{fontSize: 16, fontWeight: '600', color: c.text}}>{t.useFingerprint}</Text>
        </Pressable>
      )}
    </View>
  );
}
