import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { SectionTitle } from '../components/SectionTitle';
import type { DocumentListItem } from '../data/homeVaultSampleData';
import { colors } from '../theme/colors';

type DocumentsScreenProps = {
  documents: DocumentListItem[];
  documentCount: number;
  onAddDocument: () => void;
  onDocumentPress: (documentId: string) => void;
};

const typeFilters = ['All', 'Receipt', 'Manual', 'Warranty', 'Invoice', 'Report'];

export function DocumentsScreen({
  documents,
  documentCount,
  onAddDocument,
  onDocumentPress,
}: DocumentsScreenProps) {
  const [query, setQuery] = useState('');
  const [activeType, setActiveType] = useState('All');

  const filteredDocuments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return documents.filter((document) => {
      const matchesType = activeType === 'All' || document.typeLabel === activeType;
      const searchableText = [
        document.title,
        document.typeLabel,
        document.linkedToLabel,
        document.dateLabel,
        document.vendor ?? '',
        document.filePath ?? '',
        document.ocrText ?? '',
      ]
        .join(' ')
        .toLowerCase();
      const matchesQuery = normalizedQuery.length === 0 || searchableText.includes(normalizedQuery);

      return matchesType && matchesQuery;
    });
  }, [activeType, documents, query]);

  return (
    <View style={styles.screen}>
      <View style={styles.documentVault}>
        <Text style={styles.kicker}>Document vault</Text>
        <Text style={styles.focusTitle}>{documentCount} files linked to the home</Text>
        <Text style={styles.focusMeta}>
          Receipts, warranties, manuals, reports, and service invoices
        </Text>
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

      <SectionTitle title="Recently added" action="Import" onActionPress={onAddDocument} />
      {documents.length === 0 ? (
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
                {document.filePath ? 'File attached' : 'Metadata only'}
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
