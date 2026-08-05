"use client";

import React from 'react';
import { useAppStore } from '@/store/useAppStore';

export default function Notifications() {
  const { notifications, removeNotification } = useAppStore();

  if (notifications.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      zIndex: 9999,
    }}>
      {notifications.map((notif) => {
        let bgColor = '#11331e';
        let borderColor = '#2ecc71';

        if (notif.type === 'error') {
          bgColor = '#331111';
          borderColor = '#ff4757';
        } else if (notif.type === 'info') {
          bgColor = '#112233';
          borderColor = '#3498db';
        }

        return (
          <div
            key={notif.id}
            onClick={() => removeNotification(notif.id)}
            style={{
              background: bgColor,
              borderLeft: `4px solid ${borderColor}`,
              color: '#fff',
              padding: '12px 20px',
              borderRadius: '6px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              cursor: 'pointer',
              minWidth: '250px',
              backdropFilter: 'blur(10px)',
              animation: 'fadeInUp 0.3s ease-out forwards',
            }}
          >
            {notif.message}
          </div>
        );
      })}
    </div>
  );
}
