import { useEffect, useRef } from 'react';

import type { UseConversations } from './useConversations';

interface ChatViewProps {
  chat: UseConversations;
}

const STARTERS = [
  'What cut suits my face shape?',
  'How do I describe this to my barber?',
  'How long before I need a refresh?',
];

/** Main viewport for the AI view: the thread, then the composer. */
const ChatView: React.FC<ChatViewProps> = ({ chat }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Follow the thread as it grows, the way every chat does.
  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [chat.messages, chat.isSending]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends, Shift+Enter breaks the line.
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    void chat.send();
  };

  const isEmpty = chat.messages.length === 0;

  return (
    <div className="trim-chat">
      <div className="trim-chat__thread" ref={scrollRef} aria-live="polite">
        {isEmpty ? (
          <div className="trim-chat__welcome">
            <h1 className="trim-chat__welcome-title">Ask Trimo</h1>
            <p className="trim-chat__welcome-lede">
              Trimo knows your face shape, your hair and how often you get cut. Ask what
              would suit you, or what to say when you are in the chair.
            </p>

            <ul className="trim-chat__starters">
              {STARTERS.map((starter) => (
                <li key={starter}>
                  <button
                    className="trim-chat__starter"
                    type="button"
                    onClick={() => {
                      chat.setDraft(starter);
                      inputRef.current?.focus();
                    }}
                  >
                    {starter}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          chat.messages.map((message) => (
            <article
              className={`trim-bubble trim-bubble--${message.role}`}
              key={message.id}
            >
              <p className="trim-bubble__role">
                {message.role === 'user' ? 'You' : 'Trimo'}
                {message.provider ? <span className="trim-bubble__provider">{message.provider}</span> : null}
              </p>
              <p className="trim-bubble__text">{message.content}</p>
            </article>
          ))
        )}

        {chat.isSending ? (
          <p className="trim-chat__thinking">Trimo is thinking</p>
        ) : null}
      </div>

      {chat.error ? (
        <p className="trim-chat__error" role="alert">
          {chat.error.message}
        </p>
      ) : null}

      <form
        className="trim-chat__composer"
        onSubmit={(event) => {
          event.preventDefault();
          void chat.send();
        }}
      >
        <label className="trim-visually-hidden" htmlFor="trim-chat-input">
          Message Trimo
        </label>
        <textarea
          id="trim-chat-input"
          ref={inputRef}
          className="trim-chat__input"
          value={chat.draft}
          rows={1}
          placeholder="Ask about your hair"
          onChange={(event) => chat.setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          disabled={chat.isSending}
        />
        <button
          className="trim-chat__send"
          type="submit"
          disabled={chat.isSending || chat.draft.trim().length === 0}
        >
          {chat.isSending ? 'Sending' : 'Send'}
        </button>
      </form>
    </div>
  );
};

export default ChatView;