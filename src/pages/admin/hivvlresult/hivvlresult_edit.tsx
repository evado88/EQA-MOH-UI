import React, { useState, useEffect, useMemo, useRef } from "react";
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

// the platforms the form gives as examples; the lab may type its own
const DETECTION_ASSAYS = [
  "Abbott m2000",
  "Abbott Alinity m",
  "GeneXpert",
  "Hologic Panther",
  "Roche Cobas 4800",
  "Roche Cobas 6800",
];

const AdminHIVVLResultEdit = () => {
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
  const [assay_kit_lot_number, setAssayKitLotNumber] = useState<
    undefined | string
  >(undefined);
  const [assay_kit_expiry_date, setAssayKitExpiryDate] = useState<
    undefined | Date | string
  >(undefined);
  const [assay_serial_number, setAssaySerialNumber] = useState<
    undefined | string
  >(undefined);

  //result
  const [result_reported, setResultReported] = useState<undefined | string>(
    undefined,
  );
  const [viral_load_log10, setViralLoad] = useState<undefined | number>(
    undefined,
  );
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

  //service
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const hasRun = useRef(false);

  const pageConfig = new PageConfig(
    `HIV-1 Viral Load Result`,
    "",
    "",
    "HIV-1 Viral Load Result",
    "",
    Assist.ADMIN_ROLES,
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
      Assist.loadData(pageConfig.Title, `hiv-vl-results/id/${pageConfig.Id}`)
        .then((data: any) => {
          setLoading(false);
          if (pageConfig.Id != 0) {
            updateVaues(data.hivvlresult);
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

    //panel header
    setDatePanelReceived(data.date_panel_received ?? undefined);
    setDateTested(data.date_tested ?? undefined);
    setDetectionAssay(data.detection_assay);
    setExtractionAssay(data.extraction_assay);
    setAssayKitLotNumber(data.assay_kit_lot_number);
    setAssayKitExpiryDate(data.assay_kit_expiry_date ?? undefined);
    setAssaySerialNumber(data.assay_serial_number);

    //result
    setResultReported(data.result_reported);
    setViralLoad(data.viral_load_log10 ?? undefined);
    setNotTestedReason(data.not_tested_reason);

    //sign off
    setTestedBy(data.tested_by);
    setSupervisorName(data.supervisor_name);
  };

  const wasTested = result_reported === "Yes";
  const wasNotTested = result_reported === "No";

  //the kit was already out of date when the panel was run; the provider wants
  //this recorded rather than blocked, so it is a warning and not a rule
  const expiredKit = useMemo(() => {
    if (!assay_kit_expiry_date || !date_tested) return false;
    return new Date(assay_kit_expiry_date) < new Date(date_tested);
  }, [assay_kit_expiry_date, date_tested]);

  const onResultReportedChange = (value: string | undefined) => {
    setResultReported(value);

    if (value === "Yes") {
      setNotTestedReason(undefined);
    } else if (value === "No") {
      setViralLoad(undefined);
    } else {
      setNotTestedReason(undefined);
      setViralLoad(undefined);
    }
  };

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    confirm(
      "Are you sure you want to submit this HIV-1 Viral Load Result? You will not be able to change it afterwards.",
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

  const asDate = (value: any) =>
    value ? Assist.toMySQLFormat(new Date(value), false) : null;

  const submitResult = (statusId: number) => {
    setSaving(true);

    const isDraft = statusId == Assist.STATUS_DRAFT;

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
      //panel header
      date_panel_received: asDate(date_panel_received),
      date_tested: asDate(date_tested),
      detection_assay: detection_assay,
      extraction_assay: extraction_assay,
      assay_kit_lot_number: assay_kit_lot_number,
      assay_kit_expiry_date: asDate(assay_kit_expiry_date),
      assay_serial_number: assay_serial_number,
      //result
      result_reported: result_reported,
      viral_load_log10: viral_load_log10 ?? null,
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
        ? `hiv-vl-results/create`
        : `hiv-vl-results/update/${pageConfig.Id}`;

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
          navigate(`/admin/hiv-vl-results/list`);
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
                    <div className="dx-field-label">Sample ID</div>
                    <TextBox
                      className="dx-field-value"
                      placeholder="Sample ID"
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
                      placeholder="e.g. GeneXpert, Hologic Panther"
                      dataSource={DETECTION_ASSAYS}
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
                      dataSource={DETECTION_ASSAYS}
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
                    <div className="dx-field-label">Assay Kit Lot Number</div>
                    <TextBox
                      className="dx-field-value"
                      placeholder="Assay Kit Lot Number"
                      value={assay_kit_lot_number}
                      disabled={error || saving || !wasTested}
                      onValueChange={(text) => setAssayKitLotNumber(text)}
                    />
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">
                      Assay Kit Expiration Date
                    </div>
                    <DateBox
                      className="dx-field-value"
                      placeholder="Assay Kit Expiration Date"
                      type="date"
                      displayFormat="dd MMM yyyy"
                      value={assay_kit_expiry_date}
                      disabled={error || saving || !wasTested}
                      onValueChange={(value) => setAssayKitExpiryDate(value)}
                    />
                  </div>
                  {expiredKit && (
                    <div className="dx-field">
                      <div className="dx-field-label"></div>
                      <div className="dx-field-value-static">
                        <strong style={{ color: "#c0392b" }}>
                          This kit expired before the panel was tested. You can
                          still submit, but please note it in the comments.
                        </strong>
                      </div>
                    </div>
                  )}
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
                    <div className="dx-field-label">
                      Viral Load (log10 copies/ml)
                    </div>
                    <NumberBox
                      className="dx-field-value"
                      placeholder="e.g. 4.27"
                      min={0}
                      max={10}
                      format="#0.00"
                      value={viral_load_log10}
                      disabled={error || saving || !wasTested}
                      onValueChange={(value) => setViralLoad(value)}
                    >
                      <Validator>
                        {wasTested && (
                          <RequiredRule message="The Viral Load Result is required" />
                        )}
                      </Validator>
                    </NumberBox>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">
                      Reason Not Tested
                    </div>
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

export default AdminHIVVLResultEdit;
