import React, { useRef, useState } from 'react';
import { CourseAsset, CourseAssetKind, CourseLesson, CourseModule } from '../../types';
import { startResumableLmsUpload, ResumableUploadHandle } from '../../lib/firebase/storage';
import { firebaseService } from '../../lib/firebase/firebase';
import { validateLmsMediaFile } from '../../lib/validation/schemas';
import {
  UploadCloud,
  X,
  RotateCcw,
  Trash2,
  Eye,
  FileText,
  Film,
  Music,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface UploadQueueItem {
  localId: string;
  file: File;
  assetKind: CourseAssetKind;
  moduleId?: string;
  lessonId?: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error' | 'cancelled';
  error?: string;
  handle?: ResumableUploadHandle;
}

interface CourseMediaUploaderProps {
  courseId: string;
  modules: CourseModule[];
  lessons: CourseLesson[];
  assets: CourseAsset[];
  uploaderUid: string;
  uploaderName: string;
  onAssetSaved?: (asset: CourseAsset) => void;
}

export const CourseMediaUploader: React.FC<CourseMediaUploaderProps> = ({
  courseId,
  modules,
  lessons,
  assets,
  uploaderUid,
  uploaderName,
  onAssetSaved,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string>(modules[0]?.id || '');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');
  const [preferredKind, setPreferredKind] = useState<CourseAssetKind>('video');
  const [dragActive, setDragActive] = useState(false);
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [previewAsset, setPreviewAsset] = useState<{ asset: CourseAsset; url: string | null } | null>(null);

  const enqueueFiles = (files: FileList | File[]) => {
    const arr = Array.from(files);
    arr.forEach((file) => {
      const check = validateLmsMediaFile(file, preferredKind);
      const localId = `up_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const resolvedKind = (check.detectedKind || preferredKind) as CourseAssetKind;

      if (!check.valid) {
        setQueue((prev) => [
          {
            localId,
            file,
            assetKind: resolvedKind,
            moduleId: selectedModuleId || undefined,
            lessonId: selectedLessonId || undefined,
            progress: 0,
            status: 'error',
            error: check.error,
          },
          ...prev,
        ]);
        return;
      }

      startSingleUpload({
        localId,
        file,
        assetKind: resolvedKind,
        moduleId: selectedModuleId || undefined,
        lessonId: selectedLessonId || undefined,
      });
    });
  };

  const startSingleUpload = (params: {
    localId: string;
    file: File;
    assetKind: CourseAssetKind;
    moduleId?: string;
    lessonId?: string;
  }) => {
    const handle = startResumableLmsUpload({
      courseId,
      moduleId: params.moduleId,
      lessonId: params.lessonId,
      assetKind: params.assetKind,
      file: params.file,
      uploaderUid,
      uploaderName,
      onProgress: (pct) => {
        setQueue((prev) =>
          prev.map((q) => (q.localId === params.localId ? { ...q, progress: pct } : q))
        );
      },
    });

    setQueue((prev) => {
      const exists = prev.some((q) => q.localId === params.localId);
      const item: UploadQueueItem = {
        ...params,
        progress: 0,
        status: 'uploading',
        handle,
      };
      return exists ? prev.map((q) => (q.localId === params.localId ? item : q)) : [item, ...prev];
    });

    handle.promise
      .then(async (assetMeta) => {
        const saved = await firebaseService.saveCourseAsset(assetMeta);
        setQueue((prev) =>
          prev.map((q) =>
            q.localId === params.localId ? { ...q, progress: 100, status: 'completed' } : q
          )
        );
        onAssetSaved?.(saved);
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : 'Upload failed.';
        const isCancel = msg.toLowerCase().includes('cancel');
        setQueue((prev) =>
          prev.map((q) =>
            q.localId === params.localId
              ? { ...q, status: isCancel ? 'cancelled' : 'error', error: msg }
              : q
          )
        );
      });
  };

  const handleOpenPreview = async (asset: CourseAsset) => {
    const res = await firebaseService.getAuthorizedMediaUrl(asset.id);
    setPreviewAsset({ asset, url: res.url });
  };

  const formatMb = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

  const assetIcon = (kind: CourseAssetKind) => {
    if (kind === 'video' || kind === 'low_bandwidth_video') return <Film className="w-4 h-4 text-[#005A9C]" />;
    if (kind === 'audio') return <Music className="w-4 h-4 text-[#005A9C]" />;
    if (kind === 'image') return <ImageIcon className="w-4 h-4 text-[#005A9C]" />;
    return <FileText className="w-4 h-4 text-[#005A9C]" />;
  };

  return (
    <div className="space-y-5">
      {/* Target Module / Lesson / Media Type Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Upload Type / Preset</label>
          <select
            value={preferredKind}
            onChange={(e) => setPreferredKind(e.target.value as CourseAssetKind)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[42px] bg-white"
          >
            <option value="video">HD Video Lesson (MP4 / WebM up to 500 MB)</option>
            <option value="low_bandwidth_video">Low-Bandwidth Compressed Video (up to 120 MB)</option>
            <option value="pdf">PDF Study Notes (up to 40 MB)</option>
            <option value="presentation">PowerPoint Slides PPT/PPTX (up to 50 MB)</option>
            <option value="document">Word Document DOC/DOCX (up to 30 MB)</option>
            <option value="audio">Audio Lesson MP3/WAV/OGG/AAC (up to 80 MB)</option>
            <option value="image">Course Thumbnail or Diagram (up to 10 MB)</option>
            <option value="captions">WebVTT Subtitles / Captions (.vtt up to 2 MB)</option>
          </select>
        </div>
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Attach to Module (Optional)</label>
          <select
            value={selectedModuleId}
            onChange={(e) => setSelectedModuleId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[42px] bg-white"
          >
            <option value="">Course-Level Asset / Thumbnail</option>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Attach to Lesson (Optional)</label>
          <select
            value={selectedLessonId}
            onChange={(e) => setSelectedLessonId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[42px] bg-white"
          >
            <option value="">All Module Lessons</option>
            {lessons
              .filter((l) => !selectedModuleId || l.moduleId === selectedModuleId)
              .map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Drag & Drop Resumable Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          if (e.dataTransfer.files?.length) enqueueFiles(e.dataTransfer.files);
        }}
        className={`rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
          dragActive ? 'border-[#005A9C] bg-blue-50/70' : 'border-slate-300 bg-slate-50/70'
        }`}
      >
        <UploadCloud className="w-8 h-8 text-[#005A9C] mx-auto mb-2" />
        <p className="font-heading text-sm font-bold text-[#1B365D]">
          Drag and drop course videos, PDFs, slides, audio, or VTT captions here
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Resumable Firebase Storage upload supports multiple files up to 500 MB (MP4, WebM, PDF, PPTX, DOCX, MP3, WebVTT). Private files stay restricted to enrolled learners and assigned staff.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => e.target.files && enqueueFiles(e.target.files)}
          className="sr-only"
          aria-label="Choose LMS files to upload"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-4 px-5 py-2.5 bg-[#005A9C] hover:bg-[#004980] text-white text-xs font-bold rounded-xl min-h-[44px]"
        >
          Browse Files to Upload
        </button>
      </div>

      {/* Active Upload Progress Queue */}
      {queue.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-slate-500">
            Upload Queue ({queue.length})
          </h4>
          {queue.map((q) => (
            <div
              key={q.localId}
              className="p-3 rounded-xl bg-white border border-slate-200 text-xs space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="font-bold text-[#1B365D] truncate">{q.file.name}</div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono tabular-nums text-slate-600">{q.progress}%</span>
                  {q.status === 'uploading' && (
                    <button
                      type="button"
                      onClick={() => q.handle?.cancel()}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      aria-label="Cancel upload"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {(q.status === 'error' || q.status === 'cancelled') && (
                    <button
                      type="button"
                      onClick={() =>
                        startSingleUpload({
                          localId: q.localId,
                          file: q.file,
                          assetKind: q.assetKind,
                          moduleId: q.moduleId,
                          lessonId: q.lessonId,
                        })
                      }
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Retry</span>
                    </button>
                  )}
                  {q.status === 'completed' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                </div>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    q.status === 'error' || q.status === 'cancelled'
                      ? 'bg-[#DC2626]'
                      : q.status === 'completed'
                      ? 'bg-emerald-600'
                      : 'bg-[#005A9C]'
                  }`}
                  style={{ width: `${q.progress}%` }}
                />
              </div>
              {q.error && (
                <div className="text-[#DC2626] flex items-center gap-1 text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{q.error}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Assets Library */}
      <div className="space-y-2">
        <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-slate-500">
          Course Media Library ({assets.length})
        </h4>
        {assets.length === 0 ? (
          <p className="text-xs text-slate-500">No media files uploaded for this course yet.</p>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white">
            {assets.map((asset) => (
              <div key={asset.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 shrink-0">{assetIcon(asset.assetKind)}</div>
                  <div className="min-w-0">
                    <div className="font-bold text-[#1B365D] truncate">{asset.fileName}</div>
                    <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                      {asset.assetKind.replace(/_/g, ' ')} · {formatMb(asset.sizeBytes)} · Uploaded by {asset.uploadedByName}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenPreview(asset)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => firebaseService.removeCourseAsset(asset.id)}
                    className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-[#DC2626] rounded-lg font-semibold flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inline Asset Preview Dialog */}
      {previewAsset && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <strong className="font-heading text-sm text-[#1B365D] truncate">
                {previewAsset.asset.fileName}
              </strong>
              <button
                type="button"
                onClick={() => setPreviewAsset(null)}
                className="p-1.5 text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs text-slate-600 space-y-2">
              <div className="font-mono text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-200 break-all">
                Storage Path: {previewAsset.asset.storagePath}
              </div>
              {previewAsset.url ? (
                previewAsset.asset.assetKind === 'image' ? (
                  <img
                    src={previewAsset.url}
                    alt={previewAsset.asset.fileName}
                    className="max-h-80 rounded-xl mx-auto object-contain"
                  />
                ) : previewAsset.asset.assetKind.includes('video') ? (
                  <video controls src={previewAsset.url} className="w-full max-h-80 rounded-xl bg-black" />
                ) : previewAsset.asset.assetKind === 'audio' ? (
                  <audio controls src={previewAsset.url} className="w-full" />
                ) : (
                  <iframe
                    title={previewAsset.asset.fileName}
                    src={previewAsset.url}
                    className="w-full h-80 rounded-xl border border-slate-200"
                  />
                )
              ) : (
                <p className="p-4 bg-blue-50 text-[#1B365D] rounded-xl">
                  Asset metadata is verified and secured under Firebase Storage rules (<code className="font-mono">{previewAsset.asset.storagePath}</code>). Signed streaming URLs resolve when live Firebase Storage is connected.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
