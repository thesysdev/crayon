import {
  createContext,
  createElement,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface ComposerStateValue {
  textContent: string;
  setTextContent: Dispatch<SetStateAction<string>>;
}

const ComposerStateContext = createContext<ComposerStateValue | null>(null);

export const ComposerStateProvider = ({ children }: PropsWithChildren) => {
  const [textContent, setTextContent] = useState("");

  const value = useMemo(
    () => ({
      textContent,
      setTextContent,
    }),
    [textContent],
  );

  return createElement(ComposerStateContext.Provider, { value }, children);
};

export const useComposerState = () => {
  const context = useContext(ComposerStateContext);
  const [localTextContent, localSetTextContent] = useState("");
  const hasWarnedRef = useRef(false);

  useEffect(() => {
    const isProduction =
      typeof process !== "undefined" && process.env && process.env["NODE_ENV"] === "production";
    if (!isProduction && !context && !hasWarnedRef.current) {
      hasWarnedRef.current = true;

      console.warn(
        "[openui] useComposerState was called without a <ComposerStateProvider> in scope. " +
          "Each call site will get its own isolated state, so cross-component features " +
          "(e.g. hiding conversation starters while drafting) will not work. " +
          "Wrap your layout in <ComposerStateProvider> (or use a built-in <ThreadContainer>) " +
          "to share composer state across siblings.",
      );
    }
  }, [context]);

  return (
    context ?? {
      textContent: localTextContent,
      setTextContent: localSetTextContent,
    }
  );
};
