import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MissingRecordView } from '../../src/components/MissingRecordView';
import { useHomeVault } from '../../src/context/HomeVaultContext';
import { IncidentWorkspaceScreen } from '../../src/screens/IncidentWorkspaceScreen';
import { colors } from '../../src/theme/colors';
import {
  buildContinuityPlaybookGuides,
  type ContinuityPlaybookTarget,
} from '../../src/utils/continuityPlaybooks';
import { navigateBackOrReplace } from '../../src/utils/navigation';

export default function IncidentWorkspaceRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { appData, showToast } = useHomeVault();

  if (!appData) {
    return null;
  }

  const guides = buildContinuityPlaybookGuides({
    property: appData.property,
    assets: appData.assets,
    documents: appData.documents,
    accessItems: appData.accessItems,
    emergencyContacts: appData.emergencyContacts,
    importantAccounts: appData.importantAccounts,
    continuityPlaybooks: appData.continuityPlaybooks,
  });
  const guide = guides.find((candidate) => candidate.id === id);

  if (!guide) {
    return (
      <SafeAreaView style={styles.safe}>
        <MissingRecordView
          title="Incident workspace unavailable"
          detail="This incident playbook is no longer available. Return to Emergency to open the current guided plans."
          actionLabel="Back to Emergency"
          onActionPress={() => router.replace('/(tabs)/emergency')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <IncidentWorkspaceScreen
        documents={appData.documents}
        emergencyContacts={appData.emergencyContacts}
        guide={guide}
        property={appData.property}
        onBack={() => navigateBackOrReplace(`/playbook/${guide.id}`)}
        onOpenTarget={handleOpenTarget}
        onShared={(message) => showToast(message)}
      />
    </SafeAreaView>
  );
}

function handleOpenTarget(target: ContinuityPlaybookTarget) {
  switch (target.kind) {
    case 'access':
      router.push(`/access/${target.id}`);
      return;
    case 'account':
      router.push(`/account/${target.id}`);
      return;
    case 'asset':
      router.push(`/asset/${target.id}`);
      return;
    case 'contact':
      router.push(`/contact/${target.id}`);
      return;
    case 'document':
      router.push(`/document/${target.id}`);
      return;
    case 'new_access':
      router.push({ pathname: '/access/new', params: { category: target.category } });
      return;
    case 'new_account':
      router.push({ pathname: '/account/new', params: { kind: target.accountKind } });
      return;
    case 'screen':
      switch (target.screen) {
        case 'critical_documents':
          router.push({ pathname: '/(tabs)/documents', params: { collection: 'critical' } });
          return;
        case 'export':
          router.push(
            target.focus
              ? { pathname: '/export', params: { focus: target.focus } }
              : '/export',
          );
          return;
        case 'new_asset':
          router.push('/asset/new');
          return;
        case 'new_device':
          router.push({ pathname: '/asset/new', params: { mode: 'device' } });
          return;
        case 'emergency':
        default:
          router.push('/(tabs)/emergency');
      }
  }
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.page } });
