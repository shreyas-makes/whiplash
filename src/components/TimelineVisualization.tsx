import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface CommitNode {
  id: string;
  name: string;
  filePath: string;
  worktree: 'frontend' | 'backend' | 'shared';
  lastCommit: Date;
  dependencies: string[];
  x?: number;
  y?: number;
}

interface Commit {
  id: string;
  message: string;
  timestamp: Date;
  worktree: 'frontend' | 'backend';
  files: string[];
  author: string;
}

interface TimelineVisualizationProps {
  repoPath: string;
}

export const TimelineVisualization: React.FC<TimelineVisualizationProps> = ({ repoPath }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [nodes, setNodes] = useState<CommitNode[]>([]);
  const [currentCommitIndex, setCurrentCommitIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timelineValue, setTimelineValue] = useState([0]);

  // Mock data for demonstration
  useEffect(() => {
    const mockCommits: Commit[] = [
      {
        id: 'c1',
        message: 'Initialize React components',
        timestamp: new Date('2024-01-01T10:00:00'),
        worktree: 'frontend',
        files: ['components/App.tsx', 'components/Header.tsx'],
        author: 'Frontend Agent'
      },
      {
        id: 'c2',
        message: 'Add API endpoints',
        timestamp: new Date('2024-01-01T10:30:00'),
        worktree: 'backend',
        files: ['api/users.rs', 'types/index.ts'],
        author: 'Backend Agent'
      },
      {
        id: 'c3',
        message: 'Update shared types',
        timestamp: new Date('2024-01-01T11:00:00'),
        worktree: 'frontend',
        files: ['types/index.ts', 'components/UserList.tsx'],
        author: 'Frontend Agent'
      },
      {
        id: 'c4',
        message: 'Implement authentication',
        timestamp: new Date('2024-01-01T11:30:00'),
        worktree: 'backend',
        files: ['auth/mod.rs', 'types/index.ts'],
        author: 'Backend Agent'
      },
      {
        id: 'c5',
        message: 'Add login component',
        timestamp: new Date('2024-01-01T12:00:00'),
        worktree: 'frontend',
        files: ['components/Login.tsx', 'hooks/useAuth.ts'],
        author: 'Frontend Agent'
      },
    ];

    const mockNodes: CommitNode[] = [
      {
        id: 'app',
        name: 'App.tsx',
        filePath: 'components/App.tsx',
        worktree: 'frontend',
        lastCommit: new Date('2024-01-01T10:00:00'),
        dependencies: ['header', 'userlist']
      },
      {
        id: 'header',
        name: 'Header.tsx',
        filePath: 'components/Header.tsx',
        worktree: 'frontend',
        lastCommit: new Date('2024-01-01T10:00:00'),
        dependencies: []
      },
      {
        id: 'userlist',
        name: 'UserList.tsx',
        filePath: 'components/UserList.tsx',
        worktree: 'frontend',
        lastCommit: new Date('2024-01-01T11:00:00'),
        dependencies: ['types']
      },
      {
        id: 'login',
        name: 'Login.tsx',
        filePath: 'components/Login.tsx',
        worktree: 'frontend',
        lastCommit: new Date('2024-01-01T12:00:00'),
        dependencies: ['useauth', 'types']
      },
      {
        id: 'useauth',
        name: 'useAuth.ts',
        filePath: 'hooks/useAuth.ts',
        worktree: 'frontend',
        lastCommit: new Date('2024-01-01T12:00:00'),
        dependencies: ['types']
      },
      {
        id: 'types',
        name: 'types/index.ts',
        filePath: 'types/index.ts',
        worktree: 'shared',
        lastCommit: new Date('2024-01-01T11:30:00'),
        dependencies: []
      },
      {
        id: 'users-api',
        name: 'users.rs',
        filePath: 'api/users.rs',
        worktree: 'backend',
        lastCommit: new Date('2024-01-01T10:30:00'),
        dependencies: ['types']
      },
      {
        id: 'auth-api',
        name: 'auth/mod.rs',
        filePath: 'auth/mod.rs',
        worktree: 'backend',
        lastCommit: new Date('2024-01-01T11:30:00'),
        dependencies: ['types']
      },
    ];

    setCommits(mockCommits);
    setNodes(mockNodes);
  }, [repoPath]);

  const currentCommit = commits[currentCommitIndex];

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    const width = 800;
    const height = 600;

    svg.selectAll('*').remove();

    const g = svg.append('g');

    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(getLinks()).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));

    // Create links
    const link = g.append('g')
      .selectAll('line')
      .data(getLinks())
      .enter()
      .append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 2);

    // Create nodes
    const node = g.append('g')
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', 20)
      .attr('fill', getNodeColor)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Add node labels
    const labels = g.append('g')
      .selectAll('text')
      .data(nodes)
      .enter()
      .append('text')
      .text(d => d.name)
      .attr('font-size', 10)
      .attr('dx', 25)
      .attr('dy', 4);

    // Add active indicators
    const activeIndicators = g.append('g')
      .selectAll('circle')
      .data(getActiveNodes())
      .enter()
      .append('circle')
      .attr('r', 8)
      .attr('fill', 'red')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y);

      labels
        .attr('x', (d: any) => d.x)
        .attr('y', (d: any) => d.y);

      activeIndicators
        .attr('cx', (d: any) => {
          const nodeData = nodes.find(n => n.id === d.id);
          return nodeData?.x || 0;
        })
        .attr('cy', (d: any) => {
          const nodeData = nodes.find(n => n.id === d.id);
          return nodeData?.y || 0;
        });
    });

    function getLinks() {
      const links: Array<{source: string, target: string}> = [];
      nodes.forEach(node => {
        node.dependencies.forEach(depId => {
          links.push({ source: node.id, target: depId });
        });
      });
      return links;
    }

    function getNodeColor(d: CommitNode) {
      switch (d.worktree) {
        case 'frontend': return '#3b82f6'; // blue
        case 'backend': return '#10b981'; // green
        case 'shared': return '#f59e0b'; // amber
        default: return '#6b7280'; // gray
      }
    }

    function getActiveNodes() {
      if (!currentCommit) return [];
      return currentCommit.files.map(filePath => {
        return nodes.find(node => node.filePath === filePath)?.id;
      }).filter(Boolean).map(id => ({ id }));
    }

  }, [nodes, currentCommitIndex]);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentCommitIndex(prev => {
        if (prev >= commits.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isPlaying, commits.length]);

  useEffect(() => {
    setTimelineValue([currentCommitIndex]);
  }, [currentCommitIndex]);

  const handleTimelineChange = (value: number[]) => {
    setCurrentCommitIndex(value[0]);
    setTimelineValue(value);
    setIsPlaying(false);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setCurrentCommitIndex(0);
    setIsPlaying(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-secondary-900">Timeline Visualization</h2>
        <div className="flex items-center gap-2">
          <Button onClick={handleReset} variant="outline" size="sm">
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button onClick={handlePlayPause} variant="outline" size="sm">
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Network Graph */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Codebase Network</CardTitle>
            </CardHeader>
            <CardContent>
              <svg
                ref={svgRef}
                width="100%"
                height="600"
                viewBox="0 0 800 600"
                className="border rounded"
              />
            </CardContent>
          </Card>
        </div>

        {/* Current Commit Info */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Commit</CardTitle>
            </CardHeader>
            <CardContent>
              {currentCommit ? (
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium">Message</div>
                    <div className="text-sm text-secondary-600">{currentCommit.message}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Worktree</div>
                    <div className={`inline-block px-2 py-1 text-xs rounded ${
                      currentCommit.worktree === 'frontend' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {currentCommit.worktree}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Files Changed</div>
                    <div className="space-y-1">
                      {currentCommit.files.map((file, index) => (
                        <div key={index} className="text-xs font-mono text-secondary-600">
                          {file}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Timestamp</div>
                    <div className="text-sm text-secondary-600">
                      {currentCommit.timestamp.toLocaleString()}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-secondary-500">No commit selected</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Legend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                  <span className="text-sm">Frontend</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500"></div>
                  <span className="text-sm">Backend</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-amber-500"></div>
                  <span className="text-sm">Shared</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500"></div>
                  <span className="text-sm">Active in Commit</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Timeline Slider */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="px-4">
              <Slider
                value={timelineValue}
                onValueChange={handleTimelineChange}
                max={commits.length - 1}
                step={1}
                className="w-full"
              />
            </div>
            <div className="flex justify-between text-xs text-secondary-500">
              <span>Start</span>
              <span>Commit {currentCommitIndex + 1} of {commits.length}</span>
              <span>End</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};