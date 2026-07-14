import {
  isDeviceAsset,
  isRouterAsset,
  type AccessItem,
  type ContinuityPlaybook,
  type EmergencyContact,
  type ImportantAccount,
  type Property,
} from '@homevault/domain';

import type { AssetListItem, DocumentListItem } from '../data/homeVaultSampleData';
import { isInsuranceDocument, isManualDocument } from './documentTaxonomy';
import {
  getAccessItemReviewSummary,
  getCriticalDeviceReviewSummary,
  getEmergencyContactReviewSummary,
  getImportantAccountReviewSummary,
  type ReviewFreshnessStatus,
} from './reviewFreshness';

export type ContinuityPlaybookTarget =
  | { kind: 'access'; id: string }
  | { kind: 'account'; id: string }
  | { kind: 'asset'; id: string }
  | { kind: 'contact'; id: string }
  | { kind: 'document'; id: string }
  | {
      kind: 'screen';
      screen: 'emergency' | 'critical_documents' | 'export' | 'new_asset' | 'new_device';
      focus?: 'packet' | 'trusted-share';
    }
  | { kind: 'new_access'; category: AccessItem['category'] }
  | { kind: 'new_account'; accountKind: ImportantAccount['kind'] };

export type ContinuityResourceFreshness = {
  status: ReviewFreshnessStatus;
  label: string;
  detail: string;
  lastReviewedAt?: string;
};

export type ContinuityPlaybookResource = {
  key: string;
  label: string;
  detail: string;
  freshness?: ContinuityResourceFreshness;
  priority: 'required' | 'recommended';
  status: 'ready' | 'missing';
  target: ContinuityPlaybookTarget;
};

export type ContinuityPlaybookGuideStep = ContinuityPlaybook['steps'][number] & {
  requiredResourceKeys: string[];
};

export type ContinuityPlaybookGuide = {
  id: string;
  source: 'guided' | 'saved';
  title: string;
  category: ContinuityPlaybook['category'];
  state: ContinuityPlaybook['state'];
  whenToUse: string;
  summary: string;
  notes?: string;
  steps: ContinuityPlaybookGuideStep[];
  readyRecords: ContinuityPlaybookResource[];
  missingRecords: ContinuityPlaybookResource[];
};

export type ContinuityDrillStepResource = ContinuityPlaybookResource & {
  actionLabel: string;
  detail: string;
  sensitivity: 'standard' | 'protected';
};

export type ContinuityDrillStep = ContinuityPlaybookGuideStep & {
  resources: ContinuityDrillStepResource[];
};

export type ContinuityDrillScenario = {
  id: string;
  title: string;
  summary: string;
  whenToUse: string;
  notes?: string;
  steps: ContinuityDrillStep[];
  missingRecordLabels: string[];
};

type BuildContinuityPlaybookGuidesInput = {
  property: Property;
  assets: AssetListItem[];
  documents: DocumentListItem[];
  accessItems: AccessItem[];
  emergencyContacts: EmergencyContact[];
  importantAccounts: ImportantAccount[];
  continuityPlaybooks: ContinuityPlaybook[];
};

type GuideResourceSpec = {
  key: string;
  label: string;
  detail: string;
  priority: 'required' | 'recommended';
  status: 'ready' | 'missing';
  target: ContinuityPlaybookTarget;
};

type GuideStepSpec = {
  label: string;
  notes?: string;
  requiredResourceKeys: string[];
  isRequired?: boolean;
};

export function buildContinuityPlaybookGuides(
  input: BuildContinuityPlaybookGuidesInput,
): ContinuityPlaybookGuide[] {
  const freshnessByTarget = buildResourceFreshnessByTarget(input);
  const guided = buildGuidedPlaybooks(input);
  const saved = buildSavedPlaybooks(input);

  return [...guided, ...saved].map((guide) => attachResourceFreshness(guide, freshnessByTarget));
}

export function formatContinuityPlaybookState(state: ContinuityPlaybook['state']) {
  switch (state) {
    case 'ready':
      return 'Ready';
    case 'in_progress':
      return 'In progress';
    case 'not_started':
    default:
      return 'Needs setup';
  }
}

const DRILL_ELIGIBLE_GUIDE_IDS = new Set([
  'guide-home-lockout',
  'guide-internet-outage',
  'guide-stolen-phone',
]);

export function supportsContinuityDrill(guide: Pick<ContinuityPlaybookGuide, 'id' | 'source'>) {
  return guide.source === 'guided' && DRILL_ELIGIBLE_GUIDE_IDS.has(guide.id);
}

export function buildContinuityDrillScenario(
  guide: ContinuityPlaybookGuide,
): ContinuityDrillScenario | null {
  if (!supportsContinuityDrill(guide)) {
    return null;
  }

  const resourceByKey = new Map(
    [...guide.readyRecords, ...guide.missingRecords].map((resource) => [resource.key, resource]),
  );

  return {
    id: guide.id,
    title: guide.title,
    summary: guide.summary,
    whenToUse: guide.whenToUse,
    notes: guide.notes,
    steps: guide.steps.map((step) => ({
      ...step,
      resources: step.requiredResourceKeys
        .map((resourceKey) => resourceByKey.get(resourceKey))
        .filter((resource): resource is ContinuityPlaybookResource => Boolean(resource))
        .map((resource) => toDrillStepResource(resource)),
    })),
    missingRecordLabels: guide.missingRecords.map((record) => record.label),
  };
}

