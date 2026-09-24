import React, { useState, useRef, useEffect, useMemo } from "react";
import Flag from "react-world-flags";

export const COUNTRIES = [
  { name: "India", iso: "IN", code: "+91", max: 10, min: 10 },
  { name: "United States", iso: "US", code: "+1", max: 10, min: 10 },
  { name: "United Kingdom", iso: "GB", code: "+44", max: 10, min: 10 },
  { name: "United Arab Emirates", iso: "AE", code: "+971", max: 9, min: 9 },
  { name: "Canada", iso: "CA", code: "+1", max: 10, min: 10 },
  { name: "Australia", iso: "AU", code: "+61", max: 9, min: 9 },
  { name: "Singapore", iso: "SG", code: "+65", max: 8, min: 8 },
  { name: "Saudi Arabia", iso: "SA", code: "+966", max: 9, min: 9 },
  { name: "Qatar", iso: "QA", code: "+974", max: 8, min: 8 },
  { name: "Kuwait", iso: "KW", code: "+965", max: 8, min: 8 },
  { name: "Oman", iso: "OM", code: "+968", max: 8, min: 8 },
  { name: "Bahrain", iso: "BH", code: "+973", max: 8, min: 8 },
  { name: "Germany", iso: "DE", code: "+49", max: 11, min: 10 },
  { name: "France", iso: "FR", code: "+33", max: 9, min: 9 },
  { name: "New Zealand", iso: "NZ", code: "+64", max: 9, min: 9 },
  { name: "South Africa", iso: "ZA", code: "+27", max: 9, min: 9 },
  { name: "Malaysia", iso: "MY", code: "+60", max: 10, min: 9 },
  { name: "Sri Lanka", iso: "LK", code: "+94", max: 9, min: 9 },
  { name: "Nepal", iso: "NP", code: "+977", max: 10, min: 10 },
  { name: "Bangladesh", iso: "BD", code: "+880", max: 10, min: 10 },
];

/**
 * Universal Phone Input with Interactive Country Flag Picker
 * - Displays SVG country flag and dial code prefix
 * - Clicking the flag opens a dropdown to switch between countries
 * - Automatically enforces country-specific max digit lengths
 * - Strips non-digits on input
 */
