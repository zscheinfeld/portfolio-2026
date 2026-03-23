import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import Nav from "@/components/Nav";
import { useRouter } from "next/router";
import styles from "@/styles/Home.module.css";
import ProjectsGrid from "@/components/ProjectsGrid";
import { getAllProjects } from "@/lib/contentful";

function getNavHeight() {
  return window.innerWidth <= 768 ? 50 : 60;
}

export default function Home({ projects }) {
  const router = useRouter();
  const { filter, sort, view, hideAbout } = router.query;
  
  const [mode, setMode] = useState(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('hideAbout=true')) return 1;
    return 0;
  });
  const [isScrolling, setIsScrolling] = useState(false);
  const [fired, setFired] = useState(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('hideAbout=true')) return true;
    return false;
  });
  const scrollPositionRef = useRef(0);
  const scrollSpaceRef = useRef(null);
  
  // Create refs to track current values for the observer
  const modeRef = useRef(mode);
  const isScrollingRef = useRef(isScrolling);
  const firedRef = useRef(fired);
  
  // Keep refs in sync with state
  useEffect(() => {
    modeRef.current = mode;
    isScrollingRef.current = isScrolling;
    firedRef.current = fired;
  }, [mode, isScrolling, fired]);

  // Lock body scroll during transition to prevent double scroll
  useEffect(() => {
    if (isScrolling) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isScrolling]);

  // Reset state whenever hideAbout changes
  useEffect(() => {
    console.log('=== ROUTE CHANGED EFFECT ===');
    console.log('hideAbout:', hideAbout);
    
    // Only reset if hideAbout value actually changed, not on every route change
    if (hideAbout === 'true') {
      console.log('>>> Ensuring mode is 1 (hiding about)');
      
      // Only update if mode isn't already 1
      if (modeRef.current !== 1) {
        const scrollToHeight = scrollSpaceRef.current
          ? scrollSpaceRef.current.offsetTop + scrollSpaceRef.current.offsetHeight
          : window.innerHeight - getNavHeight();

        requestAnimationFrame(() => {
          scrollPositionRef.current = scrollToHeight;
          window.scrollTo({ top: scrollToHeight, behavior: 'auto' });
          
          requestAnimationFrame(() => {
            setMode(1);
            setFired(true);
          });
        });
      }
    } else if (hideAbout === undefined) {
      console.log('>>> Ensuring mode is 0 (showing about)');
      
      // Only update if mode isn't already 0
      if (modeRef.current !== 0) {
        requestAnimationFrame(() => {
          scrollPositionRef.current = 0;
          window.scrollTo({ top: 0, behavior: 'auto' });
          
          requestAnimationFrame(() => {
            setMode(0);
            setFired(false);
          });
        });
      }
    }
  }, [hideAbout]); // Watch hideAbout specifically, not router.asPath

  useEffect(() => {
    const getScrollToHeight = () => {
      if (scrollSpaceRef.current) {
        return scrollSpaceRef.current.offsetTop + scrollSpaceRef.current.offsetHeight;
      }
      return window.innerHeight - getNavHeight();
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Use refs instead of state values

          if (entry.intersectionRatio < 0.3 && modeRef.current === 0 && !isScrollingRef.current && !firedRef.current) {
            const scrollToHeight = getScrollToHeight();
            setFired(true);
            setIsScrolling(true);

            console.log('[TRANSITION] Start smooth scroll', {
              scrollToHeight,
              windowScrollY: window.scrollY,
              innerHeight: window.innerHeight,
              documentHeight: document.documentElement.scrollHeight,
              scrollSpaceHeight: scrollSpaceRef.current?.offsetHeight,
              scrollSpaceOffsetTop: scrollSpaceRef.current?.offsetTop,
              navHeight: getNavHeight(),
            });

            window.scrollTo({ top: scrollToHeight, behavior: 'smooth' });

            setTimeout(() => {
              console.log('[TRANSITION] 700ms timeout fired', {
                windowScrollY: window.scrollY,
                documentHeight: document.documentElement.scrollHeight,
              });
              scrollPositionRef.current = scrollToHeight;
              setMode(1);
              console.log('[TRANSITION] setMode(1) called');
              requestAnimationFrame(() => {
                console.log('[TRANSITION] rAF after setMode', {
                  windowScrollY: window.scrollY,
                  documentHeight: document.documentElement.scrollHeight,
                  scrollSpaceDisplay: scrollSpaceRef.current ? getComputedStyle(scrollSpaceRef.current).height : 'n/a',
                  aboutDisplay: document.querySelector('[class*="about_container"]')?.className,
                });
                window.scrollTo({ top: 0, behavior: 'auto' });
                setIsScrolling(false);
                requestAnimationFrame(() => {
                  console.log('[TRANSITION] rAF after scrollTo(0)', {
                    windowScrollY: window.scrollY,
                    documentHeight: document.documentElement.scrollHeight,
                  });
                });
              });
            }, 700);
          }
        });
      },
      {
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
      }
    );

    if (scrollSpaceRef.current) {
      observer.observe(scrollSpaceRef.current);
    }

    return () => {
      if (scrollSpaceRef.current) {
        observer.unobserve(scrollSpaceRef.current);
      }
    };
  }, []); // Empty dependency array - only create observer once

  const handleLogoClick = () => {

    if (mode === 1) {
      setIsScrolling(true);

      requestAnimationFrame(() => {
        setMode(0);

        requestAnimationFrame(() => {
          window.scrollTo({ top: scrollPositionRef.current, behavior: 'auto' });

          requestAnimationFrame(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          });
        });
      });

      setTimeout(() => {
        setIsScrolling(false);
        setFired(false);
      }, 1100);
    } else if (mode === 0) {
      const scrollToHeight = scrollSpaceRef.current
        ? scrollSpaceRef.current.offsetTop + scrollSpaceRef.current.offsetHeight
        : window.innerHeight - getNavHeight();
      setFired(true);
      setIsScrolling(true);
      window.scrollTo({ top: scrollToHeight, behavior: 'smooth' });
      setTimeout(() => {
        scrollPositionRef.current = scrollToHeight;
        setMode(1);
        requestAnimationFrame(() => {
          window.scrollTo({ top: 0, behavior: 'auto' });
          setIsScrolling(false);
        });
      }, 700);
    }
  };

  return (
    <>
      <Head>
        <title>Zach Scheinfeld</title>
        <meta name="description" content="Multidisciplinary designer, artist, and creative programmer" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
  
      <div className={`${styles.about_container} ${mode === 1 ? styles.hidden : ''}`}>
        <div className={styles.about_text}>
          Zach Scheinfeld is a multidisciplinary designer, artist, and creative programmer from New Rochelle, NY. He's interested in pushing the boundaries of digital experiences and using the browser as a generative tool to build a more creative, fun, and thoughtful internet. In 2016, Zach earned his BA in Studio Art and Mathematics from Wesleyan University, and in 2023, graduated with an MFA in Graphic Design from RISD.
          <br></br>
          <br></br>
          Zach is currently working as a designer at Pentagram for team Giorgia Lupi in New York City and teaching Interaction Design at Parsons. He's also worked with agencies like Studio Rodrigo, Prophet, and Work & Co. You can reach him at zscheinf@gmail.com.
        </div>
      </div>
      <div 
        ref={scrollSpaceRef}
        className={`${styles.scroll_Space} ${mode === 1 ? styles.hidden : ''}`}
      >
      </div>
      
      <Nav onLogoClick={handleLogoClick} mode={mode} />
      <ProjectsGrid
        projects={projects}
        filters={filter}
        sortBy={sort}
        viewMode={view}
        mode={mode}
        isScrolling={isScrolling}
        transitioningForward={isScrolling && fired}
      />
    </>
  );
}

export async function getStaticProps() {
  const projects = await getAllProjects();
  
  return {
    props: { projects },
    revalidate: 60,
  };
}