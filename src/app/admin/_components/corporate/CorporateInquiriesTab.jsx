"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Drawer, Form, Input, InputNumber, Modal, Select, Space, Table, Tabs, Tag, message } from "antd";
import dayjs from "dayjs";
import { corporateAdminService, classManagementService } from "@/services/adminDash";

function normList(res) {
  const d = res?.data;
  if (Array.isArray(d)) return d;
  return d?.results || [];
}

export default function CorporateInquiriesTab() {
  const [loading, setLoading] = useState(false);
  const [inquiries, setInquiries] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [drawerInq, setDrawerInq] = useState(null);
  const [shortlist, setShortlist] = useState(null);
  const [slLoading, setSlLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addClassOpen, setAddClassOpen] = useState(false);
  const [form] = Form.useForm();
  const [classForm] = Form.useForm();
  const [classSearch, setClassSearch] = useState([]);

  const loadInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await corporateAdminService.listInquiries();
      setInquiries(normList(res));
    } catch (e) {
      message.error(e?.response?.data?.detail || "Failed to load inquiries");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadBookings = useCallback(async () => {
    try {
      const res = await corporateAdminService.listBookings();
      setBookings(normList(res));
    } catch (e) {
      message.error(e?.response?.data?.detail || "Failed to load bookings");
    }
  }, []);

  useEffect(() => {
    loadInquiries();
    loadBookings();
  }, [loadInquiries, loadBookings]);

  const openDrawer = async (row) => {
    setDrawerInq(row);
    setShortlist(null);
    setSlLoading(true);
    try {
      const res = await corporateAdminService.getShortlistForInquiry(row.id);
      if (res.data) setShortlist(res.data);
    } catch {
      setShortlist(null);
    } finally {
      setSlLoading(false);
    }
  };

  const createShortlist = async () => {
    if (!drawerInq) return;
    setSlLoading(true);
    try {
      const res = await corporateAdminService.createShortlistForInquiry(drawerInq.id, {});
      setShortlist(res.data);
      message.success("Shortlist created");
    } catch (e) {
      message.error(e?.response?.data?.detail || "Could not create shortlist");
    } finally {
      setSlLoading(false);
    }
  };

  const loadShortlistById = async (id) => {
    const res = await corporateAdminService.getShortlist(id);
    setShortlist(res.data);
  };

  const searchClasses = async (q) => {
    if (!q || q.length < 2) {
      setClassSearch([]);
      return;
    }
    const r = await classManagementService.getClasses({ search: q, page_size: 20 });
    const raw = r.data?.results || r.data || [];
    setClassSearch(
      (Array.isArray(raw) ? raw : []).map((c) => ({
        value: c.classId,
        label: `${c.title} — ${c.location || ""}`,
        raw: c,
      })),
    );
  };

  const addCustomOption = async () => {
    if (!shortlist) return;
    const v = await form.validateFields();
    await corporateAdminService.addOption(shortlist.id, {
      position: v.position,
      source_type: "custom",
      title: v.title,
      host_name: v.host_name || "",
      description: v.description || "",
      inclusions: (v.inclusions || "").split("\n").map((s) => s.trim()).filter(Boolean),
      cover_image_url: v.cover_image_url || "",
      gallery_urls: [],
      location_text: v.location_text || "",
      price_total_cents: Math.round(Number(v.price_total_cents)),
      price_per_person_cents: v.price_per_person_cents
        ? Math.round(Number(v.price_per_person_cents))
        : null,
      proposed_date_options: (v.dates || "").split("\n").map((s) => s.trim()).filter(Boolean),
    });
    message.success("Option added");
    setAddOpen(false);
    form.resetFields();
    loadShortlistById(shortlist.id);
  };

  const addFromClass = async () => {
    if (!shortlist) return;
    const v = await classForm.validateFields();
    await corporateAdminService.addOptionFromClass(shortlist.id, {
      position: v.position,
      class_id: v.class_id,
      price_total_cents: Math.round(Number(v.price_total_cents)),
    });
    message.success("Option added from class");
    setAddClassOpen(false);
    classForm.resetFields();
    loadShortlistById(shortlist.id);
  };

  const sendShortlist = async () => {
    if (!shortlist) return;
    await corporateAdminService.sendShortlist(shortlist.id);
    message.success("Shortlist sent");
    loadShortlistById(shortlist.id);
  };

  const issueInvoice = async (bookingId) => {
    await corporateAdminService.issueInvoice(bookingId, { due_in_days: 15 });
    message.success("Invoice issued");
    loadBookings();
  };

  const inqColumns = [
    { title: "Company", dataIndex: "company_name", key: "company_name" },
    { title: "Contact", dataIndex: "contact_name", key: "contact_name" },
    { title: "Email", dataIndex: "email", key: "email" },
    {
      title: "Created",
      dataIndex: "created_at",
      key: "created_at",
      render: (t) => (t ? dayjs(t).format("YYYY-MM-DD") : "—"),
    },
    {
      title: "Shortlist",
      dataIndex: "shortlist_status",
      key: "shortlist_status",
      render: (s) => (s ? <Tag>{s}</Tag> : "—"),
    },
  ];

  const bookingColumns = [
    { title: "Ref", dataIndex: "reference", key: "reference" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (s) => <Tag color="blue">{s}</Tag>,
    },
    {
      title: "Total",
      dataIndex: "total_cents",
      key: "total_cents",
      render: (c) => (c != null ? `$${(c / 100).toFixed(2)}` : "—"),
    },
    {
      title: "Actions",
      key: "act",
      render: (_, row) => (
        <Button
          size="small"
          type="link"
          disabled={row.status !== "deposit_paid" || row.stripe_invoice_id}
          onClick={() => issueInvoice(row.id)}
        >
          Issue balance invoice
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <Tabs
        defaultActiveKey="inquiries"
        items={[
          {
            key: "inquiries",
            label: "Inquiries",
            children: (
              <Table
                rowKey="id"
                loading={loading}
                dataSource={inquiries}
                columns={inqColumns}
                onRow={(r) => ({ onClick: () => openDrawer(r) })}
                pagination={{ pageSize: 20 }}
              />
            ),
          },
          {
            key: "bookings",
            label: "Bookings",
            children: (
              <Table
                rowKey="id"
                dataSource={bookings}
                columns={bookingColumns}
                pagination={{ pageSize: 20 }}
              />
            ),
          },
        ]}
      />

      <Drawer
        width={720}
        open={!!drawerInq}
        onClose={() => {
          setDrawerInq(null);
          setShortlist(null);
        }}
        title={drawerInq ? drawerInq.company_name : "Inquiry"}
      >
        {drawerInq ? (
          <Space direction="vertical" style={{ width: "100%" }} size="large">
            <div>
              <p>
                <strong>{drawerInq.contact_name}</strong> &lt;{drawerInq.email}&gt;
              </p>
              <p style={{ whiteSpace: "pre-wrap" }}>{drawerInq.message}</p>
            </div>
            {!shortlist && !slLoading ? (
              <Button type="primary" onClick={createShortlist}>
                Create shortlist
              </Button>
            ) : null}
            {slLoading ? <p>Loading shortlist…</p> : null}
            {shortlist ? (
              <div>
                <p>
                  <Tag>Status: {shortlist.status}</Tag> Token:{" "}
                  <code>{shortlist.token}</code>
                </p>
                <p>
                  Public link:{" "}
                  <a
                    href={`${typeof window !== "undefined" ? window.location.origin : ""}/corporate/shortlist/${shortlist.token}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    /corporate/shortlist/{shortlist.token}
                  </a>
                </p>
                <Space wrap>
                  <Button onClick={() => setAddOpen(true)}>Add custom option</Button>
                  <Button onClick={() => setAddClassOpen(true)}>Add from class</Button>
                  <Button
                    type="primary"
                    onClick={sendShortlist}
                    disabled={["sent", "viewed", "accepted"].includes(shortlist.status)}
                  >
                    Send to customer
                  </Button>
                </Space>
                <Table
                  style={{ marginTop: 16 }}
                  size="small"
                  rowKey="id"
                  dataSource={shortlist.options || []}
                  columns={[
                    { title: "#", dataIndex: "position", width: 48 },
                    { title: "Title", dataIndex: "title" },
                    { title: "Price", dataIndex: "price_total_cents", render: (c) => `$${(c / 100).toFixed(2)}` },
                    {
                      title: "Source",
                      dataIndex: "source_type",
                    },
                  ]}
                  pagination={false}
                />
              </div>
            ) : null}
          </Space>
        ) : null}
      </Drawer>

      <Modal title="Add custom option" open={addOpen} onCancel={() => setAddOpen(false)} onOk={addCustomOption} width={600} okText="Add">
        <Form form={form} layout="vertical">
          <Form.Item name="position" label="Position (1-3)" rules={[{ required: true }]}>
            <InputNumber min={1} max={3} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="host_name" label="Host / studio">
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="inclusions" label="Inclusions (one per line)">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="cover_image_url" label="Cover image URL">
            <Input />
          </Form.Item>
          <Form.Item name="location_text" label="Location">
            <Input />
          </Form.Item>
          <Form.Item name="price_total_cents" label="Total price (cents)" rules={[{ required: true }]}>
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item name="dates" label="Proposed date/times (ISO, one per line)">
            <Input.TextArea rows={3} placeholder="2026-05-01T18:00:00Z" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Add from existing class"
        open={addClassOpen}
        onCancel={() => setAddClassOpen(false)}
        onOk={addFromClass}
        okText="Add"
      >
        <Form form={classForm} layout="vertical">
          <Form.Item name="position" label="Position" rules={[{ required: true }]}>
            <InputNumber min={1} max={3} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="class_id" label="Class" rules={[{ required: true }]}>
            <Select
              showSearch
              filterOption={false}
              onSearch={searchClasses}
              options={classSearch}
              placeholder="Search classes"
              style={{ width: "100%" }}
            />
          </Form.Item>
          <Form.Item name="price_total_cents" label="Total price (cents)" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
