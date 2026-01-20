"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useLayoutEffect,
} from "react";
import styled, { ThemeProvider } from "styled-components";
import {
  Form,
  Input,
  Select,
  Button,
  Tabs,
  ConfigProvider,
  Switch,
  Typography,
  Tooltip,
  InputNumber,
  Upload,
  Popconfirm,
  Tag,
} from "antd";
import message from "@/lib/message";
import {
  X,
  Save,
  ImagePlus,
  Phone,
  Mail,
  Eye,
  EyeOff,
  Search,
  Star,
  Building2,
  Hash,
  Percent,
  FileText,
  Info,
  Clock,
  AlertCircle,
  Sparkles,
  Tent,
  Activity,
  Backpack,
  Loader,
  MapPin,
  Ticket,
  Crown,
  Link as LinkIcon,
  Unlink,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  CalendarRange,
  Layers,
  Tag as TagIcon,
  Users,
  CalendarDays,
  ListChecks,
  ToggleLeft,
  Check,
  Type,
} from "lucide-react";
import heic2any from "heic2any";
import { motion, AnimatePresence } from "framer-motion";
import { businessClassService, uploadService } from "@/services/apiService";
import debounce from "lodash/debounce";
import {
  MapContainer,
  TileLayer,
  Circle,
  CircleMarker,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { GlobalLoaderWithoutInlineStyles } from "@/components/common/GlobalLoader";
import { theme as appTheme } from "@/components/theme";
import { Drawer } from "vaul";

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

// --- ANIMATION HOOKS (From ClassOptionsStep) ---

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

const SmoothHeight = ({ children }) => {
  const [ref, { height }] = useElementSize();

  return (
    <motion.div
      animate={{ height: height || "auto" }}
      style={{ overflow: "hidden" }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
    >
      <div ref={ref}>{children}</div>
    </motion.div>
  );
};

// --- STYLED COMPONENTS (DRAWER) ---

const StyledDrawerOverlay = styled(Drawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1049;
`;

const StyledDrawerContent = styled(Drawer.Content)`
  background: white;
  display: flex;
  flex-direction: column;
  border-radius: 24px 24px 0 0;
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

const DesktopDrawerContent = styled(Drawer.Content)`
  right: 8px;
  top: 8px;
  bottom: 8px;
  position: fixed;
  z-index: 1050;
  outline: none;
  width: 800px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const DrawerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid ${(props) => props.theme.token.colorBorderSecondary};
  background-color: white;
  flex-shrink: 0;
  @media (max-width: 768px) {
    padding: 12px 16px;
  }
`;

const DrawerContentWrapper = styled.div`
  flex: 1 1 auto;
  overflow-y: auto;
  background-color: #f8fafc;
  display: flex;
  flex-direction: column;
`;

const DrawerFooter = styled.div`
  padding: 16px 24px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid ${(props) => props.theme.token.colorBorderSecondary};
  background: white;
  flex-shrink: 0;
  @media (max-width: 768px) {
    padding: 12px 16px;
    flex-direction: column-reverse;
    .ant-btn {
      width: 100%;
    }
  }
`;

const DrawerTitle = styled(Title)`
  margin: 0 !important;
  font-size: 20px !important;
  font-weight: 600 !important;
  @media (max-width: 768px) {
    font-size: 18px !important;
  }
`;

const CloseButton = styled(Button)`
  padding: 8px;
  height: auto;
  border: none;
  background: none;
  &:hover {
    background: ${(props) => props.theme.token.colorBgTextHover};
  }
`;

// Main navigation tabs
const StyledTabs = styled(Tabs)`
  height: 100%;
  display: flex;
  flex-direction: column;

  > .ant-tabs-nav {
    margin: 0 !important;
    padding: 0 16px;
    background: white;
    flex-shrink: 0;
    position: sticky;
    top: 0;
    z-index: 10;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  > .ant-tabs-nav .ant-tabs-tab {
    padding: 12px 10px !important;
    font-weight: 500;
  }

  > .ant-tabs-content-holder {
    flex: 1;
    background: #f8fafc;
    overflow-y: auto;
  }

  > .ant-tabs-content-holder > .ant-tabs-content > .ant-tabs-tabpane {
    height: 100%;
    padding: 0;
    position: relative;
  }

  @media (max-width: 768px) {
    > .ant-tabs-nav {
      padding: 0 16px;
    }
    > .ant-tabs-nav .ant-tabs-tab {
      padding: 10px 8px !important;
      font-size: 13px;
    }
  }
`;

// Internal tabs for Options (mimicking ClassOptionsStep)
const TierInternalTabs = styled(Tabs)`
  .ant-tabs-nav {
    margin-bottom: 16px !important;
  }
  .ant-tabs-tab {
    padding: 12px 0 !important;
    font-size: 14px;
  }
`;

const FormSection = styled(motion.div)`
  margin-bottom: 2rem;
  border-radius: 12px;
  @media (max-width: 768px) {
    margin-bottom: 1.5rem;
  }
`;

const FormGroup = styled.div`
  margin-bottom: ${(props) => props.theme.token.marginLG}px;
  width: 100%;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: ${(props) => props.columns || "1fr 1fr"};
  gap: ${(props) => props.theme.token.marginLG}px;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: ${(props) => props.theme.token.margin}px;
  }
`;

const FormLabel = styled.label`
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: ${(props) => props.theme.token.colorText};
  margin-bottom: ${(props) => props.theme.token.marginXS}px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const HelpText = styled.div`
  font-size: 13px;
  color: ${(props) => props.theme.token.colorTextSecondary};
  margin-top: 4px;
  margin-bottom: 8px;
  line-height: 1.4;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  svg {
    flex-shrink: 0;
  }
  @media (max-width: 768px) {
    font-size: 12px;
  }
`;

const commonInputStyles = (props) => `
  height: ${props.theme.token.controlHeight}px;
  border-radius: ${props.theme.token.borderRadius}px;
  font-size: ${props.theme.token.fontSize}px;
  transition: all 0.3s ease;
  &:focus,
  &.ant-input-focused,
  &:focus-within,
  &.ant-input-number-focused,
  &.ant-picker-focused,
  &.ant-select-focused .ant-select-selector {
    box-shadow: 0 0 0 3px ${props.theme.token.colorPrimary}20;
    border-color: ${props.theme.token.colorPrimaryBorderHover};
  }
  @media (max-width: 768px) {
    height: ${props.theme.token.controlHeightSM}px;
    font-size: 16px !important;
  }
`;

const StyledInput = styled(Input)`
  ${(props) => commonInputStyles(props)}
`;

const StyledTextArea = styled(TextArea)`
  border-radius: ${(props) => props.theme.token.borderRadius}px;
  font-size: ${(props) => props.theme.token.fontSize}px;
  transition: all 0.3s ease;
  padding: 8px 12px;
  &:focus,
  &.ant-input-focused {
    box-shadow: 0 0 0 3px ${(props) => props.theme.token.colorPrimary}20;
    border-color: ${(props) => props.theme.token.colorPrimaryBorderHover};
  }
  @media (max-width: 768px) {
    font-size: 16px !important;
  }
`;

const StyledSelect = styled(Select)`
  .ant-select-selector {
    height: ${(props) => props.theme.token.controlHeight}px !important;
    padding: 0 ${(props) => props.theme.token.controlPaddingHorizontal}px !important;
    border-radius: ${(props) => props.theme.token.borderRadius}px !important;
    display: flex;
    align-items: center;
    transition: all 0.3s ease;
  }
  .ant-select-selection-item,
  .ant-select-selection-placeholder {
    line-height: ${(props) => props.theme.token.controlHeight - 2}px !important;
    font-size: ${(props) => props.theme.token.fontSize}px;
    @media (max-width: 768px) {
      font-size: 16px !important;
    }
  }
  &.ant-select-focused .ant-select-selector {
    box-shadow: 0 0 0 3px ${(props) => props.theme.token.colorPrimary}20 !important;
    border-color: ${(props) =>
      props.theme.token.colorPrimaryBorderHover} !important;
  }
`;

const StyledTagsSelect = styled(Select)`
  .ant-select-selector {
    min-height: ${(props) => props.theme.token.controlHeight}px !important;
    border-radius: ${(props) => props.theme.token.borderRadius}px !important;
    transition: all 0.3s ease;
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    align-content: flex-start;
    padding: 4px 8px !important;
  }
  .ant-select-selection-overflow {
    display: flex;
    flex-wrap: wrap;
    width: 100%;
    gap: 4px;
    align-items: center;
  }
  .ant-select-selection-item {
    margin: 2px 2px 2px 0 !important;
    border-radius: ${(props) => props.theme.token.borderRadius}px !important;
    background: ${(props) => props.theme.token.colorPrimary}15 !important;
    border: 1px solid ${(props) => props.theme.token.colorPrimary}30 !important;
    font-size: ${(props) => props.theme.token.fontSize}px !important;
    padding: 2px 8px !important;
    height: auto !important;
    display: flex;
    align-items: center;
    @media (max-width: 768px) {
      font-size: 14px !important;
    }
  }
  .ant-select-selection-item-content {
    color: ${(props) => props.theme.token.colorPrimary} !important;
    font-weight: 500;
  }
  .ant-select-selection-item-remove {
    color: ${(props) => props.theme.token.colorPrimary} !important;
    margin-left: 4px !important;
    font-size: 12px !important;
  }
  .ant-select-selection-placeholder {
    line-height: ${(props) =>
      props.theme.token.controlHeight - 12}px !important;
    font-size: ${(props) => props.theme.token.fontSize}px;
    color: ${(props) => props.theme.token.colorTextPlaceholder};
    @media (max-width: 768px) {
      font-size: 16px !important;
    }
  }
  &.ant-select-focused .ant-select-selector {
    box-shadow: 0 0 0 3px ${(props) => props.theme.token.colorPrimary}20 !important;
    border-color: ${(props) =>
      props.theme.token.colorPrimaryBorderHover} !important;
  }
`;

const StyledInputNumber = styled(InputNumber)`
  ${(props) => commonInputStyles(props)}
  width: 100%;
  .ant-input-number-input-wrap,
  .ant-input-number-input {
    height: 100% !important;
    display: flex;
    align-items: center;
    @media (max-width: 768px) {
      font-size: 16px !important;
    }
  }
`;

const SectionDivider = styled.div`
  display: flex;
  align-items: center;
  margin: 2rem 0;
  &::before,
  &::after {
    content: "";
    flex: 1;
    height: 1px;
    background: ${(props) => props.theme.token.colorBorder};
  }
  span {
    padding: 0 1rem;
    color: ${(props) => props.theme.token.colorTextSecondary};
    font-weight: 500;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  @media (max-width: 768px) {
    margin: 1.5rem 0;
  }
`;

const ImageUploadSection = styled.div`
  padding: 0 0 0.5rem 0;
  border-radius: 12px;
  transition: all 0.3s ease;
`;

const ImageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px;
  margin-top: 12px;
  @media (max-width: 480px) {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 12px;
  }
`;

const StyledDragger = styled(Upload.Dragger)`
  &.ant-upload.ant-upload-drag {
    border: none;
    background: transparent;
    padding: 0;
    height: 100%;
    .ant-upload-btn {
      padding: 0;
      display: block;
      height: 100%;
    }
    .ant-upload-drag-container {
      display: block;
      height: 100%;
    }
    &:hover {
      border: none !important;
    }
  }
`;

const ImageCard = styled.div`
  position: relative;
  aspect-ratio: 1;
  width: 100%;
  border-radius: 16px;
  overflow: hidden;
  background: #f8fafc;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  ${(props) =>
    props.$isUpload &&
    `
    cursor: pointer;
    gap: ${props.theme.token.marginXS}px;
  `}
`;

const ImagePreview = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url("${(props) => props.src}");
  background-size: cover;
  background-position: center;
`;

const ImageActions = styled.div`
  position: absolute;
  top: ${(props) => props.theme.token.marginXS}px;
  right: ${(props) => props.theme.token.marginXS}px;
  display: flex;
  gap: ${(props) => props.theme.token.marginXS}px;
  z-index: 10;
`;

const ActionButton = styled.button`
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover {
    background: white;
    transform: scale(1.1);
  }
  svg {
    width: 14px;
    height: 14px;
  }
`;

const CoverBadge = styled.div`
  position: absolute;
  bottom: ${(props) => props.theme.token.marginXS}px;
  left: ${(props) => props.theme.token.marginXS}px;
  background: ${(props) => props.theme.token.colorPrimary};
  color: white;
  padding: 4px 8px;
  border-radius: ${(props) => props.theme.token.borderRadius}px;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 10;
`;

const SearchWrapper = styled(motion.div)`
  position: relative;
  margin-bottom: 24px;
  max-width: 100%;
`;

const SearchResults = styled(motion.div)`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: white;
  border-radius: ${(props) => props.theme.token.borderRadius}px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid ${(props) => props.theme.token.colorBorder};
`;

const SearchResult = styled(motion.div)`
  padding: 12px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid ${(props) => props.theme.token.colorBorderSecondary};
  transition: all 0.2s ease;
  &:last-child {
    border-bottom: none;
  }
  &:hover {
    background: ${(props) => props.theme.token.colorBgTextHover};
  }
  svg {
    color: ${(props) => props.theme.token.colorPrimary};
    flex-shrink: 0;
  }
`;

const ResultContent = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
`;

const PrimaryText = styled.div`
  color: ${(props) => props.theme.token.colorText};
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const MapWrapper = styled(motion.div)`
  position: relative;
  height: 300px;
  border-radius: ${(props) => props.theme.token.borderRadius}px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid ${(props) => props.theme.token.colorBorder};
  margin-top: 16px;
  margin-bottom: 24px;
  .leaflet-container {
    height: 100%;
    width: 100%;
    border-radius: ${(props) => props.theme.token.borderRadius}px;
  }
  @media (max-width: 768px) {
    height: 250px;
  }
`;

const LocationText = styled(motion.div)`
  font-size: 13px;
  color: ${(props) => props.theme.token.colorTextSecondary};
  text-align: center;
  margin-top: 8px;
  margin-bottom: 16px;
`;

const ToggleGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 8px;
  margin-bottom: 8px;
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const ToggleButton = styled.button`
  flex: 1;
  padding: 12px 16px;
  background: white;
  color: ${(props) =>
    props.$selected
      ? props.theme.token.colorPrimary
      : props.theme.token.colorText};
  border: 1px solid
    ${(props) =>
      props.$selected
        ? props.theme.token.colorPrimary
        : props.theme.token.colorBorder};
  border-radius: ${(props) => props.theme.token.borderRadius}px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  &:hover {
    border-color: ${(props) => props.theme.token.colorPrimary};
    background: ${(props) =>
      props.$selected
        ? props.theme.token.colorPrimaryBorder
        : props.theme.token.colorBgTextHover};
  }
  svg {
    color: ${(props) =>
      props.$selected
        ? props.theme.token.colorPrimary
        : props.theme.token.colorTextSecondary};
  }
`;

const FormItemAntd = styled(Form.Item)`
  margin-bottom: 0 !important;
  .ant-form-item-explain-error {
    margin-top: ${(props) => props.theme.token.marginXS}px;
    font-size: ${(props) => props.theme.token.fontSizeSM || "12px"};
  }
`;

const LoaderWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  min-height: 300px;
`;

const TabContentWrapper = styled.div`
  padding: 16px;
  @media (max-width: 768px) {
    padding: 12px;
  }
`;

// --- MULTI-TIER STYLES (MATCHING CLASS OPTIONS STEP) ---

const TierCard = styled(motion.div)`
  background: #fff;
  border: 1px solid
    ${(props) =>
      props.$isActive
        ? props.theme.token.colorPrimary
        : props.theme.token.colorBorder};
  border-radius: 12px;
  margin-bottom: 16px;
  overflow: hidden;
  transition:
    border-color 0.3s ease,
    box-shadow 0.3s ease;
  box-shadow: ${(props) =>
    props.$isActive ? "0 4px 12px rgba(0,0,0,0.08)" : "none"};

  &:hover {
    border-color: ${(props) =>
      props.$isActive
        ? props.theme.token.colorPrimary
        : props.theme.token.colorPrimaryBorder};
  }
`;

const TierHeader = styled.div`
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  background: ${(props) =>
    props.$isActive ? props.theme.token.colorPrimaryBg : "#fff"};
  transition: background 0.3s ease;
`;

const TierTitleSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;

  h4 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: ${(props) => props.theme.token.colorText};
  }
`;

const TierBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${(props) => props.$bg};
  color: ${(props) => props.$color};
  flex-shrink: 0;
`;

const TierBody = styled.div`
  padding: 0 24px 24px 24px;
  border-top: 1px solid ${(props) => props.theme.token.colorBorderSecondary};
`;

const QuickPill = styled(Tag)`
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
  &:hover {
    background: ${(props) => props.theme.token.colorPrimaryBg};
    border-color: ${(props) => props.theme.token.colorPrimary};
    color: ${(props) => props.theme.token.colorPrimary};
  }
`;

const ScheduleCardGroup = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 8px;
`;

const ScheduleCard = styled.div`
  border: 1px solid
    ${(props) =>
      props.$selected
        ? props.theme.token.colorPrimary
        : props.theme.token.colorBorder};
  background: ${(props) =>
    props.$selected ? props.theme.token.colorPrimaryBg : "#fff"};
  padding: 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 8px;

  &:hover {
    border-color: ${(props) => props.theme.token.colorPrimary};
  }

  h5 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    color: ${(props) =>
      props.$selected
        ? props.theme.token.colorPrimary
        : props.theme.token.colorText};
  }

  p {
    margin: 0;
    font-size: 12px;
    color: ${(props) => props.theme.token.colorTextSecondary};
    line-height: 1.4;
  }
`;

const FooterActions = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid ${(props) => props.theme.token.colorBorder};
`;
const FeatureBuilder = ({ form, tierIndex }) => {
  // We watch the entire options array to derive the global list of Feature Keys (Rows)
  // This ensures that if Tier 1 adds "Duration", Tier 2 sees a "Duration" row immediately.
  const options = Form.useWatch("options", form) || [];

  // Parse all descriptions to get a unique set of keys (Row Headers)
  const allFeatureKeys = React.useMemo(() => {
    const keys = new Set();
    options.forEach((opt) => {
      try {
        const parsed = JSON.parse(opt.description || "{}");
        if (typeof parsed === "object" && parsed !== null) {
          Object.keys(parsed).forEach((k) => keys.add(k));
        }
      } catch (e) {
        // Ignore parsing errors or plain strings
      }
    });
    return Array.from(keys);
  }, [options]);

  // Helper to safely update the form options array
  const updateOptions = (newOptions) => {
    form.setFieldsValue({ options: newOptions });
  };

  const getCurrentTierFeatures = () => {
    try {
      const currentDesc = options[tierIndex]?.description;
      return currentDesc ? JSON.parse(currentDesc) : {};
    } catch (e) {
      return {};
    }
  };

  // 1. Change Cell Value (Specific to this Tier)
  const handleValueChange = (key, newValue) => {
    const newOptions = [...options];
    // Ensure we are working with a cloned object for the specific tier
    const currentFeatures = getCurrentTierFeatures();

    currentFeatures[key] = newValue;

    newOptions[tierIndex] = {
      ...newOptions[tierIndex],
      description: JSON.stringify(currentFeatures),
    };

    updateOptions(newOptions);
  };

  // 2. Rename Row (Applies to ALL Tiers to keep table synced)
  const handleKeyRename = (oldKey, newKey) => {
    if (!newKey.trim() || oldKey === newKey) return;

    const newOptions = options.map((opt) => {
      try {
        const features = JSON.parse(opt.description || "{}");
        // If this tier has data for the old key, move it to the new key
        if (Object.prototype.hasOwnProperty.call(features, oldKey)) {
          const value = features[oldKey];
          delete features[oldKey];
          features[newKey] = value;
          return { ...opt, description: JSON.stringify(features) };
        }
        return opt;
      } catch (e) {
        return opt;
      }
    });

    updateOptions(newOptions);
  };

  // 3. Delete Row (Applies to ALL Tiers)
  const handleDeleteRow = (key) => {
    const newOptions = options.map((opt) => {
      try {
        const features = JSON.parse(opt.description || "{}");
        if (Object.prototype.hasOwnProperty.call(features, key)) {
          delete features[key];
          return { ...opt, description: JSON.stringify(features) };
        }
        return opt;
      } catch (e) {
        return opt;
      }
    });

    updateOptions(newOptions);
  };

  // 4. Add New Row (Initialize in Current Tier, implies row existence for others)
  const handleAddFeature = () => {
    const newKey = "New Feature";
    let finalKey = newKey;
    let counter = 1;

    // Avoid duplicate keys
    while (allFeatureKeys.includes(finalKey)) {
      finalKey = `${newKey} ${counter}`;
      counter++;
    }

    handleValueChange(finalKey, true); // Default to "Included" (true)
  };

  const currentFeatures = getCurrentTierFeatures();

  return (
    <div style={{ padding: 0 }}>
      {allFeatureKeys.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 24px",
            gap: "8px",
            marginBottom: "6px",
            padding: "0 4px",
          }}
        >
          <Text
            type="secondary"
            style={{
              fontSize: "11px",
              fontWeight: "600",
              letterSpacing: "0.5px",
            }}
          >
            FEATURE
          </Text>
          <Text
            type="secondary"
            style={{
              fontSize: "11px",
              fontWeight: "600",
              letterSpacing: "0.5px",
            }}
          >
            VALUE
          </Text>
        </div>
      )}

      {allFeatureKeys.map((key) => {
        const value = currentFeatures[key];
        const effectiveValue = value === undefined ? "" : value;
        const isBool = typeof effectiveValue === "boolean";

        return (
          <div
            key={key}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 24px",
              gap: "8px",
              marginBottom: "6px",
              alignItems: "center",
            }}
          >
            {/* Row Name Input */}
            <Input
              size="middle"
              variant="filled" // Slightly distinct background for the label
              placeholder="e.g. Duration"
              defaultValue={key}
              onBlur={(e) => handleKeyRename(key, e.target.value)}
              onPressEnter={(e) => e.target.blur()}
              style={{ fontSize: "13px" }}
            />

            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              {/* Value Selector */}
              <div style={{ flex: 1 }}>
                {isBool ? (
                  <div
                    style={{
                      height: "32px",
                      display: "flex",
                      alignItems: "center",
                      paddingLeft: "4px",
                    }}
                  >
                    <Switch
                      size="small"
                      checked={effectiveValue}
                      onChange={(checked) => handleValueChange(key, checked)}
                    />
                    <span
                      style={{
                        fontSize: "12px",
                        marginLeft: "8px",
                        color: effectiveValue ? "#10b981" : "#94a3b8",
                      }}
                    >
                      {effectiveValue ? "Included" : "Excluded"}
                    </span>
                  </div>
                ) : (
                  <Input
                    size="middle"
                    placeholder="e.g. 2 Hours"
                    value={effectiveValue}
                    onChange={(e) => handleValueChange(key, e.target.value)}
                    style={{ fontSize: "13px" }}
                  />
                )}
              </div>

              {/* Type Toggle */}
              <Tooltip
                title={isBool ? "Switch to Text Input" : "Switch to Yes/No"}
              >
                <Button
                  size="small"
                  type="text"
                  style={{ color: "#94a3b8" }}
                  icon={isBool ? <Type size={14} /> : <ToggleLeft size={14} />}
                  onClick={() => handleValueChange(key, isBool ? "" : true)}
                />
              </Tooltip>
            </div>

            {/* Delete */}
            <Popconfirm
              title="Delete row?"
              okText="Yes"
              cancelText="No"
              onConfirm={() => handleDeleteRow(key)}
            >
              <Button
                type="text"
                size="small"
                danger
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  opacity: 0.6,
                }}
                icon={<Trash2 size={14} />}
              />
            </Popconfirm>
          </div>
        );
      })}

      <Button
        type="dashed"
        size="small"
        block
        icon={<Plus size={12} />}
        onClick={handleAddFeature}
        style={{
          marginTop: "4px",
          fontSize: "12px",
          color: "#64748b",
          borderColor: "#e2e8f0",
        }}
      >
        Add Comparison Row
      </Button>
    </div>
  );
};

