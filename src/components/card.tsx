import React from "react";

interface CardArgs {
  title?: String;
  showHeader: boolean;
  children: React.ReactNode;
}
export const Card = ({ title, children, showHeader }: CardArgs) => {
  return (
    <div className="card">
      {showHeader && (
        <div className="card-head">
          <header>{title}</header>
        </div>
      )}
      <div className="card-body">{children}</div>
    </div>
  );
};
