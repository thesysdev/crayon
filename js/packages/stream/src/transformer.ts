import { parse } from "best-effort-json-parser";
import invariant from "tiny-invariant";
import { ResponseTemplate, TextChunk } from "./types";
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
  private hasPendingTemplateToStream: boolean = false;

  reset() {
    const parsed = parse(this.streamedContent);
    const lastContent = parsed?.response?.pop?.();

    if (this.hasPendingTemplateToStream && lastContent && lastContent.type !== "text") {
      const { name, templateProps } = lastContent;
      invariant(name, "name is required in ResponseTemplate");
      this.controller?.enqueue(new ResponseTemplate(name, templateProps).toSSEString());
    }
    this.streamedContent = "";
  }

  constructor(opts?: TransformerOpts) {
    let previouslyStreamedTextContent: string = "";

    const transform = new TransformStream({
      transform: async (
        content: InputType,
        controller: TransformStreamDefaultController<OutputType>,
      ) => {
        this.controller = controller;
        try {
          this.streamedContent += content;

          const parsed = parse(this.streamedContent);
          const newContent = parsed?.response?.pop?.();

          if (newContent?.type === "text") {
            const prevContent = parsed.response.pop();
            const newText = newContent.text || "";

            if (this.hasPendingTemplateToStream && prevContent && prevContent?.type !== "text") {
              const { name, templateProps } = prevContent;
              invariant(name, "name is required in ResponseTemplate");
              controller.enqueue(new ResponseTemplate(name, templateProps).toSSEString());
              this.hasPendingTemplateToStream = false;
            }

            const textContent = newText.substring(previouslyStreamedTextContent.length);

            if (textContent.length > 0) {
              controller.enqueue(new TextChunk(textContent).toSSEString());
            }

            previouslyStreamedTextContent = newText;
          } else {
            this.hasPendingTemplateToStream = true;
            previouslyStreamedTextContent = "";
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
