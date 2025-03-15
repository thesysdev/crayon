import { ReadableStreamController } from "stream/web";
import { CrayonDataStreamTransformer, TransformerOpts } from "./transformer";

export const crayonStream = (opts?: TransformerOpts) => {
  let controller: ReadableStreamController<string> | null = null;
  const readableStream = new ReadableStream({
    async start(c) {
      controller = c;
    },
  });
  const crayonTransformer = new CrayonDataStreamTransformer(opts);
  const onText = (text: string) => {
    controller?.enqueue(text);
  };
  const onEnd = () => {
    controller?.close();
  };
  const onError = (e: Error) => {
    controller?.error(e);
  };
  const onLLMEnd = () => {
    crayonTransformer.reset();
  };

  return {
    stream: readableStream.pipeThrough(crayonTransformer),
    onText,
    onEnd,
    onLLMEnd,
    onError,
  };
};
