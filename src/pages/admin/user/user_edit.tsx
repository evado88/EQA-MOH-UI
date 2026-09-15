import React, { useState, useEffect, useRef } from "react";
import { Titlebar } from "../../../components/titlebar";
import { Card } from "../../../components/card";
import { Row } from "../../../components/row";
import { Col } from "../../../components/column";
import SelectBox from "devextreme-react/select-box";
import { TextBox } from "devextreme-react/text-box";
import {
  Validator,
  RequiredRule,
  EmailRule,
  CompareRule,
  StringLengthRule,
} from "devextreme-react/validator";
import Button from "devextreme-react/button";
import ValidationSummary from "devextreme-react/validation-summary";
import { LoadPanel } from "devextreme-react/load-panel";
import { LoadIndicator } from "devextreme-react/load-indicator";
import { useAuth } from "../../../context/AuthContext";
import PageConfig from "../../../classes/page-config";
import Assist from "../../../classes/assist";
import { useNavigate, useParams } from "react-router-dom";
import { confirm } from "devextreme/ui/dialog";
import AppInfo from "../../../classes/app-info";

// the dialling codes AppInfo already carries, shown as 'Zambia (+260)'
const COUNTRY_CODES = AppInfo.countryCodes.map((c: any) => ({
  dial_code: c.dial_code,
  label: `${c.name} (${c.dial_code})`,
}));

