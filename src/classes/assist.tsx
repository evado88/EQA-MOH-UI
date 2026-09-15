import AppInfo from "./app-info.js";
import notify from "devextreme/ui/notify";
import axios from "axios";
import TaskResult from "./task-result.js";
import { jwtDecode } from "jwt-decode";
import PageConfig from "./page-config.js";

class Assist {
  // roles - these mirror helpers/assist.py on the API, and the order the
  // /role/initialize endpoint seeds them in
  static ROLE_ADMINISTRATOR = 1;
  static ROLE_SCHEME_HEAD = 2;
  static ROLE_SCHEME_COORDINATOR = 3;
  static ROLE_SCHEME_QUALITY_OFFICER = 4;
  static ROLE_FINANCE_OFFICER = 5;
  static ROLE_PROVINCIAL_BIOMEDICAL_SCIENTIST = 6;
  static ROLE_EQA_FOCAL_POINT = 7;
  static ROLE_DISTRICT_LAB_COORDINATOR = 8;
  static ROLE_FACILITY_SUPER_USER = 9;
  static ROLE_FACILITY_STAFF = 10;

  // kept for pages written before the roles above existed
  static ROLE_ADMIN = 1;
  static ROLE_MEMBER = 2;

  // roles that belong to a participating laboratory
  static LABORATORY_ROLES = [
    Assist.ROLE_FACILITY_SUPER_USER,
    Assist.ROLE_FACILITY_STAFF,
  ];

  // roles that may administer the scheme
  static ADMIN_ROLES = [
    Assist.ROLE_ADMINISTRATOR,
    Assist.ROLE_SCHEME_HEAD,
    Assist.ROLE_SCHEME_COORDINATOR,
    Assist.ROLE_SCHEME_QUALITY_OFFICER,
  ];

  // pt cycle statuses - mirror the /pt-cycle-statuses/initialize seed
  static PT_CYCLE_UPCOMING = 1;
  static PT_CYCLE_STARTED = 2;
  static PT_CYCLE_SAMPLES_SHIPPED = 3;
  static PT_CYCLE_REPORT_AVAILABLE = 4;
  static PT_CYCLE_CLOSED = 5;

  static PT_CYCLE_STATUS_NAMES: Record<number, string> = {
    1: "Upcoming",
    2: "Started",
    3: "Samples Shipped",
    4: "Report Available",
    5: "Closed",
  };

  // a cycle only ever moves forward, one step at a time
  static PT_CYCLE_TRANSITIONS: Record<number, number[]> = {
    1: [2],
    2: [3],
    3: [4],
    4: [5],
    5: [],
  };

  /** Returns true when the signed in user belongs to a participating laboratory */
  static isLaboratoryUser(user: any): boolean {
    return !!user && Assist.LABORATORY_ROLES.includes(user.role);
  }

  /** Returns true when the signed in user may administer the scheme */
  static isAdminUser(user: any): boolean {
    return !!user && Assist.ADMIN_ROLES.includes(user.role);
  }

  /** The laboratory the signed in user reports for, or undefined for provider staff */
  static getLaboratoryId(user: any): number | undefined {
    return user && user.lab ? Number(user.lab) : undefined;
  }

  static POSTING_MONTHLY = 1;
  static POSTING_MIDMONTH = 2;

  static DEV_DELAY: number = 500;
  static UX_DELAY: number = 500;

  static STAGE_AWAITING_SUBMISSION = 1;
  static STAGE_SUBMITTED = 2;
  static STAGE_PRIMARY_APPROVAL = 3;
  static STAGE_SECONDARY_APPROVAL = 4;
  static STAGE_APPROVED = 5;

  static STATUS_DRAFT = 1;
  static STATUS_SUBMITTED = 2;
  static STATUS_UNDER_REVIEW = 3;
  static STATUS_APPROVED = 4;
  static STATUS_REJECTED = 5;


  static STATE_OPEN = 1;
  static STATE_CLOSED = 2;

  static REVIEW_ACTION_REJECT = 1;
  static REVIEW_ACTION_APPROVE = 2;

  static RESPONSE_NO = 1;
  static RESPONSE_YES = 2;

  static NOTIFY_WAITING = 1;
  static NOTIFY_SENT = 2;


