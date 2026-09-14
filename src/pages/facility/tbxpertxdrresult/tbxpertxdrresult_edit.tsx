import React, { useState, useEffect, useMemo, useRef } from "react";
import { Titlebar } from "../../../components/titlebar";
import { Card } from "../../../components/card";
import { Row } from "../../../components/row";
import { Col } from "../../../components/column";
import SelectBox from "devextreme-react/select-box";
import { TextBox } from "devextreme-react/text-box";
import { Validator, RequiredRule } from "devextreme-react/validator";
import { NumberBox } from "devextreme-react/number-box";
import Button from "devextreme-react/button";
import ValidationSummary from "devextreme-react/validation-summary";
import { LoadPanel } from "devextreme-react/load-panel";
import DateBox from "devextreme-react/date-box";
import { useAuth } from "../../../context/AuthContext";
import PageConfig from "../../../classes/page-config";
import Assist from "../../../classes/assist";
import { LoadIndicator } from "devextreme-react/load-indicator";
import { useNavigate, useParams } from "react-router-dom";
import HtmlEditor, { MediaResizing } from "devextreme-react/html-editor";
import AppInfo from "../../../classes/app-info";
import { confirm } from "devextreme/ui/dialog";

// the four drug resistance results on form CDL-PT-F-027
const DRUG_RESULTS = [
  { field: "inh_result", label: "INH Result" },
  { field: "flq_result", label: "FLQ Result" },
  { field: "amk_result", label: "AMK Result" },
  { field: "eth_result", label: "ETH Result" },
];

// the nine cycle threshold probes an Xpert MTB/XDR run reports
const CT_VALUES = [
  { field: "spc_ahpc", label: "SPC-ahpC" },
  { field: "inha", label: "inhA" },
  { field: "katg", label: "KatG" },
  { field: "fabg1", label: "fabG1" },
  { field: "gyra1", label: "gyrA1" },
  { field: "gyra2", label: "gyrA2" },
  { field: "gyra3", label: "gyrA3" },
  { field: "gyrb2", label: "gyrB2" },
  { field: "rrs", label: "rrs" },
];