function buildGuidedPlaybooks({
  property,
  assets,
  documents,
  accessItems,
  emergencyContacts,
  importantAccounts,
}: BuildContinuityPlaybookGuidesInput) {
  const routerAsset = assets.find((asset) => isRouterAsset(asset));
  const phoneAsset = assets.find((asset) => isPhoneAsset(asset));
  const recoveryDevice = assets.find((asset) => isDeviceAsset(asset));
  const internetAccess = accessItems.find(
    (item) => item.category === 'router' || item.category === 'wifi',
  );
  const lockoutAccess = accessItems.find((item) =>
    item.category === 'lockbox' ||
    item.category === 'entry_note' ||
    item.category === 'garage' ||
    item.category === 'safe',
  );
  const internetAccount = importantAccounts.find(
    (account) => account.kind === 'internet' || account.kind === 'utility',
  );
  const utilityAccount =
    importantAccounts.find((account) => account.kind === 'utility') ?? internetAccount;
  const insuranceAccount = importantAccounts.find((account) => account.kind === 'insurance');
  const carrierAccount = importantAccounts.find((account) => account.kind === 'carrier');
  const bankingAccount = importantAccounts.find((account) => account.kind === 'banking');
  const emailAccount = importantAccounts.find((account) => account.kind === 'email');
  const trustedContact = emergencyContacts.find((contact) => contact.priority === 'primary') ?? emergencyContacts[0];
  const recoveryAccount = importantAccounts.find(
    (account) =>
      Boolean(account.recoveryNotes) ||
      account.mfaEnabled === true ||
      account.managedInPasswordManager === true ||
      account.recoveryCodesStored === true,
  );
  const callbackAccount = findKnownGoodCallbackAccount(importantAccounts);
  const utilityShutoffAccess = accessItems.find((item) => item.category === 'utility_shutoff');
  const linkedPhoneDocs = phoneAsset
    ? documents.filter((document) => document.linkedRecordIds.includes(phoneAsset.id))
    : [];
  const routerDocs = documents.filter(
    (document) =>
      Boolean(routerAsset && document.linkedRecordIds.includes(routerAsset.id)) ||
      isManualDocument(document) ||
      document.title.toLowerCase().includes('router') ||
      document.title.toLowerCase().includes('wifi'),
  );
  const insuranceDocument = documents.find((document) => isInsuranceDocument(document));

  return [
    buildGuide({
      id: 'guide-stolen-phone',
      propertyId: property.id,
      category: 'digital_safety',
      title: 'Stolen phone recovery',
      whenToUse: 'Use this when the main household phone is missing, stolen, or locked down.',
      notes:
        'Start with the device record, then use saved account recovery details without storing passwords in HomeVault.',
      resources: [
        phoneAsset
          ? readyResource(
              'phone_device',
              phoneAsset.name,
              `${phoneAsset.category}${phoneAsset.findMyDeviceEnabled === true ? ' · Find My enabled' : ''}`,
              { kind: 'asset', id: phoneAsset.id },
            )
          : missingResource(
              'phone_device',
              'Primary phone or tablet',
              'Add the main recovery device so this playbook can point to the right hardware.',
              { kind: 'screen', screen: 'new_device' },
            ),
        recoveryAccount
          ? readyResource(
              'recovery_account',
              recoveryAccount.label,
              recoveryAccount.recoveryNotes ?? 'Recovery readiness saved on this account.',
              { kind: 'account', id: recoveryAccount.id },
            )
          : missingResource(
              'recovery_account',
              'Recovery-ready important account',
              'Save at least one important account with MFA or recovery notes.',
              { kind: 'new_account', accountKind: 'banking' },
            ),
        trustedContact
          ? recommendedReadyResource(
              'trusted_contact',
              trustedContact.name,
              trustedContact.role,
              { kind: 'contact', id: trustedContact.id },
            )
          : recommendedMissingResource(
              'trusted_contact',
              'Trusted contact',
              'Add a contact who can help confirm identity or reach the house.',
              { kind: 'screen', screen: 'emergency' },
            ),
      ],
      steps: [
        {
          label: 'Locate or lock the device from the saved phone record.',
          notes: 'Check whether Find My Device and screen lock were already turned on.',
          requiredResourceKeys: ['phone_device'],
        },
        {
          label: 'Open the linked recovery-ready account and follow the saved notes.',
          notes: 'Use notes about MFA, recovery codes, and password manager readiness.',
          requiredResourceKeys: ['recovery_account'],
        },
        {
          label: 'Contact a trusted helper if you need someone else to verify access or reach the home.',
          requiredResourceKeys: ['trusted_contact'],
          isRequired: false,
        },
      ],
    }),
    buildGuide({
      id: 'guide-home-lockout',
      propertyId: property.id,
      category: 'handoff',
      title: 'Home lockout recovery',
      whenToUse: 'Use this when someone is locked out and needs entry instructions fast.',
      notes: 'Keep one clear access note plus a backup helper if someone else may need to get in.',
      resources: [
        lockoutAccess
          ? readyResource(
              'lockout_access',
              lockoutAccess.label,
              lockoutAccess.location ?? formatAccessCategory(lockoutAccess.category),
              { kind: 'access', id: lockoutAccess.id },
            )
          : missingResource(
              'lockout_access',
              'Lockbox or entry note',
              'Save one lockbox, spare-key, or entry instruction record.',
              { kind: 'new_access', category: 'lockbox' },
            ),
        trustedContact
          ? recommendedReadyResource(
              'lockout_contact',
              trustedContact.name,
              trustedContact.role,
              { kind: 'contact', id: trustedContact.id },
            )
          : recommendedMissingResource(
              'lockout_contact',
              'Emergency contact with access',
              'Keep one person listed who can help during a lockout.',
              { kind: 'screen', screen: 'emergency' },
            ),
      ],
      steps: [
        {
          label: 'Open the saved entry or lockbox instructions first.',
          requiredResourceKeys: ['lockout_access'],
        },
        {
          label: 'Call the listed helper if the saved note is not enough.',
          requiredResourceKeys: ['lockout_contact'],
          isRequired: false,
        },
      ],
    }),
    buildGuide({
      id: 'guide-internet-outage',
      propertyId: property.id,
      category: 'emergency',
      title: 'Internet outage recovery',
      whenToUse: 'Use this when Wi-Fi is down, the router is offline, or the provider needs a call.',
      notes: 'This playbook points to the router, its access details, and the provider account if one exists.',
      resources: [
        internetAccess
          ? readyResource(
              'internet_access',
              internetAccess.label,
              internetAccess.username ?? formatAccessCategory(internetAccess.category),
              { kind: 'access', id: internetAccess.id },
            )
          : missingResource(
              'internet_access',
              'Router or Wi-Fi access note',
              'Save the network name, login, or restart instructions for the internet hardware.',
              { kind: 'new_access', category: 'router' },
            ),
        routerAsset
          ? readyResource(
              'router_device',
              routerAsset.name,
              routerAsset.roomName ? `${routerAsset.category} · ${routerAsset.roomName}` : routerAsset.category,
              { kind: 'asset', id: routerAsset.id },
            )
          : missingResource(
              'router_device',
              'Router or modem device',
              'Add the router, modem, or mesh unit so the outage plan points to real equipment.',
              { kind: 'screen', screen: 'new_device' },
            ),
        internetAccount
          ? recommendedReadyResource(
              'internet_account',
              internetAccount.label,
              internetAccount.providerName,
              { kind: 'account', id: internetAccount.id },
            )
          : recommendedMissingResource(
              'internet_account',
              'Internet provider account',
              'Add the provider or utility account so claims and outage calls are easier.',
              { kind: 'new_account', accountKind: 'internet' },
            ),
        routerDocs[0]
          ? recommendedReadyResource(
              'router_doc',
              routerDocs[0].title,
              routerDocs[0].typeLabel,
              { kind: 'document', id: routerDocs[0].id },
            )
          : recommendedMissingResource(
              'router_doc',
              'Router manual or outage document',
              'Attach the router manual, troubleshooting notes, or provider handoff document.',
              { kind: 'screen', screen: 'critical_documents' },
            ),
      ],
      steps: [
        {
          label: 'Open the saved router or Wi-Fi instructions.',
          requiredResourceKeys: ['internet_access'],
        },
        {
          label: 'Check the linked router or modem record for location and device details.',
          requiredResourceKeys: ['router_device'],
        },
        {
          label: 'Call the saved provider account or review the linked document if the restart fails.',
          requiredResourceKeys: ['internet_account', 'router_doc'],
          isRequired: false,
        },
      ],
    }),
    buildGuide({
      id: 'guide-account-recovery',
      propertyId: property.id,
      category: 'digital_safety',
      title: 'Account access recovery',
      whenToUse: 'Use this when an important account is locked, challenged, or needs recovery help.',
      notes:
        'This playbook keeps recovery notes and device readiness visible without storing passwords or one-time codes in HomeVault.',
      resources: [
        recoveryAccount
          ? readyResource(
              'recovery_account',
              recoveryAccount.label,
              recoveryAccount.recoveryNotes ?? 'Recovery readiness saved on this account.',
              { kind: 'account', id: recoveryAccount.id },
            )
          : missingResource(
              'recovery_account',
              'Recovery-ready important account',
              'Save at least one important account with recovery notes, MFA, or password-manager readiness.',
              { kind: 'new_account', accountKind: 'banking' },
            ),
        recoveryDevice
          ? readyResource(
              'recovery_device',
              recoveryDevice.name,
              `${recoveryDevice.category}${
                recoveryDevice.findMyDeviceEnabled === true ? ' · Find My enabled' : ''
              }`,
              { kind: 'asset', id: recoveryDevice.id },
            )
          : missingResource(
              'recovery_device',
              'Primary recovery device',
              'Add the phone, tablet, or laptop someone would use to complete recovery steps.',
              { kind: 'screen', screen: 'new_device' },
            ),
        trustedContact
          ? recommendedReadyResource(
              'recovery_contact',
              trustedContact.name,
              trustedContact.role,
              { kind: 'contact', id: trustedContact.id },
            )
          : recommendedMissingResource(
              'recovery_contact',
              'Trusted contact',
              'Add one trusted person who can help verify identity or reach the home during recovery.',
              { kind: 'screen', screen: 'emergency' },
            ),
      ],
      steps: [
        {
          label: 'Open the saved account and start with the recovery notes or readiness checklist.',
          requiredResourceKeys: ['recovery_account'],
        },
        {
          label: 'Use the linked primary device record to confirm backup, screen lock, and find-my-device readiness.',
          requiredResourceKeys: ['recovery_device'],
        },
        {
          label: 'Contact the trusted helper if provider support needs another person or home access confirmation.',
          requiredResourceKeys: ['recovery_contact'],
          isRequired: false,
        },
      ],
    }),
    buildGuide({
      id: 'guide-insurance-incident',
      propertyId: property.id,
      category: 'emergency',
      title: 'Insurance incident response',
      whenToUse: 'Use this after damage, theft, or another claim-worthy incident at home.',
      notes: 'This playbook links the insurer, policy documents, and emergency packet export path.',
      resources: [
        insuranceAccount
          ? readyResource(
              'insurance_account',
              insuranceAccount.label,
              insuranceAccount.providerName,
              { kind: 'account', id: insuranceAccount.id },
            )
          : missingResource(
              'insurance_account',
              'Insurance account',
              'Add the household insurance or warranty account first.',
              { kind: 'new_account', accountKind: 'insurance' },
            ),
        insuranceDocument
          ? readyResource(
              'insurance_document',
              insuranceDocument.title,
              insuranceDocument.typeLabel,
              { kind: 'document', id: insuranceDocument.id },
            )
          : missingResource(
              'insurance_document',
              'Policy or claim document',
              'Attach the policy, declarations page, or claim instructions.',
              { kind: 'screen', screen: 'critical_documents' },
            ),
        recommendedReadyResource(
          'emergency_packet',
          'Emergency packet',
          'Share or print the current emergency packet for a spouse, sitter, or helper.',
          { kind: 'screen', screen: 'export', focus: 'packet' },
        ),
      ],
      steps: [
        {
          label: 'Open the insurance account and confirm the right provider and phone number.',
          requiredResourceKeys: ['insurance_account'],
        },
        {
          label: 'Open the linked policy or claim document.',
          requiredResourceKeys: ['insurance_document'],
        },
        {
          label: 'Generate the emergency packet if someone else needs the same essentials quickly.',
          requiredResourceKeys: ['emergency_packet'],
          isRequired: false,
        },
      ],
    }),
    buildGuide({
      id: 'guide-urgent-scam-call',
      propertyId: property.id,
      category: 'digital_safety',
      title: 'Urgent call scam response',
      whenToUse: 'Use this when a caller, text, or email is pushing for instant action, money, or one-time codes.',
      notes:
        'Household rule: pause first, then call back using contact details you already trust. HomeVault does not monitor scams live; it only keeps your callback records ready.',
      resources: [
        callbackAccount
          ? readyResource(
              'callback_account',
              callbackAccount.label,
              formatAccountSupportDetail(callbackAccount, 'Use this saved account for a known-good callback.'),
              { kind: 'account', id: callbackAccount.id },
            )
          : missingResource(
              'callback_account',
              'Verified callback account',
              'Save at least one important account with a phone number, website, or support email you already trust.',
              { kind: 'new_account', accountKind: 'banking' },
            ),
        trustedContact
          ? recommendedReadyResource(
              'trusted_contact',
              trustedContact.name,
              `${trustedContact.role} · Use this person as a second set of ears before approving anything unusual.`,
              { kind: 'screen', screen: 'emergency' },
            )
          : recommendedMissingResource(
              'trusted_contact',
              'Trusted household contact',
              'Add a person you can pause with before acting on a rushed request.',
              { kind: 'screen', screen: 'emergency' },
            ),
        emailAccount
          ? recommendedReadyResource(
              'recovery_email',
              emailAccount.label,
              formatAccountSupportDetail(emailAccount, 'Check this saved email record for legitimate alerts after you call back.'),
              { kind: 'account', id: emailAccount.id },
            )
          : recommendedMissingResource(
              'recovery_email',
              'Household recovery email',
              'Add the shared recovery email so you have a calm place to verify account alerts.',
              { kind: 'new_account', accountKind: 'email' },
            ),
      ],
      steps: [
        {
          label: 'Pause the conversation and do not share codes, payment details, or remote-access approvals.',
          notes: 'A real provider can wait while you verify the issue yourself.',
          requiredResourceKeys: ['callback_account'],
        },
        {
          label: 'Open the saved account record and call back using only the number, website, or email already stored there.',
          notes: 'Do not use the incoming caller ID, link, or text thread.',
          requiredResourceKeys: ['callback_account'],
        },
        {
          label: 'Ask a trusted household helper to listen in before you approve anything that still feels urgent.',
          requiredResourceKeys: ['trusted_contact'],
          isRequired: false,
        },
      ],
    }),
    buildGuide({
      id: 'guide-fake-utility-shutoff',
      propertyId: property.id,
      category: 'emergency',
      title: 'Utility shutoff scam response',
      whenToUse: 'Use this when someone threatens same-day shutoff or demands immediate payment for power, water, gas, or internet.',
      notes:
        'Pause, verify independently, and call the provider back from the saved account. HomeVault can guide you to records; it does not detect shutoff scams for you.',
      resources: [
        utilityAccount
          ? readyResource(
              'utility_account',
              utilityAccount.label,
              formatAccountSupportDetail(utilityAccount, 'Use this saved provider account for the callback.'),
              { kind: 'account', id: utilityAccount.id },
            )
          : missingResource(
              'utility_account',
              'Utility provider account',
              'Save the power, water, gas, or internet provider account with a known-good callback path.',
              { kind: 'new_account', accountKind: 'utility' },
            ),
        utilityShutoffAccess
          ? readyResource(
              'utility_shutoff',
              utilityShutoffAccess.label,
              utilityShutoffAccess.location ?? 'Saved utility shutoff instructions',
              { kind: 'access', id: utilityShutoffAccess.id },
            )
          : missingResource(
              'utility_shutoff',
              'Utility shutoff note',
              'Save the real shutoff location so you can tell a home utility problem from a pressure scam.',
              { kind: 'new_access', category: 'utility_shutoff' },
            ),
        trustedContact
          ? recommendedReadyResource(
              'utility_contact',
              trustedContact.name,
              `${trustedContact.role} · Ask this person to slow the decision down before any payment.`,
              { kind: 'screen', screen: 'emergency' },
            )
          : recommendedMissingResource(
              'utility_contact',
              'Trusted household contact',
              'Add someone who can help verify the situation before you pay or disclose account details.',
              { kind: 'screen', screen: 'emergency' },
            ),
      ],
      steps: [
        {
          label: 'Pause and do not pay through the incoming call, text, or QR code.',
          notes: 'Threats about instant shutoff are a signal to slow down first.',
          requiredResourceKeys: ['utility_account'],
        },
        {
          label: 'Open the saved shutoff note and confirm whether there is any real utility issue at the house.',
          requiredResourceKeys: ['utility_shutoff'],
        },
        {
          label: 'Call the provider back using the saved account phone number or website and verify independently.',
          requiredResourceKeys: ['utility_account'],
        },
      ],
    }),
    buildGuide({
      id: 'guide-carrier-fraud',
      propertyId: property.id,
      category: 'digital_safety',
      title: 'Carrier fraud or SIM-swap response',
      whenToUse: 'Use this when calls or texts suddenly stop, a number is being ported out, or someone asks for carrier passcodes.',
      notes:
        'Pause before sharing anything. Use the saved carrier account, the affected device record, and the recovery email to lock the line down through known-good channels.',
      resources: [
        carrierAccount
          ? readyResource(
              'carrier_account',
              carrierAccount.label,
              formatAccountSupportDetail(carrierAccount, 'Use this saved carrier account for the callback and account lock steps.'),
              { kind: 'account', id: carrierAccount.id },
            )
          : missingResource(
              'carrier_account',
              'Carrier account',
              'Save the mobile carrier account with the callback number or website you trust.',
              { kind: 'new_account', accountKind: 'carrier' },
            ),
        phoneAsset
          ? readyResource(
              'carrier_device',
              phoneAsset.name,
              `${phoneAsset.category}${phoneAsset.findMyDeviceEnabled === true ? ' · Find My enabled' : ''}`,
              { kind: 'asset', id: phoneAsset.id },
            )
          : missingResource(
              'carrier_device',
              'Primary phone',
              'Add the phone or tablet tied to the affected line so the playbook points to the right device.',
              { kind: 'screen', screen: 'new_device' },
            ),
        emailAccount
          ? recommendedReadyResource(
              'carrier_email',
              emailAccount.label,
              formatAccountSupportDetail(emailAccount, 'Check this saved email account for legitimate carrier alerts after you call back.'),
              { kind: 'account', id: emailAccount.id },
            )
          : recommendedMissingResource(
              'carrier_email',
              'Recovery email',
              'Add the household recovery email so line-change alerts have a known landing spot.',
              { kind: 'new_account', accountKind: 'email' },
            ),
      ],
      steps: [
        {
          label: 'Pause and do not read one-time codes, account PINs, or port-out details to anyone who contacted you.',
          requiredResourceKeys: ['carrier_account'],
        },
        {
          label: 'Open the linked device record so you know which phone and line are affected.',
          requiredResourceKeys: ['carrier_device'],
        },
        {
          label: 'Call the carrier back from the saved account record and ask about line lock, port freeze, or recent account changes.',
          requiredResourceKeys: ['carrier_account'],
        },
      ],
    }),
    buildGuide({
      id: 'guide-bank-account-panic',
      propertyId: property.id,
      category: 'digital_safety',
      title: 'Bank account panic response',
      whenToUse: 'Use this when a caller, text, or app alert says money is missing or an account needs an immediate transfer or reset.',
      notes:
        'Pause, verify independently, and use only the saved bank contact details or trusted app path. HomeVault does not watch your accounts live.',
      resources: [
        bankingAccount
          ? readyResource(
              'bank_account',
              bankingAccount.label,
              formatAccountSupportDetail(bankingAccount, 'Use this saved bank account for the callback and support path.'),
              { kind: 'account', id: bankingAccount.id },
            )
          : missingResource(
              'bank_account',
              'Bank account record',
              'Save the main banking or card account with a verified phone number or website.',
              { kind: 'new_account', accountKind: 'banking' },
            ),
        recoveryDevice
          ? readyResource(
              'bank_device',
              recoveryDevice.name,
              `${recoveryDevice.category}${recoveryDevice.screenLockEnabled === true ? ' · Screen lock enabled' : ''}`,
              { kind: 'asset', id: recoveryDevice.id },
            )
          : missingResource(
              'bank_device',
              'Trusted device',
              'Add the phone, tablet, or laptop you use to open the bank app from a trusted source.',
              { kind: 'screen', screen: 'new_device' },
            ),
        trustedContact
          ? recommendedReadyResource(
              'bank_contact',
              trustedContact.name,
              `${trustedContact.role} · Use this person to slow the decision down before moving money.`,
              { kind: 'screen', screen: 'emergency' },
            )
          : recommendedMissingResource(
              'bank_contact',
              'Trusted household contact',
              'Add someone who can talk through the situation before any transfer or urgent payment.',
              { kind: 'screen', screen: 'emergency' },
            ),
      ],
      steps: [
        {
          label: 'Pause and do not move money, approve transfers, or share codes based on the incoming alert.',
          requiredResourceKeys: ['bank_account'],
        },
        {
          label: 'Open the saved bank record and call back using the known-good phone number or website already stored there.',
          requiredResourceKeys: ['bank_account'],
        },
        {
          label: 'Use the saved trusted device to sign in from the real app or bookmark, not the incoming link.',
          requiredResourceKeys: ['bank_device'],
        },
      ],
    }),
    buildGuide({
      id: 'guide-house-sitter-handoff',
      propertyId: property.id,
      category: 'handoff',
      title: 'House sitter handoff',
      whenToUse: 'Use this before a sitter, pet helper, or short-term guest needs practical access to the home.',
      notes:
        'Start from the House sitter trusted-share preset so access, contacts, and device basics are included while insurance and recovery details stay out by default.',
      resources: [
        lockoutAccess
          ? readyResource(
              'sitter_access',
              lockoutAccess.label,
              lockoutAccess.location ?? formatAccessCategory(lockoutAccess.category),
              { kind: 'access', id: lockoutAccess.id },
            )
          : missingResource(
              'sitter_access',
              'Entry or lockbox note',
              'Save one clear entry note, lockbox, or garage access record for the sitter.',
              { kind: 'new_access', category: 'lockbox' },
            ),
        trustedContact
          ? readyResource(
              'sitter_contact',
              trustedContact.name,
              `${trustedContact.role} · First call if the sitter cannot reach you.`,
              { kind: 'screen', screen: 'emergency' },
            )
          : missingResource(
              'sitter_contact',
              'First-call contact',
              'Add one local contact the sitter should call before escalating further.',
              { kind: 'screen', screen: 'emergency' },
            ),
        internetAccess
          ? recommendedReadyResource(
              'sitter_wifi',
              internetAccess.label,
              'Share only the household connectivity details the sitter actually needs.',
              { kind: 'access', id: internetAccess.id },
            )
          : recommendedMissingResource(
              'sitter_wifi',
              'Wi-Fi or router note',
              'Add Wi-Fi details if a sitter will need internet access while you are away.',
              { kind: 'new_access', category: 'wifi' },
            ),
        readyResource(
          'sitter_handoff',
          'Trusted handoff export',
          'Open Export and use the House sitter preset before sharing.',
          { kind: 'screen', screen: 'export', focus: 'trusted-share' },
        ),
      ],
      steps: [
        {
          label: 'Review the saved entry instructions and confirm they still match the door, gate, or lockbox someone will use.',
          requiredResourceKeys: ['sitter_access'],
        },
        {
          label: 'Open trusted handoff export and use the House sitter preset so unrelated household details stay out by default.',
          requiredResourceKeys: ['sitter_handoff'],
        },
        {
          label: 'Confirm the sitter knows the first-call contact and when to reach you before trying anything else.',
          requiredResourceKeys: ['sitter_contact'],
        },
      ],
    }),
    buildGuide({
      id: 'guide-travel-handoff',
      propertyId: property.id,
      category: 'travel',
      title: 'Travel handoff',
      whenToUse: 'Use this before extended travel so one trusted person can help with routine issues while you are away.',
      notes:
        'Review this the day before travel. Start from the Travel handoff trusted-share preset so the helper gets access, contact, and device basics without the fuller emergency packet by default.',
      resources: [
        lockoutAccess
          ? readyResource(
              'travel_access',
              lockoutAccess.label,
              lockoutAccess.location ?? formatAccessCategory(lockoutAccess.category),
              { kind: 'access', id: lockoutAccess.id },
            )
          : missingResource(
              'travel_access',
              'Entry or lockbox note',
              'Save one practical entry record before you leave town.',
              { kind: 'new_access', category: 'lockbox' },
            ),
        utilityShutoffAccess
          ? readyResource(
              'travel_shutoff',
              utilityShutoffAccess.label,
              utilityShutoffAccess.location ?? 'Saved utility shutoff instructions',
              { kind: 'access', id: utilityShutoffAccess.id },
            )
          : missingResource(
              'travel_shutoff',
              'Utility shutoff note',
              'Save the main shutoff location before extended travel so someone can act without guessing.',
              { kind: 'new_access', category: 'utility_shutoff' },
            ),
        trustedContact
          ? readyResource(
              'travel_contact',
              trustedContact.name,
              `${trustedContact.role} · Local fallback if your helper cannot reach you.`,
              { kind: 'screen', screen: 'emergency' },
            )
          : missingResource(
              'travel_contact',
              'Local fallback contact',
              'Add someone nearby who can help if the main helper cannot reach you.',
              { kind: 'screen', screen: 'emergency' },
            ),
        readyResource(
          'travel_handoff',
          'Trusted handoff export',
          'Open Export and use the Travel handoff preset before you leave.',
          { kind: 'screen', screen: 'export', focus: 'trusted-share' },
        ),
      ],
      steps: [
        {
          label: 'Review entry notes, utility shutoff details, and first-call contacts before the trip starts.',
          requiredResourceKeys: ['travel_access', 'travel_shutoff', 'travel_contact'],
        },
        {
          label: 'Open trusted handoff export and load the Travel handoff preset for a lighter temporary helper package.',
          requiredResourceKeys: ['travel_handoff'],
        },
        {
          label: 'Confirm when the helper should pause, text you first, or call local support on their own.',
          requiredResourceKeys: ['travel_contact'],
        },
      ],
    }),
    buildGuide({
      id: 'guide-storm-prep',
      propertyId: property.id,
      category: 'storm',
      title: 'Storm prep checklist',
      whenToUse: 'Use this before severe weather, wind, hail, or a forecasted outage reaches the home.',
      notes:
        'This is a pre-event readiness guide. It reuses your saved insurance, shutoff, contact, and packet records instead of creating a separate storm system.',
      resources: [
        insuranceAccount
          ? readyResource(
              'storm_insurance',
              insuranceAccount.label,
              formatAccountSupportDetail(insuranceAccount, 'Use this saved insurance record if damage turns into a claim.'),
              { kind: 'account', id: insuranceAccount.id },
            )
          : missingResource(
              'storm_insurance',
              'Insurance account',
              'Add the household insurance account before storm season.',
              { kind: 'new_account', accountKind: 'insurance' },
            ),
        utilityShutoffAccess
          ? readyResource(
              'storm_shutoff',
              utilityShutoffAccess.label,
              utilityShutoffAccess.location ?? 'Saved utility shutoff instructions',
              { kind: 'access', id: utilityShutoffAccess.id },
            )
          : missingResource(
              'storm_shutoff',
              'Utility shutoff note',
              'Save gas, power, or water shutoff guidance before a storm is on top of you.',
              { kind: 'new_access', category: 'utility_shutoff' },
            ),
        trustedContact
          ? readyResource(
              'storm_contact',
              trustedContact.name,
              `${trustedContact.role} · Local helper if weather interrupts travel or access.`,
              { kind: 'screen', screen: 'emergency' },
            )
          : missingResource(
              'storm_contact',
              'Emergency contact',
              'Add a local contact before the next storm watch or warning.',
              { kind: 'screen', screen: 'emergency' },
            ),
        readyResource(
          'storm_packet',
          'Emergency packet export',
          'Open Export and print or share the current emergency packet before the weather turns.',
          { kind: 'screen', screen: 'export', focus: 'packet' },
        ),
      ],
      steps: [
        {
          label: 'Review insurance, shutoff, and helper records before the storm arrives.',
          requiredResourceKeys: ['storm_insurance', 'storm_shutoff', 'storm_contact'],
        },
        {
          label: 'Export the emergency packet so a spouse or helper can act even if service is spotty.',
          requiredResourceKeys: ['storm_packet'],
        },
        {
          label: 'Use the packet and linked records as you pack go-bag basics, charge devices, and confirm document access.',
          requiredResourceKeys: ['storm_packet'],
          isRequired: false,
        },
      ],
    }),
    buildGuide({
      id: 'guide-evacuation-ready',
      propertyId: property.id,
      category: 'storm',
      title: 'Evacuation readiness plan',
      whenToUse: 'Use this when evacuation becomes possible or likely and you need to leave with the right household details quickly.',
      notes:
        'This guide reuses emergency contacts, utility details, insurance records, and packet export paths so evacuation prep does not become a separate workflow.',
      resources: [
        trustedContact
          ? readyResource(
              'evac_contact',
              trustedContact.name,
              `${trustedContact.role} · Share departure status and fallback plans here first.`,
              { kind: 'screen', screen: 'emergency' },
            )
          : missingResource(
              'evac_contact',
              'Emergency contact',
              'Add one trusted contact who should hear your departure plan first.',
              { kind: 'screen', screen: 'emergency' },
            ),
        utilityShutoffAccess
          ? readyResource(
              'evac_shutoff',
              utilityShutoffAccess.label,
              utilityShutoffAccess.location ?? 'Saved utility shutoff instructions',
              { kind: 'access', id: utilityShutoffAccess.id },
            )
          : missingResource(
              'evac_shutoff',
              'Utility shutoff note',
              'Save the main shutoff note so you can review it before leaving.',
              { kind: 'new_access', category: 'utility_shutoff' },
            ),
        insuranceDocument
          ? readyResource(
              'evac_document',
              insuranceDocument.title,
              insuranceDocument.typeLabel,
              { kind: 'document', id: insuranceDocument.id },
            )
          : missingResource(
              'evac_document',
              'Insurance or evacuation document',
              'Attach at least one policy, claim, or emergency document before you need to leave quickly.',
              { kind: 'screen', screen: 'critical_documents' },
            ),
        readyResource(
          'evac_packet',
          'Emergency packet export',
          'Open Export and save the current packet before you leave.',
          { kind: 'screen', screen: 'export', focus: 'packet' },
        ),
      ],
      steps: [
        {
          label: 'Review the contact, shutoff, and insurance records before you leave the property.',
          requiredResourceKeys: ['evac_contact', 'evac_shutoff', 'evac_document'],
        },
        {
          label: 'Export the current emergency packet so you have a portable copy of the essentials.',
          requiredResourceKeys: ['evac_packet'],
        },
        {
          label: 'Use the packet to double-check go-bag documents, helper calls, and property shutdown steps.',
          requiredResourceKeys: ['evac_packet'],
          isRequired: false,
        },
      ],
    }),
  ];
}

