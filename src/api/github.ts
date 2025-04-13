import axios from 'axios';
import { Branch } from '../types/branch';
import { Commit } from '../types/commit';

interface FetchBranchesParams {
  owner: string;
  repo: string;
  token: string;
}

export const fetchRepositoryBranches = async (
  params: FetchBranchesParams
): Promise<Branch[]> => {

  const response = await axios.get<Branch[]>(
    `https://api.github.com/repos/${params.owner}/${params.repo}/branches`,
    {
      params: { per_page: 20 },
      headers: {
        Authorization: `token ${params.token}`,
      },
    }
  );
  
  if (response.status !== 200) {
    console.error(`Error fetching branches: ${response.statusText}`);
  }

  return response.data.map(branch => ({
    ...branch,
    isMain: branch.name === 'main' || branch.name === 'master'
  }));};

interface FetchCommitsParams {
  owner: string;
  repo: string;
  branch: string;
  token: string;
}

export const fetchBranchCommits = async (
  params: FetchCommitsParams
): Promise<Commit[]> => {
  const response = await axios.get<Commit[]>(
    `https://api.github.com/repos/${params.owner}/${params.repo}/commits`,
    {
      params: { sha: params.branch, per_page: 40 },
      headers: {
        Authorization: `token ${params.token}`,
        Accept: 'application/vnd.github.v3+json'

      },
    }
  );
  const commitsWithFiles = await Promise.all(
    response.data.map(async (commit) => {
      try {
        const filesRes = await axios.get(
          `https://api.github.com/repos/${params.owner}/${params.repo}/commits/${commit.sha}`,
          
          {
            params: { per_page: 20 },
            headers: { Authorization: `token ${params.token}` } }
        );
        return { ...commit, files: filesRes.data.files };
      } catch {
        return commit;
      }
    })
  );
  
  return commitsWithFiles;
};

