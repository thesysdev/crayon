import { useState } from "react";
import { Plus } from "lucide-react";
import styles from "./FeatureAccordion.module.css";

const AccordionItem = ({ title, content, isVideo, isLast }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className={styles.accordionItem}>
        <button
          className={styles.accordionButton}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span>{title}</span>
          <Plus
            className={`${styles.icon} ${isOpen ? styles.iconOpen : ""}`}
            size={20}
          />
        </button>
        <div
          className={`${styles.accordionContent} ${isOpen ? styles.open : ""}`}
        >
          {isVideo ? (
            <div className={styles.videoWrapper}>
              <iframe
                width="100%"
                height="315"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          ) : (
            <div className={styles.carouselWrapper}>
              <div className={styles.carousel}>
                {content.map((item, index) => (
                  <div key={index} className={styles.carouselItem}>
                    <img src={item.image} alt={item.title} />
                    <h4>{item.title}</h4>
                    <p>{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {!isLast && <div className={styles.separator} />}
    </>
  );
};

export default function FeatureAccordion() {
  const features = [
    {
      title: "Beautiful Components",
      content: [
        {
          image: "/feature1.png",
          title: "Modern Design",
          description:
            "Clean and modern components that look great out of the box",
        },
        {
          image: "/feature2.png",
          title: "Customizable",
          description: "Easily customize every aspect of the components",
        },
        {
          image: "/feature3.png",
          title: "Responsive",
          description: "Works perfectly on all screen sizes",
        },
      ],
    },
    {
      title: "Watch How It Works",
      isVideo: true,
    },
    {
      title: "Advanced Features",
      content: [
        {
          image: "/feature4.png",
          title: "AI Integration",
          description: "Seamlessly integrate with AI models",
        },
        {
          image: "/feature5.png",
          title: "Real-time Updates",
          description: "Live updates and real-time data handling",
        },
      ],
    },
  ];

  return (
    <div className={styles.featureSection}>
      <h2 className={styles.featureTitle}>Powerful Features</h2>
      <div className={styles.accordionList}>
        {features.map((feature, index) => (
          <AccordionItem
            key={index}
            title={feature.title}
            content={feature.content}
            isVideo={feature.isVideo}
            isLast={index === features.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
