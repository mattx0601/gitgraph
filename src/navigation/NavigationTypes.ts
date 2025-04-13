export type RootStackParamList = {
    Login: undefined;
    Graph: { 
      owner?: string;
      repo?: string;
      fromSelection?: boolean;
    };
    Repository: undefined;
    RepositorySelection: undefined;
  };