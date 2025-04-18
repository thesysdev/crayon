import { Thread, useThreadListActions, useThreadListState } from "@crayonai/react-core";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import clsx from "clsx";
import { EllipsisVerticalIcon, Trash2Icon } from "lucide-react";
import { Fragment, useEffect } from "react";
import { useLayoutContext } from "../../context/LayoutContext";
import { useShellStore } from "./store";

export const ThreadButton = ({
  id,
  title,
  className,
}: {
  id: string;
  title: string;
  className?: string;
}) => {
  const { selectThread, deleteThread } = useThreadListActions();
  const { selectedThreadId } = useThreadListState();
  const { isSidebarOpen, setIsSidebarOpen } = useShellStore((state) => ({
    isSidebarOpen: state.isSidebarOpen,
    setIsSidebarOpen: state.setIsSidebarOpen,
  }));
  const { layout } = useLayoutContext();

  return (
    <div
      className={clsx(
        "crayon-shell-thread-button",
        {
          "crayon-shell-thread-button--selected": selectedThreadId === id,
        },
        className,
      )}
    >
      <button
        className="crayon-shell-thread-button-title"
        onClick={() => {
          if (layout === "mobile") {
            setIsSidebarOpen(!isSidebarOpen);
          }
          selectThread(id);
        }}
      >
        {title}
      </button>
      <DropdownMenu.Root modal>
        <DropdownMenu.Trigger asChild>
          <button className="crayon-shell-thread-button-dropdown-trigger">
            <EllipsisVerticalIcon size={14} />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content
          className="crayon-shell-thread-button-dropdown-menu"
          side="bottom"
          align="start"
          sideOffset={2}
        >
          <DropdownMenu.Item
            className="crayon-shell-thread-button-dropdown-menu-item"
            onSelect={() => {
              deleteThread(id);
            }}
          >
            <Trash2Icon size={14} className="crayon-shell-thread-button-dropdown-menu-item-icon" />
            Delete
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
  );
};

export const ThreadList = ({ className }: { className?: string }) => {
  let { threads } = useThreadListState();
  const { load } = useThreadListActions();

  useEffect(() => {
    load();
  }, []);

  const groupThreads = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 7);
    const last30Days = new Date(today);
    last30Days.setDate(last30Days.getDate() - 30);
    const thisYear = new Date(today);
    thisYear.setMonth(0, 1);

    return threads.reduce(
      (groups, thread) => {
        const threadDate = new Date(thread.createdAt);

        if (threadDate >= today) {
          groups.today = [...(groups.today || []), thread];
        } else if (threadDate >= yesterday) {
          groups.yesterday = [...(groups.yesterday || []), thread];
        } else if (threadDate >= last7Days) {
          groups.last7Days = [...(groups.last7Days || []), thread];
        } else if (threadDate >= last30Days) {
          groups.last30Days = [...(groups.last30Days || []), thread];
        } else if (threadDate >= thisYear) {
          groups.thisYear = [...(groups.thisYear || []), thread];
        } else {
          groups.older = [...(groups.older || []), thread];
        }

        return groups;
      },
      {
        today: [] as Thread[],
        yesterday: [] as Thread[],
        last7Days: [] as Thread[],
        last30Days: [] as Thread[],
        thisYear: [] as Thread[],
        older: [] as Thread[],
      },
    );
  };

  const groupedThreads = groupThreads();
  const groupLabels: { [key in keyof typeof groupedThreads]: string } = {
    today: "Today",
    yesterday: "Yesterday",
    last7Days: "Previous 7 Days",
    last30Days: "Previous 30 Days",
    thisYear: "This Year",
    older: "Older",
  };

  return (
    <div className={clsx("crayon-shell-thread-list", className)}>
      {Object.entries(groupedThreads)
        .filter(([_, groupThreads]) => groupThreads.length > 0)
        .map(([group, groupThreads]) => (
          <Fragment key={group}>
            <div className="crayon-shell-thread-list-group">
              {groupLabels[group as keyof typeof groupLabels]}
            </div>
            {groupThreads.map((thread) => (
              <ThreadButton key={thread.threadId} id={thread.threadId} title={thread.title} />
            ))}
          </Fragment>
        ))}
    </div>
  );
};
