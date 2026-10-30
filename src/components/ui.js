import React from 'react';
import {
  KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View,
} from 'react-native';
import Svg, {Circle, Path, Rect} from 'react-native-svg';
import {useApp} from '../store';

const ICONS = {
  link: {p: ['M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71', 'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71']},
  folder: {p: ['M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z']},
  gear: {c: [[12, 12, 3]], p: ['M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z']},
  plus: {p: ['M12 5v14M5 12h14']},
  search: {c: [[11, 11, 8]], p: ['M21 21l-4.35-4.35']},
  star: {p: ['M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z']},
  check: {p: ['M20 6L9 17l-5-5']},
  checkCircle: {p: ['M22 11.08V12a10 10 0 1 1-5.93-9.14', 'M22 4L12 14.01l-3-3']},
  copy: {r: [[9, 9, 13, 13, 2]], p: ['M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1']},
  trash: {p: ['M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2']},
  edit: {p: ['M12 20h9', 'M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z']},
  chevron: {p: ['M9 18l6-6-6-6']},
  back: {p: ['M19 12H5M12 19l-7-7 7-7']},
  globe: {c: [[12, 12, 10]], p: ['M2 12h20', 'M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z']},
  drop: {p: ['M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z']},
  download: {p: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M7 10l5 5 5-5', 'M12 15V3']},
  upload: {p: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M17 8l-5-5-5 5', 'M12 3v12']},
  code: {p: ['M16 18l6-6-6-6', 'M8 6l-6 6 6 6']},
  file: {p: ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6']},
  heart: {p: ['M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z']},
  info: {c: [[12, 12, 10]], p: ['M12 16v-4', 'M12 8h.01']},
  image: {r: [[3, 3, 18, 18, 2]], c: [[8.5, 8.5, 1.5]], p: ['M21 15l-5-5L5 21']},
  lock: {r: [[3, 11, 18, 11, 2]], p: ['M7 11V7a5 5 0 0 1 10 0v4']},
  shield: {p: ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z']},
};

export function Icon({name, size = 22, color, fill = false}) {
  const d = ICONS[name];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      {(d.p || []).map((x, i) => <Path key={'p' + i} d={x} fill={fill ? color : 'none'} />)}
      {(d.c || []).map(([cx, cy, r], i) => <Circle key={'c' + i} cx={cx} cy={cy} r={r} />)}
      {(d.r || []).map(([x, y, w, h, rx], i) => <Rect key={'r' + i} x={x} y={y} width={w} height={h} rx={rx} />)}
    </Svg>
  );
}

export function IconButton({name, onPress, label, color, fill, size = 22}) {
  const {c} = useApp();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={{width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22}}>
      <Icon name={name} size={size} color={color || c.text} fill={fill} />
    </Pressable>
  );
}

export function Header({title, onBack, right, logo}) {
  const {c} = useApp();
  return (
    <View style={{flexDirection: 'row', alignItems: 'center', height: 60, paddingHorizontal: 8}}>
      {onBack ? <IconButton name="back" onPress={onBack} label="Back" /> : <View style={{width: 8}} />}
      {logo}
      <Text numberOfLines={1} style={{flex: 1, fontSize: 24, fontWeight: '700', color: c.text, marginLeft: logo ? 10 : 4}}>
        {title}
      </Text>
      {right}
    </View>
  );
}

export function Button({label, onPress, kind = 'primary', style}) {
  const {c} = useApp();
  const bg = kind === 'primary' ? c.primary : kind === 'danger' ? 'transparent' : c.surface;
  const fg = kind === 'primary' ? c.onPrimary : kind === 'danger' ? c.danger : c.text;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[{height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, backgroundColor: bg, borderWidth: 1, borderColor: kind === 'primary' ? c.primary : c.border}, style]}>
      <Text style={{color: fg, fontSize: 16, fontWeight: '600'}}>{label}</Text>
    </Pressable>
  );
}

export function Empty({icon, title, body}) {
  const {c} = useApp();
  return (
    <View style={{alignItems: 'center', paddingHorizontal: 32, paddingTop: 80}}>
      <Icon name={icon} size={44} color={c.sub} />
      <Text style={{marginTop: 16, fontSize: 18, fontWeight: '600', color: c.text, textAlign: 'center'}}>{title}</Text>
      {!!body && <Text style={{marginTop: 6, fontSize: 14, color: c.sub, textAlign: 'center'}}>{body}</Text>}
    </View>
  );
}

export function Fab({onPress, bottom = 24, label}) {
  const {c} = useApp();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{position: 'absolute', right: 20, bottom, width: 56, height: 56, borderRadius: 18, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', elevation: 4}}>
      <Icon name="plus" size={26} color={c.onPrimary} />
    </Pressable>
  );
}

export function Sheet({visible, onClose, title, children}) {
  const {c} = useApp();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{flex: 1, justifyContent: 'flex-end'}}>
        <Pressable style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)'}} onPress={onClose} accessibilityLabel="Close" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{backgroundColor: c.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: 640, paddingTop: 20}}>
            {!!title && <Text style={{fontSize: 20, fontWeight: '700', color: c.text, paddingHorizontal: 20, marginBottom: 12}}>{title}</Text>}
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{paddingHorizontal: 20, paddingBottom: 24}}>
              {children}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export function Section({title, children}) {
  const {c} = useApp();
  return (
    <View style={{marginTop: 20}}>
      <Text style={{fontSize: 12, fontWeight: '700', letterSpacing: 1, color: c.sub, marginBottom: 8, marginLeft: 4, textTransform: 'uppercase'}}>{title}</Text>
      <View style={{backgroundColor: c.surface, borderRadius: 18, borderWidth: 1, borderColor: c.border, overflow: 'hidden'}}>{children}</View>
    </View>
  );
}

export function Row({icon, label, sub, value, onPress, right, last, danger, chevron = true}) {
  const {c} = useApp();
  const color = danger ? c.danger : c.text;
  const body = (
    <View style={{flexDirection: 'row', alignItems: 'center', minHeight: 56, paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: last ? 0 : 1, borderBottomColor: c.border}}>
      <Icon name={icon} size={20} color={color} />
      <View style={{flex: 1, marginLeft: 14}}>
        <Text style={{fontSize: 16, color, fontWeight: danger ? '600' : '400'}}>{label}</Text>
        {!!sub && <Text style={{fontSize: 12, color: c.sub, marginTop: 2}}>{sub}</Text>}
      </View>
      {!!value && <Text numberOfLines={1} style={{maxWidth: '45%', fontSize: 14, color: c.sub, marginLeft: 8}}>{value}</Text>}
      {right}
      {!!onPress && chevron && !right && !danger && <View style={{marginLeft: 6}}><Icon name="chevron" size={18} color={c.sub} /></View>}
    </View>
  );
  return onPress ? <Pressable onPress={onPress} accessibilityRole="button" android_ripple={{color: c.border}}>{body}</Pressable> : body;
}

export function CollectionIcon({emoji, size = 22, color}) {
  const {c} = useApp();
  if (emoji) return <Text style={{fontSize: size - 2, width: size + 2, textAlign: 'center'}}>{emoji}</Text>;
  return <Icon name="folder" size={size} color={color || c.text} />;
}

export function Option({label, selected, onPress}) {
  const {c} = useApp();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={{flexDirection: 'row', alignItems: 'center', height: 52, borderBottomWidth: 1, borderBottomColor: c.border}}>
      <Text style={{flex: 1, fontSize: 16, color: c.text, fontWeight: selected ? '700' : '400'}}>{label}</Text>
      {selected && <Icon name="check" size={20} color={c.text} />}
    </Pressable>
  );
}
