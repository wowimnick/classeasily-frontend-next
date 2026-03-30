"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Alert, Button, Input, Select, Typography } from "antd";
import { Drawer } from "vaul";
import {
  GripVertical,
  Image as ImageLucide,
  Minus,
  MousePointerClick,
  MoveVertical,
  Trash2,
  Type,
} from "lucide-react";
import {
  BLOCK_TYPES,
  createButtonBlock,
  createDividerBlock,
  createImageBlock,
  createSpacerBlock,
  createTextBlock,
  isBuilderDocumentVisuallyEmpty,
} from "./schema";

const { Text, Title, Paragraph } = Typography;

const LABELS = {
  [BLOCK_TYPES.TEXT]: "Text",
  [BLOCK_TYPES.IMAGE]: "Image",
  [BLOCK_TYPES.BUTTON]: "Button",
  [BLOCK_TYPES.DIVIDER]: "Divider",
  [BLOCK_TYPES.SPACER]: "Spacer",
  [BLOCK_TYPES.SECTION]: "Section",
  [BLOCK_TYPES.COLUMNS]: "Two columns",
};

const PALETTE = [
  { type: BLOCK_TYPES.TEXT, icon: Type, label: "Text" },
  { type: BLOCK_TYPES.IMAGE, icon: ImageLucide, label: "Image" },
  { type: BLOCK_TYPES.BUTTON, icon: MousePointerClick, label: "Button" },
  { type: BLOCK_TYPES.DIVIDER, icon: Minus, label: "Divider" },
  { type: BLOCK_TYPES.SPACER, icon: MoveVertical, label: "Spacer" },
];

const Studio = styled.div`
  display: grid;
  grid-template-columns: 148px minmax(0, 1fr) 300px;
  gap: 16px;
  align-items: start;
  @media (max-width: 900px) {
    grid-template-columns: 140px minmax(0, 1fr);
  }
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const PaletteCol = styled.aside`
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px;
  background: #fafafa;
  position: sticky;
  top: 8px;
  @media (max-width: 768px) {
    display: none;
  }
`;

const CanvasCol = styled.div`
  min-width: 0;
`;

const InspectorCol = styled.aside`
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  background: #fff;
  position: sticky;
  top: 8px;
  max-height: min(80vh, 720px);
  overflow-y: auto;
  @media (max-width: 900px) {
    display: none;
  }
`;

const PaletteBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 10px;
  margin-bottom: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  font-size: 13px;
  color: #374151;
  text-align: left;
  &:hover {
    border-color: #6366f1;
    color: #4338ca;
  }
  &:last-child {
    margin-bottom: 0;
  }
`;

const Canvas = styled.div`
  border: 1px dashed rgba(0, 0, 0, 0.12);
  border-radius: 12px;
  padding: 14px;
  min-height: 320px;
  background: #fafafa;
`;

const Row = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  margin-bottom: 8px;
  background: #fff;
  border-radius: 10px;
  border: 2px solid ${(p) => (p.$selected ? "#6366f1" : "#e5e7eb")};
  box-shadow: ${(p) => (p.$selected ? "0 0 0 2px rgba(99, 102, 241, 0.18)" : "0 1px 3px rgba(0,0,0,0.04)")};
  cursor: pointer;
  transition: border-color 0.12s;
  &:hover {
    border-color: ${(p) => (p.$selected ? "#6366f1" : "#c7d2fe")};
  }
`;

const DragHandle = styled.button`
  border: none;
  background: transparent;
  cursor: grab;
  padding: 4px;
  color: #9ca3af;
  flex-shrink: 0;
`;

const MobileBar = styled.div`
  display: none;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
  @media (max-width: 768px) {
    display: flex;
  }
`;

const MiniPreview = styled.div`
  font-size: 12px;
  color: #6b7280;
  line-height: 1.4;
  max-height: 40px;
  overflow: hidden;
  word-break: break-word;
