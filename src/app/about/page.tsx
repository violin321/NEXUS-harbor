"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Blocks, Cpu, Gauge, ShieldCheck, Sparkles, Workflow } from "lucide-react";

const pillars = [
  {
    title: "GUI-first 服务入口",
    desc: "不是继续堆配置文件，而是给个人与小团队一个真正可管理、可演进、可审美化的现代入口层。",
    icon: Blocks,
  },
  {
    title: "实时状态感知",
    desc: "把服务健康、系统资源、巡检结果和可见入口收进同一张面里，让入口页同时具备运营感知能力。",
    icon: Gauge,
  },
  {
    title: "AI 编排前台",
    desc: "它不是静态收藏夹，而是未来承接 Agent、自动化任务、系统巡检与运维操作的前台外壳。",
    icon: Workflow,
  },
];

const scenarios = [
  "个人自托管服务总入口：把 API、后台、搜索、下载、监控集中到一个首页。",
  "小团队内部导航台：给同事一个能直接打开、可控、带健康感知的统一入口。",
  "AI 原生工作台首页：承接模型代理、自动化任务、状态概览与下一步操作。",
  "项目型操作面板：从“静态链接页”升级为“持续可见、持续可管理”的产品层。",
];

const layers = [
  {
    name: "Presentation Layer",
    desc: "导航首页、状态页、产品介绍页、管理页，分别承接外部访问、内部查看与产品表达。",
  },
  {
    name: "Runtime Insight Layer",
    desc: "轮询检测、系统资源、服务状态、双 URL 解析，把“能打开”升级成“知道现在怎么样”。",
  },
  {
    name: "Orchestration Layer",
    desc: "继续接入 Agent、自动化任务与系统操作后，它就不只是 homepage，而是控制前台。",
  },
];

const differentiators = [
  {
    title: "不是“又一个导航页”",
    desc: "传统导航页解决的是收纳；Harbor 想解决的是入口、状态、管理和后续 AI 承接的一体化。",
  },
  {
    title: "不是只面向极客配置",
    desc: "保留技术可控性的同时，把 GUI 和管理操作做成默认正道，而不是 YAML 之外的补丁。",
  },
  {
    title: "不是静态门牌",
    desc: "它关心服务是否可用、机器是否健康、系统是否正常，而不只是把链接排出来。",
  },
];

const slideLabels = [
  "封面",
  "价值",
  "截图",
  "场景",
  "架构",
  "CTA",
];

