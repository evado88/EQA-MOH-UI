import { useState, useEffect, useRef } from "react";
import { Titlebar } from "../../../components/titlebar";
import { Card } from "../../../components/card";
import { Row } from "../../../components/row";
import { Col } from "../../../components/column";
import Button from "devextreme-react/button";
import SelectBox from "devextreme-react/select-box";
import Autocomplete from "devextreme-react/autocomplete";
import { NumberBox } from "devextreme-react/number-box";
import { TextBox } from "devextreme-react/text-box";
import { LoadPanel } from "devextreme-react/load-panel";
import { LoadIndicator } from "devextreme-react/load-indicator";

import Assist from "../../../classes/assist";
import PageConfig from "../../../classes/page-config";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

/**
 * The targets for a round: the known correct answer each sample is graded
 * against.
 *
 * Most schemes work by comparing a laboratory's result to a value the scheme
 * already knows - the organism on a bacteriology sample, the detection result
 * on a TB sample. A coordinator enters those here, per round, and the scoring
 * grades against them. A field left blank falls back to the sample default, or
 * to the consensus of the participants where there is no stated value.
 *
 * The fields shown are whatever the scheme's result form is graded on, so this
 * one page serves every scheme. The bacteriology AST table is entered as a list
 * of antibiotics and their expected interpretation.
 */

interface AstPair {
  antibiotic: string;
  interpretation: string;
}

