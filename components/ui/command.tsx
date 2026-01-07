import * as React from "react";

// Command primitive context and types
const CommandContext = React.createContext({});

export function Command({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div role="command" {...props}>
      {children}
    </div>
  );
}

export function CommandInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input role="command-input" {...props} />;
}

export function CommandList({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) {
  return <ul role="command-list" {...props}>{children}</ul>;
}

export function CommandEmpty({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div role="command-empty" {...props}>{children}</div>;
}

export function CommandGroup({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div role="command-group" {...props}>{children}</div>;
}

export function CommandItem({ children, ...props }: React.LiHTMLAttributes<HTMLLIElement>) {
  return <li role="command-item" {...props}>{children}</li>;
}
