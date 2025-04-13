import { create } from 'zustand';
import { fetchRepositoryBranches, fetchBranchCommits } from '../api/github';
import { Branch } from '../types/branch';
import { Commit } from '../types/commit';

interface RepositoryState {
    currentOwner: string | null;
    currentRepo: string | null;
    branches: Branch[];
    commits: Commit[];
    selectedBranch: string | null;
    isLoading: boolean;
    error: string | null;
    setCurrentRepository: (owner: string, repo: string) => void;
    loadBranches: (owner: string, repo: string, token: string) => Promise<void>;
    loadCommits: (owner: string, repo: string, branch: string, token: string) => Promise<void>;
    selectBranch: (branch: string) => void;
    clearError: () => void;
}

export const useRepositoryStore = create<RepositoryState>((set, get) => ({
    currentOwner: 'facebook',
    currentRepo: 'react',
    branches: [],
    commits: [],
    selectedBranch: "",
    isLoading: false,
    error: null,
    setCurrentRepository: (owner, repo) => set({ currentOwner: owner, currentRepo: repo }),
    loadBranches: async (owner, repo, token) => {
        if (!token) throw new Error('Not authenticated');

        set({ isLoading: true, error: null });
        try {
            const branches = await fetchRepositoryBranches({ owner, repo, token });

            const mainBranch = branches.find(b => b.isMain);

            set({ branches, selectedBranch: mainBranch?.name || branches[0]?.name || null, isLoading: false });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to load branches';
            set({ error: message, isLoading: false });
            throw error;
        }
    },
    loadCommits: async (owner, repo, branch, token) => {
        if (!token) throw new Error('Not authenticated');
        const { branches } = get();
        let branchToLoad = branch;
        
        if (!branchToLoad || !branches.some(b => b.name === branchToLoad)) {
            const mainBranch = branches.find(b => b.name === 'main');
            const masterBranch = branches.find(b => b.name === 'master');
            branchToLoad = mainBranch?.name || masterBranch?.name || branches[0]?.name;
        }
        
        if (!branchToLoad) {
            return;
        }
    
        set({ isLoading: true, error: null, selectedBranch: branchToLoad });
        try {
            const commits = await fetchBranchCommits({ 
                owner, 
                repo, 
                branch: branchToLoad, 
                token 
            });            
            set({ commits, isLoading: false });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to load commits';
            set({ error: message, isLoading: false });
            throw error;
        }
    },
    selectBranch: (branch) => set({ selectedBranch: branch }),
    clearError: () => set({ error: null }),
}));