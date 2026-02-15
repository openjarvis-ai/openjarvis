"use client";

import dynamic from "next/dynamic";

const Hero3DSceneInner = dynamic(
  () => import("./Hero3DSceneInner").then((m) => m.Hero3DSceneInner),
  {
    ssr: false,
    loading: () => null,
  }
);

export function Hero3DScene() {
  return <Hero3DSceneInner />;
}
