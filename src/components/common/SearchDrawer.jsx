"use client";

import React, { useMemo } from "react";
import styled, { createGlobalStyle } from "styled-components";
import { Drawer } from "vaul";
import { AutoComplete, DatePicker, Select, ConfigProvider } from "antd";
import { Search, X, ChevronDown, MapPin } from "lucide-react";
import dayjs from "dayjs";
import { theme as exploreHeaderTheme } from "@/components/theme";
import { GlobalLoaderWithoutInlineStyles } from "@/components/common/GlobalLoader";
import { useSearch, SUGGESTED_AREAS } from "@/context/SearchContext";

// --- GLOBAL STYLES (Scoped to Mobile/Drawer) ---
const MobileDrawerGlobalStyles = createGlobalStyle`
  /* Force high z-index for mobile dropdowns */
  .mobile-drawer-dropdown,
  .mobile-drawer-picker-dropdown {
    z-index: 100000 !important; /* Above Vaul Drawer */
  }

  /* Mobile Location Dropdown */
  .mobile-drawer-dropdown.explore-header-location-search-dropdown {
    min-width: 0 !important; 
    width: calc(100vw - 32px) !important;
    left: 16px !important;
    border-radius: 16px !important;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important;
  }
  
  .explore-header-location-search-dropdown .ant-select-item-group {
    font-weight: 700;
    font-size: 13px;
    color: #374151;
    padding: 12px 12px 8px 12px;
    background: transparent !important;
    cursor: default !important;
  }

  .explore-header-location-search-dropdown .ant-select-item {
      border-radius: 12px !important;
      padding: 4px !important;
  }

  .explore-header-location-search-dropdown .ant-select-item-option-selected {
    background: #eff6ff !important;
  }

  /* Mobile Date Picker */
  .mobile-drawer-picker-dropdown .ant-picker-panel-container {
    border-radius: 16px !important;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important;
    overflow: hidden;
  }

  .mobile-drawer-picker-dropdown {
    left: 50% !important;
    transform: translateX(-50%) !important;
    top: 20% !important; 
    position: fixed !important;
  }
`;

