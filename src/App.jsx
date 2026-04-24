import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { supabase } from './supabase';
import { useUser, SignIn, SignUp, UserButton, useClerk } from '@clerk/react';
// mapbox css loaded dynamically in MapTab

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, info) { console.error("ErrorBoundary:", error, info); }
  render() {
    if (this.state.hasError) return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--text2)" }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
        <div style={{ color: "var(--text)", fontWeight: 600, marginBottom: 4 }}>Something went wrong</div>
        <div style={{ fontSize: 13 }}>Try refreshing the page</div>
      </div>
    );
    return this.props.children;
  }
}


const STATES = ["Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"];

const STATE_WILDLIFE_AGENCIES = {
  "Alabama": { name: "Alabama DCNR", hunting: "https://www.outdooralabama.com", fishing: "https://www.outdooralabama.com" },
  "Alaska": { name: "Alaska DFG", hunting: "https://www.adfg.alaska.gov", fishing: "https://www.adfg.alaska.gov" },
  "Arizona": { name: "Arizona GFD", hunting: "https://www.azgfd.com", fishing: "https://www.azgfd.com" },
  "Arkansas": { name: "Arkansas GFC", hunting: "https://www.agfc.com", fishing: "https://www.agfc.com" },
  "California": { name: "California CDFW", hunting: "https://www.wildlife.ca.gov", fishing: "https://www.wildlife.ca.gov" },
  "Colorado": { name: "Colorado CPW", hunting: "https://cpw.state.co.us", fishing: "https://cpw.state.co.us" },
  "Connecticut": { name: "Connecticut DEEP", hunting: "https://portal.ct.gov/DEEP", fishing: "https://portal.ct.gov/DEEP" },
  "Delaware": { name: "Delaware DNREC", hunting: "https://dnrec.delaware.gov", fishing: "https://dnrec.delaware.gov" },
  "Florida": { name: "Florida FWC", hunting: "https://gooutdoorsflorida.com", fishing: "https://gooutdoorsflorida.com" },
  "Georgia": { name: "Georgia DNR", hunting: "https://georgiawildlife.com", fishing: "https://georgiawildlife.com" },
  "Hawaii": { name: "Hawaii DLNR", hunting: "https://dlnr.hawaii.gov", fishing: "https://dlnr.hawaii.gov" },
  "Idaho": { name: "Idaho Fish & Game", hunting: "https://idfg.idaho.gov", fishing: "https://idfg.idaho.gov" },
  "Illinois": { name: "Illinois DNR", hunting: "https://www.dnr.illinois.gov", fishing: "https://www.dnr.illinois.gov" },
  "Indiana": { name: "Indiana DNR", hunting: "https://www.in.gov/dnr", fishing: "https://www.in.gov/dnr" },
  "Iowa": { name: "Iowa DNR", hunting: "https://www.iowadnr.gov", fishing: "https://www.iowadnr.gov" },
  "Kansas": { name: "Kansas Wildlife", hunting: "https://ksoutdoors.com", fishing: "https://ksoutdoors.com" },
  "Kentucky": { name: "Kentucky DFW", hunting: "https://fw.ky.gov", fishing: "https://fw.ky.gov" },
  "Louisiana": { name: "Louisiana WLF", hunting: "https://www.wlf.louisiana.gov", fishing: "https://www.wlf.louisiana.gov" },
  "Maine": { name: "Maine IFW", hunting: "https://www.maine.gov/ifw", fishing: "https://www.maine.gov/ifw" },
  "Maryland": { name: "Maryland DNR", hunting: "https://dnr.maryland.gov", fishing: "https://dnr.maryland.gov" },
  "Massachusetts": { name: "Massachusetts DFW", hunting: "https://www.mass.gov/masswildlife", fishing: "https://www.mass.gov/masswildlife" },
  "Michigan": { name: "Michigan DNR", hunting: "https://www.michigan.gov/dnr", fishing: "https://www.michigan.gov/dnr" },
  "Minnesota": { name: "Minnesota DNR", hunting: "https://www.dnr.state.mn.us", fishing: "https://www.dnr.state.mn.us" },
  "Mississippi": { name: "Mississippi MDWFP", hunting: "https://www.mdwfp.com", fishing: "https://www.mdwfp.com" },
  "Missouri": { name: "Missouri MDC", hunting: "https://mdc.mo.gov", fishing: "https://mdc.mo.gov" },
  "Montana": { name: "Montana FWP", hunting: "https://fwp.mt.gov", fishing: "https://fwp.mt.gov" },
  "Nebraska": { name: "Nebraska Game & Parks", hunting: "https://outdoornebraska.gov", fishing: "https://outdoornebraska.gov" },
  "Nevada": { name: "Nevada NDOW", hunting: "https://www.ndow.org", fishing: "https://www.ndow.org" },
  "New Hampshire": { name: "New Hampshire DFG", hunting: "https://www.wildlife.nh.gov", fishing: "https://www.wildlife.nh.gov" },
  "New Jersey": { name: "New Jersey DFW", hunting: "https://www.nj.gov/dep/fgw", fishing: "https://www.nj.gov/dep/fgw" },
  "New Mexico": { name: "New Mexico DGF", hunting: "https://www.wildlife.state.nm.us", fishing: "https://www.wildlife.state.nm.us" },
  "New York": { name: "New York DEC", hunting: "https://www.dec.ny.gov", fishing: "https://www.dec.ny.gov" },
  "North Carolina": { name: "North Carolina WRC", hunting: "https://www.ncwildlife.org", fishing: "https://www.ncwildlife.org" },
  "North Dakota": { name: "North Dakota GFD", hunting: "https://gf.nd.gov", fishing: "https://gf.nd.gov" },
  "Ohio": { name: "Ohio DNR", hunting: "https://ohiodnr.gov", fishing: "https://ohiodnr.gov" },
  "Oklahoma": { name: "Oklahoma DWC", hunting: "https://www.wildlifedepartment.com", fishing: "https://www.wildlifedepartment.com" },
  "Oregon": { name: "Oregon DFW", hunting: "https://myodfw.com", fishing: "https://myodfw.com" },
  "Pennsylvania": { name: "Pennsylvania GC & FC", hunting: "https://www.pgc.pa.gov", fishing: "https://www.fishandboat.com" },
  "Rhode Island": { name: "Rhode Island DEM", hunting: "https://dem.ri.gov", fishing: "https://dem.ri.gov" },
  "South Carolina": { name: "South Carolina DNR", hunting: "https://www.dnr.sc.gov", fishing: "https://www.dnr.sc.gov" },
  "South Dakota": { name: "South Dakota GFP", hunting: "https://gfp.sd.gov", fishing: "https://gfp.sd.gov" },
  "Tennessee": { name: "Tennessee TWRA", hunting: "https://www.tn.gov/twra", fishing: "https://www.tn.gov/twra" },
  "Texas": { name: "Texas Parks & Wildlife", hunting: "https://tpwd.texas.gov", fishing: "https://tpwd.texas.gov" },
  "Utah": { name: "Utah DWR", hunting: "https://wildlife.utah.gov", fishing: "https://wildlife.utah.gov" },
  "Vermont": { name: "Vermont DFW", hunting: "https://vtfishandwildlife.com", fishing: "https://vtfishandwildlife.com" },
  "Virginia": { name: "Virginia DWR", hunting: "https://dwr.virginia.gov", fishing: "https://dwr.virginia.gov" },
  "Washington": { name: "Washington WDFW", hunting: "https://wdfw.wa.gov", fishing: "https://wdfw.wa.gov" },
  "West Virginia": { name: "West Virginia DNR", hunting: "https://wvdnr.gov", fishing: "https://wvdnr.gov" },
  "Wisconsin": { name: "Wisconsin DNR", hunting: "https://dnr.wisconsin.gov", fishing: "https://dnr.wisconsin.gov" },
  "Wyoming": { name: "Wyoming GFD", hunting: "https://wgfd.wyo.gov", fishing: "https://wgfd.wyo.gov" },
};

const STATE_COORDS = {
  "Alabama": [32.81, -86.79], "Alaska": [61.37, -152.4], "Arizona": [33.73, -111.43], "Arkansas": [34.97, -92.37],
  "California": [36.12, -119.68], "Colorado": [39.06, -105.31], "Connecticut": [41.6, -72.76], "Delaware": [39.32, -75.51],
  "Florida": [27.77, -81.69], "Georgia": [33.04, -83.64], "Hawaii": [21.09, -157.5], "Idaho": [44.24, -114.48],
  "Illinois": [40.35, -88.99], "Indiana": [39.85, -86.26], "Iowa": [42.01, -93.21], "Kansas": [38.53, -96.73],
  "Kentucky": [37.67, -84.67], "Louisiana": [31.17, -91.87], "Maine": [44.69, -69.38], "Maryland": [39.06, -76.8],
  "Massachusetts": [42.23, -71.53], "Michigan": [43.33, -84.54], "Minnesota": [45.69, -93.9], "Mississippi": [32.74, -89.68],
  "Missouri": [38.46, -92.29], "Montana": [46.92, -110.45], "Nebraska": [41.13, -98.27], "Nevada": [38.31, -117.06],
  "New Hampshire": [43.45, -71.56], "New Jersey": [40.3, -74.52], "New Mexico": [34.84, -106.25], "New York": [42.17, -74.95],
  "North Carolina": [35.63, -79.81], "North Dakota": [47.53, -99.78], "Ohio": [40.39, -82.76], "Oklahoma": [35.57, -96.93],
  "Oregon": [44.57, -122.07], "Pennsylvania": [40.59, -77.21], "Rhode Island": [41.68, -71.51], "South Carolina": [33.86, -80.95],
  "South Dakota": [44.3, -99.44], "Tennessee": [35.75, -86.69], "Texas": [31.05, -97.56], "Utah": [40.15, -111.86],
  "Vermont": [44.05, -72.71], "Virginia": [37.77, -78.17], "Washington": [47.4, -121.49], "West Virginia": [38.49, -80.95],
  "Wisconsin": [44.27, -89.62], "Wyoming": [42.76, -107.3]
};

const SPECIES_ICONS = {
  // Deer family
  "Elk": "🦌", "Whitetail Deer": "🦌", "Mule Deer": "🦌", "Moose": "🦌", "Antelope": "🦌",
  "Pronghorn": "🦌", "Pronghorn Antelope": "🦌", "Caribou": "🦌", "Bison": "🦬", "Buffalo": "🦬",
  "Sitka Deer": "🦌", "Axis Deer": "🦌", "Fallow Deer": "🦌", "Whitetail": "🦌",
  // Bears
  "Bear": "🐻", "Black Bear": "🐻", "Brown Bear": "🐻", "Grizzly Bear": "🐻", "Grizzly": "🐻",
  "Polar Bear": "🐻‍❄️",
  // Cats
  "Mountain Lion": "🐆", "Cougar": "🐆", "Puma": "🐆", "Bobcat": "🐆",
  "Lynx": "🐱", "Canada Lynx": "🐱",
  // Canines
  "Wolf": "🐺", "Gray Wolf": "🐺", "Timber Wolf": "🐺", "Coyote": "🐺",
  "Fox": "🦊", "Red Fox": "🦊", "Gray Fox": "🦊", "Arctic Fox": "🦊",
  // Wild pig
  "Hog": "🐗", "Wild Hog": "🐗", "Feral Hog": "🐗", "Wild Boar": "🐗", "Javelina": "🐗", "Feral Pig": "🐗",
  // Small predators
  "Wolverine": "🦡", "Fisher": "🦡", "Marten": "🦡", "Badger": "🦡",
  "Raccoon": "🦝", "Opossum": "🐾", "Beaver": "🦫", "Mink": "🦦", "Otter": "🦦",
  "Muskrat": "🐀", "Skunk": "🦨", "Weasel": "🐾",
  // Sheep & goats
  "Mountain Goat": "🐐", "Bighorn Sheep": "🐏", "Dall Sheep": "🐏", "Desert Bighorn": "🐏",
  "Mouflon Sheep": "🐏",
  // Small game
  "Rabbit": "🐇", "Cottontail": "🐇", "Jackrabbit": "🐇", "Snowshoe Hare": "🐇", "Hare": "🐇",
  "Squirrel": "🐿️", "Fox Squirrel": "🐿️", "Gray Squirrel": "🐿️", "Red Squirrel": "🐿️",
  "Prairie Dog": "🐿️", "Groundhog": "🐿️", "Woodchuck": "🐿️",
  // Upland birds
  "Turkey": "🦃", "Wild Turkey": "🦃", "Merriam's Turkey": "🦃", "Osceola Turkey": "🦃",
  "Pheasant": "🐦", "Ring-necked Pheasant": "🐦", "Quail": "🐦", "Bobwhite Quail": "🐦",
  "California Quail": "🐦", "Gambel's Quail": "🐦", "Scaled Quail": "🐦", "Montezuma Quail": "🐦",
  "Dove": "🕊️", "Mourning Dove": "🕊️", "White-winged Dove": "🕊️", "Eurasian Collared Dove": "🕊️",
  "Grouse": "🐦", "Ruffed Grouse": "🐦", "Sage Grouse": "🐦", "Blue Grouse": "🐦",
  "Sharp-tailed Grouse": "🐦", "Spruce Grouse": "🐦", "Dusky Grouse": "🐦", "Sooty Grouse": "🐦",
  "Ptarmigan": "🐦", "White-tailed Ptarmigan": "🐦", "Rock Ptarmigan": "🐦",
  "Chukar": "🐦", "Hungarian Partridge": "🐦", "Gray Partridge": "🐦",
  "Woodcock": "🐦", "American Woodcock": "🐦", "Snipe": "🐦", "Prairie Chicken": "🐦",
  // Waterfowl
  "Duck": "🦆", "Mallard": "🦆", "Teal": "🦆", "Wood Duck": "🦆", "Pintail": "🦆",
  "Widgeon": "🦆", "Canvasback": "🦆", "Redhead": "🦆", "Scaup": "🦆", "Bufflehead": "🦆",
  "Gadwall": "🦆", "Shoveler": "🦆", "Ring-necked Duck": "🦆", "Eider": "🦆",
  "Goose": "🪿", "Canada Goose": "🪿", "Snow Goose": "🪿", "White-fronted Goose": "🪿",
  "Ross's Goose": "🪿", "Brant": "🪿", "Waterfowl": "🦆",
  // Freshwater fish
  "Bass": "🐟", "Largemouth Bass": "🐟", "Smallmouth Bass": "🐟", "Spotted Bass": "🐟",
  "Striped Bass": "🐟", "White Bass": "🐟", "Hybrid Striped Bass": "🐟", "Kentucky Bass": "🐟",
  "Trout": "🐟", "Rainbow Trout": "🐟", "Brown Trout": "🐟", "Brook Trout": "🐟",
  "Cutthroat Trout": "🐟", "Lake Trout": "🐟", "Bull Trout": "🐟", "Tiger Trout": "🐟",
  "Apache Trout": "🐟", "Gila Trout": "🐟",
  "Walleye": "🐟", "Sauger": "🐟", "Pike": "🐟", "Northern Pike": "🐟",
  "Muskie": "🐟", "Muskellunge": "🐟", "Tiger Muskie": "🐟",
  "Catfish": "🐟", "Channel Catfish": "🐟", "Blue Catfish": "🐟", "Flathead Catfish": "🐟",
  "Crappie": "🐟", "Black Crappie": "🐟", "White Crappie": "🐟",
  "Bluegill": "🐟", "Sunfish": "🐟", "Pumpkinseed": "🐟", "Perch": "🐟", "Yellow Perch": "🐟",
  "Salmon": "🐟", "Chinook Salmon": "🐟", "Coho Salmon": "🐟", "Sockeye Salmon": "🐟",
  "King Salmon": "🐟", "Pink Salmon": "🐟", "Chum Salmon": "🐟", "Atlantic Salmon": "🐟",
  "Steelhead": "🐟", "Carp": "🐟", "Common Carp": "🐟", "Grass Carp": "🐟",
  "Drum": "🐟", "Freshwater Drum": "🐟", "Bowfin": "🐟", "Gar": "🐟", "Alligator Gar": "🐟",
  "Burbot": "🐟", "Kokanee": "🐟", "Cisco": "🐟", "Whitefish": "🐟", "Grayling": "🐟",
  "Sturgeon": "🐟", "White Sturgeon": "🐟", "Paddlefish": "🐟", "Saugeye": "🐟",
  "Cod": "🐟", "Atlantic Cod": "🐟", "Pacific Cod": "🐟", "Pollock": "🐟",
  // Saltwater fish
  "Redfish": "🐠", "Red Drum": "🐠", "Snook": "🐠", "Tarpon": "🐠",
  "Flounder": "🐠", "Grouper": "🐠", "Snapper": "🐠", "Red Snapper": "🐠",
  "Cobia": "🐠", "Mahi-Mahi": "🐠", "Mahi": "🐠", "Dorado": "🐠",
  "Tuna": "🐠", "Yellowfin Tuna": "🐠", "Bluefin Tuna": "🐠", "Albacore": "🐠", "Skipjack": "🐠",
  "Marlin": "🐠", "Striped Marlin": "🐠", "Blue Marlin": "🐠", "White Marlin": "🐠",
  "Shark": "🦈", "Bull Shark": "🦈", "Hammerhead": "🦈", "Tiger Shark": "🦈", "Mako Shark": "🦈",
  "Swordfish": "🐠", "Wahoo": "🐠", "Amberjack": "🐠", "Pompano": "🐠",
  "Sheepshead": "🐠", "Speckled Trout": "🐠", "Spotted Sea Trout": "🐠",
  "Halibut": "🐠", "Pacific Halibut": "🐠", "Lingcod": "🐠", "Rockfish": "🐠",
  "Striped Bass (Salt)": "🐠", "Bluefish": "🐠", "Weakfish": "🐠",
  "Permit": "🐠", "Bonefish": "🐠", "Tripletail": "🐠", "Kingfish": "🐠",
  "Mackerel": "🐠", "Spanish Mackerel": "🐠", "King Mackerel": "🐠",
  "Sailfish": "🐠", "Barracuda": "🐠", "Yellowtail": "🐠",
  // Shellfish
  "Crab": "🦀", "Dungeness Crab": "🦀", "Blue Crab": "🦀", "King Crab": "🦀", "Snow Crab": "🦀",
  "Lobster": "🦞", "Spiny Lobster": "🦞", "Shrimp": "🍤", "Oyster": "🦪", "Clam": "🦪",
  "Scallop": "🦪", "Mussel": "🦪",
};
const SPECIES = [
  { name: "Elk", icon: "🦌", type: "hunting", desc: "Rocky Mountain & Roosevelt" },
  { name: "Whitetail Deer", icon: "🦌", type: "hunting", desc: "Most popular big game" },
  { name: "Mule Deer", icon: "🦌", type: "hunting", desc: "Western terrain specialist" },
  { name: "Turkey", icon: "🦃", type: "hunting", desc: "Spring & fall seasons" },
  { name: "Bear", icon: "🐻", type: "hunting", desc: "Black & grizzly tactics" },
  { name: "Pheasant", icon: "🐦", type: "hunting", desc: "Upland bird classic" },
  { name: "Duck", icon: "🦆", type: "hunting", desc: "Waterfowl hunting" },
  { name: "Antelope", icon: "🦌", type: "hunting", desc: "Speed & open country" },
  { name: "Bass", icon: "🐟", type: "fishing", desc: "Largemouth & smallmouth" },
  { name: "Trout", icon: "🐟", type: "fishing", desc: "Stream & lake tactics" },
  { name: "Walleye", icon: "🐟", type: "fishing", desc: "Northern lakes staple" },
  { name: "Catfish", icon: "🐟", type: "fishing", desc: "Bottom fishing tactics" },
  { name: "Pike", icon: "🐟", type: "fishing", desc: "Aggressive predator" },
  { name: "Salmon", icon: "🐟", type: "fishing", desc: "Pacific & Atlantic runs" },
  { name: "Crappie", icon: "🐟", type: "fishing", desc: "Panfish favorite" },
  { name: "Carp", icon: "🐟", type: "fishing", desc: "Fly & bait fishing" },
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
  "Elk Hunt": { icon: "🦌", items: ["Rifle/bow + ammo/arrows", "Hunting license + tags", "Topo map + compass", "Quality boots (broken in)", "Merino base layers", "Insulating mid layer", "Waterproof outer shell", "Blaze orange", "Rangefinder", "Binoculars 10x42", "Bone saw + knife", "Game bags (4)", "Headlamp + batteries", "First aid kit", "Emergency shelter", "Water filter", "High calorie food", "Pack (60-80L)", "Trekking poles", "Satellite communicator"] },
  "Fishing Trip": { icon: "🎣", items: ["Rod + reel", "Fishing license", "Tackle box", "Extra line", "Polarized sunglasses", "Sun protection", "Net", "Cooler + ice", "Pliers/multi-tool", "First aid kit", "Water + snacks", "Rain gear"] },
  "Turkey Hunt": { icon: "🦃", items: ["Shotgun/bow", "Turkey calls (box, slate, mouth)", "Hunting license + tags", "Camo head to toe", "Face mask/paint", "Decoys (1-2)", "Vest with seat", "Boots", "Rangefinder", "First aid kit"] },
  "Backcountry Hunt": { icon: "🏔️", items: ["Rifle/bow + ammo/arrows", "Hunting license + tags", "Tent/bivy", "Sleeping bag (-20°F rated)", "Stove + fuel", "Water filter", "Bear canister", "Extra food (2 days extra)", "Solar charger", "Satellite communicator (mandatory)", "First aid kit", "Topo map + compass", "Emergency shelter", "Trekking poles"] },
  "Duck Hunt": { icon: "🦆", items: ["Shotgun + steel shot", "Duck/waterfowl license + stamp", "Waders", "Decoys (12-36)", "Duck calls", "Blind/cover", "Camo head to toe", "Retriever or hand retrieval plan", "Life vest", "First aid kit"] },
  "Ice Fishing": { icon: "🧊", items: ["Ice auger", "Ice fishing rod + reel", "Tip-ups", "Ice fishing shelter/shanty", "Heater + fuel", "Ice cleats", "Insulated bibs + jacket", "Hand warmers", "Bait/lures", "Bucket + scoop", "First aid kit", "Ice safety picks"] },
};

const PUBLIC_LANDS = [
  { name: "Flathead National Forest", lat: 48.15, lng: -114.2, type: "hunting", state: "Montana", species: ["Elk", "Bear", "Deer"], desc: "6M+ acres of prime big game country" },
  { name: "BLM Missouri Breaks", lat: 47.8, lng: -108.5, type: "hunting", state: "Montana", species: ["Mule Deer", "Antelope"], desc: "Rugged breaks with trophy mule deer" },
  { name: "Flathead Lake", lat: 47.87, lng: -114.12, type: "fishing", state: "Montana", species: ["Trout", "Pike", "Bass"], desc: "Largest natural freshwater lake west of Mississippi" },
  { name: "Madison River", lat: 45.65, lng: -111.6, type: "fishing", state: "Montana", species: ["Trout"], desc: "World-class blue ribbon trout fishery" },
  { name: "Sun River WMA", lat: 47.52, lng: -112.8, type: "hunting", state: "Montana", species: ["Elk", "Deer"], desc: "State WMA with exceptional elk numbers" },
  { name: "Bitterroot National Forest", lat: 46.1, lng: -114.3, type: "hunting", state: "Montana", species: ["Elk", "Deer", "Bear"], desc: "Remote wilderness elk hunting" },
  { name: "Bighorn Canyon NRA", lat: 45.1, lng: -107.9, type: "fishing", state: "Montana", species: ["Walleye", "Bass", "Trout"], desc: "Outstanding walleye fishery" },
  { name: "Missouri River", lat: 47.0, lng: -110.5, type: "fishing", state: "Montana", species: ["Trout", "Walleye"], desc: "Blue ribbon trout and walleye" },
  { name: "White River NF", lat: 39.5, lng: -107.2, type: "hunting", state: "Colorado", species: ["Elk", "Deer"], desc: "Largest elk herd in North America" },
  { name: "Blue Mesa Reservoir", lat: 38.46, lng: -107.3, type: "fishing", state: "Colorado", species: ["Trout", "Salmon"], desc: "Colorado's largest body of water" },
  { name: "South Platte River", lat: 39.4, lng: -105.2, type: "fishing", state: "Colorado", species: ["Trout"], desc: "Legendary tailwater fishery" },
  { name: "Gunnison NF", lat: 38.7, lng: -107.0, type: "hunting", state: "Colorado", species: ["Elk", "Deer", "Bear"], desc: "Trophy elk unit country" },
  { name: "Spinney Mountain Reservoir", lat: 38.9, lng: -105.6, type: "fishing", state: "Colorado", species: ["Trout"], desc: "Trophy trout fishing" },
  { name: "Bridger-Teton NF", lat: 43.5, lng: -110.5, type: "hunting", state: "Wyoming", species: ["Elk", "Moose", "Bear"], desc: "World-class elk and moose habitat" },
  { name: "Bighorn Lake", lat: 44.9, lng: -108.1, type: "fishing", state: "Wyoming", species: ["Walleye", "Bass", "Trout"], desc: "Outstanding walleye and bass fishing" },
  { name: "Shoshone NF", lat: 44.2, lng: -109.6, type: "hunting", state: "Wyoming", species: ["Elk", "Bear", "Moose"], desc: "Oldest national forest in the US" },
  { name: "North Platte River", lat: 42.1, lng: -106.8, type: "fishing", state: "Wyoming", species: ["Trout"], desc: "Blue ribbon brown trout fishery" },
  { name: "Mark Twain NF", lat: 37.1, lng: -91.8, type: "hunting", state: "Missouri", species: ["Whitetail Deer", "Turkey"], desc: "Dense hardwood forest with excellent deer" },
  { name: "Lake of the Ozarks", lat: 38.2, lng: -92.6, type: "fishing", state: "Missouri", species: ["Bass", "Catfish", "Crappie"], desc: "Premier bass fishing destination" },
  { name: "Sam Houston NF", lat: 30.7, lng: -95.5, type: "hunting", state: "Texas", species: ["Whitetail Deer", "Turkey"], desc: "East Texas public hunting land" },
  { name: "Lake Fork Reservoir", lat: 32.9, lng: -95.6, type: "fishing", state: "Texas", species: ["Bass"], desc: "Legendary big bass trophy lake" },
  { name: "Guadalupe River", lat: 29.8, lng: -98.1, type: "fishing", state: "Texas", species: ["Trout"], desc: "Texas tailwater trout fishery" },
  { name: "Caddo Lake", lat: 32.7, lng: -94.0, type: "fishing", state: "Texas", species: ["Bass", "Catfish", "Crappie"], desc: "Mysterious cypress swamp bass fishing" },
  { name: "Allegheny NF", lat: 41.7, lng: -79.0, type: "hunting", state: "Pennsylvania", species: ["Whitetail Deer", "Turkey", "Bear"], desc: "Prime PA public hunting ground" },
  { name: "Raystown Lake", lat: 40.4, lng: -78.1, type: "fishing", state: "Pennsylvania", species: ["Walleye", "Bass", "Trout"], desc: "PA's largest reservoir" },
  { name: "Delaware River", lat: 41.2, lng: -74.9, type: "fishing", state: "Pennsylvania", species: ["Trout", "Bass", "Shad"], desc: "World-class wild brown trout" },
  { name: "Chequamegon NF", lat: 45.9, lng: -90.8, type: "hunting", state: "Wisconsin", species: ["Whitetail Deer", "Bear", "Turkey"], desc: "Excellent bear and deer density" },
  { name: "Lake Winnebago", lat: 44.0, lng: -88.4, type: "fishing", state: "Wisconsin", species: ["Walleye", "Perch", "Sturgeon"], desc: "Ice fishing sturgeon capital" },
  { name: "Flambeau River", lat: 45.7, lng: -90.5, type: "fishing", state: "Wisconsin", species: ["Walleye", "Bass", "Muskie"], desc: "Wild muskie and walleye river" },
  { name: "Tongass NF", lat: 57.0, lng: -134.0, type: "hunting", state: "Alaska", species: ["Bear", "Deer", "Moose"], desc: "World's largest national forest" },
  { name: "Kenai River", lat: 60.5, lng: -150.8, type: "fishing", state: "Alaska", species: ["Salmon", "Trout"], desc: "World-famous King Salmon fishery" },
  { name: "Kodiak Island", lat: 57.5, lng: -153.5, type: "hunting", state: "Alaska", species: ["Bear", "Deer"], desc: "Kodiak brown bear paradise" },
  { name: "Bristol Bay", lat: 58.7, lng: -157.0, type: "fishing", state: "Alaska", species: ["Salmon", "Trout"], desc: "Greatest sockeye salmon run on Earth" },
  { name: "Kisatchie NF", lat: 31.4, lng: -92.8, type: "hunting", state: "Louisiana", species: ["Whitetail Deer", "Turkey", "Hog"], desc: "Only national forest in Louisiana" },
  { name: "Toledo Bend Reservoir", lat: 31.4, lng: -93.6, type: "fishing", state: "Louisiana", species: ["Bass", "Crappie", "Catfish"], desc: "Top 10 bass lake in the US" },
  { name: "Atchafalaya Basin", lat: 30.2, lng: -91.7, type: "fishing", state: "Louisiana", species: ["Bass", "Catfish", "Crappie"], desc: "Nation's largest river swamp" },
  { name: "Chattahoochee NF", lat: 34.7, lng: -84.1, type: "hunting", state: "Georgia", species: ["Whitetail Deer", "Turkey", "Bear"], desc: "North Georgia mountain hunting" },
  { name: "Lake Lanier", lat: 34.2, lng: -83.9, type: "fishing", state: "Georgia", species: ["Bass", "Striped Bass", "Crappie"], desc: "Metro Atlanta's premier fishing lake" },
  { name: "Okefenokee Swamp", lat: 30.7, lng: -82.3, type: "fishing", state: "Georgia", species: ["Bass", "Catfish"], desc: "Blackwater swamp bass fishing" },
  { name: "Ozark NF", lat: 35.8, lng: -93.1, type: "hunting", state: "Arkansas", species: ["Whitetail Deer", "Turkey", "Bear"], desc: "Excellent Ozark Mountain deer hunting" },
  { name: "Bull Shoals Lake", lat: 36.4, lng: -92.6, type: "fishing", state: "Arkansas", species: ["Bass", "Walleye", "Trout"], desc: "World-class bass and trout fishing" },
  { name: "White River", lat: 35.9, lng: -92.0, type: "fishing", state: "Arkansas", species: ["Trout"], desc: "Trophy rainbow and brown trout" },
  { name: "Manistee NF", lat: 44.0, lng: -85.8, type: "hunting", state: "Michigan", species: ["Whitetail Deer", "Turkey", "Bear"], desc: "Excellent UP deer and turkey hunting" },
  { name: "Lake St. Clair", lat: 42.4, lng: -82.7, type: "fishing", state: "Michigan", species: ["Walleye", "Bass", "Muskie"], desc: "Walleye and muskie hotspot" },
  { name: "Au Sable River", lat: 44.4, lng: -84.2, type: "fishing", state: "Michigan", species: ["Trout"], desc: "Michigan's premier trout stream" },
  { name: "Hoosier NF", lat: 38.5, lng: -86.4, type: "hunting", state: "Indiana", species: ["Whitetail Deer", "Turkey"], desc: "Indiana's only national forest" },
  { name: "Patoka Lake", lat: 38.4, lng: -86.7, type: "fishing", state: "Indiana", species: ["Bass", "Crappie", "Catfish"], desc: "Southern Indiana bass fishing" },
  { name: "Ouachita NF", lat: 34.6, lng: -93.9, type: "hunting", state: "Arkansas", species: ["Whitetail Deer", "Turkey", "Bear"], desc: "Rugged Ouachita Mountain hunting" },
  { name: "Nantahala NF", lat: 35.2, lng: -83.6, type: "hunting", state: "North Carolina", species: ["Whitetail Deer", "Turkey", "Bear"], desc: "Western NC mountain hunting" },
  { name: "Lake Norman", lat: 35.6, lng: -80.9, type: "fishing", state: "North Carolina", species: ["Bass", "Striped Bass", "Crappie"], desc: "NC's largest man-made lake" },
  { name: "New River", lat: 36.5, lng: -81.0, type: "fishing", state: "North Carolina", species: ["Smallmouth Bass", "Trout"], desc: "Wild smallmouth bass river" },
  { name: "George Washington NF", lat: 38.5, lng: -79.3, type: "hunting", state: "Virginia", species: ["Whitetail Deer", "Turkey", "Bear"], desc: "1.8M acres of Appalachian hunting" },
  { name: "Claytor Lake", lat: 37.1, lng: -80.6, type: "fishing", state: "Virginia", species: ["Walleye", "Bass", "Striped Bass"], desc: "Walleye hotspot in SW Virginia" },
  { name: "Deschutes NF", lat: 44.0, lng: -121.5, type: "hunting", state: "Oregon", species: ["Elk", "Deer", "Bear"], desc: "Central Oregon elk and deer" },
  { name: "Klamath River", lat: 41.9, lng: -123.5, type: "fishing", state: "Oregon", species: ["Salmon", "Steelhead", "Trout"], desc: "Premier steelhead fishery" },
  { name: "Crater Lake", lat: 42.9, lng: -122.1, type: "fishing", state: "Oregon", species: ["Trout", "Salmon"], desc: "Deepest lake in the US — trophy trout" },
  { name: "Okanogan NF", lat: 48.5, lng: -119.5, type: "hunting", state: "Washington", species: ["Elk", "Deer", "Bear"], desc: "NE Washington big game country" },
  { name: "Columbia River", lat: 46.2, lng: -119.1, type: "fishing", state: "Washington", species: ["Salmon", "Steelhead", "Sturgeon"], desc: "World's greatest salmon river" },
  { name: "Lake Chelan", lat: 47.9, lng: -120.0, type: "fishing", state: "Washington", species: ["Trout", "Salmon"], desc: "Deep glacier lake trophy trout" },
  { name: "Plumas NF", lat: 39.9, lng: -121.0, type: "hunting", state: "California", species: ["Deer", "Bear", "Turkey"], desc: "Northern California deer and bear" },
  { name: "Shasta Lake", lat: 40.7, lng: -122.4, type: "fishing", state: "California", species: ["Bass", "Trout", "Salmon"], desc: "CA's largest reservoir" },
  { name: "Trinity River", lat: 40.7, lng: -123.4, type: "fishing", state: "California", species: ["Salmon", "Steelhead", "Trout"], desc: "Legendary steelhead run" },
  { name: "Kaibab NF", lat: 36.7, lng: -112.2, type: "hunting", state: "Arizona", species: ["Mule Deer", "Elk", "Turkey"], desc: "Trophy mule deer and elk" },
  { name: "Lake Powell", lat: 37.1, lng: -111.3, type: "fishing", state: "Arizona", species: ["Bass", "Walleye", "Catfish"], desc: "Desert canyon bass fishery" },
  { name: "Verde River", lat: 34.5, lng: -111.8, type: "fishing", state: "Arizona", species: ["Bass", "Catfish", "Trout"], desc: "AZ's longest free-flowing river" },
  { name: "Cibola NF", lat: 34.8, lng: -106.5, type: "hunting", state: "New Mexico", species: ["Elk", "Mule Deer", "Bear"], desc: "Diverse New Mexico big game" },
  { name: "Elephant Butte Lake", lat: 33.1, lng: -107.2, type: "fishing", state: "New Mexico", species: ["Bass", "Walleye", "Catfish"], desc: "NM's largest reservoir" },
  { name: "Sawtooth NF", lat: 44.0, lng: -114.8, type: "hunting", state: "Idaho", species: ["Elk", "Deer", "Bear"], desc: "Central Idaho wilderness hunting" },
  { name: "Snake River", lat: 43.8, lng: -116.5, type: "fishing", state: "Idaho", species: ["Trout", "Steelhead", "Salmon"], desc: "World-class steelhead and trout" },
  { name: "Clearwater NF", lat: 46.5, lng: -115.0, type: "hunting", state: "Idaho", species: ["Elk", "Deer", "Bear"], desc: "Remote elk wilderness" },
  { name: "Huron-Manistee NF", lat: 44.3, lng: -85.5, type: "hunting", state: "Michigan", species: ["Whitetail Deer", "Bear", "Turkey"], desc: "Lower Peninsula prime hunting" },
  { name: "Boundary Waters BWCA", lat: 48.0, lng: -91.5, type: "fishing", state: "Minnesota", species: ["Walleye", "Pike", "Bass", "Trout"], desc: "Million acres of pristine fishing" },
  { name: "Superior NF", lat: 47.8, lng: -91.0, type: "hunting", state: "Minnesota", species: ["Moose", "Bear", "Deer"], desc: "Moose and bear country" },
  { name: "Mille Lacs Lake", lat: 46.2, lng: -93.6, type: "fishing", state: "Minnesota", species: ["Walleye", "Bass", "Perch"], desc: "Walleye capital of the world" },
  { name: "Red Lake WMA", lat: 48.0, lng: -95.0, type: "hunting", state: "Minnesota", species: ["Whitetail Deer", "Turkey", "Waterfowl"], desc: "Northwestern MN waterfowl and deer" },
  { name: "Hiawatha NF", lat: 46.1, lng: -86.5, type: "hunting", state: "Michigan", species: ["Whitetail Deer", "Bear", "Turkey"], desc: "Upper Peninsula hunting" },
  { name: "Green River", lat: 41.5, lng: -109.5, type: "fishing", state: "Utah", species: ["Trout"], desc: "Blue ribbon tailwater trout" },
  { name: "Lake Powell UT", lat: 37.0, lng: -110.8, type: "fishing", state: "Utah", species: ["Bass", "Striped Bass", "Walleye"], desc: "Massive canyon bass fishery" },
  { name: "Uinta NF", lat: 40.1, lng: -111.2, type: "hunting", state: "Utah", species: ["Elk", "Mule Deer", "Bear"], desc: "Rocky Mountain elk and deer" },
  { name: "Caribou NF", lat: 42.8, lng: -111.5, type: "hunting", state: "Idaho", species: ["Elk", "Mule Deer", "Antelope"], desc: "SE Idaho big game" },
  { name: "Chattahoochee NRA", lat: 34.0, lng: -84.4, type: "fishing", state: "Georgia", species: ["Trout"], desc: "Urban blue ribbon trout fishery" },
  { name: "Lake Texoma", lat: 33.8, lng: -96.6, type: "fishing", state: "Texas", species: ["Striped Bass", "Bass", "Catfish"], desc: "Striped bass capital of the world" },
  { name: "Sabine NF", lat: 31.4, lng: -93.9, type: "hunting", state: "Texas", species: ["Whitetail Deer", "Turkey", "Hog"], desc: "East Texas national forest" },
  { name: "Daniel Boone NF", lat: 37.5, lng: -83.8, type: "hunting", state: "Kentucky", species: ["Whitetail Deer", "Turkey", "Bear"], desc: "Eastern Kentucky mountain hunting" },
  { name: "Kentucky Lake", lat: 36.8, lng: -88.2, type: "fishing", state: "Kentucky", species: ["Bass", "Crappie", "Catfish"], desc: "World's largest man-made lake by shoreline" },
  { name: "Cumberland River", lat: 36.6, lng: -87.4, type: "fishing", state: "Tennessee", species: ["Trout", "Bass", "Walleye"], desc: "Trophy brown trout tailwater" },
  { name: "Cherokee NF", lat: 36.1, lng: -82.5, type: "hunting", state: "Tennessee", species: ["Whitetail Deer", "Turkey", "Bear"], desc: "East Tennessee mountain hunting" },
  { name: "Reelfoot Lake", lat: 36.5, lng: -89.4, type: "fishing", state: "Tennessee", species: ["Crappie", "Bass", "Catfish"], desc: "Premier crappie fishing" },
  { name: "Tonto NF", lat: 33.8, lng: -111.2, type: "hunting", state: "Arizona", species: ["Mule Deer", "Elk", "Javelina"], desc: "Arizona's largest national forest" },
  { name: "Lake Pleasant", lat: 33.8, lng: -112.3, type: "fishing", state: "Arizona", species: ["Bass", "Striped Bass", "Catfish"], desc: "Phoenix metro bass fishing" },
];

const FREE_LIMIT = 10;
const FREE_PIN_LIMIT = 5;

// ─── SVG NATURE DECORATIONS ───────────────────────────────────────────────────
const DeerSVG = ({ style: s = {} }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ ...s }}>
    <g opacity="0.08" fill="currentColor">
      <ellipse cx="50" cy="72" rx="22" ry="14" />
      <rect x="44" y="58" width="5" height="20" rx="2.5" />
      <rect x="51" y="58" width="5" height="20" rx="2.5" />
      <rect x="40" y="65" width="4" height="14" rx="2" />
      <rect x="56" y="65" width="4" height="14" rx="2" />
      <ellipse cx="50" cy="52" rx="14" ry="10" />
      <ellipse cx="50" cy="40" rx="8" ry="6" />
      <path d="M42 36 C40 28 36 20 38 14 C40 10 43 12 44 18 C45 22 44 28 45 32" />
      <path d="M44 30 C43 26 44 22 46 20 C48 18 49 22 48 26" />
      <path d="M58 36 C60 28 64 20 62 14 C60 10 57 12 56 18 C55 22 56 28 55 32" />
      <path d="M56 30 C57 26 56 22 54 20 C52 18 51 22 52 26" />
      <circle cx="47" cy="38" r="1.5" />
      <circle cx="53" cy="38" r="1.5" />
      <ellipse cx="50" cy="44" rx="3" ry="2" />
    </g>
  </svg>
);

const TreeSVG = ({ style: s = {} }) => (
  <svg viewBox="0 0 70 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ ...s }}>
    <g opacity="0.07" fill="currentColor">
      <polygon points="35,4 6,54 64,54" />
      <polygon points="35,20 8,66 62,66" />
      <polygon points="35,38 10,82 60,82" />
      <rect x="28" y="82" width="14" height="34" rx="2" />
    </g>
  </svg>
);

const MtnSVG = ({ style: s = {} }) => (
  <svg viewBox="0 0 400 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ ...s }}>
    <g opacity="0.055" fill="currentColor">
      <polygon points="200,4 60,100 340,100" />
      <polygon points="310,18 220,100 400,100" />
      <polygon points="90,28 0,100 200,100" />
      <polygon points="175,8 163,30 187,30" fill="white" opacity="0.5" />
      <polygon points="305,21 295,38 315,38" fill="white" opacity="0.4" />
    </g>
  </svg>
);

const FireSVG = ({ style: s = {} }) => (
  <svg viewBox="0 0 60 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ ...s }}>
    <g opacity="0.1">
      <ellipse cx="30" cy="68" rx="18" ry="6" fill="#c17f24" />
      <path d="M18 68 C16 58 20 50 18 42 C16 34 12 28 16 22 C20 16 26 22 25 32 C24 38 22 44 24 52 C26 58 24 66 22 68Z" fill="#c17f24" />
      <path d="M42 68 C44 58 40 50 42 42 C44 34 48 28 44 22 C40 16 34 22 35 32 C36 38 38 44 36 52 C34 58 36 66 38 68Z" fill="#c17f24" />
      <path d="M30 62 C28 52 32 44 30 34 C28 24 24 18 27 13 C30 8 34 14 33 24 C32 32 30 40 32 48 C34 54 32 62 30 62Z" fill="#d4930a" />
      <path d="M24 56 C22 48 25 42 23 35 C21 28 18 24 20 20 C22 16 26 20 25 27 C24 32 24 38 26 44 C27 48 25 56 24 56Z" fill="#d4930a" />
      <path d="M36 56 C38 48 35 42 37 35 C39 28 42 24 40 20 C38 16 34 20 35 27 C36 32 36 38 34 44 C33 48 35 56 36 56Z" fill="#d4930a" />
    </g>
  </svg>
);

// ─── GLOBAL CSS ───────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
  * { box-sizing:border-box; margin:0; padding:0; word-break:break-word; overflow-wrap:break-word; }
  :root {
    --bg:#050505; --bg2:#0a0a0a;
    --card:rgba(255,255,255,0.02); --card-hover:rgba(255,255,255,0.05);
    --border:rgba(255,255,255,0.10); --border-accent:rgba(139,195,74,0.3);
    --border-top:rgba(255,255,255,0.13);
    --green:#8bc34a; --green2:#7cb342; --green-dim:rgba(139,195,74,0.12);
    --amber:#b87333; --amber-dim:rgba(184,115,51,0.12);
    --text:#f5f7f3; --text2:rgba(245,247,243,0.7); --text3:rgba(245,247,243,0.5);
    --font-display:'Cinzel',Georgia,serif;
    --font-body:'DM Sans',system-ui,sans-serif;
    --radius:16px; --radius-sm:10px;
    --green-glow:rgba(139,195,74,0.15);
  }
  body { background:var(--bg); color:var(--text); font-family:var(--font-body); }
  button { transition: transform 0.1s ease; }
  button:active { transform: scale(0.96); }
  body::before { content:''; position:fixed; inset:0; pointer-events:none; z-index:0;
    background:
      radial-gradient(ellipse 90% 50% at 50% -10%, rgba(0,0,0,0) 0%, transparent 65%),
      radial-gradient(ellipse 50% 30% at 15% 60%, rgba(0,0,0,0) 0%, transparent 55%),
      radial-gradient(ellipse 40% 25% at 85% 40%, rgba(0,0,0,0) 0%, transparent 50%),
      radial-gradient(ellipse 60% 40% at 50% 100%, rgba(0,0,0,0) 0%, transparent 60%); }
  body::after { content:''; position:fixed; inset:0; pointer-events:none; z-index:0;
    background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(120,180,80,0.008) 2px, rgba(120,180,80,0.008) 4px),
      repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(120,180,80,0.005) 2px, rgba(120,180,80,0.005) 4px); }
  .grain { position:fixed; inset:0; pointer-events:none; z-index:100; opacity:0.045;
    background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size:160px; }
  .fade-in { animation:none; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .btn-primary, .btn-ghost, .btn-gold { transition: transform 0.1s ease, box-shadow 0.1s ease; }
  .btn-primary:active, .btn-ghost:active, .btn-gold:active { transform: scale(0.96); }
  .slide-up { animation:slideUp 0.55s cubic-bezier(0.16,1,0.3,1) forwards; opacity:0; }
  @keyframes slideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  .pulse { animation:pulse 2.2s ease-in-out infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
  .float { animation:float 5s ease-in-out infinite; }
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @keyframes likePop { 0%{transform:scale(1)} 25%{transform:scale(1.35)} 50%{transform:scale(0.9)} 75%{transform:scale(1.15)} 100%{transform:scale(1)} }
  .like-pop { animation:likePop 0.4s cubic-bezier(0.36,0.07,0.19,0.97); }
  
  input, textarea, select { font-size: 16px !important; scroll-margin-bottom: 20px; }
  body.map-fullscreen header, body.map-fullscreen .bottom-nav { display: none !important; }
  body.dm-fullscreen header, body.dm-fullscreen .bottom-nav { display: none !important; }
  body.dm-fullscreen { overflow: hidden; }
  body.dm-fullscreen > div { transform: none !important; filter: none !important; will-change: auto !important; }
  @media (max-width: 480px) {
    .hide-mobile { display: none !important; }
    .card { padding: 8px !important; }
    .btn-primary, .btn-ghost { padding: 6px 11px !important; font-size: 12px !important; }
    h2 { font-size: 82% !important; }
    .fade-in { gap: 8px !important; }
    input, textarea, select { font-size: 16px !important; }
    .nav-tab { padding: 6px 13px !important; font-size: 12px !important; }
    .checklist-item { padding: 8px 12px !important; font-size: 13px !important; }
    .weather-stat { padding: 10px 8px !important; }
    .msg-bubble { font-size: 13px !important; }
  }
  
  
  .btn-primary { background:linear-gradient(135deg, #a5d65a 0%, var(--green) 40%, var(--green2) 100%); color:white; border:none;
    border-radius:var(--radius-sm); font-family:var(--font-body); font-weight:600; cursor:pointer;
    transition:all 200ms cubic-bezier(0.4,0,0.2,1); box-shadow:0 4px 20px rgba(139,195,74,0.3), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -2px 0 rgba(0,0,0,0.15); }
  .btn-primary:hover { transform:translateY(-1px); box-shadow:0 0 20px rgba(139,195,74,0.3), 0 6px 24px rgba(139,195,74,0.4), inset 0 1px 0 rgba(255,255,255,0.2); }
  .btn-primary:active { transform:translateY(0px); box-shadow:0 2px 8px rgba(139,195,74,0.2), inset 0 2px 4px rgba(0,0,0,0.2); }
  .btn-ghost { background:rgba(255,255,255,0.03);
    border:1px solid var(--border); color:var(--text2);
    border-radius:var(--radius-sm); font-family:var(--font-body); cursor:pointer;
    transition:all 200ms cubic-bezier(0.4,0,0.2,1); }
  .btn-ghost:hover { background:rgba(255,255,255,0.06); border-color:var(--border-accent); color:var(--text); transform:translateY(-1px); }
  .btn-ghost:active { transform:translateY(0px); }
  .more-btn:hover .more-icon { transform: scale(1.15); }
  .card { background:var(--card); backdrop-filter:blur(12px);
    border:1px solid var(--border);
    border-radius:var(--radius); transition:all 200ms cubic-bezier(0.4,0,0.2,1);
    box-shadow:0 2px 16px rgba(0,0,0,0.4); }
  .card:hover { border-color:var(--border-accent); box-shadow:0 8px 28px rgba(0,0,0,0.5), 0 0 20px rgba(139,195,74,0.06); transform:translateY(-2px); }
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
  .nav-tab.active { background:linear-gradient(135deg,var(--green),var(--green2)); color:white; box-shadow:0 4px 16px rgba(120,180,80,0.3), inset 0 1px 0 rgba(255,255,255,0.2); }
  .nav-tab.inactive { background:rgba(255,255,255,0.03); border-color:var(--border); color:var(--text3); }
  .nav-tab.inactive:hover { color:var(--text2); border-color:var(--border-accent); background:rgba(255,255,255,0.06); }
  .msg-bubble { line-height:1.75; font-size:14px; }
  .msg-bubble strong { color:var(--green); font-weight:600; }
  .checklist-item { display:flex; align-items:center; gap:12px; padding:11px 16px;
    border-radius:var(--radius-sm); background:rgba(255,255,255,0.03); border:1px solid var(--border);
    color:var(--text2); font-size:14px; cursor:pointer; transition:all 0.15s; user-select:none; }
  .checklist-item:hover { background:var(--green-dim); border-color:var(--border-accent); color:var(--text); }
  .checklist-item.checked { background:var(--green-dim); border-color:rgba(120,180,80,0.3); color:var(--green); text-decoration:line-through; opacity:0.6; }
  .weather-stat { display:flex; flex-direction:column; align-items:center; gap:4px; padding:16px; flex:1;
    background:linear-gradient(160deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.1) 100%);
    border-radius:var(--radius-sm); border:1px solid var(--border); border-top-color:rgba(255,255,255,0.1); }
  .pill { background:linear-gradient(160deg, rgba(80,95,110,0.35) 0%, rgba(45,58,70,0.28) 100%); border:1px solid rgba(100,125,150,0.4); border-top-color:rgba(160,185,210,0.3); color:rgba(170,190,210,0.85); border-radius:20px; font-family:var(--font-body); cursor:pointer; transition:all 0.2s; box-shadow:0 4px 12px rgba(0,0,0,0.35), inset 0 1px 0 rgba(160,185,210,0.2), inset 0 -2px 0 rgba(0,0,0,0.2); }
  .pill:hover { background:rgba(90,110,130,0.5); border-color:rgba(140,170,200,0.55); color:rgba(200,220,240,0.95); transform:translateY(-2px); box-shadow:0 6px 18px rgba(0,0,0,0.4), inset 0 1px 0 rgba(160,185,210,0.2); }
  .pill:active { transform:translateY(0px); box-shadow:0 2px 6px rgba(0,0,0,0.3), inset 0 2px 4px rgba(0,0,0,0.2); }
  .pill-active { background:linear-gradient(160deg, rgba(60,120,190,0.6) 0%, rgba(35,85,150,0.5) 100%); border:1px solid rgba(90,160,240,0.7); border-top-color:rgba(140,200,255,0.6); color:#a8d8ff; font-weight:700; box-shadow:0 4px 16px rgba(60,130,220,0.4), inset 0 1px 0 rgba(160,210,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.2); }
  .pill-active:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(60,130,220,0.5), inset 0 1px 0 rgba(160,210,255,0.3); }
  .btn-gold { background:linear-gradient(135deg, #f0c030 0%, #e8b020 40%, #c49010 100%); border:none; color:#0a1200; font-family:var(--font-body); font-weight:600; cursor:pointer; transition:all 0.2s; box-shadow:0 4px 16px rgba(232,176,32,0.45), inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.15); }
  .btn-gold:hover { transform:translateY(-2px); box-shadow:0 8px 28px rgba(232,176,32,0.6), inset 0 1px 0 rgba(255,255,255,0.3); }
  .btn-gold:active { transform:translateY(0px); box-shadow:0 2px 8px rgba(232,176,32,0.3), inset 0 2px 4px rgba(0,0,0,0.2); }
  .mapboxgl-map { height:100%; width:100%; }
  .leaflet-container { background:#0d1a0d !important; }
  .leaflet-tile { filter:brightness(0.55) saturate(0.45) hue-rotate(55deg) !important; }
  .custom-marker { background:none !important; border:none !important; }
  .mapboxgl-ctrl-top-right { display: none !important; }
  .mapboxgl-ctrl-bottom-left { display: none !important; }
  
  @media (max-width: 640px) {
    .mobile-home-btn { padding:5px 10px !important; font-size:12px !important; }
    .mobile-header-badge { padding:4px 8px !important; font-size:11px !important; }
    .mobile-header-logo { font-size:15px !important; }
    .mobile-header-logo-img { width:22px !important; height:22px !important; }
    .mobile-state-select { display:none !important; }
    .mobile-header-center { position:relative !important; left:auto !important; transform:none !important; }
  }
`;

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function capName(str) { if (!str) return "Hunter"; return str.charAt(0).toUpperCase() + str.slice(1); }

async function stripExif(file) {
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d").drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob(blob => resolve(new File([blob], file.name, { type: "image/jpeg" })), "image/jpeg", 0.92);
    };
    img.onerror = () => resolve(file);
    img.src = url;
  });
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
let _showToast = null;
function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = (msg, type = "info") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };
  _showToast = show;
  return { toasts };
}
function toast(msg, type = "info") { _showToast?.(msg, type); }
function ToastContainer({ toasts }) {
  return createPortal(
    <div style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", zIndex: 999999, display: "flex", flexDirection: "column", gap: 8, alignItems: "center", pointerEvents: "none" }}>
      {toasts.map(t => (
        <div key={t.id} className="fade-in" style={{ background: t.type === "error" ? "rgba(220,50,50,0.95)" : t.type === "success" ? "rgba(45,90,27,0.97)" : "rgba(20,30,20,0.97)", color: "white", padding: "10px 20px", borderRadius: 24, fontSize: 14, fontWeight: 600, fontFamily: "var(--font-body)", boxShadow: "0 4px 24px rgba(0,0,0,0.4)", border: t.type === "success" ? "1px solid rgba(120,180,80,0.4)" : "1px solid rgba(255,255,255,0.1)", whiteSpace: "nowrap" }}>
          {t.msg}
        </div>
      ))}
    </div>,
    document.body
  );
}

function TypewriterText({ text, onDone }) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    setDisplayed(""); let i = 0;
    let cancelled = false;
    const type = () => {
      if (cancelled) return;
      if (i < text.length) {
        const chunk = Math.floor(Math.random() * 3) + 1;
        i = Math.min(i + chunk, text.length);
        setDisplayed(text.slice(0, i));
        setTimeout(type, Math.random() * 20 + 15);
      } else {
        onDone?.();
      }
    };
    setTimeout(type, 50);
    return () => { cancelled = true; };
  }, [text]);
  return <span className="msg-bubble" dangerouslySetInnerHTML={{ __html: displayed.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>") }} />;
}
const fmtMsg = (t) => <span className="msg-bubble" dangerouslySetInnerHTML={{ __html: t.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>") }} />;

// ─── WEATHER ──────────────────────────────────────────────────────────────────
function WeatherWidget({ selectedState, weather, setWeather, locationName, setLocationName }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState(null);

  const searchLocations = async (val) => {
    if (val.length < 2) { setSuggestions([]); return; }
    try {
      const token = import.meta.env.VITE_MAPBOX_TOKEN;
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(val)}.json?access_token=${token}&country=us&types=place,locality,district&limit=8&language=en`);
      const data = await res.json();
      const unique = (data.features || []).map(f => ({
        display_name: f.place_name,
        lat: f.center[1],
        lon: f.center[0],
      }));
      setSuggestions(unique);
      setShowDropdown(true);
    } catch { setSuggestions([]); }
  };

  const loadWeather = async (lat, lon, name) => {
    setLoading(true); setError(null); setShowDropdown(false); setLocationName(name);
    try {
      const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,precipitation&wind_speed_unit=mph&temperature_unit=fahrenheit&timezone=auto`);
      const d = await r.json();
      if (d.current) setWeather({ ...d.current, lat, lng: lon });
    } catch { setError("Unable to load weather."); }
    setLoading(false);
  };

  const wxIcon = (c) => { if (!c) return "🌤️"; if (c === 0) return "☀️"; if (c <= 3) return "⛅"; if (c <= 48) return "🌫️"; if (c <= 67) return "🌧️"; if (c <= 77) return "❄️"; if (c <= 82) return "🌦️"; return "⛈️"; };
  const cond = (w) => {
    if (!w) return null;
    if (w.precipitation > 0.1) return { label: "Rain/Snow — Great for tracking!", color: "var(--green)" };
    if (w.wind_speed_10m < 10 && w.temperature_2m < 50 && w.temperature_2m > 20) return { label: "Excellent hunting conditions", color: "var(--green)" };
    if (w.wind_speed_10m > 20) return { label: "High wind — animals bedded down", color: "var(--amber)" };
    if (w.temperature_2m > 70) return { label: "Warm — animals moving at night", color: "var(--amber)" };
    return { label: "Fair conditions", color: "var(--text2)" };
  };

  const c2 = weather ? cond(weather) : null;

  return (
    <div className="card fade-in" style={{ padding: 24 }}>
      <div style={{ color: "var(--text3)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 12 }}>LIVE WEATHER</div>

      <div style={{ position: "relative", marginBottom: 20 }}>
        <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#4a6a4a", pointerEvents: "none" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
        <input
          value={query}
          onChange={e => { const v = e.target.value; setQuery(v); clearTimeout(window._wt); window._wt = setTimeout(() => searchLocations(v), 300); }}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          placeholder="Search a location..."
          style={{ width: "100%", padding: "12px 16px 12px 34px", borderRadius: "var(--radius-sm)", fontSize: 14 }}
        />
        {showDropdown && suggestions.length > 0 && (
          <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#0d1a0d", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", zIndex: 100, maxHeight: 220, overflowY: "auto", marginTop: 4 }}>
            {suggestions.map((s, i) => (
              <div key={i} onClick={() => { const name = s.display_name.split(",").slice(0, 2).join(",").trim(); setQuery(name); loadWeather(s.lat, s.lon, name); }}
                style={{ padding: "10px 14px", cursor: "pointer", fontSize: 13, color: "var(--text2)", borderBottom: "1px solid var(--border)" }}
                onMouseEnter={e => e.target.style.background = "var(--card-hover)"}
                onMouseLeave={e => e.target.style.background = "transparent"}
              >
                {s.display_name.split(",").slice(0, 2).join(",").trim()}
              </div>
            ))}
          </div>
        )}
      </div>

      {loading && <div style={{ textAlign: "center", padding: 30, color: "var(--text3)", fontSize: 13 }} className="pulse">Loading weather...</div>}
      {error && <div style={{ color: "var(--amber)", fontSize: 13, padding: 16, textAlign: "center" }}>{error}</div>}
      {!weather && !loading && !error && (
        <div style={{ textAlign: "center", padding: 32, color: "var(--text3)", fontSize: 14 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🌤️</div>
          Search any hunting or fishing location to get live conditions
        </div>
      )}
      {weather && !loading && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <span style={{ fontSize: 42 }}>{wxIcon(weather.weather_code)}</span>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 38, fontWeight: 700, color: "var(--text)", lineHeight: 1 }}>{Math.round(weather.temperature_2m)}°F</div>
              <div style={{ color: "var(--text3)", fontSize: 12, marginTop: 3 }}>{locationName}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {[["💧", `${weather.relative_humidity_2m}%`, "Humidity"], ["💨", `${Math.round(weather.wind_speed_10m)} mph`, "Wind"], ["🌧️", `${weather.precipitation}"`, "Precip"]].map(([ic, val, lbl], i) => (
              <div key={i} className="weather-stat">
                <span style={{ fontSize: 17 }}>{ic}</span>
                <span style={{ color: "var(--text)", fontWeight: 600, fontSize: 13 }}>{val}</span>
                <span style={{ color: "var(--text3)", fontSize: 10 }}>{lbl}</span>
              </div>
            ))}
          </div>


          {/* Solunar Card */}
          {(() => {
            const now = new Date();
            const rad = Math.PI / 180, deg = 180 / Math.PI;

            // Moon phase
            const synodicMonth = 29.53058867;
            const known = new Date(2000, 0, 6, 18, 14, 0);
            const diff = (now - known) / (1000 * 60 * 60 * 24);
            const phase = ((diff % synodicMonth) + synodicMonth) % synodicMonth;

            // Meeus algorithm for accurate moon transit time
            const JD = (now.getTime() / 86400000) + 2440587.5;
            const T = (JD - 2451545.0) / 36525;
            const L0 = (218.3164477 + 481267.88123421 * T) % 360;
            const M = (357.5291092 + 35999.0502909 * T) % 360;
            const Mprime = (134.9633964 + 477198.8675055 * T) % 360;
            const D = (297.8501921 + 445267.1114034 * T) % 360;
            const F = (93.2720950 + 483202.0175233 * T) % 360;
            const sinTerms = [[6288774, 0, 1, 0, 0], [1274027, 2, -1, 0, 0], [658314, 2, 0, 0, 0], [213618, 0, 2, 0, 0], [-185116, 1, 0, 0, 0], [-114332, 0, 0, 0, 2], [58793, 2, -2, 0, 0], [57066, 2, -1, 1, 0], [53322, 2, 0, 1, 0]];
            let sigmaL = 0;
            for (const [coef, d, mp, m, f] of sinTerms) sigmaL += coef * Math.sin(rad * (d * D + mp * Mprime + m * M + f * F));
            const moonLng = (L0 + sigmaL / 1000000) % 360;
            const moonLat = 5.128 * Math.sin(rad * F);
            const obliquity = 23.439291 - 0.013004 * T;
            const sinRA = Math.sin(rad * moonLng) * Math.cos(rad * obliquity) - Math.tan(rad * moonLat) * Math.sin(rad * obliquity);
            let RA = deg * Math.atan2(sinRA, Math.cos(rad * moonLng));
            if (RA < 0) RA += 360;
            const GST = (280.46061837 + 360.98564736629 * (JD - 2451545.0)) % 360;
            // Use weather location lng if available, otherwise default to -98 (center US)
            const userLng = typeof weather?.lng === 'number' ? weather.lng : -98;
            const LST = ((GST + userLng) % 360 + 360) % 360;
            let HA = LST - RA;
            if (HA > 180) HA -= 360;
            if (HA < -180) HA += 360;
            const currentUTCHour = now.getUTCHours() + now.getUTCMinutes() / 60;
            let transitUTC = currentUTCHour - HA / 15;
            transitUTC = ((transitUTC % 24) + 24) % 24;
            const tzOffset = Math.round(userLng / 15);
            const major1 = (transitUTC + tzOffset + 24) % 24;
            const major2 = (major1 + 12) % 24;
            const minor1 = (major1 + 6) % 24;
            const minor2 = (major1 + 18) % 24;

            // Rating based on moon phase
            const distFromNew = Math.min(phase, synodicMonth - phase) / (synodicMonth / 2);
            const distFromFull = Math.abs(phase - synodicMonth / 2) / (synodicMonth / 2);
            const rating = Math.max(0, 1 - Math.min(distFromNew, distFromFull) * 2);
            const ratingLabel = rating > 0.75 ? "Excellent" : rating > 0.5 ? "Good" : rating > 0.25 ? "Fair" : "Poor";
            const ratingColor = rating > 0.75 ? "#4ade80" : rating > 0.5 ? "#a3e635" : rating > 0.25 ? "#fbbf24" : "#f87171";
            const bars = Math.round(rating * 4);

            const hour = now.getHours() + now.getMinutes() / 60;
            const fmt = (h) => { if (isNaN(h) || !isFinite(h)) return "--:--"; const hh = Math.floor(h), mm = Math.round((h - hh) * 60), ap = hh >= 12 ? "PM" : "AM"; return `${hh % 12 || 12}:${mm.toString().padStart(2, '0')} ${ap}`; };
            const isActive = (h) => { const diff = Math.abs(hour - h); return diff <= 1 || diff >= 23; };
            const moonIcon = phase < 1.85 ? "🌑" : phase < 5.53 ? "🌒" : phase < 9.22 ? "🌓" : phase < 12.91 ? "🌔" : phase < 16.61 ? "🌕" : phase < 20.30 ? "🌖" : phase < 23.99 ? "🌗" : "🌘";

            return (
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "11px 13px", marginTop: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div>
                    <div style={{ color: "var(--text3)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 4 }}>SOLUNAR FORECAST</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{moonIcon}</span>
                      <span style={{ color: ratingColor, fontWeight: 700, fontSize: 15, fontFamily: "var(--font-display)" }}>{ratingLabel}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} style={{ width: 6, height: 20, borderRadius: 3, background: i <= bars ? ratingColor : "rgba(255,255,255,0.08)", transition: "all 0.3s" }} />
                    ))}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    { label: "Major", time: fmt(major1), active: isActive(major1) },
                    { label: "Major", time: fmt(major2), active: isActive(major2) },
                    { label: "Minor", time: fmt(minor1), active: isActive(minor1) },
                    { label: "Minor", time: fmt(minor2), active: isActive(minor2) },
                  ].map((p, i) => (
                    <div key={i} style={{ padding: "6px 9px", borderRadius: 8, background: p.active ? "rgba(120,180,80,0.12)" : "rgba(255,255,255,0.03)", border: `1px solid ${p.active ? "rgba(120,180,80,0.3)" : "rgba(255,255,255,0.06)"}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ color: p.label === "Major" ? "var(--green)" : "var(--text3)", fontSize: 9, fontWeight: 700, letterSpacing: "0.06em" }}>{p.label.toUpperCase()}</div>
                        <div style={{ color: "var(--text)", fontWeight: 600, fontSize: 12 }}>{p.time}</div>
                      </div>
                      {p.active && <span style={{ fontSize: 9, fontWeight: 700, color: "var(--green)", background: "rgba(120,180,80,0.2)", padding: "2px 6px", borderRadius: 8 }}>NOW</span>}
                    </div>
                  ))}
                </div>
                <div style={{ color: "var(--text3)", fontSize: 10, marginTop: 8, textAlign: "center" }}>Peak activity windows for hunting & fishing</div>
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}

// ─── MAP TAB ──────────────────────────────────────────────────────────────────
function PinsPage({ pins, onBack, onSelectPin }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1010, background: "#070e07", display: "flex", flexDirection: "column", fontFamily: "var(--font-body)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 18px", borderBottom: "1px solid var(--border)", background: "rgba(8,15,8,0.98)" }}>
        <button onClick={onBack} className="btn-ghost" style={{ padding: "6px 12px", fontSize: 13 }}>← Back</button>
        <span style={{ color: "var(--text)", fontWeight: 700, fontSize: 16 }}>📍 My Pins</span>
        <span style={{ color: "var(--text3)", fontSize: 12, marginLeft: 4 }}>({pins.length})</span>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {pins.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: "var(--text3)", fontSize: 14 }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📍</div>
            No pins yet. Tap the map to drop one.
          </div>
        )}
        {pins.map(pin => (
          <button key={pin.id} onClick={() => onSelectPin(pin)} className="card" style={{ width: "100%", textAlign: "left", padding: "14px 16px", cursor: "pointer", background: "none", border: "1px solid var(--border)", borderRadius: "var(--radius)", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--green)", flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: "var(--text)", fontWeight: 600, fontSize: 14, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pin.name || "Unnamed Spot"}</div>
              {pin.species && <div style={{ color: "var(--green)", fontSize: 12 }}>{pin.species}</div>}
              {pin.location && <div style={{ color: "var(--text3)", fontSize: 11 }}>{pin.location}</div>}
            </div>
            <span style={{ color: "var(--text3)", fontSize: 18 }}>›</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function PinDetailPage({ pin, onBack, onDelete, onSharePin, onSave }) {
  const [name, setName] = useState(pin.name || "");
  const [species, setSpecies] = useState(pin.species || "");
  const [notes, setNotes] = useState(pin.notes || "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDeletePin, setConfirmDeletePin] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(pin.id, { name, species, notes });
    setSaving(false);
  };

  const handleDelete = async () => {
    setConfirmDeletePin(true);
  };
  const doDeletePin = async () => {
    setDeleting(true);
    setConfirmDeletePin(false);
    await onDelete(pin.id);
  };

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${pin.lat},${pin.lng}`;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1020, background: "#070e07", display: "flex", flexDirection: "column", fontFamily: "var(--font-body)" }}>
      {confirmDeletePin && createPortal(
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 999999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={() => setConfirmDeletePin(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#0d1a0d", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 28, maxWidth: 320, width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📍</div>
            <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 16, fontFamily: "var(--font-display)", marginBottom: 8 }}>Delete this pin?</div>
            <div style={{ color: "var(--text3)", fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>This can't be undone.</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmDeletePin(false)} className="btn-ghost" style={{ flex: 1, padding: "10px 0", fontSize: 14 }}>Cancel</button>
              <button onClick={doDeletePin} style={{ flex: 1, padding: "10px 0", fontSize: 14, background: "rgba(255,60,60,0.15)", border: "1px solid rgba(255,60,60,0.3)", borderRadius: "var(--radius-sm)", color: "rgba(255,100,100,0.9)", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}>Delete</button>
            </div>
          </div>
        </div>,
        document.body
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 18px", borderBottom: "1px solid var(--border)", background: "rgba(8,15,8,0.98)" }}>
        <button onClick={onBack} className="btn-ghost" style={{ padding: "6px 12px", fontSize: 13 }}>← Back</button>
        <span style={{ color: "var(--text)", fontWeight: 700, fontSize: 16 }}>Pin Detail</span>
        <button onClick={handleDelete} disabled={deleting} style={{ marginLeft: "auto", background: "none", border: "none", color: "rgba(255,100,100,0.75)", fontSize: 13, cursor: "pointer", fontFamily: "var(--font-body)", padding: "6px 10px" }}>
          {deleting ? "..." : "🗑️ Delete"}
        </button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 18px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={{ color: "var(--text3)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Name</label>
          <input value={name} onChange={e => setName(e.target.value)} style={{ width: "100%", padding: "11px 14px", borderRadius: "var(--radius-sm)", fontSize: 14, boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ color: "var(--text3)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Species / Type</label>
          <input value={species} onChange={e => setSpecies(e.target.value)} placeholder="e.g. Elk, Trout, Duck..." style={{ width: "100%", padding: "11px 14px", borderRadius: "var(--radius-sm)", fontSize: 14, boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ color: "var(--text3)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Conditions, access, scouting notes..." rows={4} style={{ width: "100%", padding: "11px 14px", borderRadius: "var(--radius-sm)", fontSize: 14, background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", color: "var(--text)", outline: "none", resize: "vertical", fontFamily: "var(--font-body)", boxSizing: "border-box" }} />
        </div>
        <div style={{ padding: "14px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
          <div style={{ color: "var(--text3)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Coordinates</div>
          <div style={{ color: "var(--text2)", fontSize: 13, fontFamily: "monospace" }}>{pin.lat?.toFixed(5)}, {pin.lng?.toFixed(5)}</div>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ padding: "13px", fontSize: 14 }}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
        <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ padding: "13px", fontSize: 14, textAlign: "center", display: "block", textDecoration: "none", color: "var(--text2)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
          🧭 Get Directions
        </a>
        <button onClick={() => onSharePin(pin)} style={{ background: "none", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", color: "var(--text2)", fontSize: 14, padding: "13px", cursor: "pointer", fontFamily: "var(--font-body)" }}>
          📤 Share to Community
        </button>
      </div>
    </div>
  );
}

function MapTab({ selectedState, user, onSharePin, isPro, onPinAdded }) {
  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const markersRef = useRef([]);
  const selectedRef = useRef(null);
  const dropMarkerRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [mapStyle, setMapStyle] = useState("satellite");

  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    if (isFullscreen) document.body.classList.add('map-fullscreen');
    else document.body.classList.remove('map-fullscreen');
    return () => document.body.classList.remove('map-fullscreen');
  }, [isFullscreen]);
  const [pins, setPins] = useState([]);
  const [mapReady, setMapReady] = useState(false);
  const [dropForm, setDropForm] = useState(null);
  const [dropName, setDropName] = useState("");
  const [dropSpecies, setDropSpecies] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPinList, setShowPinList] = useState(false);
  const [groups, setGroups] = useState([]);
  const [pinFilter, setPinFilter] = useState("all");
  const [newGroupName, setNewGroupName] = useState("");
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [assigningPin, setAssigningPin] = useState(null);
  const [viewingPin, setViewingPin] = useState(null);
  const [showPinsPage, setShowPinsPage] = useState(false);
  const [showPrivacyPopup, setShowPrivacyPopup] = useState(false);
  useEffect(() => { window._showMapPrivacy = () => setShowPrivacyPopup(true); return () => { delete window._showMapPrivacy; }; }, []);

  const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
  const STYLES = {
    satellite: "mapbox://styles/mapbox/satellite-streets-v12",
    terrain: "mapbox://styles/mapbox/outdoors-v12",
    street: "mapbox://styles/mapbox/dark-v11",
  };

  // Keep selectedRef in sync so marker click handlers can access current value
  useEffect(() => { selectedRef.current = selected; }, [selected]);

  const loadPins = async () => {
    if (!user) return;
    const { data } = await supabase.from("saved_pins").select("*").eq("user_id", user.id);
    setPins(data || []);
    window._addPinToMap = (pin) => setPins(prev => [...prev, pin]);
    window._removePinFromMap = (postId) => setPins(prev => prev.filter(p => p.post_id !== postId));
  };

  const loadGroups = async () => {
    if (!user) return;
    const { data } = await supabase.from("pin_groups").select("*").eq("user_id", user.id).order("created_at", { ascending: true });
    setGroups(data || []);
  };

  useEffect(() => { loadPins(); loadGroups(); }, [user]);

  const PrivacyPopup = showPrivacyPopup && user ? createPortal(
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="fade-in" style={{ background: "#0d1a0d", border: "1px solid var(--border-accent)", borderRadius: 20, padding: 28, maxWidth: 320, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
        <div style={{ color: "var(--text)", fontWeight: 800, fontSize: 17, marginBottom: 10 }}>Your pins are private</div>
        <div style={{ color: "var(--text2)", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>Everything you save to your map is completely private. Pins are only shared if you choose to send them in a DM.</div>
        <button onClick={() => { setShowPrivacyPopup(false); sessionStorage.setItem("ravlin_map_privacy_seen", "1"); }} style={{ width: "100%", padding: "13px", borderRadius: 14, background: "linear-gradient(135deg, #78b450, #4a8a2a)", border: "none", color: "white", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}>Got it</button>
      </div>
    </div>, document.body
  ) : null;



  // Init map
  useEffect(() => {
    if (!mapRef.current || mapInst.current) return;
    if (!document.querySelector('link[href*="mapbox-gl"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://api.mapbox.com/mapbox-gl-js/v3.0.0/mapbox-gl.css";
      document.head.appendChild(link);
    }
    import("mapbox-gl").then(({ default: mapboxgl }) => {
      mapboxgl.accessToken = MAPBOX_TOKEN;
      const coords = selectedState && STATE_COORDS[selectedState];
      const map = new mapboxgl.Map({
        container: mapRef.current,
        style: STYLES.satellite,
        center: coords ? [coords[1], coords[0]] : [-98.35, 39.5],
        zoom: coords ? 6 : 4,
      });
      mapInst.current = map;
      map.addControl(new mapboxgl.NavigationControl(), "top-right");
      const geolocate = new mapboxgl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: false });
      map.addControl(geolocate, "top-right");
      map.on("load", () => { setMapReady(true); setTimeout(() => geolocate.trigger(), 500); });
      map.on("click", e => {
        if (e.originalEvent.target.classList.contains("wildai-pin")) return;
        setDropForm({ lng: e.lngLat.lng, lat: e.lngLat.lat });
        setDropName(""); setDropSpecies(""); setSelected(null);
      });
    });
    return () => { if (mapInst.current) { mapInst.current.remove(); mapInst.current = null; setMapReady(false); } };
  }, []);

  // Temporary drop marker
  useEffect(() => {
    import("mapbox-gl").then(({ default: mapboxgl }) => {
      if (dropMarkerRef.current) { dropMarkerRef.current.remove(); dropMarkerRef.current = null; }
      if (dropForm && mapInst.current) {
        const el = document.createElement("div");
        el.style.cssText = "width:18px;height:18px;border-radius:50%;background:#d4930a;border:3px solid white;box-shadow:0 2px 12px rgba(212,147,10,0.6);cursor:pointer;animation:pulse 1.5s ease-in-out infinite;";
        dropMarkerRef.current = new mapboxgl.Marker({ element: el, anchor: "center" }).setLngLat([dropForm.lng, dropForm.lat]).addTo(mapInst.current);
      }
    });
  }, [dropForm]);



  // Style change
  const changeStyle = (style) => {
    if (!mapInst.current || style === mapStyle) return;
    setMapStyle(style);
    setMapReady(false);
    mapInst.current.setStyle(STYLES[style]);
    mapInst.current.once("style.load", () => { setMapReady(true); });
  };

  // Draw pins — use requestAnimationFrame to avoid lag
  useEffect(() => {
    if (!mapReady || !mapInst.current) return;
    const frame = requestAnimationFrame(() => {
      import("mapbox-gl").then(({ default: mapboxgl }) => {
        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];
        pins.filter(p => p.lat && p.lng).forEach(pin => {
          const el = document.createElement("div");
          el.className = "wildai-pin";
          el.style.cssText = "width:14px;height:14px;border-radius:50%;background:#78b450;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.6);cursor:pointer;";
          el.addEventListener("mouseenter", () => { el.style.background = "#d4930a"; });
          el.addEventListener("mouseleave", () => { el.style.background = "#78b450"; });
          el.addEventListener("click", e => {
            e.stopPropagation();
            setSelected(pin);
            setDropForm(null);
            setShowPinsPage(false);
            setViewingPin(pin);
          });
          const marker = new mapboxgl.Marker({ element: el, anchor: "center" }).setLngLat([pin.lng, pin.lat]).addTo(mapInst.current);
          markersRef.current.push(marker);
        });
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [pins, mapReady]);

  const saveDropPin = async () => {
    if (!dropName.trim() || !user) return;
    if (!isPro && pins.length >= FREE_PIN_LIMIT) {
      toast(`Free accounts can save up to ${FREE_PIN_LIMIT} pins. Upgrade to Pro for unlimited pins.`, "error");
      setDropForm(null);
      return;
    }
    setSaving(true);
    if (dropMarkerRef.current) { dropMarkerRef.current.remove(); dropMarkerRef.current = null; }
    await supabase.from("saved_pins").insert({
      user_id: user.id, name: dropName, species: dropSpecies,
      lat: dropForm.lat, lng: dropForm.lng,
      state: selectedState || "",
      location: `${dropForm.lat.toFixed(5)}, ${dropForm.lng.toFixed(5)}`,
    });
    await loadPins();
    setDropForm(null);
    setSaving(false);
  };

  const createGroup = async () => {
    if (!newGroupName.trim() || !user) return;
    const { data } = await supabase.from("pin_groups").insert({ user_id: user.id, name: newGroupName.trim() }).select().single();
    if (data) setGroups(prev => [...prev, data]);
    setNewGroupName("");
    setShowGroupForm(false);
  };

  const deleteGroup = async (id) => {
    await supabase.from("pin_groups").delete().eq("id", id);
    await supabase.from("saved_pins").update({ group_id: null }).eq("group_id", id);
    setGroups(prev => prev.filter(g => g.id !== id));
    setPins(prev => prev.map(p => p.group_id === id ? { ...p, group_id: null } : p));
  };

  const assignGroup = async (pinId, groupId) => {
    await supabase.from("saved_pins").update({ group_id: groupId || null }).eq("id", pinId);
    setPins(prev => prev.map(p => p.id === pinId ? { ...p, group_id: groupId || null } : p));
    setAssigningPin(null);
  };

  const removePin = async (id) => {
    await supabase.from("saved_pins").delete().eq("id", id);
    setPins(prev => prev.filter(p => p.id !== id));
    setSelected(null);
    setViewingPin(null);
    setShowPinsPage(false);
  };

  const updatePin = async (id, fields) => {
    await supabase.from("saved_pins").update(fields).eq("id", id);
    setPins(prev => prev.map(p => p.id === id ? { ...p, ...fields } : p));
    setViewingPin(prev => prev?.id === id ? { ...prev, ...fields } : prev);
  };

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {PrivacyPopup}
      {showPinsPage && !viewingPin && (
        <PinsPage
          pins={pins}
          onBack={() => setShowPinsPage(false)}
          onSelectPin={(pin) => setViewingPin(pin)}
        />
      )}
      {viewingPin && (
        <PinDetailPage
          pin={viewingPin}
          onBack={() => {
            if (showPinsPage) { setViewingPin(null); }
            else { setViewingPin(null); }
          }}
          onDelete={async (id) => { await removePin(id); }}
          onSave={updatePin}
          onSharePin={(pin) => { setViewingPin(null); setShowPinsPage(false); onSharePin(pin); }}
        />
      )}
      <div style={{ position: "relative", borderRadius: isFullscreen ? 0 : "var(--radius)", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", borderTopColor: "rgba(255,255,255,0.14)", boxShadow: isFullscreen ? "none" : "0 8px 40px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)" }}>
        <div ref={mapRef} style={{ height: isFullscreen ? "100dvh" : 340, width: "100%", position: isFullscreen ? "fixed" : "relative", top: isFullscreen ? 0 : "auto", left: isFullscreen ? 0 : "auto", right: isFullscreen ? 0 : "auto", bottom: isFullscreen ? 0 : "auto", zIndex: isFullscreen ? 998 : "auto" }} />

        {/* Expand button */}
        <div style={{ position: isFullscreen ? "fixed" : "absolute", top: isFullscreen ? 16 : 10, left: isFullscreen ? 16 : 10, zIndex: 1001, display: "flex", gap: 6 }}>
          <button onClick={() => { setIsFullscreen(f => !f); setTimeout(() => mapInst.current?.resize(), 150); }} style={{ background: "rgba(8,15,8,0.95)", border: "1px solid var(--border-accent)", color: "var(--green)", borderRadius: "var(--radius-sm)", padding: "8px 14px", fontSize: 12, cursor: "pointer", backdropFilter: "blur(8px)", fontFamily: "var(--font-body)", fontWeight: 600 }}>
            {isFullscreen ? "✕ Exit" : "⊞ Expand"}
          </button>
          <button onClick={() => { const styles = ["satellite", "terrain", "street"]; const next = styles[(styles.indexOf(mapStyle) + 1) % styles.length]; changeStyle(next); }} style={{ background: "rgba(8,15,8,0.95)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "8px 10px", fontSize: 12, cursor: "pointer", backdropFilter: "blur(8px)", color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center" }}>
            {mapStyle === "satellite"
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
              : mapStyle === "terrain"
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 20 9 4 15 16 19 10 21 20 3 20" /></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" /></svg>
            }
          </button>
        </div>

        {/* Map style buttons — top right, inside map */}


        {user && <div style={{ position: "absolute", bottom: 10, left: 10, zIndex: 10, background: "rgba(8,15,8,0.9)", border: "1px solid var(--border)", color: "var(--text3)", borderRadius: "var(--radius-sm)", padding: "5px 10px", fontSize: 10, backdropFilter: "blur(8px)" }}>Tap map to drop a pin</div>}
      </div>

      <div style={{ display: "flex", alignItems: "center", padding: "6px 4px" }}>
        <span style={{ color: "var(--text3)", fontSize: 12 }}>{pins.filter(p => p.lat && p.lng).length} pins</span>
      </div>

      {dropForm && user && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1002, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setDropForm(null)}>
          <div onClick={e => e.stopPropagation()} className="fade-in" style={{ width: "100%", background: "#0d1a0d", borderRadius: "20px 20px 0 0", padding: "20px 20px 40px", border: "1px solid var(--border)", borderBottom: "none", boxShadow: "0 -8px 40px rgba(0,0,0,0.6)", marginBottom: 0 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)", margin: "0 auto 18px" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 18 }}>📍</span>
              <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 15 }}>Drop a Pin</div>
              <div style={{ color: "var(--text3)", fontSize: 11, marginLeft: 4 }}>{dropForm.lat.toFixed(4)}, {dropForm.lng.toFixed(4)}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input placeholder="Name this spot *" value={dropName} onChange={e => setDropName(e.target.value)} autoFocus style={{ flex: 1, padding: "12px 14px", borderRadius: "var(--radius-sm)", fontSize: 14 }} />
              <button onClick={saveDropPin} disabled={!dropName.trim() || saving} className="btn-primary" style={{ padding: "12px 18px", fontSize: 14, opacity: !dropName.trim() ? 0.5 : 1 }}>{saving ? "..." : "Save"}</button>
              <button onClick={() => setDropForm(null)} className="btn-ghost" style={{ padding: "12px 14px", fontSize: 14 }}>✕</button>
            </div>
          </div>
        </div>
      )}

      {user && (
        <button onClick={() => setShowPinsPage(true)} className="btn-ghost" style={{ width: "100%", padding: "12px", fontSize: 14, marginTop: 8 }}>📍 My Pins ({pins.length})</button>
      )}

      {selected && (
        <div className="card fade-in" style={{ padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{selected.name || "Saved Spot"}</div>
            {selected.species && <div style={{ color: "var(--green)", fontSize: 12, marginBottom: 4 }}>{selected.species}</div>}
            {selected.location && <div style={{ color: "var(--text2)", fontSize: 13, marginBottom: 8 }}>📍 {selected.location}</div>}
            {selected.photo && <img src={selected.photo} style={{ width: "100%", maxHeight: 180, objectFit: "cover", borderRadius: "var(--radius-sm)", marginBottom: 8 }} />}
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--green)", fontSize: 12, fontWeight: 600 }}>Get Directions →</a>
            <button onClick={() => onSharePin(selected)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text2)", fontSize: 12, fontFamily: "var(--font-body)", marginTop: 6, display: "block" }}>📤 Share to Community →</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <button onClick={() => removePin(selected.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,100,100,0.7)", fontSize: 11, padding: "4px 8px", fontFamily: "var(--font-body)" }}>🗑️ Remove</button>
            <button onClick={() => setSelected(null)} className="btn-ghost" style={{ padding: "5px 10px", fontSize: 12 }}>✕</button>
          </div>
        </div>
      )}

      {!user && (
        <div style={{ textAlign: "center", padding: 24, color: "var(--text3)", fontSize: 14 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📍</div>
          Sign in to save and drop pins on your map
        </div>
      )}

      {user && pins.filter(p => p.lat && p.lng).length === 0 && !dropForm && (
        <div style={{ textAlign: "center", padding: 20, color: "var(--text3)", fontSize: 13 }}>
          Tap anywhere on the map to drop a pin, or save spots from the Community tab
        </div>
      )}

    </div>
  );
}

// ─── USER PROFILE ─────────────────────────────────────────────────────────────
function UserProfilePage({ userId, currentUser, onBack, openSignIn, onViewUser, onMessage, onPost, onBlock }) {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingBio, setEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState("");
  const [savingBio, setSavingBio] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profileTab, setProfileTab] = useState("posts");
  const [viewingProfilePost, setViewingProfilePost] = useState(null);
  const [spotRatings, setSpotRatings] = useState({});
  const [userRatings, setUserRatings] = useState({});
  const [savedPinIds, setSavedPinIds] = useState(new Set());
  const [showFollowList, setShowFollowList] = useState(null); // 'followers' or 'following'
  const [isBlocked, setIsBlocked] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [followList, setFollowList] = useState([]);
  const [loadingFollowList, setLoadingFollowList] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: postData } = await supabase.from("posts").select("*").eq("user_id", userId).order("created_at", { ascending: false });
      let { data: profileData } = await supabase.from("profiles").select("*").eq("user_id", userId).single();
      if (!profileData) {
        const username = postData?.[0]?.username || (currentUser?.id === userId ? (currentUser?.username || currentUser?.firstName) : null) || "Hunter";
        await supabase.from("profiles").insert({ user_id: userId, username });
        profileData = { user_id: userId, username };
      }
      const { data: followers } = await supabase.from("follows").select("id").eq("following_id", userId);
      const { data: following } = await supabase.from("follows").select("id").eq("follower_id", userId);
      setProfile(profileData);
      setPosts(postData || []);
      setFollowerCount(followers?.length || 0);
      setFollowingCount(following?.length || 0);
      if (currentUser && currentUser.id !== userId) {
        const { data: followCheck } = await supabase.from("follows").select("id").eq("follower_id", currentUser.id).eq("following_id", userId).maybeSingle();
        setIsFollowing(!!followCheck);
        const { data: blockCheck } = await supabase.from("blocked_users").select("id").eq("blocker_id", currentUser.id).eq("blocked_id", userId).maybeSingle();
        setIsBlocked(!!blockCheck);
      }
      const spotPosts = (postData || []).filter(p => p.lat && p.lng);
      if (spotPosts.length) {
        const ids = spotPosts.map(p => p.id);
        const { data: ratingData } = await supabase.from("spot_ratings").select("post_id, rating, user_id").in("post_id", ids);
        if (ratingData) {
          const avgRatings = {};
          const myRatings = {};
          ids.forEach(id => avgRatings[id] = { sum: 0, count: 0 });
          ratingData.forEach(r => {
            avgRatings[r.post_id].sum += r.rating;
            avgRatings[r.post_id].count += 1;
            if (currentUser && r.user_id === currentUser.id) myRatings[r.post_id] = r.rating;
          });
          setSpotRatings(avgRatings);
          setUserRatings(myRatings);
        }
      }
      if (currentUser) {
        const { data: savedData } = await supabase.from("saved_pins").select("post_id").eq("user_id", currentUser.id);
        setSavedPinIds(new Set((savedData || []).map(p => p.post_id)));
      }
      setLoading(false);
    };
    load();
  }, [userId]);

  const openFollowList = async (type) => {
    setShowFollowList(type);
    setLoadingFollowList(true);
    let userIds = [];
    if (type === 'followers') {
      const { data } = await supabase.from("follows").select("follower_id").eq("following_id", userId);
      userIds = (data || []).map(r => r.follower_id);
    } else {
      const { data } = await supabase.from("follows").select("following_id").eq("follower_id", userId);
      userIds = (data || []).map(r => r.following_id);
    }
    if (userIds.length) {
      const { data: profiles } = await supabase.from("profiles").select("user_id, username, avatar_url").in("user_id", userIds);
      setFollowList(profiles || []);
    } else {
      setFollowList([]);
    }
    setLoadingFollowList(false);
  };

  const toggleFollow = async () => {
    if (!currentUser) { openSignIn(); return; }
    if (isFollowing) {
      await supabase.from("follows").delete().eq("follower_id", currentUser.id).eq("following_id", userId);
      setIsFollowing(false);
      setFollowerCount(c => c - 1);
      window._updateFollowing?.(userId, false);
    } else {
      await supabase.from("follows").insert({ follower_id: currentUser.id, following_id: userId });
      setIsFollowing(true);
      setFollowerCount(c => c + 1);
      window._updateFollowing?.(userId, true);
      fetch("https://wildai-server.onrender.com/push/follow", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ followed_id: userId, follower_username: currentUser.username || currentUser.firstName || "Someone" }) }).catch(() => { });
    }
  };

  const saveBio = async () => {
    setSavingBio(true);
    await supabase.from("profiles").update({ bio: bioInput }).eq("user_id", userId);
    setProfile(p => ({ ...p, bio: bioInput }));
    setEditingBio(false);
    setSavingBio(false);
  };

  const uploadAvatar = async (file) => {
    if (!file) return;
    file = await stripExif(file);
    setUploadingAvatar(true);
    const fileName = `avatar-${userId}-${Date.now()}`;
    const { error } = await supabase.storage.from("post-photos").upload(fileName, file, { contentType: file.type, upsert: true });
    if (error) { setUploadingAvatar(false); return; }
    const { data: urlData } = supabase.storage.from("post-photos").getPublicUrl(fileName);
    await supabase.from("profiles").update({ avatar_url: urlData.publicUrl }).eq("user_id", userId);
    setProfile(p => ({ ...p, avatar_url: urlData.publicUrl }));
    setUploadingAvatar(false);
  };

  const saveToMap = async (post) => {
    if (!currentUser) { openSignIn(); return; }
    if (savedPinIds.has(post.id)) return;
    await supabase.from("saved_pins").insert({
      user_id: currentUser.id, post_id: post.id,
      name: post.location || post.species || "Saved Spot",
      location: post.location, species: post.species,
      photo: post.photo, lat: post.lat, lng: post.lng, state: post.state,
    });
    setSavedPinIds(prev => new Set([...prev, post.id]));
  };

  const deletePost = async (postId) => {
    await supabase.from("posts").delete().eq("id", postId);
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const rateSpot = async (postId, rating) => {
    if (!currentUser) { openSignIn(); return; }
    await supabase.from("spot_ratings").upsert({ post_id: postId, user_id: currentUser.id, rating });
    setUserRatings(prev => ({ ...prev, [postId]: rating }));
    setSpotRatings(prev => {
      const cur = prev[postId] || { sum: 0, count: 0 };
      const wasRated = userRatings[postId];
      const newSum = wasRated ? cur.sum - wasRated + rating : cur.sum + rating;
      const newCount = wasRated ? cur.count : cur.count + 1;
      return { ...prev, [postId]: { sum: newSum, count: newCount } };
    });
  };

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: "var(--text3)" }} className="pulse">Loading profile...</div>;

  const displayName = profile?.username || posts[0]?.username || "Hunter";
  const isOwnProfile = currentUser?.id === userId;

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 0 }}>

      {/* Banner */}
      <div style={{ height: 110, position: "relative", overflow: "hidden", background: "#0a0f0a" }}>
        <img src="/banner.png" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%", opacity: 0.7 }} crossOrigin="anonymous" />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 0%, rgba(8,13,8,0.4) 50%, rgba(8,13,8,1) 100%)" }} />
        {onBack && <button onClick={onBack} style={{ position: "absolute", top: 12, left: 12, background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 20, color: "white", fontSize: 13, padding: "5px 14px", cursor: "pointer", fontFamily: "var(--font-body)", WebkitBackdropFilter: "blur(8px)", backdropFilter: "blur(8px)" }}>← Back</button>}
      </div>

      {/* Profile card */}
      <div style={{ background: "#080d08", padding: "0 16px 16px", borderBottom: "1px solid var(--border)" }}>
        {/* Avatar + info row — IG style */}
        <div style={{ display: "flex", gap: 16, alignItems: "flex-end", marginBottom: 12 }}>
          {/* Avatar */}
          <div style={{ position: "relative", marginTop: -36, flexShrink: 0 }}>
            <label style={{ cursor: isOwnProfile ? "pointer" : "default", display: "block" }}>
              {isOwnProfile && <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => uploadAvatar(e.target.files[0])} />}
              <div style={{ width: 90, height: 90, borderRadius: 20, background: "linear-gradient(135deg, #1e4010, #0f2408)", border: "4px solid #080d08", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", boxShadow: "0 0 0 2.5px var(--green), 0 4px 16px rgba(0,0,0,0.5)" }}>
                {uploadingAvatar
                  ? <span style={{ color: "var(--text3)", fontSize: 11 }}>...</span>
                  : profile?.avatar_url
                    ? <img src={`${profile.avatar_url}?t=${profile.avatar_updated_at || 0}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontSize: 32, fontFamily: "var(--font-display)", color: "var(--green)", fontWeight: 700 }}>{displayName[0]?.toUpperCase()}</span>
                }
              </div>
              {isOwnProfile && <div style={{ position: "absolute", bottom: 2, right: 2, background: "var(--green)", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, border: "2px solid #080d08" }}>✏️</div>}
            </label>
          </div>
          {/* Name + stats */}
          <div style={{ flex: 1, paddingBottom: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 17, fontFamily: "var(--font-display)" }}>{capName(displayName)}</div>

            </div>
            <div style={{ display: "flex", gap: 16 }}>
              {[["Posts", posts.length, null], ["Followers", followerCount, "followers"], ["Following", followingCount, "following"]].map(([label, val, type], i) => (
                <div key={i} onClick={() => type && openFollowList(type)} style={{ cursor: type ? "pointer" : "default", textAlign: "center" }}>
                  <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 15 }}>{val}</div>
                  <div style={{ color: "var(--text3)", fontSize: 11 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bio */}
        <div style={{ marginBottom: 10, contain: "layout" }}>
          {!editingBio && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ color: profile?.bio ? "var(--text2)" : "var(--text3)", fontSize: 13, fontStyle: profile?.bio ? "normal" : "italic", lineHeight: 1.5, width: "100%", overflowWrap: "break-word" }}>
                {profile?.bio || (isOwnProfile ? "Add a bio..." : "")}
              </div>
              {isOwnProfile && <button onClick={() => { setEditingBio(true); setBioInput(profile?.bio || ""); }} style={{ background: "none", border: "none", color: "var(--text3)", fontSize: 11, cursor: "pointer", padding: 0, flexShrink: 0 }}>✏️</button>}
            </div>
          )}
          {editingBio && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <textarea value={bioInput} onChange={e => setBioInput(e.target.value)} placeholder="Write a short bio..." maxLength={150} style={{ width: "100%", padding: "6px 10px", borderRadius: "var(--radius-sm)", fontSize: 13, minHeight: 60, resize: "none", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", color: "var(--text)", fontFamily: "var(--font-body)", boxSizing: "border-box" }} />
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={saveBio} disabled={savingBio} className="btn-primary" style={{ padding: "5px 14px", fontSize: 12 }}>{savingBio ? "Saving..." : "Save"}</button>
                <button onClick={() => setEditingBio(false)} className="btn-ghost" style={{ padding: "5px 14px", fontSize: 12 }}>Cancel</button>
              </div>
            </div>
          )}
        </div>

        {/* Buttons row */}
        {!isOwnProfile && (
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <button onClick={toggleFollow} className={isFollowing ? "btn-ghost" : "btn-primary"} style={{ flex: 1, padding: "8px 0", fontSize: 13, borderRadius: 20 }}>
              {isFollowing ? "Following" : "Follow"}
            </button>
            <button onClick={() => onMessage?.(userId)} className="btn-ghost" style={{ flex: 1, padding: "8px 0", fontSize: 13, borderRadius: 20 }}>Message</button>
          </div>
        )}
        {isOwnProfile && (
          <button onClick={() => onPost?.()} className="btn-primary" style={{ width: "100%", padding: "8px 0", fontSize: 13, borderRadius: 20, marginBottom: 10 }}>+ New Post</button>
        )}

        {!isOwnProfile && (
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={async () => {
              if (!currentUser) { openSignIn(); return; }
              const { data: existing } = await supabase.from("reported_users").select("id").eq("user_id", userId).eq("reported_by", currentUser.id).single();
              if (existing) { toast("You've already reported this user."); return; }
              await supabase.from("reported_users").insert({ user_id: userId, reported_by: currentUser.id });
              toast("User reported. Thank you.", "success");
            }} style={{ background: "none", border: "none", color: "var(--text3)", fontSize: 11, cursor: "pointer", fontFamily: "var(--font-body)", padding: 0 }}>Report user</button>
            {confirmBlock && createPortal(
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 999999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={() => setConfirmBlock(false)}>
                <div onClick={e => e.stopPropagation()} style={{ background: "#0d1a0d", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 28, maxWidth: 320, width: "100%", textAlign: "center" }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>🚫</div>
                  <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 16, fontFamily: "var(--font-display)", marginBottom: 8 }}>Block this user?</div>
                  <div style={{ color: "var(--text3)", fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>You won't see their posts or messages and they won't be able to interact with you.</div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => setConfirmBlock(false)} className="btn-ghost" style={{ flex: 1, padding: "10px 0", fontSize: 14 }}>Cancel</button>
                    <button onClick={async () => {
                      await supabase.from("blocked_users").upsert({ blocker_id: currentUser.id, blocked_id: userId });
                      setIsBlocked(true); setConfirmBlock(false);
                      onBlock?.(userId, false);
                      toast("User blocked.", "success");
                      onBack?.();
                    }} style={{ flex: 1, padding: "10px 0", fontSize: 14, background: "rgba(255,60,60,0.15)", border: "1px solid rgba(255,60,60,0.3)", borderRadius: "var(--radius-sm)", color: "rgba(255,100,100,0.9)", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}>Block</button>
                  </div>
                </div>
              </div>,
              document.body
            )}
            <button onClick={async () => {
              if (!currentUser) { openSignIn(); return; }
              if (isBlocked) {
                await supabase.from("blocked_users").delete().eq("blocker_id", currentUser.id).eq("blocked_id", userId);
                setIsBlocked(false);
                onBlock?.(userId, true);
                toast("User unblocked.", "success");
              } else {
                setConfirmBlock(true);
              }
            }} style={{ background: "none", border: "none", color: isBlocked ? "var(--text3)" : "rgba(255,100,100,0.5)", fontSize: 11, cursor: "pointer", fontFamily: "var(--font-body)", padding: 0 }}>{isBlocked ? "Unblock user" : "Block user"}</button>
          </div>
        )}
      </div>

      {/* Follow list modal */}
      {showFollowList && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "flex-end" }} onClick={() => setShowFollowList(null)}>
          <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxHeight: "70vh", background: "#0d1a0d", borderRadius: "20px 20px 0 0", padding: 24, overflowY: "auto", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 16, fontFamily: "var(--font-display)" }}>{showFollowList === "followers" ? "Followers" : "Following"}</div>
              <button onClick={() => setShowFollowList(null)} style={{ background: "none", border: "none", color: "var(--text3)", fontSize: 20, cursor: "pointer", padding: 0 }}>✕</button>
            </div>
            {loadingFollowList && <div style={{ textAlign: "center", padding: 20, color: "var(--text3)" }} className="pulse">Loading...</div>}
            {!loadingFollowList && followList.length === 0 && <div style={{ textAlign: "center", padding: 20, color: "var(--text3)", fontSize: 13 }}>No {showFollowList} yet</div>}
            {followList.map(u => (
              <div key={u.user_id} onClick={() => { setShowFollowList(null); onViewUser(u.user_id); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border)", cursor: "pointer" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(120,180,80,0.05)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #1e4010, #0f2408)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0, boxShadow: "0 0 0 2px #78b450" }}>
                  {u.avatar_url ? <img src={u.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 16, fontFamily: "var(--font-display)", color: "var(--green)", fontWeight: 700 }}>{u.username?.[0]?.toUpperCase()}</span>}
                </div>
                <span style={{ color: "var(--text)", fontWeight: 600, fontSize: 14 }}>{capName(u.username)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: 12 }}>
        <button onClick={() => setProfileTab("posts")} style={{ flex: 1, background: "none", border: "none", borderBottom: profileTab === "posts" ? "2px solid var(--green)" : "2px solid transparent", color: profileTab === "posts" ? "var(--text)" : "var(--text3)", padding: "10px 0", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)", transition: "all 0.2s" }}>Posts</button>
        <button onClick={() => setProfileTab("spots")} style={{ flex: 1, background: "none", border: "none", borderBottom: profileTab === "spots" ? "2px solid var(--green)" : "2px solid transparent", color: profileTab === "spots" ? "var(--text)" : "var(--text3)", padding: "10px 0", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)", transition: "all 0.2s" }}>📍 Spots</button>
      </div>

      {viewingProfilePost && createPortal(
        <div className="fade-in" style={{ position: "fixed", inset: 0, zIndex: 99999, background: "var(--bg)", overflowY: "auto", padding: "0 0 80px" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", padding: "16px 16px 0" }}>
            <PostDetailPage postId={viewingProfilePost} user={currentUser} openSignIn={openSignIn} onBack={() => setViewingProfilePost(null)} onViewUser={onViewUser} />
          </div>
        </div>,
        document.body
      )}
      {profileTab === "posts" && (
        posts.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "var(--text3)", fontSize: 14, minHeight: 200 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🌲</div>
            <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{isOwnProfile ? "You haven't posted yet" : `${displayName} hasn't posted yet`}</div>
            {isOwnProfile && <div style={{ color: "var(--text3)", fontSize: 13 }}>Share your first hunt or catch in the community feed!</div>}
          </div>
        ) : (
          posts.map(post => (
            <div key={post.id} className="card fade-in" onClick={() => setViewingProfilePost(post.id)} style={{ padding: 0, overflow: "hidden", cursor: "pointer" }}>
              {post.photo && <img src={post.photo} style={{ width: "100%", maxHeight: 280, objectFit: "cover" }} />}
              <div style={{ padding: "14px 16px" }}>
                {(post.species || post.location) && (
                  <div style={{ display: "flex", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                    {post.species && <span style={{ background: "var(--green-dim)", border: "1px solid var(--border-accent)", color: "var(--green)", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{post.species}</span>}
                    {false && post.location && <span style={{ color: "var(--text2)", fontSize: 12 }}>📍 {post.location}</span>}
                  </div>
                )}
                {post.caption && <p style={{ color: "var(--text2)", fontSize: 14, lineHeight: 1.6, margin: 0, marginBottom: 6 }}>{post.caption}</p>}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ color: "var(--text3)", fontSize: 11 }}>{new Date(post.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                  {isOwnProfile && <button onClick={() => deletePost(post.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,100,100,0.5)", fontSize: 12, padding: 0, fontFamily: "var(--font-body)" }}>Delete</button>}
                </div>
              </div>
            </div>
          ))
        )
      )}

      {profileTab === "spots" && (() => {
        const spots = posts.filter(p => p.lat && p.lng);
        if (spots.length === 0) return (
          <div style={{ textAlign: "center", padding: 40, color: "var(--text3)", fontSize: 14, minHeight: 200 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📍</div>
            <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{isOwnProfile ? "No public spots yet" : `${displayName} hasn't shared any spots`}</div>
            {isOwnProfile && <div style={{ color: "var(--text3)", fontSize: 13 }}>Share a post with a location to add it here!</div>}
          </div>
        );
        return spots.map(post => {
          const ratingInfo = spotRatings[post.id] || { sum: 0, count: 0 };
          const avgRating = ratingInfo.count > 0 ? (ratingInfo.sum / ratingInfo.count).toFixed(1) : null;
          const myRating = userRatings[post.id] || 0;
          return (
            <div key={post.id} className="card fade-in" style={{ padding: 0, overflow: "hidden" }}>
              {post.photo && <img src={post.photo} style={{ width: "100%", maxHeight: 240, objectFit: "cover" }} />}
              <div style={{ padding: "14px 16px" }}>
                {(post.species || post.location) && (
                  <div style={{ display: "flex", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                    {post.species && <span style={{ background: "var(--green-dim)", border: "1px solid var(--border-accent)", color: "var(--green)", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{post.species}</span>}
                    {false && post.location && <span style={{ color: "var(--text2)", fontSize: 12 }}>📍 {post.location}</span>}
                  </div>
                )}
                {post.caption && <p style={{ color: "var(--text2)", fontSize: 14, lineHeight: 1.6, margin: 0, marginBottom: 10 }}>{post.caption}</p>}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ display: "flex", gap: 2 }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <span key={star} onClick={() => !isOwnProfile && rateSpot(post.id, star)} style={{ fontSize: 18, cursor: isOwnProfile ? "default" : "pointer", color: star <= myRating ? "#e8b020" : "rgba(255,255,255,0.2)", transition: "color 0.1s" }}>★</span>
                      ))}
                    </div>
                    {avgRating ? (
                      <span style={{ color: "var(--text3)", fontSize: 12 }}>{avgRating} · {ratingInfo.count} {ratingInfo.count === 1 ? "rating" : "ratings"}</span>
                    ) : (
                      <span style={{ color: "var(--text3)", fontSize: 12 }}>{isOwnProfile ? "No ratings yet" : "Be the first to rate"}</span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <button onClick={() => saveToMap(post)} style={{ background: "none", border: "none", cursor: savedPinIds.has(post.id) ? "default" : "pointer", color: savedPinIds.has(post.id) ? "var(--text3)" : "var(--green)", fontSize: 12, fontWeight: 600, padding: 0, fontFamily: "var(--font-body)" }}>
                      {savedPinIds.has(post.id) ? "✓ Saved" : "🗺️ Save to Map"}
                    </button>
                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${post.lat},${post.lng}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--green)", fontSize: 12, fontWeight: 600 }}>Directions →</a>
                    {isOwnProfile && <button onClick={() => deletePost(post.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,100,100,0.5)", fontSize: 12, padding: 0, fontFamily: "var(--font-body)" }}>Delete</button>}
                  </div>
                </div>
              </div>
            </div>
          );
        });
      })()}
    </div>
  );
}

// ─── COMMUNITY TAB ────────────────────────────────────────────────────────────
function MessagesTab({ user, openSignIn, supabase, onUnreadChange }) {
  const [view, setView] = useState("inbox");
  const [inbox, setInbox] = useState([]);
  const [loadingInbox, setLoadingInbox] = useState(true);
  const [deletingThread, setDeletingThread] = useState(null);

  const deleteThread = (otherId) => {
    const key = `hidden_threads_${user.id}`;
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    localStorage.setItem(key, JSON.stringify([...existing, otherId]));
    setInbox(prev => {
      const updated = prev.filter(t => t.otherId !== otherId);
      onUnreadChange?.(updated.reduce((sum, t) => sum + (t.unread || 0), 0));
      return updated;
    });
    setDeletingThread(null);
    toast("Conversation removed.", "dark");
  };
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [drafts, setDrafts] = useState({});
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const bottomRef = useRef(null);

  const loadInbox = async () => {
    const hiddenKey = `hidden_threads_${user?.id}`;
    const hidden = new Set(JSON.parse(localStorage.getItem(hiddenKey) || "[]"));
    if (!user) return;
    setLoadingInbox(true);
    const res = await fetch(`https://wildai-server.onrender.com/messages/inbox?userId=${user.id}`);
    const data = await res.json();
    if (Array.isArray(data)) {
      const { data: blocks } = await supabase.from("blocked_users").select("blocked_id").eq("blocker_id", user.id);
      const blockedSet = new Set((blocks || []).map(b => b.blocked_id));
      const enriched = await Promise.all(data.filter(t => !blockedSet.has(t.otherId) && !hidden.has(t.otherId)).map(async t => {
        const { data: profile } = await supabase.from("profiles").select("username, avatar_url, last_seen").eq("user_id", t.otherId).single();
        return { ...t, username: profile?.username || "Hunter", avatar: profile?.avatar_url, last_seen: profile?.last_seen };
      }));
      setInbox(enriched);
      const total = enriched.reduce((sum, t) => sum + (t.unread || 0), 0);
      onUnreadChange?.(total);
    }
    setLoadingInbox(false);
  };

  const loadConversation = async (otherId) => {
    if (!user) return;
    const res = await fetch(`https://wildai-server.onrender.com/messages/conversation/${otherId}?userId=${user.id}`);
    const data = await res.json();
    setMessages(Array.isArray(data) ? data : []);
  };

  const searchUsers = async (q) => {
    if (!q.trim()) { setSearchResults([]); return; }
    const { data } = await supabase.from("profiles").select("user_id, username, avatar_url").ilike("username", `%${q}%`).limit(10);
    setSearchResults((data || []).filter(u => u.username && u.user_id !== user?.id));
  };

  const openThread = async (otherId, username, avatar) => {
    const key = `hidden_threads_${user?.id}`;
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    localStorage.setItem(key, JSON.stringify(existing.filter(id => id !== otherId)));
    setDrafts(d => ({ ...d, [activeThread?.otherId]: input }));
    setInput("");
    setActiveThread({ otherId, username, avatar });
    setTimeout(() => setInput(drafts[otherId] || ""), 0);
    setView("thread");
    document.body.classList.add("dm-fullscreen");
    await loadConversation(otherId);
    if (user) {
      fetch("https://wildai-server.onrender.com/messages/mark-read", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id, otherId }) });
      supabase.from("messages").update({ seen_at: new Date().toISOString() }).eq("recipient_id", user.id).eq("sender_id", otherId).is("seen_at", null);
    }
  };

  const send = async () => {
    if (!input.trim() || !user || !activeThread) return;
    setSending(true);
    const res = await fetch("https://wildai-server.onrender.com/messages/send", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sender_id: user.id, recipient_id: activeThread.otherId, content: input.trim() })
    });
    const msg = await res.json();
    setMessages(prev => [...prev, msg]);
    setInput("");
    setSending(false);
  };

  const sendImage = async (file) => {
    if (!file || !user || !activeThread) return;
    file = await stripExif(file);
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
    const { error } = await supabase.storage.from("post-photos").upload(fileName, file, { contentType: file.type });
    if (error) { toast("Image upload failed.", "error"); return; }
    const { data: urlData } = supabase.storage.from("post-photos").getPublicUrl(fileName);
    await fetch("https://wildai-server.onrender.com/messages/send", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sender_id: user.id, recipient_id: activeThread.otherId, image_url: urlData.publicUrl })
    });
    await loadConversation(activeThread.otherId);
  };

  useEffect(() => { if (user) loadInbox(); }, [user]);

  useEffect(() => {
    const check = () => {
      if (window._openMessageThread && user) {
        const id = window._openMessageThread;
        window._openMessageThread = null;
        supabase.from("profiles").select("username, avatar_url").eq("user_id", id).single().then(({ data }) => {
          openThread(id, data?.username || "Hunter", data?.avatar_url);
        });
      }
    };
    check();
    const t = setTimeout(check, 300);
    return () => clearTimeout(t);
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel("inbox-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `recipient_id=eq.${user.id}` }, (payload) => {
        const senderId = payload.new.sender_id;
        const key = `hidden_threads_${user.id}`;
        const existing = JSON.parse(localStorage.getItem(key) || "[]");
        localStorage.setItem(key, JSON.stringify(existing.filter(id => id !== senderId)));
        loadInbox();
      }).subscribe();
    return () => supabase.removeChannel(channel);
  }, [user]);

  useEffect(() => {
    if (!user || !activeThread) return;
    const channel = supabase.channel("messages-" + activeThread.otherId)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `recipient_id=eq.${user.id}` }, payload => {
        if (payload.new.sender_id === activeThread.otherId) {
          setMessages(prev => [...prev, payload.new]);
          supabase.from("messages").update({ seen_at: new Date().toISOString() }).eq("id", payload.new.id);
        }
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "messages" }, payload => {
        setMessages(prev => prev.filter(m => m.id !== payload.old.id));
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user, activeThread]);

  if (!user) return (
    <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text3)", fontSize: 14 }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
      <div style={{ color: "var(--text)", fontWeight: 600, marginBottom: 6 }}>Sign in to message</div>
      <button onClick={openSignIn} className="btn-primary" style={{ padding: "8px 20px", fontSize: 13 }}>Sign In</button>
    </div>
  );

  if (view === "thread" && activeThread) return createPortal(
    <div className="fade-in" style={{ position: "fixed", inset: 0, zIndex: 99999, background: "var(--bg)", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 760, display: "flex", flexDirection: "column", height: "100%" }}>
        <div style={{ borderBottom: "1px solid var(--border)", padding: "12px 16px", display: "flex", alignItems: "center", position: "relative", flexShrink: 0 }}>
          <button onClick={() => { setView("inbox"); loadInbox(); document.body.classList.remove("dm-fullscreen"); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text2)", fontSize: 14, padding: 0, flexShrink: 0 }}>← Back</button>
          <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "var(--green-dim)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "var(--green)", flexShrink: 0, overflow: "hidden", boxShadow: "0 0 0 2px #78b450" }}>
              {activeThread.avatar ? <img src={activeThread.avatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : activeThread.username?.[0]?.toUpperCase()}
            </div>
            <span style={{ color: "var(--text)", fontWeight: 700, fontSize: 15 }}>{capName(activeThread.username)}</span>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px 8px" }}>
          <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", flexDirection: "column", gap: 8 }}>
            {messages.map(m => (
              <div key={m.id} style={{ display: "flex", justifyContent: m.sender_id === user.id ? "flex-end" : "flex-start", flexDirection: "column", alignItems: m.sender_id === user.id ? "flex-end" : "flex-start" }}>
                {m.image_url ? (
                  <img src={m.image_url} style={{ maxWidth: "70%", borderRadius: 12, maxHeight: 200, objectFit: "cover" }} />
                ) : m.pin_lat ? (
                  <div style={{ background: "linear-gradient(135deg, rgba(45,90,27,0.3), rgba(30,64,16,0.25))", border: "1px solid var(--border-accent)", borderRadius: 16, padding: "14px 16px", maxWidth: "75%", backdropFilter: "blur(8px)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(120,180,80,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--green)" stroke="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" fill="#0d1a0d" /></svg>
                      </div>
                      <div>
                        <div style={{ color: "var(--green)", fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>{m.pin_name || "Shared Pin"}</div>
                        <div style={{ color: "var(--text3)", fontSize: 10, marginTop: 2 }}>Shared a pin</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <a href={`https://www.google.com/maps/dir/?api=1&destination=${m.pin_lat},${m.pin_lng}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, textAlign: "center", padding: "7px 0", background: "rgba(120,180,80,0.15)", border: "1px solid rgba(120,180,80,0.25)", borderRadius: 8, color: "var(--green)", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>Directions</a>
                      {m.sender_id !== user.id && (
                        <button onClick={() => { supabase.from("saved_pins").insert({ user_id: user.id, name: m.pin_name || "Shared Pin", lat: m.pin_lat, lng: m.pin_lng, location: m.pin_name || "Shared Pin" }).then(() => toast("📍 Saved to your map!", "success")); }} style={{ flex: 1, padding: "7px 0", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "var(--text2)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)" }}>Save to Map</button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: m.sender_id === user.id ? "flex-end" : "flex-start", maxWidth: "70%" }}>
                    <div style={{ background: m.sender_id === user.id ? "var(--green)" : "rgba(255,255,255,0.07)", borderRadius: m.sender_id === user.id ? "18px 18px 4px 18px" : "18px 18px 18px 4px", padding: "10px 14px", fontSize: 14, color: m.sender_id === user.id ? "#fff" : "var(--text)", lineHeight: 1.5, wordBreak: "break-word", overflowWrap: "break-word", cursor: m.sender_id === user.id ? "pointer" : "default" }}
                      onClick={() => {
                        if (m.sender_id !== user.id) return;
                        const ageMinutes = (Date.now() - new Date(m.created_at)) / 60000;
                        if (ageMinutes > 5) { toast("You can only delete messages within 5 minutes of sending.", "error"); return; }
                        supabase.from("messages").delete().eq("id", m.id).then(() => { setMessages(prev => prev.filter(msg => msg.id !== m.id)); toast("Message deleted.", "success"); });
                      }}>
                      {m.content}
                    </div>
                    {m.sender_id === user.id && (() => {
                      const isLast = messages.filter(msg => msg.sender_id === user.id).slice(-1)[0]?.id === m.id;
                      if (!isLast) return null;
                      return <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 3 }}>{m.seen_at ? "Seen" : "Delivered"}</div>;
                    })()}
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", borderTop: "1px solid var(--border)", padding: "10px 16px 24px", flexShrink: 0, marginTop: "auto" }}>
          <label style={{ cursor: "pointer", color: "var(--text3)", fontSize: 20, lineHeight: 1 }}>
            📎<input type="file" accept="image/*" style={{ display: "none" }} onChange={e => sendImage(e.target.files[0])} />
          </label>
          <PinPicker user={user} onSelect={async (pin) => {
            await fetch("https://wildai-server.onrender.com/messages/send", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ sender_id: user.id, recipient_id: activeThread.otherId, pin_lat: pin.lat, pin_lng: pin.lng, pin_name: pin.name || pin.location || "Shared Pin" })
            });
            await loadConversation(activeThread.otherId);
          }} />
          <input value={input} onChange={e => setInput(e.target.value.slice(0, 1000))} onKeyDown={e => e.key === "Enter" && send()} placeholder="Message..." style={{ flex: 1, padding: "11px 16px", borderRadius: 24, fontSize: 15, background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "var(--text)", fontFamily: "var(--font-body)" }} />
          <button onClick={send} disabled={!input.trim() || sending} className="btn-primary" style={{ padding: "9px 16px", fontSize: 13, borderRadius: 20, opacity: !input.trim() ? 0.5 : 1 }}>Send</button>
        </div>
      </div>
    </div>, document.body
  );

  const totalUnread = inbox.reduce((sum, t) => sum + (t.unread || 0), 0);

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 12 }}>


      {!loadingInbox && inbox.length === 0 && (
        <div style={{ textAlign: "center", padding: 48, color: "var(--text3)", fontSize: 14 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
          <div style={{ color: "var(--text)", fontWeight: 600, marginBottom: 6 }}>No messages yet</div>
          Search for a user above to start a conversation
        </div>
      )}
      {inbox.map(t => (
        <div key={t.otherId} style={{ borderRadius: "var(--radius)", overflow: "hidden" }}>
          {deletingThread === t.otherId && createPortal(
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setDeletingThread(null)}>
              <div onClick={e => e.stopPropagation()} style={{ background: "#0d1a0d", border: "1px solid var(--border)", borderRadius: 16, padding: 24, maxWidth: 300, width: "90%", textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🗑️</div>
                <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Delete conversation?</div>
                <div style={{ color: "var(--text2)", fontSize: 13, marginBottom: 20 }}>This will remove this conversation from your inbox.</div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setDeletingThread(null)} style={{ flex: 1, padding: "10px", borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)", color: "var(--text2)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)" }}>Cancel</button>
                  <button onClick={() => deleteThread(t.otherId)} style={{ flex: 1, padding: "10px", borderRadius: 10, background: "rgba(244,63,94,0.15)", border: "1px solid rgba(244,63,94,0.4)", color: "#f43f5e", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}>Delete</button>
                </div>
              </div>
            </div>, document.body
          )}
          <div style={{ display: "flex", transform: "translateX(0)", transition: "transform 0.2s" }}
            onTouchStart={e => { e.currentTarget._startX = e.touches[0].clientX; }}
            onTouchMove={e => { const dx = Math.min(0, Math.max(-80, e.touches[0].clientX - e.currentTarget._startX)); e.currentTarget.style.transform = `translateX(${dx}px)`; e.currentTarget.style.transition = "none"; }}
            onTouchEnd={e => { const dx = e.changedTouches[0].clientX - e.currentTarget._startX; if (dx < -40) { e.currentTarget.style.transform = "translateX(-80px)"; } else { e.currentTarget.style.transform = "translateX(0)"; } e.currentTarget.style.transition = "transform 0.2s"; }}>
            <div onClick={() => { openThread(t.otherId, t.username, t.avatar); setInbox(prev => { const updated = prev.map(i => i.otherId === t.otherId ? { ...i, unread: 0 } : i); setTimeout(() => onUnreadChange?.(updated.reduce((sum, i) => sum + (i.unread || 0), 0)), 0); return updated; }); }} style={{ flex: "0 0 100%", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "12px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }} onMouseEnter={e => e.currentTarget.style.background = "rgba(120,180,80,0.05)"} onMouseLeave={e => e.currentTarget.style.background = "var(--card)"}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--green-dim)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: "var(--green)", overflow: "hidden", boxShadow: "0 0 0 2px #78b450, 0 0 10px rgba(120,180,80,0.25)" }}>
                  {t.avatar ? <img src={t.avatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : t.username?.[0]?.toUpperCase()}
                </div>
                {t.last_seen && (Date.now() - new Date(t.last_seen)) < 5 * 60 * 1000 && (
                  <div style={{ position: "absolute", bottom: -2, right: -2, width: 11, height: 11, borderRadius: "50%", background: "#4ade80", border: "2px solid #0d140d" }} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 3 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "var(--text)", fontWeight: 600, fontSize: 14, lineHeight: 1 }}>{capName(t.username)}</span>
                  <span style={{ color: "var(--text3)", fontSize: 11 }}>{new Date(t.lastMessage.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                </div>
                <div style={{ color: "var(--text3)", fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1 }}>
                  {t.lastMessage.image_url ? "📷 Photo" : t.lastMessage.pin_lat ? "📍 Shared a pin" : t.lastMessage.content}
                </div>
              </div>
              {t.unread > 0 && <div style={{ background: "#f43f5e", borderRadius: 20, minWidth: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "white", padding: "0 5px", flexShrink: 0, boxShadow: "0 2px 8px rgba(244,63,94,0.4)" }}>{t.unread > 9 ? "9+" : t.unread}</div>}
            </div>
            <button onClick={() => setDeletingThread(t.otherId)} style={{ flex: "0 0 80px", background: "#f43f5e", border: "none", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, fontFamily: "var(--font-body)", borderRadius: "var(--radius)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" /></svg>
              Delete
            </button>
          </div>
        </div>))}
    </div>
  );
}

function HotspotsTab({ posts, loading, user, selectedState, savedPinIds, saveToMap, openSignIn }) {
  const [filter, setFilter] = useState("all");
  const [userCoords, setUserCoords] = useState(null);
  const [locating, setLocating] = useState(false);

  const hotspots = posts.filter(p => p.lat && p.lng);

  const getDistance = (lat1, lng1, lat2, lng2) => {
    const R = 3958.8;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const handleNearMe = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(pos => {
      setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setFilter("nearme");
      setLocating(false);
    }, () => { toast("Couldn't get your location.", "error"); setLocating(false); });
  };

  const filtered = hotspots
    .filter(p => filter === "state" ? p.state === selectedState : true)
    .map(p => ({ ...p, distance: userCoords ? getDistance(userCoords.lat, userCoords.lng, p.lat, p.lng) : null }))
    .sort((a, b) => filter === "nearme" && a.distance != null ? a.distance - b.distance : new Date(b.created_at) - new Date(a.created_at));

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => {
          if (filter === "all" && selectedState) { setFilter("state"); }
          else if (filter === "state" || (filter === "all" && !selectedState)) { handleNearMe(); }
          else { setFilter("all"); }
        }}
          style={{
            padding: "8px 18px", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", border: "1px solid", transition: "all 0.2s",
            background: filter !== "all" ? "linear-gradient(135deg, #2d5a1b, #1e4010)" : "#0e160e",
            borderColor: filter !== "all" ? "#3d7a25" : "#1c2a1c",
            color: filter !== "all" ? "white" : "#4a6a4a",
            boxShadow: filter !== "all" ? "0 4px 16px rgba(45,90,27,0.35)" : "none"
          }}>
          {filter === "all" ? "All" : filter === "state" ? `📍 ${selectedState}` : locating ? "Locating..." : "📡 Near Me"}
        </button>
      </div>
      {loading && <div style={{ textAlign: "center", padding: 40, color: "var(--text3)", fontSize: 14 }} className="pulse">Loading hotspots...</div>}
      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: 48, color: "var(--text3)", fontSize: 14 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📍</div>
          <div style={{ color: "var(--text)", fontWeight: 600, marginBottom: 6 }}>No hotspots yet</div>
          Posts with a location show up here
        </div>
      )}
      {filtered.map(post => (
        <div key={post.id} className="card fade-in" style={{ padding: 0, overflow: "hidden" }}>
          {post.photo && (
            <div style={{ position: "relative" }}>
              <img src={post.photo} style={{ width: "100%", height: 220, objectFit: "cover", display: "block" }} />
              {post.species && (
                <div style={{ position: "absolute", bottom: 10, left: 10, background: "rgba(8,20,8,0.82)", border: "1px solid var(--border-accent)", backdropFilter: "blur(8px)", borderRadius: 20, padding: "4px 12px" }}>
                  <span style={{ color: "var(--green)", fontSize: 12, fontWeight: 700 }}>{post.species}</span>
                </div>
              )}
              {post.distance != null && (
                <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(8,20,8,0.82)", backdropFilter: "blur(8px)", border: "1px solid var(--border-accent)", borderRadius: 20, padding: "4px 10px" }}>
                  <span style={{ color: "var(--green)", fontSize: 12, fontWeight: 700 }}>{Math.round(post.distance)} mi</span>
                </div>
              )}
            </div>
          )}
          <div style={{ padding: "12px 14px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #3d7a25, #1a3a0e)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--green)", flexShrink: 0 }}>{(post.username || "?")[0].toUpperCase()}</div>
              <span style={{ color: "var(--text)", fontWeight: 700, fontSize: 13 }}>{capName(post.username)}</span>
              {false && post.location && <span style={{ color: "var(--text3)", fontSize: 12 }}>· 📍 {post.location}</span>}
            </div>
            {post.caption && <p style={{ color: "var(--text2)", fontSize: 13, lineHeight: 1.5, margin: "0 0 10px" }}>{post.caption}</p>}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={() => saveToMap(post)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: savedPinIds.has(post.id) ? "rgba(120,180,80,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${savedPinIds.has(post.id) ? "var(--border-accent)" : "var(--border)"}`, color: savedPinIds.has(post.id) ? "var(--green)" : "var(--text2)", padding: "9px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)", transition: "all 0.2s" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill={savedPinIds.has(post.id) ? "var(--green)" : "none"} stroke={savedPinIds.has(post.id) ? "var(--green)" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                {savedPinIds.has(post.id) ? "Saved" : "Save to Map"}
              </button>
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${post.lat},${post.lng}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", color: "var(--text2)", padding: "9px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, textDecoration: "none", transition: "all 0.2s", lineHeight: 1 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>
                Directions
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PinPicker({ user, onSelect }) {
  const [pins, setPins] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("saved_pins").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => setPins(data || []));
  }, [user]);

  if (!user) return null;

  return (
    <>
      <button onClick={() => setOpen(o => !o)} title="Attach a pin" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "50%", color: "var(--text3)", fontSize: 13, width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        📍
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.5)" }} />
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 201, background: "#0d140d", borderTop: "1px solid #2a3a2a", borderRadius: "20px 20px 0 0", maxHeight: "50vh", overflowY: "auto", padding: "8px 0" }}>
            <div style={{ width: 36, height: 4, background: "#2a3a2a", borderRadius: 2, margin: "8px auto 16px" }} />
            <div style={{ padding: "0 16px 8px", color: "var(--text3)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em" }}>SELECT A PIN</div>
            {pins.length === 0 && <div style={{ padding: "16px", fontSize: 13, color: "var(--text3)" }}>No saved pins yet — drop a pin on the Map tab first</div>}
            {pins.map(pin => (
              <div key={pin.id} onClick={() => { onSelect(pin); setOpen(false); }} style={{ padding: "12px 16px", cursor: "pointer", borderBottom: "1px solid var(--border)", fontSize: 13, color: "var(--text)", display: "flex", alignItems: "center", gap: 10 }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(120,180,80,0.08)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                📍 {pin.name || pin.location || "Unnamed pin"}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

function CommunityTab({ selectedState, user, openSignIn, onPinSaved, externalSetUnread, externalSetNotifUnread }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [confirmDeletePost, setConfirmDeletePost] = useState(null);
  const [sharingPost, setSharingPost] = useState(null);
  const [shareSearch, setShareSearch] = useState("");
  const [shareUsers, setShareUsers] = useState([]);
  const [pullY, setPullY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const pullStartY = useRef(0);
  const [stateFilter, setStateFilter] = useState(selectedState || "all");
  const [sortBy, setSortBy] = useState("newest");
  const [form, setForm] = useState({ species: "", location: "", caption: "", photo: "", pinLat: null, pinLng: null });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [savedPinIds, setSavedPinIds] = useState(new Set());
  const [likedPostIds, setLikedPostIds] = useState(new Set());
  const [likeCounts, setLikeCounts] = useState({});
  const [commentCounts, setCommentCounts] = useState({});
  const [expandedComments, setExpandedComments] = useState(new Set());
  const [communityTab, setCommunityTab] = useState("feed");
  const [notifs, setNotifs] = useState([]);
  const [notifUnread, setNotifUnread] = useState(0);

  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const loadNotifs = async () => {
    if (!user) return;
    if (notifs.length === 0) setLoadingNotifs(true);
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const myPostIds = (await supabase.from("posts").select("id").eq("user_id", user.id)).data?.map(p => p.id) || [];
    // Get my comment IDs so we can find replies and likes on them
    const myCommentIds = (await supabase.from("comments").select("id").eq("user_id", user.id)).data?.map(c => c.id) || [];
    const [{ data: followData }, { data: realLikes }, { data: realComments }, { data: commentLikesData }, { data: commentRepliesData }] = await Promise.all([
      supabase.from("follows").select("follower_id, created_at").eq("following_id", user.id).gte("created_at", since).order("created_at", { ascending: false }).limit(30),
      myPostIds.length ? supabase.from("likes").select("post_id, user_id, created_at").in("post_id", myPostIds).neq("user_id", user.id).gte("created_at", since).order("created_at", { ascending: false }).limit(30) : { data: [] },
      myPostIds.length ? supabase.from("comments").select("post_id, user_id, username, content, created_at").in("post_id", myPostIds).neq("user_id", user.id).is("parent_id", null).gte("created_at", since).order("created_at", { ascending: false }).limit(30) : { data: [] },
      myCommentIds.length ? supabase.from("comment_likes").select("comment_id, user_id, created_at, comments(post_id)").in("comment_id", myCommentIds).neq("user_id", user.id).gte("created_at", since).order("created_at", { ascending: false }).limit(20) : { data: [] },
      myCommentIds.length ? supabase.from("comments").select("id, post_id, user_id, username, content, created_at, parent_id").in("parent_id", myCommentIds).neq("user_id", user.id).gte("created_at", since).order("created_at", { ascending: false }).limit(20) : { data: [] },
    ]);
    // Fetch profiles for all unique user ids
    const userIds = [...new Set([
      ...(followData || []).map(f => f.follower_id),
      ...(realLikes || []).map(l => l.user_id),
      ...(realComments || []).map(c => c.user_id),
      ...(commentLikesData || []).map(l => l.user_id),
      ...(commentRepliesData || []).map(r => r.user_id),
    ])].filter(Boolean);
    const { data: profilesData } = userIds.length ? await supabase.from("profiles").select("user_id, username, avatar_url").in("user_id", userIds) : { data: [] };
    const profileMap = {};
    (profilesData || []).forEach(p => { profileMap[p.user_id] = p; });
    const rawAll = [
      ...(realLikes || []).map(l => ({ type: "like", username: profileMap[l.user_id]?.username || "Someone", avatar: profileMap[l.user_id]?.avatar_url, created_at: l.created_at, post_id: l.post_id })),
      ...(realComments || []).map(c => ({ type: "comment", username: c.username || profileMap[c.user_id]?.username || "Someone", avatar: profileMap[c.user_id]?.avatar_url, created_at: c.created_at, post_id: c.post_id, content: c.content })),
      ...(followData || []).map(f => ({ type: "follow", username: profileMap[f.follower_id]?.username || "Someone", avatar: profileMap[f.follower_id]?.avatar_url, created_at: f.created_at, follower_id: f.follower_id })),
      ...(commentLikesData || []).map(l => ({ type: "comment_like", username: profileMap[l.user_id]?.username || "Someone", avatar: profileMap[l.user_id]?.avatar_url, created_at: l.created_at, post_id: l.comments?.post_id })),
      ...(commentRepliesData || []).map(r => ({ type: "reply", username: r.username || profileMap[r.user_id]?.username || "Someone", avatar: profileMap[r.user_id]?.avatar_url, created_at: r.created_at, post_id: r.post_id, content: r.content })),
    ];
    // Group notifications by type+post_id
    const groupKey = n => `${n.type}__${n.post_id || n.follower_id || ""}`;
    const groups = {};
    rawAll.forEach(n => {
      const key = groupKey(n);
      if (!groups[key]) groups[key] = { ...n, count: 1, others: [] };
      else { groups[key].count++; groups[key].others.push(n.username); }
    });
    const all = Object.values(groups).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setNotifs(all);
    const lastSeen = localStorage.getItem("wildai_notifs_seen") || "0";
    setNotifUnread(all.filter(n => new Date(n.created_at) > new Date(lastSeen)).length);
    setLoadingNotifs(false);
  };
  useEffect(() => {
    if (!user) return;
    loadNotifs();
    const interval = setInterval(loadNotifs, 60000);
    // Realtime subscription for instant badge updates
    const channel = supabase.channel('notifs-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'likes' }, () => loadNotifs())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, () => loadNotifs())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'follows' }, () => loadNotifs())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comment_likes' }, () => loadNotifs())
      .subscribe();
    return () => { clearInterval(interval); supabase.removeChannel(channel); };
  }, [user]);
  const [messagesUnread, setMessagesUnread] = useState(0);
  useEffect(() => {
    if (!user) return;
    const loadUnread = () => {
      fetch(`https://wildai-server.onrender.com/messages/inbox?userId=${user.id}`)
        .then(r => r.json())
        .then(data => { if (Array.isArray(data)) setMessagesUnread(data.reduce((sum, t) => sum + (t.unread || 0), 0)); })
        .catch(() => { });
    };
    loadUnread();
    const channel = supabase.channel('messages-unread')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `recipient_id=eq.${user.id}` }, () => loadUnread())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `recipient_id=eq.${user.id}` }, () => loadUnread())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user]);
  useEffect(() => { externalSetUnread?.(messagesUnread); }, [messagesUnread]);
  useEffect(() => { externalSetNotifUnread?.(notifUnread); }, [notifUnread]);
  const [feedFilter, setFeedFilter] = useState("all");
  const [followingIds, setFollowingIds] = useState(new Set());
  const [blockedIds, setBlockedIds] = useState(new Set());

  useEffect(() => {
    if (!user) return;
    supabase.from("blocked_users").select("blocked_id").eq("blocker_id", user.id).then(({ data }) => {
      if (data) setBlockedIds(new Set(data.map(b => b.blocked_id)));
    });
  }, [user]);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(() => !localStorage.getItem("wildai_community_welcomed"));
  const [viewingProfile, setViewingProfile] = useState(null);
  const [viewingPost, setViewingPost] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const loadPosts = async () => {
    setLoading(true);
    let query = supabase.from("posts").select("*").order("created_at", { ascending: false });

    const { data } = await query.limit(50);
    if (data?.length) {
      const userIds = [...new Set(data.map(p => p.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, avatar_url, last_seen").in("user_id", userIds);
      const profileMap = {};
      (profiles || []).forEach(p => { profileMap[p.user_id] = { avatar_url: p.avatar_url, last_seen: p.last_seen }; });
      setPosts(data.map(p => ({ ...p, avatar_url: profileMap[p.user_id]?.avatar_url || null, last_seen: profileMap[p.user_id]?.last_seen || null })));
    } else {
      setPosts([]);
    }
    setLoading(false);
  };

  const loadLikes = async (postList) => {
    if (!postList?.length) return;
    const ids = postList.map(p => p.id);
    const { data } = await supabase.from("likes").select("post_id, user_id").in("post_id", ids);
    if (!data) return;
    const counts = {};
    ids.forEach(id => counts[id] = 0);
    data.forEach(l => { counts[l.post_id] = (counts[l.post_id] || 0) + 1; });
    setLikeCounts(counts);
    if (user) setLikedPostIds(new Set(data.filter(l => l.user_id === user.id).map(l => l.post_id)));
    const { data: commentData } = await supabase.from("comments").select("post_id").in("post_id", ids);
    if (commentData) {
      const cc = {};
      ids.forEach(id => cc[id] = 0);
      commentData.forEach(c => { cc[c.post_id] = (cc[c.post_id] || 0) + 1; });
      setCommentCounts(cc);
    }
  };

  const searchUsers = async (query) => {
    if (!query.trim()) { setSearchResults([]); return; }
    setSearching(true);
    const { data } = await supabase.from("profiles").select("user_id, username, avatar_url").ilike("username", `%${query}%`).limit(5);
    if (data) setSearchResults(data.filter(u => u.username));
    setSearching(false);
  };

  const loadSavedPins = async () => {
    if (!user) return;
    const { data } = await supabase.from("saved_pins").select("post_id").eq("user_id", user.id);
    setSavedPinIds(new Set((data || []).map(p => p.post_id)));
  };

  useEffect(() => { loadPosts(); }, [stateFilter]);

  useEffect(() => { if (posts.length) loadLikes(posts); }, [posts, user]);
  useEffect(() => {
    const channel = supabase
      .channel("posts-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, (payload) => {
        const newPost = payload.new;
        if (stateFilter !== "all" && newPost.state !== stateFilter) return;
        setPosts(prev => [newPost, ...prev]);
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "posts" }, (payload) => {
        setPosts(prev => prev.filter(p => p.id !== payload.old.id));
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [stateFilter]);
  useEffect(() => {
    if (window._sharePinToComm) {
      const pin = window._sharePinToComm;
      setForm(f => ({ ...f, location: pin.name || pin.location || "", species: pin.species || "", pinLat: pin.lat, pinLng: pin.lng }));
      setShowForm(true);
      window._sharePinToComm = null;
    }
  }, []);
  useEffect(() => { loadSavedPins(); }, [user]);
  useEffect(() => {
    if (!user) return;
    supabase.from("follows").select("following_id").eq("follower_id", user.id).then(({ data }) => {
      if (data) {
        setFollowingIds(new Set(data.map(f => f.following_id)));
        window._updateFollowing = (id, add) => setFollowingIds(prev => { const n = new Set(prev); add ? n.add(id) : n.delete(id); return n; });
      }
    });
  }, [user]);

  const toggleLike = async (post) => {
    if (!user) { openSignIn(); return; }
    const liked = likedPostIds.has(post.id);
    if (liked) {
      await supabase.from("likes").delete().eq("post_id", post.id).eq("user_id", user.id);
      setLikedPostIds(prev => { const n = new Set(prev); n.delete(post.id); return n; });
      setLikeCounts(prev => ({ ...prev, [post.id]: Math.max(0, (prev[post.id] || 1) - 1) }));
    } else {
      await supabase.from("likes").insert({ post_id: post.id, user_id: user.id });
      setLikedPostIds(prev => new Set([...prev, post.id]));
      setLikeCounts(prev => ({ ...prev, [post.id]: (prev[post.id] || 0) + 1 }));
      if (post.user_id !== user.id) {
        fetch("https://wildai-server.onrender.com/push/like", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ post_owner_id: post.user_id, liker_username: user.username || user.firstName || "Someone" }) }).catch(() => { });
      }
    }
  };

  const submitPost = async () => {
    if (!form.photo && !form.caption) { toast("Please add a photo and description.", "error"); return; }
    if (!form.photo) { toast("Please add a photo to your post.", "error"); return; }
    if (!form.caption) { toast("Please add a description to your post.", "error"); return; }
    if (!user) { openSignIn(); return; }
    setSubmitting(true); setError(null);
    const { data: banned } = await supabase.from("banned_users").select("id").eq("user_id", user.id).maybeSingle();
    if (banned) { setError("Your account has been suspended."); setSubmitting(false); return; }
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: recentPost } = await supabase.from("posts").select("id").eq("user_id", user.id).gte("created_at", fiveMinutesAgo).maybeSingle();
    if (recentPost) { setError("Please wait 5 minutes between posts."); setSubmitting(false); return; }
    let lat = null, lng = null;
    if (form.pinLat && form.pinLng) {
      lat = form.pinLat; lng = form.pinLng;
    }
    const { error } = await supabase.from("posts").insert({
      user_id: user.id,
      username: user.username || user.firstName || "Hunter",
      state: selectedState || "Unknown",
      species: form.species,
      location: form.location,
      caption: form.caption,
      photo: form.photo,
      lat, lng,
    });
    if (error) { setError("Failed to post. Try again."); }
    else { setForm({ species: "", location: "", caption: "", photo: "", pinLat: null, pinLng: null }); setShowForm(false); }
    setSubmitting(false);
  };

  const saveToMap = async (post) => {
    if (!user) { openSignIn(); return; }
    if (savedPinIds.has(post.id)) {
      const { error } = await supabase.from("saved_pins").delete().eq("user_id", user.id).eq("post_id", post.id);
      if (error) { console.error("Delete pin error:", error); toast("Failed to remove pin.", "error"); return; }
      setSavedPinIds(prev => { const n = new Set(prev); n.delete(post.id); return n; });
      window._removePinFromMap?.(post.id);
      toast("Pin removed from your map.", "dark");
      return;
    }
    if (!post.lat || !post.lng) { toast("This post doesn't have a location pin.", "error"); return; }
    const { error: insertError } = await supabase.from("saved_pins").insert({
      user_id: user.id, post_id: post.id,
      name: post.location || post.species || "Saved Spot",
      location: post.location, species: post.species,
      photo: post.photo, lat: post.lat, lng: post.lng, state: post.state,
    });
    if (insertError) { console.error("Save pin error:", insertError); toast("Failed to save pin.", "error"); return; }
    setSavedPinIds(prev => new Set([...prev, post.id]));
    window._addPinToMap?.({ user_id: user.id, post_id: post.id, name: post.location || post.species || "Saved Spot", location: post.location, species: post.species, photo: post.photo, lat: post.lat, lng: post.lng, state: post.state });
    onPinSaved?.();
    toast("📍 Saved to your map!", "success");
  };

  const reportPost = async (postId) => {
    if (!user) { openSignIn(); return; }
    const { data: existing } = await supabase.from("reports").select("id").eq("post_id", postId).eq("user_id", user.id).single();
    if (existing) { toast("You've already reported this post."); return; }
    await supabase.from("reports").insert({ post_id: postId, reason: "User reported", user_id: user.id });
    toast("Post reported. Thank you.", "success");
  };

  const deletePost = async (postId) => {
    setConfirmDeletePost(postId);
  };
  const doDeletePost = async (postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
    await supabase.from("posts").delete().eq("id", postId);
    setConfirmDeletePost(null);
    toast("Post deleted.", "success");
  };

  const filteredByFollow = feedFilter === "following"
    ? posts.filter(p => followingIds.has(p.user_id) && !blockedIds.has(p.user_id))
    : posts.filter(p => !blockedIds.has(p.user_id));
  const sortedPosts = [...filteredByFollow].sort((a, b) => {
    if (sortBy === "top") return (likeCounts[b.id] || 0) - (likeCounts[a.id] || 0);
    return new Date(b.created_at) - new Date(a.created_at);
  });

  return (
    <div key={communityTab} className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 14, overflow: "visible" }}
      onTouchStart={e => { pullStartY.current = e.touches[0].clientY; setIsPulling(true); }}
      onTouchMove={e => {
        if (!isPulling) return;
        const dy = e.touches[0].clientY - pullStartY.current;
        if (dy > 0 && window.scrollY === 0 && communityTab === "feed") setPullY(Math.min(dy * 0.4, 80));
      }}
      onTouchEnd={() => {
        setIsPulling(false);
        if (pullY > 50 && !refreshing) {
          setRefreshing(true);
          loadPosts().finally(() => { setRefreshing(false); setPullY(0); });
        } else {
          setPullY(0);
        }
      }}
    >


      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", color: "var(--green)", textTransform: "uppercase", marginBottom: 2 }}>Community</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.3px" }}>Ravlin Feed</div>
        </div>

      </div>

      {/* Search */}
      <div style={{ position: "relative" }}>
        <svg style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#4a6a4a", pointerEvents: "none" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
        <input
          placeholder="Search users..."
          value={searchQuery}
          onChange={e => { setSearchQuery(e.target.value); searchUsers(e.target.value); }}
          style={{ width: "100%", padding: "12px 14px 12px 38px", borderRadius: 16, fontSize: 13, background: "#111a11", border: "1px solid #1c2a1c", color: "var(--text)", fontFamily: "var(--font-body)", boxSizing: "border-box" }}
        />
        {searchResults.length > 0 && (
          <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, background: "#0d140d", border: "1px solid #2a3a2a", borderRadius: 12, overflow: "hidden", zIndex: 50 }}>
            {searchResults.map(u => (
              <div key={u.user_id} onClick={() => { setViewingProfile(u.user_id); setSearchQuery(""); setSearchResults([]); }} style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid var(--border)", color: "var(--text)", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 10 }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(120,180,80,0.08)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ width: 32, height: 32, borderRadius: 10, overflow: "hidden", background: "linear-gradient(135deg, #1e4010, #0f2408)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 0 0 2px #78b450, 0 0 10px rgba(120,180,80,0.25)" }}>
                  {u.avatar_url ? <img src={u.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 14, fontFamily: "var(--font-display)", color: "var(--green)", fontWeight: 700 }}>{u.username?.[0]?.toUpperCase()}</span>}
                </div>
                {capName(u.username)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tab Nav */}
      <div style={{ display: "flex", borderRadius: 16, padding: 4, gap: 2, background: "#0e160e", border: "1px solid #192019" }}>
        {[
          { id: "feed", label: "Feed", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg> },
          { id: "chat", label: "Chat", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg> },
          { id: "notifs", label: "Activity", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg> },
          { id: "messages", label: "Messages", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg> },
          { id: "profile", label: "Profile", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg> },
        ].map(t => (
          <button key={t.id} onClick={() => { setCommunityTab(t.id); setViewingProfile(null); if (t.id === "notifs") { loadNotifs(); localStorage.setItem("wildai_notifs_seen", new Date().toISOString()); setNotifUnread(0); } }} style={{
            flex: 1, padding: "9px 0", fontSize: 10, fontWeight: 700, borderRadius: 12, border: "none", cursor: "pointer", transition: "all 0.2s",
            background: communityTab === t.id ? "linear-gradient(135deg, #2d5a1b, #1e4010)" : "transparent",
            color: communityTab === t.id ? "white" : "#4a6a4a",
            boxShadow: communityTab === t.id ? "0 4px 16px rgba(45,90,27,0.4)" : "none"
          }}>
            <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <span style={{ position: "relative", width: 18, height: 18, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                {t.icon}
                {t.id === "messages" && messagesUnread > 0 && (
                  <span style={{ position: "absolute", top: -3, right: -3, background: "#f43f5e", borderRadius: "50%", width: 11, height: 11, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 800, color: "white" }}>
                    {messagesUnread > 9 ? "9+" : messagesUnread}
                  </span>
                )}
                {t.id === "notifs" && notifUnread > 0 && (
                  <span style={{ position: "absolute", top: -3, right: -3, background: "#f43f5e", borderRadius: "50%", width: 11, height: 11, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 800, color: "white" }}>
                    {notifUnread > 9 ? "9+" : notifUnread}
                  </span>
                )}
              </span>
              {(communityTab === t.id || window.innerWidth > 600) && <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.03em" }}>{t.label}</span>}
            </span>
          </button>
        ))}
      </div>
      {confirmDeletePost && createPortal(
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 999999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={() => setConfirmDeletePost(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#0d1a0d", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 28, maxWidth: 320, width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🗑️</div>
            <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 16, fontFamily: "var(--font-display)", marginBottom: 8 }}>Delete this post?</div>
            <div style={{ color: "var(--text3)", fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>This can't be undone.</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmDeletePost(null)} className="btn-ghost" style={{ flex: 1, padding: "10px 0", fontSize: 14 }}>Cancel</button>
              <button onClick={() => doDeletePost(confirmDeletePost)} style={{ flex: 1, padding: "10px 0", fontSize: 14, background: "rgba(255,60,60,0.15)", border: "1px solid rgba(255,60,60,0.3)", borderRadius: "var(--radius-sm)", color: "rgba(255,100,100,0.9)", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}>Delete</button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {communityTab === "notifs" && !viewingProfile && viewingPost && (
        <PostDetailPage postId={viewingPost} user={user} openSignIn={openSignIn} onBack={() => setViewingPost(null)} onViewUser={(id) => { setViewingProfile(id); setViewingPost(null); }} />
      )}
      {communityTab === "notifs" && !viewingProfile && !viewingPost && (
        <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 2 }}>

          {!loadingNotifs && notifs.length === 0 && (
            <div style={{ textAlign: "center", padding: 48, color: "var(--text3)", fontSize: 14 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
              <div style={{ color: "var(--text)", fontWeight: 600, marginBottom: 6 }}>No activity yet</div>
              Post something to start getting likes and follows!
            </div>
          )}
          {notifs.map((n, i) => (
            <div key={i} onClick={() => {
              if (n.type === "follow" && n.follower_id) { setViewingProfile(n.follower_id); }
              else if (n.post_id) { setViewingPost(n.post_id); }
            }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 4px", borderBottom: "1px solid var(--border)", cursor: "pointer", borderRadius: 8, transition: "background 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(120,180,80,0.05)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg, #1e4010, #0f2408)", overflow: "hidden", flexShrink: 0, boxShadow: "0 0 0 2px #78b450" }}>
                {n.avatar ? <img src={n.avatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--green)", fontWeight: 700, fontSize: 15 }}>{n.username[0].toUpperCase()}</div>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ color: "var(--text)", fontWeight: 700, fontSize: 13 }}>{capName(n.username)}</span>
                <span style={{ color: "var(--text2)", fontSize: 13 }}>
                  {(() => {
                    const others = n.count > 1 ? ` and ${n.count - 1} other${n.count > 2 ? "s" : ""}` : "";
                    if (n.type === "like") return `${others} liked your post`;
                    if (n.type === "comment") return n.count > 1 ? `${others} commented on your post` : ` commented: "${n.content?.slice(0, 40)}${n.content?.length > 40 ? "..." : ""}"`;
                    if (n.type === "comment_like") return `${others} liked your comment`;
                    if (n.type === "reply") return n.count > 1 ? `${others} replied to your comment` : ` replied: "${n.content?.slice(0, 40)}${n.content?.length > 40 ? "..." : ""}"`;
                    return " followed you";
                  })()}
                </span>
                <div style={{ color: "var(--text3)", fontSize: 11, marginTop: 3 }}>{(() => { const diff = (Date.now() - new Date(n.created_at)) / 1000; if (diff < 60) return "just now"; if (diff < 3600) return `${Math.floor(diff / 60)}m ago`; if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`; return `${Math.floor(diff / 86400)}d ago`; })()}</div>
              </div>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: n.type === "like" ? "rgba(244,63,94,0.15)" : n.type === "comment" ? "rgba(120,180,80,0.15)" : "rgba(80,140,220,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                {n.type === "like" ? "❤️" : n.type === "comment" ? "💬" : n.type === "comment_like" ? "❤️" : n.type === "reply" ? "↩️" : "➕"}
              </div>
            </div>
          ))}
        </div>
      )}
      {communityTab === "messages" && !viewingProfile && (
        <MessagesTab user={user} openSignIn={openSignIn} supabase={supabase} onUnreadChange={setMessagesUnread} />
      )}
      {communityTab === "chat" && !viewingProfile && (
        <GlobalChatTab user={user} openSignIn={openSignIn} />
      )}
      {communityTab === "profile" && !viewingProfile && (
        !user ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text3)", fontSize: 14 }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🦌</div>
            <div style={{ color: "var(--text)", fontWeight: 600, marginBottom: 6 }}>Sign in to view your profile</div>
            <button onClick={openSignIn} className="btn-primary" style={{ padding: "8px 20px", fontSize: 13 }}>Sign In</button>
          </div>
        ) : createPortal(
          <div className="fade-in" style={{ position: "fixed", inset: 0, zIndex: 99998, background: "var(--bg)", overflowY: "auto", padding: "0 0 80px" }}>
            <div style={{ maxWidth: 760, margin: "0 auto" }}>
              <UserProfilePage
                userId={user.id}
                currentUser={user}
                onBack={() => setCommunityTab("feed")}
                openSignIn={openSignIn}
                onViewUser={(id) => { setViewingProfile(id); }}
                onPost={() => { setShowForm(true); setCommunityTab("feed"); }}
                onBlock={(id, unblock) => { setBlockedIds(prev => { const n = new Set(prev); unblock ? n.delete(id) : n.add(id); return n; }); }}
                openUserProfile={() => window._clerkOpenProfile?.()}
              />
            </div>
          </div>,
          document.body
        )
      )}
      {viewingProfile && createPortal(
        <div className="fade-in" style={{ position: "fixed", inset: 0, zIndex: 99998, background: "var(--bg)", overflowY: "auto", padding: "0 0 80px" }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <UserProfilePage
              userId={viewingProfile}
              currentUser={user}
              onBack={() => setViewingProfile(null)}
              openSignIn={openSignIn}
              onViewUser={(id) => setViewingProfile(id)}
              onMessage={(id) => { setViewingProfile(null); setCommunityTab("messages"); setTimeout(() => { window._openMessageThread = id; }, 100); }}
              onBlock={(id, unblock) => { setBlockedIds(prev => { const n = new Set(prev); unblock ? n.delete(id) : n.add(id); return n; }); if (!unblock) setViewingProfile(null); }}
            />
          </div>
        </div>,
        document.body
      )}
      {communityTab === "feed" && !viewingProfile && <>
        {showWelcomeBanner && (
          <div className="fade-in" style={{ background: "linear-gradient(135deg, rgba(35,70,15,0.6), rgba(15,35,8,0.8))", border: "1px solid var(--border-accent)", borderRadius: "var(--radius)", padding: "16px 18px", display: "flex", alignItems: "flex-start", gap: 12 }}>
            <span style={{ fontSize: 24, flexShrink: 0 }}>🌲</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Welcome to Ravlin Community</div>
              <div style={{ color: "var(--text2)", fontSize: 12, lineHeight: 1.6 }}>Share spots, follow other hunters & anglers, and message privately. Your pins stay private unless you choose to post them.</div>
            </div>
            <button onClick={() => { setShowWelcomeBanner(false); localStorage.setItem("wildai_community_welcomed", "1"); }} style={{ background: "none", border: "none", color: "var(--text3)", fontSize: 18, cursor: "pointer", padding: 0, flexShrink: 0, lineHeight: 1 }}>✕</button>
          </div>
        )}
        {/* Toggles */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => { if (!user && feedFilter === "all") { openSignIn(); return; } setFeedFilter(feedFilter === "all" ? "following" : "all"); }}
            style={{
              padding: "8px 18px", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", border: "1px solid", transition: "all 0.2s",
              background: feedFilter === "following" ? "linear-gradient(135deg, #2d5a1b, #1e4010)" : "#0e160e",
              borderColor: feedFilter === "following" ? "#3d7a25" : "#1c2a1c",
              color: feedFilter === "following" ? "white" : "#4a6a4a",
              boxShadow: feedFilter === "following" ? "0 4px 16px rgba(45,90,27,0.35)" : "none"
            }}>
            {feedFilter === "following" ? "Following" : "All"}
          </button>
          <button onClick={() => setSortBy(sortBy === "newest" ? "top" : "newest")}
            style={{
              padding: "8px 18px", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", border: "1px solid", transition: "all 0.2s",
              background: sortBy === "top" ? "linear-gradient(135deg, #3a1a05, #2a1000)" : "#0e160e",
              borderColor: sortBy === "top" ? "rgba(200,100,20,0.4)" : "#1c2a1c",
              color: sortBy === "top" ? "#ff9500" : "#4a6a4a",
              boxShadow: sortBy === "top" ? "0 4px 16px rgba(200,100,20,0.2)" : "none"
            }}>
            {sortBy === "top" ? "🔥 Trending" : "✦ New"}
          </button>
          <div style={{ flex: 1 }} />
          {user && <button onClick={() => { if (showForm) { setShowForm(false); setForm({ species: "", location: "", caption: "", photo: "", pinLat: null, pinLng: null }); } else { setShowForm(true); } }} style={{ width: 32, height: 32, borderRadius: "50%", background: showForm ? "rgba(255,100,100,0.15)" : "linear-gradient(135deg, #2d5a1b, #1e4010)", border: "none", color: "white", fontSize: showForm ? 16 : 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{showForm ? "✕" : "+"}</button>}
        </div>
      </>}

      {(communityTab === "feed" || communityTab === "profile") && !viewingProfile && showForm && (
        <div className="fade-in" style={{ background: "#0e1510", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, overflow: "hidden", marginBottom: 4 }}>
          {/* Photo area */}
          <label style={{ display: "block", cursor: "pointer", position: "relative" }}>
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={async e => {
              const file = e.target.files[0];
              if (!file) return;
              const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
              toast("Uploading photo...", "info");
              const stripped = await stripExif(file);
              const { data, error } = await supabase.storage.from("post-photos").upload(fileName, stripped, { contentType: "image/jpeg" });
              if (error) { toast("Photo upload failed. Try again.", "error"); return; }
              const { data: urlData } = supabase.storage.from("post-photos").getPublicUrl(fileName);
              setForm(f => ({ ...f, photo: urlData.publicUrl }));
              toast("Photo added!", "success");
            }} />
            {form.photo ? (
              <div style={{ position: "relative" }}>
                <img src={form.photo} style={{ width: "100%", maxHeight: 300, objectFit: "cover", display: "block" }} />
                <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.6)", borderRadius: 20, padding: "4px 10px", fontSize: 12, color: "white", backdropFilter: "blur(8px)" }}>Change photo</div>
              </div>
            ) : (
              <div style={{ height: 120, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>Add a photo</span>
              </div>
            )}
          </label>

          {/* Fields */}
          <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            <textarea
              placeholder="Share your experience..."
              value={form.caption}
              onChange={e => setForm(f => ({ ...f, caption: e.target.value.slice(0, 500) }))}
              style={{ width: "100%", padding: "0", borderRadius: 0, fontSize: 14, minHeight: 40, resize: "none", background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.06)", color: "var(--text)", fontFamily: "var(--font-body)", outline: "none", boxSizing: "border-box", paddingBottom: 10, lineHeight: 1.6 }}
            />
            <div style={{ display: "flex", gap: 6 }}>
              <input placeholder="Species" value={form.species} onChange={e => setForm(f => ({ ...f, species: e.target.value }))} style={{ flex: 1, padding: "6px 10px", borderRadius: 20, fontSize: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text)", minWidth: 0, boxSizing: "border-box" }} />
              <div style={{ flex: 1, position: "relative", minWidth: 0, display: "flex", gap: 5, alignItems: "center" }}>
                <input placeholder="Location" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value, pinLat: null, pinLng: null }))} style={{ flex: 1, padding: "6px 10px", borderRadius: 20, fontSize: 12, background: form.pinLat ? "var(--green-dim)" : "rgba(255,255,255,0.04)", border: form.pinLat ? "1px solid var(--border-accent)" : "1px solid rgba(255,255,255,0.08)", color: "var(--text)", boxSizing: "border-box", minWidth: 0 }} />
                <PinPicker user={user} onSelect={(pin) => setForm(f => ({ ...f, location: pin.name || pin.location || f.location, pinLat: pin.lat, pinLng: pin.lng }))} />
                {form.pinLat && <button onClick={() => setForm(f => ({ ...f, pinLat: null, pinLng: null, location: "" }))} style={{ background: "none", border: "none", color: "var(--text3)", fontSize: 13, cursor: "pointer", padding: 0, flexShrink: 0 }}>✕</button>}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1 }} />
              {error && <span style={{ color: "var(--amber)", fontSize: 12 }}>{error}</span>}
              <button onClick={() => { if (!form.photo || !form.caption) { if (!form.photo && !form.caption) { toast("Please add a photo and description.", "error"); } else if (!form.photo) { toast("Please add a photo to your post.", "error"); } else { toast("Please add a description to your post.", "error"); } return; } submitPost(); }} disabled={submitting} className="btn-primary" style={{ padding: "9px 20px", fontSize: 13, borderRadius: 20, opacity: submitting ? 0.5 : (!form.photo || !form.caption) ? 0.7 : 1 }}>
                {submitting ? "Posting..." : "Share"}
              </button>
            </div>
          </div>
        </div>
      )}

      {communityTab === "feed" && !viewingProfile && loading && <div style={{ minHeight: 300 }} />}

      {sharingPost && createPortal(
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 999999, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => { setSharingPost(null); setShareSearch(""); setShareUsers([]); }}>
          <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 760, background: "#0d1a0d", border: "1px solid var(--border)", borderRadius: "20px 20px 0 0", padding: 24, maxHeight: "70vh", display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 16, fontFamily: "var(--font-display)" }}>Share to Messages</div>
            <input
              placeholder="Search users..."
              value={shareSearch}
              autoFocus
              onChange={async e => {
                setShareSearch(e.target.value);
                if (e.target.value.length < 2) { setShareUsers([]); return; }
                const { data } = await supabase.from("profiles").select("user_id, username, avatar_url").ilike("username", `%${e.target.value}%`).neq("user_id", user.id).limit(10);
                setShareUsers(data || []);
              }}
              style={{ padding: "10px 14px", borderRadius: "var(--radius-sm)", fontSize: 14, background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "var(--text)", fontFamily: "var(--font-body)" }}
            />
            <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
              {shareUsers.map(u => (
                <div key={u.user_id} onClick={async () => {
                  await fetch("https://wildai-server.onrender.com/messages/send", {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      sender_id: user.id,
                      recipient_id: u.user_id,
                      content: sharingPost.caption ? `📸 ${sharingPost.caption}` : "📸 Shared a post",
                      image_url: sharingPost.photo,
                    })
                  });
                  setSharingPost(null); setShareSearch(""); setShareUsers([]);
                  toast(`Post shared to ${capName(u.username)}!`, "success");
                }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: "var(--radius-sm)", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", cursor: "pointer" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--green-dim)", overflow: "hidden", flexShrink: 0 }}>
                    {u.avatar_url ? <img src={u.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--green)", fontWeight: 700 }}>{u.username[0].toUpperCase()}</div>}
                  </div>
                  <span style={{ color: "var(--text)", fontWeight: 600, fontSize: 14 }}>{capName(u.username)}</span>
                </div>
              ))}
              {shareSearch.length >= 2 && shareUsers.length === 0 && (
                <div style={{ color: "var(--text3)", fontSize: 13, textAlign: "center", padding: 20 }}>No users found</div>
              )}
              {shareSearch.length < 2 && (
                <div style={{ color: "var(--text3)", fontSize: 13, textAlign: "center", padding: 20 }}>Type a username to search</div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
      {communityTab === "feed" && !viewingProfile && pullY > 0 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: pullY, overflow: "hidden", transition: pullY < 50 ? "none" : "height 0.3s", color: "var(--text3)", fontSize: 12 }}>
          {pullY > 50 || refreshing ? <div style={{ width: 20, height: 20, border: "2px solid var(--green)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> : <span style={{ opacity: pullY / 50 }}>↓ Pull to refresh</span>}
        </div>
      )}
      {communityTab === "feed" && !viewingProfile && !loading && posts.length === 0 && (
        <div style={{ textAlign: "center", padding: 48, color: "var(--text3)", fontSize: 14 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🌲</div>
          <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 16, marginBottom: 8 }}>No posts yet</div>
          Be the first to share a spot in {stateFilter === "all" ? "your state" : stateFilter}!
        </div>
      )}

      {communityTab === "feed" && !viewingProfile && <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>{sortedPosts.map(post => {
        const likeCount = likeCounts[post.id] || 0;
        const isLiked = likedPostIds.has(post.id);
        const isHot = likeCount >= 5;
        const timeAgo = (date) => {
          const diff = (Date.now() - new Date(date)) / 1000;
          if (diff < 60) return "just now";
          if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
          if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
          return `${Math.floor(diff / 86400)}d ago`;
        };
        return (
          <div key={post.id} className="fade-in" style={{ borderRadius: 0, overflow: "hidden", borderTop: isHot ? "1px solid rgba(255,150,0,0.3)" : "1px solid rgba(255,255,255,0.08)", borderBottom: "1px solid rgba(255,255,255,0.08)", borderLeft: "none", borderRight: "none", background: "#0e1510" }}>

            {/* Card Header */}
            <div style={{ padding: "14px 16px 14px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div onClick={() => setViewingProfile(post.user_id)} style={{ width: 44, height: 44, borderRadius: 14, background: "linear-gradient(135deg, #3d7a25, #1a3a0e)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", boxShadow: "0 0 0 2px #78b450, 0 0 12px rgba(120,180,80,0.3)" }}>
                  {post.avatar_url ? <img src={post.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ color: "white", fontWeight: 700, fontSize: 17, fontFamily: "var(--font-display)" }}>{(post.username || "H")[0].toUpperCase()}</span>}
                </div>
                {post.last_seen && (Date.now() - new Date(post.last_seen)) < 5 * 60 * 1000 && (
                  <div style={{ position: "absolute", bottom: -1, right: -1, width: 13, height: 13, borderRadius: "50%", background: "#4ade80", border: "2px solid #0d140d" }} />
                )}
              </div>
              <div style={{ flex: 1, textAlign: "left" }}>
                <span onClick={() => setViewingProfile(post.user_id)} style={{ color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "block" }}>{capName(post.username)}</span>
                <span style={{ color: "#4a6a4a", fontSize: 11, display: "flex", alignItems: "center", gap: 3 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#3d7a25" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                  {post.state}
                </span>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: "#3a5a3a", background: "#111a11", border: "1px solid #1c2c1c", padding: "3px 8px", borderRadius: 20 }}>
                  {timeAgo(post.created_at)}
                </span>
                {(user?.id === post.user_id || user?.id === "user_3CKoCuA9KUvrtfrJ3ia3Bm2BH1a") && <button onClick={() => deletePost(post.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,100,100,0.4)", padding: "2px 4px" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg></button>}
                <button onClick={() => reportPost(post.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#3a5a3a", padding: "2px 4px" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg></button>
              </div>
            </div>

            {/* Photo */}
            {post.photo && (
              <div style={{ position: "relative", margin: "0", borderRadius: 0, overflow: "hidden" }}>
                <img src={post.photo} style={{ width: "100%", maxHeight: 420, objectFit: "cover", display: "block" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(13,20,13,0.85) 0%, transparent 50%)" }} />
                <div style={{ position: "absolute", bottom: 10, left: 10, right: 10, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                  {post.species && <span style={{ fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 10, background: "rgba(45,90,27,0.85)", border: "1px solid rgba(61,122,37,0.6)", color: "white", backdropFilter: "blur(4px)" }}>{post.species}</span>}
                  {isHot && <span style={{ fontSize: 11, fontWeight: 600, padding: "5px 10px", borderRadius: 10, background: "rgba(30,20,10,0.85)", border: "1px solid rgba(200,100,20,0.3)", color: "#ff9500", backdropFilter: "blur(4px)" }}>🔥 Trending</span>}
                </div>
              </div>
            )}
            {!post.photo && post.species && (
              <div style={{ padding: "0 16px 6px" }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 10, background: "rgba(45,90,27,0.5)", border: "1px solid rgba(61,122,37,0.4)", color: "var(--green)", display: "inline-block" }}>{post.species}</span>
              </div>
            )}

            {/* Caption */}
            {post.caption && (
              <div style={{ padding: "10px 16px 6px" }}>
                <p style={{ color: "#b8ccb8", fontSize: 13, lineHeight: 1.55, margin: 0, textAlign: "left" }}>
                  <span style={{ fontWeight: 700, color: "white" }}>{capName(post.username)}</span> {post.caption}
                </p>
              </div>
            )}

            {/* Actions — IG style */}
            <div style={{ padding: "8px 14px 12px", display: "flex", alignItems: "center", gap: 14 }}>
              <button onClick={(e) => { toggleLike(post); const svg = e.currentTarget.querySelector('svg'); svg.classList.remove('like-pop'); void svg.offsetWidth; svg.classList.add('like-pop'); }} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, color: isLiked ? "#f43f5e" : "#6a8a6a", padding: "4px 0", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill={isLiked ? "#f43f5e" : "none"} stroke={isLiked ? "#f43f5e" : "currentColor"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                {likeCount > 0 && <span>{likeCount}</span>}
              </button>
              <button onClick={() => setExpandedComments(prev => { const n = new Set(prev); n.has(post.id) ? n.delete(post.id) : n.add(post.id); return n; })} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, color: expandedComments.has(post.id) ? "var(--green)" : "#6a8a6a", padding: "4px 0", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, transition: "all 0.15s" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                {commentCounts[post.id] > 0 && <span>{commentCounts[post.id]}</span>}
              </button>
              <button onClick={() => setSharingPost(post)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6a8a6a", padding: "4px 0", transition: "all 0.15s" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 1 0-16 0" /><path d="M16 19h6" /><path d="M19 16v6" /></svg>
              </button>
              <button onClick={() => navigator.share ? navigator.share({ title: "Ravlin", text: post.caption, url: window.location.href }) : toast("Sharing not supported on this device.", "error")} style={{ background: "none", border: "none", cursor: "pointer", color: "#6a8a6a", padding: "4px 0", transition: "all 0.15s" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
              </button>
              <div style={{ flex: 1 }} />

            </div>

            {expandedComments.has(post.id) && (
              <div style={{ borderTop: "1px solid #192019" }}>
                <PostComments postId={post.id} postOwnerId={post.user_id} user={user} openSignIn={openSignIn} onCommentAdded={(delta = 1) => setCommentCounts(prev => ({ ...prev, [post.id]: Math.max(0, (prev[post.id] || 0) + delta) }))} onViewUser={(id) => setViewingProfile(id)} />
              </div>
            )}
          </div>
        );
      })}</div>}
    </div>
  );
}

// ─── POST COMMENTS ────────────────────────────────────────────────────────────
function PostDetailPage({ postId, user, openSignIn, onBack, onViewUser }) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [commentCount, setCommentCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase.from("posts").select("*").eq("id", postId).single();
      if (data) {
        // Fetch latest avatar from profiles in case post has stale avatar
        const { data: profile } = await supabase.from("profiles").select("avatar_url, username").eq("user_id", data.user_id).single();
        setPost({ ...data, avatar_url: profile?.avatar_url || data.avatar_url, username: profile?.username || data.username });
      }
      const { count } = await supabase.from("likes").select("*", { count: "exact", head: true }).eq("post_id", postId);
      setLikeCount(count || 0);
      if (user) {
        const { data: liked } = await supabase.from("likes").select("id").eq("post_id", postId).eq("user_id", user.id).single();
        setIsLiked(!!liked);
      }
      const { count: cc } = await supabase.from("comments").select("*", { count: "exact", head: true }).eq("post_id", postId);
      setCommentCount(cc || 0);
      setLoading(false);
    };
    load();
  }, [postId]);

  const toggleLike = async () => {
    if (!user) { openSignIn(); return; }
    if (isLiked) {
      await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", user.id);
      setIsLiked(false); setLikeCount(c => c - 1);
    } else {
      await supabase.from("likes").insert({ post_id: postId, user_id: user.id });
      setIsLiked(true); setLikeCount(c => c + 1);
    }
  };

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: "var(--text3)" }} className="pulse">Loading...</div>;
  if (!post) return <div style={{ textAlign: "center", padding: 60, color: "var(--text3)" }}>Post not found.</div>;

  const timeAgo = (date) => {
    const diff = (Date.now() - new Date(date)) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return createPortal(
    <div className="fade-in" style={{ position: "fixed", inset: 0, zIndex: 99999, background: "var(--bg)", overflowY: "auto", padding: "0 0 80px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "16px 16px 0" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--green)", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, padding: "4px 0 16px" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
          Back
        </button>
        <div style={{ borderRadius: 20, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)", background: "#0e1510" }}>
          <div style={{ padding: "14px 16px 10px", display: "flex", alignItems: "center", gap: 12 }}>
            <div onClick={() => onViewUser(post.user_id)} style={{ width: 44, height: 44, borderRadius: 14, background: "linear-gradient(135deg, #3d7a25, #1a3a0e)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", boxShadow: "0 0 0 2px #78b450" }}>
              {post.avatar_url ? <img src={post.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ color: "white", fontWeight: 700, fontSize: 17 }}>{(post.username || "H")[0].toUpperCase()}</span>}
            </div>
            <div style={{ flex: 1 }}>
              <span onClick={() => onViewUser(post.user_id)} style={{ color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "block" }}>{capName(post.username)}</span>
              <span style={{ color: "#4a6a4a", fontSize: 11 }}>{post.state}</span>
            </div>
            <span style={{ fontSize: 10, fontWeight: 600, color: "#3a5a3a", background: "#111a11", border: "1px solid #1c2c1c", padding: "3px 8px", borderRadius: 20 }}>{timeAgo(post.created_at)}</span>
          </div>
          {post.photo && (
            <div style={{ position: "relative" }}>
              <img src={post.photo} style={{ width: "100%", maxHeight: 340, objectFit: "cover", display: "block" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(13,20,13,0.85) 0%, transparent 50%)" }} />
              {post.species && <span style={{ position: "absolute", bottom: 10, left: 10, fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 10, background: "rgba(45,90,27,0.85)", border: "1px solid rgba(61,122,37,0.6)", color: "white" }}>{post.species}</span>}
            </div>
          )}
          {post.caption && (
            <div style={{ padding: "10px 16px 6px" }}>
              <p style={{ color: "#b8ccb8", fontSize: 13, lineHeight: 1.55, margin: 0 }}>
                <span style={{ fontWeight: 700, color: "white" }}>{capName(post.username)}</span> {post.caption}
              </p>
            </div>
          )}
          <div style={{ padding: "8px 14px 14px", display: "flex", alignItems: "center", gap: 14 }}>
            <button onClick={(e) => { toggleLike(); const svg = e.currentTarget.querySelector("svg"); svg.classList.remove("like-pop"); void svg.offsetWidth; svg.classList.add("like-pop"); }} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, color: isLiked ? "#f43f5e" : "#6a8a6a", padding: "4px 0", fontSize: 13, fontWeight: 600 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill={isLiked ? "#f43f5e" : "none"} stroke={isLiked ? "#f43f5e" : "currentColor"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
              {likeCount > 0 && likeCount}
            </button>
            <span style={{ color: "#6a8a6a", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              {commentCount > 0 && commentCount}
            </span>
          </div>
        </div>
        <div style={{ marginTop: 12, borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)", background: "#0e1510" }}>
          <PostComments postId={postId} postOwnerId={post.user_id} user={user} openSignIn={openSignIn} onCommentAdded={(delta = 1) => setCommentCount(c => c + delta)} onViewUser={onViewUser} />
        </div>
      </div>
    </div>,
    document.body
  );
}

function PostComments({ postId, postOwnerId, user, openSignIn, onCommentAdded, onViewUser }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [avatars, setAvatars] = useState({});
  const [commentLikes, setCommentLikes] = useState({});
  const [replyTo, setReplyTo] = useState(null); // { id, username }
  const [expandedReplies, setExpandedReplies] = useState(new Set());
  const inputRef = useRef(null);

  const loadComments = async () => {
    setLoading(true);
    const { data } = await supabase.from("comments").select("*").eq("post_id", postId).order("created_at", { ascending: true });
    setComments(data || []);
    if (data?.length) {
      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, avatar_url").in("user_id", userIds);
      const avatarMap = {};
      (profiles || []).forEach(p => { avatarMap[p.user_id] = p.avatar_url; });
      setAvatars(avatarMap);
      const { data: likes } = await supabase.from("comment_likes").select("comment_id, user_id").in("comment_id", data.map(c => c.id));
      const likeMap = {};
      (likes || []).forEach(l => {
        if (!likeMap[l.comment_id]) likeMap[l.comment_id] = [];
        likeMap[l.comment_id].push(l.user_id);
      });
      setCommentLikes(likeMap);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadComments();
    if (user?.id) {
      supabase.from("profiles").select("avatar_url").eq("user_id", user.id).single().then(({ data }) => {
        if (data?.avatar_url) setAvatars(prev => ({ ...prev, [user.id]: data.avatar_url }));
      });
    }
  }, [postId]);

  const submit = async () => {
    if (!text.trim()) return;
    if (!user) { openSignIn(); return; }
    setSubmitting(true);
    await supabase.from("comments").insert({
      post_id: postId,
      user_id: user.id,
      username: user.username || user.firstName || "Hunter",
      content: text.trim(),
      parent_id: replyTo?.id || null,
    });
    if (postOwnerId && postOwnerId !== user.id) {
      fetch("https://wildai-server.onrender.com/push/comment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ post_owner_id: postOwnerId, commenter_username: user.username || user.firstName || "Someone", comment: text.trim() }) }).catch(() => { });
    }
    if (replyTo?.id) setExpandedReplies(prev => new Set([...prev, replyTo.id]));
    setText("");
    setReplyTo(null);
    await loadComments();
    onCommentAdded?.();
    setSubmitting(false);
  };

  const deleteComment = async (id) => {
    await supabase.from("comments").delete().eq("id", id);
    setComments(prev => prev.filter(c => c.id !== id));
    onCommentAdded?.(-1);
  };

  const toggleCommentLike = async (commentId) => {
    if (!user) { openSignIn(); return; }
    const liked = commentLikes[commentId]?.includes(user.id);
    if (liked) {
      await supabase.from("comment_likes").delete().eq("comment_id", commentId).eq("user_id", user.id);
      setCommentLikes(prev => ({ ...prev, [commentId]: (prev[commentId] || []).filter(id => id !== user.id) }));
    } else {
      await supabase.from("comment_likes").insert({ comment_id: commentId, user_id: user.id });
      setCommentLikes(prev => ({ ...prev, [commentId]: [...(prev[commentId] || []), user.id] }));
    }
  };

  const timeAgo = (date) => {
    const diff = (Date.now() - new Date(date)) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  const topLevel = comments.filter(c => !c.parent_id);
  const replies = comments.filter(c => c.parent_id);
  const repliesFor = (id) => replies.filter(r => r.parent_id === id);

  const CommentRow = ({ c, isReply = false }) => {
    const liked = commentLikes[c.id]?.includes(user?.id);
    const likeCount = commentLikes[c.id]?.length || 0;
    const replyList = repliesFor(c.id);
    const expanded = expandedReplies.has(c.id);
    return (
      <div style={{ display: "flex", gap: 8, marginBottom: isReply ? 6 : 10, alignItems: "flex-start", paddingLeft: isReply ? 32 : 0 }}>
        <div style={{ width: isReply ? 22 : 28, height: isReply ? 22 : 28, borderRadius: "50%", background: "linear-gradient(135deg, #1e4010, #0f2408)", flexShrink: 0, overflow: "hidden", boxShadow: "0 0 0 1.5px #3d7a25" }}>
          {avatars[c.user_id] ? <img src={avatars[c.user_id]} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--green)", fontWeight: 700, fontSize: isReply ? 9 : 11 }}>{(c.username || "H")[0].toUpperCase()}</div>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ padding: "2px 0", textAlign: "left" }}>
            <span onClick={() => onViewUser?.(c.user_id)} style={{ color: "white", fontWeight: 700, fontSize: 13, cursor: onViewUser ? "pointer" : "default" }}>{capName(c.username || "Hunter")}</span>
            <span style={{ color: "rgba(238,245,232,0.55)", fontSize: 13, lineHeight: 1.5 }}>&nbsp;&nbsp;{c.content}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4, paddingLeft: 2 }}>
            <span style={{ color: "rgba(238,245,232,0.3)", fontSize: 10 }}>{timeAgo(c.created_at)}</span>
            {!isReply && <button onClick={() => { setReplyTo({ id: c.id, username: c.username }); setText(`@${c.username} `); inputRef.current?.focus(); }} style={{ background: "none", border: "none", color: "rgba(238,245,232,0.5)", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)", padding: 0, letterSpacing: "0.02em" }}>Reply</button>}
            <button onClick={() => toggleCommentLike(c.id)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 3, color: liked ? "#f43f5e" : "rgba(238,245,232,0.3)", fontSize: 10, fontFamily: "var(--font-body)", padding: 0 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill={liked ? "#f43f5e" : "none"} stroke={liked ? "#f43f5e" : "currentColor"} strokeWidth="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
              {likeCount > 0 && <span style={{ fontWeight: 600 }}>{likeCount}</span>}
            </button>
            {(user?.id === c.user_id || user?.id === postOwnerId) && <button onClick={() => deleteComment(c.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,100,100,0.3)", fontSize: 10, padding: 0, fontFamily: "var(--font-body)" }}>Delete</button>}
          </div>
          {!isReply && replyList.length > 0 && (
            <button onClick={() => setExpandedReplies(prev => { const n = new Set(prev); n.has(c.id) ? n.delete(c.id) : n.add(c.id); return n; })} style={{ background: "none", border: "none", color: "var(--green)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)", padding: "4px 0 2px 2px", display: "flex", alignItems: "center", gap: 4 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points={expanded ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} /></svg>
              {expanded ? "Hide" : `View ${replyList.length} repl${replyList.length === 1 ? "y" : "ies"}`}
            </button>
          )}
          {!isReply && expanded && replyList.map(r => <CommentRow key={r.id} c={r} isReply />)}
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: "14px 16px 4px", background: "rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", gap: 4 }}>
      {loading && <div style={{ color: "var(--text3)", fontSize: 12, paddingBottom: 8 }} className="pulse">Loading...</div>}
      {topLevel.map(c => <CommentRow key={c.id} c={c} />)}
      {topLevel.length === 0 && !loading && <div style={{ color: "var(--text3)", fontSize: 12, marginBottom: 12 }}>No comments yet</div>}
      {replyTo && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 8px", background: "var(--green-dim)", borderRadius: 8, marginBottom: 6 }}>
          <span style={{ color: "var(--green)", fontSize: 11 }}>Replying to {capName(replyTo.username)}</span>
          <button onClick={() => { setReplyTo(null); setText(""); }} style={{ background: "none", border: "none", color: "var(--text3)", fontSize: 12, cursor: "pointer", marginLeft: "auto" }}>✕</button>
        </div>
      )}
      <div style={{ display: "flex", gap: 8, alignItems: "center", paddingBottom: 12, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #1e4010, #0f2408)", flexShrink: 0, overflow: "hidden", boxShadow: "0 0 0 1.5px #3d7a25", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--green)", fontWeight: 700, fontSize: 11 }}>
          {avatars[user?.id] ? <img src={avatars[user?.id]} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : user?.imageUrl ? <img src={user.imageUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (user?.username || user?.firstName || "?")[0].toUpperCase()}
        </div>
        <input
          ref={inputRef}
          placeholder={replyTo ? `Reply to ${capName(replyTo.username)}...` : "Add a comment..."}
          value={text}
          onChange={e => setText(e.target.value.slice(0, 300))}
          onKeyDown={e => { if (e.key === "Enter") submit(); }}
          style={{ flex: 1, padding: "7px 12px", borderRadius: 20, fontSize: 13, background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)" }}
        />
        <button onClick={submit} disabled={!text.trim() || submitting} style={{ background: "none", border: "none", cursor: "pointer", color: text.trim() ? "var(--green)" : "var(--text3)", padding: "4px", transition: "color 0.15s" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
        </button>
      </div>
    </div>
  );
}

// ─── HARVEST LOG TAB ──────────────────────────────────────────────────────────
function HarvestLogTab({ user, openSignIn, isPro }) {
  const [entries, setEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [logFilter, setLogFilter] = useState("all");
  const [logSort, setLogSort] = useState("newest");
  const [form, setForm] = useState({ type: "hunting", species: "", date: "", location: "", state: "", size: "", weight: "", notes: "", photo: "" });
  const [submittedIds, setSubmittedIds] = useState(new Set());
  const [submittingTrophy, setSubmittingTrophy] = useState(null);

  const loadEntries = async () => {
    if (!user) { setLoadingEntries(false); return; }
    setLoadingEntries(true);
    const { data } = await supabase.from("harvest_logs").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setEntries(data || []);
    setLoadingEntries(false);
  };

  useEffect(() => { loadEntries(); }, [user]);

  const save = async () => {
    if (!form.species || !form.date || !user) return;
    let photoUrl = form.photo;
    if (form.photoFile) {
      const fileName = `${user.id}-${Date.now()}-${form.photoFile.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
      const strippedPhoto = await stripExif(form.photoFile);
      const { data } = await supabase.storage.from("post-photos").upload(fileName, strippedPhoto, { contentType: "image/jpeg" });
      if (data) {
        const { data: urlData } = supabase.storage.from("post-photos").getPublicUrl(fileName);
        photoUrl = urlData.publicUrl;
      }
    }
    await supabase.from("harvest_logs").insert({
      user_id: user.id,
      type: form.type,
      species: form.species,
      date: form.date,
      location: form.location,
      state: form.state,
      size: form.size,
      weight: form.weight,
      notes: form.notes,
      photo: photoUrl,
    });
    setForm({ type: "hunting", species: "", date: "", location: "", state: "", size: "", weight: "", notes: "", photo: "", photoFile: null });
    setShowForm(false);
    loadEntries();
  };

  const remove = async (id) => {
    await supabase.from("harvest_logs").delete().eq("id", id);
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const submitToTrophyBoard = async (e) => {
    if (!user || !e.photo) return;
    setSubmittingTrophy(e.id);
    await supabase.from("trophy_board").insert({
      user_id: user.id,
      username: user.username || user.firstName || "Hunter",
      species: e.species,
      weight: e.weight,
      size: e.size,
      location: e.location,
      state: e.state || "",
      date: e.date,
      photo: e.photo,
      notes: e.notes,
    });
    setSubmittedIds(prev => new Set([...prev, e.id]));
    setSubmittingTrophy(null);
  };

  useEffect(() => {
    const loadSubmitted = async () => {
      if (!user) return;
      const { data: trophies } = await supabase.from("trophy_board").select("species, date").eq("user_id", user.id);
      if (trophies && entries.length) {
        const submitted = new Set(entries.filter(e => trophies.some(t => t.species === e.species && t.date === e.date)).map(e => e.id));
        setSubmittedIds(submitted);
      }
    };
    loadSubmitted();
  }, [user]);

  if (!isPro) return (
    <div className="card" style={{ padding: 40, textAlign: "center" }}>
      <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Harvest Log is Pro</div>
      <div style={{ color: "var(--text2)", fontSize: 14, marginBottom: 20 }}>Track every harvest and catch. Upgrade to Pro to unlock.</div>
      <button onClick={openSignIn} className="btn-gold" style={{ padding: "12px 28px", fontSize: 14, borderRadius: "var(--radius-sm)" }}>Upgrade to Pro →</button>
    </div>
  );
  if (!user) return (
    <div className="card" style={{ padding: 40, textAlign: "center" }}>
      <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Sign In to Use Harvest Log</div>
      <div style={{ color: "var(--text2)", fontSize: 14, marginBottom: 20 }}>Your entries sync across all your devices.</div>
      <button onClick={openSignIn} className="btn-primary" style={{ padding: "12px 28px", fontSize: 14 }}>Sign In →</button>
    </div>
  );

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 18, fontFamily: "var(--font-display)" }}>Harvest Log</div>
          <div style={{ color: "var(--text3)", fontSize: 12, marginTop: 2 }}>{entries.length} entries</div>
        </div>
        <button onClick={() => setShowForm(s => !s)} className="btn-primary" style={{ padding: "9px 18px", fontSize: 13 }}>
          {showForm ? "Cancel" : "+ Log Entry"}
        </button>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {["all", "hunting", "fishing"].map(f => (
          <button key={f} onClick={() => setLogFilter(f)} className={`nav-tab ${logFilter === f ? "active" : "inactive"}`} style={{ padding: "6px 14px", fontSize: 12 }}>
            {f === "all" ? "All" : f === "hunting" ? "🎯 Hunting" : "🎣 Fishing"}
          </button>
        ))}
        <button onClick={() => setLogSort(s => s === "newest" ? "oldest" : "newest")} className="btn-ghost" style={{ padding: "6px 14px", fontSize: 12, marginLeft: "auto" }}>
          {logSort === "newest" ? "↓ Newest" : "↑ Oldest"}
        </button>
      </div>

      {showForm && (
        <div className="card fade-in" style={{ padding: 20 }}>
          <div style={{ color: "var(--text3)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 14 }}>NEW ENTRY</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <div style={{ color: "var(--text3)", fontSize: 11, marginBottom: 5 }}>TYPE</div>
              <div style={{ display: "flex", gap: 6 }}>
                {["hunting", "fishing"].map(t => (
                  <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))} className={`nav-tab ${form.type === t ? "active" : "inactive"}`} style={{ padding: "5px 12px", fontSize: 11, flex: 1 }}>
                    {t === "hunting" ? "🎯" : "🎣"} {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ color: "var(--text3)", fontSize: 11, marginBottom: 5 }}>DATE *</div>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={{ width: "100%", padding: "7px 10px", borderRadius: "var(--radius-sm)", fontSize: 13 }} />
            </div>
            <div>
              <div style={{ color: "var(--text3)", fontSize: 11, marginBottom: 5 }}>SPECIES *</div>
              <input placeholder="e.g. Whitetail Deer" value={form.species} onChange={e => setForm(f => ({ ...f, species: e.target.value }))} style={{ width: "100%", padding: "7px 10px", borderRadius: "var(--radius-sm)", fontSize: 13 }} />
            </div>
            <div>
              <div style={{ color: "var(--text3)", fontSize: 11, marginBottom: 5 }}>LOCATION</div>
              <input placeholder="e.g. Flathead NF" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} style={{ width: "100%", padding: "7px 10px", borderRadius: "var(--radius-sm)", fontSize: 13 }} />
            </div>
            <div>
              <div style={{ color: "var(--text3)", fontSize: 11, marginBottom: 5 }}>STATE</div>
              <select value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} style={{ width: "100%", padding: "7px 10px", borderRadius: "var(--radius-sm)", fontSize: 13 }}>
                <option value="">Select state...</option>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <div style={{ color: "var(--text3)", fontSize: 11, marginBottom: 5 }}>{form.type === "fishing" ? "LENGTH (in)" : "ANTLERS/SCORE"}</div>
              <input placeholder={form.type === "fishing" ? "e.g. 18" : "e.g. 8-point"} value={form.size} onChange={e => setForm(f => ({ ...f, size: e.target.value }))} style={{ width: "100%", padding: "7px 10px", borderRadius: "var(--radius-sm)", fontSize: 13 }} />
            </div>
            <div>
              <div style={{ color: "var(--text3)", fontSize: 11, marginBottom: 5 }}>WEIGHT (lbs)</div>
              <input placeholder="e.g. 185" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} style={{ width: "100%", padding: "7px 10px", borderRadius: "var(--radius-sm)", fontSize: 13 }} />
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ color: "var(--text3)", fontSize: 11, marginBottom: 5 }}>PHOTO</div>
            <input type="file" accept="image/*" onChange={e => {
              const file = e.target.files[0];
              if (!file) return;
              setForm(f => ({ ...f, photoFile: file, photo: URL.createObjectURL(file) }));
            }} style={{ width: "100%", padding: "7px 10px", borderRadius: "var(--radius-sm)", fontSize: 13, background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", color: "var(--text2)" }} />
            {form.photo && <img src={form.photo} style={{ marginTop: 8, width: "100%", borderRadius: "var(--radius-sm)", maxHeight: 200, objectFit: "cover" }} />}
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: "var(--text3)", fontSize: 11, marginBottom: 5 }}>NOTES</div>
            <textarea placeholder="Weather conditions, tactics used, memorable details..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ width: "100%", padding: "7px 10px", borderRadius: "var(--radius-sm)", fontSize: 13, minHeight: 70, resize: "vertical", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", color: "var(--text)", fontFamily: "var(--font-body)" }} />
          </div>
          <div style={{ padding: "10px 14px", background: "rgba(212,147,10,0.08)", border: "1px solid rgba(212,147,10,0.2)", borderRadius: "var(--radius-sm)", marginBottom: 10 }}>
            <p style={{ color: "var(--amber)", fontSize: 12, margin: 0, lineHeight: 1.6 }}>🏆 To submit to the Trophy Board, fill out all fields and include a photo.</p>
          </div>
          <button onClick={save} disabled={!form.species || !form.date} className="btn-primary" style={{ width: "100%", padding: "10px", fontSize: 14, opacity: (!form.species || !form.date) ? 0.5 : 1 }}>
            Save Entry
          </button>
        </div>
      )}

      {loadingEntries && <div style={{ textAlign: "center", padding: 40, color: "var(--text3)" }} className="pulse">Loading your log...</div>}

      {!loadingEntries && entries.length === 0 && !showForm && (
        <div style={{ textAlign: "center", padding: 48, color: "var(--text3)", fontSize: 14 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📓</div>
          <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Start Your Harvest Log</div>
          Log your catches and harvests to track your season
        </div>
      )}

      {[...entries]
        .filter(e => logFilter === "all" || e.type === logFilter)
        .sort((a, b) => logSort === "newest" ? new Date(b.created_at) - new Date(a.created_at) : new Date(a.created_at) - new Date(b.created_at))
        .map(e => (
          <div key={e.id} className="card fade-in" style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 18 }}>{e.type === "hunting" ? "🎯" : "🎣"}</span>
                  <span style={{ color: "var(--text)", fontWeight: 700, fontSize: 15 }}>{e.species}</span>
                  <span style={{ color: "var(--text3)", fontSize: 12 }}>{new Date(e.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: e.notes ? 8 : 0 }}>
                  {e.location && <span style={{ color: "var(--text2)", fontSize: 12 }}>📍 {e.location}</span>}
                  {e.weight && <span style={{ color: "var(--text2)", fontSize: 12 }}>⚖️ {e.weight} lbs</span>}
                  {e.size && <span style={{ color: "var(--text2)", fontSize: 12 }}>📏 {e.size}</span>}
                </div>
                {e.notes && <div style={{ color: "var(--text3)", fontSize: 12, lineHeight: 1.6 }}>{e.notes}</div>}
                {e.photo && <img src={e.photo} style={{ marginTop: 10, width: "100%", borderRadius: "var(--radius-sm)", maxHeight: 380, objectFit: "contain", background: "rgba(0,0,0,0.3)" }} />}
                {e.photo && (
                  <button onClick={() => submitToTrophyBoard(e)} disabled={submittedIds.has(e.id) || submittingTrophy === e.id} style={{ marginTop: 10, background: submittedIds.has(e.id) ? "var(--green-dim)" : "linear-gradient(135deg,rgba(212,147,10,0.15),rgba(180,120,5,0.1))", border: `1px solid ${submittedIds.has(e.id) ? "var(--border-accent)" : "rgba(212,147,10,0.3)"}`, color: submittedIds.has(e.id) ? "var(--green)" : "var(--amber)", padding: "7px 16px", borderRadius: "var(--radius-sm)", fontSize: 12, fontWeight: 600, cursor: submittedIds.has(e.id) ? "default" : "pointer", fontFamily: "var(--font-body)" }}>
                    {submittedIds.has(e.id) ? "✓ On Trophy Board" : submittingTrophy === e.id ? "Submitting..." : "🏆 Submit to Trophy Board"}
                  </button>
                )}
              </div>
              <button onClick={() => remove(e.id)} className="btn-ghost" style={{ padding: "4px 10px", fontSize: 12, flexShrink: 0, color: "rgba(255,100,100,0.7)" }}>✕</button>
            </div>
          </div>
        ))}
    </div>
  );
}

// ─── TROPHY BOARD ─────────────────────────────────────────────────────────────
function TrophyBoardTab({ user, openSignIn, selectedState }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [votedIds, setVotedIds] = useState(new Set());
  const [voteCounts, setVoteCounts] = useState({});
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const loadEntries = async () => {
    setLoading(true);
    let query = supabase.from("trophy_board").select("*").order("created_at", { ascending: false });
    if (filter !== "all") query = query.eq("state", filter);
    if (typeFilter !== "all") query = query.eq("species", typeFilter);
    const { data } = await query.limit(50);
    setEntries(data || []);
    if (data?.length) {
      const ids = data.map(e => e.id);
      const { data: voteData } = await supabase.from("trophy_votes").select("trophy_id, user_id").in("trophy_id", ids);
      if (voteData) {
        const counts = {};
        ids.forEach(id => counts[id] = 0);
        voteData.forEach(v => { counts[v.trophy_id] = (counts[v.trophy_id] || 0) + 1; });
        setVoteCounts(counts);
        if (user) setVotedIds(new Set(voteData.filter(v => v.user_id === user.id).map(v => v.trophy_id)));
      }
    }
    setLoading(false);
  };

  useEffect(() => { loadEntries(); }, [filter, typeFilter]);

  const toggleVote = async (id) => {
    if (!user) { openSignIn(); return; }
    if (votedIds.has(id)) {
      await supabase.from("trophy_votes").delete().eq("trophy_id", id).eq("user_id", user.id);
      setVotedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
      setVoteCounts(prev => ({ ...prev, [id]: Math.max(0, (prev[id] || 1) - 1) }));
    } else {
      await supabase.from("trophy_votes").insert({ trophy_id: id, user_id: user.id });
      setVotedIds(prev => new Set([...prev, id]));
      setVoteCounts(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    }
  };

  const deleteEntry = async (id) => {
    await supabase.from("trophy_board").delete().eq("id", id);
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const sortedEntries = [...entries].sort((a, b) => (voteCounts[b.id] || 0) - (voteCounts[a.id] || 0));

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ background: "linear-gradient(135deg, rgba(212,147,10,0.12), rgba(180,120,5,0.06))", border: "1px solid rgba(212,147,10,0.2)", borderRadius: "var(--radius)", padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 24 }}>🏆</span>
          <span style={{ color: "var(--text)", fontWeight: 700, fontSize: 20, fontFamily: "var(--font-display)" }}>Trophy Board</span>
        </div>
        <div style={{ color: "var(--text3)", fontSize: 12, marginBottom: 14 }}>Community-verified harvests — upvote to confirm legit catches</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button onClick={() => setFilter("all")} className={`nav-tab ${filter === "all" ? "active" : "inactive"}`} style={{ padding: "4px 12px", fontSize: 11 }}>All States</button>
          {selectedState && <button onClick={() => setFilter(selectedState)} className={`nav-tab ${filter === selectedState ? "active" : "inactive"}`} style={{ padding: "4px 12px", fontSize: 11 }}>📍 {selectedState}</button>}
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            <button onClick={() => setTypeFilter("all")} className={`nav-tab ${typeFilter === "all" ? "active" : "inactive"}`} style={{ padding: "4px 12px", fontSize: 11 }}>All</button>
            <button onClick={() => setTypeFilter("hunting")} className={`nav-tab ${typeFilter === "hunting" ? "active" : "inactive"}`} style={{ padding: "4px 12px", fontSize: 11 }}>🎯</button>
            <button onClick={() => setTypeFilter("fishing")} className={`nav-tab ${typeFilter === "fishing" ? "active" : "inactive"}`} style={{ padding: "4px 12px", fontSize: 11 }}>🎣</button>
          </div>
        </div>
      </div>

      {loading && <div style={{ textAlign: "center", padding: 40, color: "var(--text3)" }} className="pulse">Loading trophy board...</div>}

      {!loading && entries.length === 0 && (
        <div style={{ textAlign: "center", padding: 48, color: "var(--text3)", fontSize: 14 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>
          <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 16, marginBottom: 8 }}>No trophies yet</div>
          <div style={{ fontSize: 13 }}>Submit a harvest from your Harvest Log to get on the board!</div>
        </div>
      )}

      {sortedEntries.map((e, i) => {
        const votes = voteCounts[e.id] || 0;
        const isVoted = votedIds.has(e.id);
        const isOwn = user?.id === e.user_id;
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
        return (
          <div key={e.id} className="card fade-in" style={{ padding: 0, overflow: "hidden", border: i < 3 ? "1px solid rgba(212,147,10,0.25)" : "1px solid var(--border)" }}>
            {i < 3 && <div style={{ background: "linear-gradient(90deg, rgba(212,147,10,0.12), transparent)", padding: "5px 14px", fontSize: 11, color: "var(--amber)", fontWeight: 700, letterSpacing: "0.05em" }}>{medal} #{i + 1} MOST VERIFIED</div>}
            {e.photo && <img src={e.photo} style={{ width: "100%", maxHeight: 420, objectFit: "contain", background: "rgba(0,0,0,0.3)" }} />}
            <div style={{ padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <span style={{ color: "var(--text)", fontWeight: 700, fontSize: 15 }}>{e.species}</span>
                  <span style={{ color: "var(--text3)", fontSize: 12, marginLeft: 8 }}>{capName(e.username)}</span>
                  {e.state && <span style={{ color: "var(--text3)", fontSize: 12, marginLeft: 8 }}>· {e.state}</span>}
                </div>
                {isOwn && <button onClick={() => deleteEntry(e.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,100,100,0.5)", fontSize: 12, padding: 0, fontFamily: "var(--font-body)" }}>Delete</button>}
              </div>
              <div style={{ display: "flex", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
                {e.weight && <span style={{ color: "var(--text2)", fontSize: 12 }}>⚖️ {e.weight} lbs</span>}
                {e.size && <span style={{ color: "var(--text2)", fontSize: 12 }}>📏 {e.size}</span>}
                {e.location && <span style={{ color: "var(--text2)", fontSize: 12 }}>📍 {e.location}</span>}
                {e.date && <span style={{ color: "var(--text3)", fontSize: 12 }}>{new Date(e.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>}
              </div>
              {e.notes && <p style={{ color: "var(--text2)", fontSize: 13, lineHeight: 1.6, margin: "0 0 10px" }}>{e.notes}</p>}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {!isOwn ? (
                  <>
                    <button onClick={() => toggleVote(e.id)} style={{ display: "flex", alignItems: "center", gap: 6, background: isVoted ? "rgba(120,180,80,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${isVoted ? "var(--border-accent)" : "var(--border)"}`, borderRadius: "var(--radius-sm)", padding: "6px 14px", cursor: "pointer", color: isVoted ? "var(--green)" : "var(--text3)", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, transition: "all 0.15s" }}>
                      👍 {isVoted ? "Vouched" : "Vouch"} {votes > 0 && <span style={{ background: isVoted ? "var(--green-dim)" : "rgba(255,255,255,0.06)", padding: "1px 8px", borderRadius: 20, fontSize: 11 }}>{votes}</span>}
                    </button>
                    <button onClick={async () => {
                      if (!user) { openSignIn(); return; }
                      await supabase.from("reports").insert({ post_id: e.id, user_id: user.id, reason: "trophy_fake" });
                      toast("Thanks for reporting — we'll review this entry.", "success");
                    }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", fontSize: 12, padding: "4px 8px", fontFamily: "var(--font-body)" }}>🚩</button>
                  </>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text3)", fontSize: 12 }}>
                    👍 {votes} {votes === 1 ? "vouch" : "vouches"}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── BALLISTICS TAB ───────────────────────────────────────────────────────────
function BallisticsTab() {
  const [form, setForm] = useState({ label: "", weight: "", velocity: "", bc: "", zero: "100", scopeHeight: "1.5", wind: "" });
  const resetResults = () => setResults(null);
  const [results, setResults] = useState(null);

  const calculate = () => {
    const mv = parseFloat(form.velocity);
    const bc = parseFloat(form.bc);
    const weight = parseFloat(form.weight);
    const zero = parseInt(form.zero);
    const sh = parseFloat(form.scopeHeight) / 12;
    const wind = parseFloat(form.wind) || 0;
    if (!mv || !bc || !weight) return;

    const g = 32.174, dt = 0.001;

    // Ingalls ballistic table — standard G1 reference (Hatcher's Notebook)
    const ingallsF = [
      [800, 1.679], [900, 1.746], [1000, 1.812], [1100, 1.887],
      [1200, 2.388], [1300, 2.945], [1400, 3.175], [1500, 3.284],
      [1600, 3.366], [1700, 3.415], [1800, 3.450], [1900, 3.468],
      [2000, 3.478], [2100, 3.486], [2200, 3.493], [2300, 3.489],
      [2400, 3.474], [2500, 3.450], [2600, 3.418], [2700, 3.382],
      [2800, 3.341], [2900, 3.298], [3000, 3.254], [3100, 3.213],
      [3200, 3.172], [3300, 3.134], [3400, 3.096], [3500, 3.061],
    ];
    const getF = (v) => {
      v = Math.max(800, Math.min(3500, v));
      for (let i = 0; i < ingallsF.length - 1; i++) {
        if (v >= ingallsF[i][0] && v <= ingallsF[i + 1][0]) {
          const t = (v - ingallsF[i][0]) / (ingallsF[i + 1][0] - ingallsF[i][0]);
          return ingallsF[i][1] + t * (ingallsF[i + 1][1] - ingallsF[i][1]);
        }
      }
      return ingallsF[ingallsF.length - 1][1];
    };

    const solve = (targetYards) => {
      const targetFt = targetYards * 3;
      let vx = mv, vy = 0, x = 0, y = 0, t = 0;
      while (x < targetFt && t < 10) {
        const v = Math.sqrt(vx * vx + vy * vy);
        const decel = (getF(v) * v * v) / (bc * 36000);
        vx += -(decel * vx / v) * dt;
        vy += (-g - (decel * vy / v)) * dt;
        x += vx * dt; y += vy * dt; t += dt;
      }
      return { y, v: Math.sqrt(vx * vx + vy * vy), t };
    };

    const rawRows = [];
    for (let yd = 0; yd <= 500; yd += 100) {
      const { y, v, t } = solve(yd);
      const energy = (weight * v * v) / 450400;
      const wind_fps = wind * 1.467;
      const tof_vac = (yd * 3) / mv;
      const drift = Math.round(wind_fps * (t - tof_vac) * 12 * 10) / 10;
      rawRows.push({ yd, drop_in_raw: -y * 12, vr: Math.round(v), energy: Math.round(energy), drift });
    }

    const zeroRow = rawRows.find(r => r.yd === zero) || rawRows[1];
    const zeroDropIn = zeroRow.drop_in_raw - (sh * 12);
    const corrected = rawRows.map(r => ({
      ...r,
      drop: Math.round((r.drop_in_raw - sh * 12 - zeroDropIn) * 10) / 10,
    }));
    setResults(corrected);
  };

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="card" style={{ padding: "20px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 24 }}>🎯</span>
          <div>
            <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 16, fontFamily: "var(--font-display)" }}>Ballistics Calculator</div>
            <div style={{ color: "var(--text3)", fontSize: 12 }}>Bullet drop & wind drift at range</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ color: "var(--text3)", fontSize: 11, marginBottom: 5 }}>LOAD NAME (optional)</div>
            <input placeholder=".308 Win 168gr Federal" value={form.label} onChange={e => { setForm(f => ({ ...f, label: e.target.value })); resetResults(); }} style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", fontSize: 13 }} />
          </div>
          <div>
            <div style={{ color: "var(--text3)", fontSize: 11, marginBottom: 5 }}>BULLET WEIGHT (gr)</div>
            <input type="number" placeholder="168" value={form.weight} onChange={e => { setForm(f => ({ ...f, weight: e.target.value })); resetResults(); }} style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", fontSize: 13 }} />
          </div>
          <div>
            <div style={{ color: "var(--text3)", fontSize: 11, marginBottom: 5 }}>MUZZLE VELOCITY (fps)</div>
            <input type="number" placeholder="2650" value={form.velocity} onChange={e => { setForm(f => ({ ...f, velocity: e.target.value })); resetResults(); }} style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", fontSize: 13 }} />
          </div>
          <div>
            <div style={{ color: "var(--text3)", fontSize: 11, marginBottom: 5 }}>BALLISTIC COEFF (G1)</div>
            <input type="number" placeholder="0.47" value={form.bc} onChange={e => { setForm(f => ({ ...f, bc: e.target.value })); resetResults(); }} style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", fontSize: 13 }} />
          </div>
          <div>
            <div style={{ color: "var(--text3)", fontSize: 11, marginBottom: 5 }}>ZERO DISTANCE (yd)</div>
            <select value={form.zero} onChange={e => { setForm(f => ({ ...f, zero: e.target.value })); resetResults(); }} style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", fontSize: 13 }}>
              <option value="50">50 yards</option>
              <option value="100">100 yards</option>
              <option value="200">200 yards</option>
              <option value="300">300 yards</option>
            </select>
          </div>
          <div>
            <div style={{ color: "var(--text3)", fontSize: 11, marginBottom: 5 }}>WIND SPEED (mph)</div>
            <input type="number" placeholder="10" value={form.wind} onChange={e => { setForm(f => ({ ...f, wind: e.target.value })); resetResults(); }} style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", fontSize: 13 }} />
          </div>
        </div>
        <button onClick={calculate} disabled={!form.weight || !form.velocity || !form.bc} className="btn-primary" style={{ width: "100%", padding: "11px", fontSize: 14, opacity: (!form.weight || !form.velocity || !form.bc) ? 0.5 : 1 }}>
          Calculate Drop Chart
        </button>
      </div>

      {results && (
        <div className="card fade-in" style={{ padding: "20px 24px", overflowX: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            {form.label ? <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 15, fontFamily: "var(--font-display)" }}>{form.label}</div> : <div />}
            <button onClick={() => setResults(null)} style={{ background: "none", border: "none", color: "var(--text3)", fontSize: 18, cursor: "pointer", padding: 0, lineHeight: 1 }}>✕</button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["Range", "Drop", "Velocity", "Energy", form.wind ? "Wind Drift" : null].filter(Boolean).map(h => (
                  <th key={h} style={{ color: "var(--text3)", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textAlign: "center", padding: "6px 8px", borderBottom: "1px solid var(--border)" }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={r.yd} style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                  <td style={{ color: "var(--green)", fontWeight: 700, textAlign: "center", padding: "10px 8px" }}>{r.yd} yd</td>
                  <td style={{ color: r.drop > 0 ? "rgba(255,100,100,0.8)" : r.drop < 0 ? "var(--green)" : "var(--text)", textAlign: "center", padding: "10px 8px", fontWeight: 600 }}>{r.drop > 0 ? "+" : ""}{r.drop}"</td>
                  <td style={{ color: "var(--text2)", textAlign: "center", padding: "10px 8px" }}>{r.vr} fps</td>
                  <td style={{ color: "var(--text2)", textAlign: "center", padding: "10px 8px" }}>{r.energy} ft-lb</td>
                  {form.wind && <td style={{ color: "var(--amber)", textAlign: "center", padding: "10px 8px" }}>{r.drift}"</td>}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 12, padding: "10px 14px", background: "var(--amber-dim)", border: "1px solid rgba(212,147,10,0.2)", borderRadius: "var(--radius-sm)" }}>
            <p style={{ color: "rgba(212,147,10,0.8)", fontSize: 11, margin: 0 }}>⚠️ Simplified G1 model — use as a field reference only. Always confirm with actual range data.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TRIP PLANNER TAB ─────────────────────────────────────────────────────────
function TripPlannerTab({ selectedState, user, isPro, hitLimit, messageCount, setMessageCount, onUpgrade }) {
  const [activityType, setActivityType] = useState("hunting");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("3");
  const [startDate, setStartDate] = useState("");
  const [groupSize, setGroupSize] = useState("2");
  const [experience, setExperience] = useState("intermediate");
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const planRef = useRef(null);

  const generate = async () => {
    if (!description.trim()) return;
    if (hitLimit) return;
    setLoading(true); setError(null); setPlan(null);
    const newCount = messageCount + 1;
    setMessageCount(newCount);
    localStorage.setItem("wildai_message_count", newCount);
    if (user) {
      supabase.from("message_counts").upsert({ user_id: user.id, count: newCount, updated_at: new Date().toISOString() });
    }
    try {
      const prompt = `Create a detailed ${duration}-day ${activityType} trip plan in ${selectedState || "the US"} for a group of ${groupSize} with ${experience} experience level${startDate ? `, starting ${new Date(startDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}` : ""}. Here's what the user has in mind: ${description}.

Include:
## Trip Overview
Brief summary of the trip

## Best Locations
Top 2-3 specific public land spots to target

## Daily Schedule
Day-by-day breakdown of activities, timing, and tactics

## Gear List
Essential gear specific to this trip

## Tactics & Tips
Specific tactics for ${selectedState || "this region"} and this time of year

## Licenses & Tags Required
What licenses and tags are needed in ${selectedState || "this state"}

## What to Expect
Realistic expectations for success, conditions, and experience

Use **bold** for key terms. Be specific and practical.`;

      const res = await fetch("https://wildai-server.onrender.com/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }], system: "You are an expert hunting and fishing trip planner with deep knowledge of public lands, tactics, and regulations across all US states. Give specific, practical, actionable trip plans." })
      });
      const d = await res.json();
      setPlan(d.reply);
    } catch { setError("Couldn't generate trip plan. Try again."); }
    setLoading(false);
  };

  const printPlan = () => {
    const w = window.open("", "_blank");
    w.document.write(`<html><head><title>Ravlin Trip Plan in ${selectedState}</title>
    <style>body{font-family:Georgia,serif;max-width:800px;margin:40px auto;padding:0 20px;color:#111;line-height:1.7}h1{color:#2a5a1a;border-bottom:2px solid #2a5a1a;padding-bottom:10px}h2{color:#2a5a1a;margin-top:28px}h3{color:#555}strong{color:#2a5a1a}p{margin:10px 0}@media print{body{margin:20px}}</style>
    </head><body>
    <h1>🦌 Ravlin Trip Plan</h1>
    <p><strong>${duration}-Day ${activityType} Trip · ${selectedState}${startDate ? ` · Starting ${new Date(startDate + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}` : ""} · Group of ${groupSize} · ${experience} level</strong></p>
    <hr/>
    ${plan.replace(/^## (.*?)$/gm, "<h2>$1</h2>").replace(/^### (.*?)$/gm, "<h3>$1</h3>").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br/>")}
    <hr/><p style="color:#888;font-size:12px">Generated by Ravlin · Always verify regulations with your state wildlife agency</p>
    </body></html>`);
    w.document.close();
    w.print();
  };

  const savePlan = () => {
    const text = `RAVLIN TRIP PLAN\n${duration}-Day ${activityType} Trip · ${selectedState}${startDate ? ` · Starting ${new Date(startDate + "T12:00:00").toLocaleDateString()}` : ""} · Group of ${groupSize} · ${experience} level\n${"=".repeat(60)}\n\n${plan.replace(/\*\*(.*?)\*\*/g, "$1")}`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `Ravlin-${selectedState}-Trip-Plan.txt`;
    a.click(); URL.revokeObjectURL(url);
  };

  if (!isPro) return (
    <div className="card" style={{ padding: 40, textAlign: "center" }}>
      <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Trip Planner is Pro</div>
      <div style={{ color: "var(--text2)", fontSize: 14, marginBottom: 20 }}>Generate AI-powered personalized trip plans. Upgrade to Pro to unlock.</div>
      <button onClick={onUpgrade} className="btn-gold" style={{ padding: "12px 28px", fontSize: 14, borderRadius: "var(--radius-sm)" }}>Upgrade to Pro →</button>
    </div>
  );
  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="card" style={{ padding: "20px 24px" }}>
        <div style={{ color: "var(--text3)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 16 }}>PLAN YOUR TRIP</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <div style={{ color: "var(--text3)", fontSize: 11, marginBottom: 6 }}>ACTIVITY</div>
            <div style={{ display: "flex", gap: 6 }}>
              {["hunting", "fishing"].map(t => (
                <button key={t} onClick={() => setActivityType(t)} className={`nav-tab ${activityType === t ? "active" : "inactive"}`} style={{ padding: "6px 14px", fontSize: 12, flex: 1 }}>
                  {t === "hunting" ? "🎯 Hunting" : "🎣 Fishing"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ color: "var(--text3)", fontSize: 11, marginBottom: 6 }}>DURATION</div>
            <select value={duration} onChange={e => setDuration(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", fontSize: 13 }}>
              {["1", "2", "3", "4", "5", "6", "7"].map(d => <option key={d} value={d}>{d} day{d !== "1" ? "s" : ""}</option>)}
            </select>
          </div>
          <div>
            <div style={{ color: "var(--text3)", fontSize: 11, marginBottom: 6 }}>START DATE</div>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", fontSize: 13 }} />
          </div>
          <div>
            <div style={{ color: "var(--text3)", fontSize: 11, marginBottom: 6 }}>GROUP SIZE</div>
            <select value={groupSize} onChange={e => setGroupSize(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", fontSize: 13 }}>
              {["1", "2", "3", "4", "5", "6", "7", "8"].map(n => <option key={n} value={n}>{n} {n === "1" ? "person" : "people"}</option>)}
            </select>
          </div>
          <div>
            <div style={{ color: "var(--text3)", fontSize: 11, marginBottom: 6 }}>EXPERIENCE</div>
            <select value={experience} onChange={e => setExperience(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", fontSize: 13 }}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="expert">Expert</option>
            </select>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ color: "var(--text3)", fontSize: 11, marginBottom: 6 }}>WHAT ARE YOU PLANNING?</div>
            <textarea placeholder="e.g. Elk hunting in the mountains, fly fishing for trout on a river, duck hunting with my dog..." value={description} onChange={e => setDescription(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", fontSize: 13, minHeight: 70, resize: "vertical", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", color: "var(--text)", fontFamily: "var(--font-body)", boxSizing: "border-box" }} />
          </div>
        </div>
        {!selectedState && <div style={{ color: "var(--amber)", fontSize: 12, marginBottom: 10 }}>⚠️ Go back and select your state for a more accurate plan</div>}
        {hitLimit ? (
          <div style={{ background: "linear-gradient(135deg,rgba(120,180,80,0.08),rgba(90,154,50,0.04))", border: "1px solid var(--border-accent)", borderRadius: "var(--radius)", padding: 20, textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🔒</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--text)", marginBottom: 6 }}>Upgrade to Ravlin Pro</div>
            <div style={{ color: "var(--text2)", fontSize: 13, marginBottom: 14, lineHeight: 1.6 }}>You've used your free interactions. Upgrade for unlimited trip plans and more.</div>
            <button className="btn-primary" style={{ padding: "12px 28px", fontSize: 14 }} onClick={onUpgrade}>Upgrade to Pro →</button>
          </div>
        ) : (
          <button onClick={generate} disabled={!description.trim() || loading} className="btn-primary" style={{ width: "100%", padding: "12px", fontSize: 14, opacity: (!description.trim() || loading) ? 0.5 : 1 }}>
            {loading ? "✨ Generating your trip plan..." : "✨ Generate Trip Plan"}
          </button>
        )}
        {error && <div style={{ color: "var(--amber)", fontSize: 13, marginTop: 10 }}>{error}</div>}
      </div>

      {loading && (
        <div className="card" style={{ padding: 48, textAlign: "center" }}>
          <div style={{ fontSize: 44, marginBottom: 16 }} className="float">🧭</div>
          <div style={{ color: "var(--text2)", fontSize: 14 }} className="pulse">Building your trip plan...</div>
          <div style={{ color: "var(--text3)", fontSize: 12, marginTop: 8 }}>This takes a few seconds</div>
        </div>
      )}

      {plan && !loading && (
        <div className="card fade-in" ref={planRef}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 15 }}>{duration}-Day {activityType} Trip · {selectedState}</div>
              <div style={{ color: "var(--text3)", fontSize: 12, marginTop: 2 }}>Group of {groupSize} · {experience} level</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={savePlan} className="btn-ghost" style={{ padding: "8px 16px", fontSize: 12 }}>💾 Save</button>
              <button onClick={printPlan} className="btn-ghost" style={{ padding: "8px 16px", fontSize: 12 }}>🖨️ Print</button>
            </div>
          </div>
          <div style={{ padding: 24 }}>
            <div className="msg-bubble" style={{ lineHeight: 1.85 }} dangerouslySetInnerHTML={{
              __html: plan
                .replace(/^## (.*?)$/gm, "<h3 style='color:var(--green);margin:20px 0 10px;font-size:15px;font-weight:700;border-bottom:1px solid var(--border);padding-bottom:6px'>$1</h3>")
                .replace(/^### (.*?)$/gm, "<h4 style='color:var(--text);margin:14px 0 6px;font-size:13px;font-weight:700'>$1</h4>")
                .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                .replace(/\n\n/g, "</p><p style='margin-top:12px'>")
                .replace(/\n/g, "<br/>")
            }} />
          </div>
        </div>
      )}

      {!plan && !loading && (
        <div style={{ textAlign: "center", padding: 32, color: "var(--text3)", fontSize: 14 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🧭</div>
          Fill in your trip details above and hit Generate — AI will build you a complete personalized trip plan
        </div>
      )}
    </div>
  );
}

// ─── LICENSES TAB ─────────────────────────────────────────────────────────────
function LicensesTab({ selectedState }) {
  const agency = selectedState ? STATE_WILDLIFE_AGENCIES[selectedState] : null;
  if (!selectedState) return (
    <div className="card" style={{ padding: 40, textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🪪</div>
      <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Select Your State</div>
      <div style={{ color: "var(--text2)", fontSize: 14 }}>Go back home and choose your state to view license options.</div>
    </div>
  );
  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="card" style={{ padding: "20px 24px" }}>
        <div style={{ color: "var(--text3)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 4 }}>STATE WILDLIFE AGENCY</div>
        <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 20, marginBottom: 4 }}>{agency?.name}</div>
        <div style={{ color: "var(--text3)", fontSize: 13 }}>{selectedState}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <a href={agency?.hunting} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
          <div className="card" style={{ padding: "28px 20px", textAlign: "center", cursor: "pointer", borderColor: "rgba(212,147,10,0.3)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
            <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Hunting License</div>
            <div style={{ color: "var(--text2)", fontSize: 13, marginBottom: 16 }}>Tags, permits & stamps</div>
            <div style={{ background: "linear-gradient(135deg,var(--amber),#a06800)", color: "white", padding: "10px 20px", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 600 }}>Buy Now →</div>
          </div>
        </a>
        <a href={agency?.fishing} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
          <div className="card" style={{ padding: "28px 20px", textAlign: "center", cursor: "pointer", borderColor: "rgba(80,140,220,0.3)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎣</div>
            <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Fishing License</div>
            <div style={{ color: "var(--text2)", fontSize: 13, marginBottom: 16 }}>Freshwater & saltwater</div>
            <div style={{ background: "linear-gradient(135deg,#4a90d9,#2060a0)", color: "white", padding: "10px 20px", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 600 }}>Buy Now →</div>
          </div>
        </a>
      </div>
      {false && <div style={{ padding: "16px 20px", background: "var(--green-dim)", border: "1px solid var(--border-accent)", borderRadius: "var(--radius)" }}>
        <p style={{ color: "var(--green)", fontSize: 13, lineHeight: 1.7 }}>💬 Have a specific regulation question? Ask the AI in the Chat tab for more detailed info.</p>
        {STATE_WILDLIFE_AGENCIES[selectedState] && (
          <a href={STATE_WILDLIFE_AGENCIES[selectedState].hunting} target="_blank" rel="noopener noreferrer" style={{ color: "var(--green)", fontSize: 13, fontWeight: 600, display: "inline-block", marginTop: 8 }}>
            Visit {STATE_WILDLIFE_AGENCIES[selectedState].name} for official regulations →
          </a>
        )}
      </div>}
      <div style={{ padding: "16px 20px", background: "var(--amber-dim)", border: "1px solid rgba(212,147,10,0.2)", borderRadius: "var(--radius)" }}>
        <p style={{ color: "rgba(212,147,10,0.9)", fontSize: 13, lineHeight: 1.7 }}>⚠️ License requirements and fees change annually. Always verify current requirements with your state agency.</p>
      </div>
    </div>
  );
}

// ─── REGULATIONS TAB ──────────────────────────────────────────────────────────
const STATE_REGULATIONS = {
  "Alabama": {
    hunting: "Whitetail Deer: archery Oct 15–Feb 10, gun Nov 18–Feb 10. Bag limit 1 buck/day, 3 bucks/season. Turkey: spring Mar 15–Apr 30, 1 bird/day 5/season. Dove: Sep 1–Oct 30. Squirrel: year-round. Hog: year-round on private land.",
    fishing: "Largemouth Bass: 12-inch minimum, 10/day. Crappie: 9-inch minimum, 30/day. Catfish: no minimum, 25/day. Striped Bass: 15-inch minimum. No closed season on most warmwater species.",
    general: "Resident licenses: Hunting $23, Fishing $16, Combo $41. Hunter education required for all first-time hunters. Licenses available at outdooralabama.com."
  },
  "Alaska": {
    hunting: "Moose: Aug 25–Sep 25 archery, Sep 5–25 general varies by unit. Caribou: varies by unit Aug–Mar. Brown/Grizzly Bear: spring Apr–May, fall Sep–Oct. Sitka Blacktail Deer: Aug 1–Dec 31 SE Alaska. Bag limits vary significantly by unit.",
    fishing: "King Salmon: varies by river, typically May–Jul. Silver Salmon: Aug–Oct. Halibut: open May–Nov, federal permit required. Rainbow Trout: year-round most waters. Catch limits vary by drainage.",
    general: "Resident licenses: Hunting $25, Fishing $30, Combo $45. Non-resident fees much higher. Hunter education required. Always check unit-specific regulations at adfg.alaska.gov — rules vary dramatically by area."
  },
  "Arizona": {
    hunting: "Mule Deer: archery Aug 18–Sep 13, rifle Oct 9–18 varies by unit. Elk: archery Aug 21–Sep 6, rifle Oct 9–Nov 1 varies by unit. Antelope: draw tags Aug–Sep. Javelina: archery Jan, rifle Jan–Feb. Most big game requires draw tags.",
    fishing: "Trout: stocked Oct–Apr at lower elevations, year-round high country. Largemouth Bass: year-round, 13-inch minimum on some lakes. Catfish: year-round. Lake Powell walleye excellent.",
    general: "Resident licenses: Hunting $37, Fishing $37, Combo $57. License required age 10+. Hunter education required. Apply for draw tags at azgfd.com by June. OTC elk tags available in some units."
  },
  "Arkansas": {
    hunting: "Whitetail Deer: archery Sep 24–Feb 28, muzzleloader Oct 22–Nov 4, modern gun Nov 12–Dec 5. Turkey: spring Apr 11–May 14, fall Oct 1–Nov 4. Duck: follows federal framework, typically Nov–Jan. Squirrel: May–Feb.",
    fishing: "Largemouth Bass: 12-inch minimum, 10/day. White Bass: no minimum. Trout: White River and Little Red River world-class tailwaters. Catfish: no minimum. Crappie: 9-inch minimum.",
    general: "Resident licenses: Hunting $25, Fishing $16, Combo $35. Lifetime licenses available. Hunter education required. Purchase at agfc.com."
  },
  "California": {
    hunting: "Blacktail/Mule Deer: archery Jul 11–Sep 18, rifle Aug 15–Oct 25 varies by zone. Turkey: spring Mar 28–May 2, fall varies. Pheasant: Nov 7–Dec 27 in game bird areas. Dove: Sep 1–Oct 23.",
    fishing: "Trout: varies by water, most streams open last Sat Apr–Nov 15. Ocean Salmon: varies by zone and run, typically Apr–Oct. Sturgeon: report card required, slot limit 40–60 inches. Bass: year-round.",
    general: "Resident licenses: Hunting $53, Fishing $55. Ocean enhancement stamp required for salmon/steelhead. Report cards for salmon, steelhead, sturgeon, abalone. Hunter education required. Purchase at wildlife.ca.gov."
  },
  "Colorado": {
    hunting: "Elk: archery Aug 31–Sep 28, rifle Oct 12–Nov 8 varies by unit. Mule Deer: archery Aug 31–Sep 28, rifle Oct 12–Nov 8. Antelope: archery Aug 15–Sep 14, rifle Sep 15–Oct 5. Pronghorn draw recommended. OTC elk available in some units.",
    fishing: "Trout: open year-round most waters. Gold Medal rivers (South Platte, Gunnison) catch-and-release or artificial only sections. Pike: year-round. Walleye: 15-inch minimum some waters.",
    general: "Resident licenses: Hunting $31, Fishing $36, Combo $59. Hunter education required. Apply for draw tags at cpw.state.co.us by April 4. Conservation license required with all licenses."
  },
  "Connecticut": {
    hunting: "Whitetail Deer: archery Sep 15–Dec 31, shotgun Nov 18–Dec 10, muzzleloader Dec 11–31. Turkey: spring May 1–31, fall Oct 1–Nov 17. Pheasant: stocked birds Oct–Nov. Bear: no open season.",
    fishing: "Trout: stocked Apr–May, catch-and-keep. Some streams trophy sections. Bass: 12-inch minimum, open year-round. Walleye: 15-inch minimum. Ice fishing popular Jan–Feb.",
    general: "Resident licenses: Hunting $19, Fishing $28, Combo $40. Hunter education required for first-time hunters born after 1975. Purchase at ct.gov/deep."
  },
  "Delaware": {
    hunting: "Whitetail Deer: archery Sep 1–Jan 31, firearm Oct 27–Nov 26 and Dec 9–15. Turkey: spring Apr 20–May 20. Pheasant: stocked birds Nov–Jan. Dove: Sep 1–Oct 15.",
    fishing: "Striped Bass: 28-inch minimum, slot limits apply in some areas. Weakfish: 13-inch minimum. Freshwater Bass: 15-inch minimum. Tidal license covers most fishing.",
    general: "Resident licenses: Hunting $8.50, Freshwater Fishing $8.50, Tidal $8.50, Combo $20. Hunter education required. Purchase at dnrec.delaware.gov."
  },
  "Florida": {
    hunting: "Whitetail Deer: archery Jul 27–Nov 2, gun Nov 2–Jan 19 varies by zone. Turkey: spring Mar 6–Apr 20, fall varies by zone. Hog: year-round on private land, legal on WMAs during deer season. Dove: Sep 1–Oct 26.",
    fishing: "Snook: 28–33 inch slot, closed May–Aug and Dec on Atlantic, closed May–Aug on Gulf. Redfish: 18–27 inch slot, 1/day. Tarpon: catch-and-release mostly, tag required to harvest. Largemouth Bass: 12-inch minimum. Flounder: 12-inch minimum.",
    general: "Resident licenses: Hunting $17, Freshwater $17, Saltwater $17, Combo $33. Hunter education required. Snook and tarpon require separate tags. Purchase at myfwc.com."
  },
  "Georgia": {
    hunting: "Whitetail Deer: archery Sep 9–Oct 13, firearms Oct 14–Jan 14 varies by WMD. Turkey: spring Mar 22–May 15, fall varies by WMD. Dove: Sep 1–Oct 29. Hog: year-round. Bear: limited archery season.",
    fishing: "Largemouth Bass: 12-inch minimum statewide. Striped Bass: 20-inch minimum. Mountain Trout: catch-and-release only in some streams, Apr 1–Oct 31 general. Catfish: no minimum.",
    general: "Resident licenses: Hunting $15, Fishing $15, Combo $25. Hunter education required for hunters born after 1961. Purchase at georgiawildlife.com."
  },
  "Hawaii": {
    hunting: "Axis Deer: year-round on Maui and Lanai. Feral Pig: year-round in most areas. Mouflon Sheep: Lanai and Kahoolawe. Seasons and areas vary by island and division. Public access limited.",
    fishing: "Freshwater fishing license required on Oahu only ($5). No saltwater license required. Largemouth and Smallmouth Bass in reservoirs. Tucunare in some reservoirs. Shore fishing for papio, ulua year-round.",
    general: "Hunting licenses: $10–$20 depending on game. Public hunting areas require separate permits. Check DLNR for specific island regulations at dlnr.hawaii.gov. Very limited public hunting land."
  },
  "Idaho": {
    hunting: "Whitetail/Mule Deer: archery Aug 30–Sep 28, general Oct 10–Nov 20 varies by unit. Elk: archery Aug 30–Sep 28, general Oct 10–Nov 20. Some units OTC, many require draw. Bear: spring and fall seasons. Wolf: open season.",
    fishing: "Steelhead: fall run Sep–Mar on Snake and Clearwater. Spring Chinook: Apr–Jun. Trout: year-round most rivers. Kokanee: great fishing in many reservoirs Aug–Oct.",
    general: "Resident licenses: Hunting $26, Fishing $34, Combo $52. Hunter education required. Apply for controlled hunts at idfg.idaho.gov by June 5. Steelhead tags required separately."
  },
  "Illinois": {
    hunting: "Whitetail Deer: archery Oct 1–Jan 19, firearm Nov 15–17 and Dec 5–8. Turkey: spring Apr 17–May 25, fall Oct 1–Nov 1. Pheasant: Nov 1–Jan 8. Dove: Sep 1–Oct 12.",
    fishing: "Largemouth Bass: 14-inch minimum many waters. Walleye: 15-inch minimum. Catfish: no minimum, plentiful Jun–Aug. Lake Michigan Salmon: great Aug–Oct runs.",
    general: "Resident licenses: Hunting $13, Fishing $15, Combo $25. Hunter education required for hunters born after 1979. Habitat stamp required. Purchase at dnr.illinois.gov."
  },
  "Indiana": {
    hunting: "Whitetail Deer: archery Oct 1–Jan 5, firearm Nov 15–26. Turkey: spring Apr 23–May 11, fall Oct 1–Nov 3. Pheasant: Nov 1–Jan 31 in stocked areas. Dove: Sep 1–Oct 29.",
    fishing: "Largemouth Bass: 12-inch minimum. Walleye: 15-inch minimum. Catfish: excellent May–Aug. Trout: stocked in some streams Mar–May.",
    general: "Resident licenses: Hunting $17, Fishing $17, Combo $25. Hunter education required. Purchase at in.gov/dnr."
  },
  "Iowa": {
    hunting: "Whitetail Deer: archery Oct 1–Dec 5, firearm Nov 30–Dec 10 and Dec 11–19. Turkey: spring Apr 13–May 11, fall Oct 1–Nov 30. Pheasant: Oct 26–Jan 10. Duck: follows federal framework.",
    fishing: "Walleye: 15-inch minimum. Largemouth Bass: 12-inch minimum. Channel Catfish: no minimum, peak Jun–Aug. Trout: stocked spring and fall.",
    general: "Resident licenses: Hunting $26, Fishing $22, Combo $43. Hunter education required for hunters born after 1971. Purchase at iowadnr.gov."
  },
  "Kansas": {
    hunting: "Whitetail Deer: archery Sep 15–Dec 31, firearm Nov 30–Dec 12. Turkey: spring Apr 16–May 31, fall Sep 15–Oct 31. Pheasant: Nov 1–Jan 31, classic rooster hunting. Quail: Nov 1–Jan 31. Dove: Sep 1–Oct 31.",
    fishing: "Walleye: 18-inch minimum on many impoundments. Largemouth Bass: 15-inch minimum. Catfish: excellent year-round. Crappie: 10-inch minimum.",
    general: "Resident licenses: Hunting $28, Fishing $28, Combo $45. Hunter education required. Purchase at ksoutdoors.com."
  },
  "Kentucky": {
    hunting: "Whitetail Deer: archery Sep 1–Jan 16, firearm Nov 9–27. Turkey: spring Apr 13–May 12, fall Oct 1–Nov 6. Squirrel: Aug 17–Feb 28. Dove: Sep 1–Oct 15.",
    fishing: "Largemouth Bass: 12-inch minimum. Smallmouth Bass: excellent in many rivers. Trout: stocked Nov–Apr in tailwaters. Kentucky Lake and Lake Barkley: world-class bass and crappie.",
    general: "Resident licenses: Hunting $26, Fishing $23, Combo $38. Hunter education required for hunters born after 1975. Purchase at fw.ky.gov."
  },
  "Louisiana": {
    hunting: "Whitetail Deer: archery Oct 1–Feb 15, firearm Nov 4–Jan 20 varies by zone. Turkey: spring Mar 22–Apr 30. Duck: follows federal framework, typically Nov–Jan. Hog: year-round. Squirrel: May–Feb.",
    fishing: "Redfish: 16–27 inch slot, 5/day. Speckled Trout: 12-inch minimum, 25/day. Largemouth Bass: 12-inch minimum. Catfish: no minimum, year-round. Flounder: 10-inch minimum.",
    general: "Resident licenses: Hunting $15, Fishing $9, Basic Combo $15. Hunter education required. Purchase at wlf.louisiana.gov."
  },
  "Maine": {
    hunting: "Whitetail Deer: archery Oct 1–30, firearm Nov 1–30. Moose: draw only Sep 30–Oct 14. Turkey: spring May 1–31, fall Oct 1–Nov 8. Bear: Aug 26–Nov 28. Grouse: Sep 15–Dec 31.",
    fishing: "Landlocked Salmon: open year-round in many lakes, 15-inch minimum. Brook Trout: open year-round most waters. Striped Bass: 28-inch minimum. Ice fishing popular Jan–Feb.",
    general: "Resident licenses: Hunting $26, Fishing $27, Combo $43. Hunter education required for first-time hunters. Purchase at maine.gov/ifw."
  },
  "Maryland": {
    hunting: "Whitetail Deer: archery Sep 9–Jan 28, firearm Nov 25–Dec 10. Turkey: spring Apr 20–May 25, fall Oct 20–Nov 18. Dove: Sep 1–Oct 19. Waterfowl: follows federal framework.",
    fishing: "Striped Bass (Rockfish): 19-inch minimum, 2/day in season. Blue Catfish: no limit, invasive species. Crappie: 9-inch minimum. Trout stocked Mar–May. Separate tidal and nontidal licenses.",
    general: "Resident licenses: Hunting $25, Freshwater Fishing $20.50, Tidal Fishing $15. Hunter education required. Purchase at dnr.maryland.gov."
  },
  "Massachusetts": {
    hunting: "Whitetail Deer: archery Oct 5–Nov 25, shotgun Nov 28–Dec 14, primitive firearms Dec 15–31. Turkey: spring May 1–Jun 7, fall Oct 3–Nov 25. Bear: archery only limited season.",
    fishing: "Trout: stocked Apr–May, 8-inch minimum, 5/day. Striped Bass: 28-inch minimum. Bass: 12-inch minimum. Walleye: 15-inch minimum. Cod offshore popular fall.",
    general: "Resident licenses: Hunting $27.50, Fishing $27.50, Combo $40. Hunter education required for first-time hunters. Purchase at mass.gov/masswildlife."
  },
  "Michigan": {
    hunting: "Whitetail Deer: archery Oct 1–Nov 14 and Dec 1–Jan 1, firearm Nov 15–30. Turkey: spring May 1–Jun 8, fall Sep 15–Nov 14. Bear: Sep 9–Oct 26 draw tags. Pheasant: Oct 20–Nov 14 Lower Peninsula.",
    fishing: "Walleye: 15-inch minimum most waters. Salmon: Great Lakes runs Aug–Oct spectacular. Steelhead: spring and fall runs. Pike: 24-inch minimum. Muskie: 42-inch minimum.",
    general: "Resident licenses: Base $11, Deer Combo $40, Fishing $26. Hunter education required. Purchase at michigan.gov/dnr."
  },
  "Minnesota": {
    hunting: "Whitetail Deer: archery Sep 14–Dec 31, firearm Nov 8–24. Bear: Sep 1–Oct 14 draw tags. Turkey: spring Apr 16–May 31, fall Sep 15–Oct 14. Pheasant: Oct 12–Jan 1. Grouse: Sep 14–Jan 3.",
    fishing: "Walleye: 15-inch minimum statewide, 6/day. Northern Pike: 24-inch minimum some lakes. Muskie: 54-inch minimum. Bass: 14-inch minimum. Ice fishing world-class Jan–Feb.",
    general: "Resident licenses: Deer $30, Fishing $25, Small Game $15. Hunter education required for hunters born after 1979. Purchase at dnr.state.mn.us."
  },
  "Mississippi": {
    hunting: "Whitetail Deer: archery Oct 1–Jan 31, firearm Nov 18–Jan 31. Turkey: spring Mar 15–May 1, fall Oct 1–Nov 30. Dove: Sep 1–Oct 27. Squirrel: Oct 1–Feb 28. Hog: year-round.",
    fishing: "Largemouth Bass: 12-inch minimum. Catfish: no minimum, year-round. Crappie: 9-inch minimum. No closed season on most warmwater species.",
    general: "Resident licenses: Hunting $15, Fishing $9, Combo $23. Hunter education required. Purchase at mdwfp.com."
  },
  "Missouri": {
    hunting: "Whitetail Deer: archery Sep 15–Nov 15 and Dec 4–Jan 15, firearm Nov 16–26. Turkey: spring Apr 21–May 11, fall Oct 1–Nov 10. Dove: Sep 1–Nov 9. Squirrel: May 23–Feb 15.",
    fishing: "Largemouth Bass: 12-inch minimum. Trout: stocked in trout parks, $4/day additional permit. Catfish: excellent May–Aug. Crappie: 9-inch minimum.",
    general: "Resident licenses: Hunting $19, Fishing $13, Combo $29. Hunter education required for hunters born after 1967. Purchase at mdc.mo.gov."
  },
  "Montana": {
    hunting: "Whitetail/Mule Deer: archery Sep 4–Oct 19, general Oct 22–Nov 30. Elk: archery Sep 4–Oct 19, general Oct 22–Nov 30. Some units OTC, many require draw. Antelope: archery Aug 15–Oct 18, rifle Sep 15–Oct 4. Bear: spring Apr–May, fall Sep–Oct.",
    fishing: "Trout: open year-round on most rivers. Catch-and-release only on some blue ribbon waters like Madison and Beaverhead. Walleye: Missouri River excellent. Ice fishing Jan–Feb.",
    general: "Resident licenses: Conservation License $8, Deer $9, Elk $20, Fishing $36. Hunter education required. Apply for limited entry units at fwp.mt.gov by March."
  },
  "Nebraska": {
    hunting: "Whitetail Deer: archery Sep 1–Dec 31, firearm Nov 14–22. Turkey: spring Apr 16–May 31, fall Sep 15–Oct 31. Pheasant: Oct 26–Jan 31. Dove: Sep 1–Oct 19. Quail: Nov 1–Jan 31.",
    fishing: "Walleye: 15-inch minimum. Largemouth Bass: 15-inch minimum. Channel Catfish: year-round. Striped Bass: stocked in some reservoirs.",
    general: "Resident licenses: Hunting $23, Fishing $31, Combo $40. Hunter education required. Purchase at outdoornebraska.gov."
  },
  "Nevada": {
    hunting: "Mule Deer: archery Aug 8–Sep 7, rifle Oct 10–Nov 15 varies by unit. Elk: draw only, archery Aug–Sep, rifle Sep–Oct. Antelope: draw only Aug–Sep. Bighorn Sheep: draw only. Most big game requires draw.",
    fishing: "Rainbow Trout: stocked year-round in many areas. Largemouth Bass: 12-inch minimum. Catfish: year-round. Lake Mead and Lake Mohave: striped bass excellent.",
    general: "Resident licenses: Hunting $33, Fishing $40, Combo $65. Hunter education required. Apply for draw tags at ndow.org by June 1."
  },
  "New Hampshire": {
    hunting: "Whitetail Deer: archery Sep 15–Dec 15, firearm Nov 1–Dec 6. Moose: draw only Oct 15–24. Turkey: spring May 1–Jun 2, fall Sep 15–Oct 31. Bear: Sep 1–Nov 20.",
    fishing: "Brook Trout: excellent in small streams, 6-inch minimum. Landlocked Salmon: 15-inch minimum. Largemouth Bass: 14-inch minimum. Ice fishing popular Jan–Feb.",
    general: "Resident licenses: Hunting $15, Fishing $23, Combo $30. Hunter education required for hunters born after 1975. Purchase at wildlife.nh.gov."
  },
  "New Jersey": {
    hunting: "Whitetail Deer: archery Sep 9–Feb 16, firearm Dec 5–19. Turkey: spring Apr 21–May 31, fall Oct 28–Nov 22. Pheasant: stocked birds Nov–Dec. Bear: limited permit shotgun season.",
    fishing: "Largemouth Bass: 15-inch minimum. Striped Bass: 28-inch minimum, 1/day. Trout stocked Mar–May. Bluefish: no minimum, excellent fall runs.",
    general: "Resident licenses: Hunting $28, Freshwater Fishing $23, Saltwater Registry free. Hunter education required. Antlerless deer permit required separately. Purchase at nj.gov/dep/fgw."
  },
  "New Mexico": {
    hunting: "Mule Deer: archery Sep 1–Oct 1, rifle Oct 17–Nov 8 varies by unit. Elk: archery Sep 1–Oct 1, rifle Oct 17–Nov 1 varies by unit. Antelope: archery Aug 15–Sep 7, rifle Sep 22–Oct 5. Most units draw tags.",
    fishing: "Trout: open year-round most waters. San Juan River: world-class tailwater trout fishery. Bass: 12-inch minimum. Catfish: year-round.",
    general: "Resident licenses: Hunting $22, Fishing $25, Combo $43. Hunter education required. Apply for draw tags at wildlife.state.nm.us by March 20."
  },
  "New York": {
    hunting: "Whitetail Deer: archery Oct 1–Nov 19 and Dec 11–Jan 9, Southern Zone firearm Nov 20–Dec 10. Turkey: spring May 1–Jun 7, fall Oct 1–Nov 18. Bear: Sep 26–Dec 15 varies by zone. Pheasant: stocked birds Oct–Nov.",
    fishing: "Trout: Apr 1–Oct 15 general, year-round some waters. Walleye: 15-inch minimum. Bass: 12-inch minimum. Lake Ontario Salmon: excellent Aug–Oct.",
    general: "Resident licenses: Hunting $22, Fishing $25, Combo $40. Hunter education required for hunters born after 1972. Purchase at dec.ny.gov."
  },
  "North Carolina": {
    hunting: "Whitetail Deer: archery Sep 7–Jan 1, gun varies significantly by county. Turkey: spring Apr 5–May 10. Bear: limited season Oct–Nov. Regulations vary dramatically by county — always check county-specific rules.",
    fishing: "Trout: hatchery-supported waters open year-round, wild trout catch-and-release. Bass: 14-inch minimum on some designated waters. Striped Bass: 18-inch minimum.",
    general: "Resident licenses: Hunting $25, Fishing $25, Combo $40. Hunter education required. County regulations vary widely — check ncwildlife.org carefully."
  },
  "North Dakota": {
    hunting: "Whitetail Deer: archery Sep 2–Jan 5, firearm Nov 8–24. Pheasant: Oct 5–Jan 7, excellent roosters. Waterfowl: follows federal framework, some of best duck hunting in US. Antelope: draw tags Sep–Oct.",
    fishing: "Walleye: 15-inch minimum, 10/day. Northern Pike: 15-inch minimum. Smallmouth Bass: 14-inch minimum. Devils Lake: world-class walleye and perch fishing.",
    general: "Resident licenses: Deer $18, Small Game $17, Fishing $15. Hunter education required. Purchase at gf.nd.gov."
  },
  "Ohio": {
    hunting: "Whitetail Deer: archery Oct 1–Feb 2, gun Dec 2–8 and Jan 4–5. Turkey: spring Apr 21–May 25, fall Oct 14–Nov 2. Pheasant: stocked birds Nov–Jan. Dove: Sep 1–Oct 27.",
    fishing: "Walleye: 15-inch minimum Lake Erie, 13-inch inland. Largemouth Bass: 12-inch minimum. Steelhead: excellent runs Oct–Apr on Lake Erie tributaries. Muskie: 40-inch minimum.",
    general: "Resident licenses: Hunting $19, Fishing $25, Combo $35. Hunter education required for hunters born after 1966. Purchase at ohiodnr.gov."
  },
  "Oklahoma": {
    hunting: "Whitetail Deer: archery Oct 1–Jan 15, gun Nov 21–Dec 8. Turkey: spring Apr 1–May 12, fall Oct 1–Nov 10. Dove: Sep 1–Oct 29. Hog: year-round on private land. Quail: Nov 9–Feb 15.",
    fishing: "Largemouth Bass: 15-inch minimum on some lakes. Catfish: excellent year-round. Striped Bass: stocked in several reservoirs. Crappie: 10-inch minimum.",
    general: "Resident licenses: Hunting $27, Fishing $25, Combo $40. Hunter education required. Purchase at wildlifedepartment.com."
  },
  "Oregon": {
    hunting: "Blacktail/Mule Deer: archery Aug 2–Sep 14, rifle Oct 1–31 varies by unit. Elk: archery Aug 30–Sep 28, rifle Oct 1–31 varies by unit. Many units require draw. Bear: Aug 1–Nov 30. Cougar: year-round with tag.",
    fishing: "Steelhead: winter run Dec–Mar, summer run May–Oct. Chinook Salmon: varies by river. Trout: open year-round most waters. Columbia River walleye excellent.",
    general: "Resident licenses: Hunting $28, Fishing $44, Combo $57. Hunter education required. Apply for draw tags at myodfw.com by June. Tags and licenses required for salmon and steelhead."
  },
  "Pennsylvania": {
    hunting: "Whitetail Deer: archery Oct 2–Nov 14 and Dec 26–Jan 17, rifle Nov 29–Dec 12. Turkey: spring May 1–Jun 2, fall Oct 31–Nov 20. Bear: archery Oct 18–24, rifle Nov 18–22. Pheasant: Oct 17–Nov 20.",
    fishing: "Trout: stocked waters open Apr 5. Wild trout streams open year-round. Walleye: 15-inch minimum. Bass: 12-inch minimum. Lake Erie Steelhead: Oct–Apr excellent.",
    general: "Resident licenses: Hunting $20, Fishing $22.70, Combo $35. Hunter education required for hunters born after 1986. Purchase at huntfish.pa.gov."
  },
  "Rhode Island": {
    hunting: "Whitetail Deer: archery Sep 16–Jan 31, shotgun Dec 1–15. Turkey: spring May 1–Jun 3, fall Oct 1–Nov 20. Small game limited due to land availability.",
    fishing: "Striped Bass: 28-inch minimum, 1/day. Bluefish: 8 fish/day. Freshwater Bass: 12-inch minimum. Trout stocked spring. Saltwater registry free.",
    general: "Resident licenses: Hunting $18, Freshwater Fishing $18, Saltwater Registry free. Hunter education required. Purchase at dem.ri.gov."
  },
  "South Carolina": {
    hunting: "Whitetail Deer: archery Aug 15–Jan 1, firearm Aug 15–Jan 1 varies by zone. One of the longest deer seasons in the US with liberal bag limits. Turkey: spring Apr 1–May 1. Dove: Sep 1–Oct 25.",
    fishing: "Largemouth Bass: 12-inch minimum. Striped Bass: 21-inch minimum. Redfish: 15–23 inch slot, 3/day. Flounder: 12-inch minimum. Trout: 14-inch minimum.",
    general: "Resident licenses: Hunting $14, Freshwater Fishing $10, Saltwater $10. Hunter education required. Purchase at dnr.sc.gov."
  },
  "South Dakota": {
    hunting: "Pheasant: Oct 19–Jan 31, world-class ringneck hunting. Whitetail Deer: archery Sep 14–Jan 31, rifle Nov 14–Dec 8. Turkey: spring Apr 13–May 31, fall Sep 28–Jan 31. Prairie Dog: year-round.",
    fishing: "Walleye: 15-inch minimum on Missouri River reservoirs. Northern Pike: 15-inch minimum. Smallmouth Bass: excellent in Black Hills streams. Perch: popular year-round.",
    general: "Resident licenses: Small Game $28, Deer $28, Fishing $27. Hunter education required. Purchase at gfp.sd.gov."
  },
  "Tennessee": {
    hunting: "Whitetail Deer: archery Sep 28–Jan 31, gun varies by zone Nov–Jan. Turkey: spring Apr 5–May 17, fall Oct 3–Nov 3. Bear: archery only in some zones. Dove: Sep 1–Oct 26.",
    fishing: "Brown/Rainbow Trout: Cumberland River tailwater world-class. Largemouth Bass: 15-inch minimum on some TVA lakes. Walleye: 15-inch minimum. Catfish: excellent year-round.",
    general: "Resident licenses: Hunting $34, Fishing $34, Combo $49. Hunter education required for hunters born after 1969. Purchase at tn.gov/twra."
  },
  "Texas": {
    hunting: "Whitetail Deer: archery Oct 1–Nov 1, general Nov 2–Jan 19. Turkey: spring Mar 22–May 12, fall varies by county. Dove: Sep 1–Oct 27 North Zone. Hog: year-round on private land. Regulations vary significantly by county.",
    fishing: "Largemouth Bass: 14-inch minimum most waters, some lakes have slot limits. Redfish: 20–28 inch slot, 3/day. Striped Bass: stocked in some impoundments. Catfish: excellent year-round. Flounder: 12-inch minimum.",
    general: "Resident licenses: Hunting $25, Freshwater Fishing $30, Saltwater $35, Combo $68. Hunter education required. Purchase at tpwd.texas.gov."
  },
  "Utah": {
    hunting: "Mule Deer: archery Aug 17–Sep 14, rifle Oct 18–Nov 2 varies by unit. Elk: archery Aug 17–Sep 14, rifle Oct 18–Nov 2 varies by unit. Antelope: draw tags Aug–Sep. Most units require draw tags.",
    fishing: "Trout: open year-round most waters. Green River: world-class tailwater. Flaming Gorge: kokanee and lake trout. Bass: 12-inch minimum.",
    general: "Resident licenses: Hunting $28, Fishing $34, Combo $55. Hunter education required. Apply for draw tags at wildlife.utah.gov by June 2."
  },
  "Vermont": {
    hunting: "Whitetail Deer: archery Oct 1–Nov 7 and Dec 2–10, rifle Nov 8–Dec 1. Turkey: spring May 1–Jun 8, fall Oct 8–Nov 7. Bear: Sep 1–Nov 30. Moose: draw only Oct.",
    fishing: "Brook Trout: excellent in small streams, 6-inch minimum. Lake Champlain: walleye, bass, pike world-class. Landlocked Salmon: 15-inch minimum. Ice fishing popular Jan–Feb.",
    general: "Resident licenses: Hunting $28, Fishing $28, Combo $43. Hunter education required for hunters born after 1975. Purchase at vtfishandwildlife.com."
  },
  "Virginia": {
    hunting: "Whitetail Deer: archery Sep 7–Jan 4 varies by county, firearm Nov 15–Jan 4 varies. Turkey: spring Apr 4–May 18, fall Oct 5–Nov 22. Bear: Nov 14–Dec 7 in some zones. Dove: Sep 1–Oct 25.",
    fishing: "Trout: stocked Mar–May. Striped Bass: 20-inch minimum tidal, 18-inch minimum non-tidal. Smallmouth Bass: excellent in many rivers. Walleye: 18-inch minimum on New River.",
    general: "Resident licenses: Hunting $23, Fishing $23, Combo $35. Hunter education required for hunters born after 1977. Purchase at dwr.virginia.gov."
  },
  "Washington": {
    hunting: "Blacktail/Mule Deer: archery Sep 1–Oct 19, modern firearm Oct 11–Nov 30 varies by unit. Elk: archery Sep 1–Oct 19, rifle Oct 11–Nov 30 varies by unit. Many units require draw. Bear: Apr 1–May 31 and Aug 1–Nov 15.",
    fishing: "Chinook Salmon: varies by river, Columbia and Puget Sound excellent. Steelhead: year-round on many rivers. Halibut: federal permit, May–Sep. Dungeness Crab: year-round some areas.",
    general: "Resident licenses: Hunting $32, Fishing $30, Combo $54. Hunter education required. Apply for draw tags at wdfw.wa.gov by June. Punch cards required for salmon and steelhead."
  },
  "West Virginia": {
    hunting: "Whitetail Deer: archery Oct 1–Dec 31, firearm Nov 21–Dec 7. Turkey: spring Apr 21–May 13, fall Oct 17–Nov 4. Bear: Oct 28–Dec 31 varies by zone. Grouse: Oct 1–Feb 28.",
    fishing: "Trout: stocked Mar–May. New River: excellent smallmouth bass. Cheat River: great trout and bass. Walleye: 15-inch minimum. Catfish: year-round.",
    general: "Resident licenses: Hunting $19, Fishing $19, Combo $32. Hunter education required for hunters born after 1975. Purchase at wvdnr.gov."
  },
  "Wisconsin": {
    hunting: "Whitetail Deer: archery Sep 14–Jan 6, gun Nov 23–Dec 1. Turkey: spring Apr 16–May 31, fall Sep 14–Nov 7. Bear: Sep 3–Oct 8 draw tags. Pheasant: Oct 19–Jan 5 stocked areas.",
    fishing: "Walleye: 15-inch minimum statewide, 5/day. Muskie: 40-inch minimum. Northern Pike: 24-inch minimum. Sturgeon: spearing season on Lake Winnebago famous.",
    general: "Resident licenses: Deer $24, Small Game $20, Fishing $20, Patron (all) $140. Hunter education required. Purchase at dnr.wisconsin.gov."
  },
  "Wyoming": {
    hunting: "Mule Deer: archery Sep 1–Sep 30, rifle Oct 1–Nov 9 varies by unit. Elk: archery Sep 1–Sep 30, rifle Oct 1–Nov 9 varies by unit. Antelope: archery Aug 15–Sep 30, rifle Sep 15–Oct 5. Many units draw. Some OTC elk available.",
    fishing: "Trout: open year-round most waters. North Platte: blue ribbon brown trout. Snake River: cutthroat excellent. Some Gold Medal waters catch-and-release only. Walleye: excellent in Bighorn Lake.",
    general: "Resident licenses: Deer $46, Elk $57, Fishing $27, Antelope $46. Hunter education required. Apply for draw tags at wgfd.wyo.gov by May 31."
  },
};

const ADMIN_USER_ID = "user_3CKoCuA9KUvrtfrJ3ia3Bm2BH1a";

function RegulationsTab({ selectedState, currentUser }) {
  const [regs, setRegs] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [scrapeStatus, setScrapeStatus] = useState({});
  const [scraping, setScraping] = useState(false);

  useEffect(() => {
    if (!selectedState) return;
    const load = async () => {
      setLoading(true);
      setRegs(null);
      const { data } = await supabase.from("regulations_cache").select("*").eq("state", selectedState).single();
      if (false) {
        setRegs(data);
      } else {
        await generate();
      }
      setLoading(false);
    };
    load();
  }, [selectedState]);

  const generate = async () => {
    return; // disabled
    setGenerating(true);
    try {
      return; // regs disabled
      const prompt = `Provide current ${new Date().getFullYear()} hunting and fishing regulations for ${selectedState}. Return a JSON object with exactly these three keys: "hunting" (key species season dates and bag limits), "fishing" (key species seasons and limits), "general" (license costs and important notes). Keep each value under 300 characters. No markdown, just the JSON object.`;
      const res = await fetch("https://wildai-server.onrender.com/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }], system: "Return only a valid JSON object with hunting, fishing, and general keys. No markdown. No explanation." })
      });
      const d = await res.json();
      const text = d.reply.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(text);
      await supabase.from("regulations_cache").upsert({ state: selectedState, hunting: parsed.hunting, fishing: parsed.fishing, general: parsed.general, updated_at: new Date().toISOString() });
      setRegs({ ...parsed, state: selectedState });
    } catch { }
    setGenerating(false);
  };

  const refresh = async () => {
    await supabase.from("regulations_cache").delete().eq("state", selectedState);
    setRegs(null);
    await generate();
  };

  const scrapeAllStates = async () => {
    setScraping(true);
    setScrapeStatus({});
    for (const state of STATES) {
      setScrapeStatus(prev => ({ ...prev, [state]: "loading" }));
      const agency = STATE_WILDLIFE_AGENCIES[state];
      try {
        const res = await fetch("https://wildai-server.onrender.com/scrape-regulations", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state, huntingUrl: agency.hunting, fishingUrl: agency.fishing })
        });
        const d = await res.json();
        if (d.success) {
          await supabase.from("regulations_cache").upsert({ state, hunting: d.data.hunting, fishing: d.data.fishing, general: d.data.general, updated_at: new Date().toISOString() });
          setScrapeStatus(prev => ({ ...prev, [state]: d.data.scraped ? "scraped" : "ai" }));
        } else {
          setScrapeStatus(prev => ({ ...prev, [state]: "error" }));
        }
      } catch {
        setScrapeStatus(prev => ({ ...prev, [state]: "error" }));
      }
      await new Promise(r => setTimeout(r, 1000));
    }
    setScraping(false);
  };

  if (!selectedState) return (
    <div className="card" style={{ padding: 40, textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
      <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Select Your State</div>
      <div style={{ color: "var(--text2)", fontSize: 14 }}>Go back home and choose your state to view regulations.</div>
    </div>
  );

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
        <div>
          <div style={{ color: "var(--text3)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 2 }}>REGULATIONS</div>
          <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 22, fontFamily: "var(--font-display)" }}>{selectedState}</div>
        </div>
        {currentUser?.id === ADMIN_USER_ID && (
          <button onClick={() => setShowAdmin(s => !s)} className="btn-ghost" style={{ padding: "6px 14px", fontSize: 12 }}>
            {showAdmin ? "✕ Close" : "⚙️ Admin"}
          </button>
        )}
      </div>

      {/* Official links */}
      {STATE_WILDLIFE_AGENCIES[selectedState] && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <a href={STATE_WILDLIFE_AGENCIES[selectedState].hunting} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", textDecoration: "none", transition: "border-color 0.2s" }} onMouseEnter={e => e.currentTarget.style.borderColor = "var(--green)"} onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div>
                <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 15, fontFamily: "var(--font-display)", marginBottom: 3 }}>Hunting Regulations</div>
                <div style={{ color: "var(--text3)", fontSize: 12 }}>{selectedState} Official Wildlife Agency</div>
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
          </a>
          <a href={STATE_WILDLIFE_AGENCIES[selectedState].fishing} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", textDecoration: "none", transition: "border-color 0.2s" }} onMouseEnter={e => e.currentTarget.style.borderColor = "var(--green)"} onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div>
                <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 15, fontFamily: "var(--font-display)", marginBottom: 3 }}>Fishing Regulations</div>
                <div style={{ color: "var(--text3)", fontSize: 12 }}>{selectedState} Official Wildlife Agency</div>
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
          </a>
        </div>
      )}

      <div style={{ padding: "13px 18px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)" }}>
        <div style={{ color: "var(--text3)", fontSize: 12, lineHeight: 1.6 }}>Detailed in-app regulations coming soon. Official agency links above are always current.</div>
      </div>

      {regs && !loading && !generating && (
        <>
          {[
            { emoji: "🎯", label: "Hunting", text: regs.hunting, accent: "rgba(212,147,10,0.12)", border: "rgba(212,147,10,0.25)", color: "var(--amber)" },
            { emoji: "🎣", label: "Fishing", text: regs.fishing, accent: "rgba(80,140,220,0.1)", border: "rgba(80,140,220,0.25)", color: "#7ab0e0" },
            { emoji: "📋", label: "Licenses & General Info", text: regs.general, accent: "rgba(120,180,80,0.08)", border: "var(--border-accent)", color: "var(--green)" },
          ].map(({ emoji, label, text, accent, border, color }) => (
            <div key={label} style={{ background: accent, border: `1px solid ${border}`, borderRadius: "var(--radius)", padding: "20px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: accent, border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: `0 0 20px ${border}` }}>{emoji}</div>
                <span style={{ color, fontWeight: 700, fontSize: 15, fontFamily: "var(--font-display)" }}>{label}</span>
              </div>
              <p style={{ color: "var(--text2)", fontSize: 14, lineHeight: 1.85, margin: 0 }}>{text}</p>
            </div>
          ))}
        </>
      )}

      {showAdmin && currentUser?.id === ADMIN_USER_ID && (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 15 }}>⚙️ Admin — Scrape All States</div>
            <button onClick={scrapeAllStates} disabled={scraping} className="btn-primary" style={{ padding: "8px 18px", fontSize: 13, opacity: scraping ? 0.5 : 1 }}>
              {scraping ? "⏳ Running..." : "▶ Run All 50 States"}
            </button>
          </div>
          <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 12 }}>Fetches each state's official site and generates structured regulations. Takes ~5 minutes.</div>
          <div style={{ display: "flex", gap: 16, marginBottom: 12, fontSize: 11, color: "var(--text3)" }}>
            <span>✅ Scraped from official site</span>
            <span>🟡 AI knowledge fallback</span>
            <span>❌ Failed</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 6 }}>
            {STATES.map(s => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 8px", borderRadius: "var(--radius-sm)", background: scrapeStatus[s] === "scraped" ? "var(--green-dim)" : scrapeStatus[s] === "ai" ? "rgba(212,147,10,0.1)" : scrapeStatus[s] === "error" ? "rgba(255,100,100,0.1)" : scrapeStatus[s] === "loading" ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
                <span style={{ fontSize: 10 }}>{scrapeStatus[s] === "scraped" ? "✅" : scrapeStatus[s] === "ai" ? "🟡" : scrapeStatus[s] === "error" ? "❌" : scrapeStatus[s] === "loading" ? "⏳" : "⬜"}</span>
                <span style={{ fontSize: 11, color: "var(--text2)" }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {false && <div style={{ padding: "16px 20px", background: "var(--green-dim)", border: "1px solid var(--border-accent)", borderRadius: "var(--radius)" }}>
        <p style={{ color: "var(--green)", fontSize: 13, lineHeight: 1.7 }}>💬 Have a specific regulation question? Ask the AI in the Chat tab for more detailed info.</p>
      </div>}
    </div>
  );
}

// ─── TERMS PAGE ───────────────────────────────────────────────────────────────
function AdminTab({ user }) {
  const [reports, setReports] = useState([]);
  const [posts, setPosts] = useState({});
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [banning, setBanning] = useState(null);
  const [reportedUsers, setReportedUsers] = useState([]);
  const [adminTab, setAdminTab] = useState("posts");
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      // Load stats
      const [
        { count: userCount },
        { count: postCount },
        { count: commentCount },
        { count: likeCount },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("posts").select("*", { count: "exact", head: true }),
        supabase.from("comments").select("*", { count: "exact", head: true }),
        supabase.from("likes").select("*", { count: "exact", head: true }),
      ]);
      // Get Stripe stats from backend
      let stripeStats = null;
      try {
        const res = await fetch("https://wildai-server.onrender.com/admin/stats", { headers: { "x-admin-key": "somethinglong123" } });
        if (res.ok) stripeStats = await res.json();
      } catch { }
      setStats({ userCount, postCount, commentCount, likeCount, ...stripeStats });
      const { data: reportData } = await supabase.from("reports").select("*").order("created_at", { ascending: false }).limit(50);
      if (reportData?.length) {
        const postIds = [...new Set(reportData.map(r => r.post_id))];
        const { data: postData } = await supabase.from("posts").select("*").in("id", postIds);
        const postMap = {};
        (postData || []).forEach(p => postMap[p.id] = p);
        setPosts(postMap);
      }
      setReports(reportData || []);
      const { data: userReports } = await supabase.from("reported_users").select("*").order("created_at", { ascending: false });
      const grouped = {};
      (userReports || []).forEach(r => {
        if (!grouped[r.user_id]) grouped[r.user_id] = { user_id: r.user_id, count: 0, latest: r.created_at };
        grouped[r.user_id].count += 1;
      });
      setReportedUsers(Object.values(grouped).sort((a, b) => b.count - a.count));
      setLoading(false);
    };
    load();
  }, []);

  const deletePost = async (postId) => {
    if (!window.confirm("Delete this post and all its reports?")) return;
    setDeleting(postId);
    await supabase.from("posts").delete().eq("id", postId);
    await supabase.from("reports").delete().eq("post_id", postId);
    setReports(prev => prev.filter(r => r.post_id !== postId));
    setPosts(prev => { const n = { ...prev }; delete n[postId]; return n; });
    setDeleting(null);
  };

  const dismissReport = async (postId) => {
    await supabase.from("reports").delete().eq("post_id", postId);
    setReports(prev => prev.filter(r => r.post_id !== postId));
  };

  const uniquePostIds = [...new Set(reports.map(r => r.post_id))];

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 18, fontFamily: "var(--font-display)" }}>⚙️ Admin</div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => setAdminTab("stats")} className={`nav-tab ${adminTab === "stats" ? "active" : "inactive"}`} style={{ padding: "7px 18px", fontSize: 13 }}>📊 Stats</button>
        <button onClick={() => setAdminTab("posts")} className={`nav-tab ${adminTab === "posts" ? "active" : "inactive"}`} style={{ padding: "7px 18px", fontSize: 13 }}>Reported Posts ({uniquePostIds.length})</button>
        <button onClick={() => setAdminTab("users")} className={`nav-tab ${adminTab === "users" ? "active" : "inactive"}`} style={{ padding: "7px 18px", fontSize: 13 }}>Reported Users ({reportedUsers.length})</button>
      </div>
      {loading && <div style={{ textAlign: "center", padding: 40, color: "var(--text3)" }} className="pulse">Loading...</div>}
      {!loading && adminTab === "users" && reportedUsers.length === 0 && (
        <div style={{ textAlign: "center", padding: 48, color: "var(--text3)", fontSize: 14 }}>No reported users</div>
      )}
      {!loading && adminTab === "users" && reportedUsers.map(ru => (
        <div key={ru.user_id} className="card" style={{ padding: 16, border: "1px solid rgba(255,100,100,0.3)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ color: "rgba(255,100,100,0.8)", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>🚩 {ru.count} REPORT{ru.count > 1 ? "S" : ""}</div>
              <div style={{ color: "var(--text2)", fontSize: 12, fontFamily: "monospace" }}>{ru.user_id}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={async () => {
                await supabase.from("reported_users").delete().eq("user_id", ru.user_id);
                setReportedUsers(prev => prev.filter(u => u.user_id !== ru.user_id));
              }} className="btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }}>Dismiss</button>
              <button onClick={async () => {
                if (!window.confirm(`Ban this user? This will delete all their posts.`)) return;
                await supabase.from("banned_users").upsert({ user_id: ru.user_id, reason: "Admin ban" });
                await supabase.from("posts").delete().eq("user_id", ru.user_id);
                await supabase.from("reported_users").delete().eq("user_id", ru.user_id);
                setReportedUsers(prev => prev.filter(u => u.user_id !== ru.user_id));
              }} style={{ background: "rgba(255,50,50,0.2)", border: "1px solid rgba(255,50,50,0.5)", color: "rgba(255,80,80,1)", padding: "6px 12px", borderRadius: "var(--radius-sm)", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 700 }}>Ban User</button>
            </div>
          </div>
        </div>
      ))}
      {adminTab === "stats" && stats && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { label: "Total Users", value: stats.clerkUserCount ?? stats.userCount, icon: "👤", color: "#38bdf8" },
            { label: "Total Posts", value: stats.postCount, icon: "📸", color: "var(--green)" },
            { label: "Total Comments", value: stats.commentCount, icon: "💬", color: "#a78bfa" },
            { label: "Total Likes", value: stats.likeCount, icon: "❤️", color: "#f43f5e" },
            { label: "Pro Subscribers", value: stats.proCount ?? "—", icon: "⚡", color: "#fbbf24" },
            { label: "MRR", value: stats.mrr ? `$${(stats.mrr / 100).toFixed(2)}` : "—", icon: "💰", color: "#4ade80" },
          ].map(({ label, value, icon, color }) => (
            <div key={label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "16px 20px" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
              <div style={{ color, fontWeight: 700, fontSize: 22, fontFamily: "var(--font-display)" }}>{value}</div>
              <div style={{ color: "var(--text3)", fontSize: 12, marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      )}
      {!loading && adminTab === "posts" && uniquePostIds.length === 0 && (
        <div style={{ textAlign: "center", padding: 48, color: "var(--text3)", fontSize: 14 }}>No reported posts</div>
      )}
      {adminTab === "posts" && uniquePostIds.map(postId => {
        const post = posts[postId];
        const postReports = reports.filter(r => r.post_id === postId);
        return (
          <div key={postId} className="card" style={{ padding: 16, border: "1px solid rgba(255,100,100,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div>
                <div style={{ color: "rgba(255,100,100,0.8)", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>🚩 {postReports.length} REPORT{postReports.length > 1 ? "S" : ""}</div>
                <div style={{ color: "var(--text)", fontWeight: 600, fontSize: 14 }}>{post?.username || "Unknown"} · {post?.state}</div>
                <div style={{ color: "var(--text3)", fontSize: 11 }}>{post ? new Date(post.created_at).toLocaleDateString() : postId}</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => dismissReport(postId)} className="btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }}>Dismiss</button>
                <button onClick={() => deletePost(postId)} disabled={deleting === postId} style={{ background: "rgba(255,100,100,0.15)", border: "1px solid rgba(255,100,100,0.4)", color: "rgba(255,100,100,0.9)", padding: "6px 12px", borderRadius: "var(--radius-sm)", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-body)" }}>
                  {deleting === postId ? "Deleting..." : "Delete Post"}
                </button>
                <button onClick={async () => {
                  const post = posts[postId];
                  if (!post?.user_id) return;
                  if (!window.confirm(`Ban ${post.username}? This will delete all their posts and reports.`)) return;
                  setBanning(postId);
                  await supabase.from("banned_users").upsert({ user_id: post.user_id, username: post.username, reason: "Admin ban" });
                  await supabase.from("posts").delete().eq("user_id", post.user_id);
                  await supabase.from("reports").delete().eq("post_id", postId);
                  setReports(prev => prev.filter(r => r.post_id !== postId));
                  setPosts(prev => { const n = { ...prev }; delete n[postId]; return n; });
                  setBanning(null);
                }} disabled={banning === postId} style={{ background: "rgba(255,50,50,0.2)", border: "1px solid rgba(255,50,50,0.5)", color: "rgba(255,80,80,1)", padding: "6px 12px", borderRadius: "var(--radius-sm)", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 700 }}>
                  {banning === postId ? "Banning..." : "Ban User"}
                </button>
              </div>
            </div>
            {post?.photo && <img src={post.photo} style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: "var(--radius-sm)", marginBottom: 8 }} />}
            {post?.caption && <p style={{ color: "var(--text2)", fontSize: 13, margin: "0 0 8px" }}>{post.caption}</p>}
            <div style={{ color: "var(--text3)", fontSize: 11 }}>Reason: {postReports.map(r => r.reason).join(", ")}</div>
          </div>
        );
      })}
    </div>
  );
}

function TermsPage({ onBack }) {
  const sections = [
    ["1. Acceptance of Terms", "By accessing or using Ravlin, you agree to be bound by these Terms and Conditions. Ravlin reserves the right to update these terms at any time, and continued use constitutes acceptance of any changes. You must be at least 13 years of age to use Ravlin. By using this service you represent that you are 13 years of age or older."],
    ["2. Nature of Service", "Ravlin is an AI-powered informational assistant for hunters and anglers. It is not a licensed guide, outfitter, or wildlife agency. All information is for general educational purposes only."],
    ["3. Regulatory Disclaimer", "Hunting and fishing regulations change frequently. Ravlin makes no guarantee that information on seasons, bag limits, or license requirements is current. You are solely responsible for verifying regulations with your state wildlife agency."],
    ["4. Accuracy of Information", "Ravlin strives to provide accurate information but may make errors or provide outdated advice. Always apply your own judgment and consult licensed professionals for decisions involving safety or legality."],
    ["5. Safety and Personal Responsibility", "Hunting and fishing involve inherent risks. Ravlin accepts no liability for any injury, death, or loss resulting from acting on information provided. Users engage in all outdoor activities at their own risk."],
    ["6. Free Tier and Paid Services", "Ravlin offers limited free messages per session. Additional use may require a paid subscription. Ravlin reserves the right to modify or discontinue any tier of service with reasonable notice."],
    ["7. User Conduct", "You agree not to use Ravlin to facilitate illegal hunting or fishing, poaching, or violations of wildlife protection laws. You agree not to post content that is illegal, threatening, harassing, defamatory, obscene, or otherwise objectionable. Ravlin may remove content and terminate access for users who violate these terms without prior notice."],
    ["8. User-Generated Content", "Ravlin hosts user-generated content including posts, photos, messages, and location pins. Ravlin is not responsible for the accuracy, legality, or appropriateness of user-generated content. By posting content, you grant Ravlin a non-exclusive license to display and distribute that content within the platform. You represent that you own or have the right to share any content you post. Ravlin reserves the right to remove any content at its sole discretion."],
    ["9. Community Guidelines", "Users must not post content depicting illegal take of wildlife, trespassing on private property, animal cruelty, or any activity that violates federal, state, or local law. Users must not impersonate other individuals or post private information about others without consent. Violation of community guidelines may result in immediate account termination."],
    ["10. Reporting and Moderation", "Ravlin provides a reporting mechanism for users to flag content that violates these terms. Ravlin reviews reported content and takes action at its discretion. Ravlin is not obligated to monitor all content but will act in good faith upon receiving reports. To report content, use the report button available on each post."],
    ["11. Private Messaging", "Ravlin provides a private messaging feature between users. Messages are stored securely and are not reviewed by Ravlin unless reported. Users are solely responsible for the content of their messages. Ravlin may access message content if required by law or to investigate reports of abuse."],
    ["12. Location Data", "Ravlin may request access to your device location to provide location-based features. Location data is used solely within the app and is not sold to third parties. Location pins you share publicly are visible to other users."],
    ["13. Intellectual Property", "All content, design, and functionality of Ravlin is protected by applicable intellectual property laws. Reproduction without express written permission is prohibited."],
    ["14. Limitation of Liability", "To the fullest extent permitted by law, Ravlin and its affiliates shall not be liable for any direct, indirect, or consequential damages arising from use of the service, including damages arising from user-generated content posted by third parties."],
    ["15. Indemnification", "You agree to indemnify and hold harmless Ravlin and its affiliates from any claims, damages, or expenses arising from your use of the service, your violation of these terms, or your violation of any third-party rights."],
    ["16. Contact", "Questions about these Terms or to report content violations may be directed to Ravlin through the website. We respond to reasonable inquiries in a timely manner."],
  ];
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "var(--font-body)" }}>
      <nav style={{ padding: "20px 32px", display: "flex", alignItems: "center", gap: 16, borderBottom: "1px solid var(--border)" }}>
        <button onClick={onBack} className="btn-ghost" style={{ padding: "8px 16px", fontSize: 13 }}>← Back</button>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--text)" }}>Ravlin · Terms & Conditions</span>
      </nav>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 900, color: "var(--text)", marginBottom: 8 }}>Terms & Conditions</h1>
        <p style={{ color: "var(--text3)", fontSize: 13, marginBottom: 40 }}>Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
        {sections.map(([title, body], i) => (
          <div key={i} style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>{title}</h2>
            <p style={{ color: "var(--text2)", fontSize: 15, lineHeight: 1.8 }}>{body}</p>
          </div>
        ))}
        <div style={{ marginTop: 40, padding: "20px 24px", background: "var(--green-dim)", border: "1px solid var(--border-accent)", borderRadius: "var(--radius)" }}>
          <p style={{ color: "var(--green)", fontSize: 14, lineHeight: 1.7 }}>🦌 Always check your state's current hunting and fishing regulations before heading out. Your state wildlife agency is the definitive source.</p>
        </div>
        <button onClick={onBack} className="btn-primary" style={{ marginTop: 36, padding: "14px 32px", fontSize: 15 }}>← Back to Ravlin</button>
      </div>
    </div>
  );
}

// ─── HEATMAP LANDING ──────────────────────────────────────────────────────────
function HeatmapLanding({ onReady }) {
  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

  useEffect(() => {
    if (!mapRef.current || mapInst.current) return;
    if (!document.querySelector('link[href*="mapbox-gl"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://api.mapbox.com/mapbox-gl-js/v3.0.0/mapbox-gl.css";
      document.head.appendChild(link);
    }
    import("mapbox-gl").then(async ({ default: mapboxgl }) => {
      mapboxgl.accessToken = MAPBOX_TOKEN;
      const map = new mapboxgl.Map({
        container: mapRef.current,
        style: "mapbox://styles/mapbox/satellite-streets-v12",
        center: [-98, 30],
        zoom: window.innerWidth < 640 ? 2.2 : 3.3,
        interactive: false,
        attributionControl: true,
      });
      map.on("load", async () => {
        mapInst.current = map;
        const [{ data: postData }, { data: seedData }] = await Promise.all([
          supabase.from("posts").select("lat, lng").not("lat", "is", null).not("lng", "is", null),
          supabase.from("seed_hotspots").select("lat, lng"),
        ]);
        const combined = [...(postData || []), ...(seedData || [])];
        if (!combined.length) { onReady?.(); return; }
        map.addSource("hotspots", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: combined.map(p => ({ type: "Feature", geometry: { type: "Point", coordinates: [p.lng, p.lat] } }))
          }
        });
        map.addLayer({
          id: "hotspots-glow-outer",
          type: "circle",
          source: "hotspots",
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 2, 10, 6, 20],
            "circle-color": "#ff4422",
            "circle-opacity": 0.18,
            "circle-blur": 0.6,
            "circle-stroke-width": 0,
          }
        });
        map.addLayer({
          id: "hotspots-glow",
          type: "circle",
          source: "hotspots",
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 2, 4, 6, 10],
            "circle-color": "#ff2200",
            "circle-opacity": 1,
            "circle-blur": 0,
            "circle-stroke-width": 1.5,
            "circle-stroke-color": "#ff6644",
            "circle-stroke-opacity": 1,
          }
        });
        onReady?.();
      });
    });
    return () => { if (mapInst.current) { mapInst.current.remove(); mapInst.current = null; } };
  }, []);

  return <div ref={mapRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />;
}

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────
function LandingPage({ onStart, onSignIn, selectedState, setSelectedState, onTerms }) {
  const { openSignIn } = useClerk();

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS] = useState(() => /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.navigator.standalone);
  const [isInstalled] = useState(() => window.navigator.standalone === true);

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    }
  };

  return (
    <div style={{ minHeight: "100dvh", fontFamily: "var(--font-body)", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "fixed", inset: 0, backgroundImage: `url(/bg.jpg)`, backgroundSize: "cover", backgroundPosition: "center 30%", backgroundRepeat: "no-repeat", zIndex: 0 }} />
      <div style={{ position: "fixed", inset: 0, background: "linear-gradient(to bottom, rgba(5,10,5,0.0) 0%, rgba(5,10,5,0.15) 40%, rgba(5,10,5,0.75) 100%)", zIndex: 1 }} />

      <div style={{ position: "relative", zIndex: 2, minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px 80px", textAlign: "center" }}>
        <div style={{ background: "rgba(5,10,5,0.25)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.12)", borderTop: "1px solid rgba(255,255,255,0.2)", borderRadius: 28, padding: "40px 32px 32px", width: "100%", maxWidth: 380, position: "relative", overflow: "hidden" }}>
          <img src="/badge1.png" style={{ width: "100%", height: "100%", objectFit: "contain", opacity: 0.16, position: "absolute", top: "30%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 0, pointerEvents: "none" }} />
          <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 8, zIndex: 1 }}>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(42px,8vw,64px)", fontWeight: 700, lineHeight: 1.0, color: "white", letterSpacing: "0.02em", marginBottom: 8 }}>Ravlin</h1>
            <p style={{ color: "rgba(238,245,232,0.6)", fontSize: 13, lineHeight: 1.5, marginBottom: 12, fontFamily: "var(--font-display)", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" }}>Hunt. Fish. Connect.</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button onClick={() => openSignIn()} style={{ padding: "15px 32px", fontSize: 16, fontWeight: 700, borderRadius: 14, background: "linear-gradient(135deg, #3a7020, #2d5a1a)", border: "1px solid rgba(120,180,80,0.5)", color: "white", cursor: "pointer", fontFamily: "var(--font-body)", boxShadow: "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(120,180,80,0.2)", transition: "transform 0.15s, box-shadow 0.15s" }} onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(60,140,30,0.5)"; }} onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.4)"; }} onMouseDown={e => e.currentTarget.style.transform = "scale(0.96)"} onMouseUp={e => e.currentTarget.style.transform = "translateY(-2px)"} onTouchStart={e => e.currentTarget.style.transform = "scale(0.96)"} onTouchEnd={e => { const el = e.currentTarget; el.style.transform = "scale(1.02)"; setTimeout(() => { if (el) el.style.transform = "scale(1)"; }, 150); }}>Sign In / Sign Up</button>

          </div>
          <button onClick={onTerms} style={{ background: "none", border: "none", color: "rgba(238,245,232,0.15)", fontSize: 11, cursor: "pointer", fontFamily: "var(--font-body)", marginTop: 16 }}>Terms & Conditions</button>
        </div>
      </div>
    </div>
  );
}

// ─── GLOBAL CHAT TAB ──────────────────────────────────────────────────────────
function GlobalChatTab({ user, openSignIn }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("global_chat").select("*, profiles(username, avatar_url)").order("created_at", { ascending: true }).limit(100);
      setMessages(data || []);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    };
    load();
    const sub = supabase.channel("global_chat").on("postgres_changes", { event: "INSERT", schema: "public", table: "global_chat" }, async payload => {
      const { data } = await supabase.from("profiles").select("username, avatar_url").eq("user_id", payload.new.user_id).single();
      setMessages(prev => [...prev, { ...payload.new, profiles: data }]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }).subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  const send = async () => {
    if (!user) { openSignIn(); return; }
    if (!input.trim() || sending) return;
    setSending(true);
    await supabase.from("global_chat").insert({ user_id: user.id, message: input.trim() });
    setInput("");
    setSending(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100dvh - 160px)" }}>
      <div style={{ padding: "12px 16px 6px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text)", fontFamily: "var(--font-display)" }}>Global Chat</div>
        <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>Chat with hunters & anglers across Ravlin</div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.map(msg => {
          const isMe = user && msg.user_id === user.id;
          return (
            <div key={msg.id} style={{ display: "flex", gap: 8, alignItems: "flex-start", flexDirection: isMe ? "row-reverse" : "row" }}>
              {!isMe && <div style={{ width: 30, height: 30, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "var(--card)" }}>
                {msg.profiles?.avatar_url ? <img src={msg.profiles.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "var(--text3)" }}>{capName(msg.profiles?.username || "?")[0]}</div>}
              </div>}
              <div style={{ maxWidth: "70%" }}>
                {!isMe && <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 2, fontWeight: 600 }}>{capName(msg.profiles?.username || "Hunter")}</div>}
                <div style={{ background: isMe ? "linear-gradient(135deg, #2d5a1b, #1e4010)" : "var(--card)", border: `1px solid ${isMe ? "rgba(120,180,80,0.3)" : "var(--border)"}`, borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px", padding: "8px 12px", fontSize: 14, color: "var(--text)", lineHeight: 1.5 }}>{msg.message}</div>
                <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 3, textAlign: isMe ? "right" : "left" }}>{new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: "10px 16px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, alignItems: "center" }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder={user ? "Say something..." : "Sign in to chat"}
          style={{ flex: 1, padding: "10px 14px", borderRadius: 20, fontSize: 14, background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)", fontFamily: "var(--font-body)", outline: "none" }}
        />
        <button onClick={send} disabled={!input.trim() || sending} style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg, #3a7020, #2d5a1a)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: !input.trim() ? 0.4 : 1, transition: "opacity 0.2s" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
        </button>
      </div>
    </div>
  );
}

// ─── CHAT PAGE ────────────────────────────────────────────────────────────────
function OnboardingPage({ user, onComplete, setSelectedState }) {
  const [step, setStep] = useState(1);
  const [state, setState] = useState("");

  const [stateOpen, setStateOpen] = useState(false);
  const [stateSearch, setStateSearch] = useState("");
  const [interests, setInterests] = useState("both");
  const [following, setFollowing] = useState(new Set());
  const [suggestedUsers, setSuggestedUsers] = useState([]);

  useEffect(() => {
    supabase.from("profiles").select("user_id, username, avatar_url, bio").neq("user_id", user.id).limit(12).then(({ data }) => {
      const blocked = ["example", "test", "user_342", "admin", "user"];
      const adminId = "user_3CKoCuA9KUvrtfrJ3ia3Bm2BH1a";
      setSuggestedUsers((data || []).filter(u => u.username && u.user_id !== adminId && !blocked.includes(u.username.toLowerCase()) && !u.username.toLowerCase().startsWith("user_")).slice(0, 6));
    });
  }, []);

  const complete = async () => {
    await supabase.from("profiles").update({ onboarding_complete: true, interests, selected_state: state || null }).eq("user_id", user.id);
    if (state) setSelectedState(state);
    for (const uid of following) {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: uid }).catch(() => { });
    }
    onComplete();
  };

  const US_STATES = ["Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"];

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
          {[1, 2, 3].map(s => <div key={s} style={{ flex: 1, height: 3, borderRadius: 4, background: step >= s ? "var(--green)" : "var(--border)", transition: "background 0.3s" }} />)}
        </div>

        {step === 1 && (
          <div className="fade-in">
            <div style={{ marginBottom: 16 }}><img src="/logo.png" style={{ width: 176, height: 176, objectFit: "contain" }} /></div>
            <div style={{ color: "var(--text)", fontWeight: 800, fontSize: 24, marginBottom: 8 }}>Welcome to Ravlin</div>
            <div style={{ color: "var(--text2)", fontSize: 15, marginBottom: 32, lineHeight: 1.5 }}>Let's personalize your experience. What do you primarily do?</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                ["hunting", "Hunting", <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="22" x2="18" y1="12" y2="12" /><line x1="6" x2="2" y1="12" y2="12" /><line x1="12" x2="12" y1="6" y2="2" /><line x1="12" x2="12" y1="22" y2="18" /></svg>],
                ["fishing", "Fishing", <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><path d="m17.586 11.414-5.93 5.93a1 1 0 0 1-8-8l3.137-3.137a.707.707 0 0 1 1.207.5V10" /><path d="M20.414 8.586 22 7" /><circle cx="19" cy="10" r="2" /></svg>],
                ["both", "Both", <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>],
              ].map(([val, label, icon]) => (
                <button key={val} onClick={() => setInterests(val)} style={{ padding: "18px 20px", borderRadius: 14, border: `2px solid ${interests === val ? "var(--green)" : "var(--border)"}`, background: interests === val ? "rgba(120,180,80,0.12)" : "var(--card)", color: interests === val ? "var(--green)" : "var(--text)", fontSize: 16, fontWeight: 700, cursor: "pointer", textAlign: "left", fontFamily: "var(--font-body)", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 14 }}>
                  {icon}{label}
                  {interests === val && <svg style={{ marginLeft: "auto" }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                </button>
              ))}
            </div>
            <button onClick={() => setStep(2)} style={{ width: "100%", padding: "17px", marginTop: 24, fontSize: 16, fontWeight: 700, borderRadius: 14, background: "linear-gradient(135deg, #78b450, #4a8a2a)", border: "none", color: "white", cursor: "pointer", fontFamily: "var(--font-body)", boxShadow: "0 4px 20px rgba(120,180,80,0.35)", transition: "transform 0.15s, box-shadow 0.15s" }} onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(120,180,80,0.45)"; }} onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(120,180,80,0.35)"; }} onMouseDown={e => e.currentTarget.style.transform = "scale(0.97)"} onMouseUp={e => e.currentTarget.style.transform = "translateY(-2px)"} onTouchStart={e => e.currentTarget.style.transform = "scale(0.97)"} onTouchEnd={e => { const el = e.currentTarget; el.style.transform = "scale(1.02)"; setTimeout(() => { if (el) el.style.transform = "scale(1)"; }, 150); }}>Continue →</button>
          </div>
        )}

        {step === 2 && (
          <div className="fade-in">
            <div style={{ marginBottom: 8 }}><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg></div>
            <div style={{ color: "var(--text)", fontWeight: 800, fontSize: 24, marginBottom: 8 }}>Where do you hunt or fish?</div>
            <div style={{ color: "var(--text2)", fontSize: 15, marginBottom: 24, lineHeight: 1.5 }}>We'll use this for regulations, weather and local content.</div>
            <div style={{ position: "relative", marginBottom: 24 }}>
              {window.matchMedia("(hover: hover)").matches ? (
                <>
                  <input value={stateSearch || state} onChange={e => { setState(""); setStateSearch(e.target.value); setStateOpen(true); }} onFocus={() => { if (state) setStateSearch(state); setStateOpen(true); }} onBlur={() => setTimeout(() => setStateOpen(false), 150)} placeholder="Search your state..." style={{ width: "100%", padding: "14px 16px", borderRadius: stateOpen ? "14px 14px 0 0" : 14, border: `2px solid ${state ? "var(--border-accent)" : "var(--border)"}`, background: "#0d1a0d", color: "var(--text)", fontSize: 15, fontFamily: "var(--font-body)", outline: "none", boxSizing: "border-box" }} />
                  {stateOpen && (
                    <div style={{ background: "#0d1a0d", border: "2px solid var(--border)", borderTop: "1px solid rgba(255,255,255,0.06)", borderRadius: "0 0 14px 14px", maxHeight: 220, overflowY: "auto", position: "absolute", width: "100%", zIndex: 10 }}>
                      {US_STATES.filter(s => s.toLowerCase().includes((stateSearch || "").toLowerCase())).map(s => (
                        <div key={s} onClick={() => { setState(s); setStateSearch(""); setStateOpen(false); }} style={{ padding: "12px 16px", cursor: "pointer", color: "var(--text)", fontSize: 15, borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.15s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(120,180,80,0.08)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>{s}</div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div onClick={() => setStateOpen(o => !o)} style={{ width: "100%", padding: "14px 16px", borderRadius: stateOpen ? "14px 14px 0 0" : 14, border: `2px solid ${state ? "var(--border-accent)" : "var(--border)"}`, background: "#0d1a0d", color: state ? "var(--text)" : "var(--text3)", fontSize: 15, fontFamily: "var(--font-body)", boxSizing: "border-box", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    {state || "Select your state..."}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points={stateOpen ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} /></svg>
                  </div>
                  {stateOpen && (
                    <div style={{ background: "#0d1a0d", border: "2px solid var(--border)", borderTop: "1px solid rgba(255,255,255,0.06)", borderRadius: "0 0 14px 14px", maxHeight: 220, overflowY: "auto", position: "absolute", width: "100%", zIndex: 10 }}>
                      {US_STATES.map(s => (
                        <div key={s} onClick={() => { setState(s); setStateOpen(false); }} style={{ padding: "12px 16px", cursor: "pointer", color: "var(--text)", fontSize: 15, borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.15s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(120,180,80,0.08)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>{s}</div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
            <div style={{ color: "var(--text3)", fontSize: 12, textAlign: "center", marginBottom: 16 }}>You can change this anytime in settings</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStep(1)} style={{ flex: 1, padding: "17px", borderRadius: 14, border: "1px solid var(--border)", background: "var(--card)", color: "var(--text2)", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)", transition: "transform 0.15s", boxShadow: "none" }} onMouseDown={e => e.currentTarget.style.transform = "scale(0.97)"} onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}>← Back</button>
              <button disabled={!state} onClick={() => setStep(3)} style={{ flex: 2, padding: "17px", borderRadius: 14, background: state ? "linear-gradient(135deg, #78b450, #4a8a2a)" : "rgba(255,255,255,0.06)", border: "none", color: state ? "white" : "var(--text3)", fontSize: 16, fontWeight: 700, cursor: state ? "pointer" : "default", fontFamily: "var(--font-body)", boxShadow: state ? "0 4px 20px rgba(120,180,80,0.35)" : "none", transition: "transform 0.15s, box-shadow 0.15s" }} onMouseEnter={e => { if (!state) return; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(120,180,80,0.45)"; }} onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = state ? "0 4px 20px rgba(120,180,80,0.35)" : "none"; }} onMouseDown={e => { if (state) e.currentTarget.style.transform = "scale(0.97)"; }} onMouseUp={e => { if (state) e.currentTarget.style.transform = "translateY(-2px)"; }} onTouchStart={e => { if (state) e.currentTarget.style.transform = "scale(0.97)"; }} onTouchEnd={e => { if (!state) return; const el = e.currentTarget; el.style.transform = "scale(1.02)"; setTimeout(() => { if (el) el.style.transform = "scale(1)"; }, 150); }}>Continue →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="fade-in">
            <div style={{ marginBottom: 8 }}><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg></div>
            <div style={{ color: "var(--text)", fontWeight: 800, fontSize: 24, marginBottom: 8 }}>Follow some people</div>
            <div style={{ color: "var(--text2)", fontSize: 15, marginBottom: 24, lineHeight: 1.5 }}>Follow a few people to fill your feed with posts.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {suggestedUsers.map(u => (
                <div key={u.user_id} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--card)", border: `1px solid ${following.has(u.user_id) ? "var(--border-accent)" : "var(--border)"}`, borderRadius: 14, padding: "12px 14px" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--green-dim)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "var(--green)", flexShrink: 0 }}>
                    {u.avatar_url ? <img src={u.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : u.username[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 14 }}>{capName(u.username)}</div>

                  </div>
                  <button onClick={() => setFollowing(prev => { const n = new Set(prev); n.has(u.user_id) ? n.delete(u.user_id) : n.add(u.user_id); return n; })} style={{ padding: "7px 14px", borderRadius: 20, border: `1px solid ${following.has(u.user_id) ? "var(--border-accent)" : "var(--border)"}`, background: following.has(u.user_id) ? "rgba(120,180,80,0.12)" : "var(--card)", color: following.has(u.user_id) ? "var(--green)" : "var(--text2)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)", flexShrink: 0 }}>{following.has(u.user_id) ? "Following" : "Follow"}</button>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStep(2)} style={{ flex: 1, padding: "17px", borderRadius: 14, border: "1px solid var(--border)", background: "var(--card)", color: "var(--text2)", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)", transition: "transform 0.15s" }} onMouseDown={e => e.currentTarget.style.transform = "scale(0.97)"} onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}>← Back</button>
              <button onClick={complete} style={{ flex: 2, padding: "17px", borderRadius: 14, background: "linear-gradient(135deg, #78b450, #4a8a2a)", border: "none", color: "white", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)", boxShadow: "0 4px 20px rgba(120,180,80,0.35)", transition: "transform 0.15s, box-shadow 0.15s" }} onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(120,180,80,0.45)"; }} onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(120,180,80,0.35)"; }} onMouseDown={e => e.currentTarget.style.transform = "scale(0.97)"} onMouseUp={e => e.currentTarget.style.transform = "translateY(-2px)"} onTouchStart={e => e.currentTarget.style.transform = "scale(0.97)"} onTouchEnd={e => { const el = e.currentTarget; el.style.transform = "scale(1.02)"; setTimeout(() => { if (el) el.style.transform = "scale(1)"; }, 150); }}>Let's go!</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ChatPage({ onBack, messageCount, setMessageCount, selectedState, setSelectedState, onTerms, messagesUnread, setMessagesUnread, notifUnread, setNotifUnread }) {
  const [tab, setTab] = useState("community");
  const [weather, setWeather] = useState(null);
  const [locationName, setLocationName] = useState("");

  useEffect(() => {
    let lat, lon;
    const fetchWeather = async () => {
      if (!lat || !lon) return;
      try {
        const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,precipitation&wind_speed_unit=mph&temperature_unit=fahrenheit&timezone=auto`);
        const d = await r.json();
        if (d.current) setWeather({ ...d.current, lat, lng: lon });
      } catch { }
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        lat = pos.coords.latitude;
        lon = pos.coords.longitude;
        try {
          const geo = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
          const geoData = await geo.json();
          const city = geoData.address?.city || geoData.address?.town || geoData.address?.village || "Your Location";
          const stateAbbr = { "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR", "California": "CA", "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE", "Florida": "FL", "Georgia": "GA", "Hawaii": "HI", "Idaho": "ID", "Illinois": "IL", "Indiana": "IN", "Iowa": "IA", "Kansas": "KS", "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD", "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN", "Mississippi": "MS", "Missouri": "MO", "Montana": "MT", "Nebraska": "NE", "Nevada": "NV", "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH", "Oklahoma": "OK", "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC", "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX", "Utah": "UT", "Vermont": "VT", "Virginia": "VA", "Washington": "WA", "West Virginia": "WV", "Wisconsin": "WI", "Wyoming": "WY" };
          const abbr = stateAbbr[geoData.address?.state] || "";
          const name = abbr ? `${city}, ${abbr}` : city;
          setLocationName(name);
          const detectedState = geoData.address?.state;
          if (detectedState) setGpsState(detectedState);
          if (detectedState && STATES.includes(detectedState) && !selectedState) {
            setSelectedState(detectedState);
          } else if (detectedState && selectedState && detectedState !== selectedState) {
            setShowLocationPrompt(true);
          }
          await fetchWeather();
        } catch { }
      });
    }
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  const [locationPreference, setLocationPreference] = useState(null); // "gps" or "state"
  const [botStatus, setBotStatus] = useState("online");
  const [gpsState, setGpsState] = useState("");
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: `Hey, I'm Ravlin — your hunting and fishing assistant${selectedState ? ` for ${selectedState}` : ""}. Ask me anything about gear, tactics, seasons, regulations, or trip planning. If you want location-specific advice, make sure your location is set in the Weather tab. What are you after?`, animate: false },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [checkedItems, setCheckedItems] = useState({});
  const [speciesFilter, setSpeciesFilter] = useState("all");
  const [showMore, setShowMore] = useState(false);
  const [stateSpecies, setStateSpecies] = useState([]);
  const [loadingStateSpecies, setLoadingStateSpecies] = useState(false);
  const speciesTabCache = useRef({});
  const bottomRef = useRef(null);
  const { user, isLoaded } = useUser();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [billingPlan, setBillingPlan] = useState("monthly");
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const { openSignIn } = useClerk();
  useEffect(() => { window._triggerSignIn = openSignIn; return () => { window._triggerSignIn = null; }; }, [openSignIn]);

  const isPro = user?.publicMetadata?.isPro === true;
  const hitLimit = !isPro && messageCount >= FREE_LIMIT;

  useEffect(() => {
    if (selectedState && gpsState) {
      if (gpsState !== selectedState) { setLocationPreference(null); setShowLocationPrompt(true); }
      else { setShowLocationPrompt(false); }
    }
  }, [selectedState]);

  useEffect(() => {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.navigator.standalone;
    setIsIOS(ios);
    if (ios) { setShowInstallBanner(true); return; }
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); setShowInstallBanner(true); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    }
  };

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  useEffect(() => {
    if (!user || isPro) return;
    const loadCount = async () => {
      const { data } = await supabase.from("message_counts").select("count, updated_at").eq("user_id", user.id).maybeSingle();
      if (data) {
        const lastUpdate = new Date(data.updated_at);
        const now = new Date();
        if (lastUpdate.getMonth() !== now.getMonth() || lastUpdate.getFullYear() !== now.getFullYear()) {
          await supabase.from("message_counts").upsert({ user_id: user.id, count: 0, updated_at: now.toISOString() });
          setMessageCount(0);
          localStorage.setItem("wildai_message_count", 0);
        } else {
          setMessageCount(data.count);
        }
      }
    };
    loadCount();
  }, [user]);

  const sendMessage = async (text) => {
    const msg = text || input;
    if (!msg.trim() || hitLimit) return;
    const newMsgs = [...messages, { role: "user", content: msg, animate: false }];
    setMessages(newMsgs); setInput(""); setLoading(true);
    const newCount = messageCount + 1;
    setMessageCount(newCount);
    localStorage.setItem("wildai_message_count", newCount);
    if (user) {
      supabase.from("message_counts").upsert({ user_id: user.id, count: newCount, updated_at: new Date().toISOString() });
    }
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
    const system = `You are Ravlin, an expert hunting and fishing assistant${selectedState ? ` specializing in ${selectedState}` : ""}. Deep knowledge of hunting tactics, fishing techniques, gear, wildlife behavior, seasons, regulations${selectedState ? ` specific to ${selectedState}` : " across US states"}, trip planning, and public land navigation. Give practical, specific, confident advice like a seasoned outdoorsman. Use **bold** for key terms. Keep responses concise and useful. Never use hashtags or markdown headers (# symbols). Never use bullet point symbols like • or -. Remind users to verify regulations with their state agency when relevant.If a user asks about canceling their subscription or managing billing, tell them to click their profile avatar in the top right corner of the app and select "Manage Subscription".

CURRENT CONTEXT (use this for accurate seasonal and timing advice):
- Today's date: ${now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
- Time of day: ${timeOfDay}
- Current moon phase: ${moonPhase()}
- User's selected state (for regulations/seasons): ${selectedState || "not specified"}
- User's GPS location (physical location right now): ${locationName || "not detected"}
- User's location preference: ${locationPreference === "gps" ? `User chose GPS — use ${locationName} for ALL advice` : locationPreference === "state" ? `User chose selected state — use ${selectedState} for ALL advice` : "Not chosen yet — use selected state for regulations, GPS for weather only. Do NOT mix them."}
- Season: ${["Winter", "Winter", "Spring", "Spring", "Spring", "Summer", "Summer", "Summer", "Fall", "Fall", "Fall", "Winter"][now.getMonth()]}${weather && locationName ? `\n- Current weather at ${locationName}: ${Math.round(weather.temperature_2m)}°F, wind ${Math.round(weather.wind_speed_10m)}mph, precip ${weather.precipitation}"` : `\n- Current weather: not loaded. If the user asks about current conditions, tell them to enter a location in the Weather tab and then come back to chat.`}`;
    try {
      const res = await fetch("https://wildai-server.onrender.com/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMsgs.map(m => ({ role: m.role, content: m.content })), system })
      });
      const d = await res.json();
      setBotStatus("online");
      setMessages([...newMsgs, { role: "assistant", content: d.reply, animate: true }]);
    } catch {
      setBotStatus("offline");
      setMessages([...newMsgs, { role: "assistant", content: "Sorry, I had trouble connecting. Please try again.", animate: false }]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!selectedState) return;
    const cacheKey = selectedState;
    if (speciesTabCache.current[cacheKey]) {
      setStateSpecies(speciesTabCache.current[cacheKey]);
      return;
    }
    setLoadingStateSpecies(true);
    const loadSpecies = async () => {
      try {
        // Check Supabase cache first
        const { data: cached } = await supabase.from("species_cache").select("species").eq("state", selectedState).single();
        if (cached) {
          setStateSpecies(cached.species);
          speciesTabCache.current[cacheKey] = cached.species;
          setLoadingStateSpecies(false);
          return;
        }
        // Not cached — call API
        const res = await fetch("https://wildai-server.onrender.com/chat", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [{ role: "user", content: `Return ONLY a JSON array of objects for the 30 most commonly hunted and fished species in ${selectedState}. Each object must have: name (string), type ("hunting" or "fishing"), desc (string, max 5 words). Do NOT include any emoji characters. No markdown, no explanation, just the JSON array.` }], system: "Return only a valid JSON array. No emoji. No markdown. No explanation." })
        });
        const d = await res.json();
        const text = d.reply.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(text);
        setStateSpecies(parsed);
        speciesTabCache.current[cacheKey] = parsed;
        // Save to Supabase cache
        await supabase.from("species_cache").insert({ state: selectedState, species: parsed });
      } catch {
        setStateSpecies([]);
      }
      setLoadingStateSpecies(false);
    };
    loadSpecies();
  }, [selectedState]);
  const toggleCheck = (cl, item) => {
    const k = `${cl}::${item}`;
    setCheckedItems(p => ({ ...p, [k]: !p[k] }));
  };


  const filteredSpecies = speciesFilter === "all" ? SPECIES : SPECIES.filter(s => s.type === speciesFilter);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", fontFamily: "var(--font-body)" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
      </div>

      <header style={{ borderBottom: "1px solid rgba(120,180,80,0.1)", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", backdropFilter: "blur(24px)", background: "rgba(5,10,5,0.88)", position: "sticky", top: 0, zIndex: 50, boxShadow: "0 4px 24px rgba(0,0,0,0.3), 0 1px 0 rgba(120,180,80,0.08)", overflow: "visible" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>

          <div className="mobile-header-center" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <img src="/logo.png" className="mobile-header-logo-img" style={{ width: 56, height: 56, objectFit: "contain", mixBlendMode: "screen" }} />
            <span className="mobile-header-logo" style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: "var(--text)", marginLeft: -6 }}>Ravlin</span>
            <select className="mobile-state-select" value={selectedState} onChange={e => setSelectedState && setSelectedState(e.target.value)} style={{ background: "transparent", border: "none", color: selectedState ? "var(--text3)" : "var(--text3)", fontSize: 13, cursor: "pointer", fontFamily: "var(--font-body)", outline: "none", maxWidth: 120 }}>
              <option value="">· State</option>
              {STATES.map(s => <option key={s} value={s} style={{ background: "#0a150a" }}>· {s}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

            {isPro ? (
              <div className="mobile-header-badge" style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: "var(--green-dim)", border: "1px solid var(--border-accent)", color: "var(--green)" }}>Pro ✓</div>
            ) : (
              <button onClick={async () => { if (!user) { openSignIn(); return; } setCheckoutLoading(true); const res = await fetch("https://wildai-server.onrender.com/create-checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user?.id, plan: billingPlan }) }); const data = await res.json(); if (data.url) window.location.href = data.url; setCheckoutLoading(false); }} className="btn-gold mobile-header-badge" style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12 }}>
                {checkoutLoading ? "..." : "Go Pro"}
              </button>
            )}
          </div>
          {!user ? (
            <button onClick={() => openSignIn()} className="btn-primary" style={{ padding: "7px 14px", fontSize: 13 }}>Sign In</button>
          ) : (
            <div style={{ borderRadius: "50%", outline: "2.5px solid var(--green)", outlineOffset: "1px", boxShadow: "0 0 10px rgba(139,195,74,0.25)", display: "inline-flex", lineHeight: 0 }}>
              <UserButton afterSignOutUrl="https://wildai.netlify.app">
                <UserButton.MenuItems>
                  <UserButton.Action
                    label="Manage Subscription"
                    labelIcon={<span>💳</span>}
                    onClick={async () => {
                      const customerId = user?.publicMetadata?.stripeCustomerId;
                      const res = await fetch("https://wildai-server.onrender.com/customer-portal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customerId }) });
                      const data = await res.json();
                      if (data.url) window.location.href = data.url;
                    }}
                  />
                </UserButton.MenuItems>
              </UserButton>
            </div>
          )}
        </div>
      </header>

      {/* BOTTOM NAV */}
      <div className="bottom-nav" style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100, background: "rgba(5,10,5,0.92)", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "stretch", height: 64, backdropFilter: "blur(24px)", boxShadow: "0 -4px 24px rgba(0,0,0,0.4), 0 -1px 0 rgba(120,180,80,0.08)" }}>
        {(() => {
          const tabs = ["community", "map", "chat", "more"];
          const activeIndex = tabs.indexOf(tab);
          return <>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, pointerEvents: "none" }}>
              <div style={{ position: "absolute", top: 0, height: 2, width: 28, borderRadius: "0 0 2px 2px", background: "var(--green)", boxShadow: "0 0 8px rgba(120,180,80,0.9)", left: `calc(${activeIndex} * 25% + 12.5% - 14px)`, transition: "left 0.25s cubic-bezier(0.4, 0, 0.2, 1)" }} />
            </div>
            <div style={{ display: "flex", flex: 1 }}>
              {[
                { id: "community", label: "Community", svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg> },
                { id: "map", label: "Map", svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" /><line x1="9" y1="3" x2="9" y2="18" /><line x1="15" y1="6" x2="15" y2="21" /></svg> },
                { id: "chat", label: "Chat", svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg> },
                { id: "more", label: "More", svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg> },
              ].map(t => (
                <button key={t.id} onClick={() => { setTab(t.id); setShowMore(false); if (t.id === "map" && !sessionStorage.getItem("ravlin_map_privacy_seen")) { window._showMapPrivacy?.(); } }} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, background: "none", border: "none", cursor: "pointer", color: tab === t.id ? "var(--green)" : "var(--text3)", transition: "color 0.2s" }}>
                  <div style={{ position: "relative" }}>
                    {t.svg}
                    {t.id === "community" && (messagesUnread + notifUnread) > 0 && (
                      <div style={{ position: "absolute", top: -3, right: -3, background: "#f43f5e", borderRadius: "50%", minWidth: 13, height: 13, fontSize: 8, fontWeight: 700, color: "white", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 2px" }}>
                        {(messagesUnread + notifUnread) > 9 ? "9+" : messagesUnread + notifUnread}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.04em" }}>{t.label}</span>
                </button>
              ))}
            </div>
          </>;
        })()}
      </div>



      <div style={{ flex: 1, padding: 20, paddingBottom: 80, maxWidth: 760, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: 16, position: "relative" }}>

        {showInstallBanner && !window.navigator.standalone && (
          <div style={{ background: "linear-gradient(135deg, rgba(120,180,80,0.12), rgba(80,140,50,0.08))", border: "1px solid var(--border-accent)", borderRadius: "var(--radius)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>📲</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: "var(--text)", fontWeight: 600, fontSize: 13 }}>Add Ravlin to your home screen</div>
              {isIOS
                ? <div style={{ color: "var(--text3)", fontSize: 11, marginTop: 2 }}>Tap <strong style={{ color: "var(--text2)" }}>Share ⬆</strong> → <strong style={{ color: "var(--text2)" }}>Add to Home Screen</strong></div>
                : <div style={{ color: "var(--text3)", fontSize: 11, marginTop: 2 }}>Install for the best experience</div>}
            </div>
            {!isIOS && <button onClick={handleInstall} className="btn-primary" style={{ padding: "6px 14px", fontSize: 12, flexShrink: 0 }}>Install</button>}
            <button onClick={() => setShowInstallBanner(false)} style={{ background: "none", border: "none", color: "var(--text3)", cursor: "pointer", fontSize: 16, padding: 0, flexShrink: 0 }}>✕</button>
          </div>
        )}



        {/* CHAT */}
        {tab === "chat" && (
          <>
            {showLocationPrompt && locationPreference === null && (
              <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
                <div className="fade-in" style={{ background: "linear-gradient(160deg, #0d1a0d, #080c08)", border: "1px solid #1c2a1c", borderRadius: 20, padding: 24, maxWidth: 340, width: "100%" }}>
                  <div style={{ fontSize: 32, textAlign: "center", marginBottom: 12 }}>📍</div>
                  <div style={{ color: "white", fontWeight: 800, fontSize: 16, textAlign: "center", marginBottom: 8 }}>Which location should I use?</div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, textAlign: "center", lineHeight: 1.6, marginBottom: 20 }}>
                    You're in <strong style={{ color: "white" }}>{locationName}</strong> but your selected state is <strong style={{ color: "var(--green)" }}>{selectedState}</strong>. Which should I base my advice on?
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <button onClick={() => { setLocationPreference("gps"); setShowLocationPrompt(false); }} style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(74,170,200,0.15)", border: "1px solid rgba(74,170,200,0.3)", color: "rgba(74,170,200,0.9)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)", transition: "transform 0.15s, box-shadow 0.15s" }} onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(74,170,200,0.25)"; }} onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
                      📍 My Current Location ({locationName})
                    </button>
                    <button onClick={() => { setLocationPreference("state"); setShowLocationPrompt(false); }} style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(120,180,80,0.15)", border: "1px solid rgba(120,180,80,0.3)", color: "var(--green)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)", transition: "transform 0.15s, box-shadow 0.15s" }} onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(120,180,80,0.25)"; }} onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
                      🗺️ Selected State ({selectedState})
                    </button>

                  </div>
                </div>
              </div>
            )}
            {weather && (
              <div onClick={() => setTab("weather")} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "linear-gradient(135deg, #0d160d, #111a11)", border: "1px solid #1c2c1c", borderRadius: 16, cursor: "pointer" }}>
                <div style={{ width: 36, height: 36, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "rgba(109,186,74,0.12)", border: "1px solid rgba(109,186,74,0.2)" }}>
                  <span style={{ fontSize: 18 }}>{weather.weather_code === 0 ? "☀️" : weather.weather_code <= 3 ? "⛅" : weather.weather_code <= 48 ? "🌫️" : weather.weather_code <= 67 ? "🌧️" : weather.weather_code <= 77 ? "❄️" : "⛈️"}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "white", fontSize: 13, fontWeight: 700 }}>{Math.round(weather.temperature_2m)}°F</span>
                    <span style={{ color: "#4a6a4a", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4a6a4a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>{locationName}</span>
                  </div>
                  <span style={{ color: "#6dba4a", fontSize: 11, fontWeight: 600, marginTop: 2 }}>
                    {weather.weather_code === 0 ? "Clear" : weather.weather_code <= 3 ? "Partly cloudy" : weather.weather_code <= 48 ? "Foggy" : weather.weather_code <= 67 ? "Rain" : weather.weather_code <= 77 ? "Snow" : "Showers"} · {Math.round(weather.wind_speed_10m)} mph
                  </span>
                </div>
                <div style={{ marginLeft: "auto", background: "rgba(109,186,74,0.1)", border: "1px solid rgba(109,186,74,0.15)", borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(109,186,74,0.7)" }}>LIVE</div>
              </div>
            )}
            <div className="fade-in" style={{ display: "flex", flexDirection: "column", overflow: "hidden", background: "linear-gradient(160deg, #0d140d 0%, #090d09 100%)", border: "1px solid #1a261a", borderRadius: 20, boxShadow: "0 24px 60px rgba(0,0,0,0.6)" }}>
              <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid #141e14", background: "rgba(0,0,0,0.2)" }}>
                <div style={{ width: 36, height: 36, borderRadius: 12, background: "linear-gradient(135deg, #78b450, #4a8a2a)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 16px rgba(120,180,80,0.3)" }}>
                  <img src="/chat.png" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: "50%" }} />
                </div>
                <div>
                  <div style={{ color: "white", fontWeight: 700, fontSize: 14 }}>Ravlin</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: botStatus === "online" ? "#4ade80" : "#f43f5e", boxShadow: botStatus === "online" ? "0 0 6px rgba(74,222,128,0.8)" : "0 0 6px rgba(244,63,94,0.8)" }} />
                    <span style={{ color: botStatus === "online" ? "#4a7a4a" : "#f43f5e", fontSize: 11 }}>{botStatus === "online" ? "Online" : "Not connected"}</span>
                  </div>
                </div>
              </div>
              <div style={{ overflowY: "auto", padding: "16px 14px", display: "flex", flexDirection: "column", gap: 12, minHeight: 300, maxHeight: "55vh" }}>
                {messages.map((m, i) => (
                  <div key={i} className="fade-in" style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", gap: 10, alignItems: "flex-end" }}>
                    {m.role === "assistant" && <img src="/chat.png" style={{ width: 36, height: 36, objectFit: "cover", borderRadius: "50%", flexShrink: 0 }} />}
                    <div style={{ background: m.role === "user" ? "linear-gradient(135deg,var(--green),var(--green2))" : "rgba(255,255,255,0.05)", border: m.role === "assistant" ? "1px solid var(--border)" : "none", color: "var(--text)", padding: "13px 17px", borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", maxWidth: "80%", boxShadow: m.role === "user" ? "0 4px 16px rgba(120,180,80,0.2)" : "none" }}>
                      {m.role === "assistant" && m.animate
                        ? <TypewriterText text={m.content} onDone={() => setMessages(prev => prev.map((msg, j) => j === i ? { ...msg, animate: false } : msg))} />
                        : fmtMsg(m.content)}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                    <img src="/chat.png" style={{ width: 36, height: 36, objectFit: "cover", borderRadius: "50%", flexShrink: 0 }} />
                    <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", padding: "13px 17px", borderRadius: "18px 18px 18px 4px" }}>
                      <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                        {[0, 1, 2].map(j => <div key={j} style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", animation: `pulse 1.2s ease-in-out ${j * 0.2}s infinite` }} />)}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
              {messages.length <= 2 && !hitLimit && (
                <div style={{ padding: "0 20px 16px", display: "flex", gap: 8, flexWrap: "wrap" }} className="hide-mobile">
                  {["Best fishing spots near me right now", "What should I be hunting this week?", "How's the weather for hunting today?", `What license do I need in ${selectedState || "my state"}?`].map((s, i) => (
                    <button key={i} onClick={() => sendMessage(s)} className="btn-ghost" style={{ padding: "7px 14px", fontSize: 12, borderRadius: 20 }}>{s}</button>
                  ))}
                </div>
              )}
              {hitLimit && (
                <div style={{ margin: "0 20px 20px", background: "linear-gradient(160deg, #0d1a0d 0%, #080c08 60%)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, overflow: "hidden", position: "relative" }}>
                  <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 260, height: 120, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(232,176,32,0.18) 0%, transparent 70%)", filter: "blur(20px)", pointerEvents: "none" }} />
                  <div style={{ position: "absolute", top: 20, right: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(232,176,32,0.12)", border: "1px solid rgba(232,176,32,0.3)", borderRadius: 20, padding: "4px 12px" }}>
                      <span style={{ color: "#e8b020", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em" }}>⚡ PRO</span>
                    </div>
                  </div>
                  <div style={{ padding: "32px 24px 20px", textAlign: "center" }}>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 26, color: "#f4f4f0", marginBottom: 8, lineHeight: 1.2, fontWeight: 900 }}>Every season.<br />Every state.<br /><span style={{ color: "#e8b020" }}>Every question.</span></div>
                    <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>You've used your 10 free messages —<br />Ravlin is clearly working for you 🎯</div>
                  </div>
                  <div style={{ margin: "0 24px 16px", height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)" }} />
                  <div style={{ padding: "0 20px 16px" }}>
                    {["Unlimited AI chat — no message limits", "Unlimited saved map pins", "AI trip planner", "Harvest log & season tracking", "State regulations & official season dates",].map((f, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                        <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(232,176,32,0.15)", border: "1px solid rgba(232,176,32,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <span style={{ color: "#e8b020", fontSize: 10, fontWeight: 700 }}>✓</span>
                        </div>
                        <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: "8px 20px 28px", textAlign: "center" }}>
                    <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 4, marginBottom: 20, border: "1px solid rgba(255,255,255,0.08)" }}>
                      <button onClick={() => setBillingPlan("monthly")} style={{ flex: 1, padding: "8px 0", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer", border: "none", transition: "all 0.2s", background: billingPlan === "monthly" ? "rgba(232,176,32,0.2)" : "transparent", color: billingPlan === "monthly" ? "#e8b020" : "rgba(255,255,255,0.35)" }}>Monthly</button>
                      <button onClick={() => setBillingPlan("annual")} style={{ flex: 1, padding: "8px 0", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer", border: "none", transition: "all 0.2s", background: billingPlan === "annual" ? "rgba(232,176,32,0.2)" : "transparent", color: billingPlan === "annual" ? "#e8b020" : "rgba(255,255,255,0.35)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>Annual <span style={{ background: "rgba(120,180,80,0.25)", color: "#78b450", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 6 }}>Save 44%</span></button>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 6, marginBottom: 4 }}>
                      <span style={{ color: "white", fontSize: 52, fontWeight: 900, fontFamily: "var(--font-display)", letterSpacing: "-2px", lineHeight: 1 }}>{billingPlan === "annual" ? "$19.99" : "$2.99"}</span>
                      <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 14, paddingBottom: 8 }}>/ {billingPlan === "annual" ? "year" : "month"}</span>
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, marginBottom: 16 }}>{billingPlan === "annual" ? "Just $1.67/mo · Best value" : "Less than a cup of coffee · Resets monthly"}</div>
                    <button className="btn-gold" style={{ width: "100%", padding: "16px", borderRadius: 14, fontSize: 15, fontWeight: 700, opacity: checkoutLoading ? 0.6 : 1, boxShadow: "0 8px 32px rgba(232,176,32,0.35)" }} disabled={checkoutLoading} onClick={async () => { if (!user) { openSignIn(); return; } setCheckoutLoading(true); const res = await fetch("https://wildai-server.onrender.com/create-checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user?.id, plan: billingPlan }) }); const data = await res.json(); if (data.url) window.location.href = data.url; setCheckoutLoading(false); }}>
                      {checkoutLoading ? "Loading..." : "Upgrade to Pro →"}
                    </button>
                    <div style={{ marginTop: 10, fontSize: 11, color: "rgba(255,255,255,0.18)" }}>Cancel anytime · Secure payment via Stripe</div>
                  </div>
                </div>
              )}
              {!hitLimit && (
                <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, alignItems: "center" }}>
                  <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()}
                    placeholder={`Ask anything...`}
                    style={{ flex: 1, padding: "13px 18px", borderRadius: "var(--radius-sm)", fontSize: 14 }} />
                  <button onClick={() => sendMessage()} style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #78b450, #4a8a2a)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 16px rgba(120,180,80,0.35)", transition: "transform 0.15s" }} onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {!["chat", "more", "map", "community"].includes(tab) && !(tab === "gear" && selectedChecklist) && (
          <button onClick={() => setTab("more")} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "var(--text3)", fontSize: 13, cursor: "pointer", padding: "0 0 8px 0", fontFamily: "var(--font-body)", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "var(--text)"} onMouseLeave={e => e.currentTarget.style.color = "var(--text3)"}>
            ← Back
          </button>
        )}

        {tab === "weather" && (
          <div className="fade-in">
            <WeatherWidget selectedState={selectedState} weather={weather} setWeather={setWeather} locationName={locationName} setLocationName={setLocationName} />

          </div>
        )}

        <div style={{ display: tab === "map" ? "block" : "none" }} ref={el => { if (el && tab === "map") setTimeout(() => window.dispatchEvent(new Event('resize')), 100); }}>
          <MapTab selectedState={selectedState} user={user} isPro={isPro} onSharePin={(pin) => { window._sharePinToComm = pin; setTab("community"); }} />
        </div>

        {tab === "regs" && <RegulationsTab selectedState={selectedState} currentUser={user} />}
        {tab === "licenses" && <LicensesTab selectedState={selectedState} />}
        {tab === "trip" && <TripPlannerTab selectedState={selectedState} user={user} isPro={isPro} hitLimit={hitLimit} messageCount={messageCount} setMessageCount={setMessageCount} onUpgrade={async () => { if (!user) { openSignIn(); return; } setCheckoutLoading(true); const res = await fetch("https://wildai-server.onrender.com/create-checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user?.id, plan: billingPlan }) }); const data = await res.json(); if (data.url) window.location.href = data.url; setCheckoutLoading(false); }} />}
        {tab === "species" && (
          <div className="fade-in">
            {!selectedState ? (
              <div className="card" style={{ padding: 40, textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
                <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Select Your State</div>
                <div style={{ color: "var(--text2)", fontSize: 14 }}>Go back home and choose your state to see available species.</div>
              </div>
            ) : (
              <>
                <div style={{ color: "var(--text3)", fontSize: 12, marginBottom: 12 }}>Don't see your species? Ask the AI in the Chat tab →</div>
                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                  {["all", "hunting", "fishing"].map(f => (
                    <button key={f} onClick={() => setSpeciesFilter(f)} className={`nav-tab ${speciesFilter === f ? "active" : "inactive"}`} style={{ padding: "7px 18px", fontSize: 12 }}>
                      {f === "all" ? "All" : f === "hunting" ? "🎯 Hunting" : "🎣 Fishing"}
                    </button>
                  ))}
                </div>
                {loadingStateSpecies && (
                  <div style={{ textAlign: "center", padding: 40, color: "var(--text3)", fontSize: 14 }} className="pulse">Loading {selectedState} species...</div>
                )}
                {!loadingStateSpecies && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 12 }}>
                    {(stateSpecies.length > 0 ? stateSpecies : SPECIES)
                      .filter(s => speciesFilter === "all" || s.type === speciesFilter)
                      .map(s => (
                        <button key={s.name} onClick={() => { sendMessage(`Give me a complete guide for ${s.name} — best tactics, gear, timing, and ${selectedState ? selectedState + " specific " : ""}tips.`); setTab("chat"); }} className="card" style={{ padding: "20px 16px", textAlign: "center", cursor: "pointer", border: "1px solid var(--border)" }}>
                          <div style={{ fontSize: 32, marginBottom: 10 }}>{SPECIES_ICONS[s.name] || (s.type === "hunting" ? "🦌" : "🐟")}</div>
                          <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{s.name}</div>
                          <div style={{ color: "var(--text3)", fontSize: 11, marginBottom: 10 }}>{s.desc}</div>
                          <span className={`tag tag-${s.type === "hunting" ? "hunt" : "fish"}`}>{s.type}</span>
                        </button>
                      ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {tab === "gear" && (
          <div className="fade-in">
            {!selectedChecklist ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12 }}>
                {Object.entries(GEAR_CHECKLISTS).map(([k, v]) => (
                  <button key={k} onClick={() => setSelectedChecklist(k)} className="card" style={{ padding: "22px 16px", textAlign: "center", cursor: "pointer", border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 32, marginBottom: 10 }}>{v.icon}</div>
                    <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{k}</div>
                    <div style={{ color: "var(--text3)", fontSize: 12 }}>{v.items.length} items</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="fade-in">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 24 }}>{GEAR_CHECKLISTS[selectedChecklist].icon}</span>
                    <h3 style={{ color: "var(--text)", fontSize: 18, fontFamily: "var(--font-display)" }}>{selectedChecklist}</h3>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setCheckedItems({})} className="btn-ghost" style={{ padding: "7px 14px", fontSize: 12 }}>Reset</button>
                    <button onClick={() => setSelectedChecklist(null)} className="btn-ghost" style={{ padding: "7px 14px", fontSize: 12, transition: "transform 0.15s" }} onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"} onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>← Back</button>
                  </div>
                </div>
                <div style={{ color: "var(--text3)", fontSize: 12, marginBottom: 14 }}>{Object.values(checkedItems).filter(Boolean).length} / {GEAR_CHECKLISTS[selectedChecklist].items.length} packed</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {GEAR_CHECKLISTS[selectedChecklist].items.map((item, i) => {
                    const k = `${selectedChecklist}::${item}`; const checked = checkedItems[k];
                    return (
                      <div key={i} onClick={() => toggleCheck(selectedChecklist, item)} className={`checklist-item ${checked ? "checked" : ""}`}>
                        <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${checked ? "var(--green)" : "rgba(255,255,255,0.15)"}`, background: checked ? "var(--green)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
                          {checked && <span style={{ color: "white", fontSize: 12, fontWeight: 700 }}>✓</span>}
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
        {tab === "more" && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ padding: "14px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ color: "var(--text2)", fontSize: 13, fontWeight: 600, flexShrink: 0 }}>Your State</div>
              <select value={selectedState} onChange={e => setSelectedState(e.target.value)} style={{ flex: 1, padding: "8px 12px", borderRadius: "var(--radius-sm)", fontSize: 14 }}>
                <option value="">Select state...</option>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ color: "var(--text3)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 4 }}>TOOLS & FEATURES</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { id: "species", label: "Species", desc: "Hunting & fishing guides", accent: "#2d5a1b", color: "#6dba4a", svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="22" y1="12" x2="18" y2="12" /><line x1="6" y1="12" x2="2" y2="12" /><line x1="12" y1="6" x2="12" y2="2" /><line x1="12" y1="22" x2="12" y2="18" /></svg> },
                { id: "regs", label: "Regulations", desc: "State-specific rules", accent: "#1a3a5c", color: "#4a8fd4", svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg> },
                { id: "trip", label: "Trip Planner", desc: "AI-generated plans", accent: "#2a1a5c", color: "#a78bfa", svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg> },
                { id: "gear", label: "Gear", desc: "Pack checklists", accent: "#5c2a0a", color: "#fb923c", svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg> },
                { id: "licenses", label: "Licenses", desc: "Buy state licenses", accent: "#0a4a3a", color: "#34d399", svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg> },
                { id: "harvest", label: "Harvest Log", desc: "Track your catches", accent: "#1a3a10", color: "#a3e635", svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg> },
                { id: "trophy", label: "Trophy Board", desc: "Community verified harvests", accent: "#4a2a00", color: "#fbbf24", svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2z" /></svg> },
                { id: "ballistics", label: "Ballistics", desc: "Bullet drop calculator", accent: "#3a0a2a", color: "#f472b6", svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2c-2 0-4 1.5-4 4v8h8V6c0-2.5-2-4-4-4z" /><rect x="8" y="14" width="8" height="4" rx="1" /><line x1="10" y1="18" x2="10" y2="21" /><line x1="14" y1="18" x2="14" y2="21" /></svg> },
                { id: "weather", label: "Weather", desc: "Live conditions", accent: "#0a2a5c", color: "#38bdf8", svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="M20 12h2" /><path d="m19.07 4.93-1.41 1.41" /><path d="M15.947 12.650a4 4 0 0 0-5.925-4.128" /><path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6z" /></svg> },
                { id: "about", label: "About", desc: "App info & account", accent: "#2a2a3a", color: "#94a3b8", svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg> },
                ...(user?.id === "user_3CKoCuA9KUvrtfrJ3ia3Bm2BH1a" ? [{ id: "admin", label: "Admin", desc: "Manage reports", accent: "#3a1a1a", color: "#d44a4a", svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg> }] : []),
              ].map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} className="more-btn" style={{ padding: "16px", textAlign: "left", cursor: "pointer", border: "1px solid #1a2a1a", borderRadius: 16, background: "linear-gradient(135deg, #0d140d, #101810)", display: "flex", alignItems: "center", gap: 14, minHeight: 80 }}>
                  <div className="more-icon" style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg, ${t.accent}cc, ${t.accent}66)`, border: `1px solid ${t.accent}44`, display: "flex", alignItems: "center", justifyContent: "center", color: t.color, flexShrink: 0, transition: "transform 0.15s, box-shadow 0.15s" }}>
                    {t.svg}
                  </div>
                  <div>
                    <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 13 }}>{t.label}</div>
                    <div style={{ color: "#4a6a4a", fontSize: 10, marginTop: 2 }}>{t.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        {tab === "admin" && user?.id === "user_3CKoCuA9KUvrtfrJ3ia3Bm2BH1a" && <AdminTab user={user} />}
        {tab === "harvest" && <HarvestLogTab user={user} openSignIn={openSignIn} isPro={isPro} />}
        {tab === "ballistics" && <BallisticsTab />}
        {tab === "trophy" && <TrophyBoardTab user={user} openSignIn={openSignIn} selectedState={selectedState} />}
        {tab === "community" && <CommunityTab selectedState={selectedState} user={user} openSignIn={openSignIn} externalSetUnread={setMessagesUnread} externalSetNotifUnread={setNotifUnread} />}
        {tab === "about" && (
          <div className="fade-in card" style={{ padding: 32 }}>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <img src="/logo.png" style={{ width: 160, height: 160, objectFit: "contain", marginBottom: 16 }} className="float" />
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--text)", marginBottom: 8 }}>Ravlin</h2>
              <p style={{ color: "var(--green)", fontSize: 14, fontWeight: 500 }}>Built for hunters & anglers, by outdoorsmen</p>
            </div>
            <div style={{ color: "var(--text2)", fontSize: 15, lineHeight: 1.85, display: "flex", flexDirection: "column", gap: 16 }}>
              <p>Ravlin is an AI-powered hunting and fishing assistant designed to give you the kind of advice you'd get from a seasoned outdoorsman — specific, practical, and straight to the point.</p>
              <p>Whether you're planning your first elk hunt, figuring out what flies are working on your local river, or need to know the regulations for a new state, Ravlin has you covered.</p>
              <div style={{ padding: "16px 20px", background: "var(--amber-dim)", border: "1px solid rgba(212,147,10,0.2)", borderRadius: "var(--radius-sm)" }}>
                <p style={{ color: "rgba(212,147,10,0.9)", fontSize: 13, margin: 0 }}>⚠️ Always verify current regulations with your state wildlife agency. Regulations change and Ravlin's information may not always be current.</p>
              </div>
            </div>
            <div style={{ marginTop: 28, paddingTop: 28, borderTop: "1px solid var(--border)" }}>
              {isPro && (
                <div style={{ marginTop: 16 }}>
                  <button className="btn-ghost" style={{ padding: "10px 20px", fontSize: 13 }} onClick={async () => {
                    const customerId = user?.publicMetadata?.stripeCustomerId;
                    const res = await fetch("https://wildai-server.onrender.com/customer-portal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customerId }) });
                    const data = await res.json();
                    if (data.url) window.location.href = data.url;
                  }}>Manage Subscription →</button>
                </div>
              )}
              <button onClick={onTerms} className="btn-ghost" style={{ padding: "10px 20px", fontSize: 13 }}>View Terms & Conditions →</button>
            </div>
          </div>
        )}
      </div>

      <footer style={{ borderTop: "1px solid var(--border)", padding: "14px 20px", textAlign: "center", position: "relative", zIndex: 1, display: "none" }}>
        <span style={{ color: "var(--text3)", fontSize: 11 }}>Ravlin · Powered by AI · Always verify regulations with your state agency</span>
      </footer>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const { user, isLoaded } = useUser();
  const { openUserProfile } = useClerk();
  useEffect(() => { window._clerkOpenProfile = openUserProfile; }, [openUserProfile]);
  const { toasts } = useToast();
  const [page, setPage] = useState("landing");

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { setPage("landing"); return; }
    supabase.from("profiles").select("selected_state, onboarding_complete").eq("user_id", user.id).single().then(({ data }) => {
      if (data?.selected_state && !localStorage.getItem("wildai_selected_state")) {
        handleSetSelectedState(data.selected_state);
      }
      if (page === "landing") {
        if (!data?.onboarding_complete) { setPage("onboarding"); }
        else { setPage("chat"); }
      }
    });
    supabase.rpc("update_last_seen", { uid: user.id }).then(() => { });
    const interval = setInterval(() => {
      supabase.rpc("update_last_seen", { uid: user.id }).then(() => { });
    }, 60000);
    return () => clearInterval(interval);
  }, [isLoaded, user?.id]);

  // ─── PUSH NOTIFICATIONS ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

    const registerPush = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;
        let sub = await reg.pushManager.getSubscription();
        if (!sub) return; // don't auto-request, wait for user tap
        await fetch(`https://jlzbzkdhjufyjwjmdvmp.supabase.co/rest/v1/push_subscriptions?on_conflict=user_id`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsemJ6a2RoanVmeWp3am1kdm1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMDAzOTYsImV4cCI6MjA5MTY3NjM5Nn0.iGLUa4y5GqmisT3O3FIE4lc9Mr9VpsNXDYKsOeyquKE',
            'Prefer': 'resolution=merge-duplicates',
          },
          body: JSON.stringify({ user_id: user.id, subscription: sub.toJSON() }),
        });
      } catch (e) {
        console.error('Push registration failed:', e);
      }
    };

    registerPush();
  }, [user?.id]);

  const [prevPage, setPrevPage] = useState("landing");
  const [notifs, setNotifs] = useState([]);
  const [notifUnread, setNotifUnread] = useState(0);
  const [messagesUnread, setMessagesUnread] = useState(0);
  const [messageCount, setMessageCount] = useState(() => {
    const saved = localStorage.getItem("wildai_message_count");
    return saved ? parseInt(saved) : 0;
  });
  const [selectedState, setSelectedState] = useState(() => {
    return localStorage.getItem("wildai_selected_state") || "";
  });

  const handleSetSelectedState = (state) => {
    setSelectedState(state);
    if (state) {
      localStorage.setItem("wildai_selected_state", state);
      if (user) supabase.from("profiles").update({ selected_state: state }).eq("user_id", user.id);
    } else {
      localStorage.removeItem("wildai_selected_state");
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgraded") === "true") {
      window.history.replaceState({}, "", "/");
      setPage("chat");
    }
  }, []);

  const goTo = (p) => { setPrevPage(page); setPage(p); };

  const [showSplash, setShowSplash] = useState(true);
  const [showPushBanner, setShowPushBanner] = useState(false);
  useEffect(() => { setTimeout(() => setShowSplash(false), 2000); }, []);

  useEffect(() => {
    if (isLoaded && !showSplash) {
      const splashEl = document.getElementById('splash');
      if (splashEl) {
        splashEl.style.transition = 'opacity 0.3s ease';
        splashEl.style.opacity = '0';
        setTimeout(() => { splashEl.style.display = 'none'; }, 300);
      }
    }
  }, [isLoaded, showSplash]);

  useEffect(() => {
    if (!user) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (localStorage.getItem('wildai_push_dismissed')) return;
    if (Notification.permission === 'granted') return;
    const t = setTimeout(() => setShowPushBanner(true), 3000);
    return () => clearTimeout(t);
  }, [user?.id]);

  if (!isLoaded && !showSplash) return null;

  const enablePush = async () => {
    setShowPushBanner(false);
    try {
      const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: VAPID_PUBLIC_KEY });
      await fetch(`https://jlzbzkdhjufyjwjmdvmp.supabase.co/rest/v1/push_subscriptions?on_conflict=user_id`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsemJ6a2RoanVmeWp3am1kdm1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMDAzOTYsImV4cCI6MjA5MTY3NjM5Nn0.iGLUa4y5GqmisT3O3FIE4lc9Mr9VpsNXDYKsOeyquKE', 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify({ user_id: user.id, subscription: sub.toJSON() }),
      });
    } catch (e) { console.error('Push enable failed:', e); }
  };

  return (
    <>
      <style>{css}</style>
      <ToastContainer toasts={toasts} />

      {showPushBanner && (
        <div style={{ position: 'fixed', bottom: 80, left: 16, right: 16, zIndex: 9000, background: '#1a2a1a', border: '1px solid var(--border-accent)', borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
          <span style={{ fontSize: 24 }}>🔔</span>
          <div style={{ flex: 1 }}>
            <div style={{ color: 'var(--text)', fontWeight: 700, fontSize: 14 }}>Enable Notifications</div>
            <div style={{ color: 'var(--text2)', fontSize: 12, marginTop: 2 }}>Get notified for messages, likes & follows</div>
          </div>
          <button onClick={enablePush} className="btn-primary" style={{ padding: '8px 14px', fontSize: 13, flexShrink: 0 }}>Enable</button>
          <button onClick={() => { setShowPushBanner(false); localStorage.setItem('wildai_push_dismissed', '1'); }} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 18, cursor: 'pointer', padding: 0, flexShrink: 0 }}>✕</button>
        </div>
      )}

      <ErrorBoundary>
        {page === "terms" && <TermsPage onBack={() => setPage(prevPage === "chat" ? "chat" : "landing")} />}
        {page === "landing" && <LandingPage onStart={() => goTo("chat")} onSignIn={() => { window._triggerSignIn?.(); }} selectedState={selectedState} setSelectedState={handleSetSelectedState} onTerms={() => goTo("terms")} />}
        {page === "onboarding" && <OnboardingPage user={user} onComplete={() => goTo("chat")} setSelectedState={handleSetSelectedState} />}
        {page === "chat" && <ChatPage onBack={() => { localStorage.removeItem("wildai_selected_state"); setSelectedState(""); goTo("landing"); }} messageCount={messageCount} setMessageCount={setMessageCount} selectedState={selectedState} setSelectedState={handleSetSelectedState} onTerms={() => goTo("terms")} messagesUnread={messagesUnread} setMessagesUnread={setMessagesUnread} notifUnread={notifUnread} setNotifUnread={setNotifUnread} />}
      </ErrorBoundary>
    </>
  );
}
