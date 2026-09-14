import { useState, useEffect, useRef } from "react";
import { Titlebar } from "../../../components/titlebar";
import { Card } from "../../../components/card";
import { Row } from "../../../components/row";
import { Col } from "../../../components/column";
import { Validator, RequiredRule } from "devextreme-react/validator";
import Button from "devextreme-react/button";
import { LoadPanel } from "devextreme-react/load-panel";
import { useAuth } from "../../../context/AuthContext";
import PageConfig from "../../../classes/page-config";
import Assist from "../../../classes/assist";
import { LoadIndicator } from "devextreme-react/load-indicator";
import { useNavigate, useParams } from "react-router-dom";
import HtmlEditor, { MediaResizing } from "devextreme-react/html-editor";
import AppInfo from "../../../classes/app-info";
import DataGrid, { Column, Pager, Paging } from "devextreme-react/data-grid";
import { confirm } from "devextreme/ui/dialog";
import TextArea from "devextreme-react/text-area";
import ValidationSummary from "devextreme-react/validation-summary";

const AdminMethods = () => {
  //user
  const navigate = useNavigate();
  const { user } = useAuth();
  const { eId } = useParams(); // Destructure the parameter directly

  //posting
  const [methodsDetail, setmethodsDetail] = useState<null | any>(null);

  //service
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const [stage, setStage] = useState("");
  const [stageId, setStageId] = useState(1);
  const [status, setStatus] = useState(null);
  const [createdBy, setCreatedBy] = useState("");
  const [approvalLevels, setApprovalLevels] = useState(1);

  const [rejectionReason, setRejectionReason] = useState("");
  const [approvalComments, setApprovalComments] = useState("");
  const hasRun = useRef(false);

  const pageConfig = new PageConfig(
    `${status == "Approved" ? "View" : "Review"} Method`,
    "",
    "",
    "Method",
    `methods/review-update/${eId}`,
    [Assist.ROLE_ADMIN],
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

    //only load if viewing the item
    if (pageConfig.Id != 0) {
      setLoading(true);
      setTimeout(() => {
        Assist.loadData(pageConfig.Title, `methods/id/${pageConfig.Id}`)
          .then((data) => {
            setLoading(false);
            updateVaues(data);
            setError(false);
          })
          .catch((message) => {
            setLoading(false);
            setError(true);
            Assist.showMessage(message, "error");
          });
      }, Assist.DEV_DELAY);
    }
  }, []);

  const updateVaues = (res: any) => {
    setmethodsDetail(res.methods);
    // approval
    setStatus(res.methods.status.status_name);
    setStage(res.methods.stage.stage_name);
    setStageId(res.methods.stage_id);
    setApprovalLevels(res.methods.approval_levels);

    setCreatedBy(res.methods.user.email);
  };

  const isReviewed = () => {
    return status == "Approved" || status == "Rejected";
  };

  const requiresApproval = () => {
    if (status == "Submitted") {
      if (
        stage == "Submitted" ||
        stage == "Primary Approval" ||
        stage == "Secondary Approval"
      ) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  };

  const onFormApproveSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    //simulate process
    let result = confirm(
      `Are you sure you want to approve this ${pageConfig.Single}?`,
      "Confirm changes",
    );

    result.then((dialogResult) => {
      if (dialogResult) {
        submitPostingReview(
          Assist.REVIEW_ACTION_APPROVE,
          approvalComments,
          "approved",
        );
      }
    });

    return;
  };
  const onFormRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    //simulate process

    let result = confirm(
      `Are you sure you want to reject this ${pageConfig.Single}?`,
      "Confirm changes",
    );
    result.then((dialogResult) => {
      if (dialogResult) {
        submitPostingReview(
          Assist.REVIEW_ACTION_REJECT,
          rejectionReason,
          "rejected",
        );
      }
    });
  };

  const submitPostingReview = (
    action: number,
    reviewComments: string,
    verb: string,
  ) => {
    setSaving(true);

    const postData = {
      user_id: user.userid,
      review_action: action,
      comments: reviewComments,
    };

    setTimeout(() => {
      Assist.postPutData(pageConfig.Title, pageConfig.UpdateUrl, postData, 1)
        .then((data) => {
          setSaving(false);

          Assist.showMessage(
            `You have successfully ${verb} the ${pageConfig.Single}!`,
            "success",
          );

          navigate(`/admin/methods/list`);
        })
        .catch((message) => {
          setSaving(false);
          console.log(message);

          Assist.showMessage(message, "error");
        });
    }, Assist.DEV_DELAY);
  };

  const unsubmitButton = () => {
    if (
      stage == "Submitted" &&
      status == "Submitted" &&
      createdBy == user.sub
    ) {
      return (
        <div className="dx-field">
          <div className="dx-field-label"></div>
          <div className="dx-field-value">
            <Button
              width="100%"
              type={saving ? "normal" : "default"}
              disabled={loading || error || saving}
              onClick={() => onFormUnsubmit()}
            >
              <LoadIndicator className="button-indicator" visible={saving} />
              <span className="dx-button-text">Unsubmit</span>
            </Button>
          </div>
        </div>
      );
    } else {
      return null;
    }
  };

  const onFormUnsubmit = () => {
    let result = confirm(
      `Are you sure you want to unsubmit this ${pageConfig.Single}?`,
      "Confirm submission",
    );
    result.then((dialogResult) => {
      if (dialogResult) {
        unsubmitPosting();
      }
    });
  };
  const unsubmitPosting = () => {
    setSaving(true);

    const newData = {
      status_id: Assist.STATUS_DRAFT,
      stage_id: Assist.STAGE_AWAITING_SUBMISSION,
    };
    const postData = { ...methodsDetail, ...newData };

    setTimeout(() => {
      Assist.postPutData(
        pageConfig.Title,
        `methods/update/${eId}`,
        postData,
        1,
      )
        .then((data) => {
          setSaving(false);

          Assist.showMessage(
            `You have successfully unsubmitted the ${pageConfig.Single}!`,
            "success",
          );

          navigate(`/admin/methods/list`);
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
        title={`${pageConfig.Title}`}
        section={"Configuration"}
        icon={"gear"}
        url="#"
      ></Titlebar>
      {/* end widget */}

      {/* chart start */}
      <Row>
        <Col sz={12} sm={12} lg={7}>
         <Card title="Properties" showHeader={true}>
          {methodsDetail != null && <div className="form">
          <div className="dx-fieldset">
            <div className="dx-fieldset-header">Details</div>
            <div className="dx-field">
              <div className="dx-field-label">Name</div>
              <div className="dx-field-value-static">
                <strong>{methodsDetail.name}</strong>
              </div>
            </div>
            <div className="dx-field">
              <div className="dx-field-label">Description</div>
              <div className="dx-field-value-static">
           {methodsDetail.description}
              </div>
            </div>
          </div>
          <div className="dx-fieldset">
          <div className="dx-fieldset-header">Submission</div>
          <div className="dx-field">
            <div className="dx-field-label">Username</div>
            <div className="dx-field-value-static">
              <strong>
              <strong>{methodsDetail.user.email}</strong>
              </strong>
            </div>
          </div>
          <div className="dx-field">
            <div className="dx-field-label">User</div>
            <div className="dx-field-value-static">
              <strong>
              <strong>{methodsDetail.user.fname} {methodsDetail.user.lname}</strong>
              </strong>
            </div>
          </div>
          <div className="dx-field">
            <div className="dx-field-label">Status</div>
            <div className="dx-field-value-static">
              <strong>{methodsDetail.status.status_name}</strong>
            </div>
          </div>
          <div className="dx-field">
            <div className="dx-field-label">Approval Levels</div>
            <div className="dx-field-value-static">
              <strong>{methodsDetail.approval_levels}</strong>
            </div>
          </div>
          <div className="dx-field">
            <div className="dx-field-label">Stage</div>
            <div className="dx-field-value-static">
              <strong>{methodsDetail.stage.stage_name}</strong>
            </div>
          </div>
          <div className="dx-field">
            <div className="dx-field-label">Date</div>
            <div className="dx-field-value-static">
              <strong>{Assist.getDateText(methodsDetail.created_at)}</strong>
            </div>
          </div>
          {unsubmitButton()}
        </div>
          </div>}
        </Card>
        </Col>
        <Col sz={12} sm={12} lg={5}>
          {requiresApproval() && (
            <Card title="Rejection" showHeader={true}>
              <div className="form">
                <form id="formMain" onSubmit={onFormRejectSubmit}>
                  <div className="dx-fieldset">
                    <div className="dx-fieldset-header">Submission</div>
                    <div className="dx-field">
                      <div className="dx-field-label">Rejection Reason</div>
                      <TextArea
                        className="dx-field-value"
                        placeholder="Rejection Reason"
                        disabled={error || saving || saving}
                        height={80}
                        value={rejectionReason}
                        onValueChange={(value) => setRejectionReason(value)}
                      >
                        <Validator validationGroup="Reject">
                          <RequiredRule message="Rejection reason required" />
                        </Validator>
                      </TextArea>
                    </div>
                  </div>
                  <div className="dx-field">
                    <ValidationSummary
                      id="summaryReject"
                      validationGroup="Reject"
                    />
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label"></div>
                    <Button
                      width="100%"
                      useSubmitBehavior={true}
                      validationGroup="Reject"
                      type={saving ? "normal" : "danger"}
                      disabled={loading || error || saving}
                    >
                      <LoadIndicator
                        className="button-indicator"
                        visible={saving}
                      />
                      <span className="dx-button-text">
                        Reject {pageConfig.Single}
                      </span>
                    </Button>
                  </div>
                </form>
              </div>
            </Card>
          )}
          {requiresApproval() && (
            <Card title="Approval" showHeader={true}>
              <div className="form">
                <form id="formMain" onSubmit={onFormApproveSubmit}>
                  <div className="dx-fieldset">
                    <div className="dx-fieldset-header">Submission</div>
                    <div className="dx-field">
                      <div className="dx-field-label">Comments (Optional)</div>
                      <TextArea
                        className="dx-field-value"
                        placeholder="Comments"
                        disabled={error || saving || saving}
                        height={80}
                        value={approvalComments}
                        onValueChange={(value) => setApprovalComments(value)}
                      ></TextArea>
                    </div>
                  </div>

                  <div className="dx-field">
                    <ValidationSummary
                      id="summaryApprove"
                      validationGroup="Approve"
                    />
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label"></div>
                    <Button
                      width="100%"
                      useSubmitBehavior={true}
                      type={saving ? "normal" : "success"}
                      disabled={loading || error || saving}
                      validationGroup="Approve"
                    >
                      <LoadIndicator
                        className="button-indicator"
                        visible={saving}
                      />
                      <span className="dx-button-text">
                        Approve {pageConfig.Single}
                      </span>
                    </Button>
                  </div>
                </form>
              </div>
            </Card>
          )}
          {isReviewed() && (
            <Card title="Review" showHeader={true}>
              <div className="form">
                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">Primary Review</div>
                  <div className="dx-field">
                    <div className="dx-field-label">Date</div>
                    <div className="dx-field-value-static">
                      <strong>
                        {Assist.getDateText(methodsDetail.review1_at)}
                      </strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Reviewer</div>
                    <div className="dx-field-value-static">
                      <strong>{methodsDetail.review1_by}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Comments</div>
                    <div className="dx-field-value-static">
                      <strong>{methodsDetail.review1_comments}</strong>
                    </div>
                  </div>
                </div>
                {approvalLevels >= 2 && stageId > 2 && (
                  <div className="dx-fieldset">
                    <div className="dx-fieldset-header">Secondary Review</div>
                    <div className="dx-field">
                      <div className="dx-field-label">Date</div>
                      <div className="dx-field-value-static">
                        {" "}
                        <strong>
                          {Assist.getDateText(methodsDetail.review2_at)}
                        </strong>
                      </div>
                    </div>
                    <div className="dx-field">
                      <div className="dx-field-label">Reviewer</div>
                      <div className="dx-field-value-static">
                        <strong>{methodsDetail.review2_by}</strong>
                      </div>
                    </div>
                    <div className="dx-field">
                      <div className="dx-field-label">Comments</div>
                      <div className="dx-field-value-static">
                        <strong>{methodsDetail.review2_comments}</strong>
                      </div>
                    </div>
                  </div>
                )}
                {approvalLevels == 3 && (
                  <div className="dx-fieldset">
                    <div className="dx-fieldset-header">Approval</div>
                    <div className="dx-field">
                      <div className="dx-field-label">Date</div>
                      <div className="dx-field-value-static">
                        {" "}
                        <strong>
                          {Assist.getDateText(methodsDetail.review3_at)}
                        </strong>
                      </div>
                    </div>
                    <div className="dx-field">
                      <div className="dx-field-label">Reviewer</div>
                      <div className="dx-field-value-static">
                        <strong>{methodsDetail.review3_by}</strong>
                      </div>
                    </div>
                    <div className="dx-field">
                      <div className="dx-field-label">Comments</div>
                      <div className="dx-field-value-static">
                        <strong>{methodsDetail.review3_comments}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default AdminMethods;