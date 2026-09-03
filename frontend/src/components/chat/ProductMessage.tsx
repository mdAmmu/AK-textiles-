import type { Message } from "../../types/message";

interface Props {
  message: Message;
}

export default function ProductMessage({ message }: Props) {
  return (
    <div className="flex gap-2.5 w-[280px] max-w-full">
      {message.product_image && (
        <img
          className="w-[110px] h-[130px] object-cover rounded-md shrink-0"
          src={message.product_image}
          alt={message.product_name ?? "Product"}
        />
      )}
      <div className="flex flex-col justify-center min-w-0">
        <div className="font-bold text-[var(--chat-text)]">{message.product_name}</div>
        {message.product_description && (
          <div className="text-[13px] text-[var(--chat-text-secondary)] mt-1">
            {message.product_description}
          </div>
        )}
        {message.price != null && (
          <div className="font-bold text-[var(--chat-accent)] mt-2">₹{message.price} / piece</div>
        )}
      </div>
    </div>
  );
}
