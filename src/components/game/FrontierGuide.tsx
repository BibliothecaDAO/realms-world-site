const daySteps = [
  {
    title: "Deploy",
    text: "Barracks train troops at your Realm. Deploy them on a tile beside it as an army.",
  },
  {
    title: "Explore",
    text: "The map is hidden until an army walks it. Each tile revealed sends Essence or labor home.",
  },
  {
    title: "Clear",
    text: "Trolls, rifts, ruins and beasts guard their sites. Each shows its guard and what it pays before you attack.",
  },
  {
    title: "Bring it home",
    text: "What a reveal or a clear pays goes straight to your Realm. An army never carries anything worth losing.",
  },
];

const mistLists = [
  {
    title: "Gone at the day's end",
    items: [
      "The map and its mist",
      "Every Troll, rift, ruin and beast",
      "Every army you sent out",
    ],
  },
  {
    title: "Kept by your Realm",
    items: [
      "Its buildings, castle and research",
      "Its troops, wheat, labor and Essence",
      "Its LORDS",
    ],
  },
];

const costs = [
  "Free to play. Your Realm is founded free the first time you enter, on any day of the season.",
  "Chests pay LORDS from the season's pool into your Realm.",
  "Refill tops up an army's stamina for 1 LORDS a missing point, paid from your Realm's LORDS.",
];

const blockClass =
  "rounded-lg border border-[#6238A0]/70 bg-[#14101D] p-5 sm:p-6";
const headingClass =
  "realm-title text-balance text-xl leading-tight text-[#BE96FB] sm:text-3xl";
const labelClass =
  "font-[family-name:var(--font-ui)] text-sm font-semibold tracking-[0.04em] text-[#F3D08A]";

export function FrontierGuide() {
  return (
    <>
      <section className={blockClass} aria-labelledby="frontier-day">
        <h2 id="frontier-day" className={headingClass}>
          The Day
        </h2>
        <ol className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {daySteps.map((step) => (
            <li key={step.title}>
              <h3 className={labelClass}>{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#F4EBDC] sm:text-base">
                {step.text}
              </p>
            </li>
          ))}
        </ol>
        <p className="mt-5 border-t border-[#6238A0]/70 pt-4 text-sm leading-relaxed text-[#F4EBDC] sm:text-base">
          A normal day lasts 8 to 24 hours, or 4 to 12 in the Devcon season. The
          game shows when today ends and how long tomorrow lasts.
        </p>
      </section>

      <section className={blockClass} aria-labelledby="frontier-mist">
        <h2 id="frontier-mist" className={headingClass}>
          The mist forgets. Your Realm remembers.
        </h2>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-[#F4EBDC] sm:text-lg">
          At the day's end the mist takes the map and every army on it. Your
          Realm is raised again on the next map with everything it holds.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
          {mistLists.map((list) => (
            <div key={list.title}>
              <h3 className={labelClass}>{list.title}</h3>
              <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-[#F4EBDC] sm:text-base">
                {list.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className={blockClass} aria-labelledby="frontier-cost">
        <h2 id="frontier-cost" className={headingClass}>
          What It Costs
        </h2>
        <ul className="mt-4 space-y-3 text-sm leading-relaxed text-[#F4EBDC] sm:text-base">
          {costs.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>
    </>
  );
}
