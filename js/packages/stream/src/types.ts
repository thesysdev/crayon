import { encode } from "eventsource-encoder";
import invariant from "tiny-invariant";

export type JSONValue =
  | string
  | number
  | boolean
  | {
      [value: string]: JSONValue;
    }
  | JSONValue[]
  | null;

export enum SSEType {
  TextDelta = "text",
  ResponseTemplate = "response_tpl",
  ResponseTemplateArgs = "response_tpl_args",
  ContextAppend = "context_append",
  MessageUpdate = "message_update",
}

interface Chunk {
  toSSEString(): string;
}

export class TextChunk implements Chunk {
  constructor(readonly chunk: string) {}

  toSSEString(): string {
    return encode({
      event: SSEType.TextDelta,
      data: this.chunk,
    });
  }

  static fromSSEData(data: string): TextChunk {
    return new TextChunk(data);
  }
}
export class ResponseTemplate implements Chunk {
  constructor(
    readonly name: string,
    readonly templateArgs?: object,
  ) {}

  toSSEString(): string {
    return encode({
      event: SSEType.ResponseTemplate,
      data: JSON.stringify({ name: this.name, templateArgs: this.templateArgs }),
    });
  }

  static fromSSEData(data: string): ResponseTemplate {
    const { name, templateArgs } = JSON.parse(data);
    invariant(name, "name is required in ResponseTemplate");
    return new ResponseTemplate(name, templateArgs);
  }
}

export class ResponseTemplateArgsChunk implements Chunk {
  constructor(readonly chunk: string) {}

  toSSEString(): string {
    return encode({
      event: SSEType.ResponseTemplateArgs,
      data: this.chunk,
    });
  }

  static fromSSEData(data: string): ResponseTemplateArgsChunk {
    return new ResponseTemplateArgsChunk(data);
  }
}

export class ContextUpdate implements Chunk {
  constructor(readonly contextItem: JSONValue) {}

  toSSEString(): string {
    return encode({
      event: SSEType.ContextAppend,
      data: JSON.stringify(this.contextItem),
    });
  }

  static fromSSEData(data: string): ContextUpdate {
    return new ContextUpdate(JSON.parse(data));
  }
}

export class MessageUpdate implements Chunk {
  constructor(readonly id: string) {}

  toSSEString(): string {
    return encode({
      event: SSEType.MessageUpdate,
      data: JSON.stringify({ id: this.id }),
    });
  }

  static fromSSEData(data: string): MessageUpdate {
    const { id } = JSON.parse(data);
    invariant(id, "id is required in MessageUpdate");
    return new MessageUpdate(id);
  }
}