function buildSavedPlaybooks({
  property,
  assets,
  documents,
  accessItems,
  emergencyContacts,
  importantAccounts,
  continuityPlaybooks,
}: BuildContinuityPlaybookGuidesInput) {
  const assetById = new Map(assets.map((asset) => [asset.id, asset]));
  const documentById = new Map(documents.map((document) => [document.id, document]));
  const accessById = new Map(accessItems.map((item) => [item.id, item]));
  const accountById = new Map(importantAccounts.map((account) => [account.id, account]));
  const contactById = new Map(emergencyContacts.map((contact) => [contact.id, contact]));

  return continuityPlaybooks.map((playbook) => {
    const resources = playbook.linkedRecordIds.map((recordId, index) => {
      if (recordId === property.id) {
        return readyResource(
          `saved-${playbook.id}-${index}`,
          property.label,
          'Household record',
          { kind: 'screen', screen: 'emergency' },
        );
      }

      const asset = assetById.get(recordId);
      if (asset) {
        return readyResource(
          `saved-${playbook.id}-${index}`,
          asset.name,
          asset.roomName ? `${asset.category} · ${asset.roomName}` : asset.category,
          { kind: 'asset', id: asset.id },
        );
      }

      const document = documentById.get(recordId);
      if (document) {
        return readyResource(
          `saved-${playbook.id}-${index}`,
          document.title,
          `${document.typeLabel} · ${document.linkedToLabel}`,
          { kind: 'document', id: document.id },
        );
      }

      const accessItem = accessById.get(recordId);
      if (accessItem) {
        return readyResource(
          `saved-${playbook.id}-${index}`,
          accessItem.label,
          formatAccessCategory(accessItem.category),
          { kind: 'access', id: accessItem.id },
        );
      }

      const account = accountById.get(recordId);
      if (account) {
        return readyResource(
          `saved-${playbook.id}-${index}`,
          account.label,
          account.providerName,
          { kind: 'account', id: account.id },
        );
      }

      const contact = contactById.get(recordId);
      if (contact) {
        return readyResource(
          `saved-${playbook.id}-${index}`,
          contact.name,
          contact.role,
          { kind: 'contact', id: contact.id },
        );
      }

      return recommendedMissingResource(
        `saved-${playbook.id}-${index}`,
        'Linked record is missing',
        'One linked record is no longer available. Review this plan from Emergency.',
        { kind: 'screen', screen: 'emergency' },
      );
    });

    return toGuide({
      id: playbook.id,
      source: 'saved',
      title: playbook.title,
      category: playbook.category,
      state: playbook.state,
      whenToUse: playbook.notes ?? 'Use this saved continuity playbook when the linked records apply.',
      summary:
        resources.filter((resource) => resource.status === 'ready').length > 0
          ? `${resources.filter((resource) => resource.status === 'ready').length} linked record${resources.filter((resource) => resource.status === 'ready').length === 1 ? '' : 's'} available.`
          : 'No linked records are available right now.',
      notes: playbook.notes,
      steps: playbook.steps.map((step) => ({
        ...step,
        requiredResourceKeys: [],
      })),
      resources,
    });
  });
}

