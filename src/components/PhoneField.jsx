import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { COUNTRY_CODE_OPTIONS, ensureCountryCodeValue, sanitizePhoneDigits } from "../utils/phoneUtils";

const COUNTRY_META = {
  "+91": { country: "India", iso: "IN", min: 10, max: 10 },
  "+1": { country: "United States", iso: "US", min: 10, max: 10 },
  "+44": { country: "United Kingdom", iso: "GB", min: 10, max: 10 },
  "+61": { country: "Australia", iso: "AU", min: 9, max: 9 },
};

const toFlagEmoji = (iso = "") =>
  iso
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .split("")
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");

const getCountryItems = () =>
  COUNTRY_CODE_OPTIONS.map((option) => {
    const meta = COUNTRY_META[option.value] || {};
    const country = option.label.replace(/\s*\(.+\)\s*$/, "") || meta.country || "";
    const iso = option.label.toLowerCase().includes("canada") ? "CA" : meta.iso || "";
    return {
      code: option.value,
      label: option.label,
      country,
      iso,
      flag: iso ? toFlagEmoji(iso) : "",
      min: meta.min || option.maxLength || 6,
      max: meta.max || option.maxLength || 15,
    };
  });

const PhoneField = ({ id, label, required = false, countryCode = "+91", value = "", onChange }) => {
  const wrapperRef = useRef(null);
  const triggerRef = useRef(null);
  const searchRef = useRef(null);
  const countries = useMemo(getCountryItems, []);
  const selectedCode = ensureCountryCodeValue(countryCode);
  const selectedCountry = countries.find((country) => country.code === selectedCode) || countries[0];
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [search, setSearch] = useState("");
  const menuRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState(null);
  const [triggerWidth, setTriggerWidth] = useState(0);

  useEffect(() => {
    const handleOutside = (event) => {
      if (wrapperRef.current?.contains(event.target) || menuRef.current?.contains(event.target)) {
        return;
      }
      if (wrapperRef.current) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  useEffect(() => {
    if (isOpen) setTimeout(() => searchRef.current?.focus(), 0);
  }, [isOpen]);

  useLayoutEffect(() => {
    const measureTrigger = () => {
      const width = triggerRef.current?.offsetWidth || 0;
      setTriggerWidth(width);
    };

    measureTrigger();
    window.addEventListener("resize", measureTrigger);

    return () => window.removeEventListener("resize", measureTrigger);
  }, [selectedCountry.code, selectedCountry.flag]);

  useLayoutEffect(() => {
    if (!isOpen) {
      setMenuStyle(null);
      return;
    }

    const updateMenuPosition = () => {
      if (!wrapperRef.current) return;

      const rect = wrapperRef.current.getBoundingClientRect();
      const viewportPadding = 12;
      const width = Math.min(Math.max(rect.width, 320), 420);
      const maxLeft = Math.max(viewportPadding, window.innerWidth - width - viewportPadding);
      const left = Math.min(Math.max(viewportPadding, rect.left), maxLeft);
      const top = rect.bottom + 8;
      const maxHeight = Math.max(220, window.innerHeight - top - viewportPadding);

      setMenuStyle({
        position: "fixed",
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        maxHeight: `${maxHeight}px`,
        zIndex: 5000,
      });
    };

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [isOpen, selectedCountry.code]);

  const filteredCountries = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return countries;
    return countries.filter(
      (country) =>
        country.country.toLowerCase().includes(query) ||
        country.code.includes(query) ||
        country.iso.toLowerCase().includes(query),
    );
  }, [countries, search]);

  const emitChange = (nextCountryCode, nextPhone) => {
    if (typeof onChange === "function") {
      onChange({ countryCode: nextCountryCode, phone: nextPhone });
    }
  };

  const handlePhoneChange = (event) => {
    const nextPhone = sanitizePhoneDigits(event.target.value, selectedCountry.max);
    emitChange(selectedCountry.code, nextPhone);
  };

  const handleCountrySelect = (country) => {
    const nextPhone = sanitizePhoneDigits(value, country.max);
    setIsOpen(false);
    setSearch("");
    emitChange(country.code, nextPhone);
  };

  return (
    <div className="avm-field fit-phone-field" ref={wrapperRef}>
      {label ? (
        <label htmlFor={id} className="avm-label">
          {label}
          {required ? <span className="req"> *</span> : null}
        </label>
      ) : null}

      <div className={`fit-phone-shell${isFocused || isOpen ? " active" : ""}`}>
        <button
          ref={triggerRef}
          type="button"
          className="fit-phone-trigger"
          onClick={() => setIsOpen((open) => !open)}
        >
          <span>{selectedCountry.flag}</span>
          <span>{selectedCountry.code}</span>
          <span className="fit-phone-caret">v</span>
        </button>

        <input
          id={id}
          type="tel"
          value={value}
          onChange={handlePhoneChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          maxLength={selectedCountry.max}
          pattern={`\\d{${selectedCountry.min},${selectedCountry.max}}`}
          title={`Enter ${selectedCountry.min === selectedCountry.max ? selectedCountry.max : `${selectedCountry.min}-${selectedCountry.max}`} digits`}
          className="fit-phone-input"
          style={{ paddingLeft: `${Math.max(triggerWidth + 16, 104)}px` }}
        />

        {isOpen && typeof document !== "undefined"
          ? createPortal(
              <div ref={menuRef} className="fit-phone-menu fit-phone-menu-dropdown" style={menuStyle || undefined}>
                <div className="fit-phone-search-wrap">
                  <input
                    ref={searchRef}
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search country or code..."
                    className="fit-phone-search"
                  />
                </div>
                <div className="fit-phone-list">
                  {filteredCountries.map((country, index) => (
                    <button
                      key={`${country.label}-${country.code}-${index}`}
                      type="button"
                      className={`fit-phone-option${country.code === selectedCountry.code ? " selected" : ""}`}
                      onClick={() => handleCountrySelect(country)}
                    >
                      <span className="fit-phone-country">
                        <span>{country.flag}</span>
                        <span>{country.country}</span>
                      </span>
                      <span>{country.code}</span>
                    </button>
                  ))}
                </div>
              </div>,
              document.body,
            )
          : null}
      </div>
    </div>
  );
};

export default PhoneField;
