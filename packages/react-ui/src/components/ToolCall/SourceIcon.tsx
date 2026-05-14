import { Globe } from "lucide-react";
import { useState } from "react";

export const SourceIcon = ({ src }: { src?: string }) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <Globe size={16} className="openui-tool-call__icon" />;
  }

  return (
    <img
      src={src}
      alt=""
      className="openui-tool-call__source-logo"
      onLoad={(e) => {
        const img = e.currentTarget;
        // Google's default favicon is 16x16 — treat as missing
        if (img.naturalWidth <= 16 && img.naturalHeight <= 16) {
          setFailed(true);
        }
      }}
      onError={() => setFailed(true)}
    />
  );
};
