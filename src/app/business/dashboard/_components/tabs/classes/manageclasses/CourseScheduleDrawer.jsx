// Create a new file: CourseScheduleDrawer.jsx

"use client";

import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Select,
  TimePicker,
  DatePicker,
  Button,
  ConfigProvider,
  InputNumber,
  Typography,
  Tooltip,
  Empty,
  Popconfirm,
  Tag,
  Space,
} from "antd";
import message from "@/lib/message";
import {
  Calendar,
  Clock,
  DollarSign,
  Users,
  Tag as TagIcon,
  X,
  Plus,
  Edit3,
  Trash2,
  BookOpen,
} from "lucide-react";
import dayjs from "dayjs";
import styled from "styled-components";
import { Drawer } from "vaul";
import { theme as appTheme } from "@/components/theme";
import { courseService, scheduleService } from "@/services/apiService";
import { GlobalLoaderWithoutInlineStyles } from "@/components/common/GlobalLoader";

const { Option } = Select;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// Styled Components
const StyledDrawerOverlay = styled(Drawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1049;
`;
const StyledDrawerContent = styled(Drawer.Content)`
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  border-radius: 16px 16px 0 0;
  height: 95%;
  max-height: 95vh;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1050;
  outline: none;
`;
const DrawerHandle = styled.div`
  width: 36px;
  height: 4px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
  margin: 12px auto 8px;
  flex-shrink: 0;
`;
const DrawerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid #e2e8f0;
  background: white;
  flex-shrink: 0;
`;
const DrawerTitle = styled(Title)`
  margin: 0 !important;
  font-size: 18px !important;
  font-weight: 600 !important;
`;
const DrawerContentWrapper = styled.div`
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 24px;
`;
const CloseButton = styled(Button)`
  border: none;
  background: none;
  padding: 8px;
  height: auto;
`;
const FormContainer = styled.div`
  background: white;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  margin-bottom: 24px;
`;
const ScheduleList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;
const ScheduleCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #e2e8f0;
`;
const DayButton = styled(Button)`
  height: 40px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  padding: 0 8px;
`;
const DaysContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
  gap: 8px;
`;

const dayLabels = {
  Mon: "Mon",
  Tue: "Tue",
  Wed: "Wed",
  Thu: "Thu",
  Fri: "Fri",
  Sat: "Sat",
  Sun: "Sun",
};

const CourseScheduleDrawer = ({
  open,
  onClose,
  classData,
  onSchedulesUpdate,
}) => {
  const [form] = Form.useForm();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchSchedules = async () => {
    if (!classData?.option?.optionId) return;
    setLoading(true);
    try {
      const result = await scheduleService.fetchSchedules({
        option_id: classData.option.optionId,
      });
      if (result.success) {
        // Filter for schedules that have a start_date, indicating they are courses
        const courseSchedules = result.data.filter((s) => s.start_date);
        setSchedules(courseSchedules);
      } else {
        message.error("Failed to load course schedules.");
      }
    } catch (error) {
      message.error("An error occurred while fetching schedules.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchSchedules();
      setFormVisible(false); // Hide form on open
      form.resetFields();
    }
  }, [open, classData]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const payload = {
        class_option_id: classData.option.optionId,
        start_date: values.course_dates[0].format("YYYY-MM-DD"),
        end_date: values.course_dates[1].format("YYYY-MM-DD"),
        day: values.day,
        time: values.time.format("HH:mm:ss"),
        duration: values.duration,
        price: parseFloat(values.price).toFixed(2),
        max_participants: values.max_participants,
        min_participants: 1, // Or get from form if you add it
      };

      const result = await courseService.createCourseSchedule(payload);

      if (result.success) {
        message.success(
          `Course created with ${result.data.session_count} sessions.`
        );
        setFormVisible(false);
        form.resetFields();
        fetchSchedules();
        onSchedulesUpdate?.();
      } else {
        message.error(result.error?.error || "Failed to create course.");
      }
    } catch (error) {
      console.error(error);
      message.error("Please check the form for errors.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (scheduleId) => {
    setLoading(true);
    try {
      await scheduleService.deleteSchedule(scheduleId);
      message.success("Course schedule deleted.");
      fetchSchedules();
      onSchedulesUpdate?.();
    } catch (error) {
      message.error(
        error.response?.data?.detail || "Failed to delete schedule."
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedDay = Form.useWatch("day", form);

  const renderContent = () => (
    <>
      <DrawerHeader>
        <DrawerTitle level={4}>Manage Course Schedules</DrawerTitle>
        <CloseButton icon={<X size={20} />} onClick={onClose} />
      </DrawerHeader>
      <DrawerContentWrapper>
        {!formVisible && (
          <Button
            type="primary"
            icon={<Plus size={16} />}
            onClick={() => setFormVisible(true)}
            style={{ marginBottom: 24 }}
            block
          >
            Create New Course Schedule
          </Button>
        )}

        {formVisible && (
          <FormContainer>
            <Title level={5} style={{ marginBottom: 24 }}>
              New Course Schedule
            </Title>
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <Form.Item
                name="day"
                label="Weekly Class Day"
                rules={[{ required: true }]}
              >
                <DaysContainer>
                  {Object.entries(dayLabels).map(([key, label]) => (
                    <DayButton
                      key={key}
                      type={selectedDay === key ? "primary" : "default"}
                      onClick={() => form.setFieldsValue({ day: key })}
                    >
                      {label}
                    </DayButton>
                  ))}
                </DaysContainer>
              </Form.Item>
              <Form.Item
                name="course_dates"
                label="Course Start & End Date"
                rules={[{ required: true }]}
              >
                <RangePicker
                  style={{ width: "100%" }}
                  disabledDate={(d) => d && d.isBefore(dayjs().startOf("day"))}
                />
              </Form.Item>
              <Form.Item
                name="time"
                label="Start Time"
                rules={[{ required: true }]}
              >
                <TimePicker
                  use12Hours
                  format="h:mm A"
                  minuteStep={15}
                  style={{ width: "100%" }}
                />
              </Form.Item>
              <Form.Item
                name="duration"
                label="Session Duration"
                initialValue={60}
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value={60}>1 hour</Option>
                  <Option value={90}>1.5 hours</Option>
                  <Option value={120}>2 hours</Option>
                  <Option value={180}>3 hours</Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="price"
                label="Total Course Price (CAD)"
                rules={[{ required: true }]}
              >
                <InputNumber
                  min={0}
                  step={10}
                  style={{ width: "100%" }}
                  addonBefore="$"
                />
              </Form.Item>
              <Form.Item
                name="max_participants"
                label="Max Participants"
                initialValue={10}
                rules={[{ required: true }]}
              >
                <InputNumber min={1} style={{ width: "100%" }} />
              </Form.Item>
              <Space>
                <Button onClick={() => setFormVisible(false)}>Cancel</Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Create Course
                </Button>
              </Space>
            </Form>
          </FormContainer>
        )}

        {loading && schedules.length === 0 ? (
          <GlobalLoaderWithoutInlineStyles />
        ) : schedules.length > 0 ? (
          <ScheduleList>
            {schedules.map((s) => (
              <ScheduleCard key={s.id}>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div>
                      <Text strong>
                        Every {s.day} at{" "}
                        {dayjs(s.time, "HH:mm:ss").format("h:mm A")}
                      </Text>
                      <Text block type="secondary" style={{ fontSize: 13 }}>
                        {dayjs(s.start_date).format("MMM D, YYYY")} -{" "}
                        {dayjs(s.end_date).format("MMM D, YYYY")}
                      </Text>
                    </div>
                    <Popconfirm
                      title="Delete this course schedule?"
                      description="This cannot be undone."
                      onConfirm={() => handleDelete(s.id)}
                      okText="Delete"
                      disabled={s.has_confirmed_bookings}
                    >
                      <Tooltip
                        title={
                          s.has_confirmed_bookings
                            ? "Cannot delete schedules with enrollments"
                            : "Delete"
                        }
                      >
                        <Button
                          danger
                          icon={<Trash2 size={14} />}
                          disabled={s.has_confirmed_bookings}
                        />
                      </Tooltip>
                    </Popconfirm>
                  </div>
                  <Space size="large" wrap>
                    <StatItem
                      icon={<Users size={14} />}
                      label="Capacity"
                      value={s.maxParticipants}
                    />
                    <StatItem
                      icon={<DollarSign size={14} />}
                      label="Price"
                      value={`$${parseFloat(s.price).toFixed(2)}`}
                    />
                  </Space>
                </Space>
              </ScheduleCard>
            ))}
          </ScheduleList>
        ) : (
          !formVisible && (
            <Empty description="No course schedules created yet." />
          )
        )}
      </DrawerContentWrapper>
    </>
  );

  const StatItem = ({ icon, label, value }) => (
    <Space align="center" size={4}>
      {icon}
      <Text type="secondary" style={{ fontSize: 13 }}>
        {label}:
      </Text>
      <Text strong style={{ fontSize: 13 }}>
        {value}
      </Text>
    </Space>
  );

  return (
    <ConfigProvider theme={appTheme}>
      <Drawer.Root
        open={open}
        onOpenChange={(o) => !o && onClose()}
        dismissible={!loading}
      >
        <Drawer.Portal>
          <StyledDrawerOverlay />
          <StyledDrawerContent>
            <DrawerHandle />
            {renderContent()}
          </StyledDrawerContent>
        </Drawer.Portal>
      </Drawer.Root>
    </ConfigProvider>
  );
};

export default CourseScheduleDrawer;