function buildGuide({
  id,
  propertyId,
  category,
  title,
  whenToUse,
  notes,
  resources,
  steps,
}: {
  id: string;
  propertyId: string;
  category: ContinuityPlaybook['category'];
  title: string;
  whenToUse: string;
  notes?: string;
  resources: GuideResourceSpec[];
  steps: GuideStepSpec[];
}) {
  const resourceByKey = new Map(resources.map((resource) => [resource.key, resource]));
  const completedRequired = resources.filter(
    (resource) => resource.priority === 'required' && resource.status === 'ready',
  ).length;
  const totalRequired = resources.filter((resource) => resource.priority === 'required').length;
  const state =
    totalRequired > 0 && completedRequired === totalRequired
      ? ('ready' as const)
      : completedRequired > 0 || resources.some((resource) => resource.status === 'ready')
        ? ('in_progress' as const)
        : ('not_started' as const);
  const playbook: ContinuityPlaybook = {
    id,
    propertyId,
    category,
    title,
    state,
    notes,
    linkedRecordIds: resources
      .map((resource) =>
        resource.target.kind === 'access' ||
        resource.target.kind === 'account' ||
        resource.target.kind === 'asset' ||
        resource.target.kind === 'document'
          ? resource.target.id
          : null,
      )
      .filter((recordId): recordId is string => Boolean(recordId)),
    steps: steps.map((step, index) => ({
      id: `${id}-step-${index + 1}`,
      label: step.label,
      notes: step.notes,
      isRequired: step.isRequired !== false,
      isComplete:
        step.requiredResourceKeys.length > 0 &&
        step.requiredResourceKeys.every(
          (resourceKey) => resourceByKey.get(resourceKey)?.status === 'ready',
        ),
    })),
  };

  return toGuide({
    id,
    source: 'guided',
    title,
    category,
    state,
    whenToUse,
    summary: buildGuideSummary(resources),
    notes,
    steps: steps.map((step, index) => ({
      ...playbook.steps[index],
      requiredResourceKeys: [...step.requiredResourceKeys],
    })),
    resources,
  });
}

