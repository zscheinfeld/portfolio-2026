import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useRef } from "react";
import styles from "@/styles/Projects.module.css";

function VimeoEmbed({ vimeoId, href }) {
  const router = useRouter();
  // 'visible' → 'fading' → 'hidden'
  const [spinnerState, setSpinnerState] = useState('visible');

  const handleLoad = () => {
    // Wait one full spin cycle before fading so it never cuts off mid-rotation
    setTimeout(() => {
      setSpinnerState('fading');
      setTimeout(() => setSpinnerState('hidden'), 300);
    }, 500);
  };

  return (
    <div className={styles.expandedVideoWrapper}>
      {spinnerState !== 'hidden' && (
        <div className={`${styles.videoSpinner} ${spinnerState === 'fading' ? styles.videoSpinnerFading : ''}`} />
      )}
      <iframe
        src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1&loop=1&autopause=0&muted=1&background=1`}
        style={{ border: 0 }}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        onLoad={handleLoad}
      />
      <div className={styles.videoOverlay} onClick={() => router.push(href)} />
    </div>
  );
}

const MEDIA_BLOCK_TYPES = ['fullWidthImage', 'sideBySideImages', 'vimeoEmbed', 'youtubeEmbed', 'videoFile'];

// Flatten content blocks into individual renderable display items.
// sideBySideImages → two separate single-image items so each is full-width in the grid.
function preprocessBlocks(blocks) {
  const items = [];
  for (const block of blocks) {
    if (!MEDIA_BLOCK_TYPES.includes(block.blockType)) continue;
    if (block.hideFromGrid) continue;
    if (block.blockType === 'sideBySideImages') {
      if (block.imageLeftUrl)  items.push({ displayType: 'image', imageUrl: block.imageLeftUrl,  id: `${block.id}-left`  });
      if (block.imageRightUrl) items.push({ displayType: 'image', imageUrl: block.imageRightUrl, id: `${block.id}-right` });
    } else if (block.blockType === 'fullWidthImage') {
      items.push({ displayType: 'image', imageUrl: block.imageUrl, id: block.id });
    } else {
      items.push({ ...block, displayType: block.blockType });
    }
  }
  return items;
}

function ExpandedItem({ item, href }) {
  const router = useRouter();
  switch (item.displayType) {
    case 'image':
      return <img src={`https:${item.imageUrl}`} alt="" style={{ width: '100%', height: 'auto', display: 'block' }} />;

    case 'vimeoEmbed': {
      const vimeoId = item.vimeoUrl?.split('/').pop();
      return <VimeoEmbed vimeoId={vimeoId} href={href} />;
    }

    case 'youtubeEmbed': {
      let youtubeId = '';
      if (item.youtubeUrl) {
        const url = item.youtubeUrl;
        if (url.includes('youtu.be/'))  youtubeId = url.split('youtu.be/')[1].split('?')[0];
        else if (url.includes('watch?v=')) youtubeId = url.split('watch?v=')[1].split('&')[0];
        else if (url.includes('embed/'))   youtubeId = url.split('embed/')[1].split('?')[0];
      }
      return (
        <div className={styles.expandedVideoWrapper}>
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&loop=1&mute=1&playlist=${youtubeId}&controls=0&modestbranding=1&rel=0`}
            style={{ border: 0 }}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
          <div className={styles.videoOverlay} onClick={() => router.push(href)} />
        </div>
      );
    }

    case 'videoFile':
      return (
        <video
          src={`https:${item.videoUrl}`}
          autoPlay loop muted playsInline
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />
      );

    default:
      return null;
  }
}

