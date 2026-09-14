import React from "react";

export const NotificationList = (items) => {
  return (
    /* list */
    <div
      className="notification-list mail-list not-list small-slimscroll-style"
      style={{ width: "auto" }}
    >
      <a href="#" className="single-mail">
        <span className="icon bg-danger">
          <i className="fa fa-user-o"></i>
        </span>
        Penalty fee K500 (Mssisng meeting) has been added to your account
        <span className="notificationtime">
          <small>Just Now</small>
        </span>
      </a>
      <a href="#" className="single-mail">
        <span className="icon blue-bgcolor">
          <i className="fa fa-envelope-o"></i>
        </span>
        <span className="text-purple">John Doe</span> has sent you a POP for ZMW5,000
        <span className="notificationtime">
          <small>5 Days Ago</small>
        </span>
      </a>
      <a href="#" className="single-mail">
        <span className="icon bg-success">
          <i className="fa fa-check-square-o"></i>
        </span>
        Loan ZMW 10,000 approved
        <span className="notificationtime">
          <small> 5 Days Ago</small>
        </span>
      </a>

      <div className="full-width text-center p-t-10">
        <button
          type="button"
          className="btn purple btn-outline btn-circle margin-0"
        >
          View All
        </button>
      </div>
    </div>
  );
};
