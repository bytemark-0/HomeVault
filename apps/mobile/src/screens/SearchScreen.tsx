import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { AssetListItem, DocumentListItem, RoomListItem, TaskListItem } from '../data/homeVaultSampleData';
import { colors } from '../theme/colors';

type SearchResult =
  | { kind: 'asset'; id: string; title: string; subtitle: string }
  | { kind: 'document'; id: string; title: string; subtitle: string }
  | { kind: 'task'; id: string; title: string; subtitle: string }
  | { kind: 'room'; id: string; title: string; subtitle: string };

type SearchScreenProps = {
  assets: AssetListItem[];
  documents: DocumentListItem[];
  rooms: RoomListItem[];
  tasks: TaskListItem[];
  onAssetPress: (id: string) => void;
  onDocumentPress: (id: string) => void;
  onRoomPress: (id: string) => void;
  onTaskPress: (id: string) => void;
  onClose: () => void;
};

const MAX_PER_KIND = 6;

function matchesQuery(query: string, ...fields: Array<string | undefined>): boolean {
  const q = query.toLowerCase();
  return fields.some((f) => f?.toLowerCase().includes(q));
}

function searchAssets(assets: AssetListItem[], query: string): SearchResult[] {
  return assets
    .filter((a) =>
      matchesQuery(query, a.name, a.brand, a.model, a.serial, a.roomName, a.category, a.notes),
    )
    .slice(0, MAX_PER_KIND)
    .map((a) => ({
      kind: 'asset',
      id: a.id,
      title: a.name,
      subtitle: [a.category, a.roomName].filter(Boolean).join(' · '),
    }));
}

function searchDocuments(documents: DocumentListItem[], query: string): SearchResult[] {
  return documents
    .filter((d) => matchesQuery(query, d.title, d.typeLabel, d.vendor))
    .slice(0, MAX_PER_KIND)
    .map((d) => ({
      kind: 'document',
      id: d.id,
      title: d.title,
      subtitle: [d.typeLabel, d.vendor].filter(Boolean).join(' · '),
    }));
}

function searchTasks(tasks: TaskListItem[], query: string): SearchResult[] {
  return tasks
    .filter((t) => matchesQuery(query, t.title, t.scopeLabel, t.instructions))
    .slice(0, MAX_PER_KIND)
    .map((t) => ({
      kind: 'task',
      id: t.id,
      title: t.title,
      subtitle: [t.dueLabel, t.scopeLabel].filter(Boolean).join(' · '),
    }));
}

function searchRooms(rooms: RoomListItem[], query: string): SearchResult[] {
  return rooms
    .filter((r) => matchesQuery(query, r.name, r.type))
    .slice(0, MAX_PER_KIND)
    .map((r) => ({
      kind: 'room',
      id: r.id,
      title: r.name,
      subtitle: r.type,
    }));
}

const kindLabel: Record<SearchResult['kind'], string> = {
  asset: 'Asset',
  document: 'Document',
  task: 'Task',
  room: 'Room',
};

const kindColor: Record<SearchResult['kind'], string> = {
  asset: colors.green,
  document: colors.amber,
  task: colors.blue,
  room: colors.muted,
};

const kindBg: Record<SearchResult['kind'], string> = {
  asset: colors.greenSoft,
  document: colors.amberSoft,
  task: colors.blueSoft,
  room: colors.page,
};

