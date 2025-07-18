import React, { useState } from 'react';
import { useOverlapAnalysis } from '../hooks/useOverlapAnalysis';

interface OverlapMatrixProps {
  repoPath: string;
}

export const OverlapMatrix: React.FC<OverlapMatrixProps> = ({ repoPath }) => {
  const { overlapAnalysis, loading, error, analyzeOverlaps } = useOverlapAnalysis(repoPath);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const getRiskColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRiskBadgeColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString();
  };

  const getFileName = (filePath: string) => {
    return filePath.split('/').pop() || filePath;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card bg-red-50 border-red-200">
        <div className="text-red-600 font-medium">Error analyzing overlaps</div>
        <div className="text-red-500 text-sm mt-1">{error}</div>
        <button onClick={analyzeOverlaps} className="btn-secondary mt-2">
          Retry
        </button>
      </div>
    );
  }

  if (!overlapAnalysis) {
    return (
      <div className="card text-center text-secondary-500">
        <p>No overlap analysis available. Click "Analyze Overlaps" to start.</p>
        <button onClick={analyzeOverlaps} className="btn-primary mt-2">
          Analyze Overlaps
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-secondary-900">Overlap Analysis</h2>
        <button onClick={analyzeOverlaps} className="btn-secondary">
          Refresh Analysis
        </button>
      </div>

      {/* Risk Assessment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-blue-50 border-blue-200">
          <div className="text-2xl font-bold text-blue-600">{overlapAnalysis.totalOverlaps}</div>
          <div className="text-sm text-blue-500">Total Overlaps</div>
        </div>
        <div className="card bg-green-50 border-green-200">
          <div className="text-2xl font-bold text-green-600">{overlapAnalysis.riskAssessment.low}</div>
          <div className="text-sm text-green-500">Low Risk</div>
        </div>
        <div className="card bg-yellow-50 border-yellow-200">
          <div className="text-2xl font-bold text-yellow-600">{overlapAnalysis.riskAssessment.medium}</div>
          <div className="text-sm text-yellow-500">Medium Risk</div>
        </div>
        <div className="card bg-red-50 border-red-200">
          <div className="text-2xl font-bold text-red-600">{overlapAnalysis.riskAssessment.high}</div>
          <div className="text-sm text-red-500">High Risk</div>
        </div>
      </div>

      {/* Recommendations */}
      {overlapAnalysis.recommendations.length > 0 && (
        <div className="card bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Recommendations</h3>
          <ul className="space-y-2">
            {overlapAnalysis.recommendations.map((recommendation, index) => (
              <li key={index} className="text-blue-800 flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* File Overlap Matrix */}
      <div className="card">
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">File Overlaps</h3>
        
        {overlapAnalysis.fileOverlaps.length === 0 ? (
          <div className="text-center text-secondary-500 py-8">
            <svg className="w-16 h-16 mx-auto mb-4 text-secondary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>No file overlaps detected!</p>
            <p className="text-sm">All worktrees are working on separate files.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {overlapAnalysis.fileOverlaps.map((overlap, index) => (
              <div 
                key={index}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedFile === overlap.filePath 
                    ? 'border-primary-500 bg-primary-50' 
                    : getRiskColor(overlap.conflictRisk)
                }`}
                onClick={() => setSelectedFile(
                  selectedFile === overlap.filePath ? null : overlap.filePath
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getRiskBadgeColor(overlap.conflictRisk)}`}></div>
                    <div>
                      <div className="font-medium text-secondary-900">{getFileName(overlap.filePath)}</div>
                      <div className="text-sm text-secondary-600">{overlap.filePath}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-secondary-500">
                      {overlap.worktrees.length} worktrees
                    </span>
                    <svg 
                      className={`w-4 h-4 text-secondary-400 transition-transform ${
                        selectedFile === overlap.filePath ? 'rotate-180' : ''
                      }`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {selectedFile === overlap.filePath && (
                  <div className="mt-4 pt-4 border-t border-primary-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-secondary-900 mb-2">Affected Worktrees</h4>
                        <div className="space-y-1">
                          {overlap.worktrees.map((worktree, wIndex) => (
                            <div key={wIndex} className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                              <span className="text-sm text-secondary-700">{worktree}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-secondary-900 mb-2">Last Modified</h4>
                        <div className="space-y-1">
                          {Object.entries(overlap.lastModified).map(([worktree, date]) => (
                            <div key={worktree} className="text-sm">
                              <span className="text-secondary-600">{worktree}:</span>{' '}
                              <span className="text-secondary-700">{formatDate(date)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-secondary-700">Conflict Risk:</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getRiskColor(overlap.conflictRisk)}`}>
                          {overlap.conflictRisk.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};