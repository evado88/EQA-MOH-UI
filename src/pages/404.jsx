import React, { useState, useEffect } from "react";
import { Titlebar } from "../components/titlebar";
import { Card } from "../components/card";
import { Row } from "../components/row";
import { Col } from "../components/column";
import SelectBox from "devextreme-react/select-box";
import { TextBox } from "devextreme-react/text-box";
import TextArea from "devextreme-react/text-area";
import { NumberBox } from "devextreme-react/number-box";
import Button from "devextreme-react/button";
import ValidationSummary from "devextreme-react/validation-summary";
import { LoadPanel } from "devextreme-react/load-panel";
import Toolbar, { Item } from "devextreme-react/toolbar";
import { Validator, RequiredRule } from "devextreme-react/validator";
import DateBox from "devextreme-react/date-box";
import { TestComponent } from "../components/TestComponent";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("Evans");

  const onFormSubmit = async (e) => {
    e.preventDefault();

    addItem(name);
  };

  return (
    <div className="page-content" style={{ minHeight: "862px" }}>
      <Titlebar
        title={"404"}
        section={"Administration"}
        icon={"home"}
      ></Titlebar>
      {/* end widget */}

      {/* chart start */}
      <Row>
        <Col sz={12} sm={12} lg={12}>

            <section className="sign-in">
              <div className="container">
                <div className="signin-content pb-5">
                  <div className="signin-image">
                    <figure>
                      <img
                        src="/images/404.jpg"
                        alt="sing up image"
                      ></img>
                    </figure>
                  </div>
                  <div className="signin-form">
                    <h2 className="form-title">Error 404</h2>
                    <p>
                      The page you are looking for does't exist or an other
                      error occurred.
                    </p>
                    <br></br>
                      <div className="form-group form-button">
                        <button
                          className="btn btn-round btn-primary"
                          name="home"
                          id="home"
                          onClick={() => navigate('/')}
                        >
                          Go to home page
                        </button>
                      </div>
                  </div>
                </div>
              </div>
            </section>
        </Col>
      </Row>
    </div>
  );
};

export default NotFound;
