"use client";

import React, { useState } from "react";
import { Modal, Form, Input, Select, Radio } from "antd";
import message from "@/lib/message";
import { businessMembershipService, businessContactService } from "@/services/apiService";

const { Option } = Select;
const { TextArea } = Input;

export default function AddMemberModal({ open, onClose, products, onSaved }) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [contactOptions, setContactOptions] = useState([]);
  const [searchingContacts, setSearchingContacts] = useState(false);
  const entryMode = Form.useWatch("entryMode", form) || "email";

  const handleSearchContacts = async () => {
    if (!contactSearch.trim()) return;
    setSearchingContacts(true);
    const res = await businessContactService.getContacts({ search: contactSearch.trim(), page_size: 20 });
    setSearchingContacts(false);
    if (res.success && res.data?.results) setContactOptions(res.data.results);
    else setContactOptions([]);
  };

  const onFinish = async (values) => {
    setSaving(true);
    try {
      const payload = {
        product_id: values.product_id,
        notes: (values.notes || "").trim() || undefined,
      };
      if ((values.entryMode || entryMode) === "contact" && values.contact_id) {
        payload.contact_id = values.contact_id;
      } else {
        payload.email = (values.email || "").trim();
        if (!payload.email) {
          message.error("Email is required");
          setSaving(false);
          return;
        }
        payload.first_name = (values.first_name || "").trim();
        payload.last_name = (values.last_name || "").trim();
      }
      const res = await businessMembershipService.manualAddMember(payload);
      if (res.success) {
        message.success("Member added");
        form.resetFields();
        onSaved?.();
        onClose?.();
      } else {
        message.error(res.error || "Failed to add member");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Add member (manual)"
      open={open}
      onCancel={onClose}
      footer={null}
      width={480}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ entryMode: "email" }}
      >
        <Form.Item label="How to add" name="entryMode">
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            options={[
              { value: "email", label: "Enter name & email" },
              { value: "contact", label: "Search existing contact" },
            ]}
          />
        </Form.Item>

        <Form.Item
          name="product_id"
          label="Plan"
          rules={[{ required: true, message: "Select a plan" }]}
        >
          <Select placeholder="Select plan" options={products.map((p) => ({ value: p.id, label: p.name }))} />
        </Form.Item>

        {entryMode === "contact" ? (
          <>
            <Form.Item label="Search contacts">
              <Input
                placeholder="Type to search by name or email"
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                onPressEnter={(e) => { e.preventDefault(); handleSearchContacts(); }}
              />
            </Form.Item>
            <Form.Item>
              <button type="button" className="ant-btn ant-btn-default" onClick={handleSearchContacts} disabled={searchingContacts}>
                {searchingContacts ? "Searching…" : "Search"}
              </button>
            </Form.Item>
            <Form.Item name="contact_id" label="Select contact" rules={[{ required: true, message: "Select a contact" }]}>
              <Select
                placeholder="Select from search results"
                showSearch
                loading={searchingContacts}
                optionFilterProp="label"
                options={contactOptions.map((c) => ({
                  value: c.id,
                  label: `${c.first_name || ""} ${c.last_name || ""} ${c.email || ""}`.trim() || c.email,
                }))}
              />
            </Form.Item>
          </>
        ) : (
          <>
            <Form.Item name="first_name" label="First name">
              <Input placeholder="First name" />
            </Form.Item>
            <Form.Item name="last_name" label="Last name">
              <Input placeholder="Last name" />
            </Form.Item>
            <Form.Item name="email" label="Email" rules={[{ required: true, message: "Email is required" }]}>
              <Input type="email" placeholder="Email" />
            </Form.Item>
          </>
        )}

        <Form.Item name="notes" label="Notes">
          <TextArea rows={2} placeholder="Optional notes" />
        </Form.Item>

        <Form.Item>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button type="button" className="ant-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="ant-btn ant-btn-primary" disabled={saving}>
              {saving ? "Adding…" : "Add member"}
            </button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
}
