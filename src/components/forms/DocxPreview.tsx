import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui';

const frameHtml = `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data: blob:; font-src data: blob:;"><style>html,body{margin:0;background:#e2e8f0}body{overflow:auto}.docx-wrapper{width:max-content;min-width:100%;box-sizing:border-box;padding:20px!important}section.docx{margin-bottom:20px!important}a{pointer-events:none}</style></head><body><div id="styles"></div><div id="document"></div></body></html>`;

/** Isolate document CSS/links from the application; no scripts or network in the frame. */
export function DocxPreview({ blob }: { blob: Blob }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const generation = useRef(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [zoom, setZoom] = useState<number | 'fit'>('fit');

  useEffect(() => {
    if (status !== 'ready') return;
    const element = frame.current;
    const body = element?.contentDocument?.body;
    if (!element || !body) return;
    const resize = () => {
      body.style.zoom = '1';
      body.style.zoom = String(zoom === 'fit' ? Math.min(1, element.clientWidth / Math.max(1, body.scrollWidth)) : zoom / 100);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    return () => observer.disconnect();
  }, [status, zoom]);

  const render = async () => {
    const element = frame.current;
    const document = element?.contentDocument;
    const body = document?.getElementById('document');
    const styles = document?.getElementById('styles');
    if (!element || !document || !body || !styles) return;
    const current = ++generation.current;
    setStatus('loading');
    try {
      const { renderAsync } = await import('docx-preview');
      const bytes = await blob.arrayBuffer();
      if (!element.isConnected || generation.current !== current) return;
      await renderAsync(bytes, body, styles, { useBase64URL: true, renderAltChunks: false, renderComments: false });
      if (!element.isConnected || generation.current !== current) return;
      document.querySelectorAll('a').forEach(link => link.removeAttribute('href'));
      setStatus('ready');
    } catch {
      if (element.isConnected && generation.current === current) setStatus('error');
    }
  };

  return <div className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm text-slate-600">Bản xem trước có thể khác đôi chút so với Word.</p>
      <div className="flex gap-1" aria-label="Thu phóng bản xem trước">
        <Button size="small" variant="ghost" disabled={status !== 'ready'} aria-label="Thu nhỏ" onClick={() => setZoom(value => Math.max(40, (value === 'fit' ? 100 : value) - 20))}>−</Button>
        <Button size="small" variant="outline" disabled={status !== 'ready'} onClick={() => setZoom('fit')}>{zoom === 'fit' ? 'Vừa khung' : `${zoom}% · Vừa khung`}</Button>
        <Button size="small" variant="ghost" disabled={status !== 'ready'} aria-label="Phóng to" onClick={() => setZoom(value => Math.min(200, (value === 'fit' ? 100 : value) + 20))}>+</Button>
      </div>
    </div>
    {status === 'loading' && <p role="status" className="rounded-lg bg-slate-100 p-4 text-sm">Đang dựng bản xem trước…</p>}
    {status === 'error' && <div role="alert" className="space-y-3 rounded-lg bg-red-50 p-4 text-sm text-red-800"><p>Không thể xem trước tệp Word này. Bạn vẫn có thể tải mẫu về để mở bằng Word.</p><Button size="small" variant="outline" onClick={() => void render()}>Thử dựng lại</Button></div>}
    <iframe ref={frame} title="Nội dung biểu mẫu Word" sandbox="allow-same-origin" referrerPolicy="no-referrer" srcDoc={frameHtml} onLoad={() => void render()} className={`h-[55dvh] min-h-72 w-full rounded-xl border border-slate-200 bg-slate-200 ${status === 'error' ? 'hidden' : status === 'loading' ? 'invisible' : ''}`} />
  </div>;
}
