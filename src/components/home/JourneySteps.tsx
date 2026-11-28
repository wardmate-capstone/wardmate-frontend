import { ArrowRight, SealCheck } from '@phosphor-icons/react';
import { m, useReducedMotion } from 'motion/react';
import { guideSteps } from '@/data/preparationGuide';

// L-01: dùng chung các bước với trang Hướng dẫn để số bước luôn khớp.
const steps = guideSteps.map(step => ({ label: step.title, detail: step.description, icon: step.icon }));

export function JourneySteps() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="journey-section" aria-labelledby="journey-title">
      <div className="journey-workspace">
        <div className="journey-overview">
          <div className="journey-overview-pattern" aria-hidden="true" />
          <div className="journey-overview-content">
            <span className="journey-overview-icon"><SealCheck size={27} aria-hidden="true" /></span>
            <p className="journey-eyebrow">Quy trình chuẩn bị hồ sơ</p>
            <h2 id="journey-title">Chuẩn bị hồ sơ<br />qua {steps.length} bước</h2>
            <a href="#trang-chu" className="journey-start-link">Bắt đầu tra cứu <ArrowRight size={18} aria-hidden="true" /></a>
          </div>
        </div>

        <div className="journey-timeline-wrap">
          <div className="journey-timeline-heading"><p>Hành trình của bạn</p></div>
          <ol className="journey-timeline">
            {steps.map(({ label, detail, icon: Icon }, index) => (
              <li key={label} className="journey-timeline-item">
                <m.div className="journey-node" aria-hidden="true"
                  initial={reduceMotion ? false : { y: 6, opacity: 0.8 }}
                  whileInView={reduceMotion ? undefined : { y: 0, opacity: 1 }}
                  viewport={{ once: true }} transition={{ duration: 0.28, delay: index * 0.04, ease: 'easeOut' }}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                </m.div>
                <div className="journey-step-card">
                  <span className="journey-step-icon"><Icon size={23} strokeWidth={1.8} aria-hidden="true" /></span>
                  <div className="journey-step-copy"><p>Bước {index + 1}</p><h3>{label}</h3><span>{detail}</span></div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
