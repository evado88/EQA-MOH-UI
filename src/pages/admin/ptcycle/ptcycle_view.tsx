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
import SelectBox from "devextreme-react/select-box";

const AdminPTCycle = () => {
  //user
  const navigate = useNavigate();
  const { user } = useAuth();
  const { eId } = useParams(); // Destructure the parameter directly

  //posting
  const [ptcycleDetail, setptcycleDetail] = useState<null | any>(null);

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

  //cycle life cycle
  const [nextStatusId, setNextStatusId] = useState<undefined | number>(
    undefined,
  );
  const [statusComments, setStatusComments] = useState("");
  const hasRun = useRef(false);

  const pageConfig = new PageConfig(
    `${status == "Approved" ? "View" : "Review"} PT Cycle`,
    "",
    "",
    "PT Cycle",
    `pt-cycles/review-update/${eId}`,
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
        Assist.loadData(pageConfig.Title, `pt-cycles/id/${pageConfig.Id}`)
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
    setptcycleDetail(res.ptcycle);
    // approval
    setStatus(res.ptcycle.status.status_name);
    setStage(res.ptcycle.stage.stage_name);
    setStageId(res.ptcycle.stage_id);
    setApprovalLevels(res.ptcycle.approval_levels);

    setCreatedBy(res.ptcycle.user.email);
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
  const isApproved = () => {
    if (status == "Approved") {
      return true;
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
  //the statuses this cycle may legally be moved to from where it is now
  const nextStatuses = () => {
    if (ptcycleDetail == null) {
      return [];
    }

    return (
      Assist.PT_CYCLE_TRANSITIONS[ptcycleDetail.pt_cyle_status_id] ?? []
    ).map((id: number) => ({
      id: id,
      name: Assist.PT_CYCLE_STATUS_NAMES[id],
    }));
  };

  const onFormStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nextStatusId) {
      Assist.showMessage("Please choose the status to move the cycle to", "error");
      return;
    }

    const statusName = Assist.PT_CYCLE_STATUS_NAMES[nextStatusId];

    //shipping is the step that opens a result sheet for every enrolled sample,
    //so spell that out before it happens
    const warning =
      nextStatusId == Assist.PT_CYCLE_SAMPLES_SHIPPED
        ? " This will open a result form for every sample of every accepted enrolment."
        : "";

    let result = confirm(
      `Are you sure you want to move this ${pageConfig.Single} to '${statusName}'?${warning}`,
      "Confirm changes",
    );

    result.then((dialogResult) => {
      if (dialogResult) {
        submitStatusChange(nextStatusId);
      }
    });

    return;
  };

  const submitStatusChange = (statusId: number) => {
    setSaving(true);

    const postData = {
      pt_cyle_status_id: statusId,
      user_id: user.userid,
      comments: statusComments,
    };

    setTimeout(() => {
      Assist.postPutData(
        pageConfig.Title,
        `pt-cycles/status/${eId}`,
        postData,
        1,
      )
        .then((data: any) => {
          setSaving(false);

          Assist.showMessage(
            data && data.message
              ? data.message
              : `You have successfully updated the status of this ${pageConfig.Single}!`,
            "success",
          );

          navigate(`/admin/pt-cycles/list`);
        })
        .catch((message) => {
          setSaving(false);
          Assist.showMessage(message, "error");
        });
    }, Assist.DEV_DELAY);
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

          navigate(`/admin/pt-cycles/list`);
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
    const postData = { ...ptcycleDetail, ...newData };

    setTimeout(() => {
      Assist.postPutData(
        pageConfig.Title,
        `pt-cycles/update/${eId}`,
        postData,
        1,
      )
        .then((data) => {
          setSaving(false);

          Assist.showMessage(
            `You have successfully unsubmitted the ${pageConfig.Single}!`,
            "success",
          );

          navigate(`/admin/pt-cycles/list`);
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
            {ptcycleDetail != null && (
              <div className="form">
                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">Details</div>
                  <div className="dx-field">
                    <div className="dx-field-label">Name</div>
                    <div className="dx-field-value-static">
                      <strong>{ptcycleDetail.name}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Description</div>
                    <div className="dx-field-value-static">
                      {ptcycleDetail.description}
                    </div>
                  </div>
                </div>
                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">Period</div>
                  <div className="dx-field">
                    <div className="dx-field-label">Code</div>
                    <div className="dx-field-value-static">
                      <strong>{ptcycleDetail.code}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Scheme</div>
                    <div className="dx-field-value-static">
                      <strong>{ptcycleDetail.scheme.name}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Effective Date</div>
                    <div className="dx-field-value-static">
                      <strong>
                        {Assist.getDateText(ptcycleDetail.effective_date)}
                      </strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Closing Date</div>
                    <div className="dx-field-value-static">
                      <strong>
                        {Assist.getDateText(ptcycleDetail.closing_date)}
                      </strong>
                    </div>
                  </div>
                </div>
                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">Timeline</div>
                  <div className="dx-field">
                    <div className="dx-field-label">PT Cycle Status</div>
                    <div className="dx-field-value-static">
                      <strong>{ptcycleDetail.ptcyclestatus.name}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Shipping Date</div>
                    <div className="dx-field-value-static">
                      <strong>
                        {Assist.getDateText(ptcycleDetail.shipping_date)}
                      </strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">
                      Reports Availability Date
                    </div>
                    <div className="dx-field-value-static">
                      <strong>
                        {Assist.getDateText(
                          ptcycleDetail.reports_availability_date,
                        )}
                      </strong>
                    </div>
                  </div>
                </div>
                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">Submission</div>
                  <div className="dx-field">
                    <div className="dx-field-label">Username</div>
                    <div className="dx-field-value-static">
                      <strong>
                        <strong>{ptcycleDetail.user.email}</strong>
                      </strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">User</div>
                    <div className="dx-field-value-static">
                      <strong>
                        <strong>
                          {ptcycleDetail.user.fname} {ptcycleDetail.user.lname}
                        </strong>
                      </strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Status</div>
                    <div className="dx-field-value-static">
                      <strong>{ptcycleDetail.status.status_name}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Approval Levels</div>
                    <div className="dx-field-value-static">
                      <strong>{ptcycleDetail.approval_levels}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Stage</div>
                    <div className="dx-field-value-static">
                      <strong>{ptcycleDetail.stage.stage_name}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Date</div>
                    <div className="dx-field-value-static">
                      <strong>
                        {Assist.getDateText(ptcycleDetail.created_at)}
                      </strong>
                    </div>
                  </div>
                  {unsubmitButton()}
                </div>
              </div>
            )}
          </Card>
        </Col>
        <Col sz={12} sm={12} lg={5}>
          {isApproved() &&
            ptcycleDetail.pt_cyle_status_id >=
              Assist.PT_CYCLE_SAMPLES_SHIPPED && (
              <Card title="Evaluation" showHeader={true}>
                <div className="form">
                  <div className="dx-field">
                    <div className="dx-field-value-static">
                      Scores, sample statistics and participant standing for
                      this round.
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label"></div>
                    <div className="dx-field-value">
                      <Button
                        width="100%"
                        type="normal"
                        icon="chart"
                        text="Open Evaluation"
                        onClick={() =>
                          navigate(`/admin/pt-cycles/evaluation/${eId}`)
                        }
                      />
                    </div>
                  </div>
                </div>
              </Card>
            )}
          {isApproved() && (
            <Card title="Cycle Status" showHeader={true}>
              <div className="form">
                <div className="dx-fieldset">
                  <div className="dx-field">
                    <div className="dx-field-label">Current Status</div>
                    <div className="dx-field-value-static">
                      <strong>{ptcycleDetail.ptcyclestatus.name}</strong>
                    </div>
                  </div>
                </div>
                {nextStatuses().length == 0 ? (
                  <div className="dx-fieldset">
                    <div className="dx-field">
                      <div className="dx-field-value-static">
                        This cycle is complete and its status can no longer be
                        changed.
                      </div>
                    </div>
                  </div>
                ) : (
                  <form id="formStatus" onSubmit={onFormStatusSubmit}>
                    <div className="dx-fieldset">
                      <div className="dx-field">
                        <div className="dx-field-label">Move To</div>
                        <SelectBox
                          className="dx-field-value"
                          placeholder="Next status"
                          dataSource={nextStatuses()}
                          displayExpr={"name"}
                          valueExpr={"id"}
                          deferRendering={false}
                          value={nextStatusId}
                          disabled={error || saving}
                          onValueChange={(value) => setNextStatusId(value)}
                        >
                          <Validator validationGroup="Status">
                            <RequiredRule message="The next status is required" />
                          </Validator>
                        </SelectBox>
                      </div>
                      <div className="dx-field">
                        <div className="dx-field-label">
                          Comments (Optional)
                        </div>
                        <TextArea
                          className="dx-field-value"
                          placeholder="Comments"
                          disabled={error || saving}
                          height={80}
                          value={statusComments}
                          onValueChange={(value) => setStatusComments(value)}
                        ></TextArea>
                      </div>
                    </div>
                    <div className="dx-field">
                      <ValidationSummary
                        id="summaryStatus"
                        validationGroup="Status"
                      />
                    </div>
                    <div className="dx-field">
                      <div className="dx-field-label"></div>
                      <Button
                        width="100%"
                        useSubmitBehavior={true}
                        validationGroup="Status"
                        type={saving ? "normal" : "success"}
                        disabled={loading || error || saving}
                      >
                        <LoadIndicator
                          className="button-indicator"
                          visible={saving}
                        />
                        <span className="dx-button-text">Change Status</span>
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </Card>
          )}
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
                        {Assist.getDateText(ptcycleDetail.review1_at)}
                      </strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Reviewer</div>
                    <div className="dx-field-value-static">
                      <strong>{ptcycleDetail.review1_by}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Comments</div>
                    <div className="dx-field-value-static">
                      <strong>{ptcycleDetail.review1_comments}</strong>
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
                          {Assist.getDateText(ptcycleDetail.review2_at)}
                        </strong>
                      </div>
                    </div>
                    <div className="dx-field">
                      <div className="dx-field-label">Reviewer</div>
                      <div className="dx-field-value-static">
                        <strong>{ptcycleDetail.review2_by}</strong>
                      </div>
                    </div>
                    <div className="dx-field">
                      <div className="dx-field-label">Comments</div>
                      <div className="dx-field-value-static">
                        <strong>{ptcycleDetail.review2_comments}</strong>
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
                          {Assist.getDateText(ptcycleDetail.review3_at)}
                        </strong>
                      </div>
                    </div>
                    <div className="dx-field">
                      <div className="dx-field-label">Reviewer</div>
                      <div className="dx-field-value-static">
                        <strong>{ptcycleDetail.review3_by}</strong>
                      </div>
                    </div>
                    <div className="dx-field">
                      <div className="dx-field-label">Comments</div>
                      <div className="dx-field-value-static">
                        <strong>{ptcycleDetail.review3_comments}</strong>
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

export default AdminPTCycle;