const TBXpertXDRResultEdit = () => {
  //user
  const navigate = useNavigate();
  const { user } = useAuth();
  const { eId } = useParams();

  //name
  const [name, setName] = useState<undefined | string>(undefined);
  const [description, setDescription] = useState<undefined | string>(undefined);

  //properties
  const [scheme, setScheme] = useState<undefined | string>(undefined);
  const [laboratory, setLaboratory] = useState<undefined | string>(undefined);
  const [service, setService] = useState<undefined | string>(undefined);
  const [enrollment, setEnrollment] = useState<undefined | string>(undefined);
  const [cycle, setCycle] = useState<undefined | string>(undefined);
  const [method, setMethod] = useState<undefined | string>(undefined);
  const [method_sample, setMethodSample] = useState<undefined | string>(
    undefined,
  );

  //results
  const [date_tested, setDateTested] = useState<undefined | Date | string>(
    undefined,
  );
  const [result_interpretable, setResultInterpretable] = useState<
    undefined | string
  >(undefined);
  const [tb_detection_result, setTBDetectionResult] = useState<
    undefined | string
  >(undefined);
  //the four drug results and nine Ct probes are held together, since the form
  //treats them as one block each
  const [drugs, setDrugs] = useState<Record<string, string | undefined>>({});
  const [cts, setCts] = useState<Record<string, number | undefined>>({});
  const [uninterpretable_result, setUninterpretableResult] = useState<
    undefined | string
  >(undefined);
  const [error_code, setErrorCode] = useState<undefined | string>(undefined);

  //set up data sources for relationship fields
  const [scheme_data, setscheme_data] = useState<Array<any> | any>([]);
  const [laboratory_data, setlaboratory_data] = useState<Array<any> | any>([]);
  const [service_data, setservice_data] = useState<Array<any> | any>([]);
  const [enrollment_data, setenrollment_data] = useState<Array<any> | any>([]);
  const [cycle_data, setcycle_data] = useState<Array<any> | any>([]);
  const [method_data, setmethod_data] = useState<Array<any> | any>([]);
  const [method_sample_data, setmethod_sample_data] = useState<
    Array<any> | any
  >([]);

  //service
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const hasRun = useRef(false);

  const pageConfig = new PageConfig(
    `TB Xpert XDR Result`,
    "",
    "",
    "TB Xpert XDR Result",
    "",
    Assist.LABORATORY_ROLES,
  );

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

    //only load if updating item
    setLoading(true);

    setTimeout(() => {
      Assist.loadData(pageConfig.Title, `tb-xpert-xdr-results/id/${pageConfig.Id}`)
        .then((data: any) => {
          setLoading(false);
          if (pageConfig.Id != 0) {
            updateVaues(data.tbxpertxdrresult);
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
    setScheme(data.scheme_id);
    setLaboratory(data.lab_id);
    setService(data.service_id);
    setEnrollment(data.enrollment_id);
    setCycle(data.pt_cycle_id);
    setMethod(data.method_id);
    setMethodSample(data.method_sample_id);

    //results
    setDateTested(data.date_tested ?? undefined);
    setResultInterpretable(data.result_interpretable);
    setTBDetectionResult(data.tb_detection_result);
    setUninterpretableResult(data.uninterpretable_result);
    setErrorCode(data.error_code);

    const nextDrugs: Record<string, string | undefined> = {};
    DRUG_RESULTS.forEach((d) => (nextDrugs[d.field] = data[d.field] ?? undefined));
    setDrugs(nextDrugs);

    const nextCts: Record<string, number | undefined> = {};
    CT_VALUES.forEach((c) => (nextCts[c.field] = data[c.field] ?? undefined));
    setCts(nextCts);
  };

  const interpretableYes = result_interpretable === "Yes";
  const interpretableNo = result_interpretable === "No";
  const requiresErrorCode = uninterpretable_result === "ERROR";

  //the XDR assay only reports resistance against a detected complex
  const tbNotDetected = tb_detection_result === "NOT DETECTED";

  const onResultInterpretableChange = (value: string | undefined) => {
    setResultInterpretable(value);

    if (value === "Yes") {
      setUninterpretableResult(undefined);
      setErrorCode(undefined);
    } else if (value === "No") {
      setTBDetectionResult(undefined);
      setDrugs({});
    } else {
      setTBDetectionResult(undefined);
      setDrugs({});
      setUninterpretableResult(undefined);
      setErrorCode(undefined);
    }
  };

  const onTBDetectionChange = (value: string | undefined) => {
    setTBDetectionResult(value);

    //nothing to report resistance against, so the drug results become N/A
    if (value === "NOT DETECTED") {
      const na: Record<string, string> = {};
      DRUG_RESULTS.forEach((d) => (na[d.field] = "N/A"));
      setDrugs(na);
    }
  };

  const onUninterpretableResultChange = (value: string | undefined) => {
    setUninterpretableResult(value);
    if (value !== "ERROR") {
      setErrorCode(undefined);
    }
  };

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    confirm(
      "Are you sure you want to submit this TB Xpert XDR Result? You will not be able to change it afterwards.",
      "Confirm submission",
    ).then((dialogResult) => {
      if (dialogResult) {
        submitResult(Assist.STATUS_SUBMITTED);
      }
    });
  };

  //a panel is often captured over more than one sitting, so a lab can park a
  //partly filled form without it going for review
  const onSaveDraft = () => submitResult(Assist.STATUS_DRAFT);

  const submitResult = (statusId: number) => {
    setSaving(true);

    const isDraft = statusId == Assist.STATUS_DRAFT;

    const postData: any = {
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
      //results
      date_tested: date_tested
        ? Assist.toMySQLFormat(new Date(date_tested), false)
        : null,
      result_interpretable: result_interpretable,
      tb_detection_result: tb_detection_result,
      uninterpretable_result: uninterpretable_result,
      error_code: error_code,
      // approval
      status_id: statusId,
      stage_id: isDraft
        ? Assist.STAGE_AWAITING_SUBMISSION
        : Assist.STAGE_SUBMITTED,
      approval_levels: 1,
    };

    DRUG_RESULTS.forEach((d) => (postData[d.field] = drugs[d.field] ?? null));
    CT_VALUES.forEach((c) => (postData[c.field] = cts[c.field] ?? null));

    const url =
      pageConfig.Id == 0
        ? `tb-xpert-xdr-results/create`
        : `tb-xpert-xdr-results/update/${pageConfig.Id}`;

    setTimeout(() => {
      Assist.postPutData(pageConfig.Title, url, postData, pageConfig.Id)
        .then((data: any) => {
          setSaving(false);
          updateVaues(data);

          if (isDraft) {
            Assist.showMessage(
              `Your ${pageConfig.Title} has been saved as a draft.`,
              "success",
            );
            return;
          }

          Assist.showMessage(
            `You have successfully submitted the ${pageConfig.Title} for approval!`,
            "success",
          );
          navigate(`/facility/tb-xpert-xdr-results/list`);
        })
        .catch((message) => {
          setSaving(false);
          Assist.showMessage(message, "error");
        });
    }, Assist.DEV_DELAY);
  };

  const toolbar: any = useMemo(() => AppInfo.htmlToolbar, []);

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
        section={"PT Results"}
        icon={"gear"}
        url="#"
      ></Titlebar>

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
                      readOnly={true}
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
                      dataSource={scheme_data}
                      displayExpr={"name"}
                      valueExpr={"id"}
                      readOnly={true}
                      deferRendering={false}
                      value={scheme}
                      disabled={error || saving}
                      onValueChange={(text) => setScheme(text)}
                    />
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Service</div>
                    <SelectBox
                      className="dx-field-value"
                      placeholder="Service"
                      dataSource={service_data}
                      displayExpr={"name"}
                      valueExpr={"id"}
                      readOnly={true}
                      deferRendering={false}
                      value={service}
                      disabled={error || saving}
                      onValueChange={(text) => setService(text)}
                    />
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Method</div>
                    <SelectBox
                      className="dx-field-value"
                      placeholder="Method"
                      dataSource={method_data}
                      displayExpr={"name"}
                      valueExpr={"id"}
                      readOnly={true}
                      deferRendering={false}
                      value={method}
                      disabled={error || saving}
                      onValueChange={(text) => setMethod(text)}
                    />
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Method Sample</div>
                    <SelectBox
                      className="dx-field-value"
                      placeholder="Method Sample"
                      dataSource={method_sample_data}
                      displayExpr={"name"}
                      valueExpr={"id"}
                      readOnly={true}
                      deferRendering={false}
                      value={method_sample}
                      disabled={error || saving}
                      onValueChange={(text) => setMethodSample(text)}
                    />
                  </div>
                </div>

                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">Enrollment</div>
                  <div className="dx-field">
                    <div className="dx-field-label">Laboratory</div>
                    <SelectBox
                      className="dx-field-value"
                      placeholder="Laboratory"
                      dataSource={laboratory_data}
                      displayExpr={"name"}
                      valueExpr={"id"}
                      readOnly={true}
                      deferRendering={false}
                      value={laboratory}
                      disabled={error || saving}
                      onValueChange={(text) => setLaboratory(text)}
                    />
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Enrollment</div>
                    <SelectBox
                      className="dx-field-value"
                      placeholder="Enrollment"
                      dataSource={enrollment_data}
                      displayExpr={"name"}
                      valueExpr={"id"}
                      readOnly={true}
                      deferRendering={false}
                      value={enrollment}
                      disabled={error || saving}
                      onValueChange={(text) => setEnrollment(text)}
                    />
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Cycle</div>
                    <SelectBox
                      className="dx-field-value"
                      placeholder="Cycle"
                      dataSource={cycle_data}
                      displayExpr={"name"}
                      valueExpr={"id"}
                      readOnly={true}
                      deferRendering={false}
                      value={cycle}
                      disabled={error || saving}
                      onValueChange={(text) => setCycle(text)}
                    />
                  </div>
                </div>

                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">Results</div>
                  <div className="dx-field">
                    <div className="dx-field-label">Date Tested</div>
                    <DateBox
                      className="dx-field-value"
                      placeholder="Date Tested"
                      type="date"
                      displayFormat="dd MMM yyyy"
                      max={new Date()}
                      value={date_tested}
                      disabled={error || saving}
                      onValueChange={(value) => setDateTested(value)}
                    >
                      <Validator>
                        <RequiredRule message="Date Tested is required" />
                      </Validator>
                    </DateBox>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Result Interpretable</div>
                    <SelectBox
                      className="dx-field-value"
                      placeholder="Result Interpretable"
                      dataSource={["Yes", "No"]}
                      value={result_interpretable}
                      disabled={error || saving}
                      onValueChange={onResultInterpretableChange}
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
                      dataSource={["NOT DETECTED", "DETECTED"]}
                      value={tb_detection_result}
                      disabled={error || saving || !interpretableYes}
                      onValueChange={onTBDetectionChange}
                    >
                      <Validator>
                        {interpretableYes && (
                          <RequiredRule message="TB Detection Result is required" />
                        )}
                      </Validator>
                    </SelectBox>
                  </div>
                </div>

                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">Drug Resistance</div>
                  {DRUG_RESULTS.map((drug) => (
                    <div className="dx-field" key={drug.field}>
                      <div className="dx-field-label">{drug.label}</div>
                      <SelectBox
                        className="dx-field-value"
                        placeholder={drug.label}
                        dataSource={
                          tbNotDetected
                            ? ["N/A"]
                            : ["N/A", "NOT DETECTED", "DETECTED"]
                        }
                        value={drugs[drug.field]}
                        disabled={error || saving || !interpretableYes}
                        onValueChange={(value) =>
                          setDrugs({ ...drugs, [drug.field]: value })
                        }
                      >
                        <Validator>
                          {interpretableYes && (
                            <RequiredRule
                              message={`${drug.label} is required`}
                            />
                          )}
                        </Validator>
                      </SelectBox>
                    </div>
                  ))}
                </div>

                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">
                    Uninterpretable Result
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Uninterpretable Result</div>
                    <SelectBox
                      className="dx-field-value"
                      placeholder="Uninterpretable Result"
                      dataSource={[
                        "INVALID",
                        "NO RESULT",
                        "ERROR",
                        "INDETERMINATE",
                      ]}
                      value={uninterpretable_result}
                      disabled={error || saving || !interpretableNo}
                      onValueChange={onUninterpretableResultChange}
                    >
                      <Validator>
                        {interpretableNo && (
                          <RequiredRule message="Uninterpretable Result is required" />
                        )}
                      </Validator>
                    </SelectBox>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Error Code</div>
                    <TextBox
                      className="dx-field-value"
                      placeholder="Error Code"
                      value={error_code}
                      disabled={error || saving || !requiresErrorCode}
                      onValueChange={(text) => setErrorCode(text)}
                    >
                      <Validator>
                        {requiresErrorCode && (
                          <RequiredRule message="Error Code is required for an ERROR result" />
                        )}
                      </Validator>
                    </TextBox>
                  </div>
                </div>

                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">
                    Cycle Threshold (Ct) Values
                  </div>
                  {CT_VALUES.map((ct) => (
                    <div className="dx-field" key={ct.field}>
                      <div className="dx-field-label">{ct.label}</div>
                      <NumberBox
                        className="dx-field-value"
                        placeholder={ct.label}
                        min={0}
                        max={100}
                        value={cts[ct.field]}
                        disabled={error || saving || !interpretableYes}
                        onValueChange={(value) =>
                          setCts({ ...cts, [ct.field]: value })
                        }
                      >
                        <Validator>
                          {interpretableYes && (
                            <RequiredRule message={`${ct.label} is required`} />
                          )}
                        </Validator>
                      </NumberBox>
                    </div>
                  ))}
                </div>

                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">Comments</div>
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
                  <div className="dx-field-value">
                    <Button
                      width="100%"
                      type="normal"
                      disabled={loading || error || saving || pageConfig.Id == 0}
                      onClick={onSaveDraft}
                    >
                      <LoadIndicator
                        className="button-indicator"
                        visible={saving}
                      />
                      <span className="dx-button-text">Save Draft</span>
                    </Button>
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
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TBXpertXDRResultEdit;
