// import Link from '@docusaurus/Link';
// import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
// import HomepageFeatures from '@site/src/components/HomepageFeatures';
// import Heading from '@theme/Heading';
// import Layout from '@theme/Layout';
// import clsx from 'clsx';

import "./globals.css"

import FAQ from "@site/src/sections/FAQ";
import Features from "../sections/Features";
import Footer from "@site/src/sections/Footer";
import Hero from "../sections/Hero";

import styles from './index.module.css';
import Navbar from "../components/Navbar";

// function HomepageHeader() {
//   const {siteConfig} = useDocusaurusContext();
//   return (
//     <header className={clsx("hero hero--primary", styles.heroBanner)}>
//       <div className="container">
//         <Heading as="h1" className="hero__title">
//           {siteConfig.title}
//         </Heading>
//         <p className="hero__subtitle">{siteConfig.tagline}</p>
//         <div className={styles.buttons}>
//           <Link className="button button--secondary button--lg" to="/docs">
//             Docusaurus Tutorial - 5min ⏱️
//           </Link>
//         </div>
//       </div>
//     </header>
//   );
// }

// export default function Home() {
//   const { siteConfig } = useDocusaurusContext();
//   return (
//     <Layout
//       title={`${siteConfig.title}`}
//       description="Generative UI SDK by thesys"
//     >
//       <HomepageHeader />
//       <main>
//         <HomepageFeatures />
//       </main>
//     </Layout>
//   );
// }

export default function Home() {
  return (
    <div className={styles.bodyWrapper}>
      <Navbar/>
      <div className={styles.pageContainer}>
      <Hero />
      <Features />
      <FAQ />
      <Footer /> 
        
      {/* 
      */}
      </div>
    </div>
  );
}
