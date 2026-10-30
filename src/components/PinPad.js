import React, {useState} from 'react';
import {Pressable, Text, View} from 'react-native';
import {useApp} from '../store';

const KEYS = [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['', '0', '<']];

export default function PinPad({title, error, disabled, onComplete}) {
  const {c} = useApp();
  const [digits, setDigits] = useState('');

  const press = k => {
    if (disabled) return;
    if (k === '<') {
      setDigits(d => d.slice(0, -1));
      return;
    }
    if (digits.length >= 4) return;
    const next = digits + k;
    setDigits(next);
    if (next.length === 4) {
      setTimeout(() => {
        setDigits('');
        onComplete(next);
      }, 120);
    }
  };

  return (
    <View style={{alignItems: 'center'}}>
      <Text style={{fontSize: 18, fontWeight: '600', color: c.text}}>{title}</Text>
      <View style={{flexDirection: 'row', marginTop: 20, marginBottom: 12}}>
        {[0, 1, 2, 3].map(i => (
          <View key={i} style={{width: 16, height: 16, borderRadius: 8, marginHorizontal: 9, borderWidth: 2, borderColor: c.text, backgroundColor: i < digits.length ? c.text : 'transparent'}} />
        ))}
      </View>
      <Text style={{minHeight: 20, fontSize: 14, color: c.danger, marginBottom: 12, textAlign: 'center'}}>{error || ' '}</Text>
      {KEYS.map((row, ri) => (
        <View key={ri} style={{flexDirection: 'row'}}>
          {row.map((k, ki) =>
            k === '' ? (
              <View key={ki} style={{width: 76, height: 76, margin: 6}} />
            ) : (
              <Pressable
                key={ki}
                onPress={() => press(k)}
                accessibilityRole="button"
                accessibilityLabel={k === '<' ? 'Delete' : k}
                style={{width: 76, height: 76, margin: 6, borderRadius: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: k === '<' ? 'transparent' : c.surface, borderWidth: k === '<' ? 0 : 1, borderColor: c.border}}>
                <Text style={{fontSize: k === '<' ? 24 : 26, color: c.text}}>{k === '<' ? '⌫' : k}</Text>
              </Pressable>
            ),
          )}
        </View>
      ))}
    </View>
  );
}
