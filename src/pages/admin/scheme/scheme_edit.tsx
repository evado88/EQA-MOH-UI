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

const SchemeEdit = () => {
  //user
  const navigate = useNavigate();
  const { user } = useAuth();
  const { eId } = useParams(); // Destructure the parameter directly

  //name
  const [name, setName] = useState<undefined | string>(undefined);
  const [description, setDescription] = useState<undefined | string>(undefined);

  //properties
  const [provider, setScheme] = useState<undefined | string>(undefined);

  //registration payment configuration
  const [feeUsd, setFeeUsd] = useState<undefined | number>(undefined);
  const [feeZmw, setFeeZmw] = useState<undefined | number>(undefined);
  const [bankDetails, setBankDetails] = useState<undefined | string>(undefined);
  const [mobileMoney, setMobileMoney] = useState<undefined | string>(undefined);
  const [paymentInstructions, setPaymentInstructions] = useState<undefined | string>(undefined);

  //set up data sources for relationship fields
  const [provider_data, setprovider_data]=useState<Array<any> | any>([]);

  //service
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const hasRun = useRef(false);

  const pageConfig = new PageConfig(
   `Scheme`, "", "", "Scheme", "", [Assist.ROLE_ADMIN,]
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
        `schemes/id/${pageConfig.Id}`,
      )
        .then((data: any) => {
          setLoading(false);
          if(pageConfig.Id != 0){
            // only update values if valid id
            updateVaues(data.scheme);
          }
          //set up data sources for relationship fields
          setprovider_data(data.providerList);
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
    setScheme(data.provider_id);

    //registration payment configuration
    setFeeUsd(data.registration_fee_usd ?? undefined);
    setFeeZmw(data.registration_fee_zmw ?? undefined);
    setBankDetails(data.bank_account_details ?? undefined);
    setMobileMoney(data.mobile_money_details ?? undefined);
    setPaymentInstructions(data.payment_instructions ?? undefined);
  };

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let result = confirm(
      "Are you sure you want to submit this Scheme?",
      "Confirm submission",
    );
    result.then((dialogResult) => {
      if (dialogResult) {
        submitScheme();
      }
    });

  }

  const submitScheme = () => {

    setSaving(true);


    const postData = {
      //user
      user_id: user.userid,
      //name
      name: name,
      description: description,
      //properties
      provider_id: provider,
      //registration payment configuration
      registration_fee_usd: feeUsd ?? null,
      registration_fee_zmw: feeZmw ?? null,
      bank_account_details: bankDetails ?? null,
      mobile_money_details: mobileMoney ?? null,
      payment_instructions: paymentInstructions ?? null,
      // approval
      status_id: Assist.STATUS_SUBMITTED,
      stage_id: Assist.STAGE_SUBMITTED,
      approval_levels: 1,
    };

    const url =
      pageConfig.Id == 0
        ? `schemes/create`
        : `schemes/update/${pageConfig.Id}`;

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
            navigate(`/admin/schemes/list`);
      
            
          
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
                  <div className="dx-fieldset-header">Provider</div>
                  <div className="dx-field">
                    <div className="dx-field-label">Provider</div>
                    <SelectBox
                      className="dx-field-value"
                      placeholder="Provider"
                      dataSource={provider_data}
                      displayExpr={'name'}
                      valueExpr={'id'}
                      deferRendering={false}
                      value={provider}
                      disabled={error || saving}
                      onValueChange={(text) => setScheme(text)}
                    >
                      <Validator>
                        <RequiredRule message="Provider is required" />
                      </Validator>
                    </SelectBox>
                  </div> 
                </div>
                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">Registration Payment</div>
                  <p style={{ color: "#6b7280", fontSize: 12, margin: "0 0 8px" }}>
                    Used when an approver marks a registration as requiring
                    payment. Local (Zambian) labs are charged in ZMW and may use
                    mobile money; international labs are charged in USD.
                  </p>
                  <div className="dx-field">
                    <div className="dx-field-label">Registration Fee (USD)</div>
                    <NumberBox
                      className="dx-field-value"
                      placeholder="e.g. 50"
                      format="$ #,##0.##"
                      min={0}
                      value={feeUsd}
                      disabled={error || saving}
                      onValueChange={(v) => setFeeUsd(v)}
                    />
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Registration Fee (ZMW)</div>
                    <NumberBox
                      className="dx-field-value"
                      placeholder="e.g. 1000"
                      format="#,##0.## 'ZMW'"
                      min={0}
                      value={feeZmw}
                      disabled={error || saving}
                      onValueChange={(v) => setFeeZmw(v)}
                    />
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Bank Account Details</div>
                    <TextArea
                      className="dx-field-value"
                      placeholder="Bank name, account name, account number, branch, SWIFT"
                      height={70}
                      value={bankDetails}
                      disabled={error || saving}
                      onValueChange={(v) => setBankDetails(v)}
                    />
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Mobile Money (local only)</div>
                    <TextArea
                      className="dx-field-value"
                      placeholder="Provider, number, registered name"
                      height={70}
                      value={mobileMoney}
                      disabled={error || saving}
                      onValueChange={(v) => setMobileMoney(v)}
                    />
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Payment Instructions</div>
                    <TextArea
                      className="dx-field-value"
                      placeholder="Any instructions shown to the applicant"
                      height={70}
                      value={paymentInstructions}
                      disabled={error || saving}
                      onValueChange={(v) => setPaymentInstructions(v)}
                    />
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

export default SchemeEdit;