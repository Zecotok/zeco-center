This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Video Recording Module

This application includes a comprehensive video recording module with the following features:

- Screen recording with adjustable quality settings (480p to 2K)
- Camera recording option
- Audio recording option
- Pause and resume recording functionality
- Video storage in the `uploads` directory
- Video browsing, searching, and playback
- Video metadata management (title, description, etc.)
- Full-featured video player with custom controls

To use the video recording functionality:

1. Navigate to the `/videos` page
2. Click "Record New Video" to start recording
3. Configure recording options (quality, audio, screen/camera)
4. Record your video
5. Save with a title and optional description
6. Browse, play, edit, or delete your recorded videos

The video module uses the browser's MediaRecorder API for capturing screen content, and stores videos in WebM format for optimal compatibility.
