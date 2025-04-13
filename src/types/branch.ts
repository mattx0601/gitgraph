export interface Branch {
    name: string;
    commit: {
      sha: string;
      url: string;
    };
    html_url: string;
    protected?: boolean;
    isMain?: boolean;
  }