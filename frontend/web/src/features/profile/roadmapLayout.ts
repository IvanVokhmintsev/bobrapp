import levelNode3 from "../../assets/profile/roadmap/level-node-3.svg";
import levelNode4 from "../../assets/profile/roadmap/level-node-4.svg";
import levelNode5 from "../../assets/profile/roadmap/level-node-5.svg";
import levelNode6 from "../../assets/profile/roadmap/level-node-6.svg";
import levelNode7 from "../../assets/profile/roadmap/level-node-7.svg";
import milestoneBox from "../../assets/profile/roadmap/milestone-box.svg";
import milestoneCd from "../../assets/profile/roadmap/milestone-cd.svg";
import milestoneMic from "../../assets/profile/roadmap/milestone-mic.svg";
import milestonePerson from "../../assets/profile/roadmap/milestone-person.svg";
import milestoneRing from "../../assets/profile/roadmap/milestone-ring.svg";
import milestoneRingFilled from "../../assets/profile/roadmap/milestone-ring-filled.svg";
import milestoneStar from "../../assets/profile/roadmap/milestone-star.svg";
import milestoneTrophy from "../../assets/profile/roadmap/milestone-trophy.svg";
import pathSegmentCorner from "../../assets/profile/roadmap/path-segment-corner.svg";
import pathSegmentMid from "../../assets/profile/roadmap/path-segment-mid.svg";
import pathSegmentS from "../../assets/profile/roadmap/path-segment-s.svg";
import pathSegmentShort from "../../assets/profile/roadmap/path-segment-short.svg";
import pathSegmentTop from "../../assets/profile/roadmap/path-segment-top.svg";
import toolbarFilter from "../../assets/profile/roadmap/toolbar-filter.svg";
import toolbarSettings from "../../assets/profile/roadmap/toolbar-settings.svg";

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

export const roadmapLevelNodes = [
  { level: 7, src: levelNode7, left: 245, top: 340, width: 194, height: 194 },
  { level: 6, src: levelNode6, left: 245, top: 775, width: 194, height: 194 },
  { level: 5, src: levelNode5, left: 245, top: 1209, width: 194, height: 194 },
  { level: 4, src: levelNode4, left: 245, top: 1643, width: 194, height: 194 },
  { level: 3, src: levelNode3, left: 245, top: 2078, width: 194, height: 194 },
] as const;

export const roadmapMilestones = [
  {
    id: "m-175",
    left: 181,
    top: 175,
    size: 93,
    ring: milestoneRing,
    icon: milestoneCd,
    iconWidth: 52,
    iconHeight: 44,
    iconLeft: 202,
    iconTop: 199,
  },
  {
    id: "m-301",
    left: 0,
    top: 277,
    size: 93,
    ring: milestoneRingFilled,
    icon: milestoneStar,
    iconWidth: 38,
    iconHeight: 47,
    iconLeft: 28,
    iconTop: 301,
    label: "10",
  },
  {
    id: "m-520",
    left: 575,
    top: 499,
    size: 93,
    ring: milestoneRingFilled,
    icon: milestoneTrophy,
    iconWidth: 52,
    iconHeight: 52,
    iconLeft: 597,
    iconTop: 520,
  },
  {
    id: "m-609",
    left: 181,
    top: 609,
    size: 93,
    ring: milestoneRing,
    icon: milestoneMic,
    iconWidth: 44,
    iconHeight: 41,
    iconLeft: 204,
    iconTop: 634,
  },
  {
    id: "m-713",
    left: 0,
    top: 713,
    size: 93,
    ring: milestoneRing,
    icon: milestoneBox,
    iconWidth: 46,
    iconHeight: 46,
    iconLeft: 22,
    iconTop: 737,
    label: "500",
  },
  {
    id: "m-933",
    left: 575,
    top: 933,
    size: 93,
    ring: milestoneRing,
    icon: milestoneCd,
    iconWidth: 42,
    iconHeight: 52,
    iconLeft: 602,
    iconTop: 955,
  },
  {
    id: "m-1043",
    left: 181,
    top: 1043,
    size: 93,
    ring: milestonePerson,
    label: "99",
  },
  {
    id: "m-1480",
    left: 181,
    top: 1480,
    size: 93,
    ring: milestoneRing,
    icon: milestoneBox,
    iconWidth: 46,
    iconHeight: 46,
    iconLeft: 206,
    iconTop: 1505,
  },
] as const;

export const roadmapToolbar = [
  { id: "filter", src: toolbarFilter, right: 33, top: 24, width: 52, height: 52 },
  { id: "settings", src: toolbarSettings, right: 95, top: 24, width: 41, height: 40 },
] as const;
