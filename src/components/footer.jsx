import React from "react";
import AppInfo from "../classes/app-info";

export const Footer = ({ names, title }) => {
  return (
    /* start footer */
    <div className="page-footer">
      <div className="page-footer-inner">
         &copy;2025 {AppInfo.appCode}. All Rights Reserved

      </div>
      <div className="scroll-to-top" style={{ display: "none" }}>
        <i className="icon-arrow-up"></i>
      </div>
    </div>
  );
};
