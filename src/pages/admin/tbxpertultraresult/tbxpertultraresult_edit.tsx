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

const TBXpertUltraResultEdit = () => {
  //user
  const navigate = useNavigate();
  const { user } = useAuth();
  const { eId } = useParams(); // Destructure the parameter directly

  //name
  const [name, setName] = useState<undefined | string>(undefined);
  const [description, setDescription] = useState<undefined | string>(undefined);

  //properties
  const [scheme, setLabType] = useState<undefined | string>(undefined);
  const [laboratory, setLaboratory] = useState<undefined | string>(undefined);
  const [service, setService] = useState<undefined | string>(undefined);
  const [enrollment, setEnrollment] = useState<undefined | string>(undefined);
  const [cycle, setCycle] = useState<undefined | string>(undefined);
  const [method, setMethod] = useState<undefined | string>(undefined);
  const [method_sample, setMethodSample] = useState<undefined | string>(undefined);
  const [result_nterpretable, setResultInterpretable] = useState<undefined | string>(undefined);
  const [tb_detection_result, setTBDetectionResult] = useState<undefined | string>(undefined);
  const [rif_result, setRifResult] = useState<undefined | string>(undefined);
  const [uninterpretable_result, setUninterpretableResult] = useState<undefined | string>(undefined);
  const [ultra_spc, setUltraSPC] = useState<undefined | number>(undefined);
  const [is1081_IS6110, setIS1081IS6110] = useState<undefined | number>(undefined);
  const [rpoB1, setrpoB1] = useState<undefined | number>(undefined);
  const [rpoB2, setrpoB2] = useState<undefined | number>(undefined);
  const [rpoB3, setrpoB3] = useState<undefined | number>(undefined);
  const [rpoB4, setrpoB4] = useState<undefined | number>(undefined);
  const [xpert_module_number, setXpertModuleNumber] = useState<undefined | number>(undefined);


  //set up data sources for relationship fields
  const [scheme_data, setscheme_data]=useState<Array<any> | any>([]);
  const [laboratory_data, setlaboratory_data]=useState<Array<any> | any>([]);
  const [service_data, setservice_data]=useState<Array<any> | any>([]);
  const [enrollment_data, setenrollment_data]=useState<Array<any> | any>([]);
  const [cycle_data, setcycle_data]=useState<Array<any> | any>([]);
  const [method_data, setmethod_data]=useState<Array<any> | any>([]);
  const [method_sample_data, setmethod_sample_data]=useState<Array<any> | any>([]);

  //service
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const hasRun = useRef(false);

  const pageConfig = new PageConfig(
   `TB Xpert Ultra Result`, "", "", "TB Xpert Ultra Result", "", [Assist.ROLE_ADMIN,]
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
        `tb-xpert-ultra-results/id/${pageConfig.Id}`,
      )
        .then((data: any) => {
          setLoading(false);
          if(pageConfig.Id != 0){
            // only update values if valid id
            updateVaues(data.tbxpertultraresult);
          }
          //set up data sources for relationship fields
          setscheme_data(data.schemeList);
          setlaboratory_data(data.laboratoryList);
          setservice_data(data.serviceList);
          setenrollment_data(data.enrollmentList);
          setcycle_data(data.ptcycleList);
          setmethod_data(data.methodList);
          setmethod_sample_data(data.methodsampleList);
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
    
    setLaboratory(data.lab_id);
    
    setService(data.service_id);
    
    setEnrollment(data.enrollment_id);
    
    setCycle(data.pt_cycle_id);
    
    setMethod(data.method_id);
    
    setMethodSample(data.method_sample_id);
    
    setResultInterpretable(data.result_nterpretable);
    setTBDetectionResult(data.tb_detection_result);
    setRifResult(data.rif_result);
    setUninterpretableResult(data.uninterpretable_result);
    setUltraSPC(data.ultra_spc);
    setIS1081IS6110(data.is1081_IS6110);
    setrpoB1(data.rpoB1);
    setrpoB2(data.rpoB2);
    setrpoB3(data.rpoB3);
    setrpoB4(data.rpoB4);
    setXpertModuleNumber(data.xpert_module_number);
  };

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let result = confirm(
      "Are you sure you want to submit this TB Xpert Ultra Result?",
      "Confirm submission",
    );
    result.then((dialogResult) => {
      if (dialogResult) {
        submitTBXpertUltraResult();
      }
    });

  }

  const submitTBXpertUltraResult = () => {

    setSaving(true);


    const postData = {
      //user
      user_id: user.userid,
      //name
      name: name,
      description: description,
      //properties
      scheme_id: scheme,
      lab_id: laboratory,
      service_id: service,
      enrollment_id: enrollment,
      pt_cycle_id: cycle,
      method_id: method,
      method_sample_id: method_sample,
      result_nterpretable: result_nterpretable,
      tb_detection_result: tb_detection_result,
      rif_result: rif_result,
      uninterpretable_result: uninterpretable_result,
      ultra_spc: ultra_spc,
      is1081_IS6110: is1081_IS6110,
      rpoB1: rpoB1,
      rpoB2: rpoB2,
      rpoB3: rpoB3,
      rpoB4: rpoB4,
      xpert_module_number: xpert_module_number,
      // approval
      status_id: Assist.STATUS_SUBMITTED,
      stage_id: Assist.STAGE_SUBMITTED,
      approval_levels: 1,
    };

    const url =
      pageConfig.Id == 0
        ? `tb-xpert-ultra-results/create`
        : `tb-xpert-ultra-results/update/${pageConfig.Id}`;

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
            navigate(`/admin/tb-xpert-ultra-results/list`);
      
            
          
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
                  <div className="dx-field">
                    <div className="dx-field-label">Method Sample</div>
                    <SelectBox
                      className="dx-field-value"
                      placeholder="Method Sample"
                      displayFormat={"dd MMMM yyyy"}
                      dateSerializationFormat="yyyy-MM-dd"
                      dataSource={method_sample_data}
                      displayExpr={'name'}
                      valueExpr={'id'}
                      deferRendering={false}
                      value={method_sample}
                      disabled={error || saving}
                      onValueChange={(text) => setMethodSample(text)}
                    >
                      <Validator>
                        <RequiredRule message="Method Sample is required" />
                      </Validator>
                    </SelectBox>
                  </div> 
                </div>
                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">Enrollment</div>
                  <div className="dx-field">
                    <div className="dx-field-label">Laboratory</div>
                    <SelectBox
                      className="dx-field-value"
                      placeholder="Laboratory"
                      displayFormat={"dd MMMM yyyy"}
                      dateSerializationFormat="yyyy-MM-dd"
                      dataSource={laboratory_data}
                      displayExpr={'name'}
                      valueExpr={'id'}
                      deferRendering={false}
                      value={laboratory}
                      disabled={error || saving}
                      onValueChange={(text) => setLaboratory(text)}
                    >
                      <Validator>
                        <RequiredRule message="Laboratory is required" />
                      </Validator>
                    </SelectBox>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Enrollment</div>
                    <SelectBox
                      className="dx-field-value"
                      placeholder="Enrollment"
                      displayFormat={"dd MMMM yyyy"}
                      dateSerializationFormat="yyyy-MM-dd"
                      dataSource={enrollment_data}
                      displayExpr={'name'}
                      valueExpr={'id'}
                      deferRendering={false}
                      value={enrollment}
                      disabled={error || saving}
                      onValueChange={(text) => setEnrollment(text)}
                    >
                      <Validator>
                        <RequiredRule message="Enrollment is required" />
                      </Validator>
                    </SelectBox>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Cycle</div>
                    <SelectBox
                      className="dx-field-value"
                      placeholder="Cycle"
                      displayFormat={"dd MMMM yyyy"}
                      dateSerializationFormat="yyyy-MM-dd"
                      dataSource={cycle_data}
                      displayExpr={'name'}
                      valueExpr={'id'}
                      deferRendering={false}
                      value={cycle}
                      disabled={error || saving}
                      onValueChange={(text) => setCycle(text)}
                    >
                      <Validator>
                        <RequiredRule message="Cycle is required" />
                      </Validator>
                    </SelectBox>
                  </div> 
                </div>
                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">Results</div>
                  <div className="dx-field">
                    <div className="dx-field-label">Result Interpretable</div>
                    <SelectBox
                      className="dx-field-value"
                      placeholder="Result Interpretable"
                      displayFormat={"dd MMMM yyyy"}
                      dateSerializationFormat="yyyy-MM-dd"
                      value={result_nterpretable}
                      disabled={error || saving}
                      onValueChange={(text) => setResultInterpretable(text)}
                    >
                      <Validator>
                        <RequiredRule message="Result Interpretable is required" />
                      </Validator>
                    </SelectBox>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">TB Detection Result</div>
                    <SelectBox
                      className="dx-field-value"
                      placeholder="TB Detection Result"
                      displayFormat={"dd MMMM yyyy"}
                      dateSerializationFormat="yyyy-MM-dd"
                      value={tb_detection_result}
                      disabled={error || saving}
                      onValueChange={(text) => setTBDetectionResult(text)}
                    >
                      <Validator>
                        <RequiredRule message="TB Detection Result is required" />
                      </Validator>
                    </SelectBox>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Rif Result</div>
                    <SelectBox
                      className="dx-field-value"
                      placeholder="Rif Result"
                      displayFormat={"dd MMMM yyyy"}
                      dateSerializationFormat="yyyy-MM-dd"
                      value={rif_result}
                      disabled={error || saving}
                      onValueChange={(text) => setRifResult(text)}
                    >
                      <Validator>
                        <RequiredRule message="Rif Result is required" />
                      </Validator>
                    </SelectBox>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Uninterpretable Result</div>
                    <SelectBox
                      className="dx-field-value"
                      placeholder="Uninterpretable Result"
                      displayFormat={"dd MMMM yyyy"}
                      dateSerializationFormat="yyyy-MM-dd"
                      value={uninterpretable_result}
                      disabled={error || saving}
                      onValueChange={(text) => setUninterpretableResult(text)}
                    >
                      <Validator>
                        <RequiredRule message="Uninterpretable Result is required" />
                      </Validator>
                    </SelectBox>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Ultra SPC</div>
                    <NumberBox
                      className="dx-field-value"
                      placeholder="Ultra SPC"
                      displayFormat={"dd MMMM yyyy"}
                      dateSerializationFormat="yyyy-MM-dd"
                      value={ultra_spc}
                      disabled={error || saving}
                      onValueChange={(text) => setUltraSPC(text)}
                    >
                      <Validator>
                        <RequiredRule message="Ultra SPC is required" />
                      </Validator>
                    </NumberBox>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">IS1081-IS6110</div>
                    <NumberBox
                      className="dx-field-value"
                      placeholder="IS1081-IS6110"
                      displayFormat={"dd MMMM yyyy"}
                      dateSerializationFormat="yyyy-MM-dd"
                      value={is1081_IS6110}
                      disabled={error || saving}
                      onValueChange={(text) => setIS1081IS6110(text)}
                    >
                      <Validator>
                        <RequiredRule message="IS1081-IS6110 is required" />
                      </Validator>
                    </NumberBox>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">rpoB1</div>
                    <NumberBox
                      className="dx-field-value"
                      placeholder="rpoB1"
                      displayFormat={"dd MMMM yyyy"}
                      dateSerializationFormat="yyyy-MM-dd"
                      value={rpoB1}
                      disabled={error || saving}
                      onValueChange={(text) => setrpoB1(text)}
                    >
                      <Validator>
                        <RequiredRule message="rpoB1 is required" />
                      </Validator>
                    </NumberBox>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">rpoB2</div>
                    <NumberBox
                      className="dx-field-value"
                      placeholder="rpoB2"
                      displayFormat={"dd MMMM yyyy"}
                      dateSerializationFormat="yyyy-MM-dd"
                      value={rpoB2}
                      disabled={error || saving}
                      onValueChange={(text) => setrpoB2(text)}
                    >
                      <Validator>
                        <RequiredRule message="rpoB2 is required" />
                      </Validator>
                    </NumberBox>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">rpoB3</div>
                    <NumberBox
                      className="dx-field-value"
                      placeholder="rpoB3"
                      displayFormat={"dd MMMM yyyy"}
                      dateSerializationFormat="yyyy-MM-dd"
                      value={rpoB3}
                      disabled={error || saving}
                      onValueChange={(text) => setrpoB3(text)}
                    >
                      <Validator>
                        <RequiredRule message="rpoB3 is required" />
                      </Validator>
                    </NumberBox>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">rpoB4</div>
                    <NumberBox
                      className="dx-field-value"
                      placeholder="rpoB4"
                      displayFormat={"dd MMMM yyyy"}
                      dateSerializationFormat="yyyy-MM-dd"
                      value={rpoB4}
                      disabled={error || saving}
                      onValueChange={(text) => setrpoB4(text)}
                    >
                      <Validator>
                        <RequiredRule message="rpoB4 is required" />
                      </Validator>
                    </NumberBox>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Xpert Module Number</div>
                    <NumberBox
                      className="dx-field-value"
                      placeholder="Xpert Module Number"
                      displayFormat={"dd MMMM yyyy"}
                      dateSerializationFormat="yyyy-MM-dd"
                      value={xpert_module_number}
                      disabled={error || saving}
                      onValueChange={(text) => setXpertModuleNumber(text)}
                    >
                      <Validator>
                        <RequiredRule message="Xpert Module Number is required" />
                      </Validator>
                    </NumberBox>
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

export default TBXpertUltraResultEdit;