const UserEdit = () => {
  //user
  const navigate = useNavigate();
  const { user } = useAuth();
  const { eId } = useParams();

  //personal details
  const [fname, setFname] = useState<undefined | string>(undefined);
  const [lname, setLname] = useState<undefined | string>(undefined);
  const [position, setPosition] = useState<undefined | string>(undefined);

  //contact, address
  const [email, setEmail] = useState<undefined | string>(undefined);
  const [mobileCode, setMobileCode] = useState<undefined | string>("+260");
  const [mobile, setMobile] = useState<undefined | string>(undefined);
  const [addressPhysical, setAddressPhysical] = useState<undefined | string>(
    undefined,
  );
  const [addressPostal, setAddressPostal] = useState<undefined | string>(
    undefined,
  );

  //account
  const [roleId, setRoleId] = useState<undefined | number>(undefined);
  const [laboratoryId, setLaboratoryId] = useState<undefined | number>(
    undefined,
  );
  const [provinceId, setProvinceId] = useState<undefined | number>(undefined);
  const [districtId, setDistrictId] = useState<undefined | number>(undefined);
  const [password, setPassword] = useState<undefined | string>(undefined);
  const [confirmPassword, setConfirmPassword] = useState<undefined | string>(
    undefined,
  );

  //set up data sources for relationship fields
  const [role_data, setRoleData] = useState<Array<any>>([]);
  const [laboratory_data, setLaboratoryData] = useState<Array<any>>([]);
  const [province_data, setProvinceData] = useState<Array<any>>([]);
  const [district_data, setDistrictData] = useState<Array<any>>([]);

  //service
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const hasRun = useRef(false);

  const pageConfig = new PageConfig(`User`, "", "", "User", "", [
    Assist.ROLE_ADMIN,
  ]);

  pageConfig.Id = eId == undefined ? 0 : Number(eId);

  const isNew = pageConfig.Id == 0;

  //a facility account reports for one laboratory; provider staff for none
  const needsLaboratory =
    roleId != undefined && Assist.LABORATORY_ROLES.includes(roleId);

  //104 districts is not a list anybody should scroll, so it follows the province
  const districtsForProvince = provinceId
    ? district_data.filter((d: any) => d.province_id === provinceId)
    : district_data;

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

    setTimeout(() => {
      Assist.loadData(pageConfig.Title, `users/id/${pageConfig.Id}`)
        .then((data: any) => {
          setLoading(false);

          //set up data sources for relationship fields
          setRoleData(data.roleList);
          setLaboratoryData(data.laboratoryList);
          setProvinceData(data.provinceList);
          setDistrictData(data.districtList);

          if (pageConfig.Id != 0) {
            // only update values if valid id
            updateVaues(data.user);
          }

          setError(false);
        })
        .catch((message) => {
          setLoading(false);
          setError(true);
          Assist.showMessage(message, "error");
        });
    }, Assist.DEV_DELAY);
  }, []);

  const updateVaues = (data: any) => {
    //personal details
    setFname(data.fname);
    setLname(data.lname);
    setPosition(data.position);

    //contact, address
    setEmail(data.email);
    setMobileCode(data.mobile_code);
    setMobile(data.mobile);
    setAddressPhysical(data.address_physical);
    setAddressPostal(data.address_postal);

    //account
    setRoleId(data.role_id);
    setLaboratoryId(data.laboratory_id ?? undefined);
    setProvinceId(data.province_id ?? undefined);
    setDistrictId(data.district_id ?? undefined);
  };

  /** Moving off a facility role takes the laboratory with it */
  const onRoleChange = (value: number) => {
    setRoleId(value);

    if (!Assist.LABORATORY_ROLES.includes(value)) {
      setLaboratoryId(undefined);
    }
  };

  /** A district only belongs to one province, so changing province clears it */
  const onProvinceChange = (value: number) => {
    setProvinceId(value);
    setDistrictId(undefined);
  };

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const question = isNew
      ? "Are you sure you want to open this account?"
      : "Are you sure you want to save these changes?";

    confirm(question, "Confirm submission").then((dialogResult) => {
      if (dialogResult) {
        submitUser();
      }
    });
  };

  const submitUser = () => {
    setSaving(true);

    const postData: any = {
      //personal details
      fname: fname,
      lname: lname,
      position: position,
      //contact, address
      email: email,
      mobile_code: mobileCode,
      mobile: mobile,
      address_physical: addressPhysical,
      address_postal: addressPostal,
      //account
      role_id: roleId,
      laboratory_id: needsLaboratory ? laboratoryId : null,
      province_id: provinceId ?? null,
      district_id: districtId ?? null,
      //service
      created_by: user.sub,
      updated_by: user.sub,
    };

    //an edit that leaves the password blank leaves the password alone
    if (password) {
      postData.password = password;
    }

    const url = isNew ? `users/create` : `users/update/${pageConfig.Id}`;

    setTimeout(() => {
      Assist.postPutData(pageConfig.Title, url, postData, pageConfig.Id)
        .then((data: any) => {
          setSaving(false);
          Assist.showMessage(
            isNew
              ? `The account for ${data.fname} ${data.lname} has been opened`
              : `The account for ${data.fname} ${data.lname} has been updated`,
            "success",
          );
          navigate(`/admin/user/list`);
        })
        .catch((message) => {
          setSaving(false);
          Assist.showMessage(message, "error");
        });
    }, Assist.DEV_DELAY);
  };

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
        title={`${pageConfig.verb()} ${pageConfig.Title}`}
        section={"Administration"}
        icon={"user"}
        url="/admin/user/list"
      ></Titlebar>

      <Row>
        <Col sz={12} sm={12} lg={7}>
          <Card title="Account" showHeader={true}>
            <form id="formMain" onSubmit={onFormSubmit}>
              <div className="form">
                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">Personal Details</div>

                  <div className="dx-field">
                    <div className="dx-field-label">First Name</div>
                    <TextBox
                      className="dx-field-value"
                      placeholder="First Name"
                      value={fname}
                      disabled={error || saving}
                      onValueChange={(text) => setFname(text)}
                    >
                      <Validator>
                        <RequiredRule message="First Name is required" />
                        <StringLengthRule
                          min={2}
                          max={50}
                          message="First Name must be between 2 and 50 characters"
                        />
                      </Validator>
                    </TextBox>
                  </div>

                  <div className="dx-field">
                    <div className="dx-field-label">Last Name</div>
                    <TextBox
                      className="dx-field-value"
                      placeholder="Last Name"
                      value={lname}
                      disabled={error || saving}
                      onValueChange={(text) => setLname(text)}
                    >
                      <Validator>
                        <RequiredRule message="Last Name is required" />
                        <StringLengthRule
                          min={2}
                          max={50}
                          message="Last Name must be between 2 and 50 characters"
                        />
                      </Validator>
                    </TextBox>
                  </div>

                  <div className="dx-field">
                    <div className="dx-field-label">Position</div>
                    <TextBox
                      className="dx-field-value"
                      placeholder="Position"
                      value={position}
                      disabled={error || saving}
                      onValueChange={(text) => setPosition(text)}
                    ></TextBox>
                  </div>
                </div>

                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">Contact</div>

                  <div className="dx-field">
                    <div className="dx-field-label">Email</div>
                    <TextBox
                      className="dx-field-value"
                      placeholder="Email"
                      value={email}
                      disabled={error || saving}
                      onValueChange={(text) => setEmail(text)}
                    >
                      <Validator>
                        <RequiredRule message="Email is required" />
                        <EmailRule message="Email must be a valid address" />
                      </Validator>
                    </TextBox>
                  </div>

                  <div className="dx-field">
                    <div className="dx-field-label">Mobile Code</div>
                    <SelectBox
                      className="dx-field-value"
                      placeholder="Mobile Code"
                      dataSource={COUNTRY_CODES}
                      displayExpr={"label"}
                      valueExpr={"dial_code"}
                      searchEnabled={true}
                      deferRendering={false}
                      value={mobileCode}
                      disabled={error || saving}
                      onValueChange={(text) => setMobileCode(text)}
                    >
                      <Validator>
                        <RequiredRule message="Mobile Code is required" />
                      </Validator>
                    </SelectBox>
                  </div>

                  <div className="dx-field">
                    <div className="dx-field-label">Mobile</div>
                    <TextBox
                      className="dx-field-value"
                      placeholder="Mobile"
                      value={mobile}
                      disabled={error || saving}
                      onValueChange={(text) => setMobile(text)}
                    >
                      <Validator>
                        <RequiredRule message="Mobile is required" />
                        <StringLengthRule
                          min={3}
                          max={15}
                          message="Mobile must be between 3 and 15 characters"
                        />
                      </Validator>
                    </TextBox>
                  </div>

                  <div className="dx-field">
                    <div className="dx-field-label">Physical Address</div>
                    <TextBox
                      className="dx-field-value"
                      placeholder="Physical Address"
                      value={addressPhysical}
                      disabled={error || saving}
                      onValueChange={(text) => setAddressPhysical(text)}
                    ></TextBox>
                  </div>

                  <div className="dx-field">
                    <div className="dx-field-label">Postal Address</div>
                    <TextBox
                      className="dx-field-value"
                      placeholder="Postal Address"
                      value={addressPostal}
                      disabled={error || saving}
                      onValueChange={(text) => setAddressPostal(text)}
                    ></TextBox>
                  </div>
                </div>

                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">Role and Facility</div>

                  <div className="dx-field">
                    <div className="dx-field-label">Role</div>
                    <SelectBox
                      className="dx-field-value"
                      placeholder="Role"
                      dataSource={role_data}
                      displayExpr={"name"}
                      valueExpr={"id"}
                      deferRendering={false}
                      value={roleId}
                      disabled={error || saving}
                      onValueChange={(value) => onRoleChange(value)}
                    >
                      <Validator>
                        <RequiredRule message="Role is required" />
                      </Validator>
                    </SelectBox>
                  </div>

                  {needsLaboratory ? (
                    <div className="dx-field">
                      <div className="dx-field-label">Facility</div>
                      <SelectBox
                        className="dx-field-value"
                        placeholder="Facility"
                        dataSource={laboratory_data}
                        displayExpr={(item: any) =>
                          item ? `${item.name} (${item.code})` : ""
                        }
                        valueExpr={"id"}
                        searchEnabled={true}
                        deferRendering={false}
                        value={laboratoryId}
                        disabled={error || saving}
                        onValueChange={(value) => setLaboratoryId(value)}
                      >
                        <Validator>
                          <RequiredRule message="Facility is required for a facility role" />
                        </Validator>
                      </SelectBox>
                    </div>
                  ) : (
                    <div className="dx-field">
                      <div className="dx-field-value-static">
                        <small>
                          {roleId
                            ? "This is a provider role, so it is not tied to a facility."
                            : "Choose a role. A facility role also needs the facility it reports for."}
                        </small>
                      </div>
                    </div>
                  )}

                  <div className="dx-field">
                    <div className="dx-field-label">Province</div>
                    <SelectBox
                      className="dx-field-value"
                      placeholder="Province"
                      dataSource={province_data}
                      displayExpr={"name"}
                      valueExpr={"id"}
                      showClearButton={true}
                      deferRendering={false}
                      value={provinceId}
                      disabled={error || saving}
                      onValueChange={(value) => onProvinceChange(value)}
                    ></SelectBox>
                  </div>

                  <div className="dx-field">
                    <div className="dx-field-label">District</div>
                    <SelectBox
                      className="dx-field-value"
                      placeholder={
                        provinceId ? "District" : "Choose a province first"
                      }
                      dataSource={districtsForProvince}
                      displayExpr={"name"}
                      valueExpr={"id"}
                      searchEnabled={true}
                      showClearButton={true}
                      deferRendering={false}
                      value={districtId}
                      disabled={error || saving || !provinceId}
                      onValueChange={(value) => setDistrictId(value)}
                    ></SelectBox>
                  </div>
                </div>

                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">
                    {isNew ? "Password" : "Change Password"}
                  </div>

                  {!isNew && (
                    <div className="dx-field">
                      <div className="dx-field-value-static">
                        <small>
                          Leave both boxes empty to keep the current password.
                        </small>
                      </div>
                    </div>
                  )}

                  <div className="dx-field">
                    <div className="dx-field-label">Password</div>
                    <TextBox
                      className="dx-field-value"
                      placeholder="Password"
                      mode="password"
                      value={password}
                      disabled={error || saving}
                      onValueChange={(text) => setPassword(text)}
                    >
                      <Validator>
                        {isNew && (
                          <RequiredRule message="Password is required" />
                        )}
                        <StringLengthRule
                          min={8}
                          message="Password must be at least 8 characters"
                          ignoreEmptyValue={true}
                        />
                      </Validator>
                    </TextBox>
                  </div>

                  <div className="dx-field">
                    <div className="dx-field-label">Confirm Password</div>
                    <TextBox
                      className="dx-field-value"
                      placeholder="Confirm Password"
                      mode="password"
                      value={confirmPassword}
                      disabled={error || saving}
                      onValueChange={(text) => setConfirmPassword(text)}
                    >
                      <Validator>
                        {isNew && (
                          <RequiredRule message="Please confirm the password" />
                        )}
                        <CompareRule
                          message="The passwords do not match"
                          comparisonTarget={() => password}
                        />
                      </Validator>
                    </TextBox>
                  </div>
                </div>

                <div className="dx-field">
                  <div className="dx-field-label">
                    <ValidationSummary id="summaryMain" />
                  </div>
                </div>

                <div className="dx-field">
                  <div className="dx-field-label"></div>
                  <Button
                    width="100%"
                    type={saving ? "normal" : "default"}
                    disabled={loading || error || saving}
                    useSubmitBehavior={true}
                  >
                    <LoadIndicator
                      className="button-indicator"
                      visible={saving}
                    />
                    <span className="dx-button-text">
                      {isNew ? "Open Account" : "Save Changes"}
                    </span>
                  </Button>
                </div>

                <div className="dx-field">
                  <div className="dx-field-label"></div>
                  <div className="dx-field-value">
                    <Button
                      width="100%"
                      type="normal"
                      icon="arrowleft"
                      text="Back to Users"
                      disabled={saving}
                      onClick={() => navigate("/admin/user/list")}
                    />
                  </div>
                </div>
              </div>
            </form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default UserEdit;
