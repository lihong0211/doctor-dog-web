const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260613_180732_a54afbf6-b30d-470e-861f-669871f09f67.mp4'

export function BackgroundVideo() {
  return (
    <video
      className="absolute inset-0 h-full w-full object-cover"
      src={VIDEO_URL}
      autoPlay
      muted
      loop
      playsInline
    />
  )
}