// --- STYLED COMPONENTS ---
const DrawerOverlay = styled(Drawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 9998;
`;

const DrawerContent = styled(Drawer.Content)`
  background: #F5F5F5;
  display: flex;
  flex-direction: column;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  height: auto;
  max-height: 90vh;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  outline: none;
  box-shadow: 0 -4px 24px rgba(0,0,0,0.15);
`;

const DrawerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: transparent;
`;

const CloseButton = styled.button`
  background: #e5e5e5;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #555;
`;

const DrawerBody = styled.div`
  padding: 0 16px 24px 16px;
  overflow-y: visible;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const CompactFormGroup = styled.div`
  background: white;
  border-radius: 16px;
  overflow: visible;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
`;

const CompactRow = styled.div`
  display: flex;
  align-items: center;
  height: 72px; 
  padding: 0 16px;
  position: relative;
  
  &:not(:last-child)::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 16px;
    right: 16px;
    height: 1px;
    background: #f0f0f0;
  }

  .content-box {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .label {
    font-size: 12px;
    color: #717171;
    font-weight: 700;
    text-transform: uppercase;
    margin-bottom: 0px;
    letter-spacing: 0.5px;
  }

  .ant-select, .ant-picker {
    width: 100% !important;
    padding: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
    border: none !important;
    height: 28px !important;
  }
  
  /* 
     iOS Zoom Prevention: 
     Targeting every possible input type including standard inputs, select boxes,
     search inputs, and picker inputs. 
     Force 16px !important.
  */
  input, 
  .ant-select-selection-item, 
  .ant-select-selection-search-input,
  .ant-picker-input > input,
  input::placeholder,
  .ant-select-selection-placeholder {
    font-size: 16px !important;
    font-weight: 600 !important;
    color: #222 !important;
    padding: 0 !important;
    line-height: 28px !important;
    font-family: "Proxima Soft", sans-serif !important;
  }

  input::placeholder,
  .ant-select-selection-placeholder {
    color: #999 !important;
    font-weight: 500 !important;
  }

  .ant-select-selector {
    padding: 0 !important;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    height: 28px !important;
  }

  .ant-select-arrow { display: none; }
`;

const DrawerFooter = styled.div`
  padding: 16px 20px;
  background: white;
  border-top: 1px solid #ebebeb;
  margin-top: auto;
  padding-bottom: max(16px, env(safe-area-inset-bottom));
`;

const SearchButtonFull = styled.button`
  width: 100%;
  background: linear-gradient(to right, #E61E4D 0%, #E31C5F 50%, #D70466 100%);
  color: white;
  font-weight: 700;
  font-size: 16px;
  padding: 14px;
  border-radius: 12px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(230, 30, 77, 0.2);
  
  &:active { opacity: 0.9; scale: 0.98; }
`;

// --- INNER COMPONENT STYLES ---
const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  min-width: 40px;
  border-radius: 10px;
  background: ${(props) => props.bg || "#f3f4f6"};
  margin-right: 12px;
`;

const OptionContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 4px !important;
  width: 100%;
`;

const OptionText = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 2px;
`;

const PrimaryText = styled.div`
  font-weight: 600;
  color: #1a1a1a;
  font-size: 15px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SecondaryText = styled.div`
  font-size: 13px;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const participantOptions = Array.from({ length: 10 }, (_, i) => ({
  value: i + 1,
  label: i === 0 ? "1 Person" : i === 9 ? "10+ People" : `${i + 1} People`,
}));

const SearchDrawer = () => {
  const {
    isDrawerOpen,
    setIsDrawerOpen,
    searchTerm,
    setSearchTerm,
    datePickerValue,
    setDatePickerValue,
    participantCount,
    setParticipantCount,
    geocoding,
    geocodedAddressResults,
    handleLocationChange,
    handleLocationSelect,
    clearAll,
    performSearch,
  } = useSearch();

  const locationOptions = useMemo(() => {
    let options = [];
    if (searchTerm && geocodedAddressResults.length > 0) {
      options.push({
        label: "Search Results",
        options: geocodedAddressResults.map((result, index) => ({
          value: result.displayName,
          label: (
            <OptionContainer>
              <IconWrapper bg="#f0f9ff">
                <MapPin size={20} color="#545454" />
              </IconWrapper>
              <OptionText>
                <PrimaryText>{result.displayName}</PrimaryText>
                <SecondaryText>Address</SecondaryText>
              </OptionText>
            </OptionContainer>
          ),
          coordinates: result.coordinates,
          key: `geocoded-${index}`,
        })),
      });
    } else if (!searchTerm) {
      options.push({
        label: "Popular Areas",
        options: SUGGESTED_AREAS.map((dest, index) => ({
          value: dest.name,
          label: (
            <OptionContainer>
              <IconWrapper>{dest.icon}</IconWrapper>
              <OptionText>
                <PrimaryText>{dest.name}</PrimaryText>
                <SecondaryText>{dest.description}</SecondaryText>
              </OptionText>
            </OptionContainer>
          ),
          coordinates: dest.coords,
          citySlug: dest.citySlug,
          provinceSlug: dest.provinceSlug,
          key: `suggested-${index}`,
        })),
      });
    }
    return options;
  }, [searchTerm, geocodedAddressResults]);

  return (
    <>
      <MobileDrawerGlobalStyles />
      <ConfigProvider theme={exploreHeaderTheme}>
        <Drawer.Root open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <Drawer.Portal>
            <DrawerOverlay />
            <DrawerContent>
              <div style={{ width: 36, height: 4, background: '#e0e0e0', borderRadius: 2, margin: '10px auto 4px', flexShrink: 0 }} />
              
              <DrawerHeader>
                <CloseButton onClick={() => setIsDrawerOpen(false)}>
                  <X size={16} />
                </CloseButton>
                <span style={{ fontWeight: 700, fontSize: 16, color: '#222' }}>Search</span>
                <div style={{ width: 30 }} />
              </DrawerHeader>
              
              <DrawerBody>
                <CompactFormGroup>
                  {/* Location Input */}
                  <CompactRow>
                    <div className="content-box">
                      <span className="label">Where?</span>
                      <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <AutoComplete 
                          value={searchTerm} 
                          options={locationOptions} 
                          onChange={handleLocationChange} 
                          onSelect={handleLocationSelect}
                          filterOption={false} 
                          placeholder="Search destinations"
                          popupClassName="explore-header-location-search-dropdown mobile-drawer-dropdown"
                          notFoundContent={geocoding ? <GlobalLoaderWithoutInlineStyles /> : null}
                          style={{ width: '100%' }}
                          getPopupContainer={(trigger) => document.body}
                        />
                        {searchTerm && (
                          <X 
                            size={16} 
                            color="#999" 
                            style={{ marginLeft: 8 }} 
                            onClick={() => { setSearchTerm(""); }}
                          />
                        )}
                      </div>
                    </div>
                  </CompactRow>

                  {/* Date Input */}
                  <CompactRow>
                    <div className="content-box">
                      <span className="label">When?</span>
                      <DatePicker 
                        variant="borderless" 
                        placeholder="Any week" 
                        value={datePickerValue} 
                        onChange={setDatePickerValue} 
                        disabledDate={d => d && d < dayjs().startOf("day")} 
                        popupClassName="mobile-drawer-picker-dropdown" 
                        suffixIcon={null}
                        format="MMM D, YYYY"
                        allowClear
                        getPopupContainer={(trigger) => document.body}
                      />
                    </div>
                  </CompactRow>

                  {/* Guest Input */}
                  <CompactRow>
                    <div className="content-box">
                      <span className="label">How many?</span>
                      <div style={{ width: '100%', position: 'relative' }}>
                        <Select 
                          value={participantCount} 
                          onChange={setParticipantCount} 
                          options={participantOptions} 
                          variant="borderless" 
                          popupClassName="mobile-drawer-dropdown"
                          dropdownStyle={{ padding: '8px' }}
                          getPopupContainer={(trigger) => document.body}
                          style={{ width: '100%' }}
                          suffixIcon={<ChevronDown size={16} color="#222" />}
                        />
                      </div>
                    </div>
                  </CompactRow>
                </CompactFormGroup>
              </DrawerBody>

              <DrawerFooter>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ textDecoration: 'underline', fontWeight: 600, color: '#717171', cursor: 'pointer', fontSize: 14 }} onClick={clearAll}>
                    Clear all
                  </span>
                </div>
                <SearchButtonFull onClick={performSearch}>
                  <Search size={20} /> Search
                </SearchButtonFull>
              </DrawerFooter>
            </DrawerContent>
          </Drawer.Portal>
        </Drawer.Root>
      </ConfigProvider>
    </>
  );
};

export default SearchDrawer;