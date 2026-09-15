import { useState, useEffect, useRef } from "react";
import { Titlebar } from "../../../components/titlebar";
import { Card } from "../../../components/card";
import { Row } from "../../../components/row";
import { Col } from "../../../components/column";
import Button from "devextreme-react/button";
import { LoadPanel } from "devextreme-react/load-panel";
import { useAuth } from "../../../context/AuthContext";
import PageConfig from "../../../classes/page-config";
import Assist from "../../../classes/assist";
import { useNavigate, useParams } from "react-router-dom";

const BLUE = "#1565c0";
const GREEN = "#2e7d32";

/**
 * One account: who it belongs to, what it may do, and where it reports.
 *
 * A user is not an item that goes out for review the way a laboratory or a
 * result does, so this is a detail page rather than an approval one - what it
 * offers is Edit, not Approve.
 */
const UserView = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { eId } = useParams();

  const [detail, setDetail] = useState<null | any>(null);
  //the same call carries the lists, so the ids can be named without a second one
  const [provinces, setProvinces] = useState<Array<any>>([]);
  const [districts, setDistricts] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const hasRun = useRef(false);

  const pageConfig = new PageConfig("View User", "", "", "User", "", [
    Assist.ROLE_ADMIN,
  ]);

  pageConfig.Id = eId == undefined ? 0 : Number(eId);

  useEffect(() => {
    //check if initialized
    if (hasRun.current) return;
    hasRun.current = true;

    //check permissions and audit
    if (!Assist.checkPageAuditPermission(pageConfig, user)) {
      Assist.redirectUnauthorized(navigate);
      return;
    }

    if (pageConfig.Id == 0) {
      setError(true);
      return;
    }

    setLoading(true);

    setTimeout(() => {
      Assist.loadData(pageConfig.Title, `users/id/${pageConfig.Id}`)
        .then((data: any) => {
          setLoading(false);
          setDetail(data.user);
          setProvinces(data.provinceList);
          setDistricts(data.districtList);
          setError(false);
        })
        .catch((message) => {
          setLoading(false);
          setError(true);
          Assist.showMessage(message, "error");
        });
    }, Assist.DEV_DELAY);
  }, []);

  const nameFor = (list: Array<any>, id: number | null) =>
    id ? list.find((item: any) => item.id === id)?.name : null;

  const field = (label: string, value: any) => (
    <div className="dx-field">
      <div className="dx-field-label">{label}</div>
      <div className="dx-field-value-static">
        <strong>{value || "-"}</strong>
      </div>
    </div>
  );

  const isLabAccount =
    detail != null && Assist.LABORATORY_ROLES.includes(detail.role_id);

  return (
    <div id="pageRoot" className="page-content">
      <LoadPanel
        shadingColor="rgba(0,0,0,0.4)"
        position={{ of: "#pageRoot" }}
        visible={loading}
        showIndicator={true}
        shading={true}
        showPane={true}
        hideOnOutsideClick={false}
      />

      <Titlebar
        title={
          detail ? `${detail.fname} ${detail.lname}` : pageConfig.Title
        }
        section={"Administration"}
        icon={"user"}
        url="/admin/user/list"
      ></Titlebar>

      <Row>
        <Col sz={12} sm={12} lg={5}>
          <Card title="Account" showHeader={true}>
            {detail && (
              <div className="dx-fieldset">
                <div className="dx-fieldset-header">Role and Facility</div>

                <div className="dx-field">
                  <div className="dx-field-label">Role</div>
                  <div className="dx-field-value-static">
                    <strong style={{ color: isLabAccount ? BLUE : GREEN }}>
                      {detail.role?.name || "Not set"}
                    </strong>
                  </div>
                </div>

                <div className="dx-field">
                  <div className="dx-field-label">Facility</div>
                  <div className="dx-field-value-static">
                    {detail.laboratory ? (
                      <strong>
                        {detail.laboratory.name}
                        <small style={{ color: "#777" }}>
                          {" "}
                          ({detail.laboratory.code})
                        </small>
                      </strong>
                    ) : (
                      <strong style={{ color: "#999" }}>Provider</strong>
                    )}
                  </div>
                </div>

                {detail.laboratory && (
                  <div className="dx-field">
                    <div className="dx-field-label"></div>
                    <div className="dx-field-value">
                      <Button
                        width="100%"
                        type="normal"
                        icon="detailslayout"
                        text="Open the Facility"
                        onClick={() =>
                          navigate(
                            `/admin/laboratorys/view/${detail.laboratory.id}`,
                          )
                        }
                      />
                    </div>
                  </div>
                )}

                <div className="dx-fieldset-header">Status</div>
                {field("Status", detail.status?.status_name)}
                {field("Stage", detail.stage?.stage_name)}

                <div className="dx-fieldset-header">Record</div>
                {field("Created By", detail.created_by)}
                {field(
                  "Created",
                  detail.created_at
                    ? Assist.formatDateLong(detail.created_at)
                    : null,
                )}
                {field("Updated By", detail.updated_by)}
                {field(
                  "Updated",
                  detail.updated_at
                    ? Assist.formatDateLong(detail.updated_at)
                    : null,
                )}

                <div className="dx-field">
                  <div className="dx-field-label"></div>
                  <div className="dx-field-value">
                    <Button
                      width="100%"
                      type="default"
                      icon="edit"
                      text="Edit Account"
                      onClick={() =>
                        navigate(`/admin/users/edit/${pageConfig.Id}`)
                      }
                    />
                  </div>
                </div>

                <div className="dx-field">
                  <div className="dx-field-label"></div>
                  <div className="dx-field-value">
                    <Button
                      width="100%"
                      type="normal"
                      icon="arrowleft"
                      text="Back to Users"
                      onClick={() => navigate("/admin/user/list")}
                    />
                  </div>
                </div>
              </div>
            )}

            {!detail && !loading && (
              <div style={{ padding: "24px 4px", color: "#999" }}>
                This account could not be shown.
              </div>
            )}
          </Card>
        </Col>

        <Col sz={12} sm={12} lg={7}>
          <Card title="Details" showHeader={true}>
            {detail && (
              <>
                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">Personal</div>
                  {field("First Name", detail.fname)}
                  {field("Last Name", detail.lname)}
                  {field("Position", detail.position)}
                  {field("Code", detail.code)}
                </div>

                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">Contact</div>
                  {field("Email", detail.email)}
                  {field(
                    "Mobile",
                    detail.mobile
                      ? `${detail.mobile_code || ""} ${detail.mobile}`.trim()
                      : null,
                  )}
                  {field("Physical Address", detail.address_physical)}
                  {field("Postal Address", detail.address_postal)}
                </div>

                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">Location</div>
                  {field("Province", nameFor(provinces, detail.province_id))}
                  {field("District", nameFor(districts, detail.district_id))}
                </div>
              </>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default UserView;
