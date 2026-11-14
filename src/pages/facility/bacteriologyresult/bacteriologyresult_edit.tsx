import React, { useState, useEffect, useRef } from "react";
import { Titlebar } from "../../../components/titlebar";
import { Card } from "../../../components/card";
import { Row } from "../../../components/row";
import { Col } from "../../../components/column";
import SelectBox from "devextreme-react/select-box";
import { TextBox } from "devextreme-react/text-box";
import { CheckBox } from "devextreme-react/check-box";
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
import SampleReceipt from "../../../components/SampleReceipt";
import ResultFiles from "../../../components/ResultFiles";
import PanelProgress from "../../../components/PanelProgress";
import { LoadIndicator } from "devextreme-react/load-indicator";
import { useNavigate, useParams } from "react-router-dom";
import { confirm } from "devextreme/ui/dialog";
import {
  AST_METHOD_DISK,
  AST_METHOD_MIC,
  AstRow,
  AstTable,
  toAstPayload,
  toAstRows,
} from "../../../components/ast-table";

//worksheet TF-NHRTI-BACT-001. These are fetched from the API so the form can
//never offer a choice the server would reject; the lists here are only what is
//shown until that call comes back.
const SAMPLE_CONDITIONS = ["Suitable", "Unsuitable"];
const STAIN_REACTIONS = ["Gram positive", "Gram negative", "Gram variable"];
const MORPHOLOGIES = [
  "Cocci",
  "Diplococci",
  "Bacilli",
  "Yeast",
  "Cocco-bacilli",
  "Other",
];
const GUIDELINES = ["CLSI", "EUCAST"];
const MIC_METHODS = [
  "Broth Microdilution in house",
  "Etest",
  "Vitek 2",
  "MicroScan",
  "AutoMic",
  "Maldi Tof",
  "Other",
];
const INTERPRETATIONS = ["S", "I", "SDD", "R"];
const MORPHOLOGY_OTHER = "Other";
const MIC_METHOD_OTHER = "Other";

