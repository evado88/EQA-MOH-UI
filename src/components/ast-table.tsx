import SelectBox from "devextreme-react/select-box";
import { NumberBox } from "devextreme-react/number-box";
import { TextBox } from "devextreme-react/text-box";
import Button from "devextreme-react/button";

/**
 * One antibiotic on the worksheet's AST table.
 *
 * `key` is a client side handle only, so a row can be edited and removed
 * before it has ever been saved. The server assigns `row_no` from the order
 * the rows are sent in, the way the numbered rows read on the paper form.
 */
export interface AstRow {
  key: number;
  antibiotic?: string;
  zone_diameter?: number;
  mic_reading?: string;
  interpretation?: string;
}

export const AST_METHOD_DISK = "disk_diffusion";
export const AST_METHOD_MIC = "mic";

interface AstTableArgs {
  /** the heading as it reads on worksheet TF-NHRTI-BACT-001 */
  title: string;
  /** which of the two tables this is */
  method: string;
  rows: AstRow[];
  onChange: (rows: AstRow[]) => void;
  /** the agents offered; a laboratory may still type one that is not listed */
  antibiotics: string[];
  interpretations: string[];
  maxRows: number;
  disabled?: boolean;
}

let nextKey = 1;

export const newAstRow = (): AstRow => ({ key: nextKey++ });

/**
 * Turns the rows the server sent into rows this table can edit.
 * Only the rows for this table's own method are taken.
 */
export const toAstRows = (astresult: any[], method: string): AstRow[] =>
  (astresult ?? [])
    .filter((r: any) => r.ast_method === method)
    .sort((a: any, b: any) => (a.row_no ?? 0) - (b.row_no ?? 0))
    .map((r: any) => ({
      key: nextKey++,
      antibiotic: r.antibiotic ?? undefined,
      zone_diameter: r.zone_diameter ?? undefined,
      mic_reading: r.mic_reading ?? undefined,
      interpretation: r.interpretation ?? undefined,
    }));

/**
 * Turns the two tables back into what the API takes.
 *
 * A row with no antibiotic on it is a row the participant started and left
 * blank, so it is dropped rather than sent as an empty agent. The reading that
 * does not belong to the method is sent as null: the worksheet has a zone
 * diameter on the disk table and a concentration on the MIC table, and the API
 * refuses a row that carries the wrong one.
 */
export const toAstPayload = (disk: AstRow[], mic: AstRow[]) => {
  const rows: any[] = [];

  disk
    .filter((r) => (r.antibiotic ?? "").trim() !== "")
    .forEach((r, index) =>
      rows.push({
        ast_method: AST_METHOD_DISK,
        row_no: index + 1,
        antibiotic: r.antibiotic,
        zone_diameter: r.zone_diameter ?? null,
        mic_reading: null,
        interpretation: r.interpretation ?? null,
      }),
    );

  mic
    .filter((r) => (r.antibiotic ?? "").trim() !== "")
    .forEach((r, index) =>
      rows.push({
        ast_method: AST_METHOD_MIC,
        row_no: index + 1,
        antibiotic: r.antibiotic,
        zone_diameter: null,
        mic_reading: r.mic_reading ?? null,
        interpretation: r.interpretation ?? null,
      }),
    );

  return rows;
};

