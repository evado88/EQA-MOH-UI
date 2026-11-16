import { useEffect, useRef, useState } from "react";
import { Card } from "./card";
import Assist from "../classes/assist";

interface Props {
  resultForm: string; // e.g. "bacteriology", "hiv_vl"
  resultId?: number | string;
}

/**
 * Read-only record of when a worksheet was submitted, from the automatic
 * result_submissions audit (not a lab-entered field). Shows the most recent
 * submission and, if the lab resubmitted, how many submissions there have been.
 * Renders nothing until the worksheet has been submitted at least once.
 */
export const SubmissionInfo = ({ resultForm, resultId }: Props) => {
  const [latest, setLatest] = useState<any>(null);
  const [count, setCount] = useState(0);
  const loadedFor = useRef<string>("");

  useEffect(() => {
    if (!resultId) return;
    const key = `${resultForm}:${resultId}`;
    if (loadedFor.current === key) return;
    loadedFor.current = key;

    Assist.loadData(
      "Submission info",
      `result-submissions?result_form=${resultForm}&result_id=${resultId}`,
    )
      .then((rows: any) => {
        const list = rows || [];
        setCount(list.length);
        setLatest(list[0] ?? null);
      })
      .catch(() => {});
  }, [resultForm, resultId]);

  if (!latest) return null;

  return (
    <Card title="Submission" showHeader={true}>
      <div className="form">
        <div className="dx-fieldset">
          <p style={{ margin: "0 0 8px", color: "#6b7280", fontSize: 13 }}>
            Recorded automatically when the worksheet is submitted.
          </p>
          <div className="dx-field">
            <div className="dx-field-label">Submitted on</div>
            <div className="dx-field-value-static">
              <strong>{Assist.getDateText(latest.submitted_at)}</strong>
            </div>
          </div>
          <div className="dx-field">
            <div className="dx-field-label">Submitted by</div>
            <div className="dx-field-value-static">
              <strong>{latest.submitted_by}</strong>
            </div>
          </div>
          {count > 1 && (
            <div className="dx-field">
              <div className="dx-field-label">Submissions</div>
              <div className="dx-field-value-static">
                <strong>{count}</strong>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default SubmissionInfo;
