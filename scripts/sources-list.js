/**
 * Lista de portais brasileiros de notícias de games para ingestão RSS.
 * base_url: URL da seção/portal (sem barra final).
 * rss_url: URL do feed RSS (padrões comuns: /feed, /feed/, /rss, /feed.xml).
 * Alguns feeds podem precisar de ajuste manual após testar.
 */
export const SOURCES_TO_ADD = [
  // Portais grandes de games
  { id: "ign-br", name: "IGN Brasil", base_url: "https://br.ign.com", rss_url: "https://br.ign.com/feed.xml" },
  { id: "tecmundo-voxel", name: "TecMundo Voxel", base_url: "https://www.tecmundo.com.br/voxel", rss_url: "https://www.tecmundo.com.br/voxel/feed" },
  { id: "gamevicio", name: "GameVicio", base_url: "https://www.gamevicio.com", rss_url: "https://www.gamevicio.com/feed/" },
  { id: "uol-start-games", name: "UOL Start Games", base_url: "https://www.uol.com.br/start/games", rss_url: "https://www.uol.com.br/start/games/feed" },
  { id: "adrenaline-games", name: "Adrenaline Games", base_url: "https://www.adrenaline.com.br/games", rss_url: "https://www.adrenaline.com.br/games/feed/" },
  { id: "canaltech-games", name: "Canaltech Games", base_url: "https://www.canaltech.com.br/games", rss_url: "https://www.canaltech.com.br/rss/games/" },
  { id: "meups", name: "MeuPS", base_url: "https://www.meups.com.br", rss_url: "https://www.meups.com.br/feed/" },
  { id: "comboinfinito", name: "Combo Infinito", base_url: "https://www.comboinfinito.com.br", rss_url: "https://www.comboinfinito.com.br/principal/feed/" },
  { id: "criticalhits-games", name: "Critical Hits Games", base_url: "https://www.criticalhits.com.br/games", rss_url: "https://www.criticalhits.com.br/games/feed/" },
  // Portais médios
  { id: "dropsdejogos", name: "Drops de Jogos", base_url: "https://dropsdejogos.uai.com.br", rss_url: "https://dropsdejogos.uai.com.br/feed/" },
  { id: "gamereporter", name: "Game Reporter", base_url: "https://www.gamereporter.com.br", rss_url: "https://www.gamereporter.com.br/feed/" },
  { id: "gamerview", name: "Gamerview", base_url: "https://gamerview.com.br", rss_url: "https://gamerview.com.br/feed/" },
  { id: "pressstart", name: "Press Start", base_url: "https://pressstart.com.br", rss_url: "https://pressstart.com.br/feed/" },
  { id: "arkade", name: "Arkade", base_url: "https://arkade.com.br", rss_url: "https://arkade.com.br/feed/" },
  { id: "uol-esports", name: "UOL Esports", base_url: "https://mais.esports.uol.com.br", rss_url: "https://mais.esports.uol.com.br/feed" },
  { id: "centralxbox", name: "Central Xbox", base_url: "https://centralxbox.com.br", rss_url: "https://centralxbox.com.br/feed/" },
  { id: "psxbrasil", name: "PSX Brasil", base_url: "https://psxbrasil.com.br", rss_url: "https://psxbrasil.com.br/feed/" },
  { id: "xboxpower", name: "Xbox Power", base_url: "https://xboxpower.com.br", rss_url: "https://xboxpower.com.br/feed/" },
  { id: "revolutionarena", name: "Revolution Arena", base_url: "https://revolutionarena.com", rss_url: "https://revolutionarena.com/feed/" },
  // Blogs e independentes
  { id: "gameblast", name: "GameBlast", base_url: "https://gameblast.com.br", rss_url: "https://gameblast.com.br/feed/" },
  { id: "nintendoblast", name: "Nintendo Blast", base_url: "https://nintendoblast.com.br", rss_url: "https://nintendoblast.com.br/feed/" },
  { id: "jogorama", name: "Jogorama", base_url: "https://jogorama.com.br", rss_url: "https://jogorama.com.br/feed/" },
  { id: "warpzone", name: "WarpZone", base_url: "https://warpzone.me", rss_url: "https://warpzone.me/feed/" },
  { id: "cosmonerd-games", name: "Cosmo Nerd Games", base_url: "https://cosmonerd.com.br/games", rss_url: "https://cosmonerd.com.br/games/feed/" },
  { id: "nerdsite-games", name: "NerdSite Games", base_url: "https://nerdsite.com.br/categoria/games", rss_url: "https://nerdsite.com.br/categoria/games/feed/" },
  { id: "playreplay", name: "Play Replay", base_url: "https://playreplay.com.br", rss_url: "https://playreplay.com.br/feed/" },
  { id: "oldgamer", name: "Old Gamer", base_url: "https://oldgamer.com.br", rss_url: "https://oldgamer.com.br/feed/" },
  { id: "indiegamesbrasil", name: "Indie Games Brasil", base_url: "https://indiegamesbrasil.com", rss_url: "https://indiegamesbrasil.com/feed/" },
  { id: "universonintendo", name: "Universo Nintendo", base_url: "https://universonintendo.com", rss_url: "https://universonintendo.com/feed/" },
  // Grandes portais - seção games
  { id: "omelete-games", name: "Omelete Games", base_url: "https://www.omelete.com.br/games", rss_url: "https://www.omelete.com.br/games/feed" },
  { id: "jovemnerd-games", name: "Jovem Nerd Games", base_url: "https://jovemnerd.com.br/nerdbunker/games", rss_url: "https://jovemnerd.com.br/nerdbunker/games/feed/" },
  { id: "tecmundo-jogos", name: "TecMundo Jogos", base_url: "https://www.tecmundo.com.br/jogos", rss_url: "https://www.tecmundo.com.br/jogos/feed" },
  { id: "olhardigital-games", name: "Olhar Digital Games", base_url: "https://olhardigital.com.br/tag/games", rss_url: "https://olhardigital.com.br/feed/" },
  { id: "terra-gameon", name: "Terra GameOn", base_url: "https://www.terra.com.br/gameon", rss_url: "https://www.terra.com.br/gameon/feed" },
  { id: "g1-games", name: "G1 Games", base_url: "https://g1.globo.com/pop-arte/games", rss_url: "https://g1.globo.com/pop-arte/games/index/feed/paged-1.rss" },
  { id: "r7-games", name: "R7 Games", base_url: "https://www.r7.com/games", rss_url: "https://www.r7.com/games/feed/" },
  { id: "tudocelular-jogos", name: "Tudocelular Jogos", base_url: "https://www.tudocelular.com/jogos", rss_url: "https://www.tudocelular.com/jogos/feed/" },
  { id: "hardware-jogos", name: "Hardware.com.br Jogos", base_url: "https://www.hardware.com.br/noticias/jogos", rss_url: "https://www.hardware.com.br/noticias/jogos/feed/" },
  { id: "start-uol-games", name: "Start UOL Games", base_url: "https://www.start.uol.com.br/games", rss_url: "https://www.start.uol.com.br/games/feed" },
  // Foco em plataformas
  { id: "switch-brasil", name: "Switch Brasil", base_url: "https://switch-brasil.com", rss_url: "https://switch-brasil.com/feed/" },
  { id: "psverso", name: "PS Verso", base_url: "https://psverso.com.br", rss_url: "https://psverso.com.br/feed/" },
  { id: "xboxmania", name: "Xbox Mania", base_url: "https://xboxmania.com.br", rss_url: "https://xboxmania.com.br/feed/" },
  { id: "playstationblast", name: "PlayStation Blast", base_url: "https://playstationblast.com.br", rss_url: "https://playstationblast.com.br/feed/" },
];
