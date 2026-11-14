import { useState, useEffect, useMemo } from "react";
import { TextBox } from "devextreme-react/text-box";
import Button from "devextreme-react/button";
import {
  Validator,
  RequiredRule,
  EmailRule,
} from "devextreme-react/validator";
import ValidationSummary from "devextreme-react/validation-summary";
import { LoadIndicator } from "devextreme-react/load-indicator";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import SelectBox from "devextreme-react/select-box";
import CustomStore from "devextreme/data/custom_store";
import DataSource from "devextreme/data/data_source";
import Assist from "../classes/assist";
import { LoadPanel } from "devextreme-react/load-panel";
import { confirm } from "devextreme/ui/dialog";
import AppInfo from "../classes/app-info";

// Zambia first; any other country can be typed in (acceptCustomValue). When the
// country is Zambia the user must pick a facility from the master facility list;
// otherwise they type the facility name.
const COUNTRIES = [
  "Zambia", "Angola", "Botswana", "Burundi", "Democratic Republic of the Congo",
  "Eswatini", "Ethiopia", "Kenya", "Lesotho", "Malawi", "Mozambique", "Namibia",
  "Nigeria", "Rwanda", "South Africa", "South Sudan", "Tanzania", "Uganda",
  "Zimbabwe", "Other",
];

