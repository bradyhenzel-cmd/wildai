import { useState, useRef, useEffect } from "react";

const STATES = ["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"];

const STATE_COORDS = {
  "Alabama":[32.81,-86.79],"Alaska":[61.37,-152.4],"Arizona":[33.73,-111.43],"Arkansas":[34.97,-92.37],
  "California":[36.12,-119.68],"Colorado":[39.06,-105.31],"Connecticut":[41.6,-72.76],"Delaware":[39.32,-75.51],
  "Florida":[27.77,-81.69],"Georgia":[33.04,-83.64],"Hawaii":[21.09,-157.5],"Idaho":[44.24,-114.48],
  "Illinois":[40.35,-88.99],"Indiana":[39.85,-86.26],"Iowa":[42.01,-93.21],"Kansas":[38.53,-96.73],
  "Kentucky":[37.67,-84.67],"Louisiana":[31.17,-91.87],"Maine":[44.69,-69.38],"Maryland":[39.06,-76.8],
  "Massachusetts":[42.23,-71.53],"Michigan":[43.33,-84.54],"Minnesota":[45.69,-93.9],"Mississippi":[32.74,-89.68],
  "Missouri":[38.46,-92.29],"Montana":[46.92,-110.45],"Nebraska":[41.13,-98.27],"Nevada":[38.31,-117.06],
  "New Hampshire":[43.45,-71.56],"New Jersey":[40.3,-74.52],"New Mexico":[34.84,-106.25],"New York":[42.17,-74.95],
  "North Carolina":[35.63,-79.81],"North Dakota":[47.53,-99.78],"Ohio":[40.39,-82.76],"Oklahoma":[35.57,-96.93],
  "Oregon":[44.57,-122.07],"Pennsylvania":[40.59,-77.21],"Rhode Island":[41.68,-71.51],"South Carolina":[33.86,-80.95],
  "South Dakota":[44.3,-99.44],"Tennessee":[35.75,-86.69],"Texas":[31.05,-97.56],"Utah":[40.15,-111.86],
  "Vermont":[44.05,-72.71],"Virginia":[37.77,-78.17],"Washington":[47.4,-121.49],"West Virginia":[38.49,-80.95],
  "Wisconsin":[44.27,-89.62],"Wyoming":[42.76,-107.3]
};

const SPECIES = [
  { name:"Elk", icon:"🦌", type:"hunting", desc:"Rocky Mountain & Roosevelt" },
  { name:"Whitetail Deer", icon:"🦌", type:"hunting", desc:"Most popular big game" },
  { name:"Mule Deer", icon:"🦌", type:"hunting", desc:"Western terrain specialist" },
  { name:"Turkey", icon:"🦃", type:"hunting", desc:"Spring & fall seasons" },
  { name:"Bear", icon:"🐻", type:"hunting", desc:"Black & grizzly tactics" },
  { name:"Pheasant", icon:"🐦", type:"hunting", desc:"Upland bird classic" },
  { name:"Duck", icon:"🦆", type:"hunting", desc:"Waterfowl hunting" },
  { name:"Antelope", icon:"🦌", type:"hunting", desc:"Speed & open country" },
  { name:"Bass", icon:"🐟", type:"fishing", desc:"Largemouth & smallmouth" },
  { name:"Trout", icon:"🐟", type:"fishing", desc:"Stream & lake tactics" },
  { name:"Walleye", icon:"🐟", type:"fishing", desc:"Northern lakes staple" },
  { name:"Catfish", icon:"🐟", type:"fishing", desc:"Bottom fishing tactics" },
  { name:"Pike", icon:"🐟", type:"fishing", desc:"Aggressive predator" },
  { name:"Salmon", icon:"🐟", type:"fishing", desc:"Pacific & Atlantic runs" },
  { name:"Crappie", icon:"🐟", type:"fishing", desc:"Panfish favorite" },
  { name:"Carp", icon:"🐟", type:"fishing", desc:"Fly & bait fishing" },
];

const DAILY_TIPS = [
  "Scout your hunting area at least 2 weeks before season opens to pattern animal movement.",
  "For trout fishing, match the hatch — observe what insects are on the water before choosing your fly.",
  "Wind direction matters more than scent control products. Always hunt with wind in your face.",
  "Dawn and dusk are peak feeding times for most game animals. Plan your sits accordingly.",
  "Use polarized sunglasses for fishing — they cut glare and let you see fish in shallow water.",
  "Keep a hunting journal. Recording conditions, weather, and sightings will reveal patterns over time.",
  "For elk, bugling is most effective in the first and last week of the rut in September.",
];

const GEAR_CHECKLISTS = {
  "Elk Hunt":{ icon:"🦌", items:["Rifle/bow + ammo/arrows","Hunting license + tags","Topo map + compass","Quality boots (broken in)","Merino base layers","Insulating mid layer","Waterproof outer shell","Blaze orange","Rangefinder","Binoculars 10x42","Bone saw + knife","Game bags (4)","Headlamp + batteries","First aid kit","Emergency shelter","Water filter","High calorie food","Pack (60-80L)","Trekking poles","Satellite communicator"] },
  "Fishing Trip":{ icon:"🎣", items:["Rod + reel","Fishing license","Tackle box","Extra line","Polarized sunglasses","Sun protection","Net","Cooler + ice","Pliers/multi-tool","First aid kit","Water + snacks","Rain gear"] },
  "Turkey Hunt":{ icon:"🦃", items:["Shotgun/bow","Turkey calls (box, slate, mouth)","Hunting license + tags","Camo head to toe","Face mask/paint","Decoys (1-2)","Vest with seat","Boots","Rangefinder","First aid kit"] },
  "Backcountry Hunt":{ icon:"🏔️", items:["Rifle/bow + ammo/arrows","Hunting license + tags","Tent/bivy","Sleeping bag (-20°F rated)","Stove + fuel","Water filter","Bear canister","Extra food (2 days extra)","Solar charger","Satellite communicator (mandatory)","First aid kit","Topo map + compass","Emergency shelter","Trekking poles"] },
  "Duck Hunt":{ icon:"🦆", items:["Shotgun + steel shot","Duck/waterfowl license + stamp","Waders","Decoys (12-36)","Duck calls","Blind/cover","Camo head to toe","Retriever or hand retrieval plan","Life vest","First aid kit"] },
  "Ice Fishing":{ icon:"🧊", items:["Ice auger","Ice fishing rod + reel","Tip-ups","Ice fishing shelter/shanty","Heater + fuel","Ice cleats","Insulated bibs + jacket","Hand warmers","Bait/lures","Bucket + scoop","First aid kit","Ice safety picks"] },
};

