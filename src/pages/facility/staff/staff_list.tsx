import { useEffect, useRef, useState } from "react";
import { Titlebar } from "../../../components/titlebar";
import { Card } from "../../../components/card";
import { Row } from "../../../components/row";
import { Col } from "../../../components/column";
import DataGrid, {
  Column,
  Paging,
  Pager,
  FilterRow,
} from "devextreme-react/data-grid";
import TextBox from "devextreme-react/text-box";
import SelectBox from "devextreme-react/select-box";
import Button from "devextreme-react/button";
import { LoadIndicator } from "devextreme-react/load-indicator";
import Assist from "../../../classes/assist";
import PageConfig from "../../../classes/page-config";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

const ROLE_OPTIONS = [
  { id: Assist.ROLE_FACILITY_SUPER_USER, name: "Facility Super User" },
  { id: Assist.ROLE_FACILITY_STAFF, name: "Facility Staff" },
];

const FacilityStaffList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const hasRun = useRef(false);

  const isAdmin = Assist.isSystemAdmin(user);
  const isSuper = Assist.canWriteFacility(user); // facility super user (role 9)

  // listing
  const [users, setUsers] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Loading...");

  // admin facility picker
  const [facilitySearch, setFacilitySearch] = useState("");
  const [facilityOptions, setFacilityOptions] = useState<Array<any>>([]);
  const [facilityId, setFacilityId] = useState<number | undefined>(undefined);

  // create form
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [position, setPosition] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [roleId, setRoleId] = useState<number>(Assist.ROLE_FACILITY_STAFF);
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const pageConfig = new PageConfig(
    "Facility Staff",
    "users/facility-list",
    "",
    "Facility User",
    "users/create-facility",
    [...Assist.FACILITY_WRITE_ROLES, ...Assist.SYSTEM_ADMIN_ROLES],
  );

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    if (!Assist.checkPageAuditPermission(pageConfig, user)) {
      Assist.redirectUnauthorized(navigate);
      return;
    }

    // a super user sees their own facility straight away; an admin must pick one
    if (isSuper) loadUsers();
    else setLoadingText("Search for and choose a facility to manage its staff");
  }, []);

  const loadUsers = (forFacilityId?: number) => {
    setLoading(true);
    const url = forFacilityId
      ? `users/facility-list?facility_id=${forFacilityId}`
      : `users/facility-list`;
    Assist.loadData(pageConfig.Title, url)
      .then((data: any) => {
        setUsers(data || []);
        setLoading(false);
        setLoadingText((data || []).length === 0 ? "No staff accounts yet" : "");
      })
      .catch((message) => {
        setLoading(false);
        Assist.showMessage(message, "error");
        setLoadingText("Could not load staff accounts");
      });
  };

  const searchFacilities = () => {
    const q = facilitySearch.trim();
    Assist.loadData(
      "Facilities",
      `facilities/search?limit=50${q ? `&q=${encodeURIComponent(q)}` : ""}`,
    )
      .then((data: any) => setFacilityOptions(data || []))
      .catch((message) => Assist.showMessage(message, "error"));
  };

  const onFacilityChange = (value: number) => {
    setFacilityId(value);
    setUsers([]);
    if (value) loadUsers(value);
  };

  const resetForm = () => {
    setFname("");
    setLname("");
    setPosition("");
    setEmail("");
    setMobile("");
    setRoleId(Assist.ROLE_FACILITY_STAFF);
    setPassword("");
  };

  const createAccount = () => {
    if (!fname.trim() || !lname.trim()) {
      Assist.showMessage("Please provide the first and last name", "error");
      return;
    }
    if (!email.trim()) {
      Assist.showMessage("Please provide an email address", "error");
      return;
    }
    if (!mobile.trim()) {
      Assist.showMessage("Please provide a mobile number", "error");
      return;
    }
    if (!password || password.length < 8) {
      Assist.showMessage("The password must be at least 8 characters", "error");
      return;
    }
    if (isAdmin && !isSuper && !facilityId) {
      Assist.showMessage("Please choose the facility first", "error");
      return;
    }

    setSaving(true);
    const postData: any = {
      fname: fname.trim(),
      lname: lname.trim(),
      position: position.trim() || null,
      email: email.trim(),
      mobile: mobile.trim(),
      role_id: roleId,
      password: password,
      created_by: user.sub,
    };
    // the server uses the super user's own facility; an admin must name one
    if (!isSuper && facilityId) postData.facility_id = facilityId;

    Assist.postPutData(pageConfig.Title, "users/create-facility", postData, 0)
      .then(() => {
        setSaving(false);
        Assist.showMessage("Account created", "success");
        resetForm();
        loadUsers(isSuper ? undefined : facilityId);
      })
      .catch((message) => {
        setSaving(false);
        Assist.showMessage(message, "error");
      });
  };

  const canCreate = isSuper || (isAdmin && !!facilityId);

  return (
    <div className="page-content" style={{ minHeight: "862px" }}>
      <Titlebar
        title={pageConfig.Title}
        section={"Facility"}
        icon={"user"}
        url="/"
      ></Titlebar>

      {isAdmin && !isSuper && (
        <Row>
          <Col sz={12} sm={12} lg={12}>
            <Card showHeader={false}>
              <div className="dx-field">
                <div className="dx-field-label">Find facility</div>
                <div className="dx-field-value" style={{ display: "flex", gap: 8 }}>
                  <TextBox
                    placeholder="Type part of the facility name"
                    value={facilitySearch}
                    style={{ flex: 1 }}
                    onValueChange={(v) => setFacilitySearch(v)}
                    onEnterKey={searchFacilities}
                  />
                  <Button text="Search" onClick={searchFacilities} />
                </div>
              </div>
              <div className="dx-field">
                <div className="dx-field-label">Facility</div>
                <SelectBox
                  className="dx-field-value"
                  placeholder="Choose a facility..."
                  dataSource={facilityOptions}
                  displayExpr={"name"}
                  valueExpr={"id"}
                  searchEnabled={true}
                  showClearButton={true}
                  value={facilityId}
                  onValueChange={onFacilityChange}
                />
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {canCreate && (
        <Row>
          <Col sz={12} sm={12} lg={12}>
            <Card title="Add a staff account" showHeader={true}>
              <div className="form">
                <div className="dx-fieldset">
                  <p style={{ margin: "0 0 8px", color: "#6b7280", fontSize: 13 }}>
                    The account is active immediately with the password you set
                    here. Share it with the person so they can sign in and change
                    it.
                  </p>
                  <div className="dx-field">
                    <div className="dx-field-label">First name</div>
                    <TextBox
                      className="dx-field-value"
                      value={fname}
                      disabled={saving}
                      onValueChange={(v) => setFname(v)}
                    />
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Last name</div>
                    <TextBox
                      className="dx-field-value"
                      value={lname}
                      disabled={saving}
                      onValueChange={(v) => setLname(v)}
                    />
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Position</div>
                    <TextBox
                      className="dx-field-value"
                      value={position}
                      disabled={saving}
                      onValueChange={(v) => setPosition(v)}
                    />
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Email</div>
                    <TextBox
                      className="dx-field-value"
                      mode="email"
                      value={email}
                      disabled={saving}
                      onValueChange={(v) => setEmail(v)}
                    />
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Mobile</div>
                    <TextBox
                      className="dx-field-value"
                      value={mobile}
                      disabled={saving}
                      onValueChange={(v) => setMobile(v)}
                    />
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Role</div>
                    <SelectBox
                      className="dx-field-value"
                      dataSource={ROLE_OPTIONS}
                      displayExpr={"name"}
                      valueExpr={"id"}
                      value={roleId}
                      disabled={saving}
                      onValueChange={(v) => setRoleId(v)}
                    />
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Password</div>
                    <TextBox
                      className="dx-field-value"
                      mode="password"
                      placeholder="At least 8 characters"
                      value={password}
                      disabled={saving}
                      onValueChange={(v) => setPassword(v)}
                    />
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label"></div>
                    <Button
                      type={saving ? "normal" : "default"}
                      disabled={saving}
                      onClick={createAccount}
                    >
                      <LoadIndicator
                        className="button-indicator"
                        visible={saving}
                      />
                      <span className="dx-button-text">Create account</span>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      )}

      <Row>
        <Col sz={12} sm={12} lg={12}>
          <Card title="Staff accounts" showHeader={true}>
            <DataGrid
              className={"dx-card wide-card"}
              dataSource={users}
              keyExpr={"id"}
              noDataText={loadingText}
              showBorders={false}
              columnAutoWidth={true}
              columnHidingEnabled={true}
            >
              <Paging defaultPageSize={10} />
              <Pager showPageSizeSelector={true} showInfo={true} />
              <FilterRow visible={true} />
              <Column
                dataField="fname"
                caption="First Name"
                hidingPriority={6}
                sortOrder="asc"
              ></Column>
              <Column
                dataField="lname"
                caption="Last Name"
                hidingPriority={5}
              ></Column>
              <Column dataField="email" caption="Email" hidingPriority={4}></Column>
              <Column
                dataField="role.name"
                caption="Role"
                hidingPriority={3}
              ></Column>
              <Column
                dataField="position"
                caption="Position"
                hidingPriority={2}
              ></Column>
              <Column
                dataField="status.status_name"
                caption="Status"
                hidingPriority={1}
              ></Column>
            </DataGrid>
            {loading && <LoadIndicator />}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default FacilityStaffList;
