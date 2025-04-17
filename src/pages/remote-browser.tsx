import type { NextPage } from 'next';
import Head from 'next/head';
import dynamic from 'next/dynamic';

// Use dynamic import with SSR disabled for the RemoteBrowser component
// This is necessary because socket.io client should only run on the client side
const RemoteBrowser = dynamic(
  () => import('../components/RemoteBrowser'),
  { ssr: false }
);

const RemoteBrowserPage: NextPage = () => {
  return (
    <div>
      <Head>
        <title>Remote Browser Control</title>
        <meta name="description" content="Control a headless browser remotely" />
      </Head>

      <main className="container mx-auto py-6">
        <RemoteBrowser />
      </main>
    </div>
  );
};

export default RemoteBrowserPage; 