import React, {useEffect, useRef, useState} from 'react';
import {AppState, BackHandler, Image, Pressable, StatusBar, Text, View} from 'react-native';
import {AppProvider, lockGuard, useApp} from './src/store';
import {Header, Icon, IconButton} from './src/components/ui';
import {DonationModal} from './src/components/modals';
import LockScreen from './src/components/LockScreen';
import LinksList from './src/screens/LinksList';
import {CollectionDetail, CollectionsScreen} from './src/screens/Collections';
import SettingsScreen from './src/screens/Settings';

const RELOCK_AFTER_MS = 30000;

function TabBar({tab, setTab}) {
  const {t, c} = useApp();
  const tabs = [
    ['links', 'link', t.links],
    ['collections', 'folder', t.collections],
  ];
  return (
    <View pointerEvents="box-none" style={{position: 'absolute', left: 0, right: 0, bottom: 16, alignItems: 'center'}}>
      <View style={{flexDirection: 'row', padding: 6, borderRadius: 32, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, elevation: 4}}>
        {tabs.map(([key, icon, label]) => {
          const on = tab === key;
          return (
            <Pressable
              key={key}
              onPress={() => setTab(key)}
              accessibilityRole="tab"
              accessibilityState={{selected: on}}
              style={{flexDirection: 'row', alignItems: 'center', height: 48, paddingHorizontal: 22, borderRadius: 26, backgroundColor: on ? c.bg : 'transparent', borderWidth: on ? 1 : 0, borderColor: c.border}}>
              <Icon name={icon} size={22} color={on ? c.text : c.sub} />
              <Text style={{marginLeft: 8, fontSize: 15, fontWeight: on ? '700' : '500', color: on ? c.text : c.sub}}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Root() {
  const {ready, c, t, settings, setSettings} = useApp();
  const [tab, setTab] = useState('links');
  const [overlay, setOverlay] = useState(null);
  const [donate, setDonate] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const leftAt = useRef(0);

  const locked = ready && !!settings.pinRecord && !unlocked;

  useEffect(() => {
    if (!ready) return;
    if (!settings.pinRecord) setUnlocked(true);
    if (!settings.donationSeen) setDonate(true);
  }, [ready]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'background') leftAt.current = Date.now();
      else if (state === 'active') {
        if (leftAt.current && !lockGuard.suspend && Date.now() - leftAt.current > RELOCK_AFTER_MS) setUnlocked(false);
        leftAt.current = 0;
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (locked) return false;
      if (overlay) {
        setOverlay(null);
        return true;
      }
      if (tab !== 'links') {
        setTab('links');
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [overlay, tab, locked]);

  const closeDonate = () => {
    setDonate(false);
    if (!settings.donationSeen) setSettings({donationSeen: true});
  };

  const gear = <IconButton name="gear" label={t.settings} onPress={() => setOverlay({type: 'settings'})} />;
  const logo = <Image source={{uri: 'ic_launcher_foreground'}} style={{width: 34, height: 34, borderRadius: 8}} />;

  let body = null;
  if (!ready) body = null;
  else if (locked) body = <LockScreen onUnlock={() => setUnlocked(true)} />;
  else if (overlay && overlay.type === 'settings') body = <SettingsScreen onBack={() => setOverlay(null)} onDonate={() => setDonate(true)} />;
  else if (overlay && overlay.type === 'collection') body = <CollectionDetail id={overlay.id} onBack={() => setOverlay(null)} />;
  else if (tab === 'links') {
    body = (
      <View style={{flex: 1}}>
        <Header title="KeepLink" logo={logo} right={gear} />
        <LinksList />
      </View>
    );
  } else body = <CollectionsScreen onOpen={id => setOverlay({type: 'collection', id})} onSettings={() => setOverlay({type: 'settings'})} />;

  return (
    <View style={{flex: 1, backgroundColor: c.bg}}>
      <StatusBar barStyle={c.dark ? 'light-content' : 'dark-content'} backgroundColor={c.bg} />
      {body}
      {ready && !locked && !overlay && <TabBar tab={tab} setTab={setTab} />}
      {ready && !locked && <DonationModal visible={donate} onClose={closeDonate} />}
    </View>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Root />
    </AppProvider>
  );
}
