// Polyfill for crypto.randomUUID (not available in all browsers/environments)
// This runs before any other code and patches the global crypto object

if (typeof crypto !== 'undefined' && typeof crypto.randomUUID !== 'function') {
  (crypto as any).randomUUID = function(): string {
    if (typeof crypto.getRandomValues === 'function') {
      return ('10000000-1000-4000-8000-100000000000').replace(/[018]/g, (c: string) =>
        (Number(c) ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(c) / 4)))).toString(16)
      );
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };
}
