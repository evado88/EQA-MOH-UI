import { useState, useEffect, useRef } from "react";
import { Titlebar } from "../../../components/titlebar";
import { Card } from "../../../components/card";
import { Row } from "../../../components/row";
import { Col } from "../../../components/column";
import { Validator, RequiredRule } from "devextreme-react/validator";
import Button from "devextreme-react/button";
import { LoadPanel } from "devextreme-react/load-panel";
import { useAuth } from "../../../context/AuthContext";
import PageConfig from "../../../classes/page-config";
import Assist from "../../../classes/assist";
import { LoadIndicator } from "devextreme-react/load-indicator";
import { useNavigate, useParams } from "react-router-dom";
import AppInfo from "../../../classes/app-info";
import { confirm } from "devextreme/ui/dialog";
import TextArea from "devextreme-react/text-area";
import SelectBox from "devextreme-react/select-box";
import DateBox from "devextreme-react/date-box";
import ValidationSummary from "devextreme-react/validation-summary";

// colour coding for round/lab progress
const STATUS_COLOR: Record<string, string> = {
  complete: "#047857", // green
  in_progress: "#d97706", // amber
  not_started: "#b91c1c", // red
};
const STATUS_LABEL: Record<string, string> = {
  complete: "Complete",
  in_progress: "In progress",
  not_started: "Not started",
};

