import { useState } from "react";
import { Plus } from "lucide-react";
import styles from "./FAQ.module.css";

const FAQItem = ({ question, answer, isLast }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className={styles.faqItem}>
        <button
          className={styles.faqQuestion}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span>{question}</span>
          <Plus
            className={`${styles.icon} ${isOpen ? styles.iconOpen : ""}`}
            size={20}
          />
        </button>
        <div className={`${styles.faqAnswer} ${isOpen ? styles.open : ""}`}>
          <div className={styles.faqAnswerContent}>{answer}</div>
        </div>
      </div>
      {!isLast && <div className={styles.separator} />}
    </>
  );
};

export default function FAQ() {
  const faqs = [
    {
      question: "What is Crayon?",
      answer:
        "Crayon is a Generative UI Toolkit designed specifically for building AI agents. It provides a comprehensive set of components and tools to create sophisticated, responsive agent interfaces.",
    },
    {
      question: "What can I use it for?",
      answer:
        "Crayon can be used to build AI agents, chatbots, copilots or pretty much anything else.",
    },
    {
      question: "How do I get started?",
      answer:
        <>Getting started with Crayon is simple. <br/>
        Check out the <a style={{cursor: "pointer"}} href="/docs/quickstart/nextjs">Getting Started Guide</a>
        {" "}to get started with building a NextJS app using Crayon.</>,
    },
    {
      question: "Is Crayon free to use?",
      answer:
        "Yes, Crayon is MIT licensed and free to use for both personal and commercial projects. We believe in making AI development accessible to everyone.",
    },
    {
      question: "Can I customize the components?",
      answer:
        <>
        Absolutely! All Crayon components are highly customizable. You can modify styles, behaviors, and functionality to match your specific needs and brand requirements. <br />
        See <a style={{cursor: "pointer"}} href="/docs/guides/ui-customization">Customization Guide</a> for more details.</>,
    },
  ];

  return (
    <div className={styles.faqSection}>
      <h2 className={styles.faqTitle}>Frequently Asked Questions</h2>
      <div className={styles.faqList}>
        {faqs.map((faq, index) => (
          <FAQItem
            key={index}
            question={faq.question}
            answer={faq.answer}
            isLast={index === faqs.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
