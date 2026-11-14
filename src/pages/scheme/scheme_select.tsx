import { useState, useEffect, useRef } from "react";
import { Titlebar } from "../../components/titlebar";
import { LoadPanel as PagePanel } from "devextreme-react/load-panel";
import Assist from "../../classes/assist";
import PageConfig from "../../classes/page-config";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// a friendly icon + accent colour per scheme code; anything unmapped falls back
const SCHEME_STYLES: Record<string, { icon: string; color: string }> = {
  TB: { icon: "fa-lungs", color: "#b91c1c" },
  VL: { icon: "fa-dna", color: "#7c3aed" },
  EID: { icon: "fa-child", color: "#0e7490" },
  BACT: { icon: "fa-bacteria", color: "#047857" },
};
const FALLBACK = { icon: "fa-vials", color: "#0d6e6e" };

const SchemeSelect = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [schemes, setSchemes] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);
  const hasRun = useRef(false);

  const pageConfig = new PageConfig(
    "Register for a Scheme",
    "",
    "",
    "Scheme",
    "",
    Assist.LABORATORY_ROLES,
  );

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    if (!Assist.checkPageAuditPermission(pageConfig, user)) {
      Assist.redirectUnauthorized(navigate);
      return;
    }

    setTimeout(() => {
      Assist.loadData("Schemes", "registration/schemes")
        .then((data: any) => {
          setSchemes(data || []);
          setLoading(false);
        })
        .catch((message) => {
          setLoading(false);
          Assist.showMessage(message, "error");
        });
    }, Assist.DEV_DELAY);
  }, []);

  return (
    <div id="pageRoot" className="page-content" style={{ minHeight: "862px" }}>
      <PagePanel
        shadingColor="rgba(0,0,0,0.4)"
        position={{ of: "#pageRoot" }}
        visible={loading}
        showIndicator={true}
        shading={true}
        showPane={true}
      />
      <Titlebar
        title={pageConfig.Title}
        section="Schemes"
        icon="th-large"
        url="#"
      />

      <p style={{ margin: "0 0 18px", color: "#6b7280" }}>
        Choose the EQA scheme you would like to register your facility for.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 18,
        }}
      >
        {schemes.map((s) => {
          const style = SCHEME_STYLES[s.code] || FALLBACK;
          return (
            <div
              key={s.id}
              onClick={() => navigate(`/facility/schemes/register/${s.id}`)}
              style={{
                cursor: "pointer",
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 14,
                padding: 22,
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                transition: "transform .12s ease, box-shadow .12s ease",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)";
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  background: `${style.color}1a`,
                  color: style.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 26,
                }}
              >
                <i className={`fa ${style.icon}`}></i>
              </div>
              <div style={{ fontWeight: 700, fontSize: 17, color: "#111827" }}>
                {s.name}
              </div>
              {s.provider_name && (
                <div style={{ fontSize: 13, color: "#6b7280" }}>
                  {s.provider_name}
                </div>
              )}
              <div style={{ marginTop: "auto", display: "flex", gap: 8, alignItems: "center" }}>
                <span
                  style={{
                    background: `${style.color}1a`,
                    color: style.color,
                    borderRadius: 999,
                    padding: "2px 10px",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {s.code}
                </span>
                <span style={{ fontSize: 12, color: "#6b7280" }}>
                  {s.method_count} method{s.method_count === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {!loading && schemes.length === 0 && (
        <p style={{ color: "#6b7280" }}>No schemes are available yet.</p>
      )}
    </div>
  );
};

export default SchemeSelect;
