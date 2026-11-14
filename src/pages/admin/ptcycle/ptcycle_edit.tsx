import { useState, useEffect, useRef } from "react";
import { Titlebar } from "../../../components/titlebar";
import { Card } from "../../../components/card";
import { Row } from "../../../components/row";
import { Col } from "../../../components/column";
import SelectBox from "devextreme-react/select-box";
import { TextBox } from "devextreme-react/text-box";
import TextArea from "devextreme-react/text-area";
import { Validator, RequiredRule } from "devextreme-react/validator";
import Button from "devextreme-react/button";
import FileUploader from "devextreme-react/file-uploader";
import ValidationSummary from "devextreme-react/validation-summary";
import { LoadPanel } from "devextreme-react/load-panel";
import DateBox from "devextreme-react/date-box";
import { useAuth } from "../../../context/AuthContext";
import PageConfig from "../../../classes/page-config";
import Assist from "../../../classes/assist";
import { LoadIndicator } from "devextreme-react/load-indicator";
import { useNavigate, useParams } from "react-router-dom";
import { confirm } from "devextreme/ui/dialog";

const PTCycleEdit = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { eId } = useParams();

  const [code, setCode] = useState<string | undefined>(undefined);
  const [schemeId, setSchemeId] = useState<number | undefined>(undefined);
  const [openingDate, setOpeningDate] = useState<string | undefined>(undefined);
  const [closingDate, setClosingDate] = useState<string | undefined>(undefined);
  const [shippingDate, setShippingDate] = useState<string | undefined>(undefined);
  const [testStartDate, setTestStartDate] = useState<string | undefined>(undefined);
  const [testStopDate, setTestStopDate] = useState<string | undefined>(undefined);
  const [resultDueDate, setResultDueDate] = useState<string | undefined>(undefined);
  const [reportDate, setReportDate] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState<string | undefined>(undefined);
  const [reuseFromId, setReuseFromId] = useState<number | undefined>(undefined);

  const [scheme_data, setSchemeData] = useState<Array<any>>([]);
  const [cycle_data, setCycleData] = useState<Array<any>>([]); // candidates to reuse from
  const [documents, setDocuments] = useState<Array<any>>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const hasRun = useRef(false);

  const pageConfig = new PageConfig(`PT Cycle`, "", "", "PT Cycle", "", Assist.ADMIN_ROLES);
  pageConfig.Id = eId == undefined ? 0 : Number(eId);
  const isNew = pageConfig.Id == 0;

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    if (!Assist.checkPageAuditPermission(pageConfig, user)) {
      Assist.redirectUnauthorized(navigate);
      return;
    }
    setLoading(true);
    setTimeout(() => {
      Promise.all([
        Assist.loadData(pageConfig.Title, `pt-cycles/id/${pageConfig.Id}`),
        Assist.loadData("Rounds", `pt-cycles/list`),
        pageConfig.Id != 0
          ? Assist.loadData("Documents", `pt-cycles/documents/${pageConfig.Id}`)
          : Promise.resolve([]),
      ])
        .then(([data, cycles, docs]: [any, any, any]) => {
          setLoading(false);
          setSchemeData(data.schemeList);
          setCycleData(cycles || []);
          setDocuments(docs || []);
          if (pageConfig.Id != 0) updateValues(data.ptcycle);
          setError(false);
        })
        .catch((message) => {
          setLoading(false);
          setError(true);
          Assist.showMessage(message, "error");
        });
    }, Assist.DEV_DELAY);
  }, []);

  const updateValues = (data: any) => {
    setCode(data.code);
    setSchemeId(data.scheme_id);
    setOpeningDate(data.effective_date);
    setClosingDate(data.closing_date);
    setShippingDate(data.shipping_date);
    setTestStartDate(data.test_event_start_date);
    setTestStopDate(data.test_event_stop_date);
    setResultDueDate(data.result_submission_due_date);
    setReportDate(data.reports_availability_date);
    setNotes(data.notes ?? data.description);
  };

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    confirm("Submit this PT Cycle?", "Confirm submission").then((ok) => ok && submit());
  };

  const uploadDocuments = async (cycleId: number) => {
    for (const file of newFiles) {
      try {
        await Assist.uploadFile(
          "Document",
          `attachments/create/type/PTCycleDocument/parent/${cycleId}`,
          file,
        );
      } catch (e) {
        Assist.showMessage(`Could not upload ${file.name}`, "warning");
      }
    }
  };

  const submit = () => {
    setSaving(true);
    const postData: any = {
      user_id: user.userid,
      code,
      scheme_id: schemeId,
      effective_date: openingDate,
      closing_date: closingDate,
      shipping_date: shippingDate,
      test_event_start_date: testStartDate,
      test_event_stop_date: testStopDate,
      result_submission_due_date: resultDueDate,
      reports_availability_date: reportDate,
      notes,
    };
    if (isNew && reuseFromId) postData.reuse_from_pt_cycle_id = reuseFromId;

    const url = isNew ? `pt-cycles/create` : `pt-cycles/update/${pageConfig.Id}`;

    setTimeout(() => {
      Assist.postPutData(pageConfig.Title, url, postData, pageConfig.Id)
        .then(async (data: any) => {
          if (newFiles.length) await uploadDocuments(data.id);
          setSaving(false);
          Assist.showMessage(
            `You have successfully submitted the ${pageConfig.Title} for approval!`,
            "success",
          );
          navigate(`/admin/pt-cycles/list`);
        })
        .catch((message) => {
          setSaving(false);
          Assist.showMessage(message, "error");
        });
    }, Assist.DEV_DELAY);
  };

  // rounds of the same scheme (excluding this one) that participants can be reused from
  const reuseCandidates = cycle_data.filter(
    (c: any) => c.scheme_id === schemeId && c.id !== pageConfig.Id,
  );

  const dateField = (
    label: string,
    value: string | undefined,
    setter: (v: string) => void,
  ) => (
    <div className="dx-field">
      <div className="dx-field-label">{label}</div>
      <DateBox
        className="dx-field-value"
        placeholder={label}
        displayFormat={"dd MMMM yyyy"}
        dateSerializationFormat="yyyy-MM-dd"
        value={value}
        disabled={error || saving}
        onValueChange={(v) => setter(v)}
      >
        <Validator>
          <RequiredRule message={`${label} is required`} />
        </Validator>
      </DateBox>
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
        title={`${pageConfig.verb()} ${pageConfig.Title}`}
        section={"PT Calendar"}
        icon={"event"}
        url="/admin/pt-cycles/list"
      ></Titlebar>

      <Row>
        <Col sz={12} sm={12} lg={7}>
          <Card title="Round" showHeader={true}>
            <form id="formMain" onSubmit={onFormSubmit}>
              <div className="form">
                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">Round</div>
                  <div className="dx-field">
                    <div className="dx-field-label">Scheme</div>
                    <SelectBox
                      className="dx-field-value"
                      placeholder="Scheme"
                      dataSource={scheme_data}
                      displayExpr={"name"}
                      valueExpr={"id"}
                      deferRendering={false}
                      value={schemeId}
                      disabled={error || saving}
                      onValueChange={(v) => {
                        setSchemeId(v);
                        setReuseFromId(undefined);
                      }}
                    >
                      <Validator>
                        <RequiredRule message="Scheme is required" />
                      </Validator>
                    </SelectBox>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Code</div>
                    <TextBox
                      className="dx-field-value"
                      placeholder="e.g. 2026-R1"
                      value={code}
                      disabled={error || saving}
                      onValueChange={(v) => setCode(v)}
                    >
                      <Validator>
                        <RequiredRule message="Code is required" />
                      </Validator>
                    </TextBox>
                  </div>
                </div>

                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">Schedule</div>
                  {dateField("Enrollment opening date", openingDate, setOpeningDate)}
                  {dateField("Enrollment closing date", closingDate, setClosingDate)}
                  {dateField("Sample shipping date", shippingDate, setShippingDate)}
                  {dateField("Test event start date", testStartDate, setTestStartDate)}
                  {dateField("Test event stop date", testStopDate, setTestStopDate)}
                  {dateField("Result submission due date", resultDueDate, setResultDueDate)}
                  {dateField("Report availability date", reportDate, setReportDate)}
                  <div className="dx-field">
                    <div className="dx-field-value-static">
                      <small style={{ color: "#6b7280" }}>
                        The lifecycle status (Upcoming, Enrolment Open, Enrolment
                        Closed, Testing, Results Due) follows these dates
                        automatically. Shipping samples and publishing reports
                        remain manual steps on the round page.
                      </small>
                    </div>
                  </div>
                </div>

                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">Notes</div>
                  <div className="dx-field">
                    <TextArea
                      height={100}
                      placeholder="Any relevant notes for this round"
                      value={notes}
                      disabled={error || saving}
                      onValueChange={(v) => setNotes(v)}
                    />
                  </div>
                </div>

                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">Documents</div>
                  {documents.length > 0 && (
                    <ul style={{ margin: "4px 0 10px", paddingLeft: 18 }}>
                      {documents.map((doc: any) => (
                        <li key={doc.id} style={{ fontSize: 13 }}>
                          {doc.name}
                        </li>
                      ))}
                    </ul>
                  )}
                  <FileUploader
                    multiple={true}
                    uploadMode="useForm"
                    selectButtonText="Add documents"
                    labelText="Instruction forms, resources, etc."
                    disabled={error || saving}
                    onValueChanged={(e: any) => setNewFiles(e.value || [])}
                  />
                </div>

                {isNew && reuseCandidates.length > 0 && (
                  <div className="dx-fieldset">
                    <div className="dx-fieldset-header">Reuse Participants</div>
                    <div className="dx-field">
                      <div className="dx-field-label">Copy participants from</div>
                      <SelectBox
                        className="dx-field-value"
                        placeholder="(optional) choose an earlier round"
                        dataSource={reuseCandidates}
                        displayExpr={(c: any) => (c ? `${c.code} - ${c.name}` : "")}
                        valueExpr={"id"}
                        showClearButton={true}
                        value={reuseFromId}
                        disabled={error || saving}
                        onValueChange={(v) => setReuseFromId(v)}
                      />
                    </div>
                    <div className="dx-field">
                      <div className="dx-field-value-static">
                        <small style={{ color: "#6b7280" }}>
                          All accepted participants of the chosen round are enrolled
                          automatically and emailed. Leave blank for a fresh round.
                        </small>
                      </div>
                    </div>
                  </div>
                )}

                <div className="dx-field">
                  <div className="dx-field-label">
                    <ValidationSummary id="summaryMain" />
                  </div>
                </div>
                <div className="dx-field">
                  <div className="dx-field-label"></div>
                  <Button
                    width="100%"
                    type={saving ? "normal" : "default"}
                    disabled={loading || error || saving}
                    useSubmitBehavior={true}
                  >
                    <LoadIndicator className="button-indicator" visible={saving} />
                    <span className="dx-button-text">Submit for Review</span>
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PTCycleEdit;
