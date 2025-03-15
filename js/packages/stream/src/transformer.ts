import { parse } from "best-effort-json-parser";
import { ResponseTemplate, TextChunk } from "./types";
import invariant from "tiny-invariant";
// Define the types for the data flowing through the stream
type InputType = string; // Change this to match your input type
type OutputType = string; // Change this to match your output type

export interface TransformerOpts {
  onFinish: (controller: TransformStreamDefaultController<OutputType>) => Promise<void>;
}

export class CrayonDataStreamTransformer implements TransformStream<InputType, OutputType> {
  readonly readable: ReadableStream<OutputType>;
  readonly writable: WritableStream<InputType>;

  constructor(opts?: TransformerOpts) {
    let streamedContent = "";
    let previouslyStreamedTextContent: string = "";
    let hasPendingTemplateToStream: boolean = false;

    const transform = new TransformStream({
      transform: async (
        content: InputType,
        controller: TransformStreamDefaultController<OutputType>,
      ) => {
        try {
          streamedContent += content;

          const parsed = parse(streamedContent);
          const newContent = parsed?.response?.pop?.();

          if (newContent?.type === "text") {
            const prevContent = parsed.response.pop();
            const newText = newContent.text || "";

            if (hasPendingTemplateToStream && prevContent && prevContent?.type !== "text") {
              const { name, templateProps } = prevContent;
              invariant(name, "name is required in ResponseTemplate");
              controller.enqueue(new ResponseTemplate(name, templateProps).toSSEString());
              hasPendingTemplateToStream = false;
            }

            const textContent = newText.substring(previouslyStreamedTextContent.length);

            if (textContent.length > 0) {
              controller.enqueue(new TextChunk(textContent).toSSEString());
            }

            previouslyStreamedTextContent = newText;
          } else {
            hasPendingTemplateToStream = true;
            previouslyStreamedTextContent = "";
          }
        } catch (error) {
          controller.error(error);
        }
      },

      flush: async (controller: TransformStreamDefaultController<OutputType>) => {
        const parsed = parse(streamedContent);
        const lastContent = parsed?.response?.pop?.();

        if (hasPendingTemplateToStream && lastContent && lastContent.type !== "text") {
          const { name, templateProps } = lastContent;
          invariant(name, "name is required in ResponseTemplate");
          controller.enqueue(new ResponseTemplate(name, templateProps).toSSEString());
        }

        await opts?.onFinish(controller);
      },
    });

    this.readable = transform.readable;
    this.writable = transform.writable;
  }
}
