import styles from "./SecondaryButton.module.css";

export default function SecondaryButton({ children, onClick }) {
  return (
    <button className={styles.secondaryButton} onClick={onClick}>
      {children}
    </button>
  );
}
