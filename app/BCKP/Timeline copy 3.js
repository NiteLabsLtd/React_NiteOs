import { useState, useEffect, useRef } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Rnd } from "react-rnd";

// ---------------------------
// Constants
// ---------------------------
const TIMELINE_WIDTH = 1000;
const TIMELINE_DURATION = 120; // seconds
const TIME_INTERVAL = 50; // ms
const ROW_HEIGHT = 40;
const MAX_ROWS = 2;
const INITIAL_X = 50;
const INITIAL_Y = 20;
const MIN_VIDEO_WIDTH = 150;
const VIDEO_MARGIN = 10;

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

  // State to track dragging of the panel.
  const [isPanelDragging, setIsPanelDragging] = useState(false);

  // ---------------------------
  // Update Playhead
  // ---------------------------
  useEffect(() => {
    if (!isPlaying) return;
    const intervalId = setInterval(() => {
      setElapsedTime((prevElapsed) => {
        const newElapsed = prevElapsed + TIME_INTERVAL / 1000;
        setPlayheadPosition((newElapsed / TIMELINE_DURATION) * TIMELINE_WIDTH);
        return newElapsed;
      });
    }, TIME_INTERVAL);
    return () => clearInterval(intervalId);
  }, [isPlaying]);

  // ---------------------------
  // Delete Selected Video (Delete key)
  // ---------------------------
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Delete" && selectedVideo) {
        setTimelineVideos((prev) =>
          prev.filter((video) => video.name !== selectedVideo)
        );
        setSelectedVideo(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedVideo, setTimelineVideos]);

  // ---------------------------
  // Format Time Display
  // ---------------------------
  const formatTime = (seconds) => {
    const hrs = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const secs = String(Math.floor(seconds % 60)).padStart(2, "0");
    const ms = String(Math.floor((seconds % 1) * 100)).padStart(2, "0");
    return `${hrs}:${mins}:${secs}:${ms}`;
  };

  // ---------------------------
  // Handle Dropping a New Video
  // ---------------------------
  const handleDrop = (e) => {
    e.preventDefault();
    const videoName = e.dataTransfer.getData("videoName");
    if (videoName) {
      setTimelineVideos((prev) => {
        let newX = INITIAL_X;
        let newY = INITIAL_Y;
        let rowIndex = 0;
        while (rowIndex < MAX_ROWS) {
          const rowY = INITIAL_Y + rowIndex * ROW_HEIGHT;
          // Get videos in this row, sorted by x.
          const rowVideos = prev
            .filter((video) => video.y === rowY)
            .sort((a, b) => a.x - b.x);
          if (rowVideos.length === 0) {
            newX = INITIAL_X;
            newY = rowY;
            break;
          } else {
            // Place new video immediately after the last video.
            const lastVideo = rowVideos[rowVideos.length - 1];
            newX = lastVideo.x + lastVideo.width + VIDEO_MARGIN;
            if (newX + MIN_VIDEO_WIDTH <= TIMELINE_WIDTH) {
              newY = rowY;
              break;
            } else {
              rowIndex++;
            }
          }
        }
        if (rowIndex >= MAX_ROWS) {
          alert("No more space in the timeline!");
          return prev;
        }
        return [
          ...prev,
          { name: videoName, x: newX, y: INITIAL_Y + rowIndex * ROW_HEIGHT, width: MIN_VIDEO_WIDTH },
        ];
      });
    }
  };

  // ---------------------------
  // Handle Drag Stop on a Video (clamp X to avoid overlap)
  // ---------------------------
  const handleDragStop = (index, d) => {
    setTimelineVideos((prev) => {
      const videos = [...prev];
      const current = { ...videos[index] };
      let newX = d.x;
      // Get all other videos in the same row and sort by x.
      const sameRow = videos
        .filter((v, idx) => v.y === current.y && idx !== index)
        .sort((a, b) => a.x - b.x);
      let minX = 0;
      let maxX = TIMELINE_WIDTH - current.width;
      const leftNeighbors = sameRow.filter((v) => v.x + v.width + VIDEO_MARGIN <= newX);
      if (leftNeighbors.length > 0) {
        const leftNeighbor = leftNeighbors[leftNeighbors.length - 1];
        minX = leftNeighbor.x + leftNeighbor.width + VIDEO_MARGIN;
      }
      const rightNeighbors = sameRow.filter((v) => v.x >= newX + current.width + VIDEO_MARGIN);
      if (rightNeighbors.length > 0) {
        const rightNeighbor = rightNeighbors[0];
        maxX = rightNeighbor.x - VIDEO_MARGIN - current.width;
      }
      newX = Math.max(minX, Math.min(newX, maxX));
      current.x = newX;
      videos[index] = current;
      return videos;
    });
  };

  // ---------------------------
  // Handle Resize Stop on a Video (clamp X/width to avoid overlap)
  // ---------------------------
  const handleResizeStop = (index, direction, ref, delta, position) => {
    setTimelineVideos((prev) => {
      const videos = [...prev];
      const current = { ...videos[index] };
      let newX = current.x;
      let newWidth = ref.offsetWidth;
      if (direction === "left") {
        newX = position.x;
        newWidth = (current.x + current.width) - newX;
      }
      // Get all other videos in the same row and sort by x.
      const sameRow = videos
        .filter((v, idx) => v.y === current.y && idx !== index)
        .sort((a, b) => a.x - b.x);
      if (direction === "right") {
        const rightNeighbor = sameRow.find((v) => v.x > current.x);
        if (rightNeighbor) {
          const maxWidth = rightNeighbor.x - VIDEO_MARGIN - current.x;
          newWidth = Math.min(newWidth, maxWidth);
        } else {
          newWidth = Math.min(newWidth, TIMELINE_WIDTH - current.x);
        }
      } else if (direction === "left") {
        let minAllowedX = 0;
        const leftNeighbors = sameRow.filter((v) => v.x + v.width + VIDEO_MARGIN <= current.x);
        if (leftNeighbors.length > 0) {
          const leftNeighbor = leftNeighbors[leftNeighbors.length - 1];
          minAllowedX = leftNeighbor.x + leftNeighbor.width + VIDEO_MARGIN;
        }
        newX = Math.max(newX, minAllowedX);
        newWidth = (current.x + current.width) - newX;
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
    // Outer Rnd makes the entire timeline panel draggable.
    <Rnd
      default={{ x: 100, y: 100 }}
      bounds="window"
      dragHandleClassName="drag-handle"  // Pass the class name WITHOUT a leading dot.
      onDragStart={() => setIsPanelDragging(true)}
      onDragStop={() => setIsPanelDragging(false)}
    >
      <div
        ref={setNodeRef}
        className="relative bg-white p-4 w-3/4 h-80 border-t flex flex-col justify-between overflow-hidden mx-auto"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {/* Header for drag handle */}
        <div
          className={`drag-handle cursor-move p-2 text-center font-bold ${
            isPanelDragging ? "bg-black text-white" : "bg-gray-200"
          }`}
        >
          Timeline Panel
        </div>

        {/* Timer Display */}
        <div className="text-center text-lg font-bold text-gray-700 mb-2">
          Time Elapsed: {formatTime(elapsedTime)}
        </div>

        {/* Scrollable Timeline Container */}
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