const PUBLIC_LANDS = [
  { name:"Flathead National Forest", lat:48.15, lng:-114.2, type:"hunting", state:"Montana", species:["Elk","Bear","Deer"], desc:"6M+ acres of prime big game country" },
  { name:"BLM Missouri Breaks", lat:47.8, lng:-108.5, type:"hunting", state:"Montana", species:["Mule Deer","Antelope"], desc:"Rugged breaks with trophy mule deer" },
  { name:"Flathead Lake", lat:47.87, lng:-114.12, type:"fishing", state:"Montana", species:["Trout","Pike","Bass"], desc:"Largest natural freshwater lake west of Mississippi" },
  { name:"Madison River", lat:45.65, lng:-111.6, type:"fishing", state:"Montana", species:["Trout"], desc:"World-class blue ribbon trout fishery" },
  { name:"Sun River WMA", lat:47.52, lng:-112.8, type:"hunting", state:"Montana", species:["Elk","Deer"], desc:"State WMA with exceptional elk numbers" },
  { name:"Bitterroot National Forest", lat:46.1, lng:-114.3, type:"hunting", state:"Montana", species:["Elk","Deer","Bear"], desc:"Remote wilderness elk hunting" },
  { name:"Bighorn Canyon NRA", lat:45.1, lng:-107.9, type:"fishing", state:"Montana", species:["Walleye","Bass","Trout"], desc:"Outstanding walleye fishery" },
  { name:"Missouri River", lat:47.0, lng:-110.5, type:"fishing", state:"Montana", species:["Trout","Walleye"], desc:"Blue ribbon trout and walleye" },
  { name:"White River NF", lat:39.5, lng:-107.2, type:"hunting", state:"Colorado", species:["Elk","Deer"], desc:"Largest elk herd in North America" },
  { name:"Blue Mesa Reservoir", lat:38.46, lng:-107.3, type:"fishing", state:"Colorado", species:["Trout","Salmon"], desc:"Colorado's largest body of water" },
  { name:"South Platte River", lat:39.4, lng:-105.2, type:"fishing", state:"Colorado", species:["Trout"], desc:"Legendary tailwater fishery" },
  { name:"Gunnison NF", lat:38.7, lng:-107.0, type:"hunting", state:"Colorado", species:["Elk","Deer","Bear"], desc:"Trophy elk unit country" },
  { name:"Spinney Mountain Reservoir", lat:38.9, lng:-105.6, type:"fishing", state:"Colorado", species:["Trout"], desc:"Trophy trout fishing" },
  { name:"Bridger-Teton NF", lat:43.5, lng:-110.5, type:"hunting", state:"Wyoming", species:["Elk","Moose","Bear"], desc:"World-class elk and moose habitat" },
  { name:"Bighorn Lake", lat:44.9, lng:-108.1, type:"fishing", state:"Wyoming", species:["Walleye","Bass","Trout"], desc:"Outstanding walleye and bass fishing" },
  { name:"Shoshone NF", lat:44.2, lng:-109.6, type:"hunting", state:"Wyoming", species:["Elk","Bear","Moose"], desc:"Oldest national forest in the US" },
  { name:"North Platte River", lat:42.1, lng:-106.8, type:"fishing", state:"Wyoming", species:["Trout"], desc:"Blue ribbon brown trout fishery" },
  { name:"Mark Twain NF", lat:37.1, lng:-91.8, type:"hunting", state:"Missouri", species:["Whitetail Deer","Turkey"], desc:"Dense hardwood forest with excellent deer" },
  { name:"Lake of the Ozarks", lat:38.2, lng:-92.6, type:"fishing", state:"Missouri", species:["Bass","Catfish","Crappie"], desc:"Premier bass fishing destination" },
  { name:"Sam Houston NF", lat:30.7, lng:-95.5, type:"hunting", state:"Texas", species:["Whitetail Deer","Turkey"], desc:"East Texas public hunting land" },
  { name:"Lake Fork Reservoir", lat:32.9, lng:-95.6, type:"fishing", state:"Texas", species:["Bass"], desc:"Legendary big bass trophy lake" },
  { name:"Guadalupe River", lat:29.8, lng:-98.1, type:"fishing", state:"Texas", species:["Trout"], desc:"Texas tailwater trout fishery" },
  { name:"Caddo Lake", lat:32.7, lng:-94.0, type:"fishing", state:"Texas", species:["Bass","Catfish","Crappie"], desc:"Mysterious cypress swamp bass fishing" },
  { name:"Allegheny NF", lat:41.7, lng:-79.0, type:"hunting", state:"Pennsylvania", species:["Whitetail Deer","Turkey","Bear"], desc:"Prime PA public hunting ground" },
  { name:"Raystown Lake", lat:40.4, lng:-78.1, type:"fishing", state:"Pennsylvania", species:["Walleye","Bass","Trout"], desc:"PA's largest reservoir" },
  { name:"Delaware River", lat:41.2, lng:-74.9, type:"fishing", state:"Pennsylvania", species:["Trout","Bass","Shad"], desc:"World-class wild brown trout" },
  { name:"Chequamegon NF", lat:45.9, lng:-90.8, type:"hunting", state:"Wisconsin", species:["Whitetail Deer","Bear","Turkey"], desc:"Excellent bear and deer density" },
  { name:"Lake Winnebago", lat:44.0, lng:-88.4, type:"fishing", state:"Wisconsin", species:["Walleye","Perch","Sturgeon"], desc:"Ice fishing sturgeon capital" },
  { name:"Flambeau River", lat:45.7, lng:-90.5, type:"fishing", state:"Wisconsin", species:["Walleye","Bass","Muskie"], desc:"Wild muskie and walleye river" },
  { name:"Tongass NF", lat:57.0, lng:-134.0, type:"hunting", state:"Alaska", species:["Bear","Deer","Moose"], desc:"World's largest national forest" },
  { name:"Kenai River", lat:60.5, lng:-150.8, type:"fishing", state:"Alaska", species:["Salmon","Trout"], desc:"World-famous King Salmon fishery" },
  { name:"Kodiak Island", lat:57.5, lng:-153.5, type:"hunting", state:"Alaska", species:["Bear","Deer"], desc:"Kodiak brown bear paradise" },
  { name:"Bristol Bay", lat:58.7, lng:-157.0, type:"fishing", state:"Alaska", species:["Salmon","Trout"], desc:"Greatest sockeye salmon run on Earth" },
  { name:"Kisatchie NF", lat:31.4, lng:-92.8, type:"hunting", state:"Louisiana", species:["Whitetail Deer","Turkey","Hog"], desc:"Only national forest in Louisiana" },
  { name:"Toledo Bend Reservoir", lat:31.4, lng:-93.6, type:"fishing", state:"Louisiana", species:["Bass","Crappie","Catfish"], desc:"Top 10 bass lake in the US" },
  { name:"Atchafalaya Basin", lat:30.2, lng:-91.7, type:"fishing", state:"Louisiana", species:["Bass","Catfish","Crappie"], desc:"Nation's largest river swamp" },
  { name:"Chattahoochee NF", lat:34.7, lng:-84.1, type:"hunting", state:"Georgia", species:["Whitetail Deer","Turkey","Bear"], desc:"North Georgia mountain hunting" },
  { name:"Lake Lanier", lat:34.2, lng:-83.9, type:"fishing", state:"Georgia", species:["Bass","Striped Bass","Crappie"], desc:"Metro Atlanta's premier fishing lake" },
  { name:"Okefenokee Swamp", lat:30.7, lng:-82.3, type:"fishing", state:"Georgia", species:["Bass","Catfish"], desc:"Blackwater swamp bass fishing" },
  { name:"Ozark NF", lat:35.8, lng:-93.1, type:"hunting", state:"Arkansas", species:["Whitetail Deer","Turkey","Bear"], desc:"Excellent Ozark Mountain deer hunting" },
  { name:"Bull Shoals Lake", lat:36.4, lng:-92.6, type:"fishing", state:"Arkansas", species:["Bass","Walleye","Trout"], desc:"World-class bass and trout fishing" },
  { name:"White River", lat:35.9, lng:-92.0, type:"fishing", state:"Arkansas", species:["Trout"], desc:"Trophy rainbow and brown trout" },
  { name:"Manistee NF", lat:44.0, lng:-85.8, type:"hunting", state:"Michigan", species:["Whitetail Deer","Turkey","Bear"], desc:"Excellent UP deer and turkey hunting" },
  { name:"Lake St. Clair", lat:42.4, lng:-82.7, type:"fishing", state:"Michigan", species:["Walleye","Bass","Muskie"], desc:"Walleye and muskie hotspot" },
  { name:"Au Sable River", lat:44.4, lng:-84.2, type:"fishing", state:"Michigan", species:["Trout"], desc:"Michigan's premier trout stream" },
  { name:"Hoosier NF", lat:38.5, lng:-86.4, type:"hunting", state:"Indiana", species:["Whitetail Deer","Turkey"], desc:"Indiana's only national forest" },
  { name:"Patoka Lake", lat:38.4, lng:-86.7, type:"fishing", state:"Indiana", species:["Bass","Crappie","Catfish"], desc:"Southern Indiana bass fishing" },
  { name:"Ouachita NF", lat:34.6, lng:-93.9, type:"hunting", state:"Arkansas", species:["Whitetail Deer","Turkey","Bear"], desc:"Rugged Ouachita Mountain hunting" },
  { name:"Nantahala NF", lat:35.2, lng:-83.6, type:"hunting", state:"North Carolina", species:["Whitetail Deer","Turkey","Bear"], desc:"Western NC mountain hunting" },
  { name:"Lake Norman", lat:35.6, lng:-80.9, type:"fishing", state:"North Carolina", species:["Bass","Striped Bass","Crappie"], desc:"NC's largest man-made lake" },
  { name:"New River", lat:36.5, lng:-81.0, type:"fishing", state:"North Carolina", species:["Smallmouth Bass","Trout"], desc:"Wild smallmouth bass river" },
  { name:"George Washington NF", lat:38.5, lng:-79.3, type:"hunting", state:"Virginia", species:["Whitetail Deer","Turkey","Bear"], desc:"1.8M acres of Appalachian hunting" },
  { name:"Claytor Lake", lat:37.1, lng:-80.6, type:"fishing", state:"Virginia", species:["Walleye","Bass","Striped Bass"], desc:"Walleye hotspot in SW Virginia" },
  { name:"Deschutes NF", lat:44.0, lng:-121.5, type:"hunting", state:"Oregon", species:["Elk","Deer","Bear"], desc:"Central Oregon elk and deer" },
  { name:"Klamath River", lat:41.9, lng:-123.5, type:"fishing", state:"Oregon", species:["Salmon","Steelhead","Trout"], desc:"Premier steelhead fishery" },
  { name:"Crater Lake", lat:42.9, lng:-122.1, type:"fishing", state:"Oregon", species:["Trout","Salmon"], desc:"Deepest lake in the US — trophy trout" },
  { name:"Okanogan NF", lat:48.5, lng:-119.5, type:"hunting", state:"Washington", species:["Elk","Deer","Bear"], desc:"NE Washington big game country" },
  { name:"Columbia River", lat:46.2, lng:-119.1, type:"fishing", state:"Washington", species:["Salmon","Steelhead","Sturgeon"], desc:"World's greatest salmon river" },
  { name:"Lake Chelan", lat:47.9, lng:-120.0, type:"fishing", state:"Washington", species:["Trout","Salmon"], desc:"Deep glacier lake trophy trout" },
  { name:"Plumas NF", lat:39.9, lng:-121.0, type:"hunting", state:"California", species:["Deer","Bear","Turkey"], desc:"Northern California deer and bear" },
  { name:"Shasta Lake", lat:40.7, lng:-122.4, type:"fishing", state:"California", species:["Bass","Trout","Salmon"], desc:"CA's largest reservoir" },
  { name:"Trinity River", lat:40.7, lng:-123.4, type:"fishing", state:"California", species:["Salmon","Steelhead","Trout"], desc:"Legendary steelhead run" },
  { name:"Kaibab NF", lat:36.7, lng:-112.2, type:"hunting", state:"Arizona", species:["Mule Deer","Elk","Turkey"], desc:"Trophy mule deer and elk" },
  { name:"Lake Powell", lat:37.1, lng:-111.3, type:"fishing", state:"Arizona", species:["Bass","Walleye","Catfish"], desc:"Desert canyon bass fishery" },
  { name:"Verde River", lat:34.5, lng:-111.8, type:"fishing", state:"Arizona", species:["Bass","Catfish","Trout"], desc:"AZ's longest free-flowing river" },
  { name:"Cibola NF", lat:34.8, lng:-106.5, type:"hunting", state:"New Mexico", species:["Elk","Mule Deer","Bear"], desc:"Diverse New Mexico big game" },
  { name:"Elephant Butte Lake", lat:33.1, lng:-107.2, type:"fishing", state:"New Mexico", species:["Bass","Walleye","Catfish"], desc:"NM's largest reservoir" },
  { name:"Sawtooth NF", lat:44.0, lng:-114.8, type:"hunting", state:"Idaho", species:["Elk","Deer","Bear"], desc:"Central Idaho wilderness hunting" },
  { name:"Snake River", lat:43.8, lng:-116.5, type:"fishing", state:"Idaho", species:["Trout","Steelhead","Salmon"], desc:"World-class steelhead and trout" },
  { name:"Clearwater NF", lat:46.5, lng:-115.0, type:"hunting", state:"Idaho", species:["Elk","Deer","Bear"], desc:"Remote elk wilderness" },
  { name:"Huron-Manistee NF", lat:44.3, lng:-85.5, type:"hunting", state:"Michigan", species:["Whitetail Deer","Bear","Turkey"], desc:"Lower Peninsula prime hunting" },
  { name:"Boundary Waters BWCA", lat:48.0, lng:-91.5, type:"fishing", state:"Minnesota", species:["Walleye","Pike","Bass","Trout"], desc:"Million acres of pristine fishing" },
  { name:"Superior NF", lat:47.8, lng:-91.0, type:"hunting", state:"Minnesota", species:["Moose","Bear","Deer"], desc:"Moose and bear country" },
  { name:"Mille Lacs Lake", lat:46.2, lng:-93.6, type:"fishing", state:"Minnesota", species:["Walleye","Bass","Perch"], desc:"Walleye capital of the world" },
  { name:"Red Lake WMA", lat:48.0, lng:-95.0, type:"hunting", state:"Minnesota", species:["Whitetail Deer","Turkey","Waterfowl"], desc:"Northwestern MN waterfowl and deer" },
  { name:"Hiawatha NF", lat:46.1, lng:-86.5, type:"hunting", state:"Michigan", species:["Whitetail Deer","Bear","Turkey"], desc:"Upper Peninsula hunting" },
  { name:"Green River", lat:41.5, lng:-109.5, type:"fishing", state:"Utah", species:["Trout"], desc:"Blue ribbon tailwater trout" },
  { name:"Lake Powell UT", lat:37.0, lng:-110.8, type:"fishing", state:"Utah", species:["Bass","Striped Bass","Walleye"], desc:"Massive canyon bass fishery" },
  { name:"Uinta NF", lat:40.1, lng:-111.2, type:"hunting", state:"Utah", species:["Elk","Mule Deer","Bear"], desc:"Rocky Mountain elk and deer" },
  { name:"Caribou NF", lat:42.8, lng:-111.5, type:"hunting", state:"Idaho", species:["Elk","Mule Deer","Antelope"], desc:"SE Idaho big game" },
  { name:"Chattahoochee NRA", lat:34.0, lng:-84.4, type:"fishing", state:"Georgia", species:["Trout"], desc:"Urban blue ribbon trout fishery" },
  { name:"Lake Texoma", lat:33.8, lng:-96.6, type:"fishing", state:"Texas", species:["Striped Bass","Bass","Catfish"], desc:"Striped bass capital of the world" },
  { name:"Sabine NF", lat:31.4, lng:-93.9, type:"hunting", state:"Texas", species:["Whitetail Deer","Turkey","Hog"], desc:"East Texas national forest" },
  { name:"Daniel Boone NF", lat:37.5, lng:-83.8, type:"hunting", state:"Kentucky", species:["Whitetail Deer","Turkey","Bear"], desc:"Eastern Kentucky mountain hunting" },
  { name:"Kentucky Lake", lat:36.8, lng:-88.2, type:"fishing", state:"Kentucky", species:["Bass","Crappie","Catfish"], desc:"World's largest man-made lake by shoreline" },
  { name:"Cumberland River", lat:36.6, lng:-87.4, type:"fishing", state:"Tennessee", species:["Trout","Bass","Walleye"], desc:"Trophy brown trout tailwater" },
  { name:"Cherokee NF", lat:36.1, lng:-82.5, type:"hunting", state:"Tennessee", species:["Whitetail Deer","Turkey","Bear"], desc:"East Tennessee mountain hunting" },
  { name:"Reelfoot Lake", lat:36.5, lng:-89.4, type:"fishing", state:"Tennessee", species:["Crappie","Bass","Catfish"], desc:"Premier crappie fishing" },
  { name:"Tonto NF", lat:33.8, lng:-111.2, type:"hunting", state:"Arizona", species:["Mule Deer","Elk","Javelina"], desc:"Arizona's largest national forest" },
  { name:"Lake Pleasant", lat:33.8, lng:-112.3, type:"fishing", state:"Arizona", species:["Bass","Striped Bass","Catfish"], desc:"Phoenix metro bass fishing" },
];

