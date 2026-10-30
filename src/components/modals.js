import React, {useState} from 'react';
import {Pressable, Switch, Text, TextInput, View} from 'react-native';
import {Button, Icon, Sheet} from './ui';
import {toast, useApp} from '../store';
import {copyText} from '../lib/native';
import {normalizeUrl} from '../lib/data';
import {BTC_ADDRESS, XMR_ADDRESS} from '../lib/constants';

function Field({label, value, onChangeText, multiline, keyboardType, autoFocus, error}) {
  const {c} = useApp();
  return (
    <View style={{marginBottom: 14}}>
      <Text style={{fontSize: 13, color: c.sub, marginBottom: 6}}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        keyboardType={keyboardType}
        autoFocus={autoFocus}
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor={c.sub}
        style={{minHeight: multiline ? 84 : 48, textAlignVertical: multiline ? 'top' : 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: error ? c.danger : c.border, backgroundColor: c.surface, color: c.text, fontSize: 16}}
      />
      {!!error && <Text style={{color: c.danger, fontSize: 13, marginTop: 4}}>{error}</Text>}
    </View>
  );
}

function Chip({label, selected, onPress}) {
  const {c} = useApp();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={{paddingHorizontal: 14, height: 36, borderRadius: 18, justifyContent: 'center', marginRight: 8, marginBottom: 8, backgroundColor: selected ? c.primary : c.surface, borderWidth: 1, borderColor: selected ? c.primary : c.border}}>
      <Text style={{color: selected ? c.onPrimary : c.text, fontSize: 14}}>{label}</Text>
    </Pressable>
  );
}

export function LinkEditor({link, defaultCollectionId, onClose, onDelete}) {
  const {t, c, data, actions} = useApp();
  const isNew = !link;
  const [url, setUrl] = useState(link ? link.url : '');
  const [title, setTitle] = useState(link ? link.title : '');
  const [note, setNote] = useState(link ? link.note : '');
  const [collectionId, setCollectionId] = useState(link ? link.collectionId : defaultCollectionId || null);
  const [favorite, setFavorite] = useState(link ? link.favorite : false);
  const [read, setRead] = useState(link ? link.read : false);
  const [error, setError] = useState('');

  const save = () => {
    if (!normalizeUrl(url)) {
      setError(t.invalidUrl);
      return;
    }
    const patch = {url, title, note, collectionId, favorite, read};
    const r = isNew ? actions.addLink(patch) : actions.updateLink(link.id, patch);
    if (r === 'dup') {
      setError(t.duplicateLink);
      return;
    }
    onClose();
  };

  const toggleRow = (label, value, set) => (
    <View style={{flexDirection: 'row', alignItems: 'center', height: 48}}>
      <Text style={{flex: 1, fontSize: 16, color: c.text}}>{label}</Text>
      <Switch value={value} onValueChange={set} trackColor={{true: c.primary, false: c.border}} thumbColor={c.bg} />
    </View>
  );

  return (
    <Sheet visible onClose={onClose} title={isNew ? t.addLink : t.editLink}>
      <Field label={t.url} value={url} onChangeText={v => { setUrl(v); setError(''); }} keyboardType="url" autoFocus={isNew} error={error} />
      <Field label={t.title} value={title} onChangeText={setTitle} />
      <Field label={t.note} value={note} onChangeText={setNote} multiline />
      {data.collections.length > 0 && (
        <View style={{marginBottom: 8}}>
          <Text style={{fontSize: 13, color: c.sub, marginBottom: 8}}>{t.collection}</Text>
          <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
            <Chip label={t.noCollection} selected={!collectionId} onPress={() => setCollectionId(null)} />
            {data.collections.map(x => (
              <Chip key={x.id} label={(x.emoji ? x.emoji + ' ' : '') + x.name} selected={collectionId === x.id} onPress={() => setCollectionId(x.id)} />
            ))}
          </View>
        </View>
      )}
      {toggleRow(t.favorite, favorite, setFavorite)}
      {toggleRow(t.markRead, read, setRead)}
      <View style={{flexDirection: 'row', marginTop: 16}}>
        {!isNew && <Button kind="danger" label={t.delete} onPress={() => onDelete(link)} style={{marginRight: 10}} />}
        <Button kind="ghost" label={t.cancel} onPress={onClose} style={{flex: 1, marginRight: 10}} />
        <Button label={t.save} onPress={save} style={{flex: 1}} />
      </View>
    </Sheet>
  );
}

