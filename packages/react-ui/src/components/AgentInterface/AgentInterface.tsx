import {
  ChatProvider,
  type AssistantMessage,
  type ChatProviderProps,
  type UserMessage,
} from "@openuidev/react-headless";
import type { Library } from "@openuidev/react-lang";
import {
  Children,
  isValidElement,
  useMemo,
  type FC,
  type ReactElement,
  type ReactNode,
} from "react";
import type { ConversationStarterProps } from "../../types/ConversationStarter";
import { GenUIAssistantMessage } from "../OpenUIChat/GenUIAssistantMessage";
import { GenUIUserMessage } from "../OpenUIChat/GenUIUserMessage";
import { ThemeProvider, type ThemeProps } from "../ThemeProvider";
import { parseArtifactPath } from "./_shared/artifactPaths";
import { NavProvider, useNav } from "./_shared/navContext";
import { ArtifactBrowserPage } from "./ArtifactBrowserPage";
import { ArtifactNav } from "./ArtifactNav";
import { ArtifactViewPage } from "./ArtifactViewPage";
import type { AssistantMessageComponent, UserMessageComponent } from "./_shared/types";
import { StartersProvider } from "./_shared/startersContext";
import { Composer } from "./Composer";
import { type ConversationStarterVariant } from "./ConversationStarter";
import { Container } from "./Container";
import { MobileHeader } from "./MobileHeader";
import { NewChatButton } from "./NewChatButton";
import { Route } from "./Route";
import {
  SidebarContainer,
  SidebarContent,
  SidebarHeader,
  SidebarSeparator,
} from "./Sidebar";
import { SidebarItem } from "./SidebarItem";
import { SidebarSlot } from "./SidebarSlot";
import {
  MessageLoading,
  Messages,
  ScrollArea,
  ThreadContainer,
  ThreadHeader,
} from "./Thread";
import { ThreadList } from "./ThreadList";
import { WelcomeScreen } from "./WelcomeScreen";
import { Workspace } from "./Workspace";

export interface AgentInterfaceComponents {
  AssistantMessage?: AssistantMessageComponent;
  UserMessage?: UserMessageComponent;
}

export interface AgentInterfaceProps extends Omit<ChatProviderProps, "children"> {
  /** Component library for auto-GenUI rendering when `components.AssistantMessage` is not provided. */
  componentLibrary?: Library;
  /** Explicit component overrides. Takes precedence over GenUI auto-derivation. */
  components?: AgentInterfaceComponents;
  /** Theme props passed to <ThemeProvider>. */
  theme?: ThemeProps;
  /** When true, skips wrapping in <ThemeProvider>. */
  disableThemeProvider?: boolean;
  /** Brand logo shown in default SidebarHeader + MobileHeader. */
  logoUrl?: string;
  /** Agent display name. */
  agentName?: string;
  /** Global starters inherited by Welcome (when active) or Composer. */
  starters?: ConversationStarterProps[];
  /** Layout variant for inherited starters. */
  starterVariant?: ConversationStarterVariant;
  /** Controlled current path. Pair with `onNavigate`. `undefined` = thread view. */
  path?: string;
  /** Initial path for uncontrolled mode. Ignored when `onNavigate` is provided. */
  defaultPath?: string;
  /** Called when navigation occurs. Presence selects controlled mode. */
  onNavigate?: (next: string | undefined) => void;
  children?: ReactNode;
}

interface ExtractedSlots {
  sidebar?: ReactElement;
  sidebarHeader?: ReactElement;
  mobileHeader?: ReactElement;
  threadHeader?: ReactElement;
  welcome?: ReactElement;
  composer?: ReactElement;
  workspace?: ReactElement;
  routes: ReactElement[];
  rest: ReactNode[];
}

type SingleSlotKey = Exclude<keyof ExtractedSlots, "rest" | "routes">;

