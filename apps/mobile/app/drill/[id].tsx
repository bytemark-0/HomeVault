import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MissingRecordView } from '../../src/components/MissingRecordView';
import { useHomeVault } from '../../src/context/HomeVaultContext';
import { DrillRunnerScreen } from '../../src/screens/DrillRunnerScreen';
import { colors } from '../../src/theme/colors';
import { writeDrillHistoryEntry } from '../../src/utils/drillHistoryStorage';
import {
  buildContinuityDrillScenario,
  buildContinuityPlaybookGuides,
  type ContinuityPlaybookTarget,
} from '../../src/utils/continuityPlaybooks';
import { navigateBackOrReplace } from '../../src/utils/navigation';

export default function DrillRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { appData, showToast } = useHomeVault();

  if (!appData) return null;

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
  const scenario = guide ? buildContinuityDrillScenario(guide) : null;

  if (!guide) {
    return (
      <SafeAreaView style={styles.safe}>
        <MissingRecordView
          title="Drill not found"
          detail="This drill is no longer available. Return to Emergency to open the current guided plans."
          actionLabel="Back to Emergency"
          onActionPress={() => router.replace('/(tabs)/emergency')}
        />
      </SafeAreaView>
    );
  }

  if (!scenario) {
    return (
      <SafeAreaView style={styles.safe}>
        <MissingRecordView
          title="Drill not available yet"
          detail="This playbook does not have a guided drill yet. Return to the playbook details to use the linked records directly."
          actionLabel="Back to playbook"
          onActionPress={() => router.replace(`/playbook/${guide.id}`)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <DrillRunnerScreen
        scenario={scenario}
        onBack={() => navigateBackOrReplace(`/playbook/${guide.id}`)}
        onComplete={(summary) => {
          void writeDrillHistoryEntry({
            propertyId: appData.property.id,
            guideId: guide.id,
            title: guide.title,
            category: guide.category,
            completedAt: summary.completedAt,
            outcome: summary.outcome,
            blockedCount: summary.blockedCount,
            confusingCount: summary.confusingCount,
            missingRecordCount: summary.missingRecordCount,
            reviewNeededCount: summary.reviewNeededCount,
          });
          showToast('Drill result saved to readiness history');
        }}
        onOpenTarget={handleOpenTarget}
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
