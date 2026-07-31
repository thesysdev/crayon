const isTruthy = (value) => value === "1" || value?.toLowerCase() === "true";

const disabled =
  isTruthy(process.env.DO_NOT_TRACK) ||
  isTruthy(process.env.OPENUI_TELEMETRY_DISABLED) ||
  process.env.PACKAGE_TRACKER_ANALYTICS?.toLowerCase() === "false";

if (!disabled) {
  process.env.PACKAGE_TRACKER_ANALYTICS = "true";
  try {
    require("reo-census");
  } catch {}
}
