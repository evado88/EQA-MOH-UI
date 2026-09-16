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

const AdminTBXpertXDRResultList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loadingText, setLoadingText] = useState("Loading data...");
  const [loading, setLoading] = useState(true);
  //the round being viewed. Nothing is listed until one is chosen -
  //a result only means anything in the context of its round.
  const [cycles, setCycles] = useState<Array<any>>([]);
  const [cycleId, setCycleId] = useState<undefined | number>(undefined);
  const hasRun = useRef(false);

  const pageConfig = new PageConfig(
    "TB Xpert XDR Result List",
    "tb-xpert-xdr-results/list",
    "",
    "TB Xpert XDR Result",
    "",
    Assist.ADMIN_ROLES,
  );


  //the rounds that have sheets on this form, and the results within one
  const cyclesUrl = `tb-xpert-xdr-results/cycles`;
  const resultsUrl = (id: number) =>
    `tb-xpert-xdr-results/list?pt_cycle_id=${id}`;

  useEffect(() => {
    //check if initialized
    if (hasRun.current) return;
    hasRun.current = true;

    //check permissions and audit
    if (!Assist.checkPageAuditPermission(pageConfig, user)) {
      Assist.redirectUnauthorized(navigate);
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
            ? "No round has results on this form yet"
            : "Choose a round to see its results",
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
      setLoadingText("Choose a round to see its results");
      return;
    }

    setLoading(true);

    Assist.loadData(pageConfig.Title, resultsUrl(value))
      .then((res: any) => {
        setData(res);
        setLoading(false);
        setLoadingText(res.length === 0 ? "This round has no results" : "");
      })
      .catch((message) => {
        setLoading(false);
        Assist.showMessage(message, "error");
        setLoadingText("Could not show information");
      });
  };

  const chosenCycle = () => cycles.find((c: any) => c.pt_cycle_id === cycleId);

  return (
    <div className="page-content" style={{ minHeight: "862px" }}>
      <Titlebar
        title={pageConfig.Title}
        section={"Administration"}
        icon={"cubes"}
        url="/"
      ></Titlebar>

      <Row>
        <Col sz={12} sm={12} lg={12}>
          <Card showHeader={false}>
            <div className="dx-field">
              <div className="dx-field-label">Round</div>
              <SelectBox
                className="dx-field-value"
                placeholder="Choose a round..."
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
            {chosenCycle() && (
              <div className="dx-field">
                <div className="dx-field-value-static">
                  <small>
                    {chosenCycle().cycle_status} &middot;{" "}
                    {chosenCycle().result_count} result(s) &middot;{" "}
                    {chosenCycle().draft_count} draft &middot;{" "}
                    {chosenCycle().pending_count} awaiting review &middot;{" "}
                    {chosenCycle().approved_count} approved
                  </small>
                </div>
              </div>
            )}
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
              <Column dataField="id" caption="ID" hidingPriority={24}></Column>
              <Column
                dataField="name"
                caption="Name"
                hidingPriority={23}
                sortOrder="asc"
                cellRender={(e) => {
                  const target =
                    e.data.status.status_name == "Draft"
                      ? `/admin/tb-xpert-xdr-results/edit/${e.data.id}`
                      : `/admin/tb-xpert-xdr-results/view/${e.data.id}`;
                  return <Link to={target}>{e.text}</Link>;
                }}
              ></Column>
              <Column
                dataField="ptcycle.name"
                caption="Cycle"
                hidingPriority={22}
              ></Column>
              <Column
                dataField="laboratory.name"
                caption="Laboratory"
                hidingPriority={21}
              ></Column>
              <Column
                dataField="methodsample.name"
                caption="Method Sample"
                hidingPriority={20}
              ></Column>
              <Column
                dataField="date_tested"
                caption="Date Tested"
                dataType="date"
                format="dd MMM yyyy"
                hidingPriority={19}
              ></Column>
              <Column
                dataField="result_interpretable"
                caption="Interpretable"
                hidingPriority={18}
              ></Column>
              <Column
                dataField="tb_detection_result"
                caption="TB Detection Result"
                hidingPriority={17}
              ></Column>
              <Column
                dataField="inh_result"
                caption="INH Result"
                hidingPriority={16}
              ></Column>
              <Column
                dataField="flq_result"
                caption="FLQ Result"
                hidingPriority={15}
              ></Column>
              <Column
                dataField="amk_result"
                caption="AMK Result"
                hidingPriority={14}
              ></Column>
              <Column
                dataField="eth_result"
                caption="ETH Result"
                hidingPriority={13}
              ></Column>
              <Column
                dataField="uninterpretable_result"
                caption="Uninterpretable Result"
                hidingPriority={11}
              ></Column>
              <Column
                dataField="error_code"
                caption="Error Code"
                hidingPriority={10}
              ></Column>
              <Column
                dataField="spc_ahpc"
                caption="SPC-ahpC"
                hidingPriority={9}
                visible={false}
              ></Column>
              <Column
                dataField="inha"
                caption="inhA"
                hidingPriority={9}
                visible={false}
              ></Column>
              <Column
                dataField="katg"
                caption="KatG"
                hidingPriority={9}
                visible={false}
              ></Column>
              <Column
                dataField="fabg1"
                caption="fabG1"
                hidingPriority={9}
                visible={false}
              ></Column>
              <Column
                dataField="gyra1"
                caption="gyrA1"
                hidingPriority={9}
                visible={false}
              ></Column>
              <Column
                dataField="gyra2"
                caption="gyrA2"
                hidingPriority={9}
                visible={false}
              ></Column>
              <Column
                dataField="gyra3"
                caption="gyrA3"
                hidingPriority={9}
                visible={false}
              ></Column>
              <Column
                dataField="gyrb2"
                caption="gyrB2"
                hidingPriority={9}
                visible={false}
              ></Column>
              <Column
                dataField="rrs"
                caption="rrs"
                hidingPriority={9}
                visible={false}
              ></Column>
              <Column
                dataField="stage.stage_name"
                caption="Stage"
                hidingPriority={3}
              ></Column>
              <Column
                dataField="status.status_name"
                caption="Status"
                hidingPriority={2}
              ></Column>
              <Column
                dataField="created_at"
                caption="Date"
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

export default AdminTBXpertXDRResultList;
