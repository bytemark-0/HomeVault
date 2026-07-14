import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import type { DocumentRecord } from '@homevault/domain';
import { SectionTitle } from '../components/SectionTitle';
import { formatDocumentAttachmentStatus } from '../data/documentAttachmentLabels';
import type { AssetListItem, DocumentListItem, RoomListItem } from '../data/homeVaultSampleData';
import { colors } from '../theme/colors';
import {
  type DocumentCollectionFilter,
  getDocumentReadinessLabel,
  isCriticalDocument,
  isInsuranceDocument,
  matchesDocumentCollection,
} from '../utils/documentTaxonomy';

export type DocumentReviewFilter = 'missingAttachments' | 'missingAssetDocumentation';

type DocumentsScreenProps = {
  assets?: AssetListItem[];
  rooms?: RoomListItem[];
  propertyId?: string;
  documents: DocumentListItem[];
  documentCount: number;
  collection?: DocumentCollectionFilter | null;
  reviewFilter?: DocumentReviewFilter | null;
  onAddDocument: () => void;
  onAddDocumentOfType?: (type: DocumentRecord['type']) => void;
  onAddDocumentForRecord?: (recordId: string) => void;
  onClearCollection?: () => void;
  onClearReviewFilter?: () => void;
  onDocumentPress: (documentId: string) => void;
  onShareDocument?: (documentId: string) => void;
};

const collectionFilters: Array<{ label: string; value: DocumentCollectionFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Insurance', value: 'insurance' },
  { label: 'Warranty', value: 'warranty' },
  { label: 'Manual', value: 'manual' },
  { label: 'Critical', value: 'critical' },
  { label: 'General', value: 'general' },
];

