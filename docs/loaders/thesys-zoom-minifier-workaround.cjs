const { readFileSync } = require("node:fs");
const { dirname, resolve, sep } = require("node:path");

const PACKAGE_NAME = "@openuidev/thesys";
const PACKAGE_VERSION = "0.2.1";
const RESOURCE_SUFFIX = "/node_modules/@openuidev/thesys/dist/index.mjs";

module.exports = function thesysZoomMinifierWorkaround(source) {
  const normalizedResource = this.resourcePath.split(sep).join("/");
  if (!normalizedResource.endsWith(RESOURCE_SUFFIX)) {
    throw new Error(`Thesys workaround unexpectedly matched ${this.resourcePath}`);
  }

  const packageJsonPath = resolve(dirname(this.resourcePath), "../package.json");
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  if (packageJson.name !== PACKAGE_NAME || packageJson.version !== PACKAGE_VERSION) {
    throw new Error(
      `Review the Thesys zoom workaround before using ${packageJson.name}@${packageJson.version}`,
    );
  }

  const before = ",isZooming:l}=e,{scale:o,posX:c,posY:d}=t;if(l){";
  const after = "}=e,{scale:o,posX:c,posY:d}=t;if(e.isZooming){";
  const matches = source.split(before).length - 1;

  if (matches !== 1) {
    throw new Error(`Expected one Thesys 0.2.1 zoom helper; found ${matches}`);
  }

  return source.replace(before, after);
};
