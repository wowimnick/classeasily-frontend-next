"use client";

import { Button, Modal } from "antd";
import { dash } from "./dashboardTokens";

/**
 * Destructive confirm. When `recurring` is true, presents an explicit
 * this-session vs this-and-following choice instead of hijacking Cancel.
 */
export function confirmDestructive({
  title,
  content,
  okText = "Delete",
  cancelText = "Keep",
  onOk,
  recurring = false,
  onThis,
  onFollowing,
} = {}) {
  const instance = Modal.confirm({
    title,
    content,
    icon: null,
    centered: true,
    autoFocusButton: null,
    okButtonProps: { style: { display: "none" } },
    cancelButtonProps: { style: { display: "none" } },
    footer: (
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
        <Button
          onClick={() => {
            instance.destroy();
          }}
        >
          {cancelText}
        </Button>
        {recurring ? (
          <Button
            danger
            onClick={async () => {
              instance.destroy();
              await onFollowing?.();
            }}
          >
            This and following
          </Button>
        ) : null}
        <Button
          type="primary"
          danger
          style={{ background: dash.color.danger }}
          onClick={async () => {
            instance.destroy();
            if (recurring) await onThis?.();
            else await onOk?.();
          }}
        >
          {recurring ? "This session only" : okText}
        </Button>
      </div>
    ),
  });
  return instance;
}
