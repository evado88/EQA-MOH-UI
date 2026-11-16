import { useEffect, useRef, useState } from "react";
import { Card } from "./card";
import FileUploader from "devextreme-react/file-uploader";
import Button from "devextreme-react/button";
import axios from "axios";
import Assist from "../classes/assist";
import AppInfo from "../classes/app-info";

interface Props {
  enrollmentId?: number | string;
  disabled?: boolean;
  readOnly?: boolean;
}

const TYPE = "result-files";

/**
 * Optional supporting files a lab attaches to a result panel (its enrolment) -
 * e.g. the physical result Excel sheet for a controlled parallel run. One or
 * more files; reuses the shared attachments store.
 */
export const ResultFiles = ({ enrollmentId, disabled, readOnly }: Props) => {
  const [files, setFiles] = useState<Array<any>>([]);
  const [busy, setBusy] = useState(false);
  const uploaderRef = useRef<any>(null);
  const ready = enrollmentId != null;

  const load = () => {
    if (!ready) return;
    Assist.loadData("Result files", `attachments/list?type=${TYPE}&parent=${enrollmentId}`)
      .then((data: any) => setFiles(data || []))
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, [enrollmentId]);

  const onFilesSelected = async (e: any) => {
    const chosen: File[] = e.value || [];
    if (!chosen.length || !ready) return;
    setBusy(true);
    try {
      for (const file of chosen) {
        await Assist.uploadFile(
          "Result file",
          `attachments/create/type/${TYPE}/parent/${enrollmentId}`,
          file,
        );
      }
      Assist.showMessage("File(s) attached", "success");
    } catch (message: any) {
      Assist.showMessage(message, "error");
    }
    setBusy(false);
    // reset the picker and refresh the list
    if (uploaderRef.current?.instance) uploaderRef.current.instance.reset();
    load();
  };

  const remove = (id: number) => {
    setBusy(true);
    axios
      .delete(`${AppInfo.apiUrl}attachments/${id}`)
      .then(() => {
        setBusy(false);
        setFiles((prev) => prev.filter((f) => f.id !== id));
      })
      .catch(() => {
        setBusy(false);
        Assist.showMessage("Could not remove the file", "error");
      });
  };

  return (
    <Card title="Result Files (required)" showHeader={true}>
      <div className="form">
        <div className="dx-fieldset">
          <p style={{ margin: "0 0 8px", color: "#6b7280", fontSize: 13 }}>
            Attach the worksheet file for this panel, such as the physical
            result Excel sheet. At least one file is required before results can
            be submitted.
          </p>

          {files.length === 0 ? (
            <p style={{ color: "#6b7280", fontSize: 13 }}>No files attached.</p>
          ) : (
            <ul style={{ margin: "0 0 10px", paddingLeft: 18 }}>
              {files.map((f) => (
                <li key={f.id} style={{ marginBottom: 4 }}>
                  <a
                    href={`${AppInfo.apiUrl}static/${f.path}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {f.name}
                  </a>
                  {!readOnly && (
                    <Button
                      icon="trash"
                      stylingMode="text"
                      hint="Remove"
                      disabled={disabled || busy}
                      onClick={() => remove(f.id)}
                    />
                  )}
                </li>
              ))}
            </ul>
          )}

          {!readOnly && (
            <FileUploader
              ref={uploaderRef}
              multiple={true}
              uploadMode="useForm"
              selectButtonText="Attach file(s)"
              labelText="e.g. physical result Excel sheet"
              disabled={disabled || busy || !ready}
              onValueChanged={onFilesSelected}
            />
          )}
        </div>
      </div>
    </Card>
  );
};

export default ResultFiles;
