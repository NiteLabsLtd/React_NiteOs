import { useState, useEffect, useRef } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Rnd } from "react-rnd";

// ---------------------------
// Constants (adjust these as needed)
// ---------------------------
const TIMELINE_WIDTH = 1000;
const TIMELINE_DURATION = 120; // seconds
const TIME_INTERVAL = 50; // ms for playhead updates
const ROW_HEIGHT = 40;
const MAX_ROWS = 2;
const INITIAL_X = 40;
const INITIAL_Y = 20;
const MIN_VIDEO_WIDTH = 150;
const VIDEO_MARGIN = 5;

// ---------------------------
// Helper: Clamp candidate X based on left/right neighbors.
// ---------------------------
function clampX(candidateX, current, sameRow) {
  let leftBoundary = INITIAL_X;
  let rightBoundary = TIMELINE_WIDTH - current.width;

  if (sameRow.length > 0) {
    // Find the nearest video on the left
    const leftCandidates = sameRow.filter(v => v.x < candidateX);
    if (leftCandidates.length > 0) {
      const leftNeighbor = leftCandidates.reduce((prev, cur) =>
        cur.x > prev.x ? cur : prev
      );
      leftBoundary = leftNeighbor.x + leftNeighbor.width + VIDEO_MARGIN;
    }
    // Find the nearest video on the right
    const rightCandidates = sameRow.filter(v => v.x > candidateX);
    if (rightCandidates.length > 0) {
      const rightNeighbor = rightCandidates.reduce((prev, cur) =>
        cur.x < prev.x ? cur : prev
      );
      rightBoundary = rightNeighbor.x - current.width - VIDEO_MARGIN;
    }
  }
  // If there is no valid space, return the original x.
  if (leftBoundary > rightBoundary) return current.x;
  return Math.min(Math.max(candidateX, leftBoundary), rightBoundary);
}

// ---------------------------
// Helper: Clamp new width when resizing from left
// (Ensuring the resized video doesn’t invade the left neighbor’s space.)
// ---------------------------
function clampResize(newX, current, sameRow) {
  let minX = INITIAL_X;
  if (sameRow.length > 0) {
    const leftCandidates = sameRow.filter(v => v.x < current.x);
    if (leftCandidates.length > 0) {
      const leftNeighbor = leftCandidates.reduce((prev, cur) =>
        cur.x > prev.x ? cur : prev
      );
      minX = leftNeighbor.x + leftNeighbor.width + VIDEO_MARGIN;
    }
  }
  // Ensure newX is not less than the allowed minimum.
  return Math.max(newX, minX);
}

// ---------------------------
// Timeline Component
// ---------------------------
export default function Timeline({ timelineVideos, setTimelineVideos }) {
  const { setNodeRef } = useDroppable({ id: "timeline" });
  const scrollContainerRef = useRef(null);

  const [playheadPosition, setPlayheadPosition] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isPanelDragging, setIsPanelDragging] = useState(false);

  // ---------------------------
  // Playhead update
  // ---------------------------
  useEffect(() => {
    if (!isPlaying) return;
    const intervalId = setInterval(() => {
      setElapsedTime(prev => {
        const newElapsed = prev + TIME_INTERVAL / 1000;
        setPlayheadPosition((newElapsed / TIMELINE_DURATION) * TIMELINE_WIDTH);
        return newElapsed;
      });
    }, TIME_INTERVAL);
    return () => clearInterval(intervalId);
  }, [isPlaying]);

  // ---------------------------
  // Delete selected video on "Delete" key
  // ---------------------------
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Delete" && selectedVideo) {
        setTimelineVideos(prev => prev.filter(video => video.name !== selectedVideo));
        setSelectedVideo(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedVideo, setTimelineVideos]);

  // ---------------------------
  // Format time as HH:MM:SS:MS
  // ---------------------------
  const formatTime = (seconds) => {
    const hrs = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const secs = String(Math.floor(seconds % 60)).padStart(2, "0");
    const ms = String(Math.floor((seconds % 1) * 100)).padStart(2, "0");
    return `${hrs}:${mins}:${secs}:${ms}`;
  };

  // ---------------------------
  // Handle dropping a new video onto the timeline.
  // This calculates (a) which row to use and (b) an X position that does not overlap.
  // ---------------------------
  const handleDrop = (e) => {
    e.preventDefault();
    const videoName = e.dataTransfer.getData("text");
    if (!videoName) return;
    if (!scrollContainerRef.current) return;

    const containerRect = scrollContainerRef.current.getBoundingClientRect();
    const dropX = e.clientX - containerRect.left;
    const dropY = e.clientY - containerRect.top;

    // Decide row based on dropY.
    let rowIndex = Math.floor((dropY - INITIAL_Y) / ROW_HEIGHT);
    if (rowIndex < 0) rowIndex = 0;
    if (rowIndex >= MAX_ROWS) rowIndex = MAX_ROWS - 1;
    const rowY = INITIAL_Y + rowIndex * ROW_HEIGHT;

    setTimelineVideos(prev => {
      // Get videos already in this row, sorted by x.
      const rowVideos = prev
        .filter(video => video.y === rowY)
        .sort((a, b) => a.x - b.x);
      let newX;
      if (rowVideos.length === 0) {
        newX = Math.max(INITIAL_X, Math.min(dropX, TIMELINE_WIDTH - MIN_VIDEO_WIDTH));
      } else {
        // If drop occurs before the first video, try that position.
        const firstVideo = rowVideos[0];
        if (dropX + MIN_VIDEO_WIDTH <= firstVideo.x - VIDEO_MARGIN && dropX >= INITIAL_X) {
          newX = dropX;
        } else {
          // Otherwise, find a gap or place at the end.
          let gapFound = false;
          for (let i = 0; i < rowVideos.length - 1; i++) {
            const gapStart = rowVideos[i].x + rowVideos[i].width + VIDEO_MARGIN;
            const gapEnd = rowVideos[i + 1].x - VIDEO_MARGIN;
            if (gapEnd - gapStart >= MIN_VIDEO_WIDTH && dropX >= gapStart && dropX + MIN_VIDEO_WIDTH <= gapEnd) {
              newX = dropX;
              gapFound = true;
              break;
            }
          }
          if (!gapFound) {
            const lastVideo = rowVideos[rowVideos.length - 1];
            newX = lastVideo.x + lastVideo.width + VIDEO_MARGIN;
          }
        }
      }
      if (newX + MIN_VIDEO_WIDTH > TIMELINE_WIDTH) {
        alert("No more space in this row of the timeline!");
        return prev;
      }
      return [...prev, { name: videoName, x: newX, y: rowY, width: MIN_VIDEO_WIDTH }];
    });
  };

  // ---------------------------
  // When dragging, update the video’s position in real time.
  // (If you experience performance issues, you can remove onDrag and update only onDragStop.)
  // ---------------------------
  const handleDrag = (index, d) => {
    setTimelineVideos(prev => {
      const videos = [...prev];
      videos[index] = { ...videos[index], x: d.x };
      return videos;
    });
  };

  // ---------------------------
  // On drag stop, “snap” the video’s X position so it does not overlap neighbors.
  // ---------------------------
  const handleDragStop = (index, d) => {
    setTimelineVideos(prev => {
      const videos = [...prev];
      const current = { ...videos[index] };
      const candidateX = d.x;
      // Get other videos in the same row.
      const sameRow = videos.filter((v, i) => v.y === current.y && i !== index);
      const newX = clampX(candidateX, current, sameRow);
      current.x = newX;
      videos[index] = current;
      return videos;
    });
  };

  // ---------------------------
  // On resize stop, update the video’s width and (if resizing from the left) its X position.
  // ---------------------------
  const handleResizeStop = (index, direction, ref, delta, position) => {
    setTimelineVideos(prev => {
      const videos = [...prev];
      const current = { ...videos[index] };
      let newX = current.x;
      let newWidth = ref.offsetWidth;
      if (direction === "left") {
        // When resizing from left, update X and recalc width.
        newX = clampResize(position.x, current, videos.filter((v, i) => v.y === current.y && i !== index));
        newWidth = (current.x + current.width) - newX;
      } else if (direction === "right") {
        // When resizing from right, ensure we do not overlap the right neighbor.
        const sameRow = videos.filter((v, i) => v.y === current.y && i !== index);
        // Compute a right boundary similar to our clampX logic.
        let rightBoundary = TIMELINE_WIDTH;
        if (sameRow.length > 0) {
          const rightCandidates = sameRow.filter(v => v.x > current.x);
          if (rightCandidates.length > 0) {
            const rightNeighbor = rightCandidates.reduce((prev, cur) =>
              cur.x < prev.x ? cur : prev
            );
            rightBoundary = rightNeighbor.x - VIDEO_MARGIN;
          }
        }
        newWidth = Math.min(newWidth, rightBoundary - current.x);
      }
      newWidth = Math.max(newWidth, MIN_VIDEO_WIDTH);
      current.x = newX;
      current.width = newWidth;
      videos[index] = current;
      return videos;
    });
  };

  // ---------------------------
  // Render
  // ---------------------------
  return (
    // Outer Rnd lets the entire timeline panel be dragged.
    <Rnd
      default={{ x: 100, y: 100 }}
      bounds="window"
      dragHandleClassName="drag-handle" // The panel is moved only when dragging the header.
      onDragStart={() => setIsPanelDragging(true)}
      onDragStop={() => setIsPanelDragging(false)}
    >
      <div
        ref={setNodeRef}
        className="relative bg-white p-4 w-3/4 h-80 border-t flex flex-col justify-between overflow-hidden mx-auto"
        onDrop={handleDrop}
        onDragStart={(e) => e.dataTransfer.setData("videoName", e.target.id)}
        onDragOver={(e) => e.preventDefault()}
      >
        {/* Header (drag handle for the panel) */}
        <div
          className={`drag-handle cursor-move p-2 text-center font-bold ${isPanelDragging ? "bg-black text-white" : "bg-gray-200"}`}
        >
          Timeline Panel
        </div>

        {/* Timer Display */}
        <div className="text-center text-lg font-bold text-gray-700 mb-2">
          Time Elapsed: {formatTime(elapsedTime)}
        </div>

        {/* Timeline container (the “white area”) */}
        <div
          className="relative flex-1 overflow-x-auto overflow-y-hidden"
          ref={scrollContainerRef}
          style={{ whiteSpace: "nowrap" }}
        >
          {/* Time Ruler */}
          <div
            className="absolute top-0 left-0 h-6 bg-gray-400 flex text-black text-xs p-1"
            style={{ width: `${TIMELINE_WIDTH}px` }}
          >
            {[...Array(13)].map((_, i) => (
              <div key={i} className="w-80 text-center border-r border-gray-600">
                {i === 0
                  ? "0s"
                  : i < 6
                  ? `${i * 10}s`
                  : `${Math.floor(i / 6)}m ${i % 6 * 10}s`}
              </div>
            ))}
          </div>

          {/* Playhead */}
          <div
            className="absolute top-6 bottom-6 w-1 bg-orange-500 cursor-pointer"
            style={{ left: `${playheadPosition}px` }}
          />

          {/* Timeline Videos */}
          <div className="mt-6 relative h-full" style={{ width: `${TIMELINE_WIDTH}px` }}>
            {timelineVideos.map((video, index) => (
              <Rnd
                key={`${video.name}-${index}`}
                position={{ x: video.x, y: video.y }}
                size={{ width: video.width, height: 30 }}
                bounds="parent"
                dragAxis="x"
                enableResizing={{ left: true, right: true }}
                onDrag={(e, d) => handleDrag(index, d)}
                onDragStop={(e, d) => handleDragStop(index, d)}
                onResizeStop={(e, direction, ref, delta, position) =>
                  handleResizeStop(index, direction, ref, delta, position)
                }
                onClick={() => setSelectedVideo(video.name)}
                className={`absolute bg-gray-600 text-white text-xs p-1 rounded cursor-pointer shadow-md ${
                  selectedVideo === video.name ? "border-2 border-red-500" : ""
                }`}
              >
                {video.name}
              </Rnd>
            ))}
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex justify-center gap-4 p-2 bg-gray-300 text-black text-sm">
          <button onClick={() => setIsPlaying(true)}>▶ Play</button>
          <button onClick={() => setIsPlaying(false)}>⏸ Pause</button>
          <button
            onClick={() => {
              setIsPlaying(false);
              setPlayheadPosition(0);
              setElapsedTime(0);
            }}
          >
            ⏹ Stop
          </button>
        </div>
      </div>
    </Rnd>
  );
}
