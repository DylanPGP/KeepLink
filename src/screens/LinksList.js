import React, {useMemo, useState} from 'react';
import {Alert, FlatList, Linking, Pressable, ScrollView, Text, TextInput, View} from 'react-native';
import {Empty, Fab, Icon} from '../components/ui';
import LinkCard from '../components/LinkCard';
import {LinkEditor} from '../components/modals';
import {toast, useApp} from '../store';

const FILTERS = ['all', 'unread', 'read', 'favorites'];

export default function LinksList({collectionId = null}) {
  const {t, c, data, actions} = useApp();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState(false);

  const cols = useMemo(() => new Map(data.collections.map(x => [x.id, x])), [data.collections]);
  const scope = useMemo(
    () => data.links.filter(l => !collectionId || l.collectionId === collectionId),
    [data.links, collectionId],
  );
  const items = useMemo(() => {
    const s = q.trim().toLowerCase();
    return scope
      .filter(l => {
        if (filter === 'unread' && l.read) return false;
        if (filter === 'read' && !l.read) return false;
        if (filter === 'favorites' && !l.favorite) return false;
        return !s || (l.title + ' ' + l.url + ' ' + l.note).toLowerCase().includes(s);
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [scope, q, filter]);

  const open = l => Linking.openURL(l.url).catch(() => toast(t.openError));

  const confirmDelete = l =>
    Alert.alert(t.deleteLinkTitle, t.deleteLinkBody, [
      {text: t.cancel, style: 'cancel'},
      {
        text: t.delete,
        style: 'destructive',
        onPress: () => {
          actions.deleteLink(l.id);
          setEditing(false);
        },
      },
    ]);

  const renderItem = ({item: l}) => (
    <LinkCard link={l} collection={collectionId ? null : cols.get(l.collectionId)} onOpen={open} onEdit={setEditing} />
  );

  return (
    <View style={{flex: 1}}>
      <View style={{marginHorizontal: 16, height: 48, borderRadius: 16, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14}}>
        <Icon name="search" size={18} color={c.sub} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder={t.searchLinks}
          placeholderTextColor={c.sub}
          autoCapitalize="none"
          autoCorrect={false}
          style={{flex: 1, marginLeft: 10, fontSize: 16, color: c.text, paddingVertical: 0}}
        />
      </View>
      <View style={{height: 52}}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: 16, alignItems: 'center'}}>
          {FILTERS.map(f => {
            const on = filter === f;
            return (
              <Pressable key={f} onPress={() => setFilter(f)} accessibilityRole="button" style={{height: 36, paddingHorizontal: 16, borderRadius: 18, justifyContent: 'center', marginRight: 8, marginTop: 8, backgroundColor: on ? c.primary : 'transparent', borderWidth: 1, borderColor: on ? c.primary : c.border}}>
                <Text style={{fontSize: 14, color: on ? c.onPrimary : c.text}}>{t[f]}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
      <FlatList
        data={items}
        keyExtractor={l => l.id}
        renderItem={renderItem}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{paddingHorizontal: 16, paddingTop: 4, paddingBottom: 170}}
        ListEmptyComponent={
          scope.length === 0
            ? <Empty icon="link" title={collectionId ? t.emptyCollectionLinks : t.emptyLinksTitle} body={t.emptyLinksBody} />
            : <Empty icon="search" title={t.emptySearch} />
        }
      />
      <Fab label={t.addLink} bottom={collectionId ? 24 : 96} onPress={() => setEditing(null)} />
      {editing !== false && (
        <LinkEditor
          link={editing || null}
          defaultCollectionId={collectionId}
          onClose={() => setEditing(false)}
          onDelete={confirmDelete}
        />
      )}
    </View>
  );
}
