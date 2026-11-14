import React, { useEffect, useRef, useState } from 'react';
import { CourseAsset, CourseLesson, LessonProgress } from '../../types';
import { firebaseService } from '../../lib/firebase/firebase';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Captions,
  Wifi,
  FileText,
  Download,
  CheckCircle2,
  ExternalLink,
  BookOpen,
} from 'lucide-react';

interface LessonMediaPlayerProps {
  lesson: CourseLesson;
  assets: CourseAsset[];
  progress?: LessonProgress;
  isCompleted: boolean;
  onSaveProgress: (params: {
    lastPositionSeconds?: number;
    watchedSecondsDelta?: number;
    playbackSpeed?: number;
    completed?: boolean;
  }) => Promise<void> | void;
}

export const LessonMediaPlayer: React.FC<LessonMediaPlayerProps> = ({
  lesson,
  assets,
  progress,
  isCompleted,
  onSaveProgress,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [lowBandwidthMode, setLowBandwidthMode] = useState(false);
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playbackSpeed, setPlaybackSpeed] = useState(progress?.playbackSpeed || 1);
  const [currentTime, setCurrentTime] = useState(progress?.lastPositionSeconds || 0);
  const [duration, setDuration] = useState(0);

  const [primaryUrl, setPrimaryUrl] = useState<string | null>(null);
  const [lowBandwidthUrl, setLowBandwidthUrl] = useState<string | null>(null);
  const [captionsUrl, setCaptionsUrl] = useState<string | null>(null);
  const [notesUrl, setNotesUrl] = useState<string | null>(null);
  const [notesFileName, setNotesFileName] = useState<string>('study-notes.pdf');
  const [mediaNotice, setMediaNotice] = useState<string | null>(null);

  const primaryAsset = assets.find((a) => a.id === lesson.primaryAssetId);
  const lowAsset = assets.find((a) => a.id === lesson.lowBandwidthAssetId);
  const captionsAsset = assets.find((a) => a.id === lesson.captionsAssetId);
  const notesAsset = assets.find((a) => a.id === lesson.studyNotesAssetId);

  useEffect(() => {
    let active = true;
    setPrimaryUrl(null);
    setLowBandwidthUrl(null);
    setCaptionsUrl(null);
    setNotesUrl(null);
    setMediaNotice(null);
    setIsPlaying(false);
    setCurrentTime(progress?.lastPositionSeconds || 0);

    const resolveAll = async () => {
      try {
        if (lesson.primaryAssetId) {
          const res = await firebaseService.getAuthorizedMediaUrl(lesson.primaryAssetId);
          if (active) setPrimaryUrl(res.url);
        }
        if (lesson.lowBandwidthAssetId) {
          const res = await firebaseService.getAuthorizedMediaUrl(lesson.lowBandwidthAssetId);
          if (active) setLowBandwidthUrl(res.url);
        }
        if (lesson.captionsAssetId) {
          const res = await firebaseService.getAuthorizedMediaUrl(lesson.captionsAssetId);
          if (active) setCaptionsUrl(res.url);
        }
        if (lesson.studyNotesAssetId) {
          const res = await firebaseService.getAuthorizedMediaUrl(lesson.studyNotesAssetId);
          if (active) {
            setNotesUrl(res.url);
            if (notesAsset?.fileName) setNotesFileName(notesAsset.fileName);
          }
        }
      } catch (err) {
        if (active) {
          setMediaNotice(err instanceof Error ? err.message : 'Unable to load authorized media URL.');
        }
      }
    };
    resolveAll();
    return () => {
      active = false;
    };
  }, [lesson.id, lesson.primaryAssetId, lesson.lowBandwidthAssetId, lesson.captionsAssetId, lesson.studyNotesAssetId]);

  const activeVideoSrc = lowBandwidthMode && lowBandwidthUrl ? lowBandwidthUrl : primaryUrl;
  const isVideoLesson = lesson.lessonType === 'video' || lesson.lessonType === 'practical_demo';
  const isAudioLesson = lesson.lessonType === 'audio';
  const isDocumentLesson =
    lesson.lessonType === 'pdf' ||
    lesson.lessonType === 'presentation' ||
    lesson.lessonType === 'study_notes';

  const mediaElement = isVideoLesson ? videoRef.current : isAudioLesson ? audioRef.current : null;

  const togglePlay = () => {
    if (!mediaElement) return;
    if (mediaElement.paused) {
      mediaElement.play().catch(() => undefined);
      setIsPlaying(true);
    } else {
      mediaElement.pause();
      setIsPlaying(false);
      onSaveProgress({
        lastPositionSeconds: Math.floor(mediaElement.currentTime),
        playbackSpeed,
      });
    }
  };

  const handleSpeedChange = (nextSpeed: number) => {
    setPlaybackSpeed(nextSpeed);
    if (mediaElement) {
      mediaElement.playbackRate = nextSpeed;
    }
    onSaveProgress({ playbackSpeed: nextSpeed });
  };

  const handleVolumeChange = (nextVol: number) => {
    setVolume(nextVol);
    setIsMuted(nextVol === 0);
    if (mediaElement) {
      mediaElement.volume = nextVol;
      mediaElement.muted = nextVol === 0;
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (mediaElement) mediaElement.muted = nextMuted;
  };

  const handleFullscreen = () => {
    if (containerRef.current?.requestFullscreen) {
      containerRef.current.requestFullscreen().catch(() => undefined);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextTime = Number(e.target.value);
    setCurrentTime(nextTime);
    if (mediaElement) {
      mediaElement.currentTime = nextTime;
    }
  };

  const formatTime = (secs: number) => {
    const s = Math.max(0, Math.floor(secs));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-5">
      {/* Lesson Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 text-slate-600">
          <span className="font-bold text-[#1B365D] uppercase tracking-wider">
            {lesson.lessonType.replace(/_/g, ' ')}
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">{lesson.durationMinutes} min</span>
          {progress && progress.lastPositionSeconds > 5 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-[#005A9C] font-semibold font-mono tabular-nums">
                Resume at {formatTime(progress.lastPositionSeconds)}
              </span>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setLowBandwidthMode(!lowBandwidthMode)}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 min-h-[36px] border transition-colors ${
              lowBandwidthMode
                ? 'bg-[#1B365D] text-white border-[#1B365D]'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>{lowBandwidthMode ? 'Low-Bandwidth Active' : 'Low-Bandwidth Mode'}</span>
          </button>

          {lesson.transcript && (
            <button
              type="button"
              onClick={() => setShowTranscript(!showTranscript)}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 min-h-[36px] border ${
                showTranscript
                  ? 'bg-[#005A9C] text-white border-[#005A9C]'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Transcript</span>
            </button>
          )}

          {(notesUrl || notesAsset) && (
            <a
              href={notesUrl || '#'}
              download={notesFileName}
              onClick={(e) => {
                if (!notesUrl) {
                  e.preventDefault();
                  setMediaNotice(
                    `Study resource "${notesAsset?.fileName || notesFileName}" is stored at ${notesAsset?.storagePath || 'private storage'}. Sign in with Firebase Storage active to download binary files.`
                  );
                }
              }}
              className="px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 min-h-[36px] bg-white text-[#005A9C] border border-blue-200 hover:bg-blue-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Study Notes</span>
            </a>
          )}
        </div>
      </div>

      {mediaNotice && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
          {mediaNotice}
        </div>
      )}

      {/* Video Player */}
      {isVideoLesson && !lowBandwidthMode && (
        <div
          ref={containerRef}
          className="bg-[#0F172A] rounded-2xl overflow-hidden border border-slate-800 shadow-sm"
        >
          {activeVideoSrc ? (
            <>
              <video
                ref={videoRef}
                src={activeVideoSrc}
                className="w-full aspect-video bg-black"
                playsInline
                onLoadedMetadata={(e) => {
                  const v = e.currentTarget;
                  setDuration(v.duration || lesson.durationMinutes * 60);
                  v.playbackRate = playbackSpeed;
                  if (progress?.lastPositionSeconds && progress.lastPositionSeconds < v.duration - 2) {
                    v.currentTime = progress.lastPositionSeconds;
                  }
                }}
                onTimeUpdate={(e) => {
                  const sec = Math.floor(e.currentTarget.currentTime);
                  setCurrentTime(sec);
                  if (sec > 0 && sec % 15 === 0) {
                    onSaveProgress({
                      lastPositionSeconds: sec,
                      watchedSecondsDelta: 15,
                      playbackSpeed,
                    });
                  }
                }}
                onEnded={() => {
                  setIsPlaying(false);
                  onSaveProgress({
                    lastPositionSeconds: Math.floor(duration),
                    completed: true,
                  });
                }}
              >
                {captionsUrl && captionsEnabled && (
                  <track kind="captions" src={captionsUrl} srcLang="en" label="English" default />
                )}
              </video>

              {/* Custom Accessible Controls Bar */}
              <div className="p-3 bg-[#1B365D] text-white space-y-2">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  aria-label="Seek video position"
                  className="w-full accent-[#60C1E5] cursor-pointer"
                />
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={togglePlay}
                      aria-label={isPlaying ? 'Pause video' : 'Play video'}
                      className="p-2 rounded-lg bg-[#005A9C] hover:bg-[#004980] min-h-[36px] min-w-[36px] flex items-center justify-center"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <span className="font-mono tabular-nums text-slate-200">
                      {formatTime(currentTime)} / {formatTime(duration || lesson.durationMinutes * 60)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleMute}
                      aria-label="Toggle mute"
                      className="p-1.5 rounded hover:bg-white/10"
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.1}
                      value={isMuted ? 0 : volume}
                      onChange={(e) => handleVolumeChange(Number(e.target.value))}
                      aria-label="Volume"
                      className="w-16 accent-[#60C1E5]"
                    />
                    <select
                      aria-label="Playback speed"
                      value={playbackSpeed}
                      onChange={(e) => handleSpeedChange(Number(e.target.value))}
                      className="px-2 py-1 rounded bg-white/10 text-white border border-white/20 text-xs font-mono"
                    >
                      <option value={0.75} className="text-slate-900">0.75x</option>
                      <option value={1} className="text-slate-900">1.0x</option>
                      <option value={1.25} className="text-slate-900">1.25x</option>
                      <option value={1.5} className="text-slate-900">1.5x</option>
                      <option value={2} className="text-slate-900">2.0x</option>
                    </select>
                    {captionsUrl && (
                      <button
                        type="button"
                        onClick={() => setCaptionsEnabled(!captionsEnabled)}
                        className={`px-2 py-1 rounded flex items-center gap-1 ${
                          captionsEnabled ? 'bg-[#60C1E5] text-[#1B365D] font-bold' : 'bg-white/10 text-white'
                        }`}
                      >
                        <Captions className="w-3.5 h-3.5" />
                        <span>CC</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleFullscreen}
                      aria-label="Toggle fullscreen"
                      className="p-1.5 rounded hover:bg-white/10"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center space-y-2 text-slate-300 text-xs">
              <Play className="w-10 h-10 text-[#60C1E5] mx-auto" />
              <p className="font-bold text-white">
                {primaryAsset
                  ? `Video Media Ready: ${primaryAsset.fileName}`
                  : 'Text & Study Notes Alternative Active'}
              </p>
              <p className="max-w-md mx-auto text-slate-400">
                {primaryAsset
                  ? 'Signed streaming URLs resolve securely via Firebase Storage once an instructor uploads a video stream in live mode. Use the full lesson notes and transcript below.'
                  : 'Read the structured lesson study material and complete any module quiz below.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Audio Player */}
      {isAudioLesson && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-3">
          {primaryUrl ? (
            <audio
              ref={audioRef}
              controls
              src={primaryUrl}
              className="w-full"
              onTimeUpdate={(e) => {
                const sec = Math.floor(e.currentTarget.currentTime);
                if (sec > 0 && sec % 15 === 0) {
                  onSaveProgress({ lastPositionSeconds: sec, watchedSecondsDelta: 15 });
                }
              }}
              onEnded={() => onSaveProgress({ completed: true })}
            />
          ) : (
            <div className="text-xs text-slate-600 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-[#005A9C]" />
              <span>Audio stream: {primaryAsset?.fileName || 'Lesson transcript available below'}</span>
            </div>
          )}
        </div>
      )}

      {/* Document / PDF / Presentation Safe Preview */}
      {isDocumentLesson && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1B365D]">
              <BookOpen className="w-4 h-4 text-[#005A9C]" />
              <span>{primaryAsset?.fileName || notesAsset?.fileName || 'Lesson Study Guide'}</span>
            </div>
            {(primaryUrl || notesUrl) && (
              <a
                href={primaryUrl || notesUrl || '#'}
                download={primaryAsset?.fileName || notesFileName}
                className="px-3 py-1.5 bg-[#005A9C] text-white text-xs font-bold rounded-lg flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download File</span>
              </a>
            )}
          </div>
          {primaryUrl && primaryAsset?.mimeType === 'application/pdf' && !lowBandwidthMode && (
            <iframe
              title={lesson.title}
              src={primaryUrl}
              className="w-full h-96 rounded-xl border border-slate-200"
            />
          )}
        </div>
      )}

      {/* External Resource Link */}
      {lesson.lessonType === 'external_resource' && lesson.externalUrl && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <strong className="text-[#1B365D] block">External Curated Resource</strong>
            <span className="text-slate-600 break-all">{lesson.externalUrl}</span>
          </div>
          <a
            href={lesson.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-[#005A9C] text-white font-bold rounded-xl flex items-center gap-1.5 min-h-[40px]"
          >
            <span>Open External Resource</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Low-Bandwidth Notice + Written Lesson Body */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        {lowBandwidthMode && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
            <strong>Low-Bandwidth Mode Enabled:</strong> High-bitrate video streams are paused to save data bundles across Uganda rural networks. Full written instructions and study summaries remain visible.
          </div>
        )}

        {lesson.objectives.length > 0 && (
          <div className="space-y-1.5">
            <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-[#005A9C]">
              Lesson Learning Objectives
            </h4>
            <ul className="list-disc pl-5 text-xs text-slate-700 space-y-1">
              {lesson.objectives.map((obj, idx) => (
                <li key={idx}>{obj}</li>
              ))}
            </ul>
          </div>
        )}

        {lesson.textContent && (
          <div className="prose prose-sm max-w-none text-slate-700 text-sm leading-relaxed whitespace-pre-line">
            {lesson.textContent}
          </div>
        )}

        {lesson.instructorNotes && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <strong className="text-[#1B365D] block mb-0.5">Instructor Guidance</strong>
            {lesson.instructorNotes}
          </div>
        )}

        {showTranscript && lesson.transcript && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5">
            <strong className="text-[#1B365D] block">Accessible Lesson Transcript</strong>
            <p className="leading-relaxed whitespace-pre-line">{lesson.transcript}</p>
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {isCompleted
              ? 'This lesson is recorded as completed on your learning progress.'
              : 'Mark this lesson complete after reviewing the materials above.'}
          </div>
          <button
            type="button"
            onClick={() => onSaveProgress({ completed: !isCompleted })}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 min-h-[44px] transition-colors ${
              isCompleted
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                : 'bg-[#005A9C] hover:bg-[#004980] text-white'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isCompleted ? 'Completed (Toggle Undo)' : 'Mark Lesson Completed'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
