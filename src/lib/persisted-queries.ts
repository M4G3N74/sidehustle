import { createHash } from 'crypto';
import { QUERIES, MUTATIONS } from '@/lib/graphql';

// Build the map at module load time from the same query strings the client uses
const allOperations: Record<string, string> = {
  ...QUERIES,
  ...MUTATIONS,
};

export const persistedQueryMap: Record<string, string> = {};

for (const [, queryString] of Object.entries(allOperations)) {
  const hash = createHash('sha256').update(queryString.trim()).digest('hex');
  persistedQueryMap[hash] = queryString.trim();
}

export function resolvePersistedQuery(operationId: string): string | null {
  return persistedQueryMap[operationId] ?? null;
}
