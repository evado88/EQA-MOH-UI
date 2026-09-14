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

const FacilityTBXpertXDRResultList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loadingText, setLoadingText] = useState("Loading data...");
  const [loading, setLoading] = useState(true);
  const hasRun = useRef(false);

  //the lab this user reports for, carried on the sign in token
  const labId = Assist.getLaboratoryId(user);

  const pageConfig = new PageConfig(
    "My TB Xpert XDR Results",
    `tb-xpert-xdr-results/list/${labId}`,
    "",
    "TB Xpert XDR Result",
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
                      ? `/facility/tb-xpert-xdr-results/edit/${e.data.id}`
                      : `/facility/tb-xpert-xdr-results/view/${e.data.id}`;
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

export default FacilityTBXpertXDRResultList;
