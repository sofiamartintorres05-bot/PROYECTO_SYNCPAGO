import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      <div
        className={`sidebar-overlay${sidebarOpen ? " open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <div className="main-wrap">
        <Topbar onToggleSidebar={() => setSidebarOpen((v) => !v)} />

        <main className="content">
          <Outlet />
        </main>

        <footer
          style={{
            padding: "16px 28px",
            fontSize: "0.78rem",
            color: "var(--gray-400)",
            textAlign: "center",
            borderTop: "1px solid var(--gray-200)",
          }}
        >
          © 2026 SYNCPAGO — Todos los derechos reservados
        </footer>
      </div>
    </div>
  );
}