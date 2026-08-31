"use client";

import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Button, Form, Input, InputNumber, Radio, Select, message } from "antd";
import { businessService } from "@/services/apiService";

const Wrap = styled.div`
  padding: 24px 28px 40px;
  max-width: 560px;
  margin: 0 auto;
`;

const Title = styled.h2`
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 650;
  color: #111;
`;

const Sub = styled.p`
  margin: 0 0 24px;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
`;

const CreateClassPage = ({ onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const serviceType = Form.useWatch("service_type", form);

  useEffect(() => {
    businessService.getBusinessLocations().then((res) => {
      const rows = res?.data?.results || res?.data || [];
      setLocations(Array.isArray(rows) ? rows : []);
    }).catch(() => {});
  }, []);

  const handleFinish = async (values) => {
    setLoading(true);
    try {
      const payload = {
        title: values.title,
        description: values.description || "",
        service_type: values.service_type || "group",
        duration_minutes: values.duration_minutes,
        price: values.price,
        capacity: values.service_type === "appointment" ? 1 : values.capacity,
        max_concurrent:
          values.service_type === "appointment"
            ? values.max_concurrent || 1
            : 1,
        location_ref: values.location_ref || null,
        cancellationPolicy: "flexible",
        cancellationRefundPercentage: 100,
      };
      const response = await businessService.createClass(payload);
      if (!response.success) {
        message.error(
          typeof response.error === "string"
            ? response.error
            : "Could not create service"
        );
        return;
      }
      message.success("Service created");
      onSuccess?.(response.data);
    } catch (err) {
      message.error("Could not create service");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Wrap>
      <Title>New service</Title>
      <Sub>
        Name, duration, price, and capacity are enough to start taking bookings.
        Photos and a longer description can be added later.
      </Sub>
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          service_type: "group",
          duration_minutes: 60,
          capacity: 10,
          max_concurrent: 1,
        }}
        onFinish={handleFinish}
      >
        <Form.Item
          name="title"
          label="Name"
          rules={[{ required: true, message: "Give the service a name" }]}
        >
          <Input placeholder="e.g. 60-minute yoga class" maxLength={100} />
        </Form.Item>
        <Form.Item name="service_type" label="Type">
          <Radio.Group>
            <Radio.Button value="group">Group session</Radio.Button>
            <Radio.Button value="appointment">Appointment</Radio.Button>
          </Radio.Group>
        </Form.Item>
        <Form.Item
          name="duration_minutes"
          label="Duration (minutes)"
          rules={[{ required: true }]}
        >
          <Select
            options={[30, 45, 60, 90, 120, 180].map((m) => ({
              value: m,
              label: `${m} min`,
            }))}
          />
        </Form.Item>
        <Form.Item
          name="price"
          label="Price"
          rules={[{ required: true, message: "Set a price" }]}
        >
          <InputNumber min={0.01} step={1} precision={2} prefix="$" style={{ width: "100%" }} />
        </Form.Item>
        {serviceType === "appointment" ? (
          <Form.Item
            name="max_concurrent"
            label="How many can be booked at the same time"
            extra="e.g. number of chairs or rooms. Appointment slots are generated from your business hours."
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
        ) : (
          <Form.Item name="capacity" label="Capacity per session" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
        )}
        <Form.Item name="location_ref" label="Location">
          <Select
            allowClear
            placeholder="Use business default"
            options={locations.map((loc) => ({
              value: loc.id,
              label: loc.name || loc.address,
            }))}
          />
        </Form.Item>
        <Form.Item name="description" label="Short description (optional)">
          <Input.TextArea rows={3} maxLength={4000} />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block size="large">
          {serviceType === "appointment" ? "Create and go live" : "Create service"}
        </Button>
      </Form>
    </Wrap>
  );
};

export default CreateClassPage;
export const steps = [];
