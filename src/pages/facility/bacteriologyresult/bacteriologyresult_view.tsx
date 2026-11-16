import { useState, useEffect, useRef } from "react";
import { Titlebar } from "../../../components/titlebar";
import { Card } from "../../../components/card";
import SubmissionInfo from "../../../components/SubmissionInfo";
import { Row } from "../../../components/row";
import { Col } from "../../../components/column";
import { LoadPanel } from "devextreme-react/load-panel";
import { useAuth } from "../../../context/AuthContext";
import PageConfig from "../../../classes/page-config";
import Assist from "../../../classes/assist";
import { useNavigate, useParams } from "react-router-dom";
import {
  AST_METHOD_DISK,
  AST_METHOD_MIC,
  AstTableView,
} from "../../../components/ast-table";

const FacilityBacteriologyResultView = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { eId } = useParams();

  const [detail, setDetail] = useState<null | any>(null);
  const [loading, setLoading] = useState(false);
  const hasRun = useRef(false);

  const pageConfig = new PageConfig(
    "Bacteriology Worksheet",
    "",
    "",
    "Bacteriology Result",
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

    if (pageConfig.Id != 0) {
      setLoading(true);
      setTimeout(() => {
        Assist.loadData(
          pageConfig.Title,
          `bacteriology-results/id/${pageConfig.Id}`,
        )
          .then((data: any) => {
            setLoading(false);
            setDetail(data.bacteriologyresult);
          })
          .catch((message) => {
            setLoading(false);
            Assist.showMessage(message, "error");
          });
      }, Assist.DEV_DELAY);
    }
  }, []);

  const field = (label: string, value: any) => (
    <div className="dx-field">
      <div className="dx-field-label">{label}</div>
      <div className="dx-field-value-static">
        <strong>{value}</strong>
      </div>
    </div>
  );

  const yesNo = (value: any) => (value ? "Yes" : "No");

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
        title={pageConfig.Title}
        section={"PT Results"}
        icon={"gear"}
        url="#"
      ></Titlebar>

      <Row>
        <Col sz={12} sm={12} lg={9}>
          <Card title="Worksheet" showHeader={true}>
            {detail != null && (
              <div className="form">
                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">Sample</div>
                  {field("Sample ID", detail.name)}
                  {field("Survey", detail.ptcycle.name)}
                  {field("Laboratory", detail.laboratory.name)}
                  {field("Scheme", detail.scheme.name)}
                  {field("Service", detail.service.name)}
                  {field("Method", detail.method.name)}
                </div>

                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">
                    Receipt of PT Samples
                  </div>
                  {field(
                    "Receipt Date of PT Samples",
                    Assist.formatDateLong(detail.date_samples_received),
                  )}
                  {field("Receipt Temperature (C)", detail.receipt_temperature)}
                  {field("Sample Condition", detail.sample_condition)}
                  {field("Reason", detail.sample_condition_reason)}
                  {field(
                    "Date Tested",
                    Assist.formatDateLong(detail.date_tested),
                  )}
                </div>

                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">
                    Microscopy (Gram Stain)
                  </div>
                  {field(
                    "Testing not done on this specimen/isolate",
                    yesNo(detail.testing_not_done),
                  )}
                  {detail.testing_not_done &&
                    field("Reason not done", detail.testing_not_done_reason)}
                  {field("Stain Reaction", detail.gram_stain_reaction)}
                  {field("Morphology", detail.gram_morphology)}
                  {detail.gram_morphology_other &&
                    field("Others (specify)", detail.gram_morphology_other)}
                  {field("Comment", detail.microscopy_comment)}
                </div>

                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">
                    Final Organism Identification
                  </div>
                  {field("Organism Identified", detail.organism_identified)}
                  {field("Comments", detail.identification_comment)}
                </div>

                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">
                    Antimicrobial Susceptibility Testing
                  </div>
                  {field("AST procedure carried out", yesNo(detail.ast_performed))}
                  {field("Applicable Guideline", detail.ast_guideline)}
                  {field(
                    "Disk Diffusion Method (Kirby Bauer)",
                    yesNo(detail.ast_disk_diffusion),
                  )}
                  {field("MIC Method", detail.ast_mic_method)}
                  {detail.ast_mic_method_other &&
                    field("Other method", detail.ast_mic_method_other)}
                </div>

                <AstTableView
                  title="Disk Diffusion Method (Kirby Bauer)"
                  method={AST_METHOD_DISK}
                  astresult={detail.astresult}
                />

                <AstTableView
                  title="MIC Method"
                  method={AST_METHOD_MIC}
                  astresult={detail.astresult}
                />

                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">Sign Off</div>
                  {field("Comments", detail.comments)}
                  {field("Reported By", detail.reported_by)}
                  {field(
                    "Date Reported",
                    Assist.formatDateLong(detail.reported_on),
                  )}
                  {field("Reviewed By", detail.reviewed_by)}
                  {field(
                    "Date Reviewed",
                    Assist.formatDateLong(detail.reviewed_on),
                  )}
                  {field("Status", detail.status.status_name)}
                </div>
              </div>
            )}
          </Card>
          <SubmissionInfo resultForm="bacteriology" resultId={eId} />
        </Col>
      </Row>
    </div>
  );
};

export default FacilityBacteriologyResultView;
