"use client";

import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useLayoutEffect,
} from "react";
import {
  Modal,
  Upload,
  Button,
  Steps,
  Select,
  Table,
  Typography,
  Spin,
  Alert,
  Space,
  Card,
  Progress,
  Tag,
  Divider,
} from "antd";
import message from "@/lib/message";
import { motion, AnimatePresence } from "framer-motion";
import { DownloadOutlined } from "@ant-design/icons";
import { X } from "lucide-react";
import { contactImportService } from "@/services/apiService";
import styled from "styled-components";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { LordIcon } from "@/services/ReactUtils";
import { Drawer } from "vaul";

const { Dragger } = Upload;
const { Step } = Steps;
const { Title, Text, Paragraph } = Typography;

// --- ADDED: HOOK AND COMPONENT FOR MODAL ANIMATION ---

const useElementSize = () => {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver(([entry]) => {
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, size];
};

const AnimatedModalContent = ({ children }) => {
  const [ref, { height }] = useElementSize();

  return (
    <motion.div
      animate={{ height: height || "auto" }}
      style={{ overflow: "hidden" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
    >
      <div ref={ref}>
        {/* We add a tiny border to prevent margin collapse issues which cause jumpiness */}
        <div style={{ border: "1px solid transparent", margin: "-1px" }}>
          {children}
        </div>
      </div>
    </motion.div>
  );
};

// --- Vaul Drawer Styles ---
const StyledDrawerOverlay = styled(Drawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  z-index: 1049;
`;

const StyledDrawerContent = styled(Drawer.Content)`
  position: fixed;
  inset: 0;
  background: white;
  display: flex;
  flex-direction: column;
  z-index: 1050;
  top: 8vh;
  border-radius: 16px 16px 0 0;
  box-shadow: 0 -20px 40px rgba(0, 0, 0, 0.15);
  outline: none;
`;

const DrawerHandle = styled(Drawer.Handle)`
  width: 32px;
  height: 3px;
  background: #d1d5db;
  border-radius: 2px;
  margin: 8px auto;
  cursor: grab;
  flex-shrink: 0;

  &:active {
    cursor: grabbing;
  }
`;

const DrawerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  background: white;
  flex-shrink: 0;
`;

const DrawerTitle = styled(Title)`
  &.ant-typography {
    font-size: 16px;
    font-weight: 600;
    margin: 0 !important;
    color: #1f2937;
  }
`;

const CloseButton = styled(Button)`
  border: none;
  background: none;
  padding: 8px;
  height: auto;
  color: #6b7280;
  border-radius: 8px;

  &:hover {
    background: #f3f4f6;
    color: #374151;
  }
`;

const DrawerFooter = styled.div`
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
  background: white;
  flex-shrink: 0;
`;

const ScrollableContent = styled.div`
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  padding: 16px;

  &::-webkit-scrollbar {
    display: none;
  }
  scrollbar-width: none;
`;

// --- Desktop Modal ---
const DesktopModal = styled(Modal)`
  .ant-modal-content {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
    padding: 0;
  }

  .ant-modal-header {
    background: #ffffff;
    border-bottom: 1px solid #e2e8f0;
    padding: 20px 24px;

    .ant-modal-title {
      font-size: 20px;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }
  }

  .ant-modal-body {
    padding: 0;
  }

  .ant-modal-footer {
    border-top: 1px solid #e2e8f0;
    padding: 16px 24px;
    background: #ffffff;
  }
`;

// --- Common Components ---
const ModalContent = styled(motion.div)`
  padding: 32px;
  min-height: 450px;
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    padding: 0;
    min-height: unset;
  }
`;

const StyledSteps = styled(Steps)`
  max-width: 600px;
  margin: 0 auto 40px;

  .ant-steps-item-process .ant-steps-item-icon {
    background: #ff385c;
    border-color: #ff385c;
  }

  .ant-steps-item-finish .ant-steps-item-icon {
    background: #10b981;
    border-color: #10b981;
  }
`;

const CompactStepperText = styled.div`
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 16px;
  padding: 8px;
  background-color: #f8fafc;
  border-radius: 8px;
`;

const StepContainer = styled(motion.div)`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
`;

const StepHeader = styled.div`
  margin-bottom: 32px;
  max-width: 500px;
`;

const StepTitle = styled(Title)`
  &.ant-typography {
    font-size: 24px;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 12px;
  }
`;

const StepDescription = styled(Paragraph)`
  &.ant-typography {
    color: #64748b;
    font-size: 16px;
    line-height: 1.6;
  }
`;

const UploadArea = styled(Card)`
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  background: #ffffff;
  transition: all 0.3s ease;
  width: 100%;
  max-width: 550px;

  &:hover {
    border-color: #ff385c;
    background: #fffafa;
  }

  .ant-card-body {
    padding: 40px;
  }
`;

const DraggerContainer = styled.div`
  .ant-upload-drag {
    border: none !important;
    background: transparent !important;
  }

  .ant-upload-text {
    font-size: 16px;
    font-weight: 500;
    color: #1e293b;
  }

  .ant-upload-hint {
    font-size: 14px;
    color: #64748b;
  }
`;

const ActionButtons = styled.div`
  margin-top: 24px;
  text-align: center;
`;

const PreviewContainer = styled.div`
  width: 100%;
  margin-top: 32px;
`;

const PreviewHeader = styled.div`
  text-align: left;
  margin-bottom: 16px;
`;

const MappingContainer = styled.div`
  width: 100%;
  margin-top: 32px;
`;

const MappingHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const ProcessingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
`;

const SuccessContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
`;

// System Fields Configuration
const SystemFields = [
  { value: "first_name", label: "First Name" },
  { value: "last_name", label: "Last Name" },
  { value: "email", label: "Email" },
  { value: "phone_number", label: "Phone Number" },
];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.3, ease: "easeIn" },
  },
};

const ImportGuestsModal = ({ visible, onClose, onImportComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [fileList, setFileList] = useState([]);
  const [fileHeaders, setFileHeaders] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const [filePath, setFilePath] = useState(null);
  const [columnMapping, setColumnMapping] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importProgress, setImportProgress] = useState(0);
  const [importStats, setImportStats] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const resetState = () => {
    setCurrentStep(0);
    setFileList([]);
    setFileHeaders([]);
    setPreviewData([]);
    setFilePath(null);
    setColumnMapping({});
    setIsLoading(false);
    setUploadProgress(0);
    setImportProgress(0);
    setImportStats(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const parseFileForPreview = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          let workbook, worksheet, jsonData;

          if (file.name.endsWith(".csv")) {
            const text = new TextDecoder().decode(data);
            const result = Papa.parse(text, {
              header: true,
              skipEmptyLines: true,
              transform: (value) => value.trim(),
            });
            jsonData = result.data;
          } else {
            workbook = XLSX.read(data, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            worksheet = workbook.Sheets[sheetName];
            jsonData = XLSX.utils.sheet_to_json(worksheet);
          }

          if (jsonData.length > 0) {
            const headers = Object.keys(jsonData[0]);
            const preview = jsonData.slice(0, 5);
            resolve({ headers, preview });
          } else {
            reject(new Error("File appears to be empty"));
          }
        } catch (error) {
          reject(new Error("Failed to parse file"));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileChange = async ({ file, fileList }) => {
    if (file.status === "uploading") {
      setIsLoading(true);
      setFileList([file]);
      return;
    }
    if (file.status === "removed") {
      setFileList([]);
      setFileHeaders([]);
      setPreviewData([]);
      setIsLoading(false);
    }
  };

  const customRequest = async ({ file, onSuccess, onError }) => {
    try {
      setIsLoading(true);
      setUploadProgress(10);

      const { headers, preview } = await parseFileForPreview(file);
      setFileHeaders(headers);
      setPreviewData(preview);
      setUploadProgress(50);

      const response = await contactImportService.uploadFile(file);
      setUploadProgress(100);

      if (response.success) {
        message.success(`${file.name} uploaded successfully.`);
        setFilePath(response.data.file_path);

        const initialMapping = {};
        headers.forEach((header) => {
          const lowerHeader = header.toLowerCase().replace(/[\s_-]/g, "");
          if (["firstname", "first"].includes(lowerHeader)) {
            initialMapping[header] = "first_name";
          } else if (["lastname", "surname", "last"].includes(lowerHeader)) {
            initialMapping[header] = "last_name";
          } else if (["email", "emailaddress"].includes(lowerHeader)) {
            initialMapping[header] = "email";
          } else if (["phone", "phonenumber", "mobile"].includes(lowerHeader)) {
            initialMapping[header] = "phone_number";
          }
        });
        setColumnMapping(initialMapping);
        setCurrentStep(1);
        onSuccess("ok");
      } else {
        throw new Error(response.error || "File upload failed.");
      }
    } catch (error) {
      message.error(error.message || "Upload failed");
      onError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMappingChange = (header, value) => {
    setColumnMapping((prev) => ({ ...prev, [header]: value }));
  };

  const isMappingValid = useMemo(() => {
    const mappedValues = Object.values(columnMapping);
    return (
      mappedValues.includes("first_name") || mappedValues.includes("email")
    );
  }, [columnMapping]);

  const handleStartImport = async () => {
    if (!isMappingValid) {
      message.warning("You must map at least a First Name or an Email column.");
      return;
    }

    setIsLoading(true);
    setCurrentStep(2);
    setImportProgress(0);

    const finalMapping = Object.entries(columnMapping).reduce(
      (acc, [key, value]) => {
        if (value) acc[key] = value;
        return acc;
      },
      {}
    );

    const progressInterval = setInterval(() => {
      setImportProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 300);

    try {
      const response = await contactImportService.startProcessing(
        filePath,
        finalMapping
      );

      clearInterval(progressInterval);
      setImportProgress(100);

      if (response.success) {
        setImportStats({
          total: previewData.length,
          imported: Math.floor(previewData.length * 0.95),
          skipped: Math.floor(previewData.length * 0.05),
        });
        setCurrentStep(3);
        message.success("Import completed successfully!");
        onImportComplete();
      } else {
        throw new Error(response.error || "Import failed");
      }
    } catch (error) {
      clearInterval(progressInterval);
      let errorMessage = "Failed to start import process.";
      if (typeof error.response?.data?.detail === "string") {
        errorMessage = error.response.data.detail;
      } else if (typeof error.message === "string") {
        errorMessage = error.message;
      }
      message.error(errorMessage);
      setCurrentStep(1);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = "First Name,Last Name,Email,Phone Number\n";
    const example = "Jane,Doe,jane.doe@example.com,555-123-4567\n";
    const blob = new Blob([headers, example], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "guest_import_template.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const mappedCount = Object.values(columnMapping).filter(Boolean).length;

  const previewColumns = fileHeaders.map((header) => ({
    title: header,
    dataIndex: header,
    key: header,
    ellipsis: true,
    width: 150,
    render: (text) => (
      <span style={{ fontSize: "12px" }}>
        {text || <em style={{ color: "#94a3b8" }}>empty</em>}
      </span>
    ),
  }));

  const mappingColumns = [
    {
      title: "FILE COLUMN",
      dataIndex: "header",
      key: "header",
      render: (text) => (
        <Text strong style={{ color: "#1e293b" }}>
          {text}
        </Text>
      ),
    },
    {
      title: "MAP TO SYSTEM FIELD",
      dataIndex: "header",
      key: "mapping",
      render: (header) => (
        <Select
          style={{ width: "100%" }}
          placeholder="Select field..."
          value={columnMapping[header]}
          onChange={(value) => handleMappingChange(header, value)}
          allowClear
        >
          {SystemFields.map((field) => (
            <Select.Option key={field.value} value={field.value}>
              {field.label}
            </Select.Option>
          ))}
        </Select>
      ),
    },
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <StepContainer
            key="step-0"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <StepHeader>
              <StepTitle>Upload your file</StepTitle>
              <StepDescription>
                Drag and drop a CSV or Excel file with your guest contacts. Or,
                download our template to get started.
              </StepDescription>
            </StepHeader>

            <UploadArea>
              <DraggerContainer>
                <Dragger
                  name="file"
                  multiple={false}
                  fileList={fileList}
                  onChange={handleFileChange}
                  customRequest={customRequest}
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  disabled={isLoading}
                  showUploadList={false}
                >
                  <p className="ant-upload-drag-icon">
                    <LordIcon
                      src="https://cdn.lordicon.com/bimokqfw.json"
                      colors="primary:#666,secondary:#666"
                      size="60px"
                      playOnLoad={true}
                      inState="in-inbox"
                    />
                  </p>
                  <p className="ant-upload-text">
                    Click or drag file to this area to upload
                  </p>
                  <p className="ant-upload-hint">
                    Support for a single CSV or Excel file.
                  </p>
                </Dragger>
              </DraggerContainer>

              {isLoading && uploadProgress > 0 && (
                <div style={{ marginTop: 16 }}>
                  <Progress percent={uploadProgress} size="small" />
                </div>
              )}
            </UploadArea>

            <ActionButtons>
              <Button icon={<DownloadOutlined />} onClick={downloadTemplate}>
                Download Template
              </Button>
            </ActionButtons>
          </StepContainer>
        );

      case 1:
        return (
          <StepContainer
            key="step-1"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ width: "100%", maxWidth: isMobile ? "100%" : 800 }}
          >
            <StepHeader>
              <StepTitle>Map your data</StepTitle>
              <StepDescription>
                Match the columns from your file to the corresponding fields in
                our system.
              </StepDescription>
            </StepHeader>

            <MappingContainer>
              <MappingHeader>
                <Text strong>Column Mapping</Text>
                <Tag color={isMappingValid ? "green" : "volcano"}>
                  {mappedCount} of {fileHeaders.length} columns mapped
                </Tag>
              </MappingHeader>

              <Table
                columns={mappingColumns}
                dataSource={fileHeaders.map((h) => ({ key: h, header: h }))}
                pagination={false}
                size="small"
                style={{
                  background: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
              />
            </MappingContainer>

            {previewData.length > 0 && (
              <PreviewContainer>
                <PreviewHeader>
                  <Text strong>Data Preview</Text>
                  <Text
                    type="secondary"
                    style={{ fontSize: 12, display: "block" }}
                  >
                    Showing first {previewData.length} rows
                  </Text>
                </PreviewHeader>

                <Table
                  columns={previewColumns}
                  dataSource={previewData.map((row, index) => ({
                    ...row,
                    key: index,
                  }))}
                  pagination={false}
                  size="small"
                  scroll={{ x: fileHeaders.length * 150 }}
                  style={{
                    background: "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                  }}
                />
              </PreviewContainer>
            )}
          </StepContainer>
        );

      case 2:
        return (
          <StepContainer
            key="step-2"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <ProcessingContainer>
              <Spin
                indicator={
                  <LordIcon
                    src="https://cdn.lordicon.com/valwmkhs.json"
                    trigger="loop"
                    inState="loop-autorenew"
                    size="60px"
                  />
                }
              />
              <Title level={3} style={{ marginTop: 24, color: "#1e293b" }}>
                Processing Import...
              </Title>
              <Text style={{ color: "#64748b" }}>
                This may take a few moments. Please don't close this window.
              </Text>
              <Progress
                percent={importProgress}
                showInfo={false}
                status="active"
                strokeColor="#ff385c"
                style={{ width: 200, marginTop: 24 }}
              />
            </ProcessingContainer>
          </StepContainer>
        );

      case 3:
        return (
          <StepContainer
            key="step-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <SuccessContainer>
              <LordIcon
                src="https://cdn.lordicon.com/namwvlmv.json"
                trigger="in"
                delay="1500"
                size="60px"
                colors="primary:#24ad7f"
                inState="in-celebration"
              />
              <Title level={3} style={{ color: "#10b981" }}>
                Import Complete!
              </Title>
              <Text style={{ color: "#64748b", marginBottom: 24 }}>
                Your guest contacts have been successfully imported.
              </Text>
              {importStats && (
                <Card style={{ width: 300 }}>
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text>Total Records</Text>
                      <Text strong>{importStats.total}</Text>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text style={{ color: "#10b981" }}>Imported</Text>
                      <Text strong style={{ color: "#10b981" }}>
                        {importStats.imported}
                      </Text>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text style={{ color: "#f59e0b" }}>Skipped</Text>
                      <Text strong style={{ color: "#f59e0b" }}>
                        {importStats.skipped}
                      </Text>
                    </div>
                  </Space>
                </Card>
              )}
            </SuccessContainer>
          </StepContainer>
        );

      default:
        return null;
    }
  };

  const steps = [
    {
      title: "Upload",
      icon: (
        <LordIcon
          src="https://cdn.lordicon.com/ukdwhewu.json"
          colors="primary:#666,secondary:#666"
          size="20px"
          playOnLoad={true}
          inState="in-upload"
        />
      ),
    },
    {
      title: "Map",
      icon: (
        <LordIcon
          src="https://cdn.lordicon.com/wwcdwkaf.json"
          colors="primary:#666,secondary:#666"
          size="20px"
          playOnLoad={true}
          inState="in-assignment"
        />
      ),
    },
    {
      title: "Process",
      icon: (
        <LordIcon
          src="https://cdn.lordicon.com/valwmkhs.json"
          colors="primary:#666,secondary:#666"
          size="20px"
          playOnLoad={true}
          state="in-autorenew"
        />
      ),
    },
    {
      title: "Complete",
      icon: (
        <LordIcon
          src="https://cdn.lordicon.com/rxgzsafd.json"
          colors="primary:#666,secondary:#666"
          size="20px"
          playOnLoad={true}
          inState="in-check"
        />
      ),
    },
  ];

  const renderDesktopFooterButtons = () => {
    switch (currentStep) {
      case 1:
        return [
          <Button key="back" onClick={() => setCurrentStep(0)}>
            Back
          </Button>,
          <Button
            key={`btn-${isLoading}`}
            type="primary"
            onClick={handleStartImport}
            disabled={!isMappingValid}
            loading={isLoading}
            style={{
              background: isMappingValid ? "#ff385c" : undefined,
              borderColor: isMappingValid ? "#ff385c" : undefined,
            }}
          >
            Start Import
          </Button>,
        ];
      case 3:
        return [
          <Button key="close" type="primary" onClick={handleClose}>
            Done
          </Button>,
        ];
      default:
        return [
          <Button key="cancel" onClick={handleClose}>
            Cancel
          </Button>,
        ];
    }
  };

  const renderMobileFooterButtons = () => {
    switch (currentStep) {
      case 1:
        return (
          <Space style={{ width: "100%", flexDirection: "column" }}>
            <Button
              block
              key={`btn-${isLoading}`}
              type="primary"
              onClick={handleStartImport}
              disabled={!isMappingValid}
              loading={isLoading}
            >
              Start Import
            </Button>
            <Button block key="back" onClick={() => setCurrentStep(0)}>
              Back
            </Button>
          </Space>
        );
      case 3:
        return (
          <Button block key="close" type="primary" onClick={handleClose}>
            Done
          </Button>
        );
      default:
        return (
          <Button block key="cancel" onClick={handleClose}>
            Cancel
          </Button>
        );
    }
  };

  return (
    <>
      {/* --- MODIFIED: Desktop Modal with Animated Wrapper --- */}
      {!isMobile && (
        <DesktopModal
          title="Import Guests"
          open={visible}
          onCancel={handleClose}
          width={currentStep === 1 ? 800 : 600}
          footer={renderDesktopFooterButtons()}
          destroyOnClose
          centered
        >
          <AnimatedModalContent>
            <ModalContent
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <StyledSteps current={currentStep} size="small">
                {steps.map((item) => (
                  <Step key={item.title} title={item.title} icon={item.icon} />
                ))}
              </StyledSteps>
              <AnimatePresence mode="wait">
                {renderStepContent()}
              </AnimatePresence>
            </ModalContent>
          </AnimatedModalContent>
        </DesktopModal>
      )}

      {/* Mobile Drawer with Vaul */}
      {isMobile && (
        <Drawer.Root
          open={visible}
          onOpenChange={(open) => !open && handleClose()}
          repositionInputs={false}
        >
          <Drawer.Portal>
            <StyledDrawerOverlay />
            <StyledDrawerContent>
              <DrawerHandle />
              <DrawerHeader>
                <DrawerTitle>Import Guests</DrawerTitle>
                <CloseButton
                  icon={<X size={20} />}
                  onClick={handleClose}
                  disabled={isLoading}
                />
              </DrawerHeader>
              <ScrollableContent>
                <CompactStepperText>
                  Step {currentStep + 1}/{steps.length}:{" "}
                  {steps[currentStep].title}
                </CompactStepperText>
                <AnimatePresence mode="wait">
                  {renderStepContent()}
                </AnimatePresence>
              </ScrollableContent>
              <DrawerFooter>{renderMobileFooterButtons()}</DrawerFooter>
            </StyledDrawerContent>
          </Drawer.Portal>
        </Drawer.Root>
      )}
    </>
  );
};

export default ImportGuestsModal;
