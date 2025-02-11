import fs from "fs";
import path from "path";
import postcss from "postcss";
import postcssJs from "postcss-js";
import postcssDiscardDuplicates from "postcss-remove-duplicate-values";
import prettierTypescriptParser from "prettier/parser-typescript";
import prettierEstreePlugin from "prettier/plugins/estree";
import prettier from "prettier/standalone";
import { extractComponentsAndPaths, getComponentsDependencies } from "./utils";

const dirname = path.dirname(new URL(import.meta.url).pathname);
const UNSTYLED_COMPONENTS = new Set(["ThemeProvider"]);

const generateTailwindPlugin = async () => {
  const componentsAndPaths = extractComponentsAndPaths();
  if (!componentsAndPaths) return;

  const outputFilePath = path.resolve(dirname, "./tailwind.ts");

  const templateFileContents = readTemplateFile();
  const componentTypes = await generateComponentTypes();
  const includeAllComponents = await generateIncludeAllComponents();
  const componentDependencyMap = await generateComponentDependencyMap();
  const addComponentCalls = await generateAddComponentsCalls();

  if (!componentTypes || !addComponentCalls)
    throw new Error("Failed to generate component types or add components calls");

  let pluginFileContents = replacePlaceholderWithContent(
    templateFileContents,
    "COMPONENT_IMPORTS",
    "",
  );

  pluginFileContents = replacePlaceholderWithContent(
    pluginFileContents,
    "COMPONENT_TYPES",
    componentTypes,
  );

  pluginFileContents = replacePlaceholderWithContent(
    pluginFileContents,
    "ADD_COMPONENTS_CALLS",
    addComponentCalls,
  );

  pluginFileContents = replacePlaceholderWithContent(
    pluginFileContents,
    "INCLUDE_ALL_COMPONENTS",
    includeAllComponents.toString(),
  );

  pluginFileContents = replacePlaceholderWithContent(
    pluginFileContents,
    "COMPONENT_DEPENDENCY_MAP",
    JSON.stringify(componentDependencyMap),
  );

  const formattedPluginFile = await formatPluginFile(pluginFileContents);
  fs.writeFileSync(outputFilePath, formattedPluginFile);
};

const generateComponentTypes = async () => {
  const componentsAndPaths = await extractComponentsAndPaths();
  if (!componentsAndPaths) return;

  const componentNames = componentsAndPaths.map((component) => `'${component.name}'`);
  const componentTypes = componentNames.join(" | ");
  return `(${componentTypes})[]`;
};

const generateIncludeAllComponents = async (): Promise<string> => {
  const componentsAndPaths = await extractComponentsAndPaths();
  if (!componentsAndPaths) return "[]";

  const includeAllComponents: Set<string> = new Set(); // components which are dependent on all other components

  for (const component of componentsAndPaths) {
    const dependencies = await getComponentsDependencies([component.name]);
    if (!dependencies) continue;

    if (dependencies.includes("*")) {
      includeAllComponents.add(`'${component.name}'`);
    }
  }

  return `new Set<string>([${Array.from(includeAllComponents).join(", ")}])`;
};

const generateAddComponentsCalls = async () => {
  const componentsAndPaths = await extractComponentsAndPaths();
  if (!componentsAndPaths) return;

  const addComponentsCallPromises = componentsAndPaths.map(async (component) => {
    if (UNSTYLED_COMPONENTS.has(component.name)) return;
    if (!component.stylePath)
      throw new Error(
        `No styles found for component: ${component.name}. If this is intentional, add component name to UNSTYLED_COMPONENTS in generateTailwindPlugin.ts`,
      );

    const componentStyle = fs.readFileSync(path.join(component.path, component.stylePath), "utf-8");

    const componentJS = await transformCssToJson(componentStyle);
    // TODO: Also add component dependencies if a component is included and is dependent on other components
    return `
      if (includeAll || componentsToAdd.includes('${component.name}')) {
        addComponents(${JSON.stringify(componentJS)})
      }
    `;
  });

  const addComponentsCalls = await Promise.all(addComponentsCallPromises);
  return addComponentsCalls.join("\n");
};

const formatPluginFile = (pluginFileContents: string) => {
  const formattedPluginFile = prettier.format(pluginFileContents, {
    parser: "typescript",
    plugins: [prettierTypescriptParser, prettierEstreePlugin],
  });
  return formattedPluginFile;
};

const readTemplateFile = () => {
  const templateFilePath = path.resolve(dirname, "./pluginTemplate.txt");
  const templateFileContents = fs.readFileSync(templateFilePath, "utf8");
  return templateFileContents;
};

const replacePlaceholderWithContent = (
  templateFileContents: string,
  placeholderName: string,
  content: string,
) => {
  const placeholder = getPlaceholderFromName(placeholderName);
  return templateFileContents.replace(placeholder, content);
};

const getPlaceholderFromName = (name: string) => {
  return `\`<${name}$>\`;`;
};

const replaceNullWithObject = (obj: object): object => {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => {
      if (value === true) return [key, {}];
      if (typeof value === "object" && value !== null) return [key, replaceNullWithObject(value)];
      return [key, value];
    }),
  );
};

const convertNumericValuesToStrings = (obj: object): object => {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => {
      if (typeof value === "number") return [key, value.toString()];
      if (typeof value === "object" && value !== null)
        return [key, convertNumericValuesToStrings(value)];
      return [key, value];
    }),
  );
};

const transformCssToJson = async (css: string) => {
  const parsed = await postcss([postcssDiscardDuplicates({})]).process(css, { from: undefined });
  const json = replaceNullWithObject(postcssJs.objectify(parsed.root));
  return convertNumericValuesToStrings(json);
};

const generateComponentDependencyMap = async () => {
  const componentsAndPaths = await extractComponentsAndPaths();
  if (!componentsAndPaths) return;
  const componentDepsMap: Record<string, string[]> = {};

  for (const component of componentsAndPaths) {
    const dependencies = await getComponentsDependencies([component.name]);
    if (!dependencies) continue;
    componentDepsMap[component.name] = dependencies as string[];
  }

  return componentDepsMap;
};

generateTailwindPlugin();