  static firebaseConfig = {
    apiKey: "AIzaSyCbH2wyJmcqTQU3gIl_raQwr0AmVuG_bhA",
    authDomain: "myzambia-5c62c.firebaseapp.com",
    databaseURL: "https://myzambia-5c62c.firebaseio.com",
    projectId: "myzambia-5c62c",
    storageBucket: "myzambia-5c62c.appspot.com",
    messagingSenderId: "878075714362",
    appId: "1:878075714362:web:55575ac3647ff7d3cd0e03",
  };

  static checkPageAuditPermission(
    pageConfig: PageConfig,
    user: any,
    action?: string
  ) {
    //put audit action
    const authorized = pageConfig.Permissions?.includes(user.role);

    const result = authorized ? "Allowed" : "Permission Denied";

    const auditAction = action ? `${action} - ${result}`: `View - ${result}`

    Assist.auditAction(
      user.userid,
      user.sub,
      user.jti,
      pageConfig.Title,
      null,
      auditAction,
      null,
      null,
      null,
    );

    if (!authorized) {
      return false;
    }else{
      return true;
    }
  }
  static redirectUnauthorized(navigate: any){
    navigate('/401');
  }

  static getAgeUTC(mysqlDateString: string) {
    // Parse the date strictly as UTC
    const birthDate = new Date(mysqlDateString);
    if (isNaN(birthDate.getTime())) {
      return -1;
    }

    const now = new Date();

    // Compute age based on UTC parts, not local parts
    let age = now.getUTCFullYear() - birthDate.getUTCFullYear();

    const hasHadBirthdayThisYear =
      now.getUTCMonth() > birthDate.getUTCMonth() ||
      (now.getUTCMonth() === birthDate.getUTCMonth() &&
        now.getUTCDate() >= birthDate.getUTCDate());

    if (!hasHadBirthdayThisYear) {
      age -= 1;
    }

    return age;
  }

  static formatDateLong(date: string | Date): string {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";

    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(d);
  }

