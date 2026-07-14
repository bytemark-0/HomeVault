import {
  getAccessItemSensitivity,
  getExportSensitivity,
  getImportantAccountSensitivity,
} from '../../utils/sensitivity';

describe('sensitivity', () => {
  it('marks Wi-Fi and coded access records as high sensitivity', () => {
    expect(
      getAccessItemSensitivity({
        id: 'access-1',
        propertyId: 'property-1',
        category: 'wifi',
        label: 'Main Wi-Fi',
        accessCode: '9274',
        linkedDocumentIds: [],
      }).level,
    ).toBe('high');
  });

  it('marks insurance metadata as medium and recovery notes as high', () => {
    expect(
      getImportantAccountSensitivity({
        id: 'account-1',
        propertyId: 'property-1',
        kind: 'insurance',
        providerName: 'Prairie Mutual',
        label: 'Home policy',
        linkedDocumentIds: [],
      }).level,
    ).toBe('medium');

    expect(
      getImportantAccountSensitivity({
        id: 'account-2',
        propertyId: 'property-1',
        kind: 'banking',
        providerName: 'River Bank',
        label: 'Primary bank login',
        recoveryNotes: 'Codes are in the safe.',
        linkedDocumentIds: [],
      }).level,
    ).toBe('high');
  });

  it('marks emergency packet and trusted share exports as high sensitivity', () => {
    const sensitiveData = {
      includesSensitiveData: true,
      accessItemCount: 1,
      emergencyContactCount: 0,
      importantAccountCount: 0,
      assetSerialCount: 0,
    };

    expect(getExportSensitivity('packet', sensitiveData).level).toBe('high');
    expect(getExportSensitivity('trusted-share', sensitiveData).level).toBe('high');
    expect(getExportSensitivity('backup', sensitiveData).level).toBe('high');
  });
});
