export default function DownloadWatermark() {
  return (
    <div
      data-download-only
      className="absolute top-4 left-4 z-50 hidden rounded-[13px] bg-white p-2"
    >
      {/* biome-ignore lint/performance/noImgElement: html-to-image requires plain <img> for reliable capture */}
      <img src="/logo.svg" alt="" width={126} height={37} />
    </div>
  );
}
