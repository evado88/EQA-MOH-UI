import { useState, useEffect, useRef } from "react";
import { TextBox } from "devextreme-react/text-box";
import Button from "devextreme-react/button";
import {
  Validator,
  RequiredRule,
  EmailRule,
  AsyncRule,
  CustomRule,
} from "devextreme-react/validator";
import ValidationSummary from "devextreme-react/validation-summary";
import { LoadIndicator } from "devextreme-react/load-indicator";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link, useParams } from "react-router-dom";
import notify from "devextreme/ui/notify";
import axios from "axios";
import { DateBox, NumberBox } from "devextreme-react";
import SelectBox from "devextreme-react/select-box";
import TreeView from "devextreme-react/tree-view";
import { v4 as uuidv4 } from "uuid";
import Assist from "../classes/assist";
import { LoadPanel } from "devextreme-react/load-panel";
import PageConfig from "../classes/page-config";
import { confirm } from "devextreme/ui/dialog";
import AppInfo from "../classes/app-info";
import FileUploader from "devextreme-react/file-uploader";
import DataGrid, {
  Column,
  Pager,
  Paging,
  Summary,
  GroupItem,
  TotalItem,
} from "devextreme-react/data-grid";
import Box, { Item } from "devextreme-react/box";

const Signup = () => {
  //user
  const navigate = useNavigate();
  const { user } = useAuth();
  const { eId } = useParams(); // Destructure the parameter directly

  //name
  const [name, setName] = useState<undefined | string>(undefined);
  const [description, setDescription] = useState<undefined | string>(undefined);

  //properties
  const [contact_person_name, setContactPersonName] = useState<
    undefined | string
  >(undefined);
  const [lab_type, setLabType] = useState<undefined | string>(undefined);
  const [position, setPosition] = useState<undefined | string>(undefined);
  const [phone_number, setPhoneNumber] = useState<undefined | string>(
    undefined,
  );
  const [province, setProvince] = useState<undefined | string>(undefined);
  const [email_address, setEmailAddress] = useState<undefined | string>(
    undefined,
  );
  const [district, setDistrict] = useState<undefined | string>(undefined);
  const [physical_address, setPhysicalAddress] = useState<undefined | string>(
    undefined,
  );

  //set up data sources for relationship fields
  const [lab_type_data, setlab_type_data] = useState<Array<any> | any>([]);
  const [province_data, setprovince_data] = useState<Array<any> | any>([]);
  const [district_data, setdistrict_data] = useState<Array<any> | any>([]);
  const [method_data, setmethod_data] = useState<Array<any> | any>([]);
  const [method_list, setMethodList] = useState<Array<any>>([]);

  //service
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const hasRun = useRef(false);

  // signup is the public entry point, so it carries no permission list
  const pageConfig = new PageConfig(
    `Registration`,
    "",
    "",
    "Laboratory",
    "",
  );

  pageConfig.Id = eId == undefined ? 0 : Number(eId);

  //builds a scheme -> service -> method tree for the TreeView from the flat methods list
  function buildMethodTree(methods: Array<any>) {
    const nodes: Array<any> = [];
    const addedIds = new Set<string>();

    methods.forEach((method: any) => {
      const schemeNodeId = `scheme-${method.scheme.id}`;
      const serviceNodeId = `service-${method.scheme.id}-${method.service.id}`;

      if (!addedIds.has(schemeNodeId)) {
        addedIds.add(schemeNodeId);
        nodes.push({
          id: schemeNodeId,
          parentId: null,
          text: method.scheme.name,
        });
      }

      if (!addedIds.has(serviceNodeId)) {
        addedIds.add(serviceNodeId);
        nodes.push({
          id: serviceNodeId,
          parentId: schemeNodeId,
          text: method.service.name,
        });
      }

      nodes.push({
        id: `method-${method.id}`,
        parentId: serviceNodeId,
        text: method.name,
        method: method,
        isMethod: true,
      });
    });

    return nodes;
  }

  //set up data sources for relationship fields
  useEffect(() => {
    // Redirect if already logged in
    if (user) {
      navigate("/");
    } else {
      //only load if updating item
      setLoading(true);

      setTimeout(() => {
        Promise.all([
          Assist.loadData(pageConfig.Title, `laboratorys/id/${pageConfig.Id}`),
          Assist.loadData("Method", `methods/list`),
        ])
          .then(([data, methods]: [any, any]) => {
            setLoading(false);
            //set up data sources for relationship fields
            setlab_type_data(data.labtypeList);
            setprovince_data(data.provinceList);
            setdistrict_data(data.districtList);
            setmethod_data(buildMethodTree(methods));
            //set error
            setError(false);
          })
          .catch((message) => {
            setLoading(false);
            setError(true);
            Assist.showMessage(message, "error");
          });
      }, Assist.DEV_DELAY);
    }
  }, []);

  const onMethodSelectionChanged = (e: any) => {
    const selectedMethods = e.component
      .getSelectedNodes()
      .filter((node: any) => node.itemData.isMethod)
      .map((node: any) => node.itemData.method);

    setMethodList(selectedMethods);
  };

  const onFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (method_list.length === 0) {
      Assist.showMessage("Please select at least one method", "error");
      return;
    }

    let result = confirm(
      "Are you sure you want to register an account with provided details?",
      "Confirm submission",
    );
    result.then((dialogResult) => {
      if (dialogResult) {
        registerAccount();
      }
    });
  };

  const registerAccount = () => {
    setSaving(true);

    // the server owns the registration code, the approval state and the role
    // this eventually becomes - a public form gets to send none of those
    const postData = {
      //name
      name: name,
      description: description,
      //properties
      contact_person_name: contact_person_name,
      lab_type_id: lab_type,
      position: position,
      phone_number: phone_number,
      province_id: province,
      email_address: email_address,
      district_id: district,
      physical_address: physical_address,
      method_list: method_list.map((method: any) => ({ id: method.id })),
    };

    setTimeout(() => {
      Assist.postPutData(pageConfig.Title, `auth/signup`, postData, 0)
        .then((data: any) => {
          setSaving(false);

          Assist.showMessage(
            data && data.message
              ? `${data.message} Your registration code is ${data.code}.`
              : `You have successfully registered. You will be informed when your registration is approved`,
            "success",
          );
          navigate(`/login`);
        })
        .catch((message) => {
          setSaving(false);
          Assist.showMessage(message, "error");
        });
    }, Assist.DEV_DELAY);
  };

  function asyncValidation(params: any) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        Assist.loadData("User", `users/email/${encodeURI(params.value)}`)
          .then((res: any) => {
            if (res.length == 0) {
              resolve(undefined);
            } else {
              reject("The email address has already been registered");
            }
          })
          .catch((ex) => {
            reject("Could not perform validation. Please try again later.");
          });
      }, Assist.DEV_DELAY); // Simulate a 1-second delay for the server call
    });
  }

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
            <h2 className="form-title">PT Application</h2>

            <form id="formMain" onSubmit={onFormSubmit}>
              <div className="form">
                <div className="dx-fieldset dx-fieldset-cols">
                  <div className="dx-fieldset-header">
                    Participant Information
                  </div>
                  <div className="dx-field dx-field-span-2">
                    <div className="dx-field-label">Name</div>
                    <TextBox
                      className="dx-field-value"
                      placeholder="Name"
                      value={name}
                      disabled={error || saving}
                      onValueChange={(text) => setName(text)}
                    >
                      <Validator>
                        <RequiredRule message="Name is required" />
                      </Validator>
                    </TextBox>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Type of Lab</div>
                    <SelectBox
                      className="dx-field-value"
                      placeholder="Type of Lab"
                      dataSource={lab_type_data}
                      displayExpr={"name"}
                      valueExpr={"id"}
                      deferRendering={false}
                      value={lab_type}
                      disabled={error || saving}
                      onValueChange={(text) => setLabType(text)}
                    >
                      <Validator>
                        <RequiredRule message="Type of Lab is required" />
                      </Validator>
                    </SelectBox>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Province</div>
                    <SelectBox
                      className="dx-field-value"
                      placeholder="Province"
                      dataSource={province_data}
                      displayExpr={"name"}
                      valueExpr={"id"}
                      deferRendering={false}
                      value={province}
                      disabled={error || saving}
                      onValueChange={(text) => {
                        setProvince(text);
                        setDistrict(undefined);
                      }}
                    >
                      <Validator>
                        <RequiredRule message="Province is required" />
                      </Validator>
                    </SelectBox>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">District</div>
                    <SelectBox
                      className="dx-field-value"
                      placeholder="District"
                      dataSource={district_data.filter(
                        (item: any) => item.province_id == province,
                      )}
                      displayExpr={"name"}
                      valueExpr={"id"}
                      deferRendering={false}
                      value={district}
                      disabled={error || saving || !province}
                      onValueChange={(text) => setDistrict(text)}
                    >
                      <Validator>
                        <RequiredRule message="District is required" />
                      </Validator>
                    </SelectBox>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Physical Address</div>
                    <TextBox
                      className="dx-field-value"
                      placeholder="Physical Address"
                      value={physical_address}
                      disabled={error || saving}
                      onValueChange={(text) => setPhysicalAddress(text)}
                    >
                      <Validator>
                        <RequiredRule message="Physical Address is required" />
                      </Validator>
                    </TextBox>
                  </div>
                </div>

                <div className="dx-fieldset dx-fieldset-cols">
                  <div className="dx-fieldset-header">Contact Person</div>
                  <div className="dx-field">
                    <div className="dx-field-label">Contact Person Name</div>
                    <TextBox
                      className="dx-field-value"
                      placeholder="Contact Person Name"
                      value={contact_person_name}
                      disabled={error || saving}
                      onValueChange={(text) => setContactPersonName(text)}
                    >
                      <Validator>
                        <RequiredRule message="Contact Person Name is required" />
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
                      placeholder="Phone Number"
                      value={phone_number}
                      disabled={error || saving}
                      onValueChange={(text) => setPhoneNumber(text)}
                    >
                      <Validator>
                        <RequiredRule message="Phone Number is required" />
                      </Validator>
                    </TextBox>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Email Address</div>
                    <TextBox
                      className="dx-field-value"
                      placeholder="Email Address"
                      value={email_address}
                      disabled={error || saving}
                      onValueChange={(text) => setEmailAddress(text)}
                    >
                      <Validator>
                        <RequiredRule message="Email Address is required" />
                        <EmailRule message="Email is invalid" />
                        <AsyncRule validationCallback={asyncValidation} />
                      </Validator>
                    </TextBox>
                  </div>
                </div>
                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">Schemes</div>
                  <div className="dx-field">
                    <div className="dx-field-label"></div>
                    <TreeView
                      className="dx-field-value"
                      dataSource={method_data}
                      dataStructure="plain"
                      keyExpr="id"
                      parentIdExpr="parentId"
                      displayExpr="text"
                      showCheckBoxesMode="normal"
                      selectionMode="multiple"
                      selectNodesRecursive={true}
                      selectByClick={true}
                      disabled={error || saving}
                      onSelectionChanged={onMethodSelectionChanged}
                      height={240}
                    />
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
                    <span className="dx-button-text">Submit for Review</span>
                  </Button>
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
