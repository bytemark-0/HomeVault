import { getSetupChecklistProgress } from '../../utils/setupChecklist';

describe('getSetupChecklistProgress', () => {
  it('reports a partial readiness setup based on saved essentials', () => {
    const progress = getSetupChecklistProgress({
      accessItems: [
        { category: 'wifi' as const },
        { category: 'garage' as const },
      ],
      assets: [],
      emergencyContacts: [],
      importantAccounts: [],
    });

    expect(progress.doneCount).toBe(2);
    expect(progress.next?.key).toBe('insurance');
    expect(progress.incomplete.map((step) => step.key)).toEqual([
      'insurance',
      'emergency',
      'device',
    ]);
  });

  it('marks the readiness checklist complete when all essentials are saved', () => {
    const progress = getSetupChecklistProgress({
      accessItems: [
        { category: 'wifi' as const },
        { category: 'lockbox' as const },
      ],
      assets: [{ category: 'Network', name: 'Main Wi-Fi router' }],
      emergencyContacts: [{ id: 'contact-1' }],
      importantAccounts: [{ kind: 'insurance' as const }],
    });

    expect(progress.doneCount).toBe(5);
    expect(progress.incomplete).toEqual([]);
    expect(progress.next).toBeNull();
  });
});
