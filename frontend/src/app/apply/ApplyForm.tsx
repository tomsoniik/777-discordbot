"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";

export default function ApplyForm() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState<Record<string, string>>({});

  const [loadingConfig, setLoadingConfig] = useState(true);
  const [fields, setFields] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/form-template")
      .then(res => res.json())
      .then(data => {
        if (data.success && data.fields) {
          setFields(data.fields);
          // Initialize formData based on fields
          const initialData: Record<string, string> = {};
          data.fields.forEach((f: any) => {
            if (f.type === "select" && f.options) {
              initialData[f.id] = f.options.split(",")[0].trim();
            } else {
              initialData[f.id] = "";
            }
          });
          setFormData(initialData);
        }
        setLoadingConfig(false);
      })
      .catch(() => setLoadingConfig(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check required fields
    const missing = fields.find(f => f.required && !formData[f.id]);
    if (missing) {
      setMessage(`${t("fillRequired")}${missing.label}`);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setMessage(t("successSubmit"));
        // Reset
        const resetData: Record<string, string> = {};
        fields.forEach(f => {
          resetData[f.id] = f.type === "select" && f.options ? f.options.split(",")[0].trim() : "";
        });
        setFormData(resetData);
      } else {
        const data = await res.json();
        setMessage(data.error || t("errorOccurred"));
      }
    } catch (err) {
      setMessage(t("errorSending"));
    }

    setLoading(false);
  };

  if (loadingConfig) return <div style={{ textAlign: 'center', padding: '2rem' }}>{t("loadingForm")}</div>;

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
      {message && (
        <div style={{ padding: '1rem', backgroundColor: message.includes("Sukces") ? 'rgba(0,255,0,0.1)' : 'rgba(255,0,0,0.1)', color: message.includes("Sukces") ? 'var(--accent-green)' : 'red', borderRadius: '4px', textAlign: 'center' }}>
          {message}
        </div>
      )}

      {fields.map((field) => (
        <label key={field.id}>
          {field.label} {field.required && <span style={{ color: 'red' }}>*</span>}
          
          {field.type === "short" && (
            <input type="text" name={field.id} value={formData[field.id] || ""} onChange={handleChange} className="form-input" required={field.required} />
          )}

          {field.type === "number" && (
            <input type="number" name={field.id} value={formData[field.id] || ""} onChange={handleChange} className="form-input" required={field.required} />
          )}

          {field.type === "long" && (
            <textarea rows={4} name={field.id} value={formData[field.id] || ""} onChange={handleChange} className="form-input" required={field.required} />
          )}

          {field.type === "select" && (
            <select name={field.id} value={formData[field.id] || ""} onChange={handleChange} className="form-input" required={field.required}>
              {field.options?.split(",").map((opt: string, i: number) => (
                <option key={i} value={opt.trim()}>{opt.trim()}</option>
              ))}
            </select>
          )}
        </label>
      ))}

      <button type="submit" className="btn" disabled={loading} style={{ marginTop: '1rem' }}>
        {loading ? t("submitting") : t("submitApp")}
      </button>
    </form>
  );
}
