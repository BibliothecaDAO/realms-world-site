import { motion } from "framer-motion";
import { gameStatusText, pickGames, realmsGameSlugs, type Game } from "@/data/games";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  Castle,
  Coins,
  ExternalLink,
  Gamepad2,
  Shield,
  Swords,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Frontier leads the Realms games with its own card, above this grid.
const [frontier, ...realmsGridGames] = pickGames(realmsGameSlugs);
const otherStudioGames = pickGames(["loot-survivor", "zkube"]);

const frontierFeatures = [
  {
    icon: Swords,
    label: "PvE Roguelite",
    detail: "Explore, fight beasts, and upgrade your Realm",
  },
  {
    icon: Castle,
    label: "Free to Play",
    detail: "Found your Realm for free",
  },
  {
    icon: Shield,
    label: "Fully Onchain",
    detail: "All actions verifiable onchain",
  },
  {
    icon: Coins,
    label: "$LORDS Rewards",
    detail: "Recover $LORDS from ruins; top players win a prize",
  },
];

function GameCard({ game, index }: { game: Game; index: number }) {
  const statusText = gameStatusText(game);

  return (
    <motion.article
      className="group relative overflow-hidden rounded-lg border border-primary/20 bg-black/25 backdrop-blur-sm lg:aspect-[16/10] realm-panel realm-holo-card"
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 + 0.06 * index, duration: 0.45 }}
    >
      <img
        src={game.backgroundImage}
        alt={game.title}
        className="absolute inset-0 h-full w-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10" />

      <div className="relative flex h-full flex-col justify-end p-4 pt-28 sm:p-5 sm:pt-28 lg:pt-12">
        {/* Status badge */}
        <div className="absolute top-3 right-3">
          {game.isLive ? (
            <span className="realm-sigil bg-black/80 text-green-400 border-green-500/30">
              Live
            </span>
          ) : statusText ? (
            <span className="realm-sigil bg-black/80 text-foreground/85">{statusText}</span>
          ) : null}
        </div>

        {/* The scrim sits behind the text alone, so the art above it stays bright */}
        <div className="-mx-4 -mb-4 bg-gradient-to-t from-black/50 via-black/35 via-75% to-transparent p-4 pt-10 sm:-mx-5 sm:-mb-5 sm:p-5 sm:pt-10">
          <h3 className="text-xl font-semibold mb-1.5">{game.title}</h3>
          <p className="text-xs text-foreground/80 mb-2.5 line-clamp-3">
            {game.description}
          </p>

          {/* Genre tags */}
          <div className="mb-3 flex flex-nowrap items-start justify-between gap-2">
            <div className="flex min-w-0 flex-wrap gap-1.5">
              {game.genre
                ?.filter((genre) => genre !== game.studio)
                .slice(0, 3)
                .map((genre) => (
                  <span
                    key={`${game.slug}-${genre}`}
                    className="realm-sigil text-[9px]"
                  >
                    {genre}
                  </span>
                ))}
            </div>
            <span className="realm-sigil realm-studio-tag ml-auto shrink-0 text-[9px]">
              {game.studio}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {game.isLive && game.links?.homepage && (
              <a
                href={game.links.homepage}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center text-xs font-semibold text-primary hover:text-primary/80 transition-colors sm:min-h-6"
              >
                Play Now <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            )}
            <Link
              to="/games/$slug"
              params={{ slug: game.slug }}
              className="inline-flex min-h-11 items-center text-xs text-foreground/80 hover:text-primary transition-colors sm:min-h-6"
            >
              Details <ArrowUpRight className="ml-1 h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export function EcosystemAtlasSection() {
  const frontierStatus = gameStatusText(frontier);

  return (
    <section className="realm-section relative">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <motion.div
          className="mx-auto mb-8 max-w-3xl text-center"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="realm-banner mx-auto mb-3 flex w-fit">
            <Gamepad2 className="h-3.5 w-3.5" />
            Games
          </p>
          <h2 className="realm-title mb-4 text-2xl sm:text-3xl md:text-4xl">
            REALMS GAMES
          </h2>
          <p className="realm-subtitle text-base sm:text-lg">
            Blitz, Frontier and Eternum share one world. Each has its own rules,
            and those rules are verifiable onchain.
          </p>
          <Link
            to="/games"
            className="realm-panel mt-5 inline-flex items-center justify-center rounded-lg border border-primary/30 bg-black/30 px-4 py-3 text-sm uppercase tracking-[0.14em] text-primary/90 transition-colors hover:border-primary/55"
          >
            All Games
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </motion.div>

        {/* ── Frontier Flagship Card ── */}
        <motion.div
          className="group relative overflow-hidden rounded-lg border border-primary/30 bg-black/40 mb-4 sm:mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.7 }}
        >
          {/* Background art */}
          <img
            src={frontier.backgroundImage}
            alt=""
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-64 w-full object-cover object-[100%_0%] opacity-100 saturate-[0.95] contrast-110 origin-top scale-[1.02] transition-transform duration-700 group-hover:scale-[1.05] sm:h-80 xl:inset-0 xl:h-full"
          />

          {/* Gradient overlay: the art sits above the text until the card is wide enough to sit beside it */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent from-[9rem] to-black to-[16rem] sm:from-[11rem] sm:to-[20rem] xl:hidden" />
          <div className="absolute inset-0 hidden bg-gradient-to-r from-black via-black/80 via-45% to-transparent to-70% xl:block" />
          <div className="absolute inset-0 hidden bg-gradient-to-t from-black/60 via-transparent to-black/10 xl:block" />

          {/* Content */}
          <div className="relative z-10 grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-8 p-6 pt-52 sm:p-8 sm:pt-72 xl:p-10 min-h-[340px] sm:min-h-[400px]">
            {/* Left: Info */}
            <div className="flex flex-col justify-end">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <p className="realm-banner">
                    <Swords className="h-3.5 w-3.5" />
                    Featured Game
                  </p>
                  {frontier.isLive ? (
                    <span className="realm-sigil text-green-400 border-green-500/30">
                      Live
                    </span>
                  ) : null}
                  {frontierStatus ? (
                    <span className="realm-sigil text-foreground/85">
                      {frontierStatus}
                    </span>
                  ) : null}
                </div>
                <h3 className="realm-title text-3xl sm:text-4xl md:text-5xl leading-tight mb-3">
                  {frontier.title}
                </h3>
                <p className="text-base sm:text-lg text-foreground/85 max-w-xl mb-6 leading-relaxed">
                  {frontier.featureBlurb}
                </p>

                <div className="flex flex-wrap gap-3 mb-6">
                  <Button
                    size="lg"
                    variant="war"
                    className="shadow-lg shadow-primary/20"
                    asChild
                  >
                    <a
                      href={frontier.isLive ? frontier.links?.homepage : frontier.howToPlay}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {frontier.isLive ? "Enter Frontier" : "How to Play"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                  <Button size="lg" variant="oath" asChild>
                    <Link to="/games/$slug" params={{ slug: frontier.slug }}>Learn More</Link>
                  </Button>
                </div>
              </motion.div>
            </div>

            {/* Right: Feature pills (desktop) */}
            <div className="hidden xl:flex flex-col justify-end gap-2.5 w-64">
              {frontierFeatures.map((feature, index) => (
                <motion.div
                  key={feature.label}
                  className="flex items-center gap-3 rounded-lg border border-primary/20 bg-black/50 backdrop-blur-sm px-4 py-3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
                >
                  <feature.icon className="h-4 w-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold leading-tight">
                      {feature.label}
                    </p>
                    <p className="text-[10px] text-foreground/80 leading-tight">
                      {feature.detail}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Mobile feature row */}
          <div className="relative z-10 xl:hidden grid grid-cols-2 gap-2 px-6 pb-6 sm:px-8 sm:pb-8">
            {frontierFeatures.map((feature) => (
              <div
                key={feature.label}
                className="flex items-center gap-2 rounded-lg border border-primary/15 bg-black/40 backdrop-blur-sm px-3 py-2"
              >
                <feature.icon className="h-3.5 w-3.5 text-primary shrink-0" />
                <p className="text-[10px] font-semibold leading-tight">
                  {feature.label}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Other Realms games ── */}
        <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
          {realmsGridGames.map((game, index) => (
            <GameCard key={game.slug} game={game} index={index} />
          ))}
        </div>

        {/* ── Other studios header ── */}
        <motion.div
          className="mb-6 flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <p className="realm-banner mx-auto flex w-fit text-center">GAMES FROM OTHER STUDIOS</p>
        </motion.div>

        {/* ── Other studios grid ── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
          {otherStudioGames.map((game, index) => (
            <GameCard key={game.slug} game={game} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