function toGuide({
  id,
  source,
  title,
  category,
  state,
  whenToUse,
  summary,
  notes,
  steps,
  resources,
}: {
  id: string;
  source: 'guided' | 'saved';
  title: string;
  category: ContinuityPlaybook['category'];
  state: ContinuityPlaybook['state'];
  whenToUse: string;
  summary: string;
  notes?: string;
  steps: ContinuityPlaybookGuideStep[];
  resources: GuideResourceSpec[];
}): ContinuityPlaybookGuide {
  return {
    id,
    source,
    title,
    category,
    state,
    whenToUse,
    summary,
    notes,
    steps,
    readyRecords: resources.filter((resource) => resource.status === 'ready'),
    missingRecords: resources.filter((resource) => resource.status === 'missing'),
  };
}

function buildResourceFreshnessByTarget({
  assets,
  accessItems,
  emergencyContacts,
  importantAccounts,
}: Pick<
  BuildContinuityPlaybookGuidesInput,
  'assets' | 'accessItems' | 'emergencyContacts' | 'importantAccounts'
>) {
  const freshnessByTarget = new Map<string, ContinuityResourceFreshness>();

  for (const accessItem of accessItems) {
    const summary = getAccessItemReviewSummary(accessItem);
    freshnessByTarget.set(getContinuityTargetKey({ kind: 'access', id: accessItem.id })!, {
      status: summary.status,
      label: summary.label,
      detail: summary.detail,
      lastReviewedAt: summary.lastReviewedAt,
    });
  }

  for (const account of importantAccounts) {
    const summary = getImportantAccountReviewSummary(account);
    freshnessByTarget.set(getContinuityTargetKey({ kind: 'account', id: account.id })!, {
      status: summary.status,
      label: summary.label,
      detail: summary.detail,
      lastReviewedAt: summary.lastReviewedAt,
    });
  }

  for (const contact of emergencyContacts) {
    const summary = getEmergencyContactReviewSummary(contact);
    freshnessByTarget.set(getContinuityTargetKey({ kind: 'contact', id: contact.id })!, {
      status: summary.status,
      label: summary.label,
      detail: summary.detail,
      lastReviewedAt: summary.lastReviewedAt,
    });
  }

  for (const asset of assets.filter((candidate) => isDeviceAsset(candidate) || isRouterAsset(candidate))) {
    const summary = getCriticalDeviceReviewSummary(asset);
    freshnessByTarget.set(getContinuityTargetKey({ kind: 'asset', id: asset.id })!, {
      status: summary.status,
      label: summary.label,
      detail: summary.detail,
      lastReviewedAt: summary.lastReviewedAt,
    });
  }

  return freshnessByTarget;
}

