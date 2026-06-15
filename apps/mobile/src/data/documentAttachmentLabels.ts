import type { DocumentAttachment, DocumentRecord } from '@homevault/domain';

type AttachmentSource = Pick<DocumentRecord, 'attachment' | 'filePath'>;

export function formatDocumentAttachmentStatus(document: AttachmentSource) {
  const attachment = document.attachment;

  if (attachment?.storageKind === 'app_copy') {
    return 'App copy';
  }

  if (attachment?.storageKind === 'external_reference' || document.filePath) {
    return 'External file';
  }

  return 'Metadata only';
}

export function formatDocumentAttachmentDetail(document: AttachmentSource) {
  const attachment = document.attachment;

  if (!attachment && !document.filePath) {
    return 'No file attached yet.';
  }

  if (!attachment) {
    return document.filePath ?? 'No file attached yet.';
  }

  const details = [attachment.fileName ?? attachment.storedUri];

  if (attachment.mimeType) {
    details.push(attachment.mimeType);
  }

  if (attachment.sizeBytes !== undefined) {
    details.push(formatBytes(attachment.sizeBytes));
  }

  return details.join(' · ');
}

export function formatDocumentAttachmentUri(document: AttachmentSource) {
  const uri = document.attachment?.storedUri ?? document.filePath;

  return uri ?? 'Metadata only';
}

export function getDocumentAttachmentUri(document: AttachmentSource): string | null {
  return document.attachment?.storedUri ?? document.filePath ?? null;
}

function formatBytes(value: NonNullable<DocumentAttachment['sizeBytes']>) {
  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}
