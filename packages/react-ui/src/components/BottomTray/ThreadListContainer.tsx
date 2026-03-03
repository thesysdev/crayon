import { useThreadList } from "@openuidev/react-headless";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import clsx from "clsx";
import { EllipsisVerticalIcon, MenuIcon, Trash2Icon } from "lucide-react";
import { useEffect } from "react";
import { IconButton } from "../IconButton";

const ThreadItem = ({
  title,
  isSelected,
  onSelect,
  onDelete,
}: {
  title: string;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) => {
  return (
    <div
      className={clsx("openui-bottom-tray-thread-item", {
        "openui-bottom-tray-thread-item--selected": isSelected,
      })}
    >
      <button className="openui-bottom-tray-thread-item-title" onClick={onSelect}>
        {title}
      </button>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="openui-bottom-tray-thread-item-menu-trigger">
            <EllipsisVerticalIcon size={14} />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="openui-bottom-tray-thread-item-menu"
            side="right"
            align="start"
            sideOffset={4}
          >
            <DropdownMenu.Item
              className="openui-bottom-tray-thread-item-menu-action"
              onSelect={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2Icon size={14} className="openui-bottom-tray-thread-item-menu-icon" />
              Delete
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
};

export const ThreadListContainer = () => {
  const threads = useThreadList((s) => s.threads);
  const selectedThreadId = useThreadList((s) => s.selectedThreadId);
  const loadThreads = useThreadList((s) => s.loadThreads);
  const selectThread = useThreadList((s) => s.selectThread);
  const deleteThread = useThreadList((s) => s.deleteThread);

  useEffect(() => {
    loadThreads();
  }, []);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <IconButton
          icon={<MenuIcon size="1em" />}
          variant="tertiary"
          aria-label="Thread list"
          className="openui-bottom-tray-thread-list-trigger"
        />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="openui-bottom-tray-thread-list-dropdown"
          side="bottom"
          align="end"
          sideOffset={8}
        >
          <div className="openui-bottom-tray-thread-list-header">All threads</div>
          <div className="openui-bottom-tray-thread-list-items">
            {threads.map((thread) => (
              <ThreadItem
                key={thread.id}
                title={thread.title}
                isSelected={selectedThreadId === thread.id}
                onSelect={() => selectThread(thread.id)}
                onDelete={() => deleteThread(thread.id)}
              />
            ))}
            {threads.length === 0 && (
              <div className="openui-bottom-tray-thread-list-empty">No threads yet</div>
            )}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
