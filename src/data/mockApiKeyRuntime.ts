import { mockApiKeys } from './mockData';
import type { ApiKey } from '../types';

let apiKeysRuntime: ApiKey[] | null = null;

function cloneApiKeys(keys: ApiKey[]): ApiKey[] {
  return keys.map(key => ({ ...key }));
}

export function getRuntimeApiKeys(): ApiKey[] {
  if (!apiKeysRuntime) {
    apiKeysRuntime = cloneApiKeys(mockApiKeys);
  }
  return cloneApiKeys(apiKeysRuntime);
}

export function saveRuntimeApiKeys(keys: ApiKey[]) {
  apiKeysRuntime = cloneApiKeys(keys);
}

export function appendRuntimeApiKey(key: ApiKey): ApiKey {
  const list = getRuntimeApiKeys();
  const next = [key, ...list];
  saveRuntimeApiKeys(next);
  return key;
}
