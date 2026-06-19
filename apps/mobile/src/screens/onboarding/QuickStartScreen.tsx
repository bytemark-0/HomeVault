import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Property } from '@homevault/domain';
import type { CreateDocumentInput, CreateTaskInput } from '@homevault/database';
import { getHomeVaultRepository } from '../../data/localHomeVaultRepository';
import { AddTaskScreen } from '../AddTaskScreen';
import { AddDocumentScreen } from '../AddDocumentScreen';
import { FirstAssetScreen } from './FirstAssetScreen';
import { colors } from '../../theme/colors';

type Screen =
  | { id: 'choices' }
  | { id: 'first-asset'; category: string }
  | { id: 'first-task' }
  | { id: 'first-document' };

const CHOICES = [
  {
    id: 'appliance' as const,
    icon: '🔧',
    title: 'Add an appliance',
    description: 'Dishwasher, water heater, washer/dryer, and more.',
    category: 'Appliance',
  },
  {
    id: 'system' as const,
    icon: '🌡️',
    title: 'Add a home system',
    description: 'HVAC, electrical panel, plumbing, roofing.',
    category: 'Heating & cooling',
  },
  {
    id: 'reminder' as const,
    icon: '🔔',
    title: 'Add a maintenance reminder',
    description: 'Filter changes, seasonal checks, inspections.',
    category: null,
  },
  {
    id: 'document' as const,
    icon: '📄',
    title: 'Save a document',
    description: 'Manuals, warranties, inspection reports.',
    category: null,
  },
];

type Props = {
  property: Property;
  onDone: () => void;
};

export function QuickStartScreen({ property, onDone }: Props) {
  const insets = useSafeAreaInsets();
  const [screen, setScreen] = useState<Screen>({ id: 'choices' });

  if (screen.id === 'first-asset') {
    return (
      <FirstAssetScreen
        property={property}
        initialCategory={screen.category}
        onSaved={onDone}
        onBack={() => setScreen({ id: 'choices' })}
      />
    );
  }

  if (screen.id === 'first-task') {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <AddTaskScreen
          propertyId={property.id}
          assets={[]}
          onCancel={() => setScreen({ id: 'choices' })}
          onSave={async (input) => {
            const repo = await getHomeVaultRepository();
            await repo.createTask(input as CreateTaskInput);
            onDone();
          }}
        />
      </SafeAreaView>
    );
  }

  if (screen.id === 'first-document') {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <AddDocumentScreen
          propertyId={property.id}
          assets={[]}
          onCancel={() => setScreen({ id: 'choices' })}
          onSave={async (input) => {
            const repo = await getHomeVaultRepository();
            await repo.createDocument(input as CreateDocumentInput);
            onDone();
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: 16 + insets.top }]}>
        <Text style={styles.heading}>What do you want to add first?</Text>
        <Text style={styles.subheading}>
          Pick one to get started, or skip straight to your dashboard.
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.choiceList}
        showsVerticalScrollIndicator={false}
      >
        {CHOICES.map((choice) => (
          <Pressable
            key={choice.id}
            style={styles.choiceCard}
            onPress={() => {
              if (choice.id === 'reminder') {
                setScreen({ id: 'first-task' });
              } else if (choice.id === 'document') {
                setScreen({ id: 'first-document' });
              } else if (choice.category) {
                setScreen({ id: 'first-asset', category: choice.category });
              }
            }}
            accessibilityRole="button"
            accessibilityLabel={choice.title}
            accessibilityHint={choice.description}
          >
            <Text style={styles.choiceIcon}>{choice.icon}</Text>
            <View style={styles.choiceBody}>
              <Text style={styles.choiceTitle}>{choice.title}</Text>
              <Text style={styles.choiceDesc}>{choice.description}</Text>
            </View>
            <Text style={styles.choiceArrow}>›</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={[styles.actions, { paddingBottom: 24 + insets.bottom }]}>
        <Pressable
          style={styles.skipButton}
          onPress={onDone}
          accessibilityRole="button"
          accessibilityLabel="Skip to dashboard"
        >
          <Text style={styles.skipText}>Skip to dashboard</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.page },
  root: { flex: 1, backgroundColor: colors.page },
  header: {
    paddingHorizontal: 28,
    paddingBottom: 20,
    gap: 6,
    backgroundColor: colors.page,
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
  },
  heading: { fontSize: 26, fontWeight: '800', color: colors.ink },
  subheading: { fontSize: 14, fontWeight: '500', color: colors.muted, lineHeight: 20 },
  scroll: { flex: 1 },
  choiceList: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, gap: 12 },
  choiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.panel,
    borderRadius: 12,
    borderColor: colors.line,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  choiceIcon: { fontSize: 28, width: 40, textAlign: 'center' },
  choiceBody: { flex: 1, gap: 3 },
  choiceTitle: { fontSize: 16, fontWeight: '700', color: colors.ink },
  choiceDesc: { fontSize: 13, fontWeight: '500', color: colors.muted, lineHeight: 19 },
  choiceArrow: { fontSize: 22, color: colors.muted, fontWeight: '300' },
  actions: {
    paddingHorizontal: 28,
    paddingTop: 16,
    backgroundColor: colors.page,
    borderTopColor: colors.line,
    borderTopWidth: 1,
  },
  skipButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderWidth: 1,
  },
  skipText: { color: colors.muted, fontSize: 15, fontWeight: '600' },
});