// --- HELPER COMPONENTS ---

const StandardLabel = ({ icon: Icon, label, help }) => (
  <div style={{ marginBottom: 6 }}>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontWeight: 500,
        fontSize: "14px",
        color: appTheme.token.colorText,
      }}
    >
      {Icon && <Icon size={14} color={appTheme.token.colorTextSecondary} />}
      {label}
    </div>
    {help && (
      <div
        style={{
          fontSize: "12px",
          color: appTheme.token.colorTextSecondary,
          marginTop: 2,
          marginLeft: Icon ? 20 : 0,
        }}
      >
        {help}
      </div>
    )}
  </div>
);

const ScheduleModeSelector = ({ value, onChange }) => {
  return (
    <ScheduleCardGroup>
      <ScheduleCard
        $selected={value === "synced"}
        onClick={() => onChange("synced")}
      >
        <h5>
          <Users size={16} /> Same Spot / Time
        </h5>
        <p>
          Happens alongside the Primary tier. Great for VIP upgrades or pricing
          variations for the same event.
        </p>
      </ScheduleCard>
      <ScheduleCard
        $selected={value === "independent"}
        onClick={() => onChange("independent")}
      >
        <h5>
          <CalendarDays size={16} /> Separate Time
        </h5>
        <p>
          Has its own unique schedule. Great for "Tuesday Discount" vs "Saturday
          Premium" or different rooms.
        </p>
      </ScheduleCard>
    </ScheduleCardGroup>
  );
};

