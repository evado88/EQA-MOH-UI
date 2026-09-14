import React from "react";
import { Link, Route } from "react-router-dom";
import { Card } from "./card";
import Assist from "../classes/assist";
import DataGrid, { Column, Pager, Paging } from "devextreme-react/data-grid";
import AppInfo from "../classes/app-info";
import HtmlEditor from "devextreme-react/html-editor";

interface UserArgs {
  user: any;
  unsubmitComponent?: React.ReactElement | null;
}
export const UserDetail = ({
  user: announcement,
  unsubmitComponent,
}: UserArgs) => {
  return (
    /* start title */
    <Card title="Properties" showHeader={true}>
      <div className="form">
        <div className="dx-fieldset">
          <div className="dx-fieldset-header">Title</div>
          <div className="dx-field">
            <div className="dx-field-label">First name</div>
            <div className="dx-field-value-static">
              <strong>{announcement.fname}</strong>
            </div>
          </div>
          <div className="dx-field">
            <div className="dx-field-label">First name</div>
            <div className="dx-field-value-static">
              <strong>{announcement.fname}</strong>
            </div>
          </div>
          <div className="dx-field">
            <div className="dx-field-label">Last name</div>
            <div className="dx-field-value-static">
              <strong>{announcement.lname}</strong>
            </div>
          </div>
          <div className="dx-field">
            <div className="dx-field-label">Mobile</div>
            <div className="dx-field-value-static">
              <strong>{announcement.mobile}</strong>
            </div>
          </div>
          <div className="dx-field">
            <div className="dx-field-label">Email</div>
            <div className="dx-field-value-static">
              <strong>{announcement.email}</strong>
            </div>
          </div>
          <div className="dx-field">
            <div className="dx-field-label">Physical address</div>
            <div className="dx-field-value-static">
              <strong>{announcement.address_physical}</strong>
            </div>
          </div>
          <div className="dx-field">
            <div className="dx-field-label">Postal address</div>
            <div className="dx-field-value-static">
              <strong>{announcement.address_postal}</strong>
            </div>
          </div>
        </div>
        <div className="dx-fieldset">
          <div className="dx-fieldset-header">Submission</div>
          <div className="dx-field">
            <div className="dx-field-label">User</div>
            <div className="dx-field-value-static">
              <strong>{announcement.created_by}</strong>
            </div>
          </div>
          <div className="dx-field">
            <div className="dx-field-label">Status</div>
            <div className="dx-field-value-static">
              <strong>{announcement.status.status_name}</strong>
            </div>
          </div>
          <div className="dx-field">
            <div className="dx-field-label">Approval Levels</div>
            <div className="dx-field-value-static">
              <strong>{announcement.approval_levels}</strong>
            </div>
          </div>
          <div className="dx-field">
            <div className="dx-field-label">Stage</div>
            <div className="dx-field-value-static">
              <strong>{announcement.stage.stage_name}</strong>
            </div>
          </div>
          <div className="dx-field">
            <div className="dx-field-label">Date Submitted</div>
            <div className="dx-field-value-static">
              <strong>{Assist.getDateText(announcement.created_at)}</strong>
            </div>
          </div>
          {unsubmitComponent}
        </div>
      </div>
    </Card>
  );
};
