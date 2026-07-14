import type { DocumentRecord } from '@homevault/domain';

export type DocumentCollectionFilter =
  | 'all'
  | 'insurance'
  | 'warranty'
  | 'manual'
  | 'critical'
  | 'general';

type DocumentLike = Pick<DocumentRecord, 'title' | 'type'>;

export function getDocumentTypeLabel(type: DocumentRecord['type']) {
  switch (type) {
    case 'insurance':
      return 'Insurance';
    case 'policy':
      return 'Policy';
    case 'emergency':
      return 'Emergency';
    case 'home_file':
      return 'Home file';
    default:
      return type.slice(0, 1).toUpperCase() + type.slice(1);
  }
}

export function isInsuranceDocument(document: DocumentLike) {
  const title = document.title.toLowerCase();
  return (
    document.type === 'insurance' ||
    document.type === 'policy' ||
    title.includes('insurance') ||
    title.includes('policy') ||
    title.includes('claim')
  );
}

export function isWarrantyDocument(document: DocumentLike) {
  const title = document.title.toLowerCase();
  return document.type === 'warranty' || title.includes('warranty');
}

export function isManualDocument(document: DocumentLike) {
  const title = document.title.toLowerCase();
  return document.type === 'manual' || title.includes('manual') || title.includes('guide');
}

export function isCriticalDocument(document: DocumentLike) {
  const title = document.title.toLowerCase();
  return (
    isInsuranceDocument(document) ||
    document.type === 'emergency' ||
    document.type === 'home_file' ||
    title.includes('emergency') ||
    title.includes('evacuation') ||
    title.includes('shutoff') ||
    title.includes('shut off')
  );
}

export function matchesDocumentCollection(
  document: DocumentLike,
  collection: DocumentCollectionFilter,
) {
  switch (collection) {
    case 'insurance':
      return isInsuranceDocument(document);
    case 'warranty':
      return isWarrantyDocument(document);
    case 'manual':
      return isManualDocument(document);
    case 'critical':
      return isCriticalDocument(document);
    case 'general':
      return (
        !isInsuranceDocument(document) &&
        !isWarrantyDocument(document) &&
        !isManualDocument(document) &&
        !isCriticalDocument(document)
      );
    case 'all':
    default:
      return true;
  }
}

export function getDocumentReadinessLabel(document: DocumentLike) {
  if (isInsuranceDocument(document)) {
    return 'Insurance';
  }

  if (isWarrantyDocument(document)) {
    return 'Warranty';
  }

  if (isManualDocument(document)) {
    return 'Manual';
  }

  if (isCriticalDocument(document)) {
    return 'Critical file';
  }

  return 'General home file';
}
