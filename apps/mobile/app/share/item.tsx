import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';

import { MissingRecordView } from '../../src/components/MissingRecordView';
import { useHomeVault } from '../../src/context/HomeVaultContext';
import { ItemShareScreen } from '../../src/screens/ItemShareScreen';
import { colors } from '../../src/theme/colors';
import { confirmLocalStepUp } from '../../src/utils/localStepUpAuth';
import { navigateBackOrReplace } from '../../src/utils/navigation';
import {
  buildItemShareDraft,
  createEncryptedItemShareBundle,
  createItemShareFileName,
  getDefaultItemShareFieldIds,
  getItemShareSupportMessage,
  shareItemShareBundle,
  type SupportedItemShareRecordType,
} from '../../src/utils/itemShare';
import { HOMEVAULT_ITEM_SHARE_AUDIENCES, formatHomeVaultItemShareBundle } from '@homevault/export';

export default function ItemShareRoute() {
  const { id, recordType } = useLocalSearchParams<{
    id: string;
    recordType: SupportedItemShareRecordType;
  }>();
  const { appData, showToast } = useHomeVault();
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [expiryDays, setExpiryDays] = useState(7);
  const [senderLabel, setSenderLabel] = useState(appData ? `${appData.property.label} organizer` : 'Home organizer');
  const target = useMemo(() => {
    if (!appData) {
      return null;
    }

    switch (recordType) {
      case 'document': {
        const record = appData.documents.find((document) => document.id === id);
        return record ? { recordType, record } : null;
      }
      case 'asset': {
        const record = appData.assets.find((asset) => asset.id === id);
        return record ? { recordType, record } : null;
      }
      case 'emergency_contact': {
        const record = appData.emergencyContacts.find((contact) => contact.id === id);
        return record ? { recordType, record } : null;
      }
      case 'important_account': {
        const record = appData.importantAccounts.find((account) => account.id === id);
        return record ? { recordType, record } : null;
      }
      case 'access_item':
      default: {
        const record = appData.accessItems.find((accessItem) => accessItem.id === id);
        return record ? { recordType: 'access_item' as const, record } : null;
      }
    }
  }, [appData, id, recordType]);
  const draft = useMemo(() => (target ? buildItemShareDraft(target) : null), [target]);
  const [audienceKey, setAudienceKey] = useState(draft?.defaultAudienceKey ?? 'spouse');
  const [selectedFieldIds, setSelectedFieldIds] = useState<string[]>(
    draft ? getDefaultItemShareFieldIds(draft, draft.defaultAudienceKey) : [],
  );
  const [passphrase, setPassphrase] = useState('');
  const fallbackRoute = (() => {
    switch (recordType) {
      case 'document':
        return '/(tabs)/documents';
      case 'asset':
        return '/(tabs)/devices';
      case 'important_account':
        return '/(tabs)/emergency';
      case 'emergency_contact':
        return '/contact';
      case 'access_item':
      default:
        return '/(tabs)/access';
    }
  })();

  useEffect(() => {
    if (!draft || !appData) {
      return;
    }

    setAudienceKey(draft.defaultAudienceKey);
    setSelectedFieldIds(getDefaultItemShareFieldIds(draft, draft.defaultAudienceKey));
    setSenderLabel(`${appData.property.label} organizer`);
  }, [appData, draft]);

  if (!appData || !draft || !target) {
    return (
      <SafeAreaView style={styles.safe}>
        <MissingRecordView
          title="Shareable item not found"
          detail="This record is no longer available to share. Return to the previous screen and choose another item."
          actionLabel="Go back"
          onActionPress={() => navigateBackOrReplace(fallbackRoute)}
        />
      </SafeAreaView>
    );
  }

  const resolvedDraft = draft;
  const resolvedTarget = target;
  const resolvedProperty = appData.property;

  const supportMessage = getItemShareSupportMessage();
  const canExport =
    senderLabel.trim().length > 0 &&
    passphrase.trim().length >= 8 &&
    selectedFieldIds.length > 0 &&
    !supportMessage;

  function handleAudienceChange(nextAudienceKey: typeof audienceKey) {
    setAudienceKey(nextAudienceKey);
    setSelectedFieldIds(getDefaultItemShareFieldIds(resolvedDraft, nextAudienceKey));
  }

  function handleFieldToggle(fieldId: string) {
    setSelectedFieldIds((current) =>
      current.includes(fieldId) ? current.filter((id) => id !== fieldId) : [...current, fieldId],
    );
  }

  async function handleExport() {
    try {
      if (resolvedDraft.sensitivityLevel === 'high') {
        const confirmed = await confirmLocalStepUp({
          alertTitle: 'Export encrypted item share?',
          alertMessage:
            'This item includes high-risk household details. If device authentication is unavailable in this preview, confirm locally before exporting the encrypted bundle.',
          confirmLabel: 'Export',
          authPromptMessage: `Authenticate to export ${resolvedDraft.title}`,
        });

        if (!confirmed) {
          return;
        }
      }

      const bundle = await createEncryptedItemShareBundle({
        audienceKey,
        draft: resolvedDraft,
        expiresInDays: expiryDays,
        passphrase,
        property: resolvedProperty,
        senderLabel,
        target: resolvedTarget,
        selectedFieldIds,
      });
      const bundleText = formatHomeVaultItemShareBundle(bundle);
      const result = await shareItemShareBundle(bundleText, createItemShareFileName(resolvedDraft));

      setExportStatus(
        result === 'downloaded'
          ? 'Encrypted item bundle downloaded.'
          : 'Encrypted item bundle shared.',
      );
      showToast(result === 'downloaded' ? 'Encrypted item bundle downloaded' : 'Encrypted item bundle shared');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not export the encrypted item bundle.';
      setExportStatus(message);
      showToast(message, 'error');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ItemShareScreen
        audienceKey={audienceKey}
        audienceOptions={HOMEVAULT_ITEM_SHARE_AUDIENCES}
        canExport={canExport}
        draft={resolvedDraft}
        exportLabel="Export encrypted bundle"
        exportStatus={exportStatus}
        expiryDays={expiryDays}
        onAudienceChange={handleAudienceChange}
        onBack={() => navigateBackOrReplace(fallbackRoute)}
        onExpiryDaysChange={setExpiryDays}
        onExport={() => void handleExport()}
        onFieldToggle={handleFieldToggle}
        onPassphraseChange={setPassphrase}
        onSenderLabelChange={setSenderLabel}
        passphrase={passphrase}
        selectedFieldIds={selectedFieldIds}
        senderLabel={senderLabel}
        supportMessage={supportMessage}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.page,
  },
});
