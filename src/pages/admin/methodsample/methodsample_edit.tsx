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

const MethodSampleEdit = () => {
  //user
  const navigate = useNavigate();
  const { user } = useAuth();
  const { eId } = useParams(); // Destructure the parameter directly

  //name
  const [name, setName] = useState<undefined | string>(undefined);
  const [description, setDescription] = useState<undefined | string>(undefined);

  //properties
  const [scheme, setLabType] = useState<undefined | string>(undefined);
  const [service, setService] = useState<undefined | string>(undefined);
  const [method, setMethod] = useState<undefined | string>(undefined);


  //set up data sources for relationship fields
  const [scheme_data, setscheme_data]=useState<Array<any> | any>([]);
  const [service_data, setservice_data]=useState<Array<any> | any>([]);
  const [method_data, setmethod_data]=useState<Array<any> | any>([]);

  //service
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const hasRun = useRef(false);

  const pageConfig = new PageConfig(
   `Method Sample`, "", "", "Method Sample", "", [Assist.ROLE_ADMIN,]
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
        `method-samples/id/${pageConfig.Id}`,
      )
        .then((data: any) => {
          setLoading(false);
          if(pageConfig.Id != 0){
            // only update values if valid id
            updateVaues(data.methodsample);
          }
          //set up data sources for relationship fields
          setscheme_data(data.schemeList);
          setservice_data(data.serviceList);
          setmethod_data(data.methodList);
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
    setLabType(data.scheme_id);
    
    setService(data.service_id);
    
    setMethod(data.method_id);
    
  };

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let result = confirm(
      "Are you sure you want to submit this Method Sample?",
      "Confirm submission",
    );
    result.then((dialogResult) => {
      if (dialogResult) {
        submitMethodSample();
      }
    });

  }

  const submitMethodSample = () => {

    setSaving(true);


    const postData = {
      //user
      user_id: user.userid,
      //name
      name: name,
      description: description,
      //properties
      scheme_id: scheme,
      service_id: service,
      method_id: method,
      // approval
      status_id: Assist.STATUS_SUBMITTED,
      stage_id: Assist.STAGE_SUBMITTED,
      approval_levels: 1,
    };

    const url =
      pageConfig.Id == 0
        ? `method-samples/create`
        : `method-samples/update/${pageConfig.Id}`;

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
            navigate(`/admin/method-samples/list`);
      
            
          
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
                  <div className="dx-fieldset-header">Scheme</div>
                  <div className="dx-field">
                    <div className="dx-field-label">Scheme</div>
                    <SelectBox
                      className="dx-field-value"
                      placeholder="Scheme"
                      displayFormat={"dd MMMM yyyy"}
                      dateSerializationFormat="yyyy-MM-dd"
                      dataSource={scheme_data}
                      displayExpr={'name'}
                      valueExpr={'id'}
                      deferRendering={false}
                      value={scheme}
                      disabled={error || saving}
                      onValueChange={(text) => setLabType(text)}
                    >
                      <Validator>
                        <RequiredRule message="Scheme is required" />
                      </Validator>
                    </SelectBox>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Service</div>
                    <SelectBox
                      className="dx-field-value"
                      placeholder="Service"
                      displayFormat={"dd MMMM yyyy"}
                      dateSerializationFormat="yyyy-MM-dd"
                      dataSource={service_data}
                      displayExpr={'name'}
                      valueExpr={'id'}
                      deferRendering={false}
                      value={service}
                      disabled={error || saving}
                      onValueChange={(text) => setService(text)}
                    >
                      <Validator>
                        <RequiredRule message="Service is required" />
                      </Validator>
                    </SelectBox>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Method</div>
                    <SelectBox
                      className="dx-field-value"
                      placeholder="Method"
                      displayFormat={"dd MMMM yyyy"}
                      dateSerializationFormat="yyyy-MM-dd"
                      dataSource={method_data}
                      displayExpr={'name'}
                      valueExpr={'id'}
                      deferRendering={false}
                      value={method}
                      disabled={error || saving}
                      onValueChange={(text) => setMethod(text)}
                    >
                      <Validator>
                        <RequiredRule message="Method is required" />
                      </Validator>
                    </SelectBox>
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

export default MethodSampleEdit;