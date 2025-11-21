// src/components/ui/ResponsiveInputs.jsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  DatePicker as AntDatePicker, 
  Select as AntSelect, 
  TimePicker as AntTimePicker,
  Input as AntInput,
  Button
} from 'antd';
import { 
  DatePicker as MobileDatePicker, 
  Picker as MobilePicker, 
  Calendar as MobileCalendar, 
  Popup,
  List,
  Input as MobileInput
} from 'antd-mobile';
import dayjs from 'dayjs';
import { ChevronDown, Calendar, Clock, X } from 'lucide-react';

// --- HOOK: Detect Mobile ---
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
};

// --- COMPONENT: Responsive Range Picker ---
export const ResponsiveRangePicker = ({ value, onChange, disabledDate, ...props }) => {
  const isMobile = useIsMobile();
  const [visible, setVisible] = useState(false);

  if (!isMobile) {
    return <AntDatePicker.RangePicker value={value} onChange={onChange} disabledDate={disabledDate} {...props} />;
  }

  // Mobile Render: Read-only input that opens a full-screen Calendar
  const label = value && value[0] && value[1] 
    ? `${value[0].format('MMM D')} - ${value[1].format('MMM D, YYYY')}` 
    : 'Select Dates';

  return (
    <>
      <div 
        onClick={() => setVisible(true)} 
        style={{ 
          border: '1px solid #d9d9d9', 
          borderRadius: 8, 
          padding: '8px 12px', 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#fff',
          height: props.size === 'large' ? 40 : 32
        }}
      >
        <span style={{ color: value ? '#000' : '#bfbfbf' }}>{label}</span>
        <Calendar size={16} color="#bfbfbf" />
      </div>
      
      <Popup
        visible={visible}
        onMaskClick={() => setVisible(false)}
        bodyStyle={{ borderTopLeftRadius: '16px', borderTopRightRadius: '16px', minHeight: '400px' }}
      >
        <div style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 18, fontWeight: 600 }}>Select Dates</span>
            <X onClick={() => setVisible(false)} />
          </div>
          <MobileCalendar
            selectionMode='range'
            onChange={(val) => {
              if (val) {
                // Convert native Date back to Dayjs for Ant Form
                onChange([dayjs(val[0]), dayjs(val[1])]);
                setVisible(false);
              }
            }}
          />
        </div>
      </Popup>
    </>
  );
};

// --- COMPONENT: Responsive Time Picker ---
export const ResponsiveTimePicker = ({ value, onChange, format, ...props }) => {
  const isMobile = useIsMobile();
  const [visible, setVisible] = useState(false);

  if (!isMobile) {
    return <AntTimePicker value={value} onChange={onChange} format={format} {...props} />;
  }

  return (
    <>
      <div 
        onClick={() => setVisible(true)} 
        style={{ 
          border: '1px solid #d9d9d9', 
          borderRadius: 8, 
          padding: '8px 12px', 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#fff',
          height: props.size === 'large' ? 40 : 32
        }}
      >
        <span style={{ color: value ? '#000' : '#bfbfbf' }}>
          {value ? value.format(format === 'h:mm A' ? 'h:mm A' : 'HH:mm') : 'Select Time'}
        </span>
        <Clock size={16} color="#bfbfbf" />
      </div>

      <MobileDatePicker
        visible={visible}
        onClose={() => setVisible(false)}
        precision="minute"
        onConfirm={(val) => {
          onChange(dayjs(val));
        }}
      />
    </>
  );
};

// --- COMPONENT: Responsive Select ---
export const ResponsiveSelect = ({ value, onChange, options, children, placeholder, ...props }) => {
  const isMobile = useIsMobile();
  const [visible, setVisible] = useState(false);

  // Normalize options (handle both `options` prop and `<Option>` children)
  const normalizedOptions = useMemo(() => {
    if (options) return options;
    if (children) {
      return React.Children.map(children, (child) => ({
        label: child.props.children,
        value: child.props.value
      }));
    }
    return [];
  }, [options, children]);

  if (!isMobile) {
    return <AntSelect value={value} onChange={onChange} options={options} placeholder={placeholder} {...props}>{children}</AntSelect>;
  }

  const selectedLabel = normalizedOptions?.find(o => o.value === value)?.label;

  return (
    <>
      <div 
        onClick={() => setVisible(true)} 
        style={{ 
          border: '1px solid #d9d9d9', 
          borderRadius: 8, 
          padding: '8px 12px', 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#fff',
          height: props.size === 'large' ? 40 : 32
        }}
      >
        <span style={{ color: value ? '#000' : '#bfbfbf' }}>
          {selectedLabel || placeholder || 'Select'}
        </span>
        <ChevronDown size={16} color="#bfbfbf" />
      </div>

      <MobilePicker
        columns={[normalizedOptions]}
        visible={visible}
        onClose={() => setVisible(false)}
        value={[value]}
        onConfirm={(val) => {
          onChange(val[0]);
        }}
      />
    </>
  );
};