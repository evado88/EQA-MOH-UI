import { useState, useEffect, useRef } from "react";
import { Titlebar } from "../../components/titlebar";
import { Card } from "../../components/card";
import { TextBox } from "devextreme-react/text-box";
import SelectBox from "devextreme-react/select-box";
import CheckBox from "devextreme-react/check-box";
import RadioGroup from "devextreme-react/radio-group";
import Button from "devextreme-react/button";
import { Validator, RequiredRule } from "devextreme-react/validator";
import ValidationSummary from "devextreme-react/validation-summary";
import { LoadIndicator } from "devextreme-react/load-indicator";
import { LoadPanel as PagePanel } from "devextreme-react/load-panel";
import { confirm } from "devextreme/ui/dialog";
import Assist from "../../classes/assist";
import PageConfig from "../../classes/page-config";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const SchemeRegister = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { eId } = useParams();
  const schemeId = Number(eId);

  const [scheme, setScheme] = useState<any>(null);
  const [labTypes, setLabTypes] = useState<Array<any>>([]);

  // the laboratory being registered
  const [name, setName] = useState<string | undefined>(undefined);
  const [labTypeId, setLabTypeId] = useState<number | undefined>(undefined);
  const [physicalAddress, setPhysicalAddress] = useState<string | undefined>(undefined);
  const [selectedMethods, setSelectedMethods] = useState<Set<number>>(new Set());

  // controlled-document agreement
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [waiver, setWaiver] = useState<boolean | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const hasRun = useRef(false);

  const pageConfig = new PageConfig(
    "Scheme Registration",
    "",
    "",
    "Scheme",
    "",
    Assist.LABORATORY_ROLES,
  );

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    if (!Assist.checkPageAuditPermission(pageConfig, user)) {
      Assist.redirectUnauthorized(navigate);
      return;
    }

    setTimeout(() => {
      Promise.all([
        Assist.loadData("Schemes", "registration/schemes"),
        Assist.loadData("Lab types", "laboratorys/id/0"),
      ])
        .then(([schemes, labData]: [any, any]) => {
          const found = (schemes || []).find((s: any) => s.id === schemeId);
          if (!found) {
            Assist.showMessage("That scheme could not be found", "error");
            navigate("/facility/schemes");
            return;
          }
          setScheme(found);
          setLabTypes(labData?.labtypeList || []);
          // prefill the laboratory name from the user's facility
          setName(user?.facility_name || undefined);
          setLoading(false);
        })
        .catch((message) => {
          setLoading(false);
          Assist.showMessage(message, "error");
        });
    }, Assist.DEV_DELAY);
  }, []);

  const toggleMethod = (id: number, on: boolean) => {
    setSelectedMethods((prev) => {
      const next = new Set(prev);
      on ? next.add(id) : next.delete(id);
      return next;
    });
  };

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedMethods.size === 0) {
      Assist.showMessage("Please select at least one method", "error");
      return;
    }

    if (!termsAccepted) {
      Assist.showMessage(
        "Please accept the terms and conditions to continue",
        "error",
      );
      return;
    }

    if (scheme.requires_confidentiality_waiver && waiver === null) {
      Assist.showMessage(
        "Please answer the confidentiality waiver question",
        "error",
      );
      return;
    }

    const result = confirm(
      `Submit your registration for ${scheme.name} for review?`,
      "Confirm registration",
    );
    result.then((ok) => ok && register());
  };

  const register = () => {
    setSaving(true);

    const postData = {
      user_email: user?.sub,
      scheme_id: schemeId,
      name,
      lab_type_id: labTypeId,
      physical_address: physicalAddress,
      facility_id: user?.facility_id || null,
      facility_name: user?.facility_name || null,
      position: user?.position || null,
      method_list: Array.from(selectedMethods).map((id) => ({ id })),
      terms_accepted: termsAccepted,
      confidentiality_waiver: scheme.requires_confidentiality_waiver ? waiver : null,
    };

    setTimeout(() => {
      Assist.postPutData("Scheme registration", "registration/register-scheme", postData, 0)
        .then((data: any) => {
          setSaving(false);
          // a duplicate still submits; warn but treat as success
          Assist.showMessage(data?.message, data?.duplicate_warning ? "warning" : "success");
          navigate("/facility/schemes");
        })
        .catch((message) => {
          setSaving(false);
          Assist.showMessage(message, "error");
        });
    }, Assist.DEV_DELAY);
  };

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
      <Titlebar
        title={scheme ? `Register: ${scheme.name}` : "Scheme Registration"}
        section="Schemes"
        icon="clipboard-list"
        url="/facility/schemes"
      />

      {scheme && (
        <form onSubmit={onFormSubmit}>
          {scheme.form_control_number && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 8,
                background: "#f8fafc",
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                padding: "8px 14px",
                margin: "0 0 14px",
                fontSize: 12,
                color: "#475569",
              }}
            >
              <span>
                Document No: <strong>{scheme.form_control_number}</strong>
              </span>
              <span>
                Version: <strong>{scheme.form_version || "—"}</strong>
              </span>
            </div>
          )}
          <Card title="Laboratory details" showHeader={true}>
            <div className="dx-fieldset dx-fieldset-cols">
              <div className="dx-field dx-field-span-2">
                <div className="dx-field-label">Laboratory / Facility Name</div>
                <TextBox
                  className="dx-field-value"
                  placeholder="Laboratory name"
                  value={name}
                  disabled={saving}
                  onValueChange={setName}
                >
                  <Validator>
                    <RequiredRule message="Laboratory name is required" />
                  </Validator>
                </TextBox>
              </div>
              <div className="dx-field">
                <div className="dx-field-label">Type of Lab</div>
                <SelectBox
                  className="dx-field-value"
                  placeholder="Type of Lab"
                  dataSource={labTypes}
                  displayExpr="name"
                  valueExpr="id"
                  value={labTypeId}
                  disabled={saving}
                  onValueChange={setLabTypeId}
                >
                  <Validator>
                    <RequiredRule message="Type of Lab is required" />
                  </Validator>
                </SelectBox>
              </div>
              <div className="dx-field">
                <div className="dx-field-label">Physical Address</div>
                <TextBox
                  className="dx-field-value"
                  placeholder="Physical address"
                  value={physicalAddress}
                  disabled={saving}
                  onValueChange={setPhysicalAddress}
                >
                  <Validator>
                    <RequiredRule message="Physical Address is required" />
                  </Validator>
                </TextBox>
              </div>
            </div>
          </Card>

          <Card title={`Methods in ${scheme.name}`} showHeader={true}>
            <p style={{ color: "#6b7280", marginTop: 0 }}>
              Select the methods your laboratory provides. Each is reviewed by
              the administrator.
            </p>
            {(scheme.services || []).map((svc: any) => (
              <div key={svc.id} style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontWeight: 600,
                    color: "#374151",
                    margin: "6px 0",
                    borderBottom: "1px solid #eef0f2",
                    paddingBottom: 4,
                  }}
                >
                  {svc.name}
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                    gap: 10,
                  }}
                >
                  {(svc.methods || []).map((m: any) => (
                    <label
                      key={m.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 12px",
                        border: "1px solid #e5e7eb",
                        borderRadius: 10,
                        background: selectedMethods.has(m.id) ? "#0d6e6e10" : "#fff",
                        cursor: "pointer",
                      }}
                    >
                      <CheckBox
                        value={selectedMethods.has(m.id)}
                        disabled={saving}
                        onValueChanged={(e: any) => toggleMethod(m.id, e.value)}
                      />
                      <span>{m.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

          </Card>

          <Card title="Terms and Conditions" showHeader={true}>
            <p style={{ color: "#374151" }}>
              By signing this application form, the laboratory/site agrees to the
              terms and conditions provided in the scheme protocol and other
              documents as provided by{" "}
              <strong>{scheme.form_terms_authority || scheme.provider_name}</strong>.
            </p>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                margin: "10px 0",
              }}
            >
              <CheckBox
                value={termsAccepted}
                disabled={saving}
                onValueChanged={(e: any) => setTermsAccepted(e.value)}
              />
              <span>I accept the terms and conditions</span>
            </label>

            {scheme.requires_confidentiality_waiver && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 600, color: "#374151" }}>
                  Confidentiality waiver
                </div>
                <p style={{ color: "#6b7280", margin: "4px 0 8px" }}>
                  The identity of participants in this PT scheme is kept
                  confidential and known only to persons involved in the operation
                  of the PT scheme, unless the participant waives their
                  confidentiality. Do you want to waive your confidentiality?
                </p>
                <RadioGroup
                  layout="horizontal"
                  dataSource={[
                    { text: "Yes", value: true },
                    { text: "No", value: false },
                  ]}
                  displayExpr="text"
                  valueExpr="value"
                  value={waiver}
                  disabled={saving}
                  onValueChanged={(e: any) => setWaiver(e.value)}
                />
              </div>
            )}

            <div className="dx-field">
              <ValidationSummary id="summaryMain" />
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              <Button
                type={saving ? "normal" : "default"}
                disabled={loading || saving}
                useSubmitBehavior={true}
                width={220}
              >
                <LoadIndicator className="button-indicator" visible={saving} />
                <span className="dx-button-text">Submit for Review</span>
              </Button>
              <Button
                text="Cancel"
                disabled={saving}
                onClick={() => navigate("/facility/schemes")}
              />
            </div>
          </Card>
        </form>
      )}
    </div>
  );
};

export default SchemeRegister;