export const AstTable = ({
  title,
  method,
  rows,
  onChange,
  antibiotics,
  interpretations,
  maxRows,
  disabled,
}: AstTableArgs) => {
  const isDisk = method === AST_METHOD_DISK;

  const setRow = (key: number, changes: Partial<AstRow>) =>
    onChange(rows.map((r) => (r.key === key ? { ...r, ...changes } : r)));

  const removeRow = (key: number) => onChange(rows.filter((r) => r.key !== key));

  const addRow = () => {
    if (rows.length >= maxRows) return;
    onChange([...rows, newAstRow()]);
  };

  return (
    <div className="dx-fieldset">
      <div className="dx-fieldset-header">{title}</div>

      <table className="ast-table" style={{ width: "100%" }}>
        <thead>
          <tr>
            <th style={{ width: "6%", textAlign: "left" }}>No</th>
            <th style={{ width: "40%", textAlign: "left" }}>Antibiotic name</th>
            <th style={{ width: "24%", textAlign: "left" }}>
              {isDisk ? "Zone Diameter (mm)" : "MIC Reading"}
            </th>
            <th style={{ width: "22%", textAlign: "left" }}>Interpretation</th>
            <th style={{ width: "8%" }}></th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={5}>
                <small>
                  No antibiotics recorded. Use Add Antibiotic below to start the
                  table.
                </small>
              </td>
            </tr>
          )}
          {rows.map((row, index) => (
            <tr key={row.key}>
              <td>{index + 1}</td>
              <td style={{ paddingRight: "6px" }}>
                <SelectBox
                  placeholder="Antibiotic"
                  dataSource={antibiotics}
                  acceptCustomValue={true}
                  searchEnabled={true}
                  showClearButton={true}
                  value={row.antibiotic}
                  disabled={disabled}
                  onValueChange={(value) =>
                    setRow(row.key, { antibiotic: value })
                  }
                  onCustomItemCreating={(e: any) => {
                    // the guideline gains agents faster than this list does, so
                    // a laboratory may report one that is not offered
                    e.customItem = e.text;
                  }}
                />
              </td>
              <td style={{ paddingRight: "6px" }}>
                {isDisk ? (
                  <NumberBox
                    placeholder="mm"
                    min={0}
                    max={100}
                    format="#0.0"
                    value={row.zone_diameter}
                    disabled={disabled}
                    onValueChange={(value) =>
                      setRow(row.key, { zone_diameter: value })
                    }
                  />
                ) : (
                  <TextBox
                    placeholder="e.g. <=0.5"
                    value={row.mic_reading}
                    disabled={disabled}
                    onValueChange={(value) =>
                      setRow(row.key, { mic_reading: value })
                    }
                  />
                )}
              </td>
              <td style={{ paddingRight: "6px" }}>
                <SelectBox
                  placeholder="S / I / SDD / R"
                  dataSource={interpretations}
                  showClearButton={true}
                  value={row.interpretation}
                  disabled={disabled}
                  onValueChange={(value) =>
                    setRow(row.key, { interpretation: value })
                  }
                />
              </td>
              <td style={{ textAlign: "right" }}>
                <Button
                  icon="trash"
                  hint="Remove this antibiotic"
                  stylingMode="text"
                  disabled={disabled}
                  onClick={() => removeRow(row.key)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="dx-field" style={{ marginTop: "8px" }}>
        <div className="dx-field-value">
          <Button
            icon="plus"
            text="Add Antibiotic"
            stylingMode="outlined"
            disabled={disabled || rows.length >= maxRows}
            onClick={addRow}
          />
          {rows.length >= maxRows && (
            <small style={{ marginLeft: "8px" }}>
              The worksheet has room for {maxRows} antibiotics on this table.
            </small>
          )}
        </div>
      </div>
    </div>
  );
};

interface AstTableViewArgs {
  title: string;
  method: string;
  astresult: any[];
}

/** The same table, as it reads once the worksheet has been submitted */
export const AstTableView = ({
  title,
  method,
  astresult,
}: AstTableViewArgs) => {
  const rows = (astresult ?? [])
    .filter((r: any) => r.ast_method === method)
    .sort((a: any, b: any) => (a.row_no ?? 0) - (b.row_no ?? 0));

  if (rows.length === 0) return null;

  const isDisk = method === AST_METHOD_DISK;

  return (
    <div className="dx-fieldset">
      <div className="dx-fieldset-header">{title}</div>
      <table className="ast-table" style={{ width: "100%" }}>
        <thead>
          <tr>
            <th style={{ width: "8%", textAlign: "left" }}>No</th>
            <th style={{ width: "44%", textAlign: "left" }}>Antibiotic name</th>
            <th style={{ width: "26%", textAlign: "left" }}>
              {isDisk ? "Zone Diameter (mm)" : "MIC Reading"}
            </th>
            <th style={{ width: "22%", textAlign: "left" }}>Interpretation</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row: any, index: number) => (
            <tr key={row.id ?? index}>
              <td>{row.row_no ?? index + 1}</td>
              <td>
                <strong>{row.antibiotic}</strong>
              </td>
              <td>
                <strong>{isDisk ? row.zone_diameter : row.mic_reading}</strong>
              </td>
              <td>
                <strong>{row.interpretation}</strong>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
