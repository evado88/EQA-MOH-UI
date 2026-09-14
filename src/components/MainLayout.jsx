// src/layouts/MainLayout.jsx
import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { Footer } from "./footer";

export default function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggle = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const collapseSidebar = () => {
    setIsSidebarOpen(false);
  };
  return (
    <div className="page-wrapper">
      <Header toggleSidebar={toggle}></Header>
      {/* start page container */}
      <div className="page-container">
        <Sidebar
          names={"Mike Jorge"}
          title={"Developer"}
          isOpen={isSidebarOpen}
          closeSidebar={collapseSidebar}
        ></Sidebar>
        {/* start page content */}
        <div className="page-content-wrapper">
          <Outlet />
        </div>
        {/* end page content */}
      </div>
      {/* end page container */}
      <Footer></Footer>
    </div>
  );
}
