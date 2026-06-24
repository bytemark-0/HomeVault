export type UxEvent =
  | 'welcome_viewed'
  | 'setup_selected'
  | 'sample_selected'
  | 'welcome_abandoned';

export function logUxEvent(eventName: UxEvent): void {
  console.log('[HomeVault ux]', JSON.stringify({ eventName, timestamp: new Date().toISOString() }));
}
