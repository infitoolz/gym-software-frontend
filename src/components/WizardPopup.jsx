import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import "../assets/css/addModalShared.css";

const WizardPopup = ({
  open,
  title,
  steps,
  step,
  onClose,
  onBack,
  onNext,
  onSubmit,
  children,
  submitLabel = "Save",
  modalWidth,
  disabled = false,
}) => {
  if (!open) return null;

  const isLast = step === steps.length - 1;

  return (
    <div className="avm-backdrop" role="presentation">
      <div
        className="avm-modal"
        style={modalWidth ? { maxWidth: modalWidth } : {}}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="avm-modal-header">
          <h2 className="avm-modal-title">{title}</h2>
          <button type="button" className="avm-modal-close" onClick={onClose} aria-label="Close modal">
            x
          </button>
        </div>

        <div className="avm-steps">
          {steps.map((item, index) => (
            <div
              key={item}
              className={`avm-step${index === step ? " active" : ""}${index < step ? " done" : ""}`}
            >
              <div className="avm-step-dot">{index + 1}</div>
              <span className="avm-step-label">{item}</span>
            </div>
          ))}
        </div>

        <div className="avm-body">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="avm-footer">
          <div>{step > 0 ? <button type="button" className="avm-btn light" onClick={onBack} disabled={disabled}>Back</button> : null}</div>
          <div className="avm-footer-right">
            <button type="button" className="avm-btn light" onClick={onClose} disabled={disabled}>
              Cancel
            </button>
            {isLast ? (
              <button type="button" className="avm-btn primary" onClick={onSubmit} disabled={disabled}>
                {submitLabel}
              </button>
            ) : (
              <button type="button" className="avm-btn primary" onClick={onNext} disabled={disabled}>
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WizardPopup;
