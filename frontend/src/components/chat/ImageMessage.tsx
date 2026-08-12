import type { Message } from "../../types/message";
import "./ImageMessage.css";

interface Props {
  message: Message;
}

export default function ImageMessage({ message }: Props) {
  if (!message.product_image) return null;
  return (
    <img className="image-message" src={message.product_image} alt="Product" draggable={false} />
  );
}
