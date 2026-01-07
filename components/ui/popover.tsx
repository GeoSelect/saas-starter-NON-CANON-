import * as React from "react";

export function Popover({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div role="popover" tabIndex={-1} {...props}>
      {children}
    </div>
  );
}

export function PopoverContent({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="popover-content"
      style={{
        padding: '12px',
        maxWidth: 'calc(100vw - 32px)',
        margin: '8px',
        borderRadius: '10px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
        background: 'var(--popover-bg, white)',
        ...props.style
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function PopoverTrigger({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button role="popover-trigger" type="button" {...props}>
      {children}
    </button>
  );
}
