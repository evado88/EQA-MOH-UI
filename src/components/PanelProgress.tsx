import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Assist from "../classes/assist";

interface Props {
  resultForm: string;       // e.g. "hiv_eid"
  resultId?: number | string;
  editBase: string;         // e.g. "/facility/hiv-eid-results/edit"
}

/**
 * Shows a lab how far through a panel's samples it is ("3 of 5 sample results
 * entered") and lets it jump straight to any sample - A1, A2, ... - including
 * the next one still to do.
 */
export const PanelProgress = ({ resultForm, resultId, editBase }: Props) => {
  const navigate = useNavigate();
  const [nav, setNav] = useState<any>(null);

  useEffect(() => {
    if (!resultId) return;
    Assist.loadData(
      "Panel progress",
      `result-navigation?result_form=${resultForm}&result_id=${resultId}`,
    )
      .then((d: any) => setNav(d))
      .catch(() => {});
  }, [resultForm, resultId]);

  if (!nav || !nav.total) return null;

  const pct = Math.round((nav.entered / nav.total) * 100);

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        padding: "12px 16px",
        margin: "0 0 14px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <strong style={{ color: nav.entered === nav.total ? "#047857" : "#111827" }}>
          {nav.entered} of {nav.total} sample results entered
        </strong>
        {nav.next_pending_id && (
          <a
            style={{ cursor: "pointer", color: "#0d6e6e", fontWeight: 600 }}
            onClick={() => navigate(`${editBase}/${nav.next_pending_id}`)}
          >
            Next sample to enter →
          </a>
        )}
      </div>

      <div style={{ height: 6, background: "#eef0f2", borderRadius: 999, margin: "8px 0 10px" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: "#0d6e6e", borderRadius: 999 }} />
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {nav.samples.map((s: any) => (
          <button
            key={s.id}
            type="button"
            onClick={() => !s.is_current && navigate(`${editBase}/${s.id}`)}
            title={`${s.sample_name}: ${s.status_name}`}
            style={{
              border: s.is_current ? "2px solid #0d6e6e" : "1px solid #d1d5db",
              background: s.entered ? "#047857" : "#fff",
              color: s.entered ? "#fff" : "#374151",
              borderRadius: 8,
              padding: "4px 12px",
              fontSize: 13,
              fontWeight: 600,
              cursor: s.is_current ? "default" : "pointer",
            }}
          >
            {s.sample_name}
            {s.entered ? " ✓" : ""}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PanelProgress;
