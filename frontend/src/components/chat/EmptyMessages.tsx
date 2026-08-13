import "./EmptyMessages.css";

interface Props {
  onSendClick?: () => void;
}

export default function EmptyMessages({ onSendClick }: Props) {
  return (
    <div className="empty-messages">
      <div className="empty-messages__illustration">
        <div className="empty-messages__bubble empty-messages__bubble--top">
          <span />
          <span />
          <span />
        </div>
        <div className="empty-messages__bubble empty-messages__bubble--mid">
          <span />
          <span />
          <span />
        </div>
        <div className="empty-messages__bubble empty-messages__bubble--bottom">
          <span />
          <span />
          <span />
        </div>
      </div>
      <h2 className="empty-messages__title">No messages yet</h2>
      <p className="empty-messages__subtitle">Start a conversation and it will appear here.</p>
      {onSendClick && (
        <button className="empty-messages__button" onClick={onSendClick} type="button">
          Send a message
        </button>
      )}
    </div>
  );
}