// --- SUB-COMPONENTS FOR TABS ---

const TierBasicsTab = ({ field, isPrimary, form }) => {
  return (
    <div style={{ paddingTop: "8px" }}>
      <StandardLabel
        icon={Ticket}
        label="Tier Name"
        help="The name visible to customers (e.g., VIP)."
      />
      <FormItemAntd
        {...field}
        name={[field.name, "title"]}
        rules={[{ required: true, message: "Please name this tier" }]}
      >
        <Input
          placeholder={isPrimary ? "e.g. General Admission" : "e.g. VIP Access"}
          size="middle"
        />
      </FormItemAntd>

      <div style={{ marginTop: "16px" }}>
        <StandardLabel
          icon={ListChecks}
          label="Features & Comparison"
          help="Define what is included in this tier. Rows are synced across all tiers."
        />
        {/* We do NOT bind this Form.Item to 'description' directly via 'name' property.
            Instead, FeatureBuilder manages the form state for 'options' globally.
            However, we keep the Form.Item for layout consistency, but remove 'name'.
         */}
        <Form.Item style={{ marginBottom: "16px" }}>
          <FeatureBuilder form={form} tierIndex={field.name} />
        </Form.Item>
      </div>

      {!isPrimary && (
        <div style={{ marginTop: "24px" }}>
          <StandardLabel
            icon={CalendarRange}
            label="Schedule Behavior"
            help="Does this tier happen at the same time as your primary event?"
          />
          <FormItemAntd
            {...field}
            name={[field.name, "schedule_mode"]}
            initialValue="synced"
            style={{ marginBottom: 0 }}
          >
            <ScheduleModeSelector />
          </FormItemAntd>
        </div>
      )}
    </div>
  );
};

const TierDetailsTab = ({ field, form }) => {
  return (
    <div style={{ paddingTop: "8px" }}>
      <FormGrid>
        <div>
          <StandardLabel
            icon={Activity}
            label="Activity Level"
            help="Difficulty intensity."
          />
          <FormItemAntd
            {...field}
            name={[field.name, "level"]}
            initialValue="all"
          >
            <Select size="middle">
              <Option value="all">Open to Everyone</Option>
              <Option value="no-experience">No Experience Needed</Option>
              <Option value="intermediate">Intermediate</Option>
              <Option value="advanced">Advanced</Option>
              <Option value="strenuous">Strenuous</Option>
            </Select>
          </FormItemAntd>
        </div>
      </FormGrid>

      <div style={{ marginTop: "16px" }}>
        <StandardLabel
          icon={Backpack}
          label="Packing List"
          help="Items guests should bring (Type and press Enter)."
        />
        <FormItemAntd {...field} name={[field.name, "equipment"]}>
          <StyledTagsSelect
            mode="tags"
            size="middle"
            placeholder="e.g. Towel, ID Card, Water"
            style={{ width: "100%" }}
            tokenSeparators={[","]}
            open={false}
          />
        </FormItemAntd>
      </div>

      <div style={{ marginTop: "16px" }}>
        <StandardLabel
          icon={TagIcon}
          label="Search Tags"
          help="Keywords for discovery."
        />
        <FormItemAntd {...field} name={[field.name, "tags"]}>
          <StyledTagsSelect
            mode="tags"
            size="middle"
            placeholder="Keywords..."
            style={{ width: "100%" }}
            tokenSeparators={[","]}
            open={false}
          />
        </FormItemAntd>
      </div>
    </div>
  );
};

const TierPoliciesTab = ({ field, form, bookingType }) => {
  return (
    <div style={{ paddingTop: "8px" }}>
      <FormGrid>
        <div>
          <StandardLabel
            icon={FileText}
            label="Cancellation Notice"
            help="Minimum notice for refund."
          />
          <FormItemAntd
            {...field}
            name={[field.name, "cancellationPolicy"]}
            initialValue="flexible"
            rules={[{ required: true }]}
          >
            <Select size="middle">
              <Option value="flexible">Flexible (1hr)</Option>
              <Option value="24h">24 Hours</Option>
              <Option value="48h">48 Hours</Option>
              <Option value="72h">72 Hours</Option>
              <Option value="strict">Strict (Non-refundable)</Option>
              <Option value="custom">Custom</Option>
            </Select>
          </FormItemAntd>
        </div>

        <Form.Item
          shouldUpdate={(prev, curr) =>
            prev.options?.[field.key]?.cancellationPolicy !==
            curr.options?.[field.key]?.cancellationPolicy
          }
          noStyle
        >
          {({ getFieldValue }) => {
            const policy = getFieldValue([
              "options",
              field.name,
              "cancellationPolicy",
            ]);
            const isStrict = policy === "strict";

            return (
              <div>
                <StandardLabel
                  icon={Percent}
                  label="Refund"
                  help="Amount refunded."
                />
                <FormItemAntd
                  {...field}
                  name={[field.name, "cancellationRefundPercentage"]}
                  initialValue={100}
                >
                  <StyledInputNumber
                    min={0}
                    max={100}
                    formatter={(val) => `${val}%`}
                    disabled={isStrict}
                    size="middle"
                  />
                </FormItemAntd>
              </div>
            );
          }}
        </Form.Item>
      </FormGrid>

      {/* Custom Hours Expansion */}
      <Form.Item
        shouldUpdate={(prev, curr) =>
          prev.options?.[field.key]?.cancellationPolicy !==
          curr.options?.[field.key]?.cancellationPolicy
        }
        noStyle
      >
        {({ getFieldValue, setFieldsValue }) => {
          const policy = getFieldValue([
            "options",
            field.name,
            "cancellationPolicy",
          ]);
          if (policy !== "custom") return null;

          return (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              style={{ overflow: "hidden", marginTop: 16 }}
            >
              <div style={{ marginBottom: 16 }}>
                <StandardLabel
                  icon={Clock}
                  label="Custom Hours Notice"
                  help="Hours before start required."
                />
                <div style={{ display: "flex", gap: "12px" }}>
                  <FormItemAntd
                    {...field}
                    name={[field.name, "cancellationCustomHours"]}
                    rules={[{ required: true, message: "Required" }]}
                    style={{ marginBottom: 0, flex: 1 }}
                  >
                    <InputNumber
                      min={1}
                      placeholder="e.g. 12"
                      addonAfter="Hours"
                      size="middle"
                      style={{ width: "100%" }}
                    />
                  </FormItemAntd>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    {[12, 24, 48, 168].map((h) => (
                      <QuickPill
                        key={h}
                        onClick={() =>
                          setFieldsValue({
                            options: {
                              [field.name]: { cancellationCustomHours: h },
                            },
                          })
                        }
                      >
                        {h < 25 ? `${h}h` : `${h / 24}d`}
                      </QuickPill>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        }}
      </Form.Item>

      {/* Mid-Course Logic - Only if Full Course */}
      {bookingType === "Full Course" && (
        <div
          style={{
            marginTop: "24px",
            borderTop: "1px dashed #e2e8f0",
            paddingTop: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "16px",
            }}
          >
            <StandardLabel
              icon={AlertCircle}
              label="Mid-Series Drops"
              help="Allow partial refunds after start?"
            />
            <FormItemAntd
              {...field}
              name={[field.name, "allowMidCourseDrops"]}
              valuePropName="checked"
              initialValue={false}
              noStyle
            >
              <Switch checkedChildren="Yes" unCheckedChildren="No" />
            </FormItemAntd>
          </div>

          <Form.Item
            shouldUpdate={(prev, curr) =>
              prev.options?.[field.key]?.allowMidCourseDrops !==
              curr.options?.[field.key]?.allowMidCourseDrops
            }
          >
            {({ getFieldValue }) => {
              const allowed = getFieldValue([
                "options",
                field.name,
                "allowMidCourseDrops",
              ]);
              if (!allowed) return null;

              return (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                >
                  <FormGrid>
                    <div>
                      <StandardLabel label="Drop Notice" />
                      <FormItemAntd
                        {...field}
                        name={[field.name, "midCourseCancellationPolicy"]}
                        initialValue="24h"
                      >
                        <Select size="middle">
                          <Option value="flexible">Flexible</Option>
                          <Option value="24h">24 Hours</Option>
                          <Option value="48h">48 Hours</Option>
                          <Option value="strict">Strict</Option>
                        </Select>
                      </FormItemAntd>
                    </div>
                    <div>
                      <StandardLabel label="Refund % (Remaining)" />
                      <FormItemAntd
                        {...field}
                        name={[
                          field.name,
                          "midCourseCancellationRefundPercentage",
                        ]}
                        initialValue={100}
                      >
                        <StyledInputNumber
                          min={0}
                          max={100}
                          formatter={(val) => `${val}%`}
                          size="middle"
                        />
                      </FormItemAntd>
                    </div>
                  </FormGrid>
                </motion.div>
              );
            }}
          </Form.Item>
        </div>
      )}
    </div>
  );
};

const AWS_LOCATION_API_URL =
  "https://geocoding.classeasily.com/address-autocomplete-proxy";
const SEARCH_DEBOUNCE_MS = 300;
const MAP_ZOOM_LEVEL = 13;
const MAP_CIRCLE_RADIUS = 1000;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/avif",
  "",
];

const MAX_IMAGE_SIZE_MB = 30;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const ACCEPTED_IMAGE_FORMATS_STRING = ALLOWED_IMAGE_TYPES.join(",");

const MapCenterHandler = ({ center }) => {
  const map = useMap();
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (
      center &&
      center.length === 2 &&
      !isNaN(center[0]) &&
      !isNaN(center[1])
    ) {
      if (isInitialMount.current) {
        map.setView(center, MAP_ZOOM_LEVEL);
        isInitialMount.current = false;
      } else {
        map.flyTo(center, MAP_ZOOM_LEVEL);
      }
    }
  }, [center, map]);
  return null;
};

// Preset features matching creation flow
const presetFeaturesOptions = [
  { value: "All Supplies Included", label: "All Supplies Included" },
  { value: "Beginner Friendly", label: "Beginner Friendly" },
  { value: "Drinks Included", label: "Drinks Included" },
  { value: "Food Included", label: "Food Included" },
  { value: "Take-Home Creation", label: "Take-Home Creation" },
  { value: "Small Group", label: "Small Group" },
  { value: "Private Group Available", label: "Private Group Available" },
  { value: "Date Night", label: "Date Night" },
  { value: "Family Friendly", label: "Family Friendly" },
  { value: "Great for Teams", label: "Great for Teams" },
  { value: "Free Parking", label: "Free Parking" },
  { value: "Indoor", label: "Indoor" },
  { value: "Outdoor", label: "Outdoor" },
  { value: "Wheelchair Accessible", label: "Wheelchair Accessible" },
];

const ClassEditDrawer = ({
  visible,
  onClose,
  classData: initialClassDataProp,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("1");
  const [mainImages, setMainImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [mapSearchResults, setMapSearchResults] = useState([]);
  const [mapSearchValue, setMapSearchValue] = useState("");
  const [selectedMapLocation, setSelectedMapLocation] = useState(null);
  const [hideExactLocation, setHideExactLocation] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Active tier for accordion
  const [activeTier, setActiveTier] = useState(0);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const initialClassDataRef = useRef(null);
  const initialSubcategoryKeyRef = useRef(null);

  const currentFormCategoryKey = Form.useWatch("category_key", form);
  // Watch booking type for Policy Tab logic
  const bookingType = Form.useWatch("booking_type", form);

  useEffect(() => {
    return () => {
      mainImages.forEach((image) => {
        if (image.url && image.url.startsWith("blob:")) {
          URL.revokeObjectURL(image.url);
        }
      });
    };
  }, [mainImages]);

  useEffect(() => {
    if (visible && initialClassDataProp) {
      setDataLoading(true);
      initialSubcategoryKeyRef.current = null;
      initialClassDataRef.current = JSON.parse(
        JSON.stringify(initialClassDataProp),
      );
      fetchCategories().then((loadedCategoriesFromFetch) => {
        initializeFormAndStates(
          initialClassDataRef.current,
          loadedCategoriesFromFetch || [],
        );
        setDataLoading(false);
      });
    } else if (!visible) {
      form.resetFields();
      setMainImages([]);
      setCategories([]);
      setSubcategories([]);
      initialSubcategoryKeyRef.current = null;
      setMapSearchResults([]);
      setMapSearchValue("");
      setSelectedMapLocation(null);
      setHideExactLocation(false);
      setActiveTab("1");
      setActiveTier(0);
      initialClassDataRef.current = null;
    }
  }, [visible, initialClassDataProp, form]);

  useEffect(() => {
    const catKey = currentFormCategoryKey;
    if (!catKey || categories.length === 0) {
      setSubcategories([]);
      if (!catKey && form.getFieldValue("subcategory_key")) {
        form.setFieldsValue({ subcategory_key: undefined });
      }
      return;
    }
    const selectedCatData = categories.find((c) => c.key === catKey);
    const newSubcategories = selectedCatData?.subcategories || [];
    setSubcategories(newSubcategories);
    const currentFormSubcategory = form.getFieldValue("subcategory_key");
    if (
      initialSubcategoryKeyRef.current &&
      newSubcategories.some(
        (sub) => sub.key === initialSubcategoryKeyRef.current,
      )
    ) {
      if (currentFormSubcategory !== initialSubcategoryKeyRef.current) {
        form.setFieldsValue({
          subcategory_key: initialSubcategoryKeyRef.current,
        });
      }
      initialSubcategoryKeyRef.current = null;
    } else if (
      currentFormSubcategory &&
      !newSubcategories.some((sub) => sub.key === currentFormSubcategory)
    ) {
      form.setFieldsValue({ subcategory_key: undefined });
    }
  }, [currentFormCategoryKey, categories, form]);

  const handleOpenChange = (open) => {
    if (!open) {
      onClose();
    }
  };

  const fetchCategories = async () => {
    try {
      const result = await businessClassService.getCategories();
      if (result.success && Array.isArray(result.data)) {
        setCategories(result.data);
        return result.data;
      }
      message.error(result.error || "Failed to load categories");
      setCategories([]);
      return null;
    } catch (error) {
      message.error("An error occurred while loading categories.");
      console.error("Category fetch error:", error);
      setCategories([]);
      return null;
    }
  };

  const initializeFormAndStates = (classData, loadedCategories) => {
    initialSubcategoryKeyRef.current = classData.subcategory_key || null;

    let featuresData = classData.features || [];
    if (typeof featuresData === "string") {
      try {
        featuresData = JSON.parse(featuresData);
      } catch (e) {
        featuresData = [];
      }
    }
    if (!Array.isArray(featuresData)) {
      featuresData = [];
    }

    // MULTI-TIER MAPPING
    const existingOptions =
      classData.options && classData.options.length > 0
        ? classData.options
        : [
            {
              // Default fallback if no options exist (unlikely)
              title: "General Admission",
              schedule_mode: "primary",
              cancellationPolicy: "flexible",
              cancellationRefundPercentage: 100,
              level: "all",
            },
          ];

    const mappedOptions = existingOptions.map((opt, index) => ({
      ...opt,
      schedule_mode: index === 0 ? "primary" : opt.schedule_mode || "synced",
      // Ensure specific fields are present to avoid uncontrolled inputs
      title: opt.title || (index === 0 ? "General Admission" : "Option"),
      description: opt.description || "",
      equipment: opt.equipment || [],
      tags: opt.tags || [],
    }));

    const globalBookingType =
      existingOptions[0]?.booking_type || "Single Session";

    form.setFieldsValue({
      title: classData.title || "",
      description: classData.description || "",
      category_key: classData.category_key || undefined,
      subcategory_key: classData.subcategory_key || undefined,
      features: featuresData,
      location: classData.location || "",
      unit_number: classData.unit_number || "",
      coordinates: classData.coordinates || "0,0",
      saltLocation: classData.saltLocation || false,
      city: classData.city || "",
      state: classData.state || "",
      studentContactEmail: classData.studentContactEmail || "",
      studentContactPhone: classData.studentContactPhone || "",

      // Global for convenience, but applied to all options
      booking_type: globalBookingType,
      options: mappedOptions,
    });

    setHideExactLocation(classData.saltLocation || false);

    if (
      classData.coordinates &&
      classData.location &&
      classData.coordinates !== "0,0"
    ) {
      try {
        const [latStr, lonStr] = classData.coordinates.split(",");
        const lat = parseFloat(latStr);
        const lon = parseFloat(lonStr);
        if (!isNaN(lat) && !isNaN(lon)) {
          setSelectedMapLocation({
            lat,
            lon,
            display_name: classData.location,
          });
        }
      } catch (e) {
        console.error("Error parsing initial coordinates:", e);
      }
    }

    setMapSearchValue(classData.location || "");
    let coverFound = false;
    const initialImages = (classData.images || []).map((img) => {
      const isCover = img.isCover || img.is_cover;
      if (isCover) coverFound = true;
      return {
        id: img.imageId,
        url: img.image_thumb_url,
        isCover: isCover,
        file: null,
        name: img.image?.split("/").pop() || `image-${img.imageId}`,
      };
    });
    if (!coverFound && initialImages.length > 0) {
      initialImages[0].isCover = true;
    }
    setMainImages(initialImages);
  };

  const searchAwsLocation = async (query) => {
    if (!query || query.trim().length < 3) {
      setMapSearchResults([]);
      return;
    }
    try {
      const response = await fetch(
        `${AWS_LOCATION_API_URL}?text=${encodeURIComponent(query)}`,
      );
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setMapSearchResults(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Location search failed:", error);
      message.error("Location search failed.");
      setMapSearchResults([]);
    }
  };

  const debouncedAwsSearch = useCallback(
    debounce(searchAwsLocation, SEARCH_DEBOUNCE_MS),
    [],
  );

  const handleMapLocationSelect = (locationResult) => {
    const { displayName, coordinates, city, state, zipCode, country } =
      locationResult;
    if (!coordinates?.lat || !coordinates?.lng) {
      message.error("Invalid location data selected.");
      return;
    }
    const { lat, lng } = coordinates;
    setMapSearchValue(displayName);
    setSelectedMapLocation({ lat, lon: lng, display_name: displayName });
    form.setFieldsValue({
      location: displayName,
      coordinates: `${lat},${lng}`,
      city: city || "",
      state: state || "",
      zipCode: zipCode || "",
      country: country || "",
    });
    setMapSearchResults([]);
  };

  const handleLocationPrivacyToggle = (type) => {
    const newValue = type === "hide";
    setHideExactLocation(newValue);
    form.setFieldsValue({ saltLocation: newValue });
  };

  const processAndSetImages = async (files) => {
    const remainingSlots = 10 - mainImages.length;
    if (remainingSlots <= 0) {
      message.warning("Maximum 10 main images allowed.");
      return;
    }

    const validateFile = (file) => {
      const fileExtension = file.name.toLowerCase().split(".").pop();
      const allowedExtensions = [
        "jpg",
        "jpeg",
        "png",
        "webp",
        "heic",
        "heif",
        "avif",
      ];

      const isValidType =
        ALLOWED_IMAGE_TYPES.includes(file.type) ||
        allowedExtensions.includes(fileExtension);

      if (!isValidType) {
        const friendlyFormatNames = [
          "JPEG",
          "PNG",
          "WEBP",
          "HEIC",
          "HEIF",
          "AVIF",
        ];
        message.error(
          `Invalid file type: ${
            file.name
          }. Please upload one of the following: ${friendlyFormatNames.join(
            ", ",
          )}.`,
        );
        return false;
      }

      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        message.error(
          `File too large: ${file.name}. Max ${MAX_IMAGE_SIZE_MB}MB.`,
        );
        return false;
      }

      return true;
    };

    const filesToProcess = Array.from(files)
      .slice(0, remainingSlots)
      .filter(validateFile);
    if (filesToProcess.length === 0) return;

    message.loading({
      content: `Processing ${filesToProcess.length} image(s)...`,
      key: "imgProcEdit",
      duration: 0,
    });

    const processSingleImage = async (file) => {
      const fileExtension = file.name.toLowerCase().split(".").pop();
      const isHeic =
        file.type === "image/heic" ||
        file.type === "image/heif" ||
        ["heic", "heif"].includes(fileExtension);

      try {
        let blobToProcess = file;

        if (isHeic) {
          blobToProcess = await heic2any({
            blob: file,
            toType: "image/jpeg",
            quality: 0.9,
          });
        }

        const processedFile =
          blobToProcess instanceof File
            ? blobToProcess
            : new File(
                [blobToProcess],
                file.name.replace(/\.(heic|heif)$/i, ".jpeg"),
                { type: "image/jpeg" },
              );

        return {
          id: `new_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          file: processedFile,
          url: URL.createObjectURL(processedFile),
          isCover: false,
          name: processedFile.name,
        };
      } catch (error) {
        console.error(`HEIC conversion failed for ${file.name}:`, error);
        message.error(`Could not process HEIC file: ${file.name}`);
        return null;
      }
    };
    const newImageObjectsPromises = filesToProcess.map(processSingleImage);
    const newImageResults = await Promise.all(newImageObjectsPromises);
    const successfullyProcessed = newImageResults.filter(Boolean);

    message.destroy("imgProcEdit");
    if (successfullyProcessed.length > 0) {
      setMainImages((prevImages) => {
        let updatedImages = [...prevImages, ...successfullyProcessed];
        if (
          !updatedImages.some((img) => img.isCover) &&
          updatedImages.length > 0
        ) {
          updatedImages[0].isCover = true;
        }
        return updatedImages.slice(0, 10);
      });
    }
  };

  const handleBeforeUpload = (file, fileList) => {
    processAndSetImages(fileList);
    return false;
  };

  const handleRemoveMainImage = (idToRemove) => {
    const imageToRemove = mainImages.find((img) => img.id === idToRemove);
    if (imageToRemove?.url?.startsWith("blob:")) {
      URL.revokeObjectURL(imageToRemove.url);
    }
    setMainImages((prevImages) => {
      const updated = prevImages.filter((img) => img.id !== idToRemove);
      if (
        imageToRemove?.isCover &&
        updated.length > 0 &&
        !updated.some((img) => img.isCover)
      ) {
        updated[0].isCover = true;
      }
      return updated;
    });
  };

  const handleSetCoverMainImage = (idToSetAsCover) => {
    setMainImages((prevImages) =>
      prevImages.map((img) => ({ ...img, isCover: img.id === idToSetAsCover })),
    );
  };

  const addTier = (addFn) => {
    const primaryTier = form.getFieldValue(["options", 0]);
    addFn({
      title: "",
      schedule_mode: "synced",
      level: primaryTier.level || "all",
      equipment: primaryTier.equipment || [],
      tags: primaryTier.tags || [],
      cancellationPolicy: primaryTier.cancellationPolicy,
      cancellationRefundPercentage: primaryTier.cancellationRefundPercentage,
      cancellationCustomHours: primaryTier.cancellationCustomHours,
      allowMidCourseDrops: primaryTier.allowMidCourseDrops,
      midCourseCancellationPolicy: primaryTier.midCourseCancellationPolicy,
    });
    const currentLen = form.getFieldValue("options").length;
    setActiveTier(currentLen);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      const newImageFiles = mainImages.filter((img) => img.file);
      const existingImages = mainImages.filter((img) => !img.file);

      let uploadedImageKeys = [];
      let uploadResults = [];

      // 1. Handle Image Uploads
      if (newImageFiles.length > 0) {
        message.loading({
          content: `Uploading ${newImageFiles.length} image(s)...`,
          key: "imgUploadEdit",
        });

        const uploadPromises = newImageFiles.map((img) =>
          uploadService.uploadFile(img.file, "class_image"),
        );

        uploadResults = await Promise.all(uploadPromises);
        message.destroy("imgUploadEdit");

        const failedUploads = uploadResults.filter((res) => !res.success);
        if (failedUploads.length > 0) {
          message.error(
            `Failed to upload ${failedUploads.length} image(s). Please try again.`,
          );
          setLoading(false);
          return;
        }

        uploadedImageKeys = uploadResults.map((res) => res.s3_key);
      }

      // 2. Prepare Base Payload
      const payload = { ...values };
      payload.saltLocation = hideExactLocation;

      // 3. Handle Deleted/New Images
      const initialImageIds = (initialClassDataRef.current?.images || []).map(
        (img) => img.imageId,
      );
      const remainingImageIds = existingImages.map((img) => img.id);
      payload.delete_image_ids = JSON.stringify(
        initialImageIds.filter((id) => !remainingImageIds.includes(id)),
      );

      payload.new_image_s3_keys = JSON.stringify(uploadedImageKeys);

      // 4. Handle Cover Image
      const coverImage = mainImages.find((img) => img.isCover);
      if (coverImage) {
        if (coverImage.file) {
          const newCoverFile = coverImage.file;
          const correspondingUploadResultIndex = newImageFiles.findIndex(
            (newImg) => newImg.file === newCoverFile,
          );

          if (
            correspondingUploadResultIndex !== -1 &&
            uploadResults[correspondingUploadResultIndex]?.success
          ) {
            payload.cover_image_s3_key =
              uploadResults[correspondingUploadResultIndex].s3_key;
          }
        } else {
          payload.cover_image_id = coverImage.id;
        }
      }

      // 5. Prepare Multi-Tier Options Data
      const isCourse = values.booking_type === "Full Course";

      const formattedOptions = values.options.map((opt, index) => ({
        optionId: opt.optionId, // ID for updates, undefined for new

        // Structure & Metadata
        title: opt.title || (index === 0 ? "General Admission" : "Option"),
        description: opt.description || "",
        booking_type: values.booking_type,
        price_type: isCourse ? "full_course" : "per_session",
        schedule_mode: index === 0 ? "primary" : opt.schedule_mode || "synced",

        // Activity & Details
        level: opt.level || "all",
        equipment: opt.equipment || [],
        tags: opt.tags || [],

        // Standard Policy
        cancellationPolicy: opt.cancellationPolicy,
        cancellationCustomHours:
          opt.cancellationPolicy === "custom"
            ? opt.cancellationCustomHours
            : null,
        cancellationRefundPercentage: opt.cancellationRefundPercentage ?? 100,

        // Mid-Course Drop Policy
        allowMidCourseDrops: isCourse
          ? opt.allowMidCourseDrops || false
          : false,

        midCourseCancellationPolicy:
          isCourse && opt.allowMidCourseDrops
            ? opt.midCourseCancellationPolicy
            : null,

        midCourseCancellationCustomHours:
          isCourse &&
          opt.allowMidCourseDrops &&
          opt.midCourseCancellationPolicy === "custom"
            ? opt.midCourseCancellationCustomHours
            : null,

        midCourseCancellationRefundPercentage:
          isCourse && opt.allowMidCourseDrops
            ? (opt.midCourseCancellationRefundPercentage ?? 100)
            : null,
      }));

      payload.options = JSON.stringify(formattedOptions);

      // 6. Send Update
      const result = await businessClassService.updateClass(
        initialClassDataProp.classId,
        payload,
      );

      if (result.success) {
        onSuccess?.(result.data);
        onClose();
      } else {
        const errorDetail =
          result.error ||
          result.errors ||
          result.message ||
          "Failed to update experience.";
        if (typeof errorDetail === "object") {
          Object.entries(errorDetail).forEach(([field, errors]) => {
            message.error(
              `${field}: ${Array.isArray(errors) ? errors.join(", ") : errors}`,
            );
          });
        } else {
          message.error(errorDetail);
        }
      }
    } catch (errorInfo) {
      console.error("Submit error:", errorInfo);
      if (errorInfo.errorFields) {
        message.error("Please correct the highlighted errors.");
        const firstErrorField = errorInfo.errorFields[0]?.name?.[0];
        if (
          [
            "title",
            "description",
            "category_key",
            "subcategory_key",
            "features",
            "class_photos_validation_edit",
          ].includes(firstErrorField)
        ) {
          setActiveTab("1");
        } else if (
          [
            "location",
            "coordinates",
            "studentContactEmail",
            "studentContactPhone",
          ].includes(firstErrorField)
        ) {
          setActiveTab("2");
        } else if (["options", "booking_type"].includes(firstErrorField)) {
          setActiveTab("3");
        }
      } else {
        message.error("An unexpected error occurred during submission.");
      }
    } finally {
      setLoading(false);
    }
  };

  const descriptionTooltipContent = (
    <div style={{ maxWidth: "300px" }}>
      <strong>Make your description engaging:</strong>
      <ul
        style={{ paddingLeft: "20px", margin: "5px 0 0 0", fontSize: "12px" }}
      >
        <li>What will guests do?</li>
        <li>Is there a specific vibe or atmosphere?</li>
        <li>What makes this experience unique?</li>
        <li>Who is your host (you)?</li>
      </ul>
    </div>
  );

  const renderDrawerContent = () => (
    <>
      <DrawerHeader>
        <DrawerTitle level={4}>Edit Experience</DrawerTitle>
        <CloseButton
          icon={<X size={20} />}
          onClick={onClose}
          disabled={loading || dataLoading}
        />
      </DrawerHeader>
      <DrawerContentWrapper>
        {dataLoading ? (
          <LoaderWrapper>
            <GlobalLoaderWithoutInlineStyles />
          </LoaderWrapper>
        ) : (
          <>
            <StyledTabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={[
                {
                  label: "Basic Info",
                  key: "1",
                  children: (
                    <TabContentWrapper>
                      <FormSection>
                        <FormGroup>
                          <FormLabel htmlFor="edit_class_title">
                            <Sparkles size={16} />
                            Experience Title
                          </FormLabel>
                          <HelpText>
                            <Info size={14} />
                            Catchy and descriptive. e.g., "Secret Jazz Club &
                            Cocktails".
                          </HelpText>
                          <FormItemAntd
                            name="title"
                            rules={[
                              {
                                required: true,
                                message: "Please enter a title",
                              },
                              {
                                min: 5,
                                message: "Title must be at least 5 characters",
                              },
                              {
                                max: 100,
                                message: "Title cannot exceed 100 characters",
                              },
                            ]}
                          >
                            <StyledInput
                              id="edit_class_title"
                              placeholder="e.g., Hidden Street Art Walk"
                            />
                          </FormItemAntd>
                        </FormGroup>
                        <FormGroup>
                          <FormLabel htmlFor="edit_class_description">
                            <Tent size={16} />
                            What you'll do (Description)
                            <Tooltip
                              title={descriptionTooltipContent}
                              placement="topRight"
                              overlayInnerStyle={{ maxWidth: "300px" }}
                            >
                              <Info
                                size={14}
                                style={{
                                  color: appTheme.token.colorTextSecondary,
                                  cursor: "help",
                                  marginLeft: "4px",
                                }}
                              />
                            </Tooltip>
                          </FormLabel>
                          <HelpText>
                            <Info size={14} />
                            Describe the itinerary, the atmosphere, and what's
                            included.
                          </HelpText>
                          <FormItemAntd
                            name="description"
                            rules={[
                              {
                                required: true,
                                message: "Please enter a description",
                              },
                              {
                                min: 100,
                                message:
                                  "Description must be at least 100 characters",
                              },
                              {
                                max: 4000,
                                message:
                                  "Description cannot exceed 4000 characters",
                              },
                            ]}
                          >
                            <StyledTextArea
                              id="edit_class_description"
                              rows={5}
                              placeholder="We'll meet at... Then we'll explore..."
                              showCount
                              maxLength={4000}
                            />
                          </FormItemAntd>
                        </FormGroup>
                      </FormSection>
                      <SectionDivider>
                        <span>
                          <ImagePlus size={16} />
                          Gallery
                        </span>
                      </SectionDivider>
                      <FormSection>
                        <FormGroup>
                          <FormLabel>
                            <ImagePlus size={16} />
                            Photos (2-10 required)
                          </FormLabel>
                          <HelpText>
                            <Info size={14} />
                            Show people having fun, the environment, and
                            details.
                          </HelpText>
                          <FormItemAntd
                            name="class_photos_validation_edit"
                            rules={[
                              {
                                validator: async () => {
                                  if (!mainImages || mainImages.length < 2)
                                    return Promise.reject(
                                      new Error(
                                        "Please upload at least 2 images.",
                                      ),
                                    );
                                  if (mainImages.length > 10)
                                    return Promise.reject(
                                      new Error("Maximum 10 images allowed."),
                                    );
                                  if (
                                    mainImages.length > 0 &&
                                    !mainImages.some((img) => img.isCover)
                                  )
                                    return Promise.reject(
                                      new Error("Please select a cover image."),
                                    );
                                  return Promise.resolve();
                                },
                              },
                            ]}
                            dependencies={[
                              mainImages
                                .map(
                                  (img) =>
                                    `${img.id}-${img.isCover}-${img.url}`,
                                )
                                .join(","),
                            ]}
                          >
                            <ImageUploadSection>
                              <ImageGrid>
                                {mainImages.map((image) => (
                                  <ImageCard
                                    key={image.id}
                                    $isCover={image.isCover}
                                  >
                                    <ImagePreview
                                      src={image.url}
                                      alt={image.name || "Experience image"}
                                    />
                                    <ImageActions>
                                      {!image.isCover &&
                                        mainImages.length > 0 && (
                                          <Tooltip title="Set as cover">
                                            <ActionButton
                                              type="button"
                                              onClick={() =>
                                                handleSetCoverMainImage(
                                                  image.id,
                                                )
                                              }
                                            >
                                              <Star />
                                            </ActionButton>
                                          </Tooltip>
                                        )}
                                      <Tooltip title="Remove image">
                                        <ActionButton
                                          type="button"
                                          onClick={() =>
                                            handleRemoveMainImage(image.id)
                                          }
                                        >
                                          <X />
                                        </ActionButton>
                                      </Tooltip>
                                    </ImageActions>
                                    {image.isCover && (
                                      <CoverBadge>
                                        <Star size={12} />
                                        Cover
                                      </CoverBadge>
                                    )}
                                  </ImageCard>
                                ))}
                                {mainImages.length < 10 && (
                                  <StyledDragger
                                    multiple
                                    showUploadList={false}
                                    beforeUpload={handleBeforeUpload}
                                    accept={ACCEPTED_IMAGE_FORMATS_STRING}
                                  >
                                    <ImageCard $isUpload>
                                      <ImagePlus size={32} color="#94a3b8" />
                                      <span
                                        style={{
                                          fontSize: "14px",
                                          fontWeight: "500",
                                        }}
                                      >
                                        Add Photos
                                      </span>
                                      <span
                                        style={{
                                          fontSize: "12px",
                                          color: "#64748b",
                                        }}
                                      >
                                        Drag or click
                                      </span>
                                    </ImageCard>
                                  </StyledDragger>
                                )}
                              </ImageGrid>
                            </ImageUploadSection>
                          </FormItemAntd>
                        </FormGroup>
                      </FormSection>
                      <SectionDivider>
                        <span>
                          <Building2 size={16} />
                          Category & Tags
                        </span>
                      </SectionDivider>
                      <FormSection>
                        <FormGrid>
                          <FormGroup>
                            <FormLabel htmlFor="edit_class_category">
                              <Building2 size={16} />
                              Primary Category
                            </FormLabel>
                            <HelpText>
                              <Info size={14} />
                              What type of experience is this?
                            </HelpText>
                            <FormItemAntd
                              name="category_key"
                              rules={[
                                {
                                  required: true,
                                  message: "Please select a category",
                                },
                              ]}
                            >
                              <StyledSelect
                                id="edit_class_category"
                                placeholder="Select category"
                                allowClear
                                loading={categories.length === 0 && dataLoading}
                              >
                                {categories.map((cat) => (
                                  <Option key={cat.key} value={cat.key}>
                                    {cat.name}
                                  </Option>
                                ))}
                              </StyledSelect>
                            </FormItemAntd>
                          </FormGroup>
                          <FormGroup>
                            <FormLabel htmlFor="edit_class_subcategory">
                              <Hash size={16} />
                              Subcategory
                            </FormLabel>
                            <HelpText>
                              <Info size={14} />
                              Select a specific tag for guests.
                            </HelpText>
                            <FormItemAntd
                              name="subcategory_key"
                              rules={[
                                {
                                  required: true,
                                  message: "Please select a subcategory",
                                },
                              ]}
                            >
                              <StyledSelect
                                id="edit_class_subcategory"
                                placeholder="Select a subcategory"
                                disabled={!currentFormCategoryKey}
                                loading={
                                  !!currentFormCategoryKey &&
                                  subcategories.length === 0 &&
                                  !dataLoading
                                }
                                allowClear
                              >
                                {subcategories.map((sub) => (
                                  <Option key={sub.key} value={sub.key}>
                                    {sub.name}
                                  </Option>
                                ))}
                              </StyledSelect>
                            </FormItemAntd>
                          </FormGroup>
                        </FormGrid>
                        <FormGroup>
                          <FormLabel htmlFor="edit_class_features">
                            <Hash size={16} />
                            Features & Highlights
                          </FormLabel>
                          <HelpText>
                            <Info size={14} />
                            What's included? What's the vibe?
                          </HelpText>
                          <FormItemAntd
                            name="features"
                            rules={[
                              {
                                required: true,
                                message: "Please select at least one feature",
                              },
                            ]}
                          >
                            <StyledTagsSelect
                              id="edit_class_features"
                              mode="tags"
                              style={{ width: "100%" }}
                              placeholder="Select tags..."
                              tokenSeparators={[","]}
                              options={presetFeaturesOptions}
                              maxTagCount="responsive"
                            />
                          </FormItemAntd>
                        </FormGroup>
                      </FormSection>
                    </TabContentWrapper>
                  ),
                },
                {
                  label: "Location & Contact",
                  key: "2",
                  children: (
                    <TabContentWrapper>
                      <FormSection>
                        <FormGrid>
                          <FormGroup>
                            <FormLabel htmlFor="edit_location_search_input_display_only">
                              <Search size={16} />
                              Meeting Point Search
                            </FormLabel>
                            <HelpText>
                              <Info size={14} />
                              Address, landmark, or meeting spot.
                            </HelpText>
                            <SearchWrapper>
                              <FormItemAntd
                                name="location"
                                noStyle
                                rules={[
                                  {
                                    required: true,
                                    message:
                                      "Please select a location from search results.",
                                  },
                                ]}
                              >
                                <Input type="hidden" />
                              </FormItemAntd>
                              <FormItemAntd name="coordinates" noStyle>
                                <Input type="hidden" />
                              </FormItemAntd>
                              <FormItemAntd name="saltLocation" noStyle>
                                <Switch style={{ display: "none" }} />
                              </FormItemAntd>
                              <FormItemAntd name="city" noStyle>
                                <Input type="hidden" />
                              </FormItemAntd>
                              <FormItemAntd name="state" noStyle>
                                <Input type="hidden" />
                              </FormItemAntd>
                              <FormItemAntd name="zipCode" noStyle>
                                <Input type="hidden" />
                              </FormItemAntd>
                              <FormItemAntd name="country" noStyle>
                                <Input type="hidden" />
                              </FormItemAntd>
                              <StyledInput
                                id="edit_location_search_input_display_only"
                                prefix={
                                  <Search
                                    size={16}
                                    style={{ color: "#adb5bd" }}
                                  />
                                }
                                placeholder="Search for address or landmark"
                                value={mapSearchValue}
                                onChange={(e) => {
                                  setMapSearchValue(e.target.value);
                                  debouncedAwsSearch(e.target.value);
                                }}
                                allowClear
                              />
                              {mapSearchResults.length > 0 && (
                                <SearchResults
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  {mapSearchResults.map((result, index) => (
                                    <SearchResult
                                      key={index}
                                      onClick={() =>
                                        handleMapLocationSelect(result)
                                      }
                                    >
                                      <MapPin size={18} />
                                      <ResultContent>
                                        <PrimaryText>
                                          {result.displayName}
                                        </PrimaryText>
                                      </ResultContent>
                                    </SearchResult>
                                  ))}
                                </SearchResults>
                              )}
                            </SearchWrapper>
                          </FormGroup>
                          <FormGroup>
                            <FormLabel htmlFor="edit_class_unit_number">
                              <Building2 size={16} />
                              Unit / Suite / Details (Optional)
                            </FormLabel>
                            <HelpText>
                              <Info size={14} />
                              Specific instructions (e.g. "Look for red
                              umbrella").
                            </HelpText>
                            <FormItemAntd name="unit_number" noStyle>
                              <StyledInput
                                id="edit_class_unit_number"
                                placeholder="Optional details..."
                              />
                            </FormItemAntd>
                          </FormGroup>
                        </FormGrid>
                        {selectedMapLocation && (
                          <>
                            <MapWrapper
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: 0.1 }}
                            >
                              <MapContainer
                                key={`${selectedMapLocation.lat}-${selectedMapLocation.lon}-${hideExactLocation}`}
                                center={[
                                  selectedMapLocation.lat,
                                  selectedMapLocation.lon,
                                ]}
                                zoom={MAP_ZOOM_LEVEL}
                                scrollWheelZoom={false}
                                attributionControl={false}
                              >
                                <TileLayer
                                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                  attributionControl={false}
                                />
                                {hideExactLocation ? (
                                  <Circle
                                    center={[
                                      selectedMapLocation.lat,
                                      selectedMapLocation.lon,
                                    ]}
                                    radius={MAP_CIRCLE_RADIUS}
                                    pathOptions={{
                                      fillColor: appTheme.token.colorPrimary,
                                      fillOpacity: 0.15,
                                      color: appTheme.token.colorPrimary,
                                      weight: 1,
                                    }}
                                  />
                                ) : (
                                  <CircleMarker
                                    center={[
                                      selectedMapLocation.lat,
                                      selectedMapLocation.lon,
                                    ]}
                                    radius={8}
                                    pathOptions={{
                                      fillColor: appTheme.token.colorPrimary,
                                      fillOpacity: 0.9,
                                      color: "white",
                                      weight: 2,
                                    }}
                                  />
                                )}
                                <MapCenterHandler
                                  center={[
                                    selectedMapLocation.lat,
                                    selectedMapLocation.lon,
                                  ]}
                                />
                              </MapContainer>
                            </MapWrapper>
                            <LocationText>
                              {hideExactLocation
                                ? `Approximate area: ${selectedMapLocation.display_name}`
                                : `Exact location: ${selectedMapLocation.display_name}`}
                            </LocationText>
                            <FormGroup>
                              <FormLabel>Location Privacy</FormLabel>
                              <HelpText>
                                <Info size={14} />
                                Choose how your location is displayed.
                              </HelpText>
                              <ToggleGroup>
                                <ToggleButton
                                  type="button"
                                  $selected={!hideExactLocation}
                                  onClick={() =>
                                    handleLocationPrivacyToggle("show")
                                  }
                                  title="Show precise address"
                                >
                                  <Eye size={16} /> Show Exact Location
                                </ToggleButton>
                                <ToggleButton
                                  type="button"
                                  $selected={hideExactLocation}
                                  onClick={() =>
                                    handleLocationPrivacyToggle("hide")
                                  }
                                  title="Show general area"
                                >
                                  <EyeOff size={16} /> Hide Exact (Show Area)
                                </ToggleButton>
                              </ToggleGroup>
                            </FormGroup>
                          </>
                        )}
                      </FormSection>
                      <SectionDivider>
                        <span>
                          <Phone size={16} />
                          Guest Support Contact
                        </span>
                      </SectionDivider>
                      <FormSection>
                        <FormGrid>
                          <FormGroup>
                            <FormLabel htmlFor="edit_studentContactEmail">
                              <Mail size={16} />
                              Support Email
                            </FormLabel>
                            <HelpText>
                              <Info size={14} />
                              Where can guests email you with questions?
                            </HelpText>
                            <FormItemAntd
                              name="studentContactEmail"
                              rules={[
                                {
                                  required: true,
                                  message: "Please enter an email",
                                },
                                {
                                  type: "email",
                                  message: "Please enter a valid email",
                                },
                              ]}
                            >
                              <StyledInput
                                id="edit_studentContactEmail"
                                prefix={
                                  <Mail
                                    size={16}
                                    style={{ color: "#adb5bd" }}
                                  />
                                }
                                placeholder="help@example.com"
                                inputMode="email"
                              />
                            </FormItemAntd>
                          </FormGroup>
                          <FormGroup>
                            <FormLabel htmlFor="edit_studentContactPhone">
                              <Phone size={16} />
                              Support Phone
                            </FormLabel>
                            <HelpText>
                              <Info size={14} />A number for guests to call or
                              text.
                            </HelpText>
                            <FormItemAntd
                              name="studentContactPhone"
                              rules={[
                                {
                                  required: true,
                                  message: "Please enter a phone number",
                                },
                                {
                                  pattern:
                                    /^\+?(\d{1,4}[\s-]?)?\(?\d{1,4}\)?[\s-]?\d{1,4}[\s-]?\d{1,9}$/,
                                  message: "Please enter a valid phone number",
                                },
                              ]}
                            >
                              <StyledInput
                                id="edit_studentContactPhone"
                                prefix={
                                  <Phone
                                    size={16}
                                    style={{ color: "#adb5bd" }}
                                  />
                                }
                                placeholder="+1 555-123-4567"
                                inputMode="tel"
                              />
                            </FormItemAntd>
                          </FormGroup>
                        </FormGrid>
                      </FormSection>
                    </TabContentWrapper>
                  ),
                },
                {
                  label: "Settings",
                  key: "3",
                  children: (
                    <TabContentWrapper>
                      {/* Hidden Booking Type Field for Logic */}
                      <FormItemAntd name="booking_type" hidden>
                        <Input />
                      </FormItemAntd>

                      <StandardLabel
                        icon={Ticket}
                        label="Ticket Tiers & Variations"
                        help="Create standard tickets, VIP options, or different schedules."
                      />

                      <Form.List name="options">
                        {(fields, { add, remove }) => (
                          <>
                            <AnimatePresence initial={false}>
                              {fields.map((field, index) => {
                                const isPrimary = index === 0;
                                const isActive = activeTier === index;
                                const tierValues =
                                  form.getFieldValue(["options", index]) || {};
                                const tierMode = tierValues.schedule_mode;

                                return (
                                  <TierCard
                                    key={field.key}
                                    $isActive={isActive}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{
                                      opacity: 0,
                                      height: 0,
                                      marginBottom: 0,
                                    }}
                                  >
                                    <TierHeader
                                      $isActive={isActive}
                                      onClick={() =>
                                        setActiveTier(isActive ? null : index)
                                      }
                                    >
                                      <TierTitleSection>
                                        {isPrimary ? (
                                          <Crown
                                            size={18}
                                            color="#ca8a04"
                                            fill="#ca8a04"
                                          />
                                        ) : tierMode === "independent" ? (
                                          <Unlink size={18} color="#64748b" />
                                        ) : (
                                          <LinkIcon size={18} color="#0f766e" />
                                        )}
                                        <div>
                                          <h4
                                            style={{
                                              display: "flex",
                                              alignItems: "center",
                                            }}
                                          >
                                            {form.getFieldValue([
                                              "options",
                                              index,
                                              "title",
                                            ]) ||
                                              (isPrimary
                                                ? "Primary Tier"
                                                : "Untitled Option")}
                                          </h4>
                                          <AnimatePresence>
                                            {!isActive && (
                                              <motion.div
                                                initial={{
                                                  opacity: 0,
                                                  height: 0,
                                                }}
                                                animate={{
                                                  opacity: 1,
                                                  height: "auto",
                                                  marginTop: 4,
                                                }}
                                                exit={{
                                                  opacity: 0,
                                                  height: 0,
                                                  marginTop: 0,
                                                }}
                                              >
                                                <Text
                                                  type="secondary"
                                                  style={{ fontSize: "12px" }}
                                                >
                                                  {isPrimary
                                                    ? "Main Configuration"
                                                    : tierMode === "synced"
                                                      ? "Synced to Primary Schedule"
                                                      : "Independent Schedule"}
                                                </Text>
                                              </motion.div>
                                            )}
                                          </AnimatePresence>
                                        </div>
                                      </TierTitleSection>

                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "12px",
                                        }}
                                      >
                                        {isPrimary ? (
                                          <TierBadge
                                            $bg="#fef9c3"
                                            $color="#854d0e"
                                          >
                                            Primary
                                          </TierBadge>
                                        ) : tierMode === "independent" ? (
                                          <TierBadge
                                            $bg="#f1f5f9"
                                            $color="#475569"
                                          >
                                            Independent
                                          </TierBadge>
                                        ) : (
                                          <TierBadge
                                            $bg="#ccfbf1"
                                            $color="#115e59"
                                          >
                                            Synced
                                          </TierBadge>
                                        )}

                                        {!isPrimary && (
                                          <Popconfirm
                                            title="Delete this tier?"
                                            onConfirm={(e) => {
                                              e.stopPropagation();
                                              remove(field.name);
                                            }}
                                            onCancel={(e) =>
                                              e.stopPropagation()
                                            }
                                          >
                                            <Button
                                              type="text"
                                              danger
                                              size="small"
                                              icon={<Trash2 size={16} />}
                                              onClick={(e) =>
                                                e.stopPropagation()
                                              }
                                            />
                                          </Popconfirm>
                                        )}
                                        {isActive ? (
                                          <ChevronUp size={18} />
                                        ) : (
                                          <ChevronDown size={18} />
                                        )}
                                      </div>
                                    </TierHeader>

                                    <AnimatePresence>
                                      {isActive && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{
                                            height: "auto",
                                            opacity: 1,
                                          }}
                                          exit={{ height: 0, opacity: 0 }}
                                          transition={{ duration: 0.2 }}
                                        >
                                          <TierBody>
                                            <TierInternalTabs
                                              defaultActiveKey="basics"
                                              renderTabBar={(
                                                props,
                                                DefaultTabBar,
                                              ) => <DefaultTabBar {...props} />}
                                              items={[
                                                {
                                                  key: "basics",
                                                  label: "Basics",
                                                  children: (
                                                    <SmoothHeight>
                                                      <TierBasicsTab
                                                        field={field}
                                                        isPrimary={isPrimary}
                                                        form={form}
                                                      />
                                                    </SmoothHeight>
                                                  ),
                                                },
                                                {
                                                  key: "details",
                                                  label: "Details",
                                                  children: (
                                                    <SmoothHeight>
                                                      <TierDetailsTab
                                                        field={field}
                                                        form={form}
                                                      />
                                                    </SmoothHeight>
                                                  ),
                                                },
                                                {
                                                  key: "policies",
                                                  label: "Policies",
                                                  children: (
                                                    <SmoothHeight>
                                                      <TierPoliciesTab
                                                        field={field}
                                                        form={form}
                                                        bookingType={
                                                          bookingType
                                                        }
                                                      />
                                                    </SmoothHeight>
                                                  ),
                                                },
                                              ]}
                                            />
                                          </TierBody>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </TierCard>
                                );
                              })}
                            </AnimatePresence>

                            <FooterActions>
                              <Button
                                type="dashed"
                                icon={<Plus size={16} />}
                                onClick={() => addTier(add)}
                                block
                                style={{ height: "48px", maxWidth: "300px" }}
                              >
                                Add Ticket Tier
                              </Button>
                            </FooterActions>
                          </>
                        )}
                      </Form.List>
                    </TabContentWrapper>
                  ),
                },
              ]}
            />
          </>
        )}
      </DrawerContentWrapper>
      <DrawerFooter>
        <Button
          onClick={onClose}
          disabled={loading || dataLoading}
          size="middle"
        >
          Cancel
        </Button>
        <Button
          type="primary"
          onClick={handleSubmit}
          disabled={dataLoading}
          size="middle"
          loading={loading}
          key={`btn-${loading}`}
        >
          Save Changes
        </Button>
      </DrawerFooter>
    </>
  );

  return (
    <ThemeProvider theme={appTheme}>
      <ConfigProvider theme={appTheme}>
        <Form
          form={form}
          layout="vertical"
          style={{ display: "flex", flexDirection: "column", height: "100%" }}
        >
          <Drawer.Root
            open={visible}
            onOpenChange={handleOpenChange}
            direction={isMobile ? "bottom" : "right"}
            dismissible
            repositionInputs={false}
          >
            <Drawer.Portal>
              <StyledDrawerOverlay />
              {isMobile ? (
                <StyledDrawerContent>
                  <DrawerHandle />
                  {renderDrawerContent()}
                </StyledDrawerContent>
              ) : (
                <DesktopDrawerContent>
                  {renderDrawerContent()}
                </DesktopDrawerContent>
              )}
            </Drawer.Portal>
          </Drawer.Root>
        </Form>
      </ConfigProvider>
    </ThemeProvider>
  );
};

export default ClassEditDrawer;