const EMOJIS = ['📁', '⭐', '💼', '🏠', '📚', '🎓', '🎮', '🎵', '🎬', '🛒', '💡', '🔧', '💻', '📱', '🌐', '📰', '🍳', '✈️', '🏋️', '💰', '❤️', '🔒', '🧠', '🎨', '📷', '🧪', '🚀', '🔥', '🌱', '🐾', '⚽', '☕', '🏥', '🧾', '📝', '📌', '🎁', '🎧', '🗺️', '🔍'];

export function NamePrompt({title, initial = '', initialEmoji = null, onSubmit, onClose}) {
  const {t, c} = useApp();
  const [name, setName] = useState(initial);
  const [emoji, setEmoji] = useState(initialEmoji);
  const [error, setError] = useState('');
  const submit = () => {
    const r = onSubmit(name, emoji);
    if (r === 'exists') setError(t.nameExists);
    else if (r === 'empty') setError(t.collectionName);
    else onClose();
  };
  const cell = (key, label, selected, onPress) => (
    <Pressable key={key} onPress={onPress} accessibilityRole="button" style={{width: 48, height: 48, margin: 3, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? c.primary : c.surface, borderWidth: 1, borderColor: selected ? c.primary : c.border}}>
      <Text style={{fontSize: 22, color: selected ? c.onPrimary : c.text}}>{label}</Text>
    </Pressable>
  );
  return (
    <Sheet visible onClose={onClose} title={title}>
      <Field label={t.collectionName} value={name} onChangeText={v => { setName(v); setError(''); }} autoFocus error={error} />
      <Text style={{fontSize: 13, color: c.sub, marginBottom: 8}}>{t.emoji}</Text>
      <View style={{flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12}}>
        {cell('none', '∅', !emoji, () => setEmoji(null))}
        {EMOJIS.map(e => cell(e, e, emoji === e, () => setEmoji(e)))}
      </View>
      <View style={{flexDirection: 'row', marginTop: 4}}>
        <Button kind="ghost" label={t.cancel} onPress={onClose} style={{flex: 1, marginRight: 10}} />
        <Button label={t.save} onPress={submit} style={{flex: 1}} />
      </View>
    </Sheet>
  );
}

function CoinCard({code, name, address}) {
  const {t, c} = useApp();
  return (
    <View style={{backgroundColor: c.surface, borderRadius: 18, borderWidth: 1, borderColor: c.border, padding: 16, marginBottom: 12}}>
      <View style={{flexDirection: 'row', alignItems: 'center'}}>
        <View style={{width: 40, height: 40, borderRadius: 20, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center'}}>
          <Text style={{color: c.onPrimary, fontSize: 11, fontWeight: '800'}}>{code}</Text>
        </View>
        <Text style={{flex: 1, marginLeft: 12, fontSize: 17, fontWeight: '700', color: c.text}}>{name}</Text>
        <Pressable
          onPress={() => { copyText(address); toast(t.copied); }}
          accessibilityRole="button"
          accessibilityLabel={t.copyAddress}
          hitSlop={8}
          style={{width: 44, height: 44, alignItems: 'center', justifyContent: 'center'}}>
          <Icon name="copy" size={22} color={c.text} />
        </Pressable>
      </View>
      <Text selectable style={{marginTop: 10, fontSize: 13, color: c.sub, fontFamily: 'monospace'}}>{address}</Text>
    </View>
  );
}

export function DonationModal({visible, onClose}) {
  const {t, c} = useApp();
  return (
    <Sheet visible={visible} onClose={onClose} title={t.donations}>
      <View style={{flexDirection: 'row', alignItems: 'center', backgroundColor: c.surface, borderRadius: 18, borderWidth: 1, borderColor: c.border, padding: 16, marginBottom: 14}}>
        <Icon name="heart" size={22} color={c.text} />
        <Text style={{flex: 1, marginLeft: 12, fontSize: 14, color: c.sub}}>{t.donationText}</Text>
      </View>
      <CoinCard code="XMR" name="Monero (XMR)" address={XMR_ADDRESS} />
      <CoinCard code="BTC" name="Bitcoin (BTC)" address={BTC_ADDRESS} />
      <Button kind="ghost" label={t.close} onPress={onClose} />
    </Sheet>
  );
}