const AdminTargetsView = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { eId } = useParams();

  const [data, setData] = useState<null | any>(null);
  const [values, setValues] = useState<Record<string, { text?: string; numeric?: number }>>({});
  const [astPairs, setAstPairs] = useState<Record<number, AstPair[]>>({});

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const hasRun = useRef(false);

  const pageConfig = new PageConfig(
    "Round Targets",
    "",
    "",
    "Targets",
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

    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    Assist.loadData("Round Targets", `pt-cycle-targets/${pageConfig.Id}`)
      .then((payload: any) => {
        setLoading(false);
        setData(payload);

        // seed the editable state from what is already set
        const seedValues: Record<string, { text?: string; numeric?: number }> = {};
        const seedAst: Record<number, AstPair[]> = {};
        (payload.samples || []).forEach((s: any) => {
          (s.attributes || []).forEach((a: any) => {
            if (a.input === "ast") {
              seedAst[s.method_sample_id] = (a.ast_pairs || []).map((p: any) => ({
                antibiotic: p.antibiotic,
                interpretation: p.interpretation,
              }));
            } else {
              seedValues[`${s.method_sample_id}:${a.attribute}`] = {
                text: a.expected_value_text ?? undefined,
                numeric: a.expected_value_numeric ?? undefined,
              };
            }
          });
        });
        setValues(seedValues);
        setAstPairs(seedAst);
      })
      .catch((message) => {
        setLoading(false);
        Assist.showMessage(message, "error");
      });
  };

  const setValue = (sid: number, attr: string, patch: { text?: string; numeric?: number }) => {
    setValues((prev) => ({ ...prev, [`${sid}:${attr}`]: { ...prev[`${sid}:${attr}`], ...patch } }));
  };

  const getValue = (sid: number, attr: string) => values[`${sid}:${attr}`] || {};

  // ---- AST editor helpers ----
  const astRows = (sid: number): AstPair[] => astPairs[sid] || [];

  const setAstRow = (sid: number, index: number, patch: Partial<AstPair>) => {
    setAstPairs((prev) => {
      const rows = [...(prev[sid] || [])];
      rows[index] = { ...rows[index], ...patch };
      return { ...prev, [sid]: rows };
    });
  };

  const addAstRow = (sid: number) => {
    setAstPairs((prev) => ({
      ...prev,
      [sid]: [...(prev[sid] || []), { antibiotic: "", interpretation: "" }],
    }));
  };

  const removeAstRow = (sid: number, index: number) => {
    setAstPairs((prev) => {
      const rows = [...(prev[sid] || [])];
      rows.splice(index, 1);
      return { ...prev, [sid]: rows };
    });
  };

  const onSave = () => {
    const targets: any[] = [];
    (data.samples || []).forEach((s: any) => {
      (s.attributes || []).forEach((a: any) => {
        if (a.input === "ast") {
          targets.push({
            method_sample_id: s.method_sample_id,
            attribute: a.attribute,
            ast_pairs: astRows(s.method_sample_id).filter(
              (p) => p.antibiotic && p.interpretation,
            ),
          });
        } else {
          const v = getValue(s.method_sample_id, a.attribute);
          targets.push({
            method_sample_id: s.method_sample_id,
            attribute: a.attribute,
            expected_value_text: a.input === "number" ? null : (v.text || null),
            expected_value_numeric:
              a.input === "number" ? (v.numeric ?? null) : null,
          });
        }
      });
    });

    setSaving(true);
    Assist.postPutData(
      "Round Targets",
      `pt-cycle-targets/${pageConfig.Id}`,
      { user_id: user.userid, targets: targets },
      1,
    )
      .then((result: any) => {
        setSaving(false);
        Assist.showMessage(result?.message || "Targets saved", "success");
        loadData();
      })
      .catch((message) => {
        setSaving(false);
        Assist.showMessage(message, "error");
      });
  };

  const sourceBadge = (source: string | null) => {
    if (source === "round") return <small style={{ color: "#2e7d32" }}> (this round)</small>;
    if (source === "default") return <small style={{ color: "#8a6d3b" }}> (sample default)</small>;
    return <small style={{ color: "#aaa" }}> (not set)</small>;
  };

  const renderAttribute = (sid: number, a: any) => {
    if (a.input === "ast") {
      return (
        <div className="dx-field" key={a.attribute} style={{ display: "block" }}>
          <div className="dx-field-label" style={{ width: "100%" }}>
            {a.label} {sourceBadge(a.source)}
          </div>
          <div style={{ width: "100%" }}>
            {astRows(sid).map((p, i) => (
              <Row key={i}>
                <Col sz={7} sm={7} lg={7}>
                  <Autocomplete
                    value={p.antibiotic}
                    dataSource={data.antibiotic_options}
                    placeholder="Antibiotic"
                    disabled={saving}
                    onValueChanged={(e) =>
                      setAstRow(sid, i, { antibiotic: (e.value || "").toUpperCase() })
                    }
                  />
                </Col>
                <Col sz={3} sm={3} lg={3}>
                  <SelectBox
                    value={p.interpretation}
                    items={data.ast_interpretation_options}
                    placeholder="S/I/SDD/R"
                    disabled={saving}
                    onValueChanged={(e) => setAstRow(sid, i, { interpretation: e.value })}
                  />
                </Col>
                <Col sz={2} sm={2} lg={2}>
                  <Button icon="trash" disabled={saving} onClick={() => removeAstRow(sid, i)} />
                </Col>
              </Row>
            ))}
            <Button
              icon="add"
              text="Add antibiotic"
              type="normal"
              disabled={saving}
              onClick={() => addAstRow(sid)}
            />
            <div className="dx-field-value-static">
              <small>
                Only antibiotics with a definite S/I/SDD/R are graded; leave out
                any that are not evaluated.
              </small>
            </div>
          </div>
        </div>
      );
    }

    const v = getValue(sid, a.attribute);
    return (
      <div className="dx-field" key={a.attribute}>
        <div className="dx-field-label">
          {a.label} {sourceBadge(a.source)}
        </div>
        <div className="dx-field-value">
          {a.input === "select" && (
            <SelectBox
              value={v.text}
              items={a.options}
              placeholder="Select the expected value"
              showClearButton={true}
              searchEnabled={true}
              disabled={saving}
              onValueChanged={(e) => setValue(sid, a.attribute, { text: e.value })}
            />
          )}
          {a.input === "number" && (
            <NumberBox
              value={v.numeric}
              placeholder="Expected value"
              showClearButton={true}
              disabled={saving}
              onValueChanged={(e) => setValue(sid, a.attribute, { numeric: e.value })}
            />
          )}
          {a.input === "text" && (
            <TextBox
              value={v.text}
              placeholder="Expected value"
              showClearButton={true}
              disabled={saving}
              onValueChanged={(e) => setValue(sid, a.attribute, { text: e.value })}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div id="pageRoot" className="page-content">
      <LoadPanel
        shadingColor="rgba(0,0,0,0.4)"
        position={{ of: "#pageRoot" }}
        visible={loading || saving}
        showIndicator={true}
        shading={true}
        showPane={true}
        hideOnOutsideClick={false}
      />
      <Titlebar
        title={pageConfig.Title}
        section={"PT Calendar"}
        icon={"detailslayout"}
        url={`/admin/pt-cycles/view/${eId}`}
      ></Titlebar>

      {data != null && (
        <Row>
          <Col sz={12} sm={12} lg={4}>
            <Card title="Round" showHeader={true}>
              <div className="form">
                <div className="dx-fieldset">
                  <div className="dx-field">
                    <div className="dx-field-label">Cycle</div>
                    <div className="dx-field-value-static">
                      <strong>{data.cycle_code} - {data.cycle_name}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Scheme</div>
                    <div className="dx-field-value-static">
                      <strong>{data.scheme_name}</strong>
                    </div>
                  </div>
                  <div className="dx-field">
                    <div className="dx-field-label">Samples</div>
                    <div className="dx-field-value-static">
                      <strong>{data.samples.length}</strong>
                    </div>
                  </div>
                </div>

                <div className="dx-field">
                  <div className="dx-field-label"></div>
                  <div className="dx-field-value">
                    <Button
                      width="100%"
                      type="default"
                      icon="save"
                      disabled={loading || saving}
                      onClick={onSave}
                    >
                      <LoadIndicator className="button-indicator" visible={saving} />
                      <span className="dx-button-text">Save Targets</span>
                    </Button>
                  </div>
                </div>

                <div className="dx-field">
                  <div className="dx-field-value-static">
                    <small>
                      After changing targets, re-score the round from the
                      Evaluation page for the change to reach the reports.
                    </small>
                  </div>
                </div>

                <div className="dx-field">
                  <div className="dx-field-label"></div>
                  <div className="dx-field-value">
                    <Button
                      width="100%"
                      type="normal"
                      icon="arrowleft"
                      text="Back to Round"
                      onClick={() => navigate(`/admin/pt-cycles/view/${eId}`)}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </Col>

          <Col sz={12} sm={12} lg={8}>
            {data.samples.length === 0 && (
              <Card title="Samples" showHeader={true}>
                <p>
                  This scheme has no graded samples to set targets for. Add the
                  method samples for the scheme first.
                </p>
              </Card>
            )}
            {data.samples.map((s: any) => (
              <Card
                key={s.method_sample_id}
                title={`${s.sample_name}${s.is_control ? " (control)" : ""} - ${s.method_name || s.result_form}`}
                showHeader={true}
              >
                <div className="form">
                  <div className="dx-fieldset">
                    {s.attributes.map((a: any) => renderAttribute(s.method_sample_id, a))}
                  </div>
                </div>
              </Card>
            ))}
          </Col>
        </Row>
      )}
    </div>
  );
};

export default AdminTargetsView;
