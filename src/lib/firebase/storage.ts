import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, isFirebaseConfigured, storage } from './config';
import { AttachmentMeta } from '../../types';
import { validateDocumentFile, validateImageFile } from '../validation/schemas';

function sanitizeFileName(name: string): string {
  const base = name.replace(/[^A-Za-z0-9._-]/g, '_');
  return `${Date.now()}_${base.slice(-80)}`;
}

export async function uploadAvatarFile(userId: string, file: File): Promise<AttachmentMeta> {
  const check = validateImageFile(file);
  if (!check.valid) {
    throw new Error(check.error || 'Invalid profile photo.');
  }

  const safeName = sanitizeFileName(file.name);
  const storagePath = `avatars/${userId}/${safeName}`;

  if (!isFirebaseConfigured || !storage || !auth?.currentUser) {
    throw new Error('Live Firebase Storage session is required to upload a profile photo.');
  }

  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, file, {
    contentType: file.type,
    customMetadata: {
      uploaderUid: auth.currentUser.uid,
    },
  });
  const url = await getDownloadURL(storageRef);

  return {
    name: file.name,
    url,
    storagePath,
    contentType: file.type,
    sizeBytes: file.size,
    uploadedAt: new Date().toISOString(),
    uploadedBy: auth.currentUser.uid,
  };
}

export async function uploadSafeguardingEvidence(caseId: string, file: File): Promise<AttachmentMeta> {
  const check = validateDocumentFile(file);
  if (!check.valid) {
    throw new Error(check.error || 'Invalid safeguarding evidence file.');
  }

  const safeName = sanitizeFileName(file.name);
  const storagePath = `safeguarding/${caseId}/${safeName}`;

  if (!isFirebaseConfigured || !storage || !auth?.currentUser) {
    throw new Error('Live authenticated session is required to upload safeguarding evidence.');
  }

  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, file, {
    contentType: file.type,
    customMetadata: {
      uploaderUid: auth.currentUser.uid,
      caseId,
    },
  });
  const url = await getDownloadURL(storageRef);

  return {
    name: file.name,
    url,
    storagePath,
    contentType: file.type,
    sizeBytes: file.size,
    uploadedAt: new Date().toISOString(),
    uploadedBy: auth.currentUser.uid,
  };
}

export async function uploadApplicationDocument(
  folder: 'mentorApplications' | 'partnerApplications',
  appId: string,
  file: File
): Promise<AttachmentMeta> {
  const check = validateDocumentFile(file);
  if (!check.valid) {
    throw new Error(check.error || 'Invalid verification document.');
  }

  const safeName = sanitizeFileName(file.name);
  const storagePath = `${folder}/${appId}/${safeName}`;

  if (!isFirebaseConfigured || !storage || !auth?.currentUser) {
    throw new Error('Sign in with a verified account to attach verification documents directly.');
  }

  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, file, {
    contentType: file.type,
    customMetadata: {
      uploaderUid: auth.currentUser.uid,
      applicationId: appId,
    },
  });
  const url = await getDownloadURL(storageRef);

  return {
    name: file.name,
    url,
    storagePath,
    contentType: file.type,
    sizeBytes: file.size,
    uploadedAt: new Date().toISOString(),
    uploadedBy: auth.currentUser.uid,
  };
}
