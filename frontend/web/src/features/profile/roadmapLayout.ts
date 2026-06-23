import levelNode3 from "../../assets/profile/roadmap/level-node-3.svg";
import levelNode4 from "../../assets/profile/roadmap/level-node-4.svg";
import levelNode5 from "../../assets/profile/roadmap/level-node-5.svg";
import levelNode6 from "../../assets/profile/roadmap/level-node-6.svg";
import levelNode7 from "../../assets/profile/roadmap/level-node-7.svg";
import pathSegmentCorner from "../../assets/profile/roadmap/path-segment-corner.svg";
import pathSegmentMid from "../../assets/profile/roadmap/path-segment-mid.svg";
import pathSegmentS from "../../assets/profile/roadmap/path-segment-s.svg";
import pathSegmentShort from "../../assets/profile/roadmap/path-segment-short.svg";
import pathSegmentTop from "../../assets/profile/roadmap/path-segment-top.svg";

export const ROADMAP_CANVAS = {
  width: 682,
  height: 2272,
} as const;

export const roadmapPaths = [
  { src: pathSegmentTop, left: 49, top: 0, width: 584, height: 440 },
  { src: pathSegmentMid, left: 49, top: 435, width: 584, height: 439 },
  { src: pathSegmentCorner, left: 49, top: 652, width: 408, height: 222 },
  { src: pathSegmentShort, left: 49, top: 759, width: 196, height: 115 },
  { src: pathSegmentS, left: 49, top: 869, width: 584, height: 439 },
  { src: pathSegmentS, left: 49, top: 1303, width: 584, height: 439 },
  { src: pathSegmentS, left: 49, top: 1738, width: 584, height: 439 },
] as const;

/** Canvas node positions keyed by `RoadmapLevel.mapNodeId` from the API. */
export const roadmapLevelNodes = [
  { mapNodeId: 7, src: levelNode7, left: 245, top: 340, width: 194, height: 194 },
  { mapNodeId: 6, src: levelNode6, left: 245, top: 775, width: 194, height: 194 },
  { mapNodeId: 5, src: levelNode5, left: 245, top: 1209, width: 194, height: 194 },
  { mapNodeId: 4, src: levelNode4, left: 245, top: 1643, width: 194, height: 194 },
  { mapNodeId: 3, src: levelNode3, left: 245, top: 2078, width: 194, height: 194 },
] as const;
