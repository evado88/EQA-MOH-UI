import { useState, useEffect, useRef } from "react";
import { Titlebar } from "../../../components/titlebar";
import { Card } from "../../../components/card";
import { Row } from "../../../components/row";
import { Col } from "../../../components/column";
import Button from "devextreme-react/button";
import TextArea from "devextreme-react/text-area";
import { LoadPanel } from "devextreme-react/load-panel";
import { LoadIndicator } from "devextreme-react/load-indicator";
import DataGrid, {
  Column,
  Paging,
  Pager,
  FilterRow,
  ColumnChooser,
  Button as GridButton,
} from "devextreme-react/data-grid";
import { confirm } from "devextreme/ui/dialog";

import Assist from "../../../classes/assist";
import PageConfig from "../../../classes/page-config";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

/**
 * What a round concluded: the assigned values and participant distribution
 * behind them, and how each participant stood.
 *
 * The figures here are frozen when the cycle moves to 'Report Available'. A
 * re-score rewrites reports that have already been issued, so it is a
 * deliberate action rather than a refresh.
 */
const AdminEvaluationView = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { eId } = useParams();

  const [cycle, setCycle] = useState<null | any>(null);
  const [statistics, setStatistics] = useState<Array<any>>([]);
  const [performance, setPerformance] = useState<Array<any>>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [comments, setComments] = useState("");
  const hasRun = useRef(false);

  const pageConfig = new PageConfig(
    "Round Evaluation",
    "",
    "",
    "Evaluation",
    "",
    Assist.ADMIN_ROLES,
  );

  pageConfig.Id = eId == undefined ? 0 : Number(eId);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    if (!Assist.checkPageAuditPermission(pageConfig, user)) {
      Assist.redirectUnauthorized(navigate);
      return;
    }

    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);

    Promise.all([
      Assist.loadData("PT Cycle", `pt-cycles/id/${pageConfig.Id}`),
      Assist.loadData(
        "Sample Statistics",
        `evaluations/report/sample-summary?pt_cycle_id=${pageConfig.Id}`,
      ),
      Assist.loadData(
        "Participant Performance",
        `evaluations/report/enrollment-performance?pt_cycle_id=${pageConfig.Id}`,
      ),
    ])
      .then(([cycleData, stats, perf]: [any, any, any]) => {
        setLoading(false);
        setCycle(cycleData.ptcycle);
        setStatistics(stats);
        setPerformance(perf);
      })
      .catch((message) => {
        setLoading(false);
        Assist.showMessage(message, "error");
      });
  };

  const isScored = statistics.length > 0;

  const onScore = (recompute: boolean) => {
    const question = recompute
      ? "Re-scoring replaces the frozen statistics for this round. Reports already issued to participants will change. Are you sure?"
      : "Score this round and freeze what it concludes?";

    confirm(question, "Confirm scoring").then((dialogResult) => {
      if (!dialogResult) return;

      setSaving(true);
      Assist.postPutData(
        pageConfig.Title,
        `pt-cycles/evaluate/${pageConfig.Id}`,
        { user_id: user.userid, recompute: recompute, comments: comments },
        1,
      )
        .then((data: any) => {
          setSaving(false);
          Assist.showMessage(
            data?.message || "The round has been scored",
            "success",
          );
          loadData();
        })
        .catch((message) => {
          setSaving(false);
          Assist.showMessage(message, "error");
        });
    });
  };

  const gradeCell = (e: any) => {
    const value = e.value;
    const colour =
      value === "Satisfactory"
        ? "#2e7d32"
        : value === "Unsatisfactory"
          ? "#c0392b"
          : "#8a6d3b";
    return <strong style={{ color: colour }}>{value}</strong>;
  };

  const assignedCell = (e: any) => {
    const row = e.data;
    const value =
      row.assigned_value_numeric != null
        ? row.assigned_value_numeric
        : row.assigned_value_text;

    if (value == null) return <span style={{ color: "#c0392b" }}>none</span>;

    return (
      <span>
        {value}{" "}
        <small style={{ color: "#888" }}>({row.assigned_value_source})</small>
      </span>
    );
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
        visible={loading || saving}
        showIndicator={true}
        shading={true}
        showPane={true}
        hideOnOutsideClick={false}
      />
      <Titlebar
        title={pageConfig.Title}
        section={"PT Calendar"}
        icon={"chart"}
        url="/"
      ></Titlebar>

      <Row>
        <Col sz={12} sm={12} lg={4}>
          <Card title="Round" showHeader={true}>
            {cycle != null && (
              <div className="form">
                <div className="dx-fieldset">
                  {field("Cycle", `${cycle.code} - ${cycle.name}`)}
                  {field("Scheme", cycle.scheme.name)}
                  {field("Status", cycle.ptcyclestatus.name)}
                  {field(
                    "Reports Available",
                    Assist.formatDateLong(cycle.reports_availability_date),
                  )}
                </div>

                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">Evaluation</div>
                  {field(
                    "Scored",
                    isScored
                      ? `Yes - ${statistics.length} sample statistic(s)`
                      : "Not yet",
                  )}
                  {isScored &&
                    field(
                      "Frozen",
                      Assist.formatDateLong(statistics[0]?.frozen_at),
                    )}
                  {field("Participants", performance.length)}
                </div>

                {isScored && (
                  <div className="dx-fieldset">
                    <div className="dx-field">
                      <div className="dx-field-label">
                        Reason for re-scoring
                      </div>
                      <TextArea
                        className="dx-field-value"
                        placeholder="Why is this round being re-scored?"
                        height={70}
                        value={comments}
                        disabled={saving}
                        onValueChange={(value) => setComments(value)}
                      />
                    </div>
                  </div>
                )}

                <div className="dx-field">
                  <div className="dx-field-label"></div>
                  <div className="dx-field-value">
                    <Button
                      width="100%"
                      type={isScored ? "danger" : "default"}
                      icon={isScored ? "refresh" : "check"}
                      disabled={loading || saving}
                      onClick={() => onScore(isScored)}
                    >
                      <LoadIndicator
                        className="button-indicator"
                        visible={saving}
                      />
                      <span className="dx-button-text">
                        {isScored ? "Re-score Round" : "Score Round"}
                      </span>
                    </Button>
                  </div>
                </div>

                {isScored && (
                  <div className="dx-field">
                    <div className="dx-field-value-static">
                      <small>
                        Re-scoring discards the frozen figures and recalculates
                        from the submitted results. Reports already issued will
                        change.
                      </small>
                    </div>
                  </div>
                )}

                <div className="dx-field">
                  <div className="dx-field-label"></div>
                  <div className="dx-field-value">
                    <Button
                      width="100%"
                      type="normal"
                      icon="arrowleft"
                      text="Back to PT Cycles"
                      onClick={() => navigate("/admin/pt-cycles/list")}
                    />
                  </div>
                </div>
              </div>
            )}
          </Card>
        </Col>

        <Col sz={12} sm={12} lg={8}>
          <Card title="Participant Performance" showHeader={true}>
            <DataGrid
              className={"dx-card wide-card"}
              dataSource={performance}
              keyExpr={"enrollment_id"}
              noDataText="This round has not been scored"
              showBorders={false}
              columnAutoWidth={true}
            >
              <Paging defaultPageSize={10} />
              <Pager showInfo={true} />
              <FilterRow visible={true} />

              <Column dataField="lab_code" caption="Code"></Column>
              <Column
                dataField="lab_name"
                caption="Laboratory"
                sortOrder="asc"
              ></Column>
              <Column dataField="method_name" caption="Method"></Column>
              <Column dataField="total_score" caption="Score"></Column>
              <Column dataField="max_score" caption="Max"></Column>
              <Column
                dataField="percent_score_display"
                caption="%"
                dataType="number"
                format="#0.0"
              ></Column>
              <Column dataField="acceptable_count" caption="Acc"></Column>
              <Column dataField="warning_count" caption="Warn"></Column>
              <Column dataField="unacceptable_count" caption="Unacc"></Column>
              <Column
                dataField="overall_performance"
                caption="Performance"
                cellRender={gradeCell}
              ></Column>
              <Column type="buttons" caption="" width={90}>
                <GridButton
                  text="Report"
                  hint="Open this participant's report"
                  onClick={(e: any) =>
                    navigate(
                      `/admin/reports/pt-performance/${e.row.data.enrollment_id}`,
                    )
                  }
                />
              </Column>
            </DataGrid>
          </Card>

          <Card title="Sample Statistics" showHeader={true}>
            <DataGrid
              className={"dx-card wide-card"}
              dataSource={statistics}
              keyExpr={["method_sample_id", "attribute"]}
              noDataText="This round has not been scored"
              showBorders={false}
              columnAutoWidth={true}
              columnHidingEnabled={true}
            >
              <Paging defaultPageSize={10} />
              <Pager showPageSizeSelector={true} showInfo={true} />
              <FilterRow visible={true} />
              <ColumnChooser enabled={true} mode="select"></ColumnChooser>

              <Column
                dataField="sample_name"
                caption="Sample"
                sortOrder="asc"
                hidingPriority={12}
              ></Column>
              <Column
                dataField="method_name"
                caption="Method"
                hidingPriority={11}
              ></Column>
              <Column
                dataField="attribute_label"
                caption="Measured"
                hidingPriority={10}
              ></Column>
              <Column
                caption="Assigned Value"
                hidingPriority={9}
                cellRender={assignedCell}
              ></Column>
              <Column
                dataField="pooled_reported_count"
                caption="N"
                hidingPriority={8}
              ></Column>
              <Column
                dataField="group_mean"
                caption="Mean"
                dataType="number"
                format="#0.00"
                hidingPriority={6}
              ></Column>
              <Column
                dataField="group_median"
                caption="Median"
                dataType="number"
                format="#0.00"
                hidingPriority={5}
              ></Column>
              <Column
                dataField="robust_sd"
                caption="Robust SD"
                dataType="number"
                format="#0.000"
                hidingPriority={7}
              ></Column>
              <Column
                dataField="acceptable_count"
                caption="Acc"
                hidingPriority={4}
              ></Column>
              <Column
                dataField="unacceptable_count"
                caption="Unacc"
                hidingPriority={3}
              ></Column>
              <Column
                dataField="not_evaluated_count"
                caption="N/E"
                hidingPriority={2}
              ></Column>
              <Column
                dataField="not_evaluated_reason"
                caption="Note"
                hidingPriority={1}
              ></Column>
            </DataGrid>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminEvaluationView;
