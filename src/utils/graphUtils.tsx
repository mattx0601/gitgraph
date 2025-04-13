import { Commit} from '../types/commit';
import { Branch } from '../types/branch';

export const organizeCommitsIntoGraph = (commits: Commit[], branches: Branch[]) => {

  return commits.map((commit, index) => {
    const isBranchHead = branches.some(b => b.commit.sha === commit.sha);
    
    return {
      ...commit,
      x: index * 10,
      y: isBranchHead ? 0 : 50,
      color: isBranchHead ? '#28a745' : '#0366d6',
    };
  });
};

export const calculateCommitLinks = (commits: Commit[]) => {
  return commits.flatMap(commit => {
    if (!commit.parents || commit.parents.length === 0) return [];
    return commit.parents.map(parent => ({
      source: parent.sha,
      target: commit.sha,
    }));
  });
};