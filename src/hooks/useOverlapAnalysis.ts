import { useState, useEffect } from 'react';
import { invoke } from '../utils/tauri';
import { OverlapAnalysis, DependencyNode } from '../types';

export interface UseOverlapAnalysisResult {
  overlapAnalysis: OverlapAnalysis | null;
  dependencies: DependencyNode[];
  loading: boolean;
  error: string | null;
  analyzeOverlaps: () => Promise<void>;
  analyzeDependencies: (filePaths: string[]) => Promise<void>;
}

export function useOverlapAnalysis(repoPath: string): UseOverlapAnalysisResult {
  const [overlapAnalysis, setOverlapAnalysis] = useState<OverlapAnalysis | null>(null);
  const [dependencies, setDependencies] = useState<DependencyNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeOverlaps = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await invoke<any>('analyze_worktree_overlaps', { repoPath });
      
      const mappedAnalysis: OverlapAnalysis = {
        totalOverlaps: result.total_overlaps,
        fileOverlaps: result.file_overlaps.map((overlap: any) => ({
          filePath: overlap.file_path,
          worktrees: overlap.worktrees,
          conflictRisk: overlap.conflict_risk as 'low' | 'medium' | 'high',
          lastModified: Object.fromEntries(
            Object.entries(overlap.last_modified).map(([key, value]) => [
              key,
              new Date(value as string),
            ])
          ),
        })),
        riskAssessment: {
          low: result.risk_assessment.low,
          medium: result.risk_assessment.medium,
          high: result.risk_assessment.high,
        },
        recommendations: result.recommendations,
      };
      
      setOverlapAnalysis(mappedAnalysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze overlaps');
    } finally {
      setLoading(false);
    }
  };

  const analyzeDependencies = async (filePaths: string[]) => {
    try {
      setLoading(true);
      setError(null);
      const result = await invoke<any[]>('analyze_file_dependencies', { repoPath, filePaths });
      
      const mappedDependencies: DependencyNode[] = result.map((dep: any) => ({
        id: dep.file_path,
        name: dep.file_path.split('/').pop() || dep.file_path,
        type: 'file' as const,
        path: dep.file_path,
        dependencies: dep.dependencies,
        dependents: dep.dependents,
        impactScore: dep.impact_score,
      }));
      
      setDependencies(mappedDependencies);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze dependencies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (repoPath) {
      analyzeOverlaps();
    }
  }, [repoPath]);

  return {
    overlapAnalysis,
    dependencies,
    loading,
    error,
    analyzeOverlaps,
    analyzeDependencies,
  };
}