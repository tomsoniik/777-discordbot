"use client";

import { useState } from "react";

export default function ApplyForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    nickname: "",
    age: "",
    hours: "",
    role: "pvp",
    mic: "yes",
    reason: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nickname || !formData.age || !formData.hours || !formData.reason) {
      setMessage("Please fill out all fields.");
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
        setMessage("Success! Your application has been submitted.");
        setFormData({
          nickname: "",
          age: "",
          hours: "",
          role: "pvp",
          mic: "yes",
          reason: "",
        });
      } else {
        const data = await res.json();
        setMessage(data.error || "Failed to submit application.");
      }
    } catch (err) {
      setMessage("An error occurred while submitting.");
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
      {message && (
        <div style={{ padding: '1rem', backgroundColor: message.includes("Success") ? 'rgba(0,255,0,0.1)' : 'rgba(255,0,0,0.1)', color: message.includes("Success") ? 'var(--accent-green)' : 'red', borderRadius: '4px', textAlign: 'center' }}>
          {message}
        </div>
      )}

      <label>
        Name / Nickname:
        <input type="text" name="nickname" value={formData.nickname} onChange={handleChange} className="form-input" placeholder="Enter your nickname..." />
      </label>

      <label>
        Age:
        <input type="number" name="age" value={formData.age} onChange={handleChange} className="form-input" placeholder="18" />
      </label>

      <label>
        Unturned Hours (Approx):
        <input type="number" name="hours" value={formData.hours} onChange={handleChange} className="form-input" placeholder="e.g. 1500" />
      </label>

      <label>
        Preferred Role:
        <select name="role" value={formData.role} onChange={handleChange} className="form-input">
          <option value="pvp">PvP / Shooter</option>
          <option value="builder">Builder / Base Manager</option>
          <option value="farmer">Farmer / Resource Gatherer</option>
          <option value="pilot">Pilot / Driver</option>
        </select>
      </label>

      <label>
        Do you have a working microphone?
        <select name="mic" value={formData.mic} onChange={handleChange} className="form-input">
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </label>

      <label>
        Why do you want to join?
        <textarea rows={4} name="reason" value={formData.reason} onChange={handleChange} className="form-input" placeholder="Tell us a bit about your playstyle, previous clans, etc..."></textarea>
      </label>

      <button type="submit" className="btn" disabled={loading} style={{ marginTop: '1rem' }}>
        {loading ? "Submitting..." : "Submit Form"}
      </button>
    </form>
  );
}
