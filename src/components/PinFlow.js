import React, {useState} from 'react';
import {Modal, View} from 'react-native';
import PinPad from './PinPad';
import {Header} from './ui';
import {toast, useApp} from '../store';
import {makePinRecord} from '../lib/native';
import {fmt} from '../lib/i18n';

export default function PinFlow({mode, onClose, onDone}) {
  const {t, c, setSettings, tryPin} = useApp();
  const needsCurrent = mode === 'change' || mode === 'remove' || mode === 'authorize';
  const [step, setStep] = useState(needsCurrent ? 'current' : 'new');
  const [first, setFirst] = useState('');
  const [error, setError] = useState('');

  const titles = {current: t.currentPin, new: t.newPin, confirm: t.confirmPin};
  const heading = {create: t.createPin, change: t.changePin, remove: t.removePin, authorize: t.pinSecurity}[mode];

  const complete = async pin => {
    setError('');
    if (step === 'current') {
      const r = await tryPin(pin);
      if (!r.ok) {
        setError(r.wait ? fmt(t.tooManyTries, {s: r.wait}) : t.wrongPin);
        return;
      }
      if (mode === 'remove') {
        setSettings({pinRecord: null, biometric: false, pinFails: 0, lockUntil: 0});
        toast(t.pinRemoved);
        onClose();
      } else if (mode === 'authorize') {
        onClose();
        if (onDone) onDone();
      } else setStep('new');
      return;
    }
    if (step === 'new') {
      setFirst(pin);
      setStep('confirm');
      return;
    }
    if (pin !== first) {
      setError(t.pinMismatch);
      setFirst('');
      setStep('new');
      return;
    }
    try {
      setSettings({pinRecord: await makePinRecord(pin), pinFails: 0, lockUntil: 0});
      toast(t.pinSaved);
      onClose();
    } catch (e) {
      setError(t.wrongPin);
      setStep('new');
    }
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={{flex: 1, backgroundColor: c.bg}}>
        <Header title={heading} onBack={onClose} />
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 40}}>
          <PinPad key={step} title={titles[step]} error={error} onComplete={complete} />
        </View>
      </View>
    </Modal>
  );
}
