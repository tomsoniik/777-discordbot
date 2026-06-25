"use client";

import { useState } from "react";

export default function AdminConfigForm({ initialConfig }: { initialConfig: any }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    guildId: initialConfig.guildId || "",
    applyChannelId: initialConfig.applyChannelId || "",
    ticketCategoryId: initialConfig.ticketCategoryId || "",
    adminRoleIds: initialConfig.adminRoleIds || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setMessage("Configuration saved successfully!");
      } else {
        setMessage("Failed to save configuration.");
      }
    } catch (err) {
      setMessage("An error occurred while saving.");
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {message && (
        <div style={{ padding: '1rem', backgroundColor: message.includes("success") ? 'rgba(0,255,0,0.1)' : 'rgba(255,0,0,0.1)', color: message.includes("success") ? 'var(--accent-green)' : 'red', borderRadius: '4px', textAlign: 'center' }}>
          {message}
        </div>
      )}

      <label>
        Discord Server ID (Guild ID):
        <input 
          type="text" 
          name="guildId" 
          value={formData.guildId} 
          onChange={handleChange} 
          className="form-input" 
          placeholder="e.g. 123456789012345678" 
        />
      </label>

      <label>
        Applications Channel ID (Where bot sends new forms):
        <input 
          type="text" 
          name="applyChannelId" 
          value={formData.applyChannelId} 
          onChange={handleChange} 
          className="form-input" 
          placeholder="e.g. 123456789012345678" 
        />
      </label>

      <label>
        Ticket Category ID (Where bot creates interview channels):
        <input 
          type="text" 
          name="ticketCategoryId" 
          value={formData.ticketCategoryId} 
          onChange={handleChange} 
          className="form-input" 
          placeholder="e.g. 123456789012345678" 
        />
      </label>

      <label>
        Admin Role IDs (Comma separated roles that can view tickets):
        <input 
          type="text" 
          name="adminRoleIds" 
          value={formData.adminRoleIds} 
          onChange={handleChange} 
          className="form-input" 
          placeholder="e.g. 1111111111, 2222222222" 
        />
      </label>

      <button type="submit" className="btn" disabled={loading} style={{ marginTop: '1rem' }}>
        {loading ? "Saving..." : "Save Configuration"}
      </button>
    </form>
  );
}
