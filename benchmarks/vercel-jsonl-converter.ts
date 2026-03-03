export function astToVercelJsonl(astRoot: any) {
  // Vercel json-render uses JSON Patch (RFC 6902) format
  // Example: {"op":"add","path":"/elements/id","value":{"type":"Component","props":{},"children":[]}}
  
  const lines: string[] = [];
  let idCounter = 1;
  
  function generateId(type: string) {
    return `${type.toLowerCase()}-${idCounter++}`;
  }

  function processNode(node: any): string | null {
    if (!node || typeof node !== "object") return null;
    
    // If it's a primitive array, return it as is
    if (Array.isArray(node)) {
      return node as any;
    }

    if (node.type === "element") {
      const id = generateId(node.typeName);
      const props: Record<string, any> = {};
      const children: string[] = [];

      // Process props
      for (const [key, value] of Object.entries(node.props || {})) {
        if (key === "_args") {
          // In openui-lang AST, _args contains the positional arguments.
          // For Vercel JSONL, we need to map these to props or children.
          // This is a simplified mapping: we extract primitive values to props, and elements to children.
          if (Array.isArray(value)) {
            value.forEach((arg, index) => {
              if (Array.isArray(arg)) {
                // Array of elements (children) or array of primitives
                const isElementArray = arg.some(v => v && typeof v === "object" && v.type === "element");
                if (isElementArray) {
                  for (const child of arg) {
                    const childId = processNode(child);
                    if (childId && typeof childId === "string") {
                      children.push(childId);
                    }
                  }
                } else {
                  props[`arg${index}`] = arg;
                }
              } else if (arg && typeof arg === "object" && arg.type === "element") {
                const childId = processNode(arg);
                if (childId && typeof childId === "string") {
                  children.push(childId);
                }
              } else {
                props[`arg${index}`] = arg;
              }
            });
          }
          continue;
        }
        
        if (Array.isArray(value)) {
          // Check if it's an array of elements
          const isElementArray = value.some(v => v && typeof v === "object" && v.type === "element");
          if (isElementArray) {
            // For Vercel, children are usually flat references
            for (const child of value) {
              const childId = processNode(child);
              if (childId && typeof childId === "string") {
                children.push(childId);
              }
            }
          } else {
             props[key] = value;
          }
        } else if (value && typeof value === "object" && (value as any).type === "element") {
           // Single element prop
           const childId = processNode(value);
           if (childId && typeof childId === "string") {
              children.push(childId);
           }
        } else {
          props[key] = value;
        }
      }

      // Process children from _args since that's how openui-lang stores positional children
      // (Already handled in the _args block above, but keeping this for safety if it's not in _args)
      if (node.props && node.props._args === undefined && node.props.children) {
        const childrenProp = node.props.children;
        if (Array.isArray(childrenProp)) {
          for (const child of childrenProp) {
            const childId = processNode(child);
            if (childId && typeof childId === "string") {
              children.push(childId);
            }
          }
        } else if (childrenProp && typeof childrenProp === "object" && childrenProp.type === "element") {
          const childId = processNode(childrenProp);
          if (childId && typeof childId === "string") {
            children.push(childId);
          }
        }
      }

      // Add the patch line
      lines.push(JSON.stringify({
        op: "add",
        path: `/elements/${id}`,
        value: {
          type: node.typeName,
          props,
          children
        }
      }));

      return id;
    }
    
    return null;
  }

  const rootId = processNode(astRoot);
  if (rootId) {
    lines.unshift(JSON.stringify({ op: "add", path: "/root", value: rootId }));
  }

  return lines.join("\n");
}
