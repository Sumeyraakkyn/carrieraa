import React from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="stylesheet" href="/styles/yonetici-panel.css" />
      <link rel="stylesheet" href="/styles/admin-sidebar.css" />
      <link rel="stylesheet" href="/styles/yonetici-ilerleme.css" />
      <link rel="stylesheet" href="/styles/yonetici-yetkinlik.css" />
      {children}
    </>
  );
}
