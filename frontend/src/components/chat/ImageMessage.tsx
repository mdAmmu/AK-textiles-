import { forwardRef, useImperativeHandle, useState } from "react";
import type { Message } from "../../types/message";
import ImageViewerModal from "./ImageViewerModal";
import "./ImageMessage.css";

interface Props {
  message: Message;
  selectionMode?: boolean;
}

export interface ImageMessageHandle {
  open: () => void;
}

function ImageMessage({ message, selectionMode }: Props, ref: React.Ref<ImageMessageHandle>) {
  const [open, setOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    open: () => setOpen(true),
  }));

  if (!message.product_image) return null;
  return (
    <>
      <img
        className="image-message"
        src={message.product_image}
        alt="Product"
        draggable={false}
        onClick={() => !selectionMode && setOpen(true)}
      />
      {open && (
        <ImageViewerModal
          images={[message.product_image]}
          startIndex={0}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

export default forwardRef(ImageMessage);
