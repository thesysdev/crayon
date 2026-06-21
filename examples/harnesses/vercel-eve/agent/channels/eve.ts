import { none } from "eve/channels/auth";
import { eveChannel } from "eve/channels/eve";

/**
 * Eve's built-in HTTP channel: serves the standard `/eve/v1/session*` routes
 * (deliver + resumable NDJSON event stream). The OpenUI client talks to these
 * directly via `eve/client`, so there is no custom transport to maintain.
 *
 * `none()` allows anonymous traffic for the local demo — swap in `bearer()` /
 * `basic()` before exposing this publicly.
 */
export default eveChannel({ auth: none() });
