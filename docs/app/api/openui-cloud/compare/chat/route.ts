import { handleCloudResponses } from "../../_lib/responses-handler";

export function POST(request: Request) {
  return handleCloudResponses(request, "compare-cloud");
}
