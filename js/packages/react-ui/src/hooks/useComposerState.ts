import { UploadedFile } from "@crayonai/react-core";
import { useState } from "react";

type FileUploadResponse = {
  files: UploadedFile[];
};

export const useComposerState = () => {
  const [textContent, setTextContent] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<FileUploadResponse | null>(null);

  return { textContent, setTextContent, uploadedFiles, setUploadedFiles };
};
