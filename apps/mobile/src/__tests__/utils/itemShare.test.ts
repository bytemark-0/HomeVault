import { Platform } from 'react-native';

jest.mock('expo-file-system', () => ({
  File: class MockFile {
    uri = 'file:///tmp/mock.json';
    write() {}
  },
  Paths: { cache: '/tmp' },
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(undefined),
}));

import { shareItemShareBundle } from '../../utils/itemShare';

describe('itemShare web download', () => {
  const originalBlob = global.Blob;
  const originalDocument = global.document;
  const originalURL = global.URL;
  const platformDescriptor = Object.getOwnPropertyDescriptor(Platform, 'OS');

  afterEach(() => {
    if (platformDescriptor) {
      Object.defineProperty(Platform, 'OS', platformDescriptor);
    }

    if (originalBlob) {
      (global as typeof globalThis & { Blob?: typeof Blob }).Blob = originalBlob;
    }

    if (originalURL) {
      (global as typeof globalThis & { URL?: typeof URL }).URL = originalURL;
    } else {
      delete (global as typeof globalThis & { URL?: typeof URL }).URL;
    }

    if (originalDocument) {
      (global as typeof globalThis & { document?: Document }).document = originalDocument;
    } else {
      delete (global as typeof globalThis & { document?: Document }).document;
    }
  });

  it('downloads encrypted item bundles on web with the provided filename', async () => {
    const createObjectURL = jest.fn(() => 'blob:item-share');
    const revokeObjectURL = jest.fn();
    const click = jest.fn();
    const anchor = {
      click,
      download: '',
      href: '',
      remove: jest.fn(),
      style: {},
    } as unknown as HTMLAnchorElement;

    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      get: () => 'web',
    });
    (global as typeof globalThis & { URL?: unknown }).URL = {
      createObjectURL,
      revokeObjectURL,
    };
    (global as typeof globalThis & { document?: Document }).document = {
      createElement: jest.fn(() => anchor),
    } as unknown as Document;
    (global as typeof globalThis & { Blob?: typeof Blob }).Blob =
      originalBlob ?? class MockBlob {};

    await expect(
      shareItemShareBundle('{"bundle":true}', 'homevault-item-share-access_item-main-wi-fi-2026-07-10.json'),
    ).resolves.toBe('downloaded');

    expect(createObjectURL).toHaveBeenCalled();
    expect(anchor.download).toBe('homevault-item-share-access_item-main-wi-fi-2026-07-10.json');
    expect(anchor.href).toBe('blob:item-share');
    expect(click).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:item-share');
  });

  it('fails safely on web when the preview cannot create a download link', async () => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      get: () => 'web',
    });
    delete (global as typeof globalThis & { URL?: typeof URL }).URL;
    delete (global as typeof globalThis & { document?: Document }).document;

    await expect(
      shareItemShareBundle('{"bundle":true}', 'homevault-item-share-access_item-main-wi-fi-2026-07-10.json'),
    ).rejects.toThrow('Downloading item-share bundles is not supported in this preview.');
  });
});
