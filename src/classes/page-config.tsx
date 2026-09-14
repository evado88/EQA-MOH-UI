///Represents the configuration for a page
class PageConfig {
  Title: string;
  Url: string;
  DeleteUrl: string;
  Single: string;
  Id: number;
  UpdateUrl: string;
  Permissions: Number[] | undefined;
  /**
   * Creates a new page onfiguration
   * @param title
   * @param url
   * @param deleteUrl
   * @param single
   * @param plural
   */
  constructor(
    title: string,
    url: string,
    deleteUrl: string,
    single: string,
    updateUrl: string,
    permissions?: number[]
  ) {
    this.Title = title;
    this.Url = url;
    this.DeleteUrl = deleteUrl;
    this.Single = single;
    this.Id = 0;
    this.UpdateUrl = updateUrl;
    this.Permissions= permissions
  }

  verb() {
    return this.Id == 0 ? "Add" : "Update";
  }
}

export default PageConfig;