export function DocumentsScreen({
  assets = [],
  rooms = [],
  propertyId,
  documents,
  documentCount,
  collection,
  reviewFilter,
  onAddDocument,
  onAddDocumentOfType,
  onAddDocumentForRecord,
  onClearCollection,
  onClearReviewFilter,
  onDocumentPress,
  onShareDocument,
}: DocumentsScreenProps) {
  const [query, setQuery] = useState('');
  const [activeCollection, setActiveCollection] = useState<DocumentCollectionFilter>(
    collection ?? 'all',
  );
  const [activeLinkedRecordId, setActiveLinkedRecordId] = useState('');
  const missingDocumentAssets = useMemo(
    () => assets.filter((asset) => asset.documentCount === 0),
    [assets],
  );
  const insuranceDocuments = useMemo(
    () => documents.filter((document) => isInsuranceDocument(document)),
    [documents],
  );
  const criticalDocuments = useMemo(
    () => documents.filter((document) => isCriticalDocument(document)),
    [documents],
  );
  const collectionCount = useMemo(
    () => documents.filter((document) => matchesDocumentCollection(document, activeCollection)).length,
    [activeCollection, documents],
  );

  useEffect(() => {
    setActiveCollection(collection ?? 'all');
  }, [collection]);

  const linkedRecordOptions = useMemo(() => {
    const linkedIds = new Set(documents.flatMap((d) => d.linkedRecordIds));
    const options: Array<{ id: string; label: string }> = [{ id: '', label: 'All' }];

    for (const asset of assets) {
      if (linkedIds.has(asset.id)) {
        options.push({ id: asset.id, label: asset.name });
      }
    }

    for (const room of rooms) {
      if (linkedIds.has(room.id)) {
        options.push({ id: room.id, label: room.name });
      }
    }

    if (propertyId && linkedIds.has(propertyId)) {
      options.push({ id: propertyId, label: 'Property' });
    }

    return options;
  }, [assets, documents, propertyId, rooms]);

  const filteredDocuments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return documents.filter((document) => {
      const matchesType = matchesDocumentCollection(document, activeCollection);
      const matchesLinkedRecord =
        activeLinkedRecordId === '' || document.linkedRecordIds.includes(activeLinkedRecordId);
      const matchesReviewFilter =
        reviewFilter !== 'missingAttachments' || !getDocumentAttachmentUri(document);
      const searchableText = [
        document.title,
        document.typeLabel,
        document.linkedToLabel,
        document.dateLabel,
        document.vendor ?? '',
        document.filePath ?? '',
        document.attachment?.fileName ?? '',
        document.attachment?.mimeType ?? '',
        document.ocrText ?? '',
      ]
        .join(' ')
        .toLowerCase();
      const matchesQuery = normalizedQuery.length === 0 || searchableText.includes(normalizedQuery);

      return matchesType && matchesLinkedRecord && matchesReviewFilter && matchesQuery;
    });
  }, [activeCollection, activeLinkedRecordId, documents, query, reviewFilter]);
  const isMissingAssetDocumentationFilter = reviewFilter === 'missingAssetDocumentation';

  return (
    <View style={styles.screen}>
      <View style={styles.documentVault}>
        <Text style={styles.kicker}>
          {reviewFilter ? 'Readiness review' : 'Document vault'}
        </Text>
        <Text style={styles.focusTitle}>
          {formatFocusTitle(
            reviewFilter,
            activeCollection,
            collectionCount,
            missingDocumentAssets.length,
          )}
        </Text>
        <Text style={styles.focusMeta}>
          {formatFocusMeta(reviewFilter, activeCollection)}
        </Text>
        <View style={styles.focusActions}>
          {reviewFilter && onClearReviewFilter ? (
            <Pressable
              onPress={onClearReviewFilter}
              style={styles.clearReviewButton}
              accessibilityRole="button"
            >
              <Text style={styles.clearReviewText}>Show all documents</Text>
            </Pressable>
          ) : null}
          {collection && onClearCollection ? (
            <Pressable
              onPress={onClearCollection}
              style={styles.clearReviewButton}
              accessibilityRole="button"
            >
              <Text style={styles.clearReviewText}>Clear collection</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {!reviewFilter ? (
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{insuranceDocuments.length}</Text>
            <Text style={styles.summaryLabel}>insurance records</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>
              {documents.filter((document) => document.type === 'warranty').length}
            </Text>
            <Text style={styles.summaryLabel}>warranty files</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{criticalDocuments.length}</Text>
            <Text style={styles.summaryLabel}>critical files</Text>
          </View>
        </View>
      ) : null}

      {!reviewFilter ? (
        <View style={styles.quickActionRow}>
          <Pressable
            onPress={() => {
              if (onAddDocumentOfType) {
                onAddDocumentOfType('insurance');
              } else {
                onAddDocument();
              }
            }}
            style={[styles.quickActionCard, styles.quickActionCardPrimary]}
            accessibilityRole="button"
          >
            <Text style={styles.quickActionTitlePrimary}>Save insurance policy</Text>
            <Text style={styles.quickActionDetailPrimary}>
              Keep claim, provider, and policy files easy to find.
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              if (onAddDocumentOfType) {
                onAddDocumentOfType('warranty');
              } else {
                onAddDocument();
              }
            }}
            style={styles.quickActionCard}
            accessibilityRole="button"
          >
            <Text style={styles.quickActionTitle}>Add warranty file</Text>
            <Text style={styles.quickActionDetail}>
              Save coverage paperwork, manuals, or emergency reference files.
            </Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.searchBox}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search policy, warranty, vendor, or device"
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
        />
      </View>

      <View style={styles.filterRow}>
        {collectionFilters.map((filter) => {
          const isActive = filter.value === activeCollection;

          return (
            <Pressable
              key={filter.value}
              onPress={() => setActiveCollection(filter.value)}
              style={[styles.filterPill, isActive && styles.filterPillActive]}
              accessibilityRole="button"
            >
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {linkedRecordOptions.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.linkedRecordRow}
        >
          {linkedRecordOptions.map((option) => {
            const isActive = option.id === activeLinkedRecordId;

            return (
              <Pressable
                key={option.id}
                onPress={() => setActiveLinkedRecordId(option.id)}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                accessibilityRole="button"
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <SectionTitle title="Coverage and recovery files" action="Add file" onActionPress={onAddDocument} />
      {isMissingAssetDocumentationFilter ? (
        missingDocumentAssets.length > 0 ? (
          missingDocumentAssets.map((asset) => (
            <View key={asset.id} style={styles.reviewRow}>
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>{asset.name}</Text>
                <Text style={styles.rowMeta}>
                  {asset.category} · {asset.roomName}
                </Text>
                <Text style={styles.fileMeta}>No linked documents</Text>
              </View>
              <Pressable
                onPress={() => {
                  if (onAddDocumentForRecord) {
                    onAddDocumentForRecord(asset.id);
                  } else {
                    onAddDocument();
                  }
                }}
                style={styles.rowAction}
                accessibilityRole="button"
                accessibilityLabel="Add document"
              >
                <Text style={styles.rowActionText}>Add</Text>
              </Pressable>
            </View>
          ))
        ) : (
          <View style={styles.emptyPanel}>
            <Text style={styles.emptyTitle}>Every key device has backup paperwork</Text>
            <Text style={styles.emptyText}>
              Each tracked device currently has at least one linked record.
            </Text>
          </View>
        )
      ) : documents.length === 0 ? (
        <View style={styles.emptyPanel}>
          <Text style={styles.emptyTitle}>Save the first policy or recovery file</Text>
          <Text style={styles.emptyText}>
            Add an insurance policy, warranty packet, manual, emergency plan, or home file and
            link it to the property, a room, or a critical device.
          </Text>
          <View style={styles.emptyActions}>
            <Pressable
              onPress={() => {
                if (onAddDocumentOfType) {
                  onAddDocumentOfType('insurance');
                } else {
                  onAddDocument();
                }
              }}
              style={styles.emptyAction}
              accessibilityRole="button"
            >
              <Text style={styles.emptyActionText}>Save insurance policy</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (onAddDocumentOfType) {
                  onAddDocumentOfType('warranty');
                } else {
                  onAddDocument();
                }
              }}
              style={styles.emptySecondaryAction}
              accessibilityRole="button"
            >
              <Text style={styles.emptySecondaryActionText}>Add warranty file</Text>
            </Pressable>
          </View>
        </View>
      ) : filteredDocuments.length > 0 ? (
        filteredDocuments.map((document) => {
          const canShareDocument = Boolean(onShareDocument) && isCriticalDocument(document);

          return (
            <View key={document.id} style={styles.documentRow}>
              <Pressable
                onPress={() => onDocumentPress(document.id)}
                style={styles.documentMainButton}
                accessibilityRole="button"
              >
                <View style={styles.fileIcon}>
                  <Text style={styles.fileIconText}>{document.typeLabel.slice(0, 1)}</Text>
                </View>
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle}>{document.title}</Text>
                  <Text style={styles.rowMeta}>
                    {getDocumentReadinessLabel(document)} · {document.typeLabel} · {document.linkedToLabel}
                  </Text>
                  <Text style={styles.fileMeta}>
                    {formatDocumentAttachmentStatus(document)} · {document.dateLabel}
                  </Text>
                </View>
              </Pressable>
              {canShareDocument ? (
                <Pressable
                  onPress={() => onShareDocument?.(document.id)}
                  style={styles.rowAction}
                  accessibilityRole="button"
                >
                  <Text style={styles.rowActionText}>Share file</Text>
                </Pressable>
              ) : null}
            </View>
          );
        })
      ) : (
        <View style={styles.emptyPanel}>
          <Text style={styles.emptyTitle}>No matching coverage records found</Text>
          <Text style={styles.emptyText}>Try another search, link, or document collection filter.</Text>
        </View>
      )}
    </View>
  );
}

function getDocumentAttachmentUri(document: DocumentListItem) {
  return document.attachment?.storedUri ?? document.filePath;
}

function formatFocusTitle(
  reviewFilter: DocumentReviewFilter | null | undefined,
  collection: DocumentCollectionFilter,
  documentCount: number,
  missingAssetDocumentationCount: number,
) {
  if (reviewFilter === 'missingAttachments') {
    return 'Documents missing files';
  }

  if (reviewFilter === 'missingAssetDocumentation') {
    return `${missingAssetDocumentationCount} assets need documents`;
  }

  switch (collection) {
    case 'insurance':
      return `${documentCount} records saved · insurance in focus`;
    case 'warranty':
      return 'Warranty packets and coverage proof';
    case 'manual':
      return 'Manuals and operating instructions';
    case 'critical':
      return 'Critical files for repairs and emergencies';
    case 'general':
      return 'General household files and supporting records';
    case 'all':
    default:
      return `${documentCount} files linked to the home`;
  }
}

function formatFocusMeta(
  reviewFilter: DocumentReviewFilter | null | undefined,
  collection: DocumentCollectionFilter,
) {
  if (reviewFilter === 'missingAttachments') {
    return 'Attach source files so exported backups point to the right receipts, manuals, and reports.';
  }

  if (reviewFilter === 'missingAssetDocumentation') {
    return 'Add a receipt, manual, warranty, invoice, or report for each uncovered asset.';
  }

  switch (collection) {
    case 'insurance':
      return 'Policies, claims, and provider files someone needs during damage or loss.';
    case 'warranty':
      return 'Coverage terms, receipts, and manufacturer paperwork tied to key equipment.';
    case 'manual':
      return 'Operating guides, quick-start sheets, and router or device instructions.';
    case 'critical':
      return 'Emergency plans, shutoff maps, property files, and the records you would hand off first.';
    case 'general':
      return 'Receipts, invoices, inspection reports, photos, and other supporting records.';
    case 'all':
    default:
      return 'Policies, warranties, manuals, emergency files, and general home records in one vault.';
  }
}

const styles = StyleSheet.create({
  screen: {
    gap: 14,
  },
  documentVault: {
    backgroundColor: colors.panel,
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  kicker: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  focusTitle: {
    color: colors.ink,
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '900',
    letterSpacing: 0,
  },
  focusMeta: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  focusActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  clearReviewButton: {
    alignSelf: 'flex-start',
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderColor: colors.green,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearReviewText: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '900',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    padding: 12,
    gap: 2,
  },
  summaryValue: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '900',
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '900',
  },
  quickActionRow: {
    gap: 10,
  },
  quickActionCard: {
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    padding: 14,
    gap: 4,
  },
  quickActionCardPrimary: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  quickActionTitle: {
    color: colors.blue,
    fontSize: 15,
    fontWeight: '900',
  },
  quickActionDetail: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  quickActionTitlePrimary: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  quickActionDetailPrimary: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  searchBox: {
    minHeight: 48,
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  searchInput: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  linkedRecordRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  filterPill: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  filterText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  documentRow: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  documentMainButton: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  reviewRow: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fileIcon: {
    width: 44,
    height: 52,
    borderRadius: 6,
    backgroundColor: colors.amberSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileIconText: {
    color: colors.amber,
    fontSize: 18,
    fontWeight: '900',
  },
  rowBody: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    color: colors.ink,
    flex: 1,
    fontSize: 15,
    fontWeight: '900',
  },
  rowMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
  fileMeta: {
    color: colors.green,
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 15,
  },
  rowAction: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  emptyPanel: {
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    padding: 14,
    gap: 8,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  emptyActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  emptyAction: {
    alignSelf: 'flex-start',
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  emptyActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  emptySecondaryAction: {
    alignSelf: 'flex-start',
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  emptySecondaryActionText: {
    color: colors.blue,
    fontSize: 13,
    fontWeight: '900',
  },
});
