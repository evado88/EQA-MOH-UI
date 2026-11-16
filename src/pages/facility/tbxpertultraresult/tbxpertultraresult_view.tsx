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

const FacilityTBXpertUltraResultView = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { eId } = useParams();

  const [detail, setDetail] = useState<null | any>(null);
  const [loading, setLoading] = useState(false);
  const hasRun = useRef(false);

  const pageConfig = new PageConfig(
    "TB Xpert Ultra Result",
    "",
    "",
    "TB Xpert Ultra Result",
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
          `tb-xpert-ultra-results/id/${pageConfig.Id}`,
        )
          .then((data: any) => {
            setLoading(false);
            setDetail(data.tbxpertultraresult);
          })
          .catch((message) => {
            setLoading(false);
            Assist.showMessage(message, "error");
          });
      }, Assist.DEV_DELAY);
    }
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
        title={pageConfig.Title}
        section={"PT Results"}
        icon={"gear"}
        url="#"
      ></Titlebar>

      <Row>
        <Col sz={12} sm={12} lg={7}>
          <Card title="Result" showHeader={true}>
            {detail != null && (
              <div className="form">
                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">Details</div>
                  <div className="dx-field">
                    <div className="dx-field-label">Name</div>
                    <div className="dx-field-value-static">
                      <strong>{detail.name}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Description</div>
                    <div className="dx-field-value-static">
                      {detail.description}
                    </div>
                  </div>
                </div>
                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">Scheme</div>
                  <div className="dx-field">
                    <div className="dx-field-label">Scheme</div>
                    <div className="dx-field-value-static">
                      <strong>{detail.scheme.name}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Service</div>
                    <div className="dx-field-value-static">
                      <strong>{detail.service.name}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Method</div>
                    <div className="dx-field-value-static">
                      <strong>{detail.method.name}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Method Sample</div>
                    <div className="dx-field-value-static">
                      <strong>{detail.methodsample.name}</strong>
                    </div>
                  </div>
                </div>
                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">Enrollment</div>
                  <div className="dx-field">
                    <div className="dx-field-label">Laboratory</div>
                    <div className="dx-field-value-static">
                      <strong>{detail.laboratory.name}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Enrollment</div>
                    <div className="dx-field-value-static">
                      <strong>{detail.enrollment.name}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Cycle</div>
                    <div className="dx-field-value-static">
                      <strong>{detail.ptcycle.name}</strong>
                    </div>
                  </div>
                </div>
                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">Results</div>
                  <div className="dx-field">
                    <div className="dx-field-label">Date Tested</div>
                    <div className="dx-field-value-static">
                      <strong>
                        {Assist.formatDateLong(detail.date_tested)}
                      </strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Result Interpretable</div>
                    <div className="dx-field-value-static">
                      <strong>{detail.result_interpretable}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">TB Detection Result</div>
                    <div className="dx-field-value-static">
                      <strong>{detail.tb_detection_result}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Rif Result</div>
                    <div className="dx-field-value-static">
                      <strong>{detail.rif_result}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Uninterpretable Result</div>
                    <div className="dx-field-value-static">
                      <strong>{detail.uninterpretable_result}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Error Code</div>
                    <div className="dx-field-value-static">
                      <strong>{detail.error_code}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Ultra SPC</div>
                    <div className="dx-field-value-static">
                      <strong>{detail.ultra_spc}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">IS1081-IS6110</div>
                    <div className="dx-field-value-static">
                      <strong>{detail.is1081_is6110}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">rpoB1</div>
                    <div className="dx-field-value-static">
                      <strong>{detail.rpob1}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">rpoB2</div>
                    <div className="dx-field-value-static">
                      <strong>{detail.rpob2}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">rpoB3</div>
                    <div className="dx-field-value-static">
                      <strong>{detail.rpob3}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">rpoB4</div>
                    <div className="dx-field-value-static">
                      <strong>{detail.rpob4}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Xpert Module Number</div>
                    <div className="dx-field-value-static">
                      <strong>{detail.xpert_module_number}</strong>
                    </div>
                  </div>
                </div>
                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">Submission</div>
                  <div className="dx-field">
                    <div className="dx-field-label">Username</div>
                    <div className="dx-field-value-static">
                      <strong>{detail.user.email}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">User</div>
                    <div className="dx-field-value-static">
                      <strong>
                        {detail.user.fname} {detail.user.lname}
                      </strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Status</div>
                    <div className="dx-field-value-static">
                      <strong>{detail.status.status_name}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Date</div>
                    <div className="dx-field-value-static">
                      <strong>{Assist.getDateText(detail.created_at)}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
          <SubmissionInfo resultForm="tb_xpert_ultra" resultId={eId} />
        </Col>
      </Row>
    </div>
  );
};

export default FacilityTBXpertUltraResultView;
