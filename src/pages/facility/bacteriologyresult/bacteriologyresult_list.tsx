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
  Editing,
  Toolbar,
  Item,
} from "devextreme-react/data-grid";
import SelectBox from "devextreme-react/select-box";

import Assist from "../../../classes/assist";
import PageConfig from "../../../classes/page-config";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

const FacilityBacteriologyResultList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loadingText, setLoadingText] = useState("Loading data...");
  const [loading, setLoading] = useState(true);
  //the round being viewed. Nothing is listed until one is chosen -
  //a worksheet only means anything in the context of its survey.
  const [cycles, setCycles] = useState<Array<any>>([]);
  const [cycleId, setCycleId] = useState<undefined | number>(undefined);
  const hasRun = useRef(false);

  //the lab this user reports for, carried on the sign in token
  const labId = Assist.getLaboratoryId(user);

  const pageConfig = new PageConfig(
    "My Bacteriology Worksheets",
    `bacteriology-results/list/${labId}`,
    "",
    "Bacteriology Result",
    "",
    Assist.LABORATORY_ROLES,
  );

  //the rounds that have worksheets on this form, and the worksheets within one
  const cyclesUrl = `bacteriology-results/cycles?lab_id=${labId}`;
  const resultsUrl = (id: number) =>
    `bacteriology-results/list?lab_id=${labId}&pt_cycle_id=${id}`;

  useEffect(() => {
    //check if initialized
    if (hasRun.current) return;
    hasRun.current = true;

    //check permissions and audit
    if (!Assist.checkPageAuditPermission(pageConfig, user)) {
      Assist.redirectUnauthorized(navigate);
      return;
    }

    if (!labId) {
      setLoading(false);
      setLoadingText("Your account is not linked to a laboratory");
      Assist.showMessage(
        "Your account is not linked to a laboratory. Please contact the scheme administrator.",
        "error",
      );
      return;
    }

    loadCycles();
  }, []);

  /** The rounds this listing can be opened on */
  const loadCycles = () => {
    setLoading(true);

    Assist.loadData(`${pageConfig.Title} Rounds`, cyclesUrl)
      .then((res: any) => {
        setCycles(res);
        setLoading(false);
        setLoadingText(
          res.length === 0
            ? "No survey has worksheets on this form yet"
            : "Choose a survey to see its worksheets",
        );
      })
      .catch((message) => {
        setLoading(false);
        Assist.showMessage(message, "error");
        setLoadingText("Could not show information");
      });
  };

  /** A round was chosen, so fetch just that round */
  const onCycleChange = (value: number) => {
    setCycleId(value);
    setData([]);

    if (!value) {
      setLoadingText("Choose a survey to see its worksheets");
      return;
    }

    setLoading(true);

    Assist.loadData(pageConfig.Title, resultsUrl(value))
      .then((res: any) => {
        setData(res);
        setLoading(false);
        setLoadingText(res.length === 0 ? "This survey has no worksheets" : "");
      })
      .catch((message) => {
        setLoading(false);
        Assist.showMessage(message, "error");
        setLoadingText("Could not show information");
      });
  };

  const chosenCycle = () => cycles.find((c: any) => c.pt_cycle_id === cycleId);

  /** How many antibiotics were reported on a worksheet's AST table.
   *  calculateCellValue receives the row data object directly (not { data }). */
  const astCount = (e: any) => (e?.astresult ?? []).length;

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
            <div className="dx-field">
              <div className="dx-field-label">Survey</div>
              <SelectBox
                className="dx-field-value"
                placeholder="Choose a survey..."
                dataSource={cycles}
                displayExpr={"label"}
                valueExpr={"pt_cycle_id"}
                searchEnabled={true}
                showClearButton={true}
                deferRendering={false}
                value={cycleId}
                onValueChange={(value) => onCycleChange(value)}
              />
            </div>
            {chosenCycle() &&
              (() => {
                const counts = Assist.resultStatusCounts(data);
                return (
                  <div className="dx-field">
                    <div className="dx-field-value-static">
                      <small>
                        {chosenCycle().cycle_status} &middot; {data.length}{" "}
                        worksheet(s) &middot; {counts.draft} draft &middot;{" "}
                        {counts.submitted} submitted &middot;{" "}
                        {counts.notSubmitted} not submitted
                      </small>
                    </div>
                  </div>
                );
              })()}
          </Card>
        </Col>
      </Row>

      <Row>
        <Col sz={12} sm={12} lg={12}>
          <Card showHeader={false}>
            <DataGrid
              className={"dx-card wide-card"}
              dataSource={data}
              keyExpr={"id"}
              noDataText={loadingText}
              showBorders={false}
              focusedRowEnabled={true}
              defaultFocusedRowIndex={0}
              columnAutoWidth={true}
              columnHidingEnabled={true}
            >
              <Paging defaultPageSize={10} />
              <Editing
                mode="row"
                allowUpdating={false}
                allowDeleting={false}
                allowAdding={false}
              />
              <Pager showPageSizeSelector={true} showInfo={true} />
              <FilterRow visible={true} />
              <LoadPanel enabled={loading} />
              <ColumnChooser enabled={true} mode="select"></ColumnChooser>
              <Toolbar>
                <Item name="columnChooserButton" />
              </Toolbar>
              <Column
                dataField="methodsample.name"
                caption="Sample ID"
                hidingPriority={6}
                sortOrder="asc"
                cellRender={(e) => {
                  const target =
                    Assist.canWriteFacility(user) && Assist.resultCaptureOpen(e.data)
                      ? `/facility/bacteriology-results/edit/${e.data.id}`
                      : `/facility/bacteriology-results/view/${e.data.id}`;
                  return <Link to={target}>{e.text}</Link>;
                }}
              ></Column>
              <Column
                dataField="status.status_name"
                caption="Status"
                hidingPriority={7}
                calculateCellValue={(row: any) =>
                  Assist.resultDisplayStatus(row)
                }
              ></Column>
              <Column
                dataField="testing_not_done"
                caption="Not Worked"
                dataType="boolean"
                hidingPriority={5}
              ></Column>
              <Column
                dataField="testing_not_done_reason"
                caption="Reason Not Worked"
                hidingPriority={0}
                visible={false}
              ></Column>
              <Column
                dataField="gram_stain_reaction"
                caption="Stain React"
                hidingPriority={4}
              ></Column>
              <Column
                dataField="gram_morphology"
                caption="Morphology"
                hidingPriority={3}
              ></Column>
              <Column
                dataField="organism_identified"
                caption="Organism Identified"
                hidingPriority={2}
              ></Column>
              <Column
                caption="AST Agents"
                dataType="number"
                hidingPriority={0}
                calculateCellValue={astCount}
              ></Column>
              <Column
                dataField="ptcycle.result_submission_due_date"
                caption="Result Submission Closing Date"
                dataType="date"
                format="dd MMM yyyy"
                hidingPriority={1}
              ></Column>
            </DataGrid>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default FacilityBacteriologyResultList;
