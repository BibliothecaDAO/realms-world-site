const art = (name: string) => `/games/frontier/${name}.webp`;

const daySteps = [
  {
    title: "Deploy",
    icon: art("barracks"),
    text: "Barracks train troops at your Realm. Deploy them on a tile beside it as an army.",
  },
  {
    title: "Explore",
    icon: art("map"),
    text: "The map is hidden until an army walks it. Each tile revealed sends Essence or labor home.",
  },
  {
    title: "Clear",
    icon: art("beast-troll"),
    text: "Trolls, rifts, ruins and beasts guard their sites. Each shows its guard and what it pays before you attack.",
  },
  {
    title: "Bring it home",
    icon: art("chest"),
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

const sectionClass =
  "rounded-lg border border-[#6238A0]/70 bg-[#14101D] p-5 sm:p-6";
const cardClass =
  "flex flex-col rounded-lg border border-[#6238A0]/70 bg-[#1B1427] p-5";
const headingClass =
  "realm-title text-balance text-xl leading-tight text-[#BE96FB] sm:text-3xl";
const cardTitleClass =
  "realm-title text-balance text-lg leading-tight text-[#BE96FB] sm:text-xl";
const labelClass =
  "realm-label text-sm font-semibold tracking-[0.04em] text-[#F3D08A]";
const textClass = "text-sm leading-relaxed text-[#F4EBDC] sm:text-base";

function CardPicture({ src }: { src: string }) {
  return (
    <img
      src={src}
      alt=""
      width={128}
      height={128}
      loading="lazy"
      decoding="async"
      className="mb-4 h-20 w-20 shrink-0 object-contain"
    />
  );
}

export function FrontierGuide() {
  return (
    <>
      <section className={sectionClass} aria-labelledby="frontier-day">
        <h2 id="frontier-day" className={headingClass}>
          The Day
        </h2>
        <ol className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {daySteps.map((step) => (
            <li key={step.title} className={cardClass}>
              <CardPicture src={step.icon} />
              <h3 className={cardTitleClass}>{step.title}</h3>
              <p className={`mt-2 ${textClass}`}>{step.text}</p>
            </li>
          ))}
        </ol>
        <p className={`mt-5 flex items-center gap-3 border-t border-[#6238A0]/70 pt-4 ${textClass}`}>
          <img
            src={art("hourglass")}
            alt=""
            width={128}
            height={128}
            loading="lazy"
            decoding="async"
            className="h-10 w-10 shrink-0 object-contain"
          />
          <span>
            A normal day lasts 8 to 24 hours, or 4 to 12 in the Devcon season.
            The game shows when today ends and how long tomorrow lasts.
          </span>
        </p>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className={cardClass} aria-labelledby="frontier-mist">
          <CardPicture src={art("realm-2")} />
          <h2 id="frontier-mist" className={cardTitleClass}>
            The mist forgets. Your Realm remembers.
          </h2>
          <p className={`mt-2 ${textClass}`}>
            At the day's end the mist takes the map and every army on it. Your
            Realm is raised again on the next map with everything it holds.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {mistLists.map((list) => (
              <div key={list.title}>
                <h3 className={labelClass}>{list.title}</h3>
                <ul className={`mt-2 space-y-1.5 ${textClass}`}>
                  {list.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className={cardClass} aria-labelledby="frontier-cost">
          <CardPicture src={art("stamina")} />
          <h2 id="frontier-cost" className={cardTitleClass}>
            What It Costs
          </h2>
          <ul className={`mt-3 space-y-3 ${textClass}`}>
            {costs.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
