import { useState, useEffect, useRef } from "react";
import { Titlebar } from "../../../components/titlebar";
import { Card } from "../../../components/card";
import { Row } from "../../../components/row";
import { Col } from "../../../components/column";
import DataGrid, {
  Column,
  Pager,
  Paging,
  FilterRow,
  LoadPanel,
  ColumnChooser,
  Button as GridButton,
} from "devextreme-react/data-grid";

import Assist from "../../../classes/assist";
import PageConfig from "../../../classes/page-config";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

/** How a laboratory has performed in every round it took part in. */
const FacilityPerformanceList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<Array<any>>([]);
  const [loadingText, setLoadingText] = useState("Loading data...");
  const [loading, setLoading] = useState(true);
  const hasRun = useRef(false);

  const labId = Assist.getLaboratoryId(user);

  const pageConfig = new PageConfig(
    "My Performance",
    "",
    "",
    "Performance",
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

    if (!labId) {
      setLoading(false);
      setLoadingText("Your account is not linked to a laboratory");
      return;
    }

    Assist.loadData(
      pageConfig.Title,
      `evaluations/report/enrollment-performance?lab_id=${labId}`,
    )
      .then((res: any) => {
        setData(res);
        setLoading(false);
        setLoadingText(
          res.length === 0
            ? "None of your rounds have been scored yet"
            : "",
        );
      })
      .catch((message) => {
        setLoading(false);
        Assist.showMessage(message, "error");
        setLoadingText("Could not show information");
      });
  }, []);

  //the grade drives the colour, so an unsatisfactory round is obvious
  const performanceCell = (e: any) => {
    const value = e.value;
    const colour =
      value === "Satisfactory"
        ? "#2e7d32"
        : value === "Unsatisfactory"
          ? "#c0392b"
          : "#8a6d3b";
    return <strong style={{ color: colour }}>{value}</strong>;
  };

  const scoreCell = (e: any) => {
    const row = e.data;
    if (!row.max_score) return <span>-</span>;
    return (
      <span>
        {row.total_score} / {row.max_score}
        {row.percent_score_display != null
          ? ` (${row.percent_score_display}%)`
          : ""}
      </span>
    );
  };

  return (
    <div className="page-content" style={{ minHeight: "862px" }}>
      <Titlebar
        title={pageConfig.Title}
        section={"PT Results"}
        icon={"cubes"}
        url="/"
      ></Titlebar>

      <Row>
        <Col sz={12} sm={12} lg={12}>
          <Card showHeader={false}>
            <DataGrid
              className={"dx-card wide-card"}
              dataSource={data}
              keyExpr={"enrollment_id"}
              noDataText={loadingText}
              showBorders={false}
              columnAutoWidth={true}
              columnHidingEnabled={true}
            >
              <Paging defaultPageSize={10} />
              <Pager showPageSizeSelector={true} showInfo={true} />
              <FilterRow visible={true} />
              <LoadPanel enabled={loading} />
              <ColumnChooser enabled={true} mode="select"></ColumnChooser>

              <Column
                dataField="cycle_code"
                caption="Round"
                sortOrder="desc"
                hidingPriority={12}
              ></Column>
              <Column
                dataField="scheme_name"
                caption="Scheme"
                hidingPriority={11}
              ></Column>
              <Column
                dataField="method_name"
                caption="Method"
                hidingPriority={10}
              ></Column>
              <Column
                dataField="report_date"
                caption="Report Date"
                dataType="date"
                format="dd MMM yyyy"
                hidingPriority={8}
              ></Column>
              <Column
                caption="Score"
                hidingPriority={9}
                cellRender={scoreCell}
              ></Column>
              <Column
                dataField="overall_performance"
                caption="Performance"
                hidingPriority={13}
                cellRender={performanceCell}
              ></Column>
              <Column
                dataField="acceptable_count"
                caption="Acceptable"
                hidingPriority={5}
              ></Column>
              <Column
                dataField="warning_count"
                caption="Warning"
                hidingPriority={4}
              ></Column>
              <Column
                dataField="unacceptable_count"
                caption="Unacceptable"
                hidingPriority={6}
              ></Column>
              <Column
                dataField="not_reported_count"
                caption="Not Reported"
                hidingPriority={3}
              ></Column>
              <Column
                dataField="report_number"
                caption="Report Number"
                hidingPriority={2}
                visible={false}
              ></Column>

              <Column type="buttons" caption="" width={150}>
                <GridButton
                  text="Details"
                  hint="See how each sample was scored"
                  onClick={(e: any) =>
                    navigate(
                      `/facility/performance/view/${e.row.data.enrollment_id}`,
                    )
                  }
                />
                <GridButton
                  text="Report"
                  hint="Open the PT performance report"
                  onClick={(e: any) =>
                    navigate(
                      `/facility/reports/pt-performance/${e.row.data.enrollment_id}`,
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

export default FacilityPerformanceList;
