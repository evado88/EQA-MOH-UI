import { ReactNode } from "react";

interface FieldArgs {
  title: string;
  staticContent: boolean;
  children: ReactNode;
}
export const Field = ({ title, staticContent, children }: FieldArgs) => {
  return (
    /* start title */
    <div className="dx-field">
      <div className="dx-field-label">{title}</div>
      {staticContent && <div className="dx-field-value-static">{children}</div>}
      {staticContent ? null : children}
    </div>
  );
};
