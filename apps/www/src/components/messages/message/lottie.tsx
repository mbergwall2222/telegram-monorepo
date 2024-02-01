"use client";

import { ungzip } from "pako";
import { useEffect, useState } from "react";
import ReactLottie from "react-lottie";

export const Lottie = ({ fileUrl }: { fileUrl: string }) => {
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    fetch(fileUrl)
      .then((response) => {
        return response.blob();
      })
      .then((blob) => {
        const reader = new FileReader();
        reader.readAsArrayBuffer(blob); // Read as ArrayBuffer
        reader.onload = (event) => {
          const dataArr = event?.target?.result as ArrayBuffer;
          if (!dataArr) return;
          try {
            const data = new Uint8Array(dataArr); // Convert to Uint8Array
            const decompressedData = ungzip(data); // Decompress with ungzip
            const newAnimData = JSON.parse(
              new TextDecoder("utf-8").decode(decompressedData)
            );
            setAnimationData(newAnimData);
          } catch (e) {
            console.error("Error processing file:", e);
          }
        };
      })
      .catch((error) => console.error("Error fetching TGS file:", error));
  }, [fileUrl]);

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  return (
    <div>
      {animationData ? (
        <ReactLottie width="50%" options={defaultOptions} />
      ) : (
        <p>Loading animation...</p>
      )}
    </div>
  );
};
