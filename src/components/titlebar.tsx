import { url } from "inspector";
import React from "react";
import { Link, Route } from "react-router-dom";

interface TitlebarArgs {
  title: string;
  section: string;
  icon: string;
  url: string;
}
export const Titlebar = ({ title, section, icon, url }: TitlebarArgs) => {
  return (
    /* start title */
    <div className="page-bar">
      <div className="page-title-breadcrumb">
        <div className="pull-left">
          <div className="page-title">{title}</div>
        </div>
        <ol className="breadcrumb page-breadcrumb pull-right">
          <li>
            <i className={`fa fa-${icon}`}></i>&nbsp;
            <Link to={url}
              className="parent-item"
            >
              {section}
            </Link>
            &nbsp;<i className="fa fa-angle-right"></i>
          </li>
          <li className="active">{title}</li>
        </ol>
      </div>
    </div>
  );
};
