"use client";

import { Button as AntButton } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { forwardRef } from "react";

const loadingIcon = <LoadingOutlined spin />;

const Button = forwardRef(({ loading, ...props }, ref) => {
  // Handle loading prop
  const loadingConfig =
    loading === true
      ? { delay: 0, indicator: loadingIcon }
      : typeof loading === "object" && loading !== null
      ? { delay: 0, indicator: loadingIcon, ...loading }
      : loading;

  return <AntButton ref={ref} loading={loadingConfig} {...props} key={`btn-${loadingConfig}`} />;
});

Button.displayName = "Button";

// Export sub-components
Button.Group = AntButton.Group;

export default Button;
