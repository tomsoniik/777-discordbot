"use client";

import { useState, useEffect } from "react";
import { ArrowUp2, ArrowDown2, Trash, Add, Save2, Setting4 } from "iconsax-react";
import GlassSelect from "@/components/GlassSelect";

type FieldType = "short" | "long" | "number" | "select";

interface FormField {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string;
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
    setFields([...fields, { id: newId, label: "New Inquiry", type: "short", required: true }]);
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
        setMessage("Architecture synchronized successfully.");
      } else {
        setMessage("Synchronization failure detected.");
      }
    } catch (err) {
      setMessage("Critical connection error.");
    }
    setSaving(false);
    setTimeout(() => setMessage(""), 5000);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', color: '#2ecc71', fontSize: '1.25rem', fontWeight: 600 }}>
        <Setting4 size="32" className="btn-pulse" style={{ marginRight: '1rem' }} /> Loading Module...
      </div>
    );
  }

  const labelStyle = {
    display: 'block',
    fontSize: '0.85rem',
    color: '#8ebf9e',
    fontWeight: 600,
    marginBottom: '0.5rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px'
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ 
        maxWidth: '1000px', 
        marginBottom: '4rem',
        paddingTop: '2rem'
      }}>
        <h1 style={{ 
          fontSize: 'clamp(3rem, 5vw, 4.5rem)', 
          lineHeight: '1.1',
          fontWeight: 800,
          margin: 0,
          color: '#fff',
          letterSpacing: '-2px'
        }}>
          Recruitment Matrix
        </h1>
        <p style={{ 
          fontSize: '1.2rem', 
          color: '#8ebf9e', 
          marginTop: '1.5rem',
          maxWidth: '600px',
          lineHeight: '1.7'
        }}>
          Design the psychological and analytical pathways required for new candidate evaluation.
        </p>
      </div>
      
      {message && (
        <div style={{ 
          padding: '1.25rem 2rem', 
          marginBottom: '2rem',
          background: message.includes("success") ? 'rgba(46, 204, 113, 0.1)' : 'rgba(255, 60, 60, 0.1)', 
          color: message.includes("success") ? '#2ecc71' : '#ff3c3c', 
          borderRadius: '16px', 
          border: `1px solid ${message.includes("success") ? 'rgba(46, 204, 113, 0.3)' : 'rgba(255, 60, 60, 0.3)'}`,
          fontWeight: 600
        }}>
          {message}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {fields.map((field, idx) => (
          <div key={field.id} className="bento-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Header Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 800, fontSize: '1.5rem', marginRight: '1rem' }}>
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <button 
                  onClick={() => handleMove(idx, -1)} 
                  disabled={idx === 0} 
                  style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', padding: '0.5rem', cursor: idx === 0 ? 'not-allowed' : 'pointer', color: idx === 0 ? 'rgba(255,255,255,0.2)' : '#fff', transition: 'all 0.2s' }}
                >
                  <ArrowUp2 size="20" />
                </button>
                <button 
                  onClick={() => handleMove(idx, 1)} 
                  disabled={idx === fields.length - 1} 
                  style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', padding: '0.5rem', cursor: idx === fields.length - 1 ? 'not-allowed' : 'pointer', color: idx === fields.length - 1 ? 'rgba(255,255,255,0.2)' : '#fff', transition: 'all 0.2s' }}
                >
                  <ArrowDown2 size="20" />
                </button>
              </div>
              <button 
                onClick={() => handleRemoveField(field.id)} 
                style={{ background: 'rgba(255, 60, 60, 0.1)', border: '1px solid rgba(255, 60, 60, 0.3)', borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer', color: '#ff3c3c', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, transition: 'all 0.2s' }}
              >
                <Trash size="18" variant="Bulk" /> Delete
              </button>
            </div>

            {/* Inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
              <label style={labelStyle}>
                Query Designation (Label)
                <input 
                  type="text" 
                  value={field.label} 
                  onChange={(e) => handleChange(field.id, "label", e.target.value)} 
                  className="glass-input"
                  style={{ fontSize: '1.1rem' }}
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', alignItems: 'end' }}>
                <div style={labelStyle}>
                  Input Architecture (Type)
                  <GlassSelect 
                    value={field.type}
                    onChange={(val) => handleChange(field.id, "type", val as FieldType)}
                    options={[
                      { value: "short", label: "Text String (Short)" },
                      { value: "long", label: "Text Block (Long)" },
                      { value: "number", label: "Numeric Value" },
                      { value: "select", label: "Dropdown Matrix (Select)" }
                    ]}
                  />
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', background: 'rgba(0,0,0,0.3)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <input 
                    type="checkbox" 
                    checked={field.required} 
                    onChange={(e) => handleChange(field.id, "required", e.target.checked)}
                  /> 
                  <span style={{ color: '#fff', fontWeight: 600 }}>Mandatory</span>
                </label>
              </div>

              {field.type === "select" && (
                <label style={labelStyle}>
                  Matrix Options (Comma Separated)
                  <input 
                    type="text" 
                    value={field.options || ""} 
                    onChange={(e) => handleChange(field.id, "options", e.target.value)} 
                    className="glass-input"
                    placeholder="e.g. Assault, Support, Recon"
                  />
                </label>
              )}
            </div>
          </div>
        ))}

        <button 
          onClick={handleAddField} 
          style={{ 
            padding: '2rem', 
            background: 'transparent', 
            border: '2px dashed rgba(46, 204, 113, 0.3)', 
            borderRadius: '24px', 
            cursor: 'pointer', 
            width: '100%', 
            marginTop: '1rem',
            color: '#2ecc71',
            fontSize: '1.1rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(46, 204, 113, 0.05)'; e.currentTarget.style.borderColor = '#2ecc71'; }}
          onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(46, 204, 113, 0.3)'; }}
        >
          <Add size="24" /> Inject New Query Block
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem', paddingBottom: '2rem' }}>
        <button onClick={handleSave} disabled={saving} className="btn-cinematic">
          <Save2 size="24" color={saving ? 'rgba(255,255,255,0.3)' : '#050c08'} variant="Bulk" />
          {saving ? "Processing..." : "Commit Matrix Architecture"}
        </button>
      </div>
    </div>
  );
}
