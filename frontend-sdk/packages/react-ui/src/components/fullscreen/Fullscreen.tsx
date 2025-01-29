import {
  Message,
  Thread,
  useThreadActions,
  useThreadListActions,
  useThreadListState,
  useThreadManagerSelector,
  useThreadState,
} from "@crayonai/react-core";
import clsx from "clsx";
import { PanelLeft, PanelRight, Plus, Search, SendHorizontal } from "lucide-react";
import { createContext, Fragment, useContext, useEffect, useRef, useState } from "react";
import { useComposerState } from "../../hooks/useComposerState";
import { useScrollToBottom } from "../../hooks/useScrollToBottom";

export const Container = ({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) => {
  return <div className={clsx("cui-fullscreen-container", className)}>{children}</div>;
};

type SidebarContextType = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  searchText: string;
  setSearchText: (searchText: string) => void;
};

export const SidebarContext = createContext<SidebarContextType>({
  isOpen: true,
  setIsOpen: () => {},
  searchText: "",
  setSearchText: () => {},
});

export const useSidebarContext = () => useContext(SidebarContext);

export const SidebarContainer = ({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) => {
  const [isOpen, setIsOpen] = useState(true);
  const [searchText, setSearchText] = useState("");

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen, searchText, setSearchText }}>
      <div
        className={clsx(
          "cui-fullscreen-sidebar",
          {
            "cui-fullscreen-sidebar-closed": !isOpen,
          },
          className,
        )}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
};

export const SidebarHeader = ({
  logoUrl,
  title,
  className,
}: {
  logoUrl: string;
  title: string;
  className?: string;
}) => {
  const { isOpen, setIsOpen } = useContext(SidebarContext);

  return (
    <div className={clsx("cui-fullscreen-sidebar-header", className)}>
      <div className="cui-fullscreen-sidebar-header-title-icon">
        <img src={logoUrl} alt="Logo" className="cui-fullscreen-sidebar-logo" />
        <h1 className="cui-fullscreen-sidebar-title">{title}</h1>
      </div>
      <button className="cui-fullscreen-sidebar-header-button" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <PanelRight size={16} /> : <PanelLeft size={16} />}
      </button>
    </div>
  );
};

export const SearchInput = ({ className }: { className?: string }) => {
  const { searchText, setSearchText } = useContext(SidebarContext);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={clsx("cui-fullscreen-search-input", className)}
      onClick={() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }}
    >
      <Search size={16} />
      <input
        ref={inputRef}
        type="text"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        className="cui-fullscreen-search-input-input"
        placeholder="Search..."
      />
    </div>
  );
};

export const NewChatButton = ({ className }: { className?: string }) => {
  const { switchToNewThread } = useThreadListActions();

  return (
    <button
      onClick={switchToNewThread}
      className={clsx("cui-fullscreen-new-chat-button", className)}
    >
      <Plus />
      New Chat
    </button>
  );
};

export const ThreadButton = ({
  id,
  title,
  className,
}: {
  id: string;
  title: string;
  className?: string;
}) => {
  const { selectThread } = useThreadListActions();
  const { selectedThreadId } = useThreadListState();

  return (
    <button
      onClick={() => selectThread(id)}
      className={clsx(
        "cui-fullscreen-thread-button",
        {
          "cui-fullscreen-thread-button-selected": selectedThreadId === id,
        },
        className,
      )}
    >
      {title}
    </button>
  );
};

export const ThreadList = ({ className }: { className?: string }) => {
  let { threads } = useThreadListState();
  const { load } = useThreadListActions();
  const { searchText } = useContext(SidebarContext);

  useEffect(() => {
    load();
  }, []);

  threads = threads.filter((thread) => thread.title.includes(searchText));

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
    <div className={clsx("cui-fullscreen-thread-list", className)}>
      {Object.entries(groupedThreads)
        .filter(([_, groupThreads]) => groupThreads.length > 0)
        .map(([group, groupThreads]) => (
          <Fragment key={group}>
            <div className="cui-fullscreen-thread-list-group">
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

export const ThreadContainer = ({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) => {
  return <div className={clsx("cui-fullscreen-thread-container", className)}>{children}</div>;
};

export const ScrollArea = ({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) => {
  const ref = useRef<HTMLDivElement>(null);
  const { messages } = useThreadState();
  useScrollToBottom(ref, messages.length);

  return (
    <div ref={ref} className={clsx("cui-fullscreen-scroll-area", className)}>
      {children}
    </div>
  );
};

const FallbackTemplate = () => {
  return <div>Unable to render the response</div>;
};

export const RenderMessage = ({ message, className }: { message: Message; className?: string }) => {
  const responseTemplates = useThreadManagerSelector((store) => store.responseTemplates);

  if (message.role === "assistant" && message.responseTemplate) {
    const Fallback = responseTemplates["fallback"]?.Component || FallbackTemplate;

    const Template = responseTemplates[message.responseTemplate.name];

    return (
      <div className="cui-fullscreen-message cui-fullscreen-message-assistant">
        {Template ? (
          <Template.Component {...message.responseTemplate.templateProps} />
        ) : (
          <Fallback {...message.responseTemplate.templateProps} />
        )}
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "cui-fullscreen-message",
        message.role === "user"
          ? "cui-fullscreen-message-user"
          : "cui-fullscreen-message-assistant",
        className,
      )}
    >
      {message.message}
    </div>
  );
};

export const Messages = ({ className }: { className?: string }) => {
  const { messages } = useThreadState();

  return (
    <div className={clsx("cui-fullscreen-messages", className)}>
      {messages.map((message) => (
        <RenderMessage key={message.id} message={message} />
      ))}
    </div>
  );
};

export const Composer = ({ className }: { className?: string }) => {
  const { textContent, setTextContent } = useComposerState();
  const { processMessage: addMessages } = useThreadActions();

  const handleSubmit = () => {
    if (!textContent.trim()) return;

    addMessages({
      role: "user",
      message: textContent,
    });

    setTextContent("");
  };

  return (
    <div className={clsx("cui-fullscreen-composer", className)}>
      <textarea
        value={textContent}
        onChange={(e) => setTextContent(e.target.value)}
        className="cui-fullscreen-composer-input"
        placeholder="Type your message..."
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
      />
      <button onClick={handleSubmit} className="cui-fullscreen-composer-button">
        <SendHorizontal size={16} />
      </button>
    </div>
  );
};