const Signup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // the person
  const [country, setCountry] = useState<string | undefined>("Zambia");
  const [name, setName] = useState<string | undefined>(undefined);
  const [position, setPosition] = useState<string | undefined>(undefined);
  const [phone_number, setPhoneNumber] = useState<string | undefined>(undefined);
  const [email, setEmail] = useState<string | undefined>(undefined);

  // facility - Zambia picks from the MFL (province then facility); others type it
  const [province_id, setProvinceId] = useState<number | undefined>(undefined);
  const [facility_id, setFacilityId] = useState<number | undefined>(undefined);
  const [facility_name, setFacilityName] = useState<string | undefined>(undefined);

  const [province_data, setProvinceData] = useState<Array<any>>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const isZambia = (country || "").trim().toLowerCase() === "zambia";

  useEffect(() => {
    if (user) {
      navigate("/");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      Assist.loadData("Provinces", "provinces/list")
        .then((data: any) => {
          setProvinceData(data);
          setLoading(false);
        })
        .catch((message) => {
          setLoading(false);
          Assist.showMessage(message, "error");
        });
    }, Assist.DEV_DELAY);
  }, []);

  // facilities are searched on the server, narrowed to the chosen province, so
  // the thousands of rows never ship to the browser at once
  const facilityDataSource = useMemo(() => {
    return new DataSource({
      store: new CustomStore({
        key: "id",
        loadMode: "processed",
        load: (loadOptions: any) => {
          if (!province_id) return Promise.resolve([]);
          const search = loadOptions.searchValue || "";
          return Assist.loadData(
            "Facilities",
            `facilities/search?province_id=${province_id}&q=${encodeURIComponent(
              search,
            )}&limit=100`,
          );
        },
        byKey: (key: any) => Assist.loadData("Facility", `facilities/id/${key}`),
      }),
      paginate: false,
    });
  }, [province_id]);

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isZambia && !facility_id) {
      Assist.showMessage("Please choose your facility from the list", "error");
      return;
    }
    if (!isZambia && !facility_name) {
      Assist.showMessage("Please enter the name of your facility", "error");
      return;
    }

    const result = confirm(
      "Register with the details provided? A verification link will be sent to your email.",
      "Confirm registration",
    );
    result.then((ok) => ok && register());
  };

  const register = () => {
    setSaving(true);

    const postData = {
      country,
      name,
      position,
      phone_number,
      email,
      facility_id: isZambia ? facility_id : null,
      facility_name: isZambia ? null : facility_name,
    };

    setTimeout(() => {
      Assist.postPutData("Registration", "auth/signup", postData, 0)
        .then((data: any) => {
          setSaving(false);
          Assist.showMessage(
            data?.message ||
              "Registration received. Please check your email to verify your address.",
            "success",
          );
          navigate("/login");
        })
        .catch((message) => {
          setSaving(false);
          Assist.showMessage(message, "error");
        });
    }, Assist.DEV_DELAY);
  };

  return (
    <section className="signup">
      <div className="container">
        <div className="signup-content">
          <LoadPanel
            shadingColor="rgba(0,0,0,0.4)"
            position={{ of: "#pageRoot" }}
            visible={loading}
            showIndicator={true}
            shading={true}
            showPane={true}
            hideOnOutsideClick={false}
          />
          <div className="signup-form">
            <h2 className="form-title">Create your {AppInfo.appCode} account</h2>
            <p style={{ marginTop: -8, color: "#6b7280", fontSize: 13 }}>
              Register yourself first. Once your email is verified you can sign in
              and register your facility for any scheme.
            </p>

            <form id="formMain" onSubmit={onFormSubmit}>
              <div className="form">
                <div className="dx-fieldset dx-fieldset-cols">
                  <div className="dx-fieldset-header">Your details</div>

                  <div className="dx-field">
                    <div className="dx-field-label">Country</div>
                    <SelectBox
                      className="dx-field-value"
                      placeholder="Country"
                      dataSource={COUNTRIES}
                      acceptCustomValue={true}
                      searchEnabled={true}
                      value={country}
                      disabled={saving}
                      onValueChange={(v) => {
                        setCountry(v);
                        // switching country resets the facility choice
                        setFacilityId(undefined);
                        setFacilityName(undefined);
                        setProvinceId(undefined);
                      }}
                      onCustomItemCreating={(e: any) => {
                        e.customItem = e.text;
                        return e.text;
                      }}
                    >
                      <Validator>
                        <RequiredRule message="Country is required" />
                      </Validator>
                    </SelectBox>
                  </div>

                  <div className="dx-field">
                    <div className="dx-field-label">Name</div>
                    <TextBox
                      className="dx-field-value"
                      placeholder="Full name"
                      value={name}
                      disabled={saving}
                      onValueChange={setName}
                    >
                      <Validator>
                        <RequiredRule message="Name is required" />
                      </Validator>
                    </TextBox>
                  </div>

                  <div className="dx-field">
                    <div className="dx-field-label">Position</div>
                    <TextBox
                      className="dx-field-value"
                      placeholder="e.g. Laboratory Manager"
                      value={position}
                      disabled={saving}
                      onValueChange={setPosition}
                    >
                      <Validator>
                        <RequiredRule message="Position is required" />
                      </Validator>
                    </TextBox>
                  </div>

                  <div className="dx-field">
                    <div className="dx-field-label">Phone Number</div>
                    <TextBox
                      className="dx-field-value"
                      placeholder="e.g. +260977000000"
                      value={phone_number}
                      disabled={saving}
                      onValueChange={setPhoneNumber}
                    >
                      <Validator>
                        <RequiredRule message="Phone Number is required" />
                      </Validator>
                    </TextBox>
                  </div>

                  <div className="dx-field dx-field-span-2">
                    <div className="dx-field-label">Email Address</div>
                    <TextBox
                      className="dx-field-value"
                      placeholder="Email address (used to sign in)"
                      value={email}
                      disabled={saving}
                      onValueChange={setEmail}
                    >
                      <Validator>
                        <RequiredRule message="Email Address is required" />
                        <EmailRule message="Email is invalid" />
                      </Validator>
                    </TextBox>
                  </div>
                </div>

                <div className="dx-fieldset dx-fieldset-cols">
                  <div className="dx-fieldset-header">Facility</div>

                  {isZambia ? (
                    <>
                      <div className="dx-field">
                        <div className="dx-field-label">Province</div>
                        <SelectBox
                          className="dx-field-value"
                          placeholder="Province"
                          dataSource={province_data}
                          displayExpr="name"
                          valueExpr="id"
                          searchEnabled={true}
                          value={province_id}
                          disabled={saving}
                          onValueChange={(v) => {
                            setProvinceId(v);
                            setFacilityId(undefined);
                          }}
                        >
                          <Validator>
                            <RequiredRule message="Province is required" />
                          </Validator>
                        </SelectBox>
                      </div>
                      <div className="dx-field">
                        <div className="dx-field-label">Facility</div>
                        <SelectBox
                          className="dx-field-value"
                          placeholder={
                            province_id
                              ? "Search your facility"
                              : "Choose a province first"
                          }
                          dataSource={facilityDataSource}
                          displayExpr="name"
                          valueExpr="id"
                          searchEnabled={true}
                          searchExpr="name"
                          minSearchLength={0}
                          showDataBeforeSearch={true}
                          value={facility_id}
                          disabled={saving || !province_id}
                          onValueChange={setFacilityId}
                        >
                          <Validator>
                            <RequiredRule message="Facility is required" />
                          </Validator>
                        </SelectBox>
                      </div>
                    </>
                  ) : (
                    <div className="dx-field dx-field-span-2">
                      <div className="dx-field-label">Facility Name</div>
                      <TextBox
                        className="dx-field-value"
                        placeholder="Type your facility name"
                        value={facility_name}
                        disabled={saving}
                        onValueChange={setFacilityName}
                      >
                        <Validator>
                          <RequiredRule message="Facility Name is required" />
                        </Validator>
                      </TextBox>
                    </div>
                  )}
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
                    disabled={loading || saving}
                    useSubmitBehavior={true}
                  >
                    <LoadIndicator className="button-indicator" visible={saving} />
                    <span className="dx-button-text">Register</span>
                  </Button>
                </div>

                <div className="dx-field" style={{ textAlign: "center" }}>
                  <span>Already have an account? </span>
                  <Link to="/login">Sign in</Link>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Signup;
