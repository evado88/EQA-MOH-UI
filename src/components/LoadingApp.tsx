import React from "react";
import './LoadingApp.css'
import { LoadIndicator } from "devextreme-react/load-indicator";

export const LoadingApp = () => {
  return (
    <div className="center-screen-full">
       <LoadIndicator id="large-indicator" height={100} width={100} />
    </div>
  );
};
