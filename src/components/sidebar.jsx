import React, { useState, useRef, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { navigation } from "../navigation/app-navigation";
import { useAuth } from "../context/AuthContext";
import './sidebar.css'

function ExpandableGroup({
  openSections,
  toggleSection,
  navitem,
  collapseMainSidebar,
}) {
  const contentRef = useRef(null);
  const location = useLocation();

  const handleLinkClick = (event) => {
    collapseMainSidebar();
    event.stopPropagation(); // Prevent event from bubbling to parent
  };

  return (
    <li
      className={`nav-item ${openSections.includes(navitem.key) ? "open" : ""}`}
      onClick={() => toggleSection(navitem.key)}
    >
      <Link to={navitem.path} className="nav-link nav-toggle">
        {" "}
        <i className={navitem.icon}></i>
        <span className="title">{navitem.text}</span>
        <span className="selected"></span>
        <span
          className={`arrow ${
            openSections.includes(navitem.key) ? "open" : ""
          }`}
        ></span>
      </Link>
      <ul
        ref={contentRef}
        className={`sub-menu nav-content ${
          openSections.includes(navitem.key) ? "expanded" : ""
        }`}
        style={{
          height: openSections.includes(navitem.key)
            ? contentRef.current?.scrollHeight
            : 0,
          display: "block",
        }}
      >
        {navitem.items.map((item, index) => (
          <li
            className={`nav-item ${index} ${
              item.path == location.pathname ? "active" : ""
            }`}
            key={item.key}
          >
            <Link
              to={item.path}
              className="nav-link "
              onClick={handleLinkClick}
            >
              {" "}
              <span className="title">{item.text}</span>
              <span className="selected"></span>
            </Link>
          </li>
        ))}
      </ul>
    </li>
  );
}

export const Sidebar = ({ names, title, isOpen, closeSidebar }) => {
  const { user } = useAuth();
  const [menuItems, setMenuItems] = useState([]);
  const [openSections, setOpenSections] = useState([]);
  const location = useLocation();

  useEffect(() => {
    const userMenu = navigation.filter((mitem) =>
      mitem.roles.includes(user.role)
    );

    setMenuItems(userMenu);
    
  }, [user]);

  const toggle = (id) => {
    if (openSections.includes(id)) {
      // Remove the section if it is already open
      setOpenSections(openSections.filter((secId) => secId !== id));
    } else {
      // Add the section
      setOpenSections([...openSections, id]);
    }
  };

  const clearSidebar = () => {
    //only reset the sidebar on mobile platforms
    //isopen will be set when the toggle is visible and a user clicks it
    if (isOpen) {
      setOpenSections([]);
      closeSidebar();
    }
  };

  return (
    /* start sidebar menu */
    <div className="sidebar-container">
      <div
        className={`sidemenu-container navbar-collapse collapse fixed-menu ${
          isOpen ? "show" : ""
        }`}
      >
        <div className="left-sidemenu">
            <ul
              className="sidemenu page-header-fixed"
            >
              <li className="sidebar-toggler-wrapper hide" key={"toggle"}>
                <div className="sidebar-toggler">
                  <span></span>
                </div>
              </li>
              {isOpen && (
                <li className="sidebar-user-panel">
                  <div className="sidebar-user">
                    <div className="sidebar-user-picture"></div>
                    <div className="sidebar-user-details"></div>
                  </div>
                </li>
              )}
              {menuItems.map((navitem) => {
                if (navitem.items.length == 0) {
                  return (
                    <li
                      className={
                        navitem.path == location.pathname ? "active" : ""
                      }
                      key={navitem.key}
                    >
                      <Link
                        to={navitem.path}
                        className="nav-link"
                        onClick={clearSidebar}
                      >
                        <i className={navitem.icon}></i>
                        <span className="title">{navitem.text}</span>
                      </Link>
                    </li>
                  );
                } else {
                  return (
                    <ExpandableGroup
                      navitem={navitem}
                      key={navitem.key}
                      openSections={openSections}
                      toggleSection={toggle}
                      collapseMainSidebar={clearSidebar}
                    ></ExpandableGroup>
                  );
                }
              })}
            </ul>
          </div>
      </div>
    </div>
  );
};
