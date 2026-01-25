"use client";

import React from "react";
import { useField, FieldLabel } from "@payloadcms/ui";
import { IconPicker } from "./icon-picker";

interface IconFieldProps {
  path: string;
  label?: string;
  required?: boolean;
}

export const IconField: React.FC<IconFieldProps> = ({ path, label, required }) => {
  const { value, setValue } = useField<string>({ path });

  return (
    <div className="field-type">
      {label && (
        <FieldLabel
          htmlFor={path}
          label={label}
          required={required}
        />
      )}
      <IconPicker
        value={value || ""}
        onChange={(iconName) => setValue(iconName)}
      />
    </div>
  );
};
