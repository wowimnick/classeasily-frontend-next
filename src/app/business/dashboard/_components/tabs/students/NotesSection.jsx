import React, { useState, useEffect, useMemo } from "react";
import {
  Input,
  Button,
  Form,
  Empty,
  Pagination,
  Avatar,
  ConfigProvider,
  Tooltip,
  message,
} from "antd";
import { Send, User, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { businessStudentService } from "@/services/apiService";
import { formatUTCToUserDisplay } from "@/services/utils";
import styled, { keyframes, css } from "styled-components";

const { TextArea } = Input;

const colors = {
  primary: "#ff385c",
  textPrimary: "#1e293b",
  textSecondary: "#64748b",
  lightBg: "#f8fafc",
  border: "#e2e8f0",
  white: "#ffffff",
};

const NotesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => (props.compact ? "16px" : "24px")};
  flex: 1;
  min-height: 0;
`;

const AddNoteSection = styled.div`
  background: ${colors.white};
  padding: ${(props) => (props.compact ? "16px" : "20px")};
  border-radius: 12px;
  border: 1px solid ${colors.border};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
`;

const SectionTitle = styled.h4`
  font-size: ${(props) => (props.compact ? "0.875rem" : "1rem")};
  font-weight: 600;
  color: ${colors.textPrimary};
  margin: 0 0 ${(props) => (props.compact ? "12px" : "16px")} 0;
`;

const StyledTextArea = styled(TextArea)`
  &.ant-input {
    border-radius: 8px;
    padding: ${(props) => (props.compact ? "10px" : "12px")};
    font-size: 14px;
    resize: none;
    border-color: #e2e8f0;
    &:hover {
      border-color: ${colors.primary};
    }
    &:focus {
      border-color: ${colors.primary};
      box-shadow: 0 0 0 2px rgba(255, 56, 92, 0.1);
    }
  }
`;

const SubmitButton = styled(Button)`
  height: ${(props) => (props.compact ? "36px" : "42px")};
  padding: 0 ${(props) => (props.compact ? "16px" : "24px")};
  border-radius: 8px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  &.ant-btn-primary {
    background: ${colors.primary};
    border-color: ${colors.primary};
    &:hover:not(:disabled) {
      background: #e02448;
      border-color: #e02448;
    }
    svg {
      width: ${(props) => (props.compact ? "14px" : "16px")};
      height: ${(props) => (props.compact ? "14px" : "16px")};
    }
  }
`;

const NotesList = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
`;

const NotesScrollArea = styled.div`
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  padding: 0;
`;

const shimmer = keyframes`
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
`;

const NoteItem = styled(motion.div)`
  padding: ${(props) => (props.compact ? "12px 16px" : "20px")};
  border-bottom: 1px solid ${colors.border};
  background: ${colors.white};
  position: relative;
  &:last-child {
    border-bottom: none;
  }
  ${(props) =>
    props.$isOptimistic &&
    css`
      opacity: 0.7;
      &::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          to right,
          transparent 0%,
          rgba(255, 255, 255, 0.5) 50%,
          transparent 100%
        );
        background-size: 1000px 100%;
        animation: ${shimmer} 1.5s infinite linear;
        z-index: 1;
      }
    `}
`;

const NoteHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${(props) => (props.compact ? "12px" : "16px")};
  margin-bottom: ${(props) => (props.compact ? "8px" : "12px")};
  position: relative;
  z-index: 2;
`;

const StyledAvatar = styled(Avatar)`
  &.ant-avatar {
    width: ${(props) => (props.compact ? "32px" : "40px")};
    height: ${(props) => (props.compact ? "32px" : "40px")};
    border: 2px solid white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    flex-shrink: 0;
  }
`;

const AuthorInfo = styled.div`
  flex: 1;
`;

const AuthorName = styled.div`
  font-weight: 500;
  color: ${colors.textPrimary};
  font-size: ${(props) => (props.compact ? "13px" : "14px")};
  margin-bottom: ${(props) => (props.compact ? "2px" : "4px")};
`;

const TimeInfo = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: ${colors.textSecondary};
  font-size: ${(props) => (props.compact ? "11px" : "12px")};
  svg {
    width: ${(props) => (props.compact ? "10px" : "12px")};
    height: ${(props) => (props.compact ? "10px" : "12px")};
  }
`;

const NoteContent = styled.div`
  color: #475569;
  font-size: ${(props) => (props.compact ? "13px" : "14px")};
  line-height: 1.6;
  margin-left: ${(props) => (props.compact ? "44px" : "56px")};
  white-space: pre-wrap;
  position: relative;
  z-index: 2;
  word-break: break-word;
`;

const EmptyState = styled(Empty)`
  padding: ${(props) => (props.compact ? "32px 16px" : "48px 24px")};
  background-color: ${colors.lightBg};
  border-radius: 8px;
  margin: ${(props) => (props.compact ? "16px 0" : "20px 0")};
  .ant-empty-description {
    color: ${colors.textSecondary};
    font-size: ${(props) => (props.compact ? "13px" : "14px")};
  }
  .ant-empty-image {
    height: ${(props) => (props.compact ? "40px" : "60px")};
  }
`;

const PaginationWrapper = styled.div`
  display: flex;
  justify-content: center;
  padding: ${(props) => (props.compact ? "12px 16px" : "16px 20px")};
  border-top: 1px solid ${colors.border};
  background: #fdfdfe;
  flex-shrink: 0;
`;

const NotesSection = ({ student, currentUser, compact = false }) => {
  const [form] = Form.useForm();
  const [currentPage, setCurrentPage] = useState(1);
  const [addingNote, setAddingNote] = useState(false);
  const [localNotes, setLocalNotes] = useState([]);
  const [userTimeZone, setUserTimeZone] = useState("UTC"); // Default to UTC
  const pageSize = compact ? 3 : 5;

  useEffect(() => {
    // This effect runs only on the client
    const clientTimeZone =
      currentUser?.user_timezone ||
      Intl.DateTimeFormat().resolvedOptions().timeZone;
    setUserTimeZone(clientTimeZone);
  }, [currentUser]);

  useEffect(() => {
    const notesToShow = student?.notes || [];
    setLocalNotes(Array.isArray(notesToShow) ? notesToShow : []);
    setCurrentPage(1);
  }, [student]);

  const handleAddNote = async (values) => {
    if (values.note?.trim() && student?.id && currentUser?.userId) {
      setAddingNote(true);
      const noteText = values.note.trim();
      const optimisticId = `temp-${Date.now()}`;
      const optimisticNote = {
        id: optimisticId,
        content: noteText,
        created_at: new Date().toISOString(),
        author: currentUser.userId,
        author_name:
          `${currentUser.first_name || ""} ${
            currentUser.last_name || ""
          }`.trim() || currentUser.email,
        author_avatar_thumb_url: currentUser.avatar_thumb_url || null,
        isOptimistic: true,
      };
      setCurrentPage(1);
      setLocalNotes((prevNotes) => [optimisticNote, ...prevNotes]);
      form.resetFields();

      try {
        const response = await businessStudentService.addNoteToBusinessStudent(
          student.id,
          noteText
        );

        if (response.success && response.data) {
          const realNote = {
            ...response.data,
            author_name:
              response.data.author_name || optimisticNote.author_name,
            author_avatar_thumb_url:
              response.data.author_avatar_thumb_url ||
              optimisticNote.author_avatar_thumb_url,
          };
          setLocalNotes((prevNotes) =>
            prevNotes.map((note) =>
              note.id === optimisticId ? realNote : note
            )
          );
          message.success("Note added successfully");
        } else {
          throw new Error(response.error || "Failed to add note");
        }
      } catch (error) {
        message.error(error.message || "An unknown error occurred");
        setLocalNotes((prevNotes) =>
          prevNotes.filter((note) => note.id !== optimisticId)
        );
      } finally {
        setAddingNote(false);
      }
    } else {
      if (!student?.id) message.error("Student information is missing.");
      if (!currentUser?.userId) message.error("User information is missing.");
    }
  };

  const sortedNotes = useMemo(
    () =>
      localNotes.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    [localNotes]
  );

  const paginatedNotes = useMemo(
    () =>
      sortedNotes.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [sortedNotes, currentPage, pageSize]
  );

  const formatNoteTimestamp = (utcIsoString) => {
    if (!utcIsoString) return "Processing...";
    return formatUTCToUserDisplay(utcIsoString, userTimeZone, {
      dateTimeFormat: compact ? "MMM d" : "p, MMM d",
    });
  };

  return (
    <ConfigProvider theme={{ token: { colorPrimary: colors.primary } }}>
      <NotesContainer compact={compact}>
        <AddNoteSection compact={compact}>
          <SectionTitle compact={compact}>Add New Note</SectionTitle>
          <Form form={form} onFinish={handleAddNote} layout="vertical">
            <Form.Item
              name="note"
              rules={[
                { required: true, message: "Note content cannot be empty." },
                { whitespace: true, message: "Note content cannot be empty." },
              ]}
              style={{ marginBottom: compact ? "12px" : "16px" }}
            >
              <StyledTextArea
                compact={compact}
                rows={compact ? 2 : 3}
                placeholder={`Add a note about ${
                  student?.first_name || "this contact"
                }...`}
                disabled={addingNote}
              />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <SubmitButton
                compact={compact}
                type="primary"
                htmlType="submit"
                icon={<Send />}
                loading={addingNote}
              >
                Add Note
              </SubmitButton>
            </Form.Item>
          </Form>
        </AddNoteSection>

        <NotesList>
          <SectionTitle compact={compact}>
            Notes History ({sortedNotes.length})
          </SectionTitle>
          <div
            style={{
              background: colors.white,
              borderRadius: "12px",
              border: `1px solid ${colors.border}`,
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <NotesScrollArea>
              {sortedNotes.length === 0 && !addingNote ? (
                <EmptyState
                  compact={compact}
                  description={`No notes for ${
                    student?.first_name || "this contact"
                  }.`}
                />
              ) : (
                <AnimatePresence initial={false}>
                  {paginatedNotes.map((note) => (
                    <NoteItem
                      key={note.id}
                      compact={compact}
                      $isOptimistic={note.isOptimistic}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <NoteHeader compact={compact}>
                        <StyledAvatar
                          compact={compact}
                          icon={<User />}
                          src={note.author_avatar_thumb_url}
                        >
                          {!note.author_avatar_thumb_url && note.author_name
                            ? note.author_name.charAt(0).toUpperCase()
                            : ""}
                        </StyledAvatar>
                        <AuthorInfo>
                          <AuthorName compact={compact}>
                            {note.author_name || "Unknown Author"}
                          </AuthorName>
                          <Tooltip
                            title={formatUTCToUserDisplay(
                              note.created_at,
                              userTimeZone,
                              { dateTimeFormat: "PP p (zzz)" }
                            )}
                          >
                            <TimeInfo compact={compact}>
                              <Clock />
                              {note.isOptimistic
                                ? "Sending..."
                                : formatNoteTimestamp(note.created_at)}
                            </TimeInfo>
                          </Tooltip>
                        </AuthorInfo>
                      </NoteHeader>
                      <NoteContent compact={compact}>
                        {note.content}
                      </NoteContent>
                    </NoteItem>
                  ))}
                </AnimatePresence>
              )}
            </NotesScrollArea>
            {sortedNotes.length > pageSize && (
              <PaginationWrapper compact={compact}>
                <Pagination
                  current={currentPage}
                  total={sortedNotes.length}
                  pageSize={pageSize}
                  onChange={(page) => setCurrentPage(page)}
                  showSizeChanger={false}
                  size={compact ? "small" : "default"}
                />
              </PaginationWrapper>
            )}
          </div>
        </NotesList>
      </NotesContainer>
    </ConfigProvider>
  );
};

export default NotesSection;
