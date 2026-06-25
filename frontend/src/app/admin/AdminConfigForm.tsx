"use client";

import { useState, useEffect } from "react";

export default function AdminConfigForm({ initialConfig, clientId }: { initialConfig: any, clientId: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [discordData, setDiscordData] = useState<{ textChannels: any[], categories: any[], roles: any[] } | null>(null);
  
  const [formData, setFormData] = useState({
    guildId: initialConfig.guildId || "",
    applyChannelId: initialConfig.applyChannelId || "",
    ticketCategoryId: initialConfig.ticketCategoryId || "",
    adminRoleIds: initialConfig.adminRoleIds || "",
  });

  const fetchDiscordData = async (guildId: string) => {
    if (!guildId) return;
    try {
      const res = await fetch(`/api/admin/discord-data?guildId=${guildId}`);
      if (res.ok) {
        const data = await res.json();
        setDiscordData(data);
      } else {
        setDiscordData(null);
      }
    } catch (err) {
      setDiscordData(null);
    }
  };

  useEffect(() => {
    if (formData.guildId && formData.guildId.length >= 17) {
      fetchDiscordData(formData.guildId);
    }
  }, [formData.guildId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleToggle = (roleId: string) => {
    const currentRoles = formData.adminRoleIds ? formData.adminRoleIds.split(',').map((id:string) => id.trim()) : [];
    if (currentRoles.includes(roleId)) {
      setFormData({ ...formData, adminRoleIds: currentRoles.filter((id:string) => id !== roleId).join(',') });
    } else {
      setFormData({ ...formData, adminRoleIds: [...currentRoles, roleId].join(',') });
    }
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

  const inviteLink = `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot`;

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      <div style={{ padding: '1.5rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', textAlign: 'center', border: '1px dashed var(--accent-green)' }}>
        <h3 style={{ marginTop: 0, color: 'var(--accent-green)' }}>Bot Integration</h3>
        <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>
          To make the dropdowns below work, you must invite the bot to your server first.
        </p>
        <a href={inviteLink} target="_blank" rel="noreferrer" className="btn" style={{ display: 'inline-block', backgroundColor: '#5865F2' }}>
          Invite Bot to Server
        </a>
      </div>

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
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Enter this first to load channels below.</span>
      </label>

      {discordData ? (
        <>
          <label>
            Applications Channel (Where bot sends new forms):
            <select name="applyChannelId" value={formData.applyChannelId} onChange={handleChange} className="form-input">
              <option value="">Select a text channel...</option>
              {discordData.textChannels.map((c) => (
                <option key={c.id} value={c.id}>#{c.name}</option>
              ))}
            </select>
          </label>

          <label>
            Ticket Category (Where bot creates interview channels):
            <select name="ticketCategoryId" value={formData.ticketCategoryId} onChange={handleChange} className="form-input">
              <option value="">Select a category...</option>
              {discordData.categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>

          <label>
            Admin Roles (Who can view and accept tickets):
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem', maxHeight: '200px', overflowY: 'auto', padding: '1rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
              {discordData.roles.map((r) => {
                // Ignore @everyone role which usually matches guildId
                if (r.id === formData.guildId) return null;
                const isSelected = formData.adminRoleIds.includes(r.id);
                return (
                  <label key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', margin: 0 }}>
                    <input 
                      type="checkbox" 
                      checked={isSelected} 
                      onChange={() => handleRoleToggle(r.id)} 
                    />
                    <span style={{ color: r.color ? `#${r.color.toString(16).padStart(6, '0')}` : 'inherit' }}>
                      {r.name}
                    </span>
                  </label>
                );
              })}
            </div>
          </label>
        </>
      ) : (
        <div style={{ opacity: 0.5 }}>
          <p style={{ color: 'var(--accent-green)', fontSize: '0.9rem' }}>Loading Discord data... Please ensure the Bot Token is set and the Guild ID is correct.</p>
        </div>
      )}

      <button type="submit" className="btn" disabled={loading} style={{ marginTop: '1rem' }}>
        {loading ? "Saving..." : "Save Configuration"}
      </button>
    </form>
  );
}
