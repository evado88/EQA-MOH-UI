import Assist from "../classes/assist";

export interface MenuItem {
  key: string;
  text: string;
  icon: string;
  path: string;
  roles: number[];
  items: MenuItem[];
}

// who sees what:
//  - SYSTEM_ADMIN: only the Administrator may manage users, roles and the
//    whole catalogue (system administration)
//  - OPERATIONAL: scheme operations (applications, cycles, results, reports) -
//    the scheme management roles plus the cross-scheme roles (MOH, Admin),
//    scoped to the user's scheme on the server
//  - LAB: a participating laboratory's own work
const SYSTEM_ADMIN = Assist.SYSTEM_ADMIN_ROLES;
const OPERATIONAL = Assist.ADMIN_ROLES;
// scheme approvers plus the Finance role (for the payment approval step)
const PAYMENT_APPROVERS = Assist.PAYMENT_APPROVER_ROLES;
const LAB = Assist.LABORATORY_ROLES;
const EVERYONE = [...Assist.PROVIDER_ROLES, ...LAB];

export const navigation: MenuItem[] = [
  {
    key: "home",
    text: "Dashboard",
    icon: "fa fa-cubes",
    path: "/",
    roles: EVERYONE,
    items: [],
  },
  {
    key: "7-administration",
    text: "Administration",
    icon: "fa fa-gears",
    path: "#",
    roles: SYSTEM_ADMIN,
    items: [
      {
        key: "user",
        text: "User",
        icon: "",
        path: "/admin/user/list",
        roles: SYSTEM_ADMIN,
        items: [],
      },
      {
        key: "audit",
        text: "Audit",
        icon: "",
        path: "/admin/audit/list",
        roles: SYSTEM_ADMIN,
        items: [],
      },
      {
        key: "role",
        text: "Role",
        icon: "",
        path: "/admin/role/list",
        roles: SYSTEM_ADMIN,
        items: [],
      },
      {
        key: "data-migration",
        text: "Data Migration",
        icon: "",
        path: "/admin/imports/data-migration",
        roles: SYSTEM_ADMIN,
        items: [],
      },
    ],
  },
  {
    key: "1-dictionaries",
    text: "Dictionaries",
    icon: "fa fa-cube",
    path: "#",
    roles: SYSTEM_ADMIN,
    items: [
      {
        key: "stage",
        text: "Stage",
        icon: "",
        path: "/admin/stages/list",
        roles: SYSTEM_ADMIN,
        items: [],
      },
      {
        key: "status",
        text: "Status",
        icon: "",
        path: "/admin/statuses/list",
        roles: SYSTEM_ADMIN,
        items: [],
      },
      {
        key: "labtype",
        text: "Lab Type",
        icon: "",
        path: "/admin/lab-types/list",
        roles: SYSTEM_ADMIN,
        items: [],
      },
      {
        key: "ptcyclestatus",
        text: "PT Cycle Status",
        icon: "",
        path: "/admin/pt-cycle-statuses/list",
        roles: SYSTEM_ADMIN,
        items: [],
      },
    ],
  },
  {
    key: "3-demographics",
    text: "Demographics",
    icon: "fa fa-simplybuilt",
    path: "#",
    roles: SYSTEM_ADMIN,
    items: [
      {
        key: "province",
        text: "Province",
        icon: "",
        path: "/admin/provinces/list",
        roles: SYSTEM_ADMIN,
        items: [],
      },
      {
        key: "district",
        text: "District",
        icon: "",
        path: "/admin/districts/list",
        roles: SYSTEM_ADMIN,
        items: [],
      },
    ],
  },
  {
    key: "5-calibration",
    text: "Schemes",
    icon: "fa fa fa-thermometer",
    path: "#",
    roles: SYSTEM_ADMIN,
    items: [
      {
        key: "provider",
        text: "Provider",
        icon: "",
        path: "/admin/providers/list",
        roles: SYSTEM_ADMIN,
        items: [],
      },
      {
        key: "scheme",
        text: "Scheme",
        icon: "",
        path: "/admin/schemes/list",
        roles: SYSTEM_ADMIN,
        items: [],
      },
      {
        key: "service",
        text: "Service",
        icon: "",
        path: "/admin/services/list",
        roles: SYSTEM_ADMIN,
        items: [],
      },
      {
        key: "method",
        text: "Method",
        icon: "",
        path: "/admin/methods/list",
        roles: SYSTEM_ADMIN,
        items: [],
      },
      {
        key: "methodsample",
        text: "Method Sample",
        icon: "",
        path: "/admin/method-samples/list",
        roles: SYSTEM_ADMIN,
        items: [],
      },
    ],
  },
  {
    key: "10-facilities",
    text: "Laboratories",
    icon: "fa fa-map-marker",
    path: "#",
    roles: OPERATIONAL,
    items: [
      {
        key: "laboratory",
        text: "Laboratory",
        icon: "",
        path: "/admin/laboratorys/list",
        roles: OPERATIONAL,
        items: [],
      },
      {
        key: "laboratory-schemes",
        text: "Laboratory Schemes",
        icon: "",
        path: "/admin/laboratorys/scheme-list",
        roles: OPERATIONAL,
        items: [],
      },
    ],
  },
  {
    key: "4-facilities",
    text: "PT Calendar",
    icon: "fa fa-map-marker",
    path: "#",
    roles: OPERATIONAL,
    items: [
      {
        key: "ptcycle",
        text: "PT Cycle",
        icon: "",
        path: "/admin/pt-cycles/list",
        roles: OPERATIONAL,
        items: [],
      },
      {
        key: "enrollment",
        text: "Enrollment",
        icon: "",
        path: "/admin/enrollments/list",
        roles: OPERATIONAL,
        items: [],
      },
    ],
  },
  {
    key: "8-applications",
    text: "Applications",
    icon: "fa fa-stethoscope",
    path: "#",
    roles: OPERATIONAL,
    items: [
      {
        key: "applications",
        text: "Application",
        icon: "",
        path: "/admin/applications/list",
        roles: OPERATIONAL,
        items: [],
      },
    ],
  },
  {
    key: "9-payment-approvals",
    text: "Payment Approvals",
    icon: "fa fa-money",
    path: "/admin/payment-approvals",
    roles: PAYMENT_APPROVERS,
    items: [],
  },
  {
    key: "11-results",
    text: "Results",
    icon: "fa fa-stethoscope",
    path: "#",
    roles: OPERATIONAL,
    items: [
      {
        key: "tbxpertultraresult",
        text: "TB Xpert Ultra Result",
        icon: "",
        path: "/admin/tb-xpert-ultra-results/list",
        roles: OPERATIONAL,
        items: [],
      },
      {
        key: "tbxpertxdrresult",
        text: "TB Xpert XDR Result",
        icon: "",
        path: "/admin/tb-xpert-xdr-results/list",
        roles: OPERATIONAL,
        items: [],
      },
      {
        key: "hivvlresult",
        text: "HIV-1 Viral Load Result",
        icon: "",
        path: "/admin/hiv-vl-results/list",
        roles: OPERATIONAL,
        items: [],
      },
      {
        key: "hiveidresult",
        text: "HIV-1 EID Result",
        icon: "",
        path: "/admin/hiv-eid-results/list",
        roles: OPERATIONAL,
        items: [],
      },
      {
        key: "bacteriologyresult",
        text: "Bacteriology Result",
        icon: "",
        path: "/admin/bacteriology-results/list",
        roles: OPERATIONAL,
        items: [],
      },
      {
        key: "ptreport",
        text: "PT Performance Report",
        icon: "",
        path: "/admin/reports/pt-performance",
        roles: OPERATIONAL,
        items: [],
      },
    ],
  },
  {
    key: "19-lab-register-scheme",
    text: "Register for a Scheme",
    icon: "fa fa-th-large",
    path: "/facility/schemes",
    roles: LAB,
    items: [],
  },
  {
    key: "19b-lab-my-registrations",
    text: "My Registrations",
    icon: "fa fa-file-text-o",
    path: "/facility/my-registrations",
    roles: LAB,
    items: [],
  },
  {
    key: "20-lab-calendar",
    text: "PT Calendar",
    icon: "fa fa-map-marker",
    path: "#",
    roles: LAB,
    items: [
      // the enrolment page already lists the cycles open to this lab, so it
      // does not need the provider's full calendar
      {
        key: "lab-enrollment",
        text: "My Enrolments",
        icon: "",
        path: "/facility/enrollments/list",
        roles: LAB,
        items: [],
      },
    ],
  },
  {
    key: "21-lab-results",
    text: "PT Results",
    icon: "fa fa-stethoscope",
    path: "#",
    roles: LAB,
    items: [
      {
        key: "lab-tbxpertultraresult",
        text: "Xpert Ultra Results",
        icon: "",
        path: "/facility/tb-xpert-ultra-results/list",
        roles: LAB,
        items: [],
      },
      {
        key: "lab-tbxpertxdrresult",
        text: "Xpert XDR Results",
        icon: "",
        path: "/facility/tb-xpert-xdr-results/list",
        roles: LAB,
        items: [],
      },
      {
        key: "lab-hivvlresult",
        text: "HIV-1 Viral Load Results",
        icon: "",
        path: "/facility/hiv-vl-results/list",
        roles: LAB,
        items: [],
      },
      {
        key: "lab-hiveidresult",
        text: "HIV-1 EID Results",
        icon: "",
        path: "/facility/hiv-eid-results/list",
        roles: LAB,
        items: [],
      },
      {
        key: "lab-bacteriologyresult",
        text: "Bacteriology Results",
        icon: "",
        path: "/facility/bacteriology-results/list",
        roles: LAB,
        items: [],
      },
      {
        key: "lab-performance",
        text: "My Performance",
        icon: "",
        path: "/facility/performance/list",
        roles: LAB,
        items: [],
      },
      {
        key: "lab-ptreport",
        text: "PT Reports",
        icon: "",
        path: "/facility/reports/pt-performance",
        roles: LAB,
        items: [],
      },
    ],
  },
];
