import { encode } from "eventsource-encoder";

export enum SSEType {
  TextDelta = "T",
  ResponseTemplate = "R",
  ResponseTemplatePropsStream = "C",
  ContextUpdate = "U",
  MessageIdUpdate = "M",
}

interface Chunk {
  toSSEString(): string;
}

export class TextChunk implements Chunk {
  constructor(private readonly data: string) {}

  toSSEString(): string {
    return encode({
      event: SSEType.TextDelta,
      data: this.data,
    });
  }
}

export interface ResponseTemplate {
  name: string;
  templateProps: object;
}

export class ResponseTemplateChunk implements Chunk {
  constructor(private readonly template: ResponseTemplate) {}

  toSSEString(): string {
    return encode({
      event: SSEType.ResponseTemplate,
      data: JSON.stringify(this.template),
    });
  }

  // this is used to stream the templateProps
  // on client side, this will be accumulated in responseTemplates.content just like text stream
  static SSETemplateContentProp(content: string): string {
    return encode({
      event: SSEType.ResponseTemplatePropsStream,
      data: content,
    });
  }
}
