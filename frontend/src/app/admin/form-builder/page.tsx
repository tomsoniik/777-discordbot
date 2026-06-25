"use client";

import { useState, useEffect } from "react";

type FieldType = "short" | "long" | "number" | "select";

interface FormField {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string; // Comma separated for 'select'
}

export default function FormBuilderPage() {
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/form-template")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.fields) {
          setFields(data.fields);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleAddField = () => {
    const newId = `field_${Date.now()}`;
    setFields([...fields, { id: newId, label: "Nowe pytanie", type: "short", required: true }]);
  };

  const handleRemoveField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
  };

  const handleChange = (id: string, key: keyof FormField, value: string | boolean) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, [key]: value } : f)));
  };

  const handleMove = (index: number, direction: -1 | 1) => {
    const newFields = [...fields];
    if (index + direction >= 0 && index + direction < newFields.length) {
      const temp = newFields[index];
      newFields[index] = newFields[index + direction];
      newFields[index + direction] = temp;
      setFields(newFields);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/form-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields }),
      });
      if (res.ok) {
        setMessage("Zapisano pomyślnie!");
      } else {
        setMessage("Błąd podczas zapisywania.");
      }
    } catch (err) {
      setMessage("Wystąpił błąd.");
    }
    setSaving(false);
  };

  if (loading) return <div>Ładowanie konfiguratora...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: 'var(--accent-green)', marginBottom: '2rem' }}>Kreator Formularza Rekrutacyjnego</h1>
      
      {message && (
        <div style={{ padding: '1rem', marginBottom: '1rem', backgroundColor: message.includes("pomyślnie") ? 'rgba(0,255,0,0.1)' : 'rgba(255,0,0,0.1)', color: message.includes("pomyślnie") ? 'var(--accent-green)' : 'red', borderRadius: '4px' }}>
          {message}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {fields.map((field, idx) => (
          <div key={field.id} style={{ padding: '1.5rem', backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '8px', position: 'relative' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => handleMove(idx, -1)} disabled={idx === 0} style={{ padding: '0.2rem 0.5rem', cursor: 'pointer', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}>↑</button>
                <button onClick={() => handleMove(idx, 1)} disabled={idx === fields.length - 1} style={{ padding: '0.2rem 0.5rem', cursor: 'pointer', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}>↓</button>
              </div>
              <button onClick={() => handleRemoveField(field.id)} style={{ padding: '0.2rem 0.5rem', cursor: 'pointer', background: 'rgba(255,0,0,0.2)', border: '1px solid red', color: 'red', borderRadius: '4px' }}>Usuń Pytanie</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label>
                Treść Pytania (Etykieta):
                <input 
                  type="text" 
                  value={field.label} 
                  onChange={(e) => handleChange(field.id, "label", e.target.value)} 
                  className="form-input"
                />
              </label>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <label style={{ flex: 1 }}>
                  Typ Odpowiedzi:
                  <select 
                    value={field.type} 
                    onChange={(e) => handleChange(field.id, "type", e.target.value)}
                    className="form-input"
                  >
                    <option value="short">Krótka odpowiedź (Tekst)</option>
                    <option value="long">Długa odpowiedź (Textarea)</option>
                    <option value="number">Liczba (Wiek, Godziny)</option>
                    <option value="select">Wybór z listy (Select)</option>
                  </select>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.8rem' }}>
                  <input 
                    type="checkbox" 
                    checked={field.required} 
                    onChange={(e) => handleChange(field.id, "required", e.target.checked)}
                  /> Wymagane?
                </label>
              </div>

              {field.type === "select" && (
                <label>
                  Opcje wyboru (rozdzielone przecinkami):
                  <input 
                    type="text" 
                    value={field.options || ""} 
                    onChange={(e) => handleChange(field.id, "options", e.target.value)} 
                    className="form-input"
                    placeholder="np. PvP, Budowanie, Zbieranie"
                  />
                </label>
              )}
            </div>
          </div>
        ))}

        <button onClick={handleAddField} className="btn-outline" style={{ padding: '1rem', borderStyle: 'dashed', borderRadius: '8px', cursor: 'pointer', width: '100%', marginTop: '1rem' }}>
          + Dodaj nowe pytanie
        </button>

        <button onClick={handleSave} disabled={saving} className="btn" style={{ padding: '1rem', width: '100%', marginTop: '2rem' }}>
          {saving ? "Zapisywanie..." : "Zapisz Formularz"}
        </button>
      </div>
    </div>
  );
}