const SLOT_KEY_BY_TYPE = new Map<unknown, SingleSlotKey>([
  [SidebarSlot, "sidebar"],
  [SidebarHeader, "sidebarHeader"],
  [MobileHeader, "mobileHeader"],
  [ThreadHeader, "threadHeader"],
  [WelcomeScreen, "welcome"],
  [Composer, "composer"],
  [Workspace, "workspace"],
]);

const isDev = () =>
  typeof process !== "undefined" && process.env?.["NODE_ENV"] !== "production";

function extractSlots(children: ReactNode): ExtractedSlots {
  const result: ExtractedSlots = { routes: [], rest: [] };
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) {
      result.rest.push(child);
      return;
    }
    if (child.type === Route) {
      result.routes.push(child);
      return;
    }
    const key = SLOT_KEY_BY_TYPE.get(child.type);
    if (!key) {
      result.rest.push(child);
      return;
    }
    if (result[key]) {
      if (isDev()) {
        console.warn(
          `[AgentInterface] Multiple <AgentInterface.${key}> slot children — using the first; ignoring the rest.`,
        );
      }
      return;
    }
    result[key] = child;
  });
  return result;
}

const DummyThemeProvider = ({ children }: { children: ReactNode }) => <>{children}</>;

interface AgentInterfaceComponent extends FC<AgentInterfaceProps> {
  Sidebar: typeof SidebarSlot;
  SidebarHeader: typeof SidebarHeader;
  SidebarContent: typeof SidebarContent;
  SidebarSeparator: typeof SidebarSeparator;
  SidebarItem: typeof SidebarItem;
  ArtifactNav: typeof ArtifactNav;
  Workspace: typeof Workspace;
  Route: typeof Route;
  MobileHeader: typeof MobileHeader;
  ThreadHeader: typeof ThreadHeader;
  Welcome: typeof WelcomeScreen;
  Composer: typeof Composer;
  NewChatButton: typeof NewChatButton;
  ThreadList: typeof ThreadList;
  Messages: typeof Messages;
  MessageLoading: typeof MessageLoading;
  ScrollArea: typeof ScrollArea;
}

export const AgentInterface: AgentInterfaceComponent = ((props: AgentInterfaceProps) => {
  const {
    storage,
    llm,
    artifactRenderers,
    artifactCategories,
    componentLibrary,
    components,
    theme,
    disableThemeProvider,
    logoUrl,
    agentName,
    starters,
    starterVariant,
    path,
    defaultPath,
    onNavigate,
    children,
  } = props;

  const slots = useMemo(() => extractSlots(children), [children]);

  if (slots.sidebar && slots.sidebarHeader) {
    if (isDev()) {
      console.warn(
        "[AgentInterface] <AgentInterface.SidebarHeader> at top level is ignored because <AgentInterface.Sidebar> is provided. Put SidebarHeader inside Sidebar instead.",
      );
    }
    slots.sidebarHeader = undefined;
  }

  const resolvedAssistantMessage = useMemo<AssistantMessageComponent | undefined>(() => {
    if (components?.AssistantMessage) return components.AssistantMessage;
    if (componentLibrary) {
      const Cmp = ({ message }: { message: AssistantMessage }) => (
        <GenUIAssistantMessage message={message} library={componentLibrary} />
      );
      return Cmp;
    }
    return undefined;
  }, [components?.AssistantMessage, componentLibrary]);

  const resolvedUserMessage = useMemo<UserMessageComponent | undefined>(() => {
    if (components?.UserMessage) return components.UserMessage;
    if (componentLibrary) {
      const Cmp = ({ message }: { message: UserMessage }) => <GenUIUserMessage message={message} />;
      return Cmp;
    }
    return undefined;
  }, [components?.UserMessage, componentLibrary]);

  const ThemeProviderComponent = disableThemeProvider ? DummyThemeProvider : ThemeProvider;

  return (
    <ThemeProviderComponent {...theme}>
      <ChatProvider
        storage={storage}
        llm={llm}
        artifactRenderers={artifactRenderers}
        artifactCategories={artifactCategories}
      >
        <NavProvider path={path} defaultPath={defaultPath} onNavigate={onNavigate}>
          <StartersProvider starters={starters} starterVariant={starterVariant}>
            <AgentInterfaceBody
              slots={slots}
              logoUrl={logoUrl ?? ""}
              agentName={agentName ?? ""}
              resolvedAssistantMessage={resolvedAssistantMessage}
              resolvedUserMessage={resolvedUserMessage}
            />
          </StartersProvider>
        </NavProvider>
      </ChatProvider>
    </ThemeProviderComponent>
  );
}) as AgentInterfaceComponent;

