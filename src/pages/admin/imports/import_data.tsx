import { useState, useEffect, useRef } from "react";
import { Titlebar } from "../../../components/titlebar";
import { Card } from "../../../components/card";
import { Row } from "../../../components/row";
import { Col } from "../../../components/column";
import Button from "devextreme-react/button";
import SelectBox from "devextreme-react/select-box";
import FileUploader from "devextreme-react/file-uploader";
import { LoadPanel } from "devextreme-react/load-panel";
import { LoadIndicator } from "devextreme-react/load-indicator";
import DataGrid, {
  Column,
  Paging,
  Pager,
  FilterRow,
  ColumnChooser,
} from "devextreme-react/data-grid";
import { confirm } from "devextreme/ui/dialog";

import Assist from "../../../classes/assist";
import PageConfig from "../../../classes/page-config";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

/**
 * Loads historical data from the CSV templates.
 *
 * A migration file is one consignment - the API writes all of it or none of
 * it - so this page is built around checking before writing. The file is
 * checked first, every fault is listed against the row it came from, and the
 * Import button only unlocks once that check has come back clean for the file
 * currently chosen.
 */
const AdminImportData = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [forms, setForms] = useState<Array<any>>([]);
  const [form, setForm] = useState<undefined | string>(undefined);
  const [columns, setColumns] = useState<Array<any>>([]);
  const [note, setNote] = useState("");

  const [file, setFile] = useState<null | File>(null);
  const [report, setReport] = useState<null | any>(null);
  // the check only vouches for the file it was run against
  const [checked, setChecked] = useState(false);

  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState("");
  const hasRun = useRef(false);

  const pageConfig = new PageConfig(
    "Data Migration",
    "",
    "",
    "Import",
    "",
    Assist.ADMIN_ROLES,
  );

  const selected = forms.find((item) => item.form === form);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    if (!Assist.checkPageAuditPermission(pageConfig, user)) {
      Assist.redirectUnauthorized(navigate);
      return;
    }

    setLoading(true);

    Assist.loadData(pageConfig.Title, "imports/forms")
      .then((res: any) => {
        setLoading(false);
        setForms(res.formList);
        setNote(res.note);
        //the list comes back in the order a migration should load it
        if (res.formList.length > 0) setForm(res.formList[0].form);
      })
      .catch((message) => {
        setLoading(false);
        Assist.showMessage(message, "error");
      });
  }, []);

  //the column guide belongs to the form, so it follows the picker
  useEffect(() => {
    if (!form) return;

    clearRun();

    Assist.loadData("Import Columns", `imports/${form}/columns`)
      .then((res: any) => setColumns(res.columnList))
      .catch((message) => Assist.showMessage(message, "error"));
  }, [form]);

  /** Nothing already reported still applies once the form or file changes */
  const clearRun = () => {
    setReport(null);
    setChecked(false);
  };

  const onFileChange = (files: File[]) => {
    clearRun();
    setFile(files.length > 0 ? files[0] : null);
  };

  const onDownload = (withSamples: boolean) => {
    if (!form) return;

    const suffix = withSamples ? "-sample" : "";
    setBusy(withSamples ? "sample" : "blank");

    Assist.downloadFile(
      "Import Template",
      `imports/${form}/template?with_samples=${withSamples}`,
      `${form}-import${suffix}.csv`,
    )
      .then(() => {
        setBusy("");
        Assist.auditAction(
          user.userid,
          user.sub,
          user.jti,
          pageConfig.Title,
          null,
          `Template Download - ${form}`,
          null,
          null,
          null,
        );
      })
      .catch((message) => {
        setBusy("");
        Assist.showMessage(message, "error");
      });
  };

  const run = (dryRun: boolean) => {
    if (!form || !file) return;

    setBusy(dryRun ? "check" : "import");
    setReport(null);

    Assist.uploadFile(
      pageConfig.Title,
      `imports/${form}?imported_by=${encodeURIComponent(
        user.sub,
      )}&dry_run=${dryRun}`,
      file,
    )
      .then((res: any) => {
        setBusy("");
        setReport(res);
        //a clean check is what unlocks the import
        setChecked(dryRun && res.succeeded);

        Assist.showMessage(res.message, res.succeeded ? "success" : "error");

        if (!dryRun && res.succeeded) {
          Assist.auditAction(
            user.userid,
            user.sub,
            user.jti,
            pageConfig.Title,
            null,
            `Import - ${form}`,
            null,
            {
              file: res.fileName,
              rows: res.rows,
              created: res.created,
              updated: res.updated,
            },
            null,
          );
        }
      })
      .catch((message) => {
        setBusy("");
        Assist.showMessage(message, "error");
      });
  };

  const onImport = () => {
    if (!report) return;

    confirm(
      `Import ${report.rows} ${selected?.label} row(s) from ${file?.name}? ` +
        `This writes ${report.created} new and ${report.updated} updated ` +
        "record(s) and cannot be undone from this page.",
      "Confirm import",
    ).then((dialogResult) => {
      if (!dialogResult) return;
      run(false);
    });
  };

  const field = (label: string, value: any) => (
    <div className="dx-field">
      <div className="dx-field-label">{label}</div>
      <div className="dx-field-value-static">
        <strong>{value}</strong>
      </div>
    </div>
  );

  //a count only earns colour when it means something
  const tile = (label: string, value: number, colour: string) => (
    <Col sz={6} sm={4} lg={4}>
      <div style={{ padding: "6px 0" }}>
        <div style={{ fontSize: "22px", fontWeight: 600, color: colour }}>
          {value}
        </div>
        <div style={{ fontSize: "12px", color: "#777" }}>{label}</div>
      </div>
    </Col>
  );

  const requiredCell = (e: any) => (
    <span style={{ color: e.value ? "#c0392b" : "#777" }}>
      {e.value ? "Required" : "Optional"}
    </span>
  );

  const busyOn = busy !== "";

  return (
    <div id="pageRoot" className="page-content">
      <LoadPanel
        shadingColor="rgba(0,0,0,0.4)"
        position={{ of: "#pageRoot" }}
        visible={loading}
        showIndicator={true}
        shading={true}
        showPane={true}
      />

      <Titlebar
        title={pageConfig.Title}
        section={"Administration"}
        icon={"upload"}
        url="/"
      ></Titlebar>

      <Row>
        <Col sz={12} sm={12} lg={4}>
          <Card title="Import a File" showHeader={true}>
            <div className="dx-fieldset">
              <div className="dx-fieldset-header">Form</div>

              <div className="dx-field">
                <div className="dx-field-label">Form</div>
                <div className="dx-field-value">
                  <SelectBox
                    items={forms}
                    displayExpr="label"
                    valueExpr="form"
                    value={form}
                    disabled={busyOn}
                    onValueChange={(value) => setForm(value)}
                  />
                </div>
              </div>

              {selected && field("Source", selected.source)}
              {selected && field("Columns", selected.columnCount)}
            </div>

            <div className="dx-fieldset">
              <div className="dx-fieldset-header">Template</div>

              <div className="dx-field">
                <div className="dx-field-value-static">
                  <small>
                    The sample template carries three worked rows showing what a
                    good row looks like. The blank one is the header on its own,
                    for a real migration.
                  </small>
                </div>
              </div>

              <div className="dx-field">
                <div className="dx-field-label"></div>
                <div className="dx-field-value">
                  <Button
                    width="100%"
                    type="normal"
                    icon="download"
                    disabled={!form || busyOn}
                    onClick={() => onDownload(true)}
                  >
                    <LoadIndicator
                      className="button-indicator"
                      visible={busy === "sample"}
                    />
                    <span className="dx-button-text">
                      Download Template with Samples
                    </span>
                  </Button>
                </div>
              </div>

              <div className="dx-field">
                <div className="dx-field-label"></div>
                <div className="dx-field-value">
                  <Button
                    width="100%"
                    type="normal"
                    icon="file"
                    disabled={!form || busyOn}
                    onClick={() => onDownload(false)}
                  >
                    <LoadIndicator
                      className="button-indicator"
                      visible={busy === "blank"}
                    />
                    <span className="dx-button-text">
                      Download Blank Template
                    </span>
                  </Button>
                </div>
              </div>
            </div>

            <div className="dx-fieldset">
              <div className="dx-fieldset-header">File</div>

              <FileUploader
                selectButtonText="Choose CSV file"
                labelText=""
                accept=".csv,text/csv"
                multiple={false}
                uploadMode="useForm"
                disabled={busyOn}
                onValueChanged={(e: any) => onFileChange(e.value)}
              />

              {field("Imported by", user?.sub)}
            </div>

            <div className="dx-fieldset">
              <div className="dx-field">
                <div className="dx-field-label"></div>
                <div className="dx-field-value">
                  <Button
                    width="100%"
                    type="default"
                    icon="check"
                    disabled={!file || busyOn}
                    onClick={() => run(true)}
                  >
                    <LoadIndicator
                      className="button-indicator"
                      visible={busy === "check"}
                    />
                    <span className="dx-button-text">Check File</span>
                  </Button>
                </div>
              </div>

              <div className="dx-field">
                <div className="dx-field-label"></div>
                <div className="dx-field-value">
                  <Button
                    width="100%"
                    type="success"
                    icon="upload"
                    disabled={!checked || busyOn}
                    onClick={onImport}
                  >
                    <LoadIndicator
                      className="button-indicator"
                      visible={busy === "import"}
                    />
                    <span className="dx-button-text">Import File</span>
                  </Button>
                </div>
              </div>

              <div className="dx-field">
                <div className="dx-field-value-static">
                  <small>
                    {checked
                      ? "The file has been checked and nothing is wrong with it. Importing writes it."
                      : "Check the file first. Import stays locked until a check comes back clean."}
                  </small>
                </div>
              </div>
            </div>

            {note && (
              <div className="dx-fieldset">
                <div className="dx-field">
                  <div className="dx-field-value-static">
                    <small>{note}</small>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </Col>

        <Col sz={12} sm={12} lg={8}>
          {report && (
            <Card
              title={report.succeeded ? "Result" : "The File Was Not Imported"}
              showHeader={true}
            >
              <div
                style={{
                  padding: "10px 12px",
                  marginBottom: "12px",
                  borderLeft: `4px solid ${
                    report.succeeded
                      ? report.committed
                        ? "#2e7d32"
                        : "#8a6d3b"
                      : "#c0392b"
                  }`,
                  background: "#fafafa",
                }}
              >
                {report.message}
              </div>

              <Row>
                {tile("Rows", report.rows, "#333")}
                {tile("Created", report.created, "#2e7d32")}
                {tile("Updated", report.updated, "#1565c0")}
                {tile(
                  "Failed",
                  report.failed,
                  report.failed > 0 ? "#c0392b" : "#777",
                )}
                {tile(
                  "Enrolments opened",
                  report.enrollments_opened,
                  "#8a6d3b",
                )}
                {tile(
                  "Applications opened",
                  report.applications_opened,
                  "#8a6d3b",
                )}
              </Row>

              {report.ignored_columns?.length > 0 && (
                <div className="dx-field">
                  <div className="dx-field-value-static">
                    <small>
                      Ignored column(s) the form does not use:{" "}
                      {report.ignored_columns.join(", ")}
                    </small>
                  </div>
                </div>
              )}

              {report.failed > 0 && (
                <DataGrid
                  className={"dx-card wide-card"}
                  dataSource={report.errors}
                  noDataText="No faults"
                  showBorders={false}
                  columnAutoWidth={true}
                  columnHidingEnabled={true}
                >
                  <Paging defaultPageSize={10} />
                  <Pager showPageSizeSelector={true} showInfo={true} />
                  <FilterRow visible={true} />

                  <Column
                    dataField="row"
                    caption="Row"
                    width={80}
                    hidingPriority={2}
                  ></Column>
                  <Column
                    dataField="column"
                    caption="Column"
                    width={180}
                    hidingPriority={1}
                  ></Column>
                  <Column dataField="message" caption="What is wrong"></Column>
                </DataGrid>
              )}
            </Card>
          )}

          <Card
            title={`Columns${selected ? " - " + selected.label : ""}`}
            showHeader={true}
          >
            <DataGrid
              className={"dx-card wide-card"}
              dataSource={columns}
              keyExpr={"column"}
              noDataText="Choose a form"
              showBorders={false}
              columnAutoWidth={true}
              columnHidingEnabled={true}
            >
              <Paging defaultPageSize={15} />
              <Pager showPageSizeSelector={true} showInfo={true} />
              <FilterRow visible={true} />
              <ColumnChooser enabled={true} mode="select"></ColumnChooser>

              <Column
                dataField="column"
                caption="Column"
                hidingPriority={4}
              ></Column>
              <Column
                dataField="label"
                caption="On the form"
                hidingPriority={3}
              ></Column>
              <Column
                dataField="type"
                caption="Type"
                width={90}
                hidingPriority={1}
              ></Column>
              <Column
                dataField="required"
                caption=""
                width={100}
                hidingPriority={2}
                cellRender={requiredCell}
              ></Column>
              <Column dataField="notes" caption="Notes"></Column>
            </DataGrid>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminImportData;