const AdminPTCycle = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { eId } = useParams();

  const [cycle, setCycle] = useState<null | any>(null);
  const [documents, setDocuments] = useState<Array<any>>([]);
  const [extensions, setExtensions] = useState<Array<any>>([]);
  const [stats, setStats] = useState<any>(null);

  // extend-dates form
  const [extField, setExtField] = useState<string | undefined>(undefined);
  const [extDate, setExtDate] = useState<string | undefined>(undefined);
  const [extReason, setExtReason] = useState<string>("");

  const EXTEND_FIELDS = [
    { id: "closing_date", name: "Enrollment closing date" },
    { id: "result_submission_due_date", name: "Result submission due date" },
  ];

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const [stage, setStage] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [createdBy, setCreatedBy] = useState("");
  const [approvalLevels, setApprovalLevels] = useState(1);
  const [stageId, setStageId] = useState(1);

  const [rejectionReason, setRejectionReason] = useState("");
  const [approvalComments, setApprovalComments] = useState("");
  const hasRun = useRef(false);

  const pageConfig = new PageConfig(
    `${status == "Approved" ? "View" : "Review"} PT Cycle`,
    "",
    "",
    "PT Cycle",
    `pt-cycles/review-update/${eId}`,
    Assist.ADMIN_ROLES,
  );
  pageConfig.Id = eId == undefined ? 0 : Number(eId);

  const load = () => {
    setLoading(true);
    Promise.all([
      Assist.loadData(pageConfig.Title, `pt-cycles/id/${pageConfig.Id}`),
      Assist.loadData("Documents", `pt-cycles/documents/${pageConfig.Id}`),
      Assist.loadData("Extensions", `pt-cycles/extensions/${pageConfig.Id}`),
      Assist.loadData("Statistics", `pt-cycles/statistics/${pageConfig.Id}`),
    ])
      .then(([data, docs, exts, st]: [any, any, any, any]) => {
        setLoading(false);
        setCycle(data.ptcycle);
        setStats(st);
        setStatus(data.ptcycle.status.status_name);
        setStage(data.ptcycle.stage.stage_name);
        setStageId(data.ptcycle.stage_id);
        setApprovalLevels(data.ptcycle.approval_levels);
        setCreatedBy(data.ptcycle.user?.email ?? data.ptcycle.created_by);
        setDocuments(docs || []);
        setExtensions(exts || []);
        setError(false);
      })
      .catch((message) => {
        setLoading(false);
        setError(true);
        Assist.showMessage(message, "error");
      });
  };

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    if (!Assist.checkPageAuditPermission(pageConfig, user)) {
      Assist.redirectUnauthorized(navigate);
      return;
    }
    if (pageConfig.Id != 0) setTimeout(load, Assist.DEV_DELAY);
  }, []);

  const isReviewed = () => status == "Approved" || status == "Rejected";
  const isApproved = () => status == "Approved";
  const requiresApproval = () =>
    status == "Submitted" &&
    ["Submitted", "First Approval", "Primary Approval", "Second Approval", "Secondary Approval"].includes(stage);

  const dateRow = (label: string, value: any) => (
    <div className="dx-field">
      <div className="dx-field-label">{label}</div>
      <div className="dx-field-value-static">
        <strong>{value ? Assist.getDateText(value) : "—"}</strong>
      </div>
    </div>
  );

  // ---- manual lifecycle actions ----
  const act = (url: string, confirmText: string, done: string) => {
    confirm(confirmText, "Confirm").then((ok) => {
      if (!ok) return;
      setSaving(true);
      Assist.postPutData(pageConfig.Title, url, { user_id: user.userid }, 1)
        .then((data: any) => {
          setSaving(false);
          Assist.showMessage(data?.message || done, "success");
          load();
        })
        .catch((message) => {
          setSaving(false);
          Assist.showMessage(message, "error");
        });
    });
  };

  const onShip = () =>
    act(
      `pt-cycles/samples-shipped/${eId}`,
      "Mark samples as shipped? This opens a result form for every sample of every accepted enrolment.",
      "Samples marked shipped.",
    );

  const onPublish = () =>
    act(
      `pt-cycles/publish-reports/${eId}`,
      "Publish reports? This scores the round and makes the reports available to the laboratories.",
      "Reports published.",
    );

  // ---- extend dates ----
  const onExtend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extField || !extDate) {
      Assist.showMessage("Choose the date to extend and the new date", "error");
      return;
    }
    const label = EXTEND_FIELDS.find((f) => f.id === extField)?.name;
    confirm(
      `Extend the ${label}? All enrolled laboratories will be notified.`,
      "Confirm extension",
    ).then((ok) => {
      if (!ok) return;
      setSaving(true);
      Assist.postPutData(
        pageConfig.Title,
        `pt-cycles/extend/${eId}`,
        { user_id: user.userid, field: extField, new_date: extDate, reason: extReason || null },
        1,
      )
        .then((data: any) => {
          setSaving(false);
          Assist.showMessage(data?.message || "Date extended.", "success");
          setExtField(undefined);
          setExtDate(undefined);
          setExtReason("");
          load();
        })
        .catch((message) => {
          setSaving(false);
          Assist.showMessage(message, "error");
        });
    });
  };

  // ---- approval / rejection ----
  const submitReview = (action: number, comments: string, verb: string) => {
    setSaving(true);
    Assist.postPutData(
      pageConfig.Title,
      pageConfig.UpdateUrl,
      { user_id: user.userid, review_action: action, comments },
      1,
    )
      .then(() => {
        setSaving(false);
        Assist.showMessage(`You have successfully ${verb} the ${pageConfig.Single}!`, "success");
        navigate(`/admin/pt-cycles/list`);
      })
      .catch((message) => {
        setSaving(false);
        Assist.showMessage(message, "error");
      });
  };

  const onApprove = (e: React.FormEvent) => {
    e.preventDefault();
    confirm(`Approve this ${pageConfig.Single}?`, "Confirm").then(
      (ok) => ok && submitReview(Assist.REVIEW_ACTION_APPROVE, approvalComments, "approved"),
    );
  };
  const onReject = (e: React.FormEvent) => {
    e.preventDefault();
    confirm(`Reject this ${pageConfig.Single}?`, "Confirm").then(
      (ok) => ok && submitReview(Assist.REVIEW_ACTION_REJECT, rejectionReason, "rejected"),
    );
  };

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
      <Titlebar title={pageConfig.Title} section="PT Calendar" icon="event" url="/admin/pt-cycles/list" />

      <Row>
        <Col sz={12} sm={12} lg={7}>
          <Card title="Round" showHeader={true}>
            {cycle != null && (
              <div className="form">
                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">Details</div>
                  <div className="dx-field">
                    <div className="dx-field-label">Scheme</div>
                    <div className="dx-field-value-static"><strong>{cycle.scheme.name}</strong></div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Code</div>
                    <div className="dx-field-value-static"><strong>{cycle.code}</strong></div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Lifecycle Status</div>
                    <div className="dx-field-value-static"><strong>{cycle.ptcyclestatus.name}</strong></div>
                  </div>
                </div>

                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">Schedule</div>
                  {dateRow("Enrollment opening", cycle.effective_date)}
                  {dateRow("Enrollment closing", cycle.closing_date)}
                  {dateRow("Sample shipping", cycle.shipping_date)}
                  {dateRow("Test event start", cycle.test_event_start_date)}
                  {dateRow("Test event stop", cycle.test_event_stop_date)}
                  {dateRow("Result submission due", cycle.result_submission_due_date)}
                  {dateRow("Report availability", cycle.reports_availability_date)}
                </div>

                {cycle.notes && (
                  <div className="dx-fieldset">
                    <div className="dx-fieldset-header">Notes</div>
                    <div className="dx-field">
                      <div className="dx-field-value-static">{cycle.notes}</div>
                    </div>
                  </div>
                )}

                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">Documents</div>
                  <div className="dx-field">
                    <div className="dx-field-value-static">
                      {documents.length === 0 ? (
                        "No documents attached."
                      ) : (
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                          {documents.map((doc: any) => (
                            <li key={doc.id}>
                              <a
                                href={`${AppInfo.apiUrl}static/${doc.path}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {doc.name}
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>

                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">Submission</div>
                  <div className="dx-field">
                    <div className="dx-field-label">Approval Status</div>
                    <div className="dx-field-value-static"><strong>{cycle.status.status_name}</strong></div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Approval Stage</div>
                    <div className="dx-field-value-static"><strong>{cycle.stage.stage_name}</strong></div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Created</div>
                    <div className="dx-field-value-static">
                      <strong>{Assist.getDateText(cycle.created_at)}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </Col>

        <Col sz={12} sm={12} lg={5}>
          {stats != null && (
            <Card title="Round Statistics" showHeader={true}>
              <div className="form">
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: 17,
                      color: "#fff",
                      background: STATUS_COLOR[stats.status] || "#6b7280",
                    }}
                  >
                    {stats.completion_pct}%
                  </div>
                  <div>
                    <div style={{ fontWeight: 700 }}>
                      {stats.entered} of {stats.total} sample results entered
                    </div>
                    <div style={{ fontSize: 13, color: "#6b7280" }}>
                      {STATUS_LABEL[stats.status]} ·{" "}
                      {stats.labs_complete} of {stats.lab_count} lab(s) complete
                    </div>
                  </div>
                </div>

                <div style={{ height: 8, background: "#eef0f2", borderRadius: 999, marginBottom: 12 }}>
                  <div
                    style={{
                      width: `${stats.completion_pct}%`,
                      height: "100%",
                      borderRadius: 999,
                      background: STATUS_COLOR[stats.status] || "#6b7280",
                    }}
                  />
                </div>

                {stats.total === 0 ? (
                  <p style={{ color: "#6b7280", fontSize: 13 }}>
                    No result sheets yet — ship the samples to open them.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {stats.labs.map((l: any) => (
                      <div
                        key={l.lab_id}
                        style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}
                      >
                        <span
                          title={STATUS_LABEL[l.status]}
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: STATUS_COLOR[l.status],
                            flex: "0 0 auto",
                          }}
                        />
                        <span style={{ flex: 1 }}>{l.lab_name}</span>
                        <span style={{ color: "#6b7280" }}>
                          {l.entered}/{l.total}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}
          {cycle != null && isApproved() && (
            <Card title="Round Actions" showHeader={true}>
              <div className="form">
                {cycle.pt_cyle_status_id >= Assist.PT_CYCLE_SAMPLES_SHIPPED && (
                  <div className="dx-field">
                    <div className="dx-field-label"></div>
                    <div className="dx-field-value">
                      <Button
                        width="100%"
                        type="normal"
                        icon="chart"
                        text="Open Evaluation"
                        onClick={() => navigate(`/admin/pt-cycles/evaluation/${eId}`)}
                      />
                    </div>
                  </div>
                )}

                {!cycle.samples_shipped && (
                  <div className="dx-field">
                    <div className="dx-field-label"></div>
                    <div className="dx-field-value">
                      <Button
                        width="100%"
                        type={saving ? "normal" : "default"}
                        disabled={saving}
                        icon="box"
                        onClick={onShip}
                      >
                        <LoadIndicator className="button-indicator" visible={saving} />
                        <span className="dx-button-text">Mark Samples Shipped</span>
                      </Button>
                    </div>
                  </div>
                )}

                {cycle.samples_shipped && !cycle.reports_published && (
                  <div className="dx-field">
                    <div className="dx-field-label"></div>
                    <div className="dx-field-value">
                      <Button
                        width="100%"
                        type={saving ? "normal" : "success"}
                        disabled={saving}
                        icon="exportpdf"
                        onClick={onPublish}
                      >
                        <LoadIndicator className="button-indicator" visible={saving} />
                        <span className="dx-button-text">Publish Reports</span>
                      </Button>
                    </div>
                  </div>
                )}

                {cycle.reports_published && (
                  <div className="dx-field">
                    <div className="dx-field-value-static">
                      Reports are published and available to the laboratories.
                    </div>
                  </div>
                )}
                <div className="dx-field">
                  <div className="dx-field-value-static">
                    <small style={{ color: "#6b7280" }}>
                      Enrolment phases follow the dates automatically. Shipping and
                      publishing are manual because they open result forms and run
                      scoring.
                    </small>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {cycle != null && isApproved() && !cycle.reports_published && (
            <Card title="Extend Dates" showHeader={true}>
              <form id="formExtend" onSubmit={onExtend}>
                <div className="dx-fieldset">
                  <div className="dx-field">
                    <div className="dx-field-label">Date to extend</div>
                    <SelectBox
                      className="dx-field-value"
                      placeholder="Choose a date"
                      dataSource={EXTEND_FIELDS}
                      displayExpr="name"
                      valueExpr="id"
                      value={extField}
                      disabled={saving}
                      onValueChange={setExtField}
                    />
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">New date</div>
                    <DateBox
                      className="dx-field-value"
                      displayFormat={"dd MMMM yyyy"}
                      dateSerializationFormat="yyyy-MM-dd"
                      value={extDate}
                      disabled={saving}
                      onValueChange={setExtDate}
                    />
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Reason</div>
                    <TextArea
                      className="dx-field-value"
                      placeholder="Why is the date being extended?"
                      height={60}
                      value={extReason}
                      disabled={saving}
                      onValueChange={setExtReason}
                    />
                  </div>
                </div>
                <div className="dx-field">
                  <div className="dx-field-label"></div>
                  <Button
                    width="100%"
                    useSubmitBehavior={true}
                    type={saving ? "normal" : "default"}
                    disabled={saving}
                  >
                    <LoadIndicator className="button-indicator" visible={saving} />
                    <span className="dx-button-text">Extend &amp; notify participants</span>
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {extensions.length > 0 && (
            <Card title="Extension History" showHeader={true}>
              <div className="form">
                {extensions.map((x: any) => (
                  <div
                    key={x.id}
                    style={{
                      borderBottom: "1px solid #eef0f2",
                      padding: "8px 0",
                      fontSize: 13,
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{x.field_label}</div>
                    <div>
                      {x.old_value ? Assist.formatDateLong(x.old_value) : "—"} &rarr;{" "}
                      <strong>{Assist.formatDateLong(x.new_value)}</strong>
                    </div>
                    <div style={{ color: "#6b7280" }}>
                      {x.extended_by} · {Assist.getDateText(x.extended_at)} ·{" "}
                      {x.recipients_notified} notified
                    </div>
                    {x.reason && <div style={{ color: "#6b7280" }}>Reason: {x.reason}</div>}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {requiresApproval() && (
            <Card title="Rejection" showHeader={true}>
              <form id="formReject" onSubmit={onReject}>
                <div className="dx-fieldset">
                  <div className="dx-field">
                    <div className="dx-field-label">Rejection Reason</div>
                    <TextArea
                      className="dx-field-value"
                      placeholder="Rejection Reason"
                      disabled={error || saving}
                      height={80}
                      value={rejectionReason}
                      onValueChange={setRejectionReason}
                    >
                      <Validator validationGroup="Reject">
                        <RequiredRule message="Rejection reason required" />
                      </Validator>
                    </TextArea>
                  </div>
                </div>
                <div className="dx-field">
                  <ValidationSummary id="summaryReject" validationGroup="Reject" />
                </div>
                <div className="dx-field">
                  <div className="dx-field-label"></div>
                  <Button
                    width="100%"
                    useSubmitBehavior={true}
                    validationGroup="Reject"
                    type={saving ? "normal" : "danger"}
                    disabled={loading || error || saving}
                  >
                    <LoadIndicator className="button-indicator" visible={saving} />
                    <span className="dx-button-text">Reject {pageConfig.Single}</span>
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {requiresApproval() && (
            <Card title="Approval" showHeader={true}>
              <form id="formApprove" onSubmit={onApprove}>
                <div className="dx-fieldset">
                  <div className="dx-field">
                    <div className="dx-field-label">Comments (Optional)</div>
                    <TextArea
                      className="dx-field-value"
                      placeholder="Comments"
                      disabled={error || saving}
                      height={80}
                      value={approvalComments}
                      onValueChange={setApprovalComments}
                    ></TextArea>
                  </div>
                </div>
                <div className="dx-field">
                  <ValidationSummary id="summaryApprove" validationGroup="Approve" />
                </div>
                <div className="dx-field">
                  <div className="dx-field-label"></div>
                  <Button
                    width="100%"
                    useSubmitBehavior={true}
                    type={saving ? "normal" : "success"}
                    disabled={loading || error || saving}
                    validationGroup="Approve"
                  >
                    <LoadIndicator className="button-indicator" visible={saving} />
                    <span className="dx-button-text">Approve {pageConfig.Single}</span>
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {isReviewed() && cycle != null && (
            <Card title="Review" showHeader={true}>
              <div className="dx-fieldset">
                <div className="dx-fieldset-header">Primary Review</div>
                <div className="dx-field">
                  <div className="dx-field-label">Reviewer</div>
                  <div className="dx-field-value-static"><strong>{cycle.review1_by}</strong></div>
                </div>
                <div className="dx-field">
                  <div className="dx-field-label">Comments</div>
                  <div className="dx-field-value-static"><strong>{cycle.review1_comments}</strong></div>
                </div>
              </div>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default AdminPTCycle;
