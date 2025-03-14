import { parse } from "best-effort-json-parser";
import { ResponseTemplateChunk, TextChunk } from "./types";
// Define the types for the data flowing through the stream
type InputType = string; // Change this to match your input type
type OutputType = string; // Change this to match your output type

export interface TransformerOpts {
  onFinish: (controller: TransformStreamDefaultController<OutputType>) => Promise<void>;
}

export class CrayonDataStreamTransformer implements TransformStream<InputType, OutputType> {
  readonly readable: ReadableStream<OutputType>;
  readonly writable: WritableStream<InputType>;
  private streamedContent: string = "";
  private controller: TransformStreamDefaultController<OutputType> | null = null;

  reset() {
    const parsed = parse(this.streamedContent);
    if (
      parsed.response &&
      parsed.response.length &&
      parsed.response[parsed.response.length - 1]?.type !== "text"
    ) {
      const lastTemplate = parsed.response.pop();
      this.controller?.enqueue(new ResponseTemplateChunk(lastTemplate).toSSEString());
    }
    this.streamedContent = "";
  }

  constructor(opts?: TransformerOpts) {
    const transform = new TransformStream({
      transform: async (
        content: InputType,
        controller: TransformStreamDefaultController<OutputType>,
      ) => {
        this.controller = controller;
        try {
          const previousParsed = parse(this.streamedContent);
          this.streamedContent += content;
          const parsed = parse(this.streamedContent);

          if (previousParsed.response && parsed.response) {
            if (previousParsed.response.length === parsed.response.length) {
              const newContent = parsed.response.pop();
              const lastContent = previousParsed.response.pop();
              if (newContent.type === "text" && newContent.text) {
                const textPart = newContent.text.substring(lastContent.text?.length);
                if (textPart.length > 0) {
                  controller.enqueue(new TextChunk(textPart).toSSEString());
                }
              }
            } else {
              const lastTemplate = previousParsed.response.pop();
              if (typeof lastTemplate === "object") {
                controller.enqueue(new ResponseTemplateChunk(lastTemplate).toSSEString());
              }

              const newContent = parsed.response.pop();

              if (newContent.type === "text" && newContent.text) {
                controller.enqueue(new TextChunk(newContent).toSSEString());
              }
            }
          }
        } catch (error) {
          controller.error(error);
        }
      },

      flush: async (controller: TransformStreamDefaultController<OutputType>) => {
        this.reset();
        await opts?.onFinish(controller);
        this.controller = null;
      },
    });

    this.readable = transform.readable;
    this.writable = transform.writable;
  }
}
