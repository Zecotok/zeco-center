import React from 'react';

export const metadata = {
  title: 'Video Recording & Management',
  description: 'Record, manage, and play videos',
};

export default function VideosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <section>
      {children}
    </section>
  );
} 