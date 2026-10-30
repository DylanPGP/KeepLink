import React, {createContext, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {ToastAndroid, useColorScheme} from 'react-native';
import {STRINGS, resolveLang} from './lib/i18n';
import {resolveTheme} from './lib/theme';
import {checkPin, getLocale} from './lib/native';
import {
  DEFAULT_SETTINGS, EMPTY_DATA, backupData, clearAllData, loadData, loadSettings, saveData, saveSettings,
} from './lib/storage';
import {cleanEmoji, hostOf, mergeImport, newId, normalizeUrl, urlKey} from './lib/data';
import {fetchPreview} from './lib/preview';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);
export const toast = msg => ToastAndroid.show(msg, ToastAndroid.SHORT);
export const lockGuard = {suspend: false};

export function AppProvider({children}) {
  const scheme = useColorScheme();
  const [ready, setReady] = useState(false);
  const [data, setData] = useState(EMPTY_DATA);
  const [settings, setSettingsState] = useState(DEFAULT_SETTINGS);
  const [sysLang, setSysLang] = useState('en');
  const dataRef = useRef(EMPTY_DATA);
  const settingsRef = useRef(DEFAULT_SETTINGS);
  settingsRef.current = settings;

  useEffect(() => {
    (async () => {
      const [d, s, l] = await Promise.all([loadData(), loadSettings(), getLocale()]);
      dataRef.current = d;
      settingsRef.current = s;
      setData(d);
      setSettingsState(s);
      setSysLang(l);
      setReady(true);
    })();
  }, []);

  const lang = resolveLang(settings.lang, sysLang);
  const t = STRINGS[lang];
  const c = useMemo(() => resolveTheme(settings.theme, scheme), [settings.theme, scheme]);

  const setSettings = patch => {
    const next = {...settingsRef.current, ...patch};
    settingsRef.current = next;
    setSettingsState(next);
    saveSettings(next).catch(() => {});
  };

  const actions = useMemo(() => {
    const commit = next => {
      dataRef.current = next;
      setData(next);
      saveData(next).catch(() => toast('Storage error'));
    };
    const nameTaken = (name, exceptId) =>
      dataRef.current.collections.some(
        x => x.id !== exceptId && x.name.toLowerCase() === name.toLowerCase(),
      );
    const linkDup = (url, exceptId) => {
      const k = urlKey(url);
      return dataRef.current.links.some(l => l.id !== exceptId && urlKey(l.url) === k);
    };
    const clean = p => {
      const url = normalizeUrl(p.url);
      return {
        url,
        title: (p.title || '').trim().slice(0, 200) || hostOf(url),
        note: (p.note || '').trim().slice(0, 2000),
        collectionId: p.collectionId || null,
        favorite: !!p.favorite,
        read: !!p.read,
      };
    };

    const queue = [];
    const queued = new Set();
    const failed = new Set();
    let running = 0;
    const runPreview = async id => {
      const l = dataRef.current.links.find(x => x.id === id);
      if (!l || l.previewTried) return;
      let image = null;
      try {
        image = await fetchPreview(l.url);
      } catch (e) {
        failed.add(id);
        return;
      }
      const cur = dataRef.current.links.find(x => x.id === id);
      if (!cur || cur.url !== l.url) return;
      commit({
        ...dataRef.current,
        links: dataRef.current.links.map(x => (x.id === id ? {...x, image, previewTried: true} : x)),
      });
    };
    const pump = () => {
      while (running < 2 && queue.length) {
        const id = queue.shift();
        running++;
        runPreview(id).finally(() => {
          running--;
          queued.delete(id);
          pump();
        });
      }
    };

    return {
      addLink(p) {
        const v = clean(p);
        if (linkDup(v.url)) return 'dup';
        commit({
          ...dataRef.current,
          links: [{id: newId(), createdAt: Date.now(), image: null, previewTried: false, ...v}, ...dataRef.current.links],
        });
        return 'ok';
      },
      updateLink(id, p) {
        const v = clean(p);
        if (linkDup(v.url, id)) return 'dup';
        commit({
          ...dataRef.current,
          links: dataRef.current.links.map(l =>
            l.id === id ? {...l, ...v, ...(l.url !== v.url ? {image: null, previewTried: false} : {})} : l,
          ),
        });
        return 'ok';
      },
      deleteLink(id) {
        commit({...dataRef.current, links: dataRef.current.links.filter(l => l.id !== id)});
      },
      toggle(id, key) {
        commit({...dataRef.current, links: dataRef.current.links.map(l => (l.id === id ? {...l, [key]: !l[key]} : l))});
      },
      addCollection(name, emoji) {
        const n = name.trim().slice(0, 60);
        if (!n) return 'empty';
        if (nameTaken(n)) return 'exists';
        commit({
          ...dataRef.current,
          collections: [...dataRef.current.collections, {id: newId(), name: n, emoji: cleanEmoji(emoji), createdAt: Date.now()}],
        });
        return 'ok';
      },
      updateCollection(id, name, emoji) {
        const n = name.trim().slice(0, 60);
        if (!n) return 'empty';
        if (nameTaken(n, id)) return 'exists';
        commit({
          ...dataRef.current,
          collections: dataRef.current.collections.map(x => (x.id === id ? {...x, name: n, emoji: cleanEmoji(emoji)} : x)),
        });
        return 'ok';
      },
      deleteCollection(id) {
        commit({
          collections: dataRef.current.collections.filter(x => x.id !== id),
          links: dataRef.current.links.map(l => (l.collectionId === id ? {...l, collectionId: null} : l)),
        });
      },
      importData(parsed) {
        const r = mergeImport(dataRef.current, parsed);
        backupData(dataRef.current);
        commit(r.data);
        return r;
      },
      async deleteAll() {
        dataRef.current = EMPTY_DATA;
        setData(EMPTY_DATA);
        await clearAllData();
        await saveData(EMPTY_DATA).catch(() => {});
      },
      requestPreview(id) {
        if (!settingsRef.current.previews || queued.has(id) || failed.has(id)) return;
        queued.add(id);
        queue.push(id);
        pump();
      },
    };
  }, []);

  const tryPin = async pin => {
    const s = settingsRef.current;
    const now = Date.now();
    if (s.lockUntil > now) return {ok: false, wait: Math.ceil((s.lockUntil - now) / 1000)};
    if (await checkPin(pin, s.pinRecord)) {
      if (s.pinFails || s.lockUntil) setSettings({pinFails: 0, lockUntil: 0});
      return {ok: true, wait: 0};
    }
    const fails = (s.pinFails || 0) + 1;
    const lockUntil = fails >= 5 ? now + 30000 * (fails - 4) : 0;
    setSettings({pinFails: fails, lockUntil});
    return {ok: false, wait: lockUntil ? Math.ceil((lockUntil - now) / 1000) : 0};
  };

  return (
    <Ctx.Provider value={{ready, t, c, lang, sysLang, settings, data, actions, setSettings, tryPin}}>
      {children}
    </Ctx.Provider>
  );
}
