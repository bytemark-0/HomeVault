import * as Print from 'expo-print';

import type {
  HomeVaultEmergencyPacket,
  HomeVaultEmergencyPacketAccessItem,
  HomeVaultEmergencyPacketDevice,
  HomeVaultEmergencyPacketEmergencyContact,
  HomeVaultEmergencyPacketImportantAccount,
  HomeVaultEmergencyPacketRecoveryNote,
} from '@homevault/export';

export function createEmergencyPacketFileName(packet: HomeVaultEmergencyPacket, extension: 'html' | 'txt') {
  const propertySlug = slugify(packet.property.label || packet.property.id);
  const generatedDate = packet.generatedAt.slice(0, 10);

  return `homevault-emergency-packet-${propertySlug}-${generatedDate}.${extension}`;
}

export function formatEmergencyPacketText(packet: HomeVaultEmergencyPacket): string {
  const lines = [
    'HomeVault Emergency Packet',
    '==========================',
    '',
    `Property : ${packet.property.label}`,
    `Generated: ${formatDateTime(packet.generatedAt)}`,
    '',
    `Warning  : ${packet.warning}`,
    '',
    'Includes',
    '--------',
    ...packet.summary.includedSections.map((section) => {
      const docsLabel =
        section.documentCount > 0
          ? ` (${section.documentCount} supporting document${section.documentCount === 1 ? '' : 's'})`
          : '';

      return `- ${section.title}: ${section.itemCount} item${section.itemCount === 1 ? '' : 's'}${docsLabel}`;
    }),
    '',
    'Not included',
    '------------',
    ...(packet.summary.missingSections.length > 0
      ? packet.summary.missingSections.map((section) => `- ${section.title}: ${section.emptyState}`)
      : ['- All core sections contain data.']),
    '',
    renderTextSection('Access info', renderAccessTextItems(packet.sections.accessInfo.items)),
    renderTextSection('Emergency contacts', renderContactTextItems(packet.sections.emergencyContacts.items)),
    renderTextSection('Insurance', renderInsuranceTextItems(packet.sections.insurance.items)),
    renderTextSection(
      'Key devices',
      renderDeviceTextItems(packet.sections.keyDevices.items, packet.sections.keyDevices.linkedAccessItems),
    ),
    renderTextSection(
      'Recovery notes',
      renderRecoveryTextItems(packet.sections.recoveryNotes.notes, packet.sections.recoveryNotes.playbooks),
    ),
  ];

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

export async function printEmergencyPacket(packet: HomeVaultEmergencyPacket): Promise<void> {
  const html = buildEmergencyPacketHtml(packet);
  await Print.printAsync({ html });
}

function buildEmergencyPacketHtml(packet: HomeVaultEmergencyPacket): string {
  const sections = [
    buildSectionHtml('Access info', renderHtmlList(renderAccessItems(packet.sections.accessInfo.items))),
    buildSectionHtml(
      'Emergency contacts',
      renderHtmlList(renderContacts(packet.sections.emergencyContacts.items)),
    ),
    buildSectionHtml('Insurance', renderHtmlList(renderInsurance(packet.sections.insurance.items))),
    buildSectionHtml(
      'Key devices',
      renderHtmlList(
        renderDevices(packet.sections.keyDevices.items, packet.sections.keyDevices.linkedAccessItems),
      ),
    ),
    buildSectionHtml(
      'Recovery notes',
      renderHtmlList(
        renderRecovery(packet.sections.recoveryNotes.notes, packet.sections.recoveryNotes.playbooks),
      ),
    ),
  ]
    .filter(Boolean)
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(packet.property.label)} Emergency Packet</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; color: #172026; padding: 28px; line-height: 1.45; }
  h1 { margin: 0 0 4px; font-size: 28px; }
  .meta { color: #52606d; font-size: 12px; margin-bottom: 14px; }
  .warning { background: #fff4d6; border: 1px solid #f5d37a; border-radius: 10px; padding: 12px 14px; font-size: 12px; margin-bottom: 18px; }
  .summary { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 18px; }
  .summary-card { background: #f4f7f6; border-radius: 10px; padding: 10px 12px; min-width: 150px; }
  .summary-value { font-size: 20px; font-weight: 800; }
  .summary-label { font-size: 11px; color: #52606d; }
  h2 { margin: 22px 0 10px; font-size: 18px; border-bottom: 2px solid #d9e2e5; padding-bottom: 4px; }
  ul { list-style: none; padding: 0; margin: 0; }
  li { padding: 10px 0; border-bottom: 1px solid #eef2f3; }
  li:last-child { border-bottom: none; }
  .item-title { font-weight: 700; }
  .item-meta { color: #52606d; font-size: 12px; margin-top: 4px; }
  .empty { color: #7b8794; font-style: italic; }
  .footer { border-top: 1px solid #d9e2e5; margin-top: 24px; padding-top: 12px; color: #52606d; font-size: 11px; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <h1>${escapeHtml(packet.property.label)}</h1>
  <div class="meta">HomeVault Emergency Packet · Generated ${escapeHtml(formatDateTime(packet.generatedAt))}</div>
  <div class="warning">${escapeHtml(packet.warning)}</div>
  <div class="summary">
    <div class="summary-card">
      <div class="summary-value">${packet.summary.includedSectionCount}</div>
      <div class="summary-label">Sections ready</div>
    </div>
    <div class="summary-card">
      <div class="summary-value">${packet.summary.missingSectionCount}</div>
      <div class="summary-label">Sections missing</div>
    </div>
    <div class="summary-card">
      <div class="summary-value">${packet.sections.keyDevices.items.length}</div>
      <div class="summary-label">Key devices</div>
    </div>
  </div>
  ${sections}
  <div class="footer">This packet is grouped for emergencies. It does not include full inventory history, maintenance logs, or hidden app diagnostics.</div>
</body>
</html>`;
}

function renderTextSection(title: string, items: string[]) {
  const body = items.length > 0 ? items.map((item) => `- ${item}`).join('\n') : '- No records included.';

  return `${title}\n${'-'.repeat(title.length)}\n${body}\n`;
}

function buildSectionHtml(title: string, body: string) {
  return `<h2>${escapeHtml(title)}</h2>${body}`;
}

function renderHtmlList(items: string[]) {
  if (items.length === 0) {
    return '<p class="empty">No records included.</p>';
  }

  return `<ul>${items
    .map((item) => `<li>${item}</li>`)
    .join('')}</ul>`;
}

function renderAccessItems(items: HomeVaultEmergencyPacketAccessItem[]) {
  return items.map((item) => {
    const details = [
      item.accessCode ? `Code: ${item.accessCode}` : null,
      item.location ? `Location: ${item.location}` : null,
      item.linkedAssetLabel ? `Linked device: ${item.linkedAssetLabel}` : null,
      item.instructions ? `Instructions: ${item.instructions}` : null,
      item.notes ? `Notes: ${item.notes}` : null,
    ].filter(isPresentString);

    return renderLineItem(item.label, [formatAccessCategory(item.category), ...details]);
  });
}

function renderAccessTextItems(items: HomeVaultEmergencyPacketAccessItem[]) {
  return items.map((item) => {
    const details = [
      formatAccessCategory(item.category),
      item.accessCode ? `Code: ${item.accessCode}` : null,
      item.location ? `Location: ${item.location}` : null,
      item.linkedAssetLabel ? `Linked device: ${item.linkedAssetLabel}` : null,
      item.instructions ? `Instructions: ${item.instructions}` : null,
      item.notes ? `Notes: ${item.notes}` : null,
    ].filter(isPresentString);

    return renderPlainLineItem(item.label, details);
  });
}

function renderContacts(items: HomeVaultEmergencyPacketEmergencyContact[]) {
  return items.map((item) => {
    const details = [
      item.role,
      item.phone ? `Phone: ${item.phone}` : null,
      item.email ? `Email: ${item.email}` : null,
      item.address ? `Address: ${item.address}` : null,
      item.notes ? `Notes: ${item.notes}` : null,
    ].filter(isPresentString);

    return renderLineItem(item.name, details);
  });
}

function renderContactTextItems(items: HomeVaultEmergencyPacketEmergencyContact[]) {
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

function renderInsurance(items: HomeVaultEmergencyPacketImportantAccount[]) {
  return items.map((item) => {
    const details = [
      item.providerName,
      item.accountNumberLast4 ? `Policy ref: ${item.accountNumberLast4}` : null,
      item.phone ? `Claims phone: ${item.phone}` : null,
      item.website ? `Website: ${item.website}` : null,
      item.recoveryNotes ? `Notes: ${item.recoveryNotes}` : null,
    ].filter(isPresentString);

    return renderLineItem(item.label, details);
  });
}

function renderInsuranceTextItems(items: HomeVaultEmergencyPacketImportantAccount[]) {
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

function renderDevices(
  items: HomeVaultEmergencyPacketDevice[],
  linkedAccessItems: HomeVaultEmergencyPacketAccessItem[],
) {
  const accessById = new Map(linkedAccessItems.map((item) => [item.id, item]));

  return items.map((item) => {
    const linkedAccessLabels = item.linkedAccessItemIds
      .map((accessId) => accessById.get(accessId)?.label)
      .filter((value): value is string => Boolean(value));
    const details = [
      item.category,
      item.roomName ? `Location: ${item.roomName}` : null,
      item.networkName ? `Network: ${item.networkName}` : null,
      item.internetProvider ? `Provider: ${item.internetProvider}` : null,
      item.networkAdminUrl ? `Admin URL: ${item.networkAdminUrl}` : null,
      linkedAccessLabels.length > 0 ? `Linked access: ${linkedAccessLabels.join(', ')}` : null,
      item.findMyDeviceEnabled === true ? 'Find My Device enabled' : null,
      item.backupEnabled === true ? 'Backups enabled' : null,
      item.screenLockEnabled === true ? 'Screen lock enabled' : null,
    ].filter(isPresentString);

    return renderLineItem(item.name, details);
  });
}

function renderDeviceTextItems(
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

function renderRecovery(
  notes: HomeVaultEmergencyPacketRecoveryNote[],
  playbooks: HomeVaultEmergencyPacket['sections']['recoveryNotes']['playbooks'],
) {
  return [
    ...notes.map((note) => renderLineItem(note.label, [note.detail])),
    ...playbooks.map((playbook) =>
      renderLineItem(
        playbook.title,
        [
          playbook.notes ?? null,
          `${playbook.steps.filter((step) => step.isRequired).length} required step${playbook.steps.filter((step) => step.isRequired).length === 1 ? '' : 's'}`,
        ].filter(isPresentString),
      ),
    ),
  ];
}

function renderRecoveryTextItems(
  notes: HomeVaultEmergencyPacketRecoveryNote[],
  playbooks: HomeVaultEmergencyPacket['sections']['recoveryNotes']['playbooks'],
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

function renderLineItem(title: string, details: Array<string | null | undefined>) {
  const cleanDetails = details.filter((detail): detail is string => Boolean(detail));

  if (cleanDetails.length === 0) {
    return escapeHtml(title);
  }

  return `<span class="item-title">${escapeHtml(title)}</span><div class="item-meta">${cleanDetails
    .map((detail) => escapeHtml(detail))
    .join(' · ')}</div>`;
}

function renderPlainLineItem(title: string, details: string[]) {
  return [title, ...details].join(' · ');
}

function isPresentString(value: string | null | undefined): value is string {
  return Boolean(value);
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'packet';
}
