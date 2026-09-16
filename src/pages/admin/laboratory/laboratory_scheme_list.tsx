import { useState, useEffect, useMemo, useRef } from "react";
import { Titlebar } from "../../../components/titlebar";
import { Card } from "../../../components/card";
import { Row } from "../../../components/row";
import { Col } from "../../../components/column";
import DataGrid, {
  Column,
  Pager,
  Paging,
  FilterRow,
  LoadPanel,
  ColumnChooser,
  Toolbar,
  Item,
  Button as GridButton,
} from "devextreme-react/data-grid";

import Assist from "../../../classes/assist";
import PageConfig from "../../../classes/page-config";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

//where a scheme application stands, in the colours the app uses elsewhere
const SCHEME_COLOURS: Record<string, any> = {
  Accepted: { text: "#1b5e20", background: "#e8f5e9", border: "#a5d6a7" },
  Pending: { text: "#8a6d3b", background: "#fdf6e3", border: "#e6d3a3" },
  Rejected: { text: "#8c2f26", background: "#fdecea", border: "#f0b3ad" },
};

/**
 * Which schemes each laboratory takes part in.
 *
 * The plain Laboratory List answers "who is registered with us"; this answers
 * "who is in what", which is the question asked when a round is being planned.
 */
const AdminLaboratorySchemeList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<Array<any>>([]);
  const [loadingText, setLoadingText] = useState("Loading data...");
  const [loading, setLoading] = useState(true);
  const hasRun = useRef(false);

  const pageConfig = new PageConfig(
    "Laboratory Scheme List",
    "laboratorys/scheme-list",
    "",
    "Laboratory",
    "",
    [Assist.ROLE_ADMIN],
  );

  useEffect(() => {
    //check if initialized
    if (hasRun.current) return;
    hasRun.current = true;

    //check permissions and audit
    if (!Assist.checkPageAuditPermission(pageConfig, user)) {
      Assist.redirectUnauthorized(navigate);
      return;
    }

    setLoading(true);

    Assist.loadData(pageConfig.Title, pageConfig.Url)
      .then((res: any) => {
        setData(res);
        setLoading(false);
        setLoadingText(res.length === 0 ? "No Data" : "");
      })
      .catch((ex) => {
        setLoading(false);
        Assist.showMessage(ex.Message ?? ex, "error");
        setLoadingText("Could not show information");
      });
  }, []);

  const listButtonOptions = useMemo(
    () => ({
      icon: "detailslayout",
      text: "Laboratory List",
      onClick: () => navigate("/admin/laboratorys/list"),
    }),
    [],
  );

  /** Each scheme as its own chip, so the mix reads in one glance */
  const schemeCell = (e: any) => {
    const schemes = e.data.scheme_list ?? [];

    if (schemes.length === 0) {
      return (
        <span style={{ color: "#999" }}>
          {e.data.status?.status_name === "Submitted"
            ? "Awaiting review"
            : "None"}
        </span>
      );
    }

    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
        {schemes.map((scheme: any) => {
          const colour =
            SCHEME_COLOURS[scheme.participation] ?? SCHEME_COLOURS.Rejected;

          //the methods are what the scheme membership actually consists of
          const methods =
            scheme.accepted_method_names || scheme.method_names || "";
          const hint =
            scheme.participation === "Accepted"
              ? `Accepted for ${methods}`
              : `${scheme.participation}: ${methods}`;

          return (
            <span
              key={scheme.scheme_id}
              title={hint}
              style={{
                display: "inline-block",
                padding: "1px 8px",
                borderRadius: "10px",
                fontSize: "11px",
                lineHeight: "18px",
                whiteSpace: "nowrap",
                color: colour.text,
                background: colour.background,
                border: `1px solid ${colour.border}`,
              }}
            >
              {scheme.scheme_name}
              {scheme.participation !== "Accepted"
                ? ` (${scheme.participation})`
                : ""}
            </span>
          );
        })}
      </div>
    );
  };

  /** The methods behind the membership, which is what a round actually ships to */
  const methodCell = (e: any) => {
    const schemes = e.data.scheme_list ?? [];
    const methods = schemes
      .filter((s: any) => s.participation === "Accepted")
      .map((s: any) => s.accepted_method_names)
      .filter(Boolean)
      .join(", ");

    return methods ? (
      <span>{methods}</span>
    ) : (
      <span style={{ color: "#999" }}>-</span>
    );
  };

  const registeredCell = (e: any) => {
    const count = e.value ?? 0;
    return (
      <strong style={{ color: count > 0 ? "#2e7d32" : "#999" }}>{count}</strong>
    );
  };

  return (
    <div className="page-content" style={{ minHeight: "862px" }}>
      <Titlebar
        title={pageConfig.Title}
        section={"Administration"}
        icon={"cubes"}
        url="/"
      ></Titlebar>

      <Row>
        <Col sz={12} sm={12} lg={12}>
          <Card showHeader={false}>
            <DataGrid
              className={"dx-card wide-card"}
              dataSource={data}
              keyExpr={"id"}
              noDataText={loadingText}
              showBorders={false}
              focusedRowEnabled={true}
              defaultFocusedRowIndex={0}
              columnAutoWidth={true}
              columnHidingEnabled={true}
            >
              <Paging defaultPageSize={10} />
              <Pager showPageSizeSelector={true} showInfo={true} />
              <FilterRow visible={true} />
              <LoadPanel enabled={loading} />
              <ColumnChooser enabled={true} mode="select"></ColumnChooser>
              <Toolbar>
                <Item
                  location="before"
                  locateInMenu="auto"
                  widget="dxButton"
                  options={listButtonOptions}
                />
                <Item name="columnChooserButton" />
              </Toolbar>

              <Column
                dataField="code"
                caption="Code"
                width={90}
                hidingPriority={12}
              ></Column>
              <Column
                dataField="name"
                caption="Laboratory"
                hidingPriority={14}
                sortOrder="asc"
                cellRender={(e) => (
                  <Link to={`/admin/laboratorys/view/${e.data.id}`}>
                    {e.text}
                  </Link>
                )}
              ></Column>
              <Column
                dataField="scheme_names"
                caption="Schemes"
                minWidth={240}
                hidingPriority={15}
                cellRender={schemeCell}
              ></Column>
              <Column
                caption="Methods"
                minWidth={180}
                hidingPriority={9}
                allowFiltering={false}
                allowSorting={false}
                cellRender={methodCell}
              ></Column>
              <Column
                dataField="accepted_scheme_count"
                caption="Registered"
                width={100}
                hidingPriority={13}
                cellRender={registeredCell}
              ></Column>
              <Column
                dataField="scheme_count"
                caption="Applied For"
                width={100}
                hidingPriority={8}
              ></Column>
              <Column
                dataField="accepted_scheme_names"
                caption="Registered In"
                hidingPriority={2}
                visible={false}
              ></Column>
              <Column
                dataField="labtype.name"
                caption="Type of Lab"
                hidingPriority={10}
              ></Column>
              <Column
                dataField="province.name"
                caption="Province"
                hidingPriority={11}
              ></Column>
              <Column
                dataField="district.name"
                caption="District"
                hidingPriority={6}
              ></Column>
              <Column
                dataField="contact_person_name"
                caption="Contact Person"
                hidingPriority={4}
                visible={false}
              ></Column>
              <Column
                dataField="email_address"
                caption="Email Address"
                hidingPriority={3}
                visible={false}
              ></Column>
              <Column
                dataField="status.status_name"
                caption="Status"
                hidingPriority={7}
              ></Column>

              <Column type="buttons" caption="" width={130}>
                <GridButton
                  text="Laboratory"
                  hint="Open the laboratory"
                  onClick={(e: any) =>
                    navigate(`/admin/laboratorys/view/${e.row.data.id}`)
                  }
                />
                <GridButton
                  text="Applications"
                  hint="See the method applications behind these schemes"
                  onClick={() => navigate(`/admin/applications/list`)}
                />
              </Column>
            </DataGrid>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminLaboratorySchemeList;
