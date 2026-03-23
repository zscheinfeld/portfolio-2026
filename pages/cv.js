import Head from "next/head";
import styles from "@/styles/CV.module.css";
import { getCVItems } from "@/lib/contentful";
import Nav from "@/components/Nav";

export default function CV({ cvItems }) {
  // Group items by category
  const groupedItems = cvItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <>
      <Head>
        <title>CV - Zach Scheinfeld</title>
      </Head>
      
      <div className={styles.fixedNav}>
        <Nav />
      </div>

      <div className={styles.container}>
        {Object.entries(groupedItems).map(([category, items], groupIndex) => (
          <div key={category}>
            {groupIndex > 0 && <hr className={styles.sectionDivider} />}
            {category.toLowerCase().includes('client') ? (
              <div className={styles.compactSection}>
                <div className={styles.categoryName}>{category.split(' \\n ').map((line, i, arr) => <span key={i}>{line}{i < arr.length - 1 && <br />}</span>)}</div>
                <div />
                <div className={styles.compactList}>
                  {items.map((item) => (
                    <div key={item.id} className={styles.compactItem}>
                      <div className={styles.itemDetails}>
                        {item.organization && <div className={styles.organization}>{item.organization.split(' \\n ').map((line, i, arr) => <span key={i}>{line}{i < arr.length - 1 && <br />}</span>)}</div>}
                        <div className={styles.itemTitle}>{item.title.split(' \\n ').map((line, i, arr) => <span key={i}>{line}{i < arr.length - 1 && <br />}</span>)}</div>
                        {item.description && <div className={styles.itemDescription}>{item.description}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              items.map((item, index) => (
                <div key={item.id} className={styles.item}>
                  {index === 0 && <div className={styles.categoryName}>{category.split(' \\n ').map((line, i, arr) => <span key={i}>{line}{i < arr.length - 1 && <br />}</span>)}</div>}
                  {index !== 0 && <div className={styles.categoryName}></div>}
                  <div className={styles.yearRange}>{item.yearRange}</div>
                  <div className={styles.itemDetails}>
                    {item.organization && <div className={styles.organization}>{item.organization.split(' \\n ').map((line, i, arr) => <span key={i}>{line}{i < arr.length - 1 && <br />}</span>)}</div>}
                    <div className={styles.itemTitle}>{item.title.split(' \\n ').map((line, i, arr) => <span key={i}>{line}{i < arr.length - 1 && <br />}</span>)}</div>
                    {item.description && <div className={styles.itemDescription}>{item.description}</div>}
                    <div className={styles.yearMobile}>{item.yearRange}</div>
                  </div>
                  <div className={styles.emptyColumn}></div>
                </div>
              ))
            )}
          </div>
        ))}
      </div>
    </>
  );
}

export async function getStaticProps() {
  const cvItems = await getCVItems();
  
  return {
    props: { cvItems },
    revalidate: 60,
  };
}