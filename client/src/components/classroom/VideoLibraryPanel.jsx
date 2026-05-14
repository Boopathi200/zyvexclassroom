import { useCallback, useState } from 'react';
import { API_BASE, apiJson, uploadWithProgress } from '../../api.js';
import { GlassCard } from '../ui/GlassCard.jsx';

export default function VideoLibraryPanel({ classroomId, teacherControls, videos, onRefresh }) {
  const [drag, setDrag] = useState(false);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('General');
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const uploadFile = useCallback(
    async (file) => {
      if (!file || !teacherControls) return;
      setErr('');
      setBusy(true);
      setProgress(0);
      try {
        const fd = new FormData();
        fd.append('classroomId', classroomId);
        fd.append('title', title || file.name);
        fd.append('subject', subject);
        fd.append('file', file);
        await uploadWithProgress('/api/videos', fd, setProgress);
        setTitle('');
        setSubject('General');
        await onRefresh();
      } catch (e) {
        setErr(e.message || 'Upload failed');
      } finally {
        setBusy(false);
        setProgress(0);
      }
    },
    [classroomId, teacherControls, title, subject, onRefresh]
  );

  const onDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) uploadFile(f);
  };

  return (
    <div className="space-y-6">
      {teacherControls && (
        <GlassCard className="p-5">
          <h3 className="font-display text-lg font-semibold text-zinc-900 dark:text-white">Lecture video library</h3>
          <p className="text-xs text-zinc-500 mt-1">Drag & drop a video or pick a file. Large uploads show progress below.</p>
          <div className="mt-4 grid md:grid-cols-2 gap-3">
            <input
              className="rounded-xl border border-black/10 bg-white/80 px-3 py-2 text-sm dark:border-white/10 dark:bg-black/40 dark:text-white"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              className="rounded-xl border border-black/10 bg-white/80 px-3 py-2 text-sm dark:border-white/10 dark:bg-black/40 dark:text-white"
              placeholder="Subject / category"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
            className={`mt-4 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
              drag ? 'border-zyvex-gold bg-zyvex-gold/10' : 'border-black/15 dark:border-white/15'
            }`}
          >
            <p className="text-sm text-zinc-600 dark:text-zinc-300">Drop video file here</p>
            <label className="mt-3 cursor-pointer rounded-lg bg-zyvex-gold px-4 py-2 text-xs font-semibold text-black hover:bg-zyvex-goldlight">
              Browse files
              <input
                type="file"
                accept="video/*"
                className="hidden"
                disabled={busy}
                onChange={(e) => uploadFile(e.target.files?.[0])}
              />
            </label>
          </div>
          {busy && (
            <div className="mt-4">
              <div className="h-2 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                <div className="h-full bg-gradient-to-r from-zyvex-gold to-zyvex-goldlight transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">Uploading… {progress}%</p>
            </div>
          )}
          {err && <p className="text-xs text-red-400 mt-2">{err}</p>}
        </GlassCard>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {videos.map((v) => (
          <GlassCard key={v._id} className="p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-zinc-900 dark:text-white">{v.title}</p>
                <p className="text-[11px] uppercase tracking-wider text-zyvex-gold mt-1">{v.subject}</p>
              </div>
            </div>
            <video src={`${API_BASE}${v.fileUrl}`} controls className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-black" />
            {teacherControls && (
              <button
                type="button"
                className="text-xs text-red-400 hover:text-red-300 self-start"
                onClick={async () => {
                  await apiJson(`/api/videos/${v._id}`, { method: 'DELETE' });
                  await onRefresh();
                }}
              >
                Remove
              </button>
            )}
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
