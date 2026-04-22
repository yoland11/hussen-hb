import type { FormEvent } from "react";

import {
  locationTypeOptions,
  serviceTypeOptions,
  sessionSizeOptions,
  staffGenderOptions,
} from "@/lib/bookings/options";
import { formatCurrency } from "@/lib/utils";

import type { BookingFormValues } from "./form-state";
import { SectionCard } from "./section-card";

type BookingFormProps = {
  form: BookingFormValues;
  isEditing: boolean;
  isBusy: boolean;
  canSave: boolean;
  showExtraDetails: boolean;
  error: string | null;
  onFieldChange: <K extends keyof BookingFormValues>(
    field: K,
    value: BookingFormValues[K],
  ) => void;
  onToggleExtraDetails: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
  onPreview: () => void;
  onPrint: () => void;
  onShare: () => void;
};

function OptionButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`opt ${active ? "on" : ""}`.trim()}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export function BookingForm({
  form,
  isEditing,
  isBusy,
  canSave,
  showExtraDetails,
  error,
  onFieldChange,
  onToggleExtraDetails,
  onSubmit,
  onReset,
  onPreview,
  onPrint,
  onShare,
}: BookingFormProps) {
  const totalAmount = Number(form.total_amount || 0);
  const paidAmount = Number(form.paid_amount || 0);
  const remainingAmount = totalAmount - paidAmount;

  return (
    <form onSubmit={onSubmit}>
      <SectionCard icon="👤" title="بيانات العميل">
        <div className="two">
          <div className="fld">
            <label htmlFor="customer_name">اسم العميل</label>
            <input
              id="customer_name"
              type="text"
              placeholder="الاسم الكامل"
              value={form.customer_name}
              onChange={(event) =>
                onFieldChange("customer_name", event.target.value)
              }
            />
          </div>

          <div className="fld">
            <label htmlFor="phone">رقم الهاتف</label>
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              placeholder="07X XXXX XXXX"
              style={{ direction: "ltr", textAlign: "right" }}
              value={form.phone}
              onChange={(event) => onFieldChange("phone", event.target.value)}
            />
          </div>
        </div>

        <div className="fld">
          <label htmlFor="booking_date">تاريخ الحجز</label>
          <input
            id="booking_date"
            type="date"
            value={form.booking_date}
            onChange={(event) => onFieldChange("booking_date", event.target.value)}
          />
        </div>
      </SectionCard>

      <SectionCard icon="🎭" title="نوع الجلسة">
        <div className="fld">
          <label>التفاصيل</label>
          <div className="opts">
            {serviceTypeOptions.map((option) => (
              <OptionButton
                key={option}
                active={form.service_type === option}
                label={option}
                onClick={() =>
                  onFieldChange(
                    "service_type",
                    form.service_type === option ? "" : option,
                  )
                }
              />
            ))}
          </div>
        </div>

        <div className="fld spaced-top">
          <label>تفاصيل الجلسة</label>
          <div className="sopts">
            {sessionSizeOptions.map((option) => (
              <OptionButton
                key={option}
                active={form.session_size === option}
                label={option}
                onClick={() =>
                  onFieldChange(
                    "session_size",
                    form.session_size === option ? "" : option,
                  )
                }
              />
            ))}
            <button
              type="button"
              className={`extra-toggle-btn ${showExtraDetails ? "on" : ""}`.trim()}
              onClick={onToggleExtraDetails}
            >
              ✏️ تعديل
            </button>
          </div>

          <div className={`extra-box ${showExtraDetails ? "show" : ""}`.trim()}>
            <label htmlFor="extra_details" className="compact-label">
              تفاصيل إضافية
            </label>
            <input
              id="extra_details"
              type="text"
              placeholder="أدخل التفاصيل الخاصة بالجلسة..."
              value={form.extra_details}
              onChange={(event) =>
                onFieldChange("extra_details", event.target.value)
              }
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard icon="📍" title="موقع الجلسة">
        <div className="opts">
          {locationTypeOptions.map((option) => (
            <OptionButton
              key={option}
              active={form.location_type === option}
              label={option}
              onClick={() =>
                onFieldChange(
                  "location_type",
                  form.location_type === option ? "" : option,
                )
              }
            />
          ))}
        </div>
      </SectionCard>

      <SectionCard icon="👥" title="الكادر">
        <div className="opts">
          {staffGenderOptions.map((option) => (
            <OptionButton
              key={option}
              active={form.staff_gender === option}
              label={option}
              onClick={() =>
                onFieldChange(
                  "staff_gender",
                  form.staff_gender === option ? "" : option,
                )
              }
            />
          ))}
        </div>
      </SectionCard>

      <SectionCard icon="💰" title="الحساب">
        <div className="two">
          <div className="fld">
            <label htmlFor="total_amount">إجمالي الحساب</label>
            <input
              id="total_amount"
              type="number"
              placeholder="0"
              min="0"
              value={form.total_amount}
              onChange={(event) =>
                onFieldChange("total_amount", event.target.value)
              }
            />
          </div>

          <div className="fld">
            <label htmlFor="paid_amount">المبلغ الواصل</label>
            <input
              id="paid_amount"
              type="number"
              placeholder="0"
              min="0"
              value={form.paid_amount}
              onChange={(event) =>
                onFieldChange("paid_amount", event.target.value)
              }
            />
          </div>
        </div>

        <div className="divider" />

        <div className="prow">
          <span className="plbl">الإجمالي</span>
          <span className="pval">{formatCurrency(totalAmount)}</span>
        </div>
        <div className="prow">
          <span className="plbl">الواصل</span>
          <span className="pval text-green">{formatCurrency(paidAmount)}</span>
        </div>
        <div className="prow">
          <span className="plbl">المتبقي</span>
          <span className="pval text-red">{formatCurrency(remainingAmount)}</span>
        </div>

        <div className="divider" />

        <label>حالة الدفع</label>
        <div className="stoggle">
          <button
            className={`sbtn ${form.payment_status === "paid" ? "paid" : ""}`.trim()}
            type="button"
            onClick={() => onFieldChange("payment_status", "paid")}
          >
            ✅ واصل
          </button>
          <button
            className={`sbtn ${form.payment_status === "unpaid" ? "unpaid" : ""}`.trim()}
            type="button"
            onClick={() => onFieldChange("payment_status", "unpaid")}
          >
            ❌ غير واصل
          </button>
        </div>
      </SectionCard>

      <SectionCard icon="📝" title="الملاحظات">
        <textarea
          id="notes"
          placeholder="أي ملاحظات خاصة بالحجز..."
          value={form.notes}
          onChange={(event) => onFieldChange("notes", event.target.value)}
        />
      </SectionCard>

      {isEditing ? (
        <div className="edit-banner show">
          <div className="edit-banner-text">
            أنت الآن في وضع تعديل الحجز. بعد الحفظ سيتم تحديث البيانات مباشرة.
          </div>
          <button className="edit-banner-btn" type="button" onClick={onReset}>
            إلغاء التعديل
          </button>
        </div>
      ) : null}

      {error ? <div className="inline-error wide">{error}</div> : null}

      <button className="savebtn" type="submit" disabled={isBusy || !canSave}>
        {isBusy ? "جارٍ الحفظ..." : isEditing ? "✏️ تحديث الحجز" : "💾 حفظ الحجز"}
      </button>

      <div className="action-row">
        <button className="secbtn clear" type="button" onClick={onReset}>
          🧹 مسح المحتويات
        </button>
        <button className="secbtn preview" type="button" onClick={onPreview}>
          👁️ معاينة الفاتورة
        </button>
        <button className="secbtn pdf" type="button" onClick={onPrint}>
          🧾 طباعة الفاتورة PDF
        </button>
        <button className="secbtn share" type="button" onClick={onShare}>
          📤 مشاركة الفاتورة
        </button>
      </div>
    </form>
  );
}
