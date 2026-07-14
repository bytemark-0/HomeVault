import type { HomeVaultOfflineCompanionPack } from '@homevault/export';

export function createOfflineCompanionPackFileName(
  pack: HomeVaultOfflineCompanionPack,
  extension: 'json',
) {
  const propertySlug = slugify(pack.property.label || pack.property.id);
  const targetSlug =
    pack.target.key === 'primary_user' ? 'primary-user-device' : 'helper-device';
  const generatedDate = pack.generatedAt.slice(0, 10);

  return `homevault-offline-companion-${targetSlug}-${propertySlug}-${generatedDate}.${extension}`;
}

function slugify(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'offline-companion'
  );
}
