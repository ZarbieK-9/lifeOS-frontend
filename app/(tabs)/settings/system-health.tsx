import React, { useEffect, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Activity, KeyRound } from 'lucide-react-native';
import { RowCard, ScreenContainer } from '@/src/components/layout';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { kv } from '@/src/db/mmkv';
import { api } from '@/src/services/api';

export default function SystemHealthScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const mqttConnected = kv.getBool('mqtt_connected');
  const [ciRunNumber, setCiRunNumber] = useState<string | null>(null);
  const [ciRunUrl, setCiRunUrl] = useState<string | null>(null);
  const [gitVersion, setGitVersion] = useState<string | null>(null);
  const [gitCommit, setGitCommit] = useState<string | null>(null);
  const [buildTime, setBuildTime] = useState<string | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = await api.health();
      if (cancelled) return;
      setHealthLoading(false);
      if (r.ok) {
        const n = r.data.ci_run_number?.trim();
        const u = r.data.ci_run_url?.trim();
        setCiRunNumber(n && n.length > 0 ? n : null);
        setCiRunUrl(u && u.length > 0 ? u : null);
        const v = r.data.version?.trim();
        const c = r.data.git_commit?.trim();
        const t = r.data.build_time?.trim();
        setGitVersion(v && v.length > 0 ? v : null);
        setGitCommit(c && c.length > 0 ? c : null);
        setBuildTime(t && t.length > 0 ? t : null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ScreenContainer scroll>
      <View style={ss.header}>
        <Text style={[ss.title, { color: theme.text }]}>System Health</Text>
        <Text style={[ss.sub, { color: theme.textSecondary }]}>
          Diagnostics and technical runtime status.
        </Text>
        <Text style={[ss.badge, { color: mqttConnected ? theme.success : theme.warn }]}>
          MQTT: {mqttConnected ? 'Connected' : 'Disconnected'}
        </Text>
        {!healthLoading && (gitVersion != null || gitCommit != null) && (
          <Text style={[ss.ciLine, { color: theme.textSecondary }]}>
            Backend{' '}
            {gitVersion != null ? <Text style={{ color: theme.text }}>{gitVersion}</Text> : null}
            {gitCommit != null ? (
              <Text style={{ color: theme.textSecondary }}>
                {' '}
                ({gitCommit.length > 14 ? `${gitCommit.slice(0, 14)}…` : gitCommit})
              </Text>
            ) : null}
            {buildTime != null ? (
              <Text style={{ color: theme.textSecondary }}>{`\nBuilt ${buildTime}`}</Text>
            ) : null}
          </Text>
        )}
        {!healthLoading && ciRunNumber != null && (
          <Text style={[ss.ciLine, { color: theme.textSecondary }]}>
            CI/CD run #{ciRunNumber}
            {ciRunUrl ? (
              <Text style={{ color: theme.primary }} onPress={() => Linking.openURL(ciRunUrl!)}>
                {' '}
                (open in GitHub)
              </Text>
            ) : null}
          </Text>
        )}
        {!healthLoading && ciRunNumber == null && api.isConfigured() && (
          <Text style={[ss.ciLine, { color: theme.textSecondary }]}>
            CI/CD run: not set (deploy from GitHub Actions to record)
          </Text>
        )}
      </View>
      <RowCard
        title="Latency diagnostics"
        subtitle="p50/p95 route, plan, validate, tool, post-process"
        onPress={() => router.push('/settings/latency-diagnostics')}
        left={<Activity size={18} color={theme.primary} strokeWidth={1.8} />}
        variant="outlined"
      />
      <RowCard
        title="API keys"
        subtitle="Tasker, IFTTT, webhooks"
        onPress={() => router.push('/settings/api-keys')}
        left={<KeyRound size={18} color={theme.primary} strokeWidth={1.8} />}
        variant="outlined"
      />
    </ScreenContainer>
  );
}

const ss = StyleSheet.create({
  header: { marginBottom: 14, gap: 5 },
  title: { fontSize: 28, fontWeight: '700' },
  sub: { fontSize: 14, lineHeight: 20 },
  badge: { fontSize: 13, fontWeight: '600' },
  ciLine: { fontSize: 13, lineHeight: 20, marginTop: 4 },
});

