import { useState } from 'react';

import { useConversations } from '../../dashboards/customer-dashboard/ai/useConversations';
import { shapeAdvice } from '../../dashboards/customer-dashboard/face/advice';
import { useFaceProfile } from '../../dashboards/customer-dashboard/face/useFaceProfile';
import { faceShapeLabel } from '../../dashboards/customer-dashboard/face/shapes';

const STARTERS = [
  'What cut suits my face shape?',
  'How do I describe this to my barber?',
  'How long before I need a refresh?',
];

/** Same Trimo as the web, in a phone-sized thread. */
const Trimo: React.FC = () => {
  const chat = useConversations();
  const face = useFaceProfile();
  const [text, setText] = useState('');

  const send = async () => {
    if (text.trim().length === 0 || chat.isSending) return;
    await chat.send();
    setText('');
  };

  const askAboutShape = () => {
    if (!face.shape) return;
    setText(shapeAdvice(face.shape).askTrimo);
  };

  const isEmpty = chat.messages.length === 0;

  return (
    <div className="m-screen m-trimo">
      <h2 className="m-heading">Trimo</h2>
      <p className="m-lede">
        {face.shape
          ? `Knows your ${faceShapeLabel(face.shape).toLowerCase()} face.`
          : 'Set a face shape and Trimo can be specific.'}
      </p>

      {isEmpty ? (
        <div className="m-card">
          <p className="m-card__text" style={{ marginBottom: '0.75rem' }}>
            Ask what would suit you, or what to say when you are in the chair.
          </p>

          <div className="m-pills">
            {face.shape ? (
              <button className="m-pill" type="button" onClick={askAboutShape}>
                About my {faceShapeLabel(face.shape)} face
              </button>
            ) : null}
            {STARTERS.map((starter) => (
              <button
                className="m-pill"
                type="button"
                key={starter}
                onClick={() => setText(starter)}
              >
                {starter}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="m-thread">
          {chat.messages.map((message) => (
            <article className={`m-bubble m-bubble--${message.role}`} key={message.id}>
              <span className="m-bubble__who">
                {message.role === 'user' ? 'You' : 'Trimo'}
              </span>
              <p className="m-bubble__text">{message.content}</p>
            </article>
          ))}
        </div>
      )}

      {chat.isSending ? <p className="m-field__hint">Trimo is thinking…</p> : null}

      {chat.error ? (
        <p className="m-error" role="alert">
          {chat.error.message}
        </p>
      ) : null}

      <form
        className="m-composer"
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
      >
        <input
          className="m-field__input"
          type="text"
          value={text}
          placeholder="Ask about your hair"
          onChange={(event) => setText(event.target.value)}
        />
        <button className="m-btn m-composer__send" type="submit" disabled={chat.isSending || !text.trim()}>
          Send
        </button>
      </form>
    </div>
  );
};

export default Trimo;