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

import Assist from "../../../classes/assist";
import PageConfig from "../../../classes/page-config";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

const FacilityHIVVLResultList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loadingText, setLoadingText] = useState("Loading data...");
  const [loading, setLoading] = useState(true);
  const hasRun = useRef(false);

  //the lab this user reports for, carried on the sign in token
  const labId = Assist.getLaboratoryId(user);

  const pageConfig = new PageConfig(
    "My HIV-1 Viral Load Results",
    `hiv-vl-results/list/${labId}`,
    "",
    "HIV-1 Viral Load Result",
    "",
    Assist.LABORATORY_ROLES,
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

    if (!labId) {
      setLoading(false);
      setLoadingText("Your account is not linked to a laboratory");
      Assist.showMessage(
        "Your account is not linked to a laboratory. Please contact the scheme administrator.",
        "error",
      );
      return;
    }

    setLoading(true);

    Assist.loadData(pageConfig.Title, pageConfig.Url)
      .then((res: any) => {
        setData(res);
        setLoading(false);
        setLoadingText(res.length === 0 ? "No Data" : "");
      })
      .catch((message) => {
        setLoading(false);
        Assist.showMessage(message, "error");
        setLoadingText("Could not show information");
      });
  }, []);

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
                      ? `/facility/hiv-vl-results/edit/${e.data.id}`
                      : `/facility/hiv-vl-results/view/${e.data.id}`;
                  return <Link to={target}>{e.text}</Link>;
                }}
              ></Column>
              <Column
                dataField="ptcycle.name"
                caption="Cycle"
                hidingPriority={22}
              ></Column>
              <Column
                dataField="methodsample.name"
                caption="Sample ID"
                hidingPriority={20}
              ></Column>
              <Column
                dataField="method.name"
                caption="Method"
                hidingPriority={19}
              ></Column>
              <Column
                dataField="result_reported"
                caption="Reported"
                hidingPriority={18}
              ></Column>
              <Column
                dataField="viral_load_log10"
                caption="Viral Load (log10)"
                dataType="number"
                format="#0.00"
                hidingPriority={17}
              ></Column>
              <Column
                dataField="not_tested_reason"
                caption="Reason Not Tested"
                hidingPriority={16}
              ></Column>
              <Column
                dataField="date_panel_received"
                caption="Panel Received"
                dataType="date"
                format="dd MMM yyyy"
                hidingPriority={15}
              ></Column>
              <Column
                dataField="date_tested"
                caption="Panel Tested"
                dataType="date"
                format="dd MMM yyyy"
                hidingPriority={14}
              ></Column>
              <Column
                dataField="detection_assay"
                caption="Detection Assay"
                hidingPriority={13}
                visible={false}
              ></Column>
              <Column
                dataField="extraction_assay"
                caption="Extraction Assay"
                hidingPriority={12}
                visible={false}
              ></Column>
              <Column
                dataField="assay_kit_lot_number"
                caption="Kit Lot No."
                hidingPriority={11}
                visible={false}
              ></Column>
              <Column
                dataField="assay_kit_expiry_date"
                caption="Kit Expiry"
                dataType="date"
                format="dd MMM yyyy"
                hidingPriority={10}
                visible={false}
              ></Column>
              <Column
                dataField="assay_serial_number"
                caption="Assay Serial No."
                hidingPriority={9}
                visible={false}
              ></Column>
              <Column
                dataField="tested_by"
                caption="Tested By"
                hidingPriority={8}
                visible={false}
              ></Column>
              <Column
                dataField="supervisor_name"
                caption="Supervisor"
                hidingPriority={7}
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

export default FacilityHIVVLResultList;
