import type { HomeVaultCareCard, HomeVaultCaregiverPlan } from '@homevault/export';
import { shareTextFile } from './textShare';

export function createCareCardFileName(card: HomeVaultCareCard, extension: 'txt') {
  const templateSlug = slugify(card.template.key);
  const subjectSlug = slugify(card.subject.name);
  const propertySlug = slugify(card.property.label || card.property.id);
  const generatedDate = card.generatedAt.slice(0, 10);

  return `homevault-care-card-${templateSlug}-${subjectSlug}-${propertySlug}-${generatedDate}.${extension}`;
}

export function createCaregiverPlanFileName(plan: HomeVaultCaregiverPlan, extension: 'txt') {
  const audienceSlug = slugify(plan.audience.key);
  const templateSlug = slugify(plan.template.key);
  const subjectSlug = slugify(plan.subject.name);
  const propertySlug = slugify(plan.property.label || plan.property.id);
  const generatedDate = plan.generatedAt.slice(0, 10);

  return `homevault-caregiver-plan-${audienceSlug}-${templateSlug}-${subjectSlug}-${propertySlug}-${generatedDate}.${extension}`;
}

export async function shareCareCardFile(text: string, fileName: string) {
  return shareTextFile({
    text,
    fileName,
    dialogTitle: 'Share HomeVault care plan',
  });
}

function slugify(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'care-card'
  );
}