export default function ProjectsGrid({ projects = [], filters, sortBy, viewMode, mode, isScrolling, transitioningForward }) {
  const router = useRouter();
  const [hoveredFilter, setHoveredFilter] = useState(null);
  const [hoveredProject, setHoveredProject] = useState(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Per-project carousel scroll refs for list view
  const carouselRefs = useRef({});
  // Track which carousels can scroll left/right
  const [carouselScroll, setCarouselScroll] = useState({});

  const updateCarouselScroll = (id, el) => {
    if (!el) return;
    const canLeft = el.scrollLeft > 1;
    const canRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
    setCarouselScroll(prev => {
      if (prev[id]?.canLeft === canLeft && prev[id]?.canRight === canRight) return prev;
      return { ...prev, [id]: { canLeft, canRight } };
    });
  };

  const carouselRefCallback = (el, id) => {
    const prev = carouselRefs.current[id];
    if (prev === el) return;
    if (prev) prev.removeEventListener('scroll', prev._scrollHandler);
    carouselRefs.current[id] = el;
    if (el) {
      const handler = () => updateCarouselScroll(id, el);
      el._scrollHandler = handler;
      el.addEventListener('scroll', handler, { passive: true });
      // Check on mount and after images load
      requestAnimationFrame(() => updateCarouselScroll(id, el));
      const observer = new ResizeObserver(() => updateCarouselScroll(id, el));
      observer.observe(el);
      el._resizeObserver = observer;
    }
    if (prev && prev._resizeObserver) prev._resizeObserver.disconnect();
  };

  // All per-project expand/collapse state lives here so multiple projects can be
  // expanded simultaneously. Structure per entry:
  //   { items: DisplayItem[], count: number, direction: 'loading'|'expanding'|'collapsing', timer: any }
  const projectsRef = useRef({});

  // Bumped to trigger re-renders after ref mutations.
  const [, setRenderTick] = useState(0);
  const bump = () => setRenderTick(t => t + 1);

  // ── Filter & sort ──────────────────────────────────────────────────────────
  const activeFilters = filters ? filters.split(',').map(f => f.toLowerCase()) : [];

  let filteredProjects = [...projects];
  if (activeFilters.length > 0) {
    filteredProjects = projects.filter(p => {
      if (Array.isArray(p.category)) {
        return activeFilters.some(filter => p.category.some(cat => cat.toLowerCase() === filter));
      } else if (typeof p.category === 'string') {
        return activeFilters.includes(p.category.toLowerCase());
      }
      return false;
    });
  }

  if (sortBy === 'alphabetical') {
    filteredProjects.sort((a, b) => a.title.localeCompare(b.title));
  } else {
    filteredProjects.sort((a, b) => b.date.localeCompare(a.date));
  }

  // ── Query helpers ──────────────────────────────────────────────────────────
  const updateQuery = (key, value) => {
    router.push({ pathname: '/', query: { ...router.query, [key]: value } }, undefined, { shallow: true });
  };

  const toggleFilter = (filterValue) => {
    const newFilters = activeFilters.includes(filterValue.toLowerCase())
      ? activeFilters.filter(f => f !== filterValue.toLowerCase())
      : [...activeFilters, filterValue.toLowerCase()];
    const filterString = newFilters.length > 0 ? newFilters.join(',') : null;
    if (filterString) {
      router.push(`/?filter=${filterString}&hideAbout=true`, undefined, { shallow: true });
    } else {
      router.push(`/?hideAbout=true`, undefined, { shallow: true });
    }
  };

  const isFilterActive = (filterValue) => activeFilters.includes(filterValue.toLowerCase());

  const projectMatchesHoveredFilter = (project) => {
    if (!hoveredFilter || hoveredFilter === 'all') return true;
    if (Array.isArray(project.category)) {
      return project.category.some(cat => cat.toLowerCase() === hoveredFilter.toLowerCase());
    } else if (typeof project.category === 'string') {
      return project.category.toLowerCase() === hoveredFilter.toLowerCase();
    }
    return false;
  };

  // ── List view expand / collapse ─────────────────────────────────────────────
  const handleListProjectClick = async (project) => {
    const { id, slug } = project;

    if (projectsRef.current[id]) {
      delete projectsRef.current[id];
      bump();
      return;
    }

    projectsRef.current[id] = { items: [], count: 0, direction: 'loading', timer: null };
    bump();

    try {
      const res = await fetch(`/api/project-content/${slug}`);
      const data = await res.json();

      if (projectsRef.current[id]?.direction !== 'loading') return;

      const displayItems = preprocessBlocks(data.contentBlocks || []);
      if (displayItems.length === 0) {
        delete projectsRef.current[id];
        bump();
        return;
      }

      projectsRef.current[id] = { items: displayItems, count: displayItems.length, direction: 'expanded', timer: null };
      bump();
    } catch (e) {
      console.error('Failed to load project content:', e);
      if (projectsRef.current[id]?.direction === 'loading') {
        delete projectsRef.current[id];
        bump();
      }
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={styles.container} style={isScrolling ? { pointerEvents: 'none' } : undefined}>
      {/* Aside */}
      <aside
        className={`${styles.controls} ${mobileMenuOpen ? styles.controlsOpen : ''} ${mode === 0 && !transitioningForward ? styles.controlsHidden : ''}`}
      >
        {/* Header row — always visible at bottom, slides up with drawer */}
        <button
          className={styles.drawerHandle}
          onClick={() => setMobileMenuOpen(o => !o)}
        >
          <span>Grid Settings</span>
          {mobileMenuOpen ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          )}
        </button>

        <div className={styles.controlGroup}>
          <h3 className={styles.categoryName}>View</h3>
          <button className={viewMode === 'grid' ? styles.active : ''} onClick={() => updateQuery('view', 'grid')}>Grid</button>
          <button className={!viewMode || viewMode === 'list' ? styles.active : ''} onClick={() => updateQuery('view', 'list')}>List</button>
        </div>

        <div className={styles.controlGroup}>
          <h3 className={styles.categoryName}>Sort</h3>
          <button className={!sortBy || sortBy === 'year' ? styles.active : ''} onClick={() => updateQuery('sort', 'year')}>Year</button>
          <button className={sortBy === 'alphabetical' ? styles.active : ''} onClick={() => updateQuery('sort', 'alphabetical')}>Alphabetical</button>
        </div>

        <div className={styles.controlGroup} onMouseLeave={() => setHoveredFilter(null)}>
          <h3 className={styles.categoryName}>Filter</h3>
          <button onClick={() => router.push('/?hideAbout=true', undefined, { shallow: true })} onMouseEnter={() => setHoveredFilter('all')} className={activeFilters.length === 0 ? styles.active : ''}>All</button>
          <button onClick={() => toggleFilter('web')}         onMouseEnter={() => setHoveredFilter('web')}         className={isFilterActive('web')         ? styles.active : ''}>Web</button>
          <button onClick={() => toggleFilter('product')}     onMouseEnter={() => setHoveredFilter('product')}     className={isFilterActive('product')     ? styles.active : ''}>Product</button>
          <button onClick={() => toggleFilter('interactive')} onMouseEnter={() => setHoveredFilter('interactive')} className={isFilterActive('interactive') ? styles.active : ''}>Interactive</button>
          <button onClick={() => toggleFilter('book')}        onMouseEnter={() => setHoveredFilter('book')}        className={isFilterActive('book')        ? styles.active : ''}>Book</button>
          <button onClick={() => toggleFilter('print')}       onMouseEnter={() => setHoveredFilter('print')}       className={isFilterActive('print')       ? styles.active : ''}>Print</button>
          <button onClick={() => toggleFilter('motion')}      onMouseEnter={() => setHoveredFilter('motion')}      className={isFilterActive('motion')      ? styles.active : ''}>Motion</button>
          <button onClick={() => toggleFilter('data')}        onMouseEnter={() => setHoveredFilter('data')}        className={isFilterActive('data')        ? styles.active : ''}>Data</button>
          <button onClick={() => toggleFilter('tool')}        onMouseEnter={() => setHoveredFilter('tool')}        className={isFilterActive('tool')        ? styles.active : ''}>Tool</button>
          <button onClick={() => toggleFilter('identity')}    onMouseEnter={() => setHoveredFilter('identity')}    className={isFilterActive('identity')    ? styles.active : ''}>Identity</button>
          <button onClick={() => toggleFilter('fabrication')} onMouseEnter={() => setHoveredFilter('fabrication')} className={isFilterActive('fabrication') ? styles.active : ''}>Fabrication</button>
          <button onClick={() => toggleFilter('ux')}          onMouseEnter={() => setHoveredFilter('ux')}          className={isFilterActive('ux')          ? styles.active : ''}>UX</button>
          <button onClick={() => toggleFilter('3d')}          onMouseEnter={() => setHoveredFilter('3d')}          className={isFilterActive('3d')          ? styles.active : ''}>3D</button>
          <button onClick={() => toggleFilter('interface')}   onMouseEnter={() => setHoveredFilter('interface')}   className={isFilterActive('interface')   ? styles.active : ''}>Interface</button>
        </div>
      </aside>

      <main className={`${styles.grid} ${mode === 0 ? styles.gridLocked : ''} ${styles[`zoom${zoomLevel}`]}`}>
        {viewMode !== 'grid' ? (
          <div className={styles.listView}>
            <div>
              <div className={styles.listHeader}>
                <div className={styles.listHeaderColumn}>Name</div>
                <div className={styles.listHeaderColumn}>Year</div>
                <div className={styles.listHeaderColumn}>Tags</div>
              </div>
              {filteredProjects.map((project) => {
                const pState = projectsRef.current[project.id];
                const isExpanded = !!pState && pState.count > 0;
                const isLoading = pState?.direction === 'loading';
                const visibleItems = isExpanded ? pState.items.slice(0, pState.count) : [];

                return (
                  <div key={project.id} style={{ opacity: projectMatchesHoveredFilter(project) ? 1 : 0.2 }}>
                    <div
                      className={`${styles.listRow} ${isExpanded ? styles.listRowExpanded : ''} ${project.contentBlockCount === 0 ? styles.listRowEmpty : ''}`}
                      onClick={() => project.contentBlockCount > 0 && handleListProjectClick(project)}
                      onMouseEnter={() => !isExpanded && project.contentBlockCount > 0 && setHoveredProject(project)}
                      onMouseLeave={() => setHoveredProject(null)}
                      {...(project.contentBlockCount === 0 ? {
                        onMouseMove: (e) => setCursorPos({ x: e.clientX, y: e.clientY }),
                      } : {})}
                    >
                      <div className={styles.listColumn}>{isExpanded && <span className={styles.listExpandedIndicator}>&ndash;</span>}{project.title}</div>
                      <div className={styles.listColumn}>{project.date}</div>
                      <div className={styles.listColumn}>
                        {Array.isArray(project.category) ? project.category.join(', ') : project.category}
                      </div>
                      {project.contentBlockCount === 0 && <div className={styles.listRowComingSoon} style={{ left: cursorPos.x, top: cursorPos.y }}>Coming Soon</div>}
                    </div>
                    {(isExpanded || isLoading) && (
                      <div className={styles.listAccordion}>
                        <div className={styles.listAccordionInner}>
                          <div
                            className={styles.carouselTrack}
                            ref={(el) => carouselRefCallback(el, project.id)}
                          >
                            {visibleItems.map((item, idx) => (
                              <div key={item.id || idx} className={styles.carouselSlide}>
                                <ExpandedItem item={item} href={`/portfolio/${project.slug}`} />
                              </div>
                            ))}
                          </div>
                          <div className={styles.carouselControls}>
                            <div className={styles.carouselArrows}>
                              <button
                                className={`${styles.carouselArrow} ${!carouselScroll[project.id]?.canLeft ? styles.carouselArrowDisabled : ''}`}
                                onClick={() => {
                                  const el = carouselRefs.current[project.id];
                                  if (el && carouselScroll[project.id]?.canLeft) el.scrollBy({ left: -220, behavior: 'smooth' });
                                }}
                                disabled={!carouselScroll[project.id]?.canLeft}
                                aria-label="Previous"
                              >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
                              </button>
                              <button
                                className={`${styles.carouselArrow} ${!carouselScroll[project.id]?.canRight ? styles.carouselArrowDisabled : ''}`}
                                onClick={() => {
                                  const el = carouselRefs.current[project.id];
                                  if (el && carouselScroll[project.id]?.canRight) el.scrollBy({ left: 220, behavior: 'smooth' });
                                }}
                                disabled={!carouselScroll[project.id]?.canRight}
                                aria-label="Next"
                              >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/></svg>
                              </button>
                            </div>
                            <Link
                              href={`/portfolio/${project.slug}`}
                              className={styles.caseStudyButton}
                            >
                              View Work <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ verticalAlign: 'middle', marginLeft: '4px' }}><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div>
              {hoveredProject && (
                <div className={styles.thumbnailPreview}>
                  <img src={`https:${hoveredProject.image}`} alt={hoveredProject.title} />
                </div>
              )}
            </div>
          </div>
        ) : (
          filteredProjects.map((project) => {
            const isEmpty = project.contentBlockCount === 0;
            const Wrapper = isEmpty ? 'div' : Link;
            const wrapperProps = isEmpty
              ? {}
              : { href: `/portfolio/${project.slug}` };

            return (
              <Wrapper
                key={project.id}
                {...wrapperProps}
                className={`${styles.projectCard} ${isEmpty ? styles.projectCardEmpty : ''}`}
                style={{
                  opacity: projectMatchesHoveredFilter(project) ? 1 : 0.2,
                }}
                {...(isEmpty ? {
                  onMouseMove: (e) => setCursorPos({ x: e.clientX, y: e.clientY }),
                } : {})}
              >
                <div className={styles.projectTitleOuter}>
                  <h3 className={styles.projectTitle}>{project.title}</h3>
                  <p className={styles.projectDate}>{project.date}</p>
                </div>
                <img
                  src={`https:${project.image}`}
                  alt={project.title}
                />
                {isEmpty && <div className={styles.comingSoonTooltip} style={{ left: cursorPos.x, top: cursorPos.y }}>Coming Soon</div>}
              </Wrapper>
            );
          })
        )}
      </main>

      {viewMode === 'grid' && (mode === 1 || isScrolling) && (
        <div className={styles.zoomControls}>
          <button className={styles.zoomButton} onClick={() => setZoomLevel(Math.min(2, zoomLevel + 1))} disabled={zoomLevel === 2}>−</button>
          <button className={styles.zoomButton} onClick={() => setZoomLevel(Math.max(0, zoomLevel - 1))} disabled={zoomLevel === 0}>+</button>
        </div>
      )}
    </div>
  );
}
