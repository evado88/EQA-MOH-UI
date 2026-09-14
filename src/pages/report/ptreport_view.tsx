import { useState, useEffect, useMemo, useRef } from "react";
import { Titlebar } from "../../components/titlebar";
import { Card } from "../../components/card";
import { Row } from "../../components/row";
import { Col } from "../../components/column";
import SelectBox from "devextreme-react/select-box";
import Button from "devextreme-react/button";
import { LoadIndicator } from "devextreme-react/load-indicator";
import { LoadPanel } from "devextreme-react/load-panel";
import Assist from "../../classes/assist";
import PageConfig from "../../classes/page-config";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/**
 * Holds the PT performance report.
 *
 * The document itself is rendered by XtraReports in the ASP.NET reporting
 * service; this page narrows down to one participant and asks that service for
 * the PDF, then gives the user the things they expect around it - view,
 * download, print, open in a new tab, and re-render after a correction.
 *
 * The narrowing runs provider -> scheme -> round -> participant, because a
 * user works within one scheme and has no business with the others. The
 * provider and scheme are remembered between visits for the same reason.
 */

//where the last provider and scheme choice is kept between visits
const CHOICE_KEY = "pt-report-scope";

const PTReportView = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { eId } = useParams();

  //a lab only ever sees its own reports; provider staff choose a participant
  const isLab = Assist.isLaboratoryUser(user);
  const labId = Assist.getLaboratoryId(user);

  //every scored enrolment this user may look at
  const [rows, setRows] = useState<Array<any>>([]);

  const [providerId, setProviderId] = useState<undefined | number>(undefined);
  const [schemeId, setSchemeId] = useState<undefined | number>(undefined);
  const [cycleId, setCycleId] = useState<undefined | number>(undefined);
  const [enrollmentId, setEnrollmentId] = useState<undefined | number>(
    eId ? Number(eId) : undefined,
  );

  const [meta, setMeta] = useState<null | any>(null);
  const [pdfUrl, setPdfUrl] = useState<undefined | string>(undefined);
  const [filename, setFilename] = useState("PT-Report.pdf");

  const [loading, setLoading] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState<undefined | string>(undefined);
  const hasRun = useRef(false);
  const pdfUrlRef = useRef<undefined | string>(undefined);

  const pageConfig = new PageConfig(
    "PT Performance Report",
    "",
    "",
    "PT Performance Report",
    "",
    isLab ? Assist.LABORATORY_ROLES : Assist.ADMIN_ROLES,
  );

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    if (!Assist.checkPageAuditPermission(pageConfig, user)) {
      Assist.redirectUnauthorized(navigate);
      return;
    }

    loadScope();

    //release the blob when the page goes away, or it leaks for the session
    return () => {
      if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current);
    };
  }, []);

  useEffect(() => {
    if (enrollmentId) renderReport(enrollmentId);
  }, [enrollmentId]);

  const rememberScope = (provider?: number, scheme?: number) => {
    try {
      localStorage.setItem(
        CHOICE_KEY,
        JSON.stringify({ provider: provider, scheme: scheme }),
      );
    } catch (x) {
      //a blocked or full store is not worth failing the page over
    }
  };

  const recallScope = () => {
    try {
      const raw = localStorage.getItem(CHOICE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (x) {
      return null;
    }
  };

  const loadScope = () => {
    setLoading(true);

    //only rounds that have been scored have a report
    const url = isLab
      ? `evaluations/report/enrollment-performance?lab_id=${labId}`
      : `evaluations/report/enrollment-performance`;

    Assist.loadData("Available Reports", url)
      .then((res: any) => {
        setLoading(false);
        setRows(res);
        preselect(res);
      })
      .catch((message) => {
        setLoading(false);
        setError(message);
        Assist.showMessage(message, "error");
      });
  };

  /** Opens the page where the user last worked, or on the only choice there is. */
  const preselect = (all: Array<any>) => {
    if (all.length === 0) return;

    //a deep link wins: fill the cascade in from the enrolment it names
    if (eId) {
      const row = all.find((r) => r.enrollment_id === Number(eId));
      if (row) {
        setProviderId(row.provider_id);
        setSchemeId(row.scheme_id);
        setCycleId(row.pt_cycle_id);
        return;
      }
    }

    const remembered = recallScope();
    const providers = unique(all, "provider_id");

    const provider =
      remembered && providers.some((p: any) => p.id === remembered.provider)
        ? remembered.provider
        : providers.length === 1
          ? providers[0].id
          : undefined;

    if (provider === undefined) return;
    setProviderId(provider);

    const schemes = unique(
      all.filter((r) => r.provider_id === provider),
      "scheme_id",
    );

    const scheme =
      remembered && schemes.some((s: any) => s.id === remembered.scheme)
        ? remembered.scheme
        : schemes.length === 1
          ? schemes[0].id
          : undefined;

    if (scheme !== undefined) setSchemeId(scheme);
  };

  /** Distinct options for one level of the cascade, newest round first. */
  const unique = (source: Array<any>, idField: string) => {
    const seen = new Map<number, any>();

    source.forEach((row) => {
      const id = row[idField];
      if (id == null || seen.has(id)) return;

      if (idField === "provider_id") {
        seen.set(id, { id: id, name: row.provider_name });
      } else if (idField === "scheme_id") {
        seen.set(id, { id: id, name: row.scheme_name });
      } else {
        seen.set(id, {
          id: id,
          name: `${row.cycle_code} - ${row.cycle_name}`,
          report_date: row.report_date,
        });
      }
    });

    return Array.from(seen.values());
  };

  const providers = useMemo(() => unique(rows, "provider_id"), [rows]);

  const schemes = useMemo(
    () =>
      providerId == null
        ? []
        : unique(
            rows.filter((r) => r.provider_id === providerId),
            "scheme_id",
          ),
    [rows, providerId],
  );

  const cycles = useMemo(
    () =>
      schemeId == null
        ? []
        : unique(
            rows.filter((r) => r.scheme_id === schemeId),
            "pt_cycle_id",
          ).sort((a: any, b: any) =>
            String(b.report_date ?? "").localeCompare(
              String(a.report_date ?? ""),
            ),
          ),
    [rows, schemeId],
  );

  //within a round a lab picks its method; provider staff pick the participant
  const participants = useMemo(
    () =>
      cycleId == null
        ? []
        : rows
            .filter((r) => r.pt_cycle_id === cycleId)
            .map((r) => ({
              ...r,
              display: isLab
                ? r.method_name
                : `${r.lab_code} ${r.lab_name} (${r.method_name})`,
            }))
            .sort((a: any, b: any) => a.display.localeCompare(b.display)),
    [rows, cycleId, isLab],
  );

  //choosing higher up the cascade clears everything below it
  const onProviderChange = (value: number) => {
    setProviderId(value);
    setSchemeId(undefined);
    setCycleId(undefined);
    clearReport();
    rememberScope(value, undefined);
  };

  const onSchemeChange = (value: number) => {
    setSchemeId(value);
    setCycleId(undefined);
    clearReport();
    rememberScope(providerId, value);
  };

  const onCycleChange = (value: number) => {
    setCycleId(value);
    clearReport();
  };

  //when only one option exists at a level, take it
  useEffect(() => {
    if (schemeId == null && schemes.length === 1) setSchemeId(schemes[0].id);
  }, [schemes]);

  useEffect(() => {
    if (cycleId == null && cycles.length === 1) setCycleId(cycles[0].id);
  }, [cycles]);

  useEffect(() => {
    if (enrollmentId == null && participants.length === 1) {
      setEnrollmentId(participants[0].enrollment_id);
    }
  }, [participants]);

  const clearReport = () => {
    setEnrollmentId(undefined);
    setMeta(null);
    setError(undefined);
    if (pdfUrlRef.current) {
      URL.revokeObjectURL(pdfUrlRef.current);
      pdfUrlRef.current = undefined;
    }
    setPdfUrl(undefined);
  };

  const renderReport = (id: number) => {
    setRendering(true);
    setError(undefined);

    if (pdfUrlRef.current) {
      URL.revokeObjectURL(pdfUrlRef.current);
      pdfUrlRef.current = undefined;
      setPdfUrl(undefined);
    }

    Promise.all([
      Assist.loadData("Report Details", `reports/pt-performance/${id}/meta`),
      Assist.loadPdf("PT Performance Report", `reports/pt-performance/${id}`),
    ])
      .then(([details, pdf]: [any, any]) => {
        setRendering(false);
        setMeta(details);
        pdfUrlRef.current = pdf.url;
        setPdfUrl(pdf.url);
        setFilename(pdf.filename);
      })
      .catch((message) => {
        setRendering(false);
        setError(message);
        Assist.showMessage(message, "error");
      });
  };

  const onDownload = () => {
    if (!pdfUrl) return;

    const link = document.createElement("a");
    link.href = pdfUrl;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Assist.auditAction(
      user.userid,
      user.sub,
      user.jti,
      pageConfig.Title,
      enrollmentId ?? null,
      "Download",
      null,
      { report_number: meta?.report_number },
      null,
    );
  };

  const onPrint = () => {
    const frame: any = document.getElementById("reportFrame");
    if (frame && frame.contentWindow) {
      frame.contentWindow.focus();
      frame.contentWindow.print();
    } else {
      window.open(pdfUrl, "_blank");
    }
  };

  const onOpenTab = () => {
    if (pdfUrl) window.open(pdfUrl, "_blank");
  };

  const statusColour = (performance: string) => {
    if (performance === "Satisfactory") return "#2e7d32";
    if (performance === "Unsatisfactory") return "#c0392b";
    return "#8a6d3b";
  };

  const cascade = (
    label: string,
    data: Array<any>,
    value: any,
    onChange: any,
    displayExpr: string,
    valueExpr: string,
    disabledWhen: boolean,
    emptyText: string,
  ) => (
    <div className="dx-field">
      <div className="dx-field-label">{label}</div>
      <SelectBox
        className="dx-field-value"
        placeholder={disabledWhen ? "" : `Choose a ${label.toLowerCase()}`}
        dataSource={data}
        displayExpr={displayExpr}
        valueExpr={valueExpr}
        searchEnabled={data.length > 6}
        deferRendering={false}
        value={value}
        disabled={rendering || disabledWhen}
        noDataText={emptyText}
        onValueChange={onChange}
      />
    </div>
  );

  return (
    <div id="pageRoot" className="page-content">
      <LoadPanel
        shadingColor="rgba(0,0,0,0.4)"
        position={{ of: "#pageRoot" }}
        visible={loading}
        showIndicator={true}
        shading={true}
        showPane={true}
        hideOnOutsideClick={false}
      />
      <Titlebar
        title={pageConfig.Title}
        section={"PT Results"}
        icon={"file"}
        url="/"
      ></Titlebar>

      <Row>
        <Col sz={12} sm={12} lg={4}>
          <Card title="Choose a Report" showHeader={true}>
            <div className="form">
              <div className="dx-fieldset">
                {cascade(
                  "Provider",
                  providers,
                  providerId,
                  onProviderChange,
                  "name",
                  "id",
                  false,
                  "No scored rounds yet",
                )}
                {cascade(
                  "Scheme",
                  schemes,
                  schemeId,
                  onSchemeChange,
                  "name",
                  "id",
                  providerId == null,
                  "No schemes for this provider",
                )}
                {cascade(
                  "Round",
                  cycles,
                  cycleId,
                  onCycleChange,
                  "name",
                  "id",
                  schemeId == null,
                  "No scored rounds for this scheme",
                )}
                {cascade(
                  isLab ? "Method" : "Participant",
                  participants,
                  enrollmentId,
                  (value: number) => setEnrollmentId(value),
                  "display",
                  "enrollment_id",
                  cycleId == null,
                  isLab
                    ? "You did not take part in this round"
                    : "No participants in this round",
                )}
              </div>

              {meta != null && (
                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">Details</div>
                  <div className="dx-field">
                    <div className="dx-field-label">Report Number</div>
                    <div className="dx-field-value-static">
                      <strong>{meta.report_number}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Laboratory</div>
                    <div className="dx-field-value-static">
                      <strong>
                        {meta.lab_code} {meta.lab_name}
                      </strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Method</div>
                    <div className="dx-field-value-static">
                      <strong>{meta.method_name}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Report Date</div>
                    <div className="dx-field-value-static">
                      <strong>{Assist.formatDateLong(meta.report_date)}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Score</div>
                    <div className="dx-field-value-static">
                      <strong>
                        {meta.total_score} of {meta.max_score}
                        {meta.percent_score_display != null
                          ? ` (${meta.percent_score_display}%)`
                          : ""}
                      </strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Performance</div>
                    <div className="dx-field-value-static">
                      <strong
                        style={{
                          color: statusColour(meta.overall_performance),
                        }}
                      >
                        {meta.overall_performance}
                      </strong>
                    </div>
                  </div>
                  {meta.reason_for_no_evaluation && (
                    <div className="dx-field">
                      <div className="dx-field-label">Reason</div>
                      <div className="dx-field-value-static">
                        {meta.reason_for_no_evaluation}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {pdfUrl && (
                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">Actions</div>
                  <div className="dx-field">
                    <div className="dx-field-label"></div>
                    <div className="dx-field-value">
                      <Button
                        width="100%"
                        type="default"
                        icon="download"
                        text="Download PDF"
                        onClick={onDownload}
                      />
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label"></div>
                    <div className="dx-field-value">
                      <Button
                        width="100%"
                        type="normal"
                        icon="print"
                        text="Print"
                        onClick={onPrint}
                      />
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label"></div>
                    <div className="dx-field-value">
                      <Button
                        width="100%"
                        type="normal"
                        icon="export"
                        text="Open in New Tab"
                        onClick={onOpenTab}
                      />
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label"></div>
                    <div className="dx-field-value">
                      <Button
                        width="100%"
                        type="normal"
                        icon="refresh"
                        text="Re-render"
                        disabled={rendering}
                        onClick={() =>
                          enrollmentId && renderReport(enrollmentId)
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              {meta?.renderer === "placeholder" && (
                <div className="dx-fieldset">
                  <div className="dx-field">
                    <div className="dx-field-value-static">
                      <small>
                        This document comes from the placeholder renderer. The
                        production report is produced by XtraReports from the
                        reporting service; point{" "}
                        <code>AppInfo.reportApiUrl</code> at it to switch over.
                      </small>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </Col>

        <Col sz={12} sm={12} lg={8}>
          <Card title="Document" showHeader={true}>
            {rendering && (
              <div style={{ padding: "60px", textAlign: "center" }}>
                <LoadIndicator visible={true} height={40} width={40} />
                <div style={{ marginTop: "12px" }}>Rendering the report...</div>
              </div>
            )}

            {!rendering && error && (
              <div style={{ padding: "40px", textAlign: "center" }}>
                <div style={{ color: "#c0392b", marginBottom: "12px" }}>
                  {error}
                </div>
                <Button
                  type="default"
                  text="Try Again"
                  icon="refresh"
                  onClick={() => enrollmentId && renderReport(enrollmentId)}
                />
              </div>
            )}

            {!rendering && !error && !pdfUrl && (
              <div
                style={{ padding: "60px", textAlign: "center", color: "#888" }}
              >
                {rows.length === 0
                  ? "No rounds have been scored yet."
                  : schemeId == null
                    ? "Choose a provider and scheme to begin."
                    : cycleId == null
                      ? "Choose a round."
                      : `Choose ${isLab ? "a method" : "a participant"} to render its report.`}
              </div>
            )}

            {!rendering && !error && pdfUrl && (
              <iframe
                id="reportFrame"
                title="PT Performance Report"
                src={pdfUrl}
                style={{
                  width: "100%",
                  height: "1000px",
                  border: "1px solid #ddd",
                }}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PTReportView;
