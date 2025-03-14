interface Chunk {
  toSSEString(): string;
}

export class TextChunk implements Chunk {
  constructor(private readonly data: string) {}

  toSSEString(): string {
    return `0:${this.data.replaceAll(/\n/g, "\\n")}\n`;
  }
}

export interface ResponseTemplate {
  name: string;
  templateProps: object;
}

export class ResponseTemplateChunk implements Chunk {
  constructor(private readonly template: ResponseTemplate) {}

  toSSEString(): string {
    return `1:${JSON.stringify(this.template)}\n`;
  }
}
