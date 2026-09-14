import { useState, useEffect, useRef } from "react";
import { Titlebar } from "../../../components/titlebar";
import { Card } from "../../../components/card";
import { Row } from "../../../components/row";
import { Col } from "../../../components/column";
import Button from "devextreme-react/button";
import { LoadPanel } from "devextreme-react/load-panel";
import DataGrid, {
  Column,
  Paging,
  Pager,
  LoadPanel as GridLoadPanel,
} from "devextreme-react/data-grid";

import Assist from "../../../classes/assist";
import PageConfig from "../../../classes/page-config";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

/** How each sample in one round was scored for this laboratory. */
const FacilityPerformanceView = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { eId } = useParams();

  const [header, setHeader] = useState<null | any>(null);
  const [rows, setRows] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(false);
  const hasRun = useRef(false);

  const pageConfig = new PageConfig(
    "Round Performance",
    "",
    "",
    "Performance",
    "",
    Assist.LABORATORY_ROLES,
  );

  pageConfig.Id = eId == undefined ? 0 : Number(eId);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    if (!Assist.checkPageAuditPermission(pageConfig, user)) {
      Assist.redirectUnauthorized(navigate);
      return;
    }

    setLoading(true);

    Promise.all([
      Assist.loadData(
        pageConfig.Title,
        `evaluations/report/enrollment-performance?enrollment_id=${pageConfig.Id}`,
      ),
      Assist.loadData(
        "Sample Results",
        `evaluations/report/result-evaluation?enrollment_id=${pageConfig.Id}`,
      ),
    ])
      .then(([performance, results]: [any, any]) => {
        setLoading(false);
        setHeader(performance.length ? performance[0] : null);
        setRows(results);
      })
      .catch((message) => {
        setLoading(false);
        Assist.showMessage(message, "error");
      });
  }, []);

  const gradeCell = (e: any) => {
    const value = e.value;
    const colour =
      value === "Acceptable"
        ? "#2e7d32"
        : value === "Unacceptable"
          ? "#c0392b"
          : value === "Warning"
            ? "#e67e22"
            : "#8a6d3b";
    return <strong style={{ color: colour }}>{value}</strong>;
  };

  //what the lab reported, whether that was a number or a category
  const reportedCell = (e: any) => {
    const row = e.data;
    if (row.reported_numeric != null) return <span>{row.reported_numeric}</span>;
    return <span>{row.reported_text || "-"}</span>;
  };

  const assignedCell = (e: any) => {
    const row = e.data;
    if (row.assigned_numeric != null) return <span>{row.assigned_numeric}</span>;
    return <span>{row.assigned_text || "-"}</span>;
  };

  const field = (label: string, value: any) => (
    <div className="dx-field">
      <div className="dx-field-label">{label}</div>
      <div className="dx-field-value-static">
        <strong>{value}</strong>
      </div>
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
        icon={"cubes"}
        url="/"
      ></Titlebar>

      <Row>
        <Col sz={12} sm={12} lg={4}>
          <Card title="Summary" showHeader={true}>
            {header != null && (
              <div className="form">
                <div className="dx-fieldset">
                  {field("Round", `${header.cycle_code} - ${header.cycle_name}`)}
                  {field("Scheme", header.scheme_name)}
                  {field("Method", header.method_name)}
                  {field(
                    "Report Date",
                    Assist.formatDateLong(header.report_date),
                  )}
                </div>
                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">Outcome</div>
                  {field(
                    "Score",
                    `${header.total_score} of ${header.max_score}` +
                      (header.percent_score_display != null
                        ? ` (${header.percent_score_display}%)`
                        : ""),
                  )}
                  <div className="dx-field">
                    <div className="dx-field-label">Performance</div>
                    <div className="dx-field-value-static">
                      <strong
                        style={{
                          color:
                            header.overall_performance === "Satisfactory"
                              ? "#2e7d32"
                              : header.overall_performance === "Unsatisfactory"
                                ? "#c0392b"
                                : "#8a6d3b",
                        }}
                      >
                        {header.overall_performance}
                      </strong>
                    </div>
                  </div>
                  {field("Acceptable", header.acceptable_count)}
                  {field("Warning", header.warning_count)}
                  {field("Unacceptable", header.unacceptable_count)}
                  {field("Not Reported", header.not_reported_count)}
                  {header.reason_for_no_evaluation &&
                    field("Reason", header.reason_for_no_evaluation)}
                </div>
                <div className="dx-field">
                  <div className="dx-field-label"></div>
                  <div className="dx-field-value">
                    <Button
                      width="100%"
                      type="default"
                      icon="file"
                      text="Open PT Report"
                      onClick={() =>
                        navigate(
                          `/facility/reports/pt-performance/${pageConfig.Id}`,
                        )
                      }
                    />
                  </div>
                </div>
                <div className="dx-field">
                  <div className="dx-field-label"></div>
                  <div className="dx-field-value">
                    <Button
                      width="100%"
                      type="normal"
                      icon="arrowleft"
                      text="Back to My Performance"
                      onClick={() => navigate("/facility/performance/list")}
                    />
                  </div>
                </div>
              </div>
            )}
          </Card>
        </Col>

        <Col sz={12} sm={12} lg={8}>
          <Card title="Results of the Individual Evaluation" showHeader={true}>
            <DataGrid
              className={"dx-card wide-card"}
              dataSource={rows}
              keyExpr={"evaluation_id"}
              noDataText="This round has not been scored"
              showBorders={false}
              columnAutoWidth={true}
            >
              <Paging defaultPageSize={20} />
              <Pager showInfo={true} />
              <GridLoadPanel enabled={loading} />

              <Column
                dataField="sample_name"
                caption="Sample"
                sortOrder="asc"
              ></Column>
              <Column
                dataField="attribute_label"
                caption="Measured"
              ></Column>
              <Column
                caption="Your Result"
                cellRender={reportedCell}
              ></Column>
              <Column caption="Assigned" cellRender={assignedCell}></Column>
              <Column
                dataField="participant_count"
                caption="N"
                dataType="number"
              ></Column>
              <Column
                dataField="group_mean"
                caption="Group Mean"
                dataType="number"
                format="#0.00"
              ></Column>
              <Column
                dataField="robust_sd"
                caption="Robust SD"
                dataType="number"
                format="#0.000"
              ></Column>
              <Column
                dataField="z_score"
                caption="Z-score"
                dataType="number"
                format="#0.00"
              ></Column>
              <Column dataField="score" caption="Score"></Column>
              <Column
                dataField="grade"
                caption="Grade"
                cellRender={gradeCell}
              ></Column>
              <Column
                dataField="not_evaluated_reason"
                caption="Note"
              ></Column>
            </DataGrid>

            <div style={{ padding: "10px 4px", fontSize: "12px", color: "#666" }}>
              Performance criteria: |z| &le; 2.0 acceptable, no action required.
              2.0 &lt; |z| &lt; 3.0 warning, closely monitor performance.
              |z| &ge; 3.0 unacceptable, perform corrective action.
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default FacilityPerformanceView;
