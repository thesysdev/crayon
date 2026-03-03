import clsx from "clsx";

export const MessageLoading = ({ className }: { className?: string }) => {
  return (
    <div className={clsx("openui-message-loading-container", className)}>
      <div className="openui-message-loading" />
    </div>
  );
};
