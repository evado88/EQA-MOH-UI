import { useState, useEffect, useRef } from "react";
import { Ticker } from "../components/ticker.jsx";
import { Titlebar } from "../components/titlebar.js";
import { Card } from "../components/card.js";
import { Row } from "../components/row.jsx";
import { Col } from "../components/column.js";
import {
  Chart,
  Series,
  CommonSeriesSettings,
  ArgumentAxis,
  ValueAxis,
  Legend,
  Tooltip,
  Label,
  Export,
} from "devextreme-react/chart";
import PieChart, {
  Series as PieSeries,
  Label as PieLabel,
  Connector,
  Legend as PieLegend,
  Tooltip as PieTooltip,
} from "devextreme-react/pie-chart";
import { LoadPanel } from "devextreme-react/load-panel";
import DataGrid, {
  Column,
  Pager,
  Paging,
  FilterRow,
  ColumnChooser,
  Button as GridButton,
} from "devextreme-react/data-grid";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import PageConfig from "../classes/page-config.js";
import Assist from "../classes/assist.js";

// the colour each standing carries everywhere in the app
const GREEN = "#2e7d32";
const RED = "#c0392b";
const AMBER = "#8a6d3b";
const BLUE = "#1565c0";
const GREY = "#9e9e9e";

const GRADE_COLOURS: Record<string, string> = {
  Acceptable: GREEN,
  Warning: AMBER,
  Unacceptable: RED,
  "Not Evaluated": GREY,
};

/**
 * What the scheme looks like right now.
 *
 * A laboratory sees its own standing and a provider sees the whole scheme,
 * from the same summary - the API scopes it on lab_id, so there is one set of
 * figures rather than two that can drift.
 */
const MyDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<null | any>(null);
  const [loading, setLoading] = useState(true);
  const hasRun = useRef(false);

  const isLab = Assist.isLaboratoryUser(user);
  const labId = Assist.getLaboratoryId(user);

  const pageConfig = new PageConfig("Dashboard", "", "", "User", "");

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    //a lab only ever sees its own work; the provider sees the scheme
    const scope = isLab && labId ? `?lab_id=${labId}` : "";

    Assist.loadData(pageConfig.Title, `dashboard/summary${scope}`)
      .then((res: any) => {
        setSummary(res);
        setLoading(false);
      })
      .catch((message) => {
        setLoading(false);
        Assist.showMessage(message, "error");
      });
  }, []);

  const headline = summary?.headline;
  const performance = summary?.performance;

  //nothing has been scored yet, so the performance half has nothing to say
  const scored = (performance?.scored ?? 0) > 0;

  const gradeData = (summary?.gradeList ?? []).filter((g: any) => g.count > 0);

  const performanceCell = (e: any) => {
    const value = e.value;
    const colour =
      value === "Satisfactory"
        ? GREEN
        : value === "Unsatisfactory"
          ? RED
          : AMBER;
    return <strong style={{ color: colour }}>{value}</strong>;
  };

  const scoreCell = (e: any) => {
    const row = e.data;
    if (row.percentScore == null) return <span>-</span>;
    return (
      <span>
        {row.totalScore} / {row.maxScore} ({row.percentScore}%)
      </span>
    );
  };

  const emptyChart = (message: string) => (
    <div
      style={{
        padding: "48px 12px",
        textAlign: "center",
        color: "#999",
        fontSize: "13px",
      }}
    >
      {message}
    </div>
  );

  return (
    <div id="pageRoot" className="page-content" style={{ minHeight: "862px" }}>
      <LoadPanel
        shadingColor="rgba(248, 242, 242, 0.9)"
        position={{ of: "#pageRoot" }}
        visible={loading}
        showIndicator={true}
        shading={true}
        showPane={true}
        hideOnOutsideClick={false}
      />

      <Titlebar
        title={pageConfig.Title}
        section={"Home"}
        icon={"home"}
        url={""}
      ></Titlebar>

      {/* ---------------------------------------------------- headline */}
      <Row>
        {!isLab && (
          <Col xl={3} lg={3} sz={12} sm={6}>
            <Ticker
              title={"Participating Laboratories"}
              value={headline?.laboratories.approved ?? 0}
              color={"green"}
              percent={
                headline
                  ? (headline.laboratories.approved /
                      Math.max(headline.laboratories.total, 1)) *
                    100
                  : 0
              }
            ></Ticker>
          </Col>
        )}

        <Col xl={3} lg={3} sz={12} sm={6}>
          <Ticker
            title={isLab ? "My Enrolments" : "Enrolments"}
            value={headline?.enrolments.accepted ?? 0}
            color={"blue"}
            percent={
              headline
                ? (headline.enrolments.accepted /
                    Math.max(headline.enrolments.total, 1)) *
                  100
                : 0
            }
          ></Ticker>
        </Col>

        <Col xl={3} lg={3} sz={12} sm={6}>
          <Ticker
            title={isLab ? "My Results" : "Results Captured"}
            value={headline?.results.total ?? 0}
            color={"cyan"}
            percent={100}
          ></Ticker>
        </Col>

        <Col xl={3} lg={3} sz={12} sm={6}>
          <Ticker
            title={isLab ? "Awaiting Review" : "Results Awaiting Review"}
            value={headline?.results.awaitingReview ?? 0}
            color={
              (headline?.results.awaitingReview ?? 0) > 0 ? "orange" : "green"
            }
            percent={
              headline
                ? (headline.results.awaitingReview /
                    Math.max(headline.results.total, 1)) *
                  100
                : 0
            }
          ></Ticker>
        </Col>

        {isLab && (
          <Col xl={3} lg={3} sz={12} sm={6}>
            <Ticker
              title={"Average Score"}
              value={
                performance?.averageScore != null
                  ? `${performance.averageScore}%`
                  : "-"
              }
              color={
                (performance?.averageScore ?? 0) >= 80
                  ? "green"
                  : (performance?.averageScore ?? 0) > 0
                    ? "orange"
                    : "purple"
              }
              percent={performance?.averageScore ?? 0}
            ></Ticker>
          </Col>
        )}
      </Row>

      {/* -------------------------------------------- performance summary */}
      <Row>
        <Col sz={12} sm={12} lg={8}>
          <Card
            title={
              isLab
                ? "My Score by Round"
                : "Participation and Performance by Round"
            }
            showHeader={true}
          >
            {summary?.cycleList?.length > 0 ? (
              <Chart dataSource={summary.cycleList} id="roundChart">
                <CommonSeriesSettings argumentField="cycleCode" />
                <Series
                  name="Participants"
                  valueField="participants"
                  type="bar"
                  color="#cfd8dc"
                  axis="count"
                />
                <Series
                  name="Average Score %"
                  valueField="avgScore"
                  type="spline"
                  color={BLUE}
                  axis="percent"
                />
                <Series
                  name="Satisfactory %"
                  valueField="satisfactoryRate"
                  type="spline"
                  color={GREEN}
                  axis="percent"
                />
                <ArgumentAxis>
                  <Label overlappingBehavior="rotate" rotationAngle={-30} />
                </ArgumentAxis>
                <ValueAxis name="count" position="left"></ValueAxis>
                <ValueAxis
                  name="percent"
                  position="right"
                  max={100}
                  min={0}
                ></ValueAxis>
                <Legend
                  verticalAlignment="bottom"
                  horizontalAlignment="center"
                />
                <Tooltip enabled={true} />
                <Export enabled={true} />
              </Chart>
            ) : (
              emptyChart(
                isLab
                  ? "None of your rounds have been scored yet"
                  : "No round has been scored yet. Score a round from its PT Cycle page.",
              )
            )}
          </Card>
        </Col>

        <Col sz={12} sm={12} lg={4}>
          <Card title="How Samples Were Graded" showHeader={true}>
            {gradeData.length > 0 ? (
              <>
                <PieChart
                  dataSource={gradeData}
                  type="doughnut"
                  innerRadius={0.62}
                  palette={gradeData.map(
                    (g: any) => GRADE_COLOURS[g.grade] ?? GREY,
                  )}
                  id="gradeChart"
                >
                  <PieSeries argumentField="grade" valueField="count">
                    <PieLabel visible={true}>
                      <Connector visible={true} width={1} />
                    </PieLabel>
                  </PieSeries>
                  <PieLegend
                    verticalAlignment="bottom"
                    horizontalAlignment="center"
                  />
                  <PieTooltip enabled={true} />
                </PieChart>
                <div
                  style={{
                    textAlign: "center",
                    marginTop: "6px",
                    fontSize: "12px",
                    color: "#777",
                  }}
                >
                  {performance.gradedAttributes} graded attribute(s) across{" "}
                  {performance.scored} participant round(s)
                </div>
              </>
            ) : (
              emptyChart("Nothing has been graded yet")
            )}
          </Card>
        </Col>
      </Row>

      {/* ------------------------------------------------ standing split */}
      {scored && (
        <Row>
          <Col sz={12} sm={12} lg={4}>
            <Card title="Overall Standing" showHeader={true}>
              <div style={{ padding: "6px 0 14px" }}>
                <div
                  style={{
                    fontSize: "40px",
                    fontWeight: 600,
                    color:
                      performance.satisfactoryRate >= 80
                        ? GREEN
                        : performance.satisfactoryRate >= 50
                          ? AMBER
                          : RED,
                  }}
                >
                  {performance.satisfactoryRate}%
                </div>
                <div style={{ fontSize: "12px", color: "#777" }}>
                  of scored participant rounds were satisfactory
                </div>
              </div>

              {/* the bar reads as the split itself, not a decoration */}
              <div
                style={{
                  display: "flex",
                  height: "14px",
                  borderRadius: "7px",
                  overflow: "hidden",
                  marginBottom: "14px",
                }}
              >
                <div
                  style={{
                    width: `${performance.satisfactoryRate}%`,
                    background: GREEN,
                  }}
                ></div>
                <div style={{ flex: 1, background: RED }}></div>
              </div>

              <div className="dx-fieldset">
                <div className="dx-field">
                  <div className="dx-field-label">Satisfactory</div>
                  <div className="dx-field-value-static">
                    <strong style={{ color: GREEN }}>
                      {performance.satisfactory}
                    </strong>
                  </div>
                </div>
                <div className="dx-field">
                  <div className="dx-field-label">Unsatisfactory</div>
                  <div className="dx-field-value-static">
                    <strong style={{ color: RED }}>
                      {performance.unsatisfactory}
                    </strong>
                  </div>
                </div>
                {performance.notEvaluated > 0 && (
                  <div className="dx-field">
                    <div className="dx-field-label">Not Evaluated</div>
                    <div className="dx-field-value-static">
                      <strong style={{ color: AMBER }}>
                        {performance.notEvaluated}
                      </strong>
                    </div>
                  </div>
                )}
                <div className="dx-field">
                  <div className="dx-field-label">Average Score</div>
                  <div className="dx-field-value-static">
                    <strong>
                      {performance.averageScore != null
                        ? `${performance.averageScore}%`
                        : "-"}
                    </strong>
                  </div>
                </div>
                <div className="dx-field">
                  <div className="dx-field-label">Rounds Scored</div>
                  <div className="dx-field-value-static">
                    <strong>{headline.rounds.scored}</strong>
                  </div>
                </div>
              </div>
            </Card>
          </Col>

          <Col sz={12} sm={12} lg={8}>
            <Card title="Standing by Scheme" showHeader={true}>
              <Chart
                dataSource={summary.schemeList}
                rotated={true}
                id="schemeChart"
              >
                <CommonSeriesSettings
                  argumentField="scheme"
                  type="stackedBar"
                />
                <Series
                  name="Satisfactory"
                  valueField="satisfactory"
                  color={GREEN}
                />
                <Series
                  name="Unsatisfactory"
                  valueField="unsatisfactory"
                  color={RED}
                />
                <Legend
                  verticalAlignment="bottom"
                  horizontalAlignment="center"
                />
                <Tooltip enabled={true} />
                <Export enabled={true} />
              </Chart>
            </Card>
          </Col>
        </Row>
      )}

      {/* -------------------------------------------------- the workload */}
      <Row>
        <Col sz={12} sm={12} lg={6}>
          <Card title="Results by Form" showHeader={true}>
            <Chart dataSource={summary?.resultFormList ?? []} id="formChart">
              <CommonSeriesSettings argumentField="label" type="stackedBar" />
              <Series name="Draft" valueField="draft" color="#b0bec5" />
              <Series name="Submitted" valueField="submitted" color={AMBER} />
              <Series
                name="Under Review"
                valueField="underReview"
                color={BLUE}
              />
              <Series name="Approved" valueField="approved" color={GREEN} />
              <Series name="Rejected" valueField="rejected" color={RED} />
              <ArgumentAxis>
                <Label overlappingBehavior="rotate" rotationAngle={-20} />
              </ArgumentAxis>
              <Legend verticalAlignment="bottom" horizontalAlignment="center" />
              <Tooltip enabled={true} />
              <Export enabled={true} />
            </Chart>
          </Card>
        </Col>

        <Col sz={12} sm={12} lg={6}>
          <Card
            title={isLab ? "My Methods" : "Participation by Method"}
            showHeader={true}
          >
            {summary?.methodList?.length > 0 ? (
              <DataGrid
                className={"dx-card wide-card"}
                dataSource={summary.methodList}
                keyExpr={"method"}
                noDataText="No method has been scored yet"
                showBorders={false}
                columnAutoWidth={true}
                columnHidingEnabled={true}
              >
                <Paging defaultPageSize={8} />
                <Column
                  dataField="method"
                  caption="Method"
                  hidingPriority={4}
                ></Column>
                <Column
                  dataField="participants"
                  caption={isLab ? "Rounds" : "Participants"}
                  width={110}
                  hidingPriority={3}
                ></Column>
                <Column
                  dataField="satisfactory"
                  caption="Satisfactory"
                  width={110}
                  hidingPriority={1}
                ></Column>
                <Column
                  dataField="satisfactoryRate"
                  caption="Pass Rate"
                  width={100}
                  hidingPriority={2}
                  format="#0.0'%'"
                ></Column>
                <Column
                  dataField="avgScore"
                  caption="Average"
                  width={100}
                  format="#0.0'%'"
                ></Column>
              </DataGrid>
            ) : (
              emptyChart("No method has been scored yet")
            )}
          </Card>
        </Col>
      </Row>

      {/* -------------------------------------------- the network, admin */}
      {!isLab && (
        <Row>
          <Col sz={12} sm={12} lg={7}>
            <Card title="Laboratories by Province" showHeader={true}>
              {summary?.provinceList?.length > 0 ? (
                <Chart
                  dataSource={summary.provinceList}
                  rotated={true}
                  id="provinceChart"
                >
                  <CommonSeriesSettings argumentField="province" type="bar" />
                  <Series
                    name="Laboratories"
                    valueField="laboratories"
                    color={BLUE}
                  >
                    <Label visible={true} />
                  </Series>
                  <Legend visible={false} />
                  <Tooltip enabled={true} />
                  <Export enabled={true} />
                </Chart>
              ) : (
                emptyChart("No approved laboratory has a province recorded")
              )}
            </Card>
          </Col>

          <Col sz={12} sm={12} lg={5}>
            <Card title="Rounds in Progress" showHeader={true}>
              <DataGrid
                className={"dx-card wide-card"}
                dataSource={summary?.openCycleList ?? []}
                keyExpr={"ptCycleId"}
                noDataText="Every round is closed"
                showBorders={false}
                columnAutoWidth={true}
                columnHidingEnabled={true}
              >
                <Paging defaultPageSize={6} />
                <Pager showInfo={true} />
                <Column
                  dataField="cycleCode"
                  caption="Round"
                  hidingPriority={5}
                ></Column>
                <Column
                  dataField="scheme"
                  caption="Scheme"
                  hidingPriority={2}
                ></Column>
                <Column
                  dataField="status"
                  caption="Status"
                  hidingPriority={4}
                ></Column>
                <Column
                  dataField="enrolments"
                  caption="Enrolled"
                  width={90}
                  hidingPriority={3}
                ></Column>
                <Column
                  dataField="reportDate"
                  caption="Report Due"
                  dataType="date"
                  format="dd MMM yyyy"
                  hidingPriority={1}
                ></Column>
                <Column type="buttons" caption="" width={80}>
                  <GridButton
                    text="Open"
                    hint="Open the PT cycle"
                    onClick={(e: any) =>
                      navigate(`/admin/pt-cycles/view/${e.row.data.ptCycleId}`)
                    }
                  />
                </Column>
              </DataGrid>
            </Card>
          </Col>
        </Row>
      )}

      {/* ----------------------------------------------- the standings */}
      <Row>
        <Col sz={12} sm={12} lg={12}>
          <Card
            title={isLab ? "My Rounds" : "Participant Standings"}
            showHeader={true}
          >
            <DataGrid
              className={"dx-card wide-card"}
              dataSource={summary?.participantList ?? []}
              keyExpr={"enrollmentId"}
              noDataText="Nothing has been scored yet"
              showBorders={false}
              columnAutoWidth={true}
              columnHidingEnabled={true}
            >
              <Paging defaultPageSize={10} />
              <Pager showPageSizeSelector={true} showInfo={true} />
              <FilterRow visible={true} />
              <ColumnChooser enabled={true} mode="select"></ColumnChooser>

              <Column
                dataField="labCode"
                caption="Code"
                width={90}
                visible={!isLab}
                hidingPriority={9}
              ></Column>
              <Column
                dataField="labName"
                caption="Laboratory"
                visible={!isLab}
                hidingPriority={11}
              ></Column>
              <Column
                dataField="cycleCode"
                caption="Round"
                hidingPriority={10}
              ></Column>
              <Column
                dataField="scheme"
                caption="Scheme"
                hidingPriority={4}
              ></Column>
              <Column
                dataField="method"
                caption="Method"
                hidingPriority={6}
              ></Column>
              <Column
                caption="Score"
                width={150}
                hidingPriority={7}
                cellRender={scoreCell}
              ></Column>
              <Column
                dataField="performance"
                caption="Performance"
                width={130}
                hidingPriority={12}
                cellRender={performanceCell}
              ></Column>
              <Column
                dataField="acceptable"
                caption="Acceptable"
                width={100}
                hidingPriority={2}
              ></Column>
              <Column
                dataField="unacceptable"
                caption="Unacceptable"
                width={110}
                hidingPriority={3}
              ></Column>
              <Column
                dataField="notReported"
                caption="Not Reported"
                width={110}
                hidingPriority={1}
                visible={false}
              ></Column>
              <Column
                dataField="reportDate"
                caption="Report Date"
                dataType="date"
                format="dd MMM yyyy"
                hidingPriority={5}
              ></Column>
              <Column
                dataField="reportNumber"
                caption="Report No."
                hidingPriority={8}
                visible={false}
              ></Column>

              <Column type="buttons" caption="" width={110}>
                <GridButton
                  text="Report"
                  hint="Open the PT performance report"
                  onClick={(e: any) =>
                    navigate(
                      `${
                        isLab ? "/facility" : "/admin"
                      }/reports/pt-performance/${e.row.data.enrollmentId}`,
                    )
                  }
                />
              </Column>
            </DataGrid>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default MyDashboard;
