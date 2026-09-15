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
  Button as GridButton,
} from "devextreme-react/data-grid";

import Assist from "../../../classes/assist";
import PageConfig from "../../../classes/page-config";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

const AdminUserList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loadingText, setLoadingText] = useState("Loading data...");
  const [loading, setLoading] = useState(true);
  const hasRun = useRef(false);

  const pageConfig = new PageConfig("Users", "users/list", "", "Users", "", [
    Assist.ROLE_ADMIN,
  ]);

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
          setLoadingText("No announcements added for now");
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
      text: "New User",
      onClick: () => navigate("/admin/users/add"),
    }),
    [],
  );

  //a laboratory role reads differently from a provider one, so it is coloured
  const roleCell = (e: any) => {
    const name = e.value;
    if (!name) return <span style={{ color: "#999" }}>Not set</span>;

    const isLab = Assist.LABORATORY_ROLES.includes(e.data.role_id);
    return <span style={{ color: isLab ? "#1565c0" : "#2e7d32" }}>{name}</span>;
  };

  //provider staff belong to no laboratory, which is a fact rather than a gap
  const facilityCell = (e: any) => {
    const laboratory = e.data.laboratory;
    if (!laboratory) {
      return <span style={{ color: "#999" }}>Provider</span>;
    }

    return (
      <span>
        {laboratory.name}
        {laboratory.code ? (
          <small style={{ color: "#777" }}> ({laboratory.code})</small>
        ) : null}
      </span>
    );
  };

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
              {/* there is no delete endpoint for an account, and the row
                  button only ever removed it from this page */}
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
                  showText="inMenu"
                  widget="dxButton"
                  options={addButtonOptions}
                />
                <Item name="columnChooserButton" />
              </Toolbar>
              <Column dataField="id" caption="ID" hidingPriority={4}></Column>
              <Column
                dataField="fname"
                caption="First Name"
                hidingPriority={10}
                cellRender={(e) => (
                  <Link to={`/admin/users/view/${e.data.id}`}>{e.text}</Link>
                )}
              ></Column>
              <Column
                dataField="lname"
                caption="Last Name"
                hidingPriority={9}
              ></Column>
              <Column
                dataField="role.name"
                caption="Role"
                hidingPriority={8}
                cellRender={roleCell}
              ></Column>
              <Column
                dataField="laboratory.name"
                caption="Facility"
                hidingPriority={7}
                cellRender={facilityCell}
              ></Column>
              <Column
                dataField="laboratory.code"
                caption="Facility Code"
                width={120}
                hidingPriority={3}
                visible={false}
              ></Column>
              <Column
                dataField="mobile"
                caption="Mobile"
                hidingPriority={5}
              ></Column>
              <Column
                dataField="email"
                caption="Email"
                hidingPriority={6}
              ></Column>

              <Column
                dataField="created_by"
                caption="User"
                minWidth={120}
                hidingPriority={2}
                visible={false}
              ></Column>
              <Column
                dataField="created_at"
                caption="Date"
                dataType="date"
                format="dd MMM yyy HH:MM"
                hidingPriority={1}
              ></Column>
              <Column type="buttons" caption="" width={110}>
                <GridButton
                  text="View"
                  hint="See the account"
                  onClick={(e: any) =>
                    navigate(`/admin/users/view/${e.row.data.id}`)
                  }
                />
                <GridButton
                  text="Edit"
                  hint="Change the account"
                  onClick={(e: any) =>
                    navigate(`/admin/users/edit/${e.row.data.id}`)
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

export default AdminUserList;