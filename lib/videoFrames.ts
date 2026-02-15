/**
 * Extracts one frame per second from a video Blob.
 * Returns an array of JPEG Blobs (frame at 0s, 1s, 2s, ...).
 * For WebM from MediaRecorder, video.duration is often 0 until more data loads;
 * pass fallbackDurationSeconds (e.g. from the recorder timer) to fix extraction.
 */
export function extractFramesOnePerSecond(
  videoBlob: Blob,
  fallbackDurationSeconds?: number
): Promise<Blob[]> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(videoBlob);
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      let durationSec = Math.floor(video.duration);
      if (!Number.isFinite(durationSec) || durationSec <= 0) {
        const fallback = fallbackDurationSeconds != null ? Math.floor(fallbackDurationSeconds) : 0;
        if (fallback > 0) durationSec = fallback;
        else {
          URL.revokeObjectURL(url);
          resolve([]);
          return;
        }
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Canvas 2d context not available"));
        return;
      }

      const frames: Blob[] = [];
      let currentSec = 0;

      video.onseeked = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (blob) frames.push(blob);
            currentSec += 1;
            if (currentSec <= durationSec) {
              video.currentTime = currentSec;
            } else {
              URL.revokeObjectURL(url);
              resolve(frames);
            }
          },
          "image/jpeg",
          0.85
        );
      };

        video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Video failed to load"));
      };

      video.currentTime = 0;
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Video failed to load"));
    };

    video.src = url;
    video.load();
  });
}
