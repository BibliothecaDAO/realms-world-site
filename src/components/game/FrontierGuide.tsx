const art = (name: string) => `/games/frontier/${name}.webp`;

const goneAndKept = [
  {
    title: "Gone at the day's end",
    items: [
      "The map and its mist",
      "Every beast, camp, and ruin on it",
      "Every army you sent out, with its Oaths and relics",
    ],
  },
  {
    title: "Kept by your Realm",
    items: [
      "Its buildings, castle level, and research",
      "Its troops, wheat, labor, and essence",
      "The Oath slots it has opened",
    ],
  },
];

const cards = [
  {
    id: "frontier-day",
    icon: "hourglass",
    title: "One day, one expedition",
    text: "Each day a new map opens around your Realm and lasts 8 to 24 hours. Send armies into the mist to reveal it, clear the beasts that guard the land, and send home what they find. Beat a band of wraiths and your army can take an Oath, a bonus that lasts for the day. Above the Deep, no other player can touch your Realm or your armies.",
  },
  {
    id: "frontier-mist",
    icon: "realm-2",
    title: "The mist forgets. Your Realm remembers.",
    text: "At the day's end the mist consumes the map and every army on it. Your Realm keeps everything it earned and is ready for the next map.",
    lists: goneAndKept,
  },
  {
    id: "frontier-deep",
    icon: "depth-3",
    title: "Go down to the Deep",
    text: "Spires lead down through the map to the Deep, the ethereal plane every Realm shares. Armies fight armies there for four kinds of site: two pay essence and labor to your Realm, one raises your Aspect's Hyperstructure, and one stops a rival's. A site is held for as long as its guards have troops left.",
  },
  {
    id: "frontier-aspect",
    icons: ["aspect-luminary", "aspect-havoc", "aspect-prowess", "aspect-insight"],
    title: "Pick an Aspect",
    text: "Pick one of four Aspects, the teams of Frontier: Luminary, Havoc, Prowess, or Insight. Keep it all season. Hold the Hyperstructure archive in the Deep with your mates and every tick builds your Aspect's Hyperstructure, in plain view on the race board. Rivals can stall it from a Bane altar. The first Hyperstructure to be finished wins the age.",
  },
  {
    id: "frontier-prize",
    icon: "crown",
    title: "Share the prize",
    text: "Glory is your score. You earn it by holding the Hyperstructure archive or the Bane altar. Each Aspect earns prize $LORDS for what it builds, and more for finishing first. When the age ends, an Aspect's prize is shared among its members by Glory and paid to their wallets. No $LORDS are found along the way.",
  },
  {
    id: "frontier-cost",
    icon: "realm-0",
    title: "Free to play",
    text: "Founding your Realm costs nothing. Anyone who goes down to the Deep and holds a site can earn a share of the prize.",
  },
];

const cardTitleClass =
  "realm-title text-balance text-lg leading-tight text-[#BE96FB] sm:text-xl";
const labelClass =
  "realm-label text-sm font-semibold tracking-[0.04em] text-[#F3D08A]";
const textClass = "text-sm leading-relaxed text-[#F4EBDC] sm:text-base";

export function FrontierGuide() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <section
          key={card.id}
          className="flex flex-col rounded-lg border border-[#6238A0]/70 bg-[#1B1427] p-5"
          aria-labelledby={card.id}
        >
          <div className="flex items-center gap-4">
            {card.icons ? (
              <div
                className="grid h-16 w-16 shrink-0 grid-cols-2 gap-1 sm:h-20 sm:w-20"
                aria-hidden="true"
              >
                {card.icons.map((icon) => (
                  <img
                    key={icon}
                    src={art(icon)}
                    alt=""
                    width={160}
                    height={160}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-contain"
                  />
                ))}
              </div>
            ) : (
              <img
                src={art(card.icon)}
                alt=""
                width={128}
                height={128}
                loading="lazy"
                decoding="async"
                className="h-16 w-16 shrink-0 object-contain sm:h-20 sm:w-20"
              />
            )}
            <h2 id={card.id} className={cardTitleClass}>
              {card.title}
            </h2>
          </div>
          <p className={`mt-3 ${textClass}`}>{card.text}</p>
          {card.lists ? (
            <div className="mt-4 space-y-4">
              {card.lists.map((list) => (
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
          ) : null}
        </section>
      ))}
    </div>
  );
}
