'use client';

import { useCallbackRef } from './useCallbackRef';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch } from '@/lib/cms/client';
import { slugify } from '@/lib/cms/slug';
import { DIFFICULTIES, DISTRIBUTIONS } from '@/lib/cms/constants';
import type { Category, Tutorial } from '@/lib/cms/types';
import { ConfirmDialog } from './ConfirmDialog';

interface FormState {
  title: string;
  slug: string;
  summary: string;
  content: string;
  coverImage: string;
  categoryId: string;
  tags: string;
  difficulty: string;
  distribution: string;
  author: string;
  seoTitle: string;
  seoDescription: string;
  status: string;
  featured: boolean;
  publishedAt: string;
}

function fromTutorial(t: Tutorial | null): FormState {
  return {
    title: t?.title ?? '',
    slug: t?.slug ?? '',
    summary: t?.summary ?? '',
    content: t?.content ?? '',
    coverImage: t?.coverImage ?? '',
    categoryId: t?.categoryId ? String(t.categoryId) : '',
    tags: t?.tags.map((tag) => tag.name).join(', ') ?? '',
    difficulty: t?.difficulty ?? 'Beginner',
    distribution: t?.distribution ?? 'General Linux',
    author: t?.author ?? '',
    seoTitle: t?.seoTitle ?? '',
    seoDescription: t?.seoDescription ?? '',
    status: t?.status ?? 'draft',
    featured: t?.featured ?? false,
    publishedAt: t?.publishedAt ? t.publishedAt.slice(0, 16) : '',
  };
}

