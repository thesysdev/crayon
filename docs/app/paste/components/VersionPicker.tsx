"use client";

import {
  Button,
  Label,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@openuidev/react-ui";
import type { VersionListState } from "@paste/hooks/useVersionList";
import styles from "@paste/paste.module.css";

export function VersionPicker({
  value,
  onChange,
  versions,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  versions: VersionListState;
  disabled?: boolean;
}) {
  const { list, loading, error, retry } = versions;
  return (
    <div className={styles.toolbarField}>
      <Label className={styles.toolbarLabel}>lang-core</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled || loading} size="sm">
        <SelectTrigger size="sm" aria-label="lang-core version">
          <SelectValue placeholder="version" />
        </SelectTrigger>
        <SelectContent>
          {list.groups.map((g) => (
            <SelectGroup key={g.label}>
              <SelectLabel>v{g.label}</SelectLabel>
              {g.versions.map((v) => (
                <SelectItem key={v} value={v}>
                  {v}
                  {v === list.latest ? " (latest)" : ""}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <Button variant="tertiary" size="extra-small" onClick={retry} title={error}>
          versions unavailable — retry
        </Button>
      )}
    </div>
  );
}
