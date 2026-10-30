import React, {memo, useEffect, useState} from 'react';
import {Image, Pressable, Text, View} from 'react-native';
import {CollectionIcon, IconButton} from './ui';
import {useApp} from '../store';
import {hostOf} from '../lib/data';

function LinkCard({link: l, collection, onOpen, onEdit}) {
  const {t, c, settings, actions} = useApp();
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    if (settings.previews && !l.previewTried) actions.requestPreview(l.id);
  }, [settings.previews, l.previewTried, l.id]);

  const showImage = settings.previews && !!l.image && !broken;

  return (
    <Pressable
      onPress={() => onOpen(l)}
      onLongPress={() => onEdit(l)}
      accessibilityRole="link"
      style={{backgroundColor: c.surface, borderRadius: 18, borderWidth: 1, borderColor: c.border, padding: 14, marginBottom: 10}}>
      <View style={{flexDirection: 'row'}}>
        <View style={{flex: 1}}>
          <Text numberOfLines={2} style={{fontSize: 16, fontWeight: '600', color: c.text}}>{l.title}</Text>
          <Text numberOfLines={1} style={{fontSize: 13, color: c.sub, marginTop: 2}}>{hostOf(l.url)}</Text>
          {!!l.note && <Text numberOfLines={2} style={{fontSize: 14, color: c.text, marginTop: 8}}>{l.note}</Text>}
        </View>
        {showImage && (
          <Image
            source={{uri: l.image}}
            onError={() => setBroken(true)}
            resizeMode="cover"
            style={{width: 76, height: 76, borderRadius: 12, marginLeft: 12, backgroundColor: c.border}}
          />
        )}
      </View>
      <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 8}}>
        {collection ? (
          <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
            <CollectionIcon emoji={collection.emoji} size={16} color={c.sub} />
            <Text numberOfLines={1} style={{marginLeft: 6, fontSize: 12, color: c.sub, flexShrink: 1}}>{collection.name}</Text>
          </View>
        ) : <View style={{flex: 1}} />}
        <IconButton name="star" size={20} fill={l.favorite} color={l.favorite ? c.text : c.sub} label={t.favorite} onPress={() => actions.toggle(l.id, 'favorite')} />
        <IconButton name="checkCircle" size={20} color={l.read ? c.text : c.sub} label={t.markRead} onPress={() => actions.toggle(l.id, 'read')} />
        <IconButton name="edit" size={20} color={c.sub} label={t.editLink} onPress={() => onEdit(l)} />
      </View>
    </Pressable>
  );
}

export default memo(LinkCard);
