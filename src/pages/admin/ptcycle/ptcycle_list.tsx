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

const AdminPTCycleList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loadingText, setLoadingText] = useState("Loading data...");
  const [loading, setLoading] = useState(true);
  const hasRun = useRef(false);

  const pageConfig = new PageConfig(
    "PT Cycle List",
    "pt-cycles/list",
    "",
    "PT Cycle",
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
      text: "New PT Cycle",
      onClick: () => navigate("/admin/pt-cycles/add"),
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
              <Column dataField="id" caption="ID" hidingPriority={13}></Column>
              <Column
                dataField="name"
                caption="Name"
                hidingPriority={12}
                sortOrder="asc"
                cellRender={(e) => {
                  if (e.data.status.status_name == "Draft") {
                    return (
                    <Link to={`/admin/pt-cycles/edit/${e.data.id}`}>
                      {e.text}
                    </Link>
                  );
                  } else {
                    return (
                    <Link to={`/admin/pt-cycles/view/${e.data.id}`}>
                      {e.text}
                    </Link>
                  );
                  }
                }}
              ></Column>
              <Column
                dataField="code"
                caption="Code"
                hidingPriority={11}
              ></Column>
              <Column
                dataField="scheme.name"
                caption="Scheme"
                hidingPriority={10}
              ></Column>
              <Column
                dataField="effective_date"
                caption="Effective Date"
                dataType="date"
                format="dd MMM yyyy"
                hidingPriority={9}
              ></Column>
              <Column
                dataField="ptcyclestatus.name"
                caption="PT Cycle Status"
                hidingPriority={8}
              ></Column>
              <Column
                dataField="closing_date"
                caption="Closing Date"
                dataType="date"
                format="dd MMM yyyy"
                hidingPriority={7}
              ></Column>
              <Column
                dataField="shipping_date"
                caption="Shipping Date"
                dataType="date"
                format="dd MMM yyyy"
                hidingPriority={6}
              ></Column>
              <Column
                dataField="reports_availability_date"
                caption="Reports Availability Date"
                dataType="date"
                format="dd MMM yyyy"
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

export default AdminPTCycleList;