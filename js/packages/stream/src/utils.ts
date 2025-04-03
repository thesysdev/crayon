export const transformStream = <T, R>(stream: AsyncIterable<T>, transformer: (chunk: T) => R) => {
  return new ReadableStream({
    async start(c) {
      try {
        for await (const chunk of stream) {
          const content = transformer(chunk);
          if (content) {
            c.enqueue(content);
          }
        }
      } catch (error: unknown) {
        c.error(error as Error);
      } finally {
        c.close();
      }
    },
  });
};
