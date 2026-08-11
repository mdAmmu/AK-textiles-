import type { Message } from "../../types/message";
import "./ProductMessage.css";

interface Props {
  message: Message;
}

export default function ProductMessage({ message }: Props) {
  return (
    <div className="product-message">
      {message.product_image && (
        <img
          className="product-message__image"
          src={message.product_image}
          alt={message.product_name ?? "Product"}
        />
      )}
      <div className="product-message__details">
        <div className="product-message__name">{message.product_name}</div>
        {message.product_description && (
          <div className="product-message__description">{message.product_description}</div>
        )}
        {message.price != null && (
          <div className="product-message__price">₹{message.price} / piece</div>
        )}
      </div>
    </div>
  );
}
