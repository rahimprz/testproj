import { memo } from 'react';

const THEMES = ['Parallel Worlds', 'Survival & Adaptation', 'Loyalty, Friendship & Loss', 'Good vs Evil', 'Moral Responsibility', 'Time Displacement'];

const Star = () => (
  <svg className="tape__star" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 0 L12 8 L20 10 L12 12 L10 20 L8 12 L0 10 L8 8 Z" /></svg>
);
const Group = ({ hidden }) => (
  <div className="tape__group" aria-hidden={hidden || undefined}>
    {THEMES.map((t) => <span key={t} className="tape__item"><span>{t}</span><Star /></span>)}
  </div>
);

function Tape() {
  return (
    <section className="tape" data-section="tape" data-theme="dark" aria-label="Themes of the book">
      <div className="tape__band tape__band--sun">
        <div className="tape__track"><Group /><Group hidden /></div>
      </div>
      <div className="tape__band tape__band--plum" aria-hidden="true">
        <div className="tape__track tape__track--rev"><Group /><Group /></div>
      </div>
    </section>
  );
}

export default memo(Tape);
