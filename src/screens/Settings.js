import React, {useState} from 'react';
import {Alert, Linking, ScrollView, Switch, View} from 'react-native';
import {Button, Header, Option, Row, Section, Sheet} from '../components/ui';
import PinFlow from '../components/PinFlow';
import {lockGuard, toast, useApp} from '../store';
import {LANGUAGES, fmt, langName, resolveLang} from '../lib/i18n';
import {authenticateFingerprint, fingerprintStatus, pickFile, saveFile} from '../lib/native';
import {buildExport, parseImport, toCsv} from '../lib/data';
import {THEME_KEYS} from '../lib/theme';
import {GITHUB_URL, LICENSE_URL, VERSION} from '../lib/constants';

const stamp = () => new Date().toISOString().slice(0, 10);

export default function SettingsScreen({onBack, onDonate}) {
  const {t, lang, sysLang, settings, setSettings, data, actions} = useApp();
  const [sheet, setSheet] = useState(null);
  const [flow, setFlow] = useState(null);

  const themeNames = {
    system: t.themeSystem, beige: t.themeBeige, dark: t.themeDark,
    white: t.themeWhite, purple: t.themePurple, pink: t.themePink,
  };
  const themeLabel = themeNames[settings.theme] || themeNames.system;
  const langLabel = settings.lang === 'auto' ? `${t.auto} · ${langName(lang)}` : langName(settings.lang);
  const hasPin = !!settings.pinRecord;

  const openUrl = url => Linking.openURL(url).catch(() => toast(t.openError));

  const doExport = async kind => {
    setSheet(null);
    if (!data.links.length && !data.collections.length) {
      toast(t.nothingToExport);
      return;
    }
    lockGuard.suspend = true;
    try {
      const json = kind === 'json';
      const content = json ? JSON.stringify(buildExport(data), null, 2) : toCsv(data);
      const ok = await saveFile(`keeplink-${stamp()}.${kind}`, json ? 'application/json' : 'text/csv', content);
      if (ok) toast(t.exported);
    } catch (e) {
      toast(t.exportFailed);
    } finally {
      lockGuard.suspend = false;
    }
  };

  const doImport = async () => {
    let text;
    lockGuard.suspend = true;
    try {
      text = await pickFile();
    } catch (e) {
      toast(t.importFailed);
      return;
    } finally {
      lockGuard.suspend = false;
    }
    if (text == null) return;
    let parsed;
    try {
      parsed = parseImport(text);
    } catch (e) {
      Alert.alert(t.importLinks, t.importInvalid);
      return;
    }
    const r = actions.importData(parsed);
    Alert.alert(t.importLinks, fmt(t.importDone, {added: r.added, dups: r.duplicates, invalid: r.invalid}));
  };

  const toggleFingerprint = async on => {
    if (!on) {
      setSettings({biometric: false});
      return;
    }
    if (!hasPin) {
      toast(t.needPinFirst);
      return;
    }
    if ((await fingerprintStatus()) !== 'available') {
      toast(t.noFingerprint);
      return;
    }
    lockGuard.suspend = true;
    const ok = await authenticateFingerprint(t.unlockTitle, t.cancel);
    lockGuard.suspend = false;
    if (ok) setSettings({biometric: true});
  };

  const wipe = async () => {
    await actions.deleteAll();
    toast(t.deleteAllDone);
  };

  const confirmWipe = () =>
    Alert.alert(t.deleteAllTitle, t.deleteAllBody, [
      {text: t.cancel, style: 'cancel'},
      {
        text: t.deleteAll,
        style: 'destructive',
        onPress: () => (hasPin ? setFlow({mode: 'authorize', onDone: wipe}) : wipe()),
      },
    ]);

  return (
    <View style={{flex: 1}}>
      <Header title={t.settings} onBack={onBack} />
      <ScrollView contentContainerStyle={{paddingHorizontal: 16, paddingBottom: 40}}>
        <Section title={t.appearance}>
          <Row icon="globe" label={t.language} value={langLabel} onPress={() => setSheet('lang')} />
          <Row icon="drop" label={t.style} value={themeLabel} onPress={() => setSheet('theme')} />
          <Row
            icon="image"
            label={t.previews}
            sub={t.previewsHint}
            last
            right={<Switch value={settings.previews} onValueChange={v => setSettings({previews: v})} />}
          />
        </Section>
        <Section title={t.data}>
          <Row icon="upload" label={t.exportLinks} onPress={() => setSheet('export')} />
          <Row icon="download" label={t.importLinks} onPress={doImport} last />
        </Section>
        <Section title={t.about}>
          <Row icon="code" label={t.reviewCode} onPress={() => openUrl(GITHUB_URL)} />
          <Row icon="file" label={t.license} value="GNU GPL v3" onPress={() => openUrl(LICENSE_URL)} />
          <Row icon="heart" label={t.donations} onPress={onDonate} />
          <Row icon="info" label={t.version} value={VERSION} last />
        </Section>
        <Section title={t.privacy}>
          <Row
            icon="shield"
            label={t.fingerprint}
            sub={t.fingerprintHint}
            right={<Switch value={settings.biometric && hasPin} onValueChange={toggleFingerprint} />}
          />
          <Row
            icon="lock"
            label={t.pinSecurity}
            value={hasPin ? t.pinOn : t.pinOff}
            onPress={() => (hasPin ? setSheet('pin') : setFlow({mode: 'create'}))}
          />
          <Row icon="trash" label={t.deleteAll} danger onPress={confirmWipe} last />
        </Section>
      </ScrollView>

      <Sheet visible={sheet === 'lang'} onClose={() => setSheet(null)} title={t.language}>
        <Option
          label={`${t.auto} · ${langName(resolveLang('auto', sysLang))}`}
          selected={settings.lang === 'auto'}
          onPress={() => { setSettings({lang: 'auto'}); setSheet(null); }}
        />
        {LANGUAGES.map(l => (
          <Option key={l.code} label={l.name} selected={settings.lang === l.code} onPress={() => { setSettings({lang: l.code}); setSheet(null); }} />
        ))}
      </Sheet>

      <Sheet visible={sheet === 'theme'} onClose={() => setSheet(null)} title={t.style}>
        {THEME_KEYS.map(key => (
          <Option key={key} label={themeNames[key]} selected={(themeNames[settings.theme] ? settings.theme : 'system') === key} onPress={() => { setSettings({theme: key}); setSheet(null); }} />
        ))}
      </Sheet>

      <Sheet visible={sheet === 'export'} onClose={() => setSheet(null)} title={t.chooseFormat}>
        <Button label="JSON" onPress={() => doExport('json')} style={{marginBottom: 10}} />
        <Button kind="ghost" label="CSV" onPress={() => doExport('csv')} />
      </Sheet>

      <Sheet visible={sheet === 'pin'} onClose={() => setSheet(null)} title={t.pinSecurity}>
        <Button label={t.changePin} onPress={() => { setSheet(null); setFlow({mode: 'change'}); }} style={{marginBottom: 10}} />
        <Button kind="danger" label={t.removePin} onPress={() => { setSheet(null); setFlow({mode: 'remove'}); }} />
      </Sheet>

      {flow && <PinFlow mode={flow.mode} onDone={flow.onDone} onClose={() => setFlow(null)} />}
    </View>
  );
}
