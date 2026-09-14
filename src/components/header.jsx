import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, NavLink, useLocation } from "react-router-dom";
import AppInfo from "../classes/app-info";
import Assist from "../classes/assist";

export const Header = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const toggle = (e) => {
    setShowDropdown((prev) => !prev);
    e.preventDefault();
  };

  const logoutUser = (e) => {
    logout(user);
    e.preventDefault();
  };
  return (
    /* start header */
    <div className="page-header navbar navbar-fixed-top">
      <div className="page-header-inner">
        {/* logo start */}
        <div className="page-logo">
          <Link to={'#'}>
            <span className="logo-icon material-icons">
              people
            </span>
            <span className="logo-default">{AppInfo.appCode}</span>
          </Link>
        </div>
        {/* logo end */}
        {/* start mobile menu */}
        <a
          className="menu-toggler responsive-toggler"
          data-bs-toggle="collapse"
          data-bs-target=".navbar-collapse"
          onClick={toggleSidebar}
        >
          <span></span>
        </a>
        {/* end mobile menu */}
        {/* start header menu */}
        <div className="top-menu">
          <ul className="nav navbar-nav pull-right">
            {/* start notification dropdown */}
            <li
              className="dropdown dropdown-extended dropdown-notification"
              id="header_notification_bar"
            >
              <a
                className="dropdown-toggle"
                data-bs-toggle="dropdown"
                data-hover="dropdown"
                data-close-others="true"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="feather feather-bell"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
              </a>
            </li>
            {/* end notification dropdown */}
            {/* start manage user dropdown */}
            <li className="dropdown dropdown-user">
              <a
                className="dropdown-toggle"
                data-bs-toggle="dropdown"
                data-hover="dropdown"
                data-close-others="true"
                onClick={toggle}
              >
                <img alt="" className="img-circle" src="./images/dp.jpg" />
                <span className="username username-hide-on-mobile">
                  {user.name}
                </span>
              </a>
              <ul
                className={`dropdown-menu dropdown-menu-default ${
                  showDropdown ? "show" : ""
                }`}
              >
                {user.role == Assist.ROLE_MEMBER && <li>
                  <Link to="/account/profile">
                    <i className="icon-user"></i> Profile
                  </Link>
                </li>}
                <li className="divider"></li>
                <li>
                  <Link to="/account/security">
                    <i className="icon-lock"></i> Security
                  </Link>
                </li>
                <li>
                  <a
                    onClick={logoutUser}
                  >
                    <i className="icon-logout"></i> Log Out
                  </a>
                </li>
              </ul>
            </li>
            {/* end manage user dropdown */}
            <li className="dropdown dropdown-quick-sidebar-toggler">
              <a
                id="headerSettingButton"
                className="mdl-button mdl-js-button mdl-button--icon pull-right"
                data-upgraded=",MaterialButton"
              >
                <i className="material-icons">more_vert</i>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