  // Currency formatting
  static currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "ZMW",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  static numberFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "ZMW",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  static formatCurrency(value: number): string {
    return this.currencyFormatter.format(value);
  }
  static formatNumber(value: number): string {
    return this.numberFormatter.format(value);
  }
  static getPostingPeriodText(mysqlDate: string): string {
    const date = new Date(mysqlDate);
    const friendly = date.toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    });
    return friendly;
  }

  static setMobile(code: string, phone: string): string {
    const safeCode = `${code.substring(1)}${phone}`;

    return safeCode;
  }

  static getDateText(mysqlDate: string): string {
    if (mysqlDate == null) {
      return "";
    } else {
      const date = new Date(mysqlDate);
      return date.toString();
    }
  }
  static getDateDay(mysqlDate: string): number {
    if (mysqlDate == null) {
      return 0;
    } else {
      const date = new Date(mysqlDate);
      return date.getDate();
    }
  }
  static toMySQLFormat(date: Date, includeTime: boolean) {
    const value = date
      .toISOString()
      .slice(0, includeTime ? 19 : 10)
      .replace("T", " ");

    return value;
  }

  static getCurrentPeriodId(): string {
    const date = new Date();
    const periodId = date.toISOString().slice(0, 7).replace("-", "");
    return periodId;
  }

  static getPeriodId(year: number, month: number): string {
    const date = new Date(year, month);
    const periodId = date.toISOString().slice(0, 7).replace("-", "");
    return periodId;
  }

  static getDatePeriodId(date: Date): string {
    const periodId = date.toISOString().slice(0, 7).replace("-", "");
    return periodId;
  }

  static getCurrentPeriodYear(): number {
    const date = new Date();
    const periodId = date.getFullYear();
    return periodId;
  }

  static getCurrentPeriodMonth(): number {
    const date = new Date();
    const periodId = date.getMonth() + 1;

    return periodId;
  }

  static getMonthName(monthNumber: number): string {
    // Month numbers are 1-indexed (1 for January, 12 for December)
    // Date objects use 0-indexed months, so we subtract 1.
    const date = new Date(2000, monthNumber - 1, 1);
    return date.toLocaleString("en-US", { month: "long" });
  }

  static isTokenExpired() {
    try {
      const token = localStorage.getItem("token");

      if (token) {
        const decoded = jwtDecode(token);
        if (!decoded.exp) {
          return true; // no expiry → treat as invalid
        } else {
          const now = Date.now() / 1000; // current time in seconds
          // console.log("token cheque", now, "vs", decoded.exp);
          return decoded.exp < now;
        }
      } else {
        //not found, return true
        return true;
      }
    } catch (e) {
      // invalid token
      return true;
    }
  }

  static getTokenDetails(token: string): any {
    try {
      const decoded = jwtDecode(token);
      return decoded;
    } catch (e) {
      return undefined; // invalid token
    }
  }

  static updateDateDay(dateStr: string, newDay: number) {
    const newDateStr = dateStr.slice(0, 8) + String(newDay).padStart(2, "0");
    return newDateStr;
  }
  static getCurrentTime() {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");

    const mysqlTime = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(
      now.getSeconds(),
    )}`;
    return mysqlTime;
  }
  ///Logs a message to the console
  static log(message: string, type: string = "log") {
    const current = new Date();

    const date =
      current.toDateString() + " " + current.toLocaleTimeString() + " ";

    if (type === "info") {
      console.info(date + AppInfo.appCode + ": " + message);
    } else if (type === "warn") {
      console.warn(date + AppInfo.appCode + ": " + message);
    } else if (type === "error") {
      console.error(date + AppInfo.appCode + ": " + message);
    } else {
      console.log(date + AppInfo.appCode + ": " + message);
    }
  }

  static showMessage(message: string, type = "info") {
    notify(
      {
        message: message,
      },
      type,
      6000,
    );
  }

  static async downloadExcel(name: string, dataArray: any, columnList: any) {
    const endPoint = "data/export-excel";

    const allColumns = Array.from(columnList);

    const columns = allColumns.filter(
      (col: any) =>
        col.type !== "buttons" &&
        col.type !== "selection" &&
        col.type !== "adaptive",
    );

    const dataColumns: any[] = columns.map((col: any) => {
      return {
        caption: col.caption,
        dataField: col.dataField,
        dataType: col.dataType,
      };
    });

    //attempt to get details
    const authtoken = localStorage.getItem("token");
    if (authtoken) {
      const details = Assist.getTokenDetails(authtoken);
      Assist.auditAction(
        details.userid,
        details.sub,
        details.jti,
        "Data Export - Excel",
        null,
        name,
        null,
        details,
        null,
      );
    }

    const postData = {
      filename: name,
      jsonArray: dataArray,
      columns: dataColumns,
    };

    axios({
      method: "post",
      url: `${AppInfo.apiUrl}${endPoint}`,
      data: postData,
      headers: { "Content-Type": "application/json" },
      responseType: "blob",
    })
      .then((response) => {
        // create file link in browser's memory
        const href = URL.createObjectURL(response.data);

        // create "a" HTML element with href to file & click
        const link = document.createElement("a");
        link.href = href;
        link.setAttribute("download", `${name}.xlsx`); //or any other extension
        document.body.appendChild(link);
        link.click();

        // clean up "a" element & remove ObjectURL
        document.body.removeChild(link);
        URL.revokeObjectURL(href);
      })
      .catch((error) => {
        console.log(error);
      });
  }

  /**
   * Downloads a file the API serves as-is, and saves it under the given name.
   *
   * Unlike downloadExcel this sends nothing - it is for endpoints that already
   * produce the file, such as the CSV import templates.
   * @param title
   * @param url path on the API
   * @param filename what to save it as
   */
  static async downloadFile(title: string, url: string, filename: string) {
    Assist.log(
      `Starting to download ${title} from server using url ${AppInfo.apiUrl}${url}`,
      "log",
    );

    return new Promise(function (myResolve, myReject) {
      axios
        .get(`${AppInfo.apiUrl}${url}`, { responseType: "blob" })
        .then((response) => {
          if (response.status !== 200) {
            myReject(
              `Unable to download ${title}. Error code ${response.status}`,
            );
            return;
          }

          const href = URL.createObjectURL(response.data);

          const link = document.createElement("a");
          link.href = href;
          link.setAttribute("download", filename);
          document.body.appendChild(link);
          link.click();

          document.body.removeChild(link);
          URL.revokeObjectURL(href);

          myResolve(filename);
        })
        .catch((err) => {
          Assist.log(`An error occured when downloading ${title}`, "error");
          myReject(`Unable to download ${title}. Please try again`);
        });
    });
  }

  /**
   * Uploads a file to the API as multipart form data.
   *
   * The API reads the file from a field named `file`, so that is what is sent.
   * Any query string belongs on the url, the way the import endpoints take
   * their `imported_by` and `dry_run`.
   * @param title
   * @param url path on the API, query string included
   * @param file the file the user chose
   * @returns the API's response body
   */
  static async uploadFile(title: string, url: string, file: File) {
    Assist.log(
      `Starting to upload ${file.name} for ${title} using url ${AppInfo.apiUrl}${url}`,
      "log",
    );

    const form = new FormData();
    form.append("file", file);

    return new Promise(function (myResolve, myReject) {
      axios({
        method: "post",
        url: `${AppInfo.apiUrl}${url}`,
        data: form,
        headers: { "Content-Type": "multipart/form-data" },
      })
        .then((response) => {
          Assist.log(
            `Response completed for uploading ${title} with status ${response.status}`,
          );

          if (response.status !== 200) {
            myReject(`Unable to upload ${title}. Error code ${response.status}`);
          } else {
            myResolve(response.data);
          }
        })
        .catch((err) => {
          Assist.log(`An error occured when uploading ${title}`, "error");

          let message = `Unable to upload ${title}`;

          if (err.response != null && err.response.data != null) {
            //the API explains a rejected file in its detail
            if (Array.isArray(err.response.data.detail)) {
              message += `: ${err.response.data.detail[0].msg}`;
            } else if (err.response.data.detail) {
              message += `: ${err.response.data.detail}`;
            }
          } else {
            message += ": Please try again";
          }

          myReject(message);
        });
    });
  }

  /**
   * Fetches a PDF from the reporting service and returns a URL the viewer can
   * display, along with the filename the service suggested.
   * @param title
   * @param url path on the reporting service
   * @returns { url, filename, blob }
   */
  static async loadPdf(title: string, url: string): Promise<any> {
    Assist.log(
      `Starting to render ${title} using url ${AppInfo.reportApiUrl}${url}`,
      "log",
    );

    return new Promise(function (resolve, reject) {
      axios
        .get(`${AppInfo.reportApiUrl}${url}`, { responseType: "blob" })
        .then((response) => {
          if (response.status !== 200) {
            reject(`Unable to render ${title}. Error code ${response.status}`);
            return;
          }

          //the service names the file in its Content-Disposition header
          let filename = `${title}.pdf`;
          const disposition = response.headers["content-disposition"];
          if (disposition) {
            const match = /filename="?([^"]+)"?/.exec(disposition);
            if (match) filename = match[1];
          }

          const blob = new Blob([response.data], { type: "application/pdf" });
          resolve({ url: URL.createObjectURL(blob), filename: filename, blob: blob });
        })
        .catch(async (err) => {
          Assist.log(`An error occured when rendering ${title}`, "error");

          let message = `Unable to render ${title}`;

          //an error response is JSON even though a PDF was asked for
          if (err.response && err.response.data) {
            try {
              const text = await err.response.data.text();
              const parsed = JSON.parse(text);
              if (parsed.detail) message += `: ${parsed.detail}`;
            } catch (x) {
              message += ": Please try again";
            }
          } else {
            message += ": Please try again";
          }

          reject(message);
        });
    });
  }

  /**
   * Load data from the specified URL
   * @param title
   * @param url
   * @returns
   */
  static async loadData(title: string, url: string) {
    Assist.log(
      `Starting to load ${title} from server using url ${AppInfo.apiUrl}${url}`,
      "log",
    );

    return new Promise(function (resolve, reject) {
      axios
        .get(`${AppInfo.apiUrl}${url}`)
        .then((response) => {
          Assist.log(
            `Response completed for loading ${title} from server with status ${response.status}`,
          );

          if (response.status !== 200) {
            reject(`Unable to load ${title}. Error code ${response.status}`);
          } else {
            resolve(response.data);
          }
        })
        .catch((err) => {
          Assist.log(
            `An error occured when loading ${title} from server: ${JSON.stringify(
              err,
            )}`,
          );

          //user friendly message
          let message = `Unable to load ${title} `;

          //check for response
          if (err.response != null) {
            //check if error 404
            if ((err.response.status = 404)) {
              //add detail
              message += `: ${err.response.data.detail}`;
            }
          } else {
            //no response object
            message += ": Please try again";
          }
          reject(message);
        });
    });
  }

  /**
   * Audits the specified action
   * @param userId
   * @param userEmail
   * @param tokenId
   * @param featureId
   * @param objectId
   * @param actionId
   * @param before
   * @param after
   */
  static async auditAction(
    userId: number,
    userEmail: string,
    tokenId: string,
    featureId: string,
    objectId: number | null,
    actionId: string,
    beforeData: unknown,
    afterData: unknown,
    model: string | null,
  ) {
    const url = AppInfo.auditApiUrl;

    Assist.log(
      `Starting to audit feature '${featureId}' with action '${actionId} using url ${AppInfo.apiUrl}${url}`,
      "log",
    );

    const today = new Date();
    const now = today.toISOString().split("T")[0];

    const postData = {
      user_id: userId,
      user_email: userEmail,
      date: `${now} ${Assist.getCurrentTime()}`,
      token: tokenId,
      feature: featureId,
      object_id: objectId,
      action: actionId,
      before: beforeData,
      after: afterData,
      created_by: userEmail,
    };

    setTimeout(() => {
      Assist.postPutData("Audit", url, postData, 0)
        .then((data) => {
          Assist.log(
            `Success auditing feature '${featureId}' with action '${actionId} using url ${AppInfo.apiUrl}${url}`,
            "log",
          );
        })
        .catch((message) => {
          Assist.log(
            `Error auditing feature '${featureId}' with action '${actionId} using url ${AppInfo.apiUrl}${url}: ${message}`,
            "error",
          );
        });
    }, Assist.DEV_DELAY);
  }

  /**
   * Post or puts the data at the specified url
   * @param title
   * @param url
   * @param postData
   * @param id
   * @returns Promise
   */
  static async postPutData(
    title: string,
    url: string,
    postData: any,
    id: Number,
  ) {
    const method = id == 0 ? "post" : "put";
    const verb = id == 0 ? "post" : "put";

    Assist.log(
      `Starting to ${title} with id {key} from server using url ${
        AppInfo.apiUrl + url
      }`,
      "log",
    );

    return new Promise(function (myResolve, myReject) {
      axios({
        method: method,
        url: `${AppInfo.apiUrl}${url}`,
        data: postData,
      })
        .then((response) => {
          Assist.log(
            `Response completed when performing ${method} for ${title} from server with status ${response.status}`,
          );

          if (response.status !== 200) {
            myReject(
              `Unable to ${verb} ${title}. Error code ${response.status}`,
            );
          } else {
            myResolve(response.data);
          }
        })
        .catch((err) => {
          Assist.log(
            `An error occured when performing ${method} for ${title} from server`,
          );

          //user friendly message
          let message = `Unable to ${title} `;

          //check for response
          if (err.response != null) {
            //check if failed login attempt
            if (err.response.status == 401 && url == "auth/login") {
              Assist.auditAction(
                0,
                postData.get("username"),
                "public",
                "Authentication",
                null,
                `Unauthorised`,
                null,
                null,
                null,
              );
            }
            //check if error is present
            if (Array.isArray(err.response.data.detail)) {
              const field = err.response.data.detail[0].loc[1];
              message += `: ${err.response.data.detail[0].msg} ${field}`;
            } else {
              //add detail
              message += `: ${err.response.data.detail}`;
            }
          } else {
            //no response object
            message += ": Please try again";
          }

          myReject(message);
        });
    });
  }

  /**Deletes the specified item
   * @param {string} title The tile of the item being deleted
   * @param {string} key The id of the record to delete
   * @param {string} url The url used for the post method
   * @returns TaskResult
   */
  static async deleteItem(title: string, url: string, key: string) {
    Assist.log(
      `Starting to delete ${title} with id {key} from server using url ${
        AppInfo.apiUrl + url
      }`,
      "log",
    );

    return new Promise(function (myResolve, myReject) {
      axios({
        method: "post",
        url: AppInfo.apiUrl + url,
        data: { uid: key },
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      })
        .then((response) => {
          Assist.log(
            `Response has completed for deleting ${title} from server`,
          );

          if (typeof response.data == "string") {
            Assist.log(
              `Unable to process response for deleting ${title} from server: ${JSON.stringify(
                response,
              )}`,
            );

            myReject(
              new TaskResult(
                false,
                "Unable to process server response from server",
                null,
              ),
            );
          } else {
            if (response.data.succeeded) {
              myResolve(new TaskResult(true, "", response.data.items));
            } else {
              Assist.log(
                `Unable to delete ${title} from server: ${response.data.message}`,
              );
              myReject(new TaskResult(false, response.data.message, null));
            }
          }
        })
        .catch((error) => {
          Assist.log(
            `An error occured when deleting ${title} from server: ${JSON.stringify(
              error,
            )}`,
          );
          myReject(
            new TaskResult(
              false,
              `An error occured when deleting ${title} from server`,
              null,
            ),
          );
        });
    });
  }

  static async downloadJson(filename: string, jsonData: string) {
    const url = "downloadJson";

    Assist.log(
      `Starting to download JSON with filename ${filename} and except ${jsonData.substring(
        0,
        10,
      )} from server using url ${AppInfo.apiUrl + url}`,
      "log",
    );

    return new Promise(function (myResolve, myReject) {
      axios({
        method: "post",
        url: AppInfo.apiUrl + url,
        data: { ufilename: filename, ujson: jsonData },
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        responseType: "blob",
      })
        .then((response) => {
          // create file link in browser's memory
          const href = URL.createObjectURL(response.data);

          // create "a" HTML element with href to file & click
          const link = document.createElement("a");
          link.href = href;
          link.setAttribute("download", `${filename}.csv`); //or any other extension
          document.body.appendChild(link);
          link.click();

          // clean up "a" element & remove ObjectURL
          document.body.removeChild(link);
          URL.revokeObjectURL(href);
        })
        .catch((error) => {
          Assist.log(
            `An error occured when downloading JSON with filename ${filename} and except ${jsonData.substring(
              0,
              10,
            )} from server: ${JSON.stringify(error)}`,
          );
          myReject(
            new TaskResult(
              false,
              `An error occured when downloading the file`,
              null,
            ),
          );
        });
    });
  }
  /**Logs the login for the specified user
   * @param {string} username The username of the user
   * @param {string} source The source of the login
   * @returns TaskResult
   */
  static async addLogin(username: string, source: string) {
    const url = "login/update";

    Assist.log(
      `Starting to login ${username} with source ${source} from server using url ${
        AppInfo.apiUrl + url
      }`,
      "log",
    );

    return new Promise(function (myResolve, myReject) {
      axios({
        method: "post",
        url: AppInfo.apiUrl + url,
        data: { uid: 0, uusername: username, usource: source },
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      })
        .then((response) => {
          Assist.log(
            `Response has completed for logging login for ${username} from server`,
          );

          if (typeof response.data == "string") {
            Assist.log(
              `Unable to process response for logging login ${username} from server: ${JSON.stringify(
                response,
              )}`,
            );

            myReject(
              new TaskResult(
                false,
                "Unable to process server response from server",
                null,
              ),
            );
          } else {
            if (response.data.succeeded) {
              myResolve(
                new TaskResult(
                  true,
                  `Successfully logged the login event for ${username}`,
                  response.data.items,
                ),
              );
            } else {
              Assist.log(
                `Unable to log login for ${username} from server: ${response.data.message}`,
              );
              myReject(new TaskResult(false, response.data.message, null));
            }
          }
        })
        .catch((error) => {
          Assist.log(
            `An error occured when logging login for ${username} from server: ${JSON.stringify(
              error,
            )}`,
          );
          myReject(
            new TaskResult(
              false,
              `An error occured when logging login for ${username} from server`,
              null,
            ),
          );
        });
    });
  }

  /**Adds the specified audit action in the database
   * @param {string} title The title of the audit
   * @param {string} action The action of the log
   * @param {string} description The description of the log
   * @param {string} exception The exception of the log
   * @returns TaskResult
   */
  static async addAudit(
    username: string,
    title: string,
    action: string,
    description: string,
  ) {
    const url = "audit/update";

    Assist.log(
      `Starting to audit ${title} with from server using url ${
        AppInfo.apiUrl + url
      }`,
      "log",
    );

    return new Promise(function (myResolve, myReject) {
      axios({
        method: "post",
        url: AppInfo.apiUrl + url,
        data: {
          uid: 0,
          uusername: username,
          utitle: title,
          uaction: action,
          udescription: description,
        },
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      })
        .then((response) => {
          Assist.log(`Response has completed for audit ${title} from server`);

          if (typeof response.data == "string") {
            Assist.log(
              `Unable to process response for audit ${title} from server: ${JSON.stringify(
                response,
              )}`,
            );

            myReject(
              new TaskResult(
                false,
                "Unable to process server response from server",
                null,
              ),
            );
          } else {
            if (response.data.succeeded) {
              myResolve(
                new TaskResult(
                  true,
                  `Successfully added the audit for ${title}`,
                  response.data.items,
                ),
              );
            } else {
              Assist.log(
                `Unable to audit ${title} from server: ${response.data.message}`,
              );
              myReject(new TaskResult(false, response.data.message, null));
            }
          }
        })
        .catch((error) => {
          Assist.log(
            `An error occured when auditing ${title} from server: ${JSON.stringify(
              error,
            )}`,
          );
          myReject(
            new TaskResult(
              false,
              `An error occured when auditting ${title} from server`,
              null,
            ),
          );
        });
    });
  }

  /**Logs the specified action in the database
   * @param {string} title The title of the log
   * @param {string} action The action of the log
   * @param {string} description The description of the log
   * @param {string} exception The exception of the log
   * @returns TaskResult
   */
  static async addLog(
    username: string,
    title: string,
    action: string,
    description: string,
    exception: string,
  ) {
    const url = "log/update";

    Assist.log(
      `Starting to log ${title} with from server using url ${
        AppInfo.apiUrl + url
      }`,
      "log",
    );

    return new Promise(function (myResolve, myReject) {
      axios({
        method: "post",
        url: AppInfo.apiUrl + url,
        data: {
          uid: 0,
          uusername: username,
          utitle: title,
          uaction: action,
          udescription: description,
          uexception: exception === null ? "" : JSON.stringify(exception),
        },
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      })
        .then((response) => {
          Assist.log(`Response has completed for log ${title} from server`);

          if (typeof response.data == "string") {
            Assist.log(
              `Unable to process response for log ${title} from server: ${JSON.stringify(
                response,
              )}`,
            );

            myReject(
              new TaskResult(
                false,
                "Unable to process server response from server",
                null,
              ),
            );
          } else {
            if (response.data.succeeded) {
              myResolve(new TaskResult(true, "", response.data.items));
            } else {
              Assist.log(
                `Unable to log ${title} from server: ${response.data.message}`,
              );
              myReject(new TaskResult(false, response.data.message, null));
            }
          }
        })
        .catch((error) => {
          Assist.log(
            `An error occured when logging ${title} from server: ${JSON.stringify(
              error,
            )}`,
          );
          myReject(
            new TaskResult(
              false,
              `An error occured when logging ${title} from server`,
              null,
            ),
          );
        });
    });
  }

  static processFileUpload(e: any) {
    let result = new TaskResult(false, "", null);

    if (e.request.status === 200) {
      try {
        const res = JSON.parse(e.request.response);

        console.log("runq", res);

        if (res === null) {
          Assist.showMessage(
            `The response from the server is invalid. Please try again`,
            "error",
          );
        } else {
          if (res.Succeeded) {
            result = new TaskResult(
              true,
              "",
              `${AppInfo.fileServer}${res.Data}`,
            );
          } else {
            Assist.showMessage(res.Message, "error");
          }
        }
      } catch (x) {
        Assist.showMessage(
          `Unable to process response from server. Please try again`,
          "error",
        );
      }
    } else {
      Assist.showMessage(
        `Unable to upload thumbnail image. Please try again`,
        "error",
      );
    }

    return result;
  }
}

export default Assist;
