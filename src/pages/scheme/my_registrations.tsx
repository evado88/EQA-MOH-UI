import { useState, useEffect, useRef } from "react";
import { Titlebar } from "../../components/titlebar";
import { LoadPanel as PagePanel } from "devextreme-react/load-panel";
import { TextBox } from "devextreme-react/text-box";
import Button from "devextreme-react/button";
import FileUploader from "devextreme-react/file-uploader";
import { LoadIndicator } from "devextreme-react/load-indicator";
import Assist from "../../classes/assist";
import PageConfig from "../../classes/page-config";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const STATUS_COLORS: Record<string, string> = {
  Submitted: "#2563eb",
  "Under Review": "#2563eb",
  Approved: "#047857",
  Rejected: "#b91c1c",
  Draft: "#6b7280",
};

const MyRegistrations = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [rows, setRows] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  // per-registration proof input state, keyed by registration id
  const [files, setFiles] = useState<Record<number, File | null>>({});
  const [refs, setRefs] = useState<Record<number, string>>({});
  const hasRun = useRef(false);

  const pageConfig = new PageConfig(
    "My Registrations",
    "",
    "",
    "Registration",
    "",
    Assist.LABORATORY_ROLES,
  );

  const load = () => {
    setLoading(true);
    Assist.loadData("My Registrations", "registration/my-registrations")
      .then((data: any) => {
        setRows(data || []);
        setLoading(false);
      })
      .catch((message) => {
        setLoading(false);
        Assist.showMessage(message, "error");
      });
  };

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    if (!Assist.checkPageAuditPermission(pageConfig, user)) {
      Assist.redirectUnauthorized(navigate);
      return;
    }
    setTimeout(load, Assist.DEV_DELAY);
  }, []);

  const submitProof = async (reg: any) => {
    const file = files[reg.id];
    if (!file) {
      Assist.showMessage("Please choose your proof of payment file", "error");
      return;
    }
    setBusyId(reg.id);
    try {
      const attachment: any = await Assist.uploadFile(
        "Proof of payment",
        `attachments/create/type/PaymentProof/parent/${reg.id}`,
        file,
      );
      await Assist.postPutData(
        "Proof of payment",
        `laboratorys/payment-proof/${reg.id}`,
        {
          user_email: user.sub,
          attachment_id: attachment.id,
          reference: refs[reg.id] || null,
        },
        1,
      );
      Assist.showMessage(
        "Proof of payment submitted. Your registration has been sent back for approval.",
        "success",
      );
      setBusyId(null);
      load();
    } catch (message: any) {
      setBusyId(null);
      Assist.showMessage(message, "error");
    }
  };

  const money = (reg: any) =>
    reg.payment_amount != null
      ? `${reg.payment_currency} ${reg.payment_amount}`
      : `${reg.payment_currency ?? ""} (fee not set - contact the scheme)`;

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
      <Titlebar title="My Registrations" section="Schemes" icon="file" url="#" />

      {!loading && rows.length === 0 && (
        <p style={{ color: "#6b7280" }}>
          You have not registered for any schemes yet.{" "}
          <a onClick={() => navigate("/facility/schemes")} style={{ cursor: "pointer", color: "#0d6e6e" }}>
            Register for a scheme
          </a>
          .
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {rows.map((reg) => {
          const awaitingPayment = reg.stage_name === "Awaiting Payment";
          return (
            <div
              key={reg.id}
              style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 18,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>
                    {reg.scheme_name || reg.name}
                  </div>
                  <div style={{ fontSize: 13, color: "#6b7280" }}>
                    {reg.name} · {reg.registration_number || reg.code}
                  </div>
                </div>
                <span
                  style={{
                    alignSelf: "flex-start",
                    background: `${STATUS_COLORS[reg.status_name] || "#6b7280"}1a`,
                    color: STATUS_COLORS[reg.status_name] || "#6b7280",
                    borderRadius: 999,
                    padding: "3px 12px",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {reg.stage_name}
                </span>
              </div>

              {awaitingPayment && (
                <div
                  style={{
                    marginTop: 14,
                    padding: 14,
                    background: "#fffbeb",
                    border: "1px solid #fde68a",
                    borderRadius: 10,
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>
                    Payment required: {money(reg)}
                  </div>
                  {reg.payment_instructions && (
                    <p style={{ margin: "4px 0", fontSize: 13 }}>{reg.payment_instructions}</p>
                  )}
                  {reg.bank_account_details && (
                    <p style={{ margin: "4px 0", fontSize: 13, whiteSpace: "pre-line" }}>
                      <strong>Bank: </strong>
                      {reg.bank_account_details}
                    </p>
                  )}
                  {reg.mobile_money_details && (
                    <p style={{ margin: "4px 0", fontSize: 13, whiteSpace: "pre-line" }}>
                      <strong>Mobile Money: </strong>
                      {reg.mobile_money_details}
                    </p>
                  )}

                  <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8, maxWidth: 420 }}>
                    <TextBox
                      placeholder="Payment reference (optional)"
                      value={refs[reg.id] || ""}
                      disabled={busyId === reg.id}
                      onValueChange={(v) => setRefs((p) => ({ ...p, [reg.id]: v }))}
                    />
                    <FileUploader
                      multiple={false}
                      uploadMode="useForm"
                      selectButtonText="Choose proof of payment"
                      labelText=""
                      accept="image/*,application/pdf"
                      disabled={busyId === reg.id}
                      onValueChanged={(e: any) =>
                        setFiles((p) => ({ ...p, [reg.id]: e.value?.[0] ?? null }))
                      }
                    />
                    <Button
                      text="Submit proof of payment"
                      type="default"
                      disabled={busyId === reg.id}
                      onClick={() => submitProof(reg)}
                    >
                      <LoadIndicator className="button-indicator" visible={busyId === reg.id} />
                      <span className="dx-button-text">Submit proof of payment</span>
                    </Button>
                  </div>
                </div>
              )}

              {reg.payment_required && !awaitingPayment && (
                <div style={{ marginTop: 10, fontSize: 13, color: "#6b7280" }}>
                  Payment: {money(reg)}
                  {reg.payment_submitted_at ? " · proof submitted" : ""}
                  {reg.payment_reference ? ` · ref ${reg.payment_reference}` : ""}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MyRegistrations;