function attachResourceFreshness(
  guide: ContinuityPlaybookGuide,
  freshnessByTarget: Map<string, ContinuityResourceFreshness>,
): ContinuityPlaybookGuide {
  return {
    ...guide,
    readyRecords: guide.readyRecords.map((resource) => ({
      ...resource,
      freshness: getResourceFreshness(resource.target, freshnessByTarget),
    })),
    missingRecords: guide.missingRecords.map((resource) => ({
      ...resource,
      freshness: getResourceFreshness(resource.target, freshnessByTarget),
    })),
  };
}

function getResourceFreshness(
  target: ContinuityPlaybookTarget,
  freshnessByTarget: Map<string, ContinuityResourceFreshness>,
) {
  const targetKey = getContinuityTargetKey(target);

  return targetKey ? freshnessByTarget.get(targetKey) : undefined;
}

function getContinuityTargetKey(target: ContinuityPlaybookTarget) {
  switch (target.kind) {
    case 'access':
    case 'account':
    case 'asset':
    case 'contact':
    case 'document':
      return `${target.kind}:${target.id}`;
    default:
      return null;
  }
}

function toDrillStepResource(resource: ContinuityPlaybookResource): ContinuityDrillStepResource {
  const sensitivity =
    resource.target.kind === 'access' || resource.target.kind === 'account'
      ? 'protected'
      : 'standard';

  return {
    ...resource,
    actionLabel: resource.status === 'ready' ? 'Open linked record' : 'Fix missing record',
    detail:
      sensitivity === 'protected' && resource.status === 'ready'
        ? 'Protected details stay inside the linked record until you intentionally open it.'
        : resource.detail,
    sensitivity,
  };
}

