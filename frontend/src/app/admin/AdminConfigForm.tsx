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
    welcomeChannelId: initialConfig.welcomeChannelId || "",
    welcomeMessage: initialConfig.welcomeMessage || "",
    leaveChannelId: initialConfig.leaveChannelId || "",
    leaveMessage: initialConfig.leaveMessage || "",
    autoRoleId: initialConfig.autoRoleId || "",
    logChannelId: initialConfig.logChannelId || "",
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

  const cardStyle = {
    backgroundColor: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  };

  const cardTitleStyle = {
    marginTop: 0,
    marginBottom: '0.5rem',
    color: 'var(--accent-green)',
    fontSize: '1.2rem',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    paddingBottom: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* HEADER SECTION */}
      <div style={{ padding: '1.5rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '10px', textAlign: 'center', border: '1px dashed var(--accent-green)' }}>
        <h3 style={{ marginTop: 0, color: 'var(--accent-green)' }}>Bot Integration</h3>
        <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>
          To make the dropdowns below work, you must invite the bot to your server first.
        </p>
        <a href={inviteLink} target="_blank" rel="noreferrer" className="btn" style={{ display: 'inline-block', backgroundColor: '#5865F2' }}>
          Invite Bot to Server
        </a>
      </div>

      {message && (
        <div style={{ padding: '1rem', backgroundColor: message.includes("success") ? 'rgba(0,255,0,0.1)' : 'rgba(255,0,0,0.1)', color: message.includes("success") ? 'var(--accent-green)' : 'red', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold' }}>
          {message}
        </div>
      )}

      {/* GRID CONTAINER */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        {/* CARD 1: Core Setup */}
        <div style={cardStyle}>
          <h4 style={cardTitleStyle}>🔌 Core Setup</h4>
          <label>
            Discord Server ID (Guild ID):
            <input 
              type="text" 
              name="guildId" 
              value={formData.guildId} 
              onChange={handleChange} 
              className="form-input" 
              placeholder="e.g. 123456789012345678" 
              style={{ marginTop: '0.5rem' }}
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>Enter this first to load channels.</span>
          </label>
        </div>

        {discordData ? (
          <>
            {/* CARD 2: Recruitment & Tickets */}
            <div style={cardStyle}>
              <h4 style={cardTitleStyle}>📝 Recruitment & Tickets</h4>
              <label>
                Applications Channel:
                <select name="applyChannelId" value={formData.applyChannelId} onChange={handleChange} className="form-input" style={{ marginTop: '0.5rem' }}>
                  <option value="">Select a text channel...</option>
                  {discordData.textChannels.map((c) => (
                    <option key={c.id} value={c.id}>#{c.name}</option>
                  ))}
                </select>
              </label>

              <label>
                Ticket Category:
                <select name="ticketCategoryId" value={formData.ticketCategoryId} onChange={handleChange} className="form-input" style={{ marginTop: '0.5rem' }}>
                  <option value="">Select a category...</option>
                  {discordData.categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>

              <label>
                Admin Roles:
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem', maxHeight: '150px', overflowY: 'auto', padding: '0.75rem', backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                  {discordData.roles.map((r) => {
                    if (r.id === formData.guildId) return null;
                    const isSelected = formData.adminRoleIds.includes(r.id);
                    return (
                      <label key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', margin: 0, fontSize: '0.9rem' }}>
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
            </div>

            {/* CARD 3: Welcome System */}
            <div style={cardStyle}>
              <h4 style={cardTitleStyle}>👋 Welcome System</h4>
              <label>
                Auto Role on Join:
                <select name="autoRoleId" value={formData.autoRoleId} onChange={handleChange} className="form-input" style={{ marginTop: '0.5rem' }}>
                  <option value="">Disabled / Select a role...</option>
                  {discordData.roles.map((r) => {
                    if (r.id === formData.guildId) return null;
                    return (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    );
                  })}
                </select>
              </label>

              <label>
                Welcome Channel:
                <select name="welcomeChannelId" value={formData.welcomeChannelId} onChange={handleChange} className="form-input" style={{ marginTop: '0.5rem' }}>
                  <option value="">Disabled / Select a channel...</option>
                  {discordData.textChannels.map((c) => (
                    <option key={c.id} value={c.id}>#{c.name}</option>
                  ))}
                </select>
              </label>

              <label>
                Welcome Message:
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Use {"{user}"} and {"{server}"} variables</span>
                <textarea 
                  name="welcomeMessage" 
                  value={formData.welcomeMessage} 
                  onChange={handleChange} 
                  className="form-input" 
                  placeholder="Welcome {user} to {server}!" 
                  style={{ minHeight: '80px', resize: 'vertical' }}
                />
              </label>
            </div>

            {/* CARD 4: Leave System */}
            <div style={cardStyle}>
              <h4 style={cardTitleStyle}>🚪 Leave System</h4>
              <label>
                Leave Channel:
                <select name="leaveChannelId" value={formData.leaveChannelId} onChange={handleChange} className="form-input" style={{ marginTop: '0.5rem' }}>
                  <option value="">Disabled / Select a channel...</option>
                  {discordData.textChannels.map((c) => (
                    <option key={c.id} value={c.id}>#{c.name}</option>
                  ))}
                </select>
              </label>

              <label>
                Leave Message:
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Use {"{user}"} and {"{server}"} variables</span>
                <textarea 
                  name="leaveMessage" 
                  value={formData.leaveMessage} 
                  onChange={handleChange} 
                  className="form-input" 
                  placeholder="{user} has left the server." 
                  style={{ minHeight: '80px', resize: 'vertical' }}
                />
              </label>
            </div>

            {/* CARD 5: Advanced & Logging */}
            <div style={cardStyle}>
              <h4 style={cardTitleStyle}>⚙️ Advanced / Logs</h4>
              <label>
                Action Log Channel:
                <select name="logChannelId" value={formData.logChannelId} onChange={handleChange} className="form-input" style={{ marginTop: '0.5rem' }}>
                  <option value="">Disabled / Select a channel...</option>
                  {discordData.textChannels.map((c) => (
                    <option key={c.id} value={c.id}>#{c.name}</option>
                  ))}
                </select>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>Used for mod actions and ticket history.</span>
              </label>
            </div>
          </>
        ) : (
          <div style={{ ...cardStyle, gridColumn: '1 / -1', opacity: 0.7, alignItems: 'center', justifyContent: 'center', minHeight: '150px' }}>
            <p style={{ color: 'var(--accent-green)', fontSize: '1.1rem', margin: 0 }}>⏳ Loading Discord data...</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Please ensure the Bot Token is set and the Guild ID is correct.</p>
          </div>
        )}

      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
        <button type="submit" className="btn" disabled={loading} style={{ padding: '0.75rem 2rem', fontSize: '1.1rem' }}>
          {loading ? "Saving..." : "Save Configuration"}
        </button>
      </div>
    </form>
  );
}
