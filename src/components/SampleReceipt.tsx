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
 * Receipt details a lab records before entering results.
 *
 * Samples A-E arrive in one package, so the arrival details (date received,
 * temperature, comments) are recorded once per shipment - per (cycle, lab) -
 * and shared across every sample's worksheet. Suitability is judged per
 * sample. Self-contained: loads any existing shipment receipt and this
 * sample's condition, and saves them to /shipment-receipts and /sample-receipts.
 */
export const SampleReceipt = ({
  ptCycleId,
  labId,
  methodSampleId,
  userId,
  disabled,
  onSaved,
}: Props) => {
  // shipment-level (shared across all samples in the package)
  const [dateReceived, setDateReceived] = useState<string | undefined>(undefined);
  const [temperature, setTemperature] = useState<number | undefined>(undefined);
  const [shipmentComments, setShipmentComments] = useState<string>("");
  // per-sample
  const [condition, setCondition] = useState<string | undefined>(undefined);
  const [conditionComments, setConditionComments] = useState<string>("");

  const [recorded, setRecorded] = useState(false);
  const [saving, setSaving] = useState(false);
  const loadedShipmentFor = useRef<string>("");
  const loadedSampleFor = useRef<string>("");

  const shipmentReady = ptCycleId != null && labId != null;
  const sampleReady = shipmentReady && methodSampleId != null;
  const notSuitable = condition === "Not suitable";

  // shipment receipt - keyed by (cycle, lab)
  useEffect(() => {
    if (!shipmentReady) return;
    const key = `${ptCycleId}:${labId}`;
    if (loadedShipmentFor.current === key) return;
    loadedShipmentFor.current = key;

    Assist.loadData(
      "Shipment receipt",
      `shipment-receipts/by?pt_cycle_id=${ptCycleId}&lab_id=${labId}`,
    )
      .then((r: any) => {
        if (r && r.id) {
          setDateReceived(r.date_received ?? undefined);
          setTemperature(r.temperature_c ?? undefined);
          setShipmentComments(r.comments ?? "");
        }
      })
      .catch(() => {});
  }, [ptCycleId, labId]);

  // this sample's condition - keyed by (cycle, lab, sample)
  useEffect(() => {
    if (!sampleReady) return;
    const key = `${ptCycleId}:${labId}:${methodSampleId}`;
    if (loadedSampleFor.current === key) return;
    loadedSampleFor.current = key;

    Assist.loadData(
      "Sample condition",
      `sample-receipts/sample?pt_cycle_id=${ptCycleId}&lab_id=${labId}&method_sample_id=${methodSampleId}`,
    )
      .then((r: any) => {
        if (r && r.id) {
          setCondition(r.condition ?? undefined);
          setConditionComments(r.comments ?? "");
          setRecorded(true);
        } else {
          setCondition(undefined);
          setConditionComments("");
          setRecorded(false);
        }
      })
      .catch(() => {});
  }, [ptCycleId, labId, methodSampleId]);

  const save = () => {
    if (!dateReceived || temperature == null) {
      Assist.showMessage(
        "Please provide the date received and temperature for the shipment",
        "error",
      );
      return;
    }
    if (!condition) {
      Assist.showMessage("Please indicate this sample's condition", "error");
      return;
    }
    if (notSuitable && !conditionComments.trim()) {
      Assist.showMessage("Please comment on why the sample is not suitable", "error");
      return;
    }

    setSaving(true);
    Assist.postPutData(
      "Shipment receipt",
      "shipment-receipts",
      {
        user_id: userId,
        pt_cycle_id: ptCycleId,
        lab_id: labId,
        date_received: dateReceived,
        temperature_c: temperature,
        comments: shipmentComments || null,
      },
      0,
    )
      .then(() =>
        Assist.postPutData(
          "Sample condition",
          "sample-receipts",
          {
            user_id: userId,
            pt_cycle_id: ptCycleId,
            lab_id: labId,
            method_sample_id: methodSampleId,
            condition,
            comments: conditionComments || null,
          },
          0,
        ),
      )
      .then(() => {
        setSaving(false);
        setRecorded(true);
        Assist.showMessage("Receipt recorded", "success");
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
          <div className="dx-fieldset-header">Shipment (applies to all samples)</div>
          <p style={{ margin: "0 0 8px", color: "#6b7280", fontSize: 13 }}>
            Samples arrive together in one package - record how the shipment
            arrived once.
          </p>
          <div className="dx-field">
            <div className="dx-field-label">Date Received</div>
            <DateBox
              className="dx-field-value"
              displayFormat={"dd MMMM yyyy"}
              dateSerializationFormat="yyyy-MM-dd"
              value={dateReceived}
              disabled={disabled || saving || !shipmentReady}
              onValueChange={(v) => setDateReceived(v)}
            />
          </div>
          <div className="dx-field">
            <div className="dx-field-label">Temperature on receipt (°C)</div>
            <NumberBox
              className="dx-field-value"
              placeholder="e.g. 4.0"
              format="#0.# °C"
              value={temperature}
              disabled={disabled || saving || !shipmentReady}
              onValueChange={(v) => setTemperature(v)}
            />
          </div>
          <div className="dx-field">
            <div className="dx-field-label">Shipment comments</div>
            <TextArea
              className="dx-field-value"
              placeholder="Any notes about the package as a whole"
              height={60}
              value={shipmentComments}
              disabled={disabled || saving || !shipmentReady}
              onValueChange={(v) => setShipmentComments(v)}
            />
          </div>
        </div>

        <div className="dx-fieldset">
          <div className="dx-fieldset-header">This Sample</div>
          <p style={{ margin: "0 0 8px", color: "#6b7280", fontSize: 13 }}>
            Judge this sample's condition before entering its results.
            {recorded ? " ✓ Recorded." : ""}
          </p>
          <div className="dx-field">
            <div className="dx-field-label">Condition</div>
            <SelectBox
              className="dx-field-value"
              placeholder="Suitable / Not suitable"
              dataSource={CONDITIONS}
              value={condition}
              disabled={disabled || saving || !sampleReady}
              onValueChange={(v) => setCondition(v)}
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
                  : "Any additional notes about this sample"
              }
              height={60}
              value={conditionComments}
              disabled={disabled || saving || !sampleReady}
              onValueChange={(v) => setConditionComments(v)}
            />
          </div>
          <div className="dx-field">
            <div className="dx-field-label"></div>
            <Button
              type={saving ? "normal" : "default"}
              disabled={disabled || saving || !sampleReady}
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