export default function AboutPage() {
  const mainRef = useRef<HTMLElement | null>(null);
  const wheelLockRef = useRef(false);
  const touchStartYRef = useRef<number | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [showPagination, setShowPagination] = useState(false);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const nearRightEdge = window.innerWidth - event.clientX < 120;
      if (nearRightEdge) {
        setShowPagination(true);
        window.clearTimeout((window as Window & { __aboutPaginationHoverTimer?: number }).__aboutPaginationHoverTimer);
        (window as Window & { __aboutPaginationHoverTimer?: number }).__aboutPaginationHoverTimer = window.setTimeout(() => {
          setShowPagination(false);
        }, 1200);
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, []);

  useEffect(() => {
    const slides = Array.from((mainRef.current ?? document).querySelectorAll<HTMLElement>(".slide"));
    if (!slides.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const idx = slides.indexOf(entry.target as HTMLElement);
          if (idx >= 0) {
            setActiveSlide(idx);
            setShowPagination(true);
            window.clearTimeout((window as Window & { __aboutPaginationTimer?: number }).__aboutPaginationTimer);
            (window as Window & { __aboutPaginationTimer?: number }).__aboutPaginationTimer = window.setTimeout(() => setShowPagination(false), 1400);
            slides.forEach((slide, slideIdx) => {
              slide.classList.toggle("is-active", slideIdx === idx);
            });
          }
        });
      },
      { threshold: 0.55 }
    );

    slides.forEach((slide) => observer.observe(slide));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onWheel = (event: WheelEvent) => {
      const target = event.target as HTMLElement | null;
      if (!mainRef.current?.contains(target)) return;
      if (target?.closest("a, button, input, textarea, select, summary, [data-no-flip='true']")) return;
      if (wheelLockRef.current) {
        event.preventDefault();
        return;
      }
      if (Math.abs(event.deltaY) < 18) return;

      event.preventDefault();
      wheelLockRef.current = true;
      setShowPagination(true);

      const slides = Array.from((mainRef.current ?? document).querySelectorAll<HTMLElement>(".slide"));
      const nextIndex = event.deltaY > 0 ? Math.min(activeSlide + 1, slides.length - 1) : Math.max(activeSlide - 1, 0);
      slides[nextIndex]?.scrollIntoView({ behavior: "smooth", block: "start" });

      window.setTimeout(() => {
        wheelLockRef.current = false;
      }, 720);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [activeSlide]);

  const handlePageClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    if (target.closest("a, button, input, textarea, select, summary, [data-no-flip='true']")) {
      return;
    }

    const slides = Array.from((mainRef.current ?? document).querySelectorAll<HTMLElement>(".slide"));
    if (!slides.length) return;

    const viewportMid = window.innerHeight * 0.5;
    let currentIndex = 0;

    for (let i = 0; i < slides.length; i += 1) {
      const rect = slides[i].getBoundingClientRect();
      if (rect.top <= viewportMid && rect.bottom >= viewportMid) {
        currentIndex = i;
        break;
      }
      if (rect.top > viewportMid) {
        currentIndex = Math.max(0, i - 1);
        break;
      }
    }

    const nextSlide = slides[Math.min(currentIndex + 1, slides.length - 1)];
    nextSlide?.scrollIntoView({ behavior: "smooth", block: "start" });
    setShowPagination(true);
  }, []);

  const goToSlide = useCallback((index: number) => {
    const slides = Array.from((mainRef.current ?? document).querySelectorAll<HTMLElement>(".slide"));
    setShowPagination(true);
    slides[index]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleTouchStart = useCallback((event: React.TouchEvent<HTMLElement>) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest("a, button, input, textarea, select, summary, [data-no-flip='true']")) return;
    touchStartYRef.current = event.touches[0]?.clientY ?? null;
  }, []);

  const handleTouchEnd = useCallback((event: React.TouchEvent<HTMLElement>) => {
    const startY = touchStartYRef.current;
    touchStartYRef.current = null;
    if (startY == null) return;

    const target = event.target as HTMLElement | null;
    if (target?.closest("a, button, input, textarea, select, summary, [data-no-flip='true']")) return;

    const endY = event.changedTouches[0]?.clientY ?? startY;
    const deltaY = startY - endY;
    if (Math.abs(deltaY) < 48) return;

    if (deltaY > 0) {
      goToSlide(Math.min(activeSlide + 1, slideLabels.length - 1));
    } else {
      goToSlide(Math.max(activeSlide - 1, 0));
    }
  }, [activeSlide, goToSlide]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;

      if (["ArrowDown", "ArrowRight", "PageDown", " "].includes(event.key)) {
        event.preventDefault();
        goToSlide(Math.min(activeSlide + 1, slideLabels.length - 1));
        return;
      }

      if (["ArrowUp", "ArrowLeft", "PageUp"].includes(event.key)) {
        event.preventDefault();
        goToSlide(Math.max(activeSlide - 1, 0));
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeSlide, goToSlide]);

  return (
    <main
      ref={mainRef}
      className={`about-shell text-white about-theme-${activeSlide + 1}`}
      onClick={handlePageClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="about-stage" aria-hidden="true">
        <div className="about-stage-beam about-stage-beam-a" />
        <div className="about-stage-beam about-stage-beam-b" />
        <div className="about-stage-grid" />
      </div>

      <div className="about-progress">
        <div className="about-progress-bar" style={{ width: `${((activeSlide + 1) / slideLabels.length) * 100}%` }} />
      </div>

      <aside
        className={`about-pagination ${showPagination ? "about-pagination--visible" : ""}`}
        data-no-flip="true"
        aria-label="Slide pagination"
        onMouseEnter={() => setShowPagination(true)}
        onMouseLeave={() => setShowPagination(false)}
      >
        {slideLabels.map((label, index) => (
          <button
            key={label}
            type="button"
            className={`about-dot ${index === activeSlide ? "about-dot--active" : ""}`}
            onClick={() => goToSlide(index)}
            aria-label={`跳到第 ${index + 1} 屏：${label}`}
            title={label}
          >
            <span className="about-dot-index">0{index + 1}</span>
            <span className="about-dot-label">{label}</span>
          </button>
        ))}
      </aside>

      <div className="about-hud" data-no-flip="true">
        <span className="about-hud-kicker">Slide</span>
        <strong>{String(activeSlide + 1).padStart(2, "0")}</strong>
        <span className="about-hud-divider">/</span>
        <span>{String(slideLabels.length).padStart(2, "0")}</span>
        <em>{slideLabels[activeSlide]}</em>
      </div>

      <nav className="about-nav">
        <div className="about-brand">
          <span className="about-brand-mark">N</span>
          <div>
            <p className="about-brand-title">NEXUS Harbor</p>
            <p className="about-brand-sub">NEXUS Harbor / product introduction</p>
          </div>
        </div>
        <div className="about-nav-links">
          <Link href="/">返回导航页</Link>
          <Link href="/admin">管理后台</Link>
        </div>
      </nav>

      <section className="slide slide-hero visible">
        <div className="slide-content hero-grid">
          <div className="hero-copy reveal">
            <div className="eyebrow">Product Story</div>
            <div className="hero-signal" aria-hidden="true">
              <span className="hero-signal-line hero-signal-line-a" />
              <span className="hero-signal-line hero-signal-line-b" />
              <span className="hero-signal-line hero-signal-line-c" />
            </div>
            <h1>NEXUS Harbor：面向自托管 AI 生态的现代服务入口前台</h1>
            <p className="hero-lead">
              NEXUS Harbor 是一个面向个人与小团队的产品化入口层：它既承担导航页的“打开即用”，
              也承担状态感知、系统可见性和未来 Agent 编排的前台角色。
            </p>
            <p className="hero-copy-note">
              与其把它理解成 another homepage，不如把它理解成：
              <strong> 一个从服务入口生长出来的 AI-native control front.</strong>
            </p>
            <div className="hero-actions" data-no-flip="true">
              <span className="tap-hint">单击页面空白处可翻到下一屏</span>
              <Link href="/" className="hero-btn hero-btn-primary">
                进入导航页 <ArrowRight size={16} />
              </Link>
              <Link href="/admin" className="hero-btn hero-btn-secondary">
                查看管理后台
              </Link>
            </div>
          </div>

          <div className="hero-panel reveal">
            <div className="hero-wave" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="metric-card metric-card--active">
              <span>定位</span>
              <strong>Navigation × Monitoring × AI Entry</strong>
            </div>
            <div className="metric-card">
              <span>当前形态</span>
              <strong>Next.js + shadcn/ui + Tailwind v4</strong>
            </div>
            <div className="metric-card metric-card--selected">
              <span>对外入口</span>
              <strong>NEXUS Harbor / about / admin / status</strong>
            </div>
            <div className="hero-orbit">
              <div className="orbit-ring orbit-ring-a" />
              <div className="orbit-ring orbit-ring-b" />
              <div className="orbit-core"><Sparkles size={18} /></div>
            </div>
          </div>
        </div>
      </section>

      <section className="slide">
        <div className="slide-content section-stack">
          <div className="section-head reveal">
            <div>
              <div className="eyebrow">Why It Matters</div>
              <h2>为什么它值得被单独当成产品来讲</h2>
            </div>
            <p>
              NEXUS Harbor 不是想重复 Homer / Homepage / Heimdall 的表层能力，而是把“服务入口”升级为“可管理、可感知、可继续承接 AI 工作流”的产品层。
            </p>
          </div>

          <div className="feature-grid">
            <div className="feature-glow feature-glow-a" aria-hidden="true" />
            <div className="feature-glow feature-glow-b" aria-hidden="true" />
            {pillars.map(({ title, desc, icon: Icon }, idx) => (
              <article key={title} className={`feature-card reveal feature-card-${idx}`}>
                <div className="feature-icon"><Icon size={20} /></div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="slide">
        <div className="slide-content section-stack">
          <div className="section-head reveal">
            <div>
              <div className="eyebrow">Product Snapshot</div>
              <h2>真实界面，不是概念稿</h2>
            </div>
            <p>
              下面这组截图来自当前运行中的产品：一个主导航首页，一个卡片化服务视图。它不是空 PPT，而是已经具备真实访问路径、状态感知和后台管理能力的站点。
            </p>
          </div>

          <div className="shot-grid">
            <div className="shot-orb shot-orb-a" aria-hidden="true" />
            <div className="shot-orb shot-orb-b" aria-hidden="true" />
            <figure className="shot-card reveal">
              <div className="shot-frame">
                <Image src="/about-assets/violinai-homepage.png" alt="Harbor homepage screenshot" fill className="shot-image" />
              </div>
              <figcaption>
                <strong>主导航首页</strong>
                <span>卡片式服务入口 + 系统状态感知 + 统一视觉层</span>
              </figcaption>
            </figure>
            <figure className="shot-card reveal shot-card-selected">
              <div className="shot-frame">
                <Image src="/about-assets/homepage-cards.png" alt="Harbor service cards screenshot" fill className="shot-image" />
              </div>
              <figcaption>
                <strong>服务卡片视图</strong>
                <span>分组、图标、描述、状态与动作入口收进一张卡片里</span>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="slide">
        <div className="slide-content split-layout">
          <div className="quote-panel reveal">
            <div className="eyebrow">Use Cases</div>
            <blockquote>
              当一个入口页同时知道“有哪些服务”、“它们是否正常”、“我接下来该去哪里操作”，它就开始从导航页变成产品。
            </blockquote>
          </div>

          <div className="scenario-list reveal">
            <div className="scenario-pulse" aria-hidden="true" />
            {scenarios.map((item, idx) => (
              <div className="scenario-item" key={item}>
                <span className="scenario-index">0{idx + 1}</span>
                <p>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="slide">
        <div className="slide-content section-stack">
          <div className="section-head reveal">
            <div>
              <div className="eyebrow">Architecture</div>
              <h2>产品层次：从入口页走向 AI 控制前台</h2>
            </div>
            <p>
              这套结构天然适合继续长出 Agent、自动化、状态可视化与系统编排，而不是停留在“静态卡片页”。
            </p>
          </div>

          <div className="layer-grid">
            <div className="layer-beam" aria-hidden="true" />
            {layers.map((layer, idx) => (
              <article key={layer.name} className={`layer-card reveal layer-card-${idx}`}>
                <div className="layer-head">
                  <span className="layer-dot" />
                  <h3>{layer.name}</h3>
                </div>
                <p>{layer.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="slide">
        <div className="slide-content split-layout split-layout-end">
          <div className="diff-grid reveal">
            <div className="diff-scanline" aria-hidden="true" />
            {differentiators.map((item, idx) => (
              <article key={item.title} className={`diff-card diff-card-${idx}`}>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </article>
            ))}
          </div>

          <div className="cta-panel reveal">
            <div className="eyebrow">Call To Action</div>
            <h2>先看导航，再看后台，最后看它怎么继续长成 AI 工作流入口层</h2>
            <p>
              现在这套产品已经具备基础导航、状态感知和管理能力。
              下一步真正有价值的，不是继续堆链接，而是把“入口、状态、Agent、任务”收进同一套体验里。
            </p>
            <div className="cta-tags">
              <span><Cpu size={14} /> System-aware</span>
              <span><ShieldCheck size={14} /> Controlled access</span>
              <span><Workflow size={14} /> Agent-ready</span>
            </div>
            <div className="hero-actions" data-no-flip="true">
              <Link href="/" className="hero-btn hero-btn-primary">
                打开导航页 <ArrowRight size={16} />
              </Link>
              <Link href="/status" className="hero-btn hero-btn-secondary">
                查看状态页
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