function buildGuideSummary(resources: GuideResourceSpec[]) {
  const requiredMissing = resources.filter(
    (resource) => resource.priority === 'required' && resource.status === 'missing',
  );
  const readyCount = resources.filter((resource) => resource.status === 'ready').length;

  if (requiredMissing.length === 0 && readyCount > 0) {
    return 'Core records are linked and ready to use.';
  }

  if (requiredMissing.length > 0) {
    return `Missing ${requiredMissing.length} key record${requiredMissing.length === 1 ? '' : 's'} before this playbook is fully ready.`;
  }

  return 'Add the first supporting record to make this playbook useful.';
}

function readyResource(
  key: string,
  label: string,
  detail: string,
  target: ContinuityPlaybookTarget,
): GuideResourceSpec {
  return {
    key,
    label,
    detail,
    target,
    priority: 'required',
    status: 'ready',
  };
}

function recommendedReadyResource(
  key: string,
  label: string,
  detail: string,
  target: ContinuityPlaybookTarget,
): GuideResourceSpec {
  return {
    key,
    label,
    detail,
    target,
    priority: 'recommended',
    status: 'ready',
  };
}

function missingResource(
  key: string,
  label: string,
  detail: string,
  target: ContinuityPlaybookTarget,
): GuideResourceSpec {
  return {
    key,
    label,
    detail,
    target,
    priority: 'required',
    status: 'missing',
  };
}

function recommendedMissingResource(
  key: string,
  label: string,
  detail: string,
  target: ContinuityPlaybookTarget,
): GuideResourceSpec {
  return {
    key,
    label,
    detail,
    target,
    priority: 'recommended',
    status: 'missing',
  };
}

function isPhoneAsset(asset: AssetListItem) {
  const label = `${asset.category} ${asset.name}`.toLowerCase();

  return label.includes('phone') || label.includes('iphone') || label.includes('pixel');
}

function findKnownGoodCallbackAccount(accounts: ImportantAccount[]) {
  return accounts.find((account) =>
    account.kind === 'banking' ||
    account.kind === 'carrier' ||
    account.kind === 'utility' ||
    account.kind === 'insurance'
      ? Boolean(account.phone) || Boolean(account.website) || Boolean(account.email)
      : false,
  );
}

function formatAccountSupportDetail(account: ImportantAccount, fallback: string) {
  const supportLabel = account.phone
    ? `Call back at ${account.phone}`
    : account.website
      ? `Use ${account.website}`
      : account.email
        ? `Use ${account.email}`
        : null;

  return supportLabel ? `${account.providerName} · ${supportLabel}` : `${account.providerName} · ${fallback}`;
}

function formatAccessCategory(category: AccessItem['category']) {
  switch (category) {
    case 'wifi':
      return 'Wi-Fi';
    case 'router':
      return 'Router';
    case 'utility_shutoff':
      return 'Utility shutoff';
    case 'entry_note':
      return 'Entry note';
    case 'lockbox':
      return 'Lockbox';
    default:
      return category.replaceAll('_', ' ');
  }
}
