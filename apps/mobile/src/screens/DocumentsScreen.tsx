import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { SectionTitle } from '../components/SectionTitle';
import { formatDocumentAttachmentStatus } from '../data/documentAttachmentLabels';
import type { AssetListItem, DocumentListItem, RoomListItem } from '../data/homeVaultSampleData';
import { colors } from '../theme/colors';

export type DocumentReviewFilter = 'missingAttachments' | 'missingAssetDocumentation';

type DocumentsScreenProps = {
  assets?: AssetListItem[];
  rooms?: RoomListItem[];
  propertyId?: string;
  documents: DocumentListItem[];
  documentCount: number;
  reviewFilter?: DocumentReviewFilter | null;
  onAddDocument: () => void;
  onAddDocumentForRecord?: (recordId: string) => void;
  onClearReviewFilter?: () => void;
  onDocumentPress: (documentId: string) => void;
};

const typeFilters = ['All', 'Receipt', 'Manual', 'Warranty', 'Invoice', 'Report'];

export function DocumentsScreen({
  assets = [],
  rooms = [],
  propertyId,
  documents,
  documentCount,
  reviewFilter,
  onAddDocument,
  onAddDocumentForRecord,
  onClearReviewFilter,
  onDocumentPress,
}: DocumentsScreenProps) {
  const [query, setQuery] = useState('');
  const [activeType, setActiveType] = useState('All');
  const [activeLinkedRecordId, setActiveLinkedRecordId] = useState('');
  const missingDocumentAssets = useMemo(
    () => assets.filter((asset) => asset.documentCount === 0),
    [assets],
  );

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
      const matchesType = activeType === 'All' || document.typeLabel === activeType;
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
  }, [activeLinkedRecordId, activeType, documents, query, reviewFilter]);
  const isMissingAssetDocumentationFilter = reviewFilter === 'missingAssetDocumentation';

  return (
    <View style={styles.screen}>
      <View style={styles.documentVault}>
        <Text style={styles.kicker}>
          {reviewFilter ? 'Readiness review' : 'Document vault'}
        </Text>
        <Text style={styles.focusTitle}>
          {formatFocusTitle(reviewFilter, documentCount, missingDocumentAssets.length)}
        </Text>
        <Text style={styles.focusMeta}>
          {formatFocusMeta(reviewFilter)}
        </Text>
        {reviewFilter && onClearReviewFilter ? (
          <Pressable
            onPress={onClearReviewFilter}
            style={styles.clearReviewButton}
            accessibilityRole="button"
          >
            <Text style={styles.clearReviewText}>Show all documents</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.searchBox}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search title, asset, vendor, date"
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
        />
      </View>

      <View style={styles.filterRow}>
        {typeFilters.map((filter) => {
          const isActive = filter === activeType;

          return (
            <Pressable
              key={filter}
              onPress={() => setActiveType(filter)}
              style={[styles.filterPill, isActive && styles.filterPillActive]}
              accessibilityRole="button"
            >
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                {filter}
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

      <SectionTitle title="Recently added" action="Import" onActionPress={onAddDocument} />
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
            <Text style={styles.emptyTitle}>All assets have documents</Text>
            <Text style={styles.emptyText}>Every asset currently has at least one linked document.</Text>
          </View>
        )
      ) : documents.length === 0 ? (
        <View style={styles.emptyPanel}>
          <Text style={styles.emptyTitle}>Build the document vault</Text>
          <Text style={styles.emptyText}>
            Add a receipt, manual, warranty, invoice, or inspection report and link it to a room or asset.
          </Text>
          <Pressable onPress={onAddDocument} style={styles.emptyAction} accessibilityRole="button">
            <Text style={styles.emptyActionText}>Import document</Text>
          </Pressable>
        </View>
      ) : filteredDocuments.length > 0 ? (
        filteredDocuments.map((document) => (
          <Pressable
            key={document.id}
            onPress={() => onDocumentPress(document.id)}
            style={styles.documentRow}
            accessibilityRole="button"
          >
            <View style={styles.fileIcon}>
              <Text style={styles.fileIconText}>{document.typeLabel.slice(0, 1)}</Text>
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>{document.title}</Text>
              <Text style={styles.rowMeta}>
                {document.typeLabel} · {document.linkedToLabel} · {document.dateLabel}
              </Text>
              <Text style={styles.fileMeta}>
                {formatDocumentAttachmentStatus(document)}
              </Text>
            </View>
          </Pressable>
        ))
      ) : (
        <View style={styles.emptyPanel}>
          <Text style={styles.emptyTitle}>No documents found</Text>
          <Text style={styles.emptyText}>Try another search or type filter.</Text>
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
  documentCount: number,
  missingAssetDocumentationCount: number,
) {
  if (reviewFilter === 'missingAttachments') {
    return 'Documents missing files';
  }

  if (reviewFilter === 'missingAssetDocumentation') {
    return `${missingAssetDocumentationCount} assets need documents`;
  }

  return `${documentCount} files linked to the home`;
}

function formatFocusMeta(reviewFilter: DocumentReviewFilter | null | undefined) {
  if (reviewFilter === 'missingAttachments') {
    return 'Attach source files so exported backups point to the right receipts, manuals, and reports.';
  }

  if (reviewFilter === 'missingAssetDocumentation') {
    return 'Add a receipt, manual, warranty, invoice, or report for each uncovered asset.';
  }

  return 'Receipts, warranties, manuals, reports, and service invoices';
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
});