export function SearchScreen({
  assets,
  documents,
  rooms,
  tasks,
  onAssetPress,
  onDocumentPress,
  onRoomPress,
  onTaskPress,
  onClose,
}: SearchScreenProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(timer);
  }, []);

  const trimmed = query.trim();
  const hasQuery = trimmed.length >= 2;

  const results: SearchResult[] = hasQuery
    ? [
        ...searchAssets(assets, trimmed),
        ...searchDocuments(documents, trimmed),
        ...searchTasks(tasks, trimmed),
        ...searchRooms(rooms, trimmed),
      ]
    : [];

  function handleResultPress(result: SearchResult) {
    if (result.kind === 'asset') onAssetPress(result.id);
    else if (result.kind === 'document') onDocumentPress(result.id);
    else if (result.kind === 'task') onTaskPress(result.id);
    else onRoomPress(result.id);
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.searchBar, { paddingTop: 12 + insets.top }]}>
        <TextInput
          ref={inputRef}
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search assets, documents, tasks, rooms…"
          placeholderTextColor={colors.muted}
          returnKeyType="search"
          clearButtonMode="while-editing"
          autoCorrect={false}
        />
        <Pressable onPress={onClose} style={styles.cancelButton} accessibilityRole="button">
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.results}
        contentContainerStyle={styles.resultsContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {!hasQuery ? (
          <View style={styles.hintPanel}>
            <Text style={styles.hintTitle}>Search the whole household guide</Text>
            <Text style={styles.hintText}>
              Find devices, documents, reminders, and areas by name, brand, model, serial,
              vendor, or any other detail someone might need in the moment.
            </Text>
            <View style={styles.hintKinds}>
              {(['asset', 'document', 'task', 'room'] as const).map((k) => (
                <View key={k} style={[styles.hintKindBadge, { backgroundColor: kindBg[k] }]}>
                  <Text style={[styles.hintKindText, { color: kindColor[k] }]}>
                    {kindLabel[k]}s
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : results.length === 0 ? (
          <View style={styles.emptyPanel}>
            <Text style={styles.emptyTitle}>No results</Text>
            <Text style={styles.emptyText}>
              Nothing matched "{trimmed}" across devices, documents, reminders, or areas.
            </Text>
          </View>
        ) : (
          results.map((result) => (
            <Pressable
              key={`${result.kind}-${result.id}`}
              onPress={() => handleResultPress(result)}
              style={styles.resultRow}
              accessibilityRole="button"
            >
              <View
                style={[styles.kindBadge, { backgroundColor: kindBg[result.kind] }]}
              >
                <Text style={[styles.kindText, { color: kindColor[result.kind] }]}>
                  {kindLabel[result.kind]}
                </Text>
              </View>
              <View style={styles.resultBody}>
                <Text style={styles.resultTitle} numberOfLines={1}>
                  {result.title}
                </Text>
                {result.subtitle ? (
                  <Text style={styles.resultSubtitle} numberOfLines={1}>
                    {result.subtitle}
                  </Text>
                ) : null}
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.page,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 10,
    backgroundColor: colors.panel,
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
  },
  searchInput: {
    flex: 1,
    minHeight: 42,
    borderRadius: 10,
    backgroundColor: colors.page,
    borderColor: colors.line,
    borderWidth: 1,
    paddingHorizontal: 14,
    color: colors.ink,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cancelText: {
    color: colors.blue,
    fontSize: 15,
    fontWeight: '700',
  },
  results: {
    flex: 1,
  },
  resultsContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 2,
  },
  hintPanel: {
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    padding: 18,
    gap: 10,
    marginTop: 4,
  },
  hintTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  hintText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  hintKinds: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  hintKindBadge: {
    minHeight: 28,
    paddingHorizontal: 10,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintKindText: {
    fontSize: 12,
    fontWeight: '900',
  },
  emptyPanel: {
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    padding: 18,
    gap: 8,
    marginTop: 4,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 56,
    backgroundColor: colors.panel,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 4,
    borderColor: colors.line,
    borderWidth: 1,
  },
  kindBadge: {
    minHeight: 24,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kindText: {
    fontSize: 10,
    fontWeight: '900',
  },
  resultBody: {
    flex: 1,
    gap: 2,
  },
  resultTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
  },
  resultSubtitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  chevron: {
    color: colors.muted,
    fontSize: 20,
    fontWeight: '400',
  },
});
