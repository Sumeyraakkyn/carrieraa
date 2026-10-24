'use client';
import { useState, useCallback } from 'react';

// ─── Kural tipleri ────────────────────────────────────────────────────────────
type RuleFn = (value: string) => string | null; // null = geçerli

export const rules = {
  required: (label = 'Bu alan'): RuleFn =>
    (v) => v.trim() === '' ? `${label} zorunludur.` : null,

  minLength: (n: number): RuleFn =>
    (v) => v.length < n ? `En az ${n} karakter giriniz.` : null,

  maxLength: (n: number): RuleFn =>
    (v) => v.length > n ? `En fazla ${n} karakter giriniz.` : null,

  email: (): RuleFn =>
    (v) => v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'Geçerli bir e-posta adresi giriniz.' : null,

  phone: (): RuleFn =>
    (v) => v && !/^[0-9\s\-\+\(\)]{7,15}$/.test(v) ? 'Geçerli bir telefon numarası giriniz.' : null,

  url: (): RuleFn =>
    (v) => v && !/^https?:\/\/.+/.test(v) ? 'URL http:// veya https:// ile başlamalıdır.' : null,

  noSpaces: (): RuleFn =>
    (v) => /\s/.test(v) ? 'Boşluk kullanılamaz.' : null,

  passwordStrength: (): RuleFn =>
    (v) => {
      if (v.length < 6) return 'En az 6 karakter giriniz.';
      if (!/[A-Z]/.test(v) && !/[0-9]/.test(v))
        return 'Şifre en az bir büyük harf veya rakam içermelidir.';
      return null;
    },

  match: (other: string, label = 'Şifreler'): RuleFn =>
    (v) => v !== other ? `${label} eşleşmiyor.` : null,

  date: (): RuleFn =>
    (v) => {
      if (!v) return null;
      const d = new Date(v);
      return isNaN(d.getTime()) ? 'Geçerli bir tarih giriniz.' : null;
    },
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
type FieldRules = Record<string, RuleFn[]>;
type Errors = Record<string, string>;

export function useFormValidation(fieldRules: FieldRules) {
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  /** Tek bir alanı doğrula */
  const validateField = useCallback(
    (name: string, value: string): string => {
      const fns = fieldRules[name] ?? [];
      for (const fn of fns) {
        const err = fn(value);
        if (err) return err;
      }
      return '';
    },
    [fieldRules]
  );

  /** Blur olunca alanı işaretle ve doğrula */
  const onBlur = useCallback(
    (name: string, value: string) => {
      setTouched((t) => ({ ...t, [name]: true }));
      const err = validateField(name, value);
      setErrors((e) => ({ ...e, [name]: err }));
    },
    [validateField]
  );

  /** Değer değişince (sadece touched ise) hata güncelle */
  const onChange = useCallback(
    (name: string, value: string) => {
      if (!touched[name]) return;
      const err = validateField(name, value);
      setErrors((e) => ({ ...e, [name]: err }));
    },
    [touched, validateField]
  );

  /** Tüm formu doğrula — submit öncesi çağır */
  const validateAll = useCallback(
    (values: Record<string, string>): boolean => {
      const newErrors: Errors = {};
      let valid = true;
      for (const name of Object.keys(fieldRules)) {
        const err = validateField(name, values[name] ?? '');
        newErrors[name] = err;
        if (err) valid = false;
      }
      setErrors(newErrors);
      // Tüm alanları touched yap
      const allTouched: Record<string, boolean> = {};
      Object.keys(fieldRules).forEach((k) => (allTouched[k] = true));
      setTouched(allTouched);
      return valid;
    },
    [fieldRules, validateField]
  );

  /** Hata mesajı varsa göster */
  const errorMsg = (name: string) => (touched[name] ? errors[name] || '' : '');

  /** Alanın hatalı olup olmadığı */
  const isInvalid = (name: string) => !!(touched[name] && errors[name]);

  return { errors, touched, onBlur, onChange, validateAll, errorMsg, isInvalid };
}
