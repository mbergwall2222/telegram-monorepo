import _DocViewer, {
  DocRenderer,
  DocViewerRenderers,
} from "@cyntler/react-doc-viewer";
import { DocViewerProps } from "@cyntler/react-doc-viewer/dist/esm/DocViewer";
import ReactPlayer from "react-player";

const WebpRenderer: DocRenderer = ({ mainState: { currentDocument } }) => {
  if (!currentDocument) return null;

  return (
    <div className="flex justify-center">
      <img src={currentDocument.fileData as string} />
    </div>
  );
};
WebpRenderer.fileTypes = ["image/webp"];
WebpRenderer.weight = 1;

const WebmRenderer: DocRenderer = ({ mainState: { currentDocument } }) => {
  if (!currentDocument) return null;

  return (
    <div className="flex justify-center w-full">
      <ReactPlayer
        url={currentDocument.uri}
        controls
        muted={true}
        playing={true}
        loop
      />
    </div>
  );
};
WebmRenderer.fileTypes = ["video/webm"];
WebmRenderer.weight = 1;

export const DocViewer = (props: DocViewerProps) => (
  <_DocViewer
    pluginRenderers={[...DocViewerRenderers, WebpRenderer, WebmRenderer]}
    {...props}
  />
);