const FREE_LIMIT = 5;

// ─── SVG NATURE DECORATIONS ───────────────────────────────────────────────────
const DeerSVG = ({ style: s = {} }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ ...s }}>
    <g opacity="0.08" fill="currentColor">
      <ellipse cx="50" cy="72" rx="22" ry="14"/>
      <rect x="44" y="58" width="5" height="20" rx="2.5"/>
      <rect x="51" y="58" width="5" height="20" rx="2.5"/>
      <rect x="40" y="65" width="4" height="14" rx="2"/>
      <rect x="56" y="65" width="4" height="14" rx="2"/>
      <ellipse cx="50" cy="52" rx="14" ry="10"/>
      <ellipse cx="50" cy="40" rx="8" ry="6"/>
      <path d="M42 36 C40 28 36 20 38 14 C40 10 43 12 44 18 C45 22 44 28 45 32"/>
      <path d="M44 30 C43 26 44 22 46 20 C48 18 49 22 48 26"/>
      <path d="M58 36 C60 28 64 20 62 14 C60 10 57 12 56 18 C55 22 56 28 55 32"/>
      <path d="M56 30 C57 26 56 22 54 20 C52 18 51 22 52 26"/>
      <circle cx="47" cy="38" r="1.5"/>
      <circle cx="53" cy="38" r="1.5"/>
      <ellipse cx="50" cy="44" rx="3" ry="2"/>
    </g>
  </svg>
);

const TreeSVG = ({ style: s = {} }) => (
  <svg viewBox="0 0 70 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ ...s }}>
    <g opacity="0.07" fill="currentColor">
      <polygon points="35,4 6,54 64,54"/>
      <polygon points="35,20 8,66 62,66"/>
      <polygon points="35,38 10,82 60,82"/>
      <rect x="28" y="82" width="14" height="34" rx="2"/>
    </g>
  </svg>
);

const MtnSVG = ({ style: s = {} }) => (
  <svg viewBox="0 0 400 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ ...s }}>
    <g opacity="0.055" fill="currentColor">
      <polygon points="200,4 60,100 340,100"/>
      <polygon points="310,18 220,100 400,100"/>
      <polygon points="90,28 0,100 200,100"/>
      <polygon points="175,8 163,30 187,30" fill="white" opacity="0.5"/>
      <polygon points="305,21 295,38 315,38" fill="white" opacity="0.4"/>
    </g>
  </svg>
);

const FireSVG = ({ style: s = {} }) => (
  <svg viewBox="0 0 60 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ ...s }}>
    <g opacity="0.1">
      <ellipse cx="30" cy="68" rx="18" ry="6" fill="#c17f24"/>
      <path d="M18 68 C16 58 20 50 18 42 C16 34 12 28 16 22 C20 16 26 22 25 32 C24 38 22 44 24 52 C26 58 24 66 22 68Z" fill="#c17f24"/>
      <path d="M42 68 C44 58 40 50 42 42 C44 34 48 28 44 22 C40 16 34 22 35 32 C36 38 38 44 36 52 C34 58 36 66 38 68Z" fill="#c17f24"/>
      <path d="M30 62 C28 52 32 44 30 34 C28 24 24 18 27 13 C30 8 34 14 33 24 C32 32 30 40 32 48 C34 54 32 62 30 62Z" fill="#d4930a"/>
      <path d="M24 56 C22 48 25 42 23 35 C21 28 18 24 20 20 C22 16 26 20 25 27 C24 32 24 38 26 44 C27 48 25 56 24 56Z" fill="#d4930a"/>
      <path d="M36 56 C38 48 35 42 37 35 C39 28 42 24 40 20 C38 16 34 20 35 27 C36 32 36 38 34 44 C33 48 35 56 36 56Z" fill="#d4930a"/>
    </g>
  </svg>
);