const BacteriologyResultEdit = () => {
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

  //worksheet header
  const [date_samples_received, setDateSamplesReceived] = useState<
    undefined | Date | string
  >(undefined);
  const [receipt_temperature, setReceiptTemperature] = useState<
    undefined | number
  >(undefined);
  const [sample_condition, setSampleCondition] = useState<undefined | string>(
    undefined,
  );
  const [sample_condition_reason, setSampleConditionReason] = useState<
    undefined | string
  >(undefined);
  const [date_submitted, setDateSubmitted] = useState<
    undefined | Date | string
  >(undefined);

  //the specimen could not be worked at all
  const [testing_not_done, setTestingNotDone] = useState<boolean>(false);
  const [testing_not_done_reason, setTestingNotDoneReason] = useState<
    undefined | string
  >(undefined);

  //microscopy
  const [gram_stain_reaction, setGramStainReaction] = useState<
    undefined | string
  >(undefined);
  const [gram_morphology, setGramMorphology] = useState<undefined | string>(
    undefined,
  );
  const [gram_morphology_other, setGramMorphologyOther] = useState<
    undefined | string
  >(undefined);
  const [microscopy_comment, setMicroscopyComment] = useState<
    undefined | string
  >(undefined);

  //identification
  const [organism_identified, setOrganismIdentified] = useState<
    undefined | string
  >(undefined);
  const [identification_comment, setIdentificationComment] = useState<
    undefined | string
  >(undefined);

  //antimicrobial susceptibility testing
  const [ast_performed, setAstPerformed] = useState<boolean>(false);
  const [ast_guideline, setAstGuideline] = useState<undefined | string>(
    undefined,
  );
  const [ast_disk_diffusion, setAstDiskDiffusion] = useState<boolean>(false);
  const [ast_mic_method, setAstMicMethod] = useState<undefined | string>(
    undefined,
  );
  const [ast_mic_method_other, setAstMicMethodOther] = useState<
    undefined | string
  >(undefined);
  const [diskRows, setDiskRows] = useState<AstRow[]>([]);
  const [micRows, setMicRows] = useState<AstRow[]>([]);

  //sign off
  const [comments, setComments] = useState<undefined | string>(undefined);
  const [reported_by, setReportedBy] = useState<undefined | string>(undefined);
  const [reported_on, setReportedOn] = useState<undefined | Date | string>(
    undefined,
  );
  const [reviewed_by, setReviewedBy] = useState<undefined | string>(undefined);
  const [reviewed_on, setReviewedOn] = useState<undefined | Date | string>(
    undefined,
  );

  //set up data sources for relationship fields
  const [scheme_data, setscheme_data] = useState<Array<any> | any>([]);
  const [laboratory_data, setlaboratory_data] = useState<Array<any> | any>([]);
  const [cycle_data, setcycle_data] = useState<Array<any> | any>([]);
  const [method_data, setmethod_data] = useState<Array<any> | any>([]);

  //the choices the worksheet offers, taken from the API
  const [options, setOptions] = useState<any>({
    sampleConditionList: SAMPLE_CONDITIONS,
    gramStainReactionList: STAIN_REACTIONS,
    gramMorphologyList: MORPHOLOGIES,
    astGuidelineList: GUIDELINES,
    astMicMethodList: MIC_METHODS,
    astInterpretationList: INTERPRETATIONS,
    antibioticList: [],
    astMaxRows: 15,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const hasRun = useRef(false);

  const pageConfig = new PageConfig(
    `Bacteriology Worksheet`,
    "",
    "",
    "Bacteriology Result",
    "",
    Assist.FACILITY_WRITE_ROLES,
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
      Assist.loadData(pageConfig.Title, `bacteriology-results/id/${pageConfig.Id}`)
        .then((data: any) => {
          setLoading(false);
          if (pageConfig.Id != 0) {
            updateVaues(data.bacteriologyresult);
          }
          setscheme_data(data.schemeList);
          setlaboratory_data(data.laboratoryList);
          setcycle_data(data.ptcycleList);
          setmethod_data(data.methodList);
          setError(false);
        })
        .catch((message) => {
          setLoading(false);
          setError(true);
          Assist.showMessage(message, "error");
        });

      //the worksheet's own choices, so the form offers exactly what the
      //server will accept
      Assist.loadData(`${pageConfig.Title} Options`, `bacteriology-results/options`)
        .then((data: any) => setOptions(data))
        .catch(() => {
          //the built in lists above still let the worksheet be filled in
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

    setDateSamplesReceived(data.date_samples_received ?? undefined);
    setReceiptTemperature(data.receipt_temperature ?? undefined);
    setSampleCondition(data.sample_condition);
    setSampleConditionReason(data.sample_condition_reason);
    setDateSubmitted(data.date_submitted ?? undefined);

    setTestingNotDone(data.testing_not_done ?? false);
    setTestingNotDoneReason(data.testing_not_done_reason);

    setGramStainReaction(data.gram_stain_reaction);
    setGramMorphology(data.gram_morphology);
    setGramMorphologyOther(data.gram_morphology_other);
    setMicroscopyComment(data.microscopy_comment);

    setOrganismIdentified(data.organism_identified);
    setIdentificationComment(data.identification_comment);

    setAstPerformed(data.ast_performed ?? false);
    setAstGuideline(data.ast_guideline);
    setAstDiskDiffusion(data.ast_disk_diffusion ?? false);
    setAstMicMethod(data.ast_mic_method);
    setAstMicMethodOther(data.ast_mic_method_other);
    setDiskRows(toAstRows(data.astresult, AST_METHOD_DISK));
    setMicRows(toAstRows(data.astresult, AST_METHOD_MIC));

    setComments(data.comments);
    setReportedBy(data.reported_by);
    setReportedOn(data.reported_on ?? undefined);
    setReviewedBy(data.reviewed_by);
    setReviewedOn(data.reviewed_on ?? undefined);
  };

  //a specimen that was not worked carries nothing else
  const worked = !testing_not_done;
  const wasUnsuitable = sample_condition === "Unsuitable";
  const morphologyIsOther = gram_morphology === MORPHOLOGY_OTHER;
  const micMethodIsOther = ast_mic_method === MIC_METHOD_OTHER;

  /** Ticking 'testing not done' empties the rest of the worksheet */
  const onTestingNotDoneChange = (value: boolean) => {
    setTestingNotDone(value);

    if (!value) {
      setTestingNotDoneReason(undefined);
      return;
    }

    setGramStainReaction(undefined);
    setGramMorphology(undefined);
    setGramMorphologyOther(undefined);
    setOrganismIdentified(undefined);
    setAstPerformed(false);
    setAstGuideline(undefined);
    setAstDiskDiffusion(false);
    setAstMicMethod(undefined);
    setAstMicMethodOther(undefined);
    setDiskRows([]);
    setMicRows([]);
  };

  const onMorphologyChange = (value: string | undefined) => {
    setGramMorphology(value);
    if (value !== MORPHOLOGY_OTHER) setGramMorphologyOther(undefined);
  };

  const onMicMethodChange = (value: string | undefined) => {
    setAstMicMethod(value);
    if (value !== MIC_METHOD_OTHER) setAstMicMethodOther(undefined);
    if (!value) setMicRows([]);
  };

  const onAstPerformedChange = (value: boolean) => {
    setAstPerformed(value);

    if (!value) {
      setAstGuideline(undefined);
      setAstDiskDiffusion(false);
      setAstMicMethod(undefined);
      setAstMicMethodOther(undefined);
      setDiskRows([]);
      setMicRows([]);
    }
  };

  const onDiskDiffusionChange = (value: boolean) => {
    setAstDiskDiffusion(value);
    if (!value) setDiskRows([]);
  };

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    confirm(
      "Are you sure you want to submit this Bacteriology Worksheet? You can submit again as many times as you need until the result submission due date, after which submission closes.",
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
      //worksheet header
      date_samples_received: asDate(date_samples_received),
      receipt_temperature: receipt_temperature ?? null,
      sample_condition: sample_condition,
      sample_condition_reason: wasUnsuitable ? sample_condition_reason : null,
      date_submitted: asDate(date_submitted),
      //the specimen
      testing_not_done: testing_not_done,
      testing_not_done_reason: testing_not_done
        ? testing_not_done_reason
        : null,
      //microscopy
      gram_stain_reaction: gram_stain_reaction,
      gram_morphology: gram_morphology,
      gram_morphology_other: morphologyIsOther ? gram_morphology_other : null,
      microscopy_comment: microscopy_comment,
      //identification
      organism_identified: organism_identified,
      identification_comment: identification_comment,
      //antimicrobial susceptibility testing
      ast_performed: ast_performed,
      ast_guideline: ast_guideline,
      ast_disk_diffusion: ast_disk_diffusion,
      ast_mic_method: ast_mic_method,
      ast_mic_method_other: micMethodIsOther ? ast_mic_method_other : null,
      astresult: toAstPayload(
        ast_disk_diffusion ? diskRows : [],
        ast_mic_method ? micRows : [],
      ),
      //sign off
      comments: comments,
      reported_by: reported_by,
      reported_on: asDate(reported_on),
      reviewed_by: reviewed_by,
      reviewed_on: asDate(reviewed_on),
      // approval
      status_id: statusId,
      stage_id: isDraft
        ? Assist.STAGE_AWAITING_SUBMISSION
        : Assist.STAGE_SUBMITTED,
      approval_levels: 1,
    };

    const url =
      pageConfig.Id == 0
        ? `bacteriology-results/create`
        : `bacteriology-results/update/${pageConfig.Id}`;

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

          Assist.loadData(
            "Panel progress",
            `result-navigation?result_form=bacteriology&result_id=${pageConfig.Id}`,
          )
            .then((nav: any) => {
              Assist.showMessage(
                `Saved. ${nav.entered} of ${nav.total} sample results entered.`,
                "success",
              );
              navigate(
                nav.next_pending_id
                  ? `/facility/bacteriology-results/edit/${nav.next_pending_id}`
                  : `/facility/bacteriology-results/list`,
              );
            })
            .catch(() => navigate(`/facility/bacteriology-results/list`));
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
        <Col sz={12} sm={12} lg={9}>
          <Card title="Properties" showHeader={true}>
            <form id="formMain" onSubmit={onFormSubmit}>
              {pageConfig.Id != 0 && (
                <PanelProgress
                  resultForm="bacteriology"
                  resultId={eId}
                  editBase="/facility/bacteriology-results/edit"
                />
              )}
              <SampleReceipt
                ptCycleId={cycle}
                labId={laboratory}
                methodSampleId={method_sample}
                userId={user.userid}
                disabled={error || saving}
              />
              <ResultFiles
                enrollmentId={enrollment}
                disabled={error || saving}
              />
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
                  {readOnlySelect("Scheme", scheme_data, scheme, setScheme)}
                  {readOnlySelect("Method", method_data, method, setMethod)}
                  {readOnlySelect(
                    "Laboratory",
                    laboratory_data,
                    laboratory,
                    setLaboratory,
                  )}
                  {readOnlySelect("Survey", cycle_data, cycle, setCycle)}
                </div>

                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">Receipt of PT Samples</div>
                  <div className="dx-field">
                    <div className="dx-field-label">
                      Receipt Date of PT Samples
                    </div>
                    <DateBox
                      className="dx-field-value"
                      placeholder="Receipt Date of PT Samples"
                      type="date"
                      displayFormat="dd MMM yyyy"
                      max={new Date()}
                      value={date_samples_received}
                      disabled={error || saving}
                      onValueChange={(value) => setDateSamplesReceived(value)}
                    >
                      <Validator>
                        <RequiredRule message="Receipt Date of PT Samples is required" />
                      </Validator>
                    </DateBox>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">
                      Receipt Temperature (&deg;C)
                    </div>
                    <NumberBox
                      className="dx-field-value"
                      placeholder="Temperature on arrival"
                      min={-30}
                      max={50}
                      format="#0.0"
                      value={receipt_temperature}
                      disabled={error || saving}
                      onValueChange={(value) => setReceiptTemperature(value)}
                    />
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Sample Condition</div>
                    <SelectBox
                      className="dx-field-value"
                      placeholder="Suitable or Unsuitable"
                      dataSource={options.sampleConditionList}
                      value={sample_condition}
                      disabled={error || saving}
                      onValueChange={(text) => setSampleCondition(text)}
                    >
                      <Validator>
                        <RequiredRule message="Sample Condition is required" />
                      </Validator>
                    </SelectBox>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Reason (if unsuitable)</div>
                    <TextArea
                      className="dx-field-value"
                      placeholder="Why the sample was unsuitable"
                      height={70}
                      value={sample_condition_reason}
                      disabled={error || saving || !wasUnsuitable}
                      onValueChange={(text) => setSampleConditionReason(text)}
                    >
                      <Validator>
                        {wasUnsuitable && (
                          <RequiredRule message="Please give the reason the sample was unsuitable" />
                        )}
                      </Validator>
                    </TextArea>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Date of Submission</div>
                    <DateBox
                      className="dx-field-value"
                      placeholder="Date of Submission"
                      type="date"
                      displayFormat="dd MMM yyyy"
                      value={date_submitted}
                      disabled={error || saving}
                      onValueChange={(value) => setDateSubmitted(value)}
                    />
                  </div>
                </div>

                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">
                    Microscopy (Gram Stain)
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">
                      Testing not done on this specimen/isolate
                    </div>
                    <div className="dx-field-value">
                      <CheckBox
                        value={testing_not_done}
                        disabled={error || saving}
                        onValueChange={onTestingNotDoneChange}
                      />
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Reason not done</div>
                    <TextArea
                      className="dx-field-value"
                      placeholder="Why this specimen or isolate could not be worked"
                      height={70}
                      value={testing_not_done_reason}
                      disabled={error || saving || worked}
                      onValueChange={(text) => setTestingNotDoneReason(text)}
                    >
                      <Validator>
                        {testing_not_done && (
                          <RequiredRule message="Please give the reason testing was not done" />
                        )}
                      </Validator>
                    </TextArea>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Stain Reaction</div>
                    <SelectBox
                      className="dx-field-value"
                      placeholder="Gram positive, negative or variable"
                      dataSource={options.gramStainReactionList}
                      value={gram_stain_reaction}
                      disabled={error || saving || !worked}
                      onValueChange={(text) => setGramStainReaction(text)}
                    >
                      <Validator>
                        {worked && (
                          <RequiredRule message="Stain Reaction is required" />
                        )}
                      </Validator>
                    </SelectBox>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Morphology</div>
                    <SelectBox
                      className="dx-field-value"
                      placeholder="Cocci, Bacilli, Yeast..."
                      dataSource={options.gramMorphologyList}
                      value={gram_morphology}
                      disabled={error || saving || !worked}
                      onValueChange={onMorphologyChange}
                    >
                      <Validator>
                        {worked && (
                          <RequiredRule message="Morphology is required" />
                        )}
                      </Validator>
                    </SelectBox>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Others (specify)</div>
                    <TextBox
                      className="dx-field-value"
                      placeholder="The morphology seen"
                      value={gram_morphology_other}
                      disabled={error || saving || !worked || !morphologyIsOther}
                      onValueChange={(text) => setGramMorphologyOther(text)}
                    >
                      <Validator>
                        {worked && morphologyIsOther && (
                          <RequiredRule message="Please write in the morphology seen" />
                        )}
                      </Validator>
                    </TextBox>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Comment</div>
                    <TextArea
                      className="dx-field-value"
                      placeholder="Comment"
                      height={70}
                      value={microscopy_comment}
                      disabled={error || saving || !worked}
                      onValueChange={(text) => setMicroscopyComment(text)}
                    />
                  </div>
                </div>

                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">
                    Final Organism Identification
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Organism Identified</div>
                    <TextBox
                      className="dx-field-value"
                      placeholder="e.g. Klebsiella pneumoniae"
                      value={organism_identified}
                      disabled={error || saving || !worked}
                      onValueChange={(text) => setOrganismIdentified(text)}
                    >
                      <Validator>
                        {worked && (
                          <RequiredRule message="Please indicate the organism identified" />
                        )}
                      </Validator>
                    </TextBox>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Comments</div>
                    <TextArea
                      className="dx-field-value"
                      placeholder="Comments"
                      height={70}
                      value={identification_comment}
                      disabled={error || saving || !worked}
                      onValueChange={(text) => setIdentificationComment(text)}
                    />
                  </div>
                </div>

                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">
                    Antimicrobial Susceptibility Testing
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">
                      AST procedure carried out
                    </div>
                    <div className="dx-field-value">
                      <CheckBox
                        value={ast_performed}
                        disabled={error || saving || !worked}
                        onValueChange={onAstPerformedChange}
                      />
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Applicable Guideline</div>
                    <SelectBox
                      className="dx-field-value"
                      placeholder="CLSI or EUCAST"
                      dataSource={options.astGuidelineList}
                      value={ast_guideline}
                      disabled={error || saving || !ast_performed}
                      onValueChange={(text) => setAstGuideline(text)}
                    >
                      <Validator>
                        {ast_performed && (
                          <RequiredRule message="Please insert the applicable guideline" />
                        )}
                      </Validator>
                    </SelectBox>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">
                      Disk Diffusion Method (Kirby Bauer)
                    </div>
                    <div className="dx-field-value">
                      <CheckBox
                        value={ast_disk_diffusion}
                        disabled={error || saving || !ast_performed}
                        onValueChange={onDiskDiffusionChange}
                      />
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">MIC Method</div>
                    <SelectBox
                      className="dx-field-value"
                      placeholder="Broth microdilution, Etest, Vitek 2..."
                      dataSource={options.astMicMethodList}
                      showClearButton={true}
                      value={ast_mic_method}
                      disabled={error || saving || !ast_performed}
                      onValueChange={onMicMethodChange}
                    />
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">
                      Other method (specify)
                    </div>
                    <TextBox
                      className="dx-field-value"
                      placeholder="The MIC method used"
                      value={ast_mic_method_other}
                      disabled={
                        error || saving || !ast_performed || !micMethodIsOther
                      }
                      onValueChange={(text) => setAstMicMethodOther(text)}
                    >
                      <Validator>
                        {ast_performed && micMethodIsOther && (
                          <RequiredRule message="Please specify the MIC method used" />
                        )}
                      </Validator>
                    </TextBox>
                  </div>
                </div>

                {ast_performed && ast_disk_diffusion && (
                  <AstTable
                    title="Disk Diffusion Method (Kirby Bauer)"
                    method={AST_METHOD_DISK}
                    rows={diskRows}
                    onChange={setDiskRows}
                    antibiotics={options.antibioticList ?? []}
                    interpretations={options.astInterpretationList ?? INTERPRETATIONS}
                    maxRows={options.astMaxRows ?? 15}
                    disabled={error || saving}
                  />
                )}

                {ast_performed && !!ast_mic_method && (
                  <AstTable
                    title="MIC Method"
                    method={AST_METHOD_MIC}
                    rows={micRows}
                    onChange={setMicRows}
                    antibiotics={options.antibioticList ?? []}
                    interpretations={options.astInterpretationList ?? INTERPRETATIONS}
                    maxRows={options.astMaxRows ?? 15}
                    disabled={error || saving}
                  />
                )}

                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">Sign Off</div>
                  <div className="dx-field">
                    <div className="dx-field-label">Comments</div>
                    <TextArea
                      className="dx-field-value"
                      placeholder="Comments"
                      height={70}
                      value={comments}
                      disabled={error || saving}
                      onValueChange={(text) => setComments(text)}
                    />
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Reported By</div>
                    <TextBox
                      className="dx-field-value"
                      placeholder="Reported By"
                      value={reported_by}
                      disabled={error || saving}
                      onValueChange={(text) => setReportedBy(text)}
                    />
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Date Reported</div>
                    <DateBox
                      className="dx-field-value"
                      placeholder="Date Reported"
                      type="date"
                      displayFormat="dd MMM yyyy"
                      value={reported_on}
                      disabled={error || saving}
                      onValueChange={(value) => setReportedOn(value)}
                    />
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Reviewed By</div>
                    <TextBox
                      className="dx-field-value"
                      placeholder="Reviewed By"
                      value={reviewed_by}
                      disabled={error || saving}
                      onValueChange={(text) => setReviewedBy(text)}
                    />
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Date Reviewed</div>
                    <DateBox
                      className="dx-field-value"
                      placeholder="Date Reviewed"
                      type="date"
                      displayFormat="dd MMM yyyy"
                      value={reviewed_on}
                      disabled={error || saving}
                      onValueChange={(value) => setReviewedOn(value)}
                    />
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Internal Notes</div>
                    <TextArea
                      className="dx-field-value"
                      placeholder="Internal notes kept against this worksheet"
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
                    <span className="dx-button-text">Submit Results</span>
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

export default BacteriologyResultEdit;
