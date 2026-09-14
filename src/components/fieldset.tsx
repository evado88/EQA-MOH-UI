import React, { ReactNode} from "react";

interface FieldsetArgs {
  title: string;
  children: ReactNode;
}
export const Fieldset = ({ title, children }: FieldsetArgs) => {
  return (
    /* start title */
    <div className="dx-fieldset">
      <div className="dx-fieldset-header">{title}</div>
      {children}
    </div>
  );
};