`;

function stripTags(s) {
  if (typeof s !== "string") return "";
  return s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function BlockFields({ block, onChange }) {
  const props = block.props || {};
  const patch = (p) => onChange({ ...block, props: { ...props, ...p } });

  if (block.type === BLOCK_TYPES.TEXT) {
    return (
      <>
        <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
          Layout
        </Text>
        <Select
          size="small"
          style={{ width: "100%", marginBottom: 12 }}
          value={props.align || "left"}
          onChange={(v) => patch({ align: v })}
          options={[
            { value: "left", label: "Left" },
            { value: "center", label: "Center" },
            { value: "right", label: "Right" },
          ]}
        />
        <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
          Content
        </Text>
        <Input.TextArea
          rows={6}
          value={props.content || ""}
          onChange={(e) => patch({ content: e.target.value })}
          placeholder="HTML snippets allowed: paragraphs, bold, links…"
        />
        <Alert
          type="info"
          showIcon
          style={{ marginTop: 10 }}
          message="Merge fields"
          description={
            <Paragraph style={{ marginBottom: 0 }}>
              Use placeholders like <Text code>{`{{first_name}}`}</Text> in your HTML.
            </Paragraph>
          }
        />
      </>
    );
  }
  if (block.type === BLOCK_TYPES.IMAGE) {
    return (
      <>
        <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
          Link & image
        </Text>
        <Input
          size="small"
          placeholder="Image URL"
          value={props.src || ""}
          onChange={(e) => patch({ src: e.target.value })}
          style={{ marginBottom: 8 }}
        />
        <Input
          size="small"
          placeholder="Alt text"
          value={props.alt || ""}
          onChange={(e) => patch({ alt: e.target.value })}
          style={{ marginBottom: 8 }}
        />
        <Select
          size="small"
          style={{ width: "100%" }}
          value={props.align || "center"}
          onChange={(v) => patch({ align: v })}
          options={[
            { value: "left", label: "Align left" },
            { value: "center", label: "Center" },
            { value: "right", label: "Align right" },
          ]}
        />
      </>
    );
  }
  if (block.type === BLOCK_TYPES.BUTTON) {
    return (
      <>
        <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
          Content
        </Text>
        <Input
          size="small"
          placeholder="Label"
          value={props.label || ""}
          onChange={(e) => patch({ label: e.target.value })}
          style={{ marginBottom: 8 }}
        />
        <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
          Link
        </Text>
        <Input
          size="small"
          placeholder="https://…"
          value={props.href || ""}
          onChange={(e) => patch({ href: e.target.value })}
          style={{ marginBottom: 8 }}
        />
        <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
          Colors
        </Text>
        <Input
          size="small"
          placeholder="Background #111827"
          value={props.backgroundColor || ""}
          onChange={(e) => patch({ backgroundColor: e.target.value })}
          style={{ marginBottom: 8 }}
        />
        <Input
          size="small"
          placeholder="Text color #ffffff"
          value={props.textColor || ""}
          onChange={(e) => patch({ textColor: e.target.value })}
        />
        <Select
          size="small"
          style={{ width: "100%", marginTop: 8 }}
          value={props.align || "center"}
          onChange={(v) => patch({ align: v })}
          options={[
            { value: "left", label: "Left" },
            { value: "center", label: "Center" },
            { value: "right", label: "Right" },
          ]}
        />
      </>
    );
  }
  if (block.type === BLOCK_TYPES.DIVIDER) {
    return (
      <>
        <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
          Appearance
        </Text>
        <Input
          size="small"
          placeholder="Color #e5e7eb"
          value={props.color || ""}
          onChange={(e) => patch({ color: e.target.value })}
          style={{ marginBottom: 8 }}
        />
        <Input
          size="small"
          type="number"
          placeholder="Thickness (px)"
          value={props.thickness ?? 1}
          onChange={(e) => patch({ thickness: Number(e.target.value) || 1 })}
        />
      </>
    );
  }
  if (block.type === BLOCK_TYPES.SPACER) {
    return (
      <>
        <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
          Layout
        </Text>
        <Input
          size="small"
          type="number"
          placeholder="Height (px)"
          value={props.height ?? 24}
          onChange={(e) => patch({ height: Number(e.target.value) || 24 })}
        />
      </>
    );
  }
  if (block.type === BLOCK_TYPES.SECTION) {
    return (
      <Alert
        type="info"
        showIcon
        message="Section block"
        description="Nested editing is not available in the visual builder yet. Switch to HTML in the campaign editor (toggle above) for full control, or keep this block from a template."
      />
    );
  }
  if (block.type === BLOCK_TYPES.COLUMNS) {
    return (
      <Alert
        type="info"
        showIcon
        message="Two-column layout"
        description="Column content cannot be edited visually yet. Use HTML mode (toggle above) to adjust columns, or keep this block from a template."
      />
    );
  }
  return null;
}

function SortableRow({ id, selected, onSelect, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <Row ref={setNodeRef} style={style} $selected={selected} onClick={() => onSelect(id)}>
      <DragHandle
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Reorder"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={18} />
      </DragHandle>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </Row>
  );
}

function useNarrowMobile() {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const fn = () => setNarrow(mq.matches);
    fn();
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return narrow;
}

/**
 * @param {{ document: import('./schema.js').MarketingBuilderDocument, onChange: (d: import('./schema.js').MarketingBuilderDocument) => void }} props
 */
export default function EmailBuilderEditor({ document: doc, onChange }) {
  const blocks = doc?.blocks || [];
  const ids = useMemo(() => blocks.map((b) => b.id), [blocks]);
  const [selectedId, setSelectedId] = useState(() => blocks[0]?.id ?? null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const narrow = useNarrowMobile();

  useEffect(() => {
    if (!blocks.length) return;
    if (!selectedId || !blocks.some((b) => b.id === selectedId)) {
      setSelectedId(blocks[0].id);
    }
  }, [blocks, selectedId]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const setBlocks = useCallback(
    (next) => {
      onChange({ schema_version: doc?.schema_version ?? 1, blocks: next });
    },
    [doc?.schema_version, onChange],
  );

  const onDragEnd = useCallback(
    (event) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = ids.indexOf(active.id);
      const newIndex = ids.indexOf(over.id);
      if (oldIndex < 0 || newIndex < 0) return;
      setBlocks(arrayMove(blocks, oldIndex, newIndex));
    },
    [blocks, ids, setBlocks],
  );

  const updateBlock = (i, b) => {
    const next = [...blocks];
    next[i] = b;
    setBlocks(next);
  };

  const removeBlock = (i) => {
    const next = blocks.filter((_, j) => j !== i);
    setBlocks(next.length ? next : [createTextBlock()]);
    const removed = blocks[i];
    if (removed && selectedId === removed.id && next[0]) setSelectedId(next[0].id);
  };

  const addBlock = (type) => {
    const creators = {
      [BLOCK_TYPES.TEXT]: createTextBlock,
      [BLOCK_TYPES.IMAGE]: createImageBlock,
      [BLOCK_TYPES.BUTTON]: createButtonBlock,
      [BLOCK_TYPES.DIVIDER]: createDividerBlock,
      [BLOCK_TYPES.SPACER]: createSpacerBlock,
    };
    const fn = creators[type] || createTextBlock;
    const nb = fn();
    setBlocks([...blocks, nb]);
    setSelectedId(nb.id);
    setPaletteOpen(false);
  };

  const selectedIndex = blocks.findIndex((b) => b.id === selectedId);
  const selectedBlock = selectedIndex >= 0 ? blocks[selectedIndex] : null;

  const showEmptyHint = isBuilderDocumentVisuallyEmpty(doc);

  const paletteInner = (
    <>
      <Text strong style={{ fontSize: 12, display: "block", marginBottom: 8 }}>
        Add block
      </Text>
      {PALETTE.map(({ type, icon: Icon, label }) => (
        <PaletteBtn key={type} type="button" onClick={() => addBlock(type)}>
          <Icon size={16} />
          {label}
        </PaletteBtn>
      ))}
    </>
  );

  const inspectorInner = selectedBlock ? (
    <>
      <Text type="secondary" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {LABELS[selectedBlock.type] || selectedBlock.type}
      </Text>
      <div style={{ marginTop: 12 }}>
        <BlockFields block={selectedBlock} onChange={(b) => updateBlock(selectedIndex, b)} />
      </div>
      <Button
        danger
        type="text"
        size="small"
        icon={<Trash2 size={14} />}
        style={{ marginTop: 16 }}
        disabled={blocks.length <= 1}
        onClick={() => removeBlock(selectedIndex)}
      >
        Remove block
      </Button>
    </>
  ) : (
    <Text type="secondary">Select a block on the canvas to edit its settings.</Text>
  );

  const canvasInner = (
    <Canvas>
      {showEmptyHint && (
        <div
          style={{
            textAlign: "center",
            padding: "20px 12px",
            color: "#6b7280",
            fontSize: 14,
            border: "1px dashed #d1d5db",
            borderRadius: 8,
            marginBottom: 12,
            background: "#fff",
          }}
        >
          Start your email: add a block from the left, or type in the selected text block.
        </div>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {blocks.map((block, i) => {
            const label = LABELS[block.type] || block.type;
            let preview = "";
            if (block.type === BLOCK_TYPES.TEXT) preview = stripTags(block.props?.content) || "Empty text";
            if (block.type === BLOCK_TYPES.IMAGE) preview = block.props?.src ? "Image" : "Image (no URL)";
            if (block.type === BLOCK_TYPES.BUTTON) preview = block.props?.label || "Button";
            if (block.type === BLOCK_TYPES.DIVIDER) preview = "Divider";
            if (block.type === BLOCK_TYPES.SPACER) preview = `Spacer ${block.props?.height ?? 24}px`;
            if (block.type === BLOCK_TYPES.SECTION) preview = "Section (use HTML for edits)";
            if (block.type === BLOCK_TYPES.COLUMNS) preview = "Two columns (use HTML for edits)";

            return (
              <SortableRow
                key={block.id}
                id={block.id}
                selected={block.id === selectedId}
                onSelect={setSelectedId}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Text strong style={{ fontSize: 13 }}>
                    {label}
                  </Text>
                </div>
                <MiniPreview>{preview}</MiniPreview>
              </SortableRow>
            );
          })}
        </SortableContext>
      </DndContext>
    </Canvas>
  );

  const drawerShell = (title, open, onOpenChange, children) => (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay style={{ background: "rgba(0,0,0,0.4)", position: "fixed", inset: 0 }} />
        <Drawer.Content
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            maxHeight: "85vh",
            background: "#fff",
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            padding: 16,
            overflow: "auto",
          }}
        >
          <Drawer.Handle />
          <Title level={5} style={{ marginTop: 0 }}>
            {title}
          </Title>
          {children}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );

  return (
    <div>
      <MobileBar>
        <Button onClick={() => setPaletteOpen(true)}>Blocks</Button>
        <Button type="primary" onClick={() => setInspectorOpen(true)}>
          Edit block
        </Button>
      </MobileBar>

      <Studio>
        <PaletteCol>{paletteInner}</PaletteCol>
        <CanvasCol>{canvasInner}</CanvasCol>
        <InspectorCol>{inspectorInner}</InspectorCol>
      </Studio>

      {narrow && drawerShell("Add blocks", paletteOpen, setPaletteOpen, paletteInner)}
      {narrow && drawerShell("Block settings", inspectorOpen, setInspectorOpen, inspectorInner)}
    </div>
  );
}
