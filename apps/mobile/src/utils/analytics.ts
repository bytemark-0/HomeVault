import { sanitizeTelemetryContext } from './sensitiveData';

export type UxEvent =
  | 'welcome_viewed'
  | 'setup_selected'
  | 'sample_selected'
  | 'welcome_abandoned';

export function logUxEvent(eventName: UxEvent, context?: unknown): void {
  console.log(
    '[HomeVault ux]',
    JSON.stringify({
      eventName,
      context: context ? sanitizeTelemetryContext(context) : undefined,
      timestamp: new Date().toISOString(),
    }),
  );
}