export function TutorialEditor({
  tutorial,
  categories,
}: {
  tutorial: Tutorial | null;
  categories: Category[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => fromTutorial(tutorial));
  const [slugLocked, setSlugLocked] = useState<boolean>(Boolean(tutorial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [autosaveState, setAutosaveState] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const id = tutorial?.id ?? null;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'title' && !slugLocked) {
        next.slug = slugify(value as string);
      }
      return next;
    });
  }

  function buildPayload() {
    return {
      ...form,
      categoryId: form.categoryId ? Number(form.categoryId) : null,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : null,
    };
  }

  // ---- Live preview (debounced, server-rendered & sanitised) ----
  useEffect(() => {
    if (!showPreview) return;
    const handle = setTimeout(async () => {
      const result = await apiFetch<{ html?: string }>('/api/admin/preview', {
        method: 'POST',
        body: JSON.stringify({ content: form.content }),
      });
      if (result.ok && result.data?.html !== undefined) setPreviewHtml(result.data.html);
    }, 400);
    return () => clearTimeout(handle);
  }, [form.content, showPreview]);

  // ---- Autosave (existing tutorials only) ----
  const autosaveRef = useCallbackRef(async () => {
    if (id === null) return;
    setAutosaveState('Saving…');
    const result = await apiFetch(`/api/admin/tutorials/${id}/autosave`, {
      method: 'POST',
      body: JSON.stringify({ title: form.title, summary: form.summary, content: form.content }),
    });
    setAutosaveState(result.ok ? `Autosaved ${new Date().toLocaleTimeString()}` : 'Autosave failed');
  });

  const firstRun = useRef(true);
  useEffect(() => {
    if (id === null) return;
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const handle = setTimeout(() => autosaveRef(), 2500);
    return () => clearTimeout(handle);
  }, [form.title, form.summary, form.content, id, autosaveRef]);

  async function save(overrideStatus?: 'draft' | 'published') {
    setSaving(true);
    setErrors({});
    setMessage('');
    const payload = buildPayload();
    if (overrideStatus) payload.status = overrideStatus;

    const result = id
      ? await apiFetch<{ tutorial?: Tutorial; details?: Record<string, string> }>(`/api/admin/tutorials/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
      : await apiFetch<{ tutorial?: Tutorial; details?: Record<string, string> }>(`/api/admin/tutorials`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });

    setSaving(false);
    if (result.ok && result.data?.tutorial) {
      if (overrideStatus) update('status', overrideStatus);
      setMessage('Saved successfully.');
      if (!id) {
        router.push(`/admin/tutorials/${result.data.tutorial.id}/edit`);
        router.refresh();
      } else {
        router.refresh();
      }
    } else if (result.status === 400 && result.data?.details) {
      setErrors(result.data.details);
      setMessage('Please fix the highlighted fields.');
    } else {
      setMessage('Could not save. Please try again.');
    }
  }

  async function onUpload(file: File) {
    // Client-side guard so the user gets an instant, clear message.
    const MAX = 5 * 1024 * 1024;
    if (file.size > MAX) {
      setMessage(`That image is ${(file.size / 1024 / 1024).toFixed(1)} MB. Please use an image under 5 MB (PNG, JPEG, WebP, GIF or SVG).`);
      return;
    }
    setMessage('Uploading image…');
    const data = new FormData();
    data.append('file', file);
    const result = await apiFetch<{ url?: string; error?: string }>('/api/admin/upload', {
      method: 'POST',
      body: data,
    });
    if (result.ok && result.data?.url) {
      update('coverImage', result.data.url);
      setMessage('Image uploaded.');
    } else if (result.status === 413) {
      setMessage('Upload rejected: the image is too large (max 5 MB).');
    } else {
      setMessage(result.data?.error ?? `Upload failed (HTTP ${result.status || 'network error'}).`);
    }
  }

  async function doDelete() {
    if (id === null) return;
    await apiFetch(`/api/admin/tutorials/${id}`, { method: 'DELETE' });
    setConfirmDelete(false);
    router.push('/admin');
    router.refresh();
  }

  const previewUrl = id ? `/admin/tutorials/${id}/preview` : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <Field label="Title" error={errors.title}>
          <input className="input" value={form.title} onChange={(e) => update('title', e.target.value)} maxLength={200} />
        </Field>

        <Field label="URL slug" error={errors.slug} hint={`/linux-tutorials/${form.slug || '…'}`}>
          <div className="flex gap-2">
            <input
              className="input font-mono text-sm"
              value={form.slug}
              onChange={(e) => update('slug', slugify(e.target.value))}
              disabled={!slugLocked}
            />
            <button type="button" onClick={() => setSlugLocked((v) => !v)} className="btn-secondary whitespace-nowrap text-sm">
              {slugLocked ? 'Auto' : 'Edit'}
            </button>
          </div>
        </Field>

        <Field label="Summary" error={errors.summary}>
          <textarea className="input" rows={2} value={form.summary} onChange={(e) => update('summary', e.target.value)} maxLength={500} />
        </Field>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="label mb-0">Content (Markdown)</span>
            <div className="flex items-center gap-3 text-sm">
              {autosaveState && <span className="text-xs text-slate-400">{autosaveState}</span>}
              <button type="button" onClick={() => setShowPreview((v) => !v)} className="text-brand-700 hover:underline dark:text-brand-300">
                {showPreview ? 'Hide preview' : 'Show preview'}
              </button>
            </div>
          </div>
          <div className={showPreview ? 'grid gap-3 lg:grid-cols-2' : ''}>
            <textarea
              className="input min-h-[420px] font-mono text-sm"
              value={form.content}
              onChange={(e) => update('content', e.target.value)}
              maxLength={200_000}
              placeholder="# Heading&#10;&#10;Write your tutorial in Markdown. Use ```bash code blocks, tables, lists and > [!WARNING] callouts."
            />
            {showPreview && (
              <div
                className="tutorial-prose min-h-[420px] overflow-auto rounded-lg border border-slate-200 p-4 dark:border-slate-800"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            )}
          </div>
          {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content}</p>}
          <p className="mt-1 text-xs text-slate-400">
            Supports headings, lists, links, tables, blockquotes, inline code, fenced code blocks with syntax
            highlighting, images, and GitHub-style <code>&gt; [!WARNING]</code> callouts.
          </p>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="card space-y-3">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => save()} disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving…' : 'Save'}
            </button>
            {form.status === 'published' ? (
              <button type="button" onClick={() => save('draft')} disabled={saving} className="btn-secondary">
                Unpublish
              </button>
            ) : (
              <button type="button" onClick={() => save('published')} disabled={saving} className="btn-secondary">
                Publish
              </button>
            )}
          </div>
          {previewUrl && (
            <a href={previewUrl} target="_blank" rel="noreferrer" className="btn-secondary w-full text-center text-sm">
              Open preview ↗
            </a>
          )}
          {message && <p className="text-sm text-slate-600 dark:text-slate-400">{message}</p>}
        </div>

        <div className="card space-y-3">
          <Field label="Status">
            <select className="input" value={form.status} onChange={(e) => update('status', e.target.value)}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.featured} onChange={(e) => update('featured', e.target.checked)} className="h-4 w-4 rounded" />
            Featured
          </label>
          <Field label="Publication date">
            <input type="datetime-local" className="input" value={form.publishedAt} onChange={(e) => update('publishedAt', e.target.value)} />
          </Field>
        </div>

        <div className="card space-y-3">
          <Field label="Category">
            <select className="input" value={form.categoryId} onChange={(e) => update('categoryId', e.target.value)}>
              <option value="">— None —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Tags (comma separated)">
            <input className="input" value={form.tags} onChange={(e) => update('tags', e.target.value)} placeholder="ssh, security, firewall" />
          </Field>
          <Field label="Difficulty">
            <select className="input" value={form.difficulty} onChange={(e) => update('difficulty', e.target.value)}>
              {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Distribution">
            <select className="input" value={form.distribution} onChange={(e) => update('distribution', e.target.value)}>
              {DISTRIBUTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Author">
            <input className="input" value={form.author} onChange={(e) => update('author', e.target.value)} maxLength={120} />
          </Field>
        </div>

        <div className="card space-y-3">
          <Field label="Cover image" error={errors.coverImage} hint="Paste an image URL or upload a file">
            <input className="input" value={form.coverImage} onChange={(e) => update('coverImage', e.target.value)} placeholder="https://… or /api/uploads/…" />
          </Field>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
            }}
            className="block w-full text-sm text-slate-500 file:mr-3 file:rounded file:border-0 file:bg-brand-600 file:px-3 file:py-1.5 file:text-white"
          />
          {form.coverImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.coverImage} alt="" className="max-h-32 rounded border border-slate-200 dark:border-slate-800" />
          )}
        </div>

        <div className="card space-y-3">
          <p className="text-sm font-semibold">SEO (optional)</p>
          <Field label="SEO title" hint="Falls back to the tutorial title">
            <input className="input" value={form.seoTitle} onChange={(e) => update('seoTitle', e.target.value)} maxLength={70} />
          </Field>
          <Field label="SEO description" hint="Falls back to the summary">
            <textarea className="input" rows={2} value={form.seoDescription} onChange={(e) => update('seoDescription', e.target.value)} maxLength={200} />
          </Field>
        </div>

        {id && (
          <button type="button" onClick={() => setConfirmDelete(true)} className="btn w-full border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/40">
            Delete tutorial
          </button>
        )}
      </aside>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete tutorial?"
        message={`“${form.title}” will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={doDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