interface AgentInterfaceBodyProps {
  slots: ExtractedSlots;
  logoUrl: string;
  agentName: string;
  resolvedAssistantMessage: AssistantMessageComponent | undefined;
  resolvedUserMessage: UserMessageComponent | undefined;
}

const AgentInterfaceBody = ({
  slots,
  logoUrl,
  agentName,
  resolvedAssistantMessage,
  resolvedUserMessage,
}: AgentInterfaceBodyProps) => {
  const { path } = useNav();

  // Reserved `artifacts/` prefix is matched BEFORE user-defined Routes.
  const artifactPath = useMemo(
    () => (path === undefined ? null : parseArtifactPath(path)),
    [path],
  );

  const activeRoute = useMemo(() => {
    if (path === undefined || artifactPath) return undefined;
    return slots.routes.find(
      (route) => (route.props as { path: string }).path === path,
    );
  }, [path, artifactPath, slots.routes]);

  return (
    <Container logoUrl={logoUrl} agentName={agentName}>
      <SidebarContainer>
        {slots.sidebar ? (
          (slots.sidebar.props as { children?: ReactNode }).children
        ) : (
          <>
            {slots.sidebarHeader ?? <SidebarHeader />}
            <SidebarContent>
              <ArtifactNav />
              <SidebarSeparator />
              <ThreadList />
            </SidebarContent>
          </>
        )}
      </SidebarContainer>
      {artifactPath ? (
        <ThreadContainer>
          {artifactPath.kind === "list" ? (
            <ArtifactBrowserPage categoryName={artifactPath.categoryName} />
          ) : (
            <ArtifactViewPage
              artifactId={artifactPath.artifactId}
              categoryName={artifactPath.categoryName}
            />
          )}
        </ThreadContainer>
      ) : activeRoute ? (
        <ThreadContainer>
          {(activeRoute.props as { children?: ReactNode }).children}
        </ThreadContainer>
      ) : (
        <>
          <ThreadContainer>
            {slots.mobileHeader ?? <MobileHeader />}
            {slots.threadHeader}
            {slots.welcome}
            <ScrollArea>
              <Messages
                loader={<MessageLoading />}
                assistantMessage={resolvedAssistantMessage}
                userMessage={resolvedUserMessage}
              />
            </ScrollArea>
            {slots.composer ?? <Composer />}
          </ThreadContainer>
          {/* Per-thread workspace rail — thread view only (hidden on Route/artifact pages). */}
          {slots.workspace ?? <Workspace />}
        </>
      )}
      {slots.rest}
    </Container>
  );
};

AgentInterface.Sidebar = SidebarSlot;
AgentInterface.SidebarHeader = SidebarHeader;
AgentInterface.SidebarContent = SidebarContent;
AgentInterface.SidebarSeparator = SidebarSeparator;
AgentInterface.SidebarItem = SidebarItem;
AgentInterface.ArtifactNav = ArtifactNav;
AgentInterface.Workspace = Workspace;
AgentInterface.Route = Route;
AgentInterface.MobileHeader = MobileHeader;
AgentInterface.ThreadHeader = ThreadHeader;
AgentInterface.Welcome = WelcomeScreen;
AgentInterface.Composer = Composer;
AgentInterface.NewChatButton = NewChatButton;
AgentInterface.ThreadList = ThreadList;
AgentInterface.Messages = Messages;
AgentInterface.MessageLoading = MessageLoading;
AgentInterface.ScrollArea = ScrollArea;
