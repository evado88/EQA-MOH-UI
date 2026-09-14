import { useState, useEffect, useMemo, useRef } from "react";
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

import Assist from "../../../classes/assist";
import PageConfig from "../../../classes/page-config";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

const AdminTBXpertUltraResultList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loadingText, setLoadingText] = useState("Loading data...");
  const [loading, setLoading] = useState(true);
  const hasRun = useRef(false);

  const pageConfig = new PageConfig(
    "TB Xpert Ultra Result List",
    "tb-xpert-ultra-results/list",
    "",
    "TB Xpert Ultra Result",
    "",
    [Assist.ROLE_ADMIN],
  );

  useEffect(() => {
    //check if initialized
    if (hasRun.current) return;
    hasRun.current = true;

    //check permissions and audit
    if (!Assist.checkPageAuditPermission(pageConfig, user)) {
      Assist.redirectUnauthorized(navigate);
      return;
    }

    setLoading(true);

    Assist.loadData(pageConfig.Title, pageConfig.Url)
      .then((res: any) => {
        setData(res);
        setLoading(false);

        if (res.length === 0) {
          setLoadingText("No Data");
        } else {
          setLoadingText("");
        }
      })
      .catch((ex) => {
        Assist.showMessage(ex.Message, "error");
        setLoadingText("Could not show information");
      });
  }, []);

  const addButtonOptions = useMemo(
    () => ({
      icon: "add",
      text: "New TB Xpert Ultra Result",
      onClick: () => navigate("/admin/tb-xpert-ultra-results/add"),
    }),
    [],
  );

  return (
    <div className="page-content" style={{ minHeight: "862px" }}>
      <Titlebar
        title={pageConfig.Title}
        section={"Administration"}
        icon={"cubes"}
        url="/"
      ></Titlebar>
      {/* end widget */}

      {/* chart start */}
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
                <Item
                  location="before"
                  locateInMenu="auto"
                  widget="dxButton"
                  options={addButtonOptions}
                />
                <Item name="columnChooserButton" />
              </Toolbar>
              <Column dataField="id" caption="ID" hidingPriority={24}></Column>
              <Column
                dataField="name"
                caption="Name"
                hidingPriority={23}
                sortOrder="asc"
                cellRender={(e) => {
                  if (e.data.status.status_name == "Draft") {
                    return (
                    <Link to={`/admin/tb-xpert-ultra-results/edit/${e.data.id}`}>
                      {e.text}
                    </Link>
                  );
                  } else {
                    return (
                    <Link to={`/admin/tb-xpert-ultra-results/view/${e.data.id}`}>
                      {e.text}
                    </Link>
                  );
                  }
                }}
              ></Column>
              <Column
                dataField="scheme.name"
                caption="Scheme"
                hidingPriority={22}
              ></Column>
              <Column
                dataField="laboratory.name"
                caption="Laboratory"
                hidingPriority={21}
              ></Column>
              <Column
                dataField="service.name"
                caption="Service"
                hidingPriority={20}
              ></Column>
              <Column
                dataField="enrollment.name"
                caption="Enrollment"
                hidingPriority={19}
              ></Column>
              <Column
                dataField="ptcycle.name"
                caption="Cycle"
                hidingPriority={18}
              ></Column>
              <Column
                dataField="method.name"
                caption="Method"
                hidingPriority={17}
              ></Column>
              <Column
                dataField="methodsample.name"
                caption="Method Sample"
                hidingPriority={16}
              ></Column>
              <Column
                dataField="date_tested"
                caption="Date Tested"
                dataType="date"
                format="dd MMM yyyy"
                hidingPriority={15}
              ></Column>
              <Column
                dataField="result_interpretable"
                caption="Result Interpretable"
                hidingPriority={15}
              ></Column>
              <Column
                dataField="tb_detection_result"
                caption="TB Detection Result"
                hidingPriority={14}
              ></Column>
              <Column
                dataField="rif_result"
                caption="Rif Result"
                hidingPriority={13}
              ></Column>
              <Column
                dataField="uninterpretable_result"
                caption="Uninterpretable Result"
                hidingPriority={12}
              ></Column>
              <Column
                dataField="error_code"
                caption="Error Code"
                hidingPriority={12}
              ></Column>
              <Column
                dataField="ultra_spc"
                caption="Ultra SPC"
                hidingPriority={11}
              ></Column>
              <Column
                dataField="is1081_is6110"
                caption="IS1081-IS6110"
                hidingPriority={10}
              ></Column>
              <Column
                dataField="rpob1"
                caption="rpoB1"
                hidingPriority={9}
              ></Column>
              <Column
                dataField="rpob2"
                caption="rpoB2"
                hidingPriority={8}
              ></Column>
              <Column
                dataField="rpob3"
                caption="rpoB3"
                hidingPriority={7}
              ></Column>
              <Column
                dataField="rpob4"
                caption="rpoB4"
                hidingPriority={6}
              ></Column>
              <Column
                dataField="xpert_module_number"
                caption="Xpert Module Number"
                hidingPriority={5}
              ></Column>
              <Column
                dataField="stage.stage_name"
                caption="Stage"
                hidingPriority={4}
              ></Column>
              <Column
                dataField="status.status_name"
                caption="Status"
                hidingPriority={3}
              ></Column>
              <Column
                dataField="user.email"
                caption="User"
                minWidth={120}
                hidingPriority={2}
              ></Column>
              <Column
                dataField="created_at"
                caption="Date"
                dataType="date"
                format="dd MMM yyy HH:MM"
                hidingPriority={1}
              ></Column>
            </DataGrid>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminTBXpertUltraResultList;