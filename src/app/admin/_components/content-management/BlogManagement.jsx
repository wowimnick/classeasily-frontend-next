"use client";

import { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import { Table, Card, Tabs, Button, Modal, Form, Input, Select, Grid, Space, Popconfirm, Tag, Divider, Avatar, Typography, ConfigProvider, DatePicker, Row, Col, Empty, Skeleton,  } from 'antd';
import message from '@/lib/message';
import {
  BookOpen,
  Bookmark,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
} from "lucide-react";
import { blogAdminService } from "@/services/adminDash";
import { theme as appTheme } from "@/components/theme";
import {
  GlobalLoaderWithInlineStyles,
  GlobalLoaderWithoutInlineStyles,
} from "@/components/common/GlobalLoader";
import { LordIcon } from "@/services/ReactUtils";
import dayjs from "dayjs";

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;
const { useBreakpoint } = Grid;
const { Title, Text, Paragraph } = Typography;

// --- STYLING & THEME (FROM BOOKINGSLIST) ---
const colors = {
  primary: "#ff385c",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
  lightBg: "#f8fafc",
  border: "#f1f5f9",
  textPrimary: "#334155",
  textSecondary: "#64748b",
};

// --- MAIN PAGE COMPONENTS (FROM BOOKINGSLIST) ---
const DashboardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 24px;
  background-color: #fff;
  min-height: 100vh;
  @media (max-width: 768px) {
    padding: 16px;
    gap: 0;
  }
`;

const DashboardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
`;

const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #222222;
  margin: 0;
  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

const HeaderSubtitle = styled(Text)`
  font-size: 15px;
  color: ${colors.textSecondary};
  @media (max-width: 480px) {
    font-size: 14px;
  }
`;

const ActionButtonsContainer = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const RefreshButton = styled(Button)`
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 16px;
  border: 1px solid ${colors.border};
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  &:hover {
    color: ${colors.primary};
    border-color: ${colors.primary};
    box-shadow: 0 0 0 2px rgba(255, 56, 92, 0.1);
    transform: translateY(-1px);
  }
  @media (max-width: 768px) {
    flex: 1;
  }
`;

// --- TABLE SECTION ---
const TableSection = styled(motion.div)`
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  position: relative;
  border: 1px solid ${colors.border};
`;

const TableHeader = styled.div`
  padding: 20px 24px 16px;
  border-bottom: 1px solid ${colors.border};
  background: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const TableTitle = styled(Title).attrs({ level: 4 })`
  margin: 0 !important;
  color: ${colors.textPrimary};
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;

  svg {
    color: ${colors.primary};
    width: 18px;
    height: 18px;
  }

  @media (max-width: 768px) {
    font-size: 16px !important;
  }
`;

const FilterBar = styled.div`
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  border-bottom: 1px solid ${colors.border};
  @media (max-width: 768px) {
    padding: 16px;
    flex-direction: column;
    align-items: stretch;
  }
`;

const SearchFilterContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  @media (max-width: 768px) {
    flex-direction: column;
    width: 100%;
    gap: 8px;
  }
`;

const StyledTable = styled(Table)`
  .ant-table-thead > tr > th {
    background: #fafbfc;
    border-bottom: 1px solid ${colors.border};
    font-weight: 600;
    color: ${colors.textPrimary};
    font-size: 13px;
    padding: 16px 24px;
  }
  .ant-table-tbody > tr > td {
    padding: 16px 24px;
    border-bottom: 1px solid ${colors.border};
    font-size: 14px;
  }
  .ant-table-tbody > tr:hover > td {
    background: #fafcff;
  }
  .ant-empty {
    padding: 40px 20px;
  }
`;

// Mobile Components
const MobileCard = styled(Card)`
  margin-bottom: 12px;
  border-radius: 12px;
  border: 1px solid ${colors.border};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
`;
const MobileCardContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;
const MobileCardRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;
const MobileCardLabel = styled(Text)`
  font-size: 12px;
  color: ${colors.textSecondary};
  font-weight: 500;
`;
const MobileCardFooter = styled.div`
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid ${colors.border};
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

// --- NEW STYLED COMPONENTS FOR PREVIEW ---
const PreviewPane = styled.div`
  flex: 1;
  min-width: 0;
  background: #fff;
  border: 1px solid ${colors.border};
  border-radius: 8px;
  padding: 24px;
  height: 75vh;
  overflow-y: auto;

  @media (max-width: 992px) {
    height: auto;
    margin-top: 24px;
    border: none;
    padding: 12px 0;
  }
`;
const PreviewImage = styled.img`
  width: 100%;
  height: 220px;
  object-fit: cover;
  border-radius: 6px;
  margin-bottom: 16px;
  background-color: #f0f0f0;
`;
const PreviewTitle = styled.h1`
  font-size: 2.1rem;
  font-weight: 700;
  color: ${colors.textPrimary};
  margin: 0 0 8px 0;
  line-height: 1.2;
`;
const PreviewMeta = styled.div`
  font-size: 14px;
  color: ${colors.textSecondary};
  margin-bottom: 24px;
`;
const PreviewContent = styled.div`
  color: ${colors.textPrimary};
  line-height: 1.7;
  font-size: 16px;

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    font-weight: 600;
    margin-top: 24px;
    margin-bottom: 16px;
    color: ${colors.textPrimary};
  }
  p {
    margin-bottom: 16px;
  }
  img {
    max-width: 100%;
    border-radius: 4px;
  }
  blockquote {
    border-left: 4px solid ${colors.primary};
    margin: 16px 0;
    padding: 10px 20px;
    background-color: ${colors.lightBg};
    color: ${colors.textSecondary};
    font-style: italic;
  }
`;

// --- MAIN COMPONENT ---
const BlogManagement = () => {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isPostModalVisible, setIsPostModalVisible] = useState(false);
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [livePostData, setLivePostData] = useState(null);

  const [filterParams, setFilterParams] = useState({
    search: "",
    status: "all",
    category: "all",
  });

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const [postForm] = Form.useForm();
  const [categoryForm] = Form.useForm();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const handleFilterChange = (updates) => {
    setFilterParams((prev) => ({ ...prev, ...updates }));
    setPagination((p) => ({ ...p, current: 1 }));
  };

  const fetchPosts = useCallback(async (currentFilters, currentPagination) => {
    setLoading(true);
    const params = {
      page: currentPagination.current,
      page_size: currentPagination.pageSize,
      search: currentFilters.search,
      status:
        currentFilters.status === "all" ? undefined : currentFilters.status,
      category:
        currentFilters.category === "all" ? undefined : currentFilters.category,
    };
    try {
      const res = await blogAdminService.getPosts(params);
      setPosts(res.data.results);
      setPagination((prev) => ({ ...prev, total: res.data.count }));
    } catch (error) {
      message.error("Failed to fetch blog posts");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await blogAdminService.getCategories();
      setCategories(res.data);
    } catch (error) {
      message.error("Failed to fetch categories");
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchPosts(filterParams, pagination);
    }, 300);
    return () => clearTimeout(handler);
  }, [filterParams.search]);

  useEffect(() => {
    fetchPosts(filterParams, pagination);
  }, [
    filterParams.status,
    filterParams.category,
    pagination.current,
    pagination.pageSize,
  ]);

  const refreshData = () => {
    fetchPosts(filterParams, { ...pagination, current: 1 });
    fetchCategories();
  };

  const handleTableChange = (newPagination) => {
    setPagination(newPagination);
  };

  // --- Modal Handlers ---
  const showPostModal = (record = null) => {
    setEditingRecord(record);
    const initialValues = record
      ? {
          ...record,
          published_date: record.published_date
            ? dayjs(record.published_date)
            : null,
        }
      : {
          title: "New Post Title",
          status: "draft",
          published_date: dayjs(),
          excerpt: "This is a short, catchy summary shown in list views.",
          content:
            "<p>Start writing your amazing content here. Use HTML for formatting!</p><h2>A Subheading</h2><p>More text for your article...</p><blockquote>This is a blockquote.</blockquote>",
          author_name: "Admin",
          image_url:
            "https://via.placeholder.com/800x400.png/f0f0f0/cccccc?text=Featured+Image",
        };
    postForm.setFieldsValue(initialValues);
    setLivePostData(initialValues);
    setIsPostModalVisible(true);
  };

  const showPreviewModal = (record) => {
    setLivePostData(record);
    setIsPreviewModalVisible(true);
  };

  const showCategoryModal = (record = null) => {
    setEditingRecord(record);
    categoryForm.setFieldsValue(record || {});
    setIsCategoryModalVisible(true);
  };

  const handleCancel = () => {
    setIsPostModalVisible(false);
    setIsCategoryModalVisible(false);
    setIsPreviewModalVisible(false);
    setEditingRecord(null);
    setLivePostData(null);
    postForm.resetFields();
    categoryForm.resetFields();
  };

  const handleFormValuesChange = (_, allValues) => {
    const categoryName = categories.find(
      (c) => c.id === allValues.category
    )?.name;
    setLivePostData((prev) => ({
      ...prev,
      ...allValues,
      category_name: categoryName || prev?.category_name,
      published_date: allValues.published_date || prev?.published_date,
    }));
  };

  // --- Form Submissions ---
  const handlePostSubmit = async () => {
    try {
      const values = await postForm.validateFields();
      setActionLoading(true);
      const payload = {
        ...values,
        published_date: values.published_date.toISOString(),
      };
      const response = editingRecord
        ? await blogAdminService.updatePost(editingRecord.id, payload)
        : await blogAdminService.createPost(payload);

      if (response.data) {
        message.success(
          `Post ${editingRecord ? "updated" : "created"} successfully`
        );
        refreshData();
        handleCancel();
      } else {
        message.error(response.error?.detail || "Operation failed");
      }
    } catch (error) {
      message.error("Validation failed or server error.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCategorySubmit = async () => {
    try {
      const values = await categoryForm.validateFields();
      setActionLoading(true);
      const response = editingRecord
        ? await blogAdminService.updateCategory(editingRecord.id, values)
        : await blogAdminService.createCategory(values);
      if (response.data) {
        message.success(
          `Category ${editingRecord ? "updated" : "created"} successfully`
        );
        refreshData();
        handleCancel();
      } else {
        message.error(response.error?.detail || "Operation failed");
      }
    } catch (error) {
      message.error("Validation failed or server error.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePost = async (id) => {
    setActionLoading(true);
    try {
      await blogAdminService.deletePost(id);
      message.success("Post deleted");
      refreshData();
    } catch (error) {
      message.error("Failed to delete post");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    setActionLoading(true);
    try {
      await blogAdminService.deleteCategory(id);
      message.success("Category deleted");
      refreshData();
    } catch (error) {
      message.error(
        "Failed to delete category. Make sure no posts are using it."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const postColumns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (text) => <Text style={{ fontWeight: 500 }}>{text}</Text>,
    },
    {
      title: "Author",
      dataIndex: "author_name",
      key: "author_name",
      render: (text, record) => (
        <Space>
          <Avatar src={record.author_avatar_url} size="small">
            {text?.[0]}
          </Avatar>
          <Text>{text || "N/A"}</Text>
        </Space>
      ),
    },
    { title: "Category", dataIndex: "category_name", key: "category" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "published" ? "green" : "orange"}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Tag>
      ),
    },
    {
      title: "Published",
      dataIndex: "published_date",
      key: "published_date",
      render: (date) => (date ? dayjs(date).format("MMM DD, YYYY") : "N/A"),
    },
    {
      title: "Actions",
      key: "actions",
      align: "right",
      render: (_, record) => (
        <Space>
          <Button
            icon={<Eye size={14} />}
            onClick={() => showPreviewModal(record)}
          />
          <Button
            icon={<Edit size={14} />}
            onClick={() => showPostModal(record)}
          />
          <Popconfirm
            title="Sure to delete?"
            onConfirm={() => handleDeletePost(record.id)}
          >
            <Button icon={<Trash2 size={14} />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const categoryColumns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text) => <Text strong>{text}</Text>,
    },
    { title: "Slug", dataIndex: "slug", key: "slug" },
    {
      title: "Post Count",
      dataIndex: "post_count",
      key: "post_count",
      align: "center",
    },
    {
      title: "Actions",
      key: "actions",
      align: "right",
      render: (_, record) => (
        <Space>
          <Button
            icon={<Edit size={14} />}
            onClick={() => showCategoryModal(record)}
          />
          <Popconfirm
            title="Sure to delete?"
            onConfirm={() => handleDeleteCategory(record.id)}
          >
            <Button icon={<Trash2 size={14} />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const renderMobilePostCard = (post) => (
    <MobileCard key={post.id}>
      <MobileCardContent>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 8,
          }}
        >
          <Space direction="vertical" size={0}>
            <Title level={5} style={{ margin: 0 }}>
              {post.title}
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {post.category_name}
            </Text>
          </Space>
          <Tag color={post.status === "published" ? "green" : "orange"}>
            {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
          </Tag>
        </div>
        <MobileCardRow>
          <MobileCardLabel>Author</MobileCardLabel>
          <Text>{post.author_name || "N/A"}</Text>
        </MobileCardRow>
        <MobileCardRow>
          <MobileCardLabel>Published</MobileCardLabel>
          <Text>
            {post.published_date
              ? dayjs(post.published_date).format("MMM D, YYYY")
              : "N/A"}
          </Text>
        </MobileCardRow>
        <MobileCardFooter>
          <Button
            icon={<Eye size={14} />}
            onClick={() => showPreviewModal(post)}
            size="middle"
          />
          <Button
            icon={<Edit size={14} />}
            onClick={() => showPostModal(post)}
            size="middle"
          />
          <Popconfirm
            title="Sure to delete?"
            onConfirm={() => handleDeletePost(post.id)}
          >
            <Button icon={<Trash2 size={14} />} danger size="middle" />
          </Popconfirm>
        </MobileCardFooter>
      </MobileCardContent>
    </MobileCard>
  );

  const renderMobileCategoryCard = (cat) => (
    <MobileCard key={cat.id}>
      <MobileCardContent>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 8,
          }}
        >
          <Title level={5} style={{ margin: 0 }}>
            {cat.name}
          </Title>
          <Tag>{cat.post_count} Posts</Tag>
        </div>
        <MobileCardRow>
          <MobileCardLabel>Slug</MobileCardLabel>
          <Text code>/{cat.slug}</Text>
        </MobileCardRow>
        <MobileCardFooter>
          <Button
            icon={<Edit size={14} />}
            onClick={() => showCategoryModal(cat)}
            size="middle"
          >
            Edit
          </Button>
          <Popconfirm
            title="Sure to delete?"
            onConfirm={() => handleDeleteCategory(cat.id)}
          >
            <Button icon={<Trash2 size={14} />} danger size="middle">
              Delete
            </Button>
          </Popconfirm>
        </MobileCardFooter>
      </MobileCardContent>
    </MobileCard>
  );

  return (
    <ConfigProvider theme={appTheme}>
      <DashboardWrapper>
        <DashboardHeader>
          <div>
            <PageTitle>Blog Management</PageTitle>
            <HeaderSubtitle>
              Create, edit, and manage all articles and categories for the blog.
            </HeaderSubtitle>
          </div>
          <ActionButtonsContainer>
            <RefreshButton
              icon={
                <LordIcon
                  src="https://cdn.lordicon.com/valwmkhs.json"
                  colors="primary:#666,secondary:#666"
                  size="20px"
                  trigger="hover"
                />
              }
              onClick={refreshData}
              loading={loading}
            >
              {!isMobile && "Refresh"}
            </RefreshButton>
          </ActionButtonsContainer>
        </DashboardHeader>

        <Divider />

        <Tabs defaultActiveKey="1">
          <TabPane
            tab={
              <Space>
                <BookOpen size={16} /> Blog Posts
              </Space>
            }
            key="1"
          >
            <TableSection>
              <TableHeader>
                <div>
                  <TableTitle>All Posts</TableTitle>
                </div>
                <Button
                  icon={<Plus size={16} />}
                  type="primary"
                  onClick={() => showPostModal()}
                >
                  New Post
                </Button>
              </TableHeader>
              <FilterBar>
                <SearchFilterContainer>
                  <Input
                    placeholder="Search posts..."
                    onChange={(e) =>
                      handleFilterChange({ search: e.target.value })
                    }
                    style={{ width: isMobile ? "100%" : 250 }}
                    allowClear
                  />
                  <Select
                    value={filterParams.category}
                    onChange={(val) => handleFilterChange({ category: val })}
                    style={{ width: isMobile ? "100%" : 180 }}
                  >
                    <Option value="all">All Categories</Option>
                    {categories.map((cat) => (
                      <Option key={cat.id} value={cat.id}>
                        {cat.name}
                      </Option>
                    ))}
                  </Select>
                  <Select
                    value={filterParams.status}
                    onChange={(val) => handleFilterChange({ status: val })}
                    style={{ width: isMobile ? "100%" : 150 }}
                  >
                    <Option value="all">All Statuses</Option>
                    <Option value="published">Published</Option>
                    <Option value="draft">Draft</Option>
                  </Select>
                </SearchFilterContainer>
              </FilterBar>
              {isMobile ? (
                <div style={{ padding: "8px" }}>
                  {loading ? (
                    <Skeleton active paragraph={{ rows: 5 }} />
                  ) : posts.length > 0 ? (
                    posts.map(renderMobilePostCard)
                  ) : (
                    <Empty description="No posts found with current filters." />
                  )}
                </div>
              ) : (
                <StyledTable
                  dataSource={posts}
                  columns={postColumns}
                  loading={{
                    spinning: loading,
                    indicator: <GlobalLoaderWithInlineStyles />,
                  }}
                  rowKey="id"
                  pagination={{
                    ...pagination,
                    showTotal: (total, range) =>
                      `${range[0]}-${range[1]} of ${total} posts`,
                  }}
                  onChange={handleTableChange}
                  scroll={{ x: 800 }}
                />
              )}
            </TableSection>
          </TabPane>
          <TabPane
            tab={
              <Space>
                <Bookmark size={16} /> Categories
              </Space>
            }
            key="2"
          >
            <TableSection>
              <TableHeader>
                <div>
                  <TableTitle>All Categories</TableTitle>
                </div>
                <Button
                  icon={<Plus size={16} />}
                  type="primary"
                  onClick={() => showCategoryModal()}
                >
                  New Category
                </Button>
              </TableHeader>
              {isMobile ? (
                <div style={{ padding: "8px" }}>
                  {categories.length > 0 ? (
                    categories.map(renderMobileCategoryCard)
                  ) : (
                    <Empty description="No categories found." />
                  )}
                </div>
              ) : (
                <StyledTable
                  dataSource={categories}
                  columns={categoryColumns}
                  rowKey="id"
                  pagination={false}
                />
              )}
            </TableSection>
          </TabPane>
        </Tabs>

        <Modal
          title={
            editingRecord ? "Edit Post & Preview" : "Create Post & Preview"
          }
          open={isPostModalVisible}
          onCancel={handleCancel}
          onOk={handlePostSubmit}
          width={isMobile ? "95%" : "90%"}
          style={{ top: 20 }}
          confirmLoading={actionLoading}
          destroyOnClose
        >
          <Row gutter={24}>
            <Col xs={24} lg={12}>
              <Form
                form={postForm}
                layout="vertical"
                name="post_form"
                onValuesChange={handleFormValuesChange}
              >
                <Form.Item
                  name="title"
                  label="Title"
                  rules={[{ required: true, message: "Please enter a title" }]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  name="slug"
                  label="URL Slug"
                  help="A unique, URL-friendly version of the title."
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  name="image_url"
                  label="Featured Image URL"
                  rules={[
                    {
                      required: true,
                      type: "url",
                      message: "Please enter a valid URL",
                    },
                  ]}
                >
                  <Input placeholder="https://images.unsplash.com/..." />
                </Form.Item>
                <Form.Item
                  name="excerpt"
                  label="Excerpt"
                  help="A short summary shown in list views."
                  rules={[{ required: true }]}
                >
                  <TextArea rows={3} maxLength={300} showCount />
                </Form.Item>
                <Form.Item
                  name="content"
                  label="Content (HTML Supported)"
                  help="Use HTML tags like <h2>, <p>, <img>, <blockquote>."
                >
                  <TextArea rows={isMobile ? 8 : 12} />
                </Form.Item>
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="category"
                      label="Category"
                      rules={[{ required: true }]}
                    >
                      <Select
                        placeholder="Select a category"
                        style={{ width: "100%" }}
                      >
                        {categories.map((cat) => (
                          <Option key={cat.id} value={cat.id}>
                            {cat.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="status"
                      label="Status"
                      rules={[{ required: true }]}
                    >
                      <Select style={{ width: "100%" }}>
                        <Option value="published">Published</Option>
                        <Option value="draft">Draft</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="tags"
                      label="Tags"
                      help="Comma-separated values"
                    >
                      <Input placeholder="Community, Education" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="published_date"
                      label="Publish Date"
                      rules={[{ required: true }]}
                    >
                      <DatePicker showTime style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            </Col>
            <Col xs={24} lg={12}>
              <PreviewPane>
                {livePostData && (
                  <>
                    {livePostData.image_url && (
                      <PreviewImage
                        src={livePostData.image_url}
                        alt="Featured Image Preview"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                        onLoad={(e) => {
                          e.currentTarget.style.display = "block";
                        }}
                      />
                    )}
                    <PreviewTitle>{livePostData.title}</PreviewTitle>
                    <PreviewMeta>
                      By {livePostData.author_name || "Admin"} in{" "}
                      <strong>
                        {livePostData.category_name || "Uncategorized"}
                      </strong>
                      <br />
                      Published on{" "}
                      {dayjs(livePostData.published_date).format(
                        "MMMM DD, YYYY"
                      )}
                    </PreviewMeta>
                    <Text italic>{livePostData.excerpt}</Text>
                    <Divider />
                    <PreviewContent
                      dangerouslySetInnerHTML={{ __html: livePostData.content }}
                    />
                  </>
                )}
              </PreviewPane>
            </Col>
          </Row>
        </Modal>

        <Modal
          title="Post Preview"
          open={isPreviewModalVisible}
          onCancel={handleCancel}
          footer={null}
          width={isMobile ? "95%" : 800}
          destroyOnClose
        >
          {livePostData && (
            <PreviewPane
              style={{
                border: "none",
                padding: "0",
                height: "auto",
                maxHeight: "80vh",
              }}
            >
              {livePostData.image_url && (
                <PreviewImage
                  src={livePostData.image_url}
                  alt="Featured Image"
                />
              )}
              <PreviewTitle>{livePostData.title}</PreviewTitle>
              <PreviewMeta>
                By {livePostData.author_name || "Admin"} in{" "}
                <strong>{livePostData.category_name || "Uncategorized"}</strong>
                <br />
                Published on{" "}
                {dayjs(livePostData.published_date).format("MMMM DD, YYYY")}
              </PreviewMeta>
              <Text italic>{livePostData.excerpt}</Text>
              <Divider />
              <PreviewContent
                dangerouslySetInnerHTML={{ __html: livePostData.content }}
              />
            </PreviewPane>
          )}
        </Modal>

        <Modal
          title={editingRecord ? "Edit Category" : "New Category"}
          open={isCategoryModalVisible}
          onCancel={handleCancel}
          onOk={handleCategorySubmit}
          confirmLoading={actionLoading}
          destroyOnClose
          width={isMobile ? "95%" : 520}
        >
          <Form form={categoryForm} layout="vertical" name="category_form">
            <Form.Item
              name="name"
              label="Category Name"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="slug"
              label="URL Slug"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
          </Form>
        </Modal>
      </DashboardWrapper>
    </ConfigProvider>
  );
};

export default BlogManagement;
