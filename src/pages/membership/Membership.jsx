import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardBody, Row, Col, Button, Container, ButtonGroup } from "react-bootstrap";
import { IconHome, IconCheck, IconCrown, IconBarbell, IconInfinity, IconMessageHeart, IconClock, IconEdit, IconSettings } from "@tabler/icons-react";
import { getMyMembership, createMembershipOrder, verifyMembershipPayment, cancelMembership, requestPlanChange } from "../../api/membershipApi";
import { getMembershipPlans } from "../../api/membershipPlansApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useAuth } from "../../context/AuthContext";

const loadRazorpay = () =>
  new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => reject(new Error("Failed to load the payment gateway"));
    document.body.appendChild(s);
  });

// Billing periods — discounts must match the backend (priceForPeriod).
const PERIODS = [
  { months: 1, label: "Monthly", discount: 0, note: "" },
  { months: 3, label: "Quarterly", discount: 0.1, note: "Save 10%" },
  { months: 12, label: "Yearly", discount: 0.2, note: "Save 20%" },
];

const periodTotal = (price, months, discount) => Math.round((price || 0) * months * (1 - discount));
const perMonth = (price, discount) => Math.round((price || 0) * (1 - discount));

export default function Membership() {
  const { hasPermission, user } = useAuth();
  // Staff who can edit plans get an "Edit / Manage plans" affordance and can see
  // the cards even though they don't hold a membership themselves.
  const isPlanAdmin = hasPermission("membership-plans", "edit");
  const [plans, setPlans] = useState([]);
  const [membership, setMembership] = useState(null);
  const [months, setMonths] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const period = useMemo(() => PERIODS.find((p) => p.months === months) || PERIODS[0], [months]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [planList, mine] = await Promise.all([
        getMembershipPlans({ activeOnly: true }),
        getMyMembership(),
      ]);
      setPlans(Array.isArray(planList) ? planList : []);
      setMembership(mine);
    } catch (err) {
      setError(extractApiErrorMessage(err, "Failed to load membership"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(t);
  }, [notice]);

  const applicable = membership?.applicable;
  const currentPlanId = membership?.planId ?? null;
  const currentCode = String(membership?.plan || "").toUpperCase();

  const isCurrent = (plan) =>
    (currentPlanId != null && plan.id === currentPlanId) ||
    (currentPlanId == null && plan.code?.toUpperCase() === currentCode);

  const handleSubscribe = async (plan) => {
    setBusy(true);
    setError("");
    try {
      const order = await createMembershipOrder(plan.id, months);
      await loadRazorpay();
      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: order.name,
        description: order.description,
        order_id: order.orderId,
        theme: { color: "#2bb3a3" },
        // Prefill the member's details. A contact helps UPI render in checkout.
        // (No custom method config — let Razorpay show every method enabled on the
        // account, including UPI.)
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: membership?.phone || user?.phone || "",
        },
        handler: async (resp) => {
          try {
            const updated = await verifyMembershipPayment({
              razorpayOrderId: resp.razorpay_order_id,
              razorpayPaymentId: resp.razorpay_payment_id,
              razorpaySignature: resp.razorpay_signature,
              planId: plan.id,
              months,
            });
            setMembership(updated);
            // Let the sidebar refresh so the "Upgrade" card hides immediately.
            window.dispatchEvent(new Event("membership:updated"));
            setNotice(`${plan.name} active until ${updated?.expiry || ""}.`);
          } catch (e) {
            setError(extractApiErrorMessage(e, "Payment verification failed"));
          } finally {
            setBusy(false);
          }
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.on("payment.failed", (r) => {
        setError("Payment failed: " + (r?.error?.description || "please try again"));
        setBusy(false);
      });
      rzp.open();
    } catch (err) {
      setError(extractApiErrorMessage(err, "Could not start payment"));
      setBusy(false);
    }
  };

  const handleCancel = async () => {
    setBusy(true);
    try {
      setMembership(await cancelMembership());
      window.dispatchEvent(new Event("membership:updated"));
      setNotice("Membership set back to Basic.");
    } catch (err) {
      setError(extractApiErrorMessage(err, "Could not cancel"));
    } finally {
      setBusy(false);
    }
  };

  // Ask staff to upgrade you (admin-assisted) instead of paying online — your
  // existing paid time is credited when they assign the new plan.
  const handleRequestUpgrade = async (plan) => {
    setBusy(true);
    setError("");
    try {
      await requestPlanChange(plan.id, `Upgrade request for the ${plan.name} plan.`);
      setNotice(`Upgrade request sent to the gym staff for the ${plan.name} plan. They'll assign it and credit your current plan.`);
    } catch (err) {
      setError(extractApiErrorMessage(err, "Could not send your request"));
    } finally {
      setBusy(false);
    }
  };

  const currentPlan = useMemo(() => plans.find((p) => isCurrent(p)) || null, [plans, currentPlanId, currentCode]);
  const isPaidCurrent = currentPlan && currentPlan.price > 0;

  return (
    <main className="themebody-wrap">
      <div className="theme-body">
        <Container fluid>
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
            <div>
              <h2 className="mb-1">Membership</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item"><Link to="/"><IconHome size={16} /></Link></li>
                  <li className="breadcrumb-item active">Membership</li>
                </ol>
              </nav>
            </div>
            {isPlanAdmin && (
              <Link to="/membership-plans" className="btn btn-outline-primary d-inline-flex align-items-center gap-1">
                <IconSettings size={16} /> Manage plans
              </Link>
            )}
          </div>

          {error && <div className="alert alert-danger">{error}</div>}
          {notice && <div className="alert alert-success">{notice}</div>}

          {loading ? (
            <div className="text-center py-5">Loading...</div>
          ) : (!applicable && !isPlanAdmin) ? (
            <Card><CardBody className="text-center py-5">
              <IconBarbell size={36} className="mb-2" />
              <h4 className="fw-bold">Memberships are for gym members</h4>
              <p className="text-muted mb-0">Your account is a staff account, so no membership plan applies.</p>
            </CardBody></Card>
          ) : (
            <>
              {/* Admin view: not a member, just managing the catalogue. */}
              {!applicable && isPlanAdmin && (
                <div className="alert alert-info d-flex align-items-center gap-2">
                  <IconSettings size={18} />
                  <span>You're viewing the plan catalogue as staff. Use <strong>Edit</strong> on a card or <strong>Manage plans</strong> to change pricing, features and access.</span>
                </div>
              )}

              {/* Current status (members only) */}
              {applicable && (
              <Card className={`mb-4 ${isPaidCurrent ? "bg-light-warning" : "bg-light"}`}>
                <CardBody className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                  <div className="d-flex align-items-center gap-3">
                    <div className="rounded-circle bg-white d-flex align-items-center justify-content-center" style={{ width: 56, height: 56 }}>
                      <IconCrown size={28} color={isPaidCurrent ? "#f4a23b" : "#9aa7b2"} />
                    </div>
                    <div>
                      <h4 className="fw-bold mb-0">{membership?.planName || currentPlan?.name || "Basic"} member</h4>
                      <p className="mb-0 text-muted">
                        {membership?.expiry
                          ? `Active until ${membership.expiry}${membership.daysLeft != null ? ` · ${membership.daysLeft} days left` : ""}`
                          : "Upgrade to unlock premium features"}
                      </p>
                      <div className="mt-1 d-flex flex-wrap gap-2">
                        {membership?.unlimitedAccess ? (
                          <span className="badge bg-success d-inline-flex align-items-center gap-1">
                            <IconInfinity size={14} /> Unlimited anytime entry
                          </span>
                        ) : membership?.accessStartTime ? (
                          <span className="badge bg-info d-inline-flex align-items-center gap-1">
                            <IconClock size={14} /> Check-in {membership.accessStartTime}–{membership.accessEndTime}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  {isPaidCurrent && (
                    <Button variant="outline-secondary" onClick={handleCancel} disabled={busy}>Cancel</Button>
                  )}
                </CardBody>
              </Card>
              )}

              {/* Billing period toggle (members only) */}
              {applicable && (
              <div className="d-flex justify-content-center mb-4">
                <ButtonGroup>
                  {PERIODS.map((p) => (
                    <Button
                      key={p.months}
                      variant={p.months === months ? "primary" : "outline-primary"}
                      onClick={() => setMonths(p.months)}
                    >
                      {p.label}
                      {p.note && <span className="badge bg-success ms-2">{p.note}</span>}
                    </Button>
                  ))}
                </ButtonGroup>
              </div>
              )}

              {/* Plans */}
              <Row className="g-4">
                {plans.map((plan) => {
                  const current = isCurrent(plan);
                  const free = !plan.price || plan.price <= 0;
                  const highlight = plan.unlimitedAccess;
                  const total = periodTotal(plan.price, period.months, period.discount);
                  // Upgrade = a costlier, different plan while on an active paid plan.
                  // Credit the unused value of the current plan toward it (matches the backend).
                  const currentPlanPrice = currentPlan?.price ?? 0;
                  // Moving to a costlier plan than the current one = an upgrade. The
                  // admin-assisted request works regardless of expiry; the money-credit
                  // (proration) only applies when there's an active PAID period left.
                  const canRequestUpgrade = applicable && !current && !free
                    && currentPlanPrice > 0 && plan.price > currentPlanPrice;
                  const isUpgrade = canRequestUpgrade && Boolean(membership?.expiry);
                  const creditRupees = isUpgrade && typeof membership?.daysLeft === "number" && currentPlan?.durationDays
                    ? Math.max(0, Math.round(membership.daysLeft * (currentPlanPrice / currentPlan.durationDays)))
                    : 0;
                  const netNow = Math.max(0, total - creditRupees);
                  return (
                    <Col md={6} lg={4} key={plan.id}>
                      <Card className={`h-100 ${highlight ? "border-warning" : ""}`} style={highlight ? { borderWidth: 2 } : undefined}>
                        <CardBody className="d-flex flex-column">
                          <div className="d-flex align-items-center justify-content-between">
                            <h4 className="fw-bold mb-0">
                              {highlight && <IconCrown size={20} color="#f4a23b" className="me-1" />}
                              {plan.name}
                            </h4>
                            {isPlanAdmin ? (
                              <Link to="/membership-plans" className="btn btn-sm btn-outline-primary" title={`Edit ${plan.name}`}>
                                <IconEdit size={14} />
                              </Link>
                            ) : current ? (
                              <span className="badge bg-success">Current</span>
                            ) : null}
                          </div>
                          {plan.description && <p className="text-muted small mb-2 mt-1">{plan.description}</p>}

                          <div className="my-2">
                            {free ? (
                              <span className="display-6 fw-bold">Free</span>
                            ) : (
                              <>
                                <span className="display-6 fw-bold">₹{total}</span>
                                <span className="text-muted"> / {period.label.toLowerCase()}</span>
                                {period.months > 1 && (
                                  <div className="small text-muted">≈ ₹{perMonth(plan.price, period.discount)}/month</div>
                                )}
                                {isUpgrade && creditRupees > 0 && (
                                  <div className="small text-success mt-1">
                                    Pay <strong>₹{netNow}</strong> now · ₹{creditRupees} credit from your current plan
                                  </div>
                                )}
                              </>
                            )}
                          </div>

                          {/* Key perks */}
                          <div className="d-flex flex-wrap gap-2 mb-3">
                            {plan.unlimitedAccess ? (
                              <span className="badge bg-light-success text-success d-inline-flex align-items-center gap-1">
                                <IconInfinity size={14} /> Anytime entry
                              </span>
                            ) : (
                              <span className="badge bg-light text-dark d-inline-flex align-items-center gap-1">
                                <IconClock size={14} /> Assigned time slot
                              </span>
                            )}
                            {plan.trainerChat && (
                              <span className="badge bg-light-primary text-primary d-inline-flex align-items-center gap-1">
                                <IconMessageHeart size={14} /> Trainer chat
                              </span>
                            )}
                          </div>

                          <ul className="list-unstyled mb-4">
                            {(plan.features || []).map((f) => (
                              <li key={f} className="mb-2 d-flex align-items-start gap-2">
                                <IconCheck size={18} className="text-success mt-1" /> <span>{f}</span>
                              </li>
                            ))}
                          </ul>

                          <div className="mt-auto">
                            {isPlanAdmin ? (
                              <Link to="/membership-plans" className="btn btn-outline-primary w-100 d-inline-flex align-items-center justify-content-center gap-1">
                                <IconEdit size={16} /> Edit plan
                              </Link>
                            ) : free ? (
                              <Button variant="light" className="w-100" disabled>
                                {current ? "Current plan" : "Included"}
                              </Button>
                            ) : current ? (
                              <Button variant="outline-warning" className="w-100" onClick={() => handleSubscribe(plan)} disabled={busy}>
                                {busy ? "Processing..." : `Extend (${period.label})`}
                              </Button>
                            ) : isUpgrade ? (
                              <>
                                <Button variant={highlight ? "warning" : "primary"} className="w-100" onClick={() => handleSubscribe(plan)} disabled={busy}>
                                  {busy ? "Processing..." : creditRupees > 0 ? `Upgrade — ₹${netNow}` : `Upgrade to ${plan.name}`}
                                </Button>
                                <Button variant="link" size="sm" className="w-100 mt-1 text-decoration-none" onClick={() => handleRequestUpgrade(plan)} disabled={busy}>
                                  Or request upgrade via admin
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button variant={highlight ? "warning" : "primary"} className="w-100" onClick={() => handleSubscribe(plan)} disabled={busy}>
                                  {busy ? "Processing..." : `Choose ${plan.name}`}
                                </Button>
                                {canRequestUpgrade && (
                                  <Button variant="link" size="sm" className="w-100 mt-1 text-decoration-none" onClick={() => handleRequestUpgrade(plan)} disabled={busy}>
                                    Or request upgrade via admin
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </CardBody>
                      </Card>
                    </Col>
                  );
                })}
              </Row>

              {applicable && (
                <p className="text-muted small mt-3 mb-0">
                  Secure payment via Razorpay (test mode). To test, pay with UPI <code>success@razorpay</code>, or choose
                  Netbanking → any bank → Success. Quarterly and yearly billing apply a discount automatically.
                </p>
              )}
            </>
          )}
        </Container>
      </div>
    </main>
  );
}
