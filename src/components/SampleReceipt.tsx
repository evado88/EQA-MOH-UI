import { useEffect, useRef, useState } from "react";
import { Card } from "./card";
import DateBox from "devextreme-react/date-box";
import SelectBox from "devextreme-react/select-box";
import { NumberBox } from "devextreme-react/number-box";
import TextArea from "devextreme-react/text-area";
import Button from "devextreme-react/button";
import { LoadIndicator } from "devextreme-react/load-indicator";
import Assist from "../classes/assist";

interface Props {
  ptCycleId?: number | string;
  labId?: number | string;
  methodSampleId?: number | string;
  userId?: number;
  disabled?: boolean;
  onSaved?: () => void;
}

const CONDITIONS = ["Suitable", "Not suitable"];

/**
 * Per-sample receipt details a lab records before entering results for a sample.
 * Self-contained: loads any existing receipt and saves to /sample-receipts.
 */
export const SampleReceipt = ({
  ptCycleId,
  labId,
  methodSampleId,
  userId,
  disabled,
  onSaved,
}: Props) => {
  const [dateReceived, setDateReceived] = useState<string | undefined>(undefined);
  const [condition, setCondition] = useState<string | undefined>(undefined);
  const [temperature, setTemperature] = useState<number | undefined>(undefined);
  const [comments, setComments] = useState<string>("");
  const [recorded, setRecorded] = useState(false);
  const [saving, setSaving] = useState(false);
  const loadedFor = useRef<string>("");

  const ready = ptCycleId != null && labId != null && methodSampleId != null;
  const notSuitable = condition === "Not suitable";

  useEffect(() => {
    if (!ready) return;
    const key = `${ptCycleId}:${labId}:${methodSampleId}`;
    if (loadedFor.current === key) return;
    loadedFor.current = key;

    Assist.loadData(
      "Sample receipt",
      `sample-receipts/sample?pt_cycle_id=${ptCycleId}&lab_id=${labId}&method_sample_id=${methodSampleId}`,
    )
      .then((r: any) => {
        if (r && r.id) {
          setDateReceived(r.date_received ?? undefined);
          setCondition(r.condition ?? undefined);
          setTemperature(r.temperature_c ?? undefined);
          setComments(r.comments ?? "");
          setRecorded(true);
        }
      })
      .catch(() => {});
  }, [ptCycleId, labId, methodSampleId]);

  const save = () => {
    if (!dateReceived || !condition || temperature == null) {
      Assist.showMessage(
        "Please provide the date received, condition and temperature",
        "error",
      );
      return;
    }
    if (notSuitable && !comments.trim()) {
      Assist.showMessage("Please comment on why the sample is not suitable", "error");
      return;
    }
    setSaving(true);
    Assist.postPutData(
      "Sample receipt",
      "sample-receipts",
      {
        user_id: userId,
        pt_cycle_id: ptCycleId,
        lab_id: labId,
        method_sample_id: methodSampleId,
        date_received: dateReceived,
        condition,
        temperature_c: temperature,
        comments: comments || null,
      },
      0,
    )
      .then(() => {
        setSaving(false);
        setRecorded(true);
        Assist.showMessage("Sample receipt recorded", "success");
        if (onSaved) onSaved();
      })
      .catch((message) => {
        setSaving(false);
        Assist.showMessage(message, "error");
      });
  };

  return (
    <Card title="Sample Receipt" showHeader={true}>
      <div className="form">
        <div className="dx-fieldset">
          <p style={{ margin: "0 0 8px", color: "#6b7280", fontSize: 13 }}>
            Record how this sample arrived before entering its results.
            {recorded ? " ✓ Recorded." : ""}
          </p>
          <div className="dx-field">
            <div className="dx-field-label">Date Received</div>
            <DateBox
              className="dx-field-value"
              displayFormat={"dd MMMM yyyy"}
              dateSerializationFormat="yyyy-MM-dd"
              value={dateReceived}
              disabled={disabled || saving || !ready}
              onValueChange={(v) => setDateReceived(v)}
            />
          </div>
          <div className="dx-field">
            <div className="dx-field-label">Condition</div>
            <SelectBox
              className="dx-field-value"
              placeholder="Suitable / Not suitable"
              dataSource={CONDITIONS}
              value={condition}
              disabled={disabled || saving || !ready}
              onValueChange={(v) => setCondition(v)}
            />
          </div>
          <div className="dx-field">
            <div className="dx-field-label">Temperature on receipt (°C)</div>
            <NumberBox
              className="dx-field-value"
              placeholder="e.g. 4.0"
              format="#0.# °C"
              value={temperature}
              disabled={disabled || saving || !ready}
              onValueChange={(v) => setTemperature(v)}
            />
          </div>
          <div className="dx-field">
            <div className="dx-field-label">
              Comments{notSuitable ? " (required)" : ""}
            </div>
            <TextArea
              className="dx-field-value"
              placeholder={
                notSuitable
                  ? "Why is the sample not suitable?"
                  : "Any additional notes about sample condition"
              }
              height={60}
              value={comments}
              disabled={disabled || saving || !ready}
              onValueChange={(v) => setComments(v)}
            />
          </div>
          <div className="dx-field">
            <div className="dx-field-label"></div>
            <Button
              type={saving ? "normal" : "default"}
              disabled={disabled || saving || !ready}
              onClick={save}
            >
              <LoadIndicator className="button-indicator" visible={saving} />
              <span className="dx-button-text">
                {recorded ? "Update receipt" : "Save receipt"}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SampleReceipt;
