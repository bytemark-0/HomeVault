import {
  addIncidentContactInteraction,
  addIncidentDocumentLink,
  addIncidentNote,
  addIncidentPhoto,
  archiveIncidentWorkspace,
  buildIncidentRecoveryPlan,
  buildIncidentWorkspaceExportSummary,
  buildIncidentWorkspaceFromGuide,
  canStartIncidentWorkspaceFromGuide,
  closeIncidentWorkspace,
  formatIncidentWorkspaceExportSummary,
  getIncidentWorkspaceScenarioForGuide,
} from '../../utils/incidentWorkspaces';
import { buildContinuityPlaybookGuides } from '../../utils/continuityPlaybooks';

describe('incidentWorkspaces', () => {
  const property = {
    id: 'property-1',
    householdId: 'household-1',
    label: 'Oak Street home',
    type: 'single_family' as const,
  };

  function buildGuides() {
    return buildContinuityPlaybookGuides({
      property,
      assets: [
        {
          id: 'asset-router',
          propertyId: property.id,
          name: 'Main Wi-Fi router',
          category: 'Networking',
          networkName: 'OakStreet-5G',
          status: 'ready',
          roomName: 'Office',
          documentCount: 1,
          lastServiceLabel: 'Never',
          nextTaskLabel: 'No open tasks',
          warrantyExpiringSoon: false,
          lastReviewedAt: '2026-07-01',
        },
      ],
      documents: [
        {
          id: 'document-policy',
          propertyId: property.id,
          title: 'Prairie Mutual home policy',
          type: 'insurance',
          typeLabel: 'Insurance',
          linkedToLabel: 'Property',
          dateLabel: 'Jul 1, 2026',
          linkedRecords: [],
          linkedRecordIds: [property.id],
        },
        {
          id: 'document-router',
          propertyId: property.id,
          title: 'Router restart notes',
          type: 'manual',
          typeLabel: 'Manual',
          linkedToLabel: 'Main Wi-Fi router',
          dateLabel: 'Jul 1, 2026',
          linkedRecords: [],
          linkedRecordIds: ['asset-router'],
        },
      ],
      accessItems: [
        {
          id: 'access-router',
          propertyId: property.id,
          category: 'router',
          label: 'Router admin',
          username: 'admin',
          linkedAssetId: 'asset-router',
          linkedDocumentIds: ['document-router'],
          lastReviewedAt: '2026-07-01',
        },
        {
          id: 'access-shutoff',
          propertyId: property.id,
          category: 'utility_shutoff',
          label: 'Main water shutoff',
          location: 'Garage south wall',
          linkedDocumentIds: [],
          lastReviewedAt: '2026-07-01',
        },
      ],
      emergencyContacts: [
        {
          id: 'contact-1',
          propertyId: property.id,
          name: 'Jamie Lee',
          role: 'Neighbor',
          priority: 'primary',
          phone: '555-0101',
          lastReviewedAt: '2026-07-01',
        },
      ],
      importantAccounts: [
        {
          id: 'account-insurance',
          propertyId: property.id,
          kind: 'insurance',
          providerName: 'Prairie Mutual',
          label: 'Home policy',
          linkedDocumentIds: ['document-policy'],
          lastReviewedAt: '2026-07-01',
        },
        {
          id: 'account-internet',
          propertyId: property.id,
          kind: 'internet',
          providerName: 'FiberFast',
          label: 'FiberFast account',
          phone: '555-0170',
          linkedDocumentIds: [],
          lastReviewedAt: '2026-07-01',
        },
        {
          id: 'account-utility',
          propertyId: property.id,
          kind: 'utility',
          providerName: 'City Utilities',
          label: 'City Utilities account',
          phone: '555-0180',
          linkedDocumentIds: [],
          lastReviewedAt: '2026-07-01',
        },
      ],
      continuityPlaybooks: [],
    });
  }

  it('maps incident-capable guides to focused workspace scenarios', () => {
    const guides = buildGuides();
    const insuranceGuide = guides.find((guide) => guide.id === 'guide-insurance-incident');
    const utilityGuide = guides.find((guide) => guide.id === 'guide-internet-outage');
    const handoffGuide = guides.find((guide) => guide.id === 'guide-travel-handoff');

    expect(insuranceGuide).toBeTruthy();
    expect(utilityGuide).toBeTruthy();
    expect(handoffGuide).toBeTruthy();
    expect(canStartIncidentWorkspaceFromGuide(insuranceGuide!)).toBe(true);
    expect(canStartIncidentWorkspaceFromGuide(utilityGuide!)).toBe(true);
    expect(canStartIncidentWorkspaceFromGuide(handoffGuide!)).toBe(false);
    expect(getIncidentWorkspaceScenarioForGuide(insuranceGuide!)).toBe('insurance');
    expect(getIncidentWorkspaceScenarioForGuide(utilityGuide!)).toBe('utility');
    expect(getIncidentWorkspaceScenarioForGuide(handoffGuide!)).toBeNull();
  });

  it('builds an insurance incident workspace from a guide with linked records and export audiences', () => {
    const guides = buildGuides();
    const insuranceGuide = guides.find((guide) => guide.id === 'guide-insurance-incident');

    expect(insuranceGuide).toBeTruthy();

    const workspace = buildIncidentWorkspaceFromGuide({
      property,
      guide: insuranceGuide!,
      claimNumber: 'CLM-2026-0142',
      startedAt: '2026-07-10T13:45:00.000Z',
    });

    expect(workspace.scenario.key).toBe('insurance');
    expect(workspace.claimNumber).toBe('CLM-2026-0142');
    expect(workspace.nextActions.length).toBeGreaterThan(0);
    expect(workspace.linkedRecords.map((record) => record.label)).toEqual(
      expect.arrayContaining(['Home policy', 'Prairie Mutual home policy', 'Emergency packet']),
    );
    expect(workspace.exportAudiences.map((audience) => audience.key)).toEqual(
      expect.arrayContaining(['insurer', 'contractor']),
    );
    expect(workspace.timeline.map((entry) => entry.type)).toEqual(['note', 'claim_update']);
    expect(workspace.retention.keepClosedWorkspaces).toBe(true);
  });

  it('tracks notes, document links, contact interactions, and closeout in timeline order', () => {
    const guides = buildGuides();
    const utilityGuide = guides.find((guide) => guide.id === 'guide-internet-outage');

    expect(utilityGuide).toBeTruthy();

    let workspace = buildIncidentWorkspaceFromGuide({
      property,
      guide: utilityGuide!,
      startedAt: '2026-07-10T14:00:00.000Z',
    });

    workspace = addIncidentNote(workspace, {
      occurredAt: '2026-07-10T14:02:00.000Z',
      summary: 'Outage confirmed',
      detail: 'No signal from the provider modem and the mesh network is offline.',
    });
    workspace = addIncidentDocumentLink(workspace, {
      occurredAt: '2026-07-10T14:04:00.000Z',
      summary: 'Router notes attached',
      detail: 'Linked the restart steps before calling support.',
      documentId: 'document-router',
    });
    workspace = addIncidentContactInteraction(workspace, {
      occurredAt: '2026-07-10T14:06:00.000Z',
      summary: 'Provider called',
      contactName: 'FiberFast support',
      channel: 'call',
      outcome: 'Ticket created with a 4-hour service window.',
    });
    workspace = closeIncidentWorkspace(workspace, '2026-07-10T18:00:00.000Z');

    expect(workspace.status).toBe('closed');
    expect(workspace.updatedAt).toBe('2026-07-10T18:00:00.000Z');
    expect(workspace.timeline.map((entry) => entry.type)).toEqual([
      'note',
      'note',
      'document_link',
      'contact_interaction',
      'note',
    ]);
    expect(workspace.timeline[2]).toEqual(
      expect.objectContaining({
        type: 'document_link',
        documentId: 'document-router',
      }),
    );
  });

  it('captures photo evidence alongside other incident timeline entries', () => {
    const guides = buildGuides();
    const insuranceGuide = guides.find((guide) => guide.id === 'guide-insurance-incident');

    expect(insuranceGuide).toBeTruthy();

    let workspace = buildIncidentWorkspaceFromGuide({
      property,
      guide: insuranceGuide!,
      startedAt: '2026-07-10T15:00:00.000Z',
    });
    workspace = addIncidentPhoto(workspace, {
      occurredAt: '2026-07-10T15:03:00.000Z',
      summary: 'Ceiling damage photo saved',
      detail: 'Captured the active leak area before cleanup started.',
      photoUri: 'file:///incident-photo.jpg',
    });

    const photoEntry = workspace.timeline.find((entry) => entry.type === 'photo');

    expect(photoEntry).toEqual(
      expect.objectContaining({
        type: 'photo',
        summary: 'Ceiling damage photo saved',
        detail: 'Captured the active leak area before cleanup started.',
        photoUri: 'file:///incident-photo.jpg',
      }),
    );
    expect(workspace.updatedAt).toBe('2026-07-10T15:03:00.000Z');
  });

  it('can archive a closed workspace while preserving retention guidance in the timeline', () => {
    const guides = buildGuides();
    const insuranceGuide = guides.find((guide) => guide.id === 'guide-insurance-incident');

    expect(insuranceGuide).toBeTruthy();

    let workspace = buildIncidentWorkspaceFromGuide({
      property,
      guide: insuranceGuide!,
      startedAt: '2026-07-10T16:00:00.000Z',
    });
    workspace = closeIncidentWorkspace(workspace, '2026-07-11T12:00:00.000Z');
    workspace = archiveIncidentWorkspace(workspace, '2026-10-15T12:00:00.000Z');

    expect(workspace.status).toBe('archived');
    expect(workspace.updatedAt).toBe('2026-10-15T12:00:00.000Z');
    expect(workspace.timeline.at(-1)).toEqual(
      expect.objectContaining({
        type: 'note',
        summary: 'Incident archived',
        detail: workspace.retention.guidance,
      }),
    );
  });

  it('builds recovery checklists, reminders, and return-to-ready prompts for the recovery tail', () => {
    const guides = buildGuides();
    const insuranceGuide = guides.find((guide) => guide.id === 'guide-insurance-incident');

    expect(insuranceGuide).toBeTruthy();

    let workspace = buildIncidentWorkspaceFromGuide({
      property,
      guide: insuranceGuide!,
      claimNumber: 'CLM-2026-0142',
      startedAt: '2026-07-10T16:30:00.000Z',
    });
    workspace = addIncidentPhoto(workspace, {
      occurredAt: '2026-07-10T16:35:00.000Z',
      summary: 'Leak photo saved',
      photoUri: 'file:///incident-photo.jpg',
    });
    workspace = addIncidentContactInteraction(workspace, {
      occurredAt: '2026-07-10T16:40:00.000Z',
      summary: 'Insurer called',
      contactName: 'Prairie Mutual claims',
      channel: 'call',
      outcome: 'Adjuster visit scheduled for tomorrow morning.',
    });

    const recoveryPlan = buildIncidentRecoveryPlan({
      workspace,
      statusTracker: {
        claim: 'open',
        contractor: 'waiting',
        reimbursement: 'open',
      },
    });

    expect(recoveryPlan.checklist.map((item) => item.category)).toEqual(
      expect.arrayContaining(['repair', 'replacement', 'reimbursement', 'follow_up']),
    );
    expect(recoveryPlan.unresolvedReminders).toEqual(
      expect.arrayContaining([
        expect.stringContaining('recovery checklist'),
        'The claim is not marked resolved yet.',
        'Contractor or repair follow-up is still open.',
      ]),
    );
    expect(recoveryPlan.returnToReadyPrompts.length).toBeGreaterThan(0);
    expect(recoveryPlan.exportReady).toBe(false);
  });

  it('formats a focused export summary for a chosen audience', () => {
    const guides = buildGuides();
    const insuranceGuide = guides.find((guide) => guide.id === 'guide-insurance-incident');

    expect(insuranceGuide).toBeTruthy();

    let workspace = buildIncidentWorkspaceFromGuide({
      property,
      guide: insuranceGuide!,
      claimNumber: 'CLM-2026-0142',
      startedAt: '2026-07-10T13:45:00.000Z',
    });
    workspace = addIncidentNote(workspace, {
      occurredAt: '2026-07-10T13:55:00.000Z',
      summary: 'Damage photographed',
      detail: 'Documented water damage in the utility room and hall ceiling.',
    });

    const summary = buildIncidentWorkspaceExportSummary(
      workspace,
      'insurer',
      '2026-07-10T14:15:00.000Z',
    );
    const formatted = formatIncidentWorkspaceExportSummary(summary);

    expect(summary.audience.key).toBe('insurer');
    expect(summary.claimNumber).toBe('CLM-2026-0142');
    expect(summary.linkedRecordCount).toBeGreaterThan(0);
    expect(summary.timelineHighlights).toEqual(
      expect.arrayContaining([
        '2026-07-10T13:45:00.000Z: Workspace started from Insurance incident response',
        '2026-07-10T13:55:00.000Z: Damage photographed',
      ]),
    );
    expect(formatted).toContain('HomeVault Incident Summary');
    expect(formatted).toContain('Audience   : Insurer handoff');
    expect(formatted).toContain('Claim     : CLM-2026-0142');
    expect(formatted).toContain('Timeline Highlights');
  });
});
