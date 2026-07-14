import type {
  HomeVaultEmergencyPacketAccessItem,
  HomeVaultEmergencyPacketDevice,
  HomeVaultEmergencyPacketEmergencyContact,
  HomeVaultEmergencyPacketImportantAccount,
  HomeVaultEmergencyPacketRecoveryNote,
  HomeVaultTrustedShareArtifact,
} from '@homevault/export';

export function createTrustedShareFileName(
  artifact: HomeVaultTrustedShareArtifact,
  extension: 'txt',
) {
  const propertySlug = slugify(artifact.property.label || artifact.property.id);
  const audienceSlug = slugify(artifact.audience.label || artifact.audience.key);
  const generatedDate = artifact.generatedAt.slice(0, 10);

  return `homevault-trusted-share-${audienceSlug}-${propertySlug}-${generatedDate}.${extension}`;
}

export function formatTrustedShareText(artifact: HomeVaultTrustedShareArtifact): string {
  const lines = [
    'HomeVault Trusted Share',
    '=======================',
    '',
    `Property : ${artifact.property.label}`,
    `Prepared : ${artifact.audience.label}`,
    `Generated: ${formatDateTime(artifact.generatedAt)}`,
    '',
    `Warning  : ${artifact.warning}`,
    `v1 note  : ${artifact.v1Notice}`,
    '',
    'Why This Exists',
    '---------------',
    artifact.audience.description,
    '',
    'Tradeoffs',
    '---------',
    `- Local-first: ${artifact.tradeoffs.localFirst}`,
    `- No live access: ${artifact.tradeoffs.liveAccess}`,
    `- Future direction: ${artifact.tradeoffs.futureDirection}`,
    '',
    'Included Sections',
    '-----------------',
    ...(artifact.summary.includedSections.length > 0
      ? artifact.summary.includedSections.map((section) => {
          const docsLabel =
            section.documentCount > 0
              ? ` (${section.documentCount} supporting document${section.documentCount === 1 ? '' : 's'})`
              : '';

          return `- ${section.title}: ${section.itemCount} item${section.itemCount === 1 ? '' : 's'}${docsLabel}`;
        })
      : ['- No sections currently include data.']),
    '',
    'Omitted Sections',
    '----------------',
    ...(artifact.summary.omittedSections.length > 0
      ? artifact.summary.omittedSections.map(
          (section) => `- ${section.title}: ${section.rationale}`,
        )
      : ['- None.']),
    '',
    renderTextSection(
      artifact.sections.accessInfo.title,
      artifact.sections.accessInfo.included
        ? renderAccessItems(artifact.records.accessItems)
        : [],
    ),
    renderTextSection(
      artifact.sections.emergencyContacts.title,
      artifact.sections.emergencyContacts.included
        ? renderContactItems(artifact.records.emergencyContacts)
        : [],
    ),
    renderTextSection(
      artifact.sections.insurance.title,
      artifact.sections.insurance.included
        ? renderInsuranceItems(artifact.records.importantAccounts)
        : [],
    ),
    renderTextSection(
      artifact.sections.keyDevices.title,
      artifact.sections.keyDevices.included
        ? renderDeviceItems(artifact.records.keyDevices, artifact.records.linkedAccessItems)
        : [],
    ),
    renderTextSection(
      artifact.sections.recoveryNotes.title,
      artifact.sections.recoveryNotes.included
        ? renderRecoveryItems(
            artifact.records.recoveryNotes,
            artifact.records.continuityPlaybooks,
          )
        : [],
    ),
  ];

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

function renderTextSection(title: string, items: string[]) {
  const body = items.length > 0 ? items.map((item) => `- ${item}`).join('\n') : '- No records included.';

  return `${title}\n${'-'.repeat(title.length)}\n${body}\n`;
}

function renderAccessItems(items: HomeVaultEmergencyPacketAccessItem[]) {
  return items.map((item) =>
    renderPlainLineItem(
      item.label,
      [
        formatAccessCategory(item.category),
        item.accessCode ? `Code: ${item.accessCode}` : null,
        item.location ? `Location: ${item.location}` : null,
        item.linkedAssetLabel ? `Linked device: ${item.linkedAssetLabel}` : null,
        item.instructions ? `Instructions: ${item.instructions}` : null,
        item.notes ? `Notes: ${item.notes}` : null,
      ].filter(isPresentString),
    ),
  );
}

function renderContactItems(items: HomeVaultEmergencyPacketEmergencyContact[]) {
  return items.map((item) =>
    renderPlainLineItem(
      item.name,
      [
        item.role,
        item.phone ? `Phone: ${item.phone}` : null,
        item.email ? `Email: ${item.email}` : null,
        item.address ? `Address: ${item.address}` : null,
        item.notes ? `Notes: ${item.notes}` : null,
      ].filter(isPresentString),
    ),
  );
}

function renderInsuranceItems(items: HomeVaultEmergencyPacketImportantAccount[]) {
  return items.map((item) =>
    renderPlainLineItem(
      item.label,
      [
        item.providerName,
        item.accountNumberLast4 ? `Policy ref: ${item.accountNumberLast4}` : null,
        item.phone ? `Claims phone: ${item.phone}` : null,
        item.website ? `Website: ${item.website}` : null,
        item.recoveryNotes ? `Notes: ${item.recoveryNotes}` : null,
      ].filter(isPresentString),
    ),
  );
}

function renderDeviceItems(
  items: HomeVaultEmergencyPacketDevice[],
  linkedAccessItems: HomeVaultEmergencyPacketAccessItem[],
) {
  const accessById = new Map(linkedAccessItems.map((item) => [item.id, item]));

  return items.map((item) => {
    const linkedAccessLabels = item.linkedAccessItemIds
      .map((accessId) => accessById.get(accessId)?.label)
      .filter((value): value is string => Boolean(value));

    return renderPlainLineItem(
      item.name,
      [
        item.category,
        item.roomName ? `Location: ${item.roomName}` : null,
        item.networkName ? `Network: ${item.networkName}` : null,
        item.internetProvider ? `Provider: ${item.internetProvider}` : null,
        item.networkAdminUrl ? `Admin URL: ${item.networkAdminUrl}` : null,
        linkedAccessLabels.length > 0 ? `Linked access: ${linkedAccessLabels.join(', ')}` : null,
        item.findMyDeviceEnabled === true ? 'Find My Device enabled' : null,
        item.backupEnabled === true ? 'Backups enabled' : null,
        item.screenLockEnabled === true ? 'Screen lock enabled' : null,
      ].filter(isPresentString),
    );
  });
}

function renderRecoveryItems(
  notes: HomeVaultEmergencyPacketRecoveryNote[],
  playbooks: HomeVaultTrustedShareArtifact['records']['continuityPlaybooks'],
) {
  return [
    ...notes.map((note) => renderPlainLineItem(note.label, [note.detail])),
    ...playbooks.map((playbook) =>
      renderPlainLineItem(
        playbook.title,
        [
          playbook.notes ?? null,
          `${playbook.steps.filter((step) => step.isRequired).length} required step${playbook.steps.filter((step) => step.isRequired).length === 1 ? '' : 's'}`,
        ].filter(isPresentString),
      ),
    ),
  ];
}

function renderPlainLineItem(title: string, details: string[]) {
  return [title, ...details].join(' · ');
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function formatAccessCategory(category: HomeVaultEmergencyPacketAccessItem['category']) {
  switch (category) {
    case 'utility_shutoff':
      return 'Utility shutoff';
    case 'entry_note':
      return 'Entry note';
    default:
      return category.replaceAll('_', ' ');
  }
}

function isPresentString(value: string | null | undefined): value is string {
  return Boolean(value);
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'trusted-share';
}
