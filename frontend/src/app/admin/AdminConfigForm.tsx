"use client";

import { useState, useEffect } from "react";
import { Link21, DocumentText, MessageAdd, MessageRemove, SecuritySafe, Save2, Warning2 } from "iconsax-react";
import GlassSelect from "@/components/GlassSelect";

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
        setMessage("Configuration saved successfully.");
      } else {
        setMessage("Failed to save configuration.");
      }
    } catch (err) {
      setMessage("An error occurred while saving.");
    }

    setLoading(false);
    setTimeout(() => setMessage(""), 5000);
  };

  const inviteLink = `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot`;

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    margin: '0 0 1.5rem 0',
    color: '#fff',
    fontSize: '1.25rem',
    fontWeight: 600,
    letterSpacing: '0.5px'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.9rem',
    color: '#8ebf9e',
    fontWeight: 600,
    marginBottom: '0.25rem',
    marginTop: '1.5rem'
  };

  return (
    <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
      
      {!discordData && (
        <div style={{ 
          marginBottom: '2rem', 
          padding: '2rem', 
          background: 'rgba(88, 101, 242, 0.1)', 
          border: '1px solid rgba(88, 101, 242, 0.3)',
          borderRadius: '24px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          backdropFilter: 'blur(10px)'
        }}>
          <div>
            <h3 style={{ margin: 0, color: '#fff', fontSize: '1.4rem' }}>Bot Integration Required</h3>
            <p style={{ margin: '0.5rem 0 0 0', color: '#a0a5db' }}>Connect the Discord application to your server to populate configuration fields.</p>
          </div>
          <a href={inviteLink} target="_blank" rel="noreferrer" style={{
            background: '#5865F2', color: '#fff', padding: '1rem 2rem', borderRadius: '12px', fontWeight: 600, textDecoration: 'none', transition: 'all 0.3s ease'
          }}>
            Authorize Bot
          </a>
        </div>
      )}

      {message && (
        <div style={{ 
          padding: '1.25rem 2rem', 
          marginBottom: '2rem',
          background: message.includes("success") ? 'rgba(46, 204, 113, 0.1)' : 'rgba(255, 60, 60, 0.1)', 
          color: message.includes("success") ? '#2ecc71' : '#ff3c3c', 
          borderRadius: '16px', 
          border: `1px solid ${message.includes("success") ? 'rgba(46, 204, 113, 0.3)' : 'rgba(255, 60, 60, 0.3)'}`,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          {message.includes("success") ? <Save2 size="24" /> : <Warning2 size="24" />}
          {message}
        </div>
      )}

      <div className="bento-grid">
        
        {/* Core Setup */}
        <div className="bento-card col-span-4" style={{ padding: '2rem 2.5rem' }}>
          <h4 style={headerStyle}><Link21 size="24" color="#2ecc71" variant="Bulk" /> Network Identity</h4>
          <label style={{ ...labelStyle, marginTop: 0 }}>
            Discord Server ID (Guild ID)
            <input 
              type="text" 
              name="guildId" 
              value={formData.guildId} 
              onChange={handleChange} 
              className="glass-input" 
              placeholder="Enter numerical ID" 
            />
          </label>
        </div>

        {discordData ? (
          <>
            {/* Recruitment & Tickets */}
            <div className="bento-card col-span-2 row-span-2">
              <h4 style={headerStyle}><DocumentText size="24" color="#2ecc71" variant="Bulk" /> Recruitment Pipelines</h4>
              
              <div style={{ ...labelStyle, marginTop: 0 }}>
                Applications Channel
                <GlassSelect 
                  value={formData.applyChannelId}
                  onChange={(val) => setFormData({...formData, applyChannelId: val})}
                  placeholder="Disabled / Not selected"
                  options={[
                    { value: "", label: "Disabled" },
                    ...discordData.textChannels.map(c => ({ value: c.id, label: `# ${c.name}` }))
                  ]}
                />
              </div>

              <div style={labelStyle}>
                Ticket Category
                <GlassSelect 
                  value={formData.ticketCategoryId}
                  onChange={(val) => setFormData({...formData, ticketCategoryId: val})}
                  placeholder="Disabled / Not selected"
                  options={[
                    { value: "", label: "Disabled" },
                    ...discordData.categories.map(c => ({ value: c.id, label: c.name }))
                  ]}
                />
              </div>

              <div style={labelStyle}>
                Administrative Roles
                <div style={{ 
                  display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem', 
                  maxHeight: '220px', overflowY: 'auto', padding: '1rem', 
                  backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' 
                }}>
                  {discordData.roles.map((r) => {
                    if (r.id === formData.guildId) return null;
                    const isSelected = formData.adminRoleIds.includes(r.id);
                    const roleColor = r.color ? `#${r.color.toString(16).padStart(6, '0')}` : '#8ebf9e';
                    
                    return (
                      <div 
                        key={r.id} 
                        onClick={() => handleRoleToggle(r.id)}
                        style={{ 
                          display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', 
                          padding: '0.5rem 1rem', borderRadius: '20px',
                          backgroundColor: isSelected ? 'rgba(46, 204, 113, 0.15)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${isSelected ? '#2ecc71' : 'rgba(255,255,255,0.1)'}`,
                          transition: 'all 0.2s ease',
                          color: isSelected ? '#fff' : '#8ebf9e'
                        }}
                        className="role-pill"
                      >
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: roleColor, boxShadow: `0 0 5px ${roleColor}` }}></div>
                        <span style={{ fontSize: '0.85rem', fontWeight: isSelected ? 600 : 400 }}>
                          {r.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Welcome System */}
            <div className="bento-card col-span-2 row-span-1">
              <h4 style={headerStyle}><MessageAdd size="24" color="#2ecc71" variant="Bulk" /> Inbound Architecture</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div style={{ ...labelStyle, marginTop: 0 }}>
                  Auto Role Designation
                  <GlassSelect 
                    value={formData.autoRoleId}
                    onChange={(val) => setFormData({...formData, autoRoleId: val})}
                    placeholder="Disabled"
                    options={[
                      { value: "", label: "Disabled" },
                      ...discordData.roles.filter(r => r.id !== formData.guildId).map(r => ({ value: r.id, label: r.name }))
                    ]}
                  />
                </div>

                <div style={{ ...labelStyle, marginTop: 0 }}>
                  Welcome Channel
                  <GlassSelect 
                    value={formData.welcomeChannelId}
                    onChange={(val) => setFormData({...formData, welcomeChannelId: val})}
                    placeholder="Disabled"
                    options={[
                      { value: "", label: "Disabled" },
                      ...discordData.textChannels.map(c => ({ value: c.id, label: `# ${c.name}` }))
                    ]}
                  />
                </div>
              </div>

              <label style={labelStyle}>
                Welcome Template
                <textarea 
                  name="welcomeMessage" 
                  value={formData.welcomeMessage} 
                  onChange={handleChange} 
                  className="glass-input" 
                  placeholder="Welcome {user} to {server}!" 
                  style={{ minHeight: '80px', resize: 'vertical' }}
                />
              </label>
            </div>

            {/* Leave System */}
            <div className="bento-card col-span-2 row-span-1">
              <h4 style={headerStyle}><MessageRemove size="24" color="#2ecc71" variant="Bulk" /> Outbound Architecture</h4>
              
              <div style={{ ...labelStyle, marginTop: 0 }}>
                Departure Channel
                <GlassSelect 
                  value={formData.leaveChannelId}
                  onChange={(val) => setFormData({...formData, leaveChannelId: val})}
                  placeholder="Disabled"
                  options={[
                    { value: "", label: "Disabled" },
                    ...discordData.textChannels.map(c => ({ value: c.id, label: `# ${c.name}` }))
                  ]}
                />
              </div>

              <label style={labelStyle}>
                Departure Template
                <textarea 
                  name="leaveMessage" 
                  value={formData.leaveMessage} 
                  onChange={handleChange} 
                  className="glass-input" 
                  placeholder="{user} has left the server." 
                  style={{ minHeight: '80px', resize: 'vertical' }}
                />
              </label>
            </div>

            {/* Advanced & Logging */}
            <div className="bento-card col-span-4" style={{ padding: '2rem 2.5rem' }}>
              <h4 style={headerStyle}><SecuritySafe size="24" color="#2ecc71" variant="Bulk" /> Security & Logging</h4>
              <div style={{ ...labelStyle, marginTop: 0 }}>
                Audit Log Channel
                <GlassSelect 
                  value={formData.logChannelId}
                  onChange={(val) => setFormData({...formData, logChannelId: val})}
                  placeholder="Disabled"
                  options={[
                    { value: "", label: "Disabled" },
                    ...discordData.textChannels.map(c => ({ value: c.id, label: `# ${c.name}` }))
                  ]}
                />
                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', display: 'block', marginTop: '0.5rem', textTransform: 'none', letterSpacing: 'normal' }}>Requires advanced bot permissions to stream security logs.</span>
              </div>
            </div>
          </>
        ) : (
          <div className="bento-card col-span-4" style={{ alignItems: 'center', justifyContent: 'center', minHeight: '200px', gridColumn: '1 / -1' }}>
            <p style={{ color: '#2ecc71', fontSize: '1.25rem', fontWeight: 600, margin: 0, opacity: 0.8 }}>Awaiting Network Connection...</p>
            <p style={{ color: '#8ebf9e', fontSize: '0.95rem', margin: '0.5rem 0 0 0' }}>Provide a valid Guild ID to access configuration modules.</p>
          </div>
        )}

      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem', paddingBottom: '2rem' }}>
        <button type="submit" className="btn-cinematic" disabled={loading || !formData.guildId}>
          <Save2 size="24" color={loading || !formData.guildId ? 'rgba(255,255,255,0.3)' : '#050c08'} variant="Bulk" />
          {loading ? "Synchronizing..." : "Initialize Configuration"}
        </button>
      </div>
    </form>
  );
}
