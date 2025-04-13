export interface Commit {
    sha: string;
    node_id: string;
    commit: {
      author: {
        name: string;
        email: string;
        date: string;
      };
      committer: {
        name: string;
        email: string;
        date: string;
      };
      message: string;
      tree: {
        sha: string;
        url: string;
      };
      url: string;
      comment_count: number;
    };
    files?: {
      filename: string;
      status: 'added' | 'modified' | 'removed';
      changes: number;
    }[];
    url: string;
    html_url: string;
    comments_url: string;
    author: {
      login: string;
      id: number;
    };
    committer: {
      login: string;
      id: number;
    };
    parents: {
      sha: string;
      url: string;
      html_url: string;
    }[];
  }