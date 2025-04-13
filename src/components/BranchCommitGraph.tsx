import React, { useEffect, useMemo, useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Linking } from 'react-native';
import Svg, { G, Circle, Text as SvgText, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import * as d3 from 'd3';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Branch } from '../types/branch';
import { Commit } from '../types/commit';

interface Node {
  id: string;
  type: 'branch' | 'commit' | 'file';
  name: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  data: any;
  fixed?: boolean;
}

interface Link {
  source: string;
  target: string;
  type: 'branch-commit' | 'commit-commit' | 'commit-file';
  color: string;
}

const BranchCommitGraph = ({ branches, commits, selectedBranch }: {
  branches: Branch[];
  commits: Commit[];
  selectedBranch: string | null;
}) => {
  const { width } = Dimensions.get('window');
  const graphWidth = width - 40;
  const graphHeight = 1000;

  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const [scale, setScale] = useState(0.5);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const baseScale = useRef(0.5);
  const baseTranslate = useRef({ x: 0, y: 0 });


  const getBoundedTranslate = (newTranslate: { x: number, y: number }) => {
    const contentWidth = graphWidth * scale;
    const contentHeight = graphHeight * scale;
    const maxX = Math.max(0, (contentWidth - graphWidth) / 2);
    const maxY = Math.max(0, (contentHeight - graphHeight) / 2);

    return {
      x: Math.max(-maxX, Math.min(maxX, newTranslate.x)),
      y: Math.max(-maxY, Math.min(maxY, newTranslate.y))
    };
  };

  useMemo(() => {
    const newNodes: Node[] = [];
    const newLinks: Link[] = [];
    const fileNodes = new Map<string, Node>();
    const nodeIds = new Set<string>();

    const branchAngleStep = (2 * Math.PI) / Math.max(branches.length, 1);
    const branchRadius = Math.min(graphWidth, graphHeight) * 0.3;

    branches.forEach((branch, index) => {
      const angle = index * branchAngleStep;
      const nodeId = `branch-${branch.name}`;
      nodeIds.add(nodeId);

      const x = graphWidth / 2 + branchRadius * Math.cos(angle);
      const y = graphHeight / 2 + branchRadius * Math.sin(angle);

      newNodes.push({
        id: nodeId,
        type: 'branch',
        name: branch.name,
        x: x,
        y: y,
        radius: 20,
        color: branch.name === selectedBranch ? '#6f42c1' :
          branch.name === 'main' || branch.name === 'master' ? '#0366d6' : '#6a737d',
        data: branch,
        fixed: true
      });
    });

    const mainBranch = branches.find(b => b.name === 'main' || b.name === 'master');
    if (mainBranch) {
      const mainBranchId = `branch-${mainBranch.name}`;
      branches.forEach(branch => {
        if (branch.name !== mainBranch.name) {
          const branchId = `branch-${branch.name}`;
          newLinks.push({
            source: mainBranchId,
            target: branchId,
            type: 'branch-commit',
            color: '#6a737d'
          });
        }
      });
    }

    const getFileColor = (filename: string) => {
      const ext = filename.split('.').pop()?.toLowerCase();
      const colors: Record<string, string> = {
        js: '#f1e05a', ts: '#3178c6', jsx: '#61dafb', tsx: '#3178c6',
        css: '#563d7c', scss: '#c6538c', html: '#e34c26', json: '#292929',
        md: '#083fa1', py: '#3572A5', java: '#b07219', rb: '#701516',
        go: '#00ADD8', rs: '#dea584', php: '#4F5D95', swift: '#F05138'
      };
      return colors[ext || ''] || '#6e7681';
    };

    commits.forEach((commit, i) => {
      if (!commit.sha) return;

      const commitId = `commit-${commit.sha}`;
      nodeIds.add(commitId);
      newNodes.push({
        id: commitId,
        type: 'commit',
        name: commit.commit.message.substring(0, 20),
        x: 0,
        y: 0,
        radius: 10 + Math.min(commit.files?.length || 0, 5),
        color: '#28a745',
        data: commit
      });

      if (i === 0 && selectedBranch) {
        const branchId = `branch-${selectedBranch}`;
        if (nodeIds.has(branchId)) {
          newLinks.push({
            source: branchId,
            target: commitId,
            type: 'branch-commit',
            color: '#6a737d'
          });
        }
      }

      if (commit.parents && commit.parents.length > 0) {
        commit.parents.forEach(parent => {
          const parentId = `commit-${parent.sha}`;
          if (nodeIds.has(parentId)) {
            newLinks.push({
              source: parentId,
              target: commitId,
              type: 'commit-commit',
              color: '#28a745'
            });
          }
        });
      }

      commit.files?.forEach(file => {
        if (!file.filename) return;

        const fileId = `file-${file.filename}`;
        if (!fileNodes.has(fileId)) {
          const fileNode: Node = {
            id: fileId,
            type: 'file',
            name: file.filename.split('/').pop() || file.filename,
            x: 0,
            y: 0,
            radius: 8,
            color: getFileColor(file.filename),
            data: file
          };
          fileNodes.set(fileId, fileNode);
          newNodes.push(fileNode);
          nodeIds.add(fileId);
        }

        newLinks.push({
          source: commitId,
          target: fileId,
          type: 'commit-file',
          color: '#ffab00'
        });
      });
    });

    const validLinks = newLinks.filter(link =>
      nodeIds.has(link.source) && nodeIds.has(link.target)
    );

    setNodes(newNodes);
    setLinks(validLinks);
    setInitialized(false);
  }, [branches, commits, selectedBranch]);

  useEffect(() => {
    if (nodes.length === 0 || links.length === 0 || initialized) return;

    const linkObjects = links.map(link => {
      const source = nodes.find(n => n.id === link.source);
      const target = nodes.find(n => n.id === link.target);
      return source && target ? { ...link, source, target } : null;
    }).filter(Boolean);

    try {
      const simulation = d3.forceSimulation(nodes)
        .force('charge', d3.forceManyBody().strength(-200))
        .force('link', d3.forceLink(linkObjects)
          .distance((link: any) => {
            if (link.source.type === 'branch' && link.target.type === 'branch') return 120;
            if (link.type === 'branch-commit') return 80;
            if (link.type === 'commit-commit') return 60;
            if (link.type === 'commit-file') return 40;
            return 80;
          }))
        .force('x', d3.forceX(graphWidth / 2).strength(0.1))
        .force('y', d3.forceY(graphHeight / 2).strength(0.1))
        .force('collision', d3.forceCollide().radius((d: any) => d.radius + 5))
        .stop();

      for (let i = 0; i < 300; ++i) simulation.tick();

      setNodes([...nodes]);
      setInitialized(true);

      return () => simulation.stop();
    } catch (error) {
      console.error("Force simulation error:", error);
      setInitialized(true);
    }
  }, [nodes, links, initialized, graphWidth, graphHeight]);

  const panGesture = Gesture.Pan()
    .runOnJS(true)
    .enabled(true)
    .activateAfterLongPress(0)
    .onStart(() => {
      baseTranslate.current = { ...translate };
    })
    .onUpdate((e) => {
      const newTranslate = {
        x: baseTranslate.current.x + e.translationX,
        y: baseTranslate.current.y + e.translationY
      };
      setTranslate(getBoundedTranslate(newTranslate));
    });

  const handleNodePress = (node: Node) => {
    setSelectedNode(prevNode => prevNode?.id === node.id ? null : node);

    if (node.type === 'commit') {
      if (node.data && node.data.html_url) {
        console.log('Opening commit URL:', node.data.html_url);
        Linking.openURL(node.data.html_url).catch(err =>
          console.error('Error opening commit URL:', err)
        );
      }
    } else if (node.type === 'branch') {
      const branch = branches.find(b => b.name === node.name);
      if (branch && branch.html_url) {
        console.log('Opening branch URL:', branch.html_url);
        Linking.openURL(branch.html_url).catch(err =>
          console.error('Error opening branch URL:', err)
        );
      } else {
        const commit = commits.find(c => c.html_url);
        if (commit && commit.html_url) {
          const repoUrl = commit.html_url.split('/commit/')[0];
          if (repoUrl) {
            const branchUrl = `${repoUrl}/tree/${node.name}`;
            console.log('Opening constructed branch URL:', branchUrl);
            Linking.openURL(branchUrl).catch(err =>
              console.error('Error opening constructed branch URL:', err)
            );
          }
        }
      }
    }
  };

  const pinchGesture = Gesture.Pinch()
    .runOnJS(true)
    .onStart(() => {
      baseScale.current = scale;
    })
    .onUpdate((e) => {
      const newScale = Math.max(0.1, Math.min(baseScale.current * e.scale, 3));
      setScale(newScale);
    });

  const doubleTap = Gesture.Tap()
    .runOnJS(true)
    .numberOfTaps(2)
    .maxDelay(250)
    .onEnd(() => {
      setScale(0.5);
      setTranslate({ x: 0, y: 0 });
    });

  const colors = {
    selectedBranch: '#6f42c1',
    mainBranch: '#0366d6',
    commits: '#28a745',
    files: '#ffab00',
    branches: '#6a737d',
  };

  return (
    <View style={styles.container}>
      <GestureDetector gesture={Gesture.Race(panGesture, pinchGesture, doubleTap)}>
        <View style={styles.svgContainer}>
          <Svg width={graphWidth} height={graphHeight}>
            <Defs>
              <LinearGradient id="branchGradient" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="#0366d6" stopOpacity="1" />
                <Stop offset="1" stopColor="#6f42c1" stopOpacity="1" />
              </LinearGradient>
            </Defs>

            <G transform={`translate(${translate.x}, ${translate.y}) scale(${scale})`}>
              {/* Links - render these first */}
              {links.map((link, i) => {
                const sourceNode = nodes.find(n => n.id === link.source);
                const targetNode = nodes.find(n => n.id === link.target);
                if (!sourceNode || !targetNode) return null;

                return (
                  <Line
                    key={`link-${i}`}
                    x1={sourceNode.x}
                    y1={sourceNode.y}
                    x2={targetNode.x}
                    y2={targetNode.y}
                    stroke={link.color}
                    strokeWidth={1.5}
                    strokeOpacity={0.8}
                  />
                );
              })}

              {nodes.map((node, i) => {
                const isBranchOrCommit = node.type === 'branch' || node.type === 'commit';


                return (
                  <React.Fragment key={`node-${i}`}>
                    <Circle
                      cx={node.x}
                      cy={node.y}
                      r={node.radius}
                      fill="white"
                      stroke={(node.type === 'branch' && node.name === selectedBranch ?
                        "#6f42c1" : node.color)}
                      strokeWidth={3}
                      onPress={isBranchOrCommit ? () => handleNodePress(node) : undefined}
                    />
                  </React.Fragment>
                )
              })}

              {/* Node labels */}
              {nodes.map((node, i) => (
                <SvgText
                  key={`text-${i}`}
                  x={node.x}
                  y={node.y + node.radius + 12}
                  fontSize={10}
                  textAnchor="middle"
                  fontWeight="bold"
                  fill="#24292e"
                  opacity={0.6}
                >
                  {node.name}
                </SvgText>
              ))}
            </G>
          </Svg>
        </View>
      </GestureDetector>

      <View style={styles.legend}>
        {[
          { color: colors.selectedBranch, label: 'Selected' },
          { color: colors.mainBranch, label: 'Main' },
          { color: colors.commits, label: 'Commits' },
          { color: colors.files, label: 'Files' },
          { color: colors.branches, label: 'Branches' }
        ].map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: item.color }]} />
            <Text style={styles.legendText}>{item.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.zoomControls}>
        <TouchableOpacity
          style={styles.zoomButton}
          onPress={() => setScale(prev => Math.min(prev * 1.2, 2))}
        >
          <Text style={styles.zoomButtonText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.zoomButton}
          onPress={() => setScale(prev => Math.max(prev / 1.2, 0.1))}
        >
          <Text style={styles.zoomButtonText}>-</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.zoomButton, styles.resetButton]}
          onPress={() => {
            setScale(0.5);
            setTranslate({ x: 0, y: 0 });
          }}
        >
          <Text style={styles.zoomButtonText}>Reset</Text>
        </TouchableOpacity>
      </View>

      {selectedNode && (
        <View style={styles.nodeInfo}>
          <Text style={styles.nodeInfoTitle}>
            {selectedNode.type === 'branch' ? 'Branch: ' : 'Commit: '}
            {selectedNode.name}
          </Text>
          <TouchableOpacity
            style={styles.openLinkButton}
            onPress={() => handleNodePress(selectedNode)}
          >
            <Text style={styles.openLinkText}>Open in Browser</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginVertical: 20,
    alignItems: 'center',
  },
  svgContainer: {
    width: '100%',
    height: '70%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f8f9fa',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 10,
    width: '100%',
    paddingHorizontal: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 5,
    marginVertical: 2,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#495057',
  },
  zoomControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  zoomButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 5,
    backgroundColor: '#e9ecef',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButton: {
    backgroundColor: '#dee2e6',
  },
  zoomButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#495057',
  },
  errorInfo: {
    marginTop: 10,
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
  },
  nodeTouchArea: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderRadius: 100,
  },
  nodeInfo: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f1f3f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    width: '90%',
    alignItems: 'center',
  },
  nodeInfoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  openLinkButton: {
    marginTop: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#0366d6',
    borderRadius: 4,
  },
  openLinkText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default BranchCommitGraph;