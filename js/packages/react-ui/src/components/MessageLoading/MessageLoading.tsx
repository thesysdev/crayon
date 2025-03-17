import clsx from "clsx";

export const MessageLoading = ({ className }: { className?: string }) => {
  return (
    <div className={clsx("crayon-message-loading-container", className)}>
      <div className="crayon-message-loading" />
    </div>
  );
};
