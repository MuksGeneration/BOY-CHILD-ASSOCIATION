export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export class FirestoreOperationError extends Error {
  code: string;
  operationType: OperationType;
  path: string | null;

  constructor(message: string, code: string, operationType: OperationType, path: string | null) {
    super(message);
    this.name = 'FirestoreOperationError';
    this.code = code;
    this.operationType = operationType;
    this.path = path;
  }
}

function getSafeErrorCode(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error && typeof (error as { code?: unknown }).code === 'string') {
    return String((error as { code: string }).code).toLowerCase();
  }
  const msg = (error instanceof Error ? error.message : String(error || '')).toLowerCase();
  if (msg.includes('client is offline') || msg.includes('unavailable')) return 'unavailable';
  if (msg.includes('permission-denied') || msg.includes('insufficient permissions')) return 'permission-denied';
  if (msg.includes('unauthenticated')) return 'unauthenticated';
  if (msg.includes('not-found')) return 'not-found';
  if (msg.includes('invalid-argument')) return 'invalid-argument';
  if (msg.includes('failed-precondition')) return 'failed-precondition';
  return 'unknown';
}

function getSafeMessageForCode(code: string): string {
  const normalized = code.replace(/^firestore\//, '');
  switch (normalized) {
    case 'unavailable':
    case 'deadline-exceeded':
      return 'Unable to reach the BCA database server right now. Please check your internet connection and retry.';
    case 'permission-denied':
      return 'You do not have permission to complete this operation.';
    case 'unauthenticated':
      return 'Please sign in again to continue.';
    case 'not-found':
      return 'The requested record could not be found.';
    case 'invalid-argument':
      return 'One or more submitted fields could not be validated.';
    case 'failed-precondition':
      return 'The database service requires synchronization before completing this request.';
    default:
      return 'A database operation could not be completed. Please try again.';
  }
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const code = getSafeErrorCode(error);
  const safeMessage = getSafeMessageForCode(code);
  console.error(`Firestore ${operationType} failed [${code}] at ${path || 'unknown'}`);
  throw new FirestoreOperationError(safeMessage, code, operationType, path);
}
