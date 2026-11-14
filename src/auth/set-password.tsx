import { useState, useEffect } from "react";
import { TextBox } from "devextreme-react/text-box";
import Button from "devextreme-react/button";
import {
  Validator,
  RequiredRule,
  CustomRule,
  StringLengthRule,
} from "devextreme-react/validator";
import ValidationSummary from "devextreme-react/validation-summary";
import { LoadIndicator } from "devextreme-react/load-indicator";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import Assist from "../classes/assist";
import AppInfo from "../classes/app-info";

const SetPassword = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") || "";

  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);
  const [greeting, setGreeting] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) {
      setChecking(false);
      setValid(false);
      return;
    }
    setTimeout(() => {
      Assist.loadData("Verification", `auth/verify/${token}`)
        .then((data: any) => {
          setValid(true);
          setGreeting(data?.name || "");
          setEmail(data?.email || "");
          setChecking(false);
        })
        .catch(() => {
          setValid(false);
          setChecking(false);
        });
    }, Assist.DEV_DELAY);
  }, [token]);

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    setTimeout(() => {
      Assist.postPutData("Set password", "auth/set-password", { token, password }, 0)
        .then((data: any) => {
          setSaving(false);
          Assist.showMessage(
            data?.message || "Your password is set. You can now sign in.",
            "success",
          );
          navigate("/login");
        })
        .catch((message) => {
          setSaving(false);
          Assist.showMessage(message, "error");
        });
    }, Assist.DEV_DELAY);
  };

  return (
    <section className="sign-in">
      <div className="container">
        <div className="signin-content">
          <div className="signin-form">
            <h2 className="form-title">{AppInfo.appCode}</h2>

            {checking && (
              <div style={{ padding: 24, textAlign: "center" }}>
                <LoadIndicator visible={true} /> &nbsp; Verifying your link...
              </div>
            )}

            {!checking && !valid && (
              <div className="dx-fieldset">
                <div className="dx-fieldset-header">Verification</div>
                <p>
                  This verification link is invalid or has already been used. You
                  can register again, or sign in if you have already set your
                  password.
                </p>
                <p>
                  <Link to="/signup">Register</Link> &nbsp;·&nbsp;{" "}
                  <Link to="/login">Sign in</Link>
                </p>
              </div>
            )}

            {!checking && valid && (
              <form className="register-form" onSubmit={onFormSubmit}>
                <div className="dx-fieldset">
                  <div className="dx-fieldset-header">Set your password</div>
                  <p style={{ color: "#6b7280", fontSize: 13 }}>
                    {greeting ? `Welcome, ${greeting}. ` : ""}
                    Verifying <strong>{email}</strong>. Choose a password to
                    activate your account.
                  </p>
                  <div className="dx-field">
                    <div className="dx-field-label">Password</div>
                    <TextBox
                      className="dx-field-value"
                      mode="password"
                      placeholder="At least 8 characters"
                      value={password}
                      disabled={saving}
                      onValueChange={setPassword}
                    >
                      <Validator>
                        <RequiredRule message="Password is required" />
                        <StringLengthRule
                          min={8}
                          message="Password must be at least 8 characters"
                        />
                      </Validator>
                    </TextBox>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Confirm Password</div>
                    <TextBox
                      className="dx-field-value"
                      mode="password"
                      placeholder="Re-enter your password"
                      value={confirm}
                      disabled={saving}
                      onValueChange={setConfirm}
                    >
                      <Validator>
                        <RequiredRule message="Please confirm your password" />
                        <CustomRule
                          validationCallback={(e: any) => e.value === password}
                          message="Passwords do not match"
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
                    type={saving ? "normal" : "default"}
                    disabled={saving}
                    useSubmitBehavior={true}
                  >
                    <LoadIndicator className="button-indicator" visible={saving} />
                    <span className="dx-button-text">
                      Set password &amp; activate
                    </span>
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

export default SetPassword;
