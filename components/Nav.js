import Link from "next/link";
import { useRouter } from "next/router";
import styles from "@/styles/Nav.module.css";

export default function Nav({ onLogoClick, mode }) {
  const router = useRouter();
  const isHomePage = router.pathname === '/';

  const handleLogoClick = (e) => {
    if (isHomePage && onLogoClick) {
      e.preventDefault();
      onLogoClick();
    }
    // Otherwise let Next.js Link handle navigation normally (coming from other pages)
  };

  const handleNavClick = (page) => {
    console.log('=== NAV LINK CLICKED ===');
    console.log('Current mode:', mode);
    console.log('Navigating to:', page);
  };

  return (
    <nav className={styles.nav}>
      <Link href="/" onClick={handleLogoClick} scroll={true}>
        Zach Scheinfeld
      </Link>
      <div className={styles.navRight}>
        <Link href="/cv" onClick={() => handleNavClick('/cv')}>CV</Link>
        <Link href="/?hideAbout=true" onClick={() => handleNavClick('/portfolio')}>Projects</Link>
      </div>
    </nav>
  );
}