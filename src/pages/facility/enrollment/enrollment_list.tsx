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
import { LoadPanel as PagePanel } from "devextreme-react/load-panel";
import { confirm } from "devextreme/ui/dialog";

import Assist from "../../../classes/assist";
import PageConfig from "../../../classes/page-config";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

const FacilityEnrollmentList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [openCycles, setOpenCycles] = useState<Array<any>>([]);
  const [enrollments, setEnrollments] = useState<Array<any>>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openCyclesText, setOpenCyclesText] = useState("Loading data...");
  const [enrollmentsText, setEnrollmentsText] = useState("Loading data...");
  const hasRun = useRef(false);

  const pageConfig = new PageConfig(
    "My Enrolments",
    "",
    "",
    "Enrolment",
    "",
    Assist.LABORATORY_ROLES,
  );

  //the lab this user reports for, carried on the sign in token
  const labId = Assist.getLaboratoryId(user);

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
      setOpenCyclesText("Your account is not linked to a laboratory");
      setEnrollmentsText("Your account is not linked to a laboratory");
      Assist.showMessage(
        "Your account is not linked to a laboratory. Please contact the scheme administrator.",
        "error",
      );
      return;
    }

    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);

    Promise.all([
      Assist.loadData("Open PT Cycles", `pt-cycles/open/${labId}`),
      Assist.loadData("My Enrolments", `enrollments/list/lab/${labId}`),
    ])
      .then(([cycles, items]: [any, any]) => {
        setLoading(false);
        setOpenCycles(cycles);
        setEnrollments(items);

        setOpenCyclesText(
          cycles.length === 0 ? "There are no cycles open for enrolment" : "",
        );
        setEnrollmentsText(
          items.length === 0 ? "You have not enrolled in a cycle yet" : "",
        );
      })
      .catch((message) => {
        setLoading(false);
        setOpenCyclesText("Could not show information");
        setEnrollmentsText("Could not show information");
        Assist.showMessage(message, "error");
      });
  };

  const onEnrol = (cycle: any) => {
    confirm(
      `Are you sure you want to enrol in '${cycle.name}'? You will be enrolled for every method your laboratory has been approved for under ${cycle.scheme.name}.`,
      "Confirm enrolment",
    ).then((dialogResult) => {
      if (dialogResult) {
        submitEnrolment(cycle);
      }
    });
  };

  const submitEnrolment = (cycle: any) => {
    setSaving(true);

    const postData = {
      pt_cycle_id: cycle.id,
      lab_id: labId,
      user_id: user.userid,
    };

    Assist.postPutData(pageConfig.Title, `enrollments/apply`, postData, 0)
      .then((data: any) => {
        setSaving(false);
        Assist.showMessage(
          data && data.message
            ? data.message
            : "You have successfully enrolled in the cycle",
          "success",
        );
        loadData();
      })
      .catch((message) => {
        setSaving(false);
        Assist.showMessage(message, "error");
      });
  };

  //a lab confirms receipt once its panel arrives, which is what unlocks the
  //result forms for that enrolment
  const canReceiveSamples = (enrollment: any) => {
    return (
      enrollment.status.status_name === "Approved" &&
      !enrollment.samples_received_at &&
      enrollment.ptcycle.pt_cyle_status_id === Assist.PT_CYCLE_SAMPLES_SHIPPED
    );
  };

  const onReceiveSamples = (enrollment: any) => {
    confirm(
      `Confirm that you have received the samples for '${enrollment.ptcycle.name}'?`,
      "Confirm receipt",
    ).then((dialogResult) => {
      if (dialogResult) {
        submitReceiveSamples(enrollment);
      }
    });
  };

  const submitReceiveSamples = (enrollment: any) => {
    setSaving(true);

    const postData = {
      user_id: user.userid,
    };

    Assist.postPutData(
      pageConfig.Title,
      `enrollments/receive-samples/${enrollment.id}`,
      postData,
      1,
    )
      .then(() => {
        setSaving(false);
        Assist.showMessage(
          "The samples have been marked as received. You can now capture your results.",
          "success",
        );
        loadData();
      })
      .catch((message) => {
        setSaving(false);
        Assist.showMessage(message, "error");
      });
  };

  return (
    <div id="pageRoot" className="page-content" style={{ minHeight: "862px" }}>
      <PagePanel
        shadingColor="rgba(0,0,0,0.4)"
        position={{ of: "#pageRoot" }}
        visible={saving}
        showIndicator={true}
        shading={true}
        showPane={true}
        hideOnOutsideClick={false}
      />
      <Titlebar
        title={pageConfig.Title}
        section={"PT Calendar"}
        icon={"cubes"}
        url="/"
      ></Titlebar>

      <Row>
        <Col sz={12} sm={12} lg={12}>
          <Card title="Open for Enrolment" showHeader={true}>
            <DataGrid
              className={"dx-card wide-card"}
              dataSource={openCycles}
              keyExpr={"id"}
              noDataText={openCyclesText}
              showBorders={false}
              columnAutoWidth={true}
              columnHidingEnabled={true}
            >
              <Paging defaultPageSize={5} />
              <Pager showInfo={true} />
              <LoadPanel enabled={loading} />
              <Column
                dataField="name"
                caption="Cycle"
                hidingPriority={6}
              ></Column>
              <Column dataField="code" caption="Code" hidingPriority={5}></Column>
              <Column
                dataField="scheme.name"
                caption="Scheme"
                hidingPriority={4}
              ></Column>
              <Column
                dataField="shipping_date"
                caption="Shipping Date"
                dataType="date"
                format="dd MMM yyyy"
                hidingPriority={2}
              ></Column>
              <Column
                dataField="closing_date"
                caption="Enrolment Closes"
                dataType="date"
                format="dd MMM yyyy"
                hidingPriority={3}
              ></Column>
              <Column type="buttons" caption="" width={110}>
                <GridButton
                  text="Enrol"
                  hint="Enrol in this cycle"
                  onClick={(e: any) => onEnrol(e.row.data)}
                />
              </Column>
            </DataGrid>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col sz={12} sm={12} lg={12}>
          <Card title="My Enrolments" showHeader={true}>
            <DataGrid
              className={"dx-card wide-card"}
              dataSource={enrollments}
              keyExpr={"id"}
              noDataText={enrollmentsText}
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
                dataField="ptcycle.name"
                caption="Cycle"
                hidingPriority={8}
              ></Column>
              <Column
                dataField="scheme.name"
                caption="Scheme"
                hidingPriority={6}
              ></Column>
              <Column
                dataField="service.name"
                caption="Service"
                hidingPriority={5}
              ></Column>
              <Column
                dataField="method.name"
                caption="Method"
                hidingPriority={7}
              ></Column>
              <Column
                dataField="ptcyclestatusName"
                caption="Cycle Status"
                hidingPriority={4}
                calculateCellValue={(data: any) =>
                  Assist.PT_CYCLE_STATUS_NAMES[data.ptcycle.pt_cyle_status_id]
                }
              ></Column>
              <Column
                dataField="status.status_name"
                caption="Enrolment"
                hidingPriority={3}
              ></Column>
              <Column
                dataField="samples_received_at"
                caption="Samples Received"
                dataType="date"
                format="dd MMM yyyy"
                hidingPriority={2}
              ></Column>
              <Column
                dataField="created_at"
                caption="Enrolled On"
                dataType="date"
                format="dd MMM yyyy"
                hidingPriority={1}
              ></Column>
              <Column type="buttons" caption="" width={160}>
                <GridButton
                  text="Receive Samples"
                  hint="Confirm you have received this panel"
                  visible={(e: any) => canReceiveSamples(e.row.data)}
                  onClick={(e: any) => onReceiveSamples(e.row.data)}
                />
                <GridButton
                  text="Results"
                  hint="Capture the results for this panel"
                  visible={(e: any) => !!e.row.data.samples_received_at}
                  onClick={() =>
                    navigate("/facility/tb-xpert-ultra-results/list")
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

export default FacilityEnrollmentList;
