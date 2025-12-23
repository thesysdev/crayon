import { useThreadListActions, useThreadListState } from "@crayonai/react-core";
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
      className={clsx("crayon-bottom-tray-thread-item", {
        "crayon-bottom-tray-thread-item--selected": isSelected,
      })}
    >
      <button className="crayon-bottom-tray-thread-item-title" onClick={onSelect}>
        {title}
      </button>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="crayon-bottom-tray-thread-item-menu-trigger">
            <EllipsisVerticalIcon size={14} />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="crayon-bottom-tray-thread-item-menu"
            side="right"
            align="start"
            sideOffset={4}
          >
            <DropdownMenu.Item
              className="crayon-bottom-tray-thread-item-menu-action"
              onSelect={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2Icon size={14} className="crayon-bottom-tray-thread-item-menu-icon" />
              Delete
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
};

export const ThreadListContainer = () => {
  const { threads, selectedThreadId } = useThreadListState();
  const { load, selectThread, deleteThread } = useThreadListActions();

  useEffect(() => {
    load();
  }, []);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <IconButton
          icon={<MenuIcon size="1em" />}
          variant="tertiary"
          aria-label="Thread list"
          className="crayon-bottom-tray-thread-list-trigger"
        />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="crayon-bottom-tray-thread-list-dropdown"
          side="bottom"
          align="end"
          sideOffset={8}
        >
          <div className="crayon-bottom-tray-thread-list-header">All threads</div>
          <div className="crayon-bottom-tray-thread-list-items">
            {threads.map((thread) => (
              <ThreadItem
                key={thread.threadId}
                title={thread.title}
                isSelected={selectedThreadId === thread.threadId}
                onSelect={() => selectThread(thread.threadId)}
                onDelete={() => deleteThread(thread.threadId)}
              />
            ))}
            {threads.length === 0 && (
              <div className="crayon-bottom-tray-thread-list-empty">No threads yet</div>
            )}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