const PhoneInputWithFlag = ({
  value = "",
  onChange,
  onBlur,
  placeholder = "9876543210",
  disabled = false,
  required = false,
  name,
  id,
  className = "",
  style = {},
  inputStyle = {},
  maxLength,
  isValid = false,
  isInvalid = false,
  size = "md", // "sm" | "md" | "lg"
  defaultCountryIso = "IN",
  countryCode: controlledCountryCode,
  onCountryChange,
  autoFocus = false,
  ...rest
}) => {
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Determine initial country
  const initialCountry = useMemo(() => {
    if (controlledCountryCode) {
      const match = COUNTRIES.find(c => c.code === controlledCountryCode);
      if (match) return match;
    }
    const matchIso = COUNTRIES.find(c => c.iso.toUpperCase() === defaultCountryIso.toUpperCase());
    return matchIso || COUNTRIES[0];
  }, [controlledCountryCode, defaultCountryIso]);

  const [selectedCountry, setSelectedCountry] = useState(initialCountry);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Sync if controlledCountryCode changes
  useEffect(() => {
    if (controlledCountryCode) {
      const match = COUNTRIES.find(c => c.code === controlledCountryCode);
      if (match && match.code !== selectedCountry.code) {
        setSelectedCountry(match);
      }
    }
  }, [controlledCountryCode]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Auto-focus the search input
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const maxDigits = maxLength || selectedCountry.max;

  const handleChange = (e) => {
    const raw = e.target.value;
    const digitsOnly = raw.replace(/\D/g, "").slice(0, maxDigits);

    if (onChange) {
      e.target.value = digitsOnly;
      onChange(e);
    }
  };

  const handleKeyDown = (e) => {
    // Allow navigation and edit keys
    const allowedControlKeys = [
      "Backspace", "Delete", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
      "Home", "End", "Tab", "Enter"
    ];
    if (
      allowedControlKeys.includes(e.key) ||
      e.ctrlKey ||
      e.metaKey ||
      e.altKey
    ) {
      return;
    }
    // Block any non-digit character
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteText = (e.clipboardData || window.clipboardData)?.getData("text") || "";
    const cleanDigits = pasteText.replace(/\D/g, "").slice(0, maxDigits);
    if (cleanDigits && onChange) {
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          name: name || e.target.name,
          value: cleanDigits
        }
      };
      onChange(syntheticEvent);
    }
  };

  const handleSelectCountry = (country) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearch("");
    if (onCountryChange) {
      onCountryChange(country);
    }
    // Truncate current value if it exceeds new country's max
    if (value && value.length > country.max && onChange) {
      const truncated = value.slice(0, country.max);
      onChange({ target: { value: truncated, name } });
    }
  };

  const filteredCountries = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      c => c.name.toLowerCase().includes(q) || c.code.includes(q) || c.iso.toLowerCase().includes(q)
    );
  }, [search]);

  const isSmall = size === "sm";

  return (
    <div
      ref={containerRef}
      className={`position-relative ${className}`}
      style={{ width: "100%", ...style }}
    >
      <div className="input-group" style={{ width: "100%" }}>
        {/* Country Selector Trigger */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(prev => !prev)}
          className="btn d-flex align-items-center gap-2 border border-end-0 fw-semibold"
          style={{
            borderRadius: isSmall ? "8px 0 0 8px" : "10px 0 0 10px",
            fontSize: isSmall ? "0.82rem" : "0.88rem",
            padding: isSmall ? "6px 10px" : "9px 12px",
            backgroundColor: "#f8fafc",
            borderColor: isInvalid ? "#dc3545" : isValid ? "#198754" : "#dee2e6",
            color: "#475569",
            boxShadow: "none",
            cursor: disabled ? "not-allowed" : "pointer",
            flexShrink: 0
          }}
          title={`Selected: ${selectedCountry.name} (${selectedCountry.code}). Click to switch country.`}
        >
          <Flag
            code={selectedCountry.iso}
            style={{
              width: isSmall ? 18 : 22,
              height: isSmall ? 13 : 15,
              borderRadius: 2,
              objectFit: "cover",
              boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
              display: "inline-block"
            }}
          />
          <span style={{ letterSpacing: "0.02em" }}>{selectedCountry.code}</span>
          <span
            style={{
              fontSize: "0.6rem",
              opacity: 0.6,
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.15s ease"
            }}
          >
            ▼
          </span>
        </button>

        {/* Numeric Input */}
        <input
          id={id}
          name={name}
          type="tel"
          className={`form-control ${isValid ? "is-valid" : ""} ${isInvalid ? "is-invalid" : ""}`}
          placeholder={placeholder}
          value={value || ""}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          inputMode="numeric"
          pattern="[0-9]*"
          onBlur={onBlur}
          maxLength={maxDigits}
          disabled={disabled}
          required={required}
          autoFocus={autoFocus}
          style={{
            borderRadius: isSmall ? "0 8px 8px 0" : "0 10px 10px 0",
            fontSize: isSmall ? "0.85rem" : "0.9rem",
            padding: isSmall ? "6px 12px" : "9px 14px",
            letterSpacing: "0.03em",
            borderColor: isInvalid ? "#dc3545" : isValid ? "#198754" : "#dee2e6",
            ...inputStyle
          }}
          {...rest}
        />
      </div>

      {/* Floating Countries Flag Dropdown */}
      {isOpen && (
        <div
          className="position-absolute shadow-lg bg-white border"
          style={{
            top: "calc(100% + 4px)",
            left: 0,
            width: 290,
            maxHeight: 310,
            borderRadius: 12,
            zIndex: 1050,
            borderColor: "#e2e8f0",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column"
          }}
        >
          {/* Search Bar */}
          <div style={{ padding: "8px 10px", background: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
            <input
              ref={searchInputRef}
              type="text"
              className="form-control form-control-sm"
              placeholder="Search country or dial code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                borderRadius: 8,
                fontSize: "0.8rem",
                padding: "6px 10px",
                borderColor: "#cbd5e1"
              }}
            />
          </div>

          {/* List of Countries */}
          <div style={{ overflowY: "auto", flex: 1, padding: "4px 0" }}>
            {filteredCountries.length === 0 ? (
              <div className="text-muted text-center py-3" style={{ fontSize: "0.8rem" }}>
                No countries found
              </div>
            ) : (
              filteredCountries.map((c) => {
                const isSelected = c.code === selectedCountry.code && c.iso === selectedCountry.iso;
                return (
                  <button
                    key={`${c.iso}-${c.code}`}
                    type="button"
                    onClick={() => handleSelectCountry(c)}
                    className="dropdown-item d-flex align-items-center justify-content-between px-3 py-2 text-start border-0"
                    style={{
                      background: isSelected ? "#eff6ff" : "transparent",
                      color: isSelected ? "#1d4ed8" : "#1e293b",
                      fontSize: "0.82rem",
                      cursor: "pointer",
                      transition: "background 0.1s"
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "#f8fafc";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <div className="d-flex align-items-center gap-2" style={{ overflow: "hidden" }}>
                      <Flag
                        code={c.iso}
                        style={{
                          width: 20,
                          height: 14,
                          borderRadius: 2,
                          objectFit: "cover",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
                          flexShrink: 0
                        }}
                      />
                      <span className="text-truncate fw-medium" style={{ maxWidth: 160 }}>
                        {c.name}
                      </span>
                    </div>
                    <span className="text-muted fw-semibold ps-2" style={{ fontSize: "0.78rem" }}>
                      {c.code}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhoneInputWithFlag;
