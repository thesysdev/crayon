import * as RadixSeparator from "@radix-ui/react-separator";
import clsx from "clsx";

const Separator = ({ className, ...props }: React.ComponentProps<typeof RadixSeparator.Root>) => {
  return <RadixSeparator.Root className={clsx("crayon-separator", className)} {...props} />;
};

export { Separator };
