import { useState, useEffect, useRef } from "react";
import { Titlebar } from "../../../components/titlebar";
import { Card } from "../../../components/card";
import { Row } from "../../../components/row";
import { Col } from "../../../components/column";
import { LoadPanel } from "devextreme-react/load-panel";
import { useAuth } from "../../../context/AuthContext";
import PageConfig from "../../../classes/page-config";
import Assist from "../../../classes/assist";
import { useNavigate, useParams } from "react-router-dom";

const FacilityHIVVLResultView = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { eId } = useParams();

  const [detail, setDetail] = useState<null | any>(null);
  const [loading, setLoading] = useState(false);
  const hasRun = useRef(false);

  const pageConfig = new PageConfig(
    "HIV-1 Viral Load Result",
    "",
    "",
    "HIV-1 Viral Load Result",
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
        Assist.loadData(pageConfig.Title, `hiv-vl-results/id/${pageConfig.Id}`)
          .then((data: any) => {
            setLoading(false);
            setDetail(data.hivvlresult);
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
                  <div className="dx-fieldset-header">Sample</div>
                  <div className="dx-field">
                    <div className="dx-field-label">Sample ID</div>
                    <div className="dx-field-value-static">
                      <strong>{detail.name}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Cycle</div>
                    <div className="dx-field-value-static">
                      <strong>{detail.ptcycle.name}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Laboratory</div>
                    <div className="dx-field-value-static">
                      <strong>{detail.laboratory.name}</strong>
                    </div>
                  </div>
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
                </div>

                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">Panel Details</div>
                  <div className="dx-field">
                    <div className="dx-field-label">Date PT Panel Received</div>
                    <div className="dx-field-value-static">
                      <strong>{Assist.formatDateLong(detail.date_panel_received)}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Date PT Panel Tested</div>
                    <div className="dx-field-value-static">
                      <strong>{Assist.formatDateLong(detail.date_tested)}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Detection Assay</div>
                    <div className="dx-field-value-static">
                      <strong>{detail.detection_assay}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Extraction Assay</div>
                    <div className="dx-field-value-static">
                      <strong>{detail.extraction_assay}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Assay Kit Lot Number</div>
                    <div className="dx-field-value-static">
                      <strong>{detail.assay_kit_lot_number}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Assay Serial Number</div>
                    <div className="dx-field-value-static">
                      <strong>{detail.assay_serial_number}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Assay Kit Expiration Date</div>
                    <div className="dx-field-value-static">
                      <strong>{Assist.formatDateLong(detail.assay_kit_expiry_date)}</strong>
                    </div>
                  </div>
                </div>

                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">Result</div>
                  <div className="dx-field">
                    <div className="dx-field-label">Result Reported</div>
                    <div className="dx-field-value-static">
                      <strong>{detail.result_reported}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Viral Load (log10 copies/ml)</div>
                    <div className="dx-field-value-static">
                      <strong>{detail.viral_load_log10}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Reason Not Tested</div>
                    <div className="dx-field-value-static">
                      <strong>{detail.not_tested_reason}</strong>
                    </div>
                  </div>
                </div>

                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">Sign Off</div>
                  <div className="dx-field">
                    <div className="dx-field-label">Tested By</div>
                    <div className="dx-field-value-static">
                      <strong>{detail.tested_by}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Name of Supervisor</div>
                    <div className="dx-field-value-static">
                      <strong>{detail.supervisor_name}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Comments</div>
                    <div className="dx-field-value-static">
                      <strong>{detail.description}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Status</div>
                    <div className="dx-field-value-static">
                      <strong>{detail.status.status_name}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Stage</div>
                    <div className="dx-field-value-static">
                      <strong>{detail.stage.stage_name}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Reviewer</div>
                    <div className="dx-field-value-static">
                      <strong>{detail.review1_by}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Review Comments</div>
                    <div className="dx-field-value-static">
                      <strong>{detail.review1_comments}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default FacilityHIVVLResultView;
