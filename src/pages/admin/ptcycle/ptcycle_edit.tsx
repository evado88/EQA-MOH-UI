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

const PTCycleEdit = () => {
  //user
  const navigate = useNavigate();
  const { user } = useAuth();
  const { eId } = useParams(); // Destructure the parameter directly

  //name
  const [name, setName] = useState<undefined | string>(undefined);
  const [description, setDescription] = useState<undefined | string>(undefined);

  //properties
  const [code, setCode] = useState<undefined | string>(undefined);
  const [scheme, setLabType] = useState<undefined | string>(undefined);
  const [effective_date, setEffectiveDate] = useState<undefined | string>(undefined);
  const [pt_cycle_status, setPTCycleStatus] = useState<undefined | string>(undefined);
  const [closing_date, setClosingDate] = useState<undefined | string>(undefined);
  const [shipping_date, setShippingDate] = useState<undefined | string>(undefined);
  const [reports_availability_date, setReportsAvailabilityDate] = useState<undefined | string>(undefined);


  //set up data sources for relationship fields
  const [scheme_data, setscheme_data]=useState<Array<any> | any>([]);
  const [pt_cycle_status_data, setpt_cycle_status_data]=useState<Array<any> | any>([]);

  //service
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const hasRun = useRef(false);

  const pageConfig = new PageConfig(
   `PT Cycle`, "", "", "PT Cycle", "", [Assist.ROLE_ADMIN,]
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
        `pt-cycles/id/${pageConfig.Id}`,
      )
        .then((data: any) => {
          setLoading(false);
          if(pageConfig.Id != 0){
            // only update values if valid id
            updateVaues(data.ptcycle);
          }
          //set up data sources for relationship fields
          setscheme_data(data.schemeList);
          setpt_cycle_status_data(data.ptcyclestatusList);
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
    setCode(data.code);
    setLabType(data.scheme_id);
    
    setEffectiveDate(data.effective_date);
    setPTCycleStatus(data.pt_cyle_status_id);
    
    setClosingDate(data.closing_date);
    setShippingDate(data.shipping_date);
    setReportsAvailabilityDate(data.reports_availability_date);
  };

  /** What the cycle's status is, or will be when it is opened */
  const currentStatusName = () => {
    if (pageConfig.Id == 0) {
      return Assist.PT_CYCLE_STATUS_NAMES[Assist.PT_CYCLE_UPCOMING];
    }

    return (
      pt_cycle_status_data.find((s: any) => s.id === pt_cycle_status)?.name ??
      Assist.PT_CYCLE_STATUS_NAMES[pt_cycle_status as any] ??
      "-"
    );
  };

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let result = confirm(
      "Are you sure you want to submit this PT Cycle?",
      "Confirm submission",
    );
    result.then((dialogResult) => {
      if (dialogResult) {
        submitPTCycle();
      }
    });

  }

  const submitPTCycle = () => {

    setSaving(true);


    const postData = {
      //user
      user_id: user.userid,
      //name
      name: name,
      description: description,
      //properties
      code: code,
      scheme_id: scheme,
      effective_date: effective_date,
      //the status is deliberately not sent. A new cycle starts Upcoming, and
      //an existing one only moves on from the PT Cycle page, a step at a time
      closing_date: closing_date,
      shipping_date: shipping_date,
      reports_availability_date: reports_availability_date,
      // approval
      status_id: Assist.STATUS_SUBMITTED,
      stage_id: Assist.STAGE_SUBMITTED,
      approval_levels: 1,
    };

    const url =
      pageConfig.Id == 0
        ? `pt-cycles/create`
        : `pt-cycles/update/${pageConfig.Id}`;

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
            navigate(`/admin/pt-cycles/list`);
      
            
          
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
                  <div className="dx-fieldset-header">Period</div>
                  <div className="dx-field">
                    <div className="dx-field-label">Code</div>
                    <TextBox
                      className="dx-field-value"
                      placeholder="Code"
                      displayFormat={"dd MMMM yyyy"}
                      dateSerializationFormat="yyyy-MM-dd"
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
                    <div className="dx-field-label">Effective Date</div>
                    <DateBox
                      className="dx-field-value"
                      placeholder="Effective Date"
                      displayFormat={"dd MMMM yyyy"}
                      dateSerializationFormat="yyyy-MM-dd"
                      value={effective_date}
                      disabled={error || saving}
                      onValueChange={(text) => setEffectiveDate(text)}
                    >
                      <Validator>
                        <RequiredRule message="Effective Date is required" />
                      </Validator>
                    </DateBox>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Closing Date</div>
                    <DateBox
                      className="dx-field-value"
                      placeholder="Closing Date"
                      displayFormat={"dd MMMM yyyy"}
                      dateSerializationFormat="yyyy-MM-dd"
                      value={closing_date}
                      disabled={error || saving}
                      onValueChange={(text) => setClosingDate(text)}
                    >
                      <Validator>
                        <RequiredRule message="Closing Date is required" />
                      </Validator>
                    </DateBox>
                  </div> 
                </div>
                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">Timeline</div>
                  {/* the status is not a choice. A new cycle starts Upcoming
                      and is moved on a step at a time from the PT Cycle page,
                      because each step does something - enrolment opens,
                      panels ship, results are scored. */}
                  <div className="dx-field">
                    <div className="dx-field-label">PT Cycle Status</div>
                    <div className="dx-field-value-static">
                      <strong>{currentStatusName()}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-value-static">
                      <small>
                        {pageConfig.Id == 0
                          ? "A new PT Cycle opens as Upcoming. Enrolment opens, panels ship and results are scored as you move it on from the PT Cycle page."
                          : "Move the cycle on from the PT Cycle page, which applies each step in turn."}
                      </small>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Shipping Date</div>
                    <DateBox
                      className="dx-field-value"
                      placeholder="Shipping Date"
                      displayFormat={"dd MMMM yyyy"}
                      dateSerializationFormat="yyyy-MM-dd"
                      value={shipping_date}
                      disabled={error || saving}
                      onValueChange={(text) => setShippingDate(text)}
                    >
                      <Validator>
                        <RequiredRule message="Shipping Date is required" />
                      </Validator>
                    </DateBox>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Reports Availability Date</div>
                    <DateBox
                      className="dx-field-value"
                      placeholder="Reports Availability Date"
                      displayFormat={"dd MMMM yyyy"}
                      dateSerializationFormat="yyyy-MM-dd"
                      value={reports_availability_date}
                      disabled={error || saving}
                      onValueChange={(text) => setReportsAvailabilityDate(text)}
                    >
                      <Validator>
                        <RequiredRule message="Reports Availability Date is required" />
                      </Validator>
                    </DateBox>
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

export default PTCycleEdit;