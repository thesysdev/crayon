const escapeString = (s: string) => {
  return s.replaceAll('"', '\\"').replaceAll("\n", "\\n");
};

interface Chunk {
  toSSEString(): string;
}

export class TextChunk implements Chunk {
  constructor(private readonly data: string) {}

  toSSEString(): string {
    return `0:${escapeString(this.data)}`;
  }
}

export interface ResponseTemplate {
  name: string;
  templateProps: object;
}

export class ResponseTemplateChunk implements Chunk {
  constructor(private readonly template: ResponseTemplate) {}

  toSSEString(): string {
    return `1:${escapeString(JSON.stringify(this.template))}\n`;
  }
}
