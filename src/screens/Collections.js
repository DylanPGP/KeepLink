import React, {useMemo, useState} from 'react';
import {Alert, FlatList, Pressable, Text, View} from 'react-native';
import {CollectionIcon, Empty, Fab, Header, Icon, IconButton} from '../components/ui';
import {NamePrompt} from '../components/modals';
import LinksList from './LinksList';
import {useApp} from '../store';
import {fmt} from '../lib/i18n';

export function CollectionsScreen({onOpen, onSettings}) {
  const {t, c, data, actions} = useApp();
  const [creating, setCreating] = useState(false);
  const counts = useMemo(() => {
    const m = new Map();
    data.links.forEach(l => l.collectionId && m.set(l.collectionId, (m.get(l.collectionId) || 0) + 1));
    return m;
  }, [data.links]);

  return (
    <View style={{flex: 1}}>
      <Header title={t.collections} right={<IconButton name="gear" label={t.settings} onPress={onSettings} />} />
      <FlatList
        data={data.collections}
        keyExtractor={x => x.id}
        contentContainerStyle={{paddingHorizontal: 16, paddingBottom: 170}}
        ListEmptyComponent={<Empty icon="folder" title={t.emptyCollectionsTitle} body={t.emptyCollectionsBody} />}
        renderItem={({item: x}) => (
          <Pressable onPress={() => onOpen(x.id)} accessibilityRole="button" style={{flexDirection: 'row', alignItems: 'center', backgroundColor: c.surface, borderRadius: 18, borderWidth: 1, borderColor: c.border, padding: 16, marginBottom: 10}}>
            <CollectionIcon emoji={x.emoji} size={24} />
            <View style={{flex: 1, marginLeft: 14}}>
              <Text numberOfLines={1} style={{fontSize: 16, fontWeight: '600', color: c.text}}>{x.name}</Text>
              <Text style={{fontSize: 13, color: c.sub, marginTop: 2}}>{fmt(t.linksCount, {n: counts.get(x.id) || 0})}</Text>
            </View>
            <Icon name="chevron" size={18} color={c.sub} />
          </Pressable>
        )}
      />
      <Fab label={t.newCollection} bottom={96} onPress={() => setCreating(true)} />
      {creating && (
        <NamePrompt title={t.newCollection} onSubmit={(n, e) => actions.addCollection(n, e)} onClose={() => setCreating(false)} />
      )}
    </View>
  );
}

export function CollectionDetail({id, onBack}) {
  const {t, data, actions} = useApp();
  const [renaming, setRenaming] = useState(false);
  const col = data.collections.find(x => x.id === id);
  if (!col) return null;

  const remove = () =>
    Alert.alert(t.deleteCollectionTitle, t.deleteCollectionBody, [
      {text: t.cancel, style: 'cancel'},
      {
        text: t.delete,
        style: 'destructive',
        onPress: () => {
          actions.deleteCollection(id);
          onBack();
        },
      },
    ]);

  return (
    <View style={{flex: 1}}>
      <Header
        title={(col.emoji ? col.emoji + ' ' : '') + col.name}
        onBack={onBack}
        right={
          <View style={{flexDirection: 'row'}}>
            <IconButton name="edit" label={t.renameCollection} onPress={() => setRenaming(true)} />
            <IconButton name="trash" label={t.delete} onPress={remove} />
          </View>
        }
      />
      <LinksList collectionId={id} />
      {renaming && (
        <NamePrompt
          title={t.renameCollection}
          initial={col.name}
          initialEmoji={col.emoji}
          onSubmit={(n, e) => actions.updateCollection(id, n, e)}
          onClose={() => setRenaming(false)}
        />
      )}
    </View>
  );
}
