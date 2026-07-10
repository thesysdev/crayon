import { useThreadList } from "@openuidev/react-headless";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import clsx from "clsx";
import { EllipsisIcon, Trash2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { useLayoutContext } from "../../context/LayoutContext";
import { Button } from "../Button";
import { IconButton } from "../IconButton";
import { useOptionalNav } from "./_shared/navContext";
import { useAgentInterfaceStore } from "./_shared/store";

export const ThreadButton = ({
  id,
  title,
  className,
}: {
  id: string;
  title: string;
  className?: string;
}) => {
  const selectThread = useThreadList((s) => s.selectThread);
  const deleteThread = useThreadList((s) => s.deleteThread);
  const selectedThreadId = useThreadList((s) => s.selectedThreadId);
  const { isSidebarOpen, setIsSidebarOpen } = useAgentInterfaceStore((state) => ({
    isSidebarOpen: state.isSidebarOpen,
    setIsSidebarOpen: state.setIsSidebarOpen,
  }));
  const { layout } = useLayoutContext();
  const nav = useOptionalNav();
  const [isActionsOpen, setIsActionsOpen] = useState(false);

  return (
    <div
      className={clsx(
        "openui-agent-thread-button",
        {
          "openui-agent-thread-button--selected": selectedThreadId === id,
          "openui-agent-thread-button--actions-open": isActionsOpen,
        },
        className,
      )}
    >
      <button
        className="openui-agent-thread-button-title"
        onClick={() => {
          if (layout === "mobile") {
            setIsSidebarOpen(!isSidebarOpen);
          }
          selectThread(id);
          // Auto-clear any active route so the thread view surfaces.
          if (nav && nav.path !== undefined) {
            nav.navigate(undefined);
          }
        }}
      >
        {title}
      </button>
      <DropdownMenu.Root open={isActionsOpen} onOpenChange={setIsActionsOpen}>
        <DropdownMenu.Trigger asChild>
          <IconButton
            className="openui-agent-thread-button-dropdown-trigger"
            icon={<EllipsisIcon size="1em" />}
            size="2-extra-small"
            variant="tertiary"
            aria-label="Thread actions"
          />
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="openui-agent-thread-button-dropdown-menu"
            side="bottom"
            align="start"
            sideOffset={4}
          >
            <DropdownMenu.Item
              asChild
              onSelect={() => {
                deleteThread(id);
              }}
            >
              <Button
                buttonType="destructive"
                className="openui-agent-thread-button-dropdown-menu-item"
                iconLeft={<Trash2Icon size="1em" />}
                size="extra-small"
                variant="tertiary"
              >
                Delete
              </Button>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
};

export const ThreadList = ({ className }: { className?: string }) => {
  const threads = useThreadList((s) => s.threads);
  const loadThreads = useThreadList((s) => s.loadThreads);

  useEffect(() => {
    loadThreads();
  }, []);

  return (
    <div className={clsx("openui-agent-thread-list", className)}>
      {threads.length > 0 && <div className="openui-agent-thread-list-group">Threads</div>}
      {threads.map((thread) => (
        <ThreadButton key={thread.id} id={thread.id} title={thread.title} />
      ))}
    </div>
  );
};
