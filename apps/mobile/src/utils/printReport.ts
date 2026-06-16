import * as Print from 'expo-print';

import type { AssetListItem, DocumentListItem, RoomListItem, TaskListItem } from '../data/homeVaultSampleData';
import type { Property } from '@homevault/domain';

type PrintData = {
  property: Property;
  rooms: RoomListItem[];
  assets: AssetListItem[];
  documents: DocumentListItem[];
  tasks: TaskListItem[];
};

export async function printPropertySummary(data: PrintData): Promise<void> {
  const html = buildReportHtml(data);
  await Print.printAsync({ html });
}

function formatDate(isoDate?: string): string {
  if (!isoDate) return '—';
  const [year, month, day] = isoDate.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatCents(cents?: number): string {
  if (cents == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildReportHtml(data: PrintData): string {
  const { property, rooms, assets, documents, tasks } = data;

  const generatedAt = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const activeTasks = tasks.filter((t) => t.state !== 'completed');
  const overdueTasks = activeTasks.filter((t) => t.state === 'overdue');

  const roomRows = rooms.map((room) => {
    const roomAssets = assets.filter((a) => a.roomId === room.id);
    return `
      <tr>
        <td>${escapeHtml(room.name)}</td>
        <td>${escapeHtml(room.type)}</td>
        <td>${roomAssets.length}</td>
        <td>${room.activeTaskCount}</td>
      </tr>`;
  }).join('');

  const assetRows = assets.map((asset) => `
    <tr>
      <td>${escapeHtml(asset.name)}</td>
      <td>${escapeHtml(asset.category)}</td>
      <td>${escapeHtml(asset.roomName ?? '—')}</td>
      <td>${escapeHtml(asset.brand ?? '—')}</td>
      <td>${escapeHtml(asset.model ?? '—')}</td>
      <td>${escapeHtml(asset.serial ?? '—')}</td>
      <td>${formatDate(asset.installDate)}</td>
      <td>${formatCents(asset.costCents)}</td>
      <td>${asset.warrantyExpiryLabel ? escapeHtml(asset.warrantyExpiryLabel) : '—'}</td>
    </tr>`).join('');

  const documentRows = documents.map((doc) => `
    <tr>
      <td>${escapeHtml(doc.title)}</td>
      <td>${escapeHtml(doc.typeLabel)}</td>
      <td>${escapeHtml(doc.vendor ?? '—')}</td>
      <td>${escapeHtml(doc.dateLabel)}</td>
      <td>${escapeHtml(doc.linkedToLabel)}</td>
    </tr>`).join('');

  const taskRows = activeTasks.map((task) => `
    <tr>
      <td>${escapeHtml(task.title)}</td>
      <td>${escapeHtml(task.scopeLabel)}</td>
      <td>${escapeHtml(task.dueLabel)}</td>
      <td>${escapeHtml(task.recurrenceLabel)}</td>
      <td class="${task.state === 'overdue' ? 'overdue' : ''}">${escapeHtml(formatTaskState(task.state))}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(property.label)} — HomeVault Property Summary</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, Helvetica Neue, Arial, sans-serif; color: #172026; padding: 32px; font-size: 12px; line-height: 1.5; }
  h1 { font-size: 28px; font-weight: 900; margin-bottom: 4px; }
  h2 { font-size: 15px; font-weight: 900; margin: 24px 0 10px; border-bottom: 2px solid #172026; padding-bottom: 4px; }
  .meta { color: #667781; font-size: 11px; margin-bottom: 24px; }
  .stats { display: flex; gap: 16px; margin-bottom: 20px; }
  .stat { background: #F4F7F6; border-radius: 6px; padding: 10px 16px; }
  .stat-value { font-size: 20px; font-weight: 900; }
  .stat-label { font-size: 10px; color: #667781; font-weight: 800; text-transform: uppercase; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  th { text-align: left; font-size: 10px; font-weight: 800; color: #667781; text-transform: uppercase; padding: 6px 8px; border-bottom: 1px solid #D9E2E5; }
  td { padding: 7px 8px; border-bottom: 1px solid #F4F7F6; font-size: 11px; vertical-align: top; }
  tr:last-child td { border-bottom: none; }
  .overdue { color: #9D3328; font-weight: 900; }
  .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #D9E2E5; color: #667781; font-size: 10px; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <h1>${escapeHtml(property.label)}</h1>
  <p class="meta">
    ${property.addressLabel ? `${escapeHtml(property.addressLabel)} &nbsp;·&nbsp; ` : ''}
    Generated ${generatedAt} via HomeVault
  </p>

  <div class="stats">
    <div class="stat">
      <div class="stat-value">${rooms.length}</div>
      <div class="stat-label">Rooms &amp; areas</div>
    </div>
    <div class="stat">
      <div class="stat-value">${assets.length}</div>
      <div class="stat-label">Assets</div>
    </div>
    <div class="stat">
      <div class="stat-value">${documents.length}</div>
      <div class="stat-label">Documents</div>
    </div>
    <div class="stat">
      <div class="stat-value">${activeTasks.length}${overdueTasks.length > 0 ? ` <span class="overdue">(${overdueTasks.length} overdue)</span>` : ''}</div>
      <div class="stat-label">Open tasks</div>
    </div>
  </div>

  ${rooms.length > 0 ? `
  <h2>Rooms &amp; Areas</h2>
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Type</th>
        <th>Assets</th>
        <th>Open tasks</th>
      </tr>
    </thead>
    <tbody>${roomRows}</tbody>
  </table>` : ''}

  ${assets.length > 0 ? `
  <h2>Asset Inventory</h2>
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Category</th>
        <th>Room</th>
        <th>Brand</th>
        <th>Model</th>
        <th>Serial</th>
        <th>Installed</th>
        <th>Cost</th>
        <th>Warranty</th>
      </tr>
    </thead>
    <tbody>${assetRows}</tbody>
  </table>` : ''}

  ${documents.length > 0 ? `
  <h2>Documents</h2>
  <table>
    <thead>
      <tr>
        <th>Title</th>
        <th>Type</th>
        <th>Vendor</th>
        <th>Date</th>
        <th>Linked to</th>
      </tr>
    </thead>
    <tbody>${documentRows}</tbody>
  </table>` : ''}

  ${activeTasks.length > 0 ? `
  <h2>Open Maintenance Tasks</h2>
  <table>
    <thead>
      <tr>
        <th>Task</th>
        <th>Scope</th>
        <th>Due</th>
        <th>Recurrence</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>${taskRows}</tbody>
  </table>` : ''}

  <div class="footer">
    HomeVault · ${escapeHtml(property.label)} · ${generatedAt}
  </div>
</body>
</html>`;
}

function formatTaskState(state: TaskListItem['state']): string {
  switch (state) {
    case 'overdue': return 'Overdue';
    case 'due_today': return 'Due today';
    case 'snoozed': return 'Snoozed';
    case 'upcoming': return 'Upcoming';
    default: return state;
  }
}
