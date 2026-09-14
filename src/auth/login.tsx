import React, { useState, useEffect } from "react";
import { TextBox } from "devextreme-react/text-box";
import Button from "devextreme-react/button";
import {
  Validator,
  RequiredRule,
  CustomRule,
} from "devextreme-react/validator";
import DateBox from "devextreme-react/date-box";
import ValidationSummary from "devextreme-react/validation-summary";
import { LoadIndicator } from "devextreme-react/load-indicator";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Link, NavLink, useLocation } from "react-router-dom";
import axios, { AxiosError } from "axios";
import Assist from "../classes/assist";
import AppInfo from "../classes/app-info";

const Login = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [accessToken, setAccessToken] = useState(null);
  const [code, setCode] = useState("");
  const [OTP, setOTP] = useState("");

  const [stage, setStage] = useState(1);

  useEffect(() => {
    // Redirect if already logged in
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const onFormSubmit = async (e: React.FormEvent) => {
    setLoading(true);

    e.preventDefault();

    const formData = new FormData();

    formData.append("username", username);
    formData.append("password", password);

    setTimeout(() => {
      Assist.postPutData("Login", "auth/login", formData, 0)
        .then((data: any) => {
          setLoading(false);

          //navigate

          // PRODUCTION
          /* 
          setAccessToken(data.access_token);
          const details = Assist.getTokenDetails(data.access_token);

          sendWhatsappOTP(details.mobile);
          setStage(2);

          DEBUG   */
           login(data.access_token);
       
         
        })
        .catch((message) => {
          setLoading(false);
          Assist.showMessage(message, "error");
        });
    }, Assist.DEV_DELAY);
  };

  const sendWhatsappOTP = (userPhone: string) => {
    setLoading(true);
    const newCode = Math.floor(100000 + Math.random() * 900000);

    console.log(`Now sending OTP ${newCode} to client ${userPhone}`);

    setOTP(`${newCode}`);

    const postData = {
      mobile: userPhone,
      code: newCode,
    };

    setTimeout(() => {
      Assist.postPutData(
        "WhatsApp Code",
        `whatsapp/send-infobip-auth-message`,
        postData,
        0
      )
        .then((data) => {
          setLoading(false);
          console.log(data);
          Assist.showMessage(
            `The OTP has been successfully sent to ${userPhone}`,
            "success"
          );
        })
        .catch((message) => {
          setLoading(false);
          console.log(message);
          Assist.showMessage(
            `Error sending OTP to ${userPhone}. Please try again`,
            "error"
          );
        });
    }, Assist.DEV_DELAY);
  };

  const onOTPFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      if (code == OTP) {
        login(accessToken);
      } else {
        Assist.showMessage(
          `The specified code ${code} is not correct. Please try again.`,
          "error"
        );
      }
    }, Assist.DEV_DELAY);
  };
  return (
    <section className="sign-in">
      <div className="container">
        <div className="signin-content">
          <div className="signin-image">
            <figure>
              <img src="./images/logo-zambia.jpg" alt="sing up image"></img>
            </figure>
            <Link to={"/signup"} className="signup-image-link">
              Create an account
            </Link>
          </div>
          <div className="signin-form">
            <h2 className="form-title">{AppInfo.appCode}</h2>
            {stage == 1 && (
              <form
                className="register-form"
                id="login-form"
                onSubmit={onFormSubmit}
              >
                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">Login</div>
                  <div className="dx-field">
                    <div className="dx-field-label">Username</div>
                    <TextBox
                      className="dx-field-value"
                      validationMessagePosition="left"
                      inputAttr={{ "aria-label": "Userame" }}
                      placeholder="Username"
                      disabled={loading}
                      value={username}
                      onValueChange={(text) => setUsername(text)}
                    >
                      {" "}
                      <Validator>
                        <RequiredRule message="Username is required" />
                      </Validator>
                    </TextBox>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Password</div>
                    <TextBox
                      className="dx-field-value"
                      validationMessagePosition="left"
                      inputAttr={{ "aria-label": "Password" }}
                      placeholder="Password"
                      disabled={loading}
                      mode="password"
                      value={password}
                      onValueChange={(text) => setPassword(text)}
                    >
                      {" "}
                      <Validator>
                        <RequiredRule message="Password is required" />
                      </Validator>
                    </TextBox>
                  </div>
                </div>
                <div className="form-group">
                  <ValidationSummary id="summary" />
                </div>
                <div className="form-group form-button">
                  <Button
                    width="100%"
                    text="Login"
                    type={loading ? "normal" : "default"}
                    disabled={loading}
                    useSubmitBehavior={true}
                  >
                    <LoadIndicator
                      className="button-indicator"
                      visible={loading}
                    />
                    <span className="dx-button-text">Login</span>
                  </Button>
                </div>
              </form>
            )}
            {stage == 2 && (
              <form
                className="register-form"
                id="login-form"
                onSubmit={onOTPFormSubmit}
              >
                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">One Time Password</div>
                  <div className="dx-field">
                    <div className="dx-field-label">Code</div>
                    <TextBox
                      className="dx-field-value"
                      placeholder="Code"
                      value={code}
                      onValueChange={(text) => setCode(text)}
                    >
                      {" "}
                      <Validator>
                        <RequiredRule message="OTP code required" />
                        <CustomRule
                          validationCallback={(e) => e.value == OTP}
                          message={`The specified code is not valid. Please try again`}
                        />
                      </Validator>
                    </TextBox>
                  </div>
                </div>
                <div className="form-group">
                  <ValidationSummary id="summary" />
                </div>
                <div className="form-group form-button">
                  <Button
                    width="100%"
                    text="Login"
                    type={loading ? "normal" : "default"}
                    disabled={loading}
                    useSubmitBehavior={true}
                  >
                    <LoadIndicator
                      className="button-indicator"
                      visible={loading}
                    />
                    <span className="dx-button-text">Verify OTP</span>
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Login;
