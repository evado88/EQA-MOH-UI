import React, { useState, useEffect, useMemo, useRef } from "react";
import { Titlebar } from "../../../components/titlebar";
import { Card } from "../../../components/card";
import { Row } from "../../../components/row";
import { Col } from "../../../components/column";
import SelectBox from "devextreme-react/select-box";
import { TextBox } from "devextreme-react/text-box";
import {
  Validator,
  RequiredRule,
  AsyncRule,
  CompareRule,
  CustomRule,
} from "devextreme-react/validator";
import TextArea from "devextreme-react/text-area";
import { NumberBox } from "devextreme-react/number-box";
import Button from "devextreme-react/button";
import ValidationSummary from "devextreme-react/validation-summary";
import { LoadPanel } from "devextreme-react/load-panel";
import DateBox from "devextreme-react/date-box";
import { useTheme } from "../../../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";
import PageConfig from "../../../classes/page-config";
import Assist from "../../../classes/assist";
import { LoadIndicator } from "devextreme-react/load-indicator";
import { useNavigate, useParams } from "react-router-dom";
import HtmlEditor, {
  Toolbar,
  Item,
  MediaResizing,
} from "devextreme-react/html-editor";
import AppInfo from "../../../classes/app-info";
import { confirm } from "devextreme/ui/dialog";

const LaboratoryEdit = () => {
  //user
  const navigate = useNavigate();
  const { user } = useAuth();
  const { eId } = useParams(); // Destructure the parameter directly

  //name
  const [name, setName] = useState<undefined | string>(undefined);
  const [description, setDescription] = useState<undefined | string>(undefined);

  //properties
  const [contact_person_name, setContactPersonName] = useState<undefined | string>(undefined);
  const [code, setCode] = useState<undefined | string>(undefined);
  const [lab_type, setLabType] = useState<undefined | string>(undefined);
  const [position, setPosition] = useState<undefined | string>(undefined);
  const [phone_number, setPhoneNumber] = useState<undefined | string>(undefined);
  const [province, setProvince] = useState<undefined | string>(undefined);
  const [email_address, setEmailAddress] = useState<undefined | string>(undefined);
  const [district, setDistrict] = useState<undefined | string>(undefined);
  const [physical_address, setPhysicalAddress] = useState<undefined | string>(undefined);


  //set up data sources for relationship fields
  const [lab_type_data, setlab_type_data]=useState<Array<any> | any>([]);
  const [province_data, setprovince_data]=useState<Array<any> | any>([]);
  const [district_data, setdistrict_data]=useState<Array<any> | any>([]);

  //service
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const hasRun = useRef(false);

  const pageConfig = new PageConfig(
   `Laboratory`, "", "", "Laboratory", "", [Assist.ROLE_ADMIN,]
  );

  pageConfig.Id = eId == undefined ? 0 : Number(eId);

  //set up data sources for relationship fields

  useEffect(() => {
    //check if initialized
    if (hasRun.current) return;
    hasRun.current = true;

    //check permissions and audit
    if (!Assist.checkPageAuditPermission(pageConfig, user)) {
      Assist.redirectUnauthorized(navigate);
      return;
    }
    
    //only load if updating item
    setLoading(true);

    setTimeout(() => {
      Assist.loadData(
        pageConfig.Title,
        `laboratorys/id/${pageConfig.Id}`,
      )
        .then((data: any) => {
          setLoading(false);
          if(pageConfig.Id != 0){
            // only update values if valid id
            updateVaues(data.laboratory);
          }
          //set up data sources for relationship fields
          setlab_type_data(data.labtypeList);
          setprovince_data(data.provinceList);
          setdistrict_data(data.districtList);
          //set error
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

    //name
    setName(data.name);
    setDescription(data.description);

    //properties
    //set up data sources for relationship fields
    setContactPersonName(data.contact_person_name);
    setCode(data.code);
    setLabType(data.lab_type_id);
    
    setPosition(data.position);
    setPhoneNumber(data.phone_number);
    setProvince(data.province_id);
    
    setEmailAddress(data.email_address);
    setDistrict(data.district_id);
    
    setPhysicalAddress(data.physical_address);
  };

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let result = confirm(
      "Are you sure you want to submit this Laboratory?",
      "Confirm submission",
    );
    result.then((dialogResult) => {
      if (dialogResult) {
        submitLaboratory();
      }
    });

  }

  const submitLaboratory = () => {

    setSaving(true);


    const postData = {
      //user
      user_id: user.userid,
      //name
      name: name,
      description: description,
      //properties
      contact_person_name: contact_person_name,
      code: code,
      lab_type_id: lab_type,
      position: position,
      phone_number: phone_number,
      province_id: province,
      email_address: email_address,
      district_id: district,
      physical_address: physical_address,
      // approval
      status_id: Assist.STATUS_SUBMITTED,
      stage_id: Assist.STAGE_SUBMITTED,
      approval_levels: 1,
    };

    const url =
      pageConfig.Id == 0
        ? `laboratorys/create`
        : `laboratorys/update/${pageConfig.Id}`;

    setTimeout(() => {
      Assist.postPutData(pageConfig.Title, url, postData, pageConfig.Id)
        .then((data: any) => {
          setSaving(false);
          updateVaues(data);
            // navigate to list
            Assist.showMessage(
              `You have successfully submitted the ${pageConfig.Title} for approval!`,
              "success",
            );
            navigate(`/admin/laboratorys/list`);
      
            
          
        })
        .catch((message) => {
          setSaving(false);
          Assist.showMessage(message, "error");
        });
    }, Assist.DEV_DELAY);
  };

  const toolbar: any = useMemo(() => {
    return AppInfo.htmlToolbar;
  }, []);

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
        section={"Configuration"}
        icon={"gear"}
        url="#"
      ></Titlebar>
      {/* end widget */}

      {/* chart start */}
      <Row>
        <Col sz={12} sm={12} lg={7}>
          <Card title="Properties" showHeader={true}>
            <form id="formMain" onSubmit={onFormSubmit}>
              <div className="form">
                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">Name</div>
                  <div className="dx-field">
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
                </div>
                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">Participant Information</div>
                  <div className="dx-field">
                    <div className="dx-field-label">Code</div>
                    <TextBox
                      className="dx-field-value"
                      placeholder="Code"
                      value={code}
                      disabled={error || saving}
                      onValueChange={(text) => setCode(text)}
                    >
                      <Validator>
                        <RequiredRule message="Code is required" />
                      </Validator>
                    </TextBox>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Type of Lab</div>
                    <SelectBox
                      className="dx-field-value"
                      placeholder="Type of Lab"
                      dataSource={lab_type_data}
                      displayExpr={'name'}
                      valueExpr={'id'}
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
                      displayExpr={'name'}
                      valueExpr={'id'}
                      deferRendering={false}
                      value={province}
                      disabled={error || saving}
                      onValueChange={(text) => setProvince(text)}
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
                      dataSource={district_data}
                      displayExpr={'name'}
                      valueExpr={'id'}
                      deferRendering={false}
                      value={district}
                      disabled={error || saving}
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
                <div className="dx-fieldset">
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
                      </Validator>
                    </TextBox>
                  </div> 
                </div>
                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">Description</div>
                  <div className="dx-field">
                    <HtmlEditor
                      height="225px"
                      defaultValue={description}
                      value={description}
                      toolbar={toolbar}
                      onValueChanged={(e) => setDescription(e.value)}
                    >
                      <MediaResizing enabled={true} />
                    </HtmlEditor>
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
                      Submit for Review
                    </span>
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default LaboratoryEdit;