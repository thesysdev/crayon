import fs from "fs";
import path from "path";

export const extractComponentsAndPaths = () => {
  const componentsDir = path.resolve("../dist", "components");

  if (!fs.existsSync(componentsDir)) {
    console.error(`${componentsDir} does not exist`);
    return;
  }

  const components = fs.readdirSync(componentsDir);

  const promises = components
    .filter((component) => fs.lstatSync(path.join(componentsDir, component)).isDirectory())
    .map(async (component) => {
      const componentPath = path.join(componentsDir, component);
      const componentFiles = fs.readdirSync(componentPath);
      const componentStylePath = componentFiles.find((file) => file.endsWith(".css"));
      let dependencies: string[] = [];
      const dependenciesPath = path.join(componentPath, "dependencies.js");

      if (fs.existsSync(dependenciesPath)) {
        const dependenciesModule = await import(dependenciesPath);
        dependencies = dependenciesModule.default;
      }

      return { name: component, path: componentPath, stylePath: componentStylePath, dependencies };
    });

  return Promise.all(promises);
};

export const getComponentsDependencies = async (componentNames: string[]) => {
  if (componentNames.length === 0) return [];

  const componentsAndPaths = await extractComponentsAndPaths();
  if (!componentsAndPaths) throw new Error("Failed to extract components and paths");

  const components = componentsAndPaths.filter((component) =>
    componentNames.includes(component.name),
  );
  if (!components) throw new Error(`Components ${componentNames.join(", ")} not found`);

  console.log(`dependencies for component ${componentNames.join(", ")}:`, components.map((component) => component.dependencies).flat());

  return components.map((component) => component.dependencies).flat();
};
