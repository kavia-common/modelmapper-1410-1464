import React from "react";

const DEFAULT_VENDORS = [
  { id: "Cisco", label: "Cisco" },
  { id: "Huawei", label: "Huawei" },
  { id: "Nokia", label: "Nokia" },
];

// PUBLIC_INTERFACE
export default function VendorSelector({ vendors = DEFAULT_VENDORS, value, onChange, label = "Vendor" }) {
  /** Select vendor component */
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        aria-label="Vendor selector"
      >
        <option value="">Select vendor</option>
        {vendors.map((v) => (
          <option key={v.id} value={v.id}>
            {v.label}
          </option>
        ))}
      </select>
    </label>
  );
}
