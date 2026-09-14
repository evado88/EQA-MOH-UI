// src/Sidebar.jsx
import { useRef, useState } from "react";
import "./sidebaran.css";

function ExpandableGroup({ label, children }) {
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef(null);

  const toggle = () => setIsOpen(!isOpen);

  return (
    <div className={`nav-group ${isOpen ? "expanded" : ""}`}>
      <button
        className="nav-toggle"
        aria-expanded={isOpen}
        onClick={toggle}
      >
        <span>{label}</span>
        <svg
          className="chev"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 6 L14 10 L6 14 Z" />
        </svg>
      </button>

      <div
        ref={contentRef}
        className="nav-content"
        style={{
          height: isOpen ? contentRef.current?.scrollHeight : 0,
        }}
      >
        <div className="nav-list">{children}</div>
      </div>
    </div>
  );
}

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <h2>My App</h2>

      <ExpandableGroup label="Projects">
        <a className="nav-link" href="#">All Projects</a>
        <a className="nav-link" href="#">Create Project</a>
        <a className="nav-link" href="#">Archived</a>
      </ExpandableGroup>

      <ExpandableGroup label="Teams">
        <a className="nav-link" href="#">Engineering</a>
        <a className="nav-link" href="#">Design</a>
        <a className="nav-link" href="#">Customer Success</a>
        <a className="nav-link" href="#">All Projects</a>
        <a className="nav-link" href="#">Create Project</a>
        <a className="nav-link" href="#">Archived</a>
      </ExpandableGroup>

      <a className="nav-link" href="#">Settings</a>
    </aside>
  );
}