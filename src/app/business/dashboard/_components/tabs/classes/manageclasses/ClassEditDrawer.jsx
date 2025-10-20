"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import styled, { ThemeProvider } from "styled-components";
import { Form, Input, Select, Button, Tabs, ConfigProvider, Switch, Typography, Tooltip, InputNumber, Upload,  } from 'antd';
import message from '@/lib/message';
import {
  BookOpen,
  MapPin,
  Tag as TagIcon,
  Image as ImageIcon,
  X,
  Save,
  ImagePlus,
  Phone,
  Mail,
  Eye,
  EyeOff,
  Search,
  Layers,
  Settings as SettingsIcon,
  Star,
  Building2,
  Hash,
  Package as PackageIcon,
  Percent,
  UserCheck,
  FileText,
  Info,
  Clock,
} from "lucide-react";
import heic2any from "heic2any";
import { motion } from "framer-motion";
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
const { TabPane } = Tabs;

// NEW: Vaul Drawer Styles for Mobile
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

// For Desktop
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

// Keep these components as they are for the content structure
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
  padding: 24px;
  background-color: white;
  @media (max-width: 768px) {
    padding: 16px;
  }
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
    font-size: ${props.theme.token.fontSize}px;
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
  .ant-select-selection-search {
    margin: 2px 0 !important;
    min-width: 80px;
  }
  .ant-select-selection-placeholder {
    line-height: ${(props) =>
      props.theme.token.controlHeight - 12}px !important;
    font-size: ${(props) => props.theme.token.fontSize}px;
    color: ${(props) => props.theme.token.colorTextPlaceholder};
  }
  &.ant-select-focused .ant-select-selector {
    box-shadow: 0 0 0 3px ${(props) => props.theme.token.colorPrimary}20 !important;
    border-color: ${(props) =>
      props.theme.token.colorPrimaryBorderHover} !important;
  }
  &:hover .ant-select-selector {
    border-color: ${(props) => props.theme.token.colorPrimary} !important;
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

const VisibilityToggleContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  background: ${(props) => props.theme.token.colorBgContainer};
  padding: 12px 16px;
  border-radius: 14px;
  border: 1px solid ${(props) => props.theme.token.colorBorder};
`;

const VisibilityInfo = styled.div`
  flex: 1;
  margin-right: 16px;
`;

const VisibilityLabel = styled(Text)`
  font-size: 15px;
  font-weight: 600;
  color: ${(props) => props.theme.token.colorText};
  display: block;
  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const VisibilityStatus = styled.div`
  font-size: 13px;
  color: ${(props) => props.theme.token.colorTextSecondary};
  margin-top: 2px;
  @media (max-width: 768px) {
    font-size: 12px;
  }
`;

const LoaderWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  min-height: 300px;
`;

const AWS_LOCATION_API_URL =
  "https://geocoding.classeasily.com/address-autocomplete-proxy";
const SEARCH_DEBOUNCE_MS = 300;
const MAP_ZOOM_LEVEL = 13;
const MAP_CIRCLE_RADIUS = 1000;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg", // Some browsers use this
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/avif",
  "", // Empty string for cases where MIME type isn't detected
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

const presetFeaturesOptions = [
  { value: "All Materials Provided", label: "All Materials Provided" },
  { value: "Hands-On Experience", label: "Hands-On Experience" },
  { value: "Take-Home Creation", label: "Take-Home Creation" },
  { value: "Personalized Feedback", label: "Personalized Feedback" },
  { value: "Certificate of Completion", label: "Certificate of Completion" },
  { value: "No Experience Necessary", label: "No Experience Necessary" },
  { value: "Suitable for All Levels", label: "Suitable for All Levels" },
  { value: "Date Night Special", label: "Date Night Special" },
  { value: "Great for Team-Building", label: "Great for Team-Building" },
  { value: "Family-Friendly (All Ages)", label: "Family-Friendly (All Ages)" },
  { value: "Intimate Class Setting", label: "Intimate Class Setting" },
  { value: "Free On-Site Parking", label: "Free On-Site Parking" },
  { value: "Wheelchair Accessible", label: "Wheelchair Accessible" },
  { value: "Refreshments Included", label: "Refreshments Included" },
  { value: "Flexible Booking", label: "Flexible Booking" },
  { value: "Wear Comfortable Clothes", label: "Wear Comfortable Clothes" },
  { value: "Bilingual Instructor", label: "Bilingual Instructor" },
  {
    value: "In-Class Materials for Purchase",
    label: "In-Class Materials for Purchase",
  },
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
  const [isActive, setIsActive] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const initialClassDataRef = useRef(null);
  const initialSubcategoryKeyRef = useRef(null);

  const currentFormCategoryKey = Form.useWatch("category_key", form);
  const watchedCancellationPolicy = Form.useWatch("cancellationPolicy", form);

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
    if (watchedCancellationPolicy === "strict") {
      if (form.getFieldValue("cancellationRefundPercentage") !== 0) {
        form.setFieldsValue({ cancellationRefundPercentage: 0 });
      }
    }
  }, [watchedCancellationPolicy, form]);

  useEffect(() => {
    if (visible && initialClassDataProp) {
      setDataLoading(true);
      initialSubcategoryKeyRef.current = null;
      initialClassDataRef.current = JSON.parse(
        JSON.stringify(initialClassDataProp)
      );
      fetchCategories().then((loadedCategoriesFromFetch) => {
        initializeFormAndStates(
          initialClassDataRef.current,
          loadedCategoriesFromFetch || []
        );
        setDataLoading(false);
      });
    } else if (!visible) {
      form.resetFields();
      setMainImages([]);
      setIsActive(true);
      setCategories([]);
      setSubcategories([]);
      initialSubcategoryKeyRef.current = null;
      setMapSearchResults([]);
      setMapSearchValue("");
      setSelectedMapLocation(null);
      setHideExactLocation(false);
      setActiveTab("1");
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
        (sub) => sub.key === initialSubcategoryKeyRef.current
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
      // Allow Vaul's closing animation to play before calling onClose
      setTimeout(() => {
        onClose();
      }, 300); // Match Vaul's default animation duration
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
    const primaryOption = classData.options?.[0] || {};
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

    form.setFieldsValue({
      title: classData.title || "",
      description: classData.description || "",
      category_key: classData.category_key || undefined,
      features: featuresData,
      location: classData.location || "",
      unit_number: classData.unit_number || "",
      coordinates: classData.coordinates || "0,0",
      saltLocation: classData.saltLocation || false,
      city: classData.city || "",
      state: classData.state || "",
      studentContactEmail: classData.studentContactEmail || "",
      studentContactPhone: classData.studentContactPhone || "",
      level: primaryOption.level || "all",
      equipment: primaryOption.equipment || [],
      tags: primaryOption.tags || [],
      cancellationPolicy: primaryOption.cancellationPolicy || "flexible",
      cancellationCustomHours:
        primaryOption.cancellationCustomHours || undefined,
      cancellationRefundPercentage:
        primaryOption.cancellationRefundPercentage ?? 100,
      booking_type: primaryOption.booking_type || "Single Session",
      price_type: primaryOption.price_type || "per_session",
    });

    setIsActive(classData.status === "active");
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
    // --- IMAGE URL LOGIC REVERTED ---
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
        `${AWS_LOCATION_API_URL}?text=${encodeURIComponent(query)}`
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
    []
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
      // Check file extension for HEIC files since browsers might not detect MIME type correctly
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

      // Check both MIME type and file extension
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
            ", "
          )}.`
        );
        return false;
      }

      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        message.error(
          `File too large: ${file.name}. Max ${MAX_IMAGE_SIZE_MB}MB.`
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

        // Convert HEIC to JPEG if needed
        if (isHeic) {
          blobToProcess = await heic2any({
            blob: file,
            toType: "image/jpeg",
            quality: 0.9,
          });
        }

        // Handle the result from heic2any (could be Blob or File)
        const processedFile =
          blobToProcess instanceof File
            ? blobToProcess
            : new File(
                [blobToProcess],
                file.name.replace(/\.(heic|heif)$/i, ".jpeg"),
                { type: "image/jpeg" }
              );

        // Create image object and return it
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
      prevImages.map((img) => ({ ...img, isCover: img.id === idToSetAsCover }))
    );
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      const newImageFiles = mainImages.filter((img) => img.file);
      const existingImages = mainImages.filter((img) => !img.file);

      let uploadedImageKeys = [];
      let uploadResults = []; // Declare uploadResults in the proper scope

      if (newImageFiles.length > 0) {
        message.loading({
          content: `Uploading ${newImageFiles.length} image(s)...`,
          key: "imgUploadEdit",
        });

        const uploadPromises = newImageFiles.map((img) =>
          uploadService.uploadFile(img.file, "class_image")
        );

        uploadResults = await Promise.all(uploadPromises);
        message.destroy("imgUploadEdit");

        const failedUploads = uploadResults.filter((res) => !res.success);
        if (failedUploads.length > 0) {
          message.error(
            `Failed to upload ${failedUploads.length} image(s). Please try again.`
          );
          setLoading(false);
          return;
        }

        uploadedImageKeys = uploadResults.map((res) => res.s3_key);
      }

      const payload = { ...values };
      payload.status = isActive ? "active" : "inactive";
      payload.saltLocation = hideExactLocation;

      const initialImageIds = (initialClassDataRef.current?.images || []).map(
        (img) => img.imageId
      );
      const remainingImageIds = existingImages.map((img) => img.id);
      payload.delete_image_ids = JSON.stringify(
        initialImageIds.filter((id) => !remainingImageIds.includes(id))
      );

      payload.new_image_s3_keys = JSON.stringify(uploadedImageKeys);

      const coverImage = mainImages.find((img) => img.isCover);
      if (coverImage) {
        if (coverImage.file) {
          // Find the corresponding upload result for this new cover image
          const newCoverFile = coverImage.file;
          const correspondingUploadResultIndex = newImageFiles.findIndex(
            (newImg) => newImg.file === newCoverFile
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

      const optionData = {
        optionId: initialClassDataRef.current?.options?.[0]?.optionId,
        booking_type: values.booking_type || "Single Session",
        level: values.level,
        equipment: values.equipment || [],
        tags: values.tags || [],
        cancellationPolicy: values.cancellationPolicy,
        cancellationCustomHours:
          values.cancellationPolicy === "custom"
            ? values.cancellationCustomHours
            : null,
        cancellationRefundPercentage:
          values.cancellationRefundPercentage ?? 100,
        price_type: values.price_type || "per_session",
      };
      payload.options = JSON.stringify([optionData]);

      const result = await businessClassService.updateClass(
        initialClassDataProp.classId,
        payload
      );

      if (result.success) {
        onSuccess?.(result.data);
        onClose();
      } else {
        const errorDetail =
          result.error ||
          result.errors ||
          result.message ||
          "Failed to update class.";
        if (typeof errorDetail === "object") {
          Object.entries(errorDetail).forEach(([field, errors]) => {
            message.error(
              `${field}: ${Array.isArray(errors) ? errors.join(", ") : errors}`
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
        } else if (
          [
            "level",
            "cancellationPolicy",
            "cancellationRefundPercentage",
          ].includes(firstErrorField)
        ) {
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
        <li>What will students learn or achieve?</li>
        <li>Describe your teaching style/atmosphere.</li>
        <li>Mention unique aspects or benefits.</li>
        <li>Include relevant keywords.</li>
      </ul>
    </div>
  );

  const renderDrawerContent = () => (
    <>
      <DrawerHeader>
        <DrawerTitle level={4}>Edit Class</DrawerTitle>
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
            <VisibilityToggleContainer>
              <VisibilityInfo>
                <VisibilityLabel>Class Visibility</VisibilityLabel>
                <VisibilityStatus>
                  {isActive ? "Visible to students" : "Hidden from students"}
                </VisibilityStatus>
              </VisibilityInfo>
              <Switch
                checked={isActive}
                onChange={setIsActive}
                disabled={loading}
              />
            </VisibilityToggleContainer>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              type="card"
              size="middle"
            >
              {/* All TabPanes are the same as before */}
              <TabPane
                tab={
                  <>
                    <BookOpen size={16} style={{ marginRight: "8px" }} /> Basic
                    Info
                  </>
                }
                key="1"
              >
                <FormSection>
                  <FormGroup>
                    <FormLabel htmlFor="edit_class_title">
                      <BookOpen size={16} />
                      Class Title
                    </FormLabel>
                    <HelpText>
                      <Info size={14} />
                      Create a clear, descriptive title that tells students
                      exactly what you're teaching.
                    </HelpText>
                    <FormItemAntd
                      name="title"
                      rules={[
                        {
                          required: true,
                          message: "Please enter a class title",
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
                        placeholder="e.g., Introduction to Classical Piano"
                      />
                    </FormItemAntd>
                  </FormGroup>
                  <FormGroup>
                    <FormLabel htmlFor="edit_class_description">
                      <BookOpen size={16} />
                      Class Description
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
                      Describe what students will learn, your teaching approach,
                      and what makes your class special.
                    </HelpText>
                    <FormItemAntd
                      name="description"
                      rules={[
                        {
                          required: true,
                          message: "Please enter a class description",
                        },
                        {
                          min: 100,
                          message:
                            "Description must be at least 100 characters",
                        },
                        {
                          max: 4000,
                          message: "Description cannot exceed 4000 characters",
                        },
                      ]}
                    >
                      <StyledTextArea
                        id="edit_class_description"
                        rows={5}
                        placeholder="Tell students about what they'll learn..."
                        showCount
                        maxLength={4000}
                      />
                    </FormItemAntd>
                  </FormGroup>
                </FormSection>
                <SectionDivider>
                  <span>
                    <ImageIcon size={16} />
                    Class Photos
                  </span>
                </SectionDivider>
                <FormSection>
                  <FormGroup>
                    <FormLabel>
                      <ImageIcon size={16} />
                      Class Images (5-10 photos required)
                    </FormLabel>
                    <HelpText>
                      <Info size={14} />
                      Drag & drop or click to upload high-quality photos that
                      showcase your class.
                    </HelpText>
                    <FormItemAntd
                      name="class_photos_validation_edit"
                      rules={[
                        {
                          validator: async () => {
                            if (!mainImages || mainImages.length < 5)
                              return Promise.reject(
                                new Error("Please upload at least 5 images.")
                              );
                            if (mainImages.length > 10)
                              return Promise.reject(
                                new Error("Maximum 10 images allowed.")
                              );
                            if (
                              mainImages.length > 0 &&
                              !mainImages.some((img) => img.isCover)
                            )
                              return Promise.reject(
                                new Error("Please select a cover image.")
                              );
                            return Promise.resolve();
                          },
                        },
                      ]}
                      dependencies={[
                        mainImages
                          .map((img) => `${img.id}-${img.isCover}-${img.url}`)
                          .join(","),
                      ]}
                    >
                      <ImageUploadSection>
                        <ImageGrid>
                          {mainImages.map((image) => (
                            <ImageCard key={image.id} $isCover={image.isCover}>
                              <ImagePreview
                                src={image.url}
                                alt={image.name || "Class image"}
                              />
                              <ImageActions>
                                {!image.isCover && mainImages.length > 0 && (
                                  <Tooltip title="Set as cover">
                                    <ActionButton
                                      type="button"
                                      onClick={() =>
                                        handleSetCoverMainImage(image.id)
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
                                <span
                                  style={{
                                    fontSize: "11px",
                                    color: "#94a3b8",
                                  }}
                                >
                                  up to {10 - mainImages.length} more
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
                    Category & Features
                  </span>
                </SectionDivider>
                <FormSection>
                  <FormGrid>
                    <FormGroup>
                      <FormLabel htmlFor="edit_class_category">
                        <Building2 size={16} />
                        Main Category
                      </FormLabel>
                      <HelpText>
                        <Info size={14} />
                        Choose the primary subject area that best describes your
                        class.
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
                          placeholder="Select the main category"
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
                        <Building2 size={16} />
                        Subcategory
                      </FormLabel>
                      <HelpText>
                        <Info size={14} />
                        Select a specific subcategory to help students find
                        exactly what they're looking for.
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
                      Class Features
                    </FormLabel>
                    <HelpText>
                      <Info size={14} />
                      Select or add features that highlight what makes your
                      class special.
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
                        placeholder="Select or type custom features"
                        tokenSeparators={[","]}
                        options={presetFeaturesOptions}
                        maxTagCount="responsive"
                      />
                    </FormItemAntd>
                  </FormGroup>
                </FormSection>
              </TabPane>
              <TabPane
                tab={
                  <>
                    <MapPin size={16} style={{ marginRight: "8px" }} />
                    Location & Contact
                  </>
                }
                key="2"
              >
                {/* Location & Contact Tab Content is identical to the creation step */}
                <FormSection>
                  <FormGrid>
                    <FormGroup>
                      <FormLabel htmlFor="edit_location_search_input_display_only">
                        <Search size={16} />
                        Class Location Search
                      </FormLabel>
                      <HelpText>
                        <Info size={14} />
                        Search for the main address or building.
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
                            <Search size={16} style={{ color: "#adb5bd" }} />
                          }
                          placeholder="Search for address or place name"
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
                                onClick={() => handleMapLocationSelect(result)}
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
                        Apartment, suite, etc. (Optional)
                      </FormLabel>
                      <HelpText>
                        <Info size={14} />A specific unit, suite, or apartment
                        number.
                      </HelpText>
                      <FormItemAntd name="unit_number" noStyle>
                        <StyledInput
                          id="edit_class_unit_number"
                          placeholder="e.g., Unit B"
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
                          ? `Approximate area shown`
                          : `Exact location shown`}
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
                            onClick={() => handleLocationPrivacyToggle("show")}
                            title="Show precise address"
                          >
                            <Eye size={16} /> Show exact location
                          </ToggleButton>
                          <ToggleButton
                            type="button"
                            $selected={hideExactLocation}
                            onClick={() => handleLocationPrivacyToggle("hide")}
                            title="Show general area"
                          >
                            <EyeOff size={16} /> Hide exact location
                          </ToggleButton>
                        </ToggleGroup>
                      </FormGroup>
                    </>
                  )}
                </FormSection>
                <SectionDivider>
                  <span>
                    <Phone size={16} />
                    Student Contact
                  </span>
                </SectionDivider>
                <FormSection>
                  <FormGrid>
                    <FormGroup>
                      <FormLabel htmlFor="edit_studentContactEmail">
                        <Mail size={16} />
                        Contact Email
                      </FormLabel>
                      <HelpText>
                        <Info size={14} />
                        Email for students to contact you about this class.
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
                            <Mail size={16} style={{ color: "#adb5bd" }} />
                          }
                          placeholder="you@example.com"
                        />
                      </FormItemAntd>
                    </FormGroup>
                    <FormGroup>
                      <FormLabel htmlFor="edit_studentContactPhone">
                        <Phone size={16} />
                        Contact Phone
                      </FormLabel>
                      <HelpText>
                        <Info size={14} />
                        Phone number for students.
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
                            <Phone size={16} style={{ color: "#adb5bd" }} />
                          }
                          placeholder="+1 555-123-4567"
                        />
                      </FormItemAntd>
                    </FormGroup>
                  </FormGrid>
                </FormSection>
              </TabPane>
              <TabPane
                tab={
                  <>
                    <Layers size={16} style={{ marginRight: "8px" }} />
                    Class Settings
                  </>
                }
                key="3"
                forceRender
              >
                {/* Class Settings Tab Content is identical to the creation step */}
                <FormSection>
                  <FormItemAntd name="booking_type" hidden>
                    <Input />
                  </FormItemAntd>
                  <FormItemAntd name="price_type" hidden>
                    <Input />
                  </FormItemAntd>
                  <FormGroup>
                    <FormLabel htmlFor="edit_level">
                      <UserCheck size={16} />
                      Experience Level
                    </FormLabel>
                    <HelpText>
                      <Info size={14} />
                      What skill level should students have?
                    </HelpText>
                    <FormItemAntd
                      name="level"
                      rules={[
                        {
                          required: true,
                          message: "Please select an experience level",
                        },
                      ]}
                    >
                      <StyledSelect
                        id="edit_level"
                        placeholder="Select experience level"
                      >
                        <Option value="beginner">
                          Beginner - No experience needed
                        </Option>
                        <Option value="intermediate">
                          Intermediate - Some experience
                        </Option>
                        <Option value="advanced">
                          Advanced - Significant experience
                        </Option>
                        <Option value="all">All Levels Welcome</Option>
                      </StyledSelect>
                    </FormItemAntd>
                  </FormGroup>
                </FormSection>
                <SectionDivider>
                  <span>
                    <FileText size={16} />
                    Policies & Cancellation
                  </span>
                </SectionDivider>
                <FormSection>
                  <FormGrid>
                    <FormGroup>
                      <FormLabel htmlFor="edit_cancellationPolicy">
                        <FileText size={16} />
                        Cancellation Notice
                      </FormLabel>
                      <HelpText>
                        <Info size={14} />
                        Required notice for cancellations.
                      </HelpText>
                      <FormItemAntd
                        name="cancellationPolicy"
                        rules={[
                          {
                            required: true,
                            message: "Please select a cancellation policy",
                          },
                        ]}
                      >
                        <StyledSelect
                          id="edit_cancellationPolicy"
                          placeholder="Select cancellation period"
                        >
                          <Option value="flexible">
                            Flexible (up to 1 hour before)
                          </Option>
                          <Option value="24h">24 Hours Notice</Option>
                          <Option value="48h">48 Hours Notice</Option>
                          <Option value="72h">72 Hours Notice</Option>
                          <Option value="strict">
                            Strict (Non-refundable)
                          </Option>
                          <Option value="custom">Custom Notice Period</Option>
                        </StyledSelect>
                      </FormItemAntd>
                    </FormGroup>
                    <FormGroup>
                      <FormLabel htmlFor="edit_cancellationRefundPercentage">
                        <Percent size={16} />
                        Refund Percentage
                      </FormLabel>
                      <HelpText>
                        <Info size={14} />
                        Refund for cancellations within notice period.
                      </HelpText>
                      <FormItemAntd
                        name="cancellationRefundPercentage"
                        rules={[
                          {
                            required: true,
                            message: "Please enter a refund percentage",
                          },
                          {
                            type: "number",
                            min: 0,
                            max: 100,
                            message: "Must be between 0 and 100",
                          },
                        ]}
                      >
                        <StyledInputNumber
                          id="edit_cancellationRefundPercentage"
                          min={0}
                          max={100}
                          formatter={(value) => `${value}%`}
                          parser={(value) => String(value).replace("%", "")}
                          placeholder="e.g., 100"
                          disabled={watchedCancellationPolicy === "strict"}
                        />
                      </FormItemAntd>
                    </FormGroup>
                  </FormGrid>

                  {watchedCancellationPolicy === "custom" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{
                        opacity: 1,
                        height: "auto",
                        marginTop: "24px",
                      }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <FormGroup>
                        <FormLabel htmlFor="edit_cancellationCustomHours">
                          <Clock size={16} />
                          Custom Notice (Hours)
                        </FormLabel>
                        <HelpText>
                          <Info size={14} />
                          Required notice period in hours.
                        </HelpText>
                        <FormItemAntd
                          name="cancellationCustomHours"
                          rules={[
                            {
                              required: true,
                              message:
                                "Please enter the notice period in hours",
                            },
                            {
                              type: "number",
                              min: 1,
                              message: "Must be at least 1 hour",
                            },
                          ]}
                        >
                          <StyledInputNumber
                            id="edit_cancellationCustomHours"
                            min={1}
                            placeholder="e.g., 36"
                            style={{ width: "100%" }}
                          />
                        </FormItemAntd>
                      </FormGroup>
                    </motion.div>
                  )}
                </FormSection>
                <SectionDivider>
                  <span>
                    <SettingsIcon size={16} />
                    Optional Details
                  </span>
                </SectionDivider>
                <FormSection>
                  <FormGrid>
                    <FormGroup>
                      <FormLabel htmlFor="edit_equipment">
                        <PackageIcon size={16} />
                        Equipment to Bring
                      </FormLabel>
                      <HelpText>
                        <Info size={14} />
                        List items students need.
                      </HelpText>
                      <FormItemAntd name="equipment">
                        <StyledTagsSelect
                          id="edit_equipment"
                          mode="tags"
                          style={{ width: "100%" }}
                          placeholder="e.g., Yoga Mat, Notebook"
                          tokenSeparators={[","]}
                          maxTagCount="responsive"
                        />
                      </FormItemAntd>
                    </FormGroup>
                    <FormGroup>
                      <FormLabel htmlFor="edit_tags">
                        <TagIcon size={16} />
                        Additional Tags
                      </FormLabel>
                      <HelpText>
                        <Info size={14} />
                        Keywords to help students find your class.
                      </HelpText>
                      <FormItemAntd name="tags">
                        <StyledTagsSelect
                          id="edit_tags"
                          mode="tags"
                          style={{ width: "100%" }}
                          placeholder="e.g., Relaxing, Intensive"
                          tokenSeparators={[","]}
                          maxTagCount="responsive"
                        />
                      </FormItemAntd>
                    </FormGroup>
                  </FormGrid>
                </FormSection>
              </TabPane>
            </Tabs>
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
          icon={<Save size={16} />}
          onClick={handleSubmit}
          loading={loading}
          disabled={dataLoading}
          size="middle"
        >
          Save Changes
        </Button>
      </DrawerFooter>
    </>
  );

  if (!visible) return null;

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
