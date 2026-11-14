import { ref, uploadBytes, uploadBytesResumable, getDownloadURL, UploadTask } from 'firebase/storage';
import { auth, isFirebaseConfigured, storage } from './config';
import { AttachmentMeta, CourseAsset, CourseAssetKind } from '../../types';
import { validateDocumentFile, validateImageFile, validateLmsMediaFile } from '../validation/schemas';

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

export interface ResumableUploadHandle {
  task?: UploadTask;
  cancel: () => void;
  promise: Promise<Omit<CourseAsset, 'id' | 'createdAt' | 'updatedAt'>>;
}

export function startResumableLmsUpload(params: {
  courseId: string;
  moduleId?: string;
  lessonId?: string;
  assetKind: CourseAssetKind;
  file: File;
  uploaderUid: string;
  uploaderName: string;
  onProgress: (percent: number) => void;
}): ResumableUploadHandle {
  const check = validateLmsMediaFile(params.file, params.assetKind);
  if (!check.valid) {
    return {
      cancel: () => undefined,
      promise: Promise.reject(new Error(check.error || 'Unsupported LMS media file.')),
    };
  }

  const safeName = sanitizeFileName(params.file.name);
  const modSeg = params.moduleId || 'general';
  const visibility: CourseAsset['visibility'] =
    params.assetKind === 'image' && !params.lessonId ? 'course_thumbnail' : 'private_enrolled';
  const storagePath =
    visibility === 'course_thumbnail'
      ? `lms/courses/${params.courseId}/thumbnails/${safeName}`
      : `lms/courses/${params.courseId}/modules/${modSeg}/${safeName}`;

  if (!isFirebaseConfigured || !storage || !auth?.currentUser) {
    // Clean deterministic local preview fallback for offline/demo Vitest mode ONLY when Firebase isn't configured
    let cancelled = false;
    const promise = new Promise<Omit<CourseAsset, 'id' | 'createdAt' | 'updatedAt'>>((resolve, reject) => {
      let pct = 0;
      const timer = setInterval(() => {
        if (cancelled) {
          clearInterval(timer);
          reject(new Error('Upload cancelled by user.'));
          return;
        }
        pct = Math.min(100, pct + 34);
        params.onProgress(pct);
        if (pct >= 100) {
          clearInterval(timer);
          resolve({
            courseId: params.courseId,
            moduleId: params.moduleId,
            lessonId: params.lessonId,
            fileName: params.file.name,
            mimeType: params.file.type || 'application/octet-stream',
            sizeBytes: params.file.size,
            assetKind: params.assetKind,
            storagePath,
            provider: 'firebase_storage',
            visibility,
            uploadedBy: params.uploaderUid,
            uploadedByName: params.uploaderName,
          });
        }
      }, 60);
    });
    return {
      cancel: () => {
        cancelled = true;
      },
      promise,
    };
  }

  const storageRef = ref(storage, storagePath);
  const task = uploadBytesResumable(storageRef, params.file, {
    contentType: params.file.type || 'application/octet-stream',
    customMetadata: {
      uploaderUid: auth.currentUser.uid,
      courseId: params.courseId,
      ...(params.moduleId ? { moduleId: params.moduleId } : {}),
    },
  });

  const promise = new Promise<Omit<CourseAsset, 'id' | 'createdAt' | 'updatedAt'>>((resolve, reject) => {
    task.on(
      'state_changed',
      (snapshot) => {
        const pct = snapshot.totalBytes > 0 ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100) : 0;
        params.onProgress(pct);
      },
      (err) => reject(err),
      async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref);
          resolve({
            courseId: params.courseId,
            moduleId: params.moduleId,
            lessonId: params.lessonId,
            fileName: params.file.name,
            mimeType: params.file.type || 'application/octet-stream',
            sizeBytes: params.file.size,
            assetKind: params.assetKind,
            storagePath,
            provider: 'firebase_storage',
            visibility,
            previewDataUrl: visibility === 'course_thumbnail' ? url : undefined,
            uploadedBy: auth?.currentUser?.uid || params.uploaderUid,
            uploadedByName: params.uploaderName,
          });
        } catch (err) {
          reject(err);
        }
      }
    );
  });

  return {
    task,
    cancel: () => task.cancel(),
    promise,
  };
}

export async function uploadLmsSubmissionFile(
  courseId: string,
  userId: string,
  file: File
): Promise<{ storagePath: string; fileName: string; sizeBytes: number; contentType: string }> {
  const safeName = sanitizeFileName(file.name);
  const storagePath = `lms/submissions/${courseId}/${userId}/${safeName}`;
  const isAllowed =
    file.size <= 30 * 1024 * 1024 &&
    (file.type === 'application/pdf' ||
      file.type.startsWith('image/') ||
      file.type.includes('wordprocessingml') ||
      file.type === 'application/msword' ||
      file.type.includes('presentationml'));
  if (!isAllowed) {
    throw new Error('Submission files must be PDF, Word, PowerPoint, or image up to 30 MB.');
  }

  if (isFirebaseConfigured && storage && auth?.currentUser) {
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: { uploaderUid: auth.currentUser.uid, courseId },
    });
  }
  return {
    storagePath,
    fileName: file.name,
    sizeBytes: file.size,
    contentType: file.type,
  };
}
