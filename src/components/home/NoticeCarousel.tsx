import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ArrowLeft, ArrowRight, CalendarBlank as CalendarDays } from '@phosphor-icons/react';
import { notices } from '@/data/landing';
import { Button } from '@/components/ui/Button';

export function NoticeCarousel() {
  const [viewportRef, emblaApi] = useEmblaCarousel({ align: 'start', containScroll: 'trimSnaps' });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const onSelect = useCallback(() => {
    if (emblaApi) setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
    onSelect();
    emblaApi.on('select', onSelect).on('reInit', onSelect);
    return () => { emblaApi.off('select', onSelect).off('reInit', onSelect); };
  }, [emblaApi, onSelect]);

  return (
    <div>
      <div className="overflow-hidden" ref={viewportRef}>
        <div className="-ml-5 flex touch-pan-y">
          {notices.map((notice) => (
            <article key={notice.title} className="min-w-0 flex-[0_0_90%] pl-5 sm:flex-[0_0_55%] lg:flex-[0_0_35%]">
              <div className="notice-card">
                <div className="flex items-center justify-between gap-4"><span className="notice-type">{notice.category}</span><span className="flex items-center gap-1.5 text-xs text-slate-500"><CalendarDays size={14} aria-hidden="true" />{notice.date}</span></div>
                <h3 className="mt-5 text-lg font-bold leading-7 text-slate-950">{notice.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{notice.excerpt}</p>
                <button type="button" className="mt-auto inline-flex min-h-11 items-center gap-2 pt-5 text-sm font-bold text-red-800">Đọc hướng dẫn <ArrowRight size={16} aria-hidden="true" /></button>
              </div>
            </article>
          ))}
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between gap-4">
        <div className="flex gap-2" aria-label="Vị trí nội dung">
          {scrollSnaps.map((_, index) => <button key={index} type="button" onClick={() => emblaApi?.scrollTo(index)} className={`h-2 rounded-full transition-all ${index === selectedIndex ? 'w-8 bg-red-700' : 'w-2 bg-red-200'}`} aria-label={`Đến nhóm nội dung ${index + 1}`} aria-current={index === selectedIndex ? 'true' : undefined} />)}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => emblaApi?.scrollPrev()} aria-label="Nội dung trước"><ArrowLeft size={19} aria-hidden="true" /></Button>
          <Button variant="outline" size="icon" onClick={() => emblaApi?.scrollNext()} aria-label="Nội dung tiếp theo"><ArrowRight size={19} aria-hidden="true" /></Button>
        </div>
      </div>
    </div>
  );
}
