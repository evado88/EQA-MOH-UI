import { useState, useEffect, useRef } from "react";
import { Titlebar } from "../../components/titlebar";
import { Card } from "../../components/card";
import DataGrid, {
  Column,
  Pager,
  Paging,
  FilterRow,
} from "devextreme-react/data-grid";
import { LoadPanel as PagePanel } from "devextreme-react/load-panel";
import { Link } from "react-router-dom";
import Assist from "../../classes/assist";
import PageConfig from "../../classes/page-config";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const PaymentApprovals = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [rows, setRows] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);
  const hasRun = useRef(false);

  const pageConfig = new PageConfig(
    "Payment Approvals",
    "",
    "",
    "Registration",
    "",
    Assist.PAYMENT_APPROVER_ROLES,
  );

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    if (!Assist.checkPageAuditPermission(pageConfig, user)) {
      Assist.redirectUnauthorized(navigate);
      return;
    }
    setTimeout(() => {
      Assist.loadData("Payment Approvals", "laboratorys/payment-list")
        .then((data: any) => {
          setRows(data || []);
          setLoading(false);
        })
        .catch((message) => {
          setLoading(false);
          Assist.showMessage(message, "error");
        });
    }, Assist.DEV_DELAY);
  }, []);

  return (
    <div id="pageRoot" className="page-content" style={{ minHeight: "862px" }}>
      <PagePanel
        shadingColor="rgba(0,0,0,0.4)"
        position={{ of: "#pageRoot" }}
        visible={loading}
        showIndicator={true}
        shading={true}
        showPane={true}
      />
      <Titlebar title="Payment Approvals" section="Schemes" icon="money" url="#" />
      <Card title="Registrations in the payment workflow" showHeader={true}>
        <DataGrid
          className="dx-card wide-card"
          dataSource={rows}
          keyExpr="id"
          showBorders={false}
          columnAutoWidth={true}
          columnHidingEnabled={true}
        >
          <Paging defaultPageSize={15} />
          <Pager showPageSizeSelector={true} showInfo={true} />
          <FilterRow visible={true} />
          <Column
            dataField="name"
            caption="Laboratory"
            cellRender={(e: any) => (
              <Link to={`/admin/laboratorys/view/${e.data.id}`}>{e.text}</Link>
            )}
          />
          <Column dataField="code" caption="Code" />
          <Column dataField="stage.stage_name" caption="Stage" />
          <Column
            caption="Awaiting"
            cellRender={(e: any) =>
              e.data.stage?.stage_name === "Awaiting Payment"
                ? "Applicant payment"
                : "Final approval"
            }
          />
          <Column dataField="contact_person_name" caption="Contact" />
          <Column dataField="email_address" caption="Email" />
        </DataGrid>
      </Card>
    </div>
  );
};

export default PaymentApprovals;
