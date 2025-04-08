export const transformStream = <T, R>(
  stream: AsyncIterable<T>,
  transformer: (data: T) => R,
  options?: {
    onError?: (error: unknown) => void;
    onEnd?: (args: { accumulated: R[] }) => void;
    onStart?: () => void;
    onRawChunk?: (chunk: T) => void;
    onTransformedChunk?: (chunk: R) => void;
  },
) => {
  const accumulate = options?.onEnd ? true : false;
  return new ReadableStream({
    async start(c) {
      const accumulated: R[] = [];
      try {
        options?.onStart?.();
        for await (const chunk of stream) {
          options?.onRawChunk?.(chunk);
          const content = transformer(chunk);
          if (content) {
            // Only accumulate if onEnd is provided to avoid unnecessary memory usage.
            accumulate && accumulated.push(content);
            options?.onTransformedChunk?.(content);
            c.enqueue(content);
          }
        }
      } catch (error: unknown) {
        options?.onError?.(error);
        c.error(error as Error);
      } finally {
        options?.onEnd?.({ accumulated });
        c.close();
      }
    },
  });
};
