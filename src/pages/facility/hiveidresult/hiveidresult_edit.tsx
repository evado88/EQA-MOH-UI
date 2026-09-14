import React, { useState, useEffect, useRef } from "react";
import { Titlebar } from "../../../components/titlebar";
import { Card } from "../../../components/card";
import { Row } from "../../../components/row";
import { Col } from "../../../components/column";
import SelectBox from "devextreme-react/select-box";
import { TextBox } from "devextreme-react/text-box";
import { Validator, RequiredRule } from "devextreme-react/validator";
import TextArea from "devextreme-react/text-area";
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
import { confirm } from "devextreme/ui/dialog";

//the form names these as examples; the lab may type its own
const ASSAYS = [
  "Cobas 4800",
  "Cobas 6800",
  "GeneXpert",
  "Hologic Panther",
  "Abbott m2000",
];

//TF-012 asks for the exact phrase, so these are not free text
const HIV_RESULTS = ["HIV-1 Detected", "HIV-1 Not Detected"];

const HIVEIDResultEdit = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { eId } = useParams();

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

  //panel header
  const [date_panel_received, setDatePanelReceived] = useState<
    undefined | Date | string
  >(undefined);
  const [date_tested, setDateTested] = useState<undefined | Date | string>(
    undefined,
  );
  const [detection_assay, setDetectionAssay] = useState<undefined | string>(
    undefined,
  );
  const [extraction_assay, setExtractionAssay] = useState<undefined | string>(
    undefined,
  );
  const [assay_serial_number, setAssaySerialNumber] = useState<
    undefined | string
  >(undefined);

  //result
  const [result_reported, setResultReported] = useState<undefined | string>(
    undefined,
  );
  const [hiv_result, setHivResult] = useState<undefined | string>(undefined);
  const [hiv_ct_od_value, setHivCtOd] = useState<undefined | number>(undefined);
  const [ic_qs_value, setIcQs] = useState<undefined | number>(undefined);
  const [not_tested_reason, setNotTestedReason] = useState<undefined | string>(
    undefined,
  );

  //sign off
  const [tested_by, setTestedBy] = useState<undefined | string>(undefined);
  const [supervisor_name, setSupervisorName] = useState<undefined | string>(
    undefined,
  );

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

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const hasRun = useRef(false);

  const pageConfig = new PageConfig(
    `HIV-1 EID Result`,
    "",
    "",
    "HIV-1 EID Result",
    "",
    Assist.LABORATORY_ROLES,
  );

  pageConfig.Id = eId == undefined ? 0 : Number(eId);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    if (!Assist.checkPageAuditPermission(pageConfig, user)) {
      Assist.redirectUnauthorized(navigate);
      return;
    }

    setLoading(true);

    setTimeout(() => {
      Assist.loadData(pageConfig.Title, `hiv-eid-results/id/${pageConfig.Id}`)
        .then((data: any) => {
          setLoading(false);
          if (pageConfig.Id != 0) {
            updateVaues(data.hiveidresult);
          }
          setscheme_data(data.schemeList);
          setlaboratory_data(data.laboratoryList);
          setservice_data(data.serviceList);
          setenrollment_data(data.enrollmentList);
          setcycle_data(data.ptcycleList);
          setmethod_data(data.methodList);
          setmethod_sample_data(data.methodsampleList);
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
    setName(data.name);
    setDescription(data.description);

    setScheme(data.scheme_id);
    setLaboratory(data.lab_id);
    setService(data.service_id);
    setEnrollment(data.enrollment_id);
    setCycle(data.pt_cycle_id);
    setMethod(data.method_id);
    setMethodSample(data.method_sample_id);

    setDatePanelReceived(data.date_panel_received ?? undefined);
    setDateTested(data.date_tested ?? undefined);
    setDetectionAssay(data.detection_assay);
    setExtractionAssay(data.extraction_assay);
    setAssaySerialNumber(data.assay_serial_number);

    setResultReported(data.result_reported);
    setHivResult(data.hiv_result);
    setHivCtOd(data.hiv_ct_od_value ?? undefined);
    setIcQs(data.ic_qs_value ?? undefined);
    setNotTestedReason(data.not_tested_reason);

    setTestedBy(data.tested_by);
    setSupervisorName(data.supervisor_name);
  };

  const wasTested = result_reported === "Yes";
  const wasNotTested = result_reported === "No";

  const onResultReportedChange = (value: string | undefined) => {
    setResultReported(value);

    if (value === "Yes") {
      setNotTestedReason(undefined);
    } else if (value === "No") {
      setHivResult(undefined);
      setHivCtOd(undefined);
      setIcQs(undefined);
    } else {
      setNotTestedReason(undefined);
      setHivResult(undefined);
      setHivCtOd(undefined);
      setIcQs(undefined);
    }
  };

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    confirm(
      "Are you sure you want to submit this HIV-1 EID Result? You will not be able to change it afterwards.",
      "Confirm submission",
    ).then((dialogResult) => {
      if (dialogResult) submitResult(Assist.STATUS_SUBMITTED);
    });
  };

  const onSaveDraft = () => submitResult(Assist.STATUS_DRAFT);

  const asDate = (value: any) =>
    value ? Assist.toMySQLFormat(new Date(value), false) : null;

  const submitResult = (statusId: number) => {
    setSaving(true);

    const isDraft = statusId == Assist.STATUS_DRAFT;

    const postData = {
      user_id: user.userid,
      name: name,
      description: description,
      scheme_id: scheme,
      lab_id: laboratory,
      service_id: service,
      enrollment_id: enrollment,
      pt_cycle_id: cycle,
      method_id: method,
      method_sample_id: method_sample,
      //panel header
      date_panel_received: asDate(date_panel_received),
      date_tested: asDate(date_tested),
      detection_assay: detection_assay,
      extraction_assay: extraction_assay,
      assay_serial_number: assay_serial_number,
      //result
      result_reported: result_reported,
      hiv_result: hiv_result,
      hiv_ct_od_value: hiv_ct_od_value ?? null,
      ic_qs_value: ic_qs_value ?? null,
      not_tested_reason: not_tested_reason,
      //sign off
      tested_by: tested_by,
      supervisor_name: supervisor_name,
      // approval
      status_id: statusId,
      stage_id: isDraft
        ? Assist.STAGE_AWAITING_SUBMISSION
        : Assist.STAGE_SUBMITTED,
      approval_levels: 1,
    };

    const url =
      pageConfig.Id == 0
        ? `hiv-eid-results/create`
        : `hiv-eid-results/update/${pageConfig.Id}`;

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
          navigate(`/facility/hiv-eid-results/list`);
        })
        .catch((message) => {
          setSaving(false);
          Assist.showMessage(message, "error");
        });
    }, Assist.DEV_DELAY);
  };

  const readOnlySelect = (
    label: string,
    data: any,
    value: any,
    onChange: any,
  ) => (
    <div className="dx-field">
      <div className="dx-field-label">{label}</div>
      <SelectBox
        className="dx-field-value"
        placeholder={label}
        dataSource={data}
        displayExpr={"name"}
        valueExpr={"id"}
        readOnly={true}
        deferRendering={false}
        value={value}
        disabled={error || saving}
        onValueChange={onChange}
      />
    </div>
  );

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
                  <div className="dx-fieldset-header">Sample</div>
                  <div className="dx-field">
                    <div className="dx-field-label">Sample or Control ID</div>
                    <TextBox
                      className="dx-field-value"
                      placeholder="Sample or Control ID"
                      value={name}
                      readOnly={true}
                      disabled={error || saving}
                      onValueChange={(text) => setName(text)}
                    >
                      <Validator>
                        <RequiredRule message="Sample ID is required" />
                      </Validator>
                    </TextBox>
                  </div>
                  {readOnlySelect("Scheme", scheme_data, scheme, setScheme)}
                  {readOnlySelect("Method", method_data, method, setMethod)}
                  {readOnlySelect(
                    "Laboratory",
                    laboratory_data,
                    laboratory,
                    setLaboratory,
                  )}
                  {readOnlySelect("Cycle", cycle_data, cycle, setCycle)}
                </div>

                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">Panel Details</div>
                  <div className="dx-field">
                    <div className="dx-field-label">Date PT Panel Received</div>
                    <DateBox
                      className="dx-field-value"
                      placeholder="Date PT Panel Received"
                      type="date"
                      displayFormat="dd MMM yyyy"
                      max={new Date()}
                      value={date_panel_received}
                      disabled={error || saving}
                      onValueChange={(value) => setDatePanelReceived(value)}
                    >
                      <Validator>
                        <RequiredRule message="Date PT Panel Received is required" />
                      </Validator>
                    </DateBox>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Date PT Panel Tested</div>
                    <DateBox
                      className="dx-field-value"
                      placeholder="Date PT Panel Tested"
                      type="date"
                      displayFormat="dd MMM yyyy"
                      max={new Date()}
                      value={date_tested}
                      disabled={error || saving || !wasTested}
                      onValueChange={(value) => setDateTested(value)}
                    >
                      <Validator>
                        {wasTested && (
                          <RequiredRule message="Date PT Panel Tested is required" />
                        )}
                      </Validator>
                    </DateBox>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Detection Assay</div>
                    <SelectBox
                      className="dx-field-value"
                      placeholder="e.g. Cobas 4800, GeneXpert"
                      dataSource={ASSAYS}
                      acceptCustomValue={true}
                      value={detection_assay}
                      disabled={error || saving || !wasTested}
                      onValueChange={(text) => setDetectionAssay(text)}
                      onCustomItemCreating={(e: any) => {
                        e.customItem = e.text;
                      }}
                    >
                      <Validator>
                        {wasTested && (
                          <RequiredRule message="Detection Assay is required" />
                        )}
                      </Validator>
                    </SelectBox>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Extraction Assay</div>
                    <SelectBox
                      className="dx-field-value"
                      placeholder="e.g. Cobas 4800, Hologic Panther"
                      dataSource={ASSAYS}
                      acceptCustomValue={true}
                      value={extraction_assay}
                      disabled={error || saving || !wasTested}
                      onValueChange={(text) => setExtractionAssay(text)}
                      onCustomItemCreating={(e: any) => {
                        e.customItem = e.text;
                      }}
                    >
                      <Validator>
                        {wasTested && (
                          <RequiredRule message="Extraction Assay is required" />
                        )}
                      </Validator>
                    </SelectBox>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Assay Serial Number</div>
                    <TextBox
                      className="dx-field-value"
                      placeholder="Assay Serial Number"
                      value={assay_serial_number}
                      disabled={error || saving || !wasTested}
                      onValueChange={(text) => setAssaySerialNumber(text)}
                    />
                  </div>
                </div>

                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">Result</div>
                  <div className="dx-field">
                    <div className="dx-field-label">Result Reported</div>
                    <SelectBox
                      className="dx-field-value"
                      placeholder="Was this sample tested?"
                      dataSource={["Yes", "No"]}
                      value={result_reported}
                      disabled={error || saving}
                      onValueChange={onResultReportedChange}
                    >
                      <Validator>
                        <RequiredRule message="Please indicate whether a result was reported" />
                      </Validator>
                    </SelectBox>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Your Result</div>
                    <SelectBox
                      className="dx-field-value"
                      placeholder="HIV-1 Detected or HIV-1 Not Detected"
                      dataSource={HIV_RESULTS}
                      value={hiv_result}
                      disabled={error || saving || !wasTested}
                      onValueChange={(text) => setHivResult(text)}
                    >
                      <Validator>
                        {wasTested && (
                          <RequiredRule message="Your Result is required" />
                        )}
                      </Validator>
                    </SelectBox>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">
                      HIV CT/OD Value (optional)
                    </div>
                    <NumberBox
                      className="dx-field-value"
                      placeholder="Optional"
                      min={0}
                      max={100}
                      format="#0.00"
                      value={hiv_ct_od_value}
                      disabled={error || saving || !wasTested}
                      onValueChange={(value) => setHivCtOd(value)}
                    />
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">
                      IC/QS Value (optional)
                    </div>
                    <NumberBox
                      className="dx-field-value"
                      placeholder="Optional"
                      min={0}
                      max={100}
                      format="#0.00"
                      value={ic_qs_value}
                      disabled={error || saving || !wasTested}
                      onValueChange={(value) => setIcQs(value)}
                    />
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Reason Not Tested</div>
                    <TextArea
                      className="dx-field-value"
                      placeholder="Reason this sample could not be tested"
                      height={70}
                      value={not_tested_reason}
                      disabled={error || saving || !wasNotTested}
                      onValueChange={(text) => setNotTestedReason(text)}
                    >
                      <Validator>
                        {wasNotTested && (
                          <RequiredRule message="Please give the reason the sample could not be tested" />
                        )}
                      </Validator>
                    </TextArea>
                  </div>
                </div>

                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">Sign Off</div>
                  <div className="dx-field">
                    <div className="dx-field-label">Tested By</div>
                    <TextBox
                      className="dx-field-value"
                      placeholder="Tested By"
                      value={tested_by}
                      disabled={error || saving}
                      onValueChange={(text) => setTestedBy(text)}
                    />
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Name of Supervisor</div>
                    <TextBox
                      className="dx-field-value"
                      placeholder="Name of Supervisor"
                      value={supervisor_name}
                      disabled={error || saving}
                      onValueChange={(text) => setSupervisorName(text)}
                    />
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Comments</div>
                    <TextArea
                      className="dx-field-value"
                      placeholder="Comments"
                      height={70}
                      value={description}
                      disabled={error || saving}
                      onValueChange={(text) => setDescription(text)}
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

export default HIVEIDResultEdit;
