// Polyfill for crypto.randomUUID in non-secure/legacy environments

const fallbackRandomUUID = (): string => {
  const cryptoObj = (globalThis as any).crypto;

  if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
    return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c: string) =>
      (Number(c) ^ (cryptoObj.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(c) / 4)))).toString(16)
    );
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const globalAny = globalThis as any;
if (!globalAny.crypto) {
  globalAny.crypto = {};
}

if (typeof globalAny.crypto.randomUUID !== 'function') {
  globalAny.crypto.randomUUID = fallbackRandomUUID;
}

