import Head from "next/head";
import Link from "next/link";
import styles from "@/styles/Home.module.css";
import projectStyles from "@/styles/Projects.module.css";
import ContentBlock from "@/components/ContentBlock";
import { getAllProjects, getProjectBySlug } from "@/lib/contentful";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import Nav from "@/components/Nav";

export default function CaseStudy({ project }) {
  const pageUrl = `${SITE_URL}/portfolio/${project.slug}`;

  return (
    <>
      <Head>
        <title>{project.title}</title>
        {project.description && <meta name="description" content={project.description} />}

        <meta property="og:type" content="article" />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:title" content={project.title} />
        <meta property="og:url" content={pageUrl} />
        {project.description && <meta property="og:description" content={project.description} />}
        {project.ogImage && <meta property="og:image" content={project.ogImage} />}

        <meta name="twitter:card" content={project.ogImage ? "summary_large_image" : "summary"} />
        <meta name="twitter:title" content={project.title} />
        {project.description && <meta name="twitter:description" content={project.description} />}
        {project.ogImage && <meta name="twitter:image" content={project.ogImage} />}
      </Head>
      
     <div className={projectStyles.fixedNavMobile}>
       <Nav/>
     </div>

      <div className={projectStyles.container}>
        <aside className={projectStyles.controls}>
          <Link href="/?hideAbout=true" className={projectStyles.backLink}><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ verticalAlign: 'middle', marginRight: '4px' }}><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>Projects</Link>

          <hr className={projectStyles.asideDivider} />

          <div className={projectStyles.projectInfo}>
            <h1 className={projectStyles.projectTitle}>{project.title}</h1>
            <p className={projectStyles.projectYear}>{project.date}</p>

            <hr className={projectStyles.asideDivider} />

            {project.description && (
              <p className={projectStyles.projectDescription}>{project.description}</p>
            )}
          </div>
        </aside>

        <main className={projectStyles.caseStudy}>
          {project.contentBlocks.map((block) => (
            <ContentBlock key={block.id} block={block} />
          ))}
        </main>
      </div>
    </>
  );
}

export async function getStaticPaths() {
  const projects = await getAllProjects();
  
  const paths = projects.map((project) => ({
    params: { slug: project.slug }
  }));

  return { paths, fallback: false };
}

export async function getStaticProps({ params }) {
  const project = await getProjectBySlug(params.slug);
  
  return {
    props: { project }
  };
}