// ─── GLOBAL CSS ───────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');
  * { box-sizing:border-box; margin:0; padding:0; }
  :root {
    --bg:#080f08; --bg2:#0d1a0d;
    --card:rgba(255,255,255,0.03); --card-hover:rgba(255,255,255,0.06);
    --border:rgba(255,255,255,0.07); --border-accent:rgba(120,180,80,0.25);
    --green:#78b450; --green2:#5a9a32; --green-dim:rgba(120,180,80,0.12);
    --amber:#d4930a; --amber-dim:rgba(212,147,10,0.12);
    --text:#eef5e8; --text2:rgba(238,245,232,0.6); --text3:rgba(238,245,232,0.35);
    --font-display:'Playfair Display',Georgia,serif;
    --font-body:'DM Sans',system-ui,sans-serif;
    --radius:16px; --radius-sm:10px;
  }
  body { background:var(--bg); color:var(--text); font-family:var(--font-body); }
  .grain { position:fixed; inset:0; pointer-events:none; z-index:100; opacity:0.025;
    background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size:180px; }
  .fade-in { animation:fadeIn 0.4s ease forwards; }
  @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  .slide-up { animation:slideUp 0.55s cubic-bezier(0.16,1,0.3,1) forwards; opacity:0; }
  @keyframes slideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  .pulse { animation:pulse 2.2s ease-in-out infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
  .float { animation:float 5s ease-in-out infinite; }
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  .btn-primary { background:linear-gradient(135deg,var(--green),var(--green2)); color:white; border:none;
    border-radius:var(--radius-sm); font-family:var(--font-body); font-weight:600; cursor:pointer;
    transition:all 0.2s; box-shadow:0 4px 20px rgba(120,180,80,0.3); }
  .btn-primary:hover { transform:translateY(-1px); box-shadow:0 8px 28px rgba(120,180,80,0.4); }
  .btn-ghost { background:var(--card); border:1px solid var(--border); color:var(--text2);
    border-radius:var(--radius-sm); font-family:var(--font-body); cursor:pointer; transition:all 0.2s; }
  .btn-ghost:hover { background:var(--card-hover); border-color:var(--border-accent); color:var(--text); }
  .card { background:var(--card); border:1px solid var(--border); border-radius:var(--radius); transition:all 0.2s; }
  .card:hover { background:var(--card-hover); border-color:var(--border-accent); }
  .tag { display:inline-flex; align-items:center; padding:3px 10px; border-radius:20px;
    font-size:11px; font-weight:600; letter-spacing:0.04em; text-transform:uppercase; }
  .tag-hunt { background:rgba(212,147,10,0.15); color:var(--amber); border:1px solid rgba(212,147,10,0.2); }
  .tag-fish { background:rgba(80,140,220,0.15); color:#7ab0e0; border:1px solid rgba(80,140,220,0.2); }
  select,input { font-family:var(--font-body); background:rgba(255,255,255,0.04);
    border:1px solid var(--border); color:var(--text); outline:none; transition:border-color 0.2s; }
  select:focus,input:focus { border-color:var(--border-accent); }
  select option { background:#1a2e1a; }
  ::-webkit-scrollbar { width:4px; }
  ::-webkit-scrollbar-thumb { background:rgba(120,180,80,0.2); border-radius:4px; }
  .nav-tab { padding:8px 18px; border-radius:30px; font-size:13px; font-weight:500;
    cursor:pointer; transition:all 0.2s; border:1px solid transparent;
    font-family:var(--font-body); white-space:nowrap; }
  .nav-tab.active { background:linear-gradient(135deg,var(--green),var(--green2)); color:white; box-shadow:0 4px 16px rgba(120,180,80,0.25); }
  .nav-tab.inactive { background:var(--card); border-color:var(--border); color:var(--text3); }
  .nav-tab.inactive:hover { color:var(--text2); border-color:var(--border-accent); background:var(--card-hover); }
  .msg-bubble { line-height:1.75; font-size:14px; }
  .msg-bubble strong { color:var(--green); font-weight:600; }
  .checklist-item { display:flex; align-items:center; gap:12px; padding:11px 16px;
    border-radius:var(--radius-sm); background:rgba(255,255,255,0.03); border:1px solid var(--border);
    color:var(--text2); font-size:14px; cursor:pointer; transition:all 0.15s; user-select:none; }
  .checklist-item:hover { background:var(--green-dim); border-color:var(--border-accent); color:var(--text); }
  .checklist-item.checked { background:var(--green-dim); border-color:rgba(120,180,80,0.3); color:var(--green); text-decoration:line-through; opacity:0.6; }
  .weather-stat { display:flex; flex-direction:column; align-items:center; gap:4px; padding:16px; flex:1;
    background:rgba(255,255,255,0.03); border-radius:var(--radius-sm); border:1px solid var(--border); }
  #wildai-map { height:380px; width:100%; }
  .leaflet-container { background:#0d1a0d !important; }
  .leaflet-tile { filter:brightness(0.55) saturate(0.45) hue-rotate(55deg) !important; }
  .custom-marker { background:none !important; border:none !important; }
`;

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function TypewriterText({ text, onDone }) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    setDisplayed(""); let i = 0;
    const iv = setInterval(() => {
      if (i < text.length) { setDisplayed(text.slice(0, i + 1)); i++; }
      else { clearInterval(iv); onDone?.(); }
    }, 7);
    return () => clearInterval(iv);
  }, [text]);
  return <span className="msg-bubble" dangerouslySetInnerHTML={{ __html: displayed.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>").replace(/\n/g,"<br/>") }} />;
}
const fmtMsg = (t) => <span className="msg-bubble" dangerouslySetInnerHTML={{ __html: t.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>").replace(/\n/g,"<br/>") }} />;

// ─── WEATHER ──────────────────────────────────────────────────────────────────
function WeatherWidget({ selectedState }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    const c = STATE_COORDS[selectedState]; if (!c) return;
    setLoading(true); setError(null);
    try {
      const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${c[0]}&longitude=${c[1]}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,precipitation&wind_speed_unit=mph&temperature_unit=fahrenheit&timezone=auto`);
      const d = await r.json(); if (d.current) setWeather(d.current);
    } catch { setError("Unable to load weather."); }
    setLoading(false);
  };
  useEffect(() => { if (selectedState) load(); }, [selectedState]);

  const wxIcon = (c) => { if(!c)return"🌤️"; if(c===0)return"☀️"; if(c<=3)return"⛅"; if(c<=48)return"🌫️"; if(c<=67)return"🌧️"; if(c<=77)return"❄️"; if(c<=82)return"🌦️"; return"⛈️"; };
  const cond = (w) => {
    if (!w) return null;
    if (w.precipitation>0.1) return {label:"Rain/Snow — Great for tracking!",color:"var(--green)"};
    if (w.wind_speed_10m<10&&w.temperature_2m<50&&w.temperature_2m>20) return {label:"Excellent hunting conditions",color:"var(--green)"};
    if (w.wind_speed_10m>20) return {label:"High wind — animals bedded down",color:"var(--amber)"};
    if (w.temperature_2m>70) return {label:"Warm — animals moving at night",color:"var(--amber)"};
    return {label:"Fair conditions",color:"var(--text2)"};
  };

  if (!selectedState) return (
    <div className="card" style={{padding:32,textAlign:"center"}}>
      <div style={{fontSize:40,marginBottom:12}}>🌤️</div>
      <div style={{color:"var(--text2)",fontSize:14}}>Select your state on the home screen for live weather</div>
    </div>
  );
  const c2 = weather ? cond(weather) : null;
  return (
    <div className="card fade-in" style={{padding:24}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <div style={{color:"var(--text3)",fontSize:11,fontWeight:700,letterSpacing:"0.08em",marginBottom:4}}>LIVE WEATHER</div>
          <div style={{color:"var(--text)",fontWeight:600,fontSize:16}}>{selectedState}</div>
        </div>
        <button onClick={load} className="btn-ghost" style={{padding:"7px 14px",fontSize:12}}>↻ Refresh</button>
      </div>
      {loading && <div style={{textAlign:"center",padding:30,color:"var(--text3)",fontSize:13}} className="pulse">Loading weather...</div>}
      {error && <div style={{color:"var(--amber)",fontSize:13,padding:16,textAlign:"center"}}>{error}</div>}
      {weather && !loading && <>
        <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:20}}>
          <span style={{fontSize:56}}>{wxIcon(weather.weather_code)}</span>
          <div>
            <div style={{fontFamily:"var(--font-display)",fontSize:48,fontWeight:700,color:"var(--text)",lineHeight:1}}>{Math.round(weather.temperature_2m)}°F</div>
            <div style={{color:"var(--text3)",fontSize:13,marginTop:4}}>Current conditions · {selectedState}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginBottom:16}}>
          {[["💧",`${weather.relative_humidity_2m}%`,"Humidity"],["💨",`${Math.round(weather.wind_speed_10m)} mph`,"Wind"],["🌧️",`${weather.precipitation}"`,"Precip"]].map(([ic,val,lbl],i)=>(
            <div key={i} className="weather-stat">
              <span style={{fontSize:20}}>{ic}</span>
              <span style={{color:"var(--text)",fontWeight:600,fontSize:15}}>{val}</span>
              <span style={{color:"var(--text3)",fontSize:11}}>{lbl}</span>
            </div>
          ))}
        </div>
        {c2 && <div style={{padding:"12px 16px",borderRadius:"var(--radius-sm)",background:"rgba(255,255,255,0.03)",border:"1px solid var(--border)"}}>
          <span style={{color:c2.color,fontSize:13,fontWeight:500}}>🎯 {c2.label}</span>
        </div>}
      </>}
    </div>
  );
}

// ─── MAP TAB ──────────────────────────────────────────────────────────────────
function MapTab({ selectedState }) {
  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const markers = useRef([]);
  const [filter, setFilter] = useState("all");
  const [leafletReady, setLeafletReady] = useState(false);
  const [selected, setSelected] = useState(null);

  const lands = PUBLIC_LANDS.filter(l => {
    const stOk = !selectedState || l.state === selectedState;
    const tOk = filter === "all" || l.type === filter;
    return stOk && tOk;
  });

  useEffect(() => {
    if (window.L) { setLeafletReady(true); return; }
    const lnk = document.createElement("link");
    lnk.rel = "stylesheet"; lnk.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(lnk);
    const sc = document.createElement("script");
    sc.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    sc.onload = () => setLeafletReady(true);
    document.head.appendChild(sc);
  }, []);

  useEffect(() => {
    if (!leafletReady || !mapRef.current) return;
    const L = window.L;
    if (mapInst.current) { mapInst.current.remove(); mapInst.current = null; }

    const center = selectedState && STATE_COORDS[selectedState] ? STATE_COORDS[selectedState] : [39.5, -98.35];
    const zoom = selectedState ? 7 : 4;
    const map = L.map(mapRef.current, { zoomControl:true, scrollWheelZoom:true }).setView(center, zoom);
    mapInst.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:"© OpenStreetMap", maxZoom:18
    }).addTo(map);

    markers.current.forEach(m => m.remove());
    markers.current = [];

    lands.forEach(loc => {
      const color = loc.type === "hunting" ? "#d4930a" : "#4a90d9";
      const em = loc.type === "hunting" ? "🎯" : "🎣";
      const icon = L.divIcon({
        className:"custom-marker",
        html:`<div style="width:38px;height:38px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:2px solid rgba(255,255,255,0.35);display:flex;align-items:center;justify-content:center;box-shadow:0 6px 16px rgba(0,0,0,0.5);cursor:pointer;transition:transform 0.2s"><span style="transform:rotate(45deg);font-size:17px;display:block">${em}</span></div>`,
        iconSize:[38,38], iconAnchor:[19,38]
      });
      const m = L.marker([loc.lat, loc.lng], { icon }).addTo(map)
        .bindPopup(`<div style="font-family:'DM Sans',sans-serif;min-width:210px;padding:6px 2px">
          <div style="font-weight:700;font-size:14px;margin-bottom:5px;color:#111">${loc.name}</div>
          <div style="font-size:12px;color:#555;margin-bottom:8px;line-height:1.5">${loc.desc}</div>
          <div style="display:flex;flex-wrap:wrap;gap:4px">${loc.species.map(s=>`<span style="background:${loc.type==="hunting"?"#fff3d6":"#ddefff"};color:${loc.type==="hunting"?"#8a5a00":"#2060a0"};padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600">${s}</span>`).join("")}</div>
          <div style="font-size:11px;color:#888;margin-top:6px">📍 ${loc.state}</div>
        </div>`, { maxWidth:250 })
        .on("click", () => setSelected(loc));
      markers.current.push(m);
    });

    return () => { if (mapInst.current) { mapInst.current.remove(); mapInst.current = null; } };
  }, [leafletReady, selectedState, filter]);

  return (
    <div className="fade-in" style={{display:"flex",flexDirection:"column",gap:14}}>
      <div className="card" style={{padding:"14px 18px"}}>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
          <span style={{color:"var(--text3)",fontSize:12,fontWeight:600,letterSpacing:"0.06em"}}>SHOW:</span>
          {["all","hunting","fishing"].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} className={`nav-tab ${filter===f?"active":"inactive"}`} style={{padding:"6px 16px",fontSize:12}}>
              {f==="all"?"🗺️ All":f==="hunting"?"🎯 Hunting":"🎣 Fishing"}
            </button>
          ))}
          <span style={{color:"var(--text3)",fontSize:12,marginLeft:"auto"}}>{lands.length} locations</span>
        </div>
      </div>

      <div className="card" style={{overflow:"hidden",padding:0}}>
        <div style={{padding:"12px 18px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <span style={{fontSize:16}}>🗺️</span>
          <span style={{color:"var(--text)",fontWeight:600,fontSize:14}}>Public Hunting & Fishing Lands</span>
          {selectedState && <span style={{color:"var(--text3)",fontSize:13}}>· {selectedState}</span>}
          <div style={{display:"flex",gap:12,marginLeft:"auto"}}>
            <div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:10,height:10,borderRadius:"50%",background:"var(--amber)"}}/><span style={{color:"var(--text3)",fontSize:11}}>Hunting</span></div>
            <div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:10,height:10,borderRadius:"50%",background:"#4a90d9"}}/><span style={{color:"var(--text3)",fontSize:11}}>Fishing</span></div>
          </div>
        </div>
        {!leafletReady && <div style={{height:380,display:"flex",alignItems:"center",justifyContent:"center",background:"#0d1a0d"}}><div style={{color:"var(--text3)",fontSize:13}} className="pulse">Loading map...</div></div>}
        <div ref={mapRef} id="wildai-map" style={{display:leafletReady?"block":"none"}}/>
      </div>

      {selected && (
        <div className="card fade-in" style={{padding:"18px 20px",display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,flexWrap:"wrap"}}>
              <span style={{color:"var(--text)",fontWeight:700,fontSize:15}}>{selected.name}</span>
              <span className={`tag tag-${selected.type==="hunting"?"hunt":"fish"}`}>{selected.type}</span>
              {selected.state && <span style={{color:"var(--text3)",fontSize:12}}>· {selected.state}</span>}
            </div>
            <div style={{color:"var(--text2)",fontSize:13,marginBottom:10}}>{selected.desc}</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {selected.species.map(s=><span key={s} style={{background:"var(--green-dim)",border:"1px solid var(--border-accent)",color:"var(--green)",padding:"2px 10px",borderRadius:20,fontSize:11,fontWeight:600}}>{s}</span>)}
            </div>
          </div>
          <button onClick={()=>setSelected(null)} className="btn-ghost" style={{padding:"6px 12px",fontSize:12,flexShrink:0}}>✕</button>
        </div>
      )}
      <div style={{color:"var(--text3)",fontSize:11,textAlign:"center"}}>💡 Click any pin for details · Always verify local access and regulations before visiting</div>
    </div>
  );
}

// ─── REGULATIONS TAB ──────────────────────────────────────────────────────────
function RegulationsTab({ selectedState }) {
  const [regs, setRegs] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    if (!selectedState) return;
    setLoading(true); setRegs(null); setError(null);
    try {
      const res = await fetch("https://wildai-server.onrender.com/regulations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: selectedState })
      });
      const d = await res.json();
      if (d.regulations) setRegs(d.regulations);
      else setError("Could not generate regulations. Please try again.");
    } catch { setError("Connection error. Please try again."); }
    setLoading(false);
  };

  useEffect(() => { if (selectedState) load(); }, [selectedState]);

  if (!selectedState) return (
    <div className="card" style={{padding:40,textAlign:"center"}}>
      <div style={{fontSize:48,marginBottom:16}}>📋</div>
      <div style={{color:"var(--text)",fontWeight:700,fontSize:18,marginBottom:8}}>Select Your State</div>
      <div style={{color:"var(--text2)",fontSize:14}}>Go back home and choose your state to view AI-generated regulations.</div>
    </div>
  );

  return (
    <div className="fade-in" style={{display:"flex",flexDirection:"column",gap:14}}>
      <div className="card" style={{padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{color:"var(--text3)",fontSize:11,fontWeight:700,letterSpacing:"0.08em",marginBottom:4}}>AI-GENERATED REGULATIONS</div>
          <div style={{color:"var(--text)",fontWeight:600,fontSize:16}}>{selectedState}</div>
        </div>
        <button onClick={load} className="btn-ghost" style={{padding:"8px 16px",fontSize:13}}>↻ Refresh</button>
      </div>

      {loading && (
        <div className="card" style={{padding:48,textAlign:"center"}}>
          <div style={{fontSize:44,marginBottom:16}} className="float">📋</div>
          <div style={{color:"var(--text2)",fontSize:14}} className="pulse">Generating {selectedState} regulations...</div>
          <div style={{color:"var(--text3)",fontSize:12,marginTop:8}}>Powered by AI · Takes a few seconds</div>
        </div>
      )}
      {error && (
        <div className="card" style={{padding:24,textAlign:"center"}}>
          <div style={{color:"var(--amber)",fontSize:14,marginBottom:12}}>{error}</div>
          <button onClick={load} className="btn-primary" style={{padding:"10px 24px",fontSize:14}}>Try Again</button>
        </div>
      )}
      {regs && !loading && (
        <div className="card fade-in" style={{padding:28}}>
          <div className="msg-bubble" style={{lineHeight:1.8}} dangerouslySetInnerHTML={{ __html: regs
  .replace(/^### (.*?)$/gm, "<h4 style='color:var(--green);margin:16px 0 8px;font-size:14px;font-weight:700'>$1</h4>")
  .replace(/^## (.*?)$/gm, "<h3 style='color:var(--text);margin:20px 0 10px;font-size:16px;font-weight:700'>$1</h3>")
  .replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>")
  .replace(/\n\n/g,"</p><p style='margin-top:14px'>")
  .replace(/\n/g,"<br/>")
}}/>
        </div>
      )}
      <div style={{padding:"16px 20px",background:"var(--amber-dim)",border:"1px solid rgba(212,147,10,0.2)",borderRadius:"var(--radius)"}}>
        <p style={{color:"rgba(212,147,10,0.9)",fontSize:13,lineHeight:1.7}}>⚠️ <strong>Important:</strong> Regulations change annually. Always verify with your state's official wildlife agency before hunting or fishing. Penalties for violations can be severe.</p>
      </div>
    </div>
  );
}

// ─── TERMS PAGE ───────────────────────────────────────────────────────────────
function TermsPage({ onBack }) {
  const sections = [
    ["1. Acceptance of Terms","By accessing or using WildAI, you agree to be bound by these Terms and Conditions. WildAI reserves the right to update these terms at any time, and continued use constitutes acceptance of any changes."],
    ["2. Nature of Service","WildAI is an AI-powered informational assistant for hunters and anglers. It is not a licensed guide, outfitter, or wildlife agency. All information is for general educational purposes only."],
    ["3. Regulatory Disclaimer","Hunting and fishing regulations change frequently. WildAI makes no guarantee that information on seasons, bag limits, or license requirements is current. You are solely responsible for verifying regulations with your state wildlife agency."],
    ["4. Accuracy of Information","WildAI strives to provide accurate information but may make errors or provide outdated advice. Always apply your own judgment and consult licensed professionals for decisions involving safety or legality."],
    ["5. Safety and Personal Responsibility","Hunting and fishing involve inherent risks. WildAI accepts no liability for any injury, death, or loss resulting from acting on information provided. Users engage in all outdoor activities at their own risk."],
    ["6. Free Tier and Paid Services","WildAI offers limited free messages per session. Additional use may require a paid subscription. WildAI reserves the right to modify or discontinue any tier of service with reasonable notice."],
    ["7. User Conduct","You agree not to use WildAI to facilitate illegal hunting or fishing, poaching, or violations of wildlife protection laws. WildAI may terminate access for users who violate these terms."],
    ["8. Intellectual Property","All content, design, and functionality of WildAI is protected by applicable intellectual property laws. Reproduction without express written permission is prohibited."],
    ["9. Limitation of Liability","To the fullest extent permitted by law, WildAI and its affiliates shall not be liable for any direct, indirect, or consequential damages arising from use of the service."],
    ["10. Contact","Questions about these Terms may be directed to WildAI through the website. We respond to reasonable inquiries in a timely manner."],
  ];
  return (
    <div style={{minHeight:"100vh",background:"var(--bg)",fontFamily:"var(--font-body)"}}>
      <nav style={{padding:"20px 32px",display:"flex",alignItems:"center",gap:16,borderBottom:"1px solid var(--border)"}}>
        <button onClick={onBack} className="btn-ghost" style={{padding:"8px 16px",fontSize:13}}>← Back</button>
        <span style={{fontFamily:"var(--font-display)",fontSize:18,color:"var(--text)"}}>WildAI · Terms & Conditions</span>
      </nav>
      <div style={{maxWidth:720,margin:"0 auto",padding:"48px 24px"}}>
        <h1 style={{fontFamily:"var(--font-display)",fontSize:36,fontWeight:900,color:"var(--text)",marginBottom:8}}>Terms & Conditions</h1>
        <p style={{color:"var(--text3)",fontSize:13,marginBottom:40}}>Last updated: {new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}</p>
        {sections.map(([title,body],i)=>(
          <div key={i} style={{marginBottom:32}}>
            <h2 style={{fontFamily:"var(--font-display)",fontSize:20,fontWeight:700,color:"var(--text)",marginBottom:10}}>{title}</h2>
            <p style={{color:"var(--text2)",fontSize:15,lineHeight:1.8}}>{body}</p>
          </div>
        ))}
        <div style={{marginTop:40,padding:"20px 24px",background:"var(--green-dim)",border:"1px solid var(--border-accent)",borderRadius:"var(--radius)"}}>
          <p style={{color:"var(--green)",fontSize:14,lineHeight:1.7}}>🦌 Always check your state's current hunting and fishing regulations before heading out. Your state wildlife agency is the definitive source.</p>
        </div>
        <button onClick={onBack} className="btn-primary" style={{marginTop:36,padding:"14px 32px",fontSize:15}}>← Back to WildAI</button>
      </div>
    </div>
  );
}

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────
function LandingPage({ onStart, selectedState, setSelectedState, onTerms }) {
  const tip = DAILY_TIPS[new Date().getDay() % DAILY_TIPS.length];
  const features = [
    {icon:"🎯",title:"Hunting Tactics",desc:"Species-specific strategies, scouting tips, rut timing"},
    {icon:"🎣",title:"Fishing Intel",desc:"Seasonal patterns, lure selection, hotspot guidance"},
    {icon:"🗺️",title:"Interactive Map",desc:"Real public land & fishing access map with pins"},
    {icon:"📋",title:"Live Regulations",desc:"AI-generated state-specific rules & season dates"},
    {icon:"🌤️",title:"Live Weather",desc:"Real conditions with hunting/fishing impact ratings"},
    {icon:"🎒",title:"Gear Checklists",desc:"Interactive pack lists — tap to check items off"},
  ];
  return (
    <div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",flexDirection:"column",fontFamily:"var(--font-body)",position:"relative",overflow:"hidden"}}>
      {/* Decorative background */}
      <div style={{position:"fixed",inset:0,pointerEvents:"none",overflow:"hidden"}}>
        <div style={{position:"absolute",top:"-15%",right:"-5%",width:700,height:700,borderRadius:"50%",background:"radial-gradient(circle,rgba(120,180,80,0.055) 0%,transparent 70%)"}}/>
        <div style={{position:"absolute",bottom:"-10%",left:"-10%",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(90,154,50,0.04) 0%,transparent 70%)"}}/>
        <DeerSVG style={{position:"absolute",right:"4%",top:"10%",width:200,height:170,color:"var(--green)"}}/>
        <DeerSVG style={{position:"absolute",left:"2%",bottom:"22%",width:130,height:110,color:"var(--green)",transform:"scaleX(-1)"}}/>
        <TreeSVG style={{position:"absolute",left:"7%",top:"8%",width:65,height:110,color:"var(--green)"}}/>
        <TreeSVG style={{position:"absolute",left:"12%",top:"13%",width:48,height:80,color:"var(--green)"}}/>
        <TreeSVG style={{position:"absolute",right:"14%",bottom:"6%",width:72,height:118,color:"var(--green)"}}/>
        <TreeSVG style={{position:"absolute",right:"20%",bottom:"2%",width:52,height:88,color:"var(--green)"}}/>
        <MtnSVG style={{position:"absolute",bottom:0,left:0,width:"100%",height:100,color:"var(--green)"}}/>
        <FireSVG style={{position:"absolute",left:"47%",bottom:"14%",width:90,height:80}}/>
        <div style={{position:"absolute",top:"33%",left:"24%",width:1,height:260,background:"linear-gradient(to bottom,transparent,rgba(120,180,80,0.1),transparent)"}}/>
      </div>

      {/* Nav */}
      <nav style={{padding:"18px 32px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid var(--border)",backdropFilter:"blur(12px)",position:"sticky",top:0,zIndex:50,background:"rgba(8,15,8,0.86)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:24}} className="float">🦌</span>
          <span style={{fontFamily:"var(--font-display)",fontSize:22,fontWeight:700,color:"var(--text)",letterSpacing:"-0.5px"}}>WildAI</span>
        </div>
        <div style={{display:"flex",gap:12,alignItems:"center"}}>
          <button onClick={onTerms} className="btn-ghost" style={{padding:"8px 16px",fontSize:13}}>Terms</button>
          <button onClick={onStart} className="btn-primary" style={{padding:"9px 22px",fontSize:14}}>Launch App →</button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",padding:"80px 24px 110px",textAlign:"center",position:"relative",zIndex:1}}>
        <div className="slide-up" style={{animationDelay:"0.05s"}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"var(--green-dim)",border:"1px solid var(--border-accent)",borderRadius:30,padding:"6px 16px",marginBottom:28}}>
            <span style={{width:6,height:6,borderRadius:"50%",background:"var(--green)",display:"inline-block"}} className="pulse"/>
            <span style={{color:"var(--green)",fontSize:12,fontWeight:600,letterSpacing:"0.06em"}}>POWERED BY AI · FREE TO TRY</span>
          </div>
        </div>
        <div className="slide-up" style={{animationDelay:"0.1s"}}>
          <h1 style={{fontFamily:"var(--font-display)",fontSize:"clamp(44px,8vw,86px)",fontWeight:900,lineHeight:1.0,color:"var(--text)",letterSpacing:"-3px",marginBottom:24,maxWidth:820}}>
            Your Expert<br/>
            <span style={{color:"var(--green)"}}>Hunting & Fishing</span><br/>
            Assistant
          </h1>
        </div>
        <div className="slide-up" style={{animationDelay:"0.15s"}}>
          <p style={{color:"var(--text2)",fontSize:18,maxWidth:500,lineHeight:1.7,marginBottom:40}}>Instant answers on gear, tactics, regulations, and trip planning — like having a seasoned guide in your pocket.</p>
        </div>
        <div className="slide-up card" style={{animationDelay:"0.2s",maxWidth:540,width:"100%",padding:"18px 24px",marginBottom:36,textAlign:"left",borderColor:"var(--border-accent)"}}>
          <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
            <span style={{fontSize:18}}>💡</span>
            <div>
              <div style={{color:"var(--green)",fontSize:10,fontWeight:700,letterSpacing:"0.1em",marginBottom:6}}>TIP OF THE DAY</div>
              <div style={{color:"var(--text2)",fontSize:14,lineHeight:1.65}}>{tip}</div>
            </div>
          </div>
        </div>
        <div className="slide-up" style={{animationDelay:"0.25s",width:"100%",maxWidth:420,marginBottom:20}}>
          <label style={{color:"var(--text3)",fontSize:12,fontWeight:500,letterSpacing:"0.06em",display:"block",marginBottom:8,textAlign:"left"}}>YOUR STATE (for accurate regulations)</label>
          <select value={selectedState} onChange={e=>setSelectedState(e.target.value)} style={{width:"100%",padding:"14px 18px",borderRadius:"var(--radius-sm)",fontSize:15,marginBottom:14}}>
            <option value="">Select your state...</option>
            {STATES.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={onStart} className="btn-primary" style={{width:"100%",padding:16,fontSize:16,borderRadius:"var(--radius)"}}>Start Asking WildAI →</button>
          <p style={{color:"var(--text3)",fontSize:12,marginTop:10,textAlign:"center"}}>No account needed · 5 free messages</p>
        </div>
        <div className="slide-up" style={{animationDelay:"0.3s",width:"100%",maxWidth:760,marginTop:60}}>
          <div style={{color:"var(--text3)",fontSize:11,fontWeight:700,letterSpacing:"0.1em",marginBottom:20}}>EVERYTHING YOU NEED IN THE FIELD</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12}}>
            {features.map((f,i)=>(
              <div key={i} className="card" style={{padding:20,textAlign:"left"}}>
                <div style={{fontSize:26,marginBottom:10}}>{f.icon}</div>
                <div style={{color:"var(--text)",fontWeight:600,fontSize:14,marginBottom:4}}>{f.title}</div>
                <div style={{color:"var(--text3)",fontSize:12,lineHeight:1.5}}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer style={{borderTop:"1px solid var(--border)",padding:"18px 32px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12,position:"relative",zIndex:1}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span>🦌</span>
          <span style={{fontFamily:"var(--font-display)",fontSize:15,color:"var(--text2)"}}>WildAI</span>
        </div>
        <div style={{display:"flex",gap:20}}>
          <button onClick={onTerms} style={{background:"none",border:"none",color:"var(--text3)",fontSize:12,cursor:"pointer",fontFamily:"var(--font-body)"}}>Terms & Conditions</button>
          <span style={{color:"var(--text3)",fontSize:12}}>Always verify regulations with your state agency</span>
        </div>
      </footer>
    </div>
  );
}

// ─── CHAT PAGE ────────────────────────────────────────────────────────────────
function ChatPage({ onBack, messageCount, setMessageCount, selectedState, onTerms }) {
  const [tab, setTab] = useState("chat");
  const [messages, setMessages] = useState([
    { role:"assistant", content:`Hey, I'm WildAI — your hunting and fishing assistant${selectedState?` for ${selectedState}`:""}. Ask me anything about gear, tactics, seasons, regulations, or trip planning. What are you after?`, animate:false },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [checkedItems, setCheckedItems] = useState({});
  const [speciesFilter, setSpeciesFilter] = useState("all");
  const bottomRef = useRef(null);
  const isPro = localStorage.getItem("wildai_pro") === "true";
  const hitLimit = !isPro && messageCount >= FREE_LIMIT;

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, loading]);

  const sendMessage = async (text) => {
    const msg = text || input;
    if (!msg.trim() || hitLimit) return;
    const newMsgs = [...messages, { role:"user", content:msg, animate:false }];
    setMessages(newMsgs); setInput(""); setLoading(true); 
    const newCount = messageCount + 1;
setMessageCount(newCount);
localStorage.setItem("wildai_message_count", newCount);
    if (tab !== "chat") setTab("chat");
    const now = new Date();
const moonPhase = () => {
  const synodicMonth = 29.53058867;
  const known = new Date(2000, 0, 6, 18, 14, 0);
  const diff = (now - known) / (1000 * 60 * 60 * 24);
  const phase = ((diff % synodicMonth) + synodicMonth) % synodicMonth;
  if (phase < 1.85) return "New Moon 🌑";
  if (phase < 5.53) return "Waxing Crescent 🌒";
  if (phase < 9.22) return "First Quarter 🌓";
  if (phase < 12.91) return "Waxing Gibbous 🌔";
  if (phase < 16.61) return "Full Moon 🌕";
  if (phase < 20.30) return "Waning Gibbous 🌖";
  if (phase < 23.99) return "Last Quarter 🌗";
  if (phase < 27.68) return "Waning Crescent 🌘";
  return "New Moon 🌑";
};
const timeOfDay = now.getHours() < 12 ? "morning" : now.getHours() < 17 ? "afternoon" : "evening";
const system = `You are WildAI, an expert hunting and fishing assistant${selectedState?` specializing in ${selectedState}`:""}. Deep knowledge of hunting tactics, fishing techniques, gear, wildlife behavior, seasons, regulations${selectedState?` specific to ${selectedState}`:" across US states"}, trip planning, and public land navigation. Give practical, specific, confident advice like a seasoned outdoorsman. Use **bold** for key terms. Keep responses concise and useful. Remind users to verify regulations with their state agency when relevant.

CURRENT CONTEXT (use this for accurate seasonal and timing advice):
- Today's date: ${now.toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}
- Time of day: ${timeOfDay}
- Current moon phase: ${moonPhase()}
- User's state: ${selectedState || "not specified"}
- Season: ${["Winter","Winter","Spring","Spring","Spring","Summer","Summer","Summer","Fall","Fall","Fall","Winter"][now.getMonth()]}`;
    try {
      const res = await fetch("https://wildai-server.onrender.com/chat", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ messages:newMsgs.map(m=>({role:m.role,content:m.content})), system })
      });
      const d = await res.json();
      setMessages([...newMsgs, { role:"assistant", content:d.reply, animate:true }]);
    } catch {
      setMessages([...newMsgs, { role:"assistant", content:"Sorry, I had trouble connecting. Please try again.", animate:false }]);
    }
    setLoading(false);
  };

  const toggleCheck = (cl, item) => {
    const k = `${cl}::${item}`;
    setCheckedItems(p => ({ ...p, [k]: !p[k] }));
  };

  const tabs = [
    {id:"chat",label:"💬 Chat"},{id:"weather",label:"🌤️ Weather"},
    {id:"map",label:"🗺️ Map"},{id:"regs",label:"📋 Regulations"},
    {id:"species",label:"🎯 Species"},{id:"gear",label:"🎒 Gear"},{id:"about",label:"ℹ️ About"},
  ];
  const filteredSpecies = speciesFilter==="all" ? SPECIES : SPECIES.filter(s=>s.type===speciesFilter);

  return (
    <div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",flexDirection:"column",fontFamily:"var(--font-body)"}}>
      <div style={{position:"fixed",inset:0,pointerEvents:"none",overflow:"hidden",zIndex:0}}>
        <DeerSVG style={{position:"absolute",right:"1%",bottom:"8%",width:170,height:140,color:"var(--green)"}}/>
        <TreeSVG style={{position:"absolute",right:"17%",bottom:"0",width:52,height:86,color:"var(--green)"}}/>
        <TreeSVG style={{position:"absolute",right:"22%",bottom:"0",width:40,height:66,color:"var(--green)"}}/>
        <MtnSVG style={{position:"absolute",bottom:0,left:0,width:"100%",height:70,color:"var(--green)"}}/>
      </div>

      <header style={{borderBottom:"1px solid var(--border)",padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",backdropFilter:"blur(12px)",background:"rgba(8,15,8,0.92)",position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <button onClick={onBack} className="btn-ghost" style={{padding:"7px 14px",fontSize:13}}>← Home</button>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:20}}>🦌</span>
            <span style={{fontFamily:"var(--font-display)",fontSize:18,fontWeight:700,color:"var(--text)"}}>WildAI</span>
            {selectedState && <span style={{color:"var(--text3)",fontSize:13}}>· {selectedState}</span>}
          </div>
        </div>
        <div style={{padding:"6px 14px",borderRadius:20,fontSize:12,fontWeight:600,background:hitLimit?"rgba(255,100,100,0.1)":"var(--green-dim)",border:`1px solid ${hitLimit?"rgba(255,100,100,0.2)":"var(--border-accent)"}`,color:hitLimit?"#ff6b6b":"var(--green)"}}>
          {hitLimit?"Limit reached":isPro?"Pro ✓":`${Math.max(0, FREE_LIMIT-messageCount)} msgs left`}
        </div>
      </header>

      <div style={{borderBottom:"1px solid var(--border)",padding:"12px 20px",display:"flex",gap:8,overflowX:"auto",background:"rgba(8,15,8,0.78)",position:"sticky",top:57,zIndex:40}}>
        {tabs.map(t=><button key={t.id} onClick={()=>setTab(t.id)} className={`nav-tab ${tab===t.id?"active":"inactive"}`}>{t.label}</button>)}
      </div>

      <div style={{flex:1,padding:20,maxWidth:760,width:"100%",margin:"0 auto",display:"flex",flexDirection:"column",gap:16,position:"relative",zIndex:1}}>

        {/* CHAT */}
        {tab==="chat" && (
          <div className="fade-in card" style={{display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{overflowY:"auto",padding:20,display:"flex",flexDirection:"column",gap:16,minHeight:340,maxHeight:500}}>
              {messages.map((m,i)=>(
                <div key={i} className="fade-in" style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",gap:10,alignItems:"flex-end"}}>
                  {m.role==="assistant" && <div style={{width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,var(--green),var(--green2))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0,boxShadow:"0 4px 12px rgba(120,180,80,0.25)"}}>🦌</div>}
                  <div style={{background:m.role==="user"?"linear-gradient(135deg,var(--green),var(--green2))":"rgba(255,255,255,0.05)",border:m.role==="assistant"?"1px solid var(--border)":"none",color:"var(--text)",padding:"13px 17px",borderRadius:m.role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px",maxWidth:"80%",boxShadow:m.role==="user"?"0 4px 16px rgba(120,180,80,0.2)":"none"}}>
                    {m.role==="assistant"&&m.animate?<TypewriterText text={m.content}/>:fmtMsg(m.content)}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{display:"flex",gap:10,alignItems:"flex-end"}}>
                  <div style={{width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,var(--green),var(--green2))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>🦌</div>
                  <div style={{background:"rgba(255,255,255,0.05)",border:"1px solid var(--border)",padding:"13px 17px",borderRadius:"18px 18px 18px 4px"}}>
                    <div style={{display:"flex",gap:5,alignItems:"center"}}>
                      {[0,1,2].map(j=><div key={j} style={{width:6,height:6,borderRadius:"50%",background:"var(--green)",animation:`pulse 1.2s ease-in-out ${j*0.2}s infinite`}}/>)}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef}/>
            </div>
            {messages.length<=2&&!hitLimit&&(
              <div style={{padding:"0 20px 16px",display:"flex",gap:8,flexWrap:"wrap"}}>
                {[`Best ${selectedState||"local"} elk setup?`,"What's biting right now?","Plan me a 3-day hunt","Deer scouting tips"].map((s,i)=>(
                  <button key={i} onClick={()=>sendMessage(s)} className="btn-ghost" style={{padding:"7px 14px",fontSize:12,borderRadius:20}}>{s}</button>
                ))}
              </div>
            )}
            {hitLimit && (
              <div style={{margin:"0 20px 20px",background:"linear-gradient(135deg,rgba(120,180,80,0.08),rgba(90,154,50,0.04))",border:"1px solid var(--border-accent)",borderRadius:"var(--radius)",padding:24,textAlign:"center"}}>
                <div style={{fontSize:36,marginBottom:10}}>🔒</div>
                <div style={{fontFamily:"var(--font-display)",fontSize:20,color:"var(--text)",marginBottom:6}}>Upgrade to WildAI Pro</div>
                <div style={{color:"var(--text2)",fontSize:14,marginBottom:18,lineHeight:1.6}}>You've used your free messages. Get unlimited access and advanced features.</div>
                <button className="btn-primary" style={{padding:"13px 32px",fontSize:15,borderRadius:"var(--radius)"}} onClick={async()=>{const res=await fetch("https://wildai-server.onrender.com/create-checkout",{method:"POST",headers:{"Content-Type":"application/json"}});const data=await res.json();if(data.url)window.location.href=data.url;}}>Upgrade for $4.99/month →</button>
              </div>
            )}
            {!hitLimit && (
              <div style={{padding:"14px 20px",borderTop:"1px solid var(--border)",display:"flex",gap:10,alignItems:"center"}}>
                <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendMessage()}
                  placeholder={`Ask anything about hunting & fishing${selectedState?` in ${selectedState}`:""}...`}
                  style={{flex:1,padding:"13px 18px",borderRadius:"var(--radius-sm)",fontSize:14}}/>
                <button onClick={()=>sendMessage()} className="btn-primary" style={{padding:"13px 22px",fontSize:14,borderRadius:"var(--radius-sm)",flexShrink:0}}>Send →</button>
              </div>
            )}
          </div>
        )}

        {tab==="weather" && (
          <div className="fade-in">
            <WeatherWidget selectedState={selectedState}/>
            <div style={{marginTop:14,padding:"16px 20px",background:"var(--green-dim)",border:"1px solid var(--border-accent)",borderRadius:"var(--radius)",fontSize:13,color:"var(--text2)",lineHeight:1.65}}>
              🎯 <strong style={{color:"var(--green)"}}>Pro tip:</strong> Best hunting follows a cold front — pressure rising, temps dropping, light winds. Fish activity peaks when pressure is stable or rising.
            </div>
          </div>
        )}

        {tab==="map" && <MapTab selectedState={selectedState}/>}

        {tab==="regs" && <RegulationsTab selectedState={selectedState}/>}

        {tab==="species" && (
          <div className="fade-in">
            <div style={{display:"flex",gap:8,marginBottom:16}}>
              {["all","hunting","fishing"].map(f=>(
                <button key={f} onClick={()=>setSpeciesFilter(f)} className={`nav-tab ${speciesFilter===f?"active":"inactive"}`} style={{padding:"7px 18px",fontSize:12}}>
                  {f==="all"?"All":f==="hunting"?"🎯 Hunting":"🎣 Fishing"}
                </button>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:12}}>
              {filteredSpecies.map(s=>(
                <button key={s.name} onClick={()=>{ sendMessage(`Give me a complete guide for ${s.name} — best tactics, gear, timing, and ${selectedState?selectedState+" specific ":""}tips.`); }} className="card" style={{padding:"20px 16px",textAlign:"center",cursor:"pointer",border:"1px solid var(--border)"}}>
                  <div style={{fontSize:32,marginBottom:10}}>{s.icon}</div>
                  <div style={{color:"var(--text)",fontWeight:700,fontSize:14,marginBottom:4}}>{s.name}</div>
                  <div style={{color:"var(--text3)",fontSize:11,marginBottom:10}}>{s.desc}</div>
                  <span className={`tag tag-${s.type==="hunting"?"hunt":"fish"}`}>{s.type}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {tab==="gear" && (
          <div className="fade-in">
            {!selectedChecklist ? (
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:12}}>
                {Object.entries(GEAR_CHECKLISTS).map(([k,v])=>(
                  <button key={k} onClick={()=>setSelectedChecklist(k)} className="card" style={{padding:"22px 16px",textAlign:"center",cursor:"pointer",border:"1px solid var(--border)"}}>
                    <div style={{fontSize:32,marginBottom:10}}>{v.icon}</div>
                    <div style={{color:"var(--text)",fontWeight:700,fontSize:14,marginBottom:4}}>{k}</div>
                    <div style={{color:"var(--text3)",fontSize:12}}>{v.items.length} items</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="fade-in">
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:24}}>{GEAR_CHECKLISTS[selectedChecklist].icon}</span>
                    <h3 style={{color:"var(--text)",fontSize:18,fontFamily:"var(--font-display)"}}>{selectedChecklist}</h3>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>setCheckedItems({})} className="btn-ghost" style={{padding:"7px 14px",fontSize:12}}>Reset</button>
                    <button onClick={()=>setSelectedChecklist(null)} className="btn-ghost" style={{padding:"7px 14px",fontSize:12}}>← Back</button>
                  </div>
                </div>
                <div style={{color:"var(--text3)",fontSize:12,marginBottom:14}}>{Object.values(checkedItems).filter(Boolean).length} / {GEAR_CHECKLISTS[selectedChecklist].items.length} packed</div>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {GEAR_CHECKLISTS[selectedChecklist].items.map((item,i)=>{
                    const k=`${selectedChecklist}::${item}`; const checked=checkedItems[k];
                    return (
                      <div key={i} onClick={()=>toggleCheck(selectedChecklist,item)} className={`checklist-item ${checked?"checked":""}`}>
                        <div style={{width:20,height:20,borderRadius:6,border:`2px solid ${checked?"var(--green)":"rgba(255,255,255,0.15)"}`,background:checked?"var(--green)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.15s"}}>
                          {checked&&<span style={{color:"white",fontSize:12,fontWeight:700}}>✓</span>}
                        </div>
                        {item}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {tab==="about" && (
          <div className="fade-in card" style={{padding:32}}>
            <div style={{textAlign:"center",marginBottom:32}}>
              <div style={{fontSize:56,marginBottom:16}} className="float">🦌</div>
              <h2 style={{fontFamily:"var(--font-display)",fontSize:28,color:"var(--text)",marginBottom:8}}>WildAI</h2>
              <p style={{color:"var(--green)",fontSize:14,fontWeight:500}}>Built for hunters & anglers, by outdoorsmen</p>
            </div>
            <div style={{color:"var(--text2)",fontSize:15,lineHeight:1.85,display:"flex",flexDirection:"column",gap:16}}>
              <p>WildAI is an AI-powered hunting and fishing assistant designed to give you the kind of advice you'd get from a seasoned outdoorsman — specific, practical, and straight to the point.</p>
              <p>Whether you're planning your first elk hunt, figuring out what flies are working on your local river, or need to know the regulations for a new state, WildAI has you covered.</p>
              <div style={{padding:"16px 20px",background:"var(--amber-dim)",border:"1px solid rgba(212,147,10,0.2)",borderRadius:"var(--radius-sm)"}}>
                <p style={{color:"rgba(212,147,10,0.9)",fontSize:13,margin:0}}>⚠️ Always verify current regulations with your state wildlife agency. Regulations change and WildAI's information may not always be current.</p>
              </div>
            </div>
            <div style={{marginTop:28,paddingTop:28,borderTop:"1px solid var(--border)"}}>
              <button onClick={onTerms} className="btn-ghost" style={{padding:"10px 20px",fontSize:13}}>View Terms & Conditions →</button>
            </div>
          </div>
        )}
      </div>

      <footer style={{borderTop:"1px solid var(--border)",padding:"14px 20px",textAlign:"center",position:"relative",zIndex:1}}>
        <span style={{color:"var(--text3)",fontSize:11}}>WildAI · Powered by AI · Always verify regulations with your state agency</span>
      </footer>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("landing");
  const [prevPage, setPrevPage] = useState("landing");
  const [messageCount, setMessageCount] = useState(() => {
  const saved = localStorage.getItem("wildai_message_count");
  return saved ? parseInt(saved) : 0;
});
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.get("upgraded") === "true") {
    localStorage.setItem("wildai_pro", "true");
    localStorage.setItem("wildai_message_count", "0");
    window.history.replaceState({}, "", "/");
    setPage("chat");
  }
}, []);
  const [selectedState, setSelectedState] = useState("");
  const goTo = (p) => { setPrevPage(page); setPage(p); };
  return (
    <>
      <style>{css}</style>
      <div className="grain"/>
      {page==="terms" && <TermsPage onBack={()=>setPage(prevPage==="chat"?"chat":"landing")}/>}
      {page==="landing" && <LandingPage onStart={()=>goTo("chat")} selectedState={selectedState} setSelectedState={setSelectedState} onTerms={()=>goTo("terms")}/>}
      {page==="chat" && <ChatPage onBack={()=>goTo("landing")} messageCount={messageCount} setMessageCount={setMessageCount} selectedState={selectedState} onTerms={()=>goTo("terms")}/>}
    </>
  );
}
