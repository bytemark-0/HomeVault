import { confirmLocalStepUp } from './localStepUpAuth';

type SensitiveRevealTarget = 'access_details' | 'recovery_notes';

export async function confirmSensitiveReveal(target: SensitiveRevealTarget) {
  const copy = getRevealCopy(target);
  return confirmLocalStepUp(copy);
}

function getRevealCopy(target: SensitiveRevealTarget) {
  switch (target) {
    case 'recovery_notes':
      return {
        alertTitle: 'Reveal sensitive recovery notes?',
        alertMessage:
          'Recovery notes can help someone regain account access quickly. If device authentication is unavailable in this preview, confirm locally before revealing them on this device.',
        confirmLabel: 'Reveal notes',
        authPromptMessage: 'Authenticate to reveal recovery notes',
      };
    case 'access_details':
    default:
      return {
        alertTitle: 'Reveal sensitive access details?',
        alertMessage:
          'Codes, locations, and entry details should only be revealed when you are ready to use them. If device authentication is unavailable in this preview, confirm locally before showing them on this device.',
        confirmLabel: 'Reveal details',
        authPromptMessage: 'Authenticate to reveal access details',
      };
  }
}
