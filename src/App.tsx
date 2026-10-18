/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ConceptEdge,
  ConceptMapData,
  ConceptNode,
  ExportOptions,
  LayoutDirection,
} from './types/conceptMap';
import { DEFAULT_CONCEPT_MAP } from './utils/sampleMaps';
import { calculateDagreLayout } from './utils/dagreLayout';
import { exportConceptMapToPdf, exportConceptMapToPng } from './utils/exportUtils';
import { Header, PastelShade } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { NodeDetailModal } from './components/NodeDetailModal';
import { MediaModal } from './components/MediaModal';
import { JsonModal } from './components/JsonModal';
import { ExportModal } from './components/ExportModal';

const LOCAL_STORAGE_KEY = 'conceptmap_studio_data_v3';

export default function App() {
  // Initialize state from local storage or default template
  const [mapData, setMapData] = useState<ConceptMapData>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.nodes && Array.isArray(parsed.nodes) && parsed.nodes.length > 0 && parsed.edges) {
          // Check if valid positions exist, if not calculate them
          const hasPositions = parsed.nodes.every(
            (n: any) => typeof n.x === 'number' && typeof n.y === 'number' && !isNaN(n.x) && !isNaN(n.y)
          );
          if (!hasPositions) {
            return {
              ...parsed,
              nodes: calculateDagreLayout(parsed.nodes, parsed.edges, { direction: 'TB' }),
            };
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read from local storage', e);
    }

    // Default template with Dagre calculated layout
    const initialNodes = calculateDagreLayout(
      DEFAULT_CONCEPT_MAP.nodes,
      DEFAULT_CONCEPT_MAP.edges,
      { direction: 'TB' }
    );
    return {
      ...DEFAULT_CONCEPT_MAP,
      nodes: initialNodes,
    };
  });

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [direction, setDirection] = useState<LayoutDirection>('TB');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');
  const [pastelShade, setPastelShade] = useState<PastelShade>('linen');

  // Modals state
  const [inspectingNode, setInspectingNode] = useState<ConceptNode | null>(null);
  const [activeMediaNode, setActiveMediaNode] = useState<ConceptNode | null>(null);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  // Save to local storage on change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mapData));
    } catch (e) {
      console.debug('Failed to save to local storage', e);
    }
  }, [mapData]);

  // Selected node object
  const selectedNode = useMemo(() => {
    return mapData.nodes.find((n) => n.id === selectedNodeId) || null;
  }, [mapData.nodes, selectedNodeId]);

  // Inspecting node connection context (parent, connector phrase, children)
  const inspectingNodeContext = useMemo(() => {
    if (!inspectingNode) return null;
    const incomingEdge = mapData.edges.find((e) => e.target === inspectingNode.id) || null;
    const parentNode = incomingEdge
      ? mapData.nodes.find((n) => n.id === incomingEdge.source) || null
      : null;
    const childNodes = mapData.edges
      .filter((e) => e.source === inspectingNode.id)
      .map((e) => ({
        node: mapData.nodes.find((n) => n.id === e.target)!,
        edge: e,
      }))
      .filter((item) => !!item.node);

    return { incomingEdge, parentNode, childNodes };
  }, [inspectingNode, mapData.edges, mapData.nodes]);

  // Trigger Dagre Hierarchical Auto-Layout
  const handleTriggerLayout = useCallback(
    (dir: LayoutDirection) => {
      setDirection(dir);
      setMapData((prev) => {
        const updatedNodes = calculateDagreLayout(prev.nodes, prev.edges, { direction: dir });
        return {
          ...prev,
          nodes: updatedNodes,
        };
      });
    },
    []
  );

  // Add new node with connection to parent
  const handleAddNode = useCallback(
    (
      nodeData: Omit<ConceptNode, 'id'>,
      parentNodeId: string | null,
      relationLabel: string
    ) => {
      const newNodeId = `node-${Date.now().toString(36)}`;
      const newNode: ConceptNode = {
        ...nodeData,
        id: newNodeId,
      };

      setMapData((prev) => {
        const newNodes = [...prev.nodes, newNode];
        let newEdges = [...prev.edges];

        if (parentNodeId && prev.nodes.some((n) => n.id === parentNodeId)) {
          const newEdge: ConceptEdge = {
            id: `edge-${parentNodeId}-${newNodeId}`,
            source: parentNodeId,
            target: newNodeId,
            relationLabel: relationLabel || 'se relaciona con',
          };
          newEdges.push(newEdge);
        }

        // Auto layout with the new node
        const laidOutNodes = calculateDagreLayout(newNodes, newEdges, { direction });

        return {
          ...prev,
          rootNodeId: prev.rootNodeId || newNodeId,
          nodes: laidOutNodes,
          edges: newEdges,
        };
      });

      setSelectedNodeId(newNodeId);
    },
    [direction]
  );

  // Reassign a node's parent / origin connection point ("editar el punto de donde se encuentra a otro punto")
  const handleReassignParent = useCallback(
    (nodeId: string, newParentId: string | null, relationLabel?: string) => {
      setMapData((prev) => {
        if (newParentId === nodeId) return prev;

        // Prevent cycle: newParentId must not be a descendant of nodeId
        if (newParentId) {
          const isDescendant = (currentParent: string, targetChild: string): boolean => {
            const children = prev.edges
              .filter((e) => e.source === currentParent)
              .map((e) => e.target);
            if (children.includes(targetChild)) return true;
            return children.some((c) => isDescendant(c, targetChild));
          };

          if (isDescendant(nodeId, newParentId)) {
            alert('No se puede conectar a este nodo porque es una rama secundaria derivada de este concepto (crearía un ciclo infinito).');
            return prev;
          }
        }

        let newEdges = [...prev.edges];
        const incomingEdgeIndex = newEdges.findIndex((e) => e.target === nodeId);

        if (!newParentId) {
          // Disconnect parent -> becomes independent root
          if (incomingEdgeIndex !== -1) {
            newEdges.splice(incomingEdgeIndex, 1);
          }
        } else {
          const defaultLabel = incomingEdgeIndex !== -1 ? newEdges[incomingEdgeIndex].relationLabel : 'se fundamenta en';
          const finalLabel = relationLabel?.trim() || defaultLabel;

          if (incomingEdgeIndex !== -1) {
            newEdges[incomingEdgeIndex] = {
              ...newEdges[incomingEdgeIndex],
              source: newParentId,
              relationLabel: finalLabel,
            };
          } else {
            newEdges.push({
              id: `edge-${newParentId}-${nodeId}-${Date.now().toString(36)}`,
              source: newParentId,
              target: nodeId,
              relationLabel: finalLabel,
            });
          }
        }

        return {
          ...prev,
          edges: newEdges,
        };
      });

      setExportToast({
        message: '¡Punto de conexión actualizado correctamente!',
        type: 'success',
      });
      setTimeout(() => setExportToast(null), 3000);
    },
    []
  );

  // Update existing node (supports content updates and changing connection parent)
  const handleUpdateNode = useCallback(
    (
      nodeId: string,
      nodeUpdates: Partial<ConceptNode>,
      newParentId?: string | null,
      relationLabel?: string
    ) => {
      setMapData((prev) => {
        const newNodes = prev.nodes.map((n) => (n.id === nodeId ? { ...n, ...nodeUpdates } : n));
        let newEdges = [...prev.edges];

        if (newParentId !== undefined) {
          if (newParentId === nodeId) return { ...prev, nodes: newNodes };

          const isDescendant = (currentParent: string, targetChild: string): boolean => {
            const children = prev.edges
              .filter((e) => e.source === currentParent)
              .map((e) => e.target);
            if (children.includes(targetChild)) return true;
            return children.some((c) => isDescendant(c, targetChild));
          };

          if (!newParentId || !isDescendant(nodeId, newParentId)) {
            const incomingEdgeIndex = newEdges.findIndex((e) => e.target === nodeId);

            if (!newParentId) {
              if (incomingEdgeIndex !== -1) newEdges.splice(incomingEdgeIndex, 1);
            } else {
              const label = relationLabel?.trim() || (incomingEdgeIndex !== -1 ? newEdges[incomingEdgeIndex].relationLabel : 'se fundamenta en');
              if (incomingEdgeIndex !== -1) {
                newEdges[incomingEdgeIndex] = {
                  ...newEdges[incomingEdgeIndex],
                  source: newParentId,
                  relationLabel: label,
                };
              } else {
                newEdges.push({
                  id: `edge-${newParentId}-${nodeId}-${Date.now().toString(36)}`,
                  source: newParentId,
                  target: nodeId,
                  relationLabel: label,
                });
              }
            }
          }
        }

        return {
          ...prev,
          nodes: newNodes,
          edges: newEdges,
        };
      });
    },
    []
  );

  // Recursively delete a node and all its descending branches/children
  const handleDeleteNode = useCallback((nodeIdToDelete: string) => {
    setMapData((prev) => {
      // Find all descendants recursively
      const idsToDelete = new Set<string>();

      const findDescendants = (currentId: string) => {
        idsToDelete.add(currentId);
        const childEdges = prev.edges.filter((e) => e.source === currentId);
        childEdges.forEach((e) => {
          if (!idsToDelete.has(e.target)) {
            findDescendants(e.target);
          }
        });
      };

      findDescendants(nodeIdToDelete);

      const filteredNodes = prev.nodes.filter((n) => !idsToDelete.has(n.id));
      const filteredEdges = prev.edges.filter(
        (e) => !idsToDelete.has(e.source) && !idsToDelete.has(e.target)
      );

      const updatedRootId =
        idsToDelete.has(prev.rootNodeId)
          ? filteredNodes[0]?.id || ''
          : prev.rootNodeId;

      return {
        ...prev,
        rootNodeId: updatedRootId,
        nodes: filteredNodes,
        edges: filteredEdges,
      };
    });

    setSelectedNodeId((cur) => (cur === nodeIdToDelete ? null : cur));
  }, []);

  // Update node position during dragging
  const handleUpdateNodePosition = useCallback((nodeId: string, x: number, y: number) => {
    setMapData((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === nodeId ? { ...n, x, y } : n)),
    }));
  }, []);

  // Update edge relation text
  const handleUpdateEdgeRelation = useCallback((edgeId: string, newRelation: string) => {
    setMapData((prev) => ({
      ...prev,
      edges: prev.edges.map((e) => (e.id === edgeId ? { ...e, relationLabel: newRelation } : e)),
    }));
  }, []);

  // Delete an edge connector
  const handleDeleteEdge = useCallback((edgeId: string) => {
    setMapData((prev) => ({
      ...prev,
      edges: prev.edges.filter((e) => e.id !== edgeId),
    }));
  }, []);

  // Clear entire map
  const handleClearAll = useCallback(() => {
    if (window.confirm('¿Deseas vaciar todo el lienzo y comenzar un mapa nuevo?')) {
      setMapData({
        mapTitle: 'Nuevo Mapa Conceptual',
        rootNodeId: '',
        nodes: [],
        edges: [],
      });
      setSelectedNodeId(null);
    }
  }, []);

  // Load a prebuilt template
  const handleLoadTemplate = useCallback(
    (template: ConceptMapData) => {
      const laidOut = calculateDagreLayout(template.nodes, template.edges, { direction });
      setMapData({
        ...template,
        nodes: laidOut,
      });
      setSelectedNodeId(null);
    },
    [direction]
  );

  // Import JSON
  const handleImportJson = useCallback(
    (newData: ConceptMapData) => {
      const laidOut = calculateDagreLayout(newData.nodes, newData.edges, { direction });
      setMapData({
        ...newData,
        nodes: laidOut,
      });
      setSelectedNodeId(null);
    },
    [direction]
  );

  // Reset map to full default template (27 nodes)
  const handleResetDefaultMap = useCallback(() => {
    const initialNodes = calculateDagreLayout(
      DEFAULT_CONCEPT_MAP.nodes,
      DEFAULT_CONCEPT_MAP.edges,
      { direction }
    );
    setMapData({
      ...DEFAULT_CONCEPT_MAP,
      nodes: initialNodes,
    });
    setSelectedNodeId(null);
  }, [direction]);

  // Toast notification state for export
  const [exportToast, setExportToast] = useState<{
    message: string;
    type: 'loading' | 'success' | 'error';
  } | null>(null);

  // Quick Export PNG
  const handleQuickExportPng = useCallback(async () => {
    setExportToast({ message: 'Renderizando imagen PNG en alta resolución...', type: 'loading' });
    try {
      await exportConceptMapToPng(mapData, direction, {
        format: 'png',
        scale: 2,
        backgroundColor: themeMode === 'dark' ? 'dark' : 'white',
        layoutMode: 'custom',
      });
      setExportToast({ message: '¡Imagen PNG descargada con éxito!', type: 'success' });
      setTimeout(() => setExportToast(null), 3500);
    } catch (err: any) {
      console.error('Error al exportar PNG:', err);
      setExportToast({ message: `Error al exportar PNG: ${err?.message || 'Error desconocido'}`, type: 'error' });
      setTimeout(() => setExportToast(null), 5000);
    }
  }, [mapData, direction, themeMode]);

  // Quick Export PDF
  const handleQuickExportPdf = useCallback(async () => {
    setExportToast({ message: 'Generando documento PDF estructurado...', type: 'loading' });
    try {
      await exportConceptMapToPdf(mapData, direction, {
        format: 'pdf',
        scale: 2,
        backgroundColor: themeMode === 'dark' ? 'dark' : 'white',
        pageOrientation: 'landscape',
        pageSize: 'a4',
        includeHeaderFooter: true,
        layoutMode: 'custom',
      });
      setExportToast({ message: '¡Documento PDF generado y descargado!', type: 'success' });
      setTimeout(() => setExportToast(null), 3500);
    } catch (err: any) {
      console.error('Error al exportar PDF:', err);
      setExportToast({ message: `Error al exportar PDF: ${err?.message || 'Error desconocido'}`, type: 'error' });
      setTimeout(() => setExportToast(null), 5000);
    }
  }, [mapData, direction, themeMode]);

  // Advanced Export handler
  const handleAdvancedExport = useCallback(
    async (options: ExportOptions) => {
      setExportToast({
        message: `Generando archivo ${options.format.toUpperCase()}...`,
        type: 'loading',
      });
      try {
        let result;
        if (options.format === 'png') {
          result = await exportConceptMapToPng(mapData, direction, options);
        } else {
          result = await exportConceptMapToPdf(mapData, direction, options);
        }
        setExportToast({
          message: `¡Archivo ${options.format.toUpperCase()} descargado con éxito!`,
          type: 'success',
        });
        setTimeout(() => setExportToast(null), 3500);
        return result;
      } catch (err: any) {
        console.error('Error al exportar:', err);
        setExportToast({
          message: `Error durante la exportación: ${err?.message || 'Error desconocido'}`,
          type: 'error',
        });
        setTimeout(() => setExportToast(null), 5000);
        throw err;
      }
    },
    [mapData, direction]
  );

  // Quick add child from node button
  const handleQuickAddChild = useCallback(
    (parentNodeId: string) => {
      setSelectedNodeId(null);
      setIsSidebarOpen(true);
      const parent = mapData.nodes.find((n) => n.id === parentNodeId);
      const childType =
        parent?.type === 'root'
          ? 'topic'
          : parent?.type === 'topic'
          ? 'subtopic'
          : 'detail';

      handleAddNode(
        {
          type: childType,
          label: 'Nuevo Concepto',
          description: 'Descripción del concepto',
          emoji: '📌',
          media: { type: 'none', url: '', caption: '' },
          style: {
            backgroundColor: childType === 'subtopic' ? '#164e63' : '#831843',
            textColor: '#ffffff',
            borderColor: childType === 'subtopic' ? '#06b6d4' : '#f43f5e',
          },
        },
        parentNodeId,
        'se divide en'
      );
    },
    [mapData.nodes, handleAddNode]
  );

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* 1. Header Studio Bar */}
      <Header
        mapTitle={mapData.mapTitle}
        onUpdateTitle={(newTitle) => setMapData((prev) => ({ ...prev, mapTitle: newTitle }))}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        themeMode={themeMode}
        onToggleTheme={() => setThemeMode((m) => (m === 'dark' ? 'light' : 'dark'))}
        pastelShade={pastelShade}
        onSelectPastelShade={setPastelShade}
        onOpenJsonModal={() => setIsJsonModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onQuickExportPng={handleQuickExportPng}
        onQuickExportPdf={handleQuickExportPdf}
        onResetToDefault={handleResetDefaultMap}
        nodeCount={mapData.nodes.length}
        edgeCount={mapData.edges.length}
      />

      {/* 2. Main Studio Dashboard Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Collapsible Dynamic Data Entry Panel */}
        <Sidebar
          nodes={mapData.nodes}
          edges={mapData.edges}
          selectedNode={selectedNode}
          isOpen={isSidebarOpen}
          themeMode={themeMode}
          onToggleOpen={() => setIsSidebarOpen((prev) => !prev)}
          onAddNode={handleAddNode}
          onUpdateNode={handleUpdateNode}
          onDeleteNode={handleDeleteNode}
          onClearAll={handleClearAll}
          onSelectNode={setSelectedNodeId}
          onLoadTemplate={handleLoadTemplate}
        />

        {/* Right / Center: Interactive Diagramming Canvas */}
        <main className="flex-1 relative h-full w-full overflow-hidden">
          <Canvas
            nodes={mapData.nodes}
            edges={mapData.edges}
            selectedNodeId={selectedNodeId}
            direction={direction}
            themeMode={themeMode}
            pastelShade={pastelShade}
            onSelectNode={setSelectedNodeId}
            onEditNode={(node) => {
              setSelectedNodeId(node.id);
              setIsSidebarOpen(true);
            }}
            onAddChildNode={handleQuickAddChild}
            onDeleteNode={handleDeleteNode}
            onOpenMedia={setInspectingNode}
            onInspectNode={setInspectingNode}
            onUpdateNodePosition={handleUpdateNodePosition}
            onUpdateEdgeRelation={handleUpdateEdgeRelation}
            onDeleteEdge={handleDeleteEdge}
            onTriggerLayout={handleTriggerLayout}
            onResetToDefault={handleResetDefaultMap}
            onReassignParentNode={handleReassignParent}
          />
        </main>
      </div>

      {/* 3. In-Depth Expanded Node Detail Modal (Text, Video, Image & Branches & Reconnection) */}
      {inspectingNode && (
        <NodeDetailModal
          node={mapData.nodes.find((n) => n.id === inspectingNode.id) || inspectingNode}
          allNodes={mapData.nodes}
          allEdges={mapData.edges}
          incomingEdge={inspectingNodeContext?.incomingEdge}
          parentNode={inspectingNodeContext?.parentNode}
          childNodes={inspectingNodeContext?.childNodes || []}
          onClose={() => setInspectingNode(null)}
          onEdit={(node) => {
            setSelectedNodeId(node.id);
            setIsSidebarOpen(true);
          }}
          onNavigateToNode={(nodeId) => {
            const target = mapData.nodes.find((n) => n.id === nodeId);
            if (target) {
              setInspectingNode(target);
              setSelectedNodeId(target.id);
            }
          }}
          onReassignParent={handleReassignParent}
          onUpdateNodeContent={handleUpdateNode}
          onUpdateNodePosition={handleUpdateNodePosition}
        />
      )}

      {/* Media Lightbox Fallback if needed */}
      {activeMediaNode && (
        <MediaModal
          media={activeMediaNode.media}
          nodeTitle={activeMediaNode.label}
          onClose={() => setActiveMediaNode(null)}
        />
      )}

      {/* 4. JSON Import/Export Modal */}
      {isJsonModalOpen && (
        <JsonModal
          mapData={mapData}
          onImport={handleImportJson}
          onClose={() => setIsJsonModalOpen(false)}
        />
      )}

      {/* 5. Advanced Export Modal (PNG / PDF) */}
      {isExportModalOpen && (
        <ExportModal
          mapData={mapData}
          direction={direction}
          themeMode={themeMode}
          onExport={handleAdvancedExport}
          onClose={() => setIsExportModalOpen(false)}
        />
      )}

      {/* Floating Export Status Toast */}
      {exportToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-bounce-subtle pointer-events-none">
          <div
            className={`px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-2.5 text-xs font-bold border ${
              exportToast.type === 'loading'
                ? 'bg-slate-900/95 border-sky-500/60 text-sky-300'
                : exportToast.type === 'success'
                ? 'bg-emerald-950/95 border-emerald-500 text-emerald-200'
                : 'bg-rose-950/95 border-rose-500 text-rose-200'
            }`}
          >
            {exportToast.type === 'loading' && (
              <span className="w-3.5 h-3.5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin shrink-0" />
            )}
            {exportToast.type === 'success' && <span className="text-emerald-400 shrink-0 text-sm">✓</span>}
            {exportToast.type === 'error' && <span className="text-rose-400 shrink-0 text-sm">⚠</span>}
            <span>{exportToast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
