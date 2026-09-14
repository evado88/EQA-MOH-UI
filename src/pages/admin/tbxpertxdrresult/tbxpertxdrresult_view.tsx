import { useState, useEffect, useRef } from "react";
import { Titlebar } from "../../../components/titlebar";
import { Card } from "../../../components/card";
import { Row } from "../../../components/row";
import { Col } from "../../../components/column";
import { LoadPanel } from "devextreme-react/load-panel";
import TextArea from "devextreme-react/text-area";
import Button from "devextreme-react/button";
import { LoadIndicator } from "devextreme-react/load-indicator";
import { confirm } from "devextreme/ui/dialog";
import { useAuth } from "../../../context/AuthContext";
import PageConfig from "../../../classes/page-config";
import Assist from "../../../classes/assist";
import { useNavigate, useParams } from "react-router-dom";

const AdminTBXpertXDRResultView = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { eId } = useParams();

  const [detail, setDetail] = useState<null | any>(null);
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState("");
  const [saving, setSaving] = useState(false);
  const hasRun = useRef(false);

  const pageConfig = new PageConfig(
    "TB Xpert XDR Result",
    "",
    "",
    "TB Xpert XDR Result",
    "",
    Assist.ADMIN_ROLES,
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
          `tb-xpert-xdr-results/id/${pageConfig.Id}`,
        )
          .then((data: any) => {
            setLoading(false);
            setDetail(data.tbxpertxdrresult);
          })
          .catch((message) => {
            setLoading(false);
            Assist.showMessage(message, "error");
          });
      }, Assist.DEV_DELAY);
    }
  }, []);

  const review = (action: number, verb: string) => {
    confirm(
      `Are you sure you want to mark this result ${verb}?`,
      "Confirm changes",
    ).then((dialogResult) => {
      if (!dialogResult) return;

      setSaving(true);
      Assist.postPutData(
        pageConfig.Title,
        `tb-xpert-xdr-results/review-update/${eId}`,
        { user_id: user.userid, review_action: action, comments: comments },
        1,
      )
        .then(() => {
          setSaving(false);
          Assist.showMessage(`You have ${verb} the result.`, "success");
          navigate(`/admin/tb-xpert-xdr-results/list`);
        })
        .catch((message) => {
          setSaving(false);
          Assist.showMessage(message, "error");
        });
    });
  };

  //only a submitted result is waiting on the provider
  const requiresApproval = () =>
    detail != null && detail.status.status_name === "Submitted";

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
                  <div className="dx-fieldset-header">Panel</div>
                  <div className="dx-field">
                    <div className="dx-field-label">Name</div>
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
                  <div className="dx-field">
                    <div className="dx-field-label">Method Sample</div>
                    <div className="dx-field-value-static">
                      <strong>{detail.methodsample.name}</strong>
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
                </div>

                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">Drug Resistance</div>
                  <div className="dx-field">
                    <div className="dx-field-label">INH Result</div>
                    <div className="dx-field-value-static">
                      <strong>{detail.inh_result}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">FLQ Result</div>
                    <div className="dx-field-value-static">
                      <strong>{detail.flq_result}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">AMK Result</div>
                    <div className="dx-field-value-static">
                      <strong>{detail.amk_result}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">ETH Result</div>
                    <div className="dx-field-value-static">
                      <strong>{detail.eth_result}</strong>
                    </div>
                  </div>
                </div>

                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">
                    Uninterpretable Result
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
                </div>

                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">
                    Cycle Threshold (Ct) Values
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">SPC-ahpC</div>
                    <div className="dx-field-value-static">
                      <strong>{detail.spc_ahpc}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">inhA</div>
                    <div className="dx-field-value-static">
                      <strong>{detail.inha}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">KatG</div>
                    <div className="dx-field-value-static">
                      <strong>{detail.katg}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">fabG1</div>
                    <div className="dx-field-value-static">
                      <strong>{detail.fabg1}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">gyrA1</div>
                    <div className="dx-field-value-static">
                      <strong>{detail.gyra1}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">gyrA2</div>
                    <div className="dx-field-value-static">
                      <strong>{detail.gyra2}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">gyrA3</div>
                    <div className="dx-field-value-static">
                      <strong>{detail.gyra3}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">gyrB2</div>
                    <div className="dx-field-value-static">
                      <strong>{detail.gyrb2}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">rrs</div>
                    <div className="dx-field-value-static">
                      <strong>{detail.rrs}</strong>
                    </div>
                  </div>
                </div>

                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">Submission</div>
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
        <Col sz={12} sm={12} lg={5}>
          {requiresApproval() && (
            <Card title="Grading" showHeader={true}>
              <div className="form">
                <div className="dx-fieldset">
                  <div className="dx-field">
                    <div className="dx-field-label">Comments</div>
                    <TextArea
                      className="dx-field-value"
                      placeholder="Comments"
                      height={80}
                      value={comments}
                      disabled={saving}
                      onValueChange={(value) => setComments(value)}
                    ></TextArea>
                  </div>
                </div>
                <div className="dx-field">
                  <div className="dx-field-label"></div>
                  <Button
                    width="100%"
                    type={saving ? "normal" : "success"}
                    disabled={loading || saving}
                    onClick={() =>
                      review(Assist.REVIEW_ACTION_APPROVE, "approved")
                    }
                  >
                    <LoadIndicator
                      className="button-indicator"
                      visible={saving}
                    />
                    <span className="dx-button-text">Approve Result</span>
                  </Button>
                </div>
                <div className="dx-field">
                  <div className="dx-field-label"></div>
                  <Button
                    width="100%"
                    type={saving ? "normal" : "danger"}
                    disabled={loading || saving}
                    onClick={() =>
                      review(Assist.REVIEW_ACTION_REJECT, "rejected")
                    }
                  >
                    <LoadIndicator
                      className="button-indicator"
                      visible={saving}
                    />
                    <span className="dx-button-text">Reject Result</span>
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default AdminTBXpertXDRResultView